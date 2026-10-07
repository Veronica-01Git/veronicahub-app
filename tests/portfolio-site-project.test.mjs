import assert from "node:assert/strict";
import test from "node:test";
import { siteProjectMessage } from "../src/portfolio/features/site-project.ts";

const project = {
  product: "portfolio",
  delivery: "Site publicado",
  features: ["Galeria de projetos"],
  goal: "Apresentar meus projetos",
};

test("site proposal reflects selected product, delivery and scope without quoting an invented price", () => {
  const message = siteProjectMessage({
    ...project,
    product: "platform",
    delivery: "Evolução de um site existente",
    features: ["Área de membros", "Agente de IA"],
  });
  assert.match(message, /Plataforma personalizada/);
  assert.match(message, /Evolução de um site existente/);
  assert.match(message, /Área de membros, Agente de IA/);
  assert.match(message, /escopo, tecnologias, prazo e investimento antes de contratar/);
  assert.doesNotMatch(message, /R\$/);
});

test("proposal cannot silently include portfolio content or unsupported features", () => {
  const message = siteProjectMessage({
    ...project,
    features: ["Galeria de projetos", "Galeria de projetos", "private-token"],
    contact: "private@example.com",
    projects: [{ title: "Private brief" }],
  });
  assert.equal((message.match(/Galeria de projetos/g) || []).length, 1);
  assert.doesNotMatch(message, /private-token|private@example|Private brief/);
  assert.throws(() => siteProjectMessage({ ...project, product: "unexpected" }), /inválido/);
  assert.throws(() => siteProjectMessage({ ...project, delivery: "unexpected" }), /inválido/);
});

test("proposal goal is bounded and link-safe while preserving Portuguese text", () => {
  const message = siteProjectMessage({
    ...project,
    goal: "Objetivo & criação?\n" + "x".repeat(800),
  });
  const goal = message.split("\n").find((line) => line.startsWith("Objetivo:"));
  assert.ok(goal.length <= 610);
  assert.equal(decodeURIComponent(encodeURIComponent(message)), message);
  assert.match(message, /Objetivo & criação\?/);
});
