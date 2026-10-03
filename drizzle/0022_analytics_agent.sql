-- Additive operation storage: no customer/financial data or client tables are modified.
CREATE TABLE IF NOT EXISTS "AnalyticsAgentSettings" (
 id text PRIMARY KEY,
 enabled boolean NOT NULL DEFAULT true
);
CREATE TABLE IF NOT EXISTS "AnalyticsAgentRun" (
 id text PRIMARY KEY,
 version text NOT NULL,
 status text NOT NULL,
 "startedAt" timestamp NOT NULL DEFAULT now(),
 "finishedAt" timestamp,
 "durationMs" integer,
 trigger text NOT NULL,
 lease text NOT NULL,
 "modelAttempted" boolean NOT NULL DEFAULT false,
 result text,
 "errorCode" text
);
INSERT INTO "AnalyticsAgentSettings" (id) VALUES ('analytics-commerce') ON CONFLICT DO NOTHING;

CREATE INDEX IF NOT EXISTS "AnalyticsAgentRun_version_startedAt_idx" ON "AnalyticsAgentRun" (version, "startedAt");
