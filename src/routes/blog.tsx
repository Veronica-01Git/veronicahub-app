import { createFileRoute, Link } from "@tanstack/react-router";
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
  ArrowRight,
} from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";

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
        content: "O jornal digital da Veronica Hub sobre o que está movendo IA, economia e geopolítica.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

type Beat = "ia" | "clima" | "economia" | "geopolitica" | "mercado";

const BEAT_META: Record<Beat, { label: string; short: string; color: string }> = {
  ia: { label: "Inteligência Artificial", short: "IA", color: "oklch(0.58 0.17 155)" },
  clima: { label: "Clima Futuro · Energia Limpa", short: "Clima", color: "oklch(0.55 0.13 220)" },
  economia: { label: "Economia · Yuan Digital", short: "Economia", color: "oklch(0.62 0.15 85)" },
  geopolitica: { label: "Geopolítica · China, EUA e Brasil", short: "Geopolítica", color: "oklch(0.58 0.19 25)" },
  mercado: { label: "Mercado Tecnológico Global", short: "Mercado", color: "oklch(0.56 0.16 290)" },
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
  { id: "3", beat: "ia", icon: Scale, headline: "Debate sobre regulação de IA generativa avança em múltiplos países", excerpt: "EUA, União Europeia e China discutem regras de transparência e rotulagem de conteúdo gerado por IA em ritmos diferentes.", desk: "Desk de Políticas", minutesAgo: 58 },
  { id: "4", beat: "ia", icon: FlaskConical, headline: "Novos benchmarks tentam medir raciocínio de forma mais rigorosa", excerpt: "Pesquisadores propõem testes que vão além de tarefas memorizáveis, buscando avaliar generalização real.", desk: "Desk de Pesquisa", minutesAgo: 95 },
  { id: "5", beat: "ia", icon: AudioLines, headline: "Síntese de voz atinge naturalidade quase indistinguível em testes cegos", excerpt: "Avanços em prosódia e entonação tornam vozes sintéticas cada vez mais próximas da fala humana.", desk: "Desk de Áudio", minutesAgo: 168 },
  { id: "6", beat: "clima", icon: Cloud, headline: "IA acelera precisão de modelos climáticos de longo prazo", excerpt: "Redes neurais passam a complementar simulações físicas tradicionais, refinando projeções para as próximas décadas.", desk: "Desk de Clima", minutesAgo: 40 },
  { id: "7", beat: "clima", icon: Leaf, headline: "Investimento global em energia limpa cresce apesar da instabilidade macro", excerpt: "Solar, eólica e baterias atraem capital recorde, com China e EUA na liderança da fabricação e do consumo.", desk: "Desk de Energia", minutesAgo: 130 },
  { id: "8", beat: "economia", icon: Landmark, headline: "Yuan digital avança em testes de pagamentos transfronteiriços", excerpt: "Projetos-piloto ampliam o uso da moeda digital chinesa em transações internacionais, pressionando o Fed e outros bancos centrais a acelerar seus próprios estudos.", desk: "Desk de Economia", minutesAgo: 22 },
  { id: "9", beat: "economia", icon: CircleDollarSign, headline: "Moedas digitais de bancos centrais ganham tração global", excerpt: "Mais países avançam de fase experimental para testes-piloto de suas próprias moedas digitais soberanas.", desk: "Desk de Economia", minutesAgo: 150 },
  { id: "10", beat: "geopolitica", icon: Handshake, headline: "Comércio entre China e Brasil se intensifica em tecnologia e agronegócio", excerpt: "Novos acordos ampliam a troca bilateral, com foco crescente em infraestrutura digital e cadeias produtivas.", desk: "Desk de Geopolítica", minutesAgo: 65 },
  { id: "11", beat: "geopolitica", icon: Globe2, headline: "EUA, China e Brasil disputam espaço na corrida por chips de IA", excerpt: "Restrições de exportação, subsídios domésticos e novas fábricas redesenham o mapa global de semicondutores.", desk: "Desk de Geopolítica", minutesAgo: 190 },
  { id: "12", beat: "mercado", icon: TrendingUp, headline: "Mercado de tecnologia passa por realinhamento global de investimentos", excerpt: "Capital se desloca entre setores à medida que a infraestrutura de IA se torna prioridade estratégica nos EUA, na China e na Europa.", desk: "Desk de Mercado", minutesAgo: 48 },
  { id: "13", beat: "mercado", icon: Building2, headline: "Big techs redirecionam capital para infraestrutura de IA", excerpt: "Orçamentos de capital priorizam data centers e chips especializados em detrimento de outras linhas de produto.", desk: "Desk de Mercado", minutesAgo: 112 },
];

