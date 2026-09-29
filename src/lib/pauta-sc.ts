// Recorte da editoria Santa Catarina (29/09/2026).
//
// A editoria deixou de ser "Santa Catarina · IA" e passou a cobrir o estado,
// com foco em Itajaí e Balneário Camboriú, pedido da editora. Os portais mais
// lidos da região (DIARINHO à frente) são fortes em polícia, e a pauta é
// automática: não há ninguém revisando nome de suspeito, de vítima ou de
// morto antes de ir ao ar. Por isso polícia, crime, acidente e tragédia ficam
// fora — decisão editorial, registrada no mesmo pedido.
//
// A trava roda em duas pontas: no radar (a pauta nem chega ao modelo) e no
// rascunho pronto (o modelo pode achar outra pauta pela busca). O prompt
// também pede, mas prompt não é garantia.
//
// Módulo puro de propósito: é importado pelo servidor e pelos testes, e não
// pode arrastar banco nem SDK junto.

// Radicais, comparados depois do strip de acento. Ancorados no início da
// palavra, para "tiro" não pegar "retiro" nem "pres" pegar "presidente".
const FORA_DE_PAUTA =
  /\b(policia|policial|policiais|delegacia|delegad[oa]|pris(ao|oes)|pres[oa]s?\b|prend|crime|criminos|homicid|assassin|latrocinio|assalt|roub|furt|trafic|apreens|morte|morre|morto|morta|obito|acidente|colisao|capot|atropel|tiroteio|tiros?\b|balead|esfaque|facada|estupr|abuso sexual|sequestr|feminicid|afog|tragedia|vitima|golpe|golpista)/;

function normalizar(texto: string): string {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export function foraDaPautaSc(...textos: Array<string | null | undefined>): boolean {
  return FORA_DE_PAUTA.test(normalizar(textos.filter(Boolean).join(" ")));
}

// O Google Notícias indexa páginas de tag, de autor e de seção dos portais
// regionais como se fossem matérias: "TV DIARINHO", "Corinthians feminino",
// "Diego Matiello", "Publicações Legais". Medido em 29/09/2026: 52 dos 80
// itens recentes do DIARINHO no feed eram isso. Um desses como pauta não
// aponta fato nenhum, e o modelo tem que achar a matéria sozinho — suspeita
// para as rodadas daquele dia que pararam na trava de 72h. Manchete de
// verdade tem verbo e contexto;
// menos de cinco palavras, tirado o " - Portal" do fim, é índice.
export function tituloDeIndice(titulo: string): boolean {
  const semPortal = titulo.replace(/\s+-\s+[^-]+$/, "").trim();
  return semPortal.split(/\s+/).filter(Boolean).length < 5;
}

// Prefixo da recusa gravada pelo servidor. Mora aqui para o classificador de
// recusa editorial (editorial-skip.ts) e o servidor usarem o mesmo texto.
export const RECUSA_PAUTA_SC = "Pauta fora da linha editorial de Santa Catarina";
