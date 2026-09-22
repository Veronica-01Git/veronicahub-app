ALTER TABLE "AffiliateProduct" ADD COLUMN IF NOT EXISTS "coverUrl" text;
--> statement-breakpoint
ALTER TABLE "AffiliateProduct" ADD COLUMN IF NOT EXISTS "videoUrl" text;
--> statement-breakpoint
ALTER TABLE "AffiliateProduct" ADD COLUMN IF NOT EXISTS "audience" text DEFAULT 'unissex' NOT NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "AffiliateProduct_audience_active_idx" ON "AffiliateProduct" USING btree ("audience", "active");
