import { Link } from "@tanstack/react-router";
import { Youtube, Instagram, MessageCircle } from "lucide-react";
import type { ReactNode } from "react";
import cyborgAsset from "@/assets/veronica-cyborg-v2.jpg.asset.json";
import { VeronicaHero } from "@/components/VeronicaHero";

export const HUB_URL = "https://veronicahub.com";

export function SiteHeader() {
  return (
    <header className="relative sticky top-0 z-30 border-b border-border/40 bg-background/70 backdrop-blur-md supports-[backdrop-filter]:bg-background/55">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-destructive/60 to-transparent"
      />
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2 font-mono-tech text-sm uppercase tracking-widest">
          <span className="h-2 w-2 rounded-full bg-neon-green animate-pulse-dot" />
          <span className="font-display text-base tracking-tight">Veronica</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">Hub</span>
        </Link>
        <nav className="hidden items-center gap-1 text-xs font-mono-tech uppercase tracking-wider md:flex">
          <Link
            to="/"
            className="group relative px-3 py-2 text-muted-foreground transition hover:text-neon-green"
          >
            Home
            <span className="absolute inset-x-3 -bottom-0.5 h-px origin-left scale-x-0 bg-neon-green transition-transform duration-300 group-hover:scale-x-100" />
          </Link>
          <Link
            to="/veronica-curriculo-certo"
            className="group relative px-3 py-2 text-muted-foreground transition hover:text-neon-green"
          >
            Currículo Certo
            <span className="absolute inset-x-3 -bottom-0.5 h-px origin-left scale-x-0 bg-neon-green transition-transform duration-300 group-hover:scale-x-100" />
          </Link>
          <Link
            to="/video-ia"
            className="group relative px-3 py-2 text-muted-foreground transition hover:text-neon-green"
          >
            Vídeo IA
            <span className="absolute inset-x-3 -bottom-0.5 h-px origin-left scale-x-0 bg-neon-green transition-transform duration-300 group-hover:scale-x-100" />
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-3 text-muted-foreground sm:flex">
            <a href="#" aria-label="YouTube" className="transition hover:text-neon-green hover:-translate-y-0.5"><Youtube className="h-4 w-4" /></a>
            <a href="#" aria-label="Instagram" className="transition hover:text-neon-green hover:-translate-y-0.5"><Instagram className="h-4 w-4" /></a>
            <a href="#" aria-label="WhatsApp" className="transition hover:text-neon-green hover:-translate-y-0.5"><MessageCircle className="h-4 w-4" /></a>
          </div>
          <a
            href={HUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative inline-flex items-center gap-2 rounded-sm bg-neon-green px-4 py-2 font-mono-tech text-[11px] uppercase tracking-widest text-primary-foreground shadow-[0_0_0_1px_oklch(0.85_0.22_155),0_8px_24px_-8px_oklch(0.85_0.22_155/0.6)] transition duration-200 hover:-translate-y-0.5 hover:shadow-glow-green active:translate-y-0 active:brightness-95"
          >
            <span className="text-[10px] opacity-70 group-hover:opacity-100">▸</span>
            Acessar Hub
          </a>
        </div>
      </div>
    </header>
  );
}

export function CyborgBackdrop() {
  return (
    <>
      <VeronicaHero />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 animate-holo-shimmer bg-cover bg-no-repeat opacity-[0.55] md:opacity-[0.45] lg:opacity-[0.38] bg-[position:42%_22%] md:bg-[position:46%_26%] lg:bg-[position:center_30%]"
        style={{
          backgroundImage: `url(${cyborgAsset.url})`,
          filter: "contrast(1.05) saturate(0.85) brightness(0.9)",
          mixBlendMode: "screen",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-32 animate-holo-sweep"
        style={{
          background:
            "linear-gradient(180deg, transparent 0%, oklch(0.88 0.15 195 / 0.14) 45%, oklch(0.85 0.22 155 / 0.22) 50%, oklch(0.88 0.15 195 / 0.14) 55%, transparent 100%)",
          mixBlendMode: "screen",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent 0 2px, oklch(0.14 0.015 200 / 0.35) 2px 3px)",
          mixBlendMode: "multiply",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, var(--background) 0%, oklch(0.14 0.015 200 / 0.6) 40%, transparent 75%, oklch(0.14 0.015 200 / 0.85) 100%), linear-gradient(180deg, transparent 0%, transparent 55%, var(--background) 100%)",
        }}
      />
      <div aria-hidden className="pointer-events-none absolute left-6 top-6 h-16 w-16 border-l-2 border-t-2 border-neon-green/70" />
      <div aria-hidden className="pointer-events-none absolute right-6 bottom-6 h-16 w-16 border-r-2 border-b-2 border-neon-cyan/70" />
    </>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border/40 bg-background/80">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 md:flex-row">
        <div className="flex items-center gap-2 font-mono-tech text-[11px] uppercase tracking-widest text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-neon-green animate-pulse-dot" />
          © 2026 Veronica Hub · Laboratório digital
        </div>
        <div className="flex items-center gap-4 font-mono-tech text-[11px] uppercase tracking-widest text-muted-foreground">
          <Link to="/" className="transition hover:text-neon-green">Home</Link>
          <Link to="/veronica-curriculo-certo" className="transition hover:text-neon-green">Currículo</Link>
          <Link to="/video-ia" className="transition hover:text-neon-green">Vídeo IA</Link>
          <a href={HUB_URL} target="_blank" rel="noopener noreferrer" className="transition hover:text-neon-green">Hub</a>
        </div>
      </div>
    </footer>
  );
}

export function PageHero({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  subtitle?: string;
  children?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden scanlines">
      <CyborgBackdrop />
      <div className="relative mx-auto max-w-7xl px-6 pb-20 pt-16 md:pb-28 md:pt-24">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-3 rounded-full border border-neon-green/40 bg-background/60 px-4 py-1.5 font-mono-tech text-[10px] uppercase tracking-widest text-neon-green backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-neon-green animate-pulse-dot" />
            {eyebrow}
          </div>
          <h1
            className="mt-8 font-display text-5xl sm:text-6xl md:text-7xl"
            style={{ letterSpacing: "-0.045em", lineHeight: "0.9" }}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="mt-6 max-w-xl text-base leading-[1.65] text-muted-foreground sm:text-lg">
              {subtitle}
            </p>
          )}
          {children}
        </div>
      </div>
    </section>
  );
}