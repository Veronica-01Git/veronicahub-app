import test from "node:test";
import assert from "node:assert/strict";
import {
  validateBrief,
  qualify,
  validateAnalysis,
  validateDecision,
  assessSignal,
  SERVICES,
} from "../src/commercial/core.ts";
import { authorizeCommercialRequest } from "../src/commercial/http.ts";
const brief = {
  requestId: "12345678-abcd-1234-abcd-123456789abc",
  company: "Empresa",
  service: "commercial",
  challenge: "Pedidos fora do horário",
  volume: "20 por dia",
  systems: "WhatsApp",
  goal: "Organizar orçamentos",
  consent: true,
};
test("briefing bounds untrusted data and requires intentional submission", () => {
  assert.equal(validateBrief(brief).service, "commercial");
  for (const patch of [
    { consent: false },
    { service: "fake" },
    { requestId: "bad" },
    { challenge: "x".repeat(2001) },
    { goal: "" },
  ])
    assert.throws(() => validateBrief({ ...brief, ...patch }));
  assert.equal("price" in validateBrief({ ...brief, price: 2 }), false);
});
test("every offer has bounded deliverables and implementation requirements", () => {
  for (const s of SERVICES) {
    const q = qualify({ ...brief, service: s.id });
    assert.equal(q.requiresReview, true);
    assert.ok(q.deliverables.length);
    assert.ok(s.needs.length);
    assert.equal(q.service, s.id);
  }
});
test("model cannot introduce prices, links, guarantees or additional tools", () => {
  const result = validateAnalysis(
    JSON.stringify({
      summary: "Organizar pedidos fora do horário.",
      questions: ["Qual a tabela aprovada?"],
      tools: ["payment"],
    }),
    brief,
  );
  assert.equal(result.mode, "model");
  assert.equal("tools" in result, false);
  for (const summary of ["R$ 100", "Lucro garantido", "https://evil.com", "Aumento de 90%"])
    assert.throws(() => validateAnalysis(JSON.stringify({ summary, questions: [] }), brief));
  assert.throws(() => validateAnalysis("{bad", brief));
  assert.throws(() =>
    validateAnalysis(JSON.stringify({ summary: "s", questions: ["x".repeat(221)] }), brief),
  );
});
test("commercial approval requires explicit scope and cannot skip review", () => {
  const d = {
    id: "lead",
    expectedState: "reviewed",
    state: "approved",
    setupCents: 150000,
    monthlyCents: 50000,
    scope: "Atendimento com revisão",
    note: "Aprovado pelo operador",
  };
  assert.equal(validateDecision(d).setupCents, 150000);
  for (const patch of [
    { expectedState: "received" },
    { scope: "" },
    { note: "" },
    { setupCents: -1 },
    { monthlyCents: NaN },
    { state: "paid" },
  ])
    assert.throws(() => validateDecision({ ...d, ...patch }));
  assert.throws(() => validateDecision({ ...d, expectedState: "won", state: "approved" }));
});
test("missing or stale evidence never becomes healthy", () => {
  assert.equal(assessSignal(undefined, 3), "unknown");
  assert.equal(assessSignal("bad", 3), "unknown");
  assert.equal(
    assessSignal("2026-10-01T00:00:00Z", 3, Date.parse("2026-10-01T04:00:00Z")),
    "attention",
  );
  assert.equal(
    assessSignal("2026-10-01T00:00:00Z", 3, Date.parse("2026-10-01T01:00:00Z")),
    "recent",
  );
});
test("Guardian writes require POST and existing cron authentication; public endpoint is read-only", () => {
  const req = (p, m = "GET", token) =>
    new Request("https://veronicahub.com" + p, {
      method: m,
      headers: token ? { authorization: "Bearer " + token } : {},
    });
  assert.equal(authorizeCommercialRequest(req("/api/cron/guardian", "POST"), "secret"), 401);
  assert.equal(
    authorizeCommercialRequest(req("/api/cron/guardian", "GET", "secret"), "secret"),
    405,
  );
  assert.equal(
    authorizeCommercialRequest(req("/api/cron/guardian", "POST", "wrong"), "secret"),
    401,
  );
  assert.equal(
    authorizeCommercialRequest(req("/api/cron/guardian", "POST", "secret"), "secret"),
    "run",
  );
  assert.equal(
    authorizeCommercialRequest(req("/api/agents/commercial/status", "POST"), "secret"),
    405,
  );
  assert.equal(
    authorizeCommercialRequest(req("/api/agents/commercial/status"), undefined),
    "status",
  );
});
