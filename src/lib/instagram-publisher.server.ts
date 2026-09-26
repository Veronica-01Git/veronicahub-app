import { and, eq, inArray } from "drizzle-orm";
import { type Beat } from "./beats";
import { getDb } from "./db";
import { articles } from "./schema";
import { WIRE_INSTAGRAM_HANDLE } from "./wire-instagram-card";
import {
  INSTAGRAM_BEAT_COOLDOWN_HOURS,
  claimInstagramBeat,
  completeInstagramBeat,
  markInstagramPublishAttempt,
  reconcileExistingInstagramPost,
  releaseInstagramBeat,
  rememberInstagramBeatPost,
} from "./instagram-beat-gate.server";

const SITE_URL = "https://veronicahub.com";
const DEFAULT_GRAPH_HOST = "graph.facebook.com";
const DEFAULT_GRAPH_VERSION = "v24.0";
const PROFILE_USERNAME = WIRE_INSTAGRAM_HANDLE.replace(/^@/, "");
const MAX_CAPTION_LENGTH = 2_200;

type InstagramConfig = {
  accountId: string;
  accessToken: string;
  graphHost: "graph.facebook.com" | "graph.instagram.com";
  graphVersion: string;
  autoPublishEnabled: boolean;
};

type MetaErrorPayload = {
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
  };
};

type InstagramMedia = {
  id: string;
  caption?: string;
  permalink?: string;
  timestamp?: string;
};

export type InstagramPublishResult =
  | {
      ok: true;
      skipped: true;
      reason: "disabled" | "already-published" | "topic-cycle";
      permalink: string | null;
    }
  | {
      ok: true;
      skipped: false;
      mediaId: string;
      permalink: string | null;
    }
  | { ok: false; error: string };

function booleanEnv(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === "true";
}

function readInstagramConfig(): { config: InstagramConfig | null; missing: string[] } {
  const accountId = process.env.META_INSTAGRAM_ACCOUNT_ID?.trim() ?? "";
  const accessToken = process.env.META_INSTAGRAM_ACCESS_TOKEN?.trim() ?? "";
  const requestedHost = process.env.META_INSTAGRAM_GRAPH_HOST?.trim() ?? DEFAULT_GRAPH_HOST;
  const graphHost =
    requestedHost === "graph.instagram.com" ? "graph.instagram.com" : DEFAULT_GRAPH_HOST;
  const requestedVersion = process.env.META_GRAPH_API_VERSION?.trim() ?? DEFAULT_GRAPH_VERSION;
  const graphVersion = /^v\d+\.\d+$/.test(requestedVersion)
    ? requestedVersion
    : DEFAULT_GRAPH_VERSION;
  const missing: string[] = [];
  if (!accountId) missing.push("META_INSTAGRAM_ACCOUNT_ID");
  if (!accessToken) missing.push("META_INSTAGRAM_ACCESS_TOKEN");

  return {
    config:
      missing.length === 0
        ? {
            accountId,
            accessToken,
            graphHost,
            graphVersion,
            autoPublishEnabled: booleanEnv(process.env.META_INSTAGRAM_AUTOPUBLISH),
          }
        : null,
    missing,
  };
}

function graphUrl(config: InstagramConfig, path: string): string {
  return `https://${config.graphHost}/${config.graphVersion}/${path.replace(/^\/+/, "")}`;
}

function sanitizedMetaMessage(payload: MetaErrorPayload, status: number): string {
  const message = payload.error?.message?.replace(/access[_ ]token/gi, "credencial")?.slice(0, 240);
  const code = payload.error?.code ? ` · código ${payload.error.code}` : "";
  return message ? `${message}${code}` : `A Meta recusou a operação (HTTP ${status}).`;
}

async function metaRequest<T>(
  config: InstagramConfig,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${config.accessToken}`);
  const response = await fetch(graphUrl(config, path), {
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

function publicImageUrl(value: string): string {
  const url = new URL(value, SITE_URL);
  if (url.protocol !== "https:") throw new Error("A capa precisa usar uma URL pública HTTPS.");
  return url.toString();
}

function topicHashtag(beat: Beat): string {
  return {
    ia: "#InteligenciaArtificial",
    clima: "#Clima",
    economia: "#Economia",
    geopolitica: "#Geopolitica",
    mercado: "#Mercado",
  }[beat];
}

export function buildInstagramCaption(input: {
  slug: string;
  beat: Beat;
  headline: string;
  excerpt: string;
  coverPhotoCredit: string | null;
  coverPhotoUrl: string | null;
}): string {
  const canonicalUrl = `${SITE_URL}/blog/${input.slug}`;
  const credit = input.coverPhotoCredit?.trim();
  if (!credit) throw new Error("A capa precisa de crédito editorial antes de ir ao Instagram.");
  const source = input.coverPhotoUrl?.includes("pixabay.com")
    ? "Pixabay"
    : input.coverPhotoUrl?.includes("pexels.com")
      ? "Pexels"
      : null;
  const attribution = /^Ilustração gerada por IA/i.test(credit)
    ? credit
    : `Imagem ilustrativa · ${credit}${source ? ` / ${source}` : ""}`;
  const footer = `\n\n${attribution}\n\nLeia a matéria completa: ${canonicalUrl}\n\nWire TV · Veronica Hub\n${WIRE_INSTAGRAM_HANDLE}\n\n#WireTV #VeronicaHub ${topicHashtag(input.beat)}`;
  const available = Math.max(0, MAX_CAPTION_LENGTH - footer.length - input.headline.length - 4);
  const excerpt =
    input.excerpt.length <= available
      ? input.excerpt
      : `${input.excerpt.slice(0, Math.max(0, available - 1)).trimEnd()}…`;
  return `${input.headline}\n\n${excerpt}${footer}`;
}

