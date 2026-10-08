import { test } from "node:test";
import assert from "node:assert/strict";
import { createGeminiJsonAdapter } from "../src/lib/ai/adapters/gemini-json.ts";
import { ModelRouter } from "../src/lib/ai/model-router.ts";
import { jsonRoute } from "../src/lib/ai/adapters/route-json.server.ts";
const options = {
  key: "test-key",
  system: "Somente JSON",
  maxTokens: 1400,
  maxInputChars: 4000,
  maxOutputChars: 5000,
};
const request = { capability: "LLM", input: "Texto público" };
test("configured Gemini replaces rejected Groq without building a retry chain", async () => {
  const opts = { ...options, reserveMicros: 2000 };
  const chosen = await jsonRoute(opts, { secret: async () => "configured" });
  assert.equal(chosen.adapter.provider, "gemini");
  assert.deepEqual(chosen.router.routeFor("LLM"), ["gemini/gemini-3.5-flash-lite"]);
  const absent = await jsonRoute(opts, {
    secret: async (name) => (name === "GROQ_API_KEY" ? "configured" : undefined),
  });
  assert.equal(absent.adapter.provider, "groq");
});
test("Gemini uses header credential and excludes thought parts from JSON", async () => {
  let calls = 0;
  const adapter = createGeminiJsonAdapter(options, async (url, init) => {
    calls++;
    assert.ok(!url.includes("test-key"));
    assert.equal(init.headers["x-goog-api-key"], "test-key");
    const body = JSON.parse(init.body);
    assert.equal(body.generationConfig.maxOutputTokens, 1400);
    assert.equal(body.generationConfig.responseMimeType, "application/json");
    return Response.json({
      candidates: [
        {
          finishReason: "STOP",
          content: {
            parts: [{ thought: true, text: "private reasoning" }, { text: '{"valid":true}' }],
          },
        },
      ],
      usageMetadata: { promptTokenCount: 100, candidatesTokenCount: 100, thoughtsTokenCount: 10 },
    });
  });
  const r = await adapter.invoke(request, new AbortController().signal);
  assert.deepEqual(r.output, { valid: true });
  assert.equal(r.costMicros, null);
  assert.equal(r.metadata.estimatedCostMicros, 305);
  assert.equal(calls, 1);
});
test("large input is cost-blocked before generation and no fallback is called", async () => {
  let calls = 0;
  const adapter = createGeminiJsonAdapter(
    { ...options, maxInputChars: 12000, maxTokens: 2400 },
    async () => {
      calls++;
      throw new Error("not reached");
    },
  );
  const r = await new ModelRouter()
    .register(adapter)
    .setRoute("LLM", ["gemini/gemini-3.5-flash-lite"])
    .route({
      capability: "LLM",
      input: "💚".repeat(5900),
      context: { agentSlug: "test", tenantId: "test", executionId: "test" },
      maxCostMicros: 10000,
      unknownCostPolicy: "block",
      attemptTimeoutMs: 20,
      deadlineMs: 30,
    });
  assert.equal(r.ok, false);
  assert.equal(r.attempts[0].outcome, "skipped-cost");
  assert.equal(calls, 0);
});
test("quota and truncated JSON stay failures even when response has parseable content", async () => {
  for (const [response, code] of [
    [new Response("private", { status: 429 }), "PROVIDER_RATE_LIMIT"],
    [
      Response.json({
        candidates: [{ finishReason: "MAX_TOKENS", content: { parts: [{ text: '{"ok":true}' }] } }],
      }),
      "OUTPUT_TRUNCATED",
    ],
  ]) {
    const a = createGeminiJsonAdapter(options, async () => response);
    await assert.rejects(a.invoke(request, new AbortController().signal), { message: code });
  }
});
