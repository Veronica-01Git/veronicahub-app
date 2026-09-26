// Capa única da matéria, buscada no Pexels (principal) e no Pixabay (reserva).
//
// Por que existe (26/09): o banco curado da biblioteca tinha ~1 foto por cena,
// e a regra de escolha preferia repetir a foto "certa" a usar outra. Medido
// na home: 27 das 30 matérias dividiam a capa com outra matéria — toda nota de
// Selic com a mesma fachada, toda nota de investimento com a mesma sala. A
// editora-chefe pediu capa que faça jus à matéria e NUNCA repita.
//
// O que mudou em relação à busca ao vivo removida em 13/09 (a enchente em
// Telangana saiu com rua americana e placa "ROAD CLOSED"):
//   1. A cena curada de cover-scenes.ts entra como consulta — ela é
//      deliberadamente genérica e assumidamente ilustrativa.
//   2. Os termos do modelo (fotoTermos) só entram como consulta adicional, e
//      a descrição da foto (alt do Pexels, tags do Pixabay) passa por um
//      filtro de lugar: foto que diz ser de outro país ou cidade é recusada,
//      a menos que o próprio texto da matéria cite esse lugar.
//   3. A foto nunca repete: o id de toda foto usada fica registrado em
//      scripts/data/wire-fotos-usadas.json (commitado junto com a capa), e a
//      candidata ainda é comparada por hash visual com todas as capas já
//      publicadas em public/images/blog-covers — pega até a foto antiga do
//      banco, que não tinha id no nome do arquivo.
//
// Uso (no runner do Actions, que tem as chaves):
//   COVER_SLUG=... COVER_BEAT=... COVER_HEADLINE=... COVER_EXCERPT=... \
//   COVER_FOTO_TERMOS='["term"]' PEXELS_API_KEY=... [PIXABAY_API_KEY=...] \
//     node scripts/fetch-cover-live.mjs
//
// Imprime uma linha de JSON: {} quando nada serviu (o workflow segue para a
// ilustração gerada e, por último, para a arte do slug), ou
// {"path","photoId","photoCredit","photoUrl","source","query"}.
import { execFileSync } from "node:child_process";
import { mkdir, readdir, readFile, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { escolherCena, normalizar } from "../src/lib/cover-scenes.ts";
import { isBeat } from "../src/lib/beats.ts";
import { isCinematic, rankCinematic } from "./lib/photo-sources.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const COVER_DIR = path.join(root, "public/images/blog-covers");
export const USADAS_PATH = path.join(root, "scripts/data/wire-fotos-usadas.json");

// Distância de Hamming do dHash abaixo da qual duas imagens são a mesma foto
// (recomprimida, reduzida ou levemente recortada).
const MESMA_FOTO = 10;

// Lugares que, citados na descrição da foto e ausentes do texto da matéria,
// indicam foto que "documenta" outro lugar — a armadilha de 13/09. Brasil e
// China ficam de fora de propósito: são o escopo editorial do Wire.
const LUGARES_ESTRANGEIROS = [
  "usa", "united states", "america", "american", "texas", "florida", "california",
  "new york", "manhattan", "chicago", "los angeles", "houston", "miami", "washington",
  "canada", "toronto", "london", "england", "uk ", "paris", "france", "germany",
  "berlin", "italy", "rome", "spain", "madrid", "india", "mumbai", "delhi",
  "japan", "tokyo", "korea", "seoul", "russia", "moscow", "ukraine", "australia",
  "sydney", "mexico", "dubai", "singapore", "thailand", "vietnam", "indonesia",
  "philippines", "turkey", "istanbul", "africa", "nigeria", "kenya", "egypt",
];

export function citaLugarEstrangeiro(descricao, textoMateria) {
  const alt = ` ${normalizar(descricao ?? "")} `;
  const texto = normalizar(textoMateria ?? "");
  return LUGARES_ESTRANGEIROS.some((lugar) => {
    const alvo = lugar.trim();
    const achou = new RegExp(`\\b${alvo.replace(/ /g, "\\s+")}\\b`).test(alt);
    return achou && !texto.includes(alvo);
  });
}

// Consultas em ordem de preferência, sem repetir: cena curada primeiro (é a
// que já foi validada como ilustração segura da editoria), depois os termos
// que o modelo sugeriu para o fato.
export function montarConsultas({ beat, headline, excerpt, fotoTermos }) {
  const consultas = [];
  const cena = isBeat(beat) ? escolherCena(beat, { headline, excerpt, fotoTermos }) : null;
  for (const termo of [...(fotoTermos ?? []), cena]) {
    const limpo = (termo ?? "").toString().trim().toLowerCase();
    if (limpo && !consultas.includes(limpo)) consultas.push(limpo);
  }
  // A cena vai para a frente quando existe: ilustração genérica e segura
  // antes do termo específico do modelo.
  if (cena) {
    consultas.splice(consultas.indexOf(cena.toLowerCase()), 1);
    consultas.unshift(cena.toLowerCase());
  }
  return consultas;
}

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

async function buscarPexels(consulta, chave) {
  const url = new URL("https://api.pexels.com/v1/search");
  url.searchParams.set("query", consulta);
  url.searchParams.set("orientation", "landscape");
  url.searchParams.set("per_page", "40");
  const res = await fetch(url, { headers: { Authorization: chave } });
  if (!res.ok) {
    console.error(`Pexels "${consulta}": HTTP ${res.status}`);
    return [];
  }
  const data = await res.json();
  return (data.photos ?? [])
    .filter((p) => isCinematic(p.width, p.height) && p.src?.original)
    .sort(rankCinematic)
    .map((p) => ({
      source: "pexels",
      id: String(p.id),
      descricao: p.alt ?? "",
      credito: p.photographer ?? null,
      pagina: p.url ?? null,
      imageUrl: entrega(p.src.original, 2048, 1152),
      thumbUrl: entrega(p.src.original, 320, 180),
      consulta,
    }));
}

async function buscarPixabay(consulta, chave) {
  const url = new URL("https://pixabay.com/api/");
  url.searchParams.set("key", chave);
  url.searchParams.set("q", consulta);
  url.searchParams.set("image_type", "photo");
  url.searchParams.set("orientation", "horizontal");
  url.searchParams.set("min_width", "3840");
  url.searchParams.set("safesearch", "true");
  url.searchParams.set("per_page", "40");
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`Pixabay "${consulta}": HTTP ${res.status}`);
    return [];
  }
  const data = await res.json();
  return (data.hits ?? [])
    .filter((h) => isCinematic(h.imageWidth, h.imageHeight) && (h.fullHDURL || h.largeImageURL))
    .map((h) => ({
      source: "pixabay",
      id: String(h.id),
      descricao: h.tags ?? "",
      credito: h.user ?? null,
      pagina: h.pageURL ?? null,
      imageUrl: h.fullHDURL ?? h.largeImageURL,
      thumbUrl: h.webformatURL ?? h.largeImageURL,
      consulta,
    }));
}

