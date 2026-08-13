CREATE TYPE "public"."UserRole" AS ENUM('user', 'admin');--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "role" "UserRole" DEFAULT 'user' NOT NULL;