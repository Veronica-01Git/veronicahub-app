export const ANALYTICS_PERIODS = [7, 30, 90] as const;
export type AnalyticsPeriod = (typeof ANALYTICS_PERIODS)[number];

export const ANALYTICS_SOURCES = [
  { key: "link_divulgador", label: "Geral" },
  { key: "analytics_instagram", label: "Instagram" },
  { key: "analytics_tiktok", label: "TikTok" },
  { key: "analytics_whatsapp", label: "WhatsApp" },
] as const;

export function validateAnalyticsPeriod(input: unknown): { days: AnalyticsPeriod } {
  const days = (input as { days?: unknown })?.days;
  if (!ANALYTICS_PERIODS.some((period) => period === days)) {
    throw new Error("Escolha um período de 7, 30 ou 90 dias.");
  }
  return { days: days as AnalyticsPeriod };
}

export function analyticsStartDate(days: AnalyticsPeriod, now = new Date()): Date {
  const start = new Date(now);
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - days + 1);
  return start;
}

export function fillAnalyticsDays(
  days: AnalyticsPeriod,
  rows: { date: string; clicks: number }[],
  now = new Date(),
) {
  const counts = new Map(rows.map((row) => [row.date, row.clicks]));
  const start = analyticsStartDate(days, now);
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(date.getUTCDate() + index);
    const key = date.toISOString().slice(0, 10);
    return { date: key, clicks: counts.get(key) ?? 0 };
  });
}

export function analyticsSourceLabel(key: string) {
  return (
    ANALYTICS_SOURCES.find((source) => source.key === key)?.label ??
    (
      {
        analytics_catalogo: "Catálogo",
        analytics_feed: "Conteúdo",
        analytics_agent: "Agente Analytics",
        rede_catalogo: "Veronica Rede",
      } as Record<string, string>
    )[key] ??
    "Outras origens"
  );
}
