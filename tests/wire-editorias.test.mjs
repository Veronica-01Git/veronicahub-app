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
  // O radar para nas duas primeiras pautas: o feed de Itajaí e BC vem antes,
  // um por portal (o DIARINHO sozinho enche os 100 itens de um feed conjunto).
  const feeds = server.slice(server.indexOf("const RSS_FEEDS"));
  const sc = feeds.slice(feeds.indexOf("  sc: ["));
  assert.ok(
    sc.indexOf("...PORTAIS_LITORAL_NORTE.map((portal) =>") >= 0 &&
      sc.indexOf("PORTAIS_LITORAL_NORTE") < sc.indexOf("PORTAIS_SC"),
    "um feed por portal do litoral norte, antes dos estaduais",
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

test("o Wire não usa o gpt-oss-120b: ele fica livre para a reserva do WhatsApp", async () => {
  const server = readFileSync(new URL("../src/lib/articles-server.ts", import.meta.url), "utf8");
  // Toda chamada à Groq no rascunho usa o modelo principal: a da busca na
  // web (rascunho manual) e, desde 01/10/2026, a da apuração no servidor.
  const chamadas = [...server.matchAll(/chat\.completions\.create\(\{\s*model: (\w+)/g)].map(
    (m) => m[1],
  );
  assert.deepEqual(chamadas, ["DRAFT_MODEL"]);
  assert.match(server, /groqModel: DRAFT_MODEL/);
  assert.match(server, /const DRAFT_MODEL = "openai\/gpt-oss-20b";/);

  // Cota esgotada continua sendo rodada sem publicação, não falha.
  const { isEditorialSkip } = await import("../src/lib/editorial-skip.ts");
  assert.ok(
    isEditorialSkip(
      '429 {"error":{"message":"Rate limit reached for model `openai/gpt-oss-20b`"}} (openai/gpt-oss-120b reservado ao WhatsApp)',
    ),
  );
});

test("SC: página de tag, autor ou seção do portal não vira pauta", async () => {
  const { tituloDeIndice } = await import("../src/lib/pauta-sc.ts");
  // Títulos reais do feed do DIARINHO no Google Notícias em 29/09/2026.
  for (const titulo of [
    "TV DIARINHO - DIARINHO",
    "Corinthians feminino - DIARINHO",
    "Diego Matiello - DIARINHO",
    "Publicações Legais - DIARINHO",
    "BESS - DIARINHO",
  ]) {
    assert.ok(tituloDeIndice(titulo), `deveria ser índice: ${titulo}`);
  }
  for (const titulo of [
    "Obras já dão “spoilers” da nova atração do Morro do Careca - DIARINHO",
    "Chuva deve marcar quase toda a semana em Balneário Camboriú - BC Notícias",
    'Via importante que liga "cidades-irmãs" de SC tem trânsito alterado - NSC Total',
  ]) {
    assert.ok(!tituloDeIndice(titulo), `é manchete: ${titulo}`);
  }
});

test("recusa por data diz se o fato era antigo ou futuro, sem mudar a classificação", async () => {
  const server = readFileSync(new URL("../src/lib/articles-server.ts", import.meta.url), "utf8");
  assert.match(server, /"datado no futuro"/);
  const { isEditorialSkip } = await import("../src/lib/editorial-skip.ts");
  assert.ok(
    isEditorialSkip(
      "A data do fato está fora da janela editorial de 72h (datado no futuro: 2026-10-08T22:00:00Z — Marejada divulga shows).",
    ),
  );
});
