import { createServerFn } from "@tanstack/react-start";
import { and, count, desc, eq, gte, lt } from "drizzle-orm";
import Groq from "groq-sdk";
import { getDb } from "./db";
import { articles } from "./schema";
import { requireAdmin } from "./admin-server";
import { BEAT_LABELS, CYCLE_HOURS, isBeat, type Beat } from "./beats";

// Rascunhos gerados por IA rodam no Groq desde que Anthropic (sem crédito)
// e Gemini (cota bloqueada mesmo com faturamento configurado — cartão
// virtual sem saldo suficiente pra passar na pré-autorização) ficaram
// inviáveis (ver PROGRESSO.md). Groq: tier grátis sem cartão. "compound"
// (não um modelo comum) porque tem busca na web nativa embutida (via
// Tavily) — o único equivalente real ao web_search da Anthropic/
// googleSearch do Gemini que sobrevive sem cartão.
//
// Compound/Compound Mini continuaram devolvendo 413 porque o orquestrador
// injeta muitos resultados no próprio contexto. O GPT-OSS usa browser_search
// diretamente, sem essa camada intermediária, e é um modelo de produção do
// Groq. reasoning_effort baixo mantém a pesquisa dentro do orçamento.
const DRAFT_MODEL = "openai/gpt-oss-20b";
const DRAFT_FALLBACK_MODEL = "openai/gpt-oss-120b";
const DRAFT_MAX_TOKENS = 1100;

// GDELT funciona como radar gratuito de pauta. Ele não é tratado como fonte
// editorial: apenas entrega candidatos recentes; o modelo ainda precisa abrir,
// conferir e cruzar a notícia em pelo menos dois domínios independentes.
const GDELT_QUERY: Record<Beat, string> = {
  ia: '("artificial intelligence" OR "generative AI" OR "AI model")',
  clima: '("clean energy" OR batteries OR solar OR wind OR climate)',
  economia: '("digital yuan" OR CBDC OR "digital currency")',
  geopolitica: '((China AND USA) OR (China AND Brazil) OR chips OR semiconductors)',
  mercado: '(technology OR "artificial intelligence") (investment OR earnings OR infrastructure)',
};

// Redundância gratuita para o radar: quando o GDELT demora ou fica fora do
// ar, usamos RSS de veículos e instituições reconhecidas. Esses itens também
// são apenas sinais de pauta; a publicação continua exigindo duas fontes
// independentes abertas e verificadas pelo modelo.
const RSS_FEEDS: Record<Beat, string[]> = {
  ia: [
    "https://news.google.com/rss/search?q=artificial+intelligence+OR+AI+when%3A1d&hl=en-US&gl=US&ceid=US%3Aen",
    "https://techcrunch.com/feed/",
    "https://www.technologyreview.com/feed/",
  ],
  clima: [
    "https://news.google.com/rss/search?q=clean+energy+OR+climate+when%3A1d&hl=en-US&gl=US&ceid=US%3Aen",
    "https://news.un.org/feed/subscribe/en/news/topic/climate-change/feed/rss.xml",
    "https://agenciabrasil.ebc.com.br/rss/ultimasnoticias/feed.xml",
  ],
  economia: [
    "https://news.google.com/rss/search?q=central+bank+OR+digital+currency+OR+inflation+when%3A1d&hl=en-US&gl=US&ceid=US%3Aen",
    "https://www.federalreserve.gov/feeds/press_all.xml",
    "https://agenciabrasil.ebc.com.br/rss/ultimasnoticias/feed.xml",
  ],
  geopolitica: [
    "https://news.google.com/rss/search?q=China+US+Brazil+technology+trade+when%3A1d&hl=en-US&gl=US&ceid=US%3Aen",
    "https://feeds.bbci.co.uk/news/world/rss.xml",
    "https://agenciabrasil.ebc.com.br/rss/ultimasnoticias/feed.xml",
  ],
  mercado: [
    "https://news.google.com/rss/search?q=technology+investment+OR+earnings+OR+chips+when%3A1d&hl=en-US&gl=US&ceid=US%3Aen",
    "https://techcrunch.com/feed/",
    "https://www.technologyreview.com/feed/",
  ],
};

