// Abastece o banco curado de capas da Wire TV com fotografias de Pexels e
// Pixabay.
//
// Contexto: a capa de cada matéria sai do banco curado da biblioteca do Admin
// (nível 1). Com o banco vazio, toda matéria caía na arte gerada do slug —
// que resolve a repetição, mas não é fotografia.
//
// MUDOU EM 20/09, a pedido do editor-chefe, em três pontos:
//
//   1. O banco deixou de ACUMULAR. Antes a rodada só completava o que faltava
//      para o alvo, então foto cadastrada em setembro continuava saindo em
//      capa meses depois. Agora cada sessão começa esvaziando o banco
//      (DELETE /api/cron/cover-bank) e recadastra tudo da busca daquela
//      sessão. O expurgo preserva o que alguma matéria publicada está
//      servindo como capa — a trava mora no servidor, não aqui.
//
//   2. Duas fontes, não uma. O Pexels continua primeiro (é o que entrega
//      2048 px de verdade); o Pixabay completa as cenas em que o Pexels não
//      dá foto 4K suficiente. Ver a nota sobre o limite do Pixabay em
//      ./lib/photo-sources.mjs.
//
//   3. As cenas saíram daqui e foram para src/lib/cover-scenes.ts, onde o
//      SERVIDOR também as lê. Antes esta lista era só do runner, e o servidor
//      não tinha como saber de que cena era cada foto — era por isso que a
//      capa só podia ser rodízio da editoria. Com a mesma tabela dos dois
//      lados, o servidor escolhe a foto que faz jus ao texto da matéria.
//
// A diferença para a busca ao vivo removida em 13/09, que continua valendo:
// os termos são curados à mão e deliberadamente genéricos. Uma foto de parque
// eólico na editoria de clima é assumidamente ilustrativa. O que não se faz é
// pedir ao modelo um termo em inglês para o fato específico da matéria e
// publicar o resultado como se registrasse aquele fato — foi assim que a
// enchente em Telangana saiu com uma rua americana e placa "ROAD CLOSED".
//
// Roda no GitHub Actions, onde as chaves existem e a rede alcança as duas
// APIs. Não escreve em disco nem commita nada: fala com o endpoint
// /api/cron/cover-bank, protegido pelo mesmo CRON_SECRET do resto do
// pipeline. Por isso esta rodada NÃO dispara deploy.
//
// Uso:
//   PEXELS_API_KEY=... PIXABAY_API_KEY=... CRON_SECRET=... \
//     node scripts/fill-cover-bank.mjs
//   ... node scripts/fill-cover-bank.mjs --dry-run   # só lista o que faria
//   ... node scripts/fill-cover-bank.mjs --sem-expurgo  # completa sem zerar
//
// Variáveis opcionais: SITE_URL (padrão https://veronicahub.com) e
// BANK_TARGET_PER_BEAT (padrão 10).
import { BEAT_VALUES } from "../src/lib/beats.ts";
import { interleaveByTerm, MAX_BANK_PER_BEAT, parseBankFilename } from "../src/lib/cover-bank.ts";
import { termosDaEditoria } from "../src/lib/cover-scenes.ts";
import { searchPexelsMany, searchPixabayMany } from "./lib/photo-sources.mjs";

const dryRun = process.argv.includes("--dry-run");
const semExpurgo = process.argv.includes("--sem-expurgo");
const siteUrl = (process.env.SITE_URL ?? "https://veronicahub.com").replace(/\/$/, "");
const target = Number(process.env.BANK_TARGET_PER_BEAT ?? 10);

function required(name) {
  const value = (process.env[name] ?? "").trim();
  if (!value) throw new Error(`${name} é obrigatório.`);
  return value;
}

const pexelsKey = required("PEXELS_API_KEY");
// O Pixabay é opcional de propósito: sem a chave a rodada continua, só com o
// Pexels. Exigir as duas faria uma chave que falta derrubar o abastecimento
// inteiro, e aí a Wire fica sem capa nova por causa da fonte secundária.
const pixabayKey = (process.env.PIXABAY_API_KEY ?? "").trim();
const cronSecret = required("CRON_SECRET");
const authorization = { authorization: `Bearer ${cronSecret}` };

