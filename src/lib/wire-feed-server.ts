import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "./db";
import { articles } from "./schema";
import type { Beat } from "./beats";
import { sourceDomain } from "./editorial-network";

// Feed público, somente leitura, do Veronica Wire. Chamado direto do
// src/server.ts (interceptado antes do handler do TanStack), mesmo padrão do
// sitemap e do RSS: precisa de URL fixa (/api/wire/feed.json) pra ser
// consumida de fora, o que a URL de RPC do createServerFn não permite.
//
// O contrato é o que está em WireFeedMateria e nada além disso. Campos
// internos da tabela Article — status, aiGenerated, autoPublished, desk,
// coverImageData, coverPhotoId, createdAt, updatedAt — NÃO entram aqui:
// dizem respeito ao processo de produção, não ao que foi publicado. Quem
// mexer no retorno mantém essa linha; o teste em tests/wire-feed.test.mjs
// falha se um campo novo escapar.

const SITE_URL = "https://veronicahub.com";

const FEED_LIMIT = 50;

/** Cinco minutos, no navegador e na borda. */
const CACHE_SECONDS = 300;

// Editoria publicada ≠ nome da coluna. "mercado" é o rótulo interno do
// Mercado Tecnológico Global (ver BEAT_LABELS); no feed ele sai como "tech",
// que é o nome combinado com quem consome. As outras quatro coincidem.
export const EDITORIA_PUBLICA = {
  ia: "ia",
  clima: "clima",
  economia: "economia",
  geopolitica: "geopolitica",
  mercado: "tech",
} as const satisfies Record<Beat, string>;

export type WireFeedEditoria = (typeof EDITORIA_PUBLICA)[Beat];

export type WireFeedFonte = {
  dominio: string;
  url: string;
};

export type WireFeedMateria = {
  id: string;
  slug: string;
  titulo: string;
  resumo: string;
  corpoHtml: string;
  editoria: WireFeedEditoria;
  capaUrl: string | null;
  capaCredito: string | null;
  fontes: WireFeedFonte[];
  publicadoEm: string | null;
  urlOriginal: string;
};

export type WireFeedBriefing = {
  data: string;
  audioUrl: string;
  duracaoSeg: number;
  transcricao: string;
};

export type WireFeed = {
  atualizadoEm: string;
  briefing: WireFeedBriefing | null;
  materias: WireFeedMateria[];
};

// Só as colunas que o contrato usa. Evita trazer coverImageData (base64 de
// uma imagem inteira) em cinquenta linhas de uma vez: a presença basta pra
// montar a URL de /api/cover-image/:slug.
const COLUNAS_PUBLICAS = {
  id: articles.id,
  slug: articles.slug,
  beat: articles.beat,
  headline: articles.headline,
  excerpt: articles.excerpt,
  body: articles.body,
  coverImageUrl: articles.coverImageUrl,
  coverPhotoCredit: articles.coverPhotoCredit,
  sourceUrls: articles.sourceUrls,
  publishedAt: articles.publishedAt,
  temCapaEmbutida: sql<boolean>`${articles.coverImageData} is not null`,
};

export type LinhaPublica = {
  id: string;
  slug: string;
  beat: Beat;
  headline: string;
  excerpt: string;
  body: string;
  coverImageUrl: string | null;
  coverPhotoCredit: string | null;
  sourceUrls: string[];
  publishedAt: Date | null;
  temCapaEmbutida: boolean;
};

function escaparHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// O corpo é guardado como texto puro, com parágrafos separados por linha em
// branco (é assim que /blog/$slug renderiza). Quem consome o feed espera
// HTML pronto, então a conversão acontece aqui — e o texto é escapado antes,
// porque nada do que está na coluna é marcação confiável.
function corpoParaHtml(body: string): string {
  return body
    .split(/\n{2,}/)
    .map((paragrafo) => paragrafo.trim())
    .filter(Boolean)
    .map((paragrafo) => `<p>${escaparHtml(paragrafo).replace(/\n/g, "<br />")}</p>`)
    .join("\n");
}

