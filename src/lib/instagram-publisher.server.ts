import { type Beat } from "./beats";
import {
  booleanEnv,
  canonicalArticleUrl,
  checkCardImage,
  DEFAULT_GRAPH_VERSION,
  graphVersionFromEnv,
  loadPublishedWireArticle,
  metaGraphRequest,
  notRun,
  summarizeDryRun,
  WIRE_SITE_URL,
  type FetchLike,
  type LoadWireArticle,
  type MetaDryRunReport,
  type WireArticle,
} from "./meta-graph.server";
import { WIRE_INSTAGRAM_HANDLE } from "./wire-instagram-card";

const SITE_URL = WIRE_SITE_URL;
const DEFAULT_GRAPH_HOST = "graph.facebook.com";
const PROFILE_USERNAME = WIRE_INSTAGRAM_HANDLE.replace(/^@/, "");
const MAX_CAPTION_LENGTH = 2_200;

type InstagramConfig = {
  accountId: string;
  accessToken: string;
  graphHost: "graph.facebook.com" | "graph.instagram.com";
  graphVersion: string;
  autoPublishEnabled: boolean;
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
      reason: "disabled" | "already-published";
      permalink: string | null;
    }
  | {
      ok: true;
      skipped: false;
      mediaId: string;
      permalink: string | null;
    }
  | { ok: false; error: string };

export type InstagramPublisherDeps = {
  fetch: FetchLike;
  loadArticle: LoadWireArticle;
};

const defaultDeps: InstagramPublisherDeps = {
  fetch: (input, init) => fetch(input, init),
  loadArticle: loadPublishedWireArticle,
};

function readInstagramConfig(): { config: InstagramConfig | null; missing: string[] } {
  const accountId = process.env.META_INSTAGRAM_ACCOUNT_ID?.trim() ?? "";
  const accessToken = process.env.META_INSTAGRAM_ACCESS_TOKEN?.trim() ?? "";
  const requestedHost = process.env.META_INSTAGRAM_GRAPH_HOST?.trim() ?? DEFAULT_GRAPH_HOST;
  const graphHost =
    requestedHost === "graph.instagram.com" ? "graph.instagram.com" : DEFAULT_GRAPH_HOST;
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
            graphVersion: graphVersionFromEnv(),
            autoPublishEnabled: booleanEnv(process.env.META_INSTAGRAM_AUTOPUBLISH),
          }
        : null,
    missing,
  };
}

function graphUrl(config: InstagramConfig, path: string): string {
  return `https://${config.graphHost}/${config.graphVersion}/${path.replace(/^\/+/, "")}`;
}

function metaRequest<T>(
  config: InstagramConfig,
  path: string,
  deps: InstagramPublisherDeps,
  init: RequestInit = {},
): Promise<T> {
  return metaGraphRequest<T>(deps.fetch, config.accessToken, graphUrl(config, path), init);
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
    sc: "#SantaCatarina",
    veronica: "#VeronicaHub",
  }[beat];
}

export function buildInstagramCaption(input: {
  slug: string;
  beat: Beat;
  headline: string;
  excerpt: string;
}): string {
  const canonicalUrl = `${SITE_URL}/blog/${input.slug}`;
  const footer = `\n\nLeia a matéria completa: ${canonicalUrl}\n\nWire TV · Veronica Hub\n${WIRE_INSTAGRAM_HANDLE}\n\n#WireTV #VeronicaHub ${topicHashtag(input.beat)}`;
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
  deps: InstagramPublisherDeps,
): Promise<InstagramMedia | null> {
  const fields = encodeURIComponent("id,caption,permalink,timestamp");
  let after: string | null = null;
  for (let page = 0; page < 5; page += 1) {
    const cursor: string = after ? `&after=${encodeURIComponent(after)}` : "";
    const payload: {
      data?: InstagramMedia[];
      paging?: { cursors?: { after?: string } };
    } = await metaRequest(
      config,
      `${config.accountId}/media?fields=${fields}&limit=100${cursor}`,
      deps,
    );
    const existing = payload.data?.find((media: InstagramMedia) =>
      media.caption?.includes(canonicalUrl),
    );
    if (existing) return existing;
    after = payload.paging?.cursors?.after ?? null;
    if (!after || !payload.data?.length) break;
  }
  return null;
}

