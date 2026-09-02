// Busca uma foto real pra capa de uma matéria do Veronica Wire — Pexels
// primeiro, Pixabay como segunda fonte, foto genérica fixa por editoria
// como terceiro nível. Roda no GitHub Action (não no Worker — Cloudflare
// Workers não escrevem em disco/`/public`), chamado ANTES do card
// tipográfico (scripts/render-cover.mjs), que continua como último recurso
// quando nada aqui encontra nada.
//
// Uso:
//   COVER_SLUG=foo COVER_BEAT=ia \
//   COVER_FOTO_TERMOS='["server racks data center"]' \
//   COVER_RECENT_PHOTO_IDS='["123","456"]' \
//   PEXELS_API_KEY=... PIXABAY_API_KEY=... \
//     node scripts/fetch-cover-photo.mjs
//
// Imprime uma linha de JSON em stdout: {} se nada foi encontrado (o
// chamador deve cair pro card tipográfico), ou
// {"path","photoId","photoCredit","photoUrl","source"} se achou.
import { mkdir, copyFile, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { searchPexels, searchPixabay, downloadTo } from "./lib/photo-sources.mjs";

function parseJsonArray(raw) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}

async function fileExists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const slug = process.env.COVER_SLUG;
  const beat = process.env.COVER_BEAT;
  if (!slug || !beat) {
    console.error("Faltam variáveis: COVER_SLUG, COVER_BEAT.");
    process.exit(1);
  }

  const fotoTermos = parseJsonArray(process.env.COVER_FOTO_TERMOS).slice(0, 3);
  const recentPhotoIds = new Set(parseJsonArray(process.env.COVER_RECENT_PHOTO_IDS));
  const outDir =
    process.env.COVER_OUT_DIR ??
    path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      "..",
      "public",
      "images",
      "blog-covers",
    );
  const outPath = path.join(outDir, `${slug}.jpg`);
  await mkdir(outDir, { recursive: true });

  const pexelsKey = process.env.PEXELS_API_KEY;
  const pixabayKey = process.env.PIXABAY_API_KEY;

  let found = null;

  // Nível 1: Pexels, um termo de cada vez.
  if (pexelsKey && fotoTermos.length > 0) {
    for (const term of fotoTermos) {
      found = await searchPexels(term, pexelsKey, recentPhotoIds);
      if (found) break;
    }
  }

  // Nível 2: Pixabay, se Pexels não achou nada.
  if (!found && pixabayKey && fotoTermos.length > 0) {
    for (const term of fotoTermos) {
      found = await searchPixabay(term, pixabayKey, recentPhotoIds);
      if (found) break;
    }
  }

  if (found) {
    await downloadTo(found.imageUrl, outPath);
    console.log(
      JSON.stringify({
        path: outPath,
        photoId: found.photoId,
        photoCredit: found.photoCredit,
        photoUrl: found.photoUrl,
        source: found.source,
      }),
    );
    return;
  }

  // Nível 3: foto genérica fixa por editoria, se já foi commitada (ver
  // scripts/fetch-fallback-covers.mjs).
  const fallbackPath = path.join(outDir, "_fallback", `${beat}.jpg`);
  if (await fileExists(fallbackPath)) {
    await copyFile(fallbackPath, outPath);
    console.log(JSON.stringify({ path: outPath, source: "fallback-beat" }));
    return;
  }

  // Nada encontrado — o chamador cai pro card tipográfico (render-cover.mjs).
  console.log("{}");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
