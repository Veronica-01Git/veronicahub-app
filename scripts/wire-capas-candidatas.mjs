// Busca candidatas de capa para uma lista de matérias da Wire TV e salva
// miniaturas para curadoria visual — sem publicar nada.
//
// Entrada: .wire-capas/pedido.json  { excluir: [ids], materias: [{slug, beat,
// headline, queries: [termos em inglês]}] }
// Saída:   .wire-capas/candidatas.json e .wire-capas/candidatas/<slug>/<n>.jpg
//
// Pexels primeiro (qualidade), Pixabay só completa quando o Pexels não dá
// candidatas suficientes. Mesmo corte do resto do pipeline: original 4K e
// proporção de cinema (ver scripts/lib/photo-sources.mjs).
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { isCinematic, rankCinematic } from "./lib/photo-sources.mjs";

const POR_TERMO = 5;
const MINIMO_POR_MATERIA = 8;
const pexelsKey = (process.env.PEXELS_API_KEY ?? "").trim();
const pixabayKey = (process.env.PIXABAY_API_KEY ?? "").trim();
if (!pexelsKey) throw new Error("PEXELS_API_KEY é obrigatório.");

function entrega(original, w, h) {
  const url = new URL(original);
  url.searchParams.set("auto", "compress");
  url.searchParams.set("cs", "tinysrgb");
  url.searchParams.set("fit", "crop");
  url.searchParams.set("w", String(w));
  url.searchParams.set("h", String(h));
  url.searchParams.set("fm", "jpg");
  return url.toString();
}

async function pexels(term, excluir) {
  const url = new URL("https://api.pexels.com/v1/search");
  url.searchParams.set("query", term);
  url.searchParams.set("orientation", "landscape");
  url.searchParams.set("per_page", "40");
  const res = await fetch(url, { headers: { Authorization: pexelsKey } });
  if (!res.ok) {
    console.error(`Pexels "${term}": HTTP ${res.status}`);
    return [];
  }
  const data = await res.json();
  return (data.photos ?? [])
    .filter((p) => isCinematic(p.width, p.height) && !excluir.has(String(p.id)) && p.src?.original)
    .sort(rankCinematic)
    .slice(0, POR_TERMO)
    .map((p) => ({
      source: "pexels",
      id: String(p.id),
      alt: p.alt ?? "",
      photographer: p.photographer ?? null,
      pageUrl: p.url ?? null,
      width: p.width,
      height: p.height,
      imageUrl: entrega(p.src.original, 2048, 1152),
      thumbUrl: entrega(p.src.original, 480, 270),
      query: term,
    }));
}

async function pixabay(term, excluir) {
  if (!pixabayKey) return [];
  const url = new URL("https://pixabay.com/api/");
  url.searchParams.set("key", pixabayKey);
  url.searchParams.set("q", term);
  url.searchParams.set("image_type", "photo");
  url.searchParams.set("orientation", "horizontal");
  url.searchParams.set("min_width", "3840");
  url.searchParams.set("safesearch", "true");
  url.searchParams.set("per_page", "30");
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`Pixabay "${term}": HTTP ${res.status}`);
    return [];
  }
  const data = await res.json();
  return (data.hits ?? [])
    .filter(
      (h) =>
        isCinematic(h.imageWidth, h.imageHeight) &&
        !excluir.has(String(h.id)) &&
        (h.fullHDURL || h.largeImageURL),
    )
    .slice(0, POR_TERMO)
    .map((h) => ({
      source: "pixabay",
      id: String(h.id),
      alt: h.tags ?? "",
      photographer: h.user ?? null,
      pageUrl: h.pageURL ?? null,
      width: h.imageWidth,
      height: h.imageHeight,
      imageUrl: h.fullHDURL ?? h.largeImageURL,
      thumbUrl: h.webformatURL ?? h.largeImageURL,
      query: term,
    }));
}

async function baixarMiniatura(url, destino) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const bruto = `${destino}.orig`;
  await writeFile(bruto, Buffer.from(await res.arrayBuffer()));
  execFileSync("convert", [
    bruto,
    "-resize",
    "480x270^",
    "-gravity",
    "center",
    "-extent",
    "480x270",
    "-quality",
    "80",
    destino,
  ]);
  execFileSync("rm", ["-f", bruto]);
}

const pedido = JSON.parse(await readFile(".wire-capas/pedido.json", "utf8"));
const excluir = new Set((pedido.excluir ?? []).map(String));
const saida = [];

for (const materia of pedido.materias) {
  const vistos = new Set();
  const lista = [];
  const juntar = (fotos) => {
    for (const foto of fotos) {
      const chave = `${foto.source}-${foto.id}`;
      if (vistos.has(chave)) continue;
      vistos.add(chave);
      lista.push(foto);
    }
  };
  for (const termo of materia.queries) juntar(await pexels(termo, excluir));
  if (lista.length < MINIMO_POR_MATERIA) {
    for (const termo of materia.queries) juntar(await pixabay(termo, excluir));
  }

  const pasta = path.join(".wire-capas/candidatas", materia.slug);
  await mkdir(pasta, { recursive: true });
  const candidatas = [];
  for (const [indice, foto] of lista.entries()) {
    const arquivo = path.join(pasta, `${String(indice + 1).padStart(2, "0")}.jpg`);
    try {
      await baixarMiniatura(foto.thumbUrl, arquivo);
      candidatas.push({ n: indice + 1, arquivo, ...foto });
    } catch (erro) {
      console.error(`${materia.slug} #${indice + 1}: ${erro.message}`);
    }
  }
  console.log(`${materia.slug}: ${candidatas.length} candidatas`);
  saida.push({ slug: materia.slug, headline: materia.headline, candidatas });
}

await writeFile(".wire-capas/candidatas.json", JSON.stringify(saida, null, 1));
