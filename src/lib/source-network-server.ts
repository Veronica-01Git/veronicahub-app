import { createServerFn } from "@tanstack/react-start";
import { and, count, desc, eq, gte, lt, sql } from "drizzle-orm";
import { getDb } from "./db";
import { articles, sourceReferrals } from "./schema";
import { BEAT_LABELS, type Beat } from "./beats";
import { sourceDomain, sourceLabel } from "./editorial-network";
import { isSafeRedirectUrl } from "./security";

let sourceReferralStorageReady = false;

// A migração 0007 é a fonte oficial do schema. Este bootstrap idempotente
// evita perder os primeiros cliques se o Worker novo chegar alguns segundos
// antes da migração no banco de produção.
async function ensureSourceReferralStorage() {
  if (sourceReferralStorageReady) return;
  const db = getDb();
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "SourceReferral" (
      "id" text PRIMARY KEY NOT NULL,
      "articleId" text NOT NULL REFERENCES "Article"("id") ON DELETE CASCADE,
      "beat" "ArticleBeat" NOT NULL,
      "sourceDomain" text NOT NULL,
      "destinationUrl" text NOT NULL,
      "clickedAt" timestamp DEFAULT now() NOT NULL
    )
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "SourceReferral_clickedAt_idx"
    ON "SourceReferral" ("clickedAt")
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "SourceReferral_sourceDomain_clickedAt_idx"
    ON "SourceReferral" ("sourceDomain", "clickedAt")
  `);
  sourceReferralStorageReady = true;
}

function addReferralTags(destination: string, beat: Beat, articleSlug: string): string {
  const url = new URL(destination);
  url.searchParams.set("utm_source", "veronicahub.com");
  url.searchParams.set("utm_medium", "referral");
  url.searchParams.set("utm_campaign", "veronica_wire");
  url.searchParams.set("utm_content", `${beat}_${articleSlug}`.slice(0, 120));
  return url.toString();
}

export async function handleSourceReferral(request: Request): Promise<Response> {
  if (request.method !== "GET") return new Response("method not allowed", { status: 405 });

  const url = new URL(request.url);
  const articleSlug = url.searchParams.get("article")?.trim() ?? "";
  const sourceIndex = Number(url.searchParams.get("source"));
  if (!articleSlug || !Number.isInteger(sourceIndex) || sourceIndex < 0 || sourceIndex > 9) {
    return new Response("referência inválida", { status: 400 });
  }

  const db = getDb();
  const [article] = await db
    .select({
      id: articles.id,
      beat: articles.beat,
      slug: articles.slug,
      sourceUrls: articles.sourceUrls,
    })
    .from(articles)
    .where(and(eq(articles.slug, articleSlug), eq(articles.status, "published")))
    .limit(1);
  const rawDestination = article?.sourceUrls[sourceIndex];
  if (!article || !rawDestination) return new Response("fonte não encontrada", { status: 404 });

  // sourceUrls vem do pipeline de IA que redige a matéria, não de uma pessoa
  // revisando link a link. Um destino `javascript:` num header Location é
  // ignorado pelos navegadores de hoje, mas não há motivo para emitir um:
  // encaminhamento daqui é http(s) ou não é.
  if (!isSafeRedirectUrl(rawDestination)) {
    console.warn("Fonte com destino não-http descartada:", article.slug, sourceIndex);
    return new Response("fonte inválida", { status: 400 });
  }

  let destination: string;
  try {
    destination = addReferralTags(rawDestination, article.beat, article.slug);
  } catch {
    return new Response("fonte inválida", { status: 400 });
  }

  const userAgent = request.headers.get("user-agent") ?? "";
  const isAutomatedPreview = /bot|crawler|spider|preview|facebookexternalhit|whatsapp/i.test(
    userAgent,
  );
  if (!isAutomatedPreview) {
    try {
      await ensureSourceReferralStorage();
      await db.insert(sourceReferrals).values({
        articleId: article.id,
        beat: article.beat,
        sourceDomain: sourceDomain(rawDestination),
        destinationUrl: rawDestination,
      });
    } catch (error) {
      // O crédito nunca deixa de funcionar por causa da medição.
      console.error("Falha ao registrar encaminhamento para fonte:", error);
    }
  }

  return Response.redirect(destination, 302);
}

export const getSourceNetworkSnapshot = createServerFn({ method: "GET" }).handler(async () => {
  const db = getDb();
  const rows = await db
    .select({
      beat: articles.beat,
      sourceUrls: articles.sourceUrls,
      publishedAt: articles.publishedAt,
    })
    .from(articles)
    .where(eq(articles.status, "published"))
    .orderBy(desc(articles.publishedAt))
    .limit(200);

  const byDomain = new Map<
    string,
    { domain: string; label: string; citations: number; beats: Set<Beat>; lastCitedAt: Date | null }
  >();
  for (const row of rows) {
    for (const sourceUrl of row.sourceUrls) {
      const domain = sourceDomain(sourceUrl);
      const current = byDomain.get(domain) ?? {
        domain,
        label: sourceLabel(sourceUrl),
        citations: 0,
        beats: new Set<Beat>(),
        lastCitedAt: row.publishedAt,
      };
      current.citations += 1;
      current.beats.add(row.beat);
      if (!current.lastCitedAt || (row.publishedAt && row.publishedAt > current.lastCitedAt)) {
        current.lastCitedAt = row.publishedAt;
      }
      byDomain.set(domain, current);
    }
  }

  return {
    sources: [...byDomain.values()]
      .sort((a, b) => b.citations - a.citations || a.label.localeCompare(b.label))
      .slice(0, 24)
      .map((source) => ({
        domain: source.domain,
        label: source.label,
        citations: source.citations,
        beats: [...source.beats],
        lastCitedAt: source.lastCitedAt?.toISOString() ?? null,
      })),
    articleCount: rows.length,
  };
});

function monthWindow(month: string | null): { key: string; start: Date; end: Date } {
  const valid = month?.match(/^(\d{4})-(0[1-9]|1[0-2])$/);
  const now = new Date();
  const year = valid ? Number(valid[1]) : now.getUTCFullYear();
  const monthIndex = valid ? Number(valid[2]) - 1 : now.getUTCMonth();
  return {
    key: `${year}-${String(monthIndex + 1).padStart(2, "0")}`,
    start: new Date(Date.UTC(year, monthIndex, 1)),
    end: new Date(Date.UTC(year, monthIndex + 1, 1)),
  };
}

const reportValidator = (input: unknown) => {
  const value = input as { month?: unknown };
  return { month: typeof value?.month === "string" ? value.month : null };
};

export const getPublicSourceReport = createServerFn({ method: "GET" })
  .validator(reportValidator)
  .handler(async ({ data }) => {
    const window = monthWindow(data.month);
    try {
      await ensureSourceReferralStorage();
      const db = getDb();
      const rows = await db
        .select({
          sourceDomain: sourceReferrals.sourceDomain,
          beat: sourceReferrals.beat,
          referrals: count(),
        })
        .from(sourceReferrals)
        .where(
          and(
            gte(sourceReferrals.clickedAt, window.start),
            lt(sourceReferrals.clickedAt, window.end),
          ),
        )
        .groupBy(sourceReferrals.sourceDomain, sourceReferrals.beat)
        .orderBy(desc(count()));

      return {
        month: window.key,
        available: true,
        totalReferrals: rows.reduce((sum, row) => sum + Number(row.referrals), 0),
        rows: rows.map((row) => ({
          sourceDomain: row.sourceDomain,
          sourceLabel: sourceLabel(row.sourceDomain),
          beat: row.beat,
          beatLabel: BEAT_LABELS[row.beat],
          referrals: Number(row.referrals),
        })),
      };
    } catch (error) {
      console.error("Falha ao carregar relatório público de fontes:", error);
      return { month: window.key, available: false, totalReferrals: 0, rows: [] };
    }
  });
