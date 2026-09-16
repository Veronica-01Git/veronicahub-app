// Convenção do banco curado de capas da Wire TV.
//
// O banco mora na biblioteca de imagens do Admin, e a única ligação entre o
// que uma pessoa envia pelo navegador e o que a consulta procura é o nome do
// arquivo: `wire-banco-<editoria>-...`. Foi escolhido nome de arquivo em vez
// de coluna nova porque o upload do Admin grava o nome enviado — então dá
// para curar tudo pelo navegador, que é o único caminho de quem não tem
// terminal (decisão de 13/09).
//
// O abastecimento automático pelo Pexels (scripts/fill-cover-bank.mjs) usa a
// mesma convenção, com o id da foto no nome. Isso faz o dedupe por nome de
// arquivo, que a biblioteca já tem, servir também de trava contra cadastrar a
// mesma foto duas vezes — sem coluna nova e sem consulta extra.
//
// Módulo puro de propósito: é importado pelo servidor, pelo cron e pelos
// testes, e não pode arrastar banco nem SDK junto.
import { BEAT_VALUES, type Beat } from "./beats.ts";

export const LIBRARY_COVER_PREFIX = "wire-banco-";

// Teto por editoria. A biblioteca é banco Postgres (Neon, 512 MB no plano
// atual) e cada foto pesa 200–400 KB em base64: 24 por editoria dá ~40 MB no
// pior caso, com folga. Sem teto, um laço com erro no script encheria o banco
// em uma rodada — e o rodízio de pickLibraryCover já não melhora depois de
// algumas dezenas, porque ele só evita as últimas 40 usadas.
export const MAX_BANK_PER_BEAT = 24;

export const BANK_SOURCE = "pexels";

export function bankFilename(input: { beat: Beat; photoId: string }): string {
  return `${LIBRARY_COVER_PREFIX}${input.beat}-${BANK_SOURCE}-${input.photoId}.jpg`;
}

// Devolve null para qualquer nome fora da convenção — inclusive os que uma
// pessoa subiu à mão pelo Admin, que são válidos no banco e simplesmente não
// têm id de foto para extrair.
export function parseBankFilename(
  filename: string,
): { beat: Beat; source: string; photoId: string } | null {
  const match = new RegExp(`^${LIBRARY_COVER_PREFIX}([a-z]+)-([a-z]+)-(\\d+)\\.jpg$`).exec(
    filename,
  );
  if (!match) return null;
  const [, beat, source, photoId] = match;
  if (!(BEAT_VALUES as readonly string[]).includes(beat)) return null;
  return { beat: beat as Beat, source, photoId };
}

// O crédito do fotógrafo mora no altText porque a biblioteca não tem coluna
// para ele, e o altText é justamente o campo que o Admin mostra — quem curar
// pelo navegador lê o crédito sem precisar de terminal.
//
// buildBankAltText e parseBankCredit são um par: o teste trava a ida e volta.
// Se alguém editar o altText à mão pelo Admin e quebrar o formato, o crédito
// some e a capa continua funcionando — degradação silenciosa aceitável, já
// que nenhuma página do site exibe crédito hoje.
export function buildBankAltText(input: {
  photographer: string;
  beat: Beat;
  term: string;
}): string {
  return `Foto de ${input.photographer} no Pexels — banco Wire TV · ${input.beat} · ${input.term}`.slice(
    0,
    300,
  );
}

export function parseBankCredit(altText: string | null): string | null {
  if (!altText) return null;
  const match = /^Foto de (.+?) no Pexels —/.exec(altText);
  return match ? `${match[1]}/Pexels` : null;
}

// Intercala as listas de candidatos de cada termo, em vez de esvaziar a
// primeira antes de passar para a segunda.
//
// Medido no primeiro dry run do abastecimento (16/09): as 8 fotos de cada
// editoria saíram todas da mesma busca — clima inteiro veio de "wind turbines
// field", geopolítica inteira de "international flags row". Não é a mesma
// imagem repetida, e por isso nenhuma trava de duplicata acusaria; mas é a
// mesma cena oito vezes, e na home lê como repetição do mesmo jeito. O banco
// existe justamente para acabar com isso.
//
// Intercalando, uma editoria com seis termos e alvo de oito recebe pelo menos
// uma foto de cada cena antes de repetir qualquer termo.
export function interleaveByTerm<T>(lists: T[][]): T[] {
  const result: T[] = [];
  const deepest = lists.reduce((max, list) => Math.max(max, list.length), 0);
  for (let index = 0; index < deepest; index += 1) {
    for (const list of lists) {
      if (index < list.length) result.push(list[index]);
    }
  }
  return result;
}
