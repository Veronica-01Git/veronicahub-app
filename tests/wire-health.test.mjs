import { test } from "node:test";
import assert from "node:assert/strict";
import { handleWireHealth } from "../src/lib/wire-health.server.ts";

test("operator probe denies missing or wrong auth before calling the model", async () => {
  const deps = {
    secret: async () => "test-auth",
    generate: async () => assert.fail("unauthorized model call"),
  };
  for (const method of ["GET", "POST"]) {
    const res = await handleWireHealth(
      new Request("https://example.com/api/cron/wire-health", { method }),
      deps,
    );
    assert.equal(res.status, 401);
  }
});

test("readiness checks incur no generation cost; POST returns only safe provider metadata", async () => {
  let calls = 0;
  const deps = {
    secret: async () => "test-auth",
    generate: async () => {
      calls++;
      return { text: "PRIVATE", provider: "gemini", model: "gemini-2.5-flash-lite" };
    },
  };
  const headers = { authorization: "Bearer test-auth" };
  const get = await handleWireHealth(
    new Request("https://example.com/api/cron/wire-health", { headers }),
    deps,
  );
  assert.equal((await get.json()).revision, "wire-recovery-v1");
  assert.equal(calls, 0);
  const post = await handleWireHealth(
    new Request("https://example.com/api/cron/wire-health", { method: "POST", headers }),
    deps,
  );
  assert.equal(post.status, 200);
  assert.equal(post.headers.get("cache-control"), "no-store");
  const data = await post.json();
  assert.equal(data.provider, "gemini");
  assert.ok(!JSON.stringify(data).includes("PRIVATE"));
  assert.equal(calls, 1);
});
