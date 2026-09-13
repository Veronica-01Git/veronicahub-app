import { and, count, desc, eq, gte, sql } from "drizzle-orm";
import { createServerFn } from "@tanstack/react-start";
import { getDb } from "./db";
import { articles, wireOfferClicks } from "./schema";
import { WIRE_OFFERS } from "./wire-commerce";
import { requireAdmin } from "./admin-server";

const SITE_URL = "https://veronicahub.com";
const ALLOWED_PLACEMENTS = new Set(["article_end", "related"]);
let wireOfferStorageReady = false;

async function ensureWireOfferStorage() {
  if (wireOfferStorageReady) return;
  const db = getDb();
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "WireOfferClick" (
      "id" text PRIMARY KEY NOT NULL,
      "articleId" text NOT NULL REFERENCES "Article"("id") ON DELETE CASCADE,
      "beat" "ArticleBeat" NOT NULL,
      "offerId" text NOT NULL,
      "placement" text NOT NULL,
      "clickedAt" timestamp DEFAULT now() NOT NULL
    )
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "WireOfferClick_clickedAt_idx"
    ON "WireOfferClick" ("clickedAt")
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "WireOfferClick_offerId_clickedAt_idx"
    ON "WireOfferClick" ("offerId", "clickedAt")
  `);
  wireOfferStorageReady = true;
}

export async function handleWireOfferRedirect(request: Request): Promise<Response> {
  if (request.method !== "GET") return new Response("method not allowed", { status: 405 });

  const url = new URL(request.url);
  const articleSlug = url.searchParams.get("article")?.trim() ?? "";
  const rawPlacement = url.searchParams.get("placement")?.trim() ?? "article_end";
  const placement = ALLOWED_PLACEMENTS.has(rawPlacement) ? rawPlacement : "article_end";
  if (!articleSlug) return new Response("referência inválida", { status: 400 });

  const db = getDb();
  const [article] = await db
    .select({ id: articles.id, slug: articles.slug, beat: articles.beat })
    .from(articles)
    .where(and(eq(articles.slug, articleSlug), eq(articles.status, "published")))
    .limit(1);
  if (!article) return new Response("matéria não encontrada", { status: 404 });

  const offer = WIRE_OFFERS[article.beat];
  const destination = new URL(offer.path, SITE_URL);
  destination.searchParams.set("utm_source", "veronica_wire");
  destination.searchParams.set("utm_medium", "owned_media");
  destination.searchParams.set("utm_campaign", offer.id);
  destination.searchParams.set("utm_content", `${placement}_${article.slug}`.slice(0, 120));

  const userAgent = request.headers.get("user-agent") ?? "";
  const isAutomatedPreview = /bot|crawler|spider|preview|facebookexternalhit|whatsapp/i.test(
    userAgent,
  );
  if (!isAutomatedPreview) {
    try {
      await ensureWireOfferStorage();
      await db.insert(wireOfferClicks).values({
        articleId: article.id,
        beat: article.beat,
        offerId: offer.id,
        placement,
      });
    } catch (error) {
      // Um erro de telemetria nunca impede o leitor de chegar à solução.
      console.error("Falha ao registrar clique de oferta do Wire:", error);
    }
  }

  return Response.redirect(destination, 302);
}

export const getWireCommercialSnapshot = createServerFn({ method: "GET" }).handler(async () => {
  const admin = await requireAdmin();
  if (!admin) return { ok: false as const, error: "Acesso restrito." };
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  try {
    await ensureWireOfferStorage();
    const db = getDb();
    const rows = await db
      .select({ offerId: wireOfferClicks.offerId, clicks: count() })
      .from(wireOfferClicks)
      .where(gte(wireOfferClicks.clickedAt, since))
      .groupBy(wireOfferClicks.offerId)
      .orderBy(desc(count()));
    return {
      ok: true as const,
      available: true as const,
      periodDays: 30,
      totalClicks: rows.reduce((sum, row) => sum + Number(row.clicks), 0),
      offers: rows.map((row) => {
        const offer = Object.values(WIRE_OFFERS).find((item) => item.id === row.offerId);
        return {
          offerId: row.offerId,
          label: offer?.title ?? row.offerId,
          clicks: Number(row.clicks),
        };
      }),
    };
  } catch (error) {
    console.error("Falha ao carregar desempenho comercial do Wire:", error);
    return {
      ok: true as const,
      available: false as const,
      periodDays: 30,
      totalClicks: 0,
      offers: [],
    };
  }
});
