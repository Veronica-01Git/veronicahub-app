CREATE TABLE IF NOT EXISTS "CommercialBrief" (
 id text PRIMARY KEY, "userId" text NOT NULL REFERENCES "User"(id), "requestId" text NOT NULL,
 "dayKey" text NOT NULL, company text NOT NULL, challenge text NOT NULL, service text NOT NULL CHECK(service IN ('commercial','content','website','community','commerce','specialist')),
 volume text NOT NULL, systems text NOT NULL, goal text NOT NULL,
 state text NOT NULL DEFAULT 'received' CHECK(state IN ('received','reviewed','approved','won','lost')),
 analysis text NOT NULL, "modelState" text NOT NULL DEFAULT 'pending' CHECK("modelState" IN ('pending','running','complete','fallback')),
 provider text, model text, "setupCents" integer NOT NULL DEFAULT 0 CHECK("setupCents">=0),
 "monthlyCents" integer NOT NULL DEFAULT 0 CHECK("monthlyCents">=0), scope text NOT NULL DEFAULT '',
 "createdAt" timestamptz NOT NULL DEFAULT now(), "updatedAt" timestamptz NOT NULL DEFAULT now(),
 UNIQUE("userId","requestId"), UNIQUE("userId","dayKey")
);
CREATE INDEX IF NOT EXISTS "CommercialBrief_state_created_idx" ON "CommercialBrief"(state,"createdAt");
CREATE TABLE IF NOT EXISTS "CommercialDecision" (
 id text PRIMARY KEY, "briefId" text NOT NULL REFERENCES "CommercialBrief"(id), "adminId" text NOT NULL REFERENCES "User"(id),
 "fromState" text NOT NULL, "toState" text NOT NULL, "setupCents" integer NOT NULL, "monthlyCents" integer NOT NULL,
 scope text NOT NULL, note text NOT NULL, "createdAt" timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS "GuardianSnapshot" (id text PRIMARY KEY, result text NOT NULL, "createdAt" timestamptz NOT NULL DEFAULT now());
