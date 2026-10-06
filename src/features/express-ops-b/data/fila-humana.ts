/**
 * Fila humana do número DEDICADO da agente — as conversas reais que o webhook
 * gravou, e a resposta de uma pessoa da equipe.
 *
 * POR QUE ISTO EXISTE. Um número na Cloud API não tem aplicativo de celular.
 * Quando a agente dizia "uma pessoa te responde em seguida", não havia tela
 * onde essa pessoa respondesse: a conversa ficava marcada no banco e o
 * cliente, sem ninguém. Esta é a porta de saída humana.
 *
 * O QUE NÃO MUDA:
 * - O número atual da Express Entulho não aparece aqui. Isto lê só o que o
 *   webhook do número dedicado gravou; o WhatsApp Business do aparelho da
 *   empresa não é lido, sincronizado nem alterado (AGENTS.md).
 * - Responder passa pela MESMA trava do webhook (`WHATSAPP_ENVIO_LIBERADO`)
 *   e pela janela de 24 h da Meta. Trava fechada é recusa clara, não envio.
 * - Nada é apagado: assumir, devolver e encerrar só mudam o status.
 *
 * Acesso: o mesmo do painel — selo da Express, conta confirmada e allowlist.
 * Server function é endpoint público; cada uma confere por conta própria.
 */

import { createServerFn } from "@tanstack/react-start";

const TENANT = "express-entulho";
const MAX_RESPOSTA = 1500;

async function temAcesso(): Promise<boolean> {
  const { avaliarAcessoAoWorkspace } = await import("@/features/private-clients/access.server");
  return (await avaliarAcessoAoWorkspace(TENANT)).ok;
}

export type StatusFila = "ia" | "aguardando_humano" | "resolvida";

export type ConversaFila = {
  readonly id: string;
  readonly nome: string;
  /** Só os últimos dígitos — o suficiente para a equipe se achar. */
  readonly final: string;
  readonly status: StatusFila;
  readonly ultimaEntrada: string | null;
  readonly janelaAberta: boolean;
};

export type MensagemFila = {
  readonly id: string;
  readonly autor: "cliente" | "ia" | "humano" | "sistema";
  readonly tipo: string;
  readonly texto: string;
  readonly quando: string;
};

export type Fila =
  | { readonly ok: true; readonly conversas: readonly ConversaFila[] }
  | { readonly ok: false; readonly erro: string };

const SEM_ACESSO = "Sua sessão expirou. Entre de novo pelo painel com o selo da Express.";
const INDISPONIVEL = "Fila indisponível agora. Nada foi alterado; tente de novo em instantes.";

function validarId(data: unknown): { id: string } {
  const id = (data as { id?: unknown })?.id;
  return { id: typeof id === "string" ? id.slice(0, 64) : "" };
}

/** Aguardando humano primeiro; dentro de cada grupo, a mais recente em cima. */
export const listarFila = createServerFn({ method: "GET" }).handler(async (): Promise<Fila> => {
  if (!(await temAcesso())) return { ok: false, erro: SEM_ACESSO };
  try {
    const { desc, eq, sql } = await import("drizzle-orm");
    const { getDb } = await import("@/lib/db");
    const { waConversations } = await import("@/lib/schema");
    const { janela24hAberta } = await import("@/lib/whatsapp-cloud");
    const { finalDoNumero } = await import("@/lib/whatsapp-atendimento");

    const linhas = await getDb()
      .select({
        id: waConversations.id,
        waId: waConversations.waId,
        profileName: waConversations.profileName,
        status: waConversations.status,
        lastInboundAt: waConversations.lastInboundAt,
      })
      .from(waConversations)
      .where(eq(waConversations.tenant, TENANT))
      .orderBy(
        sql`CASE WHEN ${waConversations.status} = 'aguardando_humano' THEN 0 ELSE 1 END`,
        desc(waConversations.lastMessageAt),
      )
      .limit(60);

    return {
      ok: true,
      conversas: linhas.map((l) => ({
        id: l.id,
        nome: l.profileName?.trim() || "Cliente sem nome",
        final: finalDoNumero(l.waId),
        status: l.status,
        ultimaEntrada: l.lastInboundAt?.toISOString() ?? null,
        janelaAberta: janela24hAberta(l.lastInboundAt),
      })),
    };
  } catch (error) {
    console.error("Fila humana indisponível:", error);
    return { ok: false, erro: INDISPONIVEL };
  }
});

export const lerConversaFila = createServerFn({ method: "POST" })
  .validator(validarId)
  .handler(
    async ({
      data,
    }): Promise<{ ok: true; mensagens: readonly MensagemFila[] } | { ok: false; erro: string }> => {
      if (!(await temAcesso())) return { ok: false, erro: SEM_ACESSO };
      if (!data.id) return { ok: false, erro: "Conversa não encontrada." };
      try {
        const { and, desc, eq, ne } = await import("drizzle-orm");
        const { getDb } = await import("@/lib/db");
        const { waConversations, waMessages } = await import("@/lib/schema");

        const db = getDb();
        const [conversa] = await db
          .select({ id: waConversations.id })
          .from(waConversations)
          .where(and(eq(waConversations.id, data.id), eq(waConversations.tenant, TENANT)));
        if (!conversa) return { ok: false, erro: "Conversa não encontrada." };

        const linhas = await db
          .select({
            id: waMessages.id,
            author: waMessages.author,
            kind: waMessages.kind,
            body: waMessages.body,
            createdAt: waMessages.createdAt,
          })
          .from(waMessages)
          // Marcador de lote é controle interno do webhook, não fala de ninguém.
          .where(and(eq(waMessages.conversationId, conversa.id), ne(waMessages.kind, "lote")))
          .orderBy(desc(waMessages.createdAt))
          .limit(100);

        return {
          ok: true,
          mensagens: linhas.reverse().map((l) => ({
            id: l.id,
            autor: l.author,
            tipo: l.kind,
            texto: l.body?.trim() || `[${l.kind}]`,
            quando: l.createdAt.toISOString(),
          })),
        };
      } catch (error) {
        console.error("Não li a conversa da fila humana:", error);
        return { ok: false, erro: INDISPONIVEL };
      }
    },
  );

