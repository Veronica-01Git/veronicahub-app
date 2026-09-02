ALTER TABLE "Article" ADD COLUMN "coverPhotoId" text;--> statement-breakpoint
ALTER TABLE "Article" ADD COLUMN "coverPhotoCredit" text;--> statement-breakpoint
ALTER TABLE "Article" ADD COLUMN "coverPhotoUrl" text;--> statement-breakpoint
ALTER TABLE "Article" ADD COLUMN "coverManual" boolean DEFAULT false NOT NULL;