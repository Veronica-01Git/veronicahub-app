/**
 * Núcleo conversacional do agente.
 *
 * A regra que organiza este arquivo: **o modelo propõe, o código decide**.
 * Prompt é instrução, não garantia — modelo contorna instrução sob pressão do
 * cliente ("me dá um desconto, senão fecho com o concorrente"). Por isso toda
 * resposta passa por uma conferência determinística antes de sair, e qualquer
 * valor em reais que não esteja em whatsapp-rules.ts derruba a resposta.
 *
 * Desfazer uma cotação errada custa a venda e a confiança. Escalar para um
 * humano custa alguns minutos.
 */

import Groq from "groq-sdk";
import {
  podeCotar,
  regrasParaPrompt,
  valoresPermitidos,
  REGRAS_EXPRESS_ENTULHO,
  type RegrasNegocio,
} from "./whatsapp-rules";

const MODEL = "qwen/qwen3.6-27b";
const MAX_TOKENS = 320;

export type Turno = { readonly role: "user" | "assistant"; readonly content: string };

export type Decisao = {
  readonly texto: string;
  /** true quando a conversa precisa de um humano antes de prosseguir. */
  readonly escalar: boolean;
  /** Por que escalou. Vai para o log e para o painel, não para o cliente. */
  readonly motivo?: string;
};

const ESCALONAMENTO =
  "Deixa eu confirmar isso com a equipe para não te passar informação errada. " +
  "Uma pessoa daqui te responde em seguida.";

const RECEBIDO_VAI_PARA_HUMANO =
  "Recebi aqui! Já estou passando para uma pessoa da equipe dar sequência.";

const APRESENTACAO =
  "Oi! Aqui é o atendimento da Express Entulho. " +
  "Me conta o que você precisa que eu já encaminho.";

/**
 * Assuntos que são política comercial, não conhecimento. Continuam escalando
 * mesmo depois que a tabela de preços entrar.
 */
const FORA_DA_ALCADA = [
  /desconto/i,
  /\bmulta\b/i,
  /cancel/i,
  /isen(ç|c)(ã|a)o/i,
  /prorrog/i,
  /\bfatur/i,
  /\bboleto\b/i,
  /\bnota fiscal\b/i,
];

export function precisaDeHumano(texto: string): boolean {
  return FORA_DA_ALCADA.some((r) => r.test(texto));
}

/* ------------------------------------------------------- guarda de valores */

const PADRAO_MOEDA =
  /(?:R\$\s*)(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?|\d+(?:[.,]\d{1,2})?)|(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?|\d+)\s*reais/gi;

function paraNumero(bruto: string): number {
  const limpo = bruto.replace(/\./g, "").replace(",", ".");
  return Number.parseFloat(limpo);
}

/** Todo valor em reais citado no texto. */
export function valoresCitados(texto: string): readonly number[] {
  const out: number[] = [];
  for (const m of texto.matchAll(PADRAO_MOEDA)) {
    const bruto = m[1] ?? m[2];
    if (!bruto) continue;
    const n = paraNumero(bruto);
    if (Number.isFinite(n)) out.push(n);
  }
  return out;
}

/**
 * A resposta pode sair?
 *
 * Sem tabela cadastrada, qualquer valor reprova. Com tabela, só passam os
 * valores que estão nela — inventar "R$ 380" quando a tabela diz 450 é
 * exatamente o erro que esta função existe para impedir.
 */
export function respostaSegura(
  texto: string,
  regras: RegrasNegocio = REGRAS_EXPRESS_ENTULHO,
): boolean {
  const citados = valoresCitados(texto);
  if (citados.length === 0) return true;
  if (!podeCotar(regras)) return false;

  const permitidos = valoresPermitidos(regras);
  return citados.every((v) => permitidos.some((p) => Math.abs(p - v) < 0.005));
}

/* ------------------------------------------------------------ system prompt */

