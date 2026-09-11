export type SealStatus = "development" | "active" | "support" | "archived" | "concept";

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
  timeline: readonly { date: string; label: string; state: "done" | "current" | "next" }[];
  support?: string;
  isDemonstration?: boolean;
};

export const SEAL_STATUS_COPY: Record<SealStatus, string> = {
  development: "Projeto registrado e atualmente em desenvolvimento.",
  active: "Implantação concluída e registro ativo.",
  support: "Implantação concluída e em período de suporte.",
  archived: "Registro preservado; ciclo de atendimento encerrado.",
  concept: "Conceito visual demonstrativo. Não representa uma relação comercial real.",
};

export const sealRecords: readonly SealRecord[] = [
  {
    serial: "VH-AUT-WA-2026-000001",
    client: "Express Entulhos",
    solution: "Agente de IA para WhatsApp e Leads",
    category: "Automação de atendimento",
    issuedAt: "11/09/2026",
    status: "development",
    statusLabel: "Em desenvolvimento",
    version: "0.1 · Implantação",
    provider: "YO LAB & CO. · Laboratório da Veronica Hub",
    summary: "Registro de procedência do projeto de automação comercial e atendimento da Express Entulhos.",
    scope: [
      "Agente de IA para atendimento no WhatsApp",
      "Organização e encaminhamento de leads",
      "Implantação prevista em cinco dias",
      "Suporte por 30 dias após a entrega",
    ],
    timeline: [
      { date: "11 SET 2026", label: "Projeto registrado", state: "done" },
      { date: "EM CURSO", label: "Desenvolvimento e homologação", state: "current" },
      { date: "PRÓXIMO", label: "Implantação e início do suporte", state: "next" },
    ],
    support: "30 dias após a implantação",
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
    summary: "Exemplo fictício de como o registro pode documentar uma solução para a indústria têxtil.",
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
    summary: "Marca integralmente fictícia criada para demonstrar um possível caso de automação industrial.",
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
    summary: "Exemplo fictício de atendimento para rotina escolar, sem vínculo com instituição existente.",
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
    summary: "Marca fictícia usada somente para mostrar o sistema de procedência em um contexto educacional.",
    scope: ["Comunicados recorrentes", "Triagem de solicitações", "Orientação inicial"],
    timeline: [{ date: "DEMO", label: "Cenário visual — sem implantação real", state: "current" }],
    isDemonstration: true,
  },
] as const;

export function findSeal(serial: string): SealRecord | undefined {
  return sealRecords.find((record) => record.serial.toLowerCase() === serial.toLowerCase());
}
