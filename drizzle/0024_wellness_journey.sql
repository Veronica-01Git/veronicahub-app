CREATE TABLE IF NOT EXISTS "WellnessJourney" (
  "id" text PRIMARY KEY,
  "userId" text NOT NULL REFERENCES "User"("id"),
  "professional" text NOT NULL CHECK ("professional" IN ('lz-team','lee-ricardo')),
  "assessment" jsonb NOT NULL, "guide" jsonb NOT NULL,
  "plan" jsonb, "reviewerId" text REFERENCES "User"("id"),
  "reviewedAt" timestamptz, "createdAt" timestamptz NOT NULL DEFAULT now(),
  "consentVersion" text NOT NULL DEFAULT 'wellness-v1'
);
CREATE INDEX IF NOT EXISTS "WellnessJourney_owner_idx" ON "WellnessJourney" ("userId", "professional", "createdAt");
CREATE INDEX IF NOT EXISTS "WellnessJourney_professional_idx" ON "WellnessJourney" ("professional", "createdAt");
