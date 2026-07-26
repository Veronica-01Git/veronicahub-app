import { createFileRoute } from "@tanstack/react-router";
import { useState, type CSSProperties, type FormEvent } from "react";
import { Sparkles, TrendingUp, ShoppingBag } from "lucide-react";
import { SiteHeader, SiteFooter, CyborgBackdrop } from "@/components/SiteChrome";
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

const tt = {
  "--tt-bg": "#0d0d0f",
  "--tt-surface": "#18181b",
  "--tt-surface-raised": "#202024",
  "--tt-cyan": "#25f4ee",
  "--tt-pink": "#fe2c55",
  "--tt-ink": "#f5f5f7",
  "--tt-ink-soft": "#a8a8b3",
  "--tt-ink-faint": "#6f6f78",
  "--tt-line": "#2a2a30",
} as CSSProperties;

const TIER_COLOR: Record<Tier, string> = {
  baixa: "var(--tt-pink)",
  boa: "var(--tt-cyan)",
  otima: "#7cf29c",
  excelente: "var(--tt-cyan)",
};

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

function NumberField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="font-mono-tech text-[10.5px] uppercase tracking-widest" style={{ color: "var(--tt-ink-faint)" }}>{label}</span>
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, ""))}
        placeholder={placeholder}
        className="rounded-xl border px-4 py-3 text-[15px] outline-none"
        style={{ borderColor: "var(--tt-line)", background: "var(--tt-surface)", color: "var(--tt-ink)" }}
      />
    </label>
  );
}

function VeronicaAnalytics() {
  const [followers, setFollowers] = useState("");
  const [avgLikes, setAvgLikes] = useState("");
  const [avgComments, setAvgComments] = useState("");
  const [avgShares, setAvgShares] = useState("");
  const [avgViews, setAvgViews] = useState("");
  const [result, setResult] = useState<EngagementResult | null>(null);

  function handleCalculate(e: FormEvent) {
    e.preventDefault();
    const input = {
      followers: Number(followers) || 0,
      avgLikes: Number(avgLikes) || 0,
      avgComments: Number(avgComments) || 0,
      avgShares: Number(avgShares) || 0,
      avgViews: Number(avgViews) || 0,
    };
    if (input.followers <= 0) return;
    setResult(calcEngagement(input));
  }

  const canCalculate = Number(followers) > 0;

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ ...tt, background: "var(--tt-bg)", color: "var(--tt-ink)" }}>
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden border-b px-6 py-16 md:py-24" style={{ borderColor: "var(--tt-line)" }}>
        <CyborgBackdrop />
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(circle at 20% 20%, color-mix(in oklab, var(--tt-cyan) 12%, transparent), transparent 55%), radial-gradient(circle at 80% 70%, color-mix(in oklab, var(--tt-pink) 14%, transparent), transparent 55%)" }} />
        <div className="relative mx-auto max-w-5xl">
          <Sparkles8 />
          <div className="inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 font-mono-tech text-[10px] uppercase tracking-widest" style={{ borderColor: "var(--tt-line)", color: "var(--tt-cyan)" }}>
            <Sparkles className="h-3 w-3" />
            Veronica Analytics · TikTok Shop
          </div>
          <h1
            className="mt-6 font-display text-5xl sm:text-6xl md:text-7xl"
            style={{ letterSpacing: "-0.03em", lineHeight: "0.95", textShadow: "-2px 0 var(--tt-cyan), 2px 0 var(--tt-pink)" }}
          >
            Descubra seu potencial
            <br />
            no <span style={{ color: "var(--tt-pink)", textShadow: "none" }}>TikTok Shop</span>.
          </h1>
          <p className="mt-6 max-w-xl text-[16px] leading-[1.65]" style={{ color: "var(--tt-ink-soft)" }}>
            Cole os números do seu próprio perfil, receba sua taxa de engajamento na hora e um plano de ação pra vender mais — sem cadastro, sem enrolação.
          </p>
          <a
            href="#calculadora"
            className="mt-8 inline-flex items-center gap-2 rounded-full px-7 py-3.5 font-mono-tech text-[12px] uppercase tracking-widest transition hover:-translate-y-0.5"
            style={{ background: "linear-gradient(90deg, var(--tt-cyan), var(--tt-pink))", color: "#0d0d0f" }}
          >
            Calcular meu engajamento <TrendingUp className="h-4 w-4" />
          </a>
        </div>
      </section>

      {/* Calculator */}
      <section id="calculadora" className="border-b px-6 py-16 md:py-20" style={{ borderColor: "var(--tt-line)" }}>
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 flex items-center gap-3 font-mono-tech text-[11px] uppercase tracking-widest" style={{ color: "var(--tt-pink)" }}>
            <span className="h-px w-8" style={{ background: "var(--tt-pink)" }} />
            Calculadora de engajamento
          </div>
          <form onSubmit={handleCalculate} className="rounded-2xl border p-6 sm:p-8" style={{ borderColor: "var(--tt-line)", background: "var(--tt-surface-raised)" }}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <NumberField label="Seguidores" value={followers} onChange={setFollowers} placeholder="Ex.: 12000" />
              <NumberField label="Visualizações médias por vídeo" value={avgViews} onChange={setAvgViews} placeholder="Opcional" />
              <NumberField label="Curtidas médias por vídeo" value={avgLikes} onChange={setAvgLikes} placeholder="Ex.: 800" />
              <NumberField label="Comentários médios por vídeo" value={avgComments} onChange={setAvgComments} placeholder="Ex.: 40" />
              <NumberField label="Compartilhamentos médios" value={avgShares} onChange={setAvgShares} placeholder="Ex.: 20" />
            </div>
            <button
              type="submit"
              disabled={!canCalculate}
              className="mt-6 inline-flex items-center gap-2 rounded-full px-7 py-3.5 font-mono-tech text-[12px] uppercase tracking-widest transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
              style={{ background: "linear-gradient(90deg, var(--tt-cyan), var(--tt-pink))", color: "#0d0d0f" }}
            >
              Calcular engajamento
            </button>
            <p className="mt-3 text-[12px]" style={{ color: "var(--tt-ink-faint)" }}>Cálculo feito no seu navegador com os números que você digitar — nada é enviado a servidor nenhum.</p>
          </form>

          {result && (
            <div className="mt-8 rounded-2xl border p-6 sm:p-8" style={{ borderColor: "var(--tt-line)", background: "var(--tt-surface-raised)" }}>
              <div className="flex flex-wrap items-center gap-8">
                <div className="flex flex-col items-center">
                  <span className="font-display text-6xl" style={{ color: TIER_COLOR[result.tier] }}>{result.erByFollowers.toFixed(1)}%</span>
                  <span className="mt-1 font-mono-tech text-[10px] uppercase tracking-widest" style={{ color: "var(--tt-ink-faint)" }}>Por seguidor</span>
                </div>
                {result.erByViews !== null && (
                  <div className="flex flex-col items-center">
                    <span className="font-display text-4xl" style={{ color: "var(--tt-ink)" }}>{result.erByViews.toFixed(1)}%</span>
                    <span className="mt-1 font-mono-tech text-[10px] uppercase tracking-widest" style={{ color: "var(--tt-ink-faint)" }}>Por visualização</span>
                  </div>
                )}
                <span className="rounded-full px-4 py-1.5 font-mono-tech text-[11px] uppercase tracking-widest" style={{ background: TIER_COLOR[result.tier], color: "#0d0d0f" }}>
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

      <SiteFooter />
    </div>
  );
}
