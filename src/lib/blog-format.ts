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
