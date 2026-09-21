// Catálogo de cenas do banco de capas da Wire TV — e a regra que casa uma
// matéria com a cena certa.
//
// Por que existe: até aqui a capa saía por rodízio dentro da editoria. A foto
// era da editoria certa, mas não da matéria: uma nota sobre enchente em
// Eldorado podia sair com parque eólico, porque as duas são "clima". O pedido
// do editor-chefe (20/09) é capa que faça jus à matéria.
//
// Por que NÃO se voltou à busca ao vivo, removida em 13/09: aquele caminho
// pedia ao modelo um termo em inglês para o fato específico e publicava o
// resultado como se registrasse aquele fato — foi assim que a enchente em
// Telangana saiu com uma rua americana e placa "ROAD CLOSED". Aqui é o
// contrário: as cenas continuam curadas à mão, genéricas e assumidamente
// ilustrativas; o que passou a ser automático é só ESCOLHER qual das cenas
// já curadas combina com o texto. Uma matéria de enchente recebe a cena de
// enchente do banco — não uma foto que alegue ser daquela enchente.
//
// As pistas são em português (o texto da matéria) e sem acento: a comparação
// roda depois do NFD-strip de `normalizar`. Mexer nesta tabela é decisão
// editorial, não técnica.
//
// Módulo puro de propósito: é importado pelo servidor, pelo runner do Actions
// e pelos testes, e não pode arrastar banco nem SDK junto.
import { BEAT_VALUES, type Beat } from "./beats.ts";

export type Scene = {
  // Consulta enviada ao Pexels/Pixabay. Substantivo concreto e fotografável:
  // nada de conceito abstrato, nome de empresa, logotipo ou pessoa pública.
  readonly term: string;
  // Radicais que, achados no texto da matéria, elegem esta cena. São prefixos
  // de propósito ("enchent" pega "enchente" e "enchentes"; "exportac" pega
  // "exportação" e "exportações" depois do strip de acento).
  readonly pistas: readonly string[];
};

