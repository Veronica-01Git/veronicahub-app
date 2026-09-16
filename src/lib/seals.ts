export type SealStatus = "development" | "active" | "support" | "archived" | "concept";

// Para etapa com data, isto é só o fallback: quem manda é resolveTimelineState.
export type SealTimelineState = "done" | "current" | "next";

export type SealRecord = {
  serial: string;
  client: string;
  solution: string;
  category: string;
  issuedAt: string;
  status: SealStatus;
  statusLabel: string;
  version: string;
  provider: string;
  summary: string;
  scope: readonly string[];
  timeline: readonly { date: string; label: string; state: SealTimelineState }[];
  support?: string;
  operations?: {
    product: string;
    model: string;
    summary: string;
    environments: readonly string[];
    endpoints: readonly string[];
    channels: readonly string[];
  };
  isDemonstration?: boolean;
};

export const SEAL_STATUS_COPY: Record<SealStatus, string> = {
  development: "Projeto registrado e atualmente em desenvolvimento.",
  active: "Implantação concluída e registro ativo.",
  support: "Implantação concluída e em período de suporte.",
  archived: "Registro preservado; ciclo de atendimento encerrado.",
  concept: "Conceito visual demonstrativo. Não representa uma relação comercial real.",
};

// Estado de cada etapa derivado da data, não marcado à mão.
//
// Em 16/09 a linha do tempo do selo VH-AUT-WA-2026-000001 ainda mostrava
// "Em andamento" na etapa de 13 SET — três dias vencida, numa página pública
// de procedência que o cliente abre por QR Code. Marcador escrito à mão
// envelhece sozinho e ninguém é avisado: a página continua no ar, correta em
// tudo menos no que ela afirma estar acontecendo agora.
//
// Etapas sem data legível (as demonstrações usam "DEMO") mantêm o estado
// declarado no registro — para elas não há o que derivar.
const MESES_PT: Record<string, number> = {
  JAN: 1,
  FEV: 2,
  MAR: 3,
  ABR: 4,
  MAI: 5,
  JUN: 6,
  JUL: 7,
  AGO: 8,
  SET: 9,
  OUT: 10,
  NOV: 11,
  DEZ: 12,
};

// "13 SET 2026" -> "2026-09-13". Devolve null para qualquer coisa fora do
// formato, que é como "DEMO" cai fora da derivação.
export function parseSealDate(value: string): string | null {
  const match = /^(\d{1,2})\s+([A-Za-zÇç]{3})\s+(\d{4})$/.exec(value.trim());
  if (!match) return null;
  const month = MESES_PT[match[2].toUpperCase()];
  if (!month) return null;
  return `${match[3]}-${String(month).padStart(2, "0")}-${match[1].padStart(2, "0")}`;
}

