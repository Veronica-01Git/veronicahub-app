// Gera o card 1080×1350 da Wire TV pro feed do Instagram sem abrir navegador.
// Usa o mesmo traçado do botão "Compartilhar no Instagram" de /blog/$slug —
// src/lib/wire-instagram-card.ts é importado direto aqui (Node 22 remove os
// tipos sozinho, igual aos testes) pra não existirem dois cards diferentes.
// O contexto 2D vem do @napi-rs/canvas, que já era dependência do projeto.
//
//   WIRE_SLUG=minha-materia WIRE_HEADLINE="..." WIRE_EXCERPT="..." \
//     WIRE_BEAT=ia WIRE_PHOTO_CREDIT="Fulana" node scripts/render-instagram-card.mjs
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
import {
  drawWireCoverArt,
  WIRE_COVER_HEIGHT,
  WIRE_COVER_WIDTH,
} from "../src/lib/wire-cover-art.ts";
import { BEAT_LABELS, isBeat } from "../src/lib/beats.ts";

const SITE_URL = "https://veronicahub.com";
const root = fileURLToPath(new URL("..", import.meta.url));

function required(name) {
  const value = (process.env[name] ?? "").trim();
  if (!value) throw new Error(`${name} é obrigatório.`);
  return value;
}

// A capa publicada mora no próprio repositório (public/images/blog-covers).
// Se a matéria ainda não tiver capa commitada — card gerado à mão antes de a
// rodada terminar, por exemplo —, o fundo é a mesma arte que a capa receberia
// (src/lib/wire-cover-art.ts), desenhada na hora em memória.
//
// Antes aqui vinha `_fallback/<editoria>.jpg`, e o card saía com o mesmo
// fundo de todas as outras matérias da editoria: a peça de divulgação
// herdava a repetição da capa.
async function resolveCover(slug, beat) {
  const file = path.join(root, "public/images/blog-covers", `${slug}.jpg`);
  try {
    return { label: path.relative(root, file), bytes: await readFile(file) };
  } catch {
    const canvas = createCanvas(WIRE_COVER_WIDTH, WIRE_COVER_HEIGHT);
    const { motif } = drawWireCoverArt(canvas.getContext("2d"), { slug, beat });
    return { label: `arte gerada (${motif})`, bytes: canvas.toBuffer("image/jpeg", 88) };
  }
}

async function main() {
  const slug = required("WIRE_SLUG");
  const headline = required("WIRE_HEADLINE");
  // Sem resumo a legenda sai só com manchete, link e @ — nada é inventado.
  const excerpt = (process.env.WIRE_EXCERPT ?? "").trim();
  const beat = required("WIRE_BEAT");
  // Opcional: só existe quando a capa veio do banco curado. Sem ele a legenda
  // sai sem a linha de crédito, em vez de creditar quem não se sabe quem é.
  const photoCredit = (process.env.WIRE_PHOTO_CREDIT ?? "").trim();
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
      // O traçado só usa isto como sinal de "tem capa?"; quem entrega os
      // bytes é o loader abaixo.
      coverImageUrl: cover.label,
      canonicalUrl,
    },
    // O Image do @napi-rs só decodifica de verdade pelo loadImage; atribuir
    // o buffer em .src devolve as dimensões mas desenha vazio.
    () => loadImage(cover.bytes),
  );

  // Padrão out/instagram (fora do build, material de publicação). O workflow
  // do cron aponta para public/images/instagram para o card virar asset do
  // site e ficar acessível por URL — assim quem vai postar não depende de
  // rodar nada, só abre o endereço e baixa.
  const outDir = process.env.WIRE_OUT_DIR
    ? path.resolve(root, process.env.WIRE_OUT_DIR)
    : path.join(root, "out/instagram");
  await mkdir(outDir, { recursive: true });
  const imageFile = path.join(outDir, `wire-tv-${slug}.jpg`);
  const captionFile = path.join(outDir, `wire-tv-${slug}.txt`);
  await writeFile(imageFile, canvas.toBuffer("image/jpeg", 92));
  await writeFile(
    captionFile,
    `${buildWireCaption({ headline, excerpt, canonicalUrl, photoCredit })}\n`,
  );

  console.log(`card: ${imageFile}`);
  console.log(`legenda: ${captionFile}`);
  console.log(`capa: ${withCover ? cover.label : "sem capa"}`);
}

await main();
