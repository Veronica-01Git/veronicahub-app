// Gera a capa própria de uma matéria da Wire TV (1200×630, pronta para
// og:image) quando o banco curado da biblioteca do Admin não tem imagem para
// a editoria.
//
// Substitui o que antes era o nível 2 da cascata — copiar a foto fixa
// `_fallback/<editoria>.jpg`. Aquilo fazia toda matéria de uma editoria sair
// com a mesma imagem: em 15/09 havia 22 capas que eram cópias byte a byte de
// cinco fotos, e o card do Instagram, que usa a capa como fundo, repetia
// junto. Aqui a composição sai de um hash do slug (src/lib/wire-cover-art.ts),
// então duas matérias nunca recebem a mesma capa.
//
// Roda no runner do Actions, não no Worker: Cloudflare Workers não escrevem em
// disco. Usa @napi-rs/canvas, o mesmo do card do Instagram — sem navegador,
// sem Playwright, sem chave de API.
//
// Uso:
//   COVER_SLUG=minha-materia COVER_BEAT=ia node scripts/render-cover-art.mjs
//
// Imprime uma linha de JSON: {"path","motif","seed","source"}.
import { mkdir, copyFile, writeFile, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  drawWireCoverArt,
  WIRE_COVER_HEIGHT,
  WIRE_COVER_WIDTH,
} from "../src/lib/wire-cover-art.ts";
import { isBeat } from "../src/lib/beats.ts";

const root = fileURLToPath(new URL("..", import.meta.url));

async function fileExists(target) {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const slug = (process.env.COVER_SLUG ?? "").trim();
  const beat = (process.env.COVER_BEAT ?? "").trim();
  if (!slug) throw new Error("COVER_SLUG é obrigatório.");
  if (!isBeat(beat)) throw new Error(`COVER_BEAT inválido: ${beat}`);

  const outDir = process.env.COVER_OUT_DIR
    ? path.resolve(root, process.env.COVER_OUT_DIR)
    : path.join(root, "public/images/blog-covers");
  const outPath = path.join(outDir, `${slug}.jpg`);
  await mkdir(outDir, { recursive: true });

  try {
    const { createCanvas } = await import("@napi-rs/canvas");
    const canvas = createCanvas(WIRE_COVER_WIDTH, WIRE_COVER_HEIGHT);
    const context = canvas.getContext("2d");
    const { motif, seed } = drawWireCoverArt(context, { slug, beat });
    await writeFile(outPath, canvas.toBuffer("image/jpeg", 88));
    console.log(JSON.stringify({ path: outPath, motif, seed, source: "arte-gerada" }));
    return;
  } catch (error) {
    // Rede de segurança: a matéria já está publicada quando este script roda,
    // então morrer aqui a deixaria sem capa nenhuma. A foto fixa da editoria
    // repete — é o defeito que este script existe para corrigir —, mas só
    // aparece se o canvas não subir, o que não deve acontecer.
    console.error(`Arte de capa indisponível (${slug}): ${error.message}`);
  }

  const fallbackPath = path.join(outDir, "_fallback", `${beat}.jpg`);
  if (await fileExists(fallbackPath)) {
    await copyFile(fallbackPath, outPath);
    console.log(JSON.stringify({ path: outPath, source: "fallback-beat" }));
    return;
  }

  throw new Error(`Sem capa possível para ${slug}: canvas falhou e não há ${fallbackPath}.`);
}

await main();
