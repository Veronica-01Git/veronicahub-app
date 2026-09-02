// Item 9 do brief "capas fotográficas automáticas (v2)": varre as matérias
// publicadas que ainda não têm capa fotográfica de verdade (coverPhotoId
// null — inclui as com card tipográfico, foto do CloudFront de uma sessão
// anterior, ou sem capa nenhuma) e tenta achar uma foto real pra cada uma.
//
// Roda LOCAL, fora do Worker e fora do Action do cron — precisa de
// DATABASE_URL, ANTHROPIC_API_KEY e PEXELS_API_KEY (PIXABAY_API_KEY
// opcional) no ambiente.
//
// Por padrão é dry-run: só lista o que faria, sem gravar nada (nem no
// Postgres, nem em public/). Passa --apply pra valer.
//
// Uso:
//   node scripts/reprocess-covers.mjs                # dry-run
//   node scripts/reprocess-covers.mjs --apply         # grava de verdade
//   node scripts/reprocess-covers.mjs --limit 5        # só as 5 mais antigas
import { neon } from "@neondatabase/serverless";
import Anthropic from "@anthropic-ai/sdk";
import { mkdir, copyFile, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { searchPexels, searchPixabay, downloadTo } from "./lib/photo-sources.mjs";

const APPLY = process.argv.includes("--apply");
const limitArgIndex = process.argv.indexOf("--limit");
const LIMIT =
  limitArgIndex !== -1 && process.argv[limitArgIndex + 1]
    ? Number(process.argv[limitArgIndex + 1])
    : 50;

const OUT_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "public",
  "images",
  "blog-covers",
);

const BEAT_LABELS = {
  ia: "Inteligência Artificial",
  clima: "Clima Futuro · Energia Limpa",
  economia: "Economia · Yuan Digital",
  geopolitica: "Geopolítica · China, EUA e Brasil",
  mercado: "Mercado Tecnológico Global",
};

async function fetchFotoTermos(anthropic, { headline, excerpt, beat }) {
  const prompt = `Editoria: ${BEAT_LABELS[beat] ?? beat}
Manchete: ${headline}
Resumo: ${excerpt}

Devolva SOMENTE um objeto JSON válido (sem markdown, sem texto antes ou depois) com dois ou três termos de busca em inglês pra achar uma fotografia que ilustre essa matéria num banco de imagens. Use substantivos concretos e fotografáveis — objetos, lugares, equipamentos, ambientes. Nunca conceitos abstratos, nomes de empresa, logotipos ou pessoas públicas. Formato: {"fotoTermos": ["termo 1", "termo 2", "termo 3"]}`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 300,
    messages: [{ role: "user", content: prompt }],
  });
  const text = response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) return [];
  try {
    const parsed = JSON.parse(text.slice(start, end + 1));
    return Array.isArray(parsed.fotoTermos)
      ? parsed.fotoTermos.filter((t) => typeof t === "string").slice(0, 3)
      : [];
  } catch {
    return [];
  }
}

async function fileExists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const { DATABASE_URL, ANTHROPIC_API_KEY, PEXELS_API_KEY, PIXABAY_API_KEY } = process.env;
  if (!DATABASE_URL || !ANTHROPIC_API_KEY) {
    console.error("Faltam DATABASE_URL e/ou ANTHROPIC_API_KEY no ambiente.");
    process.exit(1);
  }
  if (!PEXELS_API_KEY && !PIXABAY_API_KEY) {
    console.error("Sem PEXELS_API_KEY nem PIXABAY_API_KEY — nada pra buscar. Abortando.");
    process.exit(1);
  }

  const sql = neon(DATABASE_URL);
  const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

  const candidates = await sql`
    SELECT id, slug, beat, headline, excerpt
    FROM "Article"
    WHERE status = 'published' AND "coverPhotoId" IS NULL AND "coverManual" = false
    ORDER BY "publishedAt" ASC
    LIMIT ${LIMIT}
  `;

  console.log(`${candidates.length} matéria(s) candidata(s) a foto real.`);
  console.log(
    APPLY ? "Modo: APLICANDO de verdade.\n" : "Modo: SIMULAÇÃO (dry-run) — nada será gravado.\n",
  );

  const recentRows = await sql`
    SELECT "coverPhotoId" FROM "Article"
    WHERE status = 'published' AND "coverPhotoId" IS NOT NULL
    ORDER BY "publishedAt" DESC LIMIT 20
  `;
  const recentPhotoIds = new Set(recentRows.map((r) => r.coverPhotoId));

  const upgraded = [];
  const stillWithoutPhoto = [];

  for (const article of candidates) {
    const fotoTermos = await fetchFotoTermos(anthropic, article);
    console.log(`- ${article.slug} (${article.beat}) — fotoTermos: ${JSON.stringify(fotoTermos)}`);

    let found = null;
    for (const term of fotoTermos) {
      if (PEXELS_API_KEY) found = await searchPexels(term, PEXELS_API_KEY, recentPhotoIds);
      if (!found && PIXABAY_API_KEY)
        found = await searchPixabay(term, PIXABAY_API_KEY, recentPhotoIds);
      if (found) break;
    }

    if (found) {
      recentPhotoIds.add(found.photoId);
      console.log(`  -> achou: photoId=${found.photoId} credit="${found.photoCredit}"`);
      upgraded.push({ slug: article.slug, photoId: found.photoId });

      if (APPLY) {
        await mkdir(OUT_DIR, { recursive: true });
        const outPath = path.join(OUT_DIR, `${article.slug}.jpg`);
        try {
          await downloadTo(found.imageUrl, outPath);
        } catch (error) {
          console.error(`  !! ${error.message}, pulando gravação.`);
          continue;
        }
        await sql`
          UPDATE "Article"
          SET "coverImageUrl" = ${`https://veronicahub.com/images/blog-covers/${article.slug}.jpg`},
              "coverPhotoId" = ${found.photoId},
              "coverPhotoCredit" = ${found.photoCredit},
              "coverPhotoUrl" = ${found.photoUrl},
              "updatedAt" = now()
          WHERE id = ${article.id} AND "coverManual" = false
        `;
        console.log(`  -> gravado em ${outPath} e atualizado no banco.`);
      }
    } else {
      // Nível 3 do fallback: foto genérica fixa por editoria, se existir.
      const fallbackPath = path.join(OUT_DIR, "_fallback", `${article.beat}.jpg`);
      if (await fileExists(fallbackPath)) {
        console.log(`  -> sem foto específica; usaria a genérica de "${article.beat}".`);
        if (APPLY) {
          const outPath = path.join(OUT_DIR, `${article.slug}.jpg`);
          await copyFile(fallbackPath, outPath);
          await sql`
            UPDATE "Article"
            SET "coverImageUrl" = ${`https://veronicahub.com/images/blog-covers/${article.slug}.jpg`},
                "updatedAt" = now()
            WHERE id = ${article.id} AND "coverManual" = false
          `;
          console.log(`  -> gravado (fallback genérico) em ${outPath}.`);
        }
      } else {
        console.log("  -> nada encontrado, ficou como estava.");
        stillWithoutPhoto.push(article.slug);
      }
    }
  }

  console.log("\n--- Resumo ---");
  console.log(`Atualizadas com foto real: ${upgraded.length}`);
  if (stillWithoutPhoto.length > 0) {
    console.log(`Sem foto real (sem termos úteis nem fallback genérico):`);
    for (const slug of stillWithoutPhoto) console.log(`  - ${slug}`);
  }
  if (!APPLY) {
    console.log("\nEra simulação — rode com --apply pra gravar de verdade.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
