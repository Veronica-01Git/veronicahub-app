// Publica o card da matéria da Wire TV na Página do Facebook do Wire.
//
// Mesmo desenho do Instagram (instagram-publisher.server.ts): trava dupla —
// só publica sozinho com META_FACEBOOK_AUTOPUBLISH=true e procura o link da
// matéria nos posts da Página antes de criar outro — e qualquer erro vira
// resultado, nunca exceção, para não derrubar a rodada do workflow.
//
// Reaproveita o que o workflow já gera: o card 1080×1350
// (public/images/instagram/wire-tv-<slug>.jpg) e a legenda ao lado dele
// (.txt, montada por buildWireCaption). No Facebook o link da legenda é
// clicável, então ele fica; a linha solta do @ do Instagram sai.

import { buildWireCaption, WIRE_INSTAGRAM_HANDLE } from "./wire-instagram-card";
import {
  booleanEnv,
  canonicalArticleUrl,
  checkCardImage,
  graphVersionFromEnv,
  loadPublishedWireArticle,
  metaGraphRequest,
  notRun,
  summarizeDryRun,
  type FetchLike,
  type LoadWireArticle,
  type MetaDryRunReport,
  type WireArticle,
} from "./meta-graph.server";

const GRAPH_HOST = "graph.facebook.com";
const MAX_CAPTION_TXT_BYTES = 20_000;
const SIGNATURE = "Wire TV · Veronica Hub";

type FacebookConfig = {
  pageId: string;
  pageToken: string;
  graphVersion: string;
  autoPublishEnabled: boolean;
};

type FacebookPost = {
  id: string;
  message?: string;
  permalink_url?: string;
  created_time?: string;
};

export type FacebookPublishResult =
  | {
      ok: true;
      skipped: true;
      reason: "disabled" | "already-published";
      permalink: string | null;
    }
  | {
      ok: true;
      skipped: false;
      postId: string;
      permalink: string | null;
    }
  | { ok: false; error: string };

export type FacebookPublisherDeps = {
  fetch: FetchLike;
  loadArticle: LoadWireArticle;
};

const defaultDeps: FacebookPublisherDeps = {
  fetch: (input, init) => fetch(input, init),
  loadArticle: loadPublishedWireArticle,
};

export function readFacebookConfig(): { config: FacebookConfig | null; missing: string[] } {
  const pageId = process.env.META_FACEBOOK_PAGE_ID?.trim() ?? "";
  const pageToken = process.env.META_FACEBOOK_PAGE_TOKEN?.trim() ?? "";
  const missing: string[] = [];
  if (!pageId) missing.push("META_FACEBOOK_PAGE_ID");
  if (!pageToken) missing.push("META_FACEBOOK_PAGE_TOKEN");
  return {
    config:
      missing.length === 0
        ? {
            pageId,
            pageToken,
            graphVersion: graphVersionFromEnv(),
            autoPublishEnabled: booleanEnv(process.env.META_FACEBOOK_AUTOPUBLISH),
          }
        : null,
    missing,
  };
}

function graphUrl(graphVersion: string, path: string): string {
  return `https://${GRAPH_HOST}/${graphVersion}/${path.replace(/^\/+/, "")}`;
}

function photosEndpoint(config: Pick<FacebookConfig, "graphVersion" | "pageId">): string {
  return graphUrl(config.graphVersion, `${config.pageId}/photos`);
}

/**
 * Legenda do Instagram → legenda da Página: tira a linha que é só o @ (no
 * Facebook ela não leva a lugar nenhum) e assina como Wire TV. Devolve null
 * se o texto não tiver o link canônico — sem ele a trava de duplicidade não
 * encontra o post depois.
 */
export function facebookCaptionFromWireCaption(text: string, canonicalUrl: string): string | null {
  const blocks = text
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter((block) => block && block !== WIRE_INSTAGRAM_HANDLE);
  const caption = blocks.join("\n\n");
  if (!caption.includes(canonicalUrl)) return null;
  return `${caption}\n\n${SIGNATURE}`;
}

export function buildFacebookCaption(article: WireArticle): string {
  const canonicalUrl = canonicalArticleUrl(article.slug);
  const wire = buildWireCaption({
    headline: article.headline,
    excerpt: article.excerpt,
    canonicalUrl,
    photoCredit: article.coverPhotoCredit,
  });
  // buildWireCaption sempre inclui o link, então o null aqui não acontece.
  return facebookCaptionFromWireCaption(wire, canonicalUrl) ?? wire;
}

/** card wire-tv-<slug>.jpg → legenda wire-tv-<slug>.txt, no mesmo diretório. */
export function captionUrlForCard(cardUrl: string): string {
  return cardUrl.replace(/\.jpg$/, ".txt");
}

async function resolveCaption(
  cardUrl: string,
  article: WireArticle,
  deps: FacebookPublisherDeps,
): Promise<{ caption: string; source: "card-txt" | "article" }> {
  const canonicalUrl = canonicalArticleUrl(article.slug);
  try {
    const response = await deps.fetch(captionUrlForCard(cardUrl), {
      signal: AbortSignal.timeout(10_000),
    });
    if (response.status === 200) {
      const text = (await response.text()).slice(0, MAX_CAPTION_TXT_BYTES);
      const caption = facebookCaptionFromWireCaption(text, canonicalUrl);
      if (caption) return { caption, source: "card-txt" };
    } else {
      await response.body?.cancel().catch(() => undefined);
    }
  } catch {
    // Sem a legenda pronta, monta a mesma a partir da matéria no banco.
  }
  return { caption: buildFacebookCaption(article), source: "article" };
}

