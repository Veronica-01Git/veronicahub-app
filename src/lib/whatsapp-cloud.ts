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

/* ------------------------------------------------------------------ áudio */

/**
 * Sobe um áudio para a Meta e devolve o id da mídia.
 *
 * DOIS PASSOS, NÃO UM. A Cloud API não aceita o arquivo junto com a
 * mensagem: primeiro o binário vai para /media e volta um id, depois esse id
 * é que viaja na mensagem. O id vale ~30 dias e é reutilizável — mas aqui
 * cada resposta gera um áudio novo, então não há o que cachear.
 *
 * O CORPO É MULTIPART, e o campo `type` precisa repetir o mime do arquivo.
 * Mandar `audio/ogg` sem o `codecs=opus` no BLOB faz a Meta aceitar o upload
 * e entregar como anexo de arquivo em vez de nota de voz — falha silenciosa,
 * que é a pior espécie: ninguém vê erro, só o cliente recebe um documento
 * esquisito no lugar de um áudio.
 */
export async function uploadAudio(
  bytes: Uint8Array,
  mimeType: string,
): Promise<{ ok: true; mediaId: string } | { ok: false; erro: string }> {
  const config = getWhatsAppConfig();
  if (!config) return { ok: false, erro: "WhatsApp não configurado" };

  const form = new FormData();
  form.append("messaging_product", "whatsapp");
  form.append("type", mimeType);
  form.append(
    "file",
    new Blob([bytes as unknown as ArrayBuffer], { type: `${mimeType}; codecs=opus` }),
    "resposta.ogg",
  );

  try {
    const resposta = await fetch(
      `https://${GRAPH_HOST}/${config.graphVersion}/${config.phoneNumberId}/media`,
      {
        method: "POST",
        // Sem content-type à mão: o fetch precisa inserir o boundary do
        // multipart sozinho, e defini-lo aqui quebraria o corpo.
        headers: { authorization: `Bearer ${config.accessToken}` },
        body: form,
      },
    );

    if (!resposta.ok) return { ok: false, erro: `Graph respondeu ${resposta.status} no upload` };

    const json = (await resposta.json()) as { id?: string };
    return json.id
      ? { ok: true, mediaId: json.id }
      : { ok: false, erro: "Graph não devolveu id de mídia" };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { ok: false, erro: `falha no upload de áudio: ${msg.slice(0, 120)}` };
  }
}

/** Envia o áudio já subido. Mesma janela de 24 h que vale para texto. */
export async function sendAudio(to: string, mediaId: string): Promise<EnvioResultado> {
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
        type: "audio",
        audio: { id: mediaId },
      }),
    },
  );

  const texto = await resposta.text();
  if (!resposta.ok) return { ok: false, erro: `Graph respondeu ${resposta.status}` };

  try {
    const json = JSON.parse(texto) as { messages?: { id?: string }[] };
    const providerId = json.messages?.[0]?.id;
    return providerId ? { ok: true, providerId } : { ok: false, erro: "Graph não devolveu id" };
  } catch {
    return { ok: false, erro: "Graph devolveu corpo inválido" };
  }
}

/**
 * Baixa uma mídia recebida. DOIS PASSOS, e o segundo é onde se erra.
 *
 * O webhook da Meta nunca traz o binário — traz um id. Com o id, `GET /{id}`
 * devolve um JSON com uma `url` temporária. Essa url **exige o mesmo
 * Bearer token** para ser baixada; buscá-la sem o cabeçalho devolve 401, e é
 * o engano clássico de quem vê "url" e assume link público.
 */
export async function downloadMedia(
  mediaId: string,
): Promise<{ ok: true; bytes: Uint8Array; mimeType: string } | { ok: false; erro: string }> {
  const config = getWhatsAppConfig();
  if (!config) return { ok: false, erro: "WhatsApp não configurado" };

  try {
    const meta = await fetch(`https://${GRAPH_HOST}/${config.graphVersion}/${mediaId}`, {
      headers: { authorization: `Bearer ${config.accessToken}` },
    });
    if (!meta.ok) return { ok: false, erro: `Graph respondeu ${meta.status} ao localizar a mídia` };

    const info = (await meta.json()) as { url?: string; mime_type?: string };
    if (!info.url) return { ok: false, erro: "Graph não devolveu url da mídia" };

    const arquivo = await fetch(info.url, {
      headers: { authorization: `Bearer ${config.accessToken}` },
    });
    if (!arquivo.ok) return { ok: false, erro: `Download da mídia respondeu ${arquivo.status}` };

    return {
      ok: true,
      bytes: new Uint8Array(await arquivo.arrayBuffer()),
      mimeType: info.mime_type ?? "audio/ogg",
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { ok: false, erro: `falha ao baixar mídia: ${msg.slice(0, 120)}` };
  }
}
