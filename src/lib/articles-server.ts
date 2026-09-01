import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq, gte } from "drizzle-orm";
import Anthropic from "@anthropic-ai/sdk";
import { getDb } from "./db";
import { articles } from "./schema";
import { requireAdmin } from "./admin-server";
import { BEAT_LABELS, CYCLE_HOURS, isBeat, type Beat } from "./beats";

// Rascunhos gerados por IA usam um modelo mais forte que o chat da Veronica
// (veronica-server.ts usa Haiku pro drawer, custo baixo) porque aqui o
// texto vai ao ar como matéria publicada — vale o custo extra de raciocínio
// e de busca na web pra reduzir alucinação.
const DRAFT_MODEL = "claude-sonnet-5";
// Com web_search ligado (até 4 buscas), o texto das buscas + raciocínio do
// modelo já consome uma fatia boa do budget antes de chegar no JSON final —
// 2200 tokens vinha cortando a resposta no meio (stop_reason "max_tokens"),
// o que sobra como "IA não retornou um rascunho válido" (sem chave de
// fechamento pro JSON.parse).
const DRAFT_MAX_TOKENS = 4096;

const BEAT_BRIEF: Record<Beat, string> = {
  ia: "modelos de IA, infraestrutura de inferência, produtos de IA generativa e regulação de IA",
  clima:
    "energia limpa (solar, eólica, baterias), políticas climáticas e uso de IA em modelagem climática",
  economia:
    "yuan digital, moedas digitais de bancos centrais (CBDCs) e política monetária ligada a tecnologia",
  geopolitica:
    "geopolítica entre China, EUA e Brasil — comércio, chips, cadeias produtivas e tecnologia",
  mercado: "mercado de tecnologia global — investimentos, big techs e infraestrutura de IA",
};

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function uniqueSlug(db: ReturnType<typeof getDb>, base: string): Promise<string> {
  const root = slugify(base) || "materia";
  let candidate = root;
  let attempt = 1;
  // Coleção pequena (matérias de um blog editorial, não user-generated em
  // massa) — um loop sequencial de existência é suficiente, sem precisar
  // de índice/constraint especulativa.
  for (;;) {
    const [existing] = await db
      .select({ id: articles.id })
      .from(articles)
      .where(eq(articles.slug, candidate))
      .limit(1);
    if (!existing) return candidate;
    attempt += 1;
    candidate = `${root}-${attempt}`;
  }
}

function mapArticle(row: typeof articles.$inferSelect) {
  return {
    id: row.id,
    slug: row.slug,
    beat: row.beat,
    headline: row.headline,
    excerpt: row.excerpt,
    body: row.body,
    desk: row.desk,
    coverImageUrl: row.coverImageUrl,
    sourceUrls: row.sourceUrls,
    status: row.status,
    aiGenerated: row.aiGenerated,
    autoPublished: row.autoPublished,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
  };
}

export const getPublishedArticles = createServerFn({ method: "GET" }).handler(async () => {
  const db = getDb();
  const rows = await db
    .select()
    .from(articles)
    .where(eq(articles.status, "published"))
    .orderBy(desc(articles.publishedAt))
    .limit(60);
  return { ok: true as const, articles: rows.map(mapArticle) };
});

const slugValidator = (input: unknown) => {
  const data = input as { slug?: unknown };
  if (typeof data?.slug !== "string" || !data.slug.trim()) {
    throw new Error("Slug inválido.");
  }
  return { slug: data.slug.trim() };
};

export const getArticleBySlug = createServerFn({ method: "GET" })
  .validator(slugValidator)
  .handler(async ({ data }) => {
    const db = getDb();
    const [row] = await db
      .select()
      .from(articles)
      .where(and(eq(articles.slug, data.slug), eq(articles.status, "published")))
      .limit(1);
    if (!row) {
      return { ok: false as const, error: "Matéria não encontrada." };
    }
    return { ok: true as const, article: mapArticle(row) };
  });

export const listArticlesAdmin = createServerFn({ method: "GET" }).handler(async () => {
  const admin = await requireAdmin();
  if (!admin) {
    return { ok: false as const, error: "Acesso restrito." };
  }
  const db = getDb();
  const rows = await db.select().from(articles).orderBy(desc(articles.createdAt)).limit(300);
  return { ok: true as const, articles: rows.map(mapArticle) };
});

const beatValidator = (input: unknown) => {
  const data = input as { beat?: unknown };
  if (!isBeat(data?.beat)) {
    throw new Error("Editoria inválida.");
  }
  return { beat: data.beat };
};

type DraftContent = {
  headline: string;
  excerpt: string;
  body: string;
  desk: string;
  sourceUrls: string[];
};

