// Item 1.2 do brief "evolução": busca UMA foto genérica fixa por editoria e
// commita em public/images/blog-covers/_fallback/<beat>.jpg — nível 3 da
// cadeia de fallback (fetch-cover-photo.mjs), hoje pulado direto pro card
// tipográfico porque esses arquivos nunca existiram.
//
// Roda manual (workflow_dispatch em fetch-fallback-covers.yml), não faz
// parte do cron de 5h. Termo de busca é fixo por editoria (sem IA) — não faz
// sentido gastar uma chamada de IA pra escolher a MESMA foto genérica toda
// vez.
//
// Uso:
//   PEXELS_API_KEY=... PIXABAY_API_KEY=... node scripts/fetch-fallback-covers.mjs
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { searchPexels, searchPixabay, downloadTo } from "./lib/photo-sources.mjs";

// Um termo concreto e fotografável por editoria — mesmo critério pedido ao
// modelo pra fotoTermos em articles-server.ts (nunca conceito abstrato, nome
// de empresa, logotipo ou pessoa pública).
const FALLBACK_TERM = {
  ia: "server racks data center",
  clima: "solar panel field renewable energy",
  economia: "digital payment terminal technology",
  geopolitica: "shipping port containers",
  mercado: "stock market trading screens",
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
    "blog-covers",
    "_fallback",
  );
  await mkdir(outDir, { recursive: true });

  const noExclusions = new Set();
  const ok = [];
  const failed = [];

  for (const [beat, term] of Object.entries(FALLBACK_TERM)) {
    let found = pexelsKey ? await searchPexels(term, pexelsKey, noExclusions) : null;
    if (!found && pixabayKey) found = await searchPixabay(term, pixabayKey, noExclusions);

    if (!found) {
      console.error(`${beat}: nada encontrado pro termo "${term}".`);
      failed.push(beat);
      continue;
    }

    const outPath = path.join(outDir, `${beat}.jpg`);
    await downloadTo(found.imageUrl, outPath);
    console.log(
      `${beat}: gravado (${found.source}, photoId=${found.photoId}, credit="${found.photoCredit}").`,
    );
    ok.push(beat);
  }

  console.log(`\n--- Resumo: ${ok.length}/${Object.keys(FALLBACK_TERM).length} editorias ---`);
  if (failed.length > 0) {
    console.log(`Sem foto: ${failed.join(", ")}`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
