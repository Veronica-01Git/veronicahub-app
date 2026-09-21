// Troca as capas de arte gerada por fotografia do banco curado.
//
// A arte de `src/lib/wire-cover-art.ts` foi feita como piso para quando o
// banco estava vazio: resolve a repetição, mas não é fotografia. Com o banco
// abastecido (16 fotos por editoria, 16/09), as matérias que já saíram com
// arte podem receber foto — decisão do dono, que não quer capa de arte no ar.
//
// Roda no GitHub Actions, não aqui nem no Worker: o runner é quem alcança o
// site para baixar as imagens da biblioteca e quem escreve em disco.
//
// Quem escolhe qual foto vai para qual matéria é o servidor
// (/api/cron/art-covers): a distribuição precisa do banco inteiro à vista
// para não dar a mesma foto a duas matérias.
//
// Um commit só para todas as capas e cards, de propósito: cada commit no main
// é um deploy, e cada deploy troca o que a produção está servindo.
//
// Uso:
//   CRON_SECRET=... node scripts/swap-art-covers.mjs
//   CRON_SECRET=... node scripts/swap-art-covers.mjs --dry-run
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildWireCaption,
  drawWireInstagramCard,
  WIRE_CARD_HEIGHT,
  WIRE_CARD_WIDTH,
} from "../src/lib/wire-instagram-card.ts";
import { BEAT_LABELS, isBeat } from "../src/lib/beats.ts";

const root = fileURLToPath(new URL("..", import.meta.url));
const COVER_DIR = path.join(root, "public/images/blog-covers");
const INSTAGRAM_DIR = path.join(root, "public/images/instagram");

const dryRun = process.argv.includes("--dry-run");
// Segunda passagem, chamada pelo workflow depois do commit: só grava a
// procedência (coverPhotoId e crédito) das matérias que já receberam foto.
const registrarApenas = process.argv.includes("--registrar");
const siteUrl = (process.env.SITE_URL ?? "https://veronicahub.com").replace(/\/$/, "");
const cronSecret = (process.env.CRON_SECRET ?? "").trim();
if (!cronSecret) throw new Error("CRON_SECRET é obrigatório.");
const authorization = { authorization: `Bearer ${cronSecret}` };

async function pendentes() {
  const response = await fetch(`${siteUrl}/api/cron/art-covers`, { headers: authorization });
  if (!response.ok) {
    throw new Error(`Não deu para listar as capas (${response.status}): ${await response.text()}`);
  }
  return response.json();
}

// A cena da foto e se ela casou com o texto, para a linha de log. Fica vazio
// quando o servidor ainda não manda esses campos (deploy anterior a 21/09).
function cenaDe(artigo) {
  if (!artigo.term) return "";
  return ` · ${artigo.term}${artigo.relevante ? "" : " [rodízio]"}`;
}

