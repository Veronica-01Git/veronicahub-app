import { Aperture, Layers3, Move3d, Palette, ScanLine } from "lucide-react";

const TOKENS = [
  { name: "BACKGROUND", value: "#07090B", css: "var(--background)", role: "Base dark" },
  { name: "SURFACE", value: "#0D1114", css: "var(--surface)", role: "Elevated layer" },
  { name: "NEON GREEN", value: "#2EE6A6", css: "var(--neon-green)", role: "Primary signal" },
  { name: "NEON CYAN", value: "#5AD7FF", css: "var(--neon-cyan)", role: "Secondary intelligence" },
  { name: "FOREGROUND", value: "#EDF7F3", css: "var(--foreground)", role: "Primary reading" },
  { name: "MUTED", value: "#7C8A90", css: "var(--muted-foreground)", role: "Telemetry / support" },
] as const;

const RULES = [
  ["DARK-FIRST", "Escuridão serve à legibilidade e à sensação de profundidade; nunca deve virar ruído cyberpunk."],
  ["SIGNAL OVER GLOW", "Verde e ciano marcam estado, prioridade e inteligência. Glow é consequência, não decoração."],
  ["SPACE IS STATUS", "Áreas vazias aumentam hierarquia. Interfaces importantes respiram antes de tentar impressionar."],
  ["PRECISION EDGES", "Bordas finas, poucos raios e estruturas técnicas discretas constroem assinatura sem parecer template SaaS."],
  ["HUMAN + SYSTEM", "Quando Verônica aparece humanizada, o sistema recua visualmente para que presença e contexto coexistam."],
  ["MOTION WITH PURPOSE", "Toda animação deve explicar estado, relação, direção ou continuidade. Movimento sem função é removido."],
] as const;

const EXPRESSIONS = [
  { product: "HUB", contrast: "Medium", energy: "Warm / guided", imagery: "Humanized Veronica + learning environments" },
  { product: "WIRE", contrast: "High", energy: "Editorial / sober", imagery: "Evidence, places, systems, documentary texture" },
  { product: "STUDIO", contrast: "High", energy: "Creative / dimensional", imagery: "Generative media, composition, motion" },
  { product: "ANALYTICS", contrast: "Medium", energy: "Data / precise", imagery: "Metrics, market maps, comparison systems" },
] as const;

export function VisualSystemModule() {
  return (
    <div className="flex flex-col gap-8" data-universe-element="visual-system">
      <header className="border-b border-border/40 pb-6">
        <div className="font-mono-tech text-[10px] tracking-[0.18em] text-neon-green uppercase">MODULE 04 / VISUAL GRAMMAR</div>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">Visual System</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          A gramática ótica que mantém o ecossistema reconhecível sem transformar todos os produtos na mesma interface.
        </p>
      </header>

      <section className="rounded-sm border border-border/50 bg-surface/20 p-5 sm:p-7">
        <div className="flex items-center gap-2 border-b border-border/40 pb-4">
          <Palette className="h-4 w-4 text-neon-green" />
          <h2 className="font-mono-tech text-xs tracking-widest text-foreground uppercase">CANONICAL COLOR TOKENS</h2>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {TOKENS.map((token) => (
            <article key={token.name} className="overflow-hidden rounded-sm border border-border/35 bg-background/45">
              <div className="h-20 border-b border-border/30" style={{ background: token.css }} />
              <div className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-mono-tech text-xs text-foreground">{token.name}</h3>
                  <span className="font-mono-tech text-[9px] text-muted-foreground">{token.value}</span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{token.role}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-sm border border-border/50 bg-surface/20 p-5 sm:p-6">
          <div className="flex items-center gap-2 border-b border-border/40 pb-4">
            <Aperture className="h-4 w-4 text-neon-cyan" />
            <h2 className="font-mono-tech text-xs tracking-widest text-foreground uppercase">OPTICAL RULES</h2>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {RULES.map(([title, text], index) => (
              <article key={title} className="rounded-sm border border-border/30 bg-background/40 p-4">
                <div className="font-mono-tech text-[9px] text-neon-green">V-{String(index + 1).padStart(2, "0")}</div>
                <h3 className="mt-1 font-mono-tech text-[11px] font-semibold tracking-wider text-foreground">{title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{text}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-sm border border-border/50 bg-surface/20 p-5 sm:p-6">
          <div className="flex items-center gap-2 border-b border-border/40 pb-4">
            <Layers3 className="h-4 w-4 text-neon-green" />
            <h2 className="font-mono-tech text-xs tracking-widest text-foreground uppercase">TYPOGRAPHIC HIERARCHY</h2>
          </div>
          <div className="mt-5 space-y-5">
            <div>
              <div className="font-mono-tech text-[9px] text-muted-foreground">DISPLAY / BRAND MOMENTS</div>
              <div className="mt-1 font-display text-4xl font-bold tracking-tight text-foreground">Veronica Universe</div>
            </div>
            <div>
              <div className="font-mono-tech text-[9px] text-muted-foreground">SANS / READING & EXPLANATION</div>
              <p className="mt-1 text-sm leading-relaxed text-foreground/85">Clareza longa, confortável e humana para ensinar, explicar e contextualizar.</p>
            </div>
            <div>
              <div className="font-mono-tech text-[9px] text-muted-foreground">MONO / SYSTEM SIGNAL</div>
              <div className="mt-1 font-mono-tech text-xs tracking-widest text-neon-green">SYSTEM / ACTIVE / VERIFIED</div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-sm border border-border/50 bg-surface/20 p-5 sm:p-7">
        <div className="flex items-center gap-2 border-b border-border/40 pb-4">
          <ScanLine className="h-4 w-4 text-neon-cyan" />
          <h2 className="font-mono-tech text-xs tracking-widest text-foreground uppercase">PRODUCT EXPRESSION MATRIX</h2>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-xs">
            <thead className="font-mono-tech text-[10px] tracking-widest text-muted-foreground">
              <tr className="border-b border-border/40"><th className="px-3 py-3">PRODUCT</th><th className="px-3 py-3">CONTRAST</th><th className="px-3 py-3">ENERGY</th><th className="px-3 py-3">IMAGERY</th></tr>
            </thead>
            <tbody className="divide-y divide-border/25">
              {EXPRESSIONS.map((item) => (
                <tr key={item.product}><td className="px-3 py-3 font-mono-tech text-neon-green">{item.product}</td><td className="px-3 py-3 text-foreground/85">{item.contrast}</td><td className="px-3 py-3 text-foreground/85">{item.energy}</td><td className="px-3 py-3 text-muted-foreground">{item.imagery}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[{ icon: Move3d, title: "MOTION", text: "Entrada sutil, transição espacial, feedback imediato. GSAP apenas onde explica estado ou relação." },{ icon: Aperture, title: "IMAGE", text: "Alta fidelidade, luz controlada, direção editorial e textura real. Evitar aparência stock ou sci-fi genérica." },{ icon: ScanLine, title: "INTERFACE", text: "Estrutura técnica discreta, dados legíveis, controles claros e densidade proporcional ao contexto." }].map(({ icon: Icon, title, text }) => (
          <article key={title} className="rounded-sm border border-border/40 bg-background/40 p-4"><Icon className="h-4 w-4 text-neon-green" /><h3 className="mt-3 font-mono-tech text-xs text-foreground">{title}</h3><p className="mt-2 text-xs leading-relaxed text-muted-foreground">{text}</p></article>
        ))}
      </section>
    </div>
  );
}
