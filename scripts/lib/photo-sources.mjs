// Busca de foto em Pexels/Pixabay — extraído de fetch-cover-photo.mjs pra
// ser reaproveitado também por fetch-fallback-covers.mjs (item 1.2 do brief
// "evolução"), sem duplicar a mesma chamada HTTP em dois scripts.
import { writeFile } from "node:fs/promises";

// A origem precisa ter resolução 4K para permitir bom recorte. A derivação
// final usa 1600x900: nítida nos cards e em telas retina, mas leve para web.
export const MIN_WIDTH = 3840;

// Deriva a URL de entrega 1600x900 a partir do original. fm=jpg força a saída
// em JPEG: sem isso o CDN devolve o formato do original, e quando a foto é PNG
// o arquivo vinha como PNG mas era gravado com extensão .jpg — 1.8MB em vez de
// ~100KB, e com content-type errado ao ser servido. Aconteceu de verdade na
// capa de /comandos.
function editorialUrl(original) {
  const url = new URL(original);
  url.searchParams.set("auto", "compress");
  url.searchParams.set("cs", "tinysrgb");
  url.searchParams.set("fit", "crop");
  url.searchParams.set("w", "1600");
  url.searchParams.set("h", "900");
  url.searchParams.set("fm", "jpg");
  return url.toString();
}

function mapPexelsPhoto(photo) {
  return {
    imageUrl: editorialUrl(photo.src.original),
    photoId: String(photo.id),
    photoCredit: photo.photographer ?? null,
    photoUrl: photo.url ?? null,
    source: "pexels",
  };
}

// Várias fotos de um termo, para montar banco (scripts/fill-cover-bank.mjs).
// searchPexels abaixo é o caso de uma só, e chama esta para não existirem dois
// caminhos diferentes montando a mesma URL de entrega.
export async function searchPexelsMany(term, apiKey, excludeIds, limit = 15) {
  const url = new URL("https://api.pexels.com/v1/search");
  url.searchParams.set("query", term);
  url.searchParams.set("orientation", "landscape");
  url.searchParams.set("per_page", String(Math.min(Math.max(limit, 1), 80)));

  const res = await fetch(url, { headers: { Authorization: apiKey } });
  if (!res.ok) {
    console.error(`Pexels "${term}": HTTP ${res.status}`);
    return [];
  }
  const data = await res.json();
  const photos = Array.isArray(data.photos) ? data.photos : [];
  return photos
    .filter((p) => p.width >= MIN_WIDTH && !excludeIds.has(String(p.id)) && p.src?.original)
    .map(mapPexelsPhoto);
}

export async function searchPexels(term, apiKey, excludeIds) {
  const [first] = await searchPexelsMany(term, apiKey, excludeIds, 15);
  return first ?? null;
}

export async function searchPixabay(term, apiKey, excludeIds) {
  const url = new URL("https://pixabay.com/api/");
  url.searchParams.set("key", apiKey);
  url.searchParams.set("q", term);
  url.searchParams.set("image_type", "photo");
  url.searchParams.set("orientation", "horizontal");
  url.searchParams.set("min_width", String(MIN_WIDTH));
  url.searchParams.set("safesearch", "true");
  url.searchParams.set("per_page", "15");

  const res = await fetch(url);
  if (!res.ok) {
    console.error(`Pixabay "${term}": HTTP ${res.status}`);
    return null;
  }
  const data = await res.json();
  const hits = Array.isArray(data.hits) ? data.hits : [];
  const pick = hits.find((h) => !excludeIds.has(String(h.id)) && h.largeImageURL);
  if (!pick) return null;

  return {
    imageUrl: pick.largeImageURL,
    photoId: String(pick.id),
    photoCredit: pick.user ?? null,
    photoUrl: pick.pageURL ?? null,
    source: "pixabay",
  };
}

// Todo consumidor grava estes bytes com extensão .jpg, então o que não for
// JPEG precisa estourar aqui em vez de virar arquivo mal rotulado no repo.
// Existem hoje capas do Wire commitadas sem nenhuma assinatura de imagem, que
// o navegador não decodifica — esta checagem impede que isso se repita.
function isJpeg(bytes) {
  return bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
}

export async function downloadTo(url, outPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download falhou: HTTP ${res.status}`);
  const bytes = new Uint8Array(await res.arrayBuffer());
  if (!isJpeg(bytes)) {
    const head = Buffer.from(bytes.slice(0, 4)).toString("hex");
    throw new Error(`resposta não é JPEG (primeiros bytes: ${head}, ${bytes.length} B) — ${url}`);
  }
  await writeFile(outPath, bytes);
}
