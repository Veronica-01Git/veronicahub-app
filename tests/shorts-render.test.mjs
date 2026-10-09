import { test } from "node:test";
import assert from "node:assert/strict";
import {
  validateCandidates,
  validatePlan,
  mediaBase,
  validateArtifacts,
} from "../src/social/render-policy.ts";
const candidate = {
  id: 0,
  start: 12,
  end: 42,
  text: "Uma explicação completa sobre ferramentas de inteligência artificial.",
};
const creative = {
  hook: "Como funciona essa ferramenta?",
  coverTitle: "IA na prática",
  caption: "Que uso você faria dessa ideia?",
  editNotes: "Preserve o contexto.",
  hashtags: ["#IA"],
};
const sourceId = "a36c6fd5-9c6d-4dd6-b82e-f793cdf1a6a6";
const jobId = "b36c6fd5-9c6d-4dd6-b82e-f793cdf1a6a6";
test("candidatos recusam tempos fora do vídeo, duplicação e transcrição ilimitada", () => {
  assert.deepEqual(validateCandidates([candidate]), [candidate]);
  for (const input of [
    [],
    [candidate, candidate],
    [{ ...candidate, end: 4000 }],
    [{ ...candidate, start: NaN }],
    [{ ...candidate, end: 20 }],
    [{ ...candidate, text: "x".repeat(1801) }],
  ])
    assert.throws(() => validateCandidates(input));
});
test("modelo escolhe somente trechos reais e nunca inventa os timestamps", () => {
  const result = validatePlan(
    { clips: [{ candidateId: 0, creative }] },
    [candidate],
    sourceId,
    "usuarios",
  );
  assert.equal(result[0].start, 12);
  assert.equal(result[0].end, 42);
  assert.equal(result[0].packages.length, 4);
  assert.throws(() =>
    validatePlan({ clips: [{ candidateId: 9, creative }] }, [candidate], sourceId, "usuarios"),
  );
  // A repeated/overlapping pick is dropped; the valid one is kept.
  const deduped = validatePlan(
    {
      clips: [
        { candidateId: 0, creative },
        { candidateId: 0, creative },
      ],
    },
    [candidate],
    sourceId,
    "usuarios",
  );
  assert.equal(deduped.length, 1);
  assert.throws(() =>
    validatePlan(
      { clips: [{ candidateId: 0, creative: { ...creative, caption: "Lucro garantido" } }] },
      [candidate],
      sourceId,
      "usuarios",
    ),
  );
});
test("conclusão exige todos os arquivos, dimensões e duração compatíveis com o plano", () => {
  const plan = validatePlan(
    { clips: [{ candidateId: 0, creative }] },
    [candidate],
    sourceId,
    "cliques",
  );
  const base = mediaBase("https://media.veronicahub.com/shorts/");
  const artifact = {
    url: `${base}/${sourceId}/${jobId}/0.mp4`,
    width: 1080,
    height: 1920,
    duration: 30,
  };
  assert.equal(validateArtifacts([artifact], base, sourceId, jobId, plan).length, 1);
  for (const input of [
    [],
    [{ ...artifact, url: "https://evil.test/a.mp4" }],
    [{ ...artifact, height: 1080 }],
    [{ ...artifact, duration: 90 }],
  ])
    assert.throws(() => validateArtifacts(input, base, sourceId, jobId, plan));
  assert.throws(() => mediaBase("http://localhost"));
});

test("seleção tolera formato do modelo sem afrouxar as regras de segurança", async () => {
  const { normalizeCreative } = await import("../src/social/render-policy.ts");
  const second = { ...candidate, id: 1, start: 50, end: 80 };
  const plan = validatePlan(
    {
      clips: [
        {
          candidateId: 0,
          creative: {
            ...creative,
            coverTitle:
              "Um título bem mais longo do que setenta caracteres para caber na capa vertical",
            hashtags: ["IA", "#Automação", "#com espaço", "#x", "#a", "#b", "#c", "#d"],
            extra: "campo a mais",
          },
        },
        { candidateId: 1, creative: { ...creative, caption: "Siga @alguem" } },
      ],
    },
    [candidate, second],
    sourceId,
    "usuarios",
  );
  assert.equal(plan.length, 1);
  assert.ok(plan[0].creative.coverTitle.length <= 70);
  assert.ok(plan[0].creative.hashtags.length <= 5);
  assert.ok(plan[0].creative.hashtags.every((h) => /^#[\p{L}\p{N}_]{2,40}$/u.test(h)));
  assert.equal(normalizeCreative({ ...creative, editNotes: undefined }).editNotes.length > 0, true);
  assert.throws(
    () =>
      validatePlan(
        { clips: [{ candidateId: 0, creative: { ...creative, caption: "veja https://x.y" } }] },
        [candidate],
        sourceId,
        "usuarios",
      ),
    /INVALID_PLAN/,
  );
});

test("teto de custo da seleção cobre o pior caso estimado pelo próprio adaptador", async () => {
  const { PLAN_LIMITS, PLAN_SYSTEM, validateCandidates } =
    await import("../src/social/render-policy.ts");
  const { createGeminiJsonAdapter } = await import("../src/lib/ai/adapters/gemini-json.ts");
  const text = "Explicação prática: automação com inteligência artificial é útil. ";
  const full = Array.from({ length: 8 }, (_, id) => ({
    id,
    start: id * 70,
    end: id * 70 + 59,
    text: text
      .repeat(30)
      .slice(0, id < 7 ? 1800 : 1400)
      .trim(),
  }));
  const input = JSON.stringify({ candidates: validateCandidates(full) });
  assert.ok(input.length + PLAN_SYSTEM.length <= PLAN_LIMITS.maxInputChars);
  const adapter = createGeminiJsonAdapter({ key: "k", system: PLAN_SYSTEM, ...PLAN_LIMITS });
  const estimate = adapter.estimateCostMicros({ capability: "LLM", input });
  assert.ok(estimate !== null && estimate <= PLAN_LIMITS.maxCostMicros, `estimate ${estimate}`);
});