async function findExistingPublication(
  config: InstagramConfig,
  canonicalUrl: string,
): Promise<InstagramMedia | null> {
  const fields = encodeURIComponent("id,caption,permalink,timestamp");
  let after: string | null = null;
  for (let page = 0; page < 5; page += 1) {
    const cursor: string = after ? `&after=${encodeURIComponent(after)}` : "";
    const payload: {
      data?: InstagramMedia[];
      paging?: { cursors?: { after?: string } };
    } = await metaRequest(config, `${config.accountId}/media?fields=${fields}&limit=100${cursor}`);
    const existing = payload.data?.find((media: InstagramMedia) =>
      media.caption?.includes(canonicalUrl),
    );
    if (existing) return existing;
    after = payload.paging?.cursors?.after ?? null;
    if (!after || !payload.data?.length) break;
  }
  return null;
}

async function findRecentPublicationForBeat(
  config: InstagramConfig,
  beat: Beat,
): Promise<InstagramMedia | null> {
  const fields = encodeURIComponent("id,caption,permalink,timestamp");
  const payload = await metaRequest<{ data?: InstagramMedia[] }>(
    config,
    `${config.accountId}/media?fields=${fields}&limit=100`,
  );
  const cutoff = Date.now() - INSTAGRAM_BEAT_COOLDOWN_HOURS * 60 * 60 * 1000;
  const recent = (payload.data ?? []).filter(
    (media) => media.timestamp && Date.parse(media.timestamp) >= cutoff,
  );
  const slugFromCaption = (caption?: string) =>
    /https:\/\/veronicahub\.com\/blog\/([a-z0-9-]+)/.exec(caption ?? "")?.[1] ?? null;
  const slugs = recent
    .map((media) => slugFromCaption(media.caption))
    .filter((s): s is string => !!s);
  if (!slugs.length) return null;
  const known = await getDb()
    .select({ slug: articles.slug })
    .from(articles)
    .where(and(eq(articles.beat, beat), inArray(articles.slug, slugs)));
  const matches = new Set(known.map((row) => row.slug));
  return recent.find((media) => matches.has(slugFromCaption(media.caption) ?? "")) ?? null;
}

async function waitForContainer(config: InstagramConfig, containerId: string): Promise<void> {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const payload = await metaRequest<{ status_code?: string }>(
      config,
      `${containerId}?fields=status_code`,
    );
    const status = payload.status_code?.toUpperCase();
    if (!status || status === "FINISHED") return;
    if (status === "ERROR" || status === "EXPIRED") {
      throw new Error(`A Meta encerrou o card com status ${status}.`);
    }
    await new Promise((resolve) => setTimeout(resolve, 750));
  }
  throw new Error("A Meta ainda está processando a imagem. Tente novamente em instantes.");
}

async function assertTargetAccount(config: InstagramConfig): Promise<{ username: string | null }> {
  const payload = await metaRequest<{ id: string; username?: string }>(
    config,
    `${config.accountId}?fields=id,username`,
  );
  if (payload.id !== config.accountId) {
    throw new Error("A Meta respondeu com uma conta diferente da configurada.");
  }
  const username = payload.username?.replace(/^@/, "").toLowerCase() ?? null;
  if (!username) {
    throw new Error("A Meta não devolveu o usuário da conta; não é seguro publicar ainda.");
  }
  if (username !== PROFILE_USERNAME.toLowerCase()) {
    throw new Error(
      `A credencial pertence a @${username}, mas o destino autorizado é ${WIRE_INSTAGRAM_HANDLE}.`,
    );
  }
  return { username };
}

