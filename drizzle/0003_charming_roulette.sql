CREATE TYPE "public"."GenerationStatus" AS ENUM('completed', 'failed', 'blocked');--> statement-breakpoint
CREATE TABLE "Generation" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"provider" text NOT NULL,
	"prompt" text NOT NULL,
	"status" "GenerationStatus" NOT NULL,
	"priceCents" integer NOT NULL,
	"costCreditsUsed" integer,
	"storageKey" text,
	"publicUrl" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "Generation" ADD CONSTRAINT "Generation_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "Generation_userId_createdAt_idx" ON "Generation" USING btree ("userId","createdAt");