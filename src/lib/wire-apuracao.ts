// APURAÇÃO NO SERVIDOR — o caminho barato do Wire (01/10/2026).
//
// Por que existe. Até aqui cada rodada pedia ao gpt-oss-20b que pesquisasse
// na web (browser_search). A Groq conta como token tudo o que a busca injeta
// no contexto, e uma rodada passava de 50 mil tokens. Com a cota grátis de
// 200 mil tokens/dia do modelo, o Wire fazia 3 ou 4 rodadas e passava o resto
// do dia recebendo 429: de 29/09 16h a 01/10 05h foram 32 rodadas sem
// publicação, 27 delas por cota. E o 20B é também a segunda reserva do agente
// de WhatsApp (whatsapp-provedores.ts), que ficava sem ela.
//
// Como funciona agora. O servidor faz a parte que gastava token:
//   1. lê os feeds RSS dos portais, que trazem a URL real da matéria (o
//      Google Notícias só traz um link embrulhado, que não se abre sem JS);
//   2. escolhe a pauta — de preferência um fato publicado por dois portais
//      diferentes; senão, a matéria mais recente da editoria;
//   3. baixa a página e extrai o texto;
//   4. só então chama o modelo, SEM busca, com o texto das fontes. São uns
//      poucos milhares de tokens por rodada em vez de dezenas de milhares.
//
// As fontes gravadas na matéria são as URLs que o SERVIDOR abriu — não as que
// o modelo diz ter aberto. Isso é mais forte que a regra antiga.
//
// Uma fonte só passou a valer: autorização do dono em 01/10/2026 ("pode
// quebrar a regra de duas fontes independentes para facilitar"). Quando dois
// portais cobrem o mesmo fato, as duas fontes continuam sendo usadas.
//
// Módulo puro: sem banco, sem SDK — importado pelo servidor e pelos testes.

export type Candidata = {
  readonly titulo: string;
  readonly url: string;
  readonly dominio: string;
  /** ms desde epoch; NaN quando o feed não traz data. */
  readonly publicadaEm: number;
  readonly resumo: string;
};

const ENTIDADES: Record<string, string> = {
  amp: "&",
  quot: '"',
  apos: "'",
  lt: "<",
  gt: ">",
  nbsp: " ",
  ndash: "–",
  mdash: "—",
  hellip: "…",
  rsquo: "’",
  lsquo: "‘",
  rdquo: "”",
  ldquo: "“",
  ordf: "ª",
  ordm: "º",
};

export function decodificarHtml(texto: string): string {
  return texto
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(Number(dec)))
    .replace(/&([a-z]+);/gi, (inteira, nome: string) => ENTIDADES[nome.toLowerCase()] ?? inteira);
}

function semTags(texto: string): string {
  // Duas passadas: muito feed manda o HTML do resumo escapado (&lt;p&gt;),
  // que só vira tag depois de decodificado.
  return decodificarHtml(texto.replace(/<[^>]+>/g, " "))
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function campo(bloco: string, tag: string): string {
  const achado = bloco.match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  if (!achado) return "";
  return semTags(achado[1].replace(/^\s*<!\[CDATA\[|\]\]>\s*$/g, ""));
}

export function dominioDe(url: string): string | null {
  try {
    const { hostname, protocol } = new URL(url);
    if (protocol !== "https:" && protocol !== "http:") return null;
    return hostname.replace(/^www\d?\./, "").toLowerCase();
  } catch {
    return null;
  }
}

/** Itens de um feed RSS 2.0, com a URL real de cada matéria. */
export function lerFeed(xml: string): Candidata[] {
  const itens: Candidata[] = [];
  for (const [, bloco] of xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)) {
    const titulo = campo(bloco, "title");
    const url = campo(bloco, "link");
    const dominio = dominioDe(url);
    if (!titulo || !dominio) continue;
    itens.push({
      titulo: titulo.slice(0, 220),
      url,
      dominio,
      publicadaEm: Date.parse(campo(bloco, "pubDate") || campo(bloco, "dc:date")),
      resumo: campo(bloco, "description").slice(0, 400),
    });
  }
  return itens;
}