// Dia corrente em São Paulo, não em UTC: às 21h de Brasília já é o dia
// seguinte em UTC, e a etapa viraria "Concluído" antes de o dia acabar para
// quem lê a página.
export function currentSealDay(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function resolveTimelineState(
  event: { date: string; state: SealTimelineState },
  today: string = currentSealDay(),
): SealTimelineState {
  const day = parseSealDate(event.date);
  if (!day) return event.state;
  if (day === today) return "current";
  return day < today ? "done" : "next";
}

export const sealRecords: readonly SealRecord[] = [
  {
    serial: "VH-AUT-WA-2026-000001",
    client: "Express Entulho",
    solution: "Agente de IA para WhatsApp e Leads",
    category: "Automação de atendimento",
    issuedAt: "11/09/2026",
    status: "development",
    statusLabel: "Em desenvolvimento",
    version: "0.1 · Implantação",
    provider: "YO LAB & CO. · Laboratório da Veronica Hub",
    summary:
      "Registro de procedência do agente operacional de WhatsApp e da implantação inaugural do Veronica Operations para a Express Entulho.",
    scope: [
      "Agente de IA para atendimento no WhatsApp",
      "Organização e encaminhamento de leads",
      "Implantação prevista em cinco dias",
      "Suporte por 30 dias após a entrega",
    ],
    timeline: [
      {
        date: "13 SET 2026",
        label: "Arquitetura definitiva, personalidade e núcleo conversacional",
        state: "current",
      },
      {
        date: "14 SET 2026",
        label: "Demonstração com o proprietário e coleta das regras",
        state: "next",
      },
      { date: "15 SET 2026", label: "Base de conhecimento e conector possível", state: "next" },
      { date: "16 SET 2026", label: "Testes, correções e homologação", state: "next" },
      {
        date: "17 SET 2026",
        label: "Entrega do MVP funcional e início da assistência",
        state: "next",
      },
    ],
    support: "30 dias após a implantação",
    operations: {
      product: "Veronica Operations — Agentes para negócios locais",
      model: "Arquitetura multiempresa (multi-tenant)",
      summary:
        "Um único núcleo operacional atende diferentes empresas mantendo WhatsApp, identidade, preços, frota, agenda, regras, usuários, métricas, integrações e históricos completamente separados.",
      environments: [
        "WhatsApp",
        "Identidade e linguagem",
        "Preços e área atendida",
        "Frota e disponibilidade",
        "Agenda e regras",
        "Usuários e métricas",
        "Integrações",
        "Consumo de IA e histórico",
      ],
      endpoints: [
        "Leads",
        "Disponibilidade",
        "Agendamentos",
        "Clientes",
        "Conversas",
        "Transferência humana",
        "Webhooks do WhatsApp",
        "Conectores operacionais",
      ],
      channels: ["WhatsApp", "Site", "Instagram", "Facebook", "Chat interno", "Voz", "Aplicativo"],
    },
  },
  {
    serial: "VH-AUT-TX-DEMO-0001",
    client: "Lumera Textile Systems",
    solution: "Assistente de Catálogo e Representantes",
    category: "Indústria têxtil · demonstração",
    issuedAt: "Demonstração",
    status: "concept",
    statusLabel: "Conceito demonstrativo",
    version: "Concept 1.0",
    provider: "Veronica Hub · Laboratório de conceitos",
    summary:
      "Exemplo fictício de como o registro pode documentar uma solução para a indústria têxtil.",
    scope: ["Consulta de catálogo", "Triagem de representantes", "Encaminhamento comercial"],
    timeline: [{ date: "DEMO", label: "Cenário visual — sem implantação real", state: "current" }],
    isDemonstration: true,
  },
  {
    serial: "VH-AUT-TX-DEMO-0002",
    client: "Nexora Weave Industries",
    solution: "Agente de Pedidos e Pós-venda",
    category: "Indústria têxtil · demonstração",
    issuedAt: "Demonstração",
    status: "concept",
    statusLabel: "Conceito demonstrativo",
    version: "Concept 1.0",
    provider: "Veronica Hub · Laboratório de conceitos",
    summary:
      "Marca integralmente fictícia criada para demonstrar um possível caso de automação industrial.",
    scope: ["Recepção de pedidos", "Atualização de status", "Pós-venda automatizado"],
    timeline: [{ date: "DEMO", label: "Cenário visual — sem implantação real", state: "current" }],
    isDemonstration: true,
  },
  {
    serial: "VH-EDU-DEMO-0001",
    client: "Instituto Aurora do Saber",
    solution: "Assistente de Secretaria Escolar",
    category: "Educação diária · demonstração",
    issuedAt: "Demonstração",
    status: "concept",
    statusLabel: "Conceito demonstrativo",
    version: "Concept 1.0",
    provider: "Veronica Hub · Laboratório de conceitos",
    summary:
      "Exemplo fictício de atendimento para rotina escolar, sem vínculo com instituição existente.",
    scope: ["Dúvidas de responsáveis", "Agenda escolar", "Encaminhamento à secretaria"],
    timeline: [{ date: "DEMO", label: "Cenário visual — sem implantação real", state: "current" }],
    isDemonstration: true,
  },
  {
    serial: "VH-EDU-DEMO-0002",
    client: "Colégio Horizonte Nexo",
    solution: "Agente de Comunicação Escolar",
    category: "Educação diária · demonstração",
    issuedAt: "Demonstração",
    status: "concept",
    statusLabel: "Conceito demonstrativo",
    version: "Concept 1.0",
    provider: "Veronica Hub · Laboratório de conceitos",
    summary:
      "Marca fictícia usada somente para mostrar o sistema de procedência em um contexto educacional.",
    scope: ["Comunicados recorrentes", "Triagem de solicitações", "Orientação inicial"],
    timeline: [{ date: "DEMO", label: "Cenário visual — sem implantação real", state: "current" }],
    isDemonstration: true,
  },
] as const;

export function findSeal(serial: string): SealRecord | undefined {
  return sealRecords.find((record) => record.serial.toLowerCase() === serial.toLowerCase());
}
