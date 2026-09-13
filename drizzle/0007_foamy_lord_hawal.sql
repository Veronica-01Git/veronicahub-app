CREATE TABLE "SourceReferral" (
	"id" text PRIMARY KEY NOT NULL,
	"articleId" text NOT NULL,
	"beat" "ArticleBeat" NOT NULL,
	"sourceDomain" text NOT NULL,
	"destinationUrl" text NOT NULL,
	"clickedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "SourceReferral" ADD CONSTRAINT "SourceReferral_articleId_Article_id_fk" FOREIGN KEY ("articleId") REFERENCES "public"."Article"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "SourceReferral_clickedAt_idx" ON "SourceReferral" USING btree ("clickedAt");--> statement-breakpoint
CREATE INDEX "SourceReferral_sourceDomain_clickedAt_idx" ON "SourceReferral" USING btree ("sourceDomain","clickedAt");