-- Apply on the same Neon branch used by DATABASE_URL before publishing server code.
-- One row per account is the atomic free-generation reservation.
CREATE TABLE IF NOT EXISTS "PortfolioGeneration" (
  "id" text PRIMARY KEY NOT NULL,
  "userId" text NOT NULL UNIQUE REFERENCES "User"("id"),
  "status" text NOT NULL CHECK ("status" IN ('pending', 'complete', 'failed')),
  "attempts" integer DEFAULT 1 NOT NULL,
  "briefJson" text NOT NULL,
  "draftJson" text,
  "model" text NOT NULL,
  "promptTokens" integer,
  "completionTokens" integer,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL,
  "completedAt" timestamp
);
CREATE INDEX IF NOT EXISTS "PortfolioGeneration_status_updatedAt_idx"
  ON "PortfolioGeneration" ("status", "updatedAt");
