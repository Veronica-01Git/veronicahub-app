export const SERVICES = [
  {
    id: "commercial",
    name: "Operação Comercial",
    agents: ["Veronica Comercial", "Atendimento"],
    deliverables: [
      "Briefing qualificado",
      "Atendimento com regras aprovadas",
      "Proposta supervisionada",
    ],
    needs: ["Tabela de serviços", "Processo de venda", "Responsável pela aprovação"],
    stage: "Diagnóstico disponível; operação do cliente sob implantação",
  },
  {
    id: "content",
    name: "Conteúdo e Campanhas",
    agents: ["Redação", "Creative Producer"],
    deliverables: ["Calendário editorial", "Conteúdo com fontes", "Peças com identidade de marca"],
    needs: ["Identidade visual", "Fontes autorizadas", "Cadência e revisão"],
    stage: "Bases de redação e imagem existentes; canais sob implantação",
  },
  {
    id: "website",
    name: "Presença Digital",
    agents: ["Site Architect", "Portfólio"],
    deliverables: ["Briefing de site", "Escopo técnico", "Plano de entrega e manutenção"],
    needs: ["Objetivo do site", "Conteúdo e referências", "Integrações necessárias"],
    stage: "Portfólio disponível; site personalizado sob proposta",
  },
  {
    id: "community",
    name: "Comunidade e Aprendizagem",
    agents: ["Community", "Academy"],
    deliverables: ["Calendário de conteúdo", "Respostas assistidas", "Acompanhamento de dúvidas"],
    needs: ["Conteúdo autorizado", "Regras de moderação", "Equipe responsável"],
    stage: "Base Members existente; tutoria e integração sob implantação",
  },
  {
    id: "commerce",
    name: "Comércio e Afiliados",
    agents: ["Commerce", "Reconciliation"],
    deliverables: [
      "Curadoria de ofertas",
      "Kit de divulgação",
      "Conferência de resultados oficiais",
    ],
    needs: ["Catálogo habilitado", "Links autorizados", "Relatórios oficiais"],
    stage: "Curadoria existente; vendas e repasses dependem de conciliação",
  },
  {
    id: "specialist",
    name: "Operação Especializada",
    agents: ["Fashion", "Coach Operations", "Consignação", "Marina Desk"],
    deliverables: ["Diagnóstico do processo", "Plano de integração", "Piloto com aprovação"],
    needs: ["Dados reais da operação", "Responsável técnico", "Sistema a integrar"],
    stage: "Escopo e piloto necessários; capacidades variam por segmento",
  },
] as const;
export type ServiceId = (typeof SERVICES)[number]["id"];
export const STATES = ["received", "reviewed", "approved", "won", "lost"] as const;
export type BriefState = (typeof STATES)[number];
export const STATE_LABEL: Record<BriefState, string> = {
  received: "Recebido",
  reviewed: "Em revisão",
  approved: "Proposta aprovada",
  won: "Contratação confirmada",
  lost: "Encerrado",
};
export type Brief = {
  requestId: string;
  company: string;
  challenge: string;
  service: ServiceId;
  volume: string;
  systems: string;
  goal: string;
  consent: boolean;
};
const text = (v: unknown, max: number, required = false) => {
  if (typeof v !== "string" || v.length > max || (required && !v.trim()))
    throw new Error("Confira os campos do diagnóstico.");
  return v.trim();
};
export function validateBrief(v: unknown): Brief {
  const d = v as Partial<Brief>;
  if (
    !d ||
    !SERVICES.some((s) => s.id === d.service) ||
    d.consent !== true ||
    typeof d.requestId !== "string" ||
    !/^[a-zA-Z0-9-]{16,80}$/.test(d.requestId)
  )
    throw new Error("Diagnóstico inválido.");
  return {
    requestId: d.requestId,
    company: text(d.company, 120),
    challenge: text(d.challenge, 2000, true),
    service: d.service!,
    volume: text(d.volume, 160),
    systems: text(d.systems, 300),
    goal: text(d.goal, 500, true),
    consent: true,
  };
}
export function qualify(b: Brief) {
  const service = SERVICES.find((s) => s.id === b.service)!;
  const missing = [
    !b.volume.trim() && "Informe o volume aproximado de solicitações.",
    !b.systems.trim() && "Confirme quais sistemas precisam ser integrados.",
  ].filter(Boolean) as string[];
  return {
    service: service.id,
    summary: b.challenge,
    deliverables: [...service.deliverables],
    questions: missing,
    mode: "rules" as const,
    requiresReview: true,
  };
}
export function validateAnalysis(raw: string, b: Brief) {
  const d = JSON.parse(raw) as { summary?: unknown; questions?: unknown };
  if (
    typeof d.summary !== "string" ||
    d.summary.length > 900 ||
    !d.summary.trim() ||
    !Array.isArray(d.questions) ||
    d.questions.length > 3 ||
    d.questions.some((q) => typeof q !== "string" || q.length > 220 || !q.trim())
  )
    throw new Error("Análise fora do contrato.");
  if (/R\$|garantid|\d+\s*%|https?:\/\//i.test(d.summary + " " + d.questions.join(" ")))
    throw new Error("Análise exige revisão.");
  return {
    ...qualify(b),
    summary: d.summary,
    questions: d.questions as string[],
    mode: "model" as const,
  };
}
export function validateDecision(v: unknown) {
  const d = v as {
    id?: unknown;
    expectedState?: unknown;
    state?: unknown;
    setupCents?: unknown;
    monthlyCents?: unknown;
    scope?: unknown;
    note?: unknown;
  };
  if (
    !d ||
    typeof d.id !== "string" ||
    d.id.length > 80 ||
    !STATES.includes(d.state as BriefState) ||
    !STATES.includes(d.expectedState as BriefState)
  )
    throw new Error("Decisão inválida.");
  const cents = (n: unknown) => {
    if (!Number.isSafeInteger(n) || Number(n) < 0 || Number(n) > 100000000)
      throw new Error("Valor inválido.");
    return Number(n);
  };
  const scope = text(d.scope, 2500),
    note = text(d.note, 1000, true);
  if ((d.state === "approved" || d.state === "won") && !scope)
    throw new Error("Defina o escopo antes de aprovar.");
  const allowed: Record<BriefState, BriefState[]> = {
    received: ["reviewed", "lost"],
    reviewed: ["approved", "lost"],
    approved: ["reviewed", "won", "lost"],
    won: [],
    lost: [],
  };
  if (!allowed[d.expectedState as BriefState].includes(d.state as BriefState))
    throw new Error("Etapa de aprovação inválida.");
  return {
    id: d.id,
    expectedState: d.expectedState as BriefState,
    state: d.state as BriefState,
    setupCents: cents(d.setupCents),
    monthlyCents: cents(d.monthlyCents),
    scope,
    note,
  };
}
export function assessSignal(date: unknown, maxAgeHours: number, now = Date.now()) {
  const time = date ? new Date(String(date)).getTime() : NaN;
  return !Number.isFinite(time)
    ? "unknown"
    : now - time > maxAgeHours * 3600000
      ? "attention"
      : "recent";
}
