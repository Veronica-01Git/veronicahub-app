import { createServerFn } from "@tanstack/react-start";
import { sql } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { analyzeBrief, COMMERCIAL_MODEL_OPTIONS } from "./analysis";
import { jsonRoute } from "../lib/ai/adapters/route-json.server";
import { getDb } from "../lib/db";
import { getSessionUserId } from "../lib/session";
import { requireAdminCore } from "../lib/admin-core.server";
import { validateBrief, qualify, validateDecision, assessSignal, type BriefState } from "./core";

function briefDTO(r: Record<string, unknown>) {
  return {
    id: String(r.id),
    company: String(r.company),
    challenge: String(r.challenge ?? ""),
    service: String(r.service),
    volume: String(r.volume ?? ""),
    systems: String(r.systems ?? ""),
    goal: String(r.goal ?? ""),
    state: r.state as BriefState,
    analysis: String(r.analysis),
    modelState: String(r.modelState ?? ""),
    provider: r.provider ? String(r.provider) : null,
    model: r.model ? String(r.model) : null,
    setupCents: Number(r.setupCents ?? 0),
    monthlyCents: Number(r.monthlyCents ?? 0),
    scope: String(r.scope ?? ""),
    createdAt: String(r.createdAt),
    email: String(r.email ?? ""),
  };
}
export const submitCommercialBrief = createServerFn({ method: "POST" })
  .validator(validateBrief)
  .handler(async ({ data }) => {
    const userId = await getSessionUserId();
    if (!userId)
      return {
        ok: false as const,
        error: "Entre na sua conta pelo botão Entrar para salvar o diagnóstico.",
      };
    const db = getDb(),
      id = createId(),
      day = new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Sao_Paulo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date());
    const initial = qualify(data);
    const inserted = await db.execute(
      sql`INSERT INTO "CommercialBrief" (id,"userId","requestId","dayKey",company,challenge,service,volume,systems,goal,analysis) VALUES (${id},${userId},${data.requestId},${day},${data.company},${data.challenge},${data.service},${data.volume},${data.systems},${data.goal},${JSON.stringify(initial)}) ON CONFLICT DO NOTHING RETURNING id`,
    );
    if (!inserted.rows.length) {
      const old = await db.execute(
        sql`SELECT id,analysis FROM "CommercialBrief" WHERE "userId"=${userId} AND "requestId"=${data.requestId}`,
      );
      return old.rows.length
        ? {
            ok: true as const,
            id: String(old.rows[0].id),
            analysis: JSON.parse(String(old.rows[0].analysis)),
          }
        : {
            ok: false as const,
            error:
              "Seu diagnóstico de hoje já foi salvo. Consulte o acompanhamento abaixo; um novo diagnóstico fica disponível amanhã (horário de Brasília).",
          };
    }
    // One reserved analysis per brief. Contact/account data never enter the model.
    await db.execute(
      sql`UPDATE "CommercialBrief" SET "modelState"='running' WHERE id=${id} AND "modelState"='pending'`,
    );
    const { analysis, provider, model } = await analyzeBrief(data, id, () =>
      jsonRoute(COMMERCIAL_MODEL_OPTIONS),
    );
    await db.execute(
      sql`UPDATE "CommercialBrief" SET analysis=${JSON.stringify(analysis)},"modelState"=${analysis.mode === "model" ? "complete" : "fallback"},provider=${provider},model=${model},"updatedAt"=now() WHERE id=${id}`,
    );
    return { ok: true as const, id, analysis };
  });