type DraftAttemptResult =
  | { ok: true; content: DraftContent }
  // retry=true: formato veio quebrado (provável corte por max_tokens ou
  // ruído do modelo) — vale tentar de novo. retry=false: o modelo respondeu
  // corretamente que não achou fato verificável, ou a chamada à API falhou
  // (rede/API key/etc) — tentar de novo não muda o resultado.
  | { ok: false; error: string; retry: boolean };

// Uma chamada à Anthropic + parse da resposta. Separado de
// draftArticleContent só pra permitir uma retentativa (ver lá embaixo) sem
// duplicar a lógica de request/parse.
async function attemptDraft(apiKey: string, beat: Beat): Promise<DraftAttemptResult> {
  const systemPrompt = `Você é repórter do Veronica Wire, editoria "${BEAT_LABELS[beat]}" (${BEAT_BRIEF[beat]}).
Use a ferramenta de busca na web para encontrar UM fato ou desenvolvimento real, recente e verificável nessa editoria — não invente nada.
Depois de pesquisar, responda SOMENTE com um objeto JSON válido (sem markdown, sem texto antes ou depois), exatamente neste formato:
{"headline": "manchete curta e direta em português, sem clickbait", "excerpt": "1-2 frases de resumo", "body": "matéria completa em português, 3-5 parágrafos, tom jornalístico factual, sem opinião", "desk": "Desk de <algo específico da matéria>", "sourceUrls": ["https://...", "https://..."]}
"sourceUrls" deve conter as URLs reais que você usou na pesquisa. Se não encontrar nada verificável e recente, responda {"error": "sem fato verificável no momento"} em vez do objeto acima.`;

  // web_search_20250305 é uma tool server-side (a Anthropic executa a
  // busca e injeta o resultado na mesma resposta) — pode não estar no
  // union type de `tools`/overloads desta versão do SDK. Em vez de tentar
  // casar com o tipo exato de `messages.create` (arriscado sem compilador
  // à mão pra conferir), chamamos por uma assinatura mínima com só o que
  // de fato usamos da resposta.
  type CreateMessage = (params: Record<string, unknown>) => Promise<{
    content: Array<{ type: string; text?: string }>;
    stop_reason?: string | null;
  }>;

  let response: {
    content: Array<{ type: string; text?: string }>;
    stop_reason?: string | null;
  };
  try {
    const anthropic = new Anthropic({ apiKey });
    response = await (anthropic.messages.create as unknown as CreateMessage).call(
      anthropic.messages,
      {
        model: DRAFT_MODEL,
        max_tokens: DRAFT_MAX_TOKENS,
        system: systemPrompt,
        messages: [
          { role: "user", content: "Pesquise e escreva a matéria conforme as instruções." },
        ],
        tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 4 }],
      },
    );
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Falha ao gerar rascunho com IA.",
      retry: false,
    };
  }

  const text = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();

  const jsonStart = text.indexOf("{");
  const jsonEnd = text.lastIndexOf("}");
  if (jsonStart === -1 || jsonEnd === -1) {
    console.error(
      `draftArticleContent(${beat}): sem JSON na resposta (stop_reason=${response.stop_reason ?? "?"}). Trecho: ${text.slice(0, 300)}`,
    );
    return { ok: false, error: "IA não retornou um rascunho válido. Tente de novo.", retry: true };
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
  } catch (error) {
    console.error(
      `draftArticleContent(${beat}): JSON inválido (stop_reason=${response.stop_reason ?? "?"}, erro=${error instanceof Error ? error.message : error}). Trecho: ${text.slice(0, 300)}`,
    );
    return { ok: false, error: "IA não retornou um rascunho válido. Tente de novo.", retry: true };
  }

  if (typeof parsed.error === "string") {
    return { ok: false, error: parsed.error, retry: false };
  }

  const { headline, excerpt, body, desk, sourceUrls } = parsed;
  if (
    typeof headline !== "string" ||
    typeof excerpt !== "string" ||
    typeof body !== "string" ||
    typeof desk !== "string" ||
    !Array.isArray(sourceUrls) ||
    !sourceUrls.every((u) => typeof u === "string")
  ) {
    console.error(
      `draftArticleContent(${beat}): formato inesperado. JSON: ${text.slice(jsonStart, jsonEnd + 1).slice(0, 300)}`,
    );
    return { ok: false, error: "IA retornou um formato inesperado. Tente de novo.", retry: true };
  }

  return {
    ok: true,
    content: { headline, excerpt, body, desk, sourceUrls: sourceUrls as string[] },
  };
}