// dHash 64 bits via ImageMagick: 9x8 em cinza, compara vizinhos na linha.
function dhashArquivo(arquivo) {
  const bytes = execFileSync("convert", [
    arquivo,
    "-colorspace",
    "gray",
    "-resize",
    "9x8!",
    "-depth",
    "8",
    "gray:-",
  ]);
  let hash = 0n;
  for (let y = 0; y < 8; y += 1) {
    for (let x = 0; x < 8; x += 1) {
      hash = (hash << 1n) | (bytes[y * 9 + x] > bytes[y * 9 + x + 1] ? 1n : 0n);
    }
  }
  return hash;
}

function distancia(a, b) {
  let x = a ^ b;
  let n = 0;
  while (x) {
    n += Number(x & 1n);
    x >>= 1n;
  }
  return n;
}

async function hashesPublicados() {
  const hashes = [];
  for (const nome of await readdir(COVER_DIR)) {
    if (!nome.endsWith(".jpg")) continue;
    try {
      hashes.push(dhashArquivo(path.join(COVER_DIR, nome)));
    } catch {
      // Arquivo que não é imagem válida (há capas antigas quebradas no
      // acervo) não serve de referência e não pode derrubar a busca.
    }
  }
  return hashes;
}

export async function lerUsadas() {
  try {
    return JSON.parse(await readFile(USADAS_PATH, "utf8"));
  } catch {
    return [];
  }
}

