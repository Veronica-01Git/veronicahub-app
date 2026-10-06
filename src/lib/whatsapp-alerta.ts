/**
 * Aviso por e-mail quando a agente passa uma conversa para a equipe.
 *
 * Sem isto, "uma pessoa te responde em seguida" era promessa sem ninguém do
 * outro lado: a conversa ficava marcada no banco esperando alguém abrir o
 * painel por acaso.
 *
 * Destinatários: `EXPRESS_ALERTA_EMAILS`; se vazia, a mesma allowlist que já
 * dá acesso ao painel (`EXPRESS_OPERATIONS_ALLOWED_EMAILS`) — quem pode
 * responder é quem precisa saber. Usa a Resend já configurada para o login.
 *
 * REGRA DE OURO: aviso que falha nunca derruba o atendimento. Erro aqui vira
 * log, e a conversa segue marcada no painel do mesmo jeito.
 */

import { parseAllowedEmails } from "../features/private-clients/access-policy";
import { mensagemDeAlerta } from "./whatsapp-atendimento";

const URL_PAINEL = "https://veronicahub.com/clientes/express-entulho/operacoes/atendimento";

export function destinatariosDoAlerta(): readonly string[] {
  const proprios = parseAllowedEmails(process.env.EXPRESS_ALERTA_EMAILS);
  return proprios.length
    ? proprios
    : parseAllowedEmails(process.env.EXPRESS_OPERATIONS_ALLOWED_EMAILS);
}

export async function avisarEquipe(params: {
  readonly nome: string | null;
  readonly waId: string;
  readonly motivo: string | undefined;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const para = destinatariosDoAlerta();
  if (!apiKey || !from || para.length === 0) {
    console.error(
      "Conversa aguardando humano SEM aviso por e-mail: falta RESEND_API_KEY, EMAIL_FROM " +
        "ou EXPRESS_ALERTA_EMAILS/EXPRESS_OPERATIONS_ALLOWED_EMAILS",
    );
    return;
  }

  const { assunto, texto } = mensagemDeAlerta({ ...params, urlPainel: URL_PAINEL });
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: para, subject: assunto, text: texto }),
    });
    if (!res.ok) console.error(`Aviso à equipe recusado pela Resend (${res.status})`);
  } catch (error) {
    console.error("Aviso à equipe não saiu:", error);
  }
}
