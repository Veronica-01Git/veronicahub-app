import { Command as CommandIcon, Radio } from "lucide-react";

interface UniverseHeroProps {
  onOpenCommand: () => void;
  onExploreEcosystem: () => void;
}

export function UniverseHero({ onOpenCommand, onExploreEcosystem }: UniverseHeroProps) {
  return (
    <section
      data-universe-element="hero"
      className="relative pt-6 pb-12 sm:pt-10 sm:pb-16"
      aria-labelledby="universe-title"
    >
      {/* Precision system context tag */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div className="flex items-center gap-2 font-mono-tech text-[10.5px] tracking-widest text-muted-foreground uppercase">
          <span className="text-foreground/90 font-medium">VERONICA</span>
          <span className="text-border/80">/</span>
          <span>INTERNAL SYSTEM</span>
          <span className="text-border/80">/</span>
          <span className="text-neon-cyan/90">KERNEL v1.1.0-PHASE2A</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-neon-green/30 bg-neon-green/5 px-2.5 py-0.5 font-mono-tech text-[10px] tracking-widest text-neon-green uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-neon-green animate-pulse" />
            UNIVERSE CORE / ACTIVE
          </div>

          <button
            type="button"
            onClick={onOpenCommand}
            className="hidden items-center gap-1.5 rounded-sm border border-border/60 bg-surface/40 px-2.5 py-1 font-mono-tech text-[10px] tracking-widest text-muted-foreground transition hover:border-border hover:text-foreground md:inline-flex"
            aria-label="Abrir Universe Command Palette"
          >
            <CommandIcon className="h-3 w-3" />
            <span>COMMAND</span>
            <kbd className="rounded bg-background/80 px-1 py-0.5 text-[9px] text-muted-foreground border border-border/40">
              ⌘K
            </kbd>
          </button>
        </div>
      </div>

      {/* Main hero typography */}
      <div className="mt-10 max-w-4xl">
        <div className="font-mono-tech text-[11px] tracking-[0.25em] text-muted-foreground uppercase">
          [ ARCHITECTURE ROOT ]
        </div>

        <h1
          id="universe-title"
          className="mt-3 font-display text-5xl tracking-tight text-foreground sm:text-7xl lg:text-8xl leading-[0.92]"
        >
          VERONICA
          <br />
          <span className="text-foreground/90">UNIVERSE</span>
        </h1>

        <p className="mt-5 font-sans text-xl font-light tracking-wide text-foreground/85 sm:text-2xl">
          Brand Intelligence Operating System
        </p>

        <p className="mt-2 text-sm font-mono-tech text-muted-foreground/90">
          Uma identidade. Múltiplas expressões.
        </p>

        {/* Spatial control actions */}
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onExploreEcosystem}
            className="inline-flex items-center gap-2 rounded-sm border border-neon-green/40 bg-neon-green/10 px-4 py-2 font-mono-tech text-xs tracking-wider text-neon-green transition hover:bg-neon-green/20 hover:border-neon-green"
          >
            <Radio className="h-3.5 w-3.5" />
            <span>EXPLORAR ECOSSISTEMA</span>
          </button>

          <button
            type="button"
            onClick={onOpenCommand}
            className="inline-flex items-center gap-2 rounded-sm border border-border/60 bg-surface/30 px-4 py-2 font-mono-tech text-xs tracking-wider text-muted-foreground transition hover:border-border hover:text-foreground"
          >
            <CommandIcon className="h-3.5 w-3.5" />
            <span>EXECUTAR COMANDO (⌘K)</span>
          </button>
        </div>
      </div>
    </section>
  );
}
