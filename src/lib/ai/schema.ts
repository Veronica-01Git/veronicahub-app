/**
 * VERONICA AI WORKFORCE PLATFORM — modelo de dados.
 *
 * Re-exportado por src/lib/schema.ts (fonte canônica do Drizzle), no mesmo
 * padrão de src/members/schema.ts. Migração: drizzle/0019_agent_platform.sql,
 * escrita à mão como as 0012–0018 (ver o cabeçalho dela).
 *
 * CONVENÇÕES HERDADAS DO REPOSITÓRIO, NÃO INVENTADAS AQUI:
 *   - tabela em PascalCase, coluna em camelCase, id `text` com cuid2;
 *   - estado como `text` + CHECK (padrão da 0018), com os valores vindos de
 *     ./platform-types.ts — o mesmo array que tipa o TypeScript;
 *   - JSON em `text`, não `jsonb` (o schema documenta essa escolha em
 *     AffiliateProduct.galleryUrls);
 *   - nenhum ON DELETE CASCADE: registro de agente, execução, avaliação e
 *     transição é trilha de auditoria. Agente sai de operação por
 *     `enabled = false` ou por transição de lifecycle, nunca por DELETE.
 *
 * O QUE NUNCA ENTRA AQUI: chave de API, token, prompt completo, conversa de
 * cliente, documento inteiro. Execução guarda metadado (quem, quando, quanto,
 * qual ferramenta, por que falhou) — não o conteúdo.
 */

import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import {
  AUTONOMY_LEVELS,
  COST_CURRENCIES,
  EVALUATION_VERDICTS,
  EXECUTION_STATUSES,
  EXECUTION_TRIGGERS,
  LIFECYCLE_STATUSES,
  SCENARIO_CATEGORIES,
  TENANT_SCOPES,
  sqlList,
} from "./platform-types.ts";

function emLista(coluna: string, valores: readonly string[]) {
  return sql.raw(`"${coluna}" IN (${sqlList(valores)})`);
}

/* --------------------------------------------------- ModelProvider */

/**
 * Catálogo de provedores de modelo. `id` é o slug estável ("anthropic",
 * "groq", "gemini") — o mesmo que o ModelRouter usa como `provider`.
 *
 * NÃO guarda credencial. Chave de API continua sendo segredo do Worker
 * (wrangler secret), e a tabela só diz que o provedor existe e se está
 * habilitado.
 */