type Acao = "assumir" | "devolver" | "encerrar";

const NOVO_STATUS: Record<Acao, StatusFila> = {
  assumir: "aguardando_humano",
  devolver: "ia",
  encerrar: "resolvida",
};

/**
 * Assumir cala a agente sem responder; devolver a deixa voltar a atender;
 * encerrar fecha o assunto (mensagem nova do cliente reabre com a agente).
 */
export const mudarStatusFila = createServerFn({ method: "POST" })
  .validator((data: unknown): { id: string; acao: Acao | null } => {
    const acao = (data as { acao?: unknown })?.acao;
    return {
      ...validarId(data),
      acao: acao === "assumir" || acao === "devolver" || acao === "encerrar" ? acao : null,
    };
  })
  .handler(async ({ data }): Promise<{ ok: true } | { ok: false; erro: string }> => {
    if (!(await temAcesso())) return { ok: false, erro: SEM_ACESSO };
    if (!data.id || !data.acao) return { ok: false, erro: "Ação inválida." };
    try {
      const { and, eq } = await import("drizzle-orm");
      const { getDb } = await import("@/lib/db");
      const { waConversations } = await import("@/lib/schema");
      const alteradas = await getDb()
        .update(waConversations)
        .set({ status: NOVO_STATUS[data.acao], updatedAt: new Date() })
        .where(and(eq(waConversations.id, data.id), eq(waConversations.tenant, TENANT)))
        .returning({ id: waConversations.id });
      return alteradas.length ? { ok: true } : { ok: false, erro: "Conversa não encontrada." };
    } catch (error) {
      console.error("Não mudei o status na fila humana:", error);
      return { ok: false, erro: INDISPONIVEL };
    }
  });

/**
 * Resposta de uma pessoa da equipe, pelo número dedicado.
 *
 * Responder também ASSUME a conversa: quem escreveu ao cliente é dono dela
 * até devolver. A ordem importa — status primeiro, envio depois — para a
 * agente não responder por cima numa mensagem que chegue no meio.
 */
export const responderNaFila = createServerFn({ method: "POST" })
  .validator((data: unknown): { id: string; texto: string } => {
    const texto = (data as { texto?: unknown })?.texto;
    return {
      ...validarId(data),
      texto: typeof texto === "string" ? texto.trim().slice(0, MAX_RESPOSTA) : "",
    };
  })
  .handler(async ({ data }): Promise<{ ok: true } | { ok: false; erro: string }> => {
    if (!(await temAcesso())) return { ok: false, erro: SEM_ACESSO };
    if (!data.id || !data.texto) return { ok: false, erro: "Escreva a resposta." };
    try {
      const { and, eq } = await import("drizzle-orm");
      const { getDb } = await import("@/lib/db");
      const { waConversations, waMessages } = await import("@/lib/schema");
      const { EXPLICACAO_BLOQUEIO, janela24hAberta, motivoEnvioBloqueado, sendText } =
        await import("@/lib/whatsapp-cloud");

      const bloqueio = motivoEnvioBloqueado();
      if (bloqueio) {
        return { ok: false, erro: `Não enviado: ${EXPLICACAO_BLOQUEIO[bloqueio]}.` };
      }

      const db = getDb();
      const [conversa] = await db
        .select({
          id: waConversations.id,
          waId: waConversations.waId,
          lastInboundAt: waConversations.lastInboundAt,
        })
        .from(waConversations)
        .where(and(eq(waConversations.id, data.id), eq(waConversations.tenant, TENANT)));
      if (!conversa) return { ok: false, erro: "Conversa não encontrada." };

      if (!janela24hAberta(conversa.lastInboundAt)) {
        return {
          ok: false,
          erro:
            "Não enviado: passaram 24 h da última mensagem do cliente. A Meta só aceita " +
            "modelo de mensagem aprovado fora dessa janela.",
        };
      }

      await db
        .update(waConversations)
        .set({ status: "aguardando_humano", updatedAt: new Date() })
        .where(eq(waConversations.id, conversa.id));

      const envio = await sendText(conversa.waId, data.texto);
      if (!envio.ok) return { ok: false, erro: `Não enviado: ${envio.erro}` };

      await db.insert(waMessages).values({
        conversationId: conversa.id,
        providerId: envio.providerId,
        direction: "saida",
        author: "humano",
        kind: "text",
        body: data.texto,
        occurredAt: new Date(),
      });
      await db
        .update(waConversations)
        .set({ lastMessageAt: new Date(), updatedAt: new Date() })
        .where(eq(waConversations.id, conversa.id));
      return { ok: true };
    } catch (error) {
      console.error("Falha ao responder pela fila humana:", error);
      return { ok: false, erro: INDISPONIVEL };
    }
  });