const SIGNAL_KEYWORDS: Record<Beat, RegExp> = {
  ia: /\b(ai|artificial intelligence|inteligência artificial|model|chip|robot|software)\b/i,
  clima: /\b(climate|clima|energy|energia|solar|wind|eólica|battery|bateria|emission)\b/i,
  economia: /\b(econom|economia|central bank|banco central|currency|moeda|inflation|inflação|cbdc|yuan|drex|interest|juros)\b/i,
  geopolitica: /\b(china|chinese|brasil|brazil|united states|eua|trade|comércio|tariff|tarifa|chip|semiconductor|geopolit)\b/i,
  mercado: /\b(market|mercado|startup|funding|investment|investimento|company|empresa|technology|tecnologia|ai|chip)\b/i,
};

type StorySignal = { title: string; url: string; domain: string; seenAt: string };

function decodeXmlText(value: string): string {
  return value
    .replace(/^<!\[CDATA\[|\]\]>$/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function rssTag(block: string, tag: string): string {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? decodeXmlText(match[1].trim()) : "";
}

async function discoverRssSignals(beat: Beat): Promise<StorySignal[]> {
  const results = await Promise.allSettled(
    RSS_FEEDS[beat].map(async (feedUrl) => {
      const response = await fetch(feedUrl, {
        headers: { "User-Agent": "VeronicaWire/1.0 (+https://veronicahub.com/blog)" },
        signal: AbortSignal.timeout(8_000),
      });
      if (!response.ok) return [];
      const xml = await response.text();
      return [...xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)].map((match) => {
        const title = rssTag(match[1], "title");
        const url = rssTag(match[1], "link");
        const seenAt = rssTag(match[1], "pubDate") || rssTag(match[1], "dc:date");
        return { title, url, seenAt };
      });
    }),
  );

  // Uma janela de 72h mantém o radar útil em fins de semana e durante
  // indisponibilidades do GDELT, sem transformar notícia antiga em pauta.
  const recentFloor = Date.now() - 72 * 60 * 60 * 1000;
  const seenDomains = new Set<string>();
  const signals: StorySignal[] = [];
  for (const result of results) {
    if (result.status !== "fulfilled") continue;
    for (const item of result.value) {
      if (!item.title || !item.url || !SIGNAL_KEYWORDS[beat].test(item.title)) continue;
      const published = Date.parse(item.seenAt);
      if (Number.isFinite(published) && published < recentFloor) continue;
      let domain: string;
      try {
        domain = new URL(item.url).hostname.replace(/^www\./, "").toLowerCase();
      } catch {
        continue;
      }
      if (seenDomains.has(domain)) continue;
      seenDomains.add(domain);
      signals.push({ ...item, title: item.title.slice(0, 220), domain });
      if (signals.length === 2) return signals;
    }
  }
  return signals;
}

function canonicalSourceUrl(value: string): string | null {
  try {
    const url = new URL(value);
    const path = url.pathname.replace(/\/+$/, "") || "/";
    return `${url.hostname.replace(/^www\./, "").toLowerCase()}${path}`;
  } catch {
    return null;
  }
}

async function discoverStorySignals(beat: Beat): Promise<StorySignal[]> {
  try {
    const url = new URL("https://api.gdeltproject.org/api/v2/doc/doc");
    url.searchParams.set("query", GDELT_QUERY[beat]);
    url.searchParams.set("mode", "artlist");
    url.searchParams.set("format", "json");
    url.searchParams.set("sort", "datedesc");
    url.searchParams.set("timespan", "24h");
    url.searchParams.set("maxrecords", "25");

    const response = await fetch(url, { signal: AbortSignal.timeout(8_000) });
    if (!response.ok) return discoverRssSignals(beat);
    const payload = (await response.json()) as { articles?: unknown };
    if (!Array.isArray(payload.articles)) return discoverRssSignals(beat);

    const seenDomains = new Set<string>();
    const signals: StorySignal[] = [];
    for (const raw of payload.articles) {
      const item = raw as Record<string, unknown>;
      if (typeof item.title !== "string" || typeof item.url !== "string") continue;
      let domain: string;
      try {
        domain = new URL(item.url).hostname.replace(/^www\./, "").toLowerCase();
      } catch {
        continue;
      }
      if (seenDomains.has(domain)) continue;
      seenDomains.add(domain);
      signals.push({
        title: item.title.slice(0, 220),
        url: item.url,
        domain,
        seenAt: typeof item.seendate === "string" ? item.seendate : "",
      });
      // Cinco sinais já dão variedade editorial sem inflar o prompt que será
      // somado ao contexto do browser_search.
      if (signals.length === 2) break;
    }
    return signals.length > 0 ? signals : discoverRssSignals(beat);
  } catch (error) {
    console.warn(`discoverStorySignals(${beat}): GDELT indisponível; usando RSS`, error);
    return discoverRssSignals(beat);
  }
}

// Piso mecânico antes de publicar (brief "evolução", item 8) — não é revisão
// editorial, só barra o pior caso: matéria com uma fonte só ou corpo curto
// demais pra ser notícia de verdade. MIN_BODY_CHARS fica abaixo do alvo de
// 900-1400 do prompt (dá margem pra variação natural do modelo) mas acima
// do que um corpo genuinamente incompleto teria.
const MIN_SOURCE_URLS = 2;
const MIN_BODY_CHARS = 700;

// Quantas publicações recentes (todas as editorias) entram nas checagens de
// antirrepetição — tanto de foto (coverPhotoId) quanto de manchete
// (findSimilarHeadline, abaixo). 40 é o número pedido no brief de evolução.
const RECENT_HISTORY_LIMIT = 40;

// A home mantém um feed editorial compacto mesmo quando o ciclo automático
// fica temporariamente sem publicar. O contador de 24h continua separado e
// factual; o leitor nunca recebe uma falsa tela de "primeiras matérias" se o
// acervo já contém reportagens publicadas.
const HOME_WINDOW_HOURS = 24;
const HOME_FEED_LIMIT = 18;

// Item 6 (paginação): página de cada editoria (/blog/$beat) carrega em
// blocos de 15 via cursor (publishedAt da última matéria da página
// anterior) — nunca um offset, que erra sob inserção contínua (o cron
// publica o tempo todo). Um único Date como cursor é suficiente aqui: as
// matérias são inseridas uma de cada vez pelo cron, então colisão de
// timestamp entre duas linhas é praticamente impossível nessa escala.
const BEAT_PAGE_SIZE = 15;

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
    coverPhotoCredit: row.coverPhotoCredit,
    coverPhotoUrl: row.coverPhotoUrl,
    sourceUrls: row.sourceUrls,
    status: row.status,
    aiGenerated: row.aiGenerated,
    autoPublished: row.autoPublished,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
  };
}

