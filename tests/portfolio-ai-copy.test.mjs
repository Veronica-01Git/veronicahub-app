import assert from "node:assert/strict";
import test from "node:test";
import { applyAiCopy, validateAiBrief } from "../src/portfolio/features/generator/ai-copy.ts";
import { emptyBrief } from "../src/portfolio/features/generator/personal-brief.ts";

const brief = {
  ...emptyBrief(),
  name: "Marina",
  about: "Crio identidades visuais para pequenos negócios.",
  contact: "marina@example.com",
  projects: [{ title: "Marca Aurora", description: "Pesquisa e desenho da marca.", result: "Entregue em 2024." }],
};

test("requires source material before charging a generation", () => {
  assert.throws(() => validateAiBrief({ ...emptyBrief(), name: "Marina" }), /Conte sobre/);
  assert.equal(validateAiBrief(brief).name, "Marina");
});

test("AI changes presentation only and preserves factual fields", () => {
  const draft = applyAiCopy(brief, JSON.stringify({ headline: "Design que traduz sua essência", about: "Desenvolvo identidades visuais com pesquisa." }));
  assert.equal(draft.headline, "Design que traduz sua essência");
  assert.equal(draft.projects[0].result, "Entregue em 2024.");
  assert.equal(draft.contact, "marina@example.com");
  assert.equal(draft.ownerName, "Marina");
});

test("rejects unsupported numbers and incomplete model output", () => {
  assert.throws(() => applyAiCopy(brief, JSON.stringify({ headline: "20 anos de experiência", about: "Sou designer." })), /número/);
  assert.throws(() => applyAiCopy(brief, '{"headline":"Olá"}'), /limites/);
});
