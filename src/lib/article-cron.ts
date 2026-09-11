import { and, eq, isNotNull } from "drizzle-orm";
import { BEAT_VALUES, CYCLE_HOURS, type Beat } from "./beats";
import { publishArticleFromCron, simulateArticleFromCron } from "./articles-server";
import { getDb } from "./db";
import { articles, mediaImages, users } from "./schema";

const MAX_LIBRARY_IMAGE_BYTES = 5 * 1024 * 1024;

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 32_768;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

function resolveLibraryImageUrl(coverImageUrl: string): string {
  try {
    const url = new URL(coverImageUrl);
    if (
      (url.hostname === "veronicahub.com" || url.hostname === "www.veronicahub.com") &&
      url.pathname.startsWith("/images/blog-covers/")
    ) {
      return `https://raw.githubusercontent.com/Veronica-01Git/veronicahub-app/main/public${url.pathname}`;
    }
  } catch {
    // A validação do fetch abaixo devolve o erro apropriado para URLs inválidas.
  }
  return coverImageUrl;
}

async function saveCoverToMediaLibrary(input: {
  slug: string;
  headline: string;
  coverImageUrl: string;
}): Promise<boolean> {
  const db = getDb();
  const filename = `wire-${input.slug}.jpg`;
  const [existing] = await db
    .select({ id: mediaImages.id })
    .from(mediaImages)
    .where(eq(mediaImages.filename, filename))
    .limit(1);
  if (existing) return false;

  // Evita o Worker buscar o próprio domínio durante o backfill. Esse loop
  // interno recebia 403/522 no Cloudflare; o arquivo versionado no GitHub é
  // exatamente a mesma capa publicada no site.
  const response = await fetch(resolveLibraryImageUrl(input.coverImageUrl), {
    headers: { Accept: "image/*", "User-Agent": "Veronica-Wire-Library/1.0" },
  });
  if (!response.ok)
    throw new Error(`Falha ao baixar a capa para a biblioteca (${response.status}).`);

  const mimeType = (response.headers.get("content-type") || "image/jpeg").split(";")[0].trim();
  if (!new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]).has(mimeType)) {
    throw new Error(`MIME de capa não suportado na biblioteca: ${mimeType}`);
  }

  const buffer = await response.arrayBuffer();
  if (buffer.byteLength === 0 || buffer.byteLength > MAX_LIBRARY_IMAGE_BYTES) {
    throw new Error(`Capa fora do limite da biblioteca: ${buffer.byteLength} bytes.`);
  }

  const [admin] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.role, "admin"))
    .limit(1);
  if (!admin) throw new Error("Nenhum administrador disponível para registrar a capa.");

  await db.insert(mediaImages).values({
    filename,
    mimeType,
    sizeBytes: buffer.byteLength,
    width: null,
    height: null,
    altText: `Capa Veronica Wire — ${input.headline}`.slice(0, 300),
    data: arrayBufferToBase64(buffer),
    uploadedBy: admin.id,
  });
  return true;
}

// Escolhe a editoria pela hora UTC atual — sem precisar guardar estado em
// lugar nenhum (qual foi a última editoria gerada). A editoria gira por hora,
// então ao longo do dia todas passam e a janela impede duplicação.
function currentBeat(): Beat {
  const hour = new Date().getUTCHours();
  const index = Math.floor(hour / CYCLE_HOURS) % BEAT_VALUES.length;
  return BEAT_VALUES[index];
}

function isEditorialSkip(error: string): boolean {
  return [
    "Radar externo sem pauta recente verificável",
    "A matéria não ficou ancorada a uma pauta detectada",
    "Já existe matéria publicada nessa janela",
    "Manchete parecida demais com uma publicação recente",
    "Só ",
    "Corpo com ",
    "As fontes precisam vir de pelo menos",
  ].some((prefix) => error.startsWith(prefix));
}

// Chamado direto do src/server.ts (interceptado antes do handler do
// TanStack), mesmo padrão do webhook do Mercado Pago — precisa de URL fixa
// pro GitHub Actions chamar num cron, o que a URL de RPC do createServerFn
// não permite. Autenticado por CRON_SECRET (header Authorization) porque
// quem chama não é um admin logado.
export async function handleGenerateArticleCron(request: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return new Response("CRON_SECRET não configurada", { status: 500 });
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("unauthorized", { status: 401 });
  }

  const beat = currentBeat();

  // ?dryRun=1: roda o rascunho + as mesmas checagens de publicação (piso de
  // qualidade, similaridade de manchete, dedup de janela) mas NUNCA grava —
  // pra inspecionar o que o pipeline geraria antes de aumentar a frequência
  // (brief "evolução"). Gasta uma chamada de IA de verdade.
  const url = new URL(request.url);
  if (url.searchParams.get("dryRun") === "1") {
    const simulated = await simulateArticleFromCron(beat);
    return new Response(JSON.stringify({ dryRun: true, beat, ...simulated }), {
      status: simulated.ok ? 200 : 502,
      headers: { "content-type": "application/json" },
    });
  }

  const result = await publishArticleFromCron(beat);
  if (!result.ok) {
    const skipped = isEditorialSkip(result.error);
    return new Response(JSON.stringify({ ok: skipped, skipped, beat, error: result.error }), {
      status: skipped ? 200 : 502,
      headers: { "content-type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({
      ok: true,
      beat,
      slug: result.article.slug,
      headline: result.article.headline,
      desk: result.article.desk,
      fotoTermos: result.fotoTermos,
      recentPhotoIds: result.recentPhotoIds,
    }),
    { headers: { "content-type": "application/json" } },
  );
}

