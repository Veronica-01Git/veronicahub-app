import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { downloadTo, searchPexels } from "./lib/photo-sources.mjs";

const apiKey = process.env.PEXELS_API_KEY?.trim();
if (!apiKey) throw new Error("PEXELS_API_KEY não configurada.");

const covers = [
  {
    id: "newsroom",
    path: "public/images/wire-reposts/veronica-wire-newsroom-pexels.jpg",
    terms: ["global technology newsroom", "modern newsroom screens", "broadcast news studio"],
  },
  {
    id: "analytics",
    path: "public/images/wire-reposts/veronica-analytics-pexels.jpg",
    terms: ["data analytics office", "technology dashboard team", "business intelligence screens"],
  },
  {
    id: "community",
    path: "public/images/wire-reposts/veronica-community-pexels.jpg",
    terms: ["video creator studio camera", "creative media team studio", "podcast video production"],
  },
  {
    id: "regional",
    path: "public/images/wire-reposts/veronica-regional-pexels.jpg",
    terms: ["Brazil coastal city skyline", "modern coastal city aerial", "Brazil city ocean"],
  },
];

const usedIds = new Set();
const manifest = [];

for (const cover of covers) {
  let photo = null;
  let searchTerm = "";
  for (const term of cover.terms) {
    photo = await searchPexels(term, apiKey, usedIds);
    if (photo) {
      searchTerm = term;
      break;
    }
  }
  if (!photo) throw new Error(`Pexels não encontrou foto 4K para ${cover.id}.`);

  usedIds.add(photo.photoId);
  await mkdir(dirname(cover.path), { recursive: true });
  await downloadTo(photo.imageUrl, cover.path);
  manifest.push({
    id: cover.id,
    path: `/${cover.path.replace(/^public\//, "")}`,
    searchTerm,
    source: photo.source,
    photoId: photo.photoId,
    photoCredit: photo.photoCredit,
    photoUrl: photo.photoUrl,
  });
}

await writeFile(
  "public/images/wire-reposts/pexels-manifest.json",
  `${JSON.stringify({ updatedAt: new Date().toISOString(), images: manifest }, null, 2)}\n`,
);

console.log(JSON.stringify({ ok: true, images: manifest }));
