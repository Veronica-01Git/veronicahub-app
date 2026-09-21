// Busca de foto em Pexels/Pixabay — extraído de fetch-cover-photo.mjs pra
// ser reaproveitado também por fetch-fallback-covers.mjs (item 1.2 do brief
// "evolução"), sem duplicar a mesma chamada HTTP em dois scripts.
import { writeFile } from "node:fs/promises";

// A origem precisa ter resolução 4K para permitir bom recorte.
export const MIN_WIDTH = 3840;

// Recorte cinematográfico: a capa é servida em caixa 16:9 (1.78), então foto
// quase quadrada perde metade da altura no corte e costuma decapitar o
// assunto. A faixa aceita vai do 3:2 da maioria das reflex (1.5) ao 2:1 de
// enquadramento panorâmico — fora dela, o corte estraga a foto.
export const MIN_ASPECT = 1.5;
export const MAX_ASPECT = 2.1;

// Derivação de entrega do Pexels. Subiu de 1600x900 para 2048x1152 em 20/09,
// com o pedido de capa 4K: o arquivo final ainda é reduzido a 1600x900 por
// scripts/optimize-cover.sh, mas o banco passa a guardar um original com
// folga — é dele que sai também o card do Instagram, que recorta em 4:5 e
// antes partia de uma imagem já no tamanho exato da caixa da capa.
const DELIVERY_WIDTH = 2048;
const DELIVERY_HEIGHT = 1152;

// Ordena candidatos do mais "cinematográfico" para o menos: primeiro o que
// está mais perto de 16:9, e a resolução como desempate. Não é julgamento de
// estética — isso continua sendo a curadoria dos termos em cover-scenes.ts —,
// é só o que sobrevive melhor ao recorte.
export function rankCinematic(a, b) {
  const desvio = (foto) => Math.abs(foto.width / foto.height - 16 / 9);
  const diferenca = desvio(a) - desvio(b);
  if (Math.abs(diferenca) > 0.05) return diferenca;
  return b.width - a.width;
}

export function isCinematic(width, height) {
  if (!width || !height) return false;
  const aspect = width / height;
  return width >= MIN_WIDTH && aspect >= MIN_ASPECT && aspect <= MAX_ASPECT;
}

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
  url.searchParams.set("w", String(DELIVERY_WIDTH));
  url.searchParams.set("h", String(DELIVERY_HEIGHT));
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
    .filter(
      (p) => isCinematic(p.width, p.height) && !excludeIds.has(String(p.id)) && p.src?.original,
    )
    .sort(rankCinematic)
    .map(mapPexelsPhoto);
}

export async function searchPexels(term, apiKey, excludeIds) {
  const [first] = await searchPexelsMany(term, apiKey, excludeIds, 15);
  return first ?? null;
}

// Várias fotos de um termo no Pixabay, para o abastecimento do banco — o par
// de searchPexelsMany. Passou a existir em 20/09, quando o banco virou duas
// fontes: as cenas mais específicas do catálogo (degelo, queimada, controle
// de fronteira) devolvem poucas fotos em 4K só no Pexels, e a editoria ficava
// abaixo do alvo.
//
// LIMITE DA API, registrado porque afeta a qualidade e não é evidente: o
// Pixabay só entrega `imageURL` (original) e `fullHDURL` (1920 px) a contas
// com acesso completo aprovado. Sem isso, a maior URL disponível é
// `largeImageURL`, de 1280 px — abaixo dos 1600 px em que a capa é servida.
// O `min_width=3840` continua valendo e garante que o ORIGINAL é 4K, mas o
// que se baixa pode não ser. Por isso: Pixabay é complemento, o Pexels vem
// primeiro (é ele que entrega 2048 px de verdade), e quando o Pixabay oferece
// fullHDURL é ela que se usa.
export async function searchPixabayMany(term, apiKey, excludeIds, limit = 15) {
  const url = new URL("https://pixabay.com/api/");
  url.searchParams.set("key", apiKey);
  url.searchParams.set("q", term);
  url.searchParams.set("image_type", "photo");
  url.searchParams.set("orientation", "horizontal");
  url.searchParams.set("min_width", String(MIN_WIDTH));
  url.searchParams.set("safesearch", "true");
  url.searchParams.set("per_page", String(Math.min(Math.max(limit, 3), 200)));

  const res = await fetch(url);
  if (!res.ok) {
    console.error(`Pixabay "${term}": HTTP ${res.status}`);
    return [];
  }
  const data = await res.json();
  const hits = Array.isArray(data.hits) ? data.hits : [];
  return hits
    .filter(
      (hit) =>
        isCinematic(hit.imageWidth, hit.imageHeight) &&
        !excludeIds.has(String(hit.id)) &&
        (hit.fullHDURL || hit.largeImageURL),
    )
    .sort((a, b) =>
      rankCinematic(
        { width: a.imageWidth, height: a.imageHeight },
        { width: b.imageWidth, height: b.imageHeight },
      ),
    )
    .map((hit) => ({
      imageUrl: hit.fullHDURL ?? hit.largeImageURL,
      photoId: String(hit.id),
      photoCredit: hit.user ?? null,
      photoUrl: hit.pageURL ?? null,
      source: "pixabay",
    }));
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
