import {
  Compass,
  Fingerprint,
  ShieldCheck,
  Sparkles,
  Target,
  TriangleAlert,
} from "lucide-react";

const PRINCIPLES = [
  {
    id: "01",
    title: "CLAREZA ANTES DE COMPLEXIDADE",
    text: "A tecnologia pode ser sofisticada por dentro; a experiência precisa ser compreensível, orientada e útil por fora.",
  },
  {
    id: "02",
    title: "UTILIDADE ANTES DE ESPETÁCULO",
    text: "Impacto visual e inovação só têm valor quando aumentam entendimento, confiança ou capacidade de ação.",
  },
  {
    id: "03",
    title: "VERDADE ANTES DE NARRATIVA",
    text: "A Veronica não inventa autoridade. Evidência, contexto, limites e incerteza vêm antes de uma história conveniente.",
  },
  {
    id: "04",
    title: "AGÊNCIA HUMANA NO CENTRO",
    text: "A inteligência orienta, organiza e amplifica decisões; não transforma o usuário em passageiro do sistema.",
  },
  {
    id: "05",
    title: "COERÊNCIA ANTES DE EXPANSÃO",
    text: "Novos produtos, campanhas e experiências entram no ecossistema apenas quando fortalecem a identidade central.",
  },
  {
    id: "06",
    title: "PRECISÃO COM PRESENÇA",
    text: "A marca deve parecer avançada sem cair em ruído futurista: menos efeitos, mais intenção, ritmo e assinatura.",
  },
] as const;

const NEVER = [
  "Ser uma assistente genérica sem ponto de vista, critério ou memória de marca.",
  "Usar hype, medo ou promessa exagerada para fabricar percepção de inteligência.",
  "Trocar consistência por tendências visuais, tecnológicas ou editoriais de curto prazo.",
  "Confundir autonomia do sistema com autoridade sobre a decisão humana.",
  "Publicar, aprovar ou alterar o ecossistema automaticamente sem uma regra explícita de governança.",
] as const;

const EXPRESSIONS = [
  {
    name: "VERONICA HUB",
    role: "MENTOR / GUIDE",
    tone: "Didática, estratégica, próxima e sofisticada.",
    invariant: "Transforma complexidade em capacidade prática.",
  },
  {
    name: "VERONICA WIRE",
    role: "EDITORIAL / INVESTIGATION",
    tone: "Séria, verificável, incisiva e contextual.",
    invariant: "Investiga antes de concluir; informa sem sensacionalismo.",
  },
  {
    name: "VERONICA STUDIO",
    role: "CREATIVE INTELLIGENCE",
    tone: "Inventiva, precisa, visual e orientada a execução.",
    invariant: "Cria com intenção — não produz ruído por volume.",
  },
  {
    name: "VERONICA ANALYTICS",
    role: "MARKET INTELLIGENCE",
    tone: "Analítica, comparativa, objetiva e acionável.",
    invariant: "Métrica só importa quando melhora uma decisão.",
  },
] as const;

const DECISION_FILTERS = [
  "Isso aumenta a inteligência prática do usuário?",
  "É coerente com a identidade Veronica, mesmo sem o logotipo?",
  "A promessa pode ser sustentada por produto, evidência ou experiência real?",
  "A tecnologia está servindo a uma função — ou apenas decorando a narrativa?",
  "Se isso escalar para todo o ecossistema, a marca fica mais forte ou mais difusa?",
] as const;

