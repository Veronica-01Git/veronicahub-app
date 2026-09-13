// Busca UMA foto por formação e commita em
// public/images/formacoes/<slug>.jpg — as capas dos cards de /comandos e do
// teaser da home.
//
// Por que existe: as capas apontavam pra vfxN.url dos .asset.json em
// src/assets/vfx/, que resolvem pra /__l5e/assets-v1/... — caminho interno do
// CDN do Lovable. Os JPEGs nunca foram versionados e nada no Worker serve
// /__l5e/, então em produção davam 404 e o card mostrava imagem quebrada.
// Elas só apareciam dentro do editor do Lovable, que faz proxy desse caminho.
//
// Mesmo desenho do fetch-fallback-covers.mjs: termo fixo por item (sem IA —
// não faz sentido gastar chamada de modelo pra escolher a MESMA foto toda
// vez), origem mínima de 4K garantida pelo MIN_WIDTH do photo-sources, e
// derivação em 1600x900 pra ficar nítida em retina sem pesar a página.
//
// Roda manual (workflow_dispatch em fetch-course-covers.yml), fora do cron.
//
// Uso:
//   PEXELS_API_KEY=... PIXABAY_API_KEY=... node scripts/fetch-course-covers.mjs
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { searchPexels, searchPixabay, downloadTo } from "./lib/photo-sources.mjs";

// Um termo concreto e fotografável por formação — mesmo critério do
// fetch-fallback-covers.mjs: nunca conceito abstrato, nome de empresa,
// logotipo ou pessoa pública. A chave é o slug gerado em src/lib/courses.ts.
const COURSE_TERM = {
  "canais-dark": "dark recording studio microphone moody light",
  "vsl-cinematografico": "cinema camera film set lighting rig",
  "avatar-digital-ia": "neon portrait lighting studio profile",
  afiliado: "laptop online shopping ecommerce desk",
  ifood: "food delivery courier motorcycle city night",
  "meta-ads": "analytics dashboard charts screen",
  "vfx-com-ia": "green screen visual effects studio",
  copywriting: "typewriter notebook writing desk",
  "app-no-code": "mobile app wireframe screens desk",
  "criar-site": "web design workspace monitor code",
  "hacking-etico": "network server cables dark data center",
};

async function main() {
  const pexelsKey = process.env.PEXELS_API_KEY;
  const pixabayKey = process.env.PIXABAY_API_KEY;
  if (!pexelsKey && !pixabayKey) {
    console.error("Faltam PEXELS_API_KEY e/ou PIXABAY_API_KEY no ambiente.");
    process.exit(1);
  }

  const outDir = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
    "public",
    "images",
    "formacoes",
  );
  await mkdir(outDir, { recursive: true });

  // Acumula os ids já usados pra não repetir a mesma foto em duas formações —
  // searchPexels/searchPixabay descartam qualquer candidato deste conjunto.
  const usedPhotoIds = new Set();
  const ok = [];
  const failed = [];
  const credits = [];

  for (const [slug, term] of Object.entries(COURSE_TERM)) {
    let found = pexelsKey ? await searchPexels(term, pexelsKey, usedPhotoIds) : null;
    if (!found && pixabayKey) found = await searchPixabay(term, pixabayKey, usedPhotoIds);

    if (!found) {
      console.error(`${slug}: nada encontrado pro termo "${term}".`);
      failed.push(slug);
      continue;
    }

    usedPhotoIds.add(found.photoId);
    const outPath = path.join(outDir, `${slug}.jpg`);
    await downloadTo(found.imageUrl, outPath);
    credits.push(`${slug}: ${found.source} #${found.photoId} — ${found.photoCredit ?? "sem crédito"}`);
    console.log(
      `${slug}: gravado (${found.source}, photoId=${found.photoId}, credit="${found.photoCredit}").`,
    );
    ok.push(slug);
  }

  const total = Object.keys(COURSE_TERM).length;
  console.log(`\n--- Resumo: ${ok.length}/${total} formações ---`);
  if (credits.length > 0) console.log(`\nCréditos:\n${credits.join("\n")}`);
  if (failed.length > 0) {
    console.log(`\nSem foto: ${failed.join(", ")}`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
