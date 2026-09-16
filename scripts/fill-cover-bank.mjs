// Abastece o banco curado de capas da Wire TV com fotografias do Pexels.
//
// Contexto: a capa de cada matéria sai do banco curado da biblioteca do Admin
// (nível 1). Com o banco vazio, toda matéria caía na arte gerada do slug —
// que resolve a repetição, mas não é fotografia. Este script enche o banco
// para que a Wire TV volte a publicar foto de verdade, sem reabrir a busca ao
// vivo por matéria que foi removida em 13/09.
//
// A diferença para aquela busca, que é o ponto todo: os termos abaixo são
// curados à mão, uma vez, e são deliberadamente genéricos. Uma foto de parque
// eólico na editoria de clima é assumidamente ilustrativa. O que não se faz
// mais é pedir ao modelo um termo em inglês para o fato específico da matéria
// e publicar o resultado como se registrasse aquele fato — foi assim que a
// enchente em Telangana saiu com uma rua americana e placa "ROAD CLOSED".
//
// Roda no GitHub Actions, onde a PEXELS_API_KEY existe e a rede alcança o
// Pexels. Não escreve em disco nem commita nada: cadastra pelo endpoint
// /api/cron/cover-bank, protegido pelo mesmo CRON_SECRET do resto do
// pipeline. Por isso esta rodada NÃO dispara deploy.
//
// Uso:
//   PEXELS_API_KEY=... CRON_SECRET=... node scripts/fill-cover-bank.mjs
//   ... node scripts/fill-cover-bank.mjs --dry-run   # só lista o que faria
//
// Variáveis opcionais: SITE_URL (padrão https://veronicahub.com) e
// BANK_TARGET_PER_BEAT (padrão 8).
import { BEAT_VALUES } from "../src/lib/beats.ts";
import {
  BANK_TERMS,
  interleaveByTerm,
  MAX_BANK_PER_BEAT,
  parseBankFilename,
} from "../src/lib/cover-bank.ts";
import { searchPexelsMany } from "./lib/photo-sources.mjs";

// Os termos moram em src/lib/cover-bank.ts (BANK_TERMS), ao lado do resto da
// convenção do banco, porque src/lib/cover-match.ts precisa da mesma lista
// para casar foto com assunto. Divididos em dois lugares, um termo novo
// entraria no banco sem nunca casar com nada.
const TERMS = BANK_TERMS;

const dryRun = process.argv.includes("--dry-run");
const siteUrl = (process.env.SITE_URL ?? "https://veronicahub.com").replace(/\/$/, "");
const target = Number(process.env.BANK_TARGET_PER_BEAT ?? 8);

function required(name) {
  const value = (process.env[name] ?? "").trim();
  if (!value) throw new Error(`${name} é obrigatório.`);
  return value;
}

const pexelsKey = required("PEXELS_API_KEY");
const cronSecret = required("CRON_SECRET");
const authorization = { authorization: `Bearer ${cronSecret}` };

async function readInventory() {
  const response = await fetch(`${siteUrl}/api/cron/cover-bank`, { headers: authorization });
  if (!response.ok) {
    throw new Error(`Não deu para ler o banco (${response.status}): ${await response.text()}`);
  }
  return response.json();
}

async function addToBank(entry) {
  const response = await fetch(`${siteUrl}/api/cron/cover-bank`, {
    method: "POST",
    headers: { ...authorization, "content-type": "application/json" },
    body: JSON.stringify(entry),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`POST ${response.status}: ${text}`);
  return JSON.parse(text);
}

async function downloadJpeg(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`download HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  // Mesma checagem do downloadTo: o CDN devolve o formato do original quando o
  // parâmetro de formato se perde, e o endpoint recusaria os bytes de qualquer
  // jeito. Falhar aqui gasta menos e diz onde foi.
  if (!(bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)) {
    throw new Error("a resposta não é JPEG");
  }
  return bytes;
}

async function main() {
  const inventory = await readInventory();
  const limit = Math.min(target, inventory.maxPerBeat ?? MAX_BANK_PER_BEAT);

  // Um id só entra uma vez no banco inteiro: a mesma foto em duas editorias
  // voltaria a produzir a repetição que este trabalho todo foi corrigir.
  const usedIds = new Set();
  for (const list of Object.values(inventory.bank ?? {})) {
    for (const filename of list) {
      const parsed = parseBankFilename(filename);
      if (parsed) usedIds.add(parsed.photoId);
    }
  }

  console.log(`banco atual: ${JSON.stringify(inventory.totals)} — alvo por editoria: ${limit}`);
  if (dryRun) console.log("simulação (--dry-run): nada será cadastrado.\n");

  let added = 0;
  for (const beat of BEAT_VALUES) {
    const current = (inventory.bank?.[beat] ?? []).length;
    let missing = limit - current;
    if (missing <= 0) {
      console.log(`${beat}: ${current} já cadastradas, nada a fazer.`);
      continue;
    }

    // Busca todos os termos ANTES de consumir, para poder intercalar. Sem
    // isso o primeiro termo enche a cota sozinho e a editoria inteira sai da
    // mesma cena — foi o que o primeiro dry run mostrou.
    const porTermo = [];
    for (const term of TERMS[beat]) {
      const photos = await searchPexelsMany(term, pexelsKey, usedIds, 30);
      porTermo.push(
        // Sem fotógrafo não há como creditar, e o endpoint recusaria.
        photos.filter((photo) => photo.photoCredit).map((photo) => ({ ...photo, term })),
      );
    }

    for (const photo of interleaveByTerm(porTermo)) {
      if (missing <= 0) break;
      // Dois termos podem devolver a mesma foto: a exclusão de searchPexelsMany
      // foi aplicada antes de qualquer uma ser consumida nesta rodada.
      if (usedIds.has(photo.photoId)) continue;
      usedIds.add(photo.photoId);

      if (dryRun) {
        console.log(`  ${beat} ← ${photo.photoId} (${photo.photoCredit}) · ${photo.term}`);
        missing -= 1;
        added += 1;
        continue;
      }

      try {
        const bytes = await downloadJpeg(photo.imageUrl);
        const result = await addToBank({
          beat,
          photoId: photo.photoId,
          photographer: photo.photoCredit,
          term: photo.term,
          mimeType: "image/jpeg",
          dataBase64: bytes.toString("base64"),
        });
        if (result.saved) {
          console.log(
            `  ${beat} ← ${result.saved} (${photo.photoCredit}, ${photo.term}, ${bytes.length} B)`,
          );
          missing -= 1;
          added += 1;
        } else {
          console.log(`  ${beat} · ${photo.photoId} pulada: ${result.skipped}`);
          if (String(result.skipped).startsWith("editoria cheia")) missing = 0;
        }
      } catch (error) {
        // Uma foto que falha não derruba a rodada: o banco fica com menos do
        // que o alvo e a próxima rodada completa.
        console.error(`  ${beat} · ${photo.photoId} falhou: ${error.message}`);
      }
    }

    if (missing > 0) {
      console.log(`${beat}: faltaram ${missing} — os termos não deram foto nova suficiente.`);
    }
  }

  console.log(`\ntotal cadastrado: ${added}`);
}

await main();
