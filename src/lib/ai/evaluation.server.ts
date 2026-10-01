/**
 * AVALIAÇÃO DO V-IVA CONTRA A AGENTE REAL — núcleo de servidor.
 *
 * Só roda por pedido de um admin (ver ./evaluation-functions.ts) e só para
 * agentes com executor real. Hoje: `whatsapp-atendimento`, pela mesma
 * `decidirResposta` da sala de teste da Express.
 *
 * SEGURANÇA DO WHATSAPP DA EXPRESS ENTULHO (AGENTS.md):
 *   - nada aqui envia mensagem. Este arquivo não importa whatsapp-cloud.ts nem
 *     whatsapp-webhook.ts — o teste confere o grafo de imports;
 *   - nada aqui lê ou grava WaConversation / WaMessage;
 *   - as mensagens dos cenários são sintéticas, geradas pelo V-IVA.
 *
 * CUSTO. Cada cenário que chega à agente pode chamar o modelo pago. O teto
 * superior da rodada é (cenários que chegam à agente) × (teto por resposta
 * do agente) e é mostrado ANTES de rodar. Uma rodada por agente a cada 10
 * minutos, para um clique duplo não pagar duas vezes.
 *
 * O QUE FICA GRAVADO (tabelas da migração 0019, nunca as do WhatsApp):
 *   - Agent: criado na primeira rodada a partir do registro em código, com
 *     uma transição de lifecycle inicial (fromStatus null) — o estado não muda;
 *   - AgentExecution: uma linha por cenário executado, sem o texto da resposta;
 *   - AgentEvaluation: uma linha por cenário, com veredito e evidência mínima.
 */

import { and, eq, gt } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { getDb } from "../db";
import { agentEvaluations, agentExecutions, agentLifecycleTransitions, agents } from "../schema";
import { decidirResposta, valoresCitados } from "../whatsapp-agent";
import { REGRAS_EXPRESS_ENTULHO } from "../whatsapp-rules";
import {
  agentDescription,
  agentName,
  registeredAgent,
  toSpecification,
  type RegisteredAgent,
} from "./agent-registry";
import {
  VivaAgent,
  type EvaluationReport,
  type Scenario,
  type ScenarioExecutionResult,
  type ScenarioExecutor,
} from "./agents/v-iva";
import { createTestRoomExecutor } from "./executors/test-room-executor";
import { checkTenantAccess } from "./tenant-guard";

/** Agentes com executor real ligado. Só estes podem rodar a avaliação completa. */
const EXECUTORES: Record<string, { label: string; criar: () => ScenarioExecutor }> = {
  "whatsapp-atendimento": {
    label: "sala-de-teste-express (decidirResposta, sem envio)",
    criar: () =>
      createTestRoomExecutor({
        decidir: (p) => decidirResposta({ ...p, historico: [], regras: REGRAS_EXPRESS_ENTULHO }),
        agentTenant: "express-entulho",
        valoresCitados,
      }),
  },
};

const INTERVALO_MINIMO_MS = 10 * 60 * 1000;

export type EstimativaDeAvaliacao = {
  readonly slug: string;
  readonly executor: string | null;
  readonly cenarios: number;
  /** Cenários que chegam à agente (passam pela guarda de tenant). */
  readonly chegamAAgente: number;
  /** Teto superior da rodada em micros. null = agente sem teto por tarefa. */
  readonly custoMaximoMicros: number | null;
};

function cenariosQueChegam(agente: RegisteredAgent, cenarios: readonly Scenario[]): number {
  const spec = toSpecification(agente);
  return cenarios.filter(
    (c) => c.mode === "runtime" && checkTenantAccess(spec, c.input.tenantId).ok,
  ).length;
}

export function estimarAvaliacao(slug: string): EstimativaDeAvaliacao | null {
  const agente = registeredAgent(slug);
  if (!agente) return null;
  const cenarios = new VivaAgent(toSpecification(agente)).generateScenarios();
  const chegam = cenariosQueChegam(agente, cenarios);
  return {
    slug,
    executor: EXECUTORES[slug]?.label ?? null,
    cenarios: cenarios.length,
    chegamAAgente: chegam,
    custoMaximoMicros:
      agente.maxCostPerTaskMicros === null ? null : chegam * agente.maxCostPerTaskMicros,
  };
}

/** Avaliação só sobre a especificação: sem executor, sem custo, sem gravação. */
export async function avaliarEspecificacao(slug: string): Promise<EvaluationReport | null> {
  const agente = registeredAgent(slug);
  if (!agente) return null;
  return new VivaAgent(toSpecification(agente)).runFullEvaluation();
}

