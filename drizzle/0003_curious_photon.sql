CREATE TYPE "public"."LibraryImageSource" AS ENUM('cron', 'manual');--> statement-breakpoint
CREATE TABLE "LibraryImage" (
	"id" text PRIMARY KEY NOT NULL,
	"beat" "ArticleBeat" NOT NULL,
	"imageUrl" text NOT NULL,
	"prompt" text NOT NULL,
	"source" "LibraryImageSource" DEFAULT 'manual' NOT NULL,
	"usedByArticleId" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "LibraryImage" ADD CONSTRAINT "LibraryImage_usedByArticleId_Article_id_fk" FOREIGN KEY ("usedByArticleId") REFERENCES "public"."Article"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "LibraryImage_beat_usedByArticleId_idx" ON "LibraryImage" USING btree ("beat","usedByArticleId");
