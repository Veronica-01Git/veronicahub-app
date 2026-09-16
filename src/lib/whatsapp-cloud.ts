/**
 * Cliente da WhatsApp Cloud API (Meta) e verificação de assinatura.
 *
 * O agente da Express Entulho opera em NÚMERO DEDICADO. O número atual da
 * empresa não é migrado, alterado nem lido por este código — ver AGENTS.md.
 *
 * Segredos vêm só de variáveis de ambiente. Nenhum token entra em código,
 * commit, log ou resposta HTTP.
 */

const GRAPH_HOST = "graph.facebook.com";
const DEFAULT_GRAPH_VERSION = "v21.0";

export type WhatsAppConfig = {
  readonly phoneNumberId: string;
  readonly accessToken: string;
  readonly graphVersion: string;
};

/** Config de envio. `null` quando não está configurado — nunca lança. */
export function getWhatsAppConfig(): WhatsAppConfig | null {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!phoneNumberId || !accessToken) return null;
  return {
    phoneNumberId,
    accessToken,
    graphVersion: process.env.WHATSAPP_GRAPH_VERSION ?? DEFAULT_GRAPH_VERSION,
  };
}

function hexToBytes(hex: string): Uint8Array | null {
  if (hex.length % 2 !== 0 || !/^[0-9a-f]+$/i.test(hex)) return null;
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i += 1) {
    out[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

/**
 * Confere o cabeçalho `X-Hub-Signature-256` contra o corpo CRU.
 *
 * Duas coisas que precisam continuar verdadeiras aqui:
 *
 * 1. O corpo tem que ser exatamente os bytes recebidos. Reserializar o JSON
 *    (JSON.stringify de um objeto já parseado) muda espaços e ordem e a
 *    assinatura passa a nunca bater.
 * 2. A comparação é feita por `crypto.subtle.verify`, que é de tempo
 *    constante. Comparar strings com `===` vazaria, por tempo de resposta,
 *    quantos bytes da assinatura forjada estavam certos.
 */
export async function verifyWebhookSignature(
  rawBody: string,
  header: string | null,
  appSecret: string,
): Promise<boolean> {
  if (!header) return false;
  const [algo, assinatura] = header.split("=");
  if (algo !== "sha256" || !assinatura) return false;

  const bytes = hexToBytes(assinatura);
  if (!bytes || bytes.length !== 32) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(appSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );

  return crypto.subtle.verify(
    "HMAC",
    key,
    bytes as unknown as ArrayBuffer,
    new TextEncoder().encode(rawBody),
  );
}

export type EnvioResultado =
  | { readonly ok: true; readonly providerId: string }
  | { readonly ok: false; readonly erro: string };

/** Envia texto simples. Só funciona dentro da janela de 24 h da Meta. */
export async function sendText(to: string, body: string): Promise<EnvioResultado> {
  const config = getWhatsAppConfig();
  if (!config) return { ok: false, erro: "WhatsApp não configurado" };

  const resposta = await fetch(
    `https://${GRAPH_HOST}/${config.graphVersion}/${config.phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${config.accessToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "text",
        text: { preview_url: false, body },
      }),
    },
  );

  const texto = await resposta.text();
  if (!resposta.ok) {
    // Nunca ecoar o corpo inteiro: pode trazer eco de token em erro de auth.
    return { ok: false, erro: `Graph respondeu ${resposta.status}` };
  }

  try {
    const json = JSON.parse(texto) as { messages?: { id?: string }[] };
    const providerId = json.messages?.[0]?.id;
    return providerId ? { ok: true, providerId } : { ok: false, erro: "Graph não devolveu id" };
  } catch {
    return { ok: false, erro: "Graph devolveu corpo inválido" };
  }
}

/** Marca como lida — os dois tiques azuis. Falha aqui nunca derruba o fluxo. */
export async function markAsRead(providerId: string): Promise<void> {
  const config = getWhatsAppConfig();
  if (!config) return;
  try {
    await fetch(`https://${GRAPH_HOST}/${config.graphVersion}/${config.phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${config.accessToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        status: "read",
        message_id: providerId,
      }),
    });
  } catch (error) {
    console.error("Falha ao marcar mensagem como lida:", error);
  }
}

/** Janela de 24 h da Meta: fora dela, só modelo aprovado. */
export function janela24hAberta(lastInboundAt: Date | null): boolean {
  if (!lastInboundAt) return false;
  return Date.now() - lastInboundAt.getTime() < 24 * 60 * 60 * 1000;
}