// Páginas que o feed lista mas que não são matéria: vídeo, ao vivo, edição
// do telejornal, galeria, coluna social, guia de candidatos. Medido em
// 01/10/2026: a página de vídeo do g1 devolve como "texto" as manchetes da
// barra lateral — o modelo escreveria sobre outra coisa.
const NAO_E_MATERIA =
  /\/(videos?|ao-vivo|edicao|galerias?|fotos|podcasts?|playlist|web-stories)\//i;

export function pareceMateria(url: string): boolean {
  return !NAO_E_MATERIA.test(url);
}

// Parágrafo de verdade tem frase; menos que isso é legenda, crédito, botão.
const PARAGRAFO_MINIMO = 60;
/** Por fonte. Mantém a rodada em poucos milhares de tokens. */
export const TEXTO_MAXIMO_POR_FONTE = 3_000;
/** Abaixo disso não há matéria para reescrever, só chamada. */
export const TEXTO_MINIMO_POR_FONTE = 500;

/**
 * Texto corrido da matéria: os parágrafos do maior <article> da página (ou da
 * página toda, se não houver), sem script, menu, rodapé e repetições.
 */
export function extrairTexto(html: string): string {
  const limpo = html.replace(
    /<(script|style|noscript|svg|nav|header|footer|aside|form|figure|iframe)\b[\s\S]*?<\/\1>/gi,
    " ",
  );
  const artigos = [...limpo.matchAll(/<article\b[^>]*>([\s\S]*?)<\/article>/gi)].map((m) => m[1]);
  const maiorArtigo = artigos.sort((a, b) => b.length - a.length)[0];
  const escopo = maiorArtigo && maiorArtigo.length > 2_000 ? maiorArtigo : limpo;

  const vistos = new Set<string>();
  const paragrafos: string[] = [];
  for (const [, miolo] of escopo.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)) {
    const paragrafo = semTags(miolo);
    if (paragrafo.length < PARAGRAFO_MINIMO || vistos.has(paragrafo)) continue;
    vistos.add(paragrafo);
    paragrafos.push(paragrafo);
  }
  return paragrafos.join("\n").slice(0, TEXTO_MAXIMO_POR_FONTE);
}

const PALAVRAS_VAZIAS = new Set(
  (
    "a o as os de da do das dos e em no na nos nas um uma uns umas para por pelo pela com que se ao aos " +
    "sobre apos diz contra mais como entre sem ate nesta neste nessa nesse esta este hoje veja entenda " +
    "saiba confira apos quinta sexta sabado domingo segunda terca quarta feira"
  ).split(" "),
);

export function palavrasDoTitulo(titulo: string): Set<string> {
  return new Set(
    titulo
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, " ")
      .split(/\s+/)
      .filter((palavra) => palavra.length > 2 && !PALAVRAS_VAZIAS.has(palavra)),
  );
}

function sobreposicao(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let comuns = 0;
  for (const palavra of a) if (b.has(palavra)) comuns++;
  return comuns / Math.min(a.size, b.size);
}

/**
 * O texto extraído é mesmo da matéria do título? Um terço das palavras do
 * título (e pelo menos duas) precisa aparecer no começo do texto. Pega a
 * página de vídeo, a de paywall e a que o portal redireciona para a home.
 * Medido em 01/10/2026: a página de vídeo do g1 casa 0 palavras; a matéria da
 * InfoMoney sobre terras raras, de manchete analítica, casa 4 de 10 — com
 * metade como piso, ela era recusada.
 */
export function textoCombinaComTitulo(titulo: string, texto: string): boolean {
  const doTitulo = palavrasDoTitulo(titulo);
  if (doTitulo.size === 0) return false;
  const doTexto = palavrasDoTitulo(texto.slice(0, 1_500));
  let presentes = 0;
  for (const palavra of doTitulo) if (doTexto.has(palavra)) presentes++;
  return presentes >= 2 && presentes / doTitulo.size >= 1 / 3;
}

// Duas manchetes de portais diferentes são o mesmo fato? Medido em
// 01/10/2026 nos feeds reais: 0,5 já separa "BR-101 terá faixa bloqueada
// nesta noite para obra em Balneário Camboriú" (ND+) e "BR-101 terá bloqueio
// de faixa nesta quinta-feira em Balneário Camboriú" (Jornal Razão) de pares
// soltos como duas matérias diferentes sobre as eleições.
export const MESMO_FATO = 0.5;
const PALAVRAS_MINIMAS_PARA_PAREAR = 4;

export type Pauta = { readonly fontes: readonly Candidata[] };

