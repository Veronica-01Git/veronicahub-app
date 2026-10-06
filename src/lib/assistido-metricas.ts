/**
 * Medição do Atendimento Assistido da Express Entulho.
 *
 * POR QUE ISTO EXISTE. O modo assistido é o "modo sombra" da agente: ela
 * escreve, uma pessoa decide. Cada rascunho que a pessoa copia sem mexer é
 * uma conversa que a agente teria resolvido sozinha; cada edição ou descarte
 * mostra onde ela ainda erra. Sem contar isso, a decisão de deixar a agente
 * atender sozinha no número dedicado vira achismo.
 *
 * O QUE NÃO É GRAVADO, e é a parte que importa: nem o texto do cliente, nem o
 * rascunho, nem a resposta final, nem telefone ou nome. Só o desfecho, uma
 * nota de semelhança e tamanhos. O histórico de verdade continua sendo o do
 * WhatsApp Business, no aparelho da empresa — este módulo não lê, não envia e
 * não apaga nada lá (ver AGENTS.md).
 *
 * Funções puras: sem banco, sem rede. O servidor grava; aqui só se calcula.
 */

export const DESFECHOS = ["pendente", "copiado_igual", "copiado_editado", "descartado"] as const;
export type Desfecho = (typeof DESFECHOS)[number];

/** Acima disto a edição foi cosmética (vírgula, saudação) e conta como igual. */
const LIMIAR_IGUAL = 0.97;

/** O textarea aceita 1200; o teto protege o custo O(n·m) da comparação. */
const MAX_COMPARACAO = 1500;

function normalizar(texto: string): string {
  return texto.replace(/\s+/g, " ").trim().slice(0, MAX_COMPARACAO);
}

/** Distância de edição clássica, com duas linhas de memória. */
function distancia(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let anterior = Array.from({ length: b.length + 1 }, (_, j) => j);
  let atual = new Array<number>(b.length + 1);
  for (let i = 1; i <= a.length; i++) {
    atual[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const custo = a[i - 1] === b[j - 1] ? 0 : 1;
      atual[j] = Math.min(anterior[j] + 1, atual[j - 1] + 1, anterior[j - 1] + custo);
    }
    [anterior, atual] = [atual, anterior];
  }
  return anterior[b.length];
}

/** 1 = idêntico, 0 = nada em comum. Espaços extras não contam como edição. */
export function semelhanca(rascunho: string, final: string): number {
  const a = normalizar(rascunho);
  const b = normalizar(final);
  const maior = Math.max(a.length, b.length);
  if (maior === 0) return 1;
  return 1 - distancia(a, b) / maior;
}

export type DesfechoCopia = Extract<Desfecho, "copiado_igual" | "copiado_editado">;

/** Classificação pela nota — o mesmo limiar no navegador e no servidor. */
export function desfechoPorSemelhanca(nota: number): DesfechoCopia {
  return nota >= LIMIAR_IGUAL ? "copiado_igual" : "copiado_editado";
}

/** Desfecho de um rascunho que a pessoa copiou. */
export function desfechoDaCopia(
  rascunho: string,
  final: string,
): { desfecho: DesfechoCopia; semelhanca: number } {
  const nota = Math.round(semelhanca(rascunho, final) * 1000) / 1000;
  return { desfecho: desfechoPorSemelhanca(nota), semelhanca: nota };
}

export type LinhaResumo = { readonly desfecho: Desfecho; readonly escalou: boolean };

export type ResumoAssistido = {
  readonly total: number;
  readonly copiadoIgual: number;
  readonly copiadoEditado: number;
  readonly descartado: number;
  readonly pendente: number;
  readonly escalados: number;
  /**
   * Fração dos rascunhos DECIDIDOS que saíram sem edição. Pendentes ficam
   * fora do denominador: aba fechada não é voto contra a agente.
   * `null` enquanto não houver nenhum decidido.
   */
  readonly taxaUsoDireto: number | null;
};

export function resumir(linhas: readonly LinhaResumo[]): ResumoAssistido {
  let copiadoIgual = 0;
  let copiadoEditado = 0;
  let descartado = 0;
  let pendente = 0;
  let escalados = 0;
  for (const l of linhas) {
    if (l.escalou) escalados++;
    if (l.desfecho === "copiado_igual") copiadoIgual++;
    else if (l.desfecho === "copiado_editado") copiadoEditado++;
    else if (l.desfecho === "descartado") descartado++;
    else pendente++;
  }
  const decididos = copiadoIgual + copiadoEditado + descartado;
  return {
    total: linhas.length,
    copiadoIgual,
    copiadoEditado,
    descartado,
    pendente,
    escalados,
    taxaUsoDireto: decididos ? copiadoIgual / decididos : null,
  };
}
