// Troca as capas repetidas da Wire TV por arte própria de cada matéria.
//
// O que conta como repetida: capa idêntica, byte a byte, a outra capa
// publicada, ou idêntica a uma das fotos fixas de `_fallback/<editoria>.jpg`.
// Em 15/09 eram 19 das 39 capas — herança do tempo em que o banco curado da
// biblioteca estava vazio e toda matéria da editoria recebia a mesma foto. O
// card do Instagram usa a capa como fundo, então a repetição também estava
// nas peças de divulgação; por isso o card de cada capa trocada é redesenhado
// aqui, com a mesma manchete e a mesma legenda que já tinha.
//
// Roda local, fora do Worker e fora do Action do cron. Precisa da lista de
// matérias publicadas, que só o banco tem — o script não inventa editoria:
//
//   SELECT json_agg(json_build_object(
//     'slug', slug, 'beat', beat, 'headline', headline, 'excerpt', excerpt))
//   FROM "Article" WHERE status = 'published';
//
// Grave o resultado num arquivo e passe em --manifest. `headline` e `excerpt`
// são opcionais: quando a matéria já tem card, o script lê a manchete da
// primeira linha da legenda existente e preserva a legenda inteira.
//
// Uso:
//   node scripts/refresh-repeated-covers.mjs --manifest artigos.json
//   node scripts/refresh-repeated-covers.mjs --manifest artigos.json --apply
//
// Sem --apply é simulação: lista o que trocaria sem escrever nada.
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { createHash } from "node:crypto";
import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  drawWireCoverArt,
  WIRE_COVER_HEIGHT,
  WIRE_COVER_WIDTH,
} from "../src/lib/wire-cover-art.ts";
import {
  buildWireCaption,
  drawWireInstagramCard,
  WIRE_CARD_HEIGHT,
  WIRE_CARD_WIDTH,
} from "../src/lib/wire-instagram-card.ts";
import { BEAT_LABELS, isBeat } from "../src/lib/beats.ts";

const SITE_URL = "https://veronicahub.com";
const root = fileURLToPath(new URL("..", import.meta.url));
const COVER_DIR = path.join(root, "public/images/blog-covers");
const FALLBACK_DIR = path.join(COVER_DIR, "_fallback");
const INSTAGRAM_DIR = path.join(root, "public/images/instagram");

const apply = process.argv.includes("--apply");
const manifestIndex = process.argv.indexOf("--manifest");
if (manifestIndex === -1 || !process.argv[manifestIndex + 1]) {
  console.error("Faltou --manifest <arquivo.json>. Veja o cabeçalho do script.");
  process.exit(1);
}

function digest(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

async function listJpg(dir) {
  try {
    return (await readdir(dir)).filter((name) => name.endsWith(".jpg"));
  } catch {
    return [];
  }
}

// A legenda é a fonte da manchete quando a matéria já tem card: foi gerada
// pelo próprio buildWireCaption, com a manchete na primeira linha. Evita
// depender do banco para redesenhar o que já existe.
async function readExistingCaption(slug) {
  try {
    const text = await readFile(path.join(INSTAGRAM_DIR, `wire-tv-${slug}.txt`), "utf8");
    const headline = text.split("\n").find((line) => line.trim());
    return headline ? { headline: headline.trim(), caption: text } : null;
  } catch {
    return null;
  }
}

async function main() {
  const manifest = JSON.parse(
    await readFile(path.resolve(process.argv[manifestIndex + 1]), "utf8"),
  );
  const beats = new Map();
  const texts = new Map();
  for (const entry of manifest) {
    if (!entry?.slug) continue;
    if (!isBeat(entry.beat)) throw new Error(`Editoria inválida em ${entry.slug}: ${entry.beat}`);
    beats.set(entry.slug, entry.beat);
    texts.set(entry.slug, { headline: entry.headline, excerpt: entry.excerpt });
  }

  const fallbackHashes = new Set();
  for (const name of await listJpg(FALLBACK_DIR)) {
    fallbackHashes.add(digest(await readFile(path.join(FALLBACK_DIR, name))));
  }

  const bySlug = new Map();
  const counts = new Map();
  for (const name of await listJpg(COVER_DIR)) {
    const hash = digest(await readFile(path.join(COVER_DIR, name)));
    bySlug.set(name.slice(0, -4), hash);
    counts.set(hash, (counts.get(hash) ?? 0) + 1);
  }

  const repeated = [...bySlug.entries()]
    .filter(([, hash]) => counts.get(hash) > 1 || fallbackHashes.has(hash))
    .map(([slug]) => slug)
    .sort();

  console.log(`capas: ${bySlug.size} — repetidas: ${repeated.length}`);
  if (!apply) console.log("simulação (sem --apply): nada será escrito.\n");

  const skipped = [];
  let covers = 0;
  let cards = 0;

  for (const slug of repeated) {
    const beat = beats.get(slug);
    if (!beat) {
      skipped.push(`${slug} — fora do manifesto, editoria desconhecida`);
      continue;
    }

    const coverCanvas = createCanvas(WIRE_COVER_WIDTH, WIRE_COVER_HEIGHT);
    const { motif } = drawWireCoverArt(coverCanvas.getContext("2d"), { slug, beat });
    const coverBytes = coverCanvas.toBuffer("image/jpeg", 88);
    if (apply) await writeFile(path.join(COVER_DIR, `${slug}.jpg`), coverBytes);
    covers += 1;

    const existing = await readExistingCaption(slug);
    const headline = existing?.headline ?? texts.get(slug)?.headline;
    if (!headline) {
      skipped.push(`${slug} — capa trocada, mas sem manchete para o card`);
      console.log(`  capa ${slug} (${beat}/${motif}) — sem card`);
      continue;
    }

    const canonicalUrl = `${SITE_URL}/blog/${slug}`;
    const cardCanvas = createCanvas(WIRE_CARD_WIDTH, WIRE_CARD_HEIGHT);
    await drawWireInstagramCard(
      cardCanvas.getContext("2d"),
      { headline, beatLabel: BEAT_LABELS[beat], coverImageUrl: `${slug}.jpg`, canonicalUrl },
      () => loadImage(coverBytes),
    );
    // Legenda existente é preservada: ela traz o resumo que o endpoint
    // devolveu na publicação, que o manifesto nem sempre tem.
    const caption =
      existing?.caption ??
      `${buildWireCaption({ headline, excerpt: texts.get(slug)?.excerpt, canonicalUrl })}\n`;
    if (apply) {
      await mkdir(INSTAGRAM_DIR, { recursive: true });
      await writeFile(
        path.join(INSTAGRAM_DIR, `wire-tv-${slug}.jpg`),
        cardCanvas.toBuffer("image/jpeg", 92),
      );
      await writeFile(path.join(INSTAGRAM_DIR, `wire-tv-${slug}.txt`), caption);
    }
    cards += 1;
    console.log(`  capa + card ${slug} (${beat}/${motif})`);
  }

  console.log(`\ncapas trocadas: ${covers} — cards regerados: ${cards}`);
  for (const line of skipped) console.log(`pulado: ${line}`);
}

await main();
