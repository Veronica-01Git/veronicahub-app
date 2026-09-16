// Escolha da foto pelo assunto da matéria, não por rodízio.
//
// O banco é curado por editoria, então até aqui a atribuição era rodízio: a
// próxima foto da editoria, qualquer que fosse o assunto. Resultado medido em
// 16/09: a matéria "Alerta de chuvas intensas e temporais atinge seis estados"
// recebeu um parque eólico. Não é foto errada de editoria — é foto que não
// ilustra o fato, que é o defeito de sempre, só que por outro caminho.
//
// Como funciona: cada termo de busca do banco tem uma lista de palavras que,
// aparecendo na manchete ou no resumo, indicam aquele tema. Quem casa mais
// palavras vence. Nenhum casamento, cai no rodízio — foto genérica da editoria
// é melhor que foto que contradiz a matéria.
//
// A lista é curadoria editorial, não heurística esperta: mexer aqui é decidir
// o que ilustra o quê, e um humano faz isso melhor que um modelo adivinhando.
import type { Beat } from "./beats.ts";
import { BANK_TERMS } from "./cover-bank.ts";

// Palavras em português, já sem acento e em minúsculas (ver normalizeText).
// Radicais curtos de propósito: "enchent" cobre enchente/enchentes,
// "eolic" cobre eólica/eólicas/eólico.
const TERM_KEYWORDS: Record<string, readonly string[]> = {
  // IA
  "data center server room": [
    "data center",
    "datacenter",
    "servidor",
    "nuvem",
    "computac",
    "infraestrutura de ia",
    "gigawatt",
  ],
  "circuit board macro": ["placa", "circuito", "hardware", "componente"],
  "industrial robotic arm": [
    "robo",
    "robotic",
    "automacao",
    "industria",
    "manufatura",
    "agente autonomo",
  ],
  "computer chip closeup": [
    "chip",
    "semicondutor",
    "processador",
    "cpu",
    "gpu",
    "nanometro",
    "wafer",
  ],
  "network cables rack": ["rede", "conectividade", "internet", "banda larga", "5g", "fibra"],
  "person coding multiple screens": [
    "software",
    "programac",
    "codigo",
    "desenvolvedor",
    "aplicativo",
    "app",
    "modelo de linguagem",
    "chatbot",
  ],

  // Clima
  "wind turbines field": ["eolic", "vento", "turbina"],
  "solar panel farm aerial": ["solar", "fotovoltaic", "painel", "paineis"],
  "flooded street after rain": [
    "enchent",
    "alagament",
    "inundac",
    "transbord",
    "chuva",
    "tempora",
    "desabrigad",
  ],
  "cracked dry earth drought": ["seca", "estiagem", "desertificac", "escassez hidrica"],
  "storm clouds over city": [
    "tempestade",
    "tempora",
    "ciclone",
    "vendava",
    "granizo",
    "alerta",
    "rajada",
    "furac",
  ],
  "high voltage transmission lines": [
    "rede eletrica",
    "transmissao",
    "linh",
    "apag",
    "energia eletrica",
    "bateria",
    "armazenamento",
    "leil",
  ],

  // Economia
  "stock exchange trading screens": [
    "bolsa",
    "acoes",
    "preg",
    "investidor",
    "ibovespa",
    "mercado financeiro",
  ],
  "central bank building facade": [
    "banco central",
    "copom",
    "politica monetaria",
    "juros",
    "selic",
    "bce",
    "pboc",
  ],
  "banknotes currency closeup": [
    "moeda",
    "real",
    "dolar",
    "yuan",
    "euro",
    "dinheiro",
    "cambio",
    "cedula",
    "cbdc",
    "e-cny",
    "drex",
    "pix",
  ],
  "financial district skyline": [
    "distrito financeiro",
    "wall street",
    "avaliac",
    "valuation",
    "bilh",
    "trilh",
  ],
  "office desk financial documents": [
    "balanco",
    "relatorio",
    "contabil",
    "orcament",
    "tributar",
    "imposto",
    "proposta",
  ],
  "shipping port cargo economy": [
    "porto",
    "exportac",
    "importac",
    "comercio exterior",
    "carga",
    "frete",
    "balanca comercial",
  ],

  // Geopolítica
  "international flags row": [
    "diplomac",
    "cupula",
    "brics",
    "onu",
    "mercosul",
    "acordo",
    "tratado",
    "bloco",
  ],
  "government building columns": [
    "governo",
    "planalto",
    "ministerio",
    "decreto",
    "sancion",
    "presidente",
  ],
  "container ship port crane": [
    "conteiner",
    "navio",
    "exportac",
    "importac",
    "porto",
    "cadeia produtiva",
    "polissilicio",
  ],
  "conference room negotiation table": [
    "negociac",
    "reuni",
    "encontro",
    "bilateral",
    "delegac",
    "conversas",
  ],
  "parliament chamber interior": [
    "parlament",
    "congresso",
    "camara",
    "senado",
    "votac",
    "projeto de lei",
    "comiss",
  ],
  "airport border control hall": [
    "fronteira",
    "visto",
    "imigrac",
    "aeroporto",
    "passaporte",
    "tarifa",
    "tarifam",
    "sobretaxa",
  ],

  // Mercado
  "startup team office meeting": [
    "startup",
    "equipe",
    "fundador",
    "rodada",
    "serie a",
    "serie b",
    "serie c",
    "serie d",
    "serie e",
    "aporte",
  ],
  "semiconductor wafer manufacturing": [
    "semicondutor",
    "wafer",
    "chip",
    "fundic",
    "foundry",
    "nanometro",
  ],
  "warehouse logistics automation": [
    "logistic",
    "armaz",
    "estoque",
    "entrega",
    "distribuic",
    "galp",
  ],
  "business district skyscrapers": [
    "sede",
    "corporativ",
    "avaliac",
    "valuation",
    "aquisic",
    "fusao",
    "fusoes",
    "ipo",
    "bilh",
  ],
  "conference keynote stage audience": [
    "evento",
    "conferencia",
    "summit",
    "apresentac",
    "anunci",
    "lancament",
    "palestra",
  ],
  "electronics factory assembly line": [
    "fabrica",
    "produc",
    "montagem",
    "manufatura",
    "linha de producao",
    "investimento em planta",
  ],
};

