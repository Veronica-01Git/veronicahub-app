CREATE TABLE IF NOT EXISTS "AffiliateSale" (
	"id" text PRIMARY KEY NOT NULL,
	"externalOrderId" text NOT NULL,
	"affiliateCode" text NOT NULL,
	"productId" text,
	"commissionCents" integer NOT NULL,
	"affiliateCents" integer NOT NULL,
	"houseCents" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"orderAt" timestamp,
	"importedAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"paidAt" timestamp,
	"paymentReference" text,
	CONSTRAINT "AffiliateSale_externalOrderId_unique" UNIQUE("externalOrderId")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "AffiliateSale_code_status_idx" ON "AffiliateSale" USING btree ("affiliateCode", "status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "AffiliateSale_status_paidAt_idx" ON "AffiliateSale" USING btree ("status", "paidAt");
