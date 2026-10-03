/**
 * Tokens do conector MCP. Migração: drizzle/0021_mcp_oauth.sql, escrita à mão
 * como as 0012–0020. Re-exportado por src/lib/schema.ts.
 *
 * Uma linha por token emitido — código de autorização, acesso ou refresh —,
 * identificada pelo SHA-256 do token (o token em claro nunca é gravado).
 * `familyId` amarra tudo o que nasceu de uma mesma autorização: revogar é um
 * UPDATE na família. Linha não é apagada: revogada ou vencida, vira histórico.
 */

import { sql } from "drizzle-orm";
import { check, index, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { users } from "../schema";

export const mcpOAuthGrants = pgTable(
  "McpOAuthGrant",
  {
    id: text("id").primaryKey(),
    tokenHash: text("tokenHash").notNull(),
    kind: text("kind").notNull(),
    userId: text("userId")
      .notNull()
      .references(() => users.id),
    clientId: text("clientId").notNull(),
    familyId: text("familyId").notNull(),
    scope: text("scope").notNull(),
    codeChallenge: text("codeChallenge"),
    redirectUri: text("redirectUri"),
    expiresAt: timestamp("expiresAt").notNull(),
    consumedAt: timestamp("consumedAt"),
    revokedAt: timestamp("revokedAt"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("McpOAuthGrant_tokenHash_key").on(t.tokenHash),
    index("McpOAuthGrant_familyId_idx").on(t.familyId),
    index("McpOAuthGrant_userId_createdAt_idx").on(t.userId, t.createdAt),
    check("McpOAuthGrant_kind_check", sql`"kind" IN ('code','access','refresh')`),
  ],
);
