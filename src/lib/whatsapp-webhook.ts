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

import { and, desc, eq, ne, sql } from "drizzle-orm";
import { getDb } from "./db";
import { waConversations, waMessages } from "./schema";
import { decidirResposta, historicoDaConversa } from "./whatsapp-agent";
import { extrairConteudo, type MensagemMeta } from "./whatsapp-mensagem";
import {
  downloadMedia,
  markAsRead,
  sendAudio,
  sendText,
  uploadAudio,
  verifyWebhookSignature,
} from "./whatsapp-cloud";
import { decidirVoz, marcarComoTranscricao, sintetizar, transcrever } from "./whatsapp-voz";
import { extrairFalhasDeEntrega, type FalhaDeEntrega, type StatusMeta } from "./whatsapp-status";

const TENANT = "express-entulho";

/** Quantas mensagens anteriores a agente relê — um orçamento inteiro cabe folgado. */
const MENSAGENS_DE_MEMORIA = 30;

type MetaValue = {
  messages?: MensagemMeta[];
  statuses?: StatusMeta[];
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
      if (!value) continue;

      for (const falha of extrairFalhasDeEntrega(value.statuses)) {
        await registrarFalhaDeEntrega(falha);
      }

      if (!value.messages?.length) continue;
      const nome = value.contacts?.[0]?.profile?.name ?? null;
      for (const mensagem of value.messages) {
        await processarMensagem(mensagem, nome);
      }
    }
  }
}

/**
 * Grava no histórico da conversa que a Meta não entregou uma mensagem nossa.
 *
 * Vai como mensagem de autor "sistema" para não exigir tabela nova: o
 * histórico já é onde se procura o que aconteceu numa conversa. A chave
 * única leva o wamid, então o reenvio do aviso pela Meta não duplica.
 */
async function registrarFalhaDeEntrega(falha: FalhaDeEntrega): Promise<void> {
  console.error("Meta não entregou a mensagem:", falha.descricao);
  const db = getDb();

  const [conversa] = await db
    .insert(waConversations)
    .values({ tenant: TENANT, waId: falha.waId })
    .onConflictDoUpdate({
      target: [waConversations.tenant, waConversations.waId],
      set: { updatedAt: new Date() },
    })
    .returning();
  if (!conversa) return;

  await db
    .insert(waMessages)
    .values({
      conversationId: conversa.id,
      providerId: `falha:${falha.mensagemId}`,
      direction: "saida",
      author: "sistema",
      kind: "falha_entrega",
      body: falha.descricao,
      occurredAt: falha.ocorridoEm,
    })
    .onConflictDoNothing({ target: waMessages.providerId });
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

  /**
   * Áudio do cliente vira texto antes de chegar ao agente.
   *
   * O PADRÃO AQUI É O ANTIGO, e isso é deliberado: `conteudo` já chega com
   * humanoObrigatorio true, e só estas linhas podem derrubá-lo. Sem chave,
   * download recusado, áudio inaudível ou transcrição vazia, nada é
   * derrubado e uma pessoa ouve — exatamente como antes de 20/09. A regra
   * de whatsapp-mensagem.ts continua de pé: o que o agente não entende vai
   * para um humano; o que mudou é que agora ele entende quase sempre.
   */
  let paraOAgente = conteudo.paraOAgente;
  let forcarHumano = conteudo.humanoObrigatorio;
  let transcricao: string | null = null;

  if (conteudo.precisaTranscrever && conteudo.mediaId) {
    const midia = await downloadMedia(conteudo.mediaId);
    if (midia.ok) {
      const ouvido = await transcrever(midia.bytes, midia.mimeType);
      if (ouvido.ok) {
        transcricao = ouvido.texto;
        paraOAgente = marcarComoTranscricao(ouvido.texto);
        forcarHumano = false;
      } else {
        console.error("Não transcrevi o áudio, encaminhando para humano:", ouvido.erro);
      }
    } else {
      console.error("Não baixei o áudio, encaminhando para humano:", midia.erro);
    }
  }

  // O que o cliente disse fica gravado, não só a descrição do anexo. Sem
  // isto, o painel mostraria "[o cliente enviou um áudio]" e ninguém saberia
  // o que ele pediu sem reabrir o WhatsApp.
  if (transcricao) {
    await db
      .update(waMessages)
      .set({ body: transcricao })
      .where(eq(waMessages.id, inseridas[0].id));
  }

  const linhasAnteriores = await db
    .select({
      direction: waMessages.direction,
      author: waMessages.author,
      kind: waMessages.kind,
      body: waMessages.body,
    })
    .from(waMessages)
    .where(and(eq(waMessages.conversationId, conversa.id), ne(waMessages.id, inseridas[0].id)))
    .orderBy(desc(waMessages.occurredAt))
    .limit(MENSAGENS_DE_MEMORIA);

  const decisao = await decidirResposta({
    texto: paraOAgente,
    historico: historicoDaConversa(linhasAnteriores.reverse()),
    primeiraMensagem: anteriores <= 1,
    forcarHumano,
  });
  /**
   * Áudio quando cabe, texto sempre que não.
   *
   * A REGRA DE OURO DESTE TRECHO: falha na voz NUNCA custa a resposta. A
   * ElevenLabs fora do ar, cota estourada, upload recusado pela Meta — em
   * todos esses casos o cliente recebe o texto, que é o que ele receberia
   * antes desta funcionalidade existir. Voz é acréscimo, não dependência.
   *
   * Quem decide se pode falar é decidirVoz, em whatsapp-voz.ts: resposta que
   * cita valor vai em texto, porque áudio não se relê, e conversa escalada
   * vai em texto, porque quem assume precisa LER o histórico.
   *
   * O corpo em texto é gravado no banco nos dois caminhos. O painel e o
   * histórico não podem depender de alguém ouvir um arquivo para saber o que
   * a agente respondeu.
   */
  const voz = decidirVoz(decisao.texto, { escalar: decisao.escalar });
  let envio = null as Awaited<ReturnType<typeof sendText>> | null;
  let enviadoComoAudio = false;

  if (voz.falar) {
    const fala = await sintetizar(decisao.texto);
    if (fala.ok) {
      const midia = await uploadAudio(fala.audio, fala.mimeType);
      if (midia.ok) {
        const tentativa = await sendAudio(waId, midia.mediaId);
        if (tentativa.ok) {
          envio = tentativa;
          enviadoComoAudio = true;
        } else {
          console.error("Falha ao enviar áudio, caindo para texto:", tentativa.erro);
        }
      } else {
        console.error("Falha ao subir áudio, caindo para texto:", midia.erro);
      }
    } else {
      console.error("Falha ao sintetizar voz, caindo para texto:", fala.erro);
    }
  }

  if (!envio) envio = await sendText(waId, decisao.texto);

  if (envio.ok) {
    await db.insert(waMessages).values({
      conversationId: conversa.id,
      providerId: envio.providerId,
      direction: "saida",
      author: "ia",
      kind: enviadoComoAudio ? "audio" : "text",
      // Mesmo no áudio, o que vai para o banco é o TEXTO falado — é ele que
      // o painel mostra e é por ele que se audita o que a agente disse.
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