export const modelProviders = pgTable("ModelProvider", {
  id: text("id").primaryKey(),
  displayName: text("displayName").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

/* ------------------------------------------------------------ Agent */

/**
 * Registro persistente de agente. A definição revisada em código mora em
 * src/lib/ai/agent-registry.ts; esta tabela é onde ela vai morar quando o
 * registro passar a ser operado em runtime (estado, versão, habilitado).
 *
 * Custo em micro-unidades inteiras da moeda (ver platform-types.ts). `null`
 * em teto quer dizer "teto não definido" — e o V-IVA reprova isso.
 */
export const agents = pgTable(
  "Agent",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    version: text("version").notNull(),
    status: text("status").notNull().default("LAB"),
    autonomyLevel: text("autonomyLevel").notNull().default("LEVEL_0"),
    tenantScope: text("tenantScope").notNull().default("internal"),
    maxCostPerTaskMicros: integer("maxCostPerTaskMicros"),
    costCurrency: text("costCurrency").notNull().default("USD"),
    maxLatencyMs: integer("maxLatencyMs"),
    requiresApproval: boolean("requiresApproval").notNull().default(true),
    enabled: boolean("enabled").notNull().default(true),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("Agent_slug_key").on(t.slug),
    index("Agent_status_idx").on(t.status),
    check("Agent_status_check", emLista("status", LIFECYCLE_STATUSES)),
    check("Agent_autonomyLevel_check", emLista("autonomyLevel", AUTONOMY_LEVELS)),
    check("Agent_tenantScope_check", emLista("tenantScope", TENANT_SCOPES)),
    check("Agent_costCurrency_check", emLista("costCurrency", COST_CURRENCIES)),
    check(
      "Agent_ceilings_check",
      sql`("maxCostPerTaskMicros" IS NULL OR "maxCostPerTaskMicros" >= 0) AND ("maxLatencyMs" IS NULL OR "maxLatencyMs" > 0)`,
    ),
  ],
);

/* ------------------------------------------------- AgentSkill / Tool */

/**
 * Skill concedida a um agente. `skillKey` aponta para uma fonte canônica que
 * já existe — `veronica:<id>` para as skills de src/veronica/skills
 * (VERONICA_SKILLS) ou `cap:<chave>` para capacidade declarada no registro.
 * Não existe tabela de skill: o catálogo é código revisado.
 */
export const agentSkills = pgTable(
  "AgentSkill",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    agentId: text("agentId")
      .notNull()
      .references(() => agents.id),
    skillKey: text("skillKey").notNull(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("AgentSkill_agentId_skillKey_key").on(t.agentId, t.skillKey)],
);

/**
 * Ferramenta concedida a um agente. `toolKey` aponta para TOOL_REGISTRY em
 * src/lib/ai/agent-registry.ts. `requiresApproval` é por concessão: a mesma
 * ferramenta pode exigir aprovação num agente e não em outro.
 */
export const agentTools = pgTable(
  "AgentTool",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    agentId: text("agentId")
      .notNull()
      .references(() => agents.id),
    toolKey: text("toolKey").notNull(),
    requiresApproval: boolean("requiresApproval").notNull().default(true),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("AgentTool_agentId_toolKey_key").on(t.agentId, t.toolKey)],
);

/* --------------------------------------------------- AgentExecution */

/**
 * Uma execução de um agente para um tenant. Responde: qual agente, em qual
 * versão, para quem, o que disparou, quando começou e terminou, quanto
 * demorou, quanto custou, quais ferramentas usou, se precisou de aprovação,
 * se falhou e por quê.
 *
 * `tenantId` é obrigatório desde a primeira linha — execução sem tenant não
 * existe, e é isso que torna impossível misturar dado de dois clientes numa
 * consulta que esqueceu o filtro.
 *
 * Custo: estimado (antes) e real (depois), ambos podendo ser `null` quando o
 * provedor não informa. Nunca se grava zero no lugar de "não sei".
 *
 * `toolsUsed` e `resultMetadata` são JSON em texto, com chaves conhecidas —
 * nunca prompt, resposta inteira ou dado pessoal (ver observability.ts).
 */
export const agentExecutions = pgTable(
  "AgentExecution",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    agentId: text("agentId")
      .notNull()
      .references(() => agents.id),
    agentVersion: text("agentVersion").notNull(),
    tenantId: text("tenantId").notNull(),
    trigger: text("trigger").notNull(),
    status: text("status").notNull().default("QUEUED"),
    requiresApproval: boolean("requiresApproval").notNull().default(false),
    /** Quem aprovou: id de usuário ou ator de sistema. Texto, não FK — ator pode não ser User. */
    approvedBy: text("approvedBy"),
    approvedAt: timestamp("approvedAt"),
    providerId: text("providerId").references(() => modelProviders.id),
    model: text("model"),
    estimatedCostMicros: integer("estimatedCostMicros"),
    actualCostMicros: integer("actualCostMicros"),
    costCurrency: text("costCurrency").notNull().default("USD"),
    toolsUsed: text("toolsUsed").notNull().default("[]"),
    errorCode: text("errorCode"),
    /** Resumo curto e sem dado sensível. Corpo de erro inteiro não entra. */
    errorMessage: text("errorMessage"),
    resultMetadata: text("resultMetadata"),
    queuedAt: timestamp("queuedAt").notNull().defaultNow(),
    startedAt: timestamp("startedAt"),
    finishedAt: timestamp("finishedAt"),
    durationMs: integer("durationMs"),
  },
  (t) => [
    index("AgentExecution_agentId_queuedAt_idx").on(t.agentId, t.queuedAt),
    index("AgentExecution_tenantId_queuedAt_idx").on(t.tenantId, t.queuedAt),
    index("AgentExecution_status_queuedAt_idx").on(t.status, t.queuedAt),
    check("AgentExecution_status_check", emLista("status", EXECUTION_STATUSES)),
    check("AgentExecution_trigger_check", emLista("trigger", EXECUTION_TRIGGERS)),
    check("AgentExecution_costCurrency_check", emLista("costCurrency", COST_CURRENCIES)),
    check(
      "AgentExecution_costs_check",
      sql`("estimatedCostMicros" IS NULL OR "estimatedCostMicros" >= 0) AND ("actualCostMicros" IS NULL OR "actualCostMicros" >= 0) AND ("durationMs" IS NULL OR "durationMs" >= 0)`,
    ),
  ],
);