async function baixarFoto(photoId) {
  const response = await fetch(`${siteUrl}/api/media-images/${photoId}`, {
    headers: { Accept: "image/*" },
  });
  if (!response.ok) throw new Error(`download HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  // Mesma checagem do resto do pipeline: arquivo gravado como .jpg sem ser
  // JPEG já aconteceu neste repositório e o navegador não decodifica.
  if (!(bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)) {
    throw new Error("os bytes da biblioteca não são JPEG");
  }
  return bytes;
}

async function registrarCapa(artigo) {
  const body = JSON.stringify({
    slug: artigo.slug,
    coverImageUrl: `${siteUrl}/images/blog-covers/${artigo.slug}.jpg`,
    photoId: artigo.photoId,
    photoCredit: artigo.photoCredit ?? "",
    photoUrl: "",
  });
  const response = await fetch(`${siteUrl}/api/cron/set-cover-image`, {
    method: "POST",
    headers: { ...authorization, "content-type": "application/json" },
    body,
  });
  if (!response.ok) throw new Error(`set-cover-image ${response.status}: ${await response.text()}`);
}

async function main() {
  const lista = await pendentes();
  console.log(
    `matérias com arte: ${lista.total} — fotos repetidas por falta de banco: ${lista.repetidas}`,
  );
  if (lista.semBanco?.length) {
    console.log(`sem banco na editoria: ${lista.semBanco.join(", ")}`);
  }
  if (dryRun) console.log("simulação (--dry-run): nada será escrito.\n");

  // Quantas capas saíram por assunto e quantas por rodízio. É o número que
  // diz se a troca melhorou as capas ou só as embaralhou — sem ele, uma
  // rodada que não casou nada parece idêntica a uma que casou tudo.
  if (typeof lista.relevantes === "number") {
    console.log(
      `casadas com o texto da matéria: ${lista.relevantes} · por rodízio da editoria: ` +
        `${lista.porRodizio ?? 0} · sem banco: ${(lista.semBanco ?? []).length}\n`,
    );
  }

  // Duas passagens separadas, e nessa ordem: primeiro os arquivos, depois o
  // commit (no workflow), e só então o registro no banco. Gravar coverPhotoId
  // antes do arquivo estar publicado apontaria a procedência para uma capa que
  // ainda é arte.
  if (registrarApenas) {
    let registradas = 0;
    for (const artigo of lista.artigos ?? []) {
      try {
        await registrarCapa(artigo);
        registradas += 1;
      } catch (error) {
        console.error(`  registro de ${artigo.slug} falhou: ${error.message}`);
      }
    }
    console.log(`procedência registrada: ${registradas}`);
    return;
  }

  await mkdir(COVER_DIR, { recursive: true });
  await mkdir(INSTAGRAM_DIR, { recursive: true });

  let trocadas = 0;
  for (const artigo of lista.artigos ?? []) {
    if (!isBeat(artigo.beat)) {
      console.error(`  ${artigo.slug}: editoria inválida (${artigo.beat})`);
      continue;
    }
    if (dryRun) {
      console.log(
        `  ${artigo.slug} ← ${artigo.photoId} (${artigo.photoCredit ?? "sem crédito"})` +
          `${cenaDe(artigo)}`,
      );
      trocadas += 1;
      continue;
    }

    try {
      const bytes = await baixarFoto(artigo.photoId);
      await writeFile(path.join(COVER_DIR, `${artigo.slug}.jpg`), bytes);

      // O card do Instagram usa a capa como fundo — trocar a capa sem
      // redesenhar o card deixaria a peça de divulgação com a arte antiga.
      const canonicalUrl = `${siteUrl}/blog/${artigo.slug}`;
      const canvas = createCanvas(WIRE_CARD_WIDTH, WIRE_CARD_HEIGHT);
      await drawWireInstagramCard(
        canvas.getContext("2d"),
        {
          headline: artigo.headline,
          beatLabel: BEAT_LABELS[artigo.beat],
          coverImageUrl: `${artigo.slug}.jpg`,
          canonicalUrl,
        },
        () => loadImage(bytes),
      );
      await writeFile(
        path.join(INSTAGRAM_DIR, `wire-tv-${artigo.slug}.jpg`),
        canvas.toBuffer("image/jpeg", 92),
      );
      await writeFile(
        path.join(INSTAGRAM_DIR, `wire-tv-${artigo.slug}.txt`),
        `${buildWireCaption({
          headline: artigo.headline,
          excerpt: artigo.excerpt,
          canonicalUrl,
          photoCredit: artigo.photoCredit,
        })}\n`,
      );

      trocadas += 1;
      console.log(`  ${artigo.slug} ← ${artigo.photoId} (${bytes.length} B)${cenaDe(artigo)}`);
    } catch (error) {
      // Uma matéria que falha não derruba as outras: ela fica com a arte e a
      // próxima rodada tenta de novo.
      console.error(`  ${artigo.slug} falhou: ${error.message}`);
    }
  }

  console.log(`\ncapas trocadas: ${trocadas}`);
}

await main();