export function normalizeText(value: string): string {
  return value.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

// Quantas palavras do tema aparecem no texto da matéria. Contagem simples e
// auditável de propósito: dá para explicar a um humano por que uma foto foi
// escolhida, o que peso estatístico não daria.
// Casamento por INÍCIO de palavra, não por substring solta. Sem isso "ipo"
// casa dentro de "tipo" e "app" dentro de "apple": a matéria sobre um tipo
// qualquer de coisa ganharia a foto de IPO. O radical continua livre no fim,
// que é o que faz "enchent" cobrir enchente e enchentes.
const KEYWORD_PATTERNS = new Map<string, RegExp>();

function keywordPattern(keyword: string): RegExp {
  let pattern = KEYWORD_PATTERNS.get(keyword);
  if (!pattern) {
    pattern = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`);
    KEYWORD_PATTERNS.set(keyword, pattern);
  }
  return pattern;
}

export function scoreTerm(text: string, term: string): number {
  const keywords = TERM_KEYWORDS[term];
  if (!keywords) return 0;
  const haystack = normalizeText(text);
  return keywords.reduce(
    (total, keyword) => (keywordPattern(keyword).test(haystack) ? total + 1 : total),
    0,
  );
}

export type MatchCandidate = { id: string; term: string };
export type MatchTarget = { slug: string; beat: Beat; text: string };

// Distribui as fotos entre as matérias sem repetir foto. Greedy pelo maior
// casamento: a matéria que tem o vínculo mais forte com uma foto escolhe
// primeiro, e as sem casamento ficam com o que sobrou.
//
// Sem repetir porque repetição é o defeito que este trabalho todo veio
// corrigir — melhor uma matéria com foto genérica da editoria que duas com a
// mesma foto.
export function assignCoversByTheme(
  targets: readonly MatchTarget[],
  candidates: readonly MatchCandidate[],
): Map<string, { id: string; score: number }> {
  const pairs: { slug: string; id: string; score: number }[] = [];
  for (const target of targets) {
    for (const candidate of candidates) {
      pairs.push({
        slug: target.slug,
        id: candidate.id,
        score: scoreTerm(target.text, candidate.term),
      });
    }
  }
  // Empate resolvido por slug e id para a atribuição ser determinística: a
  // mesma entrada tem que produzir a mesma saída em toda rodada, senão cada
  // passagem troca capa que já está publicada.
  pairs.sort(
    (a, b) => b.score - a.score || a.slug.localeCompare(b.slug) || a.id.localeCompare(b.id),
  );

  const assigned = new Map<string, { id: string; score: number }>();
  const usados = new Set<string>();
  for (const pair of pairs) {
    if (pair.score === 0) continue;
    if (assigned.has(pair.slug) || usados.has(pair.id)) continue;
    assigned.set(pair.slug, { id: pair.id, score: pair.score });
    usados.add(pair.id);
  }

  // Quem não casou com nada recebe, por rodízio, uma foto ainda livre.
  const livres = candidates.filter((candidate) => !usados.has(candidate.id));
  let proxima = 0;
  for (const target of targets) {
    if (assigned.has(target.slug)) continue;
    const escolhida = livres[proxima % Math.max(livres.length, 1)];
    if (!escolhida) continue;
    proxima += 1;
    assigned.set(target.slug, { id: escolhida.id, score: 0 });
    usados.add(escolhida.id);
  }
  return assigned;
}

// Todo termo do banco precisa de lista de palavras, senão ele nunca vence um
// casamento e a foto correspondente vira peso morto no banco.
export function termsWithoutKeywords(): string[] {
  return Object.values(BANK_TERMS)
    .flat()
    .filter((term) => !TERM_KEYWORDS[term]);
}
