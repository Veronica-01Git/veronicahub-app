import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Radio, Globe2, Cpu, Scale, TrendingUp, FlaskConical, Copyright, Workflow, AudioLines } from "lucide-react";
import cyborgAsset from "@/assets/veronica-cyborg-v2.jpg.asset.json";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";

export const Route = createFileRoute("/blog")({
  component: VeronicaWire,
  head: () => ({
    meta: [
      { title: "Veronica Wire — Cobertura contínua de IA | Veronica Hub" },
      {
        name: "description",
        content: "Veronica Wire: cobertura contínua sobre inteligência artificial — modelos, infraestrutura, regulação, mercado e pesquisa.",
      },
      { property: "og:title", content: "Veronica Wire — Cobertura contínua de IA" },
      { property: "og:description", content: "O jornal digital da Veronica Hub sobre o que está movendo o mundo da IA." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "preload", as: "image", href: cyborgAsset.url, fetchpriority: "high" }],
  }),
});

type Article = {
  id: string;
  category: string;
  icon: typeof Cpu;
  headline: string;
  excerpt: string;
  desk: string;
  minutesAgo: number;
  featured?: boolean;
};

const ARTICLES: Article[] = [
  {
    id: "1",
    category: "Modelos",
    icon: Cpu,
    headline: "Modelos de vídeo por IA se aproximam da qualidade cinematográfica",
    excerpt: "Motores de geração de vídeo elevam a barra de realismo, acelerando a adoção em produções independentes e conteúdo publicitário.",
    desk: "Desk de Modelos",
    minutesAgo: 12,
    featured: true,
  },
  {
    id: "2",
    category: "Infraestrutura",
    icon: Workflow,
    headline: "Custo de inferência de LLMs segue em queda acelerada",
    excerpt: "Otimizações de hardware e arquitetura reduzem o custo por token, ampliando o acesso a aplicações de IA em tempo real.",
    desk: "Desk de Infraestrutura",
    minutesAgo: 34,
  },
  {
    id: "3",
    category: "Regulação",
    icon: Scale,
    headline: "Debate sobre regulação de IA generativa avança em múltiplos países",
    excerpt: "Governos discutem regras de transparência e rotulagem de conteúdo gerado por IA em ritmos diferentes.",
    desk: "Desk de Políticas",
    minutesAgo: 58,
  },
  {
    id: "4",
    category: "Mercado",
    icon: TrendingUp,
    headline: "Investimento em chips de IA segue aquecido",
    excerpt: "Fabricantes anunciam novas rodadas de capacidade, de olho na demanda por treinamento e inferência em escala.",
    desk: "Desk de Mercado",
    minutesAgo: 71,
  },
  {
    id: "5",
    category: "Pesquisa",
    icon: FlaskConical,
    headline: "Novos benchmarks tentam medir raciocínio de forma mais rigorosa",
    excerpt: "Pesquisadores propõem testes que vão além de tarefas memorizáveis, buscando avaliar generalização real.",
    desk: "Desk de Pesquisa",
    minutesAgo: 95,
  },
  {
    id: "6",
    category: "Direito Autoral",
    icon: Copyright,
    headline: "Geração de vídeo por IA reacende discussão sobre direitos autorais",
    excerpt: "Estúdios e criadores independentes buscam clareza sobre uso de material protegido no treinamento de modelos.",
    desk: "Desk Jurídico",
    minutesAgo: 120,
  },
  {
    id: "7",
    category: "Produto",
    icon: Workflow,
    headline: "Agentes autônomos de IA ganham espaço em empresas de médio porte",
    excerpt: "Ferramentas de automação orientadas por IA passam a assumir tarefas operacionais antes feitas manualmente.",
    desk: "Desk de Produto",
    minutesAgo: 142,
  },
  {
    id: "8",
    category: "Voz & Áudio",
    icon: AudioLines,
    headline: "Síntese de voz atinge naturalidade quase indistinguível em testes cegos",
    excerpt: "Avanços em prosódia e entonação tornam vozes sintéticas cada vez mais próximas da fala humana.",
    desk: "Desk de Áudio",
    minutesAgo: 168,
  },
];

