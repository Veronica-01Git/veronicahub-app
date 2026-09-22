CREATE TABLE IF NOT EXISTS "AffiliateProduct" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "category" text NOT NULL,
  "affiliateUrl" text NOT NULL,
  "priceLabel" text NOT NULL,
  "commissionLabel" text,
  "angle" text NOT NULL,
  "active" boolean DEFAULT true NOT NULL,
  "priority" integer DEFAULT 0 NOT NULL,
  "createdBy" text,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "AffiliateProduct_createdBy_User_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "AffiliateProduct_affiliateUrl_key" ON "AffiliateProduct" USING btree ("affiliateUrl");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "AffiliateProduct_active_priority_idx" ON "AffiliateProduct" USING btree ("active", "priority");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "AffiliateProduct_category_active_idx" ON "AffiliateProduct" USING btree ("category", "active");
