import raw from "@/data/trending-videos.json";

// Feed de tendências do TikTok Shop, curado a cada 48h por pesquisa (não é
// um puxa-dado ao vivo de nenhuma plataforma paga de terceiros). O arquivo
// `trending-videos.json` é o que a rotina de atualização reescreve a cada
// ciclo — mantido como JSON puro pra reduzir risco de quebrar o build.
export type FeedCategory = "beleza" | "casa" | "saude" | "moda" | "pet" | "eletronicos";

export type TrendingVideo = {
  id: string;
  rank: number;
  category: FeedCategory;
  title: string;
  views: string;
  gmvLabel: string;
  gmvValue: number;
  growthLabel: string;
  growthValue: number;
  gradient: string;
  hook: string;
  thumbnailUrl?: string;
};

export type TrendingFeed = {
  cycleHours: number;
  refreshedAt: string;
  sourceLabel: string;
  videos: TrendingVideo[];
};

export const trendingFeed = raw as TrendingFeed;

export function hoursSince(iso: string): number {
  const diffMs = Date.now() - new Date(iso).getTime();
  return Math.max(0, diffMs / (1000 * 60 * 60));
}

export function formatRefreshedLabel(iso: string): string {
  const h = hoursSince(iso);
  if (h < 1) return "atualizado agora há pouco";
  if (h < 24) return `atualizado há ${Math.floor(h)}h`;
  const days = Math.floor(h / 24);
  return `atualizado há ${days}d`;
}

export function formatNextRefreshLabel(iso: string, cycleHours: number): string {
  const remaining = cycleHours - hoursSince(iso);
  if (remaining <= 0) return "nova leva chegando a qualquer momento";
  if (remaining < 1) return `nova leva em ${Math.ceil(remaining * 60)}min`;
  return `nova leva em ${Math.ceil(remaining)}h`;
}

export function formatCountdownPhrase(iso: string, cycleHours: number): string {
  const remaining = cycleHours - hoursSince(iso);
  if (remaining <= 0) return "essa leva pode sair do ar a qualquer momento";
  if (remaining < 1) return `faltam ${Math.ceil(remaining * 60)}min pra essa leva sair do ar`;
  return `faltam ${Math.ceil(remaining)}h pra essa leva sair do ar`;
}
