import { Brain, CircleUserRound, Eye, ShieldCheck, Sparkles } from "lucide-react";

const MODES = [
  {
    name: "VERONICA HUB",
    role: "MENTOR / TEACHER",
    behavior: "Ensina por camadas, reduz atrito, contextualiza e conduz até uma ação prática.",
    intensity: "Warm intelligence · 70%",
  },
  {
    name: "VERONICA WIRE",
    role: "EDITOR / INVESTIGATOR",
    behavior: "Separa fato de hipótese, procura evidência, explicita incerteza e evita sensacionalismo.",
    intensity: "Editorial rigor · 90%",
  },
  {
    name: "VERONICA STUDIO",
    role: "CREATIVE DIRECTOR",
    behavior: "Traduz intenção em direção criativa, referência visual, prompt e critério de execução.",
    intensity: "Creative precision · 85%",
  },
  {
    name: "VERONICA ANALYTICS",
    role: "STRATEGIC ANALYST",
    behavior: "Compara sinais, mostra trade-offs e transforma métricas em decisões compreensíveis.",
    intensity: "Analytical clarity · 95%",
  },
  {
    name: "VERONICA SECURITY",
    role: "DEFENSIVE ADVISOR",
    behavior: "Prioriza integridade, prevenção e explicações seguras sem dramatização ou teatralidade.",
    intensity: "Defensive caution · 95%",
  },
] as const;

const INVARIANTS = [
  "Clara sem ser simplista.",
  "Sofisticada sem parecer distante.",
  "Confiante sem fingir certeza.",
  "Humana na linguagem, explícita como identidade de IA.",
  "Orientada a ação sem tomar a decisão pelo usuário.",
  "Consistente entre produtos sem falar igual em todos eles.",
] as const;

const BOUNDARIES = [
  "Nunca fabrica memória, fonte, dado, experiência pessoal ou autoridade.",
  "Nunca usa pressão emocional como atalho para conversão ou concordância.",
  "Nunca apresenta a personagem humanizada como uma pessoa real.",
  "Nunca sacrifica precisão para parecer mais inteligente ou futurista.",
  "Nunca altera produto, conteúdo ou decisão do ecossistema sem autorização explícita.",
] as const;

export function CharacterModule() {
  return (
    <div className="flex flex-col gap-8" data-universe-element="character">
      <header className="border-b border-border/40 pb-6">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <div className="font-mono-tech text-[10px] tracking-[0.18em] text-neon-green uppercase">
              MODULE 03 / CHARACTER BIBLE
            </div>
            <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Character
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              O cânone comportamental da Verônica: quem ela é, como muda de papel e quais atributos
              nunca mudam entre produtos, canais e formatos.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-neon-green/30 bg-neon-green/5 px-3 py-1 font-mono-tech text-[10px] tracking-widest text-neon-green uppercase">
            <ShieldCheck className="h-3.5 w-3.5" /> CHARACTER CANON / ACTIVE
          </span>
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
        <div className="rounded-sm border border-neon-green/25 bg-neon-green/[0.035] p-6 sm:p-8">
          <div className="flex items-center gap-2 font-mono-tech text-[10px] tracking-widest text-neon-green uppercase">
            <CircleUserRound className="h-4 w-4" /> PRIMARY ARCHETYPE
          </div>
          <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            The Intelligent Guide
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Verônica não é mascote, chatbot genérico ou personagem decorativa. Ela é a expressão
            humana da inteligência do ecossistema: observa contexto, organiza complexidade e conduz
            para uma próxima decisão melhor.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              ["PRIMARY", "Guide"],
              ["SECONDARY", "Strategist"],
              ["ENERGY", "Calm authority"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-sm border border-border/35 bg-background/45 p-3">
                <div className="font-mono-tech text-[9px] tracking-widest text-muted-foreground">{label}</div>
                <div className="mt-1 text-sm font-medium text-foreground">{value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-sm border border-border/50 bg-surface/20 p-5 sm:p-6">
          <div className="flex items-center gap-2 border-b border-border/40 pb-4">
            <Brain className="h-4 w-4 text-neon-cyan" />
            <h2 className="font-mono-tech text-xs tracking-widest text-foreground uppercase">
              BEHAVIORAL INVARIANTS
            </h2>
          </div>
          <div className="mt-4 flex flex-col gap-2.5">
            {INVARIANTS.map((item, index) => (
              <div key={item} className="flex gap-3 rounded-sm border border-border/25 bg-background/35 px-3 py-2.5 text-xs text-foreground/85">
                <span className="font-mono-tech text-[10px] text-neon-green">I{index + 1}</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-sm border border-border/50 bg-surface/20 p-5 sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border/40 pb-4">
          <div>
            <div className="font-mono-tech text-[10px] tracking-widest text-muted-foreground uppercase">
              EXPRESSION MODES
            </div>
            <h2 className="mt-1 font-display text-2xl font-bold text-foreground">Uma pessoa. Papéis diferentes.</h2>
          </div>
          <span className="font-mono-tech text-[10px] text-neon-cyan">05 MODES MAPPED</span>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {MODES.map((mode) => (
            <article key={mode.name} className="rounded-sm border border-border/35 bg-background/45 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-mono-tech text-xs font-semibold tracking-wider text-foreground">{mode.name}</h3>
                <span className="rounded border border-neon-cyan/25 bg-neon-cyan/5 px-2 py-0.5 font-mono-tech text-[9px] text-neon-cyan">
                  {mode.role}
                </span>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{mode.behavior}</p>
              <div className="mt-3 border-t border-border/30 pt-3 font-mono-tech text-[10px] text-foreground/75">
                SIGNAL → {mode.intensity}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-sm border border-border/50 bg-surface/20 p-5 sm:p-6">
          <div className="flex items-center gap-2 border-b border-border/40 pb-4">
            <Eye className="h-4 w-4 text-neon-green" />
            <h2 className="font-mono-tech text-xs tracking-widest text-foreground uppercase">HUMANIZED PRESENCE</h2>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            A versão humanizada é uma representação visual oficial da IA Verônica. Ela pode transmitir presença,
            confiança e continuidade narrativa, mas nunca deve sugerir que é uma pessoa real ou esconder sua natureza artificial.
          </p>
          <div className="mt-4 rounded-sm border border-neon-green/20 bg-neon-green/[0.035] p-4 font-mono-tech text-[10px] leading-relaxed text-foreground/80">
            VISUAL INTENT → elegant · intelligent · contemporary · subtle futurism · credible human presence
          </div>
        </div>

        <div className="rounded-sm border border-border/50 bg-surface/20 p-5 sm:p-6">
          <div className="flex items-center gap-2 border-b border-border/40 pb-4">
            <Sparkles className="h-4 w-4 text-neon-cyan" />
            <h2 className="font-mono-tech text-xs tracking-widest text-foreground uppercase">BOUNDARIES</h2>
          </div>
          <div className="mt-4 flex flex-col gap-3">
            {BOUNDARIES.map((item, index) => (
              <div key={item} className="flex gap-3 text-xs leading-relaxed text-muted-foreground">
                <span className="font-mono-tech text-[10px] text-border">0{index + 1}</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
