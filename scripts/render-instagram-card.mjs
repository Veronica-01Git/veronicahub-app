// Gera o card 1080×1350 da Wire TV pro feed do Instagram sem abrir navegador.
// Usa o mesmo traçado do botão "Compartilhar no Instagram" de /blog/$slug —
// src/lib/wire-instagram-card.ts é importado direto aqui (Node 22 remove os
// tipos sozinho, igual aos testes) pra não existirem dois cards diferentes.
// O contexto 2D vem do @napi-rs/canvas, que já era dependência do projeto.
//
//   WIRE_SLUG=minha-materia WIRE_HEADLINE="..." WIRE_EXCERPT="..." \
//     WIRE_BEAT=ia node scripts/render-instagram-card.mjs
//
// Escreve o .jpg e o .txt da legenda em out/instagram/ (fora do build, é
// material de publicação, não asset do site) e imprime os dois caminhos.
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildWireCaption,
  drawWireInstagramCard,
  WIRE_CARD_HEIGHT,
  WIRE_CARD_WIDTH,
} from "../src/lib/wire-instagram-card.ts";
import { BEAT_LABELS, isBeat } from "../src/lib/beats.ts";

const SITE_URL = "https://veronicahub.com";
const root = fileURLToPath(new URL("..", import.meta.url));

function required(name) {
  const value = (process.env[name] ?? "").trim();
  if (!value) throw new Error(`${name} é obrigatório.`);
  return value;
}

// A capa publicada mora no próprio repositório (public/images/blog-covers).
// Se a matéria ainda não tiver capa própria, cai na capa de reserva da
// editoria — a mesma hierarquia que o site usa.
async function resolveCover(slug, beat) {
  const candidates = [
    path.join(root, "public/images/blog-covers", `${slug}.jpg`),
    path.join(root, "public/images/blog-covers/_fallback", `${beat}.jpg`),
  ];
  for (const candidate of candidates) {
    try {
      return { file: candidate, bytes: await readFile(candidate) };
    } catch {
      continue;
    }
  }
  return null;
}

async function main() {
  const slug = required("WIRE_SLUG");
  const headline = required("WIRE_HEADLINE");
  const excerpt = required("WIRE_EXCERPT");
  const beat = required("WIRE_BEAT");
  if (!isBeat(beat)) throw new Error(`WIRE_BEAT inválido: ${beat}`);

  const cover = await resolveCover(slug, beat);
  const canvas = createCanvas(WIRE_CARD_WIDTH, WIRE_CARD_HEIGHT);
  const context = canvas.getContext("2d");
  const canonicalUrl = `${SITE_URL}/blog/${slug}`;

  const { withCover } = await drawWireInstagramCard(
    context,
    {
      headline,
      beatLabel: BEAT_LABELS[beat],
      coverImageUrl: cover ? cover.file : null,
      canonicalUrl,
    },
    // O Image do @napi-rs só decodifica de verdade pelo loadImage; atribuir
    // o buffer em .src devolve as dimensões mas desenha vazio.
    () => loadImage(cover.bytes),
  );

  const outDir = path.join(root, "out/instagram");
  await mkdir(outDir, { recursive: true });
  const imageFile = path.join(outDir, `wire-tv-${slug}.jpg`);
  const captionFile = path.join(outDir, `wire-tv-${slug}.txt`);
  await writeFile(imageFile, canvas.toBuffer("image/jpeg", 92));
  await writeFile(captionFile, `${buildWireCaption({ headline, excerpt, canonicalUrl })}\n`);

  console.log(`card: ${imageFile}`);
  console.log(`legenda: ${captionFile}`);
  console.log(`capa: ${withCover && cover ? path.relative(root, cover.file) : "sem capa"}`);
}

await main();
