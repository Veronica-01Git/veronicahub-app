CREATE TYPE "public"."AgenteAssinaturaStatus" AS ENUM('teste', 'ativa', 'expirada', 'cancelada');--> statement-breakpoint
CREATE TYPE "public"."AgenteBriefingFonte" AS ENUM('audio', 'conversa', 'texto', 'simulacao');--> statement-breakpoint
CREATE TYPE "public"."AgentePlano" AS ENUM('teste', 'avulso', 'mensal', 'anual');--> statement-breakpoint
CREATE TABLE "AgenteAssinatura" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"agenteId" text NOT NULL,
	"status" "AgenteAssinaturaStatus" DEFAULT 'teste' NOT NULL,
	"plano" "AgentePlano" DEFAULT 'teste' NOT NULL,
	"expiraEm" timestamp,
	"topUpId" text,
	"criadoEm" timestamp DEFAULT now() NOT NULL,
	"atualizadoEm" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "AgenteBriefing" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"agenteId" text NOT NULL,
	"fonte" "AgenteBriefingFonte" NOT NULL,
	"conteudo" text NOT NULL,
	"extraido" text,
	"conferido" boolean DEFAULT false NOT NULL,
	"criadoEm" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "AgenteAssinatura" ADD CONSTRAINT "AgenteAssinatura_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "AgenteAssinatura" ADD CONSTRAINT "AgenteAssinatura_topUpId_WalletTopUp_id_fk" FOREIGN KEY ("topUpId") REFERENCES "public"."WalletTopUp"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "AgenteBriefing" ADD CONSTRAINT "AgenteBriefing_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "AgenteAssinatura_userId_agenteId_key" ON "AgenteAssinatura" USING btree ("userId","agenteId");--> statement-breakpoint
CREATE INDEX "AgenteAssinatura_status_expiraEm_idx" ON "AgenteAssinatura" USING btree ("status","expiraEm");--> statement-breakpoint
CREATE INDEX "AgenteBriefing_userId_agenteId_idx" ON "AgenteBriefing" USING btree ("userId","agenteId");