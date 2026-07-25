import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Radio,
  Globe2,
  Cpu,
  Scale,
  TrendingUp,
  FlaskConical,
  AudioLines,
  Workflow,
  Cloud,
  Leaf,
  Landmark,
  CircleDollarSign,
  Handshake,
  Building2,
} from "lucide-react";
import cyborgAsset from "@/assets/veronica-cyborg-v2.jpg.asset.json";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";

export const Route = createFileRoute("/blog")({
  component: VeronicaWire,
  head: () => ({
    meta: [
      { title: "Veronica Wire — Cobertura contínua e global | Veronica Hub" },
      {
        name: "description",
        content: "Veronica Wire: IA, clima futuro, yuan digital, geopolítica China x Brasil e o realinhamento do mercado tecnológico global — cobertura contínua.",
      },
      { property: "og:title", content: "Veronica Wire — Cobertura contínua e global" },
      { property: "og:description", content: "O jornal digital da Veronica Hub sobre o que está movendo IA, economia e geopolítica." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "preload", as: "image", href: cyborgAsset.url, fetchpriority: "high" }],
  }),
});

type Beat = "ia" | "clima" | "economia" | "geopolitica" | "mercado";

const BEAT_META: Record<Beat, { label: string; short: string; color: string }> = {
  ia: { label: "Inteligência Artificial", short: "IA", color: "oklch(0.85 0.22 155)" },
  clima: { label: "Clima Futuro", short: "Clima", color: "oklch(0.75 0.16 220)" },
  economia: { label: "Economia · Yuan Digital", short: "Economia", color: "oklch(0.82 0.17 85)" },
  geopolitica: { label: "Geopolítica · China x Brasil", short: "Geopolítica", color: "oklch(0.66 0.21 25)" },
  mercado: { label: "Mercado Tecnológico Global", short: "Mercado", color: "oklch(0.7 0.19 290)" },
};

const BEAT_ORDER: Beat[] = ["ia", "clima", "economia", "geopolitica", "mercado"];

type Article = {
  id: string;
  beat: Beat;
  icon: typeof Cpu;
  headline: string;
  excerpt: string;
  desk: string;
  minutesAgo: number;
  featured?: boolean;
};

