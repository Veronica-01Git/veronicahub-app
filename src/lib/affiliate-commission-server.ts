import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq, isNull, sql, sum } from "drizzle-orm";
import { requireAdmin } from "./admin-server";
import { parseAffiliateSalesReport } from "./affiliate-commission";
import { splitCommissionCents } from "./affiliate-products";
import { getDb } from "./db";
import { getSessionUserId } from "./session";
import { affiliateSales, affiliates, users } from "./schema";

let commissionStorageReady = false;

async function ensureCommissionStorage() {
  if (commissionStorageReady) return;
  const db = getDb();
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "AffiliateSale" (
      "id" text PRIMARY KEY NOT NULL,
      "externalOrderId" text NOT NULL UNIQUE,
      "affiliateCode" text NOT NULL,
      "productId" text,
      "commissionCents" integer NOT NULL,
      "affiliateCents" integer NOT NULL,
      "houseCents" integer NOT NULL,
      "status" text DEFAULT 'pending' NOT NULL,
      "orderAt" timestamp,
      "importedAt" timestamp DEFAULT now() NOT NULL,
      "updatedAt" timestamp DEFAULT now() NOT NULL,
      "paidAt" timestamp,
      "paymentReference" text
    )
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "AffiliateSale_code_status_idx"
    ON "AffiliateSale" ("affiliateCode", "status")
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "AffiliateSale_status_paidAt_idx"
    ON "AffiliateSale" ("status", "paidAt")
  `);
  commissionStorageReady = true;
}

function importValidator(input: unknown) {
  const raw = (input as { raw?: unknown })?.raw;
  if (typeof raw !== "string" || !raw.trim()) throw new Error("Cole o relatório da Shopee.");
  return { rows: parseAffiliateSalesReport(raw) };
}

export const importAffiliateSalesAdmin = createServerFn({ method: "POST" })
  .validator(importValidator)
  .handler(async ({ data }) => {
    const admin = await requireAdmin();
    if (!admin) return { ok: false as const, error: "Acesso restrito." };
    await ensureCommissionStorage();
    const db = getDb();
    const codes = new Set(
      (await db.select({ code: affiliates.code }).from(affiliates)).map((item) => item.code),
    );
    let imported = 0;
    const errors: string[] = [];

    for (const row of data.rows) {
      if (!codes.has(row.affiliateCode)) {
        errors.push(
          `${row.externalOrderId}: Sub_id ${row.affiliateCode} não pertence a um divulgador.`,
        );
        continue;
      }
      const [existing] = await db
        .select({ paidAt: affiliateSales.paidAt })
        .from(affiliateSales)
        .where(eq(affiliateSales.externalOrderId, row.externalOrderId))
        .limit(1);
      if (existing?.paidAt) {
        errors.push(`${row.externalOrderId}: pagamento já baixado; linha preservada.`);
        continue;
      }
      const split = splitCommissionCents(row.commissionCents);
      await db
        .insert(affiliateSales)
        .values({
          ...row,
          ...split,
          affiliateCents: split.affiliateCents,
          houseCents: split.houseCents,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: affiliateSales.externalOrderId,
          set: {
            affiliateCode: row.affiliateCode,
            productId: row.productId,
            commissionCents: row.commissionCents,
            affiliateCents: split.affiliateCents,
            houseCents: split.houseCents,
            status: row.status,
            orderAt: row.orderAt,
            updatedAt: new Date(),
          },
        });
      imported += 1;
    }
    return { ok: errors.length === 0, imported, errors };
  });

export const getMyAffiliateCommissions = createServerFn({ method: "GET" }).handler(async () => {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false as const, reason: "anonimo" as const };
  await ensureCommissionStorage();
  const db = getDb();
  const [affiliate] = await db
    .select({ code: affiliates.code })
    .from(affiliates)
    .where(eq(affiliates.userId, userId))
    .limit(1);
  if (!affiliate)
    return {
      ok: true as const,
      code: null,
      pendingCents: 0,
      availableCents: 0,
      paidCents: 0,
      sales: [],
    };
  const rows = await db
    .select()
    .from(affiliateSales)
    .where(eq(affiliateSales.affiliateCode, affiliate.code))
    .orderBy(desc(affiliateSales.orderAt), desc(affiliateSales.importedAt))
    .limit(100);
  return {
    ok: true as const,
    code: affiliate.code,
    pendingCents: rows
      .filter((r) => r.status === "pending")
      .reduce((total, r) => total + r.affiliateCents, 0),
    availableCents: rows
      .filter((r) => r.status === "confirmed" && !r.paidAt)
      .reduce((total, r) => total + r.affiliateCents, 0),
    paidCents: rows
      .filter((r) => Boolean(r.paidAt))
      .reduce((total, r) => total + r.affiliateCents, 0),
    sales: rows.map((row) => ({
      ...row,
      orderAt: row.orderAt?.toISOString() ?? null,
      importedAt: row.importedAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      paidAt: row.paidAt?.toISOString() ?? null,
    })),
  };
});

export const listAffiliateSalesAdmin = createServerFn({ method: "GET" }).handler(async () => {
  const admin = await requireAdmin();
  if (!admin) return { ok: false as const, error: "Acesso restrito." };
  await ensureCommissionStorage();
  const db = getDb();
  const rows = await db
    .select({ sale: affiliateSales, email: users.email })
    .from(affiliateSales)
    .leftJoin(affiliates, eq(affiliates.code, affiliateSales.affiliateCode))
    .leftJoin(users, eq(users.id, affiliates.userId))
    .orderBy(desc(affiliateSales.importedAt))
    .limit(500);
  const [totals] = await db
    .select({
      commissionCents: sum(affiliateSales.commissionCents),
      affiliateCents: sum(affiliateSales.affiliateCents),
      houseCents: sum(affiliateSales.houseCents),
    })
    .from(affiliateSales)
    .where(and(eq(affiliateSales.status, "confirmed"), isNull(affiliateSales.paidAt)));
  return {
    ok: true as const,
    totals: {
      commissionCents: Number(totals?.commissionCents ?? 0),
      affiliateCents: Number(totals?.affiliateCents ?? 0),
      houseCents: Number(totals?.houseCents ?? 0),
    },
    sales: rows.map(({ sale, email }) => ({
      ...sale,
      email,
      orderAt: sale.orderAt?.toISOString() ?? null,
      importedAt: sale.importedAt.toISOString(),
      updatedAt: sale.updatedAt.toISOString(),
      paidAt: sale.paidAt?.toISOString() ?? null,
    })),
  };
});

function paymentValidator(input: unknown) {
  const data = input as { id?: unknown; paid?: unknown; reference?: unknown };
  if (typeof data.id !== "string" || !data.id || data.id.length > 120) {
    throw new Error("Venda obrigatória.");
  }
  if (typeof data.paid !== "boolean") throw new Error("Status de pagamento inválido.");
  const reference = typeof data.reference === "string" ? data.reference.trim().slice(0, 160) : "";
  if (data.paid && reference.length < 3) throw new Error("Informe a referência do pagamento.");
  return { id: data.id, paid: data.paid, reference };
}

export const setAffiliatePaymentAdmin = createServerFn({ method: "POST" })
  .validator(paymentValidator)
  .handler(async ({ data }) => {
    const admin = await requireAdmin();
    if (!admin) return { ok: false as const, error: "Acesso restrito." };
    await ensureCommissionStorage();
    const db = getDb();
    const [sale] = await db
      .select({ status: affiliateSales.status })
      .from(affiliateSales)
      .where(eq(affiliateSales.id, data.id))
      .limit(1);
    if (!sale) return { ok: false as const, error: "Venda não encontrada." };
    if (data.paid && sale.status !== "confirmed")
      return { ok: false as const, error: "Somente comissão confirmada pode ser paga." };
    await db
      .update(affiliateSales)
      .set({
        paidAt: data.paid ? new Date() : null,
        paymentReference: data.paid ? data.reference : null,
        updatedAt: new Date(),
      })
      .where(eq(affiliateSales.id, data.id));
    return { ok: true as const };
  });
