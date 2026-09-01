import { LazyImage } from "@/components/media/LazyImage";
import { BEAT_SHORT, type Beat } from "@/lib/beats";

// Compartilhado por blog/index.tsx (destaque + cards por editoria) e
// blog/$slug.tsx (hero da matéria) — um único lugar pro tratamento visual
// da capa (proporção, dessaturação/hover) e pro placeholder sem capa.
export const BEAT_COLOR: Record<Beat, string> = {
  ia: "oklch(0.58 0.17 155)",
  clima: "oklch(0.55 0.13 220)",
  economia: "oklch(0.62 0.15 85)",
  geopolitica: "oklch(0.58 0.19 25)",
  mercado: "oklch(0.56 0.16 290)",
};

// "oklch(L C H)" -> "oklch(L C H / alpha)" — alpha precisa entrar dentro da
// função, não depois do parêntese de fechamento.
export function withAlpha(oklch: string, alpha: number): string {
  return oklch.replace(/\)$/, ` / ${alpha})`);
}

export function CoverThumb({
  beat,
  coverImageUrl,
  className = "",
}: {
  beat: Beat;
  coverImageUrl?: string | null;
  className?: string;
}) {
  const color = BEAT_COLOR[beat];

  if (coverImageUrl) {
    return (
      <div className={`relative overflow-hidden rounded-sm ${className}`}>
        <LazyImage
          src={coverImageUrl}
          alt=""
          useCfResize={false}
          className="h-full w-full object-cover saturate-75 grayscale-[15%] transition duration-300 group-hover:saturate-100 group-hover:grayscale-0"
        />
      </div>
    );
  }

  return (
    <div
      aria-hidden
      className={`relative flex items-center justify-center overflow-hidden rounded-sm ${className}`}
      style={{
        background: `linear-gradient(135deg, ${withAlpha(color, 0.28)}, ${withAlpha(color, 0.06)})`,
      }}
    >
      <span
        className="font-mono-tech text-[10px] uppercase tracking-widest"
        style={{ color: withAlpha(color, 0.85) }}
      >
        {BEAT_SHORT[beat]}
      </span>
    </div>
  );
}