// Home: últimas matérias publicadas, com contador factual das últimas 24h.
export const getPublishedArticles = createServerFn({ method: "GET" }).handler(async () => {
  const db = getDb();
  const dayAgo = new Date(Date.now() - HOME_WINDOW_HOURS * 60 * 60 * 1000);

  const [feedRows, countRows] = await Promise.all([
    db
      .select()
      .from(articles)
      .where(eq(articles.status, "published"))
      .orderBy(desc(articles.publishedAt))
      .limit(HOME_FEED_LIMIT),
    db
      .select({ value: count() })
      .from(articles)
      .where(and(eq(articles.status, "published"), gte(articles.publishedAt, dayAgo))),
  ]);

  return {
    ok: true as const,
    articles: feedRows.map(mapArticle),
    current24hCount: Number(countRows[0]?.value ?? 0),
  };
});

const beatPageValidator = (input: unknown) => {
  const data = input as { beat?: unknown; cursor?: unknown };
  if (!isBeat(data?.beat)) {
    throw new Error("Editoria inválida.");
  }
  return {
    beat: data.beat,
    cursor: typeof data?.cursor === "string" && data.cursor ? data.cursor : null,
  };
};

// Página paginada de uma editoria (/blog/$beat) — ver comentário de
// BEAT_PAGE_SIZE acima sobre o cursor por publishedAt.
export const getArticlesByBeat = createServerFn({ method: "GET" })
  .validator(beatPageValidator)
  .handler(async ({ data }) => {
    const db = getDb();
    const conditions = [eq(articles.beat, data.beat), eq(articles.status, "published")];
    if (data.cursor) {
      conditions.push(lt(articles.publishedAt, new Date(data.cursor)));
    }

    const rows = await db
      .select()
      .from(articles)
      .where(and(...conditions))
      .orderBy(desc(articles.publishedAt))
      .limit(BEAT_PAGE_SIZE + 1);

    const hasMore = rows.length > BEAT_PAGE_SIZE;
    const page = hasMore ? rows.slice(0, BEAT_PAGE_SIZE) : rows;
    const last = page[page.length - 1];

    return {
      ok: true as const,
      articles: page.map(mapArticle),
      nextCursor: hasMore && last?.publishedAt ? last.publishedAt.toISOString() : null,
    };
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
  // Termos de busca (inglês) pra achar uma foto real no Pexels/Pixabay —
  // ver scripts/fetch-cover-photo.mjs. Nunca bloqueia a publicação: se vier
  // ausente/malformado, cai vazio e o pipeline de capa vai direto pro
  // próximo nível de fallback (ver handleGenerateArticleCron).
  fotoTermos: string[];
};

type DraftAttemptResult =
  | { ok: true; content: DraftContent }
  // retry=true: formato veio quebrado (provável corte por max_tokens ou
  // ruído do modelo) — vale tentar de novo. retry=false: o modelo respondeu
  // corretamente que não achou fato verificável, ou a chamada à API falhou
  // (rede/API key/etc) — tentar de novo não muda o resultado.
  | { ok: false; error: string; retry: boolean };

// Uma chamada ao Groq + parse da resposta. Separado de
// draftArticleContent só pra permitir uma retentativa (ver lá embaixo) sem
// duplicar a lógica de request/parse.
async function attemptDraft(
  apiKey: string,
  beat: Beat,
  signals: StorySignal[],
): Promise<DraftAttemptResult> {
  const radarContext = signals.length
    ? `\n\nRADAR DE PAUTAS RECENTES (use apenas como ponto de partida, nunca como prova):\n${signals
        .map((signal, index) => `${index + 1}. ${signal.title} — ${signal.domain} — ${signal.url}`)
        .join("\n")}`
    : "\n\nO radar externo está indisponível. Descubra pela busca na web uma pauta recente da editoria e confirme-a em dois domínios independentes.";
  const selectionInstruction = signals.length
    ? "Escolha uma pauta do radar e informe o número dela em selectedRadarIndex."
    : "Como o radar está vazio, descubra a pauta diretamente pela busca e use selectedRadarIndex 0.";
  const systemPrompt = `Você é repórter do Veronica Wire, editoria "${BEAT_LABELS[beat]}" (${BEAT_BRIEF[beat]}).
Pesquise UM fato real recente, preferencialmente das últimas 24h e no máximo das últimas 72h. ${selectionInstruction} Confirme-o em outra apuração independente. Priorize uma fonte primária e uma fonte jornalística. Republicações do mesmo texto de agência não contam como duas fontes. Não invente.
Responda apenas com JSON válido neste formato:
{"selectedRadarIndex":${signals.length ? 1 : 0},"eventDate":"AAAA-MM-DDTHH:mm:ssZ","headline":"manchete direta em português","excerpt":"resumo em 1-2 frases","body":"3-4 parágrafos, 750-1000 caracteres; abra com o fato completo e inclua dado numérico quando existir; sem opinião ou conclusão genérica","desk":"Desk de tema específico","sourceUrls":["https://fonte-independente-1","https://fonte-independente-2"],"fotoTermos":["english photo term 1","english photo term 2"]}
Regras: eventDate é a data/hora UTC em que o fato aconteceu ou foi oficialmente anunciado, nunca a data de hoje por conveniência. URLs reais, acessíveis, de domínios distintos e efetivamente consultadas; sem páginas iniciais, buscas, redes sociais ou agregadores. Projeções e cenários devem ser atribuídos, nunca escritos como certeza. fotoTermos deve ter 2-3 objetos, lugares ou ambientes fotografáveis em inglês, sem marcas ou pessoas públicas. Se não houver fato verificável, responda {"error":"sem fato verificável no momento"}.${radarContext}`;

  // browser_search é obrigatório: o modelo não pode responder só de memória.
  // O Groq executa a ferramenta server-side e devolve o texto pesquisado junto
  // da resposta; o parser abaixo procura o último objeto editorial válido.
  const messages = [
    { role: "system" as const, content: systemPrompt },
    {
      role: "user" as const,
      content: "Pesquise e escreva a matéria conforme as instruções.",
    },
  ];
  let response: Groq.Chat.ChatCompletion;
  try {
    const groq = new Groq({ apiKey });
    response = await groq.chat.completions.create({
      model: DRAFT_MODEL,
      messages,
      max_completion_tokens: DRAFT_MAX_TOKENS,
      reasoning_effort: "low",
      tool_choice: "required",
      tools: [{ type: "browser_search" }],
    });
  } catch (error) {
    const isRateLimit =
      (typeof error === "object" &&
        error !== null &&
        "status" in error &&
        (error as { status?: unknown }).status === 429) ||
      (error instanceof Error && /\b429\b|rate limit/i.test(error.message));
    if (!isRateLimit) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Falha ao gerar rascunho com IA.",
        retry: false,
      };
    }

    // Os modelos GPT-OSS têm cotas gratuitas separadas. O 120B também suporta
    // browser_search e funciona como reserva sem exigir outra credencial.
    try {
      const fallbackGroq = new Groq({ apiKey });
      response = await fallbackGroq.chat.completions.create({
        model: DRAFT_FALLBACK_MODEL,
        messages,
        max_completion_tokens: DRAFT_MAX_TOKENS,
        reasoning_effort: "low",
        tool_choice: "required",
        tools: [{ type: "browser_search" }],
      });
    } catch (fallbackError) {
      return {
        ok: false,
        error:
          fallbackError instanceof Error
            ? fallbackError.message
            : "Falha ao gerar rascunho com os dois modelos.",
        retry: false,
      };
    }
  }

  const finishReason = response.choices[0]?.finish_reason;
  const text = (response.choices[0]?.message?.content ?? "").trim();

  const jsonStarts = [...text.matchAll(/\{\s*"(?:selectedRadarIndex|headline|error)"/g)];
  const jsonStart = jsonStarts.at(-1)?.index ?? -1;
  const jsonEnd = text.lastIndexOf("}");
  if (jsonStart === -1 || jsonEnd === -1) {
    console.error(
      `draftArticleContent(${beat}): sem JSON na resposta (finishReason=${finishReason ?? "?"}). Trecho: ${text.slice(0, 300)}`,
    );
    return { ok: false, error: "IA não retornou um rascunho válido. Tente de novo.", retry: true };
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
  } catch (error) {
    console.error(
      `draftArticleContent(${beat}): JSON inválido (finishReason=${finishReason ?? "?"}, erro=${error instanceof Error ? error.message : error}). Trecho: ${text.slice(0, 300)}`,
    );
    return { ok: false, error: "IA não retornou um rascunho válido. Tente de novo.", retry: true };
  }

  if (typeof parsed.error === "string") {
    return { ok: false, error: parsed.error, retry: false };
  }

  const {
    selectedRadarIndex,
    eventDate,
    headline,
    excerpt,
    body,
    desk,
    sourceUrls,
    fotoTermos,
  } = parsed;
  if (
    typeof eventDate !== "string" ||
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

  // A busca web continua disponível quando os radares externos falham, mas a
  // data do evento é uma trava mecânica contra a republicação de pauta antiga.
  const eventTimestamp = Date.parse(eventDate);
  const now = Date.now();
  if (
    !Number.isFinite(eventTimestamp) ||
    eventTimestamp < now - 72 * 60 * 60 * 1000 ||
    eventTimestamp > now + 6 * 60 * 60 * 1000
  ) {
    return {
      ok: false,
      error: "A data do fato está fora da janela editorial de 72h.",
      retry: true,
    };
  }

  const radarUrls = new Set(
    signals
      .map((signal) => canonicalSourceUrl(signal.url))
      .filter((url): url is string => Boolean(url)),
  );
  const submittedSourceUrls = sourceUrls as string[];
  const anchoredToRecentRadar = submittedSourceUrls.some((url) => {
    const canonical = canonicalSourceUrl(url);
    return canonical !== null && radarUrls.has(canonical);
  });

  // Modelos de busca frequentemente devolvem a URL canônica encontrada na
  // apuração em vez da URL longa recebida no radar. selectedRadarIndex evita
  // descartar uma matéria válida só porque a IA não copiou a URL literalmente:
  // o servidor reinsere a pauta exata escolhida e o piso editorial, abaixo,
  // ainda exige outro domínio independente.
  const parsedRadarIndex =
    typeof selectedRadarIndex === "number"
      ? selectedRadarIndex
      : typeof selectedRadarIndex === "string"
        ? Number(selectedRadarIndex)
        : Number.NaN;
  const selectedSignal =
    Number.isInteger(parsedRadarIndex) && parsedRadarIndex >= 1
      ? signals[parsedRadarIndex - 1]
      : undefined;

  if (signals.length > 0 && !anchoredToRecentRadar && !selectedSignal) {
    console.error(`draftArticleContent(${beat}): fontes sem URL do radar recente.`);
    return {
      ok: false,
      error: "A matéria não ficou ancorada a uma pauta recente do radar. Tente de novo.",
      retry: true,
    };
  }

  const shouldPersistRadarUrl =
    selectedSignal && selectedSignal.domain !== "news.google.com";
  const resolvedSourceUrls = [
    ...(anchoredToRecentRadar || !shouldPersistRadarUrl ? [] : [selectedSignal.url]),
    ...submittedSourceUrls,
  ].filter((url, index, all) => {
    const canonical = canonicalSourceUrl(url);
    return (
      canonical !== null &&
      all.findIndex((candidate) => canonicalSourceUrl(candidate) === canonical) === index
    );
  });

  // fotoTermos nunca derruba a publicação — se vier ausente/malformado, só
  // não dá pra tentar Pexels/Pixabay pra essa matéria (cai pro próximo
  // nível de fallback no workflow do cron).
  const validFotoTermos =
    Array.isArray(fotoTermos) && fotoTermos.every((t) => typeof t === "string")
      ? (fotoTermos as string[]).filter(Boolean).slice(0, 3)
      : [];
  if (validFotoTermos.length === 0) {
    console.error(`draftArticleContent(${beat}): fotoTermos ausente ou inválido, seguindo sem.`);
  }

  return {
    ok: true,
    content: {
      headline,
      excerpt,
      body,
      desk,
      sourceUrls: resolvedSourceUrls.slice(0, 4),
      fotoTermos: validFotoTermos,
    },
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
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "GROQ_API_KEY não configurada." };
  }

  // Só uma retentativa, e só quando a resposta veio com formato quebrado
  // (retry=true) — não faz sentido retentar quando o próprio modelo disse
  // que não achou fato verificável, nem quando a chamada à API falhou.
  const signals = await discoverStorySignals(beat);
  const first = await attemptDraft(apiKey, beat, signals);
  if (first.ok || !first.retry) return first;

  const second = await attemptDraft(apiKey, beat, signals);
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

// Início (UTC) da janela horária que currentBeat() (article-cron.ts) está
// usando agora — mesmo cálculo, replicado aqui pra não criar import
// circular (article-cron.ts já importa publishArticleFromCron daqui).
function currentCycleWindowStart(): Date {
  const now = new Date();
  const start = new Date(now);
  start.setUTCMinutes(0, 0, 0);
  start.setUTCHours(Math.floor(now.getUTCHours() / CYCLE_HOURS) * CYCLE_HOURS);
  return start;
}

// Últimos coverPhotoId usados (todas as editorias) — pro Action excluir da
// busca no Pexels/Pixabay e não repetir a mesma foto em poucos dias. NULL
// (matéria sem foto real, só card/fallback) não conta.
async function recentCoverPhotoIds(db: ReturnType<typeof getDb>): Promise<string[]> {
  const rows = await db
    .select({ coverPhotoId: articles.coverPhotoId })
    .from(articles)
    .where(and(eq(articles.status, "published")))
    .orderBy(desc(articles.publishedAt))
    .limit(RECENT_HISTORY_LIMIT);
  return rows.map((r) => r.coverPhotoId).filter((id): id is string => Boolean(id));
}

// Últimas manchetes publicadas (todas as editorias — o mesmo fato pode vazar
// entre "economia" e "geopolitica", por exemplo) — entrada de
// findSimilarHeadline, abaixo.
async function recentHeadlines(db: ReturnType<typeof getDb>): Promise<string[]> {
  const rows = await db
    .select({ headline: articles.headline })
    .from(articles)
    .where(eq(articles.status, "published"))
    .orderBy(desc(articles.publishedAt))
    .limit(RECENT_HISTORY_LIMIT);
  return rows.map((r) => r.headline);
}

// Já sem acento (comparado depois do NFD-strip em normalizeHeadlineTokens,
// então a forma acentuada nunca apareceria no token pra comparar).
const STOPWORDS_PT = new Set([
  "a",
  "o",
  "as",
  "os",
  "de",
  "da",
  "do",
  "das",
  "dos",
  "em",
  "no",
  "na",
  "nos",
  "nas",
  "para",
  "por",
  "com",
  "que",
  "um",
  "uma",
  "uns",
  "umas",
  "e",
  "ou",
  "sao",
  "ao",
  "aos",
  "seu",
  "sua",
  "seus",
  "suas",
  "mais",
  "menos",
  "sobre",
  "entre",
  "apos",
  "como",
  "tambem",
  "ja",
  "nao",
  "novo",
  "nova",
]);

// Normaliza a manchete pra comparação: sem acento, minúsculo, sem pontuação,
// sem stopword/palavra alfabética curta demais (< 3 letras) — mas número
// (ex: "30") passa direto mesmo curto, porque é justamente o tipo de token
// que mais ajuda a distinguir "mesmo fato" de "mesmo tema, fato diferente"
// (ex: "30 bancos" vs "500 bilhões" na mesma editoria de yuan digital).
function normalizeHeadlineTokens(headline: string): Set<string> {
  const normalized = headline
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ");
  const tokens = normalized
    .split(/\s+/)
    .filter((token) => (token.length > 2 || /^\d+$/.test(token)) && !STOPWORDS_PT.has(token));
  return new Set(tokens);
}

// Overlap coefficient (interseção / menor dos dois conjuntos) em vez de
// Jaccard (interseção / união): manchetes de portal são curtas e reescritas
// livremente (verbo e substantivos trocados, mesma notícia) — Jaccard pune
// demais a diferença de vocabulário fora dos termos-âncora e deixava passar
// reformulações reais nos testes abaixo.
function overlapCoefficient(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const token of a) if (b.has(token)) intersection += 1;
  return intersection / Math.min(a.size, b.size);
}

