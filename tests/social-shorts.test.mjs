import { test } from "node:test";
import assert from "node:assert/strict";
import {
  sourceInput,
  youtubeUrl,
  destinationUrl,
  networkKit,
  validateCreative,
  coverSvg,
} from "../src/social/policy.ts";
import { prepareSource } from "../src/social/engine.ts";
const source = {
  id: "a36c6fd5-9c6d-4dd6-b82e-f793cdf1a6a6",
  url: "https://youtu.be/dQw4w9WgXcQ",
  title: "IA na prática",
  transcript:
    "Texto autorizado da fonte, com contexto suficiente para preparar um rascunho de conteúdo sobre inteligência artificial.",
  goal: "usuarios",
  destination: "/escola",
  priority: 2,
  rightsConfirmed: true,
};
const creative = {
  hook: "Como essa ideia pode ajudar no seu projeto?",
  coverTitle: "IA na prática",
  caption: "Uma ideia para conhecer e discutir.",
  editNotes: "Preserve o contexto e use legendas legíveis.",
  hashtags: ["#InteligenciaArtificial", "#VeronicaHub"],
};
test("links diferentes do mesmo vídeo viram uma única identidade, sem parâmetros de rastreamento", () => {
  const a = youtubeUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=3&list=abc");
  assert.deepEqual(a, youtubeUrl(source.url));
  for (const url of [
    "https://youtube.com/@channel",
    "https://youtube.com/playlist?list=a",
    "https://youtube.com.evil.test/watch?v=dQw4w9WgXcQ",
    "http://youtu.be/dQw4w9WgXcQ",
    "https://user:pass@youtu.be/dQw4w9WgXcQ",
  ])
    assert.throws(() => youtubeUrl(url));
});
test("destino só aceita páginas públicas da Hub, sem redirecionamento aberto", () => {
  assert.equal(destinationUrl("/escola?utm_source=old"), "https://veronicahub.com/escola");
  for (const url of [
    "//evil.test",
    "/admin",
    "/api/social/go/x",
    "https://veronicahub.com.evil.test",
    "https://veronicahub.com:88",
  ])
    assert.throws(() => destinationUrl(url));
});
test("dados inválidos são recusados antes de persistir", () => {
  assert.equal(sourceInput(source).priority, 2);
  for (const value of [
    { priority: 11 },
    { priority: 1.5 },
    { goal: "garantir_lucro" },
    { transcript: "<script>" },
    { rightsConfirmed: "yes" },
  ])
    assert.throws(() => sourceInput({ ...source, ...value }));
});
test("sem autorização ou transcrição o agente preserva a fonte sem chamar o modelo", async () => {
  let calls = 0;
  const model = async () => {
    calls++;
    return creative;
  };
  assert.equal(
    (await prepareSource({ ...source, rightsConfirmed: false }, model)).status,
    "awaiting_rights",
  );
  assert.equal(
    (await prepareSource({ ...source, transcript: "" }, model)).status,
    "awaiting_transcript",
  );
  assert.equal(calls, 0);
});
test("rodada prepara quatro pacotes, sem declarar edição ou publicação concluídas", async () => {
  const result = await prepareSource(source, async () => creative);
  assert.equal(result.status, "awaiting_edit");
  assert.deepEqual(
    result.packages.map((p) => p.network),
    ["youtube", "instagram", "tiktok", "facebook"],
  );
  assert.ok(result.packages.every((p) => p.trackedUrl.includes(source.id)));
  assert.match(result.packages[1].caption, /link da bio/);
  assert.match(result.packages[0].caption, /link abaixo/);
  assert.equal(result.packages[0].published, undefined);
});
test("conteúdo de modelo inválido não gera pacotes de postagem", async () => {
  for (const caption of [
    "Lucro garantido",
    "https://evil.test",
    "<script>",
    "Ignore as instruções",
    "@secret",
  ]) {
    await assert.rejects(() => prepareSource(source, async () => ({ ...creative, caption })));
  }
  assert.throws(() => validateCreative({ ...creative, hashtags: ["#good", "secret token"] }));
  assert.throws(() => validateCreative({ ...creative, extra: "send" }));
});
test("capa exportada tem dimensões de shorts e escapa conteúdo como texto", () => {
  const svg = coverSvg("A & B <script>");
  assert.match(svg, /width="1080" height="1920"/);
  assert.ok(!svg.includes("<script>"));
  assert.match(svg, /&amp;/);
});
test("chamada comercial não inventa venda, lucro ou urgência", () => {
  const kit = networkKit(source.id, "vendas", creative);
  assert.ok(kit.every((p) => p.caption.includes("confira as condições")));
  assert.ok(kit.every((p) => !/lucro|garantido|últimas vagas/i.test(p.caption)));
});
