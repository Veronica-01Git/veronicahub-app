-- 0019 — Veronica AI Workforce Platform: registro de agentes, execuções,
-- avaliações do V-IVA e trilha de lifecycle. Schema em src/lib/ai/schema.ts.
--
-- ADITIVA: só CREATE TABLE / CREATE INDEX, tudo IF NOT EXISTS. Nenhum DROP,
-- nenhum ALTER em tabela existente. Pode rodar duas vezes sem efeito.
--
-- ESCRITA À MÃO, como as 0012–0018: o _journal.json do drizzle-kit parou na
-- 0011, então `drizzle-kit generate` hoje recriaria tabelas que já existem.
-- Aplicar manualmente no mesmo branch do Neon usado por DATABASE_URL, e só
-- com aprovação de Matheus. NÃO foi aplicada em produção por este PR.
--
-- Estados como text + CHECK (padrão da 0018). Os valores espelham os arrays
-- de src/lib/ai/platform-types.ts — tests/ai-platform.test.mjs confere que
-- os dois lados batem.
--
-- Custo em micro-unidades inteiras da moeda (1 USD = 1.000.000). NULL =
-- desconhecido ou não definido; nunca zero no lugar de "não sei".

CREATE TABLE IF NOT EXISTS "ModelProvider" (
  "id" text PRIMARY KEY NOT NULL,
  "displayName" text NOT NULL,
  "enabled" boolean DEFAULT true NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "Agent" (
  "id" text PRIMARY KEY NOT NULL,
  "slug" text NOT NULL,
  "name" text NOT NULL,
  "description" text NOT NULL,
  "version" text NOT NULL,
  "status" text DEFAULT 'LAB' NOT NULL,
  "autonomyLevel" text DEFAULT 'LEVEL_0' NOT NULL,
  "tenantScope" text DEFAULT 'internal' NOT NULL,
  "maxCostPerTaskMicros" integer,
  "costCurrency" text DEFAULT 'USD' NOT NULL,
  "maxLatencyMs" integer,
  "requiresApproval" boolean DEFAULT true NOT NULL,
  "enabled" boolean DEFAULT true NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "Agent_status_check" CHECK ("status" IN ('LAB', 'ALPHA', 'INTERNAL', 'PILOT', 'VALIDATED', 'PRODUCTION', 'ENTERPRISE')),
  CONSTRAINT "Agent_autonomyLevel_check" CHECK ("autonomyLevel" IN ('LEVEL_0', 'LEVEL_1', 'LEVEL_2', 'LEVEL_3', 'LEVEL_4', 'LEVEL_5')),
  CONSTRAINT "Agent_tenantScope_check" CHECK ("tenantScope" IN ('internal', 'single', 'multi')),
  CONSTRAINT "Agent_costCurrency_check" CHECK ("costCurrency" IN ('USD', 'BRL')),
  CONSTRAINT "Agent_ceilings_check" CHECK (("maxCostPerTaskMicros" IS NULL OR "maxCostPerTaskMicros" >= 0) AND ("maxLatencyMs" IS NULL OR "maxLatencyMs" > 0))
);
CREATE UNIQUE INDEX IF NOT EXISTS "Agent_slug_key" ON "Agent" ("slug");
CREATE INDEX IF NOT EXISTS "Agent_status_idx" ON "Agent" ("status");

CREATE TABLE IF NOT EXISTS "AgentSkill" (
  "id" text PRIMARY KEY NOT NULL,
  "agentId" text NOT NULL REFERENCES "Agent"("id"),
  "skillKey" text NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "AgentSkill_agentId_skillKey_key" ON "AgentSkill" ("agentId", "skillKey");

CREATE TABLE IF NOT EXISTS "AgentTool" (
  "id" text PRIMARY KEY NOT NULL,
  "agentId" text NOT NULL REFERENCES "Agent"("id"),
  "toolKey" text NOT NULL,
  "requiresApproval" boolean DEFAULT true NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "AgentTool_agentId_toolKey_key" ON "AgentTool" ("agentId", "toolKey");

CREATE TABLE IF NOT EXISTS "AgentExecution" (
  "id" text PRIMARY KEY NOT NULL,
  "agentId" text NOT NULL REFERENCES "Agent"("id"),
  "agentVersion" text NOT NULL,
  "tenantId" text NOT NULL,
  "trigger" text NOT NULL,
  "status" text DEFAULT 'QUEUED' NOT NULL,
  "requiresApproval" boolean DEFAULT false NOT NULL,
  "approvedBy" text,
  "approvedAt" timestamp,
  "providerId" text REFERENCES "ModelProvider"("id"),
  "model" text,
  "estimatedCostMicros" integer,
  "actualCostMicros" integer,
  "costCurrency" text DEFAULT 'USD' NOT NULL,
  "toolsUsed" text DEFAULT '[]' NOT NULL,
  "errorCode" text,
  "errorMessage" text,
  "resultMetadata" text,
  "queuedAt" timestamp DEFAULT now() NOT NULL,
  "startedAt" timestamp,
  "finishedAt" timestamp,
  "durationMs" integer,
  CONSTRAINT "AgentExecution_status_check" CHECK ("status" IN ('QUEUED', 'RUNNING', 'AWAITING_APPROVAL', 'SUCCEEDED', 'FAILED', 'CANCELLED')),
  CONSTRAINT "AgentExecution_trigger_check" CHECK ("trigger" IN ('manual', 'schedule', 'webhook', 'api', 'evaluation')),
  CONSTRAINT "AgentExecution_costCurrency_check" CHECK ("costCurrency" IN ('USD', 'BRL')),
  CONSTRAINT "AgentExecution_costs_check" CHECK (("estimatedCostMicros" IS NULL OR "estimatedCostMicros" >= 0) AND ("actualCostMicros" IS NULL OR "actualCostMicros" >= 0) AND ("durationMs" IS NULL OR "durationMs" >= 0))
);
CREATE INDEX IF NOT EXISTS "AgentExecution_agentId_queuedAt_idx" ON "AgentExecution" ("agentId", "queuedAt");
CREATE INDEX IF NOT EXISTS "AgentExecution_tenantId_queuedAt_idx" ON "AgentExecution" ("tenantId", "queuedAt");
CREATE INDEX IF NOT EXISTS "AgentExecution_status_queuedAt_idx" ON "AgentExecution" ("status", "queuedAt");

CREATE TABLE IF NOT EXISTS "AgentEvaluation" (
  "id" text PRIMARY KEY NOT NULL,
  "agentId" text NOT NULL REFERENCES "Agent"("id"),
  "agentVersion" text NOT NULL,
  "executionId" text REFERENCES "AgentExecution"("id"),
  "runId" text NOT NULL,
  "scenarioId" text NOT NULL,
  "category" text NOT NULL,
  "verdict" text NOT NULL,
  "reason" text NOT NULL,
  "metrics" text,
  "evidence" text,
  "evaluator" text DEFAULT 'v-iva' NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "AgentEvaluation_verdict_check" CHECK ("verdict" IN ('PASS', 'FAIL', 'REVIEW')),
  CONSTRAINT "AgentEvaluation_category_check" CHECK ("category" IN ('LATENCY_GUARD', 'COST_GUARD', 'TENANT_ISOLATION', 'PROMPT_INJECTION', 'TOOL_USAGE', 'HUMAN_HANDOFF', 'BUSINESS_RULES'))
);
CREATE INDEX IF NOT EXISTS "AgentEvaluation_agentId_createdAt_idx" ON "AgentEvaluation" ("agentId", "createdAt");
CREATE INDEX IF NOT EXISTS "AgentEvaluation_executionId_idx" ON "AgentEvaluation" ("executionId");
CREATE INDEX IF NOT EXISTS "AgentEvaluation_runId_idx" ON "AgentEvaluation" ("runId");

CREATE TABLE IF NOT EXISTS "AgentLifecycleTransition" (
  "id" text PRIMARY KEY NOT NULL,
  "agentId" text NOT NULL REFERENCES "Agent"("id"),
  "fromStatus" text,
  "toStatus" text NOT NULL,
  "reason" text NOT NULL,
  "requestedBy" text NOT NULL,
  "approvedBy" text,
  "evaluationRunId" text,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "AgentLifecycleTransition_fromStatus_check" CHECK ("fromStatus" IS NULL OR "fromStatus" IN ('LAB', 'ALPHA', 'INTERNAL', 'PILOT', 'VALIDATED', 'PRODUCTION', 'ENTERPRISE')),
  CONSTRAINT "AgentLifecycleTransition_toStatus_check" CHECK ("toStatus" IN ('LAB', 'ALPHA', 'INTERNAL', 'PILOT', 'VALIDATED', 'PRODUCTION', 'ENTERPRISE'))
);
CREATE INDEX IF NOT EXISTS "AgentLifecycleTransition_agentId_createdAt_idx" ON "AgentLifecycleTransition" ("agentId", "createdAt");
