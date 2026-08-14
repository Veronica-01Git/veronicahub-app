import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Radio, Globe2, Cpu, TrendingUp, Cloud, Landmark, ArrowRight } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { getPublishedArticles } from "@/lib/articles-server";
import { BEAT_VALUES, BEAT_LABELS, BEAT_SHORT, type Beat } from "@/lib/beats";

export const Route = createFileRoute("/blog")({
  component: VeronicaWire,
  head: () => ({
    meta: [
      { title: "Veronica Wire — Cobertura contínua e global | Veronica Hub" },
      {
        name: "description",
        content:
          "Veronica Wire: IA, energia limpa, yuan digital, geopolítica China, EUA e Brasil, e o realinhamento do mercado tecnológico global — cobertura contínua.",
      },
      { property: "og:title", content: "Veronica Wire — Cobertura contínua e global" },
      {
        property: "og:description",
        content:
          "O jornal digital da Veronica Hub sobre o que está movendo IA, economia e geopolítica.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const BEAT_ICON: Record<Beat, typeof Cpu> = {
  ia: Cpu,
  clima: Cloud,
  economia: Landmark,
  geopolitica: Globe2,
  mercado: TrendingUp,
};

const BEAT_COLOR: Record<Beat, string> = {
  ia: "oklch(0.58 0.17 155)",
  clima: "oklch(0.55 0.13 220)",
  economia: "oklch(0.62 0.15 85)",
  geopolitica: "oklch(0.58 0.19 25)",
  mercado: "oklch(0.56 0.16 290)",
};

const BEAT_META = Object.fromEntries(
  BEAT_VALUES.map((b) => [
    b,
    { label: BEAT_LABELS[b], short: BEAT_SHORT[b], color: BEAT_COLOR[b], icon: BEAT_ICON[b] },
  ]),
) as Record<Beat, { label: string; short: string; color: string; icon: typeof Cpu }>;

const DESKS = [
  {
    city: "São Paulo",
    note: "Cobertura de adoção de IA generativa e comércio China-Brasil na América Latina.",
  },
  {
    city: "San Francisco",
    note: "Acompanhamento contínuo dos laboratórios de ponta e da política tecnológica dos EUA.",
  },
  {
    city: "Pequim",
    note: "Monitoramento do yuan digital e do ecossistema asiático de modelos abertos.",
  },
  {
    city: "Londres",
    note: "Análise de políticas regulatórias e mercado de energia limpa europeu.",
  },
];

const TAGS = [
  "#IA-generativa",
  "#LLM",
  "#yuan-digital",
  "#BRICS",
  "#energia-limpa",
  "#chips",
  "#Brasil-China",
  "#EUA-tech",
  "#infraestrutura",
  "#regulação",
  "#vídeo-IA",
  "#mercado",
];

type Article = {
  id: string;
  slug: string;
  beat: Beat;
  headline: string;
  excerpt: string;
  desk: string;
  coverImageUrl: string | null;
  publishedAt: string | null;
};

function useLiveClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

function formatAgo(publishedAt: string | null, now: Date | null): string {
  if (!publishedAt || !now) return "";
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

// "oklch(L C H)" -> "oklch(L C H / alpha)" — alpha must live inside the
// function, appending " / alpha" after the closing paren is invalid CSS.
function withAlpha(oklch: string, alpha: number): string {
  return oklch.replace(/\)$/, ` / ${alpha})`);
}

function Thumb({
  color,
  coverImageUrl,
  className = "",
}: {
  color: string;
  coverImageUrl?: string | null;
  className?: string;
}) {
  if (coverImageUrl) {
    return (
      <div className={`relative overflow-hidden rounded-sm border border-border/40 ${className}`}>
        <img src={coverImageUrl} alt="" className="h-full w-full object-cover" />
      </div>
    );
  }
  return (
    <div
      aria-hidden
      className={`relative overflow-hidden rounded-sm border border-border/40 ${className}`}
      style={{
        background: `linear-gradient(135deg, ${withAlpha(color, 0.28)}, ${withAlpha(color, 0.06)})`,
      }}
    />
  );
}

function VeronicaWire() {
  const now = useLiveClock();
  const [state, setState] = useState<
    { ok: true; articles: Article[] } | { ok: false; error: string } | null
  >(null);

  useEffect(() => {
    getPublishedArticles()
      .then((res) => setState(res as typeof state))
      .catch((err) =>
        setState({
          ok: false,
          error: err instanceof Error ? err.message : "Falha ao carregar matérias.",
        }),
      );
  }, []);

  const articles = state?.ok ? state.articles : [];
  const loading = state === null;
  const featured = articles[0] ?? null;
  // JSX não aceita `<BEAT_META[x].icon>` como tag (acesso computado não é
  // permitido em nome de componente) — precisa virar variável antes.
  const featuredMeta = featured ? BEAT_META[featured.beat] : null;
  // JSX tag position doesn't accept `?.`/`!` either — só identifier puro ou
  // cadeia de `.membro`. Fallback nunca é usado de fato (só existe quando
  // `featured` já é truthy), mas precisa satisfazer o tipo JSX.ElementType.
  const FeaturedIcon = featuredMeta?.icon ?? Cpu;
  const rail = featured ? articles.filter((a) => a.id !== featured.id).slice(0, 5) : [];
  const ticker = articles.slice(0, 8).map((a) => a.headline);

  return (
    <div className="home-hybrid min-h-screen overflow-x-hidden bg-background text-foreground">
      <SiteHeader />

      {/* Faixa "ao vivo" — só aparece quando há matéria publicada de verdade */}
      {ticker.length > 0 && (
        <div className="border-b border-border/40 bg-foreground text-background">
          <div className="mx-auto flex h-9 max-w-7xl items-center gap-3 px-6">
            <span className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-sm bg-destructive px-2 py-0.5 font-mono-tech text-[10px] uppercase tracking-widest text-white">
              <Radio className="h-3 w-3 animate-pulse-dot" /> Ao vivo
            </span>
            <div
              className="flex-1 overflow-hidden"
              style={{
                maskImage: "linear-gradient(90deg, transparent, black 5%, black 92%, transparent)",
              }}
            >
              <div className="flex animate-marquee gap-8 whitespace-nowrap font-mono-tech text-[11px] text-background/75">
                {[...ticker, ...ticker].map((h, i) => (
                  <span key={i} className="flex items-center gap-8">
                    <span className="text-neon-green">●</span>
                    {h}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Masthead */}
      <header className="border-b border-border/50 bg-background/95">
        <div className="mx-auto max-w-7xl px-6 py-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div
                className="font-display text-3xl text-foreground"
                style={{ letterSpacing: "-0.02em", lineHeight: 1 }}
              >
                VERONICA <span className="text-neon-green">WIRE</span>
              </div>
              <div className="mt-1 font-mono-tech text-[9px] uppercase tracking-[0.28em] text-muted-foreground">
                Cobertura contínua e global
              </div>
            </div>
            <div className="text-right font-mono-tech text-[11px] text-muted-foreground">
              {now
                ? now
                    .toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                    .toUpperCase()
                : "—"}
              <br />
              {now ? now.toLocaleTimeString("pt-BR") : "—"} BRT
            </div>
          </div>
          <nav className="mt-4 flex gap-1 overflow-x-auto border-t border-border/40 pt-3 text-[13px] font-medium">
            <a
              href="#topo"
              className="whitespace-nowrap rounded-sm px-3 py-1.5 text-foreground transition hover:text-neon-green"
            >
              Início
            </a>
            {BEAT_VALUES.map((b) => (
              <a
                key={b}
                href={`#beat-${b}`}
                className="whitespace-nowrap rounded-sm px-3 py-1.5 text-muted-foreground transition hover:text-foreground"
              >
                {BEAT_META[b].short}
              </a>
            ))}
            <Link
              to="/comandos"
              className="whitespace-nowrap rounded-sm px-3 py-1.5 text-muted-foreground transition hover:text-foreground"
            >
              Comandos
            </Link>
            <Link
              to="/"
              className="ml-auto whitespace-nowrap rounded-sm px-3 py-1.5 font-medium text-neon-green"
            >
              Hub ▸
            </Link>
          </nav>
        </div>
      </header>

      {/* Lead + mais lidas */}
      <section id="topo" className="mx-auto max-w-7xl px-6 py-14 cv-auto">
        {loading ? (
          <p className="text-muted-foreground">Carregando matérias…</p>
        ) : state && !state.ok ? (
          <p className="text-muted-foreground">{state.error}</p>
        ) : !featured ? (
          <div className="rounded-sm border border-border/60 bg-surface/40 p-8 text-center">
            <h1 className="font-display text-2xl text-foreground">Primeiras matérias a caminho</h1>
            <p className="mx-auto mt-2 max-w-md text-[15px] text-muted-foreground">
              Nossa redação está preparando a primeira leva de conteúdo. Volte em breve.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <Link
              to="/blog/$slug"
              params={{ slug: featured.slug }}
              className="group block overflow-hidden rounded-sm border border-border/60 bg-surface/40 backdrop-blur transition hover:-translate-y-0.5 hover:border-neon-green/50"
            >
              <Thumb
                color={featuredMeta!.color}
                coverImageUrl={featured.coverImageUrl}
                className="aspect-video"
              />
              <div className="p-6 sm:p-8">
                <div
                  className="flex items-center gap-2.5 font-mono-tech text-[11px] uppercase tracking-widest"
                  style={{ color: featuredMeta!.color }}
                >
                  <FeaturedIcon className="h-4 w-4" />
                  {featuredMeta!.label}
                </div>
                <h1
                  className="mt-4 max-w-2xl font-display text-3xl text-foreground sm:text-4xl md:text-[42px]"
                  style={{ letterSpacing: "-0.025em", lineHeight: 1.08 }}
                >
                  {featured.headline}
                </h1>
                <p className="mt-3 max-w-xl text-[15px] leading-[1.6] text-muted-foreground">
                  {featured.excerpt}
                </p>
                <div className="mt-4 font-mono-tech text-[10.5px] uppercase tracking-widest text-muted-foreground">
                  {featured.desk} · {formatAgo(featured.publishedAt, now)}
                </div>
              </div>
            </Link>

            {rail.length > 0 && (
              <div className="flex flex-col overflow-hidden rounded-sm border border-border/60">
                <div className="border-b border-border/60 bg-surface/70 px-5 py-3 font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground">
                  Mais recentes
                </div>
                {rail.map((a, i) => (
                  <Link
                    key={a.id}
                    to="/blog/$slug"
                    params={{ slug: a.slug }}
                    className="group flex items-start gap-3 border-b border-border/40 bg-background px-5 py-4 transition last:border-0 hover:bg-surface/60"
                  >
                    <span
                      className="font-mono-tech text-[15px] font-bold"
                      style={{ color: BEAT_META[a.beat].color }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="flex-1">
                      <span className="block text-[13.5px] leading-[1.4] text-foreground transition group-hover:text-neon-green">
                        {a.headline}
                      </span>
                      <span className="mt-1 block font-mono-tech text-[9.5px] uppercase tracking-widest text-muted-foreground">
                        {formatAgo(a.publishedAt, now)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Fique por dentro — newsletter + editorias */}
      <section className="mx-auto max-w-7xl px-6 pb-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-sm border border-neon-green/30 bg-neon-green/5 p-6">
            <h3
              className="font-display text-lg text-foreground"
              style={{ letterSpacing: "-0.01em" }}
            >
              Drops da Veronica
            </h3>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Táticas, prompts e cases direto no seu e-mail. Sem enrolação.
            </p>
            <form onSubmit={(e) => e.preventDefault()} className="mt-4 flex gap-2">
              <input
                type="email"
                required
                placeholder="seu@email.com"
                className="min-w-0 flex-1 rounded-sm border border-border/60 bg-background px-3 py-2 text-sm outline-none focus:border-neon-green"
              />
              <button className="flex-shrink-0 rounded-sm bg-neon-green px-4 py-2 text-sm font-medium text-primary-foreground transition hover:brightness-110">
                Quero receber
              </button>
            </form>
          </div>
          <div className="rounded-sm border border-border/60 bg-surface/40 p-6">
            <h3 className="font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground">
              Editorias
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {TAGS.map((t) => (
                <span
                  key={t}
                  className="rounded-sm border border-border/60 px-2.5 py-1 font-mono-tech text-[10.5px] text-muted-foreground"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Seções por editoria — só renderiza quando existe matéria publicada nela */}
      {BEAT_VALUES.map((beat) => {
        const items = articles.filter((a) => a.beat === beat);
        if (items.length === 0) return null;
        const meta = BEAT_META[beat];
        return (
          <section
            key={beat}
            id={`beat-${beat}`}
            className="border-t border-border/40 py-16 cv-auto"
          >
            <div className="mx-auto max-w-7xl px-6">
              <div
                className="mb-8 flex items-center gap-3 font-mono-tech text-[11px] uppercase tracking-widest"
                style={{ color: meta.color }}
              >
                <span className="h-px w-8" style={{ background: meta.color }} />
                {meta.label}
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((a) => (
                  <Link
                    key={a.id}
                    to="/blog/$slug"
                    params={{ slug: a.slug }}
                    className="group flex flex-col overflow-hidden rounded-sm border border-border/60 bg-surface/30 backdrop-blur transition duration-300 hover:-translate-y-1"
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = meta.color)}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "")}
                  >
                    <Thumb
                      color={meta.color}
                      coverImageUrl={a.coverImageUrl}
                      className="aspect-[16/10]"
                    />
                    <div className="flex flex-1 flex-col gap-3 p-6">
                      <div className="flex items-center justify-between font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground">
                        <span className="flex items-center gap-1.5" style={{ color: meta.color }}>
                          <meta.icon className="h-3.5 w-3.5" />
                          {a.desk}
                        </span>
                        <span>{formatAgo(a.publishedAt, now)}</span>
                      </div>
                      <h3
                        className="font-display text-xl text-foreground"
                        style={{ letterSpacing: "-0.02em", lineHeight: 1.15 }}
                      >
                        {a.headline}
                      </h3>
                      <p className="text-[13px] leading-[1.55] text-muted-foreground">
                        {a.excerpt}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        );
      })}

      {/* Redação global */}
      <section className="border-t border-border/40 bg-surface/30 py-20 cv-auto">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-10 flex items-center gap-3 font-mono-tech text-[11px] uppercase tracking-widest text-neon-green">
            <span className="h-px w-8 bg-neon-green" />
            Redação global
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {DESKS.map((d) => (
              <div
                key={d.city}
                className="group rounded-sm border border-border/60 bg-background p-6 backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:border-neon-cyan/50"
              >
                <Globe2 className="h-5 w-5 text-neon-cyan transition-transform group-hover:scale-110" />
                <h3 className="mt-4 font-display text-lg" style={{ letterSpacing: "-0.02em" }}>
                  {d.city}
                </h3>
                <p className="mt-2 text-[13px] leading-[1.55] text-muted-foreground">{d.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Faixa Hub — converte leitor em aluno */}
      <section className="home-hero-dark bg-background py-14">
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-5 px-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2
              className="font-display text-2xl text-foreground sm:text-3xl"
              style={{ letterSpacing: "-0.02em" }}
            >
              Leu a notícia. Agora execute.
            </h2>
            <p className="mt-2 max-w-xl text-[15px] leading-[1.6] text-muted-foreground">
              11 comandos práticos no Veronica Hub — do dark content à IA generativa. Acesso
              vitalício a partir de R$ 19,90.
            </p>
          </div>
          <Link
            to="/"
            className="group inline-flex flex-shrink-0 items-center gap-2 rounded-sm bg-neon-green px-6 py-3.5 font-mono-tech text-xs uppercase tracking-[0.18em] text-primary-foreground shadow-glow-green transition duration-200 hover:-translate-y-0.5 hover:brightness-110"
          >
            Entrar no Hub{" "}
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
