// ---------------------------------------------------------------------------
// Extração de texto de arquivo — roda só no navegador (nunca em SSR). Cada
// parser é importado sob demanda para não pesar o bundle inicial da rota.
// ---------------------------------------------------------------------------

export type ParsedFile = { text: string; warning?: string };

function extFromName(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : "";
}

async function readAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return await file.arrayBuffer();
}

async function readAsText(file: File): Promise<string> {
  return await file.text();
}

async function parsePdf(file: File): Promise<ParsedFile> {
  const pdfjsLib = await import("pdfjs-dist");
  const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

  const buffer = await readAsArrayBuffer(file);
  const doc = await pdfjsLib.getDocument({ data: buffer }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const line = content.items.map((it) => ("str" in it ? it.str : "")).join(" ");
    pages.push(line);
  }
  const text = pages.join("\n");
  if (text.trim().length < 20) {
    return {
      text,
      warning: "O PDF parece ser uma imagem escaneada (sem texto selecionável). Cole o texto manualmente.",
    };
  }
  return { text };
}

async function parseDocx(file: File): Promise<ParsedFile> {
  const mammoth = await import("mammoth");
  const buffer = await readAsArrayBuffer(file);
  const result = await mammoth.extractRawText({ arrayBuffer: buffer });
  return { text: result.value };
}

async function parseHtml(file: File): Promise<ParsedFile> {
  const html = await readAsText(file);
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll("script, style").forEach((el) => el.remove());
  const text = (doc.body?.textContent ?? "").replace(/\n{3,}/g, "\n\n").trim();
  return { text };
}

export const SUPPORTED_EXTENSIONS = ["txt", "pdf", "docx", "html", "htm"];
export const ACCEPT_ATTR = ".txt,.pdf,.docx,.html,.htm";

export async function extractTextFromFile(file: File): Promise<ParsedFile> {
  const ext = extFromName(file.name);
  switch (ext) {
    case "txt":
      return { text: await readAsText(file) };
    case "pdf":
      return parsePdf(file);
    case "docx":
      return parseDocx(file);
    case "html":
    case "htm":
      return parseHtml(file);
    case "doc":
      throw new Error(
        "Arquivos .doc antigos (Word 97-2003) não são suportados. Salve como .docx ou PDF, ou cole o texto direto.",
      );
    default:
      throw new Error(
        `Formato .${ext || "desconhecido"} não suportado. Use .pdf, .docx, .html ou .txt — ou cole o texto direto.`,
      );
  }
}