/** O token precisa ser DA Página: com token de Página, /me é a própria Página. */
async function assertPageToken(
  config: FacebookConfig,
  deps: FacebookPublisherDeps,
): Promise<{ name: string | null }> {
  const me = await metaGraphRequest<{ id?: string; name?: string }>(
    deps.fetch,
    config.pageToken,
    graphUrl(config.graphVersion, "me?fields=id,name"),
  );
  if (me.id !== config.pageId) {
    throw new Error("A credencial não é um token da Página configurada em META_FACEBOOK_PAGE_ID.");
  }
  return { name: me.name ?? null };
}

async function findExistingPost(
  config: FacebookConfig,
  canonicalUrl: string,
  deps: FacebookPublisherDeps,
): Promise<FacebookPost | null> {
  const fields = encodeURIComponent("id,message,permalink_url,created_time");
  let after: string | null = null;
  for (let page = 0; page < 5; page += 1) {
    const cursor: string = after ? `&after=${encodeURIComponent(after)}` : "";
    const payload: {
      data?: FacebookPost[];
      paging?: { cursors?: { after?: string } };
    } = await metaGraphRequest(
      deps.fetch,
      config.pageToken,
      graphUrl(
        config.graphVersion,
        `${config.pageId}/published_posts?fields=${fields}&limit=100${cursor}`,
      ),
    );
    const existing = payload.data?.find((post) => post.message?.includes(canonicalUrl));
    if (existing) return existing;
    after = payload.paging?.cursors?.after ?? null;
    if (!after || !payload.data?.length) break;
  }
  return null;
}

export async function publishArticleBySlugToFacebook(
  slug: string,
  options: { imageUrl: string; automatic?: boolean },
  deps: FacebookPublisherDeps = defaultDeps,
): Promise<FacebookPublishResult> {
  const { config, missing } = readFacebookConfig();
  if (!config) {
    return { ok: false, error: `Conexão com a Página incompleta: ${missing.join(", ")}.` };
  }
  // Antes de qualquer rede: com o autopost desligado, a rodada não toca na Meta.
  if (options.automatic && !config.autoPublishEnabled) {
    return { ok: true, skipped: true, reason: "disabled", permalink: null };
  }

  try {
    const article = await deps.loadArticle(slug);
    if (!article) return { ok: false, error: "Matéria publicada não encontrada." };

    const image = await checkCardImage(options.imageUrl, deps.fetch);
    if (!image.ok) return { ok: false, error: image.error ?? "Card indisponível." };

    await assertPageToken(config, deps);
    const canonicalUrl = canonicalArticleUrl(article.slug);
    const existing = await findExistingPost(config, canonicalUrl, deps);
    if (existing) {
      return {
        ok: true,
        skipped: true,
        reason: "already-published",
        permalink: existing.permalink_url ?? null,
      };
    }

    const { caption } = await resolveCaption(options.imageUrl, article, deps);
    const body = new URLSearchParams({ url: options.imageUrl, caption, published: "true" });
    const photo = await metaGraphRequest<{ id?: string; post_id?: string }>(
      deps.fetch,
      config.pageToken,
      photosEndpoint(config),
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      },
    );
    const postId = photo.post_id ?? photo.id;
    if (!postId) throw new Error("A Meta não confirmou a publicação na Página.");

    const post = await metaGraphRequest<{ permalink_url?: string }>(
      deps.fetch,
      config.pageToken,
      graphUrl(config.graphVersion, `${postId}?fields=permalink_url`),
    ).catch(() => ({ permalink_url: undefined }));
    return { ok: true, skipped: false, postId, permalink: post.permalink_url ?? null };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Falha ao publicar na Página do Facebook.",
    };
  }
}

/** ?dryRun=1: valida segredos, card e duplicidade e mostra o payload, sem postar. */
export async function dryRunFacebookPublication(
  slug: string,
  options: { imageUrl: string },
  deps: FacebookPublisherDeps = defaultDeps,
): Promise<MetaDryRunReport> {
  const { config, missing } = readFacebookConfig();
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

  if (article) {
    const { caption, source } = await resolveCaption(options.imageUrl, article, deps);
    payload = {
      method: "POST",
      endpoint: photosEndpoint({
        graphVersion: config?.graphVersion ?? graphVersionFromEnv(),
        pageId: config?.pageId ?? "{META_FACEBOOK_PAGE_ID}",
      }),
      fields: { url: options.imageUrl, caption, published: "true" },
      captionSource: source,
    };
  }

  if (config) {
    try {
      const { name } = await assertPageToken(config, deps);
      checks.credentials = { ok: true, error: null, account: name };
    } catch (error) {
      checks.credentials = {
        ok: false,
        account: null,
        error: error instanceof Error ? error.message : "Falha ao validar o token da Página.",
      };
    }
    if (checks.credentials.ok && article) {
      try {
        const existing = await findExistingPost(config, canonicalArticleUrl(article.slug), deps);
        checks.duplicate = {
          ok: true,
          error: null,
          alreadyPublished: Boolean(existing),
          permalink: existing?.permalink_url ?? null,
        };
      } catch (error) {
        checks.duplicate = {
          ok: false,
          alreadyPublished: false,
          permalink: null,
          error: error instanceof Error ? error.message : "Falha ao ler os posts da Página.",
        };
      }
    }
  }

  return summarizeDryRun({
    network: "facebook",
    slug,
    autoPublishEnabled: config?.autoPublishEnabled ?? false,
    checks,
    payload,
  });
}
