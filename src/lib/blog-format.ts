// Compartilhado por blog/index.tsx e blog/$beat.tsx — mesmo texto relativo
// ("há 12 min", "há 3h") nas duas páginas que listam matérias do Wire.
export function formatAgo(publishedAt: string | null, now: Date): string {
  if (!publishedAt) return "";
  const minutes = Math.max(
    0,
    Math.round((now.getTime() - new Date(publishedAt).getTime()) / 60000),
  );
  if (minutes < 1) return "agora mesmo";
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours}h`;
  return `há ${Math.floor(hours / 24)}d`;
}

// Imagem dentro do corpo da matéria (27/09/2026, matérias da editoria
// Veronica, que trazem mais de uma foto). O corpo continua sendo texto puro:
// um parágrafo que é SÓ `![legenda](/images/...)` vira figura. Aceita apenas
// arquivo servido pelo próprio site (/images/...), com caracteres de caminho
// comuns — nada de URL externa nem marcação arbitrária no corpo.
const BODY_IMAGE = /^!\[([^\]\n]{0,300})\]\((\/images\/[A-Za-z0-9._\-/]+\.(?:jpe?g|png|webp))\)$/;

export function parseBodyImage(paragraph: string): { src: string; alt: string } | null {
  const match = BODY_IMAGE.exec(paragraph.trim());
  if (!match || match[2].includes("..")) return null;
  return { alt: match[1].trim(), src: match[2] };
}
