import { createServerFn } from "@tanstack/react-start";
import { desc, eq } from "drizzle-orm";
import { getDb } from "./db";
import { users, walletTopUps, generations } from "./schema";
import { getSessionUserId } from "./session";

// Painel admin simples — sem tabela/rota nova de permissões, só um e-mail
// autorizado (ADMIN_EMAILS, variável de ambiente, nunca no código) que
// promove o próprio usuário a role "admin" no primeiro acesso ao painel.
// Não depende de auth-server.ts nem wallet-server.ts — consulta o banco
// direto, só leitura (exceto a promoção pontual de role, abaixo).
function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export async function requireAdmin() {
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

export const getAdminOverview = createServerFn({ method: "GET" }).handler(async () => {
  const admin = await requireAdmin();
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

  // Monitoramento de margem (ARQUITETURA-STUDIO.md § 4.6): preço cobrado do
  // usuário ao lado do que a Higgsfield reportou ter consumido, quando
  // reporta (costCreditsUsed pode vir null — ver src/lib/higgsfield.ts).
  const recentGenerations = await db
    .select()
    .from(generations)
    .orderBy(desc(generations.createdAt))
    .limit(50);

  return {
    ok: true as const,
    admin: { email: admin.email },
    generations: recentGenerations.map((g) => ({
      id: g.id,
      userId: g.userId,
      provider: g.provider,
      status: g.status,
      priceCents: g.priceCents,
      costCreditsUsed: g.costCreditsUsed,
      createdAt: g.createdAt.toISOString(),
    })),
    users: allUsers.map((u) => ({
      id: u.id,
      email: u.email,
      role: u.role,
      balanceCents: u.balanceCents,
      freeVideoCredits: u.freeVideoCredits,
      freeImageCredits: u.freeImageCredits,
      createdAt: u.createdAt.toISOString(),
    })),
    topUps: recentTopUps.map((t) => ({
      id: t.id,
      userId: t.userId,
      amountCents: t.amountCents,
      status: t.status,
      createdAt: t.createdAt.toISOString(),
      paidAt: t.paidAt ? t.paidAt.toISOString() : null,
    })),
  };
});
