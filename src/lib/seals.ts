export type SealStatus = "development" | "active" | "support" | "archived" | "concept" | "member";

export type SealRecord = {
  serial: string;
  memberNumber?: number;
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
  member: "Vínculo de membro registrado na Veronica Hub. Este selo não atesta conclusão de projetos ou integrações.",
  development: "Projeto registrado e atualmente em desenvolvimento.",
  active: "Implantação concluída e registro ativo.",
  support: "Implantação concluída e em período de suporte.",
  archived: "Registro preservado; ciclo de atendimento encerrado.",
  concept: "Conceito visual demonstrativo. Não representa uma relação comercial real.",
};

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
    serial: "VH-MEM-2026-000002",
    memberNumber: 2,
    client: "LZ Team",
    solution: "Membro Veronica Hub · Cliente 02",
    category: "Comunidade · selo de membro",
    issuedAt: "21/09/2026",
    status: "member",
    statusLabel: "Membro registrado",
    version: "1.0 · Registro de membro",
    provider: "Veronica Hub",
    summary: "Registro de membro do LZ Team, segundo cliente da Veronica Hub. O escopo de serviços e as integrações do time ainda serão definidos.",
    scope: ["Identidade de membro do LZ Team", "Área de membros com login por e-mail", "Novidades antecipadas e prompts gratuitos publicados pela equipe", "Participação nas conversas com moderação"],
    timeline: [{date: "21 SET 2026", label: "Selo de membro emitido · Cliente 02", state: "done"}],
  },
  {
    serial: "VH-MEM-2026-000003",
    memberNumber: 3,
    client: "Veronica Fashion & Co.",
    solution: "Membro Veronica Hub · Cliente 03",
    category: "Moda e criação · selo de membro",
    issuedAt: "21/09/2026",
    status: "member",
    statusLabel: "Membro registrado",
    version: "1.0 · Registro de membro",
    provider: "Veronica Hub",
    summary: "Registro de membro da Veronica Fashion & Co., terceiro cliente da Veronica Hub. O Fashion Operator é o ambiente de demonstração associado; suas integrações operacionais permanecem em preparação.",
    scope: ["Identidade de membro da Veronica Fashion & Co.", "Área de membros com login por e-mail", "Imagens, vídeos, ideias e prompts publicados pela equipe", "Ambiente Fashion Operator com dados demonstrativos identificados"],
    timeline: [{date: "21 SET 2026", label: "Selo de membro emitido · Cliente 03", state: "done"}],
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
