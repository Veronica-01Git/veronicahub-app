import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { handleMercadoPagoWebhook } from "./lib/mercadopago-webhook";
import { handleImageTransform } from "./lib/image-transform-server";
import { handleSitemap, handleRssFeed } from "./lib/seo-feed";
import {
  handleBackfillWireCoversCron,
  handleGenerateArticleCron,
  handleSetCoverImageCron,
} from "./lib/article-cron";
import { handleCoverImage } from "./lib/cover-image-server";
import { handleMediaImage } from "./lib/media-images-server";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const url = new URL(request.url);
    if (url.pathname === "/api/mercadopago-webhook") {
      try {
        return await handleMercadoPagoWebhook(request);
      } catch (error) {
        console.error("Erro no webhook do Mercado Pago:", error);
        return new Response("error", { status: 500 });
      }
    }
    if (url.pathname === "/api/img") {
      try {
        return await handleImageTransform(request);
      } catch (error) {
        console.error("Erro na transformação de imagem:", error);
        return new Response("error", { status: 500 });
      }
    }

    if (url.pathname === "/sitemap.xml") {
      try {
        return await handleSitemap();
      } catch (error) {
        console.error("Erro ao gerar sitemap.xml:", error);
        return new Response("error", { status: 500 });
      }
    }

    if (url.pathname === "/feed.xml") {
      try {
        return await handleRssFeed();
      } catch (error) {
        console.error("Erro ao gerar feed.xml:", error);
        return new Response("error", { status: 500 });
      }
    }

    if (url.pathname === "/api/cron/generate-article" && request.method === "POST") {
      try {
        return await handleGenerateArticleCron(request);
      } catch (error) {
        console.error("Erro no cron de geração de matéria:", error);
        return new Response("error", { status: 500 });
      }
    }

    if (url.pathname === "/api/cron/set-cover-image" && request.method === "POST") {
      try {
        return await handleSetCoverImageCron(request);
      } catch (error) {
        console.error("Erro no cron de capa de matéria:", error);
        return new Response("error", { status: 500 });
      }
    }

    if (url.pathname === "/api/cron/backfill-wire-covers" && request.method === "POST") {
      try {
        return await handleBackfillWireCoversCron(request);
      } catch (error) {
        console.error("Erro no backfill de capas do Wire:", error);
        return new Response("error", { status: 500 });
      }
    }

    if (url.pathname.startsWith("/api/cover-image/")) {
      try {
        const slug = url.pathname.slice("/api/cover-image/".length);
        return await handleCoverImage(slug);
      } catch (error) {
        console.error("Erro ao servir imagem de capa:", error);
        return new Response("error", { status: 500 });
      }
    }

    if (url.pathname.startsWith("/api/media-images/")) {
      try {
        const id = url.pathname.slice("/api/media-images/".length);
        return await handleMediaImage(id);
      } catch (error) {
        console.error("Erro ao servir imagem do banco de imagens:", error);
        return new Response("error", { status: 500 });
      }
    }

    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