async function baixar(url, destino) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const bytes = Buffer.from(await res.arrayBuffer());
  if (!(bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)) {
    throw new Error("resposta não é JPEG");
  }
  await writeFile(destino, bytes);
}

async function main() {
  const slug = (process.env.COVER_SLUG ?? "").trim();
  const beat = (process.env.COVER_BEAT ?? "").trim();
  const headline = process.env.COVER_HEADLINE ?? "";
  const excerpt = process.env.COVER_EXCERPT ?? "";
  const pexelsKey = (process.env.PEXELS_API_KEY ?? "").trim();
  const pixabayKey = (process.env.PIXABAY_API_KEY ?? "").trim();
  if (!slug || !beat) throw new Error("Faltam COVER_SLUG e COVER_BEAT.");
  if (!pexelsKey && !pixabayKey) {
    console.log("{}");
    return;
  }
  let fotoTermos = [];
  try {
    fotoTermos = JSON.parse(process.env.COVER_FOTO_TERMOS || "[]");
  } catch {
    fotoTermos = [];
  }

  const consultas = montarConsultas({ beat, headline, excerpt, fotoTermos });
  const usadas = new Set((await lerUsadas()).map((u) => `${u.source}-${u.id}`));
  const publicados = await hashesPublicados();
  const textoMateria = `${headline} ${excerpt}`;

  // Pexels em todas as consultas primeiro; o Pixabay só entra se nenhuma
  // candidata do Pexels passar pelos filtros.
  const fontes = [
    ...(pexelsKey ? [(c) => buscarPexels(c, pexelsKey)] : []),
    ...(pixabayKey ? [(c) => buscarPixabay(c, pixabayKey)] : []),
  ];

  const tmp = path.join(root, `.capa-tmp-${slug.slice(0, 40)}`);
  await mkdir(COVER_DIR, { recursive: true });
  try {
    for (const buscar of fontes) {
      for (const consulta of consultas) {
        for (const foto of await buscar(consulta)) {
          if (usadas.has(`${foto.source}-${foto.id}`)) continue;
          if (citaLugarEstrangeiro(foto.descricao, textoMateria)) {
            console.error(`recusada por lugar: ${foto.source}-${foto.id} "${foto.descricao}"`);
            continue;
          }
          try {
            await baixar(foto.thumbUrl, tmp);
            const hash = dhashArquivo(tmp);
            if (publicados.some((h) => distancia(h, hash) <= MESMA_FOTO)) {
              console.error(`recusada por já estar no ar: ${foto.source}-${foto.id}`);
              continue;
            }
            const destino = path.join(COVER_DIR, `${slug}.jpg`);
            await baixar(foto.imageUrl, destino);
            const registro = await lerUsadas();
            registro.push({
              source: foto.source,
              id: foto.id,
              slug,
              em: new Date().toISOString(),
            });
            await mkdir(path.dirname(USADAS_PATH), { recursive: true });
            await writeFile(USADAS_PATH, `${JSON.stringify(registro, null, 1)}\n`);
            console.log(
              JSON.stringify({
                path: destino,
                photoId: `${foto.source}-${foto.id}`,
                photoCredit: foto.credito ?? undefined,
                photoUrl: foto.pagina ?? undefined,
                source: foto.source,
                query: foto.consulta,
              }),
            );
            return;
          } catch (erro) {
            console.error(`${foto.source}-${foto.id}: ${erro.message}`);
          }
        }
      }
    }
    console.log("{}");
  } finally {
    await rm(tmp, { force: true });
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((erro) => {
    console.error(erro);
    // Nunca derruba o passo: a matéria já está publicada; sem capa daqui, o
    // workflow segue para a ilustração e para a arte do slug.
    console.log("{}");
  });
}
