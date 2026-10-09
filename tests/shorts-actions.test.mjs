import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const workflow = read(".github/workflows/shorts-render.yml");
const worker = read("workers/shorts-engine/worker.py");
const requirements = read("workers/shorts-engine/requirements.txt");

test("processador no Actions: só leitura, um por vez, com teto de tempo", () => {
  assert.match(workflow, /permissions:\n {2}contents: read/);
  assert.match(workflow, /group: shorts-render\n {2}cancel-in-progress: false/);
  const timeout = Number(workflow.match(/timeout-minutes: (\d+)/)[1]);
  assert.ok(timeout > 0 && timeout <= 150);
  assert.match(workflow, /python worker\.py --drain/);
});

test("fila é consultada antes de instalar ou baixar qualquer coisa", () => {
  const preflight = workflow.indexOf("/api/social/render/pending");
  assert.ok(preflight > 0);
  assert.ok(preflight < workflow.indexOf("actions/checkout"));
  assert.ok(preflight < workflow.indexOf("apt-get install"));
  // Every expensive step is gated on queued work.
  const gated =
    workflow.match(/if: (always\(\) && )?steps\.pending\.outputs\.work == 'true'/g) ?? [];
  assert.ok(gated.length >= 6);
});

test("logs públicos não expõem segredos, transcrição nem URLs de mídia", () => {
  assert.doesNotMatch(workflow, /set -x|echo .*\$\{\{ *secrets\./);
  for (const line of worker.split("\n").filter((l) => l.includes("print("))) {
    assert.doesNotMatch(line, /job\[|mediaBase|\burl\b|\bwords\b|\btext\b|print\(segments/);
  }
  // Error text goes through safe(), which masks the IDs that form media URLs.
  assert.match(worker, /print\(issue, safe\(error\)/);
});

test("arquivo original enviado pela operadora vem de bucket privado", () => {
  assert.match(workflow, /SHORTS_SOURCE_BUCKET: veronicahub-shorts-sources/);
  assert.doesNotMatch(workflow, /SHORTS_SOURCE_BUCKET: veronicahub-shorts\n/);
});

test("download do YouTube inclui o runtime JavaScript exigido", () => {
  assert.match(requirements, /^deno==/m);
  assert.match(requirements, /^yt-dlp-ejs==/m);
  assert.match(requirements, /^yt-dlp\[default\]==/m);
});