const ARTICLES: Article[] = [
  { id: "1", beat: "ia", icon: Cpu, headline: "Modelos de vídeo por IA se aproximam da qualidade cinematográfica", excerpt: "Motores de geração de vídeo elevam a barra de realismo, acelerando a adoção em produções independentes e conteúdo publicitário.", desk: "Desk de Modelos", minutesAgo: 12, featured: true },
  { id: "2", beat: "ia", icon: Workflow, headline: "Custo de inferência de LLMs segue em queda acelerada", excerpt: "Otimizações de hardware e arquitetura reduzem o custo por token, ampliando o acesso a aplicações de IA em tempo real.", desk: "Desk de Infraestrutura", minutesAgo: 34 },
  { id: "3", beat: "ia", icon: Scale, headline: "Debate sobre regulação de IA generativa avança em múltiplos países", excerpt: "Governos discutem regras de transparência e rotulagem de conteúdo gerado por IA em ritmos diferentes.", desk: "Desk de Políticas", minutesAgo: 58 },
  { id: "4", beat: "ia", icon: FlaskConical, headline: "Novos benchmarks tentam medir raciocínio de forma mais rigorosa", excerpt: "Pesquisadores propõem testes que vão além de tarefas memorizáveis, buscando avaliar generalização real.", desk: "Desk de Pesquisa", minutesAgo: 95 },
  { id: "5", beat: "ia", icon: AudioLines, headline: "Síntese de voz atinge naturalidade quase indistinguível em testes cegos", excerpt: "Avanços em prosódia e entonação tornam vozes sintéticas cada vez mais próximas da fala humana.", desk: "Desk de Áudio", minutesAgo: 168 },
  { id: "6", beat: "clima", icon: Cloud, headline: "IA acelera precisão de modelos climáticos de longo prazo", excerpt: "Redes neurais passam a complementar simulações físicas tradicionais, refinando projeções para as próximas décadas.", desk: "Desk de Clima", minutesAgo: 40 },
  { id: "7", beat: "clima", icon: Leaf, headline: "Investimento em tecnologia climática cresce em ritmo global", excerpt: "Fundos direcionam capital para soluções de monitoramento e mitigação apoiadas por dados e modelagem preditiva.", desk: "Desk de Clima", minutesAgo: 130 },
  { id: "8", beat: "economia", icon: Landmark, headline: "Yuan digital avança em testes de pagamentos transfronteiriços", excerpt: "Projetos-piloto ampliam o uso da moeda digital chinesa em transações internacionais, pressionando outros bancos centrais a acelerar seus próprios estudos.", desk: "Desk de Economia", minutesAgo: 22 },
  { id: "9", beat: "economia", icon: CircleDollarSign, headline: "Moedas digitais de bancos centrais ganham tração global", excerpt: "Mais países avançam de fase experimental para testes-piloto de suas próprias moedas digitais soberanas.", desk: "Desk de Economia", minutesAgo: 150 },
  { id: "10", beat: "geopolitica", icon: Handshake, headline: "Comércio entre China e Brasil se intensifica em tecnologia e agronegócio", excerpt: "Novos acordos ampliam a troca bilateral, com foco crescente em infraestrutura digital e cadeias produtivas.", desk: "Desk de Geopolítica", minutesAgo: 65 },
  { id: "11", beat: "geopolitica", icon: Globe2, headline: "Parcerias sino-brasileiras avançam em projetos de infraestrutura digital", excerpt: "Investimentos conjuntos miram conectividade e capacidade de processamento de dados entre os dois países.", desk: "Desk de Geopolítica", minutesAgo: 190 },
  { id: "12", beat: "mercado", icon: TrendingUp, headline: "Mercado de tecnologia passa por realinhamento global de investimentos", excerpt: "Capital se desloca entre setores à medida que a infraestrutura de IA se torna prioridade estratégica.", desk: "Desk de Mercado", minutesAgo: 48 },
  { id: "13", beat: "mercado", icon: Building2, headline: "Big techs redirecionam capital para infraestrutura de IA", excerpt: "Orçamentos de capital priorizam data centers e chips especializados em detrimento de outras linhas de produto.", desk: "Desk de Mercado", minutesAgo: 112 },
];

const TICKER = [
  "Vídeo por IA aproxima-se do padrão cinematográfico",
  "Yuan digital avança em pagamentos transfronteiriços",
  "China e Brasil ampliam comércio em tecnologia e agro",
  "Custo de inferência de LLMs cai pelo 6º mês seguido",
  "Investimento em tecnologia climática cresce globalmente",
  "Big techs redirecionam capital para infraestrutura de IA",
];

const MARKET_TICKER: { label: string; value: string; up: boolean }[] = [
  { label: "IA-INDEX", value: "+2,4%", up: true },
  { label: "YUAN DIGITAL", value: "¥7,02", up: false },
  { label: "CHIPS-IA", value: "+1,8%", up: true },
  { label: "BRICS-TECH", value: "+0,6%", up: true },
  { label: "CARBON-AI", value: "-0,3%", up: false },
  { label: "CLOUD-CAPEX", value: "+3,1%", up: true },
  { label: "BRASIL-CHINA COMÉRCIO", value: "+1,2%", up: true },
];

const DESKS = [
  { city: "São Paulo", note: "Cobertura de adoção de IA generativa e comércio China-Brasil na América Latina." },
  { city: "San Francisco", note: "Acompanhamento contínuo dos laboratórios de ponta." },
  { city: "Pequim", note: "Monitoramento do yuan digital e do ecossistema asiático de modelos abertos." },
  { city: "Londres", note: "Análise de políticas regulatórias e mercado climático europeu." },
];

function useLiveClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

function formatAgo(minutes: number): string {
  if (minutes < 60) return `há ${minutes} min`;
  return `há ${Math.floor(minutes / 60)}h`;
}

// "oklch(L C H)" -> "oklch(L C H / alpha)" — alpha must live inside the
// function, appending " / alpha" after the closing paren is invalid CSS.
function withAlpha(oklch: string, alpha: number): string {
  return oklch.replace(/\)$/, ` / ${alpha})`);
}