const TICKER = [
  "Vídeo por IA aproxima-se do padrão cinematográfico",
  "Yuan digital avança em pagamentos transfronteiriços",
  "China e Brasil ampliam comércio em tecnologia e agro",
  "Custo de inferência de LLMs cai pelo 6º mês seguido",
  "Investimento global em energia limpa cresce apesar da instabilidade macro",
  "EUA, China e Brasil disputam espaço na corrida por chips de IA",
  "Big techs redirecionam capital para infraestrutura de IA",
];

const MARKET_TICKER: { label: string; value: string; up: boolean }[] = [
  { label: "IA-INDEX", value: "+2,4%", up: true },
  { label: "YUAN DIGITAL", value: "¥7,02", up: false },
  { label: "CHIPS-IA", value: "+1,8%", up: true },
  { label: "ENERGIA-LIMPA", value: "+2,1%", up: true },
  { label: "BRICS-TECH", value: "+0,6%", up: true },
  { label: "CARBON-AI", value: "-0,3%", up: false },
  { label: "CLOUD-CAPEX", value: "+3,1%", up: true },
  { label: "BRASIL-CHINA-EUA COMÉRCIO", value: "+1,2%", up: true },
];

const DESKS = [
  { city: "São Paulo", note: "Cobertura de adoção de IA generativa e comércio China-Brasil na América Latina." },
  { city: "San Francisco", note: "Acompanhamento contínuo dos laboratórios de ponta e da política tecnológica dos EUA." },
  { city: "Pequim", note: "Monitoramento do yuan digital e do ecossistema asiático de modelos abertos." },
  { city: "Londres", note: "Análise de políticas regulatórias e mercado de energia limpa europeu." },
];

