CREATE TABLE "MediaImage" (
	"id" text PRIMARY KEY NOT NULL,
	"filename" text NOT NULL,
	"mimeType" text NOT NULL,
	"sizeBytes" integer NOT NULL,
	"width" integer,
	"height" integer,
	"altText" text,
	"data" text NOT NULL,
	"uploadedBy" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "MediaImage" ADD CONSTRAINT "MediaImage_uploadedBy_User_id_fk" FOREIGN KEY ("uploadedBy") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "MediaImage_createdAt_idx" ON "MediaImage" USING btree ("createdAt");