/* -------------------------------------------------- AgentEvaluation */

/**
 * Resultado de um cenário avaliado pelo V-IVA. Uma avaliação completa é o
 * conjunto de linhas com o mesmo `runId`. `executionId` fica null em
 * avaliação estática (feita só sobre a especificação, sem execução).
 *
 * O veredito é REVIEW quando não dá para decidir deterministicamente — o
 * V-IVA não transforma falta de evidência em PASS.
 */
export const agentEvaluations = pgTable(
  "AgentEvaluation",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    agentId: text("agentId")
      .notNull()
      .references(() => agents.id),
    agentVersion: text("agentVersion").notNull(),
    executionId: text("executionId").references(() => agentExecutions.id),
    runId: text("runId").notNull(),
    scenarioId: text("scenarioId").notNull(),
    category: text("category").notNull(),
    verdict: text("verdict").notNull(),
    reason: text("reason").notNull(),
    metrics: text("metrics"),
    evidence: text("evidence"),
    evaluator: text("evaluator").notNull().default("v-iva"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (t) => [
    index("AgentEvaluation_agentId_createdAt_idx").on(t.agentId, t.createdAt),
    index("AgentEvaluation_executionId_idx").on(t.executionId),
    index("AgentEvaluation_runId_idx").on(t.runId),
    check("AgentEvaluation_verdict_check", emLista("verdict", EVALUATION_VERDICTS)),
    check("AgentEvaluation_category_check", emLista("category", SCENARIO_CATEGORIES)),
  ],
);

/* ------------------------------------------ AgentLifecycleTransition */

/**
 * Toda mudança de estado de um agente, para sempre. Somente inserção: uma
 * promoção nunca reescreve a anterior, e o estado atual de um agente é
 * auditável refazendo a fila de transições.
 *
 * `fromStatus` null = registro inicial. `evaluationRunId` liga a promoção ao
 * relatório do V-IVA que a recomendou, quando houve.
 */
export const agentLifecycleTransitions = pgTable(
  "AgentLifecycleTransition",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    agentId: text("agentId")
      .notNull()
      .references(() => agents.id),
    fromStatus: text("fromStatus"),
    toStatus: text("toStatus").notNull(),
    reason: text("reason").notNull(),
    requestedBy: text("requestedBy").notNull(),
    approvedBy: text("approvedBy"),
    evaluationRunId: text("evaluationRunId"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (t) => [
    index("AgentLifecycleTransition_agentId_createdAt_idx").on(t.agentId, t.createdAt),
    check(
      "AgentLifecycleTransition_fromStatus_check",
      sql.raw(`"fromStatus" IS NULL OR "fromStatus" IN (${sqlList(LIFECYCLE_STATUSES)})`),
    ),
    check("AgentLifecycleTransition_toStatus_check", emLista("toStatus", LIFECYCLE_STATUSES)),
  ],
);
