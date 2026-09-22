import { findSeal, type SealRecord } from "@/lib/seals";

export type PrivateClientAccessState = "active" | "awaiting-seal";

export type PrivateClientModule = {
  id: string;
  label: string;
  description: string;
  state: "live" | "demo" | "not-configured";
};

export type PrivateClient = {
  id: string;
  slug: string;
  displayName: string;
  tagline: string;
  /** Serial real do selo. `null` = ainda não existe selo emitido. */
  sealSerial: string | null;
  accessState: PrivateClientAccessState;
  /** Campo reservado: PIN por cliente pode ser exigido no futuro sem quebrar o fluxo. */
  requiresPin: false;
  modules: readonly PrivateClientModule[];
};

/**
 * Registry dos clientes privados. Fonte canônica dos seriais continua sendo
 * `src/lib/seals.ts` — aqui só apontamos para ela. Nenhum serial é inventado:
 * cliente sem selo emitido fica "awaiting-seal" e não consegue entrar.
 */
export const privateClients: readonly PrivateClient[] = [
  {
    id: "express-entulho",
    slug: "express-entulho",
    displayName: "Express Entulho",
    tagline: "Agente de IA para WhatsApp e leads · acompanhamento",
    sealSerial: "VH-AUT-WA-2026-000001",
    accessState: "active",
    requiresPin: false,
    modules: [
      {
        id: "acompanhamento",
        label: "Acompanhamento da implantação",
        description: "Etapas, status e marcos do projeto registrado.",
        state: "live",
      },
      {
        id: "operacoes",
        label: "Central operacional (demonstração)",
        description: "Telas já existentes da central Express, somente leitura.",
        state: "demo",
      },
      {
        id: "atendimento",
        label: "Atendimento WhatsApp",
        description: "Somente observação. Nenhum envio ou resposta por aqui.",
        state: "not-configured",
      },
    ],
  },
  {
    id: "lz-team",
    slug: "lz-team",
    displayName: "LZ Team",
    tagline: "Membro 02 · escopo em definição",
    sealSerial: "VH-MEM-2026-000002",
    accessState: "active",
    requiresPin: false,
    modules: [
      {
        id: "visao-geral",
        label: "Visão geral",
        description: "Objetivo, tarefas e próximos passos do time.",
        state: "not-configured",
      },
      {
        id: "ativos",
        label: "Ativos e documentos",
        description: "Nenhum documento cadastrado até agora.",
        state: "not-configured",
      },
    ],
  },
  {
    id: "veronica-fashion-operator",
    slug: "veronica-fashion-operator",
    displayName: "Veronica Fashion & Co.",
    tagline: "Operação e monetização para marcas de moda · protótipo",
    sealSerial: "VH-MEM-2026-000003",
    accessState: "active",
    requiresPin: false,
    modules: [
      { id: "live", label: "Veronica Live", description: "Conversa com a Veronica.", state: "demo" },
      { id: "dinheiro", label: "Mapa de Dinheiro", description: "Estoque, margem e giro.", state: "demo" },
      { id: "producao", label: "Produção", description: "Sugestão de quantidades.", state: "demo" },
      { id: "leads", label: "Leads", description: "Funil B2B e B2C.", state: "demo" },
      { id: "colecoes", label: "Coleções", description: "Ideias, peças e briefing.", state: "demo" },
      { id: "plano", label: "Plano de Ação", description: "Prioridades por impacto.", state: "demo" },
      { id: "recorrencia", label: "Recorrência", description: "Valor mensal entregue.", state: "demo" },
    ],
  },
] as const;

export function getPrivateClientBySlug(slug: string): PrivateClient | undefined {
  return privateClients.find((client) => client.slug === slug);
}

export function getPrivateClientBySerial(serial: string): PrivateClient | undefined {
  const normalized = normalizeSerial(serial);
  return privateClients.find(
    (client) => client.sealSerial && normalizeSerial(client.sealSerial) === normalized,
  );
}

export function normalizeSerial(serial: string): string {
  return serial.trim().toUpperCase().replace(/\s+/g, "");
}

/** Confere o serial do cliente na fonte canônica de selos. */
export function getClientSealRecord(client: PrivateClient): SealRecord | undefined {
  return client.sealSerial ? findSeal(client.sealSerial) : undefined;
}

/** VH-AUT-WA-2026-000001 → VH-AUT-••••-••0001 */
export function maskSerial(serial: string): string {
  const parts = serial.split("-");
  if (parts.length < 3) return `${serial.slice(0, 4)}••••`;
  const last = parts[parts.length - 1] ?? "";
  const head = parts.slice(0, 2).join("-");
  return `${head}-••••-••${last.slice(-4)}`;
}
