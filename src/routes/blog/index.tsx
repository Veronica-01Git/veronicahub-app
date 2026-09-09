import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Radio,
  Globe2,
  Cpu,
  TrendingUp,
  Cloud,
  Landmark,
  ArrowRight,
  Activity,
  Database,
  Radar,
  ShieldCheck,
  SlidersHorizontal,
  MessageCircle,
  Youtube,
  Zap,
} from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { CoverThumb } from "@/components/blog/CoverThumb";
import { WirePulseGlobe } from "@/components/blog/WirePulseGlobe";
import { WireOwnedStories } from "@/components/blog/WireGrowth";
import { getPublishedArticles } from "@/lib/articles-server";
import { BEAT_VALUES, BEAT_LABELS, BEAT_SHORT, type Beat } from "@/lib/beats";
import { formatAgo } from "@/lib/blog-format";

export const Route = createFileRoute("/blog/")({
  component: VeronicaWire,
  loader: () => getPublishedArticles(),
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

const DESKS = [
  {
    city: "São Paulo",
    note: "Fuso-base da operação: consolidação da cobertura de IA generativa e comércio China-Brasil na América Latina.",
  },
  {
    city: "San Francisco",
    note: "Monitoramento de laboratórios de ponta e política tecnológica dos EUA.",
  },
  {
    city: "Pequim",
    note: "Monitoramento do yuan digital e do ecossistema asiático de modelos abertos.",
  },
  {
    city: "Londres",
    note: "Monitoramento de política regulatória e do mercado de energia limpa europeu.",
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

type WireFeedArticle = {
  id: string;
  slug: string;
  beat: Beat;
  headline: string;
  excerpt: string;
  desk: string;
  coverImageUrl: string | null;
  sourceUrls: string[];
  publishedAt: string | null;
};

function sourceDomain(sourceUrl: string) {
  try {
    return new URL(sourceUrl).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function WireSignalRoom({
  articles,
  current24hCount,
  now,
}: {
  articles: WireFeedArticle[];
  current24hCount: number;
  now: Date;
}) {
  const [favoriteBeat, setFavoriteBeat] = useState<Beat | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem("veronica-wire-favorite-beat");
    if (saved && BEAT_VALUES.includes(saved as Beat)) setFavoriteBeat(saved as Beat);
  }, []);

  const chooseBeat = (beat: Beat) => {
    setFavoriteBeat(beat);
    window.localStorage.setItem("veronica-wire-favorite-beat", beat);
  };

  const uniqueSources = new Set(
    articles.flatMap((article) => article.sourceUrls.map(sourceDomain).filter(Boolean)),
  ).size;
  const selectedStory = favoriteBeat
    ? articles.find((article) => article.beat === favoriteBeat)
    : articles[0];
  const selectedMeta = favoriteBeat ? BEAT_META[favoriteBeat] : null;

  return (
    <section
      id="sala-sinais"
      className="border-y border-border/50 bg-foreground py-16 text-background cv-auto"
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="relative overflow-hidden rounded-sm border border-background/15 bg-background/[0.035]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-25"
            style={{
              backgroundImage:
                "linear-gradient(rgba(79,255,180,.10) 1px, transparent 1px), linear-gradient(90deg, rgba(79,255,180,.10) 1px, transparent 1px)",
              backgroundSize: "34px 34px",
              maskImage: "linear-gradient(135deg, black, transparent 72%)",
            }}
          />

          <div className="relative border-b border-background/15 px-5 py-4 sm:px-7">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 font-mono-tech text-[9px] uppercase tracking-[0.28em] text-neon-green">
                  <Activity className="h-3.5 w-3.5" /> Veronica newsroom intelligence
                </div>
                <h2 className="mt-2 font-display text-2xl text-background sm:text-3xl">
                  Signal Room
                </h2>
              </div>
              <div className="flex items-center gap-2 rounded-sm border border-neon-green/30 bg-neon-green/10 px-3 py-2 font-mono-tech text-[9px] uppercase tracking-[0.2em] text-neon-green">
                <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-neon-green" />
                Radar ativo
              </div>
            </div>
          </div>

          <div className="relative grid border-b border-background/15 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Ciclo de apuração", value: "60 min", icon: Radar },
              { label: "Publicadas em 24h", value: String(current24hCount), icon: Activity },
              { label: "Domínios citados", value: String(uniqueSources), icon: Database },
              { label: "Regra editorial", value: "2+ fontes", icon: ShieldCheck },
            ].map((metric) => {
              const Icon = metric.icon;
              return (
                <div
                  key={metric.label}
                  className="border-b border-background/10 p-5 last:border-b-0 sm:border-r lg:border-b-0"
                >
                  <Icon className="h-4 w-4 text-neon-cyan" />
                  <div className="mt-4 font-display text-2xl text-background">{metric.value}</div>
                  <div className="mt-1 font-mono-tech text-[8.5px] uppercase tracking-[0.2em] text-background/50">
                    {metric.label}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="relative grid lg:grid-cols-[1.45fr_.75fr]">
            <div className="border-b border-background/15 p-5 sm:p-7 lg:border-b-0 lg:border-r">
              <div className="flex items-center gap-2 font-mono-tech text-[9px] uppercase tracking-[0.22em] text-background/55">
                <SlidersHorizontal className="h-3.5 w-3.5" /> Configure seu radar
              </div>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-background/65">
                Escolha a editoria que você quer acompanhar. A preferência fica neste dispositivo e
                destaca a matéria mais recente do tema.
              </p>
              <div
                className="mt-5 flex flex-wrap gap-2"
                role="group"
                aria-label="Escolha uma editoria preferida"
              >
                {BEAT_VALUES.map((beat) => {
                  const active = favoriteBeat === beat;
                  return (
                    <button
                      key={beat}
                      type="button"
                      aria-pressed={active}
                      onClick={() => chooseBeat(beat)}
                      className={`rounded-sm border px-3 py-2 font-mono-tech text-[9px] uppercase tracking-widest transition ${
                        active
                          ? "border-neon-green bg-neon-green text-primary-foreground"
                          : "border-background/20 text-background/65 hover:border-neon-green/60 hover:text-neon-green"
                      }`}
                    >
                      {BEAT_META[beat].short}
                    </button>
                  );
                })}
              </div>

              {selectedStory ? (
                <Link
                  to="/blog/$slug"
                  params={{ slug: selectedStory.slug }}
                  className="group mt-6 grid overflow-hidden rounded-sm border border-background/15 bg-background/[0.045] sm:grid-cols-[190px_1fr]"
                >
                  <CoverThumb
                    beat={selectedStory.beat}
                    coverImageUrl={selectedStory.coverImageUrl}
                    className="aspect-[16/9] h-full min-h-32"
                  />
                  <div className="p-5">
                    <div className="font-mono-tech text-[9px] uppercase tracking-[0.2em] text-neon-green">
                      {favoriteBeat
                        ? `Seu radar · ${selectedMeta!.short}`
                        : "Último sinal publicado"}
                    </div>
                    <h3 className="mt-2 font-display text-xl leading-tight text-background transition group-hover:text-neon-green">
                      {selectedStory.headline}
                    </h3>
                    <div className="mt-3 flex items-center justify-between gap-3 font-mono-tech text-[8.5px] uppercase tracking-widest text-background/45">
                      <span>{selectedStory.desk}</span>
                      <span>{formatAgo(selectedStory.publishedAt, now)}</span>
                    </div>
                  </div>
                </Link>
              ) : favoriteBeat ? (
                <div className="mt-6 rounded-sm border border-dashed border-background/20 p-5 text-sm text-background/55">
                  Ainda não há matéria verificada de {selectedMeta!.label.toLowerCase()} neste
                  ciclo. O radar continua acompanhando as fontes.
                </div>
              ) : null}
            </div>

            <aside className="p-5 sm:p-7" aria-labelledby="wire-method-title">
              <div className="font-mono-tech text-[9px] uppercase tracking-[0.22em] text-neon-cyan">
                Protocolo de confiança
              </div>
              <h3 id="wire-method-title" className="mt-2 font-display text-xl text-background">
                Informação antes do ruído
              </h3>
              <ol className="mt-5 space-y-4">
                {[
                  ["01", "Radar", "Sinais recentes entram na fila de apuração."],
                  ["02", "Cruzamento", "A pauta exige ao menos dois domínios independentes."],
                  ["03", "Contexto", "Fato, sinal e cenário futuro são tratados separadamente."],
                ].map(([number, title, text]) => (
                  <li key={number} className="grid grid-cols-[30px_1fr] gap-3">
                    <span className="font-mono-tech text-[10px] text-neon-green">{number}</span>
                    <div>
                      <div className="text-sm font-medium text-background">{title}</div>
                      <p className="mt-0.5 text-xs leading-relaxed text-background/50">{text}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <Link
                to="/comandos"
                className="mt-6 inline-flex items-center gap-2 font-mono-tech text-[9px] uppercase tracking-[0.2em] text-neon-green transition hover:text-neon-cyan"
              >
                Investigue com a Veronica <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}

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
  const { articles, current24hCount } = Route.useLoaderData();

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
            <a
              href="#sala-sinais"
              className="whitespace-nowrap rounded-sm px-3 py-1.5 text-muted-foreground transition hover:text-neon-green"
            >
              Signal Room
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
                  {featured.desk}
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

      <WireSignalRoom
        articles={articles}
        current24hCount={current24hCount}
        now={now}
      />

      {/* Conteúdo proprietário entra depois da entrega editorial principal. */}
      <WireOwnedStories />

      {/* Central da comunidade — ações reais, sem formulário decorativo. */}
      <section className="border-y border-border/40 bg-foreground py-12 text-background cv-auto">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 font-mono-tech text-[9px] uppercase tracking-[0.25em] text-neon-cyan">
                <Zap className="h-3.5 w-3.5" /> Rede Veronica
              </div>
              <h2 className="mt-2 font-display text-2xl text-background sm:text-3xl">
                Comunidade conectada à redação
              </h2>
            </div>
            <span className="font-mono-tech text-[9px] uppercase tracking-[0.2em] text-background/45">
              notícias · formação · participação
            </span>
          </div>

          <div className="grid overflow-hidden rounded-sm border border-background/15 lg:grid-cols-[.75fr_.75fr_1.5fr]">
            <a
              href="https://youtube.com/@veronica-hub?sub_confirmation=1&utm_source=wire&utm_medium=community_panel"
              target="_blank"
              rel="noopener noreferrer"
              className="group border-b border-background/15 p-6 transition hover:bg-background/[0.06] lg:border-b-0 lg:border-r"
            >
              <Youtube className="h-5 w-5 text-neon-green" />
              <h3 className="mt-5 font-display text-xl text-background">Wire em vídeo</h3>
              <p className="mt-2 text-sm leading-relaxed text-background/55">
                Análises, aulas abertas e bastidores da Veronica.
              </p>
              <span className="mt-5 inline-flex items-center gap-1 font-mono-tech text-[9px] uppercase tracking-widest text-neon-green">
                acompanhar canal <ArrowRight className="h-3 w-3 transition group-hover:translate-x-1" />
              </span>
            </a>

            <Link
              to="/"
              className="group border-b border-background/15 p-6 transition hover:bg-background/[0.06] lg:border-b-0 lg:border-r"
            >
              <MessageCircle className="h-5 w-5 text-neon-cyan" />
              <h3 className="mt-5 font-display text-xl text-background">Entrar na comunidade</h3>
              <p className="mt-2 text-sm leading-relaxed text-background/55">
                Continue a investigação com ferramentas e comandos do Hub.
              </p>
              <span className="mt-5 inline-flex items-center gap-1 font-mono-tech text-[9px] uppercase tracking-widest text-neon-cyan">
                acessar hub <ArrowRight className="h-3 w-3 transition group-hover:translate-x-1" />
              </span>
            </Link>

            <div className="relative overflow-hidden p-6">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-20"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(52,211,153,.14) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,.12) 1px, transparent 1px)",
                  backgroundSize: "26px 26px",
                }}
              />
              <div className="relative">
                <h3 className="font-mono-tech text-[10px] uppercase tracking-widest text-background/60">
                  Radar temático
                </h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  {TAGS.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-sm border border-background/15 bg-background/[0.04] px-2.5 py-1.5 font-mono-tech text-[9.5px] text-background/65 transition hover:border-neon-green/50 hover:text-neon-green"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
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

      {/* Monitoramento global */}
      <section className="border-t border-border/40 bg-surface/30 py-20 cv-auto">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-2 flex items-center gap-3 font-mono-tech text-[11px] uppercase tracking-widest text-neon-green">
            <span className="h-px w-8 bg-neon-green" />
            Monitoramento global
          </div>
          <p className="mb-8 max-w-xl text-[13px] text-muted-foreground">
            Cobertura organizada por fuso horário, não por correspondentes locais — buscas
            automatizadas via IA em fontes de cada região.
          </p>
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
