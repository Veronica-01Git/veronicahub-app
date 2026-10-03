import { sql } from "drizzle-orm";
import { agentExecutions } from "../lib/ai/schema";
import { pgTable, text, timestamp, index, boolean, integer, check } from "drizzle-orm/pg-core";
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

export const memberAgentSettings = pgTable("MemberAgentSettings", {
  id: text("id").primaryKey().default("members-community"),
  enabled: boolean("enabled").notNull().default(true),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});
export const memberAgentBudget = pgTable(
  "MemberAgentBudget",
  {
    day: text("day").primaryKey(),
    calls: integer("calls").notNull().default(0),
  },
  () => [check("MemberAgentBudget_calls_check", sql`calls BETWEEN 0 AND 18`)],
);
export const memberAgentTasks = pgTable(
  "MemberAgentTask",
  {
    key: text("key").primaryKey(),
    executionId: text("executionId")
      .notNull()
      .references(() => agentExecutions.id),
    kind: text("kind").notNull(),
    status: text("status").notNull(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    finishedAt: timestamp("finishedAt"),
    postId: text("postId").references(() => memberPosts.id),
  },
  (t) => [
    index("MemberAgentTask_created_idx").on(t.createdAt),
    check("MemberAgentTask_kind_check", sql`kind IN ('editorial','reply')`),
    check("MemberAgentTask_status_check", sql`status IN ('RUNNING','SUCCEEDED','FAILED','REVIEW')`),
  ],
);
export const memberAgentReplies = pgTable(
  "MemberAgentReply",
  {
    id: text("id").primaryKey(),
    commentId: text("commentId")
      .notNull()
      .unique()
      .references(() => memberComments.id, { onDelete: "cascade" }),
    postId: text("postId")
      .notNull()
      .references(() => memberPosts.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    executionId: text("executionId")
      .notNull()
      .references(() => agentExecutions.id),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (t) => [index("MemberAgentReply_post_idx").on(t.postId)],
);