export const COVER_SCENES: Record<Beat, readonly Scene[]> = {
  ia: [
    {
      term: "data center server room",
      pistas: [
        "datacenter",
        "data center",
        "servidor",
        "nuvem",
        "cloud",
        "infraestrutura",
        "computac",
        "processament",
        "cluster",
        "megawatt",
      ],
    },
    {
      term: "computer chip macro closeup",
      pistas: [
        "chip",
        "semicondutor",
        "processador",
        "gpu",
        "nvidia",
        "wafer",
        "litografia",
        "transistor",
        "silicio",
      ],
    },
    {
      term: "industrial robotic arm factory",
      pistas: ["robo", "robotic", "automac", "braco mecanico", "manufatura", "linha de montagem"],
    },
    {
      term: "network cables server rack",
      pistas: [
        "rede",
        "conectividade",
        "banda larga",
        "cabo",
        "fibra",
        "latencia",
        "protocolo",
        "api",
      ],
    },
    {
      term: "person coding multiple screens",
      pistas: [
        "codigo",
        "programac",
        "desenvolvedor",
        "software",
        "engenheir",
        "agente",
        "copilot",
        "modelo de linguagem",
        "llm",
      ],
    },
    {
      term: "classroom students computers",
      pistas: [
        "escola",
        "educac",
        "aluno",
        "ensino",
        "professor",
        "disciplina",
        "curricul",
        "unesco",
        "universidade",
        "letramento",
      ],
    },
    {
      term: "security camera surveillance city",
      pistas: [
        "vigilancia",
        "reconhecimento facial",
        "camera",
        "privacidade",
        "dados pessoais",
        "lgpd",
        "biometr",
      ],
    },
    {
      term: "courtroom law books gavel",
      pistas: [
        "regulac",
        "marco legal",
        "lei",
        "norma",
        "governanca",
        "seguranca de ia",
        "auditoria",
        "guia",
        "diretriz",
        "conformidade",
      ],
    },
    {
      term: "hospital medical technology scan",
      pistas: ["saude", "medic", "hospital", "diagnostic", "paciente", "exame"],
    },
  ],
  clima: [
    {
      term: "wind turbines field sunset",
      pistas: ["eolic", "vento", "turbina", "renovavel", "transicao energetica"],
    },
    {
      term: "solar panel farm aerial",
      pistas: ["solar", "fotovoltaic", "painel", "placa", "modulo", "bifacial"],
    },
    {
      term: "flooded street after heavy rain",
      pistas: [
        "enchent",
        "inundac",
        "alagament",
        "transbord",
        "cheia",
        "submerg",
        "desabrig",
        "correnteza",
      ],
    },
    {
      term: "cracked dry earth drought",
      pistas: ["seca", "estiagem", "arid", "desertific", "escassez", "racionament"],
    },
    {
      term: "dramatic storm clouds over city",
      pistas: [
        "tempestade",
        "temporal",
        "chuva",
        "granizo",
        "vendaval",
        "rajada",
        "ciclone",
        "alerta",
        "frente fria",
        "raio",
        "descarga",
      ],
    },
    {
      term: "high voltage transmission lines",
      pistas: [
        "transmissao",
        "eletric",
        "apagao",
        "linhao",
        "tarifa de energia",
        "bandeira",
        "carga",
        "despacho",
      ],
    },
    {
      term: "forest fire smoke landscape",
      pistas: ["queimada", "incendio", "fogo", "fumaca", "desmatament", "amazon", "cerrado"],
    },
    {
      term: "melting glacier ice arctic",
      pistas: [
        "degelo",
        "glaciar",
        "geleira",
        "artic",
        "polar",
        "aquecimento",
        "temperatura record",
      ],
    },
    {
      term: "river valley drone aerial landscape",
      pistas: ["rio", "bacia", "represa", "hidrel", "reservatorio", "nivel"],
    },
  ],
  economia: [
    {
      term: "stock exchange trading screens",
      pistas: ["bolsa", "acoes", "ibovespa", "pregao", "indice", "investidor", "papel", "volatil"],
    },
    {
      term: "central bank building facade",
      pistas: [
        "banco central",
        "copom",
        "selic",
        "juros",
        "taxa basica",
        "politica monetaria",
        "fed",
        "pboc",
        "aperto",
      ],
    },
    {
      term: "banknotes currency closeup",
      pistas: ["moeda", "real", "dolar", "yuan", "renminbi", "cambio", "cedula", "digital"],
    },
    {
      term: "financial district skyline dusk",
      pistas: ["pib", "crescimento", "economia", "recessao", "atividade"],
    },
    {
      term: "office desk financial documents",
      pistas: [
        "imposto",
        "tribut",
        "orcament",
        "reforma",
        "divida",
        "balanco",
        "fiscal",
        "isenc",
        "regime especial",
      ],
    },
    {
      term: "shipping port cargo containers",
      pistas: ["exportac", "importac", "comercio", "balanca", "commodit", "safra", "frete"],
    },
    {
      term: "supermarket shelves grocery shopping",
      pistas: ["inflac", "preco", "consumo", "cesta", "varejo", "ipca", "poder de compra"],
    },
    {
      term: "construction site cranes city",
      pistas: ["obra", "construc", "infraestrutura", "investiment", "concessao", "leilao"],
    },
  ],
  geopolitica: [
    {
      term: "international flags row",
      pistas: [
        "diplomac",
        "acordo",
        "tratado",
        "cupula",
        "brics",
        "onu",
        "g20",
        "bilateral",
        "multilateral",
        "cooperac",
      ],
    },
    {
      term: "government building columns",
      pistas: ["governo", "presidenc", "ministerio", "planalto", "casa branca", "estado"],
    },
    {
      term: "container ship port crane",
      pistas: [
        "tarifa",
        "sancao",
        "embargo",
        "sobretaxa",
        "comercio",
        "exportac",
        "importac",
        "cadeia",
      ],
    },
    {
      term: "conference room negotiation table",
      pistas: ["negociac", "reuniao", "encontro", "dialogo", "mesa", "rodada"],
    },
    {
      term: "parliament chamber interior",
      pistas: [
        "congresso",
        "parlamento",
        "senado",
        "camara",
        "votac",
        "sancion",
        "projeto de lei",
        "revogar",
        "medida provisoria",
      ],
    },
    {
      term: "airport border control hall",
      pistas: ["visto", "fronteira", "migrac", "imigrac", "passaporte", "deportac"],
    },
    {
      term: "military parade soldiers formation",
      pistas: [
        "militar",
        "defesa",
        "exercito",
        "guerra",
        "conflito",
        "armament",
        "otan",
        "seguranca nacional",
      ],
    },
    {
      term: "diplomats handshake meeting",
      pistas: [
        "carta",
        "visita",
        "parceria",
        "embaixador",
        "chanceler",
        "amorim",
        "assessor",
        "emissario",
        "comitiva",
      ],
    },
  ],
  mercado: [
    {
      term: "startup team office meeting",
      pistas: [
        "startup",
        "rodada",
        "aporte",
        "investiment",
        "venture",
        "fundador",
        "avaliac",
        "valuation",
        "captac",
        "unicornio",
      ],
    },
    {
      term: "semiconductor wafer manufacturing",
      pistas: ["semicondutor", "chip", "wafer", "foundry", "fundicao", "litografia"],
    },
    {
      term: "warehouse logistics automation robots",
      pistas: [
        "logistic",
        "armazem",
        "entrega",
        "ecommerce",
        "distribuic",
        "estoque",
        "ultima milha",
      ],
    },
    {
      term: "business district skyscrapers",
      pistas: ["empresa", "corporac", "sede", "fusao", "aquisic", "acionista", "conselho"],
    },
    {
      term: "conference keynote stage audience",
      pistas: ["lancament", "evento", "apresentac", "anuncio", "conferencia", "feira", "keynote"],
    },
    {
      term: "electronics factory assembly line",
      pistas: ["producao", "fabricac", "montagem", "fabrica", "industria", "planta"],
    },
    {
      term: "smartphone device closeup studio",
      pistas: [
        "smartphone",
        "celular",
        "aparelho",
        "dispositivo",
        "gadget",
        "aplicativo",
        "app",
        "usuario",
      ],
    },
    {
      term: "data center construction aerial",
      pistas: ["datacenter", "data center", "nuvem", "hiperescala", "capacidade", "expansao"],
    },
  ],
};

