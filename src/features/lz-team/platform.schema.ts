import { index, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { users } from "@/lib/schema";

// Tenant is explicit so the fitness operation can be licensed to other coaches
// without sharing their rosters or community posts.
export const fitnessStudents = pgTable(
  "FitnessStudent",
  {
    id: text("id").primaryKey().$defaultFn(() => createId()),
    tenant: text("tenant").notNull(),
    fullName: text("fullName").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    status: text("status").notNull().default("active"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("FitnessStudent_tenant_email_key").on(t.tenant, t.email)],
);

export const fitnessLessons = pgTable(
  "FitnessLesson",
  {
    id: text("id").primaryKey().$defaultFn(() => createId()),
    tenant: text("tenant").notNull(),
    title: text("title").notNull(),
    summary: text("summary").notNull(),
    category: text("category").notNull(),
    videoUrl: text("videoUrl").notNull(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (t) => [index("FitnessLesson_tenant_created_idx").on(t.tenant, t.createdAt)],
);

export const fitnessPosts = pgTable(
  "FitnessPost",
  {
    id: text("id").primaryKey().$defaultFn(() => createId()),
    tenant: text("tenant").notNull(),
    authorId: text("authorId").notNull().references(() => users.id),
    authorName: text("authorName").notNull(),
    body: text("body").notNull(),
    // Small raster only, returned exclusively to enrolled users in the feed.
    imageData: text("imageData"),
    status: text("status").notNull().default("published"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (t) => [index("FitnessPost_tenant_status_created_idx").on(t.tenant, t.status, t.createdAt)],
);

export const fitnessAgentCases = pgTable(
  "FitnessAgentCase",
  {
    id: text("id").primaryKey().$defaultFn(() => createId()),
    tenant: text("tenant").notNull(),
    kind: text("kind").notNull(),
    situation: text("situation").notNull(),
    expectedAction: text("expectedAction").notNull(),
    createdBy: text("createdBy").notNull().references(() => users.id),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (t) => [index("FitnessAgentCase_tenant_created_idx").on(t.tenant, t.createdAt)],
);
