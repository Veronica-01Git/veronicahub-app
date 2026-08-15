// Compartilhado entre client (blog/$slug.tsx) e server (articles-server.ts)
// — por isso fica num módulo isolado, sem import de nada específico de
// framework. Detecta link de vídeo do YouTube dentro de sourceUrls; não
// existe coluna própria pra isso no schema (evita migração nova).
const YOUTUBE_RE = /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{6,})/i;

export function extractYoutubeId(url: string): string | null {
  const match = url.match(YOUTUBE_RE);
  return match ? match[1] : null;
}

export function findYoutubeUrl(sourceUrls: string[]): string | null {
  for (const url of sourceUrls) {
    if (YOUTUBE_RE.test(url)) return url;
  }
  return null;
}