// Segundo passo do mesmo pipeline: o workflow do cron (generate-article.yml)
// chama handleGenerateArticleCron acima, depois renderiza a capa (HTML/CSS
// via Playwright, scripts/render-cover.mjs) e commita o .jpg estático no
// repo — só então dá pra saber a URL final e setar coverImageUrl aqui. Mesma
// autenticação por CRON_SECRET; sem isso o artigo fica publicado sem capa
// (degradação aceitável, não bloqueia a publicação).
export async function handleSetCoverImageCron(request: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return new Response("CRON_SECRET não configurada", { status: 500 });
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("unauthorized", { status: 401 });
  }

  let body: {
    slug?: unknown;
    coverImageUrl?: unknown;
    photoId?: unknown;
    photoCredit?: unknown;
    photoUrl?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return new Response("corpo inválido", { status: 400 });
  }

  if (typeof body.slug !== "string" || !body.slug.trim()) {
    return new Response("slug obrigatório", { status: 400 });
  }
  if (typeof body.coverImageUrl !== "string" || !body.coverImageUrl.trim()) {
    return new Response("coverImageUrl obrigatório", { status: 400 });
  }

  const db = getDb();
  // Nunca sobrescreve uma capa que um admin escolheu à mão em
  // /admin/artigos (coverManual=true) — protege mesmo que esse endpoint
  // seja chamado de novo pra uma matéria antiga (ex: scripts/reprocess-covers.mjs).
  const [row] = await db
    .update(articles)
    .set({
      coverImageUrl: body.coverImageUrl.trim(),
      coverPhotoId: typeof body.photoId === "string" && body.photoId ? body.photoId : null,
      coverPhotoCredit:
        typeof body.photoCredit === "string" && body.photoCredit ? body.photoCredit : null,
      coverPhotoUrl: typeof body.photoUrl === "string" && body.photoUrl ? body.photoUrl : null,
      updatedAt: new Date(),
    })
    .where(and(eq(articles.slug, body.slug.trim()), eq(articles.coverManual, false)))
    .returning({ id: articles.id, headline: articles.headline });

  if (!row) {
    return new Response(
      JSON.stringify({ ok: false, error: "matéria não encontrada ou capa é manual" }),
      { status: 404, headers: { "content-type": "application/json" } },
    );
  }

  let librarySaved = false;
  try {
    librarySaved = await saveCoverToMediaLibrary({
      slug: body.slug.trim(),
      headline: row.headline,
      coverImageUrl: body.coverImageUrl.trim(),
    });
  } catch (error) {
    console.error("Falha ao registrar capa do Wire na biblioteca:", error);
    return new Response(
      JSON.stringify({
        ok: false,
        coverSaved: true,
        error: error instanceof Error ? error.message : "Falha ao salvar capa na biblioteca.",
      }),
      { status: 502, headers: { "content-type": "application/json" } },
    );
  }

  return new Response(JSON.stringify({ ok: true, librarySaved }), {
    headers: { "content-type": "application/json" },
  });
}

// Mantém o acervo do Admin completo e autocorretivo. O endpoint é idempotente:
// capas já arquivadas são ignoradas e somente itens ausentes são baixados.
export async function handleBackfillWireCoversCron(request: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return new Response("CRON_SECRET não configurada", { status: 500 });
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("unauthorized", { status: 401 });
  }

  const db = getDb();
  const rows = await db
    .select({
      slug: articles.slug,
      headline: articles.headline,
      coverImageUrl: articles.coverImageUrl,
    })
    .from(articles)
    .where(and(eq(articles.status, "published"), isNotNull(articles.coverImageUrl)))
    .limit(100);

  let saved = 0;
  let alreadyPresent = 0;
  const failures: Array<{ slug: string; error: string }> = [];

  for (const row of rows) {
    if (!row.coverImageUrl) continue;
    try {
      const inserted = await saveCoverToMediaLibrary({
        slug: row.slug,
        headline: row.headline,
        coverImageUrl: row.coverImageUrl,
      });
      if (inserted) saved += 1;
      else alreadyPresent += 1;
    } catch (error) {
      failures.push({
        slug: row.slug,
        error: error instanceof Error ? error.message : "Falha desconhecida.",
      });
    }
  }

  return new Response(
    JSON.stringify({ ok: failures.length === 0, saved, alreadyPresent, failures }),
    {
      status: failures.length === 0 ? 200 : 502,
      headers: { "content-type": "application/json" },
    },
  );
}
