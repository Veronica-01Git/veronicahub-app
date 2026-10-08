import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createGroqJsonAdapter,
  groqFailure,
  routeFailure,
} from "../src/lib/ai/adapters/groq-json.ts";
import { ModelRouter } from "../src/lib/ai/model-router.ts";
const options = {
  key: "runtime-test-key",
  system: "Retorne JSON útil.",
  maxTokens: 1600,
  maxInputChars: 4000,
  maxOutputChars: 5000,
  reserveMicros: 2000,
};
const invoke = (a) =>
  a.invoke({ capability: "LLM", input: "Tarefa sintética" }, new AbortController().signal);
test("Worker transport preserves native receiver and uses the request credential", async () => {
  const previous = globalThis.fetch;
  globalThis.fetch = async function (url, init) {
    assert.equal(this, globalThis);
    assert.equal(init.headers.authorization, "Bearer runtime-test-key");
    const body = JSON.parse(init.body);
    assert.equal(body.max_completion_tokens, 1600);
    assert.equal(body.response_format.type, "json_object");
    return Response.json({
      choices: [{ finish_reason: "stop", message: { content: '{"ok":true}' } }],
      usage: { prompt_tokens: 100, completion_tokens: 200 },
    });
  };
  try {
    const r = await invoke(createGroqJsonAdapter(options));
    assert.deepEqual(r.output, { ok: true });
    assert.equal(r.costMicros, null);
    assert.equal(r.metadata.estimatedCostMicros, 68);
  } finally {
    globalThis.fetch = previous;
  }
});
test("auth and quota failures expose only stable codes, never provider body", async () => {
  for (const [status, code] of [
    [401, "PROVIDER_AUTH"],
    [403, "PROVIDER_AUTH"],
    [429, "PROVIDER_RATE_LIMIT"],
    [503, "PROVIDER_UNAVAILABLE"],
  ]) {
    await assert.rejects(
      invoke(
        createGroqJsonAdapter(
          options,
          async () => new Response("private key and payload", { status }),
        ),
      ),
      { message: code },
    );
  }
  assert.equal(groqFailure(new Error("private key and payload")), "PROVIDER_UNAVAILABLE");
});
test("truncated and malformed generations cannot bypass output policy", async () => {
  for (const [payload, code] of [
    [
      { choices: [{ finish_reason: "length", message: { content: '{"ok":true}' } }] },
      "OUTPUT_TRUNCATED",
    ],
    [{ choices: [{ message: { content: "not json" } }] }, "INVALID_OUTPUT"],
  ])
    await assert.rejects(
      invoke(createGroqJsonAdapter(options, async () => Response.json(payload))),
      new RegExp(code),
    );
  let calls = 0;
  await assert.rejects(
    invoke(
      createGroqJsonAdapter({ ...options, maxInputChars: 2 }, async () => {
        calls++;
        return Response.json({});
      }),
    ),
    /INPUT_LIMIT/,
  );
  assert.equal(calls, 0);
});
test("unconfigured or over-budget router never contacts provider", async () => {
  let calls = 0;
  for (const patch of [{ key: undefined }, { reserveMicros: 6000 }]) {
    const adapter = createGroqJsonAdapter({ ...options, ...patch }, async () => {
      calls++;
      return Response.json({});
    });
    const r = await new ModelRouter()
      .register(adapter)
      .setRoute("LLM", ["groq/openai/gpt-oss-20b"])
      .route({
        capability: "LLM",
        input: "Tarefa",
        context: { agentSlug: "test", tenantId: "test", executionId: "test" },
        maxCostMicros: 5000,
        unknownCostPolicy: "block",
        attemptTimeoutMs: 20,
        deadlineMs: 30,
      });
    assert.equal(r.ok, false);
  }
  assert.equal(calls, 0);
  assert.equal(routeFailure({ attempts: [{ outcome: "timeout" }] }), "PROVIDER_TIMEOUT");
});
