import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  Clock3,
  FileCheck2,
  Globe2,
  Cpu,
  TrendingUp,
  Cloud,
  Landmark,
} from "lucide-react";
import { SiteHeader, SiteFooter, SOCIAL_LINKS } from "@/components/SiteChrome";
import { CoverThumb } from "@/components/blog/CoverThumb";
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
        content: `${WIRE_NAME}: IA, energia limpa, yuan digital, geopolítica Brasil e China, e o realinhamento do mercado tecnológico — cobertura contínua.`,
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
  const ticker = articles.slice(0, 10);
  // Evita a mesma matéria aparecer duas vezes na tela (destaque/rail e de
  // novo na seção da própria editoria logo abaixo).
  const shownIds = new Set([featured?.id, ...rail.map((a) => a.id)].filter(Boolean));
  const featuredAgo = featured ? formatAgo(featured.publishedAt, now) : "";

  return (
    <div className="home-hybrid wire-editorial min-h-screen overflow-x-hidden bg-background text-foreground">
      <SiteHeader />

      <header className="wire-masthead border-b border-white/10 bg-[#101010] text-white">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between gap-4 border-b border-white/15 pb-3 font-mono-tech text-[10px] uppercase tracking-[0.18em] text-white/55">
            <span className="inline-flex items-center gap-2 text-[#63e6a6]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#63e6a6] opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#63e6a6]" />
              </span>
              Edição contínua
            </span>
            <span className="hidden sm:inline">{current24hCount} publicações nas últimas 24h</span>
            <span suppressHydrationWarning>{formatMasthead(now)}</span>
          </div>

          <div className="relative flex min-h-28 items-center justify-center py-5 text-center sm:min-h-36">
            <div>
              <div className="wire-serif text-[2.9rem] font-black leading-none tracking-[-0.055em] sm:text-6xl lg:text-7xl">
                {MASTHEAD_LEAD} <span className="text-[#63e6a6]">{MASTHEAD_ACCENT}</span>
              </div>
              <div className="mt-3 text-[11px] uppercase tracking-[0.24em] text-white/55 sm:text-xs">
                Negócios, tecnologia e poder em perspectiva
              </div>
            </div>
          </div>

          <nav className="flex gap-1 overflow-x-auto border-t border-white/15 pt-3 text-sm font-semibold">
            <a
              href="#topo"
              className="whitespace-nowrap border-b-2 border-[#63e6a6] px-3 py-2 text-white"
            >
              Início
            </a>
            {BEAT_VALUES.map((b) => (
              <Link
                key={b}
                to="/blog/editoria/$beat"
                params={{ beat: b }}
                className="whitespace-nowrap border-b-2 border-transparent px-3 py-2 text-white/65 transition hover:border-white/50 hover:text-white"
              >
                {BEAT_META[b].short}
              </Link>
            ))}
            <Link
              to="/blog/rede-de-fontes"
              className="whitespace-nowrap border-b-2 border-transparent px-3 py-2 text-white/65 transition hover:border-white/50 hover:text-white"
            >
              Rede de Fontes
            </Link>
            <Link
              to="/blog/expediente"
              className="whitespace-nowrap border-b-2 border-transparent px-3 py-2 text-white/65 transition hover:border-white/50 hover:text-white"
            >
              Expediente
            </Link>
            <Link
              to="/comandos"
              className="whitespace-nowrap border-b-2 border-transparent px-3 py-2 text-white/65 transition hover:border-white/50 hover:text-white"
            >
              Formações
            </Link>
            <a
              href={SOCIAL_LINKS.wireInstagram}
              target="_blank"
              rel="noopener noreferrer"
              className="whitespace-nowrap border-b-2 border-transparent px-3 py-2 text-white/65 transition hover:border-white/50 hover:text-white"
            >
              Instagram ↗
            </a>
            <Link
              to="/"
              className="ml-auto whitespace-nowrap border border-[#63e6a6]/50 px-4 py-2 text-[#63e6a6] transition hover:bg-[#63e6a6] hover:text-[#101010]"
            >
              Hub ▸
            </Link>
          </nav>
        </div>
      </header>

      {ticker.length > 0 && (
        <div className="wire-news-flash border-b border-border bg-white">
          <div className="mx-auto flex max-w-7xl items-stretch px-6">
            <div className="z-10 flex shrink-0 items-center gap-2 bg-[#db2525] px-4 py-3 font-mono-tech text-[10px] font-bold uppercase tracking-[0.18em] text-white">
              <Activity className="h-3.5 w-3.5" /> Agora
            </div>
            <div className="wire-ticker-window min-w-0 flex-1 overflow-hidden">
              <div className="wire-ticker-track flex w-max items-stretch">
                {ticker.map((article) => (
                  <Link
                    key={article.id}
                    to="/blog/$slug"
                    params={{ slug: article.slug }}
                    className="wire-ticker-item flex w-[300px] shrink-0 items-center border-r border-border px-5 py-3 wire-serif text-[15px] font-bold leading-tight text-foreground transition hover:bg-surface hover:text-neon-green sm:w-[380px]"
                  >
                    {article.headline}
                  </Link>
                ))}
                <div aria-hidden="true" className="flex">
                  {ticker.map((article) => (
                    <span
                      key={`repeat-${article.id}`}
                      className="wire-ticker-item flex w-[300px] shrink-0 items-center border-r border-border px-5 py-3 wire-serif text-[15px] font-bold leading-tight text-foreground sm:w-[380px]"
                    >
                      {article.headline}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="border-b border-border bg-[#f7f7f5]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-6 py-3 text-xs text-muted-foreground">
          <Link
            to="/blog/expediente"
            hash="metodo"
            className="inline-flex items-center gap-2 transition hover:text-neon-green"
          >
            <FileCheck2 className="h-3.5 w-3.5 text-neon-green" /> Método editorial público
          </Link>
          <Link to="/blog/rede-de-fontes" className="transition hover:text-neon-green">
            Fontes identificadas
          </Link>
          <Link to="/blog/expediente" hash="correcoes" className="transition hover:text-neon-green">
            Política de correções
          </Link>
          <a href="/feed.xml" className="transition hover:text-neon-green">
            RSS
          </a>
        </div>
      </div>

      {/* Capa da edição: hierarquia de jornal, com manchete e últimas. */}
      <section id="topo" className="mx-auto max-w-7xl px-6 py-10 sm:py-14 cv-auto">
        {!featured ? (
          <div className="rounded-sm border border-border/60 bg-surface/40 p-8 text-center">
            <h1 className="font-display text-2xl text-foreground">Primeiras matérias a caminho</h1>
            <p className="mx-auto mt-2 max-w-md text-[15px] text-muted-foreground">
              Nossa redação está preparando a primeira leva de conteúdo. Volte em breve.
            </p>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.55fr)_minmax(320px,.75fr)] lg:gap-10">
            <Link
              to="/blog/$slug"
              params={{ slug: featured.slug }}
              className="wire-lead group block min-w-0 border-b-2 border-foreground pb-8 lg:border-b-0 lg:border-r lg:pr-10"
            >
              <div
                className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-[0.12em]"
                style={{ color: featuredMeta!.color }}
              >
                <FeaturedIcon className="h-4 w-4" />
                {featuredMeta!.label}
              </div>
              <h1 className="wire-serif mt-4 max-w-4xl text-[2.65rem] font-black leading-[0.98] tracking-[-0.045em] text-foreground transition group-hover:text-neon-green sm:text-6xl lg:text-[4.2rem]">
                {featured.headline}
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                {featured.excerpt}
              </p>
              <div className="mt-5 flex items-center gap-3 border-t border-border pt-4 text-xs uppercase tracking-wider text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {featured.editorialChannel.label}
                </span>
                {featuredAgo && <span>{featuredAgo}</span>}
                <ArrowUpRight className="ml-auto h-4 w-4 text-neon-green transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </div>
              <div className="wire-media mt-7 overflow-hidden bg-surface">
                <CoverThumb
                  beat={featured.beat}
                  coverImageUrl={featured.coverImageUrl}
                  className="aspect-[16/9] transition duration-700 ease-out group-hover:scale-[1.025]"
                />
              </div>
            </Link>

            {rail.length > 0 && (
              <aside className="min-w-0">
                <div className="mb-1 flex items-center justify-between border-b-2 border-foreground pb-3">
                  <h2 className="wire-serif text-2xl font-black">Últimas notícias</h2>
                  <span className="font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground">
                    Atualização contínua
                  </span>
                </div>
                {rail.map((a, i) => (
                  <Link
                    key={a.id}
                    to="/blog/$slug"
                    params={{ slug: a.slug }}
                    className="wire-side-story group grid grid-cols-[minmax(0,1fr)_104px] gap-4 border-b border-border py-5 transition hover:bg-surface/45"
                    style={{ animationDelay: `${i * 70}ms` }}
                  >
                    <div className="min-w-0">
                      <span
                        className="mb-2 block text-[10px] font-bold uppercase tracking-[0.12em]"
                        style={{ color: BEAT_META[a.beat].color }}
                      >
                        {BEAT_META[a.beat].short}
                      </span>
                      <span className="wire-serif block text-[18px] font-bold leading-[1.08] text-foreground transition group-hover:text-neon-green">
                        {a.headline}
                      </span>
                      <span className="mt-2 block text-xs uppercase tracking-wider text-muted-foreground">
                        {formatAgo(a.publishedAt, now)}
                      </span>
                    </div>
                    <div className="wire-media overflow-hidden bg-surface">
                      <CoverThumb
                        beat={a.beat}
                        coverImageUrl={a.coverImageUrl}
                        className="aspect-square transition duration-500 group-hover:scale-105"
                      />
                    </div>
                  </Link>
                ))}
              </aside>
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
            className="border-t border-border bg-white py-12 sm:py-16 cv-auto"
          >
            <div className="mx-auto max-w-7xl px-6">
              <div className="mb-7 flex items-end justify-between gap-3 border-b-2 border-foreground pb-3">
                <div className="flex items-center gap-3">
                  <span className="h-7 w-1" style={{ background: meta.color }} />
                  <h2 className="wire-serif text-2xl font-black tracking-[-0.025em] text-foreground sm:text-3xl">
                    {meta.label}
                  </h2>
                </div>
                <Link
                  to="/blog/editoria/$beat"
                  params={{ beat }}
                  className="font-mono-tech text-[10.5px] uppercase tracking-widest text-muted-foreground transition hover:text-foreground"
                >
                  Ver editoria <ArrowUpRight className="ml-1 inline h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="grid gap-x-6 gap-y-9 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {items.map((a, index) => (
                  <Link
                    key={a.id}
                    to="/blog/$slug"
                    params={{ slug: a.slug }}
                    className="wire-story-card group flex flex-col border-b border-border pb-6 transition duration-300 hover:-translate-y-1"
                    style={{ animationDelay: `${Math.min(index, 5) * 60}ms` }}
                  >
                    <div className="wire-media overflow-hidden bg-surface">
                      <CoverThumb
                        beat={a.beat}
                        coverImageUrl={a.coverImageUrl}
                        className="aspect-[16/10] transition duration-700 ease-out group-hover:scale-105"
                      />
                    </div>
                    <div className="flex flex-1 flex-col gap-3 pt-4">
                      <div className="flex items-center justify-between font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground">
                        <span className="flex items-center gap-1.5" style={{ color: meta.color }}>
                          <meta.icon className="h-3.5 w-3.5" />
                          {a.editorialChannel.label}
                        </span>
                        <span>{formatAgo(a.publishedAt, now)}</span>
                      </div>
                      <h3 className="wire-serif text-[1.35rem] font-bold leading-[1.08] tracking-[-0.02em] text-foreground transition group-hover:text-neon-green">
                        {a.headline}
                      </h3>
                      <p className="line-clamp-3 text-sm leading-[1.55] text-muted-foreground">
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