function VeronicaWire() {
  const now = useLiveClock();
  const featured = ARTICLES.find((a) => a.featured) ?? ARTICLES[0];
  const rail = ARTICLES.filter((a) => a.id !== featured.id).slice(0, 5);

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <SiteHeader />

      {/* Masthead */}
      <section className="relative overflow-hidden border-b border-border/40 scanlines">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(circle at 15% 20%, oklch(0.85 0.22 155 / 0.18), transparent 55%), radial-gradient(circle at 85% 80%, oklch(0.88 0.15 195 / 0.16), transparent 55%)",
          }}
        />
        <div className="relative mx-auto max-w-7xl px-6 pt-14 pb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-destructive/50 bg-background/60 px-3.5 py-1.5 font-mono-tech text-[10px] uppercase tracking-widest text-destructive backdrop-blur">
              <Radio className="h-3 w-3 animate-pulse-dot" />
              Ao vivo
            </div>
            <div className="font-mono-tech text-[11px] uppercase tracking-widest text-muted-foreground">
              {now ? now.toLocaleString("pt-BR", { dateStyle: "long", timeStyle: "medium" }) : "—"}
            </div>
          </div>
          <h1 className="mt-6 font-display text-6xl sm:text-7xl md:text-8xl" style={{ letterSpacing: "-0.045em", lineHeight: "0.9" }}>
            Veronica <span className="text-outline-neon">Wire</span>
          </h1>
          <p className="mt-4 max-w-xl text-base leading-[1.65] text-muted-foreground sm:text-lg">
            IA, clima futuro, yuan digital, geopolítica China x Brasil e o realinhamento do mercado tecnológico global.
          </p>
          <span className="mt-5 inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/50 px-3 py-1 font-mono-tech text-[9px] uppercase tracking-widest text-muted-foreground backdrop-blur">
            Edição de demonstração · feed ao vivo em breve
          </span>

          {/* Section subnav */}
          <nav className="mt-8 flex flex-wrap gap-1 border-t border-border/40 pt-4 font-mono-tech text-[11px] uppercase tracking-widest">
            <a href="#topo" className="rounded-sm px-3 py-1.5 text-muted-foreground transition hover:text-foreground">Início</a>
            {BEAT_ORDER.map((b) => (
              <a
                key={b}
                href={`#beat-${b}`}
                className="rounded-sm px-3 py-1.5 transition hover:-translate-y-0.5"
                style={{ color: BEAT_META[b].color }}
              >
                {BEAT_META[b].short}
              </a>
            ))}
          </nav>
        </div>

        {/* Headline ticker */}
        <div className="relative overflow-hidden border-t border-border/40 bg-surface/60 py-2.5">
          <div className="flex animate-marquee gap-10 whitespace-nowrap font-mono-tech text-xs uppercase tracking-widest text-muted-foreground">
            {[...TICKER, ...TICKER].map((headline, i) => (
              <span key={i} className="flex items-center gap-10">
                <span className="text-neon-green">●</span>
                <span className="text-foreground/90">{headline}</span>
              </span>
            ))}
          </div>
        </div>
        {/* Market ticker — broadcast-style live data strip */}
        <div className="relative overflow-hidden border-t border-border/40 bg-black py-2.5">
          <div className="flex animate-marquee gap-8 whitespace-nowrap font-mono-tech text-xs tracking-widest" style={{ animationDuration: "32s" }}>
            {[...MARKET_TICKER, ...MARKET_TICKER].map((m, i) => (
              <span key={i} className="flex items-center gap-2">
                <span className="text-white/70">{m.label}</span>
                <span style={{ color: m.up ? "oklch(0.78 0.19 150)" : "oklch(0.68 0.22 25)" }}>
                  {m.up ? "▲" : "▼"} {m.value}
                </span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Lead + rail */}
      <section id="topo" className="mx-auto max-w-7xl px-6 py-16 cv-auto">
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="group relative block overflow-hidden rounded-sm border p-8 backdrop-blur transition duration-300 hover:-translate-y-1 sm:p-12"
            style={{
              borderColor: withAlpha(BEAT_META[featured.beat].color, 0.5),
              background: `linear-gradient(135deg, ${withAlpha(BEAT_META[featured.beat].color, 0.1)}, transparent 60%)`,
            }}
          >
            <div className="flex items-center gap-3 font-mono-tech text-[11px] uppercase tracking-widest" style={{ color: BEAT_META[featured.beat].color }}>
              <featured.icon className="h-4 w-4" />
              {BEAT_META[featured.beat].label}
              <span className="text-muted-foreground">· {featured.desk} · {formatAgo(featured.minutesAgo)}</span>
            </div>
            <h2 className="mt-5 max-w-3xl font-display text-3xl sm:text-4xl md:text-5xl" style={{ letterSpacing: "-0.03em", lineHeight: "1.05" }}>
              {featured.headline}
            </h2>
            <p className="mt-4 max-w-2xl text-[15px] leading-[1.65] text-muted-foreground">{featured.excerpt}</p>
          </a>

          <div className="flex flex-col gap-px overflow-hidden rounded-sm border border-border/60 bg-border/60">
            <div className="bg-surface/80 px-5 py-3 font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground">
              Mais lidas agora
            </div>
            {rail.map((a, i) => (
              <a
                key={a.id}
                href="#"
                onClick={(e) => e.preventDefault()}
                className="group flex items-start gap-3 bg-background/80 px-5 py-4 transition hover:bg-surface"
              >
                <span className="font-mono-tech text-[13px] font-bold" style={{ color: BEAT_META[a.beat].color }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex-1">
                  <span className="block text-[13.5px] leading-[1.4] text-foreground/90 transition group-hover:text-foreground">{a.headline}</span>
                  <span className="mt-1 block font-mono-tech text-[9.5px] uppercase tracking-widest text-muted-foreground">{formatAgo(a.minutesAgo)}</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Sections by beat */}
      {BEAT_ORDER.map((beat) => {
        const items = ARTICLES.filter((a) => a.beat === beat);
        const meta = BEAT_META[beat];
        return (
          <section key={beat} id={`beat-${beat}`} className="border-t border-border/40 py-16 cv-auto">
            <div className="mx-auto max-w-7xl px-6">
              <div className="mb-8 flex items-center gap-3 font-mono-tech text-[11px] uppercase tracking-widest" style={{ color: meta.color }}>
                <span className="h-px w-8" style={{ background: meta.color }} />
                {meta.label}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {items.map((a) => (
                  <a
                    key={a.id}
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className="group relative flex flex-col gap-3 overflow-hidden rounded-sm border border-border/60 bg-surface/70 p-6 backdrop-blur transition duration-300 hover:-translate-y-1"
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = meta.color)}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "")}
                  >
                    <div className="flex items-center justify-between font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground">
                      <span className="flex items-center gap-1.5" style={{ color: meta.color }}>
                        <a.icon className="h-3.5 w-3.5" />
                        {a.desk}
                      </span>
                      <span>{formatAgo(a.minutesAgo)}</span>
                    </div>
                    <h3 className="font-display text-xl text-foreground" style={{ letterSpacing: "-0.02em", lineHeight: "1.15" }}>
                      {a.headline}
                    </h3>
                    <p className="text-[13px] leading-[1.55] text-muted-foreground">{a.excerpt}</p>
                  </a>
                ))}
              </div>
            </div>
          </section>
        );
      })}

      {/* Global desk */}
      <section className="border-t border-border/40 bg-surface/40 py-20 cv-auto">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-10 flex items-center gap-3 font-mono-tech text-[11px] uppercase tracking-widest text-neon-green">
            <span className="h-px w-8 bg-neon-green" />
            Redação global
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {DESKS.map((d) => (
              <div key={d.city} className="group rounded-sm border border-border/60 bg-background/60 p-6 backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:border-neon-cyan/50 hover:shadow-glow-cyan">
                <Globe2 className="h-5 w-5 text-neon-cyan transition-transform group-hover:scale-110" />
                <h3 className="mt-4 font-display text-lg" style={{ letterSpacing: "-0.02em" }}>{d.city}</h3>
                <p className="mt-2 text-[13px] leading-[1.55] text-muted-foreground">{d.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
