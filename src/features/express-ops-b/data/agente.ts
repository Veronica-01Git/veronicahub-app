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
  .validator(validador(500, 12))
  .handler(async ({ data }): Promise<RespostaAgente> => {
    if (!(await temAcesso())) return { texto: SEM_ACESSO, escalar: false };
    if (!data.mensagem) {
      return { texto: "Manda alguma coisa que eu respondo.", escalar: false };
    }
    const decisao = await decidirResposta({
      texto: data.mensagem,
      historico: data.historico,
      primeiraMensagem: data.historico.length === 0,
      regras: REGRAS_EXPRESS_ENTULHO,
    });
    return { texto: decisao.texto, escalar: decisao.escalar, motivo: decisao.motivo };
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
