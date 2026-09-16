import { BEAT_VALUES, type Beat } from "./beats";

export type EditorialChannel = {
  id: string;
  label: string;
  description: string;
  keywords: readonly string[];
};

export const EDITORIAL_CHANNELS: Record<Beat, readonly [EditorialChannel, EditorialChannel]> = {
  ia: [
    {
      id: "tecnologia",
      label: "Tecnologia",
      description: "Produtos, modelos, infraestrutura e aplicações de inteligência artificial.",
      keywords: ["modelo", "produto", "software", "chip", "infraestrutura", "aplicação", "empresa"],
    },
    {
      id: "pesquisa",
      label: "Pesquisa",
      description: "Ciência, segurança, regulação e descobertas que orientam o setor.",
      keywords: [
        "pesquisa",
        "cientista",
        "estudo",
        "segurança",
        "regulação",
        "universidade",
        "laboratório",
      ],
    },
  ],
  clima: [
    {
      id: "alertas",
      label: "Alertas",
      description: "Eventos extremos, prevenção, infraestrutura e resposta pública.",
      keywords: [
        "alerta",
        "chuva",
        "vento",
        "temperatura",
        "evento extremo",
        "defesa civil",
        "previsão",
      ],
    },
    {
      id: "sustentabilidade",
      label: "Sustentabilidade",
      description: "Energia limpa, transição climática e soluções de baixo carbono.",
      keywords: ["solar", "eólica", "energia", "bateria", "emissão", "carbono", "sustentável"],
    },
  ],
  economia: [
    {
      id: "brasil",
      label: "Brasil",
      description: "Juros, inflação, moeda digital e decisões econômicas brasileiras.",
      keywords: ["brasil", "banco central", "drex", "real", "selic", "inflação", "brasileir"],
    },
    {
      id: "mundo",
      label: "Economia Global",
      description: "Moedas, bancos centrais e movimentos econômicos internacionais.",
      keywords: ["global", "yuan", "dólar", "china", "fed", "internacional", "cbdc"],
    },
  ],
  geopolitica: [
    {
      id: "diplomacia",
      label: "Diplomacia",
      description: "Acordos, relações internacionais e movimentos entre governos.",
      keywords: ["acordo", "diplomacia", "governo", "relações", "brasil", "china", "eua"],
    },
    {
      id: "poder",
      label: "Poder & Tecnologia",
      description: "Chips, cadeias produtivas, sanções e disputas por infraestrutura.",
      keywords: ["chip", "semicondutor", "sanção", "tarifa", "cadeia", "tecnologia", "restrição"],
    },
  ],
  mercado: [
    {
      id: "empresas",
      label: "Empresas",
      description: "Resultados, movimentos corporativos e infraestrutura tecnológica.",
      keywords: ["empresa", "receita", "resultado", "big tech", "companhia", "aquisição", "lucro"],
    },
    {
      id: "oportunidades",
      label: "Oportunidades",
      description: "Investimentos, startups, demanda e sinais comerciais emergentes.",
      keywords: [
        "investimento",
        "startup",
        "rodada",
        "oportunidade",
        "mercado",
        "crescimento",
        "demanda",
      ],
    },
  ],
};

export const SOURCE_LABELS: Record<string, string> = {
  "agenciabrasil.ebc.com.br": "Agência Brasil",
  "atlanticcouncil.org": "Atlantic Council",
  "bbc.com": "BBC",
  "caixinglobal.com": "Caixin Global",
  "cenarioenergia.com.br": "Cenário Energia",
  "cerebras.ai": "Cerebras",
  "coindesk.com": "CoinDesk",
  "crowdfundinsider.com": "Crowdfund Insider",
  "epe.gov.br": "EPE",
  "exame.com": "Exame",
  "federalreserve.gov": "Federal Reserve",
  "forbes.com": "Forbes",
  "mlq.ai": "MLQ.ai",
  "monitormercantil.com.br": "Monitor Mercantil",
  "openai.com": "OpenAI",
  "paymentexpert.com": "Payment Expert",
  "revistaforum.com.br": "Revista Fórum",
  "scmp.com": "SCMP",
  "tecnoblog.net": "Tecnoblog",
  "technologyreview.com": "MIT Technology Review",
  "theblock.co": "The Block",
  "timesbrasil.com.br": "Times Brasil",
  "tomshardware.com": "Tom's Hardware",
  "un.org": "Nações Unidas",
  "unite.ai": "Unite.AI",
  "xpi.com.br": "XP Investimentos",
};

export function sourceDomain(value: string): string {
  try {
    return new URL(value).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return value;
  }
}

export function sourceLabel(value: string): string {
  const hostname = sourceDomain(value);
  if (SOURCE_LABELS[hostname]) return SOURCE_LABELS[hostname];
  const parts = hostname.split(".");
  const root = parts.length > 2 ? parts.slice(-2).join(".") : hostname;
  if (SOURCE_LABELS[root]) return SOURCE_LABELS[root];
  const label = hostname.split(".")[0] || hostname;
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function stableIndex(value: string): 0 | 1 {
  let total = 0;
  for (const character of value) total = (total * 31 + character.charCodeAt(0)) >>> 0;
  return (total % 2) as 0 | 1;
}

export function resolveEditorialChannel(
  beat: Beat,
  ...articleText: Array<string | null | undefined>
): EditorialChannel {
  const channels = EDITORIAL_CHANNELS[beat];
  const normalized = articleText.filter(Boolean).join(" ").toLocaleLowerCase("pt-BR");
  const scores = channels.map((channel) =>
    channel.keywords.reduce((score, keyword) => score + (normalized.includes(keyword) ? 1 : 0), 0),
  );
  if (scores[0] !== scores[1]) return scores[0] > scores[1] ? channels[0] : channels[1];
  return channels[stableIndex(normalized)];
}

export function scheduledEditorialChannel(beat: Beat, date = new Date()): EditorialChannel {
  const beatOffset = BEAT_VALUES.indexOf(beat);
  return EDITORIAL_CHANNELS[beat][((date.getUTCHours() + beatOffset) % 2) as 0 | 1];
}

export function trackedSourceHref(articleSlug: string, sourceIndex: number): string {
  return `/r/fonte?article=${encodeURIComponent(articleSlug)}&source=${sourceIndex}`;
}
