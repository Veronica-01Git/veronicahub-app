import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { registerHooks } from "node:module";

// O código do app roda pelo bundler do Vite, que resolve "./db" sem
// extensão; o ESM do Node não. Mesmo recurso que architecture.test.mjs usa
// pros descritores de imagem — aqui, só para completar a extensão .ts.
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith(".") && !/\.[cm]?[jt]sx?$/.test(specifier) && context.parentURL) {
      const candidato = new URL(specifier + ".ts", context.parentURL);
      if (existsSync(candidato)) return { url: candidato.href, shortCircuit: true };
    }
    return next(specifier, context);
  },
});

import { BEAT_VALUES } from "../src/lib/beats.ts";

// Dinâmico de propósito: import estático é resolvido antes de registerHooks.
const { EDITORIA_PUBLICA, mapearMateria } = await import("../src/lib/wire-feed-server.ts");

// O contrato de /api/wire/feed.json. Quem consome de fora não tem como
// descobrir um campo que sumiu antes de quebrar, então a lista fica aqui.
const CAMPOS_DO_CONTRATO = [
  "id",
  "slug",
  "titulo",
  "resumo",
  "corpoHtml",
  "editoria",
  "capaUrl",
  "capaCredito",
  "fontes",
  "publicadoEm",
  "urlOriginal",
];

function linha(extra = {}) {
  return {
    id: "art_1",
    slug: "leilao-de-baterias",
    beat: "clima",
    headline: "Governo anuncia leilão de baterias",
    excerpt: "Resumo da matéria.",
    body: "Primeiro parágrafo.\n\nSegundo parágrafo.",
    coverImageUrl: null,
    coverPhotoCredit: null,
    sourceUrls: [],
    publishedAt: new Date("2026-09-17T12:00:00.000Z"),
    temCapaEmbutida: false,
    ...extra,
  };
}

test("a matéria pública expõe exatamente os campos do contrato", () => {
  const materia = mapearMateria(linha());
  assert.deepEqual(Object.keys(materia).sort(), [...CAMPOS_DO_CONTRATO].sort());
});

test("nenhum campo interno da tabela Article vaza para o feed", () => {
  const materia = mapearMateria(
    linha({ status: "published", aiGenerated: true, autoPublished: true, desk: "Redação" }),
  );
  for (const interno of [
    "status",
    "aiGenerated",
    "autoPublished",
    "desk",
    "body",
    "beat",
    "headline",
    "excerpt",
    "coverImageData",
    "coverImageUrl",
    "coverPhotoId",
    "createdAt",
    "updatedAt",
    "sourceUrls",
  ]) {
    assert.ok(!(interno in materia), interno);
  }
});

test("toda editoria da coluna tem tradução pública e nenhuma se repete", () => {
  assert.deepEqual(Object.keys(EDITORIA_PUBLICA).sort(), [...BEAT_VALUES].sort());
  const publicas = Object.values(EDITORIA_PUBLICA);
  assert.equal(new Set(publicas).size, publicas.length);
  assert.equal(EDITORIA_PUBLICA.mercado, "tech");
});

test("o corpo vira HTML por parágrafo, com o texto escapado", () => {
  const materia = mapearMateria(
    linha({ body: 'Custo < 5 & "alto".\n\n<script>alert(1)</script>' }),
  );
  assert.equal(
    materia.corpoHtml,
    "<p>Custo &lt; 5 &amp; &quot;alto&quot;.</p>\n<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>",
  );
});

test("a capa sai absoluta, venha do caminho do site ou do Postgres", () => {
  assert.equal(
    mapearMateria(linha({ coverImageUrl: "/images/blog-covers/a.jpg" })).capaUrl,
    "https://veronicahub.com/images/blog-covers/a.jpg",
  );
  assert.equal(
    mapearMateria(linha({ temCapaEmbutida: true })).capaUrl,
    "https://veronicahub.com/api/cover-image/leilao-de-baterias",
  );
  assert.equal(mapearMateria(linha()).capaUrl, null);
});

test("cada fonte carrega domínio e URL, e a matéria aponta pro original", () => {
  const materia = mapearMateria(
    linha({
      sourceUrls: ["https://www.agenciabrasil.ebc.com.br/x", "https://g1.globo.com/y"],
    }),
  );
  assert.deepEqual(materia.fontes, [
    { dominio: "agenciabrasil.ebc.com.br", url: "https://www.agenciabrasil.ebc.com.br/x" },
    { dominio: "g1.globo.com", url: "https://g1.globo.com/y" },
  ]);
  assert.equal(materia.urlOriginal, "https://veronicahub.com/blog/leilao-de-baterias");
  assert.equal(materia.publicadoEm, "2026-09-17T12:00:00.000Z");
});