export async function getInstagramPublisherStatusCore(options?: { probe?: boolean }) {
  const { config, missing } = readInstagramConfig();
  const base = {
    profile: WIRE_INSTAGRAM_HANDLE,
    configured: Boolean(config),
    autoPublishEnabled: config?.autoPublishEnabled ?? false,
    graphHost: config?.graphHost ?? DEFAULT_GRAPH_HOST,
    graphVersion: config?.graphVersion ?? DEFAULT_GRAPH_VERSION,
    missing,
  };
  if (!config || !options?.probe) {
    return {
      ...base,
      connected: false,
      username: null as string | null,
      error: null as string | null,
    };
  }

  try {
    const payload = await assertTargetAccount(config);
    return {
      ...base,
      connected: true,
      username: payload.username,
      error: null,
    };
  } catch (error) {
    return {
      ...base,
      connected: false,
      username: null,
      error: error instanceof Error ? error.message : "Falha ao validar a conexão com a Meta.",
    };
  }
}

export async function publishArticleBySlugToInstagram(
  slug: string,
  options?: { automatic?: boolean; imageUrl?: string },
): Promise<InstagramPublishResult> {
  const { config, missing } = readInstagramConfig();
  if (!config) {
    return { ok: false, error: `Conexão Meta incompleta: ${missing.join(", ")}.` };
  }
  if (options?.automatic && !config.autoPublishEnabled) {
    return { ok: true, skipped: true, reason: "disabled", permalink: null };
  }

  const db = getDb();
  const [article] = await db
    .select({
      slug: articles.slug,
      beat: articles.beat,
      headline: articles.headline,
      excerpt: articles.excerpt,
      coverImageUrl: articles.coverImageUrl,
      coverPhotoCredit: articles.coverPhotoCredit,
      coverPhotoUrl: articles.coverPhotoUrl,
    })
    .from(articles)
    .where(and(eq(articles.slug, slug), eq(articles.status, "published")))
    .limit(1);

  if (!article) return { ok: false, error: "Matéria publicada não encontrada." };
  const publicationImageUrl = options?.imageUrl ?? article.coverImageUrl;
  if (!publicationImageUrl) {
    return { ok: false, error: "A matéria precisa de uma capa pública antes de ir ao Instagram." };
  }

  const canonicalUrl = `${SITE_URL}/blog/${article.slug}`;
  let claimId: string | null = null;
  let publicationAttempted = false;
  try {
    await assertTargetAccount(config);
    const existing = await findExistingPublication(config, canonicalUrl);
    if (existing) {
      await reconcileExistingInstagramPost(article.beat, article.slug, existing.timestamp);
      if (existing.timestamp) {
        await rememberInstagramBeatPost(article.beat, article.slug, existing.timestamp);
      }
      return {
        ok: true,
        skipped: true,
        reason: "already-published",
        permalink: existing.permalink ?? null,
      };
    }

    const caption = buildInstagramCaption(article);
    const recentBeat = await findRecentPublicationForBeat(config, article.beat);
    if (recentBeat?.timestamp) {
      const previousSlug = /https:\/\/veronicahub\.com\/blog\/([a-z0-9-]+)/.exec(
        recentBeat.caption ?? "",
      )?.[1];
      if (previousSlug) {
        await rememberInstagramBeatPost(article.beat, previousSlug, recentBeat.timestamp);
      }
      return {
        ok: true,
        skipped: true,
        reason: "topic-cycle",
        permalink: recentBeat.permalink ?? null,
      };
    }

    claimId = await claimInstagramBeat(article.beat, article.slug);
    if (!claimId) {
      return { ok: true, skipped: true, reason: "topic-cycle", permalink: null };
    }

    const body = new URLSearchParams({
      image_url: publicImageUrl(publicationImageUrl),
      caption,
    });
    const container = await metaRequest<{ id?: string }>(config, `${config.accountId}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!container.id) throw new Error("A Meta não devolveu o identificador do card.");

    await waitForContainer(config, container.id);
    const publishBody = new URLSearchParams({ creation_id: container.id });
    await markInstagramPublishAttempt(article.beat, claimId);
    publicationAttempted = true;
    const publication = await metaRequest<{ id?: string }>(
      config,
      `${config.accountId}/media_publish`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: publishBody,
      },
    );
    if (!publication.id) throw new Error("A Meta não confirmou a publicação.");

    await completeInstagramBeat(article.beat, article.slug, claimId);

    const media = await metaRequest<{ permalink?: string }>(
      config,
      `${publication.id}?fields=permalink`,
    ).catch(() => ({ permalink: undefined }));
    return {
      ok: true,
      skipped: false,
      mediaId: publication.id,
      permalink: media.permalink ?? null,
    };
  } catch (error) {
    if (claimId && !publicationAttempted) {
      await releaseInstagramBeat(article.beat, claimId).catch(() => {});
    }
    return {
      ok: false,
      error: `${error instanceof Error ? error.message : "Falha ao publicar no Instagram."}${publicationAttempted ? " Confira @wire__tv antes de tentar novamente; o resultado pode ter sido publicado." : ""}`,
    };
  }
}
