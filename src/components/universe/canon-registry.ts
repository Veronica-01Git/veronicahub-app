export type CanonModuleId =
  | "essence"
  | "ecosystem"
  | "character"
  | "visual"
  | "voice"
  | "media"
  | "prompts"
  | "decisions"
  | "guardian";

export type CanonModule = {
  id: CanonModuleId;
  label: string;
  version: string;
  status: "ACTIVE" | "ADVISORY" | "PASSIVE";
  summary: string;
  invariants: string[];
  updatedAt: string;
};

export const ACTIVE_CANON_VERSION = "1.0.0";
export const CANON_RELEASE = "UNIVERSE-CANON-1";

export const CANON_REGISTRY: CanonModule[] = [
  {
    id: "essence",
    label: "Essence",
    version: ACTIVE_CANON_VERSION,
    status: "ACTIVE",
    summary: "Propósito, promessa e princípios não negociáveis da identidade Veronica.",
    invariants: [
      "Clareza antes de complexidade.",
      "Utilidade antes de espetáculo.",
      "Verdade antes de narrativa.",
      "Agência humana no centro.",
      "Coerência antes de expansão.",
    ],
    updatedAt: "2026-09-06",
  },
  {
    id: "ecosystem",
    label: "Ecosystem",
    version: ACTIVE_CANON_VERSION,
    status: "ACTIVE",
    summary: "Mapa das extensões do ecossistema e da relação de cada produto com o Veronica Core.",
    invariants: [
      "O Universe organiza; não substitui produtos.",
      "Cada extensão preserva função própria e identidade central compartilhada.",
    ],
    updatedAt: "2026-09-06",
  },
  {
    id: "character",
    label: "Character Bible",
    version: ACTIVE_CANON_VERSION,
    status: "ACTIVE",
    summary: "Comportamento, arquétipo, presença e limites da persona Veronica.",
    invariants: [
      "Uma persona central com expressões contextuais.",
      "Nunca simular certeza quando houver incerteza.",
      "Presença sofisticada sem arrogância ou teatralidade excessiva.",
    ],
    updatedAt: "2026-09-06",
  },
  {
    id: "visual",
    label: "Visual System",
    version: ACTIVE_CANON_VERSION,
    status: "ACTIVE",
    summary: "Gramática visual, contraste, motion, enquadramento e assinatura ótica da Veronica.",
    invariants: [
      "Futurismo sutil, não cyberpunk genérico.",
      "Motion serve hierarquia e presença, nunca ruído.",
      "Consistência facial e de proporções é prioridade para o avatar.",
    ],
    updatedAt: "2026-09-06",
  },
  {
    id: "voice",
    label: "Voice Intelligence",
    version: ACTIVE_CANON_VERSION,
    status: "ACTIVE",
    summary: "Tom verbal, cadência e direção vocal entre Hub, Wire e demais produtos.",
    invariants: [
      "Direta, clara e orientada a ação.",
      "Didática no Hub; factual e verificável no Wire.",
      "Evitar hype e linguagem vazia de IA.",
    ],
    updatedAt: "2026-09-06",
  },
  {
    id: "media",
    label: "Media Intelligence",
    version: ACTIVE_CANON_VERSION,
    status: "ACTIVE",
    summary: "Critérios para ativos visuais, vídeos, mídia institucional e distribuição.",
    invariants: [
      "Ativos oficiais precisam ter origem e finalidade claras.",
      "Avatar canônico deve nascer de referências aprovadas e versionadas.",
    ],
    updatedAt: "2026-09-06",
  },
  {
    id: "prompts",
    label: "Prompt Lab",
    version: ACTIVE_CANON_VERSION,
    status: "ACTIVE",
    summary: "Diretivas canônicas reutilizáveis para criação consistente entre modelos e ferramentas.",
    invariants: [
      "Prompts oficiais são model-agnostic sempre que possível.",
      "Identidade e restrições vêm antes de estilo e efeitos.",
    ],
    updatedAt: "2026-09-06",
  },
  {
    id: "decisions",
    label: "Decision Intelligence",
    version: ACTIVE_CANON_VERSION,
    status: "ADVISORY",
    summary: "Critérios consultivos para avaliar novas ideias, produtos, campanhas e expansões.",
    invariants: [
      "Recomendações não executam ações.",
      "Pontuações não substituem aprovação humana.",
    ],
    updatedAt: "2026-09-06",
  },
  {
    id: "guardian",
    label: "Guardian",
    version: ACTIVE_CANON_VERSION,
    status: "PASSIVE",
    summary: "Auditoria de coerência da marca em modo somente leitura.",
    invariants: [
      "Nunca publicar, bloquear, editar ou aprovar automaticamente.",
      "Sinalizar divergências e explicar o motivo.",
    ],
    updatedAt: "2026-09-06",
  },
];

export const UNIVERSE_CANON_CONTEXT = {
  release: CANON_RELEASE,
  version: ACTIVE_CANON_VERSION,
  mode: "READ_ONLY" as const,
  autonomy: "DISABLED" as const,
  modules: CANON_REGISTRY.map(({ id, label, status, summary, invariants }) => ({
    id,
    label,
    status,
    summary,
    invariants,
  })),
};
