CREATE TABLE IF NOT EXISTS "InstagramBeatGate" (
  "beat" text PRIMARY KEY NOT NULL,
  "lastPublishedAt" timestamp,
  "lastSlug" text,
  "claimId" text,
  "claimSlug" text,
  "claimUntil" timestamp,
  "needsReview" boolean DEFAULT false NOT NULL
);
