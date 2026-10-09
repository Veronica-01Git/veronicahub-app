import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  HUB_MEDIA_BASE,
  clipKeyFromUrl,
  isClipKey,
  parseRange,
  signScope,
  signedClipPath,
  sourceKey,
  verifyScope,
} from "../src/social/media-policy.ts";
import { validateArtifacts, validatePlan } from "../src/social/render-policy.ts";

const src = "a36c6fd5-9c6d-4dd6-b82e-f793cdf1a6a6";
const job = "b36c6fd5-9c6d-4dd6-b82e-f793cdf1a6a6";
const key = `shorts/${src}/${job}/0.mp4`;
const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("links assinados valem só para o arquivo, o prazo e o segredo certos", async () => {
  const now = Math.floor(Date.now() / 1000);
  const sig = await signScope("s3cret", `clip:${key}`, now + 600);
  assert.equal(sig.length, 43);
  assert.equal(await verifyScope("s3cret", `clip:${key}`, now + 600, sig), true);
  assert.equal(await verifyScope("outro", `clip:${key}`, now + 600, sig), false);
  assert.equal(
    await verifyScope("s3cret", `clip:${key.replace("0.mp4", "1.mp4")}`, now + 600, sig),
    false,
  );
  assert.equal(await verifyScope("s3cret", `upload:${key}`, now + 600, sig), false);
  assert.equal(await verifyScope("s3cret", `clip:${key}`, now + 601, sig), false);
  assert.equal(
    await verifyScope(
      "s3cret",
      `clip:${key}`,
      now - 1,
      await signScope("s3cret", `clip:${key}`, now - 1),
    ),
    false,
  );
  // Long-lived links are refused even when correctly signed.
  const far = now + 3 * 24 * 3600;
  assert.equal(
    await verifyScope("s3cret", `clip:${key}`, far, await signScope("s3cret", `clip:${key}`, far)),
    false,
  );
  const path = await signedClipPath("s3cret", key);
  assert.match(path, new RegExp(`^/api/social/media/${key}\\?exp=\\d+&sig=[\\w-]{43}$`));
});

test("só caminhos de corte e IDs de vídeo válidos são aceitos", () => {
  assert.equal(isClipKey(key), true);
  for (const bad of [
    `shorts/${src}/${job}/3.mp4`,
    `shorts/${src}/../0.mp4`,
    `${src}/${job}/0.mp4`,
    `shorts/x/${job}/0.mp4`,
  ])
    assert.equal(isClipKey(bad), false);
  assert.equal(sourceKey("V1Fq4psulqU"), "V1Fq4psulqU.mp4");
  assert.throws(() => sourceKey("../etc/pass"));
});

test("URL guardada pela Hub passa na validação de artefatos e vira a chave do bucket", () => {
  const creative = {
    hook: "Como funciona?",
    coverTitle: "IA",
    caption: "Que uso você faria?",
    editNotes: "Contexto.",
    hashtags: ["#IA"],
  };
  const candidate = {
    id: 0,
    start: 10,
    end: 40,
    text: "Uma explicação completa sobre agentes de inteligência artificial.",
  };
  const plan = validatePlan(
    { clips: [{ candidateId: 0, creative }] },
    [candidate],
    src,
    "usuarios",
  );
  const url = `${HUB_MEDIA_BASE}/${src}/${job}/0.mp4`;
  const [clip] = validateArtifacts(
    [{ url, width: 1080, height: 1920, duration: 30 }],
    HUB_MEDIA_BASE,
    src,
    job,
    plan,
  );
  assert.equal(clipKeyFromUrl(clip.url), key);
  assert.equal(clipKeyFromUrl("https://media.veronicahub.com/shorts/x.mp4"), null);
});

test("Range permite avançar o vídeo sem servir bytes fora do arquivo", () => {
  assert.deepEqual(parseRange("bytes=0-99", 1000), { offset: 0, length: 100, end: 99 });
  assert.deepEqual(parseRange("bytes=900-", 1000), { offset: 900, length: 100, end: 999 });
  assert.deepEqual(parseRange("bytes=-100", 1000), { offset: 900, length: 100, end: 999 });
  assert.deepEqual(parseRange("bytes=0-5000", 1000), { offset: 0, length: 1000, end: 999 });
  assert.equal(parseRange("bytes=2000-", 1000), "unsatisfiable");
  assert.equal(parseRange("bytes=0-1,5-9", 1000), null);
  assert.equal(parseRange(null, 1000), null);
});

test("rotas privadas verificam assinatura, sessão de admin e tamanho antes do armazenamento", () => {
  const media = read("src/social/media.server.ts");
  const serve = media.slice(
    media.indexOf("export async function handleMedia"),
    media.indexOf("export async function handleSourceUpload"),
  );
  assert.ok(serve.indexOf("verifyScope") < serve.indexOf("mediaBucket()"));
  const upload = media.slice(media.indexOf("export async function handleSourceUpload"));
  assert.ok(upload.indexOf("verifyScope") < upload.indexOf("createMultipartUpload"));
  assert.match(upload, /size > MAX_PART_BYTES/);
  assert.match(upload, /object\.size > MAX_SOURCE_BYTES/);
  const commands = read("src/social/server.ts");
  assert.ok(commands.indexOf("requireAdmin()") < commands.indexOf("sourceUploadLink("));
  const api = read("src/social/render.server.ts");
  assert.match(api, /SOCIAL_RENDER_SECRET"\)\) \?\? \(await getRuntimeSecret\("CRON_SECRET"\)\)/);
  const render = api.slice(
    api.indexOf("async function handleRenderMedia"),
    api.indexOf("export async function handleRender"),
  );
  assert.ok(render.indexOf("leasedJob(") < render.indexOf("sourcesBucket()"));
  assert.match(render, /size > MAX_PART_BYTES/);
  assert.match(render, /stored\.size !== size/);
});

test("Worker do site declara os buckets privados, sem domínio público", () => {
  const config = read("wrangler.jsonc");
  assert.match(config, /"binding": "SHORTS_MEDIA", "bucket_name": "veronicahub-shorts"/);
  assert.match(config, /"binding": "SHORTS_SOURCES", "bucket_name": "veronicahub-shorts-sources"/);
});
