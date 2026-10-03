-- 0021 — Conector MCP "Veronica" (fase 1): tokens OAuth do Claude.
-- Schema em src/lib/mcp/schema.ts; uso em src/lib/mcp/oauth.ts.
--
-- ADITIVA: só CREATE TABLE / CREATE INDEX, tudo IF NOT EXISTS. Nenhum DROP,
-- nenhum ALTER em tabela existente. Pode rodar duas vezes sem efeito.
--
-- ESCRITA À MÃO, como as 0012–0020 (o _journal.json do drizzle-kit parou na
-- 0011). Testar numa branch do Neon antes; aplicar em produção só com aviso
-- ao dono. Sem esta tabela, /mcp e /oauth/* respondem erro e nada mais muda.
--
-- Uma linha por token emitido (código, acesso, refresh). Guarda o SHA-256 do
-- token, nunca o token. Revogação = "revokedAt" na família inteira.

CREATE TABLE IF NOT EXISTS "McpOAuthGrant" (
  "id" text PRIMARY KEY NOT NULL,
  "tokenHash" text NOT NULL,
  "kind" text NOT NULL CHECK ("kind" IN ('code','access','refresh')),
  "userId" text NOT NULL REFERENCES "User"("id"),
  "clientId" text NOT NULL,
  "familyId" text NOT NULL,
  "scope" text NOT NULL,
  "codeChallenge" text,
  "redirectUri" text,
  "expiresAt" timestamp NOT NULL,
  "consumedAt" timestamp,
  "revokedAt" timestamp,
  "createdAt" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "McpOAuthGrant_tokenHash_key" ON "McpOAuthGrant" ("tokenHash");
CREATE INDEX IF NOT EXISTS "McpOAuthGrant_familyId_idx" ON "McpOAuthGrant" ("familyId");
CREATE INDEX IF NOT EXISTS "McpOAuthGrant_userId_createdAt_idx" ON "McpOAuthGrant" ("userId", "createdAt");
