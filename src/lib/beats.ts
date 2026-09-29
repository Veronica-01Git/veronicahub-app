// Fonte única das editorias do Veronica Wire (/blog) — usado tanto no
// server (prompt da IA, validação) quanto no client (rótulos, cores, ícone
// por editoria em blog.tsx). Cores/ícones ficam só no client porque
// dependem de lucide-react/CSS, que não faz sentido num módulo server.
//
// TRÊS LISTAS, desde 27/09/2026 (nova linha editorial pedida pela editora):
//
// - BEAT_VALUES: todas as editorias que existem no banco (enum ArticleBeat).
//   Inclui as aposentadas, porque matéria antiga continua publicada e
//   precisa de rótulo, cor e página.
// - ACTIVE_BEATS: as editorias da linha editorial atual — menu, home do
//   Wire, sitemap. É o que o leitor vê como "as editorias do Wire".
// - ROTATION_BEATS: as que o cron gera sozinho, de hora em hora. A editoria
//   "veronica" fica fora de propósito: é conteúdo da casa, escrito com a
//   dona, nunca apurado por conta própria pelo modelo.
export const BEAT_VALUES = [
  "ia",
  "clima",
  "economia",
  "geopolitica",
  "mercado",
  "sc",
  "veronica",
] as const;
export type Beat = (typeof BEAT_VALUES)[number];

export const ACTIVE_BEATS = [
  "veronica",
  "ia",
  "sc",
  "economia",
  "clima",
] as const satisfies readonly Beat[];

export const ROTATION_BEATS = ["ia", "sc", "economia", "clima"] as const satisfies readonly Beat[];

/** Editorias fora da linha atual: só existem para as matérias antigas. */
export const RETIRED_BEATS = ["geopolitica", "mercado"] as const satisfies readonly Beat[];

// Janela editorial horária usada pela trava de duplicação. O workflow agenda
// cada uma das editorias do rodízio separadamente dentro da mesma hora.
export const CYCLE_HOURS = 1;

export function isBeat(value: unknown): value is Beat {
  return typeof value === "string" && (BEAT_VALUES as readonly string[]).includes(value);
}

export function isActiveBeat(value: unknown): boolean {
  return typeof value === "string" && (ACTIVE_BEATS as readonly string[]).includes(value);
}

export const BEAT_LABELS: Record<Beat, string> = {
  ia: "Inteligência Artificial",
  clima: "Terras Raras · Futuro Climático",
  economia: "China + Brasil · Yuan Digital",
  geopolitica: "Geopolítica · Brasil e China",
  mercado: "Mercado Tecnológico Global",
  sc: "Santa Catarina · Itajaí e BC",
  veronica: "Veronica Hub",
};

export const BEAT_SHORT: Record<Beat, string> = {
  ia: "IA",
  clima: "Terras Raras & Clima",
  economia: "China + Brasil",
  geopolitica: "Geopolítica",
  mercado: "Mercado",
  sc: "Santa Catarina",
  veronica: "Veronica",
};
