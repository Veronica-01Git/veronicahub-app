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
import { escolherCena, type MateriaParaCapa } from "./cover-scenes.ts";

export const LIBRARY_COVER_PREFIX = "wire-banco-";

// Teto por editoria. A biblioteca é banco Postgres (Neon, 512 MB no plano
// atual) e cada foto pesa 200–400 KB em base64: 24 por editoria dá ~40 MB no
// pior caso, com folga. Sem teto, um laço com erro no script encheria o banco
// em uma rodada — e o rodízio de pickLibraryCover já não melhora depois de
// algumas dezenas, porque ele só evita as últimas 40 usadas.
export const MAX_BANK_PER_BEAT = 24;

// Pexels primeiro, Pixabay como segunda fonte — a mesma ordem que o resto do
// pipeline já usa. Passaram a abastecer o banco juntos em 20/09: com uma
// fonte só, as cenas mais específicas do catálogo (degelo, queimada, controle
// de fronteira) voltavam poucas fotos em 4K e a editoria ficava abaixo do
// alvo. Duas fontes cobrem o catálogo sem afrouxar o corte de resolução.
export const BANK_SOURCES = ["pexels", "pixabay"] as const;
export type BankSource = (typeof BANK_SOURCES)[number];

// Mantido: era o nome exportado quando o Pexels era fonte única, e continua
// sendo o padrão de quem não informa a fonte.
export const BANK_SOURCE: BankSource = "pexels";

export function isBankSource(value: unknown): value is BankSource {
  return typeof value === "string" && (BANK_SOURCES as readonly string[]).includes(value);
}

const SOURCE_LABELS: Record<BankSource, string> = {
  pexels: "Pexels",
  pixabay: "Pixabay",
};

export function bankFilename(input: { beat: Beat; photoId: string; source?: BankSource }): string {
  return `${LIBRARY_COVER_PREFIX}${input.beat}-${input.source ?? BANK_SOURCE}-${input.photoId}.jpg`;
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
  source?: BankSource;
}): string {
  const fonte = SOURCE_LABELS[input.source ?? BANK_SOURCE];
  return `Foto de ${input.photographer} no ${fonte} — banco Wire TV · ${input.beat} · ${input.term}`.slice(
    0,
    300,
  );
}

// Devolve SÓ o nome do fotógrafo. Quem escreve "/ Pexels" é quem exibe — a
// página da matéria monta "Foto: <nome> / <fonte>" e a legenda do Instagram
// faz o mesmo. Medido em 16/09: devolvendo "Nome/Pexels" daqui, o rodapé da
// capa saía "Foto: Nome/Pexels / Pexels".
export function parseBankCredit(altText: string | null): string | null {
  if (!altText) return null;
  // `no (Pexels|Pixabay)` em vez de `no Pexels`: o banco passou a ter duas
  // fontes em 20/09, e a forma antiga devolveria null para toda foto do
  // Pixabay — ou seja, foto publicada sem creditar quem a fez.
  const match = /^Foto de (.+?) no (?:Pexels|Pixabay) —/.exec(altText);
  return match ? match[1] : null;
}

// A cena é o último campo do altText, e é ela que liga a foto do banco ao
// assunto da matéria (ver cover-scenes.ts). Sai null para foto que alguém
// subiu à mão pelo Admin, que não segue o formato — e essa foto simplesmente
// não concorre na escolha por relevância, só no rodízio.
export function parseBankTerm(altText: string | null): string | null {
  if (!altText) return null;
  const match = /— banco Wire TV · [a-z]+ · (.+)$/.exec(altText);
  return match ? match[1].trim() : null;
}

export function parseBankSource(altText: string | null): BankSource | null {
  if (!altText) return null;
  const match = /^Foto de .+? no (Pexels|Pixabay) —/.exec(altText);
  if (!match) return null;
  return match[1].toLowerCase() as BankSource;
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

// Escolhe, entre as fotos que a editoria tem no banco, a que faz jus à
// matéria — o pedido do editor-chefe em 20/09.
//
// Antes daqui a escolha era rodízio puro: a foto era da editoria certa, mas
// não do assunto, e uma nota de enchente saía com parque eólico porque as
// duas são "clima". Agora a cena vem de escolherCena (cover-scenes.ts), que
// lê o texto da matéria e aponta qual das cenas JÁ CURADAS combina. O que não
// voltou — e não pode voltar — é pedir ao modelo um termo em inglês sobre o
// fato específico e buscar ao vivo: foi assim que a enchente em Telangana
// saiu com uma rua americana e placa "ROAD CLOSED" (removido em 13/09).
//
// Ordem de preferência:
//   1. foto da cena que casa com a matéria, ainda não usada recentemente;
//   2. qualquer foto da editoria ainda não usada recentemente (rodízio, o
//      comportamento antigo) — quando nenhuma cena bate ou a cena certa já
//      foi toda usada;
//   3. null, e quem chama cai para a arte gerada do slug.
//
// Função pura: recebe os candidatos já lidos do banco. Quem consulta é
// articles-server (servidor) e cover-bank-cron (troca em lote), e os dois
// precisam da MESMA regra — se divergirem, a capa que a matéria recebe ao
// publicar deixa de ser a que a troca em lote daria.
export type BankCandidate = {
  id: string;
  altText: string | null;
};

export function pickRelevantCover(input: {
  beat: Beat;
  materia: MateriaParaCapa;
  candidatos: readonly BankCandidate[];
  // Ids já usados nas capas recentes. Não é filtro rígido: se a cena certa
  // só tem foto já usada, repetir a foto certa é melhor que dar a foto errada.
  usadosRecentemente?: readonly string[];
  // Rodízio dentro do grupo escolhido, para duas matérias da mesma cena no
  // mesmo lote não receberem a mesma foto.
  offset?: number;
}): { id: string; term: string | null; relevante: boolean } | null {
  const { beat, materia, candidatos } = input;
  if (candidatos.length === 0) return null;

  const usados = new Set(input.usadosRecentemente ?? []);
  const offset = input.offset ?? 0;
  const cena = escolherCena(beat, materia);

  const daCena = cena
    ? candidatos.filter((candidato) => parseBankTerm(candidato.altText) === cena)
    : [];

  // Cada nível tenta primeiro o que não foi usado recentemente e só então
  // aceita repetir — melhor repetir foto do que devolver capa sem relação com
  // o texto, e melhor ainda do que devolver nada.
  const niveis: { lista: BankCandidate[]; relevante: boolean }[] = [
    { lista: daCena.filter((c) => !usados.has(c.id)), relevante: true },
    { lista: daCena, relevante: true },
    { lista: candidatos.filter((c) => !usados.has(c.id)), relevante: false },
    { lista: [...candidatos], relevante: false },
  ];

  for (const nivel of niveis) {
    if (nivel.lista.length === 0) continue;
    const escolhida = nivel.lista[offset % nivel.lista.length];
    return {
      id: escolhida.id,
      term: parseBankTerm(escolhida.altText),
      relevante: nivel.relevante,
    };
  }
  return null;
}