// Núcleo de "pede pra IA pesquisar e escrever a matéria" — sem tocar no
// banco nem checar quem está chamando. Usado tanto pelo fluxo manual
// (generateArticleDraftAI, admin logado, sempre vira rascunho) quanto pelo
// cron automático (publishArticleFromCron, autenticado por CRON_SECRET,
// publica direto — ver comentário lá).
async function draftArticleContent(
  beat: Beat,
): Promise<{ ok: true; content: DraftContent } | { ok: false; error: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "ANTHROPIC_API_KEY não configurada." };
  }

  // Só uma retentativa, e só quando a resposta veio com formato quebrado
  // (retry=true) — não faz sentido retentar quando o próprio modelo disse
  // que não achou fato verificável, nem quando a chamada à API falhou.
  const first = await attemptDraft(apiKey, beat);
  if (first.ok || !first.retry) return first;

  const second = await attemptDraft(apiKey, beat);
  return second;
}

// Gera SEMPRE como rascunho (status "draft") — nunca publica sozinho. Um
// admin revisa em /admin/artigos e decide publicar ou descartar. Isso é
// deliberado: um LLM com busca na web ainda pode errar fato/data/citação, e
// esta página se apresenta como cobertura jornalística real.
export const generateArticleDraftAI = createServerFn({ method: "POST" })
  .validator(beatValidator)
  .handler(async ({ data }) => {
    const admin = await requireAdmin();
    if (!admin) {
      return { ok: false as const, error: "Acesso restrito." };
    }

    const draft = await draftArticleContent(data.beat);
    if (!draft.ok) {
      return { ok: false as const, error: draft.error };
    }

    const db = getDb();
    const slug = await uniqueSlug(db, draft.content.headline);
    const [row] = await db
      .insert(articles)
      .values({
        slug,
        beat: data.beat,
        headline: draft.content.headline,
        excerpt: draft.content.excerpt,
        body: draft.content.body,
        desk: draft.content.desk,
        sourceUrls: draft.content.sourceUrls,
        status: "draft",
        aiGenerated: true,
      })
      .returning();

    return { ok: true as const, article: mapArticle(row) };
  });

// Início (UTC) da janela de 5h que currentBeat() (article-cron.ts) está
// usando agora — mesmo cálculo, replicado aqui pra não criar import
// circular (article-cron.ts já importa publishArticleFromCron daqui).
function currentCycleWindowStart(): Date {
  const now = new Date();
  const start = new Date(now);
  start.setUTCMinutes(0, 0, 0);
  start.setUTCHours(Math.floor(now.getUTCHours() / CYCLE_HOURS) * CYCLE_HOURS);
  return start;
}

// Chamado direto do endpoint /api/cron/generate-article (src/server.ts),
// autenticado por CRON_SECRET em vez de sessão de admin — quem aciona é o
// GitHub Actions, não um humano logado. Por isso PUBLICA direto (sem passar
// por "draft"): decisão explícita do usuário, trocando a salvaguarda de
// revisão manual por atualização automática a cada 5h. Ver
// generateArticleDraftAI acima pro fluxo manual com revisão.
export async function publishArticleFromCron(
  beat: Beat,
): Promise<{ ok: true; article: ReturnType<typeof mapArticle> } | { ok: false; error: string }> {
  const db = getDb();

  // Dedup na origem: se essa editoria já publicou algo dentro da janela de
  // 5h atual, pula — não gera de novo. Isso é o que de fato causa
  // duplicata (dois disparos do cron pra mesma editoria na mesma janela,
  // seja um retry, um redisparo manual ou um hiccup do agendador do GitHub
  // Actions), não é sobre repetir o mesmo fato dias depois. Checar ANTES
  // de chamar a IA também evita gastar a chamada à toa.
  const [alreadyPublished] = await db
    .select({ id: articles.id, headline: articles.headline })
    .from(articles)
    .where(
      and(
        eq(articles.beat, beat),
        eq(articles.status, "published"),
        gte(articles.publishedAt, currentCycleWindowStart()),
      ),
    )
    .limit(1);
  if (alreadyPublished) {
    return {
      ok: false,
      error: `Já existe matéria publicada nessa janela pra "${beat}" ("${alreadyPublished.headline}") — pulando pra evitar duplicata.`,
    };
  }

  const draft = await draftArticleContent(beat);
  if (!draft.ok) {
    return { ok: false, error: draft.error };
  }

  const slug = await uniqueSlug(db, draft.content.headline);
  const [row] = await db
    .insert(articles)
    .values({
      slug,
      beat,
      headline: draft.content.headline,
      excerpt: draft.content.excerpt,
      body: draft.content.body,
      desk: draft.content.desk,
      sourceUrls: draft.content.sourceUrls,
      status: "published",
      aiGenerated: true,
      autoPublished: true,
      publishedAt: new Date(),
    })
    .returning();

  return { ok: true, article: mapArticle(row) };
}