// 0.35 foi calibrado à mão contra pares reais deste Wire (heurística, não
// constante de manual — ajustar se a prática mostrar barrando matéria
// distinta ou deixando passar reformulação):
//   0.38 — "PBOC amplia rede do yuan digital p/ 30 bancos" vs "Banco central
//          da China expande yuan digital p/ 30 instituições" (MESMO fato) → pega
//   0.57 — duas manchetes sobre o mesmo acordo Anthropic/Google/Broadcom → pega
//   0.25 — "PBOC amplia rede... 30 bancos" vs "Yuan digital ultrapassa 500
//          bilhões em transações" (mesmo tema, fato DIFERENTE) → não pega
//   0.25 — duas matérias distintas sobre Anthropic (modelo novo vs parceria
//          de infraestrutura) → não pega
// Continua sendo best-effort — a defesa principal contra duplicata é o
// dedup por janela (windowAlreadyPublished); isto é rede extra pro caso de
// janela mais curta repetir o mesmo fato em janelas diferentes.
const HEADLINE_SIMILARITY_THRESHOLD = 0.35;

function findSimilarHeadline(newHeadline: string, recent: string[]): string | null {
  const newTokens = normalizeHeadlineTokens(newHeadline);
  for (const headline of recent) {
    if (
      overlapCoefficient(newTokens, normalizeHeadlineTokens(headline)) >=
      HEADLINE_SIMILARITY_THRESHOLD
    ) {
      return headline;
    }
  }
  return null;
}