async function waitForContainer(
  config: InstagramConfig,
  containerId: string,
  deps: InstagramPublisherDeps,
): Promise<void> {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const payload = await metaRequest<{ status_code?: string }>(
      config,
      `${containerId}?fields=status_code`,
      deps,
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

async function assertTargetAccount(
  config: InstagramConfig,
  deps: InstagramPublisherDeps = defaultDeps,
): Promise<{ username: string | null }> {
  const payload = await metaRequest<{ id: string; username?: string }>(
    config,
    `${config.accountId}?fields=id,username`,
    deps,
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

function publicationImageFor(article: WireArticle, imageUrl?: string): string | null {
  const value = imageUrl ?? article.coverImageUrl;
  return value ? publicImageUrl(value) : null;
}

export async function publishArticleBySlugToInstagram(
  slug: string,
  options?: { automatic?: boolean; imageUrl?: string },
  deps: InstagramPublisherDeps = defaultDeps,
): Promise<InstagramPublishResult> {
  const { config, missing } = readInstagramConfig();
  if (!config) {
    return { ok: false, error: `Conexão Meta incompleta: ${missing.join(", ")}.` };
  }
  // Antes de qualquer rede: com o autopost desligado, a rodada não toca na Meta.
  if (options?.automatic && !config.autoPublishEnabled) {
    return { ok: true, skipped: true, reason: "disabled", permalink: null };
  }

  try {
    const article = await deps.loadArticle(slug);
    if (!article) return { ok: false, error: "Matéria publicada não encontrada." };
    const imageUrl = publicationImageFor(article, options?.imageUrl);
    if (!imageUrl) {
      return {
        ok: false,
        error: "A matéria precisa de uma capa pública antes de ir ao Instagram.",
      };
    }
    // A Meta baixa a imagem pela URL e só aceita JPEG; conferir antes dá
    // motivo legível quando o deploy ainda não publicou o card.
    const image = await checkCardImage(imageUrl, deps.fetch);
    if (!image.ok) return { ok: false, error: image.error ?? "Card indisponível." };

    await assertTargetAccount(config, deps);
    const existing = await findExistingPublication(config, canonicalArticleUrl(article.slug), deps);
    if (existing) {
      return {
        ok: true,
        skipped: true,
        reason: "already-published",
        permalink: existing.permalink ?? null,
      };
    }

    const body = new URLSearchParams({
      image_url: imageUrl,
      caption: buildInstagramCaption(article),
    });
    const container = await metaRequest<{ id?: string }>(
      config,
      `${config.accountId}/media`,
      deps,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      },
    );
    if (!container.id) throw new Error("A Meta não devolveu o identificador do card.");

    await waitForContainer(config, container.id, deps);
    const publishBody = new URLSearchParams({ creation_id: container.id });
    const publication = await metaRequest<{ id?: string }>(
      config,
      `${config.accountId}/media_publish`,
      deps,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: publishBody,
      },
    );
    if (!publication.id) throw new Error("A Meta não confirmou a publicação.");

    const media = await metaRequest<{ permalink?: string }>(
      config,
      `${publication.id}?fields=permalink`,
      deps,
    ).catch(() => ({ permalink: undefined }));
    return {
      ok: true,
      skipped: false,
      mediaId: publication.id,
      permalink: media.permalink ?? null,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Falha ao publicar no Instagram.",
    };
  }
}

/** ?dryRun=1: valida segredos, card e duplicidade e mostra o payload, sem postar. */
export async function dryRunInstagramPublication(
  slug: string,
  options: { imageUrl: string },
  deps: InstagramPublisherDeps = defaultDeps,
): Promise<MetaDryRunReport> {
  const { config, missing } = readInstagramConfig();
  const pending = notRun("Não verificado: faltam segredos ou a matéria.");
  const checks: MetaDryRunReport["checks"] = {
    config: {
      ok: missing.length === 0,
      missing,
      error: missing.length ? `Faltam: ${missing.join(", ")}.` : null,
    },
    article: pending,
    image: await checkCardImage(options.imageUrl, deps.fetch),
    credentials: { ...pending, account: null },
    duplicate: { ...pending, alreadyPublished: false, permalink: null },
  };
  let payload: MetaDryRunReport["payload"] = null;

  let article: WireArticle | null = null;
  try {
    article = await deps.loadArticle(slug);
    checks.article = article
      ? { ok: true, error: null }
      : { ok: false, error: "Matéria publicada não encontrada." };
  } catch (error) {
    checks.article = {
      ok: false,
      error: error instanceof Error ? error.message : "Falha ao ler a matéria.",
    };
  }

  const graphHost = config?.graphHost ?? DEFAULT_GRAPH_HOST;
  const graphVersion = config?.graphVersion ?? graphVersionFromEnv();
  if (article) {
    payload = {
      method: "POST",
      endpoint: `https://${graphHost}/${graphVersion}/${
        config?.accountId ?? "{META_INSTAGRAM_ACCOUNT_ID}"
      }/media`,
      fields: { image_url: options.imageUrl, caption: buildInstagramCaption(article) },
    };
  }

  if (config) {
    try {
      const { username } = await assertTargetAccount(config, deps);
      checks.credentials = { ok: true, error: null, account: username ? `@${username}` : null };
    } catch (error) {
      checks.credentials = {
        ok: false,
        account: null,
        error: error instanceof Error ? error.message : "Falha ao validar a conta do Instagram.",
      };
    }
    if (checks.credentials.ok && article) {
      try {
        const existing = await findExistingPublication(
          config,
          canonicalArticleUrl(article.slug),
          deps,
        );
        checks.duplicate = {
          ok: true,
          error: null,
          alreadyPublished: Boolean(existing),
          permalink: existing?.permalink ?? null,
        };
      } catch (error) {
        checks.duplicate = {
          ok: false,
          alreadyPublished: false,
          permalink: null,
          error: error instanceof Error ? error.message : "Falha ao ler os posts do Instagram.",
        };
      }
    }
  }

  return summarizeDryRun({
    network: "instagram",
    slug,
    autoPublishEnabled: config?.autoPublishEnabled ?? false,
    checks,
    payload,
  });
}
