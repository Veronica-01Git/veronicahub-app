import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { handleMercadoPagoWebhook } from "./lib/mercadopago-webhook";
import { handleWhatsAppVerify, handleWhatsAppWebhook } from "./lib/whatsapp-webhook";
import { handleImageTransform } from "./lib/image-transform-server";
import { handleNewsSitemap, handleSitemap, handleRssFeed } from "./lib/seo-feed";
import {
  handleArchiveWireOwnedImagesCron,
  handleBackfillWireCoversCron,
  handleGenerateArticleCron,
  handleSetCoverImageCron,
} from "./lib/article-cron";
import { handleCoverImage } from "./lib/cover-image-server";
import { handleMediaImage } from "./lib/media-images-server";
import { handleSourceReferral } from "./lib/source-network-server";
import { handleWireOfferRedirect } from "./lib/wire-commerce-server";
import { handleAffiliateRedirect } from "./lib/affiliate-server";
import { handlePublishInstagramCron } from "./lib/instagram-cron";
import {
  handleArtCoversCron,
  handleCoverBankAddCron,
  handleCoverBankInventoryCron,
} from "./lib/cover-bank-cron";

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

/**
 * Content-Security-Policy.
 *
 * `script-src` inclui 'unsafe-inline' porque a hidratação da TanStack Start
 * emite script inline no HTML do SSR; sem nonce por requisição não dá pra
 * tirar. Isso enfraquece a defesa contra XSS refletido, mas o que a política
 * ainda entrega é o que mais importa aqui: nenhum script de origem externa
 * carrega, `object-src 'none'` mata plugin, `base-uri 'self'` impede
 * sequestrar caminhos relativos via <base>, e `form-action 'self'` impede
 * POST de formulário injetado para fora.
 *
 * `img-src` é largo de propósito: capa de matéria vem de CDN de terceiro
 * (Pexels, CloudFront). Imagem não executa, e `nosniff` já está setado.
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "media-src 'self'",
  "connect-src 'self'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

function withSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set("x-content-type-options", "nosniff");
  headers.set("referrer-policy", "strict-origin-when-cross-origin");
  headers.set("permissions-policy", "camera=(), microphone=(), geolocation=()");
  // frame-ancestors do CSP é o controle moderno; X-Frame-Options fica para
  // navegador antigo que não lê CSP. DENY em vez de SAMEORIGIN porque o site
  // não embute a si mesmo em lugar nenhum (não há <iframe> no código).
  headers.set("x-frame-options", "DENY");
  headers.set("strict-transport-security", "max-age=31536000; includeSubDomains");
  // Isola a janela de quem abriu o site. Não põe Cross-Origin-Resource-Policy
  // junto: as capas em /api/cover-image/ existem para ser consumidas de fora
  // (og:image, compartilhamento), e CORP as bloquearia.
  headers.set("cross-origin-opener-policy", "same-origin");
  // CSP só em produção: `connect-src 'self'` derruba o websocket de HMR do
  // Vite, e vale mais ter a política certa no ar do que uma frouxa nos dois.
  if (process.env.NODE_ENV === "production") {
    headers.set("content-security-policy", CSP);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * `ctx.waitUntil` quando o runtime oferece (Cloudflare Workers). Deixa o
 * webhook confirmar 200 na hora e terminar o trabalho depois.
 */
function extrairWaitUntil(ctx: unknown): ((p: Promise<unknown>) => void) | undefined {
  if (typeof ctx !== "object" || ctx === null) return undefined;
  const candidato = (ctx as { waitUntil?: unknown }).waitUntil;
  if (typeof candidato !== "function") return undefined;
  return (p: Promise<unknown>) => (candidato as (p: Promise<unknown>) => void).call(ctx, p);
}

const app = {
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
    // Webhook do agente de WhatsApp (Cloud API da Meta). GET verifica o
    // endpoint no painel; POST recebe mensagem. O número é DEDICADO — o
    // número atual da Express Entulho não passa por aqui (ver AGENTS.md).
    if (url.pathname === "/api/whatsapp/webhook") {
      if (request.method === "GET") {
        return handleWhatsAppVerify(request);
      }
      if (request.method === "POST") {
        try {
          return await handleWhatsAppWebhook(request, extrairWaitUntil(ctx));
        } catch (error) {
          console.error("Erro no webhook do WhatsApp:", error);
          // 200 de propósito: a Meta reentrega o que não recebe 200, e o
          // retry de um payload que já falhou só repete o erro.
          return new Response("ok", { status: 200 });
        }
      }
      return new Response("method not allowed", { status: 405 });
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

    if (url.pathname === "/news-sitemap.xml") {
      try {
        return await handleNewsSitemap();
      } catch (error) {
        console.error("Erro ao gerar news-sitemap.xml:", error);
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

    if (url.pathname === "/r/fonte") {
      try {
        return await handleSourceReferral(request);
      } catch (error) {
        console.error("Erro ao encaminhar para fonte:", error);
        return new Response("fonte indisponível", { status: 500 });
      }
    }

    if (url.pathname === "/r/wire") {
      try {
        return await handleWireOfferRedirect(request);
      } catch (error) {
        console.error("Erro ao encaminhar oferta do Wire:", error);
        return new Response("oferta indisponível", { status: 500 });
      }
    }

    if (url.pathname === "/r/afiliado") {
      try {
        return await handleAffiliateRedirect(request);
      } catch (error) {
        console.error("Erro ao encaminhar produto de afiliado:", error);
        return new Response("produto indisponível", { status: 500 });
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

    if (url.pathname === "/api/cron/archive-wire-owned-images" && request.method === "POST") {
      try {
        return await handleArchiveWireOwnedImagesCron(request);
      } catch (error) {
        console.error("Erro ao arquivar capas institucionais do Wire:", error);
        return new Response("error", { status: 500 });
      }
    }

    // Abastecimento do banco curado de capas: o runner do Actions consulta o
    // inventário (GET), busca no Pexels o que falta e cadastra um por um (POST).
    if (url.pathname === "/api/cron/cover-bank" && request.method === "GET") {
      try {
        return await handleCoverBankInventoryCron(request);
      } catch (error) {
        console.error("Erro ao ler o banco curado de capas:", error);
        return new Response("error", { status: 500 });
      }
    }

    // Matérias que ainda saíram com arte gerada, e a foto do banco que cada
    // uma deve receber. O runner do Actions baixa, commita e avisa de volta.
    if (url.pathname === "/api/cron/art-covers" && request.method === "GET") {
      try {
        return await handleArtCoversCron(request);
      } catch (error) {
        console.error("Erro ao listar capas de arte pendentes:", error);
        return new Response("error", { status: 500 });
      }
    }

    if (url.pathname === "/api/cron/cover-bank" && request.method === "POST") {
      try {
        return await handleCoverBankAddCron(request);
      } catch (error) {
        console.error("Erro ao cadastrar imagem no banco curado de capas:", error);
        return new Response("error", { status: 500 });
      }
    }

    if (url.pathname === "/api/cron/publish-instagram" && request.method === "POST") {
      try {
        return await handlePublishInstagramCron(request);
      } catch (error) {
        console.error("Erro no cron de publicação do Instagram:", error);
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

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    return withSecurityHeaders(await app.fetch(request, env, ctx));
  },
};
