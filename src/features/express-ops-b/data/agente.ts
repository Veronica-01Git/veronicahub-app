/**
 * Ponte entre a demonstração e o núcleo conversacional.
 *
 * Roda no servidor de propósito: a GROQ_API_KEY nunca desce para o navegador.
 * É o MESMO `decidirResposta` que o webhook do WhatsApp usa — inclusive a
 * guarda de preço. O que você vê aqui é o que o cliente receberia lá.
 */

import { createServerFn } from "@tanstack/react-start";
import { decidirResposta, type Turno } from "@/lib/whatsapp-agent";
import { REGRAS_EXPRESS_ENTULHO } from "@/lib/whatsapp-rules";

const MAX_CARACTERES = 500;
const MAX_HISTORICO = 12;

export type RespostaAgente = {
  readonly texto: string;
  readonly escalar: boolean;
  readonly motivo?: string;
};

function validar(data: unknown): { mensagem: string; historico: Turno[] } {
  const d = (data ?? {}) as { mensagem?: unknown; historico?: unknown };
  const mensagem = typeof d.mensagem === "string" ? d.mensagem.trim().slice(0, MAX_CARACTERES) : "";
  const historico = Array.isArray(d.historico)
    ? d.historico
        .filter(
          (t): t is Turno =>
            !!t &&
            typeof t === "object" &&
            ((t as Turno).role === "user" || (t as Turno).role === "assistant") &&
            typeof (t as Turno).content === "string",
        )
        .slice(-MAX_HISTORICO)
    : [];
  return { mensagem, historico };
}

export const conversarComAgente = createServerFn({ method: "POST" })
  .validator(validar)
  .handler(async ({ data }): Promise<RespostaAgente> => {
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
