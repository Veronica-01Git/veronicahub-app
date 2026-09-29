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

test("Santa Catarina é apurada nos portais catarinenses, litoral norte na frente", () => {
  const server = readFileSync(new URL("../src/lib/articles-server.ts", import.meta.url), "utf8");
  for (const portal of [
    "ndmais.com.br",
    "nsctotal.com.br",
    "diarinho.net",
    "bcnoticias.com.br",
    "clickcamboriu.com.br",
  ]) {
    assert.ok(server.includes(portal), `${portal} fora do radar de SC`);
  }
  // O radar para nas duas primeiras pautas: o feed de Itajaí e BC vem antes.
  const feeds = server.slice(server.indexOf("  sc: [\n    googleNewsBrasil"));
  assert.ok(
    feeds.indexOf("PORTAIS_LITORAL_NORTE") < feeds.indexOf("PORTAIS_SC"),
    "feed do litoral norte precisa ser o primeiro de SC",
  );
});

test("SC: polícia, crime, acidente e tragédia ficam fora da pauta automática", async () => {
  const { foraDaPautaSc, RECUSA_PAUTA_SC } = await import("../src/lib/pauta-sc.ts");
  const { isEditorialSkip } = await import("../src/lib/editorial-skip.ts");

  for (const manchete of [
    "Polícia prende suspeito de assalto no Centro de Itajaí",
    "Acidente na BR-101 em Balneário Camboriú deixa dois feridos",
    "Homem morre afogado na Praia Central",
    "Golpe do falso aluguel faz vítimas em BC",
    "Tiroteio assusta moradores de Navegantes",
  ]) {
    assert.ok(foraDaPautaSc(manchete), `deveria barrar: ${manchete}`);
  }
  for (const manchete of [
    "Porto de Itajaí registra recorde de movimentação em setembro",
    "Balneário Camboriú abre matrículas para a rede municipal",
    "Presidente da Alesc visita obras da Via Expressa",
    "Retiro de verão movimenta hotéis de Itapema",
    "Marejada 2026 divulga programação de shows",
  ]) {
    assert.ok(!foraDaPautaSc(manchete), `não deveria barrar: ${manchete}`);
  }
  assert.ok(foraDaPautaSc("Nova ciclovia em Itajaí", "Obra começa após morte de ciclista"));

  // Recusa por pauta fora da linha é pulo editorial (rodada verde), não falha.
  assert.ok(isEditorialSkip(`${RECUSA_PAUTA_SC}: Polícia prende suspeito`));
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
  assert.equal(parseBodyImage('![x](/images/a.jpg" onerror="x)'), null);
  assert.equal(parseBodyImage("Parágrafo comum."), null);
});

test("desk escrito à mão vence o palpite por palavra-chave", () => {
  // editorial-network.ts importa "./beats" sem extensão; lido como texto.
  const rede = readFileSync(new URL("../src/lib/editorial-network.ts", import.meta.url), "utf8");
  const corpo = rede.slice(rede.indexOf("export function resolveEditorialChannel"));
  const escolhaManual = corpo.indexOf("channel.label.toLocaleLowerCase");
  const palpite = corpo.indexOf("channel.keywords.reduce");
  assert.ok(
    escolhaManual > 0 && escolhaManual < palpite,
    "desk manual precisa ser conferido antes das palavras-chave",
  );
  assert.match(rede, /label: "Bastidores"/);
});
