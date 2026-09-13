import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Radio,
  Globe2,
  Cpu,
  TrendingUp,
  Cloud,
  Landmark,
} from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { CoverThumb } from "@/components/blog/CoverThumb";
import { WirePulseGlobe } from "@/components/blog/WirePulseGlobe";
import { getPublishedArticles } from "@/lib/articles-server";
import { BEAT_VALUES, BEAT_LABELS, BEAT_SHORT, type Beat } from "@/lib/beats";
import { formatAgo } from "@/lib/blog-format";
import { WIRE_NAME } from "@/lib/ecosystem";

// O masthead pinta a última palavra da marca em verde e o resto em branco
// ("VERONICA wire" antes, "WIRE tv" depois). Derivado do nome em vez de escrito
// à mão porque era o único ponto que a flag não alcançava: as duas palavras
// vivem em elementos separados, então nenhuma busca pela marca inteira o achava.
const MASTHEAD_PARTS = WIRE_NAME.toUpperCase().split(" ");
const MASTHEAD_ACCENT = MASTHEAD_PARTS.pop() ?? "";
const MASTHEAD_LEAD = MASTHEAD_PARTS.join(" ");

export const Route = createFileRoute("/blog/")({
  component: VeronicaWire,
  loader: () => getPublishedArticles(),
  head: () => ({
    meta: [
      { title: `${WIRE_NAME} — Cobertura contínua e global | Veronica Hub` },
      {
        name: "description",
        content: `${WIRE_NAME}: IA, energia limpa, yuan digital, geopolítica China, EUA e Brasil, e o realinhamento do mercado tecnológico global — cobertura contínua.`,
      },
      { property: "og:title", content: `${WIRE_NAME} — Cobertura contínua e global` },
      {
        property: "og:description",
        content:
          "O jornal digital da Veronica Hub sobre o que está movendo IA, economia e geopolítica.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://veronicahub.com/blog" }],
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

// Sempre parte de um Date de verdade (nunca null) — renderiza a hora certa
// já no primeiro paint (SSR incluído), sem esperar um efeito rodar no
// cliente pra deixar de mostrar "—". O tick por segundo só atualiza depois.
function useLiveClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

const MONTHS_PT = [
  "JAN",
  "FEV",
  "MAR",
  "ABR",
  "MAI",
  "JUN",
  "JUL",
  "AGO",
  "SET",
  "OUT",
  "NOV",
  "DEZ",
];

// Fuso fixo em Brasília, sempre — independente de onde o visitante estiver.
// Usa formatToParts em vez de toLocaleDateString/toLocaleTimeString porque
// o formato de mês abreviado do locale pt-BR varia entre runtimes ICU
// ("ago." vs "ago" vs variações de acento); montar a string à mão garante
// sempre "12 AGO 2026 · 03:48:07 BRT". Segundo por segundo (useLiveClock já
// tica a cada 1s) — data e hora vêm sempre do Date real passado, nunca
// congelam no valor do primeiro render.
function formatMasthead(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "numeric",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const month = MONTHS_PT[Number(get("month")) - 1] ?? "";
  return `${get("day")} ${month} ${get("year")} · ${get("hour")}:${get("minute")}:${get("second")} BRT`;
}

function VeronicaWire() {
  const now = useLiveClock();
  const { articles } = Route.useLoaderData();

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
  // Evita a mesma matéria aparecer duas vezes na tela (destaque/rail e de
  // novo na seção da própria editoria logo abaixo).
  const shownIds = new Set([featured?.id, ...rail.map((a) => a.id)].filter(Boolean));
  const featuredAgo = featured ? formatAgo(featured.publishedAt, now) : "";

  return (
    <div className="home-hybrid min-h-screen overflow-x-hidden bg-background text-foreground">
      <SiteHeader />

      {/* Faixa "ao vivo" — só aparece quando há matéria publicada de verdade */}
      {ticker.length > 0 && (
        <div className="border-b border-border/40 bg-foreground text-background">
          <div className="mx-auto flex h-9 max-w-7xl items-center gap-3 px-6">
            <span className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-sm bg-destructive px-2 py-0.5 font-mono-tech text-[10px] uppercase tracking-widest text-white">
              <Radio className="h-3 w-3 animate-pulse-dot" /> AO VIVO
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
                {MASTHEAD_LEAD} <span className="text-neon-green">{MASTHEAD_ACCENT}</span>
              </div>
              <div className="mt-1 font-mono-tech text-[9px] uppercase tracking-[0.28em] text-muted-foreground">
                Cobertura contínua e global
              </div>
            </div>
            <div className="flex items-center gap-3">
              <WirePulseGlobe size={34} className="hidden sm:block" />
              {/* suppressHydrationWarning: valor calculado do relógio muda entre o
                  render do servidor e a hidratação no cliente por design (é um
                  relógio ao vivo) — sem isso o React acusa mismatch por engano. */}
              <div
                className="text-right font-mono-tech text-[11px] text-muted-foreground"
                suppressHydrationWarning
              >
                {formatMasthead(now)}
              </div>
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
              <Link
                key={b}
                to="/blog/editoria/$beat"
                params={{ beat: b }}
                className="whitespace-nowrap rounded-sm px-3 py-1.5 text-muted-foreground transition hover:text-foreground"
              >
                {BEAT_META[b].short}
              </Link>
            ))}
            <Link
              to="/blog/rede-de-fontes"
              className="whitespace-nowrap rounded-sm px-3 py-1.5 text-muted-foreground transition hover:text-foreground"
            >
              Rede de Fontes
            </Link>
            <Link
              to="/comandos"
              className="whitespace-nowrap rounded-sm px-3 py-1.5 text-muted-foreground transition hover:text-foreground"
            >
              Formações
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
        {!featured ? (
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
              <CoverThumb
                beat={featured.beat}
                coverImageUrl={featured.coverImageUrl}
                className="aspect-[16/10]"
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
                  {featured.editorialChannel.label}
                  {featuredAgo && ` · ${featuredAgo}`}
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

      {/* Seções por editoria — só renderiza quando existe matéria publicada nela */}
      {BEAT_VALUES.map((beat) => {
        const items = articles.filter((a) => a.beat === beat && !shownIds.has(a.id));
        if (items.length === 0) return null;
        const meta = BEAT_META[beat];
        return (
          <section
            key={beat}
            id={`beat-${beat}`}
            className="border-t border-border/40 py-16 cv-auto"
          >
            <div className="mx-auto max-w-7xl px-6">
              <div className="mb-8 flex items-center justify-between gap-3">
                <div
                  className="flex items-center gap-3 font-mono-tech text-[11px] uppercase tracking-widest"
                  style={{ color: meta.color }}
                >
                  <span className="h-px w-8" style={{ background: meta.color }} />
                  {meta.label}
                </div>
                <Link
                  to="/blog/editoria/$beat"
                  params={{ beat }}
                  className="font-mono-tech text-[10.5px] uppercase tracking-widest text-muted-foreground transition hover:text-foreground"
                >
                  Ver todas ›
                </Link>
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
                    <CoverThumb
                      beat={a.beat}
                      coverImageUrl={a.coverImageUrl}
                      className="aspect-[16/10]"
                    />
                    <div className="flex flex-1 flex-col gap-3 p-6">
                      <div className="flex items-center justify-between font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground">
                        <span className="flex items-center gap-1.5" style={{ color: meta.color }}>
                          <meta.icon className="h-3.5 w-3.5" />
                          {a.editorialChannel.label}
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

      <SiteFooter />
    </div>
  );
}