const saveValidator = (input: unknown) => {
  const data = input as {
    id?: unknown;
    beat?: unknown;
    headline?: unknown;
    excerpt?: unknown;
    body?: unknown;
    desk?: unknown;
    coverImageUrl?: unknown;
    sourceUrls?: unknown;
  };
  if (!isBeat(data?.beat)) throw new Error("Editoria inválida.");
  if (typeof data?.headline !== "string" || !data.headline.trim())
    throw new Error("Manchete obrigatória.");
  if (typeof data?.excerpt !== "string" || !data.excerpt.trim())
    throw new Error("Resumo obrigatório.");
  if (typeof data?.body !== "string" || !data.body.trim())
    throw new Error("Texto da matéria obrigatório.");
  if (typeof data?.desk !== "string" || !data.desk.trim()) throw new Error("Desk obrigatório.");
  const sourceUrls = Array.isArray(data?.sourceUrls)
    ? data.sourceUrls.filter((u): u is string => typeof u === "string")
    : [];
  return {
    id: typeof data.id === "string" && data.id ? data.id : null,
    beat: data.beat,
    headline: data.headline.trim(),
    excerpt: data.excerpt.trim(),
    body: data.body.trim(),
    desk: data.desk.trim(),
    coverImageUrl:
      typeof data.coverImageUrl === "string" && data.coverImageUrl.trim()
        ? data.coverImageUrl.trim()
        : null,
    sourceUrls,
  };
};

export const saveArticleAdmin = createServerFn({ method: "POST" })
  .validator(saveValidator)
  .handler(async ({ data }) => {
    const admin = await requireAdmin();
    if (!admin) {
      return { ok: false as const, error: "Acesso restrito." };
    }

    const db = getDb();

    if (data.id) {
      const [row] = await db
        .update(articles)
        .set({
          beat: data.beat,
          headline: data.headline,
          excerpt: data.excerpt,
          body: data.body,
          desk: data.desk,
          coverImageUrl: data.coverImageUrl,
          sourceUrls: data.sourceUrls,
          updatedAt: new Date(),
        })
        .where(eq(articles.id, data.id))
        .returning();
      if (!row) return { ok: false as const, error: "Matéria não encontrada." };
      return { ok: true as const, article: mapArticle(row) };
    }

    const slug = await uniqueSlug(db, data.headline);
    const [row] = await db
      .insert(articles)
      .values({
        slug,
        beat: data.beat,
        headline: data.headline,
        excerpt: data.excerpt,
        body: data.body,
        desk: data.desk,
        coverImageUrl: data.coverImageUrl,
        sourceUrls: data.sourceUrls,
        status: "draft",
        aiGenerated: false,
      })
      .returning();
    return { ok: true as const, article: mapArticle(row) };
  });

const statusValidator = (input: unknown) => {
  const data = input as { id?: unknown; status?: unknown };
  if (typeof data?.id !== "string" || !data.id) throw new Error("id obrigatório.");
  if (data?.status !== "draft" && data?.status !== "published") throw new Error("Status inválido.");
  return { id: data.id, status: data.status };
};

export const setArticleStatusAdmin = createServerFn({ method: "POST" })
  .validator(statusValidator)
  .handler(async ({ data }) => {
    const admin = await requireAdmin();
    if (!admin) {
      return { ok: false as const, error: "Acesso restrito." };
    }

    const db = getDb();
    const [row] = await db
      .update(articles)
      .set(
        data.status === "published"
          ? { status: "published" as const, publishedAt: new Date(), updatedAt: new Date() }
          : { status: "draft" as const, updatedAt: new Date() },
      )
      .where(eq(articles.id, data.id))
      .returning();
    if (!row) return { ok: false as const, error: "Matéria não encontrada." };
    return { ok: true as const, article: mapArticle(row) };
  });

const idValidator = (input: unknown) => {
  const data = input as { id?: unknown };
  if (typeof data?.id !== "string" || !data.id) throw new Error("id obrigatório.");
  return { id: data.id };
};

export const deleteArticleAdmin = createServerFn({ method: "POST" })
  .validator(idValidator)
  .handler(async ({ data }) => {
    const admin = await requireAdmin();
    if (!admin) {
      return { ok: false as const, error: "Acesso restrito." };
    }
    const db = getDb();
    await db.delete(articles).where(eq(articles.id, data.id));
    return { ok: true as const };
  });
