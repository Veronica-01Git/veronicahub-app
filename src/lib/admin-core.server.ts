import { desc, eq } from "drizzle-orm";
import { getDb } from "./db";
import { users, walletTopUps } from "./schema";
import { getSessionUserId } from "./session";

function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export async function requireAdminCore() {
  const userId = await getSessionUserId();
  if (!userId) return null;

  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return null;

  if (user.role !== "admin" && getAdminEmails().includes(user.email.toLowerCase())) {
    await db.update(users).set({ role: "admin" }).where(eq(users.id, user.id));
    return { ...user, role: "admin" as const };
  }

  return user.role === "admin" ? user : null;
}

export async function getAdminOverviewCore() {
  const admin = await requireAdminCore();
  if (!admin) {
    return { ok: false as const, error: "Acesso restrito." };
  }

  const db = getDb();
  const allUsers = await db.select().from(users).orderBy(desc(users.createdAt)).limit(200);
  const recentTopUps = await db
    .select()
    .from(walletTopUps)
    .orderBy(desc(walletTopUps.createdAt))
    .limit(50);

  return {
    ok: true as const,
    admin: { email: admin.email },
    users: allUsers.map((user) => ({
      id: user.id,
      email: user.email,
      role: user.role,
      balanceCents: user.balanceCents,
      freeVideoCredits: user.freeVideoCredits,
      freeImageCredits: user.freeImageCredits,
      createdAt: user.createdAt.toISOString(),
    })),
    topUps: recentTopUps.map((topUp) => ({
      id: topUp.id,
      userId: topUp.userId,
      amountCents: topUp.amountCents,
      status: topUp.status,
      createdAt: topUp.createdAt.toISOString(),
      paidAt: topUp.paidAt ? topUp.paidAt.toISOString() : null,
    })),
  };
}
