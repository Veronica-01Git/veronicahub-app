// Busca de foto em Pexels/Pixabay — extraído de fetch-cover-photo.mjs pra
// ser reaproveitado também por fetch-fallback-covers.mjs (item 1.2 do brief
// "evolução"), sem duplicar a mesma chamada HTTP em dois scripts.
import { writeFile } from "node:fs/promises";

export const MIN_WIDTH = 1600;

export async function searchPexels(term, apiKey, excludeIds) {
  const url = new URL("https://api.pexels.com/v1/search");
  url.searchParams.set("query", term);
  url.searchParams.set("orientation", "landscape");
  url.searchParams.set("per_page", "15");

  const res = await fetch(url, { headers: { Authorization: apiKey } });
  if (!res.ok) {
    console.error(`Pexels "${term}": HTTP ${res.status}`);
    return null;
  }
  const data = await res.json();
  const photos = Array.isArray(data.photos) ? data.photos : [];
  const pick = photos.find(
    (p) => p.width >= MIN_WIDTH && !excludeIds.has(String(p.id)) && p.src?.large2x,
  );
  if (!pick) return null;

  return {
    imageUrl: pick.src.large2x,
    photoId: String(pick.id),
    photoCredit: pick.photographer ?? null,
    photoUrl: pick.url ?? null,
    source: "pexels",
  };
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

export async function downloadTo(url, outPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download falhou: HTTP ${res.status}`);
  const bytes = new Uint8Array(await res.arrayBuffer());
  await writeFile(outPath, bytes);
}