// Peso de cada campo da matéria. A manchete é o que resume o fato, então uma
// pista achada nela vale mais que a mesma pista no resumo. `fotoTermos` são
// os termos que o próprio modelo sugeriu para a matéria — servem de reforço,
// nunca de consulta (é essa a diferença para a busca ao vivo de 13/09).
const PESO_MANCHETE = 3;
const PESO_TERMOS = 2;
const PESO_RESUMO = 1;

export function normalizar(texto: string): string {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export type MateriaParaCapa = {
  headline: string;
  excerpt?: string | null;
  fotoTermos?: readonly string[] | null;
};

// Pontua cada cena da editoria contra o texto da matéria e devolve a melhor.
// Devolve null quando nenhuma pista bateu: aí quem chama mantém o rodízio
// antigo, que é o certo — cena nenhuma combina mais que as outras, e inventar
// uma correspondência fraca é pior que assumir a foto ilustrativa da editoria.
export function pontuarCenas(
  beat: Beat,
  materia: MateriaParaCapa,
): { term: string; score: number }[] {
  const manchete = normalizar(materia.headline ?? "");
  const resumo = normalizar(materia.excerpt ?? "");
  const termos = normalizar((materia.fotoTermos ?? []).join(" "));

  return COVER_SCENES[beat]
    .map((cena) => {
      let score = 0;
      for (const pista of cena.pistas) {
        // Cada pista conta uma vez por campo, não uma vez por ocorrência: uma
        // manchete que repete "chuva" três vezes não vale três cenas de chuva.
        if (manchete.includes(pista)) score += PESO_MANCHETE;
        if (termos.includes(pista)) score += PESO_TERMOS;
        if (resumo.includes(pista)) score += PESO_RESUMO;
      }
      return { term: cena.term, score };
    })
    .sort((a, b) => b.score - a.score);
}

export function escolherCena(beat: Beat, materia: MateriaParaCapa): string | null {
  const [melhor] = pontuarCenas(beat, materia);
  return melhor && melhor.score > 0 ? melhor.term : null;
}

// Todos os termos de todas as editorias — usado pelo abastecimento para saber
// o que buscar, e pelos testes para conferir que o banco cobre o catálogo.
export function termosDaEditoria(beat: Beat): string[] {
  return COVER_SCENES[beat].map((cena) => cena.term);
}

export function todosOsTermos(): string[] {
  return BEAT_VALUES.flatMap((beat) => termosDaEditoria(beat));
}
