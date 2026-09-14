/** Formatação pt-BR. Centralizada para a demo inteira falar a mesma língua. */

const moeda = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

const inteiro = new Intl.NumberFormat("pt-BR");

export const fmtMoeda = (v: number): string => moeda.format(v);
export const fmtInteiro = (v: number): string => inteiro.format(v);
export const fmtDuracaoMin = (v: number): string => `${inteiro.format(v)} min`;

export function fmtEspera(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const resto = min % 60;
  return resto === 0 ? `${h} h` : `${h} h ${resto} min`;
}

export function fmtPct(v: number): string {
  const sinal = v > 0 ? "+" : "";
  return `${sinal}${inteiro.format(v)}%`;
}

/** "1 dia" / "3 dias" — plural correto, que a demo mostra o tempo todo. */
export function fmtDias(n: number): string {
  return `${n} ${n === 1 ? "dia" : "dias"}`;
}
