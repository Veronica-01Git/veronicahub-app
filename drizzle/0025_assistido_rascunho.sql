-- Atendimento Assistido da Express Entulho: desfecho de cada rascunho.
-- Só métrica. Sem texto do cliente, rascunho, resposta, telefone ou nome.
-- Aditiva e idempotente: não altera nem apaga nenhuma tabela existente.
CREATE TABLE IF NOT EXISTS "AssistidoRascunho" (
  "id" text PRIMARY KEY,
  "tenant" text NOT NULL DEFAULT 'express-entulho',
  "desfecho" text NOT NULL DEFAULT 'pendente'
    CHECK ("desfecho" IN ('pendente','copiado_igual','copiado_editado','descartado')),
  "escalou" boolean NOT NULL DEFAULT false,
  "motivo" text,
  "tamanhoRascunho" integer NOT NULL,
  "tamanhoFinal" integer,
  "semelhancaMil" integer CHECK ("semelhancaMil" BETWEEN 0 AND 1000),
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "decididoEm" timestamp
);
CREATE INDEX IF NOT EXISTS "AssistidoRascunho_tenant_createdAt_idx"
  ON "AssistidoRascunho" ("tenant", "createdAt");
