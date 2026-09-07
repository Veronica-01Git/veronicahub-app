export type NodeRelation =
  | "teaches"
  | "investigates"
  | "creates"
  | "analyzes"
  | "protects"
  | "guides"
  | "connects"
  | "equips";

export type NodeStatus = "ACTIVE" | "MAPPED" | "IN DEVELOPMENT" | "OFFLINE";

export type EcosystemNode = {
  id: string;
  name: string;
  category: string;
  status: NodeStatus;
  relation: NodeRelation;
  description: string;
  vector: string;
  position: {
    x: number;
    y: number;
  };
};

export type UniverseTab =
  | "00" // OVERVIEW
  | "01" // ESSENCE
  | "02" // ECOSYSTEM
  | "03" // CHARACTER
  | "04" // VISUAL SYSTEM
  | "05" // VOICE
  | "06" // MEDIA
  | "07" // PROMPT LAB
  | "08" // DECISIONS
  | "09"; // GUARDIAN

export const ECOSYSTEM_NODES: EcosystemNode[] = [
  {
    id: "veronica-hub",
    name: "VERONICA HUB",
    category: "Education / Guidance",
    status: "ACTIVE",
    relation: "teaches",
    description: "Núcleo de formação digital, inteligência prática e monetização de alta demanda.",
    vector: "01 / FORMATION",
    position: { x: 50, y: 12 },
  },
  {
    id: "veronica-wire",
    name: "VERONICA WIRE",
    category: "Media / Investigation",
    status: "ACTIVE",
    relation: "investigates",
    description: "Jornalismo técnico investigativo, curadoria de fronteira e inteligência geopolítica digital.",
    vector: "02 / RADAR",
    position: { x: 80, y: 24 },
  },
  {
    id: "veronica-studio",
    name: "VERONICA STUDIO",
    category: "AI Creation",
    status: "ACTIVE",
    relation: "creates",
    description: "Motor de síntese multimodal de alta fidelidade: geração de vídeo, imagem e voz com IA.",
    vector: "03 / SYNTHESIS",
    position: { x: 88, y: 62 },
  },
  {
    id: "veronica-analytics",
    name: "VERONICA ANALYTICS",
    category: "Market Intelligence",
    status: "ACTIVE",
    relation: "analyzes",
    description: "Diagnóstico profundo de métricas, benchmarks competitivos e inteligência de conversão.",
    vector: "04 / METRICS",
    position: { x: 70, y: 88 },
  },
  {
    id: "veronica-security",
    name: "VERONICA SECURITY",
    category: "Digital Protection",
    status: "ACTIVE",
    relation: "protects",
    description: "Diagnóstico defensivo, auditoria de integridade e blindagem contra vazamento de ativos.",
    vector: "05 / SHIELD",
    position: { x: 30, y: 88 },
  },
  {
    id: "curriculo-certo",
    name: "CURRÍCULO CERTO",
    category: "Career Intelligence",
    status: "ACTIVE",
    relation: "guides",
    description: "Otimização algorítmica para rastreadores ATS e posicionamento de autoridade no mercado.",
    vector: "06 / CAREER",
    position: { x: 12, y: 62 },
  },
  {
    id: "negocio-da-china",
    name: "NEGÓCIO DA CHINA",
    category: "Global Business",
    status: "ACTIVE",
    relation: "connects",
    description: "Canal estratégico de intermediação, sourcing global e infraestrutura de comércio de alto valor.",
    vector: "07 / COMMERCE",
    position: { x: 20, y: 24 },
  },
  {
    id: "prompt-packs",
    name: "PROMPT PACKS",
    category: "Applied Knowledge",
    status: "ACTIVE",
    relation: "equips",
    description: "Diretrizes executáveis, cadeias de raciocínio proprietárias e automações prontas para uso real.",
    vector: "08 / DIRECTIVES",
    position: { x: 50, y: 94 },
  },
];