// Piso mecânico do item 8 — ver comentário de MIN_SOURCE_URLS/MIN_BODY_CHARS
// lá em cima. Roda depois do rascunho (só aí dá pra saber corpo/fontes) e
// antes de gravar — nunca publica abaixo do piso.
function validateDraftForPublish(
  content: DraftContent,
): { ok: true } | { ok: false; error: string } {
  if (content.sourceUrls.length < MIN_SOURCE_URLS) {
    return {
      ok: false,
      error: `Só ${content.sourceUrls.length} fonte(s) em sourceUrls — mínimo de ${MIN_SOURCE_URLS} pra publicar.`,
    };
  }
  if (content.body.length < MIN_BODY_CHARS) {
    return {
      ok: false,
      error: `Corpo com ${content.body.length} caracteres — abaixo do piso de ${MIN_BODY_CHARS}.`,
    };
  }

  const domains = new Set<string>();
  for (const sourceUrl of content.sourceUrls) {
    try {
      const parsed = new URL(sourceUrl);
      if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
        return { ok: false, error: `Fonte com protocolo inválido: ${sourceUrl}` };
      }
      domains.add(parsed.hostname.replace(/^www\./, "").toLowerCase());
    } catch {
      return { ok: false, error: `URL de fonte inválida: ${sourceUrl}` };
    }
  }
  if (domains.size < MIN_SOURCE_URLS) {
    return {
      ok: false,
      error: `As fontes precisam vir de pelo menos ${MIN_SOURCE_URLS} domínios independentes.`,
    };
  }
  return { ok: true };
}

