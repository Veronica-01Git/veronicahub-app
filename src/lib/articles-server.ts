import { createServerFn } from "@tanstack/react-start";
import { and, asc, count, desc, eq, gte, like, lt, ne, notInArray } from "drizzle-orm";
import Groq from "groq-sdk";
import { getRuntimeSecret } from "./runtime-secret.server";
import { generateText } from "./text-generation.server";
import { getDb } from "./db";
import { articles, mediaImages } from "./schema";
import { requireAdmin } from "./admin-server";
import { BEAT_LABELS, CYCLE_HOURS, isBeat, type Beat } from "./beats";
import { WIRE_NAME } from "./ecosystem";
import { resolveEditorialChannel, scheduledEditorialChannel } from "./editorial-network";
import { RECUSA_PAUTA_SC, foraDaPautaSc, tituloDeIndice } from "./pauta-sc";
import {
  TEXTO_MINIMO_POR_FONTE,
  SIGNAL_KEYWORDS,
  fatoForaDoRecorte,
  assuntoRepetido,
  escolherPautas,
  extrairTexto,
  lerFeed,
  nomeDoVeiculo,
  textoCombinaComTitulo,
  tentarOutraPauta,
  type Candidata,
} from "./wire-apuracao";

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
// Até 29/09/2026 era a reserva do Wire quando o 20B batia no teto diário. Saiu
// do Wire por decisão da dona: a cota da Groq é por modelo e por conta, e o
// 120B é o primeiro reserva do agente de WhatsApp (whatsapp-provedores.ts)
// quando a Anthropic falha. Com o Wire gastando os dois, um dia de cota
// apertada deixava o atendimento da Express Entulho sem reserva. Agora o Wire
// para no 20B e o 120B fica livre para o WhatsApp. A constante continua aqui
// porque o teste da cadeia do WhatsApp confere que o nome existe na Groq.
const DRAFT_RESERVED_MODEL = "openai/gpt-oss-120b";
const DRAFT_MAX_TOKENS = 1100;

// GDELT funciona como radar gratuito de pauta. Ele não é tratado como fonte
// editorial: apenas entrega candidatos recentes; o modelo ainda precisa abrir,
// conferir e cruzar a notícia em pelo menos dois domínios independentes.
// Recorte geográfico, decisão editorial de 16/09: a Wire TV cobre Brasil e
// China, com foco no Brasil. Notícia dos EUA sai da pauta — entra só quando o
// fato é brasileiro ou chinês. O recorte aparece em quatro lugares, e
// precisa dos quatro: aqui (o que o GDELT devolve), nos feeds RSS (de onde
// vêm os candidatos), no filtro de escopo (o que passa) e no prompt (o que o
// modelo aceita escrever). Mexer em um só deixa os outros trabalhando contra.
const GDELT_SCOPE = "(Brazil OR Brasil OR China OR Chinese)";

const GDELT_QUERY: Record<Beat, string> = {
  ia: `${GDELT_SCOPE} ("artificial intelligence" OR "generative AI" OR "AI model")`,
  clima: `${GDELT_SCOPE} ("rare earth" OR "rare earths" OR "critical minerals" OR lithium OR climate OR "clean energy")`,
  economia: `${GDELT_SCOPE} ("digital yuan" OR "e-CNY" OR CBDC OR "digital currency" OR yuan)`,
  geopolitica: `${GDELT_SCOPE} (trade OR diplomacy OR chips OR semiconductors OR tariffs)`,
  mercado: `${GDELT_SCOPE} (technology OR startup) (investment OR earnings OR infrastructure)`,
  // Santa Catarina: o recorte geográfico é o próprio estado, com Itajaí e
  // Balneário Camboriú na frente. Sem filtro de assunto desde 29/09 — polícia
  // e tragédia saem pelo foraDaPautaSc, não pela consulta.
  sc: `(Itajaí OR "Balneário Camboriú" OR "Santa Catarina")`,
  // Conteúdo da casa: fora do rodízio, nunca pautado pelo radar.
  veronica: `"Veronica Hub"`,
};

// Redundância gratuita para o radar: quando o GDELT demora ou fica fora do
// ar, usamos RSS de veículos e instituições reconhecidas. Esses itens também
// são apenas sinais de pauta; a publicação continua exigindo duas fontes
// independentes abertas e verificadas pelo modelo.
// Feeds em português e com localidade brasileira. Os antigos eram
// `hl=en-US&gl=US` mais TechCrunch, Federal Reserve e BBC: um radar montado
// para enxergar os EUA, que era de onde a pauta vinha.
function googleNewsBrasil(query: string): string {
  const params = new URLSearchParams({ q: `${query} when:1d`, hl: "pt-BR", gl: "BR" });
  return `https://news.google.com/rss/search?${params.toString()}&ceid=BR%3Apt`;
}

