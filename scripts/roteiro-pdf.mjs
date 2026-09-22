// Gera o PDF do roteiro de subida a partir do ROTEIRO-DE-SUBIDA.md.
//
//   node scripts/roteiro-pdf.mjs
//   node scripts/roteiro-pdf.mjs --so-html      para só o HTML, sem navegador
//
// POR QUE ESTE SCRIPT EXISTE. O PDF que vai para o dono da Express Entulho foi
// montado à mão numa sessão de trabalho, com um conversor improvisado que
// morava numa pasta temporária. Funcionou e sumiu. Na vez seguinte que o
// roteiro mudar, refazer do zero é meia hora e o resultado sai diferente.
// Aqui o roteiro tem um jeito só de virar PDF, e ele é reproduzível.
//
// O CORTE DA SEÇÃO INTERNA É A PARTE QUE MAIS IMPORTA. O markdown termina com
// "Notas para a equipe técnica" — nomes de variável, endpoint, comando. Isso
// NÃO pode chegar ao cliente. O corte é por título, e um corte por título
// falha em silêncio se alguém renomear o título. Então o script confere que a
// seção existe e SE RECUSA a gerar quando não acha: melhor ficar sem PDF do
// que entregar PDF com nota interna dentro.

import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ORIGEM = path.join(raiz, "ROTEIRO-DE-SUBIDA.md");
const DESTINO = path.join(raiz, "tmp", "Express-Entulho-o-que-falta");

/** O título da seção que não vai para o cliente. */
const SECAO_INTERNA = "## Notas para a equipe técnica";

const CSS = `
@page { size: A4; margin: 18mm 17mm 20mm 17mm; }
* { box-sizing: border-box; }
body {
  font-family: "DejaVu Sans", "Liberation Sans", Arial, sans-serif;
  color: #1f2933; font-size: 10.6pt; line-height: 1.55; margin: 0;
  -webkit-print-color-adjust: exact; print-color-adjust: exact;
}
.capa { border-bottom: 3px solid #0f7b4f; padding-bottom: 14px; margin-bottom: 22px; }
.selo { font-size: 7.8pt; letter-spacing: .16em; text-transform: uppercase;
  color: #0f7b4f; font-weight: 700; margin-bottom: 9px; }
h1 { font-size: 21pt; line-height: 1.15; margin: 0; letter-spacing: -.02em; }
h2 { font-size: 13.2pt; color: #0f7b4f; margin: 26px 0 9px; break-after: avoid; }
h2 + p, h2 + ul, h2 + ol, h2 + table { break-before: avoid; }
p { margin: 0 0 9px; text-align: justify; }
ul, ol { margin: 0 0 11px; padding-left: 20px; }
li { margin-bottom: 4px; }
li::marker { color: #0f7b4f; }
strong { font-weight: 700; }
code { font-family: "DejaVu Sans Mono", monospace; font-size: 9pt;
  background: #f1f4f2; padding: 1px 4px; border-radius: 3px; }
table { width: 100%; border-collapse: collapse; margin: 6px 0 16px;
  font-size: 9.3pt; break-inside: avoid; }
th { background: #0f7b4f; color: #fff; text-align: left; padding: 7px 9px; font-weight: 700; }
td { padding: 7px 9px; border: 1px solid #d8dee4; vertical-align: top; }
tbody tr:nth-child(even) td { background: #f3f6f4; }
.sec { break-inside: avoid; }
.rodape-nota { margin-top: 26px; padding-top: 12px; border-top: 1px solid #d8dee4;
  font-size: 8.4pt; color: #6b7280; }
`;

const escapar = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Negrito, código e a seta — na ordem: escapa primeiro, marca depois. */
function inline(texto) {
  return escapar(texto)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/-&gt;/g, "→");
}

const ehSeparadorDeTabela = (celulas) =>
  celulas.filter(Boolean).every((c) => /^:?-{2,}:?$/.test(c));

const ehItemDeLista = (linha) => /^([-*]|\d+\.)\s+/.test(linha);