// Já existe matéria publicada pra essa editoria dentro da janela atual? Usado
// tanto por publishArticleFromCron quanto por simulateArticleFromCron — é o
// que de fato causa duplicata (dois disparos do cron pra mesma editoria na
// mesma janela), não é sobre repetir o mesmo fato dias depois. Checar ANTES
// de chamar a IA também evita gastar a chamada à toa.
async function windowAlreadyPublished(
  db: ReturnType<typeof getDb>,
  beat: Beat,
): Promise<string | null> {
  const [row] = await db
    .select({ headline: articles.headline })
    .from(articles)
    .where(
      and(
        eq(articles.beat, beat),
        eq(articles.status, "published"),
        gte(articles.publishedAt, currentCycleWindowStart()),
      ),
    )
    .limit(1);
  return row?.headline ?? null;
}

// Núcleo compartilhado por publishArticleFromCron e simulateArticleFromCron:
// gera o rascunho e roda as duas checagens de item 5/8 (similaridade de
// manchete e piso de qualidade) — tudo que precisa acontecer ANTES de
// decidir se a matéria vai pro ar, sem repetir a lógica em dois lugares.
async function draftAndValidate(
  db: ReturnType<typeof getDb>,
  beat: Beat,
): Promise<{ ok: true; content: DraftContent } | { ok: false; error: string }> {
  const draft = await draftArticleContent(beat);
  if (!draft.ok) return draft;

  const quality = validateDraftForPublish(draft.content);
  if (!quality.ok) return quality;

  const similar = findSimilarHeadline(draft.content.headline, await recentHeadlines(db));
  if (similar) {
    return {
      ok: false,
      error: `Manchete parecida demais com uma publicação recente: "${similar}".`,
    };
  }

  return { ok: true, content: draft.content };
}

