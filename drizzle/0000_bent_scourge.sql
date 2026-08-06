CREATE TYPE "public"."TopUpStatus" AS ENUM('PENDENTE', 'PAGO', 'CANCELADO');--> statement-breakpoint
CREATE TABLE "EmailOtp" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"codeHash" text NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"consumedAt" timestamp,
	"attempts" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "LedgerEntry" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"deltaCents" integer NOT NULL,
	"reason" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "User" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"balanceCents" integer DEFAULT 0 NOT NULL,
	"freeVideoCredits" integer DEFAULT 1 NOT NULL,
	"freeImageCredits" integer DEFAULT 2 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "User_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "WalletTopUp" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"amountCents" integer NOT NULL,
	"status" "TopUpStatus" DEFAULT 'PENDENTE' NOT NULL,
	"gatewayPaymentId" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"paidAt" timestamp
);
--> statement-breakpoint
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "WalletTopUp" ADD CONSTRAINT "WalletTopUp_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "EmailOtp_email_createdAt_idx" ON "EmailOtp" USING btree ("email","createdAt");--> statement-breakpoint
CREATE INDEX "LedgerEntry_userId_createdAt_idx" ON "LedgerEntry" USING btree ("userId","createdAt");--> statement-breakpoint
CREATE INDEX "WalletTopUp_userId_status_idx" ON "WalletTopUp" USING btree ("userId","status");--> statement-breakpoint
CREATE INDEX "WalletTopUp_gatewayPaymentId_idx" ON "WalletTopUp" USING btree ("gatewayPaymentId");