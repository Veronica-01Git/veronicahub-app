CREATE TABLE "VeronicaMemory" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"skillId" text NOT NULL,
	"key" text NOT NULL,
	"value" text NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "VeronicaMemory" ADD CONSTRAINT "VeronicaMemory_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "VeronicaMemory_userId_idx" ON "VeronicaMemory" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "VeronicaMemory_userId_skillId_key_idx" ON "VeronicaMemory" USING btree ("userId","skillId","key");