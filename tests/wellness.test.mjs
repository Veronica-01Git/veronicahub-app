import test from "node:test";
import assert from "node:assert/strict";
import { assessmentSchema, buildGuide, workoutSchema } from "../src/features/wellness/guide.ts";
const valid = {
  professional: "lz-team",
  name: "Mariana",
  goal: "Glúteos",
  days: 3,
  minutes: 45,
  experience: "Começando",
  location: "Academia",
  challenge: "Tempo disponível",
  limitations: "",
  needsReview: false,
  adult: true,
  consent: true,
};
test("assessment requires explicit adult and service consent and validates limits", () => {
  for (const patch of [
    { consent: false },
    { adult: false },
    { days: 0 },
    { days: 8 },
    { minutes: 200 },
    { professional: "express-entulho" },
    { goal: "invalid" },
  ]) {
    assert.equal(assessmentSchema.safeParse({ ...valid, ...patch }).success, false);
  }
  assert.equal(assessmentSchema.parse({ ...valid, name: "  Mariana  " }).name, "Mariana");
});
test("guide reflects actual name, objective, availability and difficulty", () => {
  const guide = buildGuide(assessmentSchema.parse(valid));
  assert.match(guide.title, /Mariana/);
  assert.equal(guide.goal, "Glúteos");
  assert.match(guide.routine, /3 dias.*45 minutos.*Academia/);
  assert.ok(guide.steps.some((s) => s.includes(valid.challenge)));
  assert.equal(guide.review, false);
});
test("reported pain or limitations always routes to professional assessment", () => {
  for (const patch of [{ needsReview: true }, { limitations: "Dor no joelho" }]) {
    const guide = buildGuide({ ...valid, ...patch });
    assert.equal(guide.review, true);
    assert.match(guide.next, /antes de iniciar um novo treino/);
  }
});
test("personal plans require bounded structured activities", () => {
  assert.equal(
    workoutSchema.safeParse({ title: "Plano", notes: "", exercises: [] }).success,
    false,
  );
  assert.equal(
    workoutSchema.safeParse({
      title: "Plano",
      notes: "",
      exercises: [{ name: "Atividade revisada", sets: "3", reps: "10", guidance: "" }],
    }).success,
    true,
  );
});
