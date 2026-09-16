// Classificação da recusa editorial do cron da Wire TV.
//
// Mora fora de article-cron.ts para poder ser testado com as strings reais que
// saíram das rodadas — article-cron importa banco e não sobe num teste de Node.

// A recusa do modelo ("não achei fato verificável") é a única mensagem desta
// lista que o próprio modelo escreve, e por isso a única que não dá para casar
// por texto exato. Medido em 15/09, em duas rodadas seguidas que ficaram
// vermelhas sem nada estar quebrado:
//
//   23:00, geopolítica — "sem verifável no momento (radar: 1 pauta)"
//   22:00, economia    — 400 do provedor, tool_use_failed, com
//                        failed_generation contendo a frase certa
//
// Nos dois casos o modelo estava dizendo exatamente o que o prompt pede que
// ele diga quando não há fato: no primeiro ele digitou errado, no segundo a
// resposta veio embrulhada numa chamada de ferramenta inválida. O prefixo
// exato não casou, a recusa foi classificada como falha, e o endpoint
// devolveu 502 — recusa editorial legítima virando rodada vermelha, que é o
// que polui o histórico e esconde falha de verdade no meio.
//
// Daí a tolerância: acento e caixa normalizados, miolo da palavra frouxo
// ("verifável", "verificável") e busca em qualquer posição da string, não só
// no começo — é o que alcança a frase dentro do corpo de erro do provedor.
// Um 400 de tool_use_failed que NÃO traga a frase continua sendo falha, que é
// o correto: aí o problema é de infraestrutura, não editorial.
const NO_VERIFIABLE_FACT = /sem\s+(?:\w+\s+)?verif\w*vel/;

function withoutAccents(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function isEditorialSkip(error: string): boolean {
  if (NO_VERIFIABLE_FACT.test(withoutAccents(error))) return true;

  // As demais são escritas pelo servidor, com texto determinístico — casar por
  // prefixo exato aqui continua certo.
  return [
    "429",
    "A matéria não ficou ancorada a uma pauta",
    "A data do fato está fora da janela editorial de 72h",
    "Já existe matéria publicada nessa janela",
    "Manchete parecida demais com uma publicação recente",
    "Só ",
    "Corpo com ",
    "As fontes precisam vir de pelo menos",
  ].some((prefix) => error.startsWith(prefix));
}
