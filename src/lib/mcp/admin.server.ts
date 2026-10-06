/**
 * Leitura e corte do conector MCP para o painel /admin/conector-mcp.
 *
 * Só metadado: ferramenta, status, código de erro, duração e datas. O painel
 * não mostra e-mail, token, hash de token nem link de afiliado — e não
 * precisa: quem vê o painel já é a admin.
 */

import { and, count, desc, eq, gt, isNull } from "drizzle-orm";
import { getDb } from "../db";
import { agentExecutions } from "../ai/schema";
import { mcpOAuthGrants } from "./schema";
import { MCP_AGENT_SLUG } from "./tools";

function toolOf(resultMetadata: string | null): string {
  try {
    const tool = (JSON.parse(resultMetadata ?? "{}") as { tool?: unknown }).tool;
    return typeof tool === "string" ? tool : "—";
  } catch {
    return "—";
  }
}

export async function mcpPanelCore() {
  const db = getDb();
  const now = new Date();
  const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const [rows, [ultimas24h], [falhas24h], conexoes] = await Promise.all([
    db
      .select({
        id: agentExecutions.id,
        status: agentExecutions.status,
        errorCode: agentExecutions.errorCode,
        durationMs: agentExecutions.durationMs,
        queuedAt: agentExecutions.queuedAt,
        resultMetadata: agentExecutions.resultMetadata,
      })
      .from(agentExecutions)
      .where(eq(agentExecutions.agentId, MCP_AGENT_SLUG))
      .orderBy(desc(agentExecutions.queuedAt))
      .limit(50),
    db
      .select({ n: count() })
      .from(agentExecutions)
      .where(
        and(eq(agentExecutions.agentId, MCP_AGENT_SLUG), gt(agentExecutions.queuedAt, since24h)),
      ),
    db
      .select({ n: count() })
      .from(agentExecutions)
      .where(
        and(
          eq(agentExecutions.agentId, MCP_AGENT_SLUG),
          gt(agentExecutions.queuedAt, since24h),
          eq(agentExecutions.status, "FAILED"),
        ),
      ),
    // Conexão ativa = refresh token vivo (não usado, não revogado, não vencido).
    db
      .select({ createdAt: mcpOAuthGrants.createdAt, expiresAt: mcpOAuthGrants.expiresAt })
      .from(mcpOAuthGrants)
      .where(
        and(
          eq(mcpOAuthGrants.kind, "refresh"),
          isNull(mcpOAuthGrants.consumedAt),
          isNull(mcpOAuthGrants.revokedAt),
          gt(mcpOAuthGrants.expiresAt, now),
        ),
      )
      .orderBy(desc(mcpOAuthGrants.createdAt))
      .limit(20),
  ]);
  return {
    chamadas24h: Number(ultimas24h?.n ?? 0),
    falhas24h: Number(falhas24h?.n ?? 0),
    conexoes: conexoes.map((c) => ({
      renovadaEm: c.createdAt.toISOString(),
      expiraEm: c.expiresAt.toISOString(),
    })),
    execucoes: rows.map((r) => ({
      id: r.id,
      ferramenta: toolOf(r.resultMetadata),
      status: r.status,
      erro: r.errorCode,
      duracaoMs: r.durationMs,
      em: r.queuedAt.toISOString(),
    })),
  };
}

/** Revoga todo token ainda válido. O Claude terá de autorizar de novo. */
export async function revokeAllMcpGrantsCore(): Promise<number> {
  const rows = await getDb()
    .update(mcpOAuthGrants)
    .set({ revokedAt: new Date() })
    .where(isNull(mcpOAuthGrants.revokedAt))
    .returning({ id: mcpOAuthGrants.id });
  return rows.length;
}
