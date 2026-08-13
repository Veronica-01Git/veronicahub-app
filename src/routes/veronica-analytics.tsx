import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, type CSSProperties } from "react";
import { Sparkles, ShoppingBag, RotateCcw, ArrowRight, Flame, Play } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { calcEngagement, TIER_META, type EngagementResult, type Tier } from "@/lib/tiktok-engagement";

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

const TRENDING_TICKER = [
  { label: "sérum facial", delta: "+340%" },
  { label: "organizador de cabos", delta: "em alta" },
  { label: "faixa postural", delta: "+178%" },
  { label: "categoria beleza dominando hoje", delta: "" },
];

// Feed ilustrativo — mesma natureza do ticker acima (mostra o formato do
// produto, não é um feed ao vivo puxando dado real de GMV).
type FeedCategory = "beleza" | "casa" | "saude";

type ViralVideo = {
  id: number;
  rank: number;
  category: FeedCategory;
  title: string;
  views: string;
  gmvLabel: string;
  gmvValue: number;
  growthLabel: string;
  growthValue: number;
  gradient: string;
};

const FILTER_CATEGORIES: { key: "todos" | FeedCategory; label: string }[] = [
  { key: "todos", label: "todos" },
  { key: "beleza", label: "beleza" },
  { key: "casa", label: "casa" },
  { key: "saude", label: "saúde" },
];

const CATEGORY_META: Record<FeedCategory, { label: string; color: string }> = {
  beleza: { label: "beleza", color: "var(--tt-pink)" },
  casa: { label: "casa", color: "var(--tt-cyan)" },
  saude: { label: "saúde", color: "var(--tt-gold)" },
};

const VIRAL_FEED: ViralVideo[] = [
  {
    id: 1,
    rank: 1,
    category: "beleza",
    title: "Sérum facial com aplicador gelado — antes/depois em 7s",
    views: "2.1M visualizações",
    gmvLabel: "GMV ~R$ 84K",
    gmvValue: 84000,
    growthLabel: "+340%",
    growthValue: 340,
    gradient: "linear-gradient(150deg, #ffd9e2, #ffb3c6)",
  },
  {
    id: 2,
    rank: 2,
    category: "casa",
    title: "Organizador de cabos magnético — dor da bagunça na mesa",
    views: "1.4M visualizações",
    gmvLabel: "GMV ~R$ 61K",
    gmvValue: 61000,
    growthLabel: "+210%",
    growthValue: 210,
    gradient: "linear-gradient(150deg, #d6fbfa, #a3f0ed)",
  },
  {
    id: 3,
    rank: 3,
    category: "saude",
    title: "Faixa postural — prova social com 3 depoimentos rápidos",
    views: "980K visualizações",
    gmvLabel: "GMV ~R$ 47K",
    gmvValue: 47000,
    growthLabel: "+178%",
    growthValue: 178,
    gradient: "linear-gradient(150deg, #fff0cc, #ffdd94)",
  },
];

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

function ViralCard({ video }: { video: ViralVideo }) {
  const meta = CATEGORY_META[video.category];
  return (
    <Link
      to="/video-ia"
      className="group flex flex-col overflow-hidden rounded-2xl border transition hover:-translate-y-1"
      style={{ borderColor: "var(--tt-line)", background: "var(--tt-surface-raised)" }}
    >
      <div className="relative flex aspect-[9/16] max-h-[250px] items-center justify-center" style={{ backgroundImage: video.gradient }}>
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
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/85 shadow-md">
          <Play className="ml-0.5 h-3.5 w-3.5" style={{ color: "var(--tt-ink)", fill: "var(--tt-ink)" }} />
        </span>
        <span
          className="absolute bottom-2.5 left-2.5 flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 font-mono-tech text-[9.5px] font-semibold"
          style={{ color: "var(--tt-pink)" }}
        >
          <Flame className="h-2.5 w-2.5" /> {video.growthLabel}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-[13.5px] font-semibold leading-[1.35]" style={{ color: "var(--tt-ink)" }}>{video.title}</p>
        <div className="mt-1.5 flex items-center justify-between font-mono-tech text-[10.5px]" style={{ color: "var(--tt-ink-faint)" }}>
          <span className="rounded-full px-2 py-0.5 font-semibold" style={{ background: `color-mix(in oklab, ${meta.color} 14%, white)`, color: meta.color }}>
            {meta.label}
          </span>
          <span>{video.views}</span>
        </div>
        <div
          className="mt-auto flex items-center gap-1.5 border-t pt-2.5 font-mono-tech text-[11px] font-semibold transition group-hover:text-[var(--tt-pink)]"
          style={{ borderColor: "var(--tt-line)", color: "var(--tt-ink)", marginTop: "10px" }}
        >
          refazer esse estilo no studio <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}

function VeronicaAnalytics() {
  const [activeCategory, setActiveCategory] = useState<"todos" | FeedCategory>("todos");
  const [sortBy, setSortBy] = useState<SortKey>("gmv");

  const sortedFeed = useMemo(() => {
    const filtered = activeCategory === "todos" ? VIRAL_FEED : VIRAL_FEED.filter((v) => v.category === activeCategory);
    const copy = [...filtered];
    if (sortBy === "gmv") copy.sort((a, b) => b.gmvValue - a.gmvValue);
    if (sortBy === "crescimento") copy.sort((a, b) => b.growthValue - a.growthValue);
    if (sortBy === "recente") copy.sort((a, b) => a.id - b.id);
    return copy;
  }, [activeCategory, sortBy]);

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
          {[...TRENDING_TICKER, ...TRENDING_TICKER].map((t, i) => (
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
          <div className="mt-5 flex items-center gap-2 font-mono-tech text-[11px] uppercase tracking-widest" style={{ color: "var(--tt-pink)" }}>
            <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full" style={{ background: "var(--tt-pink)" }} />
            Atualizado há 12 min
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
            Vídeos com maior GMV estimado no TikTok Shop nas últimas 48h. Veja o que está funcionando, depois
            aprenda a fazer igual no Studio Criativo.
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
          <div className="mb-5 flex items-center gap-2 text-[16px] font-bold" style={{ color: "var(--tt-ink)" }}>
            <Flame className="h-4 w-4" style={{ color: "var(--tt-pink)" }} /> Vídeos virais do momento
          </div>
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