async function garantirAgente(agente: RegisteredAgent, solicitante: string): Promise<string> {
  const db = getDb();
  const [existente] = await db
    .select({ id: agents.id })
    .from(agents)
    .where(eq(agents.slug, agente.slug))
    .limit(1);
  if (existente) return existente.id;

  const id = createId();
  const inseridos = await db
    .insert(agents)
    .values({
      id,
      slug: agente.slug,
      name: agentName(agente),
      description: agentDescription(agente),
      version: agente.version,
      status: agente.status,
      autonomyLevel: agente.autonomyLevel,
      tenantScope: agente.tenantScope,
      maxCostPerTaskMicros: agente.maxCostPerTaskMicros,
      costCurrency: agente.costCurrency,
      maxLatencyMs: agente.maxLatencyMs,
      requiresApproval: agente.approval.requiresApproval,
    })
    .onConflictDoNothing({ target: agents.slug })
    .returning({ id: agents.id });

  if (inseridos.length === 0) {
    // Outra requisição criou no mesmo instante: usa a dela.
    const [criado] = await db
      .select({ id: agents.id })
      .from(agents)
      .where(eq(agents.slug, agente.slug))
      .limit(1);
    return criado.id;
  }

  // Registro inicial na trilha de lifecycle. fromStatus null = primeira entrada;
  // o estado é o que o registro em código já declarava, não uma promoção.
  await db.insert(agentLifecycleTransitions).values({
    agentId: id,
    fromStatus: null,
    toStatus: agente.status,
    reason: `Registro inicial a partir do registro em código: ${agente.statusBasis}`,
    requestedBy: solicitante,
  });
  return id;
}

export type ResultadoDaRodada =
  | { readonly ok: true; readonly report: EvaluationReport; readonly gravados: number }
  | { readonly ok: false; readonly error: string };

export async function rodarAvaliacaoComExecutor(
  slug: string,
  solicitante: string,
): Promise<ResultadoDaRodada> {
  const agente = registeredAgent(slug);
  const executor = EXECUTORES[slug];
  if (!agente) return { ok: false, error: "Agente não registrado." };
  if (!executor) return { ok: false, error: "Este agente ainda não tem executor real ligado." };

  const db = getDb();
  const agentId = await garantirAgente(agente, solicitante);

  const recente = await db
    .select({ id: agentEvaluations.id })
    .from(agentEvaluations)
    .where(
      and(
        eq(agentEvaluations.agentId, agentId),
        gt(agentEvaluations.createdAt, new Date(Date.now() - INTERVALO_MINIMO_MS)),
      ),
    )
    .limit(1);
  if (recente.length > 0) {
    return {
      ok: false,
      error: "Já houve uma rodada nos últimos 10 minutos. Aguarde para não pagar duas vezes.",
    };
  }

  // Envolve o executor para guardar início e fim de cada execução real.
  const execucoes = new Map<
    string,
    { id: string; inicio: Date; fim: Date; r: ScenarioExecutionResult }
  >();
  const real = executor.criar();
  const comRegistro: ScenarioExecutor = async (cenario, spec) => {
    const inicio = new Date();
    const r = await real(cenario, spec);
    execucoes.set(cenario.id, { id: createId(), inicio, fim: new Date(), r });
    return r;
  };

  const report = await new VivaAgent(toSpecification(agente)).runFullEvaluation({
    executor: comRegistro,
    executorLabel: executor.label,
  });

  const linhasExecucao = [...execucoes.entries()].map(([scenarioId, e]) => ({
    id: e.id,
    agentId,
    agentVersion: agente.version,
    // Tenant recusado pela guarda continua registrado: é o que foi pedido.
    tenantId: e.r.tenantId ?? "sem-tenant",
    trigger: "evaluation",
    status: e.r.refused || e.r.error ? "FAILED" : "SUCCEEDED",
    requiresApproval: false,
    toolsUsed: JSON.stringify(e.r.toolsCalled),
    actualCostMicros: e.r.costMicros,
    errorCode: e.r.refused ? "TENANT_FORBIDDEN" : e.r.error ? "PROVIDER_CHAIN_FAILED" : null,
    errorMessage: e.r.error ? e.r.error.slice(0, 240) : null,
    resultMetadata: JSON.stringify({
      runId: report.runId,
      scenarioId,
      handedOff: e.r.handedOff,
      refused: e.r.refused,
    }),
    queuedAt: e.inicio,
    startedAt: e.inicio,
    finishedAt: e.fim,
    durationMs: e.r.latencyMs,
  }));

  const linhasAvaliacao = report.results.map((r) => ({
    agentId,
    agentVersion: agente.version,
    executionId: execucoes.get(r.scenarioId)?.id ?? null,
    runId: report.runId,
    scenarioId: r.scenarioId,
    category: r.category,
    verdict: r.verdict,
    reason: r.reason.slice(0, 500),
    metrics: JSON.stringify(r.metrics),
    evidence: JSON.stringify(r.evidence),
    evaluator: "v-iva",
  }));

  if (linhasExecucao.length > 0) await db.insert(agentExecutions).values(linhasExecucao);
  if (linhasAvaliacao.length > 0) await db.insert(agentEvaluations).values(linhasAvaliacao);

  return { ok: true, report, gravados: linhasExecucao.length + linhasAvaliacao.length };
}
