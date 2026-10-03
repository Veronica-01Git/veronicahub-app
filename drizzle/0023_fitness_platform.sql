-- First tenant of the reusable fitness operation. No students or paid access
-- are fabricated by this migration.
CREATE TABLE "FitnessStudent" (
  "id" text PRIMARY KEY,
  "tenant" text NOT NULL,
  "fullName" text NOT NULL,
  "email" text NOT NULL,
  "phone" text NOT NULL,
  "status" text NOT NULL DEFAULT 'active' CHECK ("status" IN ('active','inactive')),
  "createdAt" timestamp NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "FitnessStudent_tenant_email_key" ON "FitnessStudent" ("tenant", "email");

CREATE TABLE "FitnessLesson" (
  "id" text PRIMARY KEY,
  "tenant" text NOT NULL,
  "title" text NOT NULL,
  "summary" text NOT NULL,
  "category" text NOT NULL CHECK ("category" IN ('treino','cardio','habitos')),
  "videoUrl" text NOT NULL,
  "createdAt" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX "FitnessLesson_tenant_created_idx" ON "FitnessLesson" ("tenant", "createdAt");

CREATE TABLE "FitnessPost" (
  "id" text PRIMARY KEY,
  "tenant" text NOT NULL,
  "authorId" text NOT NULL REFERENCES "User"("id"),
  "authorName" text NOT NULL,
  "body" text NOT NULL,
  "imageData" text,
  "status" text NOT NULL DEFAULT 'published' CHECK ("status" IN ('published','hidden')),
  "createdAt" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX "FitnessPost_tenant_status_created_idx" ON "FitnessPost" ("tenant", "status", "createdAt");

CREATE TABLE "FitnessAgentCase" (
  "id" text PRIMARY KEY,
  "tenant" text NOT NULL,
  "kind" text NOT NULL CHECK ("kind" IN ('conteudo','alunos','seguranca')),
  "situation" text NOT NULL,
  "expectedAction" text NOT NULL,
  "createdBy" text NOT NULL REFERENCES "User"("id"),
  "createdAt" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX "FitnessAgentCase_tenant_created_idx" ON "FitnessAgentCase" ("tenant", "createdAt");
