// Resolve a capa de uma matéria da Wire TV — banco curado na biblioteca do
// Admin primeiro, foto genérica fixa por editoria como segundo nível. Roda no
// GitHub Action (não no Worker — Cloudflare Workers não escrevem em disco/
// `/public`), chamado ANTES do card tipográfico (scripts/render-cover.mjs),
// que continua como último recurso quando nada aqui encontra nada.
//
// A busca ao vivo em Pexels/Pixabay saiu daqui em 13/09 — ver o comentário no
// nível 1, lá embaixo. As funções continuam em ./lib/photo-sources.mjs porque
// outros scripts (fetch-fallback-covers, fetch-course-covers, entre outros)
// ainda montam bancos de imagem com elas; o que mudou é a capa da matéria não
// ser mais escolhida ao vivo.
//
// Uso:
//   COVER_SLUG=foo COVER_BEAT=ia \
//   COVER_LIBRARY_ID=abc123 \
//     node scripts/fetch-cover-photo.mjs
//
// Imprime uma linha de JSON em stdout: {} se nada foi encontrado (o
// chamador deve cair pro card tipográfico), ou {"path","photoId","source"}.
import { mkdir, copyFile, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { downloadTo } from "./lib/photo-sources.mjs";

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

  const libraryCoverId = (process.env.COVER_LIBRARY_ID ?? "").trim();
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

  // Nível 1: banco curado na biblioteca do Admin. O servidor já escolheu qual
  // imagem usar (pickLibraryCover, em articles-server.ts) e mandou o id; aqui
  // só resta baixar os bytes pela rota pública da biblioteca. O download é
  // feito de fora, pelo runner do Actions, então não é o Worker chamando o
  // próprio domínio — a armadilha do 522 não se aplica aqui.
  //
  // A busca ao vivo em Pexels/Pixabay foi removida de propósito em 13/09: ela
  // escolhia por termo em inglês inventado pelo modelo e produzia foto que
  // parecia documentar o fato sem ser dele.
  if (libraryCoverId) {
    try {
      await downloadTo(`https://veronicahub.com/api/media-images/${libraryCoverId}`, outPath);
      console.log(
        JSON.stringify({ path: outPath, photoId: libraryCoverId, source: "biblioteca-admin" }),
      );
      return;
    } catch (error) {
      // Cai pro próximo nível em vez de derrubar o passo: a matéria já está
      // publicada quando este script roda, então morrer aqui a deixaria sem
      // capa nenhuma. Uma capa genérica é melhor que buraco.
      console.error(`Banco curado indisponível (${libraryCoverId}): ${error.message}`);
    }
  }

  // Nível 2: foto genérica fixa por editoria, se já foi commitada (ver
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
