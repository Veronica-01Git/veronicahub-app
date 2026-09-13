// Gera as capas 9:16 dos cards de "vídeos virais do momento" da Veronica
// Analytics como .jpg estáticos, renderizando HTML/CSS com Chromium via
// Playwright — mesma técnica do scripts/render-cover.mjs do Wire, sem
// depender de API de geração de imagem paga nem de banco de fotos com
// chave. Lê src/data/trending-videos.json e escreve uma capa por vídeo:
//
//   node scripts/render-trending-covers.mjs
//
// Saída: public/images/trending/<id>.jpg, que é exatamente o caminho que o
// campo `thumbnailUrl` de cada vídeo aponta. Rode sempre que a rotina de
// 48h trocar a leva — capa velha com título novo fica pior que capa nenhuma.
//
// As cores por categoria espelham CATEGORY_META de
// src/routes/veronica-analytics.tsx; é script Node standalone, não dá pra
// importar o .tsx, então se uma categoria mudar lá, atualizar aqui também.
import { chromium } from "playwright";
import { mkdir, readFile } from "node:fs/promises";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

// Proporção do card na página (aspect-[9/16]); 720x1280 dá nitidez de sobra
// no maior tamanho que o card assume e ainda sai leve em jpeg.
const WIDTH = 720;
const HEIGHT = 1280;

const CATEGORY_META = {
  beleza: { label: "beleza", color: "#e11d5e", tint: "#ffe0e6" },
  casa: { label: "casa", color: "#0a9490", tint: "#d6f4ff" },
  saude: { label: "saúde", color: "#b8860b", tint: "#ffeccc" },
  moda: { label: "moda", color: "#e11d5e", tint: "#ffe0e6" },
  pet: { label: "pet", color: "#0a9490", tint: "#d6f4ff" },
  eletronicos: { label: "eletrônicos", color: "#b8860b", tint: "#ffeccc" },
};

const GOOGLE_FONTS_URL =
  "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=JetBrains+Mono:wght@500;700&display=swap";

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// O título vem no formato "Produto — gancho do formato". A capa dá peso ao
// produto e deixa o gancho como linha de apoio; se não houver travessão, o
// título inteiro vira o destaque.
function splitTitle(title) {
  const [head, ...rest] = title.split("—");
  return { head: head.trim(), tail: rest.join("—").trim() };
}

function buildHtml(video) {
  const meta = CATEGORY_META[video.category];
  if (!meta) throw new Error(`Categoria desconhecida: ${video.category}`);

  const { head, tail } = splitTitle(video.title);

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="stylesheet" href="${GOOGLE_FONTS_URL}" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: ${WIDTH}px; height: ${HEIGHT}px; overflow: hidden; }
  body {
    font-family: "JetBrains Mono", ui-monospace, monospace;
    background-color: #0e0e10;
    background-image:
      radial-gradient(ellipse 620px 520px at 18% 8%, ${meta.color}66, transparent 62%),
      radial-gradient(ellipse 560px 480px at 88% 92%, ${meta.tint}2e, transparent 60%),
      linear-gradient(#ffffff0d 1px, transparent 1px),
      linear-gradient(90deg, #ffffff0d 1px, transparent 1px);
    background-size: 100% 100%, 100% 100%, 64px 64px, 64px 64px;
    position: relative;
  }
  /* Cantos de visor — o card na página já usa essa linguagem de "frame"
     ilustrativo, deixando claro que não é print de um vídeo real. */
  .corner {
    position: absolute;
    width: 62px; height: 62px;
    border: 4px solid #ffffff59;
  }
  .corner.tl { top: 40px; left: 40px; border-right: 0; border-bottom: 0; border-radius: 12px 0 0 0; }
  .corner.tr { top: 40px; right: 40px; border-left: 0; border-bottom: 0; border-radius: 0 12px 0 0; }
  .corner.bl { bottom: 40px; left: 40px; border-right: 0; border-top: 0; border-radius: 0 0 0 12px; }
  .corner.br { bottom: 40px; right: 40px; border-left: 0; border-top: 0; border-radius: 0 0 12px 0; }
  .frame {
    position: absolute;
    inset: 0;
    padding: 88px 72px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .top { display: flex; align-items: center; justify-content: space-between; }
  .cat {
    font-size: 22px;
    font-weight: 700;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: ${meta.color};
    background: #ffffff;
    border-radius: 999px;
    padding: 12px 22px;
  }
  .rank {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 62px; height: 62px;
    border-radius: 999px;
    background: ${meta.color};
    color: #ffffff;
    font-size: 30px;
    font-weight: 700;
  }
  .head {
    font-family: "Bricolage Grotesque", system-ui, sans-serif;
    font-weight: 800;
    font-size: 76px;
    line-height: 0.98;
    letter-spacing: -0.03em;
    color: #ffffff;
  }
  .tail {
    margin-top: 26px;
    font-size: 28px;
    line-height: 1.35;
    color: #ffffffb8;
  }
  .growth {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    margin-top: 40px;
    padding: 14px 24px;
    border-radius: 999px;
    background: #ffffff;
    color: ${meta.color};
    font-size: 26px;
    font-weight: 700;
    width: fit-content;
  }
  .bottom {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    font-size: 22px;
    color: #ffffff8c;
  }
  .views { font-weight: 700; color: #ffffffd9; }
</style>
</head>
<body>
  <div class="corner tl"></div><div class="corner tr"></div>
  <div class="corner bl"></div><div class="corner br"></div>
  <div class="frame">
    <div class="top">
      <span class="cat">${escapeHtml(meta.label)}</span>
      <span class="rank">${video.rank}</span>
    </div>
    <div>
      <div class="head">${escapeHtml(head)}</div>
      ${tail ? `<div class="tail">${escapeHtml(tail)}</div>` : ""}
      <div class="growth">▲ ${escapeHtml(video.growthLabel)}</div>
    </div>
    <div class="bottom">
      <span class="views">${escapeHtml(video.views)}</span>
      <span>${escapeHtml(video.gmvLabel)}</span>
    </div>
  </div>
</body>
</html>`;
}

// No CI o Playwright baixa o Chromium que casa com sua versão e acha
// sozinho. Em ambientes que já trazem um Chromium pré-instalado (a versão
// pode não bater com a do pacote), apontamos o executável em vez de baixar
// outro. Retorna undefined quando não há nada pré-instalado — aí o
// Playwright resolve como de costume.
function findPreinstalledChromium() {
  if (process.env.TRENDING_COVER_CHROMIUM) return process.env.TRENDING_COVER_CHROMIUM;

  const base = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (!base || !existsSync(base)) return undefined;

  for (const entry of readdirSync(base)) {
    if (!entry.startsWith("chromium-")) continue;
    const candidate = path.join(base, entry, "chrome-linux", "chrome");
    if (existsSync(candidate)) return candidate;
  }
  return undefined;
}

async function main() {
  const feedPath = path.join(ROOT, "src", "data", "trending-videos.json");
  const feed = JSON.parse(await readFile(feedPath, "utf8"));

  const outDir =
    process.env.TRENDING_COVER_OUT_DIR ??
    path.join(ROOT, "public", "images", "trending");
  await mkdir(outDir, { recursive: true });

  const executablePath = findPreinstalledChromium();
  const browser = await chromium.launch(executablePath ? { executablePath } : {});
  try {
    const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT } });
    for (const video of feed.videos) {
      await page.setContent(buildHtml(video), { waitUntil: "networkidle" });
      const outPath = path.join(outDir, `${video.id}.jpg`);
      await page.screenshot({ path: outPath, type: "jpeg", quality: 82 });
      console.log(outPath);
    }
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
