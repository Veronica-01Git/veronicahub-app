import test from "node:test";
import assert from "node:assert/strict";
import { qualification, readAnalysis, DEMO_SCENARIOS } from "../src/commercial/qualification.ts";
import { analyzeBrief } from "../src/commercial/analysis.ts";
import { ModelRouter, adapterId } from "../src/lib/ai/model-router.ts";
const brief = {
  requestId: "12345678-abcd-1234-abcd-123456789abc",
  company: "Private Company",
  service: "commercial",
  challenge: "Organizar pedidos",
  volume: "20 por dia",
  systems: "Site",
  goal: "Encaminhar para aprovação",
  consent: true,
};
function connection(overrides = {}) {
  const calls = [];
  const adapter = {
    provider: "test",
    model: "json",
    type: "LLM",
    isConfigured: () => true,
    estimateCostMicros: () => 4000,
    describeError: (e) => e.message,
    invoke: async ({ input }) => {
      calls.push(input);
      return {
        output: {
          summary: "Organizar pedidos para revisão.",
          questions: ["Qual a base aprovada?"],
        },
        costMicros: null,
      };
    },
    ...overrides,
  };
  return {
    calls,
    connect: async () => ({
      adapter,
      router: new ModelRouter().register(adapter).setRoute("LLM", [adapterId(adapter)]),
    }),
  };
}
test("qualification measures supplied context, not conversion probability", () => {
  assert.equal(qualification(brief).supplied, 4);
  const sparse = qualification({ ...brief, systems: "  ", volume: "" });
  assert.equal(sparse.supplied, 2);
  assert.match(sparse.next, /Completar/);
  assert.equal("score" in sparse, false);
});
test("legacy analysis remains readable and malformed history cannot crash the queue", () => {
  assert.equal(readAnalysis('{"summary":"Original","mode":"model"}').summary, "Original");
  assert.deepEqual(readAnalysis("{bad").questions, []);
  assert.deepEqual(readAnalysis('{"questions":[null,"Pergunta?",1]}').questions, ["Pergunta?"]);
  assert.equal(readAnalysis('{"runtime":null}').runtime, null);
});
test("accepted analysis has bounded runtime evidence and excludes company/account", async () => {
  const c = connection();
  const r = await analyzeBrief(brief, "exec-test", c.connect);
  assert.equal(c.calls.length, 1);
  assert.equal(c.calls[0].includes("Private Company"), false);
  assert.equal(c.calls[0].includes("requestId"), false);
  assert.equal(r.analysis.mode, "model");
  assert.equal(r.analysis.runtime.failure, null);
  assert.equal(r.analysis.runtime.estimatedCostMicros, 4000);
  assert.equal(r.provider, "test");
});
test("provider rejection preserves rules and does not repeat paid invocation", async () => {
  let count = 0;
  const c = connection({
    invoke: async () => {
      count++;
      throw new Error("PROVIDER_AUTH");
    },
  });
  const r = await analyzeBrief(brief, "exec-test", c.connect);
  assert.equal(count, 1);
  assert.equal(r.analysis.mode, "rules");
  assert.equal(r.analysis.runtime.failure, "PROVIDER_AUTH");
  assert.equal(r.analysis.runtime.estimatedCostMicros, 4000);
});
test("over-budget input and missing credentials do not invoke provider", async () => {
  for (const patch of [{ estimateCostMicros: () => 5001 }, { isConfigured: () => false }]) {
    const c = connection(patch);
    const r = await analyzeBrief(brief, "exec-test", c.connect);
    assert.equal(c.calls.length, 0);
    assert.equal(r.analysis.mode, "rules");
    assert.equal(r.analysis.runtime.estimatedCostMicros, null);
    assert.ok(r.analysis.runtime.failure);
  }
});
test("model-generated prices never become accepted proposals", async () => {
  const c = connection({
    invoke: async () => ({ output: { summary: "Custa R$ 100", questions: [] }, costMicros: null }),
  });
  const r = await analyzeBrief(brief, "exec-test", c.connect);
  assert.equal(r.analysis.mode, "rules");
  assert.equal(r.analysis.runtime.failure, "INVALID_OUTPUT");
});
test("demo includes human exception and does not promise a confirmed booking", () => {
  assert.equal(DEMO_SCENARIOS.length, 3);
  assert.match(DEMO_SCENARIOS[1].handoff, /disponibilidade real/);
  assert.match(DEMO_SCENARIOS[2].handoff, /revisão humana/);
});
