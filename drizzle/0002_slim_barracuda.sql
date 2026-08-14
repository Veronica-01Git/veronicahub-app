CREATE TYPE "public"."ArticleBeat" AS ENUM('ia', 'clima', 'economia', 'geopolitica', 'mercado');--> statement-breakpoint
CREATE TYPE "public"."ArticleStatus" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TABLE "Article" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"beat" "ArticleBeat" NOT NULL,
	"headline" text NOT NULL,
	"excerpt" text NOT NULL,
	"body" text NOT NULL,
	"desk" text NOT NULL,
	"coverImageUrl" text,
	"sourceUrls" text[] DEFAULT '{}' NOT NULL,
	"status" "ArticleStatus" DEFAULT 'draft' NOT NULL,
	"aiGenerated" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"publishedAt" timestamp,
	CONSTRAINT "Article_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE INDEX "Article_status_publishedAt_idx" ON "Article" USING btree ("status","publishedAt");--> statement-breakpoint
CREATE INDEX "Article_beat_idx" ON "Article" USING btree ("beat");
