import assert from "node:assert/strict";
import test from "node:test";
import {
  contactHref,
  createPersonalDraft,
  emptyBrief,
  parseStoredBrief,
  reviewDraft,
  serializeBrief,
} from "../src/portfolio/features/generator/personal-brief.ts";

test("a minimal personal portfolio never acquires fictional achievements", () => {
  const draft = createPersonalDraft({ ...emptyBrief(), name: "  Marina  " });
  assert.equal(draft.ownerName, "Marina");
  assert.equal(draft.headline, "Marina · Designer");
  assert.deepEqual(draft.projects, []);
  assert.deepEqual(draft.skills, []);
  for (const field of ["about", "experience", "education", "proof", "contact"])
    assert.equal(draft[field], "");
  assert.equal(reviewDraft(draft).filter((item) => item.complete).length, 0);
});

test("supplied work is preserved without embellishment and skills are deduplicated", () => {
  const brief = {
    ...emptyBrief(),
    name: "Marina",
    about: "Identidade visual para negócios locais.",
    skills: "Pesquisa, Design; Pesquisa\nFotografia",
    contact: "marina@example.com",
    projects: [
      {
        title: " Projeto autoral ",
        description: "Fiz a pesquisa e o desenho.",
        result: "Apresentado na faculdade.",
      },
    ],
  };
  const draft = createPersonalDraft(brief);
  assert.equal(draft.projects[0].title, "Projeto autoral");
  assert.equal(draft.projects[0].result, brief.projects[0].result);
  assert.deepEqual(draft.skills, ["Pesquisa", "Design", "Fotografia"]);
  assert.equal(reviewDraft(draft).filter((item) => item.complete).length, 5);
  assert.equal(brief.projects[0].title, " Projeto autoral ");
});

test("incomplete or malformed identity and project data is rejected", () => {
  assert.throws(() => createPersonalDraft(emptyBrief()), /nome/);
  assert.throws(
    () => createPersonalDraft({ ...emptyBrief(), name: "A", profession: " " }),
    /profissional/,
  );
  assert.throws(
    () =>
      createPersonalDraft({
        ...emptyBrief(),
        name: "A",
        projects: [
          { title: "", description: "Trabalho sem título", result: "" },
        ],
      }),
    /título/,
  );
  assert.throws(
    () =>
      createPersonalDraft({
        ...emptyBrief(),
        name: "A",
        contact: "não é email",
      }),
    /e-mail/,
  );
});

test("browser briefing serialization is versioned and omits unexpected fields", () => {
  const brief = { ...emptyBrief(), name: "Marina", about: "Linha 1\nLinha 2" };
  assert.deepEqual(parseStoredBrief(serializeBrief(brief)), brief);
  const raw = JSON.stringify({
    version: 1,
    brief: {
      ...brief,
      admin: true,
      projects: [{ ...brief.projects[0], href: "javascript:alert(1)" }],
    },
  });
  const restored = parseStoredBrief(raw);
  assert.equal("admin" in restored, false);
  assert.equal("href" in restored.projects[0], false);
});

test("corrupt, oversized and incompatible browser storage is rejected", () => {
  for (const raw of [
    "not JSON",
    "null",
    "[]",
    JSON.stringify({ version: 2, brief: emptyBrief() }),
    "x".repeat(20001),
  ])
    assert.throws(() => parseStoredBrief(raw));
  for (const brief of [
    { ...emptyBrief(), name: 123 },
    { ...emptyBrief(), about: "x".repeat(1601) },
    { ...emptyBrief(), projects: [] },
    {
      ...emptyBrief(),
      projects: Array(4).fill({ title: "", description: "", result: "" }),
    },
    { ...emptyBrief(), projects: [null] },
  ])
    assert.throws(() =>
      parseStoredBrief(JSON.stringify({ version: 1, brief })),
    );
});

test("contact links cannot inject a URL scheme, query or email header", () => {
  for (const value of [
    "javascript:alert(1)",
    "https://example.com",
    "a@example.com?bcc=b@example.com",
    "a@example.com\r\nBcc:b@example.com",
    "",
  ])
    assert.equal(contactHref(value), undefined);
  assert.equal(
    contactHref("ana+portfolio@example.com"),
    "mailto:ana%2Bportfolio%40example.com",
  );
});
