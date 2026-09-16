/**
 * O que o agente responde.
 *
 * ESTADO ATUAL: a Express Entulho ainda não passou as regras do negócio —
 * tabela de preços, área atendida, prazo padrão, política de prorrogação e
 * de multa, e até onde a IA decide sozinha. Enquanto isso não existir, este
 * módulo NÃO inventa número: ele confirma o recebimento, registra o pedido e
 * encaminha para um humano.
 *
 * Inventar preço para cliente é pior do que não responder — desfazer uma
 * cotação errada custa a venda e a confiança.
 *
 * `decidirResposta` é a costura onde o núcleo conversacional entra. Quando as
 * regras chegarem, é aqui que o LLM passa a decidir, mantendo o mesmo retorno.
 */

export type Decisao = {
  readonly texto: string;
  /** true quando a conversa precisa de um humano antes de prosseguir. */
  readonly escalar: boolean;
};

const APRESENTACAO =
  "Oi! Aqui é o atendimento da Express Entulho. " +
  "No momento estou em implantação e ainda não confirmo preço nem agendamento sozinho — " +
  "já registrei sua mensagem e uma pessoa da equipe responde em seguida.";

const RETORNO =
  "Recebi sua mensagem e anexei ao seu atendimento. " +
  "Uma pessoa da equipe continua daqui com você.";

/**
 * Assuntos que exigem decisão humana mesmo depois que as regras entrarem.
 * Ficam aqui porque são política comercial, não conhecimento do modelo.
 */
const FORA_DA_ALCADA = [
  /desconto/i,
  /\bmulta\b/i,
  /cancel/i,
  /isen(ç|c)(ã|a)o/i,
  /prorrog/i,
  /\bfatur/i,
  /\bboleto\b/i,
];

export function precisaDeHumano(texto: string): boolean {
  return FORA_DA_ALCADA.some((r) => r.test(texto));
}

export function decidirResposta(params: {
  readonly texto: string;
  readonly primeiraMensagem: boolean;
}): Decisao {
  const escalar = true; // enquanto não houver regras cadastradas, tudo escala
  return {
    texto: params.primeiraMensagem ? APRESENTACAO : RETORNO,
    escalar,
  };
}
