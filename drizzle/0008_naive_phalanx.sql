CREATE TABLE "WireOfferClick" (
	"id" text PRIMARY KEY NOT NULL,
	"articleId" text NOT NULL,
	"beat" "ArticleBeat" NOT NULL,
	"offerId" text NOT NULL,
	"placement" text NOT NULL,
	"clickedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "WireOfferClick" ADD CONSTRAINT "WireOfferClick_articleId_Article_id_fk" FOREIGN KEY ("articleId") REFERENCES "public"."Article"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "WireOfferClick_clickedAt_idx" ON "WireOfferClick" USING btree ("clickedAt");--> statement-breakpoint
CREATE INDEX "WireOfferClick_offerId_clickedAt_idx" ON "WireOfferClick" USING btree ("offerId","clickedAt");