// "Assuntos mais comentados do dia", pedido do dono em 16/09: as principais
// notícias do Brasil no momento, sem termo de busca. O filtro por editoria
// (SIGNAL_KEYWORDS) é o que separa o que interessa a cada uma — então esta
// entra em todas.
const BRASIL_EM_ALTA = "https://news.google.com/rss?hl=pt-BR&gl=BR&ceid=BR%3Apt";
const AGENCIA_BRASIL = "https://agenciabrasil.ebc.com.br/rss/ultimasnoticias/feed.xml";
const G1 = "https://g1.globo.com/rss/g1/";

// Santa Catarina (27/09/2026): pedido da editora — pautar e apurar nos
// portais mais acessados do estado. ND+ e NSC Total se declaram líderes de
// audiência em SC; SCC10, O Município e Jornal Razão completam o radar
// regional. A busca do Google Notícias com `site:` é o jeito estável de ler
// esses portais sem depender de cada um manter um RSS próprio.
//
// 29/09/2026: a editoria virou Santa Catarina geral, com foco em Itajaí e
// Balneário Camboriú. Os portais da região entram na frente: o DIARINHO
// (diário de Itajaí e BC desde 1979, que se declara o mais lido do litoral
// norte) e o BC Notícias e o Click Camboriú, os portais de Balneário. Não há
// medição independente de audiência entre eles; a escolha é por tradição e
// cobertura diária.
const PORTAIS_LITORAL_NORTE = ["diarinho.net", "bcnoticias.com.br", "clickcamboriu.com.br"];
const PORTAIS_SC = [
  "ndmais.com.br",
  "nsctotal.com.br",
  "scc10.com.br",
  "omunicipio.com.br",
  "jornalrazao.com",
];
const sitesDe = (dominios: string[]) => dominios.map((dominio) => `site:${dominio}`).join(" OR ");

const RSS_FEEDS: Record<Beat, string[]> = {
  ia: [googleNewsBrasil("inteligência artificial"), AGENCIA_BRASIL, G1, BRASIL_EM_ALTA],
  clima: [
    googleNewsBrasil("terras raras OR minerais críticos OR lítio OR clima"),
    AGENCIA_BRASIL,
    G1,
    BRASIL_EM_ALTA,
  ],
  economia: [
    googleNewsBrasil("yuan digital OR yuan China Brasil OR moeda digital"),
    AGENCIA_BRASIL,
    G1,
    BRASIL_EM_ALTA,
  ],
  geopolitica: [
    googleNewsBrasil("Brasil China comércio OR diplomacia"),
    AGENCIA_BRASIL,
    G1,
    BRASIL_EM_ALTA,
  ],
  mercado: [
    googleNewsBrasil("tecnologia investimento OR startup"),
    AGENCIA_BRASIL,
    G1,
    BRASIL_EM_ALTA,
  ],
  // A ordem é a prioridade: o radar para nas duas primeiras pautas de
  // domínios diferentes, então o litoral norte vem antes do estado.
  //
  // Um feed por portal do litoral norte, não um feed com os três: o Google
  // Notícias devolve no máximo 100 itens e o DIARINHO sozinho preenche os
  // 100 (medido em 29/09/2026), então BC Notícias e Click Camboriú nunca
  // apareciam.
  sc: [
    ...PORTAIS_LITORAL_NORTE.map((portal) => googleNewsBrasil(sitesDe([portal]))),
    googleNewsBrasil(`(Itajaí OR "Balneário Camboriú") (${sitesDe(PORTAIS_SC)})`),
    googleNewsBrasil(`"Santa Catarina" (${sitesDe(PORTAIS_SC)})`),
  ],
  veronica: [],
};

// Recorte geográfico aplicado a TODO sinal, venha do GDELT ou do RSS.
//
// Duas portas, e a ordem importa: um veículo brasileiro ou chinês está no
// escopo pelo que ele é, sem precisar dizer "Brasil" na manchete — senão
// "Governo anuncia leilão de baterias", da Agência Brasil, seria descartado
// justamente por ser notícia brasileira demais para se anunciar como tal.
// De qualquer outro veículo, a manchete precisa trazer o vínculo.
const SCOPE_DOMAINS =
  /(\.br$|agenciabrasil|ebc\.com\.br|globo\.com|folha\.uol|estadao|valor\.globo|infomoney|poder360|scmp\.com|xinhua|chinadaily|globaltimes)/i;

const SCOPE_TERMS =
  /(brasil|brazil|brasileir|brazilian|bras[íi]lia|china|chin[êe]s|chinesa|chinese|pequim|beijing|xangai|shanghai|hong kong|yuan|renminbi|e-cny|mercosul|brics|petrobras|embraer|itamaraty|planalto|copom|selic|drex|bndes)/i;

