import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { handleMercadoPagoWebhook } from "./lib/mercadopago-webhook";
import { handleViduLiveRelay } from "./lib/vidu-live-relay";
import { handleWhatsAppVerify, handleWhatsAppWebhook } from "./lib/whatsapp-webhook";
import { handleWhatsAppDiagnostico } from "./lib/whatsapp-diagnostico";
import { handleTesteAgente } from "./lib/whatsapp-teste";
import { guardarNoCacheDeBorda, lerDoCacheDeBorda, podeCachear } from "./lib/edge-cache";
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
import {
  handleWireFeed,
  handleWireFeedMethodNotAllowed,
  handleWireFeedPreflight,
  handleWireJsonFeed,
  handleWireMateria,
} from "./lib/wire-feed-server";
import { handleAffiliateRedirect } from "./lib/affiliate-server";
import { handlePublishInstagramCron } from "./lib/instagram-cron";
import {
  handleArtCoversCron,
  handleCoverBankAddCron,
  handleCoverBankInventoryCron,
  handleCoverBankPurgeCron,
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

function withSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set("x-content-type-options", "nosniff");
  headers.set("referrer-policy", "strict-origin-when-cross-origin");
  // microphone=(self) — o avatar ao vivo da Veronica (Vidu) precisa de
  // getUserMedia({ audio: true }) na própria origem. Antes disso era
  // microphone=(), que bloqueava a permissão pro site inteiro antes mesmo
  // do navegador perguntar — o avatar nunca teria conseguido pedir mic em
  // produção. Câmera continua fechada de propósito: call_mode é sempre
  // "audio", nunca pedimos webcam de quem visita o site.
  headers.set("permissions-policy", "camera=(), microphone=(self), geolocation=()");
  headers.set("x-frame-options", "SAMEORIGIN");
  headers.set("strict-transport-security", "max-age=31536000; includeSubDomains");

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
    // Canal de controle (WebSocket) da sessão ao vivo da Veronica — proxy
    // pro Vidu, ver src/lib/vidu-live-relay.ts (a chave nunca sai daqui).
    if (url.pathname === "/api/vidu/live-relay") {
      try {
        return await handleViduLiveRelay(request);
      } catch (error) {
        console.error("Erro no relay do avatar ao vivo:", error);
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

    // Por que a agente cai no offline, sem abrir a demonstração e sem gastar
    // uma conversa: uma sonda de um token e o status que a Groq devolveu.
    // Sala de teste do dono: mesma agente, mesma guarda, SEM WhatsApp. Não
    // há caminho daqui para a Meta — ver src/lib/whatsapp-teste.ts.
    if (url.pathname === "/api/whatsapp/testar") {
      try {
        return await handleTesteAgente(request);
      } catch (error) {
        console.error("Erro na sala de teste da agente:", error);
        return new Response("error", { status: 500 });
      }
    }

    if (url.pathname === "/api/whatsapp/diagnostico" && request.method === "GET") {
      try {
        return await handleWhatsAppDiagnostico(request);
      } catch (error) {
        console.error("Erro no diagnóstico do agente de WhatsApp:", error);
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

    // Feed público do Veronica Wire: somente leitura, CORS liberado e cache
    // de cinco minutos. Interceptado aqui (e não por rota do TanStack) pelo
    // mesmo motivo do sitemap: a URL é contrato com quem consome de fora e
    // precisa ser fixa, o que a URL de RPC do createServerFn não permite.
    const materiaPrefixo = "/api/wire/materia/";
    const rotasDoFeed = ["/api/wire/feed.json", "/api/wire/jsonfeed.json"];
    if (rotasDoFeed.includes(url.pathname) || url.pathname.startsWith(materiaPrefixo)) {
      if (request.method === "OPTIONS") return handleWireFeedPreflight();
      if (request.method !== "GET" && request.method !== "HEAD") {
        return handleWireFeedMethodNotAllowed();
      }
      try {
        if (url.pathname === "/api/wire/feed.json") return await handleWireFeed();
        if (url.pathname === "/api/wire/jsonfeed.json") return await handleWireJsonFeed();
        return await handleWireMateria(url.pathname.slice(materiaPrefixo.length));
      } catch (error) {
        console.error("Erro no feed público do Wire:", error);
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

    // DELETE esvazia o banco curado antes do abastecimento da sessão. Fica no
    // mesmo caminho e sob o mesmo CRON_SECRET do GET/POST — é a mesma coleção,
    // e o método é que diz o que fazer com ela.
    if (url.pathname === "/api/cron/cover-bank" && request.method === "DELETE") {
      try {
        return await handleCoverBankPurgeCron(request);
      } catch (error) {
        console.error("Erro ao esvaziar o banco curado de capas:", error);
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

    // Telas de demonstração: servidas do cache do Cloudflare quando já foram
    // renderizadas naquele data center. Evita pagar a renderização — e o pico
    // de CPU que derrubou o Worker com 1102 — na visita do cliente.
    const cacheavel = podeCachear(request);
    if (cacheavel) {
      const guardada = await lerDoCacheDeBorda(request);
      if (guardada) return guardada;
    }

    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      const normalizada = await normalizeCatastrophicSsrResponse(response);
      if (cacheavel) {
        return guardarNoCacheDeBorda(request, normalizada, extrairWaitUntil(ctx));
      }
      return normalizada;
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