async function readInventory() {
  const response = await fetch(`${siteUrl}/api/cron/cover-bank`, { headers: authorization });
  if (!response.ok) {
    throw new Error(`Não deu para ler o banco (${response.status}): ${await response.text()}`);
  }
  return response.json();
}

async function purgeBank() {
  const response = await fetch(`${siteUrl}/api/cron/cover-bank`, {
    method: "DELETE",
    headers: authorization,
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`DELETE ${response.status}: ${text}`);
  return JSON.parse(text);
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

// Busca uma cena nas duas fontes. Pexels primeiro na lista devolvida: com o
// alvo por editoria menor que o total de candidatos, quem vem antes é quem
// costuma ser escolhido, e o Pexels é o que entrega a resolução maior.
async function buscarCena(term, usedIds) {
  const doPexels = await searchPexelsMany(term, pexelsKey, usedIds, 30);
  const doPixabay = pixabayKey ? await searchPixabayMany(term, pixabayKey, usedIds, 30) : [];
  return (
    [...doPexels, ...doPixabay]
      // Sem fotógrafo não há como creditar, e o endpoint recusaria.
      .filter((photo) => photo.photoCredit)
      .map((photo) => ({ ...photo, term }))
  );
}

async function main() {
  if (!pixabayKey) {
    console.log("PIXABAY_API_KEY ausente — a rodada vai usar só o Pexels.\n");
  }

  if (!dryRun && !semExpurgo) {
    const purge = await purgeBank();
    console.log(
      `expurgo: ${purge.apagadas} apagadas, ${purge.preservadas} preservadas ` +
        `(em uso como capa de matéria publicada) — antes ${JSON.stringify(purge.antes)}`,
    );
  } else if (semExpurgo) {
    console.log("--sem-expurgo: o banco atual foi mantido, a rodada só completa o que falta.\n");
  }

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
  if (dryRun) console.log("simulação (--dry-run): nada será apagado nem cadastrado.\n");

  let added = 0;
  const porFonte = { pexels: 0, pixabay: 0 };
  for (const beat of BEAT_VALUES) {
    const current = (inventory.bank?.[beat] ?? []).length;
    let missing = limit - current;
    if (missing <= 0) {
      console.log(`${beat}: ${current} já cadastradas, nada a fazer.`);
      continue;
    }

    // Busca todas as cenas ANTES de consumir, para poder intercalar. Sem isso
    // a primeira cena enche a cota sozinha e a editoria inteira sai da mesma
    // imagem — foi o que o primeiro dry run mostrou, em 16/09.
    const porTermo = [];
    for (const term of termosDaEditoria(beat)) {
      porTermo.push(await buscarCena(term, usedIds));
    }

    for (const photo of interleaveByTerm(porTermo)) {
      if (missing <= 0) break;
      // Duas cenas podem devolver a mesma foto: a exclusão das buscas foi
      // aplicada antes de qualquer uma ser consumida nesta rodada.
      if (usedIds.has(photo.photoId)) continue;
      usedIds.add(photo.photoId);

      if (dryRun) {
        console.log(
          `  ${beat} ← ${photo.source}:${photo.photoId} (${photo.photoCredit}) · ${photo.term}`,
        );
        missing -= 1;
        added += 1;
        porFonte[photo.source] += 1;
        continue;
      }

      try {
        const bytes = await downloadJpeg(photo.imageUrl);
        const result = await addToBank({
          beat,
          photoId: photo.photoId,
          photographer: photo.photoCredit,
          term: photo.term,
          source: photo.source,
          mimeType: "image/jpeg",
          dataBase64: bytes.toString("base64"),
        });
        if (result.saved) {
          console.log(
            `  ${beat} ← ${result.saved} (${photo.photoCredit}, ${photo.term}, ${bytes.length} B)`,
          );
          missing -= 1;
          added += 1;
          porFonte[photo.source] += 1;
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
      console.log(`${beat}: faltaram ${missing} — as cenas não deram foto nova suficiente.`);
    }
  }

  console.log(
    `\ntotal cadastrado: ${added} (pexels ${porFonte.pexels}, pixabay ${porFonte.pixabay})`,
  );
}

await main();
