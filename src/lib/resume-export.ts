// ---------------------------------------------------------------------------
// Exportação real do currículo gerado — PDF e DOCX de verdade, gerados no
// navegador (pdf-lib / docx), sem depender de nenhum serviço externo.
// Bibliotecas carregadas sob demanda pra não pesar o bundle inicial.
// ---------------------------------------------------------------------------

import type { AtsResume } from "@/lib/resume-tools";

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadTxt(resume: AtsResume): void {
  triggerDownload(new Blob([resume.text], { type: "text/plain;charset=utf-8" }), "curriculo-ats.txt");
}

export async function downloadPdf(resume: AtsResume): Promise<void> {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 50;
  const maxWidth = pageWidth - margin * 2;

  let page = doc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  function ensureSpace(need: number) {
    if (y - need < margin) {
      page = doc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }
  }

  function wrapText(text: string, f: typeof font, size: number): string[] {
    const words = text.split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let current = "";
    for (const w of words) {
      const test = current ? `${current} ${w}` : w;
      if (current && f.widthOfTextAtSize(test, size) > maxWidth) {
        lines.push(current);
        current = w;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
    return lines.length ? lines : [""];
  }

  function drawParagraph(text: string, f: typeof font, size: number, gapAfter: number, color = rgb(0.11, 0.11, 0.11)) {
    for (const line of wrapText(text, f, size)) {
      ensureSpace(size + 4);
      page.drawText(line, { x: margin, y, size, font: f, color });
      y -= size + 4;
    }
    y -= gapAfter;
  }

  drawParagraph(resume.name, bold, 18, 4);
  if (resume.contactLine) drawParagraph(resume.contactLine, font, 10, 16, rgb(0.35, 0.35, 0.35));

  for (const section of resume.sections) {
    ensureSpace(28);
    drawParagraph(section.title, bold, 12, 6, rgb(0.05, 0.05, 0.05));
    const bodyLines = section.body.split("\n").filter(Boolean);
    for (const line of bodyLines) drawParagraph(line, font, 10.5, 2);
    y -= 10;
  }

  const bytes = await doc.save();
  triggerDownload(new Blob([new Uint8Array(bytes)], { type: "application/pdf" }), "curriculo-ats.pdf");
}

export async function downloadDocx(resume: AtsResume): Promise<void> {
  const { Document, Packer, Paragraph, HeadingLevel } = await import("docx");

  const children = [
    new Paragraph({ text: resume.name, heading: HeadingLevel.HEADING_1 }),
    ...(resume.contactLine ? [new Paragraph({ text: resume.contactLine })] : []),
  ];

  for (const section of resume.sections) {
    children.push(new Paragraph({ text: section.title, heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 80 } }));
    const bodyLines = section.body.split("\n").filter(Boolean);
    for (const line of bodyLines) {
      const isBullet = line.startsWith("- ");
      children.push(
        new Paragraph({
          text: isBullet ? line.slice(2) : line,
          bullet: isBullet ? { level: 0 } : undefined,
        }),
      );
    }
  }

  const doc = new Document({ sections: [{ children }] });
  const blob = await Packer.toBlob(doc);
  triggerDownload(blob, "curriculo-ats.docx");
}
