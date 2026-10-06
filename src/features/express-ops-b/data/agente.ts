/**
 * Ponte entre as telas do Express Operations e o núcleo conversacional.
 *
 * Roda no servidor de propósito: as chaves de modelo nunca descem para o
 * navegador. É o MESMO `decidirResposta` que o webhook do WhatsApp usa —
 * inclusive a guarda de preço. O que você vê aqui é o que o cliente
 * receberia lá.
 *
 * QUEM PODE CHAMAR. Server function é endpoint público: a tela estar atrás do
 * portão não protege a função. Cada chamada custa cota de modelo, então as
 * duas conferem o mesmo acesso que a tela confere — sessão do cliente privado
 * e conta autorizada do workspace da Express.
 */

import { createServerFn } from "@tanstack/react-start";
import { decidirResposta, motivoDaGuarda, type Turno } from "@/lib/whatsapp-agent";
import { REGRAS_EXPRESS_ENTULHO } from "@/lib/whatsapp-rules";

const SLUG_EXPRESS = "express-entulho";

export type RespostaAgente = {
  readonly texto: string;
  readonly escalar: boolean;
  readonly motivo?: string;
  /**
   * Id do registro de medição do rascunho (ver assistido-metricas.ts).
   * Ausente quando a medição falhou — o rascunho chega igual, porque medir
   * nunca pode custar a resposta.
   */
  readonly rascunhoId?: string;
};

export type RespostaTeste =
  | (RespostaAgente & {
      /**
       * O que a guarda diria da resposta. Quando ela barra, o cliente recebe a
       * frase de escalonamento — e o dono precisa ver que houve uma barrada,
       * não só o "vou confirmar".
       */
      readonly guarda: string | null;
    })
  | { readonly erro: string };

function validador(maxCaracteres: number, maxHistorico: number) {
  return (data: unknown): { mensagem: string; historico: Turno[] } => {
    const d = (data ?? {}) as { mensagem?: unknown; historico?: unknown };
    const mensagem =
      typeof d.mensagem === "string" ? d.mensagem.trim().slice(0, maxCaracteres) : "";
    const historico = Array.isArray(d.historico)
      ? d.historico
          .filter(
            (t): t is Turno =>
              !!t &&
              typeof t === "object" &&
              ((t as Turno).role === "user" || (t as Turno).role === "assistant") &&
              typeof (t as Turno).content === "string",
          )
          .slice(-maxHistorico)
          .map((t) => ({ role: t.role, content: t.content.slice(0, maxCaracteres) }))
      : [];
    return { mensagem, historico };
  };
}

async function temAcesso(): Promise<boolean> {
  const { avaliarAcessoAoWorkspace } = await import("@/features/private-clients/access.server");
  return (await avaliarAcessoAoWorkspace(SLUG_EXPRESS)).ok;
}

const SEM_ACESSO = "Sua sessão expirou. Entre de novo pelo painel com o selo da Express.";

export const conversarComAgente = createServerFn({ method: "POST" })
  .validator(validador(1200, 40))
  .handler(
    async ({ data }): Promise<RespostaAgente | { erro: string; texto: ""; escalar: false }> => {
      if (!(await temAcesso())) return { texto: "", erro: SEM_ACESSO, escalar: false };
      if (!data.mensagem) {
        return { texto: "Manda alguma coisa que eu respondo.", escalar: false };
      }
      const decisao = await decidirResposta({
        texto: data.mensagem,
        historico: data.historico,
        primeiraMensagem: data.historico.length === 0,
        regras: REGRAS_EXPRESS_ENTULHO,
      });
      const rascunhoId = await registrarRascunho(decisao);
      return { texto: decisao.texto, escalar: decisao.escalar, motivo: decisao.motivo, rascunhoId };
    },
  );

/* --------------------------------------------- medição do modo assistido */

/**
 * Grava que um rascunho foi gerado. Só métrica: tamanho, se escalou e o
 * motivo interno — nunca o texto. Qualquer falha (tabela 0025 ainda não
 * aplicada, banco fora) devolve `undefined` e o rascunho segue normalmente.
 */
async function registrarRascunho(decisao: {
  texto: string;
  escalar: boolean;
  motivo?: string;
}): Promise<string | undefined> {
  try {
    const { getDb } = await import("@/lib/db");
    const { assistidoRascunhos } = await import("@/lib/schema");
    const [linha] = await getDb()
      .insert(assistidoRascunhos)
      .values({
        tenant: SLUG_EXPRESS,
        escalou: decisao.escalar,
        motivo: decisao.motivo?.slice(0, 160) ?? null,
        tamanhoRascunho: decisao.texto.length,
      })
      .returning({ id: assistidoRascunhos.id });
    return linha?.id;
  } catch (error) {
    console.error("Medição do assistido indisponível (rascunho entregue mesmo assim):", error);
    return undefined;
  }
}

type DesfechoEntrada =
  | { id: string; desfecho: "copiado"; semelhanca: number; tamanhoFinal: number }
  | { id: string; desfecho: "descartado" };

