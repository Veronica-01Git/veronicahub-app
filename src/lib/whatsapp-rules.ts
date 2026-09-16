/**
 * Regras de negócio da Express Entulho.
 *
 * ESTE ARQUIVO É A ÚNICA FONTE DE VERDADE COMERCIAL DO AGENTE.
 *
 * O agente só pode afirmar o que está aqui. Não existe preço, prazo ou área
 * "que o modelo sabe" — o que não estiver neste arquivo, ele encaminha para
 * um humano. Desfazer uma cotação errada custa a venda e a confiança.
 *
 * COMO PREENCHER: troque os valores marcados como pendentes pelos reais,
 * colhidos com o proprietário. Enquanto `precosDefinidos` for false, o agente
 * se recusa a cotar, mesmo que o cliente insista.
 */

export type Preco = {
  readonly id: string;
  readonly rotulo: string;
  readonly capacidadeM3: number;
  readonly diasIncluidos: number;
  readonly valorReais: number;
};

export type RegrasNegocio = {
  readonly empresa: string;
  /** Vira true só quando a tabela abaixo for a real, confirmada pelo dono. */
  readonly precosDefinidos: boolean;
  readonly precos: readonly Preco[];
  readonly bairrosAtendidos: readonly string[];
  readonly horarioAtendimento: string;
  readonly prazoPadraoDias: number | null;
  /** Diária cobrada a partir do dia seguinte ao prazo contratado. */
  readonly diariaExtraReais: number | null;
  /** Prorrogação até este número de dias o agente concede sozinho. */
  readonly prorrogacaoSemAprovacaoDias: number;
  /** Desconto máximo, em %, que o agente concede sozinho. */
  readonly descontoMaximoPct: number;
  readonly observacoes: readonly string[];
};

export const REGRAS_EXPRESS_ENTULHO: RegrasNegocio = {
  empresa: "Express Entulho",

  // PENDENTE: vira true quando a tabela real entrar.
  precosDefinidos: false,
  precos: [],

  // PENDENTE: lista real de bairros e municípios atendidos.
  bairrosAtendidos: [],

  // PENDENTE: horário real.
  horarioAtendimento: "",

  prazoPadraoDias: null,
  diariaExtraReais: null,

  // Alçada do agente. Acima disso ele escala, mesmo com as regras completas.
  prorrogacaoSemAprovacaoDias: 3,
  descontoMaximoPct: 0,

  observacoes: [],
};

/** O agente só cota quando há preço real cadastrado. */
export function podeCotar(regras: RegrasNegocio): boolean {
  return regras.precosDefinidos && regras.precos.length > 0;
}

/** Todo valor em reais que o agente tem permissão de dizer. */
export function valoresPermitidos(regras: RegrasNegocio): readonly number[] {
  const out: number[] = regras.precos.map((p) => p.valorReais);
  if (regras.diariaExtraReais != null) out.push(regras.diariaExtraReais);
  return out;
}

/** Resumo das regras para o prompt. Só entra o que está preenchido. */
export function regrasParaPrompt(regras: RegrasNegocio): string {
  const linhas: string[] = [`Empresa: ${regras.empresa}.`];

  if (podeCotar(regras)) {
    linhas.push("Tabela de preços (únicos valores que você pode informar):");
    for (const p of regras.precos) {
      linhas.push(
        `- ${p.rotulo} (${p.capacidadeM3} m³), ${p.diasIncluidos} dias: R$ ${p.valorReais}`,
      );
    }
  } else {
    linhas.push(
      "TABELA DE PREÇOS NÃO CADASTRADA. Você não sabe nenhum preço. " +
        "Se perguntarem valor, diga que vai confirmar com a equipe e encaminhe.",
    );
  }

  if (regras.bairrosAtendidos.length > 0) {
    linhas.push(`Área atendida: ${regras.bairrosAtendidos.join(", ")}.`);
  } else {
    linhas.push("ÁREA ATENDIDA NÃO CADASTRADA. Não afirme se atende um bairro.");
  }

  if (regras.horarioAtendimento) linhas.push(`Horário: ${regras.horarioAtendimento}.`);
  if (regras.prazoPadraoDias != null) {
    linhas.push(`Prazo padrão de permanência: ${regras.prazoPadraoDias} dias.`);
  }
  if (regras.diariaExtraReais != null) {
    linhas.push(`Diária extra após o prazo: R$ ${regras.diariaExtraReais}.`);
  }

  linhas.push(
    `Você pode conceder prorrogação de até ${regras.prorrogacaoSemAprovacaoDias} dias ` +
      `e desconto de até ${regras.descontoMaximoPct}%. Acima disso, encaminhe a um humano.`,
  );

  for (const o of regras.observacoes) linhas.push(`- ${o}`);
  return linhas.join("\n");
}
