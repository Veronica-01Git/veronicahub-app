import { createServerFn } from "@tanstack/react-start";
import { and, count, desc, eq, gte, lt, sql } from "drizzle-orm";
import { getDb } from "./db";
import { getSessionUserId } from "./session";
import { requireAdmin } from "./admin-server";
import { affiliates, affiliateLinkClicks } from "./schema";
import {
  analyticsStartDate,
  fillAnalyticsDays,
  validateAnalyticsPeriod,
} from "./affiliate-analytics";

/** Only the sealed session's affiliate code can select private telemetry. */
export const getMyAffiliateAnalytics = createServerFn({ method: "GET" })
  .validator(validateAnalyticsPeriod)
  .handler(async ({ data }) => {
    const userId = await getSessionUserId();
    if (!userId) return { ok: false as const, reason: "anonimo" as const };
    try {
      const db = getDb();
      const [affiliate] = await db
        .select({ code: affiliates.code })
        .from(affiliates)
        .where(eq(affiliates.userId, userId))
        .limit(1);
      if (!affiliate) return { ok: false as const, reason: "sem_conta" as const };
      const now = new Date();
      const since = analyticsStartDate(data.days, now);
      const scope = and(
        eq(affiliateLinkClicks.affiliateHandle, affiliate.code),
        gte(affiliateLinkClicks.clickedAt, since),
        lt(affiliateLinkClicks.clickedAt, now),
      );
      const date = sql<string>`to_char(${affiliateLinkClicks.clickedAt}, 'YYYY-MM-DD')`;
      const [products, daily, sources, admin] = await Promise.all([
        db
          .select({ productId: affiliateLinkClicks.productId, clicks: count() })
          .from(affiliateLinkClicks)
          .where(scope)
          .groupBy(affiliateLinkClicks.productId)
          .orderBy(desc(count())),
        db.select({ date, clicks: count() }).from(affiliateLinkClicks).where(scope).groupBy(date),
        db
          .select({ source: affiliateLinkClicks.placement, clicks: count() })
          .from(affiliateLinkClicks)
          .where(scope)
          .groupBy(affiliateLinkClicks.placement)
          .orderBy(desc(count())),
        requireAdmin(),
      ]);
      return {
        ok: true as const,
        days: data.days,
        total: products.reduce((sum, row) => sum + Number(row.clicks), 0),
        byProduct: products.map((row) => ({ ...row, clicks: Number(row.clicks) })),
        daily: fillAnalyticsDays(
          data.days,
          daily.map((row) => ({ ...row, clicks: Number(row.clicks) })),
          now,
        ),
        bySource: sources.map((row) => ({ ...row, clicks: Number(row.clicks) })),
        updatedAt: now.toISOString(),
        isAdmin: Boolean(admin),
      };
    } catch (error) {
      console.error("Falha ao consultar Analytics de afiliado:", error);
      // Unavailable telemetry is not a measured zero.
      return { ok: false as const, reason: "indisponivel" as const };
    }
  });
