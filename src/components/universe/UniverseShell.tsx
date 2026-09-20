import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Command as CommandIcon, ArrowLeft, Newspaper, Radio } from "lucide-react";
import gsap from "gsap";
import { UniverseNavigation } from "./UniverseNavigation";
import { UniverseCommand } from "./UniverseCommand";
import { type UniverseTab } from "./types";

interface UniverseShellProps {
  children: ReactNode;
  activeTab: UniverseTab;
  onSelectTab: (tab: UniverseTab) => void;
  adminEmail?: string;
}

export function UniverseShell({
  children,
  activeTab,
  onSelectTab,
  adminEmail,
}: UniverseShellProps) {
  const [commandOpen, setCommandOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      const elements = containerRef.current?.querySelectorAll("[data-universe-element]");
      if (elements && elements.length > 0) {
        gsap.fromTo(
          elements,
          { opacity: 0, y: 8 },
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            stagger: 0.07,
            ease: "power2.out",
          },
        );
      }
    }, containerRef);

    return () => ctx.revert();
  }, [activeTab]);

  return (
    <div
      ref={containerRef}
      className="flex min-h-screen flex-col bg-background text-foreground selection:bg-neon-green/20 selection:text-neon-green"
    >
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/92 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              to="/admin"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-sm border border-border/50 px-2 py-1 font-mono-tech text-[10px] text-muted-foreground transition hover:border-border hover:text-foreground"
              title="Voltar ao Painel Admin"
            >
              <ArrowLeft className="h-3 w-3" />
              <span className="hidden sm:inline">ADMIN</span>
            </Link>

            <span className="hidden text-border/60 sm:inline">/</span>

            <div className="flex min-w-0 items-center gap-2 font-mono-tech text-xs tracking-wider text-foreground">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-neon-green animate-pulse" />
              <span className="truncate font-semibold uppercase tracking-widest">
                VERONICA UNIVERSE
              </span>
              <span className="hidden rounded-full border border-neon-cyan/25 bg-neon-cyan/5 px-2 py-0.5 text-[8px] text-neon-cyan lg:inline">
                OPERATING SYSTEM
              </span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Link
              to="/admin/wire"
              className="hidden items-center gap-1.5 rounded-sm border border-border/40 px-2.5 py-1 font-mono-tech text-[10px] text-muted-foreground transition hover:border-border hover:text-foreground md:inline-flex"
            >
              <Newspaper className="h-3 w-3" />
              <span>WIRE</span>
            </Link>

            <button
              type="button"
              onClick={() => setCommandOpen(true)}
              className="inline-flex min-h-8 items-center gap-1.5 rounded-sm border border-border/60 bg-surface/50 px-2.5 py-1 font-mono-tech text-[10px] tracking-wider text-muted-foreground transition hover:border-neon-green/50 hover:text-foreground"
              aria-label="Abrir Universe Command Palette"
            >
              <CommandIcon className="h-3 w-3 text-neon-green" />
              <span className="hidden sm:inline">COMMAND</span>
              <kbd className="hidden rounded border border-border/50 bg-background px-1 py-0.5 text-[8px] lg:inline">
                ⌘K
              </kbd>
            </button>

            {adminEmail && (
              <span
                className="hidden max-w-44 truncate border-l border-border/50 pl-3 font-mono-tech text-[9px] text-muted-foreground xl:inline"
                title={adminEmail}
              >
                {adminEmail}
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-5 sm:px-6 sm:py-7">
        <UniverseNavigation activeTab={activeTab} onSelectTab={onSelectTab} />
        <div className="mt-5">{children}</div>
      </main>

      <footer className="border-t border-border/40 bg-surface/20 py-4">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 font-mono-tech text-[9px] uppercase tracking-widest text-muted-foreground sm:px-6">
          <span className="flex items-center gap-2">
            <Radio className="h-3 w-3 text-neon-green" />
            VERONICA OPERATING SYSTEM · LIVE DATA WHERE AVAILABLE
          </span>
          <span>NO FABRICATED METRICS</span>
        </div>
      </footer>

      <UniverseCommand open={commandOpen} onOpenChange={setCommandOpen} onSelectTab={onSelectTab} />
    </div>
  );
}
