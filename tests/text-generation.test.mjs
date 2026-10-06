import { test } from "node:test";
import assert from "node:assert/strict";
import { generateText } from "../src/lib/text-generation.server.ts";
import { getRuntimeSecret } from "../src/lib/runtime-secret.server.ts";

const input = {
  system: "Use somente as fontes fornecidas.",
  messages: [{ role: "user", content: "Fonte pública" }],
  maxTokens: 900,
  groqModel: "openai/gpt-oss-20b",
  json: true,
};
const secret = async (name) =>
  ({
    GROQ_API_KEY: "groq-test-secret",
    GEMINI_API_KEY: "gemini-test-secret",
    ANTHROPIC_API_KEY: "anthropic-test-secret",
  })[name];

test("default transport preserves the native fetch receiver required by Workers", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.GROQ_API_KEY;
  process.env.GROQ_API_KEY = "test-runtime-key";
  globalThis.fetch = async function () {
    assert.equal(this, globalThis);
    return Response.json({ choices: [{ message: { content: "OK" } }] });
  };
  try {
    assert.equal((await generateText(input)).text, "OK");
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.GROQ_API_KEY;
    else process.env.GROQ_API_KEY = originalKey;
  }
});

test("native Worker binding wins over an obsolete process value; missing binding never revives it", async () => {
  process.env.WIRE_TEST_SECRET = "obsolete";
  try {
    assert.equal(
      await getRuntimeSecret("WIRE_TEST_SECRET", async () => ({ WIRE_TEST_SECRET: " new " })),
      "new",
    );
    assert.equal(await getRuntimeSecret("WIRE_TEST_SECRET", async () => ({})), undefined);
    assert.equal(await getRuntimeSecret("WIRE_TEST_SECRET", async () => null), "obsolete");
  } finally {
    delete process.env.WIRE_TEST_SECRET;
  }
});

test("401 Groq moves to Gemini with the same evidence and no key in the URL", async () => {
  const calls = [];
  const result = await generateText(input, {
    secret,
    fetch: async (url, opts) => {
      calls.push({ url, body: JSON.parse(opts.body), headers: opts.headers });
      return url.includes("groq.com")
        ? new Response("provider-secret-in-error", { status: 401 })
        : Response.json({
            candidates: [{ content: { parts: [{ text: '{"headline":"Fato confirmado"}' }] } }],
          });
    },
  });
  assert.equal(result.provider, "gemini");
  assert.equal(calls.length, 2);
  assert.equal(calls[1].body.contents[0].parts[0].text, input.messages[0].content);
  assert.equal(calls[1].body.systemInstruction.parts[0].text, input.system);
  assert.equal(calls[1].body.generationConfig.responseMimeType, "application/json");
  assert.ok(!calls[1].url.includes("gemini-test-secret"));
});

test("quota failures move to Claude once, with bounded output", async () => {
  const calls = [];
  const result = await generateText(
    { ...input, maxTokens: 50_000 },
    {
      secret,
      fetch: async (url, opts) => {
        calls.push(JSON.parse(opts.body));
        return url.includes("anthropic.com")
          ? Response.json({ content: [{ type: "text", text: "Resposta" }] })
          : new Response("quota", { status: 429 });
      },
    },
  );
  assert.equal(result.provider, "anthropic");
  assert.equal(calls.length, 3);
  assert.equal(calls[2].max_tokens, 1800);
  assert.equal(calls[2].system, input.system);
});

test("no configured provider makes no network requests", async () => {
  await assert.rejects(
    generateText(input, {
      secret: async () => undefined,
      fetch: async () => {
        assert.fail("must not fetch");
      },
    }),
    /não configurado/,
  );
});

test("all providers failing reports statuses without provider bodies or credentials", async () => {
  await assert.rejects(
    generateText(input, {
      secret,
      fetch: async () => new Response("groq-test-secret PRIVATE", { status: 401 }),
    }),
    (error) => {
      assert.match(error.message, /groq: HTTP 401; gemini: HTTP 401; anthropic: HTTP 401/);
      assert.doesNotMatch(error.message, /PRIVATE|test-secret/);
      return true;
    },
  );
});

test("successful Groq stops fallback, Gemini thinking is never shown", async () => {
  let calls = 0;
  const result = await generateText(input, {
    secret,
    fetch: async () => {
      calls++;
      return Response.json({ choices: [{ message: { content: "OK" } }] });
    },
  });
  assert.equal(result.provider, "groq");
  assert.equal(calls, 1);
  const gemini = await generateText(input, {
    secret: async (name) => (name === "GEMINI_API_KEY" ? "key" : undefined),
    fetch: async () =>
      Response.json({
        candidates: [
          { content: { parts: [{ thought: true, text: "internal" }, { text: "Answer" }] } },
        ],
      }),
  });
  assert.equal(gemini.text, "Answer");
});
