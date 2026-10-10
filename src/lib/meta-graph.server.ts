// Peças comuns aos dois publicadores da Wire TV na Meta — Instagram
// (instagram-publisher.server.ts) e Página do Facebook
// (facebook-publisher.server.ts). Fica sem banco e sem import de runtime de
// propósito: os testes carregam este arquivo direto no Node.

import type { Beat } from "./beats";

export const WIRE_SITE_URL = "https://veronicahub.com";
export const DEFAULT_GRAPH_VERSION = "v24.0";

/** Diretório público onde o workflow commita o card e a legenda (.txt). */
export const WIRE_CARD_PATH_PREFIX = "/images/instagram/wire-tv-";

export type MetaErrorPayload = {
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
  };
};

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export function booleanEnv(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === "true";
}

export function graphVersionFromEnv(): string {
  const requested = process.env.META_GRAPH_API_VERSION?.trim() ?? DEFAULT_GRAPH_VERSION;
  return /^v\d+\.\d+$/.test(requested) ? requested : DEFAULT_GRAPH_VERSION;
}

export function sanitizedMetaMessage(payload: MetaErrorPayload, status: number): string {
  const message = payload.error?.message?.replace(/access[_ ]token/gi, "credencial")?.slice(0, 240);
  const code = payload.error?.code ? ` · código ${payload.error.code}` : "";
  return message ? `${message}${code}` : `A Meta recusou a operação (HTTP ${status}).`;
}

/** Endereço canônico da matéria — é a marca usada para achar post repetido. */
export function canonicalArticleUrl(slug: string): string {
  return `${WIRE_SITE_URL}/blog/${slug}`;
}

/**
 * Só aceita o card oficial que o workflow gera e commita:
 * https://veronicahub.com/images/instagram/wire-tv-<slug>.jpg
 */
export function parseWireCardUrl(
  raw: unknown,
): { ok: true; url: string } | { ok: false; error: string } {
  const value = typeof raw === "string" ? raw.trim() : "";
  if (!value) return { ok: false, error: "imageUrl obrigatório" };
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return { ok: false, error: "imageUrl inválida" };
  }
  if (
    parsed.origin !== WIRE_SITE_URL ||
    !parsed.pathname.startsWith(WIRE_CARD_PATH_PREFIX) ||
    !parsed.pathname.endsWith(".jpg")
  ) {
    return { ok: false, error: "imageUrl fora do diretório oficial da Wire TV" };
  }
  return { ok: true, url: parsed.toString() };
}

/** ?dryRun=1 (ou true): monta e valida tudo, não publica nada. */
export function isDryRunRequest(request: Request): boolean {
  const value = new URL(request.url).searchParams.get("dryRun")?.trim().toLowerCase();
  return value === "1" || value === "true";
}

export type CardImageCheck = {
  ok: boolean;
  url: string;
  status: number | null;
  contentType: string | null;
  error: string | null;
};

/**
 * A Meta baixa a imagem pela URL; se o deploy ainda não publicou o card, ou se
 * o endereço devolver HTML, o post falha do lado dela com erro genérico.
 * Conferir aqui antes dá um motivo legível e não gasta chamada na Meta.
 */
export async function checkCardImage(
  url: string,
  fetchImpl: FetchLike = fetch,
): Promise<CardImageCheck> {
  try {
    const response = await fetchImpl(url, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(15_000),
    });
    await response.body?.cancel().catch(() => undefined);
    const contentType = response.headers.get("content-type");
    const mime = contentType?.split(";")[0].trim().toLowerCase() ?? null;
    if (response.status !== 200) {
      return {
        ok: false,
        url,
        status: response.status,
        contentType,
        error: `O card respondeu HTTP ${response.status}; esperado 200.`,
      };
    }
    if (mime !== "image/jpeg") {
      return {
        ok: false,
        url,
        status: response.status,
        contentType,
        error: `O card respondeu ${contentType ?? "sem content-type"}; esperado image/jpeg.`,
      };
    }
    return { ok: true, url, status: response.status, contentType, error: null };
  } catch (error) {
    return {
      ok: false,
      url,
      status: null,
      contentType: null,
      error:
        error instanceof Error
          ? `Falha ao baixar o card: ${error.message}`
          : "Falha ao baixar o card.",
    };
  }
}

export type WireArticle = {
  slug: string;
  beat: Beat;
  headline: string;
  excerpt: string;
  coverImageUrl: string | null;
  coverPhotoCredit: string | null;
};

export type LoadWireArticle = (slug: string) => Promise<WireArticle | null>;

/** Matéria publicada pelo slug. Import tardio: o banco só carrega no Worker. */
export const loadPublishedWireArticle: LoadWireArticle = async (slug) => {
  const { findPublishedWireArticle } = await import("./wire-article-lookup.server");
  return findPublishedWireArticle(slug);
};

/**
 * Chamada ao Graph com a credencial no cabeçalho (nunca na URL, para não ir
 * parar em log). Erro da Meta vira mensagem curta, sem a palavra do token.
 */
export async function metaGraphRequest<T>(
  fetchImpl: FetchLike,
  accessToken: string,
  url: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${accessToken}`);
  const response = await fetchImpl(url, {
    ...init,
    headers,
    signal: AbortSignal.timeout(20_000),
  });
  const payload = (await response.json().catch(() => ({}))) as T & MetaErrorPayload;
  if (!response.ok || payload.error) {
    throw new Error(sanitizedMetaMessage(payload, response.status));
  }
  return payload;
}

type Check = { ok: boolean; error: string | null };

/**
 * Resposta do ?dryRun=1, igual para Instagram e Facebook. Nada aqui carrega
 * credencial: o payload mostra o endpoint e os campos que iriam para a Meta.
 */
export type MetaDryRunReport = {
  ok: boolean;
  dryRun: true;
  network: "instagram" | "facebook";
  slug: string;
  autoPublishEnabled: boolean;
  /** true só quando a rodada automática do workflow publicaria de fato. */
  wouldPublish: boolean;
  checks: {
    config: Check & { missing: string[] };
    article: Check;
    image: CardImageCheck;
    credentials: Check & { account: string | null };
    duplicate: Check & { alreadyPublished: boolean; permalink: string | null };
  };
  payload: {
    method: "POST";
    endpoint: string;
    fields: Record<string, string>;
    /** De onde veio a legenda: o .txt do card ou a matéria no banco. */
    captionSource?: "card-txt" | "article";
  } | null;
};

export function summarizeDryRun(
  report: Omit<MetaDryRunReport, "ok" | "wouldPublish" | "dryRun">,
): MetaDryRunReport {
  const { checks } = report;
  const ok =
    checks.config.ok &&
    checks.article.ok &&
    checks.image.ok &&
    checks.credentials.ok &&
    checks.duplicate.ok &&
    report.payload !== null;
  return {
    ...report,
    ok,
    dryRun: true,
    wouldPublish: ok && report.autoPublishEnabled && !checks.duplicate.alreadyPublished,
  };
}

export function notRun(reason: string): Check {
  return { ok: false, error: reason };
}