const TAGS = [
  "#IA-generativa", "#LLM", "#yuan-digital", "#BRICS", "#energia-limpa",
  "#chips", "#Brasil-China", "#EUA-tech", "#infraestrutura", "#regulação",
  "#vídeo-IA", "#mercado",
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

// Placeholder de imagem — nenhuma matéria tem foto real ainda, então o
// bloco é rotulado como tal em vez de fingir ser uma imagem de verdade.
function Thumb({ color, label, className = "" }: { color: string; label?: string; className?: string }) {
  return (
    <div
      aria-hidden
      className={`relative overflow-hidden rounded-sm border border-border/40 ${className}`}
      style={{ background: `linear-gradient(135deg, ${withAlpha(color, 0.28)}, ${withAlpha(color, 0.06)})` }}
    >
      {label && (
        <span className="absolute bottom-2 left-2 font-mono-tech text-[8.5px] uppercase tracking-widest text-muted-foreground/70">
          {label}
        </span>
      )}
    </div>
  );
}

function VeronicaWire() {
  const now = useLiveClock();
  const featured = ARTICLES.find((a) => a.featured) ?? ARTICLES[0];
  const rail = ARTICLES.filter((a) => a.id !== featured.id).slice(0, 5);

  return (
    <div className="home-hybrid min-h-screen overflow-x-hidden bg-background text-foreground">
      <SiteHeader />

      {/* Faixa "ao vivo" — mesma linguagem de wire service que dá nome à página */}
      <div className="border-b border-border/40 bg-foreground text-background">
        <div className="mx-auto flex h-9 max-w-7xl items-center gap-3 px-6">
          <span className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-sm bg-destructive px-2 py-0.5 font-mono-tech text-[10px] uppercase tracking-widest text-white">
            <Radio className="h-3 w-3 animate-pulse-dot" /> Ao vivo
          </span>
          <div className="flex-1 overflow-hidden" style={{ maskImage: "linear-gradient(90deg, transparent, black 5%, black 92%, transparent)" }}>
            <div className="flex animate-marquee gap-8 whitespace-nowrap font-mono-tech text-[11px] text-background/75">
              {[...TICKER, ...TICKER].map((h, i) => (
                <span key={i} className="flex items-center gap-8">
                  <span className="text-neon-green">●</span>
                  {h}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Masthead */}
      <header className="border-b border-border/50 bg-background/95">
        <div className="mx-auto max-w-7xl px-6 py-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-display text-3xl text-foreground" style={{ letterSpacing: "-0.02em", lineHeight: 1 }}>
                VERONICA <span className="text-neon-green">WIRE</span>
              </div>
              <div className="mt-1 font-mono-tech text-[9px] uppercase tracking-[0.28em] text-muted-foreground">
                Cobertura contínua e global
              </div>
            </div>
            <div className="text-right font-mono-tech text-[11px] text-muted-foreground">
              {now ? now.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase() : "—"}
              <br />
              {now ? now.toLocaleTimeString("pt-BR") : "—"} BRT
            </div>
          </div>
          <nav className="mt-4 flex gap-1 overflow-x-auto border-t border-border/40 pt-3 text-[13px] font-medium">
            <a href="#topo" className="whitespace-nowrap rounded-sm px-3 py-1.5 text-foreground transition hover:text-neon-green">
              Início
            </a>
            {BEAT_ORDER.map((b) => (
              <a
                key={b}
                href={`#beat-${b}`}
                className="whitespace-nowrap rounded-sm px-3 py-1.5 text-muted-foreground transition hover:text-foreground"
              >
                {BEAT_META[b].short}
              </a>
            ))}
            <Link to="/comandos" className="whitespace-nowrap rounded-sm px-3 py-1.5 text-muted-foreground transition hover:text-foreground">
              Comandos
            </Link>
            <Link to="/" className="ml-auto whitespace-nowrap rounded-sm px-3 py-1.5 font-medium text-neon-green">
              Hub ▸
            </Link>
          </nav>
        </div>
      </header>

      {/* Índices — tira de dados estilo terminal financeiro */}
      <div className="overflow-hidden border-b border-border/40 bg-surface/60" style={{ maskImage: "linear-gradient(90deg, transparent, black 3%, black 94%, transparent)" }}>
        <div className="flex animate-marquee gap-8 whitespace-nowrap py-2.5 font-mono-tech text-[11px]" style={{ animationDuration: "34s" }}>
          {[...MARKET_TICKER, ...MARKET_TICKER].map((m, i) => (
            <span key={i} className="flex items-center gap-2">
              <span className="text-muted-foreground">{m.label}</span>
              <span className={m.up ? "text-neon-green" : "text-destructive"}>
                {m.up ? "▲" : "▼"} {m.value}
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* Lead + mais lidas */}
      <section id="topo" className="mx-auto max-w-7xl px-6 py-14 cv-auto">
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="group block overflow-hidden rounded-sm border border-border/60 bg-surface/40 backdrop-blur transition hover:-translate-y-0.5 hover:border-neon-green/50"
          >
            <Thumb color={BEAT_META[featured.beat].color} label="Imagem 1600×900" className="aspect-video" />
            <div className="p-6 sm:p-8">
              <div className="flex items-center gap-2.5 font-mono-tech text-[11px] uppercase tracking-widest" style={{ color: BEAT_META[featured.beat].color }}>
                <featured.icon className="h-4 w-4" />
                {BEAT_META[featured.beat].label}
              </div>
              <h1 className="mt-4 max-w-2xl font-display text-3xl text-foreground sm:text-4xl md:text-[42px]" style={{ letterSpacing: "-0.025em", lineHeight: 1.08 }}>
                {featured.headline}
              </h1>
              <p className="mt-3 max-w-xl text-[15px] leading-[1.6] text-muted-foreground">{featured.excerpt}</p>
              <div className="mt-4 font-mono-tech text-[10.5px] uppercase tracking-widest text-muted-foreground">
                {featured.desk} · {formatAgo(featured.minutesAgo)}
              </div>
            </div>
          </a>

          <div className="flex flex-col overflow-hidden rounded-sm border border-border/60">
            <div className="border-b border-border/60 bg-surface/70 px-5 py-3 font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground">
              Mais lidas agora
            </div>
            {rail.map((a, i) => (
              <a
                key={a.id}
                href="#"
                onClick={(e) => e.preventDefault()}
                className="group flex items-start gap-3 border-b border-border/40 bg-background px-5 py-4 transition last:border-0 hover:bg-surface/60"
              >
                <span className="font-mono-tech text-[15px] font-bold" style={{ color: BEAT_META[a.beat].color }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex-1">
                  <span className="block text-[13.5px] leading-[1.4] text-foreground transition group-hover:text-neon-green">
                    {a.headline}
                  </span>
                  <span className="mt-1 block font-mono-tech text-[9.5px] uppercase tracking-widest text-muted-foreground">
                    {formatAgo(a.minutesAgo)}
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Fique por dentro — newsletter + editorias */}
      <section className="mx-auto max-w-7xl px-6 pb-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-sm border border-neon-green/30 bg-neon-green/5 p-6">
            <h3 className="font-display text-lg text-foreground" style={{ letterSpacing: "-0.01em" }}>
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
            <h3 className="font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground">Editorias</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {TAGS.map((t) => (
                <span key={t} className="rounded-sm border border-border/60 px-2.5 py-1 font-mono-tech text-[10.5px] text-muted-foreground">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Seções por editoria */}
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
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((a) => (
                  <a
                    key={a.id}
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className="group flex flex-col overflow-hidden rounded-sm border border-border/60 bg-surface/30 backdrop-blur transition duration-300 hover:-translate-y-1"
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = meta.color)}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "")}
                  >
                    <Thumb color={meta.color} label="Imagem 800×500" className="aspect-[16/10]" />
                    <div className="flex flex-1 flex-col gap-3 p-6">
                      <div className="flex items-center justify-between font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground">
                        <span className="flex items-center gap-1.5" style={{ color: meta.color }}>
                          <a.icon className="h-3.5 w-3.5" />
                          {a.desk}
                        </span>
                        <span>{formatAgo(a.minutesAgo)}</span>
                      </div>
                      <h3 className="font-display text-xl text-foreground" style={{ letterSpacing: "-0.02em", lineHeight: 1.15 }}>
                        {a.headline}
                      </h3>
                      <p className="text-[13px] leading-[1.55] text-muted-foreground">{a.excerpt}</p>
                    </div>
                  </a>
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
              <div key={d.city} className="group rounded-sm border border-border/60 bg-background p-6 backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:border-neon-cyan/50">
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
            <h2 className="font-display text-2xl text-foreground sm:text-3xl" style={{ letterSpacing: "-0.02em" }}>
              Leu a notícia. Agora execute.
            </h2>
            <p className="mt-2 max-w-xl text-[15px] leading-[1.6] text-muted-foreground">
              11 comandos práticos no Veronica Hub — do dark content à IA generativa. Acesso vitalício a partir de R$ 19,90.
            </p>
          </div>
          <Link
            to="/"
            className="group inline-flex flex-shrink-0 items-center gap-2 rounded-sm bg-neon-green px-6 py-3.5 font-mono-tech text-xs uppercase tracking-[0.18em] text-primary-foreground shadow-glow-green transition duration-200 hover:-translate-y-0.5 hover:brightness-110"
          >
            Entrar no Hub <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
