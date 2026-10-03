-- Aditiva: não altera usuários, posts nem moderação existentes.
CREATE TABLE "MemberAgentSettings" (
  "id" text PRIMARY KEY DEFAULT 'members-community',
  "enabled" boolean NOT NULL DEFAULT true,
  "updatedAt" timestamp NOT NULL DEFAULT now()
);
INSERT INTO "MemberAgentSettings" ("id") VALUES ('members-community');
CREATE TABLE "MemberAgentBudget" (
  "day" text PRIMARY KEY,
  "calls" integer NOT NULL DEFAULT 0 CHECK ("calls" BETWEEN 0 AND 18)
);
CREATE TABLE "MemberAgentTask" (
  "key" text PRIMARY KEY,
  "executionId" text NOT NULL REFERENCES "AgentExecution"("id"),
  "kind" text NOT NULL CHECK ("kind" IN ('editorial','reply')),
  "status" text NOT NULL CHECK ("status" IN ('RUNNING','SUCCEEDED','FAILED','REVIEW')),
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "finishedAt" timestamp,
  "postId" text REFERENCES "MemberPost"("id")
);
CREATE INDEX "MemberAgentTask_created_idx" ON "MemberAgentTask" ("createdAt");
CREATE TABLE "MemberAgentReply" (
  "id" text PRIMARY KEY,
  "commentId" text NOT NULL UNIQUE REFERENCES "MemberComment"("id") ON DELETE CASCADE,
  "postId" text NOT NULL REFERENCES "MemberPost"("id") ON DELETE CASCADE,
  "body" text NOT NULL,
  "executionId" text NOT NULL REFERENCES "AgentExecution"("id"),
  "createdAt" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX "MemberAgentReply_post_idx" ON "MemberAgentReply" ("postId");