// Chamado direto do endpoint /api/cron/generate-article (src/server.ts),
// autenticado por CRON_SECRET em vez de sessão de admin — quem aciona é o
// GitHub Actions, não um humano logado. Por isso PUBLICA direto (sem passar
// por "draft"): decisão explícita do usuário, trocando a salvaguarda de
// revisão manual por atualização automática a cada 5h. Ver
// generateArticleDraftAI acima pro fluxo manual com revisão.
export async function publishArticleFromCron(beat: Beat): Promise<
  | {
      ok: true;
      article: ReturnType<typeof mapArticle>;
      fotoTermos: string[];
      recentPhotoIds: string[];
    }
  | { ok: false; error: string }
> {
  const db = getDb();

  const alreadyPublished = await windowAlreadyPublished(db, beat);
  if (alreadyPublished) {
    return {
      ok: false,
      error: `Já existe matéria publicada nessa janela pra "${beat}" ("${alreadyPublished}") — pulando pra evitar duplicata.`,
    };
  }

  const result = await draftAndValidate(db, beat);
  if (!result.ok) return result;

  const slug = await uniqueSlug(db, result.content.headline);
  const [row] = await db
    .insert(articles)
    .values({
      slug,
      beat,
      headline: result.content.headline,
      excerpt: result.content.excerpt,
      body: result.content.body,
      desk: result.content.desk,
      sourceUrls: result.content.sourceUrls,
      status: "published",
      aiGenerated: true,
      autoPublished: true,
      publishedAt: new Date(),
    })
    .returning();

  return {
    ok: true,
    article: mapArticle(row),
    fotoTermos: result.content.fotoTermos,
    recentPhotoIds: await recentCoverPhotoIds(db),
  };
}