function converter(markdown) {
  if (!markdown.includes(SECAO_INTERNA)) {
    throw new Error(
      `não achei a seção interna ("${SECAO_INTERNA}") para cortar.\n` +
        "Se ela foi renomeada, ajuste SECAO_INTERNA neste script. Se foi removida de\n" +
        "propósito, apague esta checagem. Não gerei nada para não vazar nota interna.",
    );
  }

  const corpo = markdown
    .split(SECAO_INTERNA)[0]
    .replace(/\s*-+\s*$/, "")
    .trimEnd();
  const linhas = corpo.split("\n");
  const saida = [];
  let titulo = "Roteiro";
  let secaoAberta = false;
  let i = 0;

  const fecharSecao = () => {
    if (secaoAberta) {
      saida.push("</section>");
      secaoAberta = false;
    }
  };

  while (i < linhas.length) {
    const atual = linhas[i].trim();

    if (!atual) {
      i += 1;
      continue;
    }

    if (atual.startsWith("# ")) {
      titulo = inline(atual.slice(2));
      i += 1;
      continue;
    }

    if (atual.startsWith("## ")) {
      fecharSecao();
      saida.push('<section class="sec">', `<h2>${inline(atual.slice(3))}</h2>`);
      secaoAberta = true;
      i += 1;
      continue;
    }

    // Régua do markdown: separa seções na leitura, e aqui o espaçamento do
    // CSS já faz esse trabalho.
    if (/^-{3,}$/.test(atual)) {
      i += 1;
      continue;
    }

    if (atual.startsWith("|")) {
      const bloco = [];
      while (i < linhas.length && linhas[i].trim().startsWith("|")) {
        bloco.push(linhas[i].trim());
        i += 1;
      }
      const celulas = bloco
        .map((l) =>
          l
            .replace(/^\||\|$/g, "")
            .split("|")
            .map((c) => c.trim()),
        )
        .filter((cs) => !ehSeparadorDeTabela(cs));
      if (celulas.length > 0) {
        const [cabecalho, ...corpoTabela] = celulas;
        saida.push("<table><thead><tr>");
        saida.push(...cabecalho.map((c) => `<th>${inline(c)}</th>`));
        saida.push("</tr></thead><tbody>");
        for (const linha of corpoTabela) {
          saida.push(`<tr>${linha.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`);
        }
        saida.push("</tbody></table>");
      }
      continue;
    }

    if (ehItemDeLista(atual)) {
      const tag = /^\d+\.\s/.test(atual) ? "ol" : "ul";
      saida.push(`<${tag}>`);
      while (i < linhas.length && ehItemDeLista(linhas[i].trim())) {
        let texto = linhas[i].trim().replace(/^([-*]|\d+\.)\s+/, "");
        i += 1;
        // Continuação indentada do mesmo item.
        while (
          i < linhas.length &&
          linhas[i].startsWith("  ") &&
          linhas[i].trim() &&
          !ehItemDeLista(linhas[i].trim())
        ) {
          texto += ` ${linhas[i].trim()}`;
          i += 1;
        }
        saida.push(`<li>${inline(texto)}</li>`);
      }
      saida.push(`</${tag}>`);
      continue;
    }

    // Parágrafo: junta até a linha em branco ou o próximo bloco.
    const partes = [];
    while (
      i < linhas.length &&
      linhas[i].trim() &&
      !/^(#|\||-{3,})/.test(linhas[i].trim()) &&
      !ehItemDeLista(linhas[i].trim())
    ) {
      partes.push(linhas[i].trim());
      i += 1;
    }
    saida.push(`<p>${inline(partes.join(" "))}</p>`);
  }

  fecharSecao();

  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<title>${titulo}</title><style>${CSS}</style></head><body>
<div class="capa"><div class="selo">YO LAB &amp; CO. &middot; Veronica Hub</div><h1>${titulo}</h1></div>
${saida.join("")}
<div class="rodape-nota">Projeto VH-AUT-WA-2026-000001 &middot; Documento preparado para o proprietário da Express Entulho.</div>
</body></html>`;
}

const RODAPE_PDF = `<div style="width:100%;font-family:Arial,sans-serif;font-size:7.6pt;color:#6b7280;
  padding:0 17mm;display:flex;justify-content:space-between;border-top:1px solid #d8dee4;padding-top:4px;">
  <span>Express Entulho &middot; Projeto VH-AUT-WA-2026-000001 &middot; YO LAB &amp; CO.</span>
  <span class="pageNumber"></span></div>`;

async function main() {
  const soHtml = process.argv.includes("--so-html");
  const html = converter(await readFile(ORIGEM, "utf8"));

  await mkdir(path.dirname(DESTINO), { recursive: true });
  const caminhoHtml = `${DESTINO}.html`;
  await writeFile(caminhoHtml, html, "utf8");
  console.log(`HTML: ${caminhoHtml}`);

  if (soHtml) return;

  // O playwright não está no package.json — mesma situação de
  // render-trending-covers.mjs, que também o importa. Em vez de estourar com
  // "Cannot find package", diz o que fazer: o HTML acima já está pronto e
  // imprime para PDF em qualquer navegador.
  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch {
    console.log(
      "\nPlaywright não instalado, então o PDF não foi gerado.\n" +
        "  Opção 1: abra o HTML acima no navegador e imprima para PDF (Ctrl+P).\n" +
        "  Opção 2: npm install --no-save playwright && rode de novo.",
    );
    return;
  }

  // PLAYWRIGHT_BROWSERS_PATH aponta para o Chromium já instalado no ambiente
  // remoto; fora dele, o playwright acha o próprio.
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM ?? undefined;
  const navegador = await chromium.launch(executablePath ? { executablePath } : {});
  try {
    const pagina = await navegador.newPage();
    await pagina.goto(`file://${caminhoHtml}`, { waitUntil: "networkidle" });
    await pagina.pdf({
      path: `${DESTINO}.pdf`,
      format: "A4",
      printBackground: true,
      margin: { top: "18mm", bottom: "20mm", left: "17mm", right: "17mm" },
      displayHeaderFooter: true,
      headerTemplate: "<div></div>",
      footerTemplate: RODAPE_PDF,
    });
    console.log(`PDF:  ${DESTINO}.pdf`);
  } finally {
    await navegador.close();
  }
}

main().catch((erro) => {
  console.error(`\nERRO: ${erro.message}`);
  process.exit(1);
});
