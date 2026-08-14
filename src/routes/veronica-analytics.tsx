import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  Sparkles,
  ShoppingBag,
  RotateCcw,
  ArrowRight,
  Flame,
  Play,
  Clock,
  Droplet,
  Cable,
  HeartPulse,
  Shirt,
  PawPrint,
  Zap,
  ExternalLink,
  type LucideIcon,
} from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { calcEngagement, TIER_META, type EngagementResult, type Tier } from "@/lib/tiktok-engagement";
import {
  trendingFeed,
  formatRefreshedLabel,
  formatNextRefreshLabel,
  formatCountdownPhrase,
  type FeedCategory,
  type TrendingVideo,
} from "@/lib/trending-videos";

export const Route = createFileRoute("/veronica-analytics")({
  component: VeronicaAnalytics,
  head: () => ({
    meta: [
      { title: "Veronica Analytics — Calculadora de Engajamento TikTok | Veronica Hub" },
      {
        name: "description",
        content: "Calcule sua taxa de engajamento no TikTok gratuitamente e receba dicas práticas pra vender mais no TikTok Shop.",
      },
      { property: "og:title", content: "Veronica Analytics — Calculadora de Engajamento TikTok" },
      { property: "og:description", content: "Descubra seu potencial no TikTok Shop com dados reais do seu próprio perfil." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

// Paleta clara e viva, inspirada no duotone do TikTok (rosa/ciano/dourado)
// — mesma técnica de variáveis escopadas que a home usa, só que via
// inline style em vez de classe, porque essa página já nasceu assim.
const tt = {
  "--tt-bg": "#ffffff",
  "--tt-surface": "#fafafa",
  "--tt-surface-raised": "#ffffff",
  "--tt-cyan": "#0a9490",
  "--tt-pink": "#e11d5e",
  "--tt-gold": "#b8860b",
  "--tt-ink": "#0e0e10",
  "--tt-ink-soft": "#55555c",
  "--tt-ink-faint": "#8a8a93",
  "--tt-line": "#ececee",
} as CSSProperties;

const TIER_COLOR: Record<Tier, string> = {
  baixa: "var(--tt-pink)",
  boa: "var(--tt-gold)",
  otima: "var(--tt-cyan)",
  excelente: "var(--tt-cyan)",
};

// Ticker derivado do próprio feed curado — evita duas fontes de verdade
// desalinhadas quando a rotina de 48h reescreve trending-videos.json.
const trendingTicker = trendingFeed.videos.map((v) => ({
  label: v.title.split("—")[0].trim().toLowerCase(),
  delta: v.growthLabel,
}));

const FILTER_CATEGORIES: { key: "todos" | FeedCategory; label: string }[] = [
  { key: "todos", label: "todos" },
  { key: "beleza", label: "beleza" },
  { key: "casa", label: "casa" },
  { key: "saude", label: "saúde" },
  { key: "moda", label: "moda" },
  { key: "pet", label: "pet" },
  { key: "eletronicos", label: "eletrônicos" },
];

const CATEGORY_META: Record<FeedCategory, { label: string; color: string }> = {
  beleza: { label: "beleza", color: "var(--tt-pink)" },
  casa: { label: "casa", color: "var(--tt-cyan)" },
  saude: { label: "saúde", color: "var(--tt-gold)" },
  moda: { label: "moda", color: "var(--tt-pink)" },
  pet: { label: "pet", color: "var(--tt-cyan)" },
  eletronicos: { label: "eletrônicos", color: "var(--tt-gold)" },
};

// Ícone por categoria pro "frame" do card — não é screenshot de nenhum
// vídeo real (não temos como puxar isso), é uma moldura ilustrativa que só
// sinaliza o tipo de produto. Quem clica no frame vai pra busca real desse
// formato no TikTok, não pra um vídeo específico inventado.
const CATEGORY_ICON: Record<FeedCategory, LucideIcon> = {
  beleza: Droplet,
  casa: Cable,
  saude: HeartPulse,
  moda: Shirt,
  pet: PawPrint,
  eletronicos: Zap,
};

type SortKey = "gmv" | "recente" | "crescimento";

function Sparkles8() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <span
          key={i}
          aria-hidden
          className="absolute rounded-full animate-sparkle"
          style={{
            left: `${(i * 37) % 100}%`,
            top: `${(i * 53) % 100}%`,
            width: i % 2 === 0 ? 6 : 4,
            height: i % 2 === 0 ? 6 : 4,
            background: i % 2 === 0 ? "var(--tt-cyan)" : "var(--tt-pink)",
            animationDelay: `${i * 0.3}s`,
          }}
        />
      ))}
    </>
  );
}

function NumberField({
  label,
  value,
  onChange,
  placeholder,
  size = "md",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  size?: "md" | "lg";
}) {
  const formatted = value ? Number(value).toLocaleString("pt-BR") : "";
  return (
    <label className="flex flex-col gap-2">
      <span className="font-mono-tech text-[10.5px] uppercase tracking-widest" style={{ color: "var(--tt-ink-faint)" }}>
        {label}
      </span>
      <input
        type="text"
        inputMode="numeric"
        value={formatted}
        onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, ""))}
        placeholder={placeholder}
        className={`rounded-xl border outline-none transition focus:ring-2 focus:ring-offset-0 ${
          size === "lg" ? "px-5 py-4 text-[19px]" : "px-4 py-3 text-[15px]"
        }`}
        style={
          {
            borderColor: "var(--tt-line)",
            background: "var(--tt-surface)",
            color: "var(--tt-ink)",
            "--tw-ring-color": "var(--tt-cyan)",
          } as CSSProperties
        }
      />
    </label>
  );
}