function validarDesfecho(data: unknown): DesfechoEntrada | null {
  const d = (data ?? {}) as Record<string, unknown>;
  const id = typeof d.id === "string" ? d.id.slice(0, 64) : "";
  if (!id) return null;
  if (d.desfecho === "descartado") return { id, desfecho: "descartado" };
  const nota = d.semelhanca;
  const tamanho = d.tamanhoFinal;
  if (
    d.desfecho === "copiado" &&
    typeof nota === "number" &&
    nota >= 0 &&
    nota <= 1 &&
    typeof tamanho === "number" &&
    Number.isInteger(tamanho) &&
    tamanho >= 0
  ) {
    return { id, desfecho: "copiado", semelhanca: nota, tamanhoFinal: Math.min(tamanho, 5000) };
  }
  return null;
}

/**
 * O que a pessoa fez com o rascunho.
 *
 * A comparação rascunho × texto copiado roda no navegador (desfechoDaCopia):
 * nenhum texto de atendimento vem para cá, só a nota de 0 a 1 e o tamanho.
 * O servidor reclassifica pela nota para que o limiar viva num lugar só.
 *
 * Cópia pode sobrescrever cópia (vale a última que foi para o WhatsApp);
 * descarte só fecha rascunho ainda pendente — "Nova conversa" depois de
 * copiar não apaga o fato de que a resposta foi usada.
 */
export const registrarDesfechoRascunho = createServerFn({ method: "POST" })
  .validator(validarDesfecho)
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    if (!data || !(await temAcesso())) return { ok: false };
    try {
      const { and, eq } = await import("drizzle-orm");
      const { getDb } = await import("@/lib/db");
      const { assistidoRascunhos } = await import("@/lib/schema");
      const doRascunho = and(
        eq(assistidoRascunhos.id, data.id),
        eq(assistidoRascunhos.tenant, SLUG_EXPRESS),
      );

      if (data.desfecho === "descartado") {
        await getDb()
          .update(assistidoRascunhos)
          .set({ desfecho: "descartado", decididoEm: new Date() })
          .where(and(doRascunho, eq(assistidoRascunhos.desfecho, "pendente")));
        return { ok: true };
      }

      const { desfechoPorSemelhanca } = await import("@/lib/assistido-metricas");
      await getDb()
        .update(assistidoRascunhos)
        .set({
          desfecho: desfechoPorSemelhanca(data.semelhanca),
          semelhancaMil: Math.round(data.semelhanca * 1000),
          tamanhoFinal: data.tamanhoFinal,
          decididoEm: new Date(),
        })
        .where(doRascunho);
      return { ok: true };
    } catch (error) {
      console.error("Não registrei o desfecho do rascunho assistido:", error);
      return { ok: false };
    }
  });

/** Janela do resumo exibido na tela. */
const DIAS_DO_RESUMO = 7;

/** Resumo dos últimos dias, ou `null` quando a medição não está disponível. */
export const resumoAssistido = createServerFn({ method: "GET" }).handler(async () => {
  if (!(await temAcesso())) return null;
  try {
    const { and, eq, gte } = await import("drizzle-orm");
    const { getDb } = await import("@/lib/db");
    const { assistidoRascunhos } = await import("@/lib/schema");
    const { resumir, DESFECHOS } = await import("@/lib/assistido-metricas");
    const desde = new Date(Date.now() - DIAS_DO_RESUMO * 24 * 60 * 60 * 1000);
    const linhas = await getDb()
      .select({ desfecho: assistidoRascunhos.desfecho, escalou: assistidoRascunhos.escalou })
      .from(assistidoRascunhos)
      .where(
        and(eq(assistidoRascunhos.tenant, SLUG_EXPRESS), gte(assistidoRascunhos.createdAt, desde)),
      );
    const validos = DESFECHOS as readonly string[];
    return {
      dias: DIAS_DO_RESUMO,
      ...resumir(
        linhas.map((l) => ({
          desfecho: (validos.includes(l.desfecho)
            ? l.desfecho
            : "pendente") as (typeof DESFECHOS)[number],
          escalou: l.escalou,
        })),
      ),
    };
  } catch (error) {
    console.error("Resumo do assistido indisponível:", error);
    return null;
  }
});

/** Sala de teste: a conversa inteira do dono cabe no histórico. */
export const testarAgente = createServerFn({ method: "POST" })
  .validator(validador(1200, 40))
  .handler(async ({ data }): Promise<RespostaTeste> => {
    if (!(await temAcesso())) return { erro: SEM_ACESSO };
    if (!data.mensagem) return { erro: "Escreva uma mensagem." };

    const decisao = await decidirResposta({
      texto: data.mensagem,
      historico: data.historico,
      primeiraMensagem: data.historico.length === 0,
      regras: REGRAS_EXPRESS_ENTULHO,
    });

    const conversa = [...data.historico.map((t) => t.content), data.mensagem, decisao.texto].join(
      "\n",
    );
    return {
      texto: decisao.texto,
      escalar: decisao.escalar,
      motivo: decisao.motivo,
      guarda: motivoDaGuarda(decisao.texto, REGRAS_EXPRESS_ENTULHO, conversa),
    };
  });
