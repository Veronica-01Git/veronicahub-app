import { and, count, desc, eq, gte, sql } from "drizzle-orm";
import { getDb } from "../lib/db";
import { affiliateCatalogProducts, affiliateLinkClicks } from "../lib/schema";
import { validateShopeeAffiliateUrl, buildTrackedPath } from "../lib/affiliate-products";
import { HOUSE_REVENUE_CODE } from "../lib/affiliate-revenue";
import { ModelRouter, type ProviderAdapter } from "../lib/ai/model-router";
import { HOUSE_TENANT } from "../lib/ai/platform-types";
import { executeAnalyticsAgent, type AgentResult } from "./engine";
import { ANALYTICS_AGENT as policy } from "./policy";
import { authorizeAnalyticsRequest } from "./http";

const MODEL = "openai/gpt-oss-20b";
const adapter: ProviderAdapter<string, unknown> = {
  provider: "groq",
  model: MODEL,
  type: "LLM",
  isConfigured: () => !!process.env.GROQ_API_KEY,
  estimateCostMicros: () => 2000,
  async invoke({ input }, signal) {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      signal,
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.3,
        max_completion_tokens: 900,
        reasoning_effort: "low",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "Você é a IA de Analytics da Veronica Hub. Prepare um modelo genérico de divulgação de produto: observar o anúncio, verificar as condições na Shopee e demonstrar somente uso real. Não mencione produtos específicos, números, resultados, benefícios de saúde, preços, promoções, vendas, avaliações ou lucro. Não invente URLs nem instruções para ferramentas. Retorne somente JSON com hook, script e caption, três textos curtos em português brasileiro. Sem HTML.",
          },
          { role: "user", content: input },
        ],
      }),
    });
    if (!r.ok) throw new Error("PROVIDER_UNAVAILABLE");
    const data = (await r.json()) as { choices?: { message?: { content?: string } }[] };
    const text = data.choices?.[0]?.message?.content;
    if (!text || text.length > 5000) throw new Error("INVALID_OUTPUT");
    return { output: JSON.parse(text), costMicros: null };
  },
  describeError: () => "Modelo indisponível; curadoria por regras preservada.",
};
const router = new ModelRouter().register(adapter).setRoute("LLM", [`groq/${MODEL}`]);
let ready = false;
async function storage() {
  if (ready) return;
  const db = getDb();
  await db.execute(
    sql`CREATE TABLE IF NOT EXISTS "AnalyticsAgentSettings" (id text PRIMARY KEY, enabled boolean NOT NULL DEFAULT true)`,
  );
  await db.execute(
    sql`CREATE TABLE IF NOT EXISTS "AnalyticsAgentRun" (id text PRIMARY KEY, version text NOT NULL, status text NOT NULL, "startedAt" timestamp NOT NULL DEFAULT now(), "finishedAt" timestamp, "durationMs" integer, trigger text NOT NULL, lease text NOT NULL, "modelAttempted" boolean NOT NULL DEFAULT false, result text, "errorCode" text)`,
  );
  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS "AnalyticsAgentRun_version_startedAt_idx" ON "AnalyticsAgentRun" (version, "startedAt")`,
  );
  await db.execute(
    sql`INSERT INTO "AnalyticsAgentSettings" (id) VALUES (${policy.slug}) ON CONFLICT DO NOTHING`,
  );
  ready = true;
}
export async function runAnalyticsAgent(trigger: "manual" | "schedule" = "schedule") {
  await storage();
  const db = getDb();
  const settings = await db.execute(
    sql`SELECT enabled FROM "AnalyticsAgentSettings" WHERE id=${policy.slug}`,
  );
  if (!settings.rows[0]?.enabled) return { ok: true, paused: true };
  const lease = crypto.randomUUID();
  const slot = `${policy.version}:${new Date().toISOString().slice(0, 13)}`;
  // Unique hourly claim + two-minute lease. One model attempt per claimed slot.
  const claimed = await db.execute(
    sql`INSERT INTO "AnalyticsAgentRun" (id,version,status,trigger,lease) VALUES (${slot},${policy.version},'running',${trigger},${lease}) ON CONFLICT (id) DO UPDATE SET status='running',lease=${lease},"startedAt"=now(),"errorCode"=NULL WHERE "AnalyticsAgentRun".status='failed' OR ("AnalyticsAgentRun".status='running' AND "AnalyticsAgentRun"."startedAt" < now()-interval '2 minutes') RETURNING id,"modelAttempted"`,
  );
  if (!claimed.rows.length) return { ok: true, duplicate: true };
  const started = Date.now();
  try {
    const result = await executeAnalyticsAgent(HOUSE_TENANT, {
      catalog: () =>
        db
          .select({
            id: affiliateCatalogProducts.id,
            name: affiliateCatalogProducts.name,
            category: affiliateCatalogProducts.category,
            priceLabel: affiliateCatalogProducts.priceLabel,
            coverUrl: affiliateCatalogProducts.coverUrl,
            affiliateUrl: affiliateCatalogProducts.affiliateUrl,
          })
          .from(affiliateCatalogProducts)
          .where(eq(affiliateCatalogProducts.active, true))
          .orderBy(desc(affiliateCatalogProducts.priority))
          .limit(100),
      houseClicks: () =>
        db
          .select({ productId: affiliateLinkClicks.productId, clicks: count() })
          .from(affiliateLinkClicks)
          .where(
            and(
              eq(affiliateLinkClicks.affiliateHandle, HOUSE_REVENUE_CODE),
              gte(affiliateLinkClicks.clickedAt, new Date(Date.now() - 30 * 86400000)),
            ),
          )
          .groupBy(affiliateLinkClicks.productId),
      validLink: (url) => validateShopeeAffiliateUrl(url).ok,
      creative:
        adapter.isConfigured() && !claimed.rows[0]?.modelAttempted
          ? async () => {
              const reserved = await db.execute(
                sql`UPDATE "AnalyticsAgentRun" SET "modelAttempted"=true WHERE id=${slot} AND lease=${lease} AND "modelAttempted"=false RETURNING id`,
              );
              if (!reserved.rows.length) throw new Error("MODEL_BUDGET_EXHAUSTED");
              const r = await router.route<string, unknown>({
                capability: "LLM",
                input:
                  "Crie uma sugestão educativa e neutra para conferir uma oferta. Cada campo deve ter pelo menos uma frase completa.",
                context: { agentSlug: policy.slug, tenantId: HOUSE_TENANT, executionId: slot },
                maxCostMicros: 5000,
                unknownCostPolicy: "block",
                attemptTimeoutMs: 12000,
                deadlineMs: 13000,
              });
              if (!r.ok) throw new Error("MODEL_UNAVAILABLE");
              return r.output;
            }
          : undefined,
      publish: async (result) => {
        await db.execute(
          sql`UPDATE "AnalyticsAgentRun" SET status='completed',result=${JSON.stringify(result)},"finishedAt"=now(),"durationMs"=${Date.now() - started} WHERE id=${slot} AND lease=${lease} AND status='running' RETURNING id`,
        );
      },
    });
    return {
      ok: true,
      checked: result.checked,
      published: result.briefings.length,
      modelAccepted: result.modelAccepted,
      modelIssue: result.modelIssue,
    };
  } catch {
    await db.execute(
      sql`UPDATE "AnalyticsAgentRun" SET status='failed',"finishedAt"=now(),"durationMs"=${Date.now() - started},"errorCode"='OPERATION_FAILED' WHERE id=${slot} AND lease=${lease}`,
    );
    return { ok: false, error: "OPERATION_FAILED" };
  }
}
export async function analyticsAgentStatus() {
  await storage();
  const db = getDb();
  const [settings, runs, active] = await Promise.all([
    db.execute(sql`SELECT enabled FROM "AnalyticsAgentSettings" WHERE id=${policy.slug}`),
    db.execute(
      sql`SELECT id,status,"startedAt","finishedAt","durationMs",result FROM "AnalyticsAgentRun" WHERE version=${policy.version} ORDER BY "startedAt" DESC LIMIT 6`,
    ),
    db
      .select({
        id: affiliateCatalogProducts.id,
        name: affiliateCatalogProducts.name,
        category: affiliateCatalogProducts.category,
        affiliateUrl: affiliateCatalogProducts.affiliateUrl,
      })
      .from(affiliateCatalogProducts)
      .where(eq(affiliateCatalogProducts.active, true))
      .limit(100),
  ]);
  const completed = runs.rows.find((r) => r.status === "completed");
  const result = completed?.result ? (JSON.parse(String(completed.result)) as AgentResult) : null;
  const fresh =
    !!completed && Date.now() - new Date(String(completed.finishedAt)).getTime() < 2 * 3600000;
  const enabled = Boolean(settings.rows[0]?.enabled);
  return {
    name: policy.name,
    version: policy.version,
    enabled,
    cadence: policy.cadence,
    health: !enabled
      ? "paused"
      : !runs.rows.length
        ? "awaiting"
        : runs.rows[0].status === "failed" ||
            !fresh ||
            !!result?.modelIssue ||
            !!result?.rejectedLinks
          ? "attention"
          : "active",
    lastRunAt: completed?.finishedAt ?? null,
    mode: result?.modelAccepted ? "model" : "rules",
    recommendations:
      enabled && fresh
        ? (result?.briefings ?? []).flatMap((b) => {
            const product = active.find(
              (p) => p.id === b.productId && validateShopeeAffiliateUrl(p.affiliateUrl).ok,
            );
            return product
              ? [
                  {
                    ...b,
                    title: product.name,
                    href: "/veronica-analytics",
                    buyPath: buildTrackedPath(product as Parameters<typeof buildTrackedPath>[0], {
                      handle: HOUSE_REVENUE_CODE,
                      placement: "analytics_agent",
                    }),
                  },
                ]
              : [];
          })
        : [],
    recent: runs.rows.map((r) => ({
      id: String(r.id),
      status: String(r.status),
      startedAt: r.startedAt,
      finishedAt: r.finishedAt,
      durationMs: r.durationMs,
    })),
    metrics: result
      ? {
          checked: result.checked,
          rejectedLinks: result.rejectedLinks,
          suggestions: result.briefings.length,
          missingImages: result.missingImages,
          modelIssue: result.modelIssue,
        }
      : null,
  };
}
export async function setAnalyticsAgentEnabled(enabled: boolean) {
  await storage();
  await getDb().execute(
    sql`UPDATE "AnalyticsAgentSettings" SET enabled=${enabled} WHERE id=${policy.slug}`,
  );
  return { ok: true };
}
export async function handleAnalyticsAgent(request: Request) {
  const action = authorizeAnalyticsRequest(request, process.env.CRON_SECRET);
  const headers = { "cache-control": "no-store", "x-content-type-options": "nosniff" };
  if (typeof action === "number")
    return Response.json(
      { error: action === 401 ? "unauthorized" : "method or route not allowed" },
      { status: action, headers },
    );
  try {
    const result = action === "status" ? await analyticsAgentStatus() : await runAnalyticsAgent();
    return Response.json(result, { status: "ok" in result && !result.ok ? 503 : 200, headers });
  } catch {
    return Response.json({ error: "Operação indisponível" }, { status: 503, headers });
  }
}