const TICKER = [
  "Vídeo por IA aproxima-se do padrão cinematográfico",
  "Custo de inferência de LLMs cai pelo 6º mês seguido",
  "Regulação de IA generativa avança na Europa e na Ásia",
  "Chips de IA: novo ciclo de investimento em capacidade",
  "Benchmarks de raciocínio ganham escrutínio da comunidade",
  "Vozes sintéticas passam em testes cegos de naturalidade",
];

const DESKS = [
  { city: "São Paulo", note: "Cobertura de adoção de IA generativa na América Latina." },
  { city: "San Francisco", note: "Acompanhamento contínuo dos laboratórios de ponta." },
  { city: "Pequim", note: "Monitoramento do ecossistema asiático de modelos abertos." },
  { city: "Londres", note: "Análise de políticas regulatórias europeias." },
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

function VeronicaWire() {
  const now = useLiveClock();
  const featured = ARTICLES.find((a) => a.featured) ?? ARTICLES[0];
  const rest = ARTICLES.filter((a) => a.id !== featured.id);

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
        <div className="relative mx-auto max-w-7xl px-6 py-14">
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
            Cobertura contínua sobre inteligência artificial — modelos, infraestrutura, regulação, mercado e pesquisa.
          </p>
          <span className="mt-5 inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/50 px-3 py-1 font-mono-tech text-[9px] uppercase tracking-widest text-muted-foreground backdrop-blur">
            Edição de demonstração · feed ao vivo em breve
          </span>
        </div>

        {/* Ticker */}
        <div className="relative overflow-hidden border-t border-border/40 bg-surface/60 py-3">
          <div className="flex animate-marquee gap-10 whitespace-nowrap font-mono-tech text-xs uppercase tracking-widest text-muted-foreground">
            {[...TICKER, ...TICKER].map((headline, i) => (
              <span key={i} className="flex items-center gap-10">
                <span className="text-neon-green">●</span>
                <span className="text-foreground/90">{headline}</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Featured + grid */}
      <section className="mx-auto max-w-7xl px-6 py-20 cv-auto">
        <a
          href="#"
          onClick={(e) => e.preventDefault()}
          className="group relative block overflow-hidden rounded-sm border border-neon-green/50 bg-gradient-to-br from-neon-green/10 via-surface/70 to-surface p-8 backdrop-blur transition duration-300 hover:-translate-y-1 hover:shadow-glow-green sm:p-12"
        >
          <div className="flex items-center gap-3 font-mono-tech text-[11px] uppercase tracking-widest text-neon-green">
            <featured.icon className="h-4 w-4" />
            {featured.category}
            <span className="text-muted-foreground">· {featured.desk} · {formatAgo(featured.minutesAgo)}</span>
          </div>
          <h2
            className="mt-5 max-w-3xl font-display text-3xl sm:text-4xl md:text-5xl"
            style={{ letterSpacing: "-0.03em", lineHeight: "1.05" }}
          >
            {featured.headline}
          </h2>
          <p className="mt-4 max-w-2xl text-[15px] leading-[1.65] text-muted-foreground">{featured.excerpt}</p>
        </a>

        <div className="mt-14 mb-8 flex items-center gap-3 font-mono-tech text-[11px] uppercase tracking-widest text-neon-cyan">
          <span className="h-px w-8 bg-neon-cyan" />
          Últimas
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((a) => (
            <a
              key={a.id}
              href="#"
              onClick={(e) => e.preventDefault()}
              className="group relative flex flex-col gap-3 overflow-hidden rounded-sm border border-border/60 bg-surface/70 p-6 backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-neon-green/60 hover:shadow-glow-green"
            >
              <div className="flex items-center justify-between font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground">
                <span className="flex items-center gap-1.5 text-neon-cyan">
                  <a.icon className="h-3.5 w-3.5" />
                  {a.category}
                </span>
                <span>{formatAgo(a.minutesAgo)}</span>
              </div>
              <h3 className="font-display text-xl text-foreground" style={{ letterSpacing: "-0.02em", lineHeight: "1.15" }}>
                {a.headline}
              </h3>
              <p className="text-[13px] leading-[1.55] text-muted-foreground">{a.excerpt}</p>
              <span className="mt-auto font-mono-tech text-[9.5px] uppercase tracking-widest text-muted-foreground/70">{a.desk}</span>
              <div className="pointer-events-none absolute right-3 bottom-3 h-4 w-4 border-r border-b border-neon-green/0 transition group-hover:border-neon-green/80" />
            </a>
          ))}
        </div>
      </section>

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
