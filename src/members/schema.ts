import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";
import { users } from "../lib/schema";
export const memberPosts = pgTable(
  "MemberPost",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    kind: text("kind").notNull(),
    prompt: text("prompt").notNull().default(""),
    mediaUrl: text("mediaUrl").notNull().default(""),
    status: text("status").notNull().default("draft"),
    authorId: text("authorId")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    publishedAt: timestamp("publishedAt"),
  },
  (t) => [index("MemberPost_status_published_idx").on(t.status, t.publishedAt)],
);
export const memberComments = pgTable(
  "MemberComment",
  {
    id: text("id").primaryKey(),
    postId: text("postId")
      .notNull()
      .references(() => memberPosts.id, { onDelete: "cascade" }),
    userId: text("userId")
      .notNull()
      .references(() => users.id),
    name: text("name").notNull(),
    body: text("body").notNull(),
    status: text("status").notNull().default("pending"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (t) => [index("MemberComment_post_status_idx").on(t.postId, t.status)],
);

export const memberCommentCooldown = pgTable("MemberCommentCooldown", {
  userId: text("userId")
    .primaryKey()
    .references(() => users.id),
  nextAllowedAt: timestamp("nextAllowedAt").notNull(),
});
