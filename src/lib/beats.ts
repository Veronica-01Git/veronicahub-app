// Fonte única das editorias do Veronica Wire (/blog) — usado tanto no
// server (prompt da IA, validação) quanto no client (rótulos, cores, ícone
// por editoria em blog.tsx). Cores/ícones ficam só no client porque
// dependem de lucide-react/CSS, que não faz sentido num módulo server.
export const BEAT_VALUES = ["ia", "clima", "economia", "geopolitica", "mercado"] as const;
export type Beat = (typeof BEAT_VALUES)[number];

// Janela editorial de duas horas usada pela trava de duplicação e pelo
// rodízio das cinco editorias. Um giro completo dura dez horas.
export const CYCLE_HOURS = 2;

// Conta intervalos desde uma data fixa para o rodízio não reiniciar à meia-noite.
// Com cinco editorias e doze intervalos por dia, usar apenas getUTCHours()
// repetiria algumas editorias antes de completar o giro.
export function beatForDate(date: Date): Beat {
  const slot = Math.floor(date.getTime() / (CYCLE_HOURS * 60 * 60 * 1_000));
  return BEAT_VALUES[((slot % BEAT_VALUES.length) + BEAT_VALUES.length) % BEAT_VALUES.length];
}

export function isBeat(value: unknown): value is Beat {
  return typeof value === "string" && (BEAT_VALUES as readonly string[]).includes(value);
}

export const BEAT_LABELS: Record<Beat, string> = {
  ia: "Inteligência Artificial",
  clima: "Clima Futuro · Energia Limpa",
  economia: "Economia · Yuan Digital",
  geopolitica: "Geopolítica · Brasil e China",
  mercado: "Mercado Tecnológico Global",
};

export const BEAT_SHORT: Record<Beat, string> = {
  ia: "IA",
  clima: "Clima",
  economia: "Economia",
  geopolitica: "Geopolítica",
  mercado: "Mercado",
};
