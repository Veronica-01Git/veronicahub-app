/**
 * Webhook da WhatsApp Cloud API.
 *
 * GET  — verificação do endpoint no painel da Meta (hub.challenge).
 * POST — recebimento de mensagens e de status de entrega.
 *
 * Chamado direto do src/server.ts porque a Meta exige URL fixa e previsível,
 * o que a URL de RPC do createServerFn não dá. Mesmo motivo do webhook do
 * Mercado Pago.
 */

import { and, eq, sql } from "drizzle-orm";
import { getDb } from "./db";
import { waConversations, waMessages } from "./schema";
import { decidirResposta } from "./whatsapp-agent";
import { extrairConteudo, type MensagemMeta } from "./whatsapp-mensagem";
import { markAsRead, sendText, verifyWebhookSignature } from "./whatsapp-cloud";

const TENANT = "express-entulho";

type MetaValue = {
  messages?: MensagemMeta[];
  contacts?: { profile?: { name?: string }; wa_id?: string }[];
};

type MetaBody = {
  object?: string;
  entry?: { changes?: { field?: string; value?: MetaValue }[] }[];
};

/** Verificação do endpoint. A Meta chama uma vez, ao cadastrar a URL. */
export function handleWhatsAppVerify(request: Request): Response {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  const esperado = process.env.WHATSAPP_VERIFY_TOKEN;
  if (!esperado) {
    console.error("WHATSAPP_VERIFY_TOKEN não configurada — recusando verificação");
    return new Response("not configured", { status: 500 });
  }

  if (mode === "subscribe" && token === esperado && challenge) {
    return new Response(challenge, {
      status: 200,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  return new Response("forbidden", { status: 403 });
}

/**
 * Recebimento.
 *
 * Duas regras que valem para sempre aqui:
 *
 * 1. Assinatura inválida é 403 e nada mais acontece. É a única barreira entre
 *    este endpoint e qualquer pessoa na internet escrevendo no nosso banco.
 * 2. Depois que a assinatura passa, a resposta é SEMPRE 200 — inclusive se o
 *    processamento falhar. A Meta reentrega o que não recebe 200, e o retry
 *    de um payload que já quebrou uma vez só multiplica o erro. A unicidade
 *    de `providerId` no banco é o que torna a reentrega inofensiva.
 */
export async function handleWhatsAppWebhook(
  request: Request,
  waitUntil?: (p: Promise<unknown>) => void,
): Promise<Response> {
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (!appSecret) {
    console.error("WHATSAPP_APP_SECRET não configurada — recusando webhook");
    return new Response("not configured", { status: 500 });
  }

  // Corpo CRU: a assinatura é sobre estes bytes. Reserializar quebra tudo.
  const rawBody = await request.text();

  const assinaturaOk = await verifyWebhookSignature(
    rawBody,
    request.headers.get("x-hub-signature-256"),
    appSecret,
  );
  if (!assinaturaOk) {
    console.warn("Webhook WhatsApp com assinatura inválida — descartado");
    return new Response("forbidden", { status: 403 });
  }

  const processamento = processarPayload(rawBody).catch((error) => {
    console.error("Erro ao processar webhook do WhatsApp:", error);
  });

  // Confirma primeiro, processa depois: a Meta tem paciência curta e o retry
  // dela não ajuda em nada que já esteja persistido.
  if (waitUntil) {
    waitUntil(processamento);
  } else {
    await processamento;
  }

  return new Response("ok", { status: 200 });
}

async function processarPayload(rawBody: string): Promise<void> {
  let body: MetaBody;
  try {
    body = JSON.parse(rawBody) as MetaBody;
  } catch {
    console.error("Webhook do WhatsApp com corpo não-JSON");
    return;
  }

  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field !== "messages") continue;
      const value = change.value;
      if (!value?.messages?.length) continue;

      const nome = value.contacts?.[0]?.profile?.name ?? null;
      for (const mensagem of value.messages) {
        await processarMensagem(mensagem, nome);
      }
    }
  }
}

async function processarMensagem(
  mensagem: MensagemMeta,
  profileName: string | null,
): Promise<void> {
  const providerId = mensagem.id;
  const waId = mensagem.from;
  if (!providerId || !waId) return;

  const ocorridoEm = mensagem.timestamp ? new Date(Number(mensagem.timestamp) * 1000) : new Date();
  const conteudo = extrairConteudo(mensagem);
  const db = getDb();

  const [conversa] = await db
    .insert(waConversations)
    .values({
      tenant: TENANT,
      waId,
      profileName,
      lastInboundAt: ocorridoEm,
      lastMessageAt: ocorridoEm,
    })
    .onConflictDoUpdate({
      target: [waConversations.tenant, waConversations.waId],
      set: {
        profileName: profileName ?? sql`"WaConversation"."profileName"`,
        lastInboundAt: ocorridoEm,
        lastMessageAt: ocorridoEm,
        updatedAt: new Date(),
      },
    })
    .returning();

  if (!conversa) return;

  // Reentrega da Meta cai aqui e não faz nada: providerId é único.
  const inseridas = await db
    .insert(waMessages)
    .values({
      conversationId: conversa.id,
      providerId,
      direction: "entrada",
      author: "cliente",
      kind: conteudo.kind,
      body: conteudo.texto || null,
      raw: JSON.stringify(mensagem),
      occurredAt: ocorridoEm,
    })
    .onConflictDoNothing({ target: waMessages.providerId })
    .returning();

  if (inseridas.length === 0) return; // já processada antes

  await markAsRead(providerId);

  // Figurinha e reação ficam registradas, mas não merecem resposta.
  if (conteudo.ignorar) return;

  const anteriores = await db.$count(
    waMessages,
    and(eq(waMessages.conversationId, conversa.id), eq(waMessages.direction, "entrada")),
  );

  const decisao = await decidirResposta({
    texto: conteudo.paraOAgente,
    primeiraMensagem: anteriores <= 1,
    forcarHumano: conteudo.humanoObrigatorio,
  });
  const envio = await sendText(waId, decisao.texto);

  if (envio.ok) {
    await db.insert(waMessages).values({
      conversationId: conversa.id,
      providerId: envio.providerId,
      direction: "saida",
      author: "ia",
      kind: "text",
      body: decisao.texto,
      occurredAt: new Date(),
    });
  } else {
    console.error("Falha ao responder no WhatsApp:", envio.erro);
  }

  await db
    .update(waConversations)
    .set({
      status: decisao.escalar ? "aguardando_humano" : "ia",
      lastMessageAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(waConversations.id, conversa.id));
}
