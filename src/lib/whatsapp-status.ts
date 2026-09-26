/**
 * Avisos de entrega da Meta (`value.statuses` no webhook).
 *
 * A Graph aceitar o envio não quer dizer que a mensagem chegou: ela devolve o
 * id na hora e só depois avisa, por webhook, se entregou ou falhou. Sem ler
 * esse aviso, uma resposta recusada fica registrada como enviada e ninguém
 * descobre o motivo sem abrir o painel da Meta.
 *
 * Só a falha interessa aqui. "sent", "delivered" e "read" chegam a cada
 * mensagem e não pedem ação de ninguém.
 */

export type StatusMeta = {
  id?: string;
  status?: string;
  timestamp?: string;
  recipient_id?: string;
  errors?: {
    code?: number;
    title?: string;
    message?: string;
    error_data?: { details?: string };
  }[];
};

export type FalhaDeEntrega = {
  /** wamid da mensagem que não chegou. */
  readonly mensagemId: string;
  /** Número do destinatário, como a Meta devolve. */
  readonly waId: string;
  readonly ocorridoEm: Date;
  readonly codigo: number | null;
  /** Frase pronta para o histórico da conversa. */
  readonly descricao: string;
};

export function extrairFalhasDeEntrega(statuses: StatusMeta[] | undefined): FalhaDeEntrega[] {
  const falhas: FalhaDeEntrega[] = [];
  for (const s of statuses ?? []) {
    if (s.status !== "failed" || !s.id || !s.recipient_id) continue;

    const erro = s.errors?.[0];
    const codigo = typeof erro?.code === "number" ? erro.code : null;
    const motivo = [erro?.title, erro?.error_data?.details ?? erro?.message]
      .filter((parte, i, partes) => parte && partes.indexOf(parte) === i)
      .join(" — ");

    falhas.push({
      mensagemId: s.id,
      waId: s.recipient_id,
      ocorridoEm: s.timestamp ? new Date(Number(s.timestamp) * 1000) : new Date(),
      codigo,
      descricao:
        `Mensagem não entregue pela Meta` +
        (codigo !== null ? ` (código ${codigo})` : "") +
        (motivo ? `: ${motivo}` : ""),
    });
  }
  return falhas;
}
