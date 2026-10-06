/**
 * Ligação do conector MCP com o mundo real: Neon (Drizzle), login por código
 * de e-mail, regra de admin e catálogo. Tudo aqui é reaproveitado do site —
 * este arquivo só adapta as funções existentes às portas de oauth.ts e
 * tools.ts.
 *
 * SEGREDOS (variáveis do Worker, nunca no repositório):
 *   MCP_OAUTH_SECRET   obrigatório, ≥ 32 caracteres — assina o client_id do
 *                      registro dinâmico. Trocar invalida os clientes já
 *                      registrados (o Claude registra de novo ao reconectar).
 *   MCP_PUBLIC_ORIGIN  opcional — origem pública (ex.: https://veronicahub.com)
 *                      usada nos metadados OAuth. Sem ela, a da requisição.
 * Também usa os que já existem: DATABASE_URL, RESEND_API_KEY, EMAIL_FROM,
 * ADMIN_EMAILS.
 */

import { and, count, eq, gt, isNull } from "drizzle-orm";
import { getDb } from "../db";
import { findAdminUser } from "../admin-core.server";
import { consumeEmailCodeCore, issueEmailCodeCore } from "../auth-server";
import {
  countAffiliateClicksCore,
  ensureAffiliateCatalogStorage,
  listAffiliateProductsCore,
  mapProduct,
  setProductActiveCore,
  updateProductMediaCore,
  upsertProduct,
} from "../affiliate-catalog-server";
import { agentExecutions, agents } from "../ai/schema";
import { agentDescription, agentName, registeredAgent } from "../ai/agent-registry";
import { HOUSE_TENANT } from "../ai/platform-types";
import { sanitizeEvent } from "../ai/observability";
import { membersAgentStatus } from "../../members/agent-runtime.server";
import { mcpOAuthGrants } from "./schema";
import type { Grant, GrantKind, OAuthStore } from "./oauth";
import { MCP_AGENT_SLUG, type ExecutionPort } from "./tools";
import type { McpDeps } from "./http";

const store: OAuthStore = {
  async insert(tokenHash, grant) {
    await getDb()
      .insert(mcpOAuthGrants)
      .values({ id: crypto.randomUUID(), tokenHash, ...grant });
  },
  async consume(tokenHash, kind, now) {
    // Um UPDATE condicional: duas trocas simultâneas do mesmo código não passam.
    const [row] = await getDb()
      .update(mcpOAuthGrants)
      .set({ consumedAt: now })
      .where(
        and(
          eq(mcpOAuthGrants.tokenHash, tokenHash),
          eq(mcpOAuthGrants.kind, kind),
          isNull(mcpOAuthGrants.consumedAt),
          isNull(mcpOAuthGrants.revokedAt),
          gt(mcpOAuthGrants.expiresAt, now),
        ),
      )
      .returning();
    return row ? toGrant(row) : null;
  },
  async findActive(tokenHash, kind, now) {
    const [row] = await getDb()
      .select()
      .from(mcpOAuthGrants)
      .where(
        and(
          eq(mcpOAuthGrants.tokenHash, tokenHash),
          eq(mcpOAuthGrants.kind, kind),
          isNull(mcpOAuthGrants.consumedAt),
          isNull(mcpOAuthGrants.revokedAt),
          gt(mcpOAuthGrants.expiresAt, now),
        ),
      )
      .limit(1);
    return row ? toGrant(row) : null;
  },
  async familyOf(tokenHash) {
    const [row] = await getDb()
      .select({ familyId: mcpOAuthGrants.familyId })
      .from(mcpOAuthGrants)
      .where(eq(mcpOAuthGrants.tokenHash, tokenHash))
      .limit(1);
    return row?.familyId ?? null;
  },
  async revokeKind(familyId, kind, now) {
    await getDb()
      .update(mcpOAuthGrants)
      .set({ revokedAt: now })
      .where(
        and(
          eq(mcpOAuthGrants.familyId, familyId),
          eq(mcpOAuthGrants.kind, kind),
          isNull(mcpOAuthGrants.revokedAt),
        ),
      );
  },
  async revokeFamily(familyId, now) {
    await getDb()
      .update(mcpOAuthGrants)
      .set({ revokedAt: now })
      .where(and(eq(mcpOAuthGrants.familyId, familyId), isNull(mcpOAuthGrants.revokedAt)));
  },
};

