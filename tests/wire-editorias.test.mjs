import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  ACTIVE_BEATS,
  BEAT_LABELS,
  BEAT_VALUES,
  RETIRED_BEATS,
  ROTATION_BEATS,
} from "../src/lib/beats.ts";
import { parseBodyImage } from "../src/lib/blog-format.ts";

test("linha editorial de 27/09: rodízio só com os temas pedidos, e a casa fora dele", () => {
  assert.deepEqual([...ROTATION_BEATS], ["ia", "sc", "economia", "clima"]);
  // Conteúdo da Veronica Hub é escrito com a direção, nunca pautado sozinho.
  assert.ok(!ROTATION_BEATS.includes("veronica"));
  assert.ok(ACTIVE_BEATS.includes("veronica"));
  // Aposentadas continuam existindo para as matérias antigas, fora do menu.
  for (const beat of RETIRED_BEATS) {
    assert.ok(BEAT_VALUES.includes(beat));
    assert.ok(!ACTIVE_BEATS.includes(beat));
    assert.ok(!ROTATION_BEATS.includes(beat));
  }
  for (const beat of BEAT_VALUES) assert.ok(BEAT_LABELS[beat], `${beat} sem rótulo`);
});

test("o enum do banco e a migração cobrem as editorias novas", () => {
  const schema = readFileSync(new URL("../src/lib/schema.ts", import.meta.url), "utf8");
  const migracao = readFileSync(
    new URL("../drizzle/0016_wire_editorias_sc_veronica.sql", import.meta.url),
    "utf8",
  );
  for (const beat of ["sc", "veronica"]) {
    assert.match(schema, new RegExp(`"${beat}"`));
    assert.match(migracao, new RegExp(`ADD VALUE IF NOT EXISTS '${beat}'`));
  }
});

test("Santa Catarina é apurada nos portais catarinenses", () => {
  const server = readFileSync(new URL("../src/lib/articles-server.ts", import.meta.url), "utf8");
  for (const portal of ["ndmais.com.br", "nsctotal.com.br"]) {
    assert.ok(server.includes(portal), `${portal} fora do radar de SC`);
  }
});

test("o cron não gera matéria da casa nem de editoria aposentada", () => {
  const cron = readFileSync(new URL("../src/lib/article-cron.ts", import.meta.url), "utf8");
  assert.match(cron, /ROTATION_BEATS/);
  assert.doesNotMatch(cron, /BEAT_VALUES/);
});

test("imagem no corpo: só arquivo do próprio site, parágrafo inteiro", () => {
  assert.deepEqual(parseBodyImage("![Legenda da foto](/images/wire-veronica/a.jpg)"), {
    alt: "Legenda da foto",
    src: "/images/wire-veronica/a.jpg",
  });
  assert.equal(parseBodyImage("![x](https://evil.example/a.jpg)"), null);
  assert.equal(parseBodyImage("texto ![x](/images/a.jpg)"), null);
  assert.equal(parseBodyImage("![x](/images/../segredo.jpg)"), null);
  assert.equal(parseBodyImage("![x](/images/a.jpg\" onerror=\"x)"), null);
  assert.equal(parseBodyImage("Parágrafo comum."), null);
});