export const myCommercialBriefs = createServerFn({ method: "GET" }).handler(async () => {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false as const, error: "Entre para acompanhar seu diagnóstico." };
  const r = await getDb().execute(
    sql`SELECT id,company,service,state,analysis,"setupCents","monthlyCents",scope,"createdAt" FROM "CommercialBrief" WHERE "userId"=${userId} ORDER BY "createdAt" DESC LIMIT 20`,
  );
  return {
    ok: true as const,
    briefs: r.rows.map((raw) => {
      const r = briefDTO(raw);
      return {
        id: r.id,
        company: r.company,
        service: r.service,
        state: r.state,
        analysis: r.analysis,
        createdAt: r.createdAt,
        setupCents: r.state === "approved" || r.state === "won" ? r.setupCents : null,
        monthlyCents: r.state === "approved" || r.state === "won" ? r.monthlyCents : null,
        scope: r.state === "approved" || r.state === "won" ? r.scope : null,
      };
    }),
  };
});
export const commercialAdmin = createServerFn({ method: "GET" }).handler(async () => {
  if (!(await requireAdminCore())) return { ok: false as const, error: "Acesso restrito." };
  const db = getDb();
  const [briefs, totals, history, metrics] = await Promise.all([
    db.execute(
      sql`SELECT b.*,u.email FROM "CommercialBrief" b JOIN "User" u ON u.id=b."userId" ORDER BY b."createdAt" DESC LIMIT 100`,
    ),
    db.execute(sql`SELECT state,count(*)::int AS total FROM "CommercialBrief" GROUP BY state`),
    db.execute(
      sql`SELECT "briefId","fromState","toState",note,"createdAt" FROM "CommercialDecision" ORDER BY "createdAt" DESC LIMIT 100`,
    ),
    db.execute(sql`WITH first_review AS (
      SELECT b.id, extract(epoch FROM (min(d."createdAt") - b."createdAt"))/3600 AS hours
      FROM "CommercialBrief" b JOIN "CommercialDecision" d ON d."briefId"=b.id AND d."toState"='reviewed'
      GROUP BY b.id,b."createdAt"
    ) SELECT count(*)::int AS total,
      count(*) FILTER (WHERE state='received' AND "createdAt"<now()-interval '2 days')::int AS overdue,
      count(*) FILTER (WHERE "modelState"='complete')::int AS modeled,
      count(*) FILTER (WHERE "modelState"='fallback')::int AS fallback,
      count(*) FILTER (WHERE "modelState" IN ('pending','running'))::int AS pending,
      (SELECT avg(hours) FROM first_review) AS "averageReviewHours",
      (SELECT count(*)::int FROM first_review) AS "reviewedCount"
      FROM "CommercialBrief"`),
  ]);
  return {
    ok: true as const,
    briefs: briefs.rows.map(briefDTO),
    metrics: {
      total: Number(metrics.rows[0]?.total ?? 0),
      overdue: Number(metrics.rows[0]?.overdue ?? 0),
      modeled: Number(metrics.rows[0]?.modeled ?? 0),
      fallback: Number(metrics.rows[0]?.fallback ?? 0),
      pending: Number(metrics.rows[0]?.pending ?? 0),
      reviewedCount: Number(metrics.rows[0]?.reviewedCount ?? 0),
      averageReviewHours:
        metrics.rows[0]?.averageReviewHours == null
          ? null
          : Number(metrics.rows[0].averageReviewHours),
    },
    totals: totals.rows.map((r) => ({ state: r.state as BriefState, total: Number(r.total) })),
    history: history.rows.map((r) => ({
      briefId: String(r.briefId),
      fromState: String(r.fromState),
      toState: String(r.toState),
      note: String(r.note),
      createdAt: String(r.createdAt),
    })),
  };
});
export const decideCommercialBrief = createServerFn({ method: "POST" })
  .validator(validateDecision)
  .handler(async ({ data }) => {
    const admin = await requireAdminCore();
    if (!admin) return { ok: false as const, error: "Acesso restrito." };
    const r = await getDb().execute(
      sql`WITH changed AS (UPDATE "CommercialBrief" SET state=${data.state},"setupCents"=${data.setupCents},"monthlyCents"=${data.monthlyCents},scope=${data.scope},"updatedAt"=now() WHERE id=${data.id} AND state=${data.expectedState} RETURNING id) INSERT INTO "CommercialDecision" (id,"briefId","adminId","fromState","toState","setupCents","monthlyCents",scope,note) SELECT ${createId()},id,${admin.id},${data.expectedState},${data.state},${data.setupCents},${data.monthlyCents},${data.scope},${data.note} FROM changed RETURNING id`,
    );
    return r.rows.length
      ? { ok: true as const }
      : { ok: false as const, error: "O pedido mudou. Atualize a fila antes de decidir." };
  });
export async function guardianSnapshot(now = Date.now()) {
  const checks: { name: string; state: string; detail: string }[] = [];
  const check = async (name: string, read: () => Promise<{ state: string; detail: string }>) => {
    try {
      checks.push({ name, ...(await read()) });
    } catch {
      checks.push({
        name,
        state: "unknown",
        detail: "Não foi possível consultar a fonte. Conferência necessária.",
      });
    }
  };
  await Promise.all([
    check("Wire", async () => {
      const r = await getDb().execute(
        sql`SELECT max("publishedAt") AS latest FROM "Article" WHERE status='published'`,
      );
      return {
        state: assessSignal(r.rows[0]?.latest, 3, now),
        detail: "Última matéria publicada; janela de 3 horas.",
      };
    }),
    check("Members", async () => {
      const { membersAgentStatus } = await import("../members/agent-runtime.server");
      const r = await membersAgentStatus();
      return { state: String(r.health), detail: "Estado informado pelo executor Members." };
    }),
    check("Analytics", async () => {
      const { analyticsAgentStatus } = await import("../analytics-agent/runtime.server");
      const r = await analyticsAgentStatus();
      return { state: r.health, detail: "Estado informado pelo executor Analytics." };
    }),
    check("Comercial", async () => {
      const r = await getDb().execute(
        sql`SELECT count(*)::int AS total FROM "CommercialBrief" WHERE state='received' AND "createdAt"<now()-interval '2 days'`,
      );
      const n = Number(r.rows[0]?.total ?? 0);
      return {
        state: n ? "attention" : "recent",
        detail: `${n} diagnósticos aguardam revisão há mais de 48 horas.`,
      };
    }),
    check("Análises comerciais", async () => {
      const r = await getDb().execute(
        sql`SELECT count(*)::int AS total FROM "CommercialBrief" WHERE "modelState" IN ('pending','running') AND "createdAt"<now()-interval '10 minutes'`,
      );
      const n = Number(r.rows[0]?.total ?? 0);
      return {
        state: n ? "attention" : "recent",
        detail: `${n} análises aguardam conclusão há mais de 10 minutos. Briefing preservado; sem nova chamada automática ao modelo.`,
      };
    }),
  ]);
  return {
    checkedAt: new Date(now).toISOString(),
    checks: checks.sort((a, b) => a.name.localeCompare(b.name)),
    requiresAttention: checks.some((c) => !["recent", "active", "paused"].includes(c.state)),
  };
}
export const guardianAdmin = createServerFn({ method: "GET" }).handler(async () => {
  if (!(await requireAdminCore())) return { ok: false as const, error: "Acesso restrito." };
  return { ok: true as const, ...(await guardianSnapshot()) };
});