function toGrant(row: typeof mcpOAuthGrants.$inferSelect): Grant {
  return {
    kind: row.kind as GrantKind,
    userId: row.userId,
    clientId: row.clientId,
    familyId: row.familyId,
    scope: row.scope,
    expiresAt: row.expiresAt,
    codeChallenge: row.codeChallenge,
    redirectUri: row.redirectUri,
  };
}

/* --------------------------------------------------- AgentExecution */

let agentReady = false;

async function ensureMcpAgent(): Promise<void> {
  if (agentReady) return;
  const spec = registeredAgent(MCP_AGENT_SLUG);
  if (!spec) throw new Error("veronica-mcp fora do registro");
  await getDb()
    .insert(agents)
    .values({
      id: spec.slug,
      slug: spec.slug,
      name: agentName(spec),
      description: agentDescription(spec),
      version: spec.version,
      status: spec.status,
      autonomyLevel: spec.autonomyLevel,
      tenantScope: spec.tenantScope,
      maxCostPerTaskMicros: spec.maxCostPerTaskMicros,
      costCurrency: spec.costCurrency,
      maxLatencyMs: spec.maxLatencyMs,
      requiresApproval: spec.approval.requiresApproval,
    })
    .onConflictDoNothing();
  agentReady = true;
}

const executions: ExecutionPort = {
  async countSince(actorId, since) {
    const [row] = await getDb()
      .select({ n: count() })
      .from(agentExecutions)
      .where(
        and(
          eq(agentExecutions.agentId, MCP_AGENT_SLUG),
          eq(agentExecutions.approvedBy, actorId),
          gt(agentExecutions.queuedAt, since),
        ),
      );
    return Number(row?.n ?? 0);
  },
  async start({ toolKey, actorId }) {
    await ensureMcpAgent();
    const spec = registeredAgent(MCP_AGENT_SLUG)!;
    const id = crypto.randomUUID();
    await getDb()
      .insert(agentExecutions)
      .values({
        id,
        agentId: MCP_AGENT_SLUG,
        agentVersion: spec.version,
        tenantId: HOUSE_TENANT,
        trigger: "api",
        status: "RUNNING",
        requiresApproval: false,
        // Id interno do admin que pediu — nunca o e-mail.
        approvedBy: actorId,
        approvedAt: new Date(),
        // Nenhum modelo roda na conta da Veronica: custo zero é fato, não chute.
        estimatedCostMicros: 0,
        actualCostMicros: 0,
        toolsUsed: JSON.stringify([toolKey]),
        startedAt: new Date(),
      });
    return id;
  },
  async finish(id, result) {
    // Mesmo saneamento dos eventos de agente: descarta chave com cara de
    // segredo/conteúdo e mascara e-mail, telefone e credencial.
    const clean = sanitizeEvent({
      timestamp: new Date().toISOString(),
      agentSlug: MCP_AGENT_SLUG,
      tenantId: HOUSE_TENANT,
      executionId: id,
      event: "tool.call",
      metadata: result.metadata,
    }).metadata;
    await getDb()
      .update(agentExecutions)
      .set({
        status: result.status,
        finishedAt: new Date(),
        durationMs: result.durationMs,
        errorCode: result.errorCode,
        errorMessage: result.errorCode
          ? "Ferramenta MCP recusou ou falhou; detalhe devolvido só ao Claude."
          : null,
        resultMetadata: JSON.stringify(clean ?? {}),
      })
      .where(and(eq(agentExecutions.id, id), eq(agentExecutions.status, "RUNNING")));
  },
};

/* ------------------------------------------------------------ deps */

export function getMcpDeps(): McpDeps | null {
  const secret = process.env.MCP_OAUTH_SECRET;
  if (!secret || secret.length < 32) return null;
  return {
    secret,
    publicOrigin: process.env.MCP_PUBLIC_ORIGIN || undefined,
    store,
    findAdminByEmail: (email) => findAdminUser({ email }),
    findAdminById: (id) => findAdminUser({ id }),
    sendLoginCode: (email) => issueEmailCodeCore(email),
    consumeLoginCode: (email, code) => consumeEmailCodeCore(email, code),
    tools: {
      catalog: {
        list: () => listAffiliateProductsCore(),
        async save(input, adminId) {
          await ensureAffiliateCatalogStorage();
          return mapProduct(await upsertProduct(input, adminId));
        },
        updateMedia: (id, coverUrl, galleryUrls) =>
          updateProductMediaCore(id, coverUrl, galleryUrls),
        setActive: (id, active) => setProductActiveCore(id, active),
        clicks: (opts) => countAffiliateClicksCore(opts),
      },
      executions,
      membersStatus: () => membersAgentStatus(),
    },
  };
}
