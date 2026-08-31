import { eq } from "drizzle-orm";
import { BEAT_VALUES, type Beat } from "./beats";
import { publishArticleFromCron } from "./articles-server";
import { getDb } from "./db";
import { articles } from "./schema";

const CYCLE_HOURS = 5;

// Escolhe a editoria pela hora UTC atual — sem precisar guardar estado em
// lugar nenhum (qual foi a última editoria gerada). Mesmo bucket de 5h
// sempre cai na mesma editoria, então ao longo do dia todas passam.
function currentBeat(): Beat {
  const hour = new Date().getUTCHours();
  const index = Math.floor(hour / CYCLE_HOURS) % BEAT_VALUES.length;
  return BEAT_VALUES[index];
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
  const result = await publishArticleFromCron(beat);
  if (!result.ok) {
    return new Response(JSON.stringify({ ok: false, beat, error: result.error }), {
      status: 502,
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

  let body: { slug?: unknown; coverImageUrl?: unknown };
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
  const [row] = await db
    .update(articles)
    .set({ coverImageUrl: body.coverImageUrl.trim(), updatedAt: new Date() })
    .where(eq(articles.slug, body.slug.trim()))
    .returning({ id: articles.id });

  if (!row) {
    return new Response(JSON.stringify({ ok: false, error: "matéria não encontrada" }), {
      status: 404,
      headers: { "content-type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "content-type": "application/json" },
  });
}