export type OpcoesDaPauta = {
  readonly agora: number;
  /** Janela de frescor, em horas. */
  readonly janelaHoras: number;
  /** Prioridade editorial (ex.: Itajaí e BC na editoria SC). */
  readonly prioridade?: RegExp;
  /** Máximo de pautas devolvidas — cada uma pode custar downloads. */
  readonly limite: number;
};

/**
 * Ordena as pautas possíveis: primeiro as confirmadas por dois portais
 * diferentes, depois as de fonte única. Dentro de cada grupo, a prioridade
 * editorial vem na frente e, empatando, a mais recente.
 */
export function escolherPautas(candidatas: readonly Candidata[], opcoes: OpcoesDaPauta): Pauta[] {
  const piso = opcoes.agora - opcoes.janelaHoras * 60 * 60 * 1000;
  const vistas = new Set<string>();
  const frescas = candidatas.filter((c) => {
    if (!pareceMateria(c.url) || vistas.has(c.url)) return false;
    vistas.add(c.url);
    // Sem data no feed: aceita, mas vai para o fim da fila (ver `recencia`).
    return (
      !Number.isFinite(c.publicadaEm) ||
      (c.publicadaEm >= piso && c.publicadaEm <= opcoes.agora + 3_600_000)
    );
  });

  const prioritaria = (c: Candidata) => Boolean(opcoes.prioridade?.test(`${c.titulo} ${c.resumo}`));
  const recencia = (c: Candidata) => (Number.isFinite(c.publicadaEm) ? c.publicadaEm : 0);
  const comparar = (a: Candidata, b: Candidata) =>
    Number(prioritaria(b)) - Number(prioritaria(a)) || recencia(b) - recencia(a);

  const palavras = new Map(frescas.map((c) => [c.url, palavrasDoTitulo(c.titulo)]));
  const pares: Array<{ a: Candidata; b: Candidata; nota: number }> = [];
  for (let i = 0; i < frescas.length; i++) {
    for (let j = i + 1; j < frescas.length; j++) {
      const a = frescas[i];
      const b = frescas[j];
      if (a.dominio === b.dominio) continue;
      const pa = palavras.get(a.url)!;
      const pb = palavras.get(b.url)!;
      if (Math.min(pa.size, pb.size) < PALAVRAS_MINIMAS_PARA_PAREAR) continue;
      const nota = sobreposicao(pa, pb);
      if (nota >= MESMO_FATO) pares.push({ a, b, nota });
    }
  }
  pares.sort((x, y) => {
    const px = Number(prioritaria(x.a) || prioritaria(x.b));
    const py = Number(prioritaria(y.a) || prioritaria(y.b));
    return py - px || y.nota - x.nota || recencia(y.a) - recencia(x.a);
  });

  const pautas: Pauta[] = [];
  const usadas = new Set<string>();
  for (const { a, b } of pares) {
    if (usadas.has(a.url) || usadas.has(b.url)) continue;
    usadas.add(a.url);
    usadas.add(b.url);
    const [primeira, segunda] = comparar(a, b) <= 0 ? [a, b] : [b, a];
    pautas.push({ fontes: [primeira, segunda] });
  }
  for (const c of [...frescas].sort(comparar)) {
    if (usadas.has(c.url)) continue;
    pautas.push({ fontes: [c] });
  }
  return pautas.slice(0, opcoes.limite);
}

/** Nome do veículo para atribuição no texto ("segundo o ND+"). */
const VEICULOS: Record<string, string> = {
  "ndmais.com.br": "ND+",
  "nsctotal.com.br": "NSC Total",
  "scc10.com.br": "SCC10",
  "omunicipio.com.br": "O Município",
  "jornalrazao.com": "Jornal Razão",
  "olharsc.com.br": "Olhar SC",
  "pagina3.com.br": "Página 3",
  "g1.globo.com": "g1",
  "agenciabrasil.ebc.com.br": "Agência Brasil",
  "cnnbrasil.com.br": "CNN Brasil",
  "poder360.com.br": "Poder360",
  "infomoney.com.br": "InfoMoney",
  "exame.com": "Exame",
  "estadao.com.br": "Estadão",
  "canaltech.com.br": "Canaltech",
  "olhardigital.com.br": "Olhar Digital",
};

export function nomeDoVeiculo(dominio: string): string {
  return VEICULOS[dominio] ?? dominio;
}
