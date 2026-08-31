// Gera a capa (1200x630, og:image-ready) de uma matéria do Veronica Wire
// como .jpg estático, renderizando um card HTML/CSS com Chromium via
// Playwright. Usado pelo workflow do cron (.github/workflows/generate-article.yml)
// pra dar capa às matérias publicadas automaticamente a cada 5h, sem depender
// de uma API de geração de imagem paga. Também pode rodar manual:
//
//   COVER_SLUG=foo COVER_HEADLINE="..." COVER_BEAT=ia COVER_DESK="Desk de X" \
//     node scripts/render-cover.mjs
//
// Espelha as cores/rótulos por editoria de src/lib/beats.ts +
// src/routes/blog/index.tsx (BEAT_COLOR) — é um script Node standalone, não
// dá pra importar o .tsx direto, então se uma editoria mudar lá, atualizar
// aqui também.
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const BEAT_META = {
  ia: { short: "IA", color: "oklch(0.58 0.17 155)" },
  clima: { short: "Clima", color: "oklch(0.55 0.13 220)" },
  economia: { short: "Economia", color: "oklch(0.62 0.15 85)" },
  geopolitica: { short: "Geopolítica", color: "oklch(0.58 0.19 25)" },
  mercado: { short: "Mercado", color: "oklch(0.56 0.16 290)" },
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

// "oklch(L C H)" -> "oklch(L C H / alpha)" — alpha precisa entrar dentro da
// função, não depois do parêntese de fechamento.
function withAlpha(oklch, alpha) {
  return oklch.replace(/\)$/, ` / ${alpha})`);
}

function buildHtml({ headline, beat, desk }) {
  const meta = BEAT_META[beat];
  if (!meta) throw new Error(`Editoria desconhecida: ${beat}`);

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="stylesheet" href="${GOOGLE_FONTS_URL}" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 1200px; height: 630px; overflow: hidden; }
  body {
    font-family: "JetBrains Mono", ui-monospace, monospace;
    background-color: oklch(0.14 0.015 200);
    background-image:
      radial-gradient(ellipse 900px 500px at 85% -10%, ${withAlpha(meta.color, 0.22)}, transparent 60%),
      linear-gradient(oklch(0.85 0.22 155 / 0.05) 1px, transparent 1px),
      linear-gradient(90deg, oklch(0.85 0.22 155 / 0.05) 1px, transparent 1px);
    background-size: 100% 100%, 48px 48px, 48px 48px;
    position: relative;
  }
  .spine {
    position: absolute;
    top: 0; left: 0; bottom: 0;
    width: 10px;
    background: linear-gradient(180deg, ${meta.color}, oklch(0.14 0.015 200));
  }
  .frame {
    position: absolute;
    inset: 0;
    padding: 56px 64px 48px 88px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .row-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .wordmark {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 20px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: oklch(0.85 0.22 155);
  }
  .wordmark .dot {
    width: 10px;
    height: 10px;
    border-radius: 2px;
    background: oklch(0.85 0.22 155);
  }
  .pill {
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: ${meta.color};
    border: 1px solid ${meta.color};
    background: color-mix(in oklch, ${meta.color} 14%, transparent);
    border-radius: 4px;
    padding: 7px 14px;
  }
  .headline {
    font-family: "Bricolage Grotesque", "Archivo Black", system-ui, sans-serif;
    font-weight: 800;
    letter-spacing: -0.03em;
    line-height: 1.06;
    font-size: 58px;
    color: oklch(0.97 0.01 180);
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 4;
    overflow: hidden;
  }
  .row-bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 14px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: oklch(0.65 0.03 190);
  }
  .row-bottom .domain {
    color: oklch(0.88 0.15 195);
  }
</style>
</head>
<body>
  <div class="spine"></div>
  <div class="frame">
    <div class="row-top">
      <div class="wordmark"><span class="dot"></span>Veronica Wire</div>
      <div class="pill">${escapeHtml(meta.short)}</div>
    </div>
    <div class="headline">${escapeHtml(headline)}</div>
    <div class="row-bottom">
      <span>${escapeHtml(desk)}</span>
      <span class="domain">veronicahub.com</span>
    </div>
  </div>
</body>
</html>`;
}

async function render({ slug, headline, beat, desk, outDir }) {
  const html = buildHtml({ headline, beat, desk });
  const outPath = path.join(outDir, `${slug}.jpg`);
  await mkdir(outDir, { recursive: true });

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
    await page.setContent(html, { waitUntil: "networkidle" });
    await page.screenshot({ path: outPath, type: "jpeg", quality: 92 });
  } finally {
    await browser.close();
  }
  return outPath;
}

async function main() {
  const slug = process.env.COVER_SLUG;
  const headline = process.env.COVER_HEADLINE;
  const beat = process.env.COVER_BEAT;
  const desk = process.env.COVER_DESK;

  if (!slug || !headline || !beat || !desk) {
    console.error(
      "Faltam variáveis de ambiente. Necessário: COVER_SLUG, COVER_HEADLINE, COVER_BEAT, COVER_DESK.",
    );
    process.exit(1);
  }

  const outDir =
    process.env.COVER_OUT_DIR ??
    path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      "..",
      "public",
      "images",
      "blog-covers",
    );

  const outPath = await render({ slug, headline, beat, desk, outDir });
  console.log(outPath);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
