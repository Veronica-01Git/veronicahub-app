import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";
import { requireAdmin } from "@/lib/admin-server";
import { users } from "@/lib/schema";
import { memberPosts, memberComments } from "./schema";
import { postInput, commentInput } from "./validation";
async function member() {
  const id = await getSessionUserId();
  if (!id) throw new Error("Entre na sua conta para continuar.");
  const [u] = await getDb().select({ id: users.id }).from(users).where(eq(users.id, id)).limit(1);
  if (!u) throw new Error("Sessão inválida.");
  return u.id;
}
async function admin() {
  const u = await requireAdmin();
  if (!u) throw new Error("Acesso restrito ao administrador.");
  return u;
}
export const memberFeed = createServerFn({ method: "GET" }).handler(async () => {
  const id = await getSessionUserId();
  if (!id) return { signedIn: false as const, admin: false, posts: [] };
  await member();
  const a = await requireAdmin();
  const posts = await getDb()
    .select()
    .from(memberPosts)
    .where(eq(memberPosts.status, "published"))
    .orderBy(desc(memberPosts.publishedAt))
    .limit(100);
  return { signedIn: true as const, admin: !!a, posts: posts.map(({ authorId: _, ...p }) => p) };
});
export const memberAdminFeed = createServerFn({ method: "GET" }).handler(async () => {
  await admin();
  return {
    posts: await getDb().select().from(memberPosts).orderBy(desc(memberPosts.createdAt)).limit(100),
    comments: await getDb()
      .select({
        id: memberComments.id,
        name: memberComments.name,
        body: memberComments.body,
        postId: memberComments.postId,
      })
      .from(memberComments)
      .where(eq(memberComments.status, "pending"))
      .orderBy(desc(memberComments.createdAt))
      .limit(100),
  };
});
export const saveMemberPost = createServerFn({ method: "POST" })
  .validator((v: unknown) => postInput.parse(v))
  .handler(async ({ data }) => {
    const a = await admin();
    const db = getDb();
    const { id, ...values } = data;
    if (id) {
      const [old] = await db.select().from(memberPosts).where(eq(memberPosts.id, id)).limit(1);
      if (!old) throw new Error("Publicação não encontrada.");
      await db
        .update(memberPosts)
        .set({
          ...values,
          publishedAt: data.status === "published" ? (old.publishedAt ?? new Date()) : null,
        })
        .where(eq(memberPosts.id, id));
    } else
      await db.insert(memberPosts).values({
        ...values,
        id: crypto.randomUUID(),
        authorId: a.id,
        publishedAt: data.status === "published" ? new Date() : null,
      });
    return { ok: true };
  });
export const readMemberComments = createServerFn({ method: "GET" })
  .validator((v: unknown) => z.string().uuid().parse(v))
  .handler(async ({ data }) => {
    await member();
    const db = getDb();
    const [p] = await db
      .select({ id: memberPosts.id })
      .from(memberPosts)
      .where(and(eq(memberPosts.id, data), eq(memberPosts.status, "published")))
      .limit(1);
    if (!p) throw new Error("Publicação indisponível.");
    return db
      .select({
        id: memberComments.id,
        name: memberComments.name,
        body: memberComments.body,
        createdAt: memberComments.createdAt,
      })
      .from(memberComments)
      .where(and(eq(memberComments.postId, data), eq(memberComments.status, "approved")))
      .orderBy(desc(memberComments.createdAt))
      .limit(100);
  });
export const addMemberComment = createServerFn({ method: "POST" })
  .validator((v: unknown) => commentInput.parse(v))
  .handler(async ({ data }) => {
    const userId = await member();
    const db = getDb();
    // Atomic cooldown claim; concurrent requests cannot both claim the same member.
    const result = await db.execute(sql`WITH allowed AS (
    INSERT INTO "MemberCommentCooldown" ("userId", "nextAllowedAt")
    SELECT ${userId}, now()+interval '30 seconds'
    WHERE EXISTS (SELECT 1 FROM "MemberPost" WHERE id=${data.postId} AND status='published')
    ON CONFLICT ("userId") DO UPDATE SET "nextAllowedAt"=excluded."nextAllowedAt"
    WHERE "MemberCommentCooldown"."nextAllowedAt"<=now() RETURNING "userId"
  ) INSERT INTO "MemberComment" (id,"postId","userId",name,body,status)
    SELECT ${crypto.randomUUID()},${data.postId},"userId",${data.name},${data.body},'pending'
    FROM allowed RETURNING id`);
    if (!result.rows.length)
      throw new Error("Aguarde 30 segundos ou confira se a publicação continua disponível.");
    return { ok: true };
  });
export const moderateMemberComment = createServerFn({ method: "POST" })
  .validator((v: unknown) =>
    z.object({ id: z.string().uuid(), status: z.enum(["approved", "rejected"]) }).parse(v),
  )
  .handler(async ({ data }) => {
    await admin();
    await getDb()
      .update(memberComments)
      .set({ status: data.status })
      .where(eq(memberComments.id, data.id));
    return { ok: true };
  });