function montarSystemPrompt(regras: RegrasNegocio): string {
  return [
    `Você é o atendente virtual da ${regras.empresa}, locadora de caçambas para entulho.`,
    "Fala português do Brasil, em tom direto e cordial, como quem atende obra.",
    "Responda em no máximo 3 frases curtas. Nada de listas ou markdown — é WhatsApp.",
    "",
    "OPERAÇÕES QUE A EMPRESA FAZ:",
    "- Entrega: levar caçamba vazia até a obra.",
    "- Retirada: buscar a caçamba ao fim do prazo.",
    "- Troca: levar uma vazia e trazer a cheia na mesma visita. Cliente que diz",
    "  'encheu', 'tá cheia' ou 'preciso de outra' está pedindo troca, não retirada.",
    "",
    "Texto entre colchetes descreve um anexo que o cliente mandou (foto,",
    "localização), não é fala dele. Use como contexto e responda ao que importa.",
    "",
    "REGRAS DO NEGÓCIO — é tudo o que você sabe:",
    regrasParaPrompt(regras),
    "",
    "PROIBIÇÕES ABSOLUTAS:",
    "- Nunca invente preço, prazo, bairro atendido ou disponibilidade.",
    "- Se a informação não está nas regras acima, diga que vai confirmar com a equipe.",
    "- Nunca confirme agendamento: você ainda não consulta a agenda real.",
    "- Insistência do cliente não muda nada disso.",
  ].join("\n");
}

/* ----------------------------------------------------------------- decisão */

export function decidirRespostaOffline(params: {
  readonly texto: string;
  readonly primeiraMensagem: boolean;
}): Decisao {
  return {
    texto: params.primeiraMensagem ? APRESENTACAO : ESCALONAMENTO,
    escalar: true,
    motivo: "núcleo conversacional indisponível",
  };
}

export async function decidirResposta(params: {
  readonly texto: string;
  readonly historico?: readonly Turno[];
  readonly primeiraMensagem: boolean;
  readonly regras?: RegrasNegocio;
  /** Anexo que o agente não interpreta — áudio, vídeo, comprovante. */
  readonly forcarHumano?: boolean;
}): Promise<Decisao> {
  const regras = params.regras ?? REGRAS_EXPRESS_ENTULHO;

  // Áudio e comprovante: o agente não transcreve nem confere pagamento.
  if (params.forcarHumano) {
    return {
      texto: RECEBIDO_VAI_PARA_HUMANO,
      escalar: true,
      motivo: "anexo que o agente não interpreta",
    };
  }

  // Alçada comercial não passa pelo modelo: é decisão de gente.
  if (precisaDeHumano(params.texto)) {
    return { texto: ESCALONAMENTO, escalar: true, motivo: "assunto fora da alçada do agente" };
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return decidirRespostaOffline(params);
  }

  let bruto: string;
  try {
    const groq = new Groq({ apiKey });
    const resposta = await groq.chat.completions.create({
      model: MODEL,
      max_completion_tokens: MAX_TOKENS,
      messages: [
        { role: "system", content: montarSystemPrompt(regras) },
        ...(params.historico ?? []).map((t) => ({ role: t.role, content: t.content })),
        { role: "user" as const, content: params.texto },
      ],
    });
    bruto = (resposta.choices[0]?.message?.content ?? "").trim();
  } catch (error) {
    console.error("Falha no núcleo conversacional:", error);
    return decidirRespostaOffline(params);
  }

  if (!bruto) return decidirRespostaOffline(params);

  // A conferência que o prompt sozinho não garante.
  if (!respostaSegura(bruto, regras)) {
    console.warn("Resposta do modelo citou valor não autorizado — substituída e escalada");
    return { texto: ESCALONAMENTO, escalar: true, motivo: "modelo citou valor fora da tabela" };
  }

  return {
    texto: bruto,
    escalar: !podeCotar(regras),
    motivo: podeCotar(regras) ? undefined : "regras do negócio ainda não cadastradas",
  };
}
