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
import { decidirVoz, sintetizar, transcrever } from "./whatsapp-voz";
import { extrairFalhasDeEntrega, type FalhaDeEntrega, type StatusMeta } from "./whatsapp-status";
import {
  agentePodeResponder,
  CAMPOS_IGNORADOS_COEXISTENCE,
  chaveDoLote,
  extrairEcos,
  type EcoDoApp,
  JANELA_AGRUPAMENTO_MS,
  montarLote,
  type LinhaDaConversa,
} from "./whatsapp-atendimento";
import { avisarEquipe } from "./whatsapp-alerta";

const TENANT = "express-entulho";

/** Quantas mensagens anteriores a agente relê — um orçamento inteiro cabe folgado. */
const MENSAGENS_DE_MEMORIA = 30;

/** Quantas linhas se leem para montar lote + memória (com folga para marcadores). */
const LINHAS_LIDAS = 80;

function esperar(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type MetaValue = {
  messages?: MensagemMeta[];
  statuses?: StatusMeta[];
  contacts?: { profile?: { name?: string }; wa_id?: string }[];
  /** Coexistence: mensagens que a equipe mandou pelo app do celular. */
  message_echoes?: (MensagemMeta & { to?: string })[];
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
      if (change.field === "smb_message_echoes") {
        for (const eco of extrairEcos(change.value)) await registrarEcoDoApp(eco);
        continue;
      }
      if (change.field && CAMPOS_IGNORADOS_COEXISTENCE.has(change.field)) {
        console.log(`Webhook ${change.field} do Coexistence ignorado de propósito`);
        continue;
      }
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
 * Coexistence: alguém da equipe respondeu o cliente pelo app do celular.
 *
 * Grava a resposta como de pessoa (o painel mostra, o lote fecha) e passa a
 * conversa para `aguardando_humano`: a agente se cala ali até alguém
 * devolvê-la pelo painel. É a regra 1 de whatsapp-atendimento.ts.
 *
 * Mensagem que a própria API enviou não vira eco duplicado: o wamid é único,
 * e a inserção repetida não acontece.
 */
async function registrarEcoDoApp(eco: EcoDoApp): Promise<void> {
  const db = getDb();
  const [conversa] = await db
    .insert(waConversations)
    .values({
      tenant: TENANT,
      waId: eco.waId,
      status: "aguardando_humano",
      lastMessageAt: eco.ocorridoEm,
    })
    .onConflictDoUpdate({
      target: [waConversations.tenant, waConversations.waId],
      set: { status: "aguardando_humano", lastMessageAt: eco.ocorridoEm, updatedAt: new Date() },
    })
    .returning({ id: waConversations.id });
  if (!conversa) return;

  await db
    .insert(waMessages)
    .values({
      conversationId: conversa.id,
      providerId: eco.providerId,
      direction: "saida",
      author: "humano",
      kind: eco.kind,
      body: eco.texto || null,
      occurredAt: eco.ocorridoEm,
    })
    .onConflictDoNothing({ target: waMessages.providerId });
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

  /**
   * Áudio do cliente vira texto antes de chegar ao agente.
   *
   * A transcrição é gravada no corpo da própria mensagem, e é de lá que o
   * lote a lê (whatsapp-atendimento.ts). Sem chave, download recusado, áudio
   * inaudível ou transcrição vazia: o corpo fica vazio, o lote marca
   * "precisa de humano" e uma pessoa ouve — o comportamento de antes de 20/09.
   */
  if (conteudo.precisaTranscrever && conteudo.mediaId) {
    const midia = await downloadMedia(conteudo.mediaId);
    if (midia.ok) {
      const ouvido = await transcrever(midia.bytes, midia.mimeType);
      if (ouvido.ok) {
        await db
          .update(waMessages)
          .set({ body: ouvido.texto })
          .where(eq(waMessages.id, inseridas[0].id));
      } else {
        console.error("Não transcrevi o áudio, encaminhando para humano:", ouvido.erro);
      }
    } else {
      console.error("Não baixei o áudio, encaminhando para humano:", midia.erro);
    }
  }

  // Regra 1: conversa com humano é do humano. A mensagem fica gravada e
  // aparece no painel; a agente não fala.
  if (!agentePodeResponder(conversa.status)) return;

  // Regra 2: espera a rajada terminar. Só o webhook da mensagem mais recente
  // responde, pelo grupo inteiro.
  await esperar(JANELA_AGRUPAMENTO_MS);

  // A situação pode ter mudado durante a espera (o lote anterior escalou, ou
  // alguém assumiu pelo painel). Relê antes de decidir.
  const [agora] = await db
    .select({ status: waConversations.status })
    .from(waConversations)
    .where(eq(waConversations.id, conversa.id));
  if (!agora || !agentePodeResponder(agora.status)) return;

  // Ordem de CHEGADA (createdAt, relógio do banco), não de envio: o horário
  // da Meta pode ser anterior a um marcador de lote já gravado, e a mensagem
  // ficaria do lado errado da fronteira — sem ninguém responder.
  const linhas = (
    await db
      .select({
        id: waMessages.id,
        providerId: waMessages.providerId,
        direction: waMessages.direction,
        author: waMessages.author,
        kind: waMessages.kind,
        body: waMessages.body,
        raw: waMessages.raw,
      })
      .from(waMessages)
      .where(eq(waMessages.conversationId, conversa.id))
      .orderBy(desc(waMessages.createdAt), desc(waMessages.id))
      .limit(LINHAS_LIDAS)
  ).reverse() as LinhaDaConversa[];

  const lote = montarLote(linhas, inseridas[0].id);
  if (!lote.responder) return;

  // Regra 3: reivindica o lote. Chave única: se outro webhook chegou antes,
  // a inserção não acontece e este aqui fica calado.
  const reivindicado = await db
    .insert(waMessages)
    .values({
      conversationId: conversa.id,
      providerId: chaveDoLote(providerId),
      direction: "saida",
      author: "sistema",
      kind: "lote",
      body: null,
      occurredAt: new Date(),
    })
    .onConflictDoNothing({ target: waMessages.providerId })
    .returning({ id: waMessages.id });
  if (reivindicado.length === 0) return;

  const doLote = new Set(lote.ids);
  const anteriores = linhas.filter((l) => !doLote.has(l.id)).slice(-MENSAGENS_DE_MEMORIA);
  const primeiraMensagem = !linhas.some((l) => l.direction === "entrada" && !doLote.has(l.id));

  const decisao = await decidirResposta({
    texto: lote.texto,
    historico: historicoDaConversa(anteriores),
    primeiraMensagem,
    forcarHumano: lote.forcarHumano,
  });

  // O modelo leva segundos. Se alguém assumiu pelo painel nesse meio-tempo,
  // a resposta da agente não sai: a conversa já é da pessoa.
  const [antesDeEnviar] = await db
    .select({ status: waConversations.status })
    .from(waConversations)
    .where(eq(waConversations.id, conversa.id));
  if (!antesDeEnviar || !agentePodeResponder(antesDeEnviar.status)) return;
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
    .set({ lastMessageAt: new Date(), updatedAt: new Date() })
    .where(eq(waConversations.id, conversa.id));

  // Status só muda se ninguém assumiu durante a resposta: uma pessoa que
  // pegou a conversa pelo painel enquanto o modelo pensava não pode ser
  // atropelada por um "ia" atrasado.
  const transicao = await db
    .update(waConversations)
    .set({ status: decisao.escalar ? "aguardando_humano" : "ia" })
    .where(
      and(eq(waConversations.id, conversa.id), ne(waConversations.status, "aguardando_humano")),
    )
    .returning({ id: waConversations.id });

  // Daqui em diante a agente se cala nesta conversa (regra 1), então alguém
  // PRECISA saber. Aviso só na transição: uma vez por escalonamento.
  if (decisao.escalar && transicao.length > 0) {
    await avisarEquipe({ nome: conversa.profileName, waId, motivo: decisao.motivo });
  }
}
