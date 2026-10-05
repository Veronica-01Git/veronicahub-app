import { index, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "../../lib/schema";
import type { Assessment, buildGuide } from "./guide";
import type { z } from "zod";
import type { workoutSchema } from "./guide";
export const wellnessJourneys = pgTable(
  "WellnessJourney",
  {
    id: text("id").primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => users.id),
    professional: text("professional").notNull(),
    assessment: jsonb("assessment").$type<Assessment>().notNull(),
    guide: jsonb("guide").$type<ReturnType<typeof buildGuide>>().notNull(),
    plan: jsonb("plan").$type<z.infer<typeof workoutSchema>>(),
    reviewerId: text("reviewerId").references(() => users.id),
    reviewedAt: timestamp("reviewedAt", { withTimezone: true }),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
    consentVersion: text("consentVersion").default("wellness-v1").notNull(),
  },
  (t) => [
    index("WellnessJourney_owner_idx").on(t.userId, t.professional, t.createdAt),
    index("WellnessJourney_professional_idx").on(t.professional, t.createdAt),
  ],
);
