import { type Brief } from "./core.ts";

/** Coverage describes supplied fields, never likelihood of purchase or revenue. */
export function qualification(b: Pick<Brief, "challenge" | "goal" | "volume" | "systems">) {
  const checks = [
    { label: "Necessidade", supplied: !!b.challenge.trim() },
    { label: "Entrega esperada", supplied: !!b.goal.trim() },
    { label: "Volume", supplied: !!b.volume.trim() },
    { label: "Sistemas e canais", supplied: !!b.systems.trim() },
  ];
  return {
    checks,
    supplied: checks.filter((c) => c.supplied).length,
    total: checks.length,
    next: checks.every((c) => c.supplied)
      ? "Conferir regras, permissões e um exemplo real antes de propor o piloto."
      : "Completar as informações pendentes antes de definir a integração.",
  };
}
export function readAnalysis(raw: unknown) {
  try {
    const a = JSON.parse(String(raw)) as Record<string, unknown>;
    return {
      summary:
        typeof a.summary === "string"
          ? a.summary
          : "Análise indisponível; consulte o briefing original.",
      questions: Array.isArray(a.questions)
        ? a.questions.filter((q): q is string => typeof q === "string").slice(0, 3)
        : [],
      mode: a.mode === "model" ? "model" : "rules",
      runtime:
        a.runtime && typeof a.runtime === "object"
          ? (a.runtime as {
              failure?: string | null;
              durationMs?: number;
              estimatedCostMicros?: number | null;
              version?: string;
            })
          : null,
    };
  } catch {
    return {
      summary: "Análise indisponível; consulte o briefing original.",
      questions: [],
      mode: "rules",
      runtime: null,
    };
  }
}
export const DEMO_SCENARIOS = [
  {
    id: "outside",
    label: "Pedidos fora do horário",
    customer: "Quero um orçamento, mas só consigo falar à noite.",
    response:
      "Posso organizar sua solicitação. Qual serviço você procura e em qual cidade precisa dele?",
    context: "O cliente informou o serviço e a cidade.",
    handoff:
      "Solicitação organizada para a equipe conferir disponibilidade e preço. Nenhum orçamento foi prometido.",
  },
  {
    id: "integration",
    label: "Agenda e sistemas",
    customer: "Posso marcar um horário para amanhã?",
    response:
      "Qual serviço e período você prefere? A confirmação depende da disponibilidade da equipe.",
    context: "O cliente indicou serviço, dia e período preferido.",
    handoff:
      "Preferência encaminhada para conferência da agenda. A reserva só é confirmada com disponibilidade real.",
  },
  {
    id: "exception",
    label: "Pedido que exige uma pessoa",
    customer: "Tive um problema no atendimento e quero falar com alguém.",
    response:
      "Vou organizar seu relato para o responsável. Pode resumir o que aconteceu, sem enviar dados sensíveis?",
    context: "O cliente descreveu o problema.",
    handoff:
      "Caso encaminhado para revisão humana. O agente não decide compensações nem encerra a reclamação sozinho.",
  },
] as const;
