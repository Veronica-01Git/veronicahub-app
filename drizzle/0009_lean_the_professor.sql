CREATE TABLE IF NOT EXISTS "AffiliateLinkClick" (
	"id" text PRIMARY KEY NOT NULL,
	"productId" text NOT NULL,
	"category" text NOT NULL,
	"affiliateHandle" text,
	"placement" text NOT NULL,
	"clickedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Affiliate" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"code" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "Affiliate_userId_unique" UNIQUE("userId"),
	CONSTRAINT "Affiliate_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "Affiliate" ADD CONSTRAINT "Affiliate_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "AffiliateLinkClick_clickedAt_idx" ON "AffiliateLinkClick" USING btree ("clickedAt");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "AffiliateLinkClick_productId_clickedAt_idx" ON "AffiliateLinkClick" USING btree ("productId","clickedAt");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "AffiliateLinkClick_handle_clickedAt_idx" ON "AffiliateLinkClick" USING btree ("affiliateHandle","clickedAt");--> statement-breakpoint
CREATE INDEX "Affiliate_code_idx" ON "Affiliate" USING btree ("code");