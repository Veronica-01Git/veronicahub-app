CREATE TYPE "public"."WaAuthor" AS ENUM('cliente', 'ia', 'humano', 'sistema');--> statement-breakpoint
CREATE TYPE "public"."WaConversationStatus" AS ENUM('ia', 'aguardando_humano', 'resolvida');--> statement-breakpoint
CREATE TYPE "public"."WaDirection" AS ENUM('entrada', 'saida');--> statement-breakpoint
CREATE TABLE "WaConversation" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant" text DEFAULT 'express-entulho' NOT NULL,
	"waId" text NOT NULL,
	"profileName" text,
	"status" "WaConversationStatus" DEFAULT 'ia' NOT NULL,
	"lastInboundAt" timestamp,
	"lastMessageAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "WaMessage" (
	"id" text PRIMARY KEY NOT NULL,
	"conversationId" text NOT NULL,
	"providerId" text NOT NULL,
	"direction" "WaDirection" NOT NULL,
	"author" "WaAuthor" NOT NULL,
	"kind" text DEFAULT 'text' NOT NULL,
	"body" text,
	"raw" text,
	"occurredAt" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "WaMessage" ADD CONSTRAINT "WaMessage_conversationId_WaConversation_id_fk" FOREIGN KEY ("conversationId") REFERENCES "public"."WaConversation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "WaConversation_tenant_waId_key" ON "WaConversation" USING btree ("tenant","waId");--> statement-breakpoint
CREATE INDEX "WaConversation_status_idx" ON "WaConversation" USING btree ("status","lastInboundAt");--> statement-breakpoint
CREATE UNIQUE INDEX "WaMessage_providerId_key" ON "WaMessage" USING btree ("providerId");--> statement-breakpoint
CREATE INDEX "WaMessage_conversation_idx" ON "WaMessage" USING btree ("conversationId","occurredAt");