export function EssenceModule() {
  return (
    <div className="flex flex-col gap-8" data-universe-element="essence">
      <header className="border-b border-border/40 pb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="font-mono-tech text-[10px] tracking-[0.18em] text-neon-green uppercase">
              MODULE 01 / CANONICAL IDENTITY ROOT
            </div>
            <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Essence
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              A camada que define o que permanece verdadeiro em toda expressão da Veronica — antes
              de produto, interface, voz, campanha ou tecnologia.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-neon-green/30 bg-neon-green/5 px-3 py-1 font-mono-tech text-[10px] tracking-widest text-neon-green uppercase">
            <ShieldCheck className="h-3.5 w-3.5" />
            CANON STATUS / ACTIVE
          </div>
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-sm border border-neon-green/25 bg-neon-green/[0.035] p-6 sm:p-8">
          <div className="flex items-center gap-2 font-mono-tech text-[10px] tracking-widest text-neon-green uppercase">
            <Fingerprint className="h-4 w-4" />
            CORE STATEMENT
          </div>
          <p className="mt-5 max-w-3xl font-display text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl">
            Veronica é uma camada de inteligência que transforma complexidade em clareza, clareza
            em decisão e decisão em capacidade real.
          </p>
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Uma identidade central, múltiplas expressões. Cada produto pode mudar de função, ritmo e
            linguagem; o critério da marca permanece o mesmo.
          </p>
        </div>

        <div className="grid gap-4">
          <div className="rounded-sm border border-border/50 bg-surface/25 p-5">
            <div className="flex items-center gap-2 font-mono-tech text-[10px] tracking-widest text-muted-foreground uppercase">
              <Target className="h-3.5 w-3.5 text-neon-cyan" /> PURPOSE
            </div>
            <p className="mt-3 text-sm leading-relaxed text-foreground/90">
              Tornar inteligência artificial e inteligência digital compreensíveis, aplicáveis e
              estrategicamente úteis para pessoas e negócios.
            </p>
          </div>

          <div className="rounded-sm border border-border/50 bg-surface/25 p-5">
            <div className="flex items-center gap-2 font-mono-tech text-[10px] tracking-widest text-muted-foreground uppercase">
              <Sparkles className="h-3.5 w-3.5 text-neon-green" /> BRAND PROMISE
            </div>
            <p className="mt-3 text-sm leading-relaxed text-foreground/90">
              Você sai com mais clareza, mais critério e mais capacidade de agir do que tinha antes
              de entrar.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-sm border border-border/50 bg-surface/20 p-5 sm:p-7">
        <div className="flex items-center justify-between gap-4 border-b border-border/40 pb-4">
          <div>
            <div className="font-mono-tech text-[10px] tracking-widest text-muted-foreground uppercase">
              OPERATING PRINCIPLES
            </div>
            <h2 className="mt-1 font-display text-2xl font-bold text-foreground">
              Seis princípios não negociáveis
            </h2>
          </div>
          <span className="font-mono-tech text-[10px] text-neon-cyan">06 / 06 CANONICAL</span>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {PRINCIPLES.map((principle) => (
            <article
              key={principle.id}
              className="rounded-sm border border-border/35 bg-background/45 p-4 transition hover:border-neon-green/30"
            >
              <div className="font-mono-tech text-[10px] tracking-widest text-neon-green">
                P-{principle.id}
              </div>
              <h3 className="mt-2 font-mono-tech text-xs font-semibold tracking-wider text-foreground">
                {principle.title}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{principle.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-sm border border-border/50 bg-surface/20 p-5 sm:p-6">
          <div className="flex items-center gap-2 border-b border-border/40 pb-4">
            <TriangleAlert className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-mono-tech text-xs tracking-widest text-foreground uppercase">
              WHAT VERONICA NEVER BECOMES
            </h2>
          </div>

          <div className="mt-4 flex flex-col gap-3">
            {NEVER.map((item, index) => (
              <div key={item} className="flex gap-3 text-xs leading-relaxed text-muted-foreground">
                <span className="font-mono-tech text-[10px] text-border">0{index + 1}</span>
                <p className="m-0">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-sm border border-border/50 bg-surface/20 p-5 sm:p-6">
          <div className="flex items-center gap-2 border-b border-border/40 pb-4">
            <Compass className="h-4 w-4 text-neon-cyan" />
            <h2 className="font-mono-tech text-xs tracking-widest text-foreground uppercase">
              DECISION FILTER / V1
            </h2>
          </div>

          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            Antes de uma nova ideia entrar no ecossistema, ela deve sobreviver a estes cinco testes.
            Nesta fase o Universe recomenda; ele não bloqueia nem altera nada automaticamente.
          </p>

          <ol className="mt-4 flex flex-col gap-2.5">
            {DECISION_FILTERS.map((filter, index) => (
              <li
                key={filter}
                className="flex gap-3 rounded-sm border border-border/30 bg-background/40 px-3 py-2.5 text-xs text-foreground/85"
              >
                <span className="font-mono-tech text-[10px] text-neon-green">Q{index + 1}</span>
                <span>{filter}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="rounded-sm border border-border/50 bg-surface/20 p-5 sm:p-7">
        <div className="border-b border-border/40 pb-4">
          <div className="font-mono-tech text-[10px] tracking-widest text-muted-foreground uppercase">
            ONE IDENTITY / MULTIPLE EXPRESSIONS
          </div>
          <h2 className="mt-1 font-display text-2xl font-bold text-foreground">
            O núcleo não muda. A expressão muda.
          </h2>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {EXPRESSIONS.map((expression) => (
            <article
              key={expression.name}
              className="rounded-sm border border-border/35 bg-background/45 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-mono-tech text-xs font-semibold tracking-wider text-foreground">
                  {expression.name}
                </h3>
                <span className="rounded border border-neon-cyan/25 bg-neon-cyan/5 px-2 py-0.5 font-mono-tech text-[9px] tracking-wider text-neon-cyan">
                  {expression.role}
                </span>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">{expression.tone}</p>
              <div className="mt-3 border-t border-border/30 pt-3 font-mono-tech text-[10px] leading-relaxed text-foreground/80">
                INVARIANT → {expression.invariant}
              </div>
            </article>
          ))}
        </div>
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border/40 py-4 font-mono-tech text-[10px] tracking-wider text-muted-foreground">
        <span>ESSENCE CANON / VERSION 1.0</span>
        <span className="text-neon-green">SOURCE OF TRUTH: ACTIVE · READ-ONLY IN PHASE 1</span>
      </footer>
    </div>
  );
}
