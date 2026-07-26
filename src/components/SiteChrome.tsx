import { Link } from "@tanstack/react-router";
import { Youtube, Instagram, MessageCircle, Mail, ChevronDown, Menu, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import cyborgAsset from "@/assets/veronica-cyborg-v2.jpg.asset.json";

export const HUB_URL = "https://veronicahub.com";

export const SOCIAL_LINKS = {
  youtube: "https://youtube.com/@veronica-hub",
  instagram: "https://instagram.com/veronicahub_",
  whatsapp: "https://wa.me/5547996057436",
  email: "mailto:yo-tech01@outlook.com",
};

// Single source of truth for the ecosystem — the header dropdown and the
// home page's "O Ecossistema" cards both read from this list.
export type EcosystemLink = { name: string; tag: string; to: string; ready: boolean };

export const ECOSYSTEM_LINKS: EcosystemLink[] = [
  { name: "Veronica Studio", tag: "Imagem, vídeo e voz com IA", to: "/video-ia", ready: true },
  { name: "Currículo-Certo", tag: "Currículo pronto pra ATS", to: "/veronica-curriculo-certo", ready: true },
  { name: "Veronica Analytics", tag: "Análise de perfil TikTok Shop", to: "/veronica-analytics", ready: true },
  { name: "Veronica Security", tag: "Diagnóstico de segurança", to: "/veronica-security", ready: true },
];

export function EcosystemMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="group relative flex items-center gap-1 px-3 py-2 text-muted-foreground transition hover:text-neon-green"
      >
        Ecossistema
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
        <span className="absolute inset-x-3 -bottom-0.5 h-px origin-left scale-x-0 bg-neon-green transition-transform duration-300 group-hover:scale-x-100" />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-40 mt-2 w-64 rounded-sm border border-border/60 bg-background/95 p-1.5 shadow-[0_16px_40px_-12px_oklch(0_0_0/0.6)] backdrop-blur">
          {ECOSYSTEM_LINKS.map((item) =>
            item.ready ? (
              <Link
                key={item.name}
                to={item.to}
                onClick={() => setOpen(false)}
                className="group flex flex-col gap-0.5 rounded-sm px-3 py-2.5 transition hover:bg-neon-green/10"
              >
                <span className="font-mono-tech text-[11px] uppercase tracking-widest text-foreground group-hover:text-neon-green">
                  {item.name}
                </span>
                <span className="text-[11px] normal-case tracking-normal text-muted-foreground">{item.tag}</span>
              </Link>
            ) : (
              <div key={item.name} className="flex flex-col gap-0.5 px-3 py-2.5 opacity-50">
                <span className="flex items-center gap-1.5 font-mono-tech text-[11px] uppercase tracking-widest text-foreground">
                  {item.name}
                  <span className="rounded-full border border-border/60 px-1.5 py-0.5 text-[8px] normal-case tracking-normal text-muted-foreground">
                    em breve
                  </span>
                </span>
                <span className="text-[11px] normal-case tracking-normal text-muted-foreground">{item.tag}</span>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!mobileOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <>
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
            to="/comandos"
            className="group relative px-3 py-2 text-muted-foreground transition hover:text-neon-green"
          >
            Comandos
            <span className="absolute inset-x-3 -bottom-0.5 h-px origin-left scale-x-0 bg-neon-green transition-transform duration-300 group-hover:scale-x-100" />
          </Link>
          <EcosystemMenu />
          <Link
            to="/blog"
            className="group relative px-3 py-2 text-muted-foreground transition hover:text-neon-green"
          >
            Blog
            <span className="absolute inset-x-3 -bottom-0.5 h-px origin-left scale-x-0 bg-neon-green transition-transform duration-300 group-hover:scale-x-100" />
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-3 text-muted-foreground sm:flex">
            <a href={SOCIAL_LINKS.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="transition hover:text-neon-green hover:-translate-y-0.5"><Youtube className="h-4 w-4" /></a>
            <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="transition hover:text-neon-green hover:-translate-y-0.5"><Instagram className="h-4 w-4" /></a>
            <a href={SOCIAL_LINKS.whatsapp} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="transition hover:text-neon-green hover:-translate-y-0.5"><MessageCircle className="h-4 w-4" /></a>
            <a href={SOCIAL_LINKS.email} aria-label="E-mail" className="transition hover:text-neon-green hover:-translate-y-0.5"><Mail className="h-4 w-4" /></a>
          </div>
          <a
            href={HUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative hidden items-center gap-2 rounded-sm bg-neon-green px-4 py-2 font-mono-tech text-[11px] uppercase tracking-widest text-primary-foreground shadow-[0_0_0_1px_oklch(0.85_0.22_155),0_8px_24px_-8px_oklch(0.85_0.22_155/0.6)] transition duration-200 hover:-translate-y-0.5 hover:shadow-glow-green active:translate-y-0 active:brightness-95 md:inline-flex"
          >
            <span className="text-[10px] opacity-70 group-hover:opacity-100">▸</span>
            Acessar Hub
          </a>
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={mobileOpen}
            className="flex h-9 w-9 items-center justify-center rounded-sm border border-border/60 text-foreground md:hidden"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </header>

    {mobileOpen && (
      <div className="fixed inset-x-0 top-[65px] bottom-0 z-40 overflow-y-auto bg-background/98 backdrop-blur-md md:hidden">
        <nav className="flex flex-col gap-1 px-6 py-6 font-mono-tech text-sm uppercase tracking-wider">
          <Link to="/" onClick={() => setMobileOpen(false)} className="border-b border-border/40 py-3.5 text-foreground">
            Home
          </Link>
          <Link to="/comandos" onClick={() => setMobileOpen(false)} className="border-b border-border/40 py-3.5 text-foreground">
            Comandos
          </Link>
          <Link to="/blog" onClick={() => setMobileOpen(false)} className="border-b border-border/40 py-3.5 text-foreground">
            Blog
          </Link>
          <div className="pt-4 pb-1 text-[10px] uppercase tracking-widest text-muted-foreground">Ecossistema</div>
          {ECOSYSTEM_LINKS.map((item) =>
            item.ready ? (
              <Link key={item.name} to={item.to} onClick={() => setMobileOpen(false)} className="flex flex-col gap-0.5 border-b border-border/40 py-3.5">
                <span className="text-foreground">{item.name}</span>
                <span className="text-[11px] normal-case tracking-normal text-muted-foreground">{item.tag}</span>
              </Link>
            ) : (
              <div key={item.name} className="flex flex-col gap-0.5 border-b border-border/40 py-3.5 opacity-50">
                <span className="flex items-center gap-2 text-foreground">
                  {item.name}
                  <span className="rounded-full border border-border/60 px-1.5 py-0.5 text-[8px] normal-case tracking-normal text-muted-foreground">em breve</span>
                </span>
                <span className="text-[11px] normal-case tracking-normal text-muted-foreground">{item.tag}</span>
              </div>
            ),
          )}
          <a
            href={HUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-sm bg-neon-green px-4 py-3 text-[11px] text-primary-foreground"
          >
            Acessar Hub
          </a>
          <div className="mt-6 flex items-center gap-4 text-muted-foreground">
            <a href={SOCIAL_LINKS.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube"><Youtube className="h-5 w-5" /></a>
            <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram"><Instagram className="h-5 w-5" /></a>
            <a href={SOCIAL_LINKS.whatsapp} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"><MessageCircle className="h-5 w-5" /></a>
            <a href={SOCIAL_LINKS.email} aria-label="E-mail"><Mail className="h-5 w-5" /></a>
          </div>
        </nav>
      </div>
    )}
    </>
  );
}

export function CyborgBackdrop() {
  return (
    <>
      {/* Imagem estática da Veronica — sem WebGL, sem shimmer/hue-rotate,
          sem sweep, sem scanlines. Só posição, contraste e brilho ajustados
          pra ficar limpa e nítida em qualquer tela, igual em toda página que
          usa este componente (home, Studio, Analytics, Security). */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-cover bg-no-repeat opacity-[0.48] bg-[position:50%_16%] md:opacity-[0.44] md:bg-[position:46%_22%] lg:opacity-[0.4] lg:bg-[position:center_26%]"
        style={{
          backgroundImage: `url(${cyborgAsset.url})`,
          filter: "contrast(1.08) saturate(0.88) brightness(0.98)",
          mixBlendMode: "screen",
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
          <Link to="/video-ia" className="transition hover:text-neon-green">Veronica Studio</Link>
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