// Modo simulação (brief "evolução", instrução final): roda o mesmo pipeline
// de publishArticleFromCron — rascunho real via IA, piso de qualidade,
// similaridade de manchete — mas NUNCA grava no banco. Custa uma chamada de
// IA de verdade (não tem como saber se "publicaria" sem gerar o rascunho),
// só não publica. Usado por handleGenerateArticleCron com ?dryRun=1.
export async function simulateArticleFromCron(beat: Beat): Promise<
  | {
      ok: true;
      headline: string;
      excerpt: string;
      bodyChars: number;
      sourceUrls: string[];
      fotoTermos: string[];
    }
  | { ok: false; error: string }
> {
  const db = getDb();

  const alreadyPublished = await windowAlreadyPublished(db, beat);
  if (alreadyPublished) {
    return {
      ok: false,
      error: `Já existe matéria publicada nessa janela pra "${beat}" ("${alreadyPublished}") — publicaria pulando essa editoria.`,
    };
  }

  const result = await draftAndValidate(db, beat);
  if (!result.ok) return result;

  return {
    ok: true,
    headline: result.content.headline,
    excerpt: result.content.excerpt,
    bodyChars: result.content.body.length,
    sourceUrls: result.content.sourceUrls,
    fotoTermos: result.content.fotoTermos,
  };
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

    // Presença de coverImageUrl aqui é sempre escolha explícita de um
    // admin — marca coverManual pra proteger da pipeline automática (ou de
    // scripts/reprocess-covers.mjs) sobrescrever depois. Limpar o campo
    // devolve a matéria pro automático.
    const coverManual = data.coverImageUrl !== null;

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
          coverManual,
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
        coverManual,
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