// Capa sempre absoluta: o feed é lido de outro domínio, onde caminho
// relativo não resolve. Quando a capa não é um arquivo do site, os bytes
// estão no Postgres e quem serve é /api/cover-image/:slug (ver
// cover-image-server.ts).
function capaAbsoluta(linha: LinhaPublica): string | null {
  if (linha.coverImageUrl) {
    try {
      return new URL(linha.coverImageUrl, SITE_URL).toString();
    } catch {
      return null;
    }
  }
  if (linha.temCapaEmbutida) {
    return `${SITE_URL}/api/cover-image/${encodeURIComponent(linha.slug)}`;
  }
  return null;
}

export function mapearMateria(linha: LinhaPublica): WireFeedMateria {
  return {
    id: linha.id,
    slug: linha.slug,
    titulo: linha.headline,
    resumo: linha.excerpt,
    corpoHtml: corpoParaHtml(linha.body),
    editoria: EDITORIA_PUBLICA[linha.beat],
    capaUrl: capaAbsoluta(linha),
    capaCredito: linha.coverPhotoCredit,
    fontes: linha.sourceUrls.map((url) => ({ dominio: sourceDomain(url), url })),
    publicadoEm: linha.publishedAt ? linha.publishedAt.toISOString() : null,
    urlOriginal: `${SITE_URL}/blog/${linha.slug}`,
  };
}

function respostaJson(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      // Cinco minutos só no que deu certo. Guardar um 404 por cinco minutos
      // faria uma matéria recém-publicada continuar inexistindo pra quem já
      // tinha pedido o endereço dela.
      "cache-control":
        status === 200 ? `public, max-age=${CACHE_SECONDS}, s-maxage=${CACHE_SECONDS}` : "no-store",
      "access-control-allow-origin": "*",
    },
  });
}

/** Pré-voo do CORS. Rota pública e somente leitura: só GET e HEAD. */
export function handleWireFeedPreflight(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET, HEAD, OPTIONS",
      "access-control-allow-headers": "content-type",
      "access-control-max-age": "86400",
    },
  });
}

export function handleWireFeedMethodNotAllowed(): Response {
  return respostaJson({ erro: "Método não permitido." }, 405);
}

export async function handleWireFeed(): Promise<Response> {
  const db = getDb();
  const linhas = (await db
    .select(COLUNAS_PUBLICAS)
    .from(articles)
    .where(eq(articles.status, "published"))
    .orderBy(desc(articles.publishedAt))
    .limit(FEED_LIMIT)) as LinhaPublica[];

  const feed: WireFeed = {
    atualizadoEm: new Date().toISOString(),
    // Ainda não existe briefing em áudio no Wire. O campo já faz parte do
    // contrato pra que quem consome não precise mudar quando ele existir.
    briefing: null,
    materias: linhas.map(mapearMateria),
  };

  return respostaJson(feed);
}

function extrairSlug(arquivo: string): string | null {
  if (!arquivo.endsWith(".json")) return null;
  const bruto = arquivo.slice(0, -".json".length);
  if (!bruto || bruto.includes("/")) return null;
  try {
    return decodeURIComponent(bruto);
  } catch {
    // Percentagem malformada (%zz) — endereço inválido, não erro do servidor.
    return null;
  }
}

/**
 * `arquivo` é o último segmento do caminho, com a extensão: "clima-x.json".
 * A extensão é parte do contrato — sem ela a resposta é 404, pra não existir
 * um segundo endereço não documentado servindo a mesma matéria.
 */
export async function handleWireMateria(arquivo: string): Promise<Response> {
  const slug = extrairSlug(arquivo);
  if (!slug) {
    return respostaJson({ erro: "Matéria não encontrada." }, 404);
  }

  const db = getDb();
  const [linha] = (await db
    .select(COLUNAS_PUBLICAS)
    .from(articles)
    .where(and(eq(articles.slug, slug), eq(articles.status, "published")))
    .limit(1)) as LinhaPublica[];

  if (!linha) {
    return respostaJson({ erro: "Matéria não encontrada." }, 404);
  }

  return respostaJson(mapearMateria(linha));
}
