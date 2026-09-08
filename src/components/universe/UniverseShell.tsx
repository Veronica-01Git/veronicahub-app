import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Command as CommandIcon, ArrowLeft, Shield, Terminal, Newspaper } from "lucide-react";
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

  // GSAP System Boot Motion
  useEffect(() => {
    if (!containerRef.current) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      const elements = containerRef.current?.querySelectorAll("[data-universe-element]");
      if (elements && elements.length > 0) {
        gsap.fromTo(
          elements,
          {
            opacity: 0,
            y: 8,
          },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.12,
            ease: "power2.out",
          },
        );
      }
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-background text-foreground flex flex-col selection:bg-neon-green/20 selection:text-neon-green"
    >
      {/* Precision Shell Header */}
      <header className="border-b border-border/50 bg-background/90 backdrop-blur sticky top-0 z-40">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          {/* Left Context & Brand System breadcrumb */}
          <div className="flex items-center gap-3">
            <Link
              to="/admin"
              className="inline-flex items-center gap-1.5 rounded-sm border border-border/50 px-2 py-1 font-mono-tech text-[10.5px] text-muted-foreground transition hover:border-border hover:text-foreground"
              title="Voltar ao Painel Admin Principal"
            >
              <ArrowLeft className="h-3 w-3" />
              <span>ADMIN</span>
            </Link>

            <span className="text-border/60">/</span>

            <div className="flex items-center gap-2 font-mono-tech text-xs tracking-wider text-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-neon-green animate-pulse" />
              <span className="font-semibold tracking-widest uppercase">VERONICA UNIVERSE</span>
            </div>
          </div>

          {/* Right Navigation shortcuts */}
          <div className="flex items-center gap-3">
            <Link
              to="/admin/artigos"
              className="hidden items-center gap-1.5 rounded-sm border border-border/40 px-2.5 py-1 font-mono-tech text-[10.5px] text-muted-foreground transition hover:border-border hover:text-foreground sm:inline-flex"
            >
              <Newspaper className="h-3 w-3" />
              <span>ARTIGOS</span>
            </Link>

            <button
              type="button"
              onClick={() => setCommandOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-sm border border-border/60 bg-surface/50 px-2.5 py-1 font-mono-tech text-[10.5px] tracking-wider text-muted-foreground transition hover:border-neon-green/50 hover:text-foreground"
              aria-label="Abrir Universe Command Palette"
            >
              <CommandIcon className="h-3 w-3 text-neon-green" />
              <span className="hidden sm:inline">COMMAND</span>
              <kbd className="rounded border border-border/50 bg-background px-1 py-0.2 text-[9px]">
                ⌘K
              </kbd>
            </button>

            {adminEmail && (
              <span
                className="hidden font-mono-tech text-[10px] text-muted-foreground border-l border-border/50 pl-3 md:inline"
                title="Sessão autorizada"
              >
                {adminEmail}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Workspace Area */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Navigation Rail */}
        <UniverseNavigation activeTab={activeTab} onSelectTab={onSelectTab} />

        {/* Content Body */}
        <div className="mt-4">{children}</div>
      </main>

      {/* Discrete System Shell Footer */}
      <footer className="border-t border-border/40 bg-surface/20 py-5 text-center font-mono-tech text-[10px] text-muted-foreground tracking-widest uppercase">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-wrap items-center justify-between gap-2">
          <span>VERONICA BRAND INTELLIGENCE OS · PHASE 2A</span>
          <span>CHARACTER CANON v1.0.0 · ACTIVE</span>
        </div>
      </footer>

      {/* Command Palette Modal */}
      <UniverseCommand open={commandOpen} onOpenChange={setCommandOpen} onSelectTab={onSelectTab} />
    </div>
  );
}