function ViralCard({ video }: { video: TrendingVideo }) {
  const meta = CATEGORY_META[video.category];
  const Icon = CATEGORY_ICON[video.category];
  const tiktokSearchUrl = `https://www.tiktok.com/search?q=${encodeURIComponent(video.title.split("—")[0].trim())}`;
  const hasCover = Boolean(video.thumbnailUrl);

  return (
    <div
      className="group flex flex-col overflow-hidden rounded-2xl border transition hover:-translate-y-1"
      style={{ borderColor: "var(--tt-line)", background: "var(--tt-surface-raised)" }}
    >
      <a
        href={tiktokSearchUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Ver exemplos reais desse formato no TikTok: ${video.title}`}
        className="relative flex aspect-[9/16] max-h-[250px] flex-col items-center justify-center overflow-hidden"
        style={{ backgroundImage: video.gradient }}
      >
        {/* Ícone da categoria fica sempre como camada-base — se a capa (IA,
            abaixo) não carregar por qualquer motivo, esse fica visível em
            vez de sobrar um vazio. */}
        <Icon
          aria-hidden
          className="absolute left-1/2 top-[36%] h-12 w-12 -translate-x-1/2 -translate-y-1/2"
          style={{ color: "rgba(14,14,16,0.28)" }}
          strokeWidth={1.25}
        />
        {/* Capa ilustrativa gerada por IA, por cima do ícone — não é print
            de nenhum vídeo real (não temos como puxar isso). */}
        {hasCover && (
          <img src={video.thumbnailUrl} alt="" aria-hidden loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
        )}
        {/* Moldura tipo viewfinder — reforça a leitura de "frame de vídeo"
            sem fingir ser print de um vídeo real específico. */}
        <span aria-hidden className="absolute left-2 top-9 h-4 w-4 border-l-2 border-t-2" style={{ borderColor: hasCover ? "rgba(255,255,255,0.75)" : "rgba(14,14,16,0.3)" }} />
        <span aria-hidden className="absolute right-2 bottom-8 h-4 w-4 border-r-2 border-b-2" style={{ borderColor: hasCover ? "rgba(255,255,255,0.75)" : "rgba(14,14,16,0.3)" }} />

        <span
          className="absolute left-2.5 top-2.5 rounded-full px-2 py-1 font-mono-tech text-[10px] font-semibold text-white"
          style={{ background: "var(--tt-ink)" }}
        >
          {video.gmvLabel}
        </span>
        <span
          className="absolute right-2.5 top-2.5 flex h-[22px] w-[22px] items-center justify-center rounded-full font-mono-tech text-[10.5px] font-bold text-white"
          style={{ background: "var(--tt-pink)" }}
        >
          {video.rank}
        </span>
        <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/85 shadow-md transition group-hover:scale-110">
          <Play className="ml-0.5 h-3.5 w-3.5" style={{ color: "var(--tt-ink)", fill: "var(--tt-ink)" }} />
        </span>
        <span
          className="absolute bottom-2.5 left-2.5 flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 font-mono-tech text-[9.5px] font-semibold"
          style={{ color: "var(--tt-pink)" }}
        >
          <Flame className="h-2.5 w-2.5" /> {video.growthLabel}
        </span>
        <span
          className="absolute bottom-2.5 right-2.5 flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 font-mono-tech text-[9.5px] font-semibold"
          style={{ color: "var(--tt-ink)" }}
        >
          tiktok <ExternalLink className="h-2.5 w-2.5" />
        </span>
        {/* Barra de progresso simulada — vídeo "pausado" no frame. */}
        <span aria-hidden className="absolute inset-x-2.5 bottom-1 h-[3px] overflow-hidden rounded-full bg-white/40">
          <span className="block h-full w-[38%] rounded-full bg-white/90" />
        </span>
      </a>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-[13.5px] font-semibold leading-[1.35]" style={{ color: "var(--tt-ink)" }}>{video.title}</p>
        <div className="mt-1.5 flex items-center justify-between font-mono-tech text-[10.5px]" style={{ color: "var(--tt-ink-faint)" }}>
          <span className="rounded-full px-2 py-0.5 font-semibold" style={{ background: `color-mix(in oklab, ${meta.color} 14%, white)`, color: meta.color }}>
            {meta.label}
          </span>
          <span>{video.views}</span>
        </div>
        <p className="mt-2.5 text-[12px] leading-[1.5]" style={{ color: "var(--tt-ink-soft)" }}>
          {video.hook}
        </p>
        <Link
          to="/video-ia"
          className="mt-auto flex items-center gap-1.5 border-t pt-2.5 font-mono-tech text-[11px] font-semibold transition hover:text-[var(--tt-pink)]"
          style={{ borderColor: "var(--tt-line)", color: "var(--tt-ink)", marginTop: "10px" }}
        >
          refazer esse estilo no studio <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  );
}

function VeronicaAnalytics() {
  const [activeCategory, setActiveCategory] = useState<"todos" | FeedCategory>("todos");
  const [sortBy, setSortBy] = useState<SortKey>("gmv");

  const feed = trendingFeed.videos;

  const sortedFeed = useMemo(() => {
    const filtered = activeCategory === "todos" ? feed : feed.filter((v) => v.category === activeCategory);
    const copy = [...filtered];
    if (sortBy === "gmv") copy.sort((a, b) => b.gmvValue - a.gmvValue);
    if (sortBy === "crescimento") copy.sort((a, b) => b.growthValue - a.growthValue);
    if (sortBy === "recente") copy.sort((a, b) => a.rank - b.rank);
    return copy;
  }, [feed, activeCategory, sortBy]);

  // Re-renderiza a cada minuto só pra manter "atualizado há Xh" / "nova leva
  // em Yh" honestos sem precisar recarregar a página.
  const [, forceTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => forceTick((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, []);
  const refreshedLabel = formatRefreshedLabel(trendingFeed.refreshedAt);
  const nextRefreshLabel = formatNextRefreshLabel(trendingFeed.refreshedAt, trendingFeed.cycleHours);
  const countdownPhrase = formatCountdownPhrase(trendingFeed.refreshedAt, trendingFeed.cycleHours);

  const [followers, setFollowers] = useState("");
  const [avgLikes, setAvgLikes] = useState("");
  const [avgComments, setAvgComments] = useState("");
  const [avgShares, setAvgShares] = useState("");
  const [avgViews, setAvgViews] = useState("");

  const hasFollowers = Number(followers) > 0;

  // Recalcula na hora, a cada tecla — sem precisar clicar em nada.
  const result: EngagementResult | null = useMemo(() => {
    if (!hasFollowers) return null;
    return calcEngagement({
      followers: Number(followers) || 0,
      avgLikes: Number(avgLikes) || 0,
      avgComments: Number(avgComments) || 0,
      avgShares: Number(avgShares) || 0,
      avgViews: Number(avgViews) || 0,
    });
  }, [followers, avgLikes, avgComments, avgShares, avgViews, hasFollowers]);

  function handleReset() {
    setFollowers("");
    setAvgLikes("");
    setAvgComments("");
    setAvgShares("");
    setAvgViews("");
  }

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ ...tt, background: "var(--tt-bg)", color: "var(--tt-ink)" }}>
      <SiteHeader />

      {/* Ticker de tendências — mesmo tom "wire" do resto do site redesenhado */}
      <div className="overflow-hidden border-b" style={{ background: "var(--tt-ink)", borderColor: "var(--tt-line)" }}>
        <div className="flex animate-marquee gap-9 whitespace-nowrap py-2 font-mono-tech text-[11px]" style={{ animationDuration: "28s" }}>
          {[...trendingTicker, ...trendingTicker].map((t, i) => (
            <span key={i} className="flex items-center gap-2 text-white/80">
              <Flame className="h-3 w-3" style={{ color: "var(--tt-gold)" }} />
              {t.label} {t.delta && <span style={{ color: "var(--tt-cyan)" }}>{t.delta}</span>}
            </span>
          ))}
        </div>
      </div>

      {/* Hero — feed viral, "o que está bombando agora" */}
      <section className="relative overflow-hidden border-b px-6 py-14 md:py-20" style={{ borderColor: "var(--tt-line)" }}>
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(circle at 20% 20%, color-mix(in oklab, var(--tt-cyan) 10%, transparent), transparent 55%), radial-gradient(circle at 80% 70%, color-mix(in oklab, var(--tt-pink) 10%, transparent), transparent 55%)" }} />
        <div className="relative mx-auto max-w-5xl">
          <Sparkles8 />
          <div className="inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 font-mono-tech text-[10px] uppercase tracking-widest" style={{ borderColor: "var(--tt-line)", color: "var(--tt-pink)" }}>
            <Sparkles className="h-3 w-3" />
            Veronica Analytics · TikTok Shop
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1.5 font-mono-tech text-[11px] uppercase tracking-widest" style={{ color: "var(--tt-pink)" }}>
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full" style={{ background: "var(--tt-pink)" }} />
              {refreshedLabel}
            </span>
            <span className="flex items-center gap-1.5" style={{ color: "var(--tt-ink-faint)" }}>
              <Clock className="h-3 w-3" />
              {nextRefreshLabel}
            </span>
          </div>
          <h1
            className="mt-4 font-display text-4xl sm:text-5xl md:text-6xl"
            style={{ letterSpacing: "-0.03em", lineHeight: "0.98" }}
          >
            O que está{" "}
            <span
              style={{
                backgroundImage: "linear-gradient(90deg, var(--tt-pink), var(--tt-gold))",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              bombando
            </span>{" "}
            agora.
          </h1>
          <p className="mt-5 max-w-xl text-[15px] leading-[1.65] sm:text-[16px]" style={{ color: "var(--tt-ink-soft)" }}>
            Os 3 formatos com maior GMV estimado no TikTok Shop, curados a cada 48h. Essa leva sai do ar assim
            que a próxima entrar — quem gravar primeiro no Studio pega a onda antes de saturar.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-2">
            {FILTER_CATEGORIES.map((c) => {
              const active = activeCategory === c.key;
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setActiveCategory(c.key)}
                  className="rounded-full border px-4 py-2 font-mono-tech text-[11.5px] font-medium transition"
                  style={
                    active
                      ? { borderColor: "var(--tt-pink)", color: "var(--tt-pink)", background: "color-mix(in oklab, var(--tt-pink) 10%, white)" }
                      : { borderColor: "var(--tt-line)", color: "var(--tt-ink-soft)" }
                  }
                >
                  {c.label}
                </button>
              );
            })}
            <span className="mx-1 h-4.5 w-px" style={{ background: "var(--tt-line)" }} />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              className="rounded-full border px-4 py-2 font-mono-tech text-[11.5px]"
              style={{ borderColor: "var(--tt-line)", background: "var(--tt-surface)", color: "var(--tt-ink-soft)" }}
            >
              <option value="gmv">GMV estimado ↓</option>
              <option value="recente">Mais recentes</option>
              <option value="crescimento">Crescimento %</option>
            </select>
          </div>
        </div>
      </section>

      {/* Feed viral */}
      <section className="border-b px-6 py-12 md:py-16" style={{ borderColor: "var(--tt-line)" }}>
        <div className="mx-auto max-w-5xl">
          <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[16px] font-bold" style={{ color: "var(--tt-ink)" }}>
              <Flame className="h-4 w-4" style={{ color: "var(--tt-pink)" }} /> Vídeos virais do momento
            </div>
            <span className="rounded-full border px-3 py-1 font-mono-tech text-[10px] uppercase tracking-widest" style={{ borderColor: "var(--tt-line)", color: "var(--tt-ink-faint)" }}>
              {nextRefreshLabel}
            </span>
          </div>
          <p className="mb-5 font-mono-tech text-[10.5px]" style={{ color: "var(--tt-ink-faint)" }}>
            {trendingFeed.sourceLabel}
          </p>
          {sortedFeed.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sortedFeed.map((video) => (
                <ViralCard key={video.id} video={video} />
              ))}
            </div>
          ) : (
            <p className="text-[13.5px]" style={{ color: "var(--tt-ink-faint)" }}>
              Nenhum vídeo viral nessa categoria ainda — volta em breve.
            </p>
          )}
        </div>
      </section>

      {/* Calculator */}
      <section id="calculadora" className="border-b px-6 py-16 md:py-20" style={{ borderColor: "var(--tt-line)" }}>
        <div className="mx-auto max-w-5xl">
          <h2 className="font-display text-2xl sm:text-3xl" style={{ letterSpacing: "-0.02em", color: "var(--tt-ink)" }}>
            Descubra seu potencial pessoal no TikTok Shop.
          </h2>
          <p className="mt-3 max-w-xl text-[14px] leading-[1.6]" style={{ color: "var(--tt-ink-soft)" }}>
            Cole os números do seu próprio perfil e receba sua taxa de engajamento na hora — o resultado atualiza
            enquanto você digita, sem cadastro, sem enrolação.
          </p>
          <div className="mb-8 mt-8 flex items-center gap-3 font-mono-tech text-[11px] uppercase tracking-widest" style={{ color: "var(--tt-pink)" }}>
            <span className="h-px w-8" style={{ background: "var(--tt-pink)" }} />
            Calculadora de engajamento
          </div>
          <div className="rounded-2xl border p-6 sm:p-8" style={{ borderColor: "var(--tt-line)", background: "var(--tt-surface-raised)" }}>
            <NumberField label="Seguidores" value={followers} onChange={setFollowers} placeholder="Ex.: 12000" size="lg" />

            <div className="mb-3 mt-7 font-mono-tech text-[10px] uppercase tracking-widest" style={{ color: "var(--tt-ink-faint)" }}>
              Métricas médias por vídeo · opcional, deixa o plano de ação mais preciso
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <NumberField label="Visualizações" value={avgViews} onChange={setAvgViews} placeholder="Ex.: 5000" />
              <NumberField label="Curtidas" value={avgLikes} onChange={setAvgLikes} placeholder="Ex.: 800" />
              <NumberField label="Comentários" value={avgComments} onChange={setAvgComments} placeholder="Ex.: 40" />
              <NumberField label="Compartilhamentos" value={avgShares} onChange={setAvgShares} placeholder="Ex.: 20" />
            </div>

            <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t pt-5" style={{ borderColor: "var(--tt-line)" }}>
              <p className="max-w-sm text-[12px] leading-[1.5]" style={{ color: "var(--tt-ink-faint)" }}>
                {hasFollowers
                  ? "Cálculo feito no seu navegador — nada é enviado a servidor nenhum."
                  : "Informe ao menos os seguidores pra ver o resultado."}
              </p>
              <button
                type="button"
                onClick={handleReset}
                disabled={!followers && !avgLikes && !avgComments && !avgShares && !avgViews}
                className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 font-mono-tech text-[10.5px] uppercase tracking-widest transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:translate-y-0"
                style={{ borderColor: "var(--tt-line)", color: "var(--tt-ink-soft)" }}
              >
                <RotateCcw className="h-3 w-3" />
                Limpar
              </button>
            </div>
          </div>

          {result && (
            <div className="mt-8 rounded-2xl border p-6 sm:p-8" style={{ borderColor: "var(--tt-line)", background: "var(--tt-surface-raised)" }}>
              <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:flex-wrap sm:items-center sm:gap-8 sm:text-left">
                <div className="flex flex-col items-center">
                  <span className="font-display text-6xl tabular-nums" style={{ color: TIER_COLOR[result.tier] }}>{result.erByFollowers.toFixed(1)}%</span>
                  <span className="mt-1 font-mono-tech text-[10px] uppercase tracking-widest" style={{ color: "var(--tt-ink-faint)" }}>Por seguidor</span>
                </div>
                {result.erByViews !== null && (
                  <div className="flex flex-col items-center">
                    <span className="font-display text-4xl tabular-nums" style={{ color: "var(--tt-ink)" }}>{result.erByViews.toFixed(1)}%</span>
                    <span className="mt-1 font-mono-tech text-[10px] uppercase tracking-widest" style={{ color: "var(--tt-ink-faint)" }}>Por visualização</span>
                  </div>
                )}
                <span className="rounded-full px-4 py-1.5 font-mono-tech text-[11px] uppercase tracking-widest" style={{ background: TIER_COLOR[result.tier], color: "#ffffff" }}>
                  {result.tierLabel} · {TIER_META[result.tier].range}
                </span>
              </div>

              <div className="mt-8 flex items-center gap-2 font-mono-tech text-[10.5px] uppercase tracking-widest" style={{ color: "var(--tt-ink-faint)" }}>
                <ShoppingBag className="h-3.5 w-3.5" style={{ color: "var(--tt-pink)" }} />
                Seu plano de ação
              </div>
              <div className="mt-4 flex flex-col gap-3">
                {result.tips.map((tip, i) => (
                  <div key={i} className="rounded-xl border p-4" style={{ borderColor: "var(--tt-line)", background: "var(--tt-surface)" }}>
                    <div className="flex items-center gap-2 font-medium" style={{ color: "var(--tt-ink)" }}>
                      <Sparkles className="h-4 w-4 flex-shrink-0" style={{ color: i % 2 === 0 ? "var(--tt-cyan)" : "var(--tt-pink)" }} />
                      {tip.title}
                    </div>
                    <p className="mt-1.5 text-[13.5px] leading-[1.55]" style={{ color: "var(--tt-ink-soft)" }}>{tip.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Benchmark reference */}
      <section className="px-6 py-16 md:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 flex items-center gap-3 font-mono-tech text-[11px] uppercase tracking-widest" style={{ color: "var(--tt-cyan)" }}>
            <span className="h-px w-8" style={{ background: "var(--tt-cyan)" }} />
            Como interpretamos sua taxa
          </div>
          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border sm:grid-cols-2 lg:grid-cols-4" style={{ borderColor: "var(--tt-line)", background: "var(--tt-line)" }}>
            {(Object.keys(TIER_META) as Tier[]).map((t) => (
              <div key={t} className="flex flex-col gap-1 p-5" style={{ background: "var(--tt-surface-raised)" }}>
                <span className="font-mono-tech text-[10px] uppercase tracking-widest" style={{ color: TIER_COLOR[t] }}>{TIER_META[t].range}</span>
                <span className="text-[14px]" style={{ color: "var(--tt-ink)" }}>{TIER_META[t].label}</span>
              </div>
            ))}
          </div>
          <p className="mt-6 max-w-2xl text-[13.5px] leading-[1.6]" style={{ color: "var(--tt-ink-faint)" }}>
            Faixas de referência gerais de mercado pra taxa de engajamento (curtidas + comentários + compartilhamentos ÷ seguidores). Servem como bússola, não como nota oficial da plataforma.
          </p>
        </div>
      </section>

      {/* Ponte pro Studio Criativo — escurece de propósito, sinalizando a
          transição pra experiência de produção do Hub (mesmo padrão da
          faixa final do Veronica Wire). */}
      <section className="px-6 py-14" style={{ background: "var(--tt-ink)" }}>
        <div className="mx-auto flex max-w-5xl flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 font-mono-tech text-[10px] uppercase tracking-widest text-neon-green">
              <span className="h-1.5 w-1.5 rounded-full bg-neon-green animate-pulse-dot" /> Método
            </div>
            <h2 className="mt-3 font-display text-2xl text-white sm:text-3xl" style={{ letterSpacing: "-0.02em" }}>
              Sabe seu potencial. <span className="text-neon-green">Agora execute.</span>
            </h2>
            <p className="mt-2 max-w-lg text-[14px] leading-[1.6] text-white/60">
              Produto validado, nome certo, copy de dor pra solução, narrador, takes, som, montagem — os 7 passos
              guiados pela Veronica dentro do Studio Criativo.
            </p>
            <p className="mt-3 max-w-lg font-mono-tech text-[11px] uppercase tracking-widest text-neon-green/80">
              {countdownPhrase} — grave antes que todo mundo grave o mesmo.
            </p>
          </div>
          <Link
            to="/video-ia"
            className="group inline-flex flex-shrink-0 items-center gap-2 rounded-full bg-neon-green px-6 py-3.5 font-mono-tech text-xs uppercase tracking-[0.18em] text-primary-foreground shadow-glow-green transition duration-200 hover:-translate-y-0.5 hover:brightness-110"
          >
            Ir pro Studio Criativo <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
