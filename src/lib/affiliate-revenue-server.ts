import { createServerFn } from "@tanstack/react-start";
import { and, count, desc, eq, gte, lt, sql } from "drizzle-orm";
import { requireAdmin } from "./admin-server";
import { ensureCommissionStorage } from "./affiliate-commission-server";
import { analyticsStartDate, validateAnalyticsPeriod } from "./affiliate-analytics";
import { getDb } from "./db";
import { affiliateSales, affiliateLinkClicks } from "./schema";

/** Financial totals are private, aggregated over the full period, without row limits. */
export const getHubAffiliateRevenue = createServerFn({ method: "GET" })
  .validator(validateAnalyticsPeriod)
  .handler(async ({ data }) => {
    if (!(await requireAdmin())) return { ok: false as const, reason: "restrito" as const };
    try {
      await ensureCommissionStorage();
      const db = getDb();
      const now = new Date();
      const since = analyticsStartDate(data.days, now);
      const scope = and(gte(affiliateSales.orderAt, since), lt(affiliateSales.orderAt, now));
      const [statuses, products, missingDates, lastImport, clickTotals] = await Promise.all([
        db
          .select({
            status: affiliateSales.status,
            orders: count(),
            commission: sql<string>`coalesce(sum(${affiliateSales.commissionCents}), 0)`,
            house: sql<string>`coalesce(sum(${affiliateSales.houseCents}), 0)`,
            distributor: sql<string>`coalesce(sum(${affiliateSales.affiliateCents}), 0)`,
          })
          .from(affiliateSales)
          .where(scope)
          .groupBy(affiliateSales.status),
        db
          .select({
            productId: affiliateSales.productId,
            orders: count(),
            house: sql<string>`coalesce(sum(${affiliateSales.houseCents}), 0)`,
          })
          .from(affiliateSales)
          .where(and(scope, eq(affiliateSales.status, "confirmed")))
          .groupBy(affiliateSales.productId)
          .orderBy(desc(sql`sum(${affiliateSales.houseCents})`)),
        db
          .select({ total: count() })
          .from(affiliateSales)
          .where(sql`${affiliateSales.orderAt} is null`),
        db
          .select({ at: sql<string | null>`max(${affiliateSales.importedAt})` })
          .from(affiliateSales),
        db
          .select({ total: count() })
          .from(affiliateLinkClicks)
          .where(
            and(gte(affiliateLinkClicks.clickedAt, since), lt(affiliateLinkClicks.clickedAt, now)),
          ),
      ]);
      const confirmed = statuses.find((r) => r.status === "confirmed");
      const pending = statuses.find((r) => r.status === "pending");
      const cancelled = statuses.find((r) => r.status === "cancelled");
      return {
        ok: true as const,
        days: data.days,
        confirmedHouseCents: Number(confirmed?.house ?? 0),
        confirmedCommissionCents: Number(confirmed?.commission ?? 0),
        distributorCents: Number(confirmed?.distributor ?? 0),
        confirmedOrders: Number(confirmed?.orders ?? 0),
        pendingHouseCents: Number(pending?.house ?? 0),
        cancelledHouseCents: Number(cancelled?.house ?? 0),
        clicks: Number(clickTotals[0]?.total ?? 0),
        missingDates: Number(missingDates[0]?.total ?? 0),
        lastImport: lastImport[0]?.at ?? null,
        products: products.map((r) => ({
          productId: r.productId,
          orders: Number(r.orders),
          houseCents: Number(r.house),
        })),
      };
    } catch (error) {
      console.error("Falha ao consultar receita de afiliados:", error);
      return { ok: false as const, reason: "indisponivel" as const };
    }
  });
