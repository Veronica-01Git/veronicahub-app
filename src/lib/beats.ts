// Fonte única das editorias do Veronica Wire (/blog) — usado tanto no
// server (prompt da IA, validação) quanto no client (rótulos, cores, ícone
// por editoria em blog.tsx). Cores/ícones ficam só no client porque
// dependem de lucide-react/CSS, que não faz sentido num módulo server.
export const BEAT_VALUES = ["ia", "clima", "economia", "geopolitica", "mercado"] as const;
export type Beat = (typeof BEAT_VALUES)[number];

// Duração da janela do cron automático (article-cron.ts escolhe a editoria
// por essa janela; articles-server.ts usa o mesmo valor pra checar
// duplicata dentro da janela atual antes de publicar).
export const CYCLE_HOURS = 5;

export function isBeat(value: unknown): value is Beat {
  return typeof value === "string" && (BEAT_VALUES as readonly string[]).includes(value);
}

export const BEAT_LABELS: Record<Beat, string> = {
  ia: "Inteligência Artificial",
  clima: "Clima Futuro · Energia Limpa",
  economia: "Economia · Yuan Digital",
  geopolitica: "Geopolítica · China, EUA e Brasil",
  mercado: "Mercado Tecnológico Global",
};

export const BEAT_SHORT: Record<Beat, string> = {
  ia: "IA",
  clima: "Clima",
  economia: "Economia",
  geopolitica: "Geopolítica",
  mercado: "Mercado",
};