function inEditorialScope(title: string, domain: string): boolean {
  return SCOPE_DOMAINS.test(domain) || SCOPE_TERMS.test(title);
}

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
        // O Google Notícias entrega o link embrulhado em news.google.com; o
        // portal de verdade vem no atributo url de <source>.
        const sourceUrl = match[1].match(/<source\b[^>]*\burl="([^"]+)"/i)?.[1] ?? "";
        return { title, url, seenAt, sourceUrl };
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
      if (beat === "sc" && (foraDaPautaSc(item.title) || tituloDeIndice(item.title))) continue;
      const published = Date.parse(item.seenAt);
      if (Number.isFinite(published) && published < recentFloor) continue;
      let domain: string;
      try {
        // Só em SC, por ora: com o domínio do link, todo item do Google
        // Notícias vira "news.google.com", cai fora do escopo (não é .br) e
        // conta como um domínio só. As outras editorias têm o mesmo sintoma,
        // mas mudar o radar delas é outra decisão editorial.
        const origem = beat === "sc" && item.sourceUrl ? item.sourceUrl : item.url;
        domain = new URL(origem).hostname.replace(/^www\./, "").toLowerCase();
      } catch {
        continue;
      }
      if (seenDomains.has(domain)) continue;
      if (!inEditorialScope(item.title, domain)) continue;
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
      if (beat === "sc" && foraDaPautaSc(item.title)) continue;
      let domain: string;
      try {
        domain = new URL(item.url).hostname.replace(/^www\./, "").toLowerCase();
      } catch {
        continue;
      }
      if (seenDomains.has(domain)) continue;
      if (!inEditorialScope(item.title, domain)) continue;
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
//
// 01/10/2026: o piso de fontes caiu de 2 para 1, por autorização do dono
// ("pode quebrar a regra de duas fontes independentes para facilitar"). A
// apuração no servidor (wire-apuracao.ts) continua preferindo o fato que
// dois portais publicaram; a fonte única é o que sobra quando não há par.
const MIN_SOURCE_URLS = 1;
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
// O front editorial exibe uma edição mais densa, próxima de um jornal de
// negócios: destaque, últimas e blocos por tema sem esconder o acervo recente.
const HOME_FEED_LIMIT = 30;

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
    "terras raras e minerais críticos (Brasil e China), transição energética e o futuro climático — eventos extremos, energia limpa e política climática",
  economia:
    "China + Brasil: yuan digital (e-CNY), moedas digitais de bancos centrais, Drex e a relação econômica e tecnológica entre os dois países",
  geopolitica:
    "relação Brasil–China — comércio, chips, cadeias produtivas, diplomacia e tecnologia",
  mercado: "mercado de tecnologia global — investimentos, big techs e infraestrutura de IA",
  sc: "notícias de Santa Catarina com foco em Itajaí, Balneário Camboriú e o litoral norte — cidade, serviços públicos, obras, porto, economia, turismo, eventos, educação e saúde. Apure primeiro nos portais mais lidos da região (DIARINHO diarinho.net, BC Notícias bcnoticias.com.br, Click Camboriú clickcamboriu.com.br) e do estado (ND+ ndmais.com.br, NSC Total nsctotal.com.br), e confirme em fonte primária (prefeituras, Governo de SC, Porto de Itajaí) ou em outro portal. Notícia local costuma anunciar algo que ainda vai acontecer (show, obra, inauguração, mudança no trânsito): nesse caso o fato é o anúncio, e eventDate é a data em que foi anunciado, nunca a data futura do evento. PROIBIDO pautar polícia, crime, prisão, acidente, morte ou tragédia: se só houver esse tipo de fato, responda o erro de sem fato verificável",
  veronica:
    "notícias da própria Veronica Hub — conteúdo da casa, escrito com a direção, nunca pautado por conta própria",
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
  const editorialChannel = resolveEditorialChannel(row.beat, row.desk, row.headline, row.excerpt);
  return {
    id: row.id,
    slug: row.slug,
    beat: row.beat,
    headline: row.headline,
    excerpt: row.excerpt,
    body: row.body,
    desk: row.desk,
    editorialChannel,
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
    const relatedRows = await db
      .select()
      .from(articles)
      .where(
        and(eq(articles.status, "published"), eq(articles.beat, row.beat), ne(articles.id, row.id)),
      )
      .orderBy(desc(articles.publishedAt))
      .limit(3);
    return {
      ok: true as const,
      article: mapArticle(row),
      relatedArticles: relatedRows.map(mapArticle),
    };
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
  const targetChannel = scheduledEditorialChannel(beat);
  const radarContext = signals.length
    ? `\n\nRADAR DE PAUTAS RECENTES (use apenas como ponto de partida, nunca como prova):\n${signals
        .map((signal, index) => `${index + 1}. ${signal.title} — ${signal.domain} — ${signal.url}`)
        .join("\n")}`
    : "\n\nO radar externo está indisponível. Descubra pela busca na web uma pauta recente da editoria e confirme-a em dois domínios independentes.";
  const selectionInstruction = signals.length
    ? "Escolha uma pauta do radar e informe o número dela em selectedRadarIndex."
    : "Como o radar está vazio, descubra a pauta diretamente pela busca e use selectedRadarIndex 0.";
  const systemPrompt = `Você é repórter do ${WIRE_NAME}, editoria "${BEAT_LABELS[beat]}" (${BEAT_BRIEF[beat]}), canal editorial "${targetChannel.label}" (${targetChannel.description}).
ESCOPO OBRIGATÓRIO: só publique fato do Brasil ou da China, com prioridade para o Brasil. Se a única pauta disponível for dos Estados Unidos ou de outro país, sem efeito direto e concreto sobre Brasil ou China, responda o erro de "sem fato verificável" em vez de publicar. Fato de terceiro país só entra quando o efeito brasileiro ou chinês for o assunto da matéria, e a manchete precisa deixá-lo claro.
Pesquise UM fato real recente, preferencialmente das últimas 24h e no máximo das últimas 72h. ${selectionInstruction} Confirme-o em outra apuração independente. Priorize uma fonte primária e uma fonte jornalística. Republicações do mesmo texto de agência não contam como duas fontes. Não invente.
Responda apenas com JSON válido neste formato:
{"selectedRadarIndex":${signals.length ? 1 : 0},"eventDate":"AAAA-MM-DDTHH:mm:ssZ","headline":"manchete direta em português","excerpt":"resumo em 1-2 frases","body":"3-4 parágrafos, 750-1000 caracteres; abra com o fato completo e inclua dado numérico quando existir; sem opinião ou conclusão genérica","desk":"${targetChannel.label}","sourceUrls":["https://fonte-independente-1","https://fonte-independente-2"],"fotoTermos":["english photo term 1","english photo term 2"]}
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
    // output_parse_failed é o Groq recusando a saída do PRÓPRIO modelo: o
    // gpt-oss emitiu sintaxe de tool call quebrada durante o browser_search e
    // a API devolveu 400 antes de qualquer resposta editorial. Medido em
    // 13/09 em duas rodadas, com `failed_generation` sendo "Open that." e
    // "Scrolling near top maybe meta." — fragmentos da navegação, não matéria
    // malformada. É falha de amostragem, não de configuração: a mesma chamada
    // repetida costuma passar. Sem marcar como retentável, uma amostra ruim
    // derrubava a hora inteira sem nenhuma segunda tentativa.
    const isOutputParseFailure =
      error instanceof Error && /output_parse_failed/i.test(error.message);
    if (!isRateLimit) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Falha ao gerar rascunho com IA.",
        retry: isOutputParseFailure,
      };
    }

    // Cota do 20B esgotada: a rodada fica sem publicar (o "429" no começo da
    // mensagem é o que isEditorialSkip reconhece). Sem cair para o 120B — ver
    // DRAFT_RESERVED_MODEL.
    return {
      ok: false,
      error: `${error instanceof Error ? error.message : "429 limite da Groq"} (${DRAFT_RESERVED_MODEL} reservado ao WhatsApp)`,
      retry: false,
    };
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
    // O sufixo do radar é diagnóstico, não decoração. Quando o modelo desiste
    // com "sem fato verificável no momento", as duas causas possíveis são
    // opostas: ou o radar veio vazio e ele teve que descobrir a pauta sozinho
    // pela busca (falha de infraestrutura, GDELT/RSS fora do ar), ou o radar
    // trouxe pauta e ele ainda assim não confirmou em duas fontes (decisão
    // editoral legítima). Sem esse número não dá para distinguir as duas, e
    // os console.warn de discoverStorySignals se perdem enquanto os Workers
    // Logs do site estiverem desligados. Vai no fim da string de propósito:
    // isEditorialSkip casa por prefixo, então a classificação não muda.
    return {
      ok: false,
      error: `${parsed.error} (radar: ${signals.length} pauta${signals.length === 1 ? "" : "s"})`,
      retry: false,
    };
  }

  const { selectedRadarIndex, eventDate, headline, excerpt, body, desk, sourceUrls, fotoTermos } =
    parsed;
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
    // O detalhe vai depois do prefixo (que é o que isEditorialSkip casa) para
    // o aviso da rodada no Actions dizer se o fato era velho ou datado no
    // futuro — em 29/09 duas rodadas de SC pararam aqui sem essa pista.
    const lado = !Number.isFinite(eventTimestamp)
      ? "data inválida"
      : eventTimestamp > now
        ? "datado no futuro"
        : "antigo";
    return {
      ok: false,
      error: `A data do fato está fora da janela editorial de 72h (${lado}: ${String(eventDate).slice(0, 25)} — ${String(headline).slice(0, 90)}).`,
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

  // O radar serve para selecionar a pauta, não para aparecer como fonte. Só
  // persistimos URLs que o modelo realmente abriu durante a apuração.
  const resolvedSourceUrls = submittedSourceUrls.filter((url, index, all) => {
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
      desk: targetChannel.label,
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
  opcoes: { recentes?: string[]; permitirBusca?: boolean } = {},
): Promise<{ ok: true; content: DraftContent } | { ok: false; error: string }> {
  const apiKey = await getRuntimeSecret("GROQ_API_KEY");
  if (
    !apiKey &&
    !(await getRuntimeSecret("GEMINI_API_KEY")) &&
    !(await getRuntimeSecret("ANTHROPIC_API_KEY"))
  ) {
    return { ok: false, error: "Nenhum provedor editorial configurado." };
  }

  // Primeiro o caminho barato: o servidor lê os portais e o modelo só
  // escreve (ver wire-apuracao.ts). null = nenhuma pauta com texto legível.
  const apurada = await apurarNoServidor(apiKey ?? "", beat, opcoes.recentes ?? []);
  if (apurada && apurada.kind === "rascunho") {
    return apurada.result.ok ? apurada.result : { ok: false, error: apurada.result.error };
  }
  // O cron não cai na busca na web: ela custa dez vezes mais e é o que
  // esgotava a cota. A rodada fica sem publicação e a próxima tenta de novo.
  // Só o rascunho manual do Admin (generateArticleDraftAI) ainda usa a busca.
  if (!opcoes.permitirBusca) {
    return {
      ok: false,
      error: `sem fato verificável no momento (apuração: ${apurada?.diagnostico ?? "sem pauta"})`,
    };
  }

  // Só uma retentativa, e só quando a resposta veio com formato quebrado
  // (retry=true) — não faz sentido retentar quando o próprio modelo disse
  // que não achou fato verificável, nem quando a chamada à API falhou.
  if (!apiKey) return { ok: false, error: "Busca editorial manual exige Groq configurada." };
  const signals = await discoverStorySignals(beat);
  const first = await attemptDraft(apiKey, beat, signals);
  if (first.ok || !first.retry) return first;

  const second = await attemptDraft(apiKey, beat, signals);
  return second;
}

// ---------------------------------------------------------------------------
// APURAÇÃO NO SERVIDOR (01/10/2026) — ver o cabeçalho de wire-apuracao.ts.
//
// Feeds com a URL real de cada matéria. O Google Notícias (RSS_FEEDS, acima)
// segue servindo a busca na web do rascunho manual, mas o link dele não se
// abre sem JavaScript — aqui só entram portais que entregam o endereço da
// matéria. Todos conferidos em 01/10/2026: respondem 200 e a página traz o
// texto em <p>. DIARINHO, BC Notícias e Click Camboriú ficam de fora porque
// não publicam RSS aberto (404/403); continuam no radar do Google Notícias.
const G1_FEED = (secao: string) => `https://g1.globo.com/rss/g1/${secao}`;
const FEEDS_DIRETOS: Record<Beat, string[]> = {
  ia: [
    G1_FEED("tecnologia/"),
    "https://canaltech.com.br/rss/",
    "https://olhardigital.com.br/feed/",
    "https://www.cnnbrasil.com.br/feed/",
    "https://exame.com/feed/",
    AGENCIA_BRASIL,
  ],
  clima: [
    G1_FEED("natureza/"),
    G1_FEED("economia/"),
    AGENCIA_BRASIL,
    "https://www.cnnbrasil.com.br/feed/",
    "https://www.infomoney.com.br/feed/",
  ],
  economia: [
    G1_FEED("economia/"),
    "https://www.infomoney.com.br/feed/",
    "https://www.cnnbrasil.com.br/feed/",
    "https://www.poder360.com.br/feed/",
    "https://exame.com/feed/",
    "https://www.estadao.com.br/arc/outboundfeeds/feeds/rss/sections/economia/",
    AGENCIA_BRASIL,
  ],
  geopolitica: [],
  mercado: [],
  sc: [
    "https://ndmais.com.br/feed/",
    "https://www.nsctotal.com.br/rss",
    G1_FEED("sc/"),
    "https://scc10.com.br/feed/",
    "https://www.jornalrazao.com/feed/",
    "https://www.olharsc.com.br/feed/",
    "https://pagina3.com.br/feed/",
    "https://omunicipio.com.br/feed/",
  ],
  veronica: [],
};

// Itajaí, Balneário Camboriú e o litoral norte vão na frente da fila de SC.
const PRIORIDADE_SC =
  /itaja[íi]|balne[áa]rio|cambori[úu]|navegantes|itapema|porto belo|bombinhas|penha|pi[çc]arras|br-?101/i;
// Os portais catarinenses também publicam notícia nacional e internacional
// (eleição, execução nos EUA, moda). Para a editoria SC, a pauta precisa
// citar o estado ou uma cidade dele.
const TERRITORIO_SC =
  /santa catarina|catarinense|\bsc\b|florian[óo]polis|joinville|blumenau|brusque|chapec[óo]|crici[úu]ma|lages|jaragu[áa]|s[ãa]o jos[ée]|palho[çc]a|tubar[ãa]o|rio do sul|gaspar|indaial|guabiruba|conc[óo]rdia|ca[çc]ador|videira|mafra|laguna|imbituba|biguagu|tijucas|garopaba|alto vale|vale do itaja[íi]|grande florian[óo]polis|serra catarinense|oeste catarinense/i;

const UA_DO_WIRE = "VeronicaWire/1.0 (+https://veronicahub.com/blog)";
const JANELA_DA_APURACAO_HORAS = 48;
const PAUTAS_POR_RODADA = 4;
const APURACAO_MAX_TOKENS = 2_000;

async function baixar(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": UA_DO_WIRE, Accept: "text/html,application/xhtml+xml,*/*" },
      signal: AbortSignal.timeout(8_000),
      redirect: "follow",
    });
    return response.ok ? await response.text() : null;
  } catch {
    return null;
  }
}

function candidataNaPauta(beat: Beat, c: Candidata, recentes: string[]): boolean {
  if (!SIGNAL_KEYWORDS[beat].test(c.titulo)) return false;
  if (beat === "sc") {
    if (foraDaPautaSc(c.titulo, c.resumo) || tituloDeIndice(c.titulo)) return false;
    if (!TERRITORIO_SC.test(`${c.titulo} ${c.resumo}`) && !PRIORIDADE_SC.test(c.titulo)) {
      return false;
    }
  } else if (!inEditorialScope(c.titulo, c.dominio)) {
    return false;
  }
  if (beat !== "sc" && fatoForaDoRecorte(c.titulo)) return false;
  return findSimilarHeadline(c.titulo, recentes) === null;
}

type FonteApurada = { candidata: Candidata; texto: string };

type Apuracao =
  { kind: "rascunho"; result: DraftAttemptResult } | { kind: "sem-pauta"; diagnostico: string };

async function apurarNoServidor(apiKey: string, beat: Beat, recentes: string[]): Promise<Apuracao> {
  const feeds = FEEDS_DIRETOS[beat];
  if (feeds.length === 0) return { kind: "sem-pauta", diagnostico: "editoria sem feed direto" };

  const lidos = await Promise.all(feeds.map(async (feed) => lerFeed((await baixar(feed)) ?? "")));
  const candidatas = lidos.flat().filter((c) => candidataNaPauta(beat, c, recentes));
  const pautas = escolherPautas(candidatas, {
    agora: Date.now(),
    janelaHoras: JANELA_DA_APURACAO_HORAS,
    prioridade: beat === "sc" ? PRIORIDADE_SC : undefined,
    limite: PAUTAS_POR_RODADA,
  });

  let tentativasEditorial = 0;
  let ultimaRecusa: DraftAttemptResult | undefined;
  for (const pauta of pautas) {
    const fontes: FonteApurada[] = [];
    for (const candidata of pauta.fontes) {
      const html = await baixar(candidata.url);
      if (!html) continue;
      const texto = extrairTexto(html);
      if (texto.length < TEXTO_MINIMO_POR_FONTE) continue;
      if (!textoCombinaComTitulo(candidata.titulo, texto)) continue;
      fontes.push({ candidata, texto });
    }
    if (fontes.length === 0) continue;
    const result = await escreverComFontes(apiKey, beat, fontes);
    tentativasEditorial++;
    // A fonte pode ser legível e ainda não conter um fato dentro da editoria.
    // Nesse caso, tente uma segunda pauta. Erros de API/qualidade encerram.
    if (tentarOutraPauta(result, tentativasEditorial)) {
      ultimaRecusa = result;
      continue;
    }
    return { kind: "rascunho", result };
  }

  if (ultimaRecusa) return { kind: "rascunho", result: ultimaRecusa };

  return {
    kind: "sem-pauta",
    diagnostico: `${candidatas.length} candidata${candidatas.length === 1 ? "" : "s"}, ${pautas.length} pauta${pautas.length === 1 ? "" : "s"} sem texto legível`,
  };
}

async function escreverComFontes(
  apiKey: string,
  beat: Beat,
  fontes: FonteApurada[],
): Promise<DraftAttemptResult> {
  const targetChannel = scheduledEditorialChannel(beat);
  const escopo =
    beat === "sc"
      ? "ESCOPO: Santa Catarina, com foco em Itajaí, Balneário Camboriú e o litoral norte. PROIBIDO escrever sobre polícia, crime, prisão, acidente, morte ou tragédia."
      : "ESCOPO OBRIGATÓRIO: só publique fato do Brasil ou da China, com prioridade para o Brasil. Fato de outro país só entra quando o efeito brasileiro ou chinês for o assunto.";
  const systemPrompt = `Você é redator do ${WIRE_NAME}, editoria "${BEAT_LABELS[beat]}" (${BEAT_BRIEF[beat]}), canal editorial "${targetChannel.label}" (${targetChannel.description}).
Você NÃO tem busca na web: a apuração já foi feita pelo servidor, que baixou agora o texto ${fontes.length > 1 ? "das fontes" : "da fonte"} abaixo. Escreva UMA matéria usando EXCLUSIVAMENTE esse texto. Não acrescente fato, número, nome, data ou citação que não esteja nele.
Reescreva com suas palavras — não copie frases inteiras — e atribua as informações ao veículo no corpo (ex.: "segundo o ${nomeDoVeiculo(fontes[0].candidata.dominio)}").
${escopo}
Responda apenas com JSON válido neste formato:
{"headline":"manchete direta em português","excerpt":"resumo em 1-2 frases","body":"3 a 5 parágrafos separados por \\n\\n, 900-1300 caracteres no total; abra com o fato completo e inclua dado numérico quando existir; sem opinião ou conclusão genérica","fotoTermos":["english photo term 1","english photo term 2"]}
fotoTermos: 2-3 objetos, lugares ou ambientes fotografáveis, em inglês, sem marcas nem pessoas públicas.
Se o texto não trouxer um fato noticioso dentro da editoria${fontes.length > 1 ? ", ou se as fontes tratarem de fatos diferentes" : ""}, responda {"error":"sem fato verificável no momento"}.`;
  const material = fontes
    .map(
      ({ candidata, texto }, i) =>
        `FONTE ${i + 1} — ${nomeDoVeiculo(candidata.dominio)} (${candidata.url})\nManchete: ${candidata.titulo}\n${texto}`,
    )
    .join("\n\n");

  let text: string;
  try {
    const generated = await generateText({
      groqModel: DRAFT_MODEL,
      system: systemPrompt,
      messages: [{ role: "user", content: material }],
      maxTokens: APURACAO_MAX_TOKENS,
      json: true,
    });
    text = generated.text;
    // Only provider/model are logged: no source content, prompt or secret.
    console.info("wire: provedor editorial", generated.provider, generated.model);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Falha na redação por IA.",
      retry: false,
    };
  }

  const inicio = [...text.matchAll(/\{\s*"(?:headline|error)"/g)].at(-1)?.index ?? -1;
  const fim = text.lastIndexOf("}");
  let parsed: Record<string, unknown> | null = null;
  if (inicio !== -1 && fim > inicio) {
    try {
      parsed = JSON.parse(text.slice(inicio, fim + 1)) as Record<string, unknown>;
    } catch {
      parsed = null;
    }
  }
  if (!parsed) {
    console.error(`escreverComFontes(${beat}): sem JSON válido. Trecho: ${text.slice(0, 300)}`);
    return { ok: false, error: "IA não retornou um rascunho válido. Tente de novo.", retry: false };
  }
  if (typeof parsed.error === "string") {
    return {
      ok: false,
      error: `${parsed.error} (apuração: ${fontes.map((f) => f.candidata.dominio).join(" + ")})`,
      retry: false,
    };
  }

  const { headline, excerpt, body, fotoTermos } = parsed;
  if (typeof headline !== "string" || typeof excerpt !== "string" || typeof body !== "string") {
    return { ok: false, error: "IA retornou um formato inesperado. Tente de novo.", retry: false };
  }

  return {
    ok: true,
    content: {
      headline: headline.trim(),
      excerpt: excerpt.trim(),
      body: body.trim(),
      desk: targetChannel.label,
      // As URLs que o servidor abriu, não as que o modelo diz ter aberto.
      sourceUrls: fontes.map((f) => f.candidata.url),
      fotoTermos:
        Array.isArray(fotoTermos) && fotoTermos.every((t) => typeof t === "string")
          ? (fotoTermos as string[]).filter(Boolean).slice(0, 3)
          : [],
    },
  };
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

    const draft = await draftArticleContent(data.beat, { permitirBusca: true });
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

// Prefixo que marca, na biblioteca do Admin, uma imagem disponível como capa
// de uma editoria: wire-banco-<beat>-<o-que-você-quiser>. É convenção de nome
// de arquivo em vez de coluna nova porque o upload do Admin grava o nome do
// arquivo enviado, então dá para curar tudo pelo navegador — que é o único
// caminho disponível para quem não tem terminal.
// A convenção do nome vive em ./cover-bank, que também é usada pelo cron de
// abastecimento e pelos testes; reexportada aqui porque é daqui que a consulta
// do rodízio a lê.
import { LIBRARY_COVER_PREFIX, parseBankCredit, pickRelevantCover } from "./cover-bank";
import type { MateriaParaCapa } from "./cover-scenes";
export { LIBRARY_COVER_PREFIX };

// Capa vinda do banco curado, em vez de busca ao vivo no Pexels/Pixabay.
// Decisão editorial de 13/09: uma foto de banco de imagens escolhida por
// termo em inglês inventado pelo modelo não ilustra, ela finge documentar —
// a matéria sobre a enchente em Telangana saiu com foto de uma rua americana
// com placa "ROAD CLOSED". Imagem curada é assumidamente ilustrativa.
//
// Escolhe a mais antiga que não esteja entre as últimas usadas, o que dá um
// rodízio natural sem precisar de coluna de "última vez usada": a lista de
// exclusão é a mesma antirrepetição de foto que já existia.
async function pickLibraryCover(
  db: ReturnType<typeof getDb>,
  beat: Beat,
  recentPhotoIds: string[],
  // Texto da matéria recém-publicada. É o que faz a capa ser dela e não só da
  // editoria — ver pickRelevantCover, em cover-bank.ts.
  materia: MateriaParaCapa,
): Promise<{ id: string; credit: string | null; term: string | null; relevante: boolean } | null> {
  // Lê a editoria INTEIRA, sem excluir as recentes na consulta. Antes o
  // `notInArray` cortava as últimas 40 no SQL e sobrava pegar a mais antiga —
  // o que basta para rodízio, mas impede escolher por assunto: a foto da cena
  // certa pode estar justamente entre as recentes, e aí ela nem chegava aqui
  // para concorrer. A exclusão continua existindo, agora como preferência
  // dentro de pickRelevantCover, que só repete quando não há alternativa.
  const rows = await db
    .select({ id: mediaImages.id, altText: mediaImages.altText })
    .from(mediaImages)
    .where(like(mediaImages.filename, `${LIBRARY_COVER_PREFIX}${beat}-%`))
    .orderBy(asc(mediaImages.createdAt));

  const escolhida = pickRelevantCover({
    beat,
    materia,
    candidatos: rows,
    usadosRecentemente: recentPhotoIds,
  });
  if (!escolhida) return null;

  // O crédito do fotógrafo sai do altText (a biblioteca não tem coluna para
  // ele) e segue até a coluna photoCredit da matéria. Fotos que alguém subiu
  // à mão pelo Admin não têm crédito nesse formato e devolvem null, o que é
  // correto: não dá para creditar quem não se sabe quem é.
  const row = rows.find((candidato) => candidato.id === escolhida.id);
  return {
    id: escolhida.id,
    credit: parseBankCredit(row?.altText ?? null),
    term: escolhida.term,
    relevante: escolhida.relevante,
  };
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

// Matérias publicadas nas últimas 72h, com o começo do texto — entrada de
// assuntoRepetido (wire-apuracao.ts), que compara os nomes próprios.
async function recentTopics(
  db: ReturnType<typeof getDb>,
): Promise<Array<{ titulo: string; texto: string }>> {
  const rows = await db
    .select({ headline: articles.headline, excerpt: articles.excerpt, body: articles.body })
    .from(articles)
    .where(
      and(
        eq(articles.status, "published"),
        gte(articles.publishedAt, new Date(Date.now() - 72 * 60 * 60 * 1000)),
      ),
    )
    .orderBy(desc(articles.publishedAt))
    .limit(RECENT_HISTORY_LIMIT);
  return rows.map((r) => ({
    titulo: r.headline,
    texto: `${r.headline}. ${r.excerpt}. ${r.body.slice(0, 600)}`,
  }));
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
  // Lidas antes do rascunho: a apuração no servidor já descarta a pauta que
  // repetiria uma manchete recente, sem gastar a chamada ao modelo.
  const recentes = await recentHeadlines(db);
  const draft = await draftArticleContent(beat, { recentes });
  if (!draft.ok) return draft;

  // O radar já filtra, mas o modelo pode achar outra pauta pela busca.
  if (beat === "sc" && foraDaPautaSc(draft.content.headline, draft.content.excerpt)) {
    return { ok: false, error: `${RECUSA_PAUTA_SC}: ${draft.content.headline}` };
  }

  const quality = validateDraftForPublish(draft.content);
  if (!quality.ok) return quality;

  const similar = findSimilarHeadline(draft.content.headline, recentes);
  if (similar) {
    return {
      ok: false,
      error: `Manchete parecida demais com uma publicação recente: "${similar}".`,
    };
  }

  // A manchete pode ser outra e o fato, o mesmo (ver assuntoRepetido).
  const repetido = assuntoRepetido(
    `${draft.content.headline}. ${draft.content.excerpt}. ${draft.content.body}`,
    await recentTopics(db),
  );
  if (repetido) {
    return { ok: false, error: `Assunto repetido de uma publicação recente: "${repetido}".` };
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
      // Imagem escolhida no banco curado da biblioteca, com o crédito do
      // fotógrafo (Pexels ou Pixabay). Null quando a editoria ainda não tem
      // nenhuma cadastrada — aí o workflow gera a arte própria da matéria
      // (scripts/render-cover-art.mjs).
      //
      // `term` é a cena da foto e `relevante` diz se ela foi escolhida por
      // casar com o texto da matéria (true) ou se caiu no rodízio da editoria
      // (false). Os dois sobem até o resumo do workflow: é como se enxerga,
      // sem abrir o site, quantas capas do dia realmente fazem jus à matéria.
      libraryCover: {
        id: string;
        credit: string | null;
        term: string | null;
        relevante: boolean;
      } | null;
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

  // Lido uma vez só: serve tanto para o workflow excluir fotos repetidas
  // quanto para o rodízio do banco curado logo abaixo.
  const recentPhotoIds = await recentCoverPhotoIds(db);

  return {
    ok: true,
    article: mapArticle(row),
    fotoTermos: result.content.fotoTermos,
    recentPhotoIds,
    libraryCover: await pickLibraryCover(db, beat, recentPhotoIds, {
      headline: result.content.headline,
      excerpt: result.content.excerpt,
      fotoTermos: result.content.fotoTermos,
    }),
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
    let instagram = null;
    if (data.status === "published" && row.coverImageUrl) {
      try {
        const { publishArticleBySlugToInstagram } = await import("./instagram-publisher.server");
        instagram = await publishArticleBySlugToInstagram(row.slug, { automatic: true });
      } catch (error) {
        instagram = {
          ok: false as const,
          error:
            error instanceof Error ? error.message : "Falha ao encaminhar a matéria ao Instagram.",
        };
      }
    }
    return { ok: true as const, article: mapArticle(row), instagram };
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
