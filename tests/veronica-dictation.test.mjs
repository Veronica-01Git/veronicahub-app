import test from "node:test";
import assert from "node:assert/strict";
import {
  validateDictation,
  mergeDictation,
  MAX_AUDIO_BYTES,
} from "../src/veronica/conversation/dictation-core.ts";
const form = (type = "audio/webm", seconds = "3", size = 100) => {
  const d = new FormData();
  d.set("audio", new Blob([new Uint8Array(size)], { type }), "prompt.webm");
  d.set("seconds", seconds);
  return d;
};
test("dictation rejects empty, oversized, non-audio and unbounded recordings", () => {
  for (const input of [
    null,
    form("text/html"),
    form("audio/webm", "601"),
    form("audio/webm", "NaN"),
    form("audio/webm", "0"),
    form("audio/webm", "3", 0),
    form("audio/webm", "3", MAX_AUDIO_BYTES + 1),
  ])
    assert.throws(() => validateDictation(input));
  assert.equal(validateDictation(form("audio/webm;codecs=opus")).type, "audio/webm");
  assert.equal(validateDictation(form("audio/mp4")).type, "audio/mp4");
});
test("dictation preserves the typed draft and refuses silent truncation", () => {
  assert.equal(mergeDictation("Minha ideia:", "criar um site"), "Minha ideia: criar um site");
  assert.equal(mergeDictation("", " oi "), "oi");
  assert.equal(mergeDictation("a".repeat(15999), "b"), null);
});

import {
  allowDictation,
  transcribeDictation,
} from "../src/veronica/conversation/dictation.server.ts";
test("transcription keeps credentials server-side and sends a bounded Portuguese audio request", async () => {
  let calls = 0;
  const r = await transcribeDictation(form(), {
    secret: async () => "test-secret",
    fetch: async (url, options) => {
      calls++;
      assert.equal(url, "https://api.groq.com/openai/v1/audio/transcriptions");
      assert.equal(options.headers.Authorization, "Bearer test-secret");
      assert.equal(options.body.get("language"), "pt");
      assert.equal(options.body.get("model"), "whisper-large-v3-turbo");
      assert.equal(options.body.get("file").name, "prompt.webm");
      return Response.json({ text: " Criar um site. " });
    },
  });
  assert.deepEqual(r, { ok: true, text: "Criar um site." });
  assert.equal(calls, 1);
});
test("provider failures expose only safe errors and never pretend to transcribe", async () => {
  for (const response of [
    new Response("private provider body", { status: 429 }),
    Response.json({ text: "" }),
    Response.json({ text: "a".repeat(16001) }),
  ]) {
    const r = await transcribeDictation(form(), {
      secret: async () => "test-secret",
      fetch: async () => response,
    });
    assert.equal(r.ok, false);
    assert.ok(!JSON.stringify(r).includes("private provider body"));
  }
  let called = false;
  const r = await transcribeDictation(form(), {
    secret: async () => undefined,
    fetch: async () => {
      called = true;
    },
  });
  assert.equal(r.ok, false);
  assert.equal(called, false);
  await assert.rejects(
    () =>
      transcribeDictation(form("text/html"), {
        secret: async () => {
          throw new Error("should not reach secret");
        },
        fetch: async () => {},
      }),
    /Formato/,
  );
});
test("dictation burst governor resets after its window", () => {
  const key = crypto.randomUUID(),
    now = Date.now();
  for (let i = 0; i < 4; i++) assert.equal(allowDictation(key, now), true);
  assert.equal(allowDictation(key, now), false);
  assert.equal(allowDictation(key, now + 60001), true);
});

test("Gemini fallback transcribes when Groq refuses without exposing either credential", async () => {
  let calls = 0;
  const result = await transcribeDictation(form("audio/wav"), {
    secret: async (name) => (name === "GROQ_API_KEY" ? "groq-test" : "gemini-test"),
    fetch: async (url, options) => {
      calls++;
      if (url.includes("groq.com")) return new Response("", { status: 403 });
      const body = JSON.parse(options.body);
      assert.equal(options.headers["x-goog-api-key"], "gemini-test");
      assert.equal(body.contents[0].parts[0].inlineData.mimeType, "audio/wav");
      return Response.json({
        candidates: [{ content: { parts: [{ text: "quero criar um site" }] } }],
      });
    },
  });
  assert.deepEqual(result, { ok: true, text: "quero criar um site" });
  assert.equal(calls, 2);
});

test("five and seven minute recordings preserve transcripts longer than the old composer limit", async () => {
  const transcript = "Uma ideia completa para a Veronica. ".repeat(200);
  for (const seconds of [300, 420, 600]) {
    const audio = form("audio/webm", String(seconds));
    assert.equal(validateDictation(audio).type, "audio/webm");
    const result = await transcribeDictation(audio, {
      secret: async () => "test-key",
      fetch: async () => Response.json({ text: transcript }),
    });
    assert.deepEqual(result, { ok: true, text: transcript.trim() });
    const merged = mergeDictation("Contexto:", result.text);
    const { validateConversation } = await import("../src/veronica/conversation/core.ts");
    assert.equal(validateConversation({ message: merged }).message, merged);
  }
});

test("Gemini token exhaustion never sends a partial transcription as a complete prompt", async () => {
  const result = await transcribeDictation(form("audio/webm", "420"), {
    secret: async (name) => (name === "GEMINI_API_KEY" ? "test-key" : undefined),
    fetch: async () =>
      Response.json({
        candidates: [
          {
            finishReason: "MAX_TOKENS",
            content: { parts: [{ text: "transcrição parcial" }] },
          },
        ],
      }),
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /incompleta/);
});
