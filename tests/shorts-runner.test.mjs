import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const runner = read("workers/shorts-runner/src/index.ts");
const config = read("workers/shorts-runner/wrangler.jsonc");
const api = read("src/social/render.server.ts");

test("runner liga computação paga só com trabalho na fila e um processo por vez", () => {
  assert.match(runner, /if \(!queued && !running\)[\s\S]*?return;/);
  assert.match(config, /"max_instances": 1/);
  assert.match(config, /"workers_dev": false/);
  assert.match(runner, /sleepAfter = "15m"/);
  assert.match(config, /"\*\/5 \* \* \* \*"/);
});

test("segredos do processador nunca ficam no repositório", () => {
  for (const name of [
    "SOCIAL_RENDER_SECRET",
    "SHORTS_S3_ACCESS_KEY_ID",
    "SHORTS_S3_SECRET_ACCESS_KEY",
    "SHORTS_S3_ENDPOINT",
  ])
    assert.doesNotMatch(config, new RegExp(`"${name}":`));
});

test("consulta de fila exige o segredo e não altera trabalho nem publica", () => {
  const pending = api.slice(api.indexOf('action === "pending"'), api.indexOf('action === "claim"'));
  assert.ok(api.indexOf("Bearer ${secret}") < api.indexOf('action === "pending"'));
  assert.match(pending, /SELECT/);
  assert.doesNotMatch(pending, /UPDATE|INSERT|DELETE/);
  assert.doesNotMatch(runner, /publish|cadence|postagem/i);
});
