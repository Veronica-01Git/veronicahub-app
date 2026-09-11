import { Link } from "@tanstack/react-router";
import {
  Youtube,
  Instagram,
  MessageCircle,
  Mail,
  ChevronDown,
  Menu,
  X,
  User as UserIcon,
  GraduationCap,
  Wand2,
  BarChart3,
  ShieldCheck,
  Briefcase,
  Newspaper,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import cyborgAsset from "@/assets/veronica-cyborg-v2.jpg.asset.json";
import { requestEmailCode, verifyEmailCode, logout, getCurrentUser } from "@/lib/auth-server";

export const HUB_URL = "https://veronicahub.com";

export const SOCIAL_LINKS = {
  youtube: "https://youtube.com/@veronica-hub",
  instagram: "https://instagram.com/veronicahub_",
  whatsapp: "https://wa.me/5547996057436",
  email: "mailto:yo-tech01@outlook.com",
};

export { INTENT_LINKS } from "@/lib/ecosystem";
import { INTENT_LINKS, PRIMARY_NAV, SPECIAL_PROJECTS, HOME_PRODUCTS, type IntentId } from "@/lib/ecosystem";
export const ECOSYSTEM_LINKS = HOME_PRODUCTS.map(item => ({ ...item, tag: item.description, ready: item.status === "Disponível" }));

const INTENT_ICONS: Record<IntentId, LucideIcon> = {
  learn: GraduationCap,
  create: Wand2,
  sell: BarChart3,
  protect: ShieldCheck,
  work: Briefcase,
  update: Newspaper,
};

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
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="ecosystem-intent-menu"
        className="group relative flex items-center gap-1 px-3 py-2 text-muted-foreground transition hover:text-neon-green"
      >
        Ferramentas
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
        <span className="absolute inset-x-3 -bottom-0.5 h-px origin-left scale-x-0 bg-neon-green transition-transform duration-300 group-hover:scale-x-100" />
      </button>

      {open && (
        <div
          id="ecosystem-intent-menu"
          className="absolute left-1/2 top-full z-40 mt-3 w-[min(720px,calc(100vw-3rem))] -translate-x-1/2 overflow-hidden rounded-sm border border-border/60 bg-background/95 shadow-[0_24px_70px_-20px_oklch(0_0_0/0.85)] backdrop-blur-xl"
        >
          <div className="border-b border-border/50 px-5 py-4">
            <div className="font-mono-tech text-[9px] uppercase tracking-[0.22em] text-neon-green">
              Escolha pelo seu objetivo
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              A Veronica indica o caminho mais curto entre intenção e resultado.
            </p>
          </div>

          <div className="grid gap-px bg-border/40 p-px sm:grid-cols-2">
            {INTENT_LINKS.map((item) => {
              const Icon = INTENT_ICONS[item.id];
              return (
                <Link
                  key={item.id}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="group flex gap-3 bg-background/95 p-4 transition hover:bg-neon-green/[0.07]"
                >
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-border/60 bg-surface/70 text-muted-foreground transition group-hover:border-neon-green/50 group-hover:text-neon-green">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-display text-base text-foreground transition group-hover:text-neon-green">
                      {item.label}
                    </span>
                    <span className="mt-0.5 block font-mono-tech text-[9px] uppercase tracking-widest text-neon-cyan">
                      {item.name}
                    </span>
                    <span className="mt-1 block text-[11px] leading-relaxed text-muted-foreground">
                      {item.tag}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>

          <div className="border-t border-border/50 px-5 py-4"><SpecialProjectLinks onNavigate={() => setOpen(false)} /></div>
        </div>
      )}
    </div>
  );
}

export function MobileEcosystemIntentMenu({ onNavigate }: { onNavigate: () => void }) {
  return (
    <div className="pt-4">
      <div className="pb-2 font-mono-tech text-[10px] uppercase tracking-widest text-neon-green">
        O que você quer fazer?
      </div>
      <div className="grid gap-2">
        {INTENT_LINKS.map((item) => {
          const Icon = INTENT_ICONS[item.id];
          return (
            <Link
              key={item.id}
              to={item.to}
              onClick={onNavigate}
              className="flex items-center gap-3 rounded-sm border border-border/50 bg-surface/30 p-3.5"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border border-border/60 text-neon-green">
                <Icon className="h-3.5 w-3.5" />
              </span>
              <span className="min-w-0">
                <span className="block font-display text-[15px] normal-case tracking-normal text-foreground">
                  {item.label}
                </span>
                <span className="block text-[10px] normal-case tracking-normal text-muted-foreground">
                  {item.name}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
      <div className="mt-4 border-t border-border/40 pt-4"><SpecialProjectLinks onNavigate={onNavigate} /></div>
    </div>
  );
}

// Login compartilhado do ecossistema — mesma conta/sessão que já é usada
// no Currículo-Certo e no Studio Criativo (ver src/lib/auth-server.ts),
// só que agora visível no cabeçalho de toda página que usa <SiteHeader />.
// Não duplica lógica de autenticação, só chama as server functions que já
// existem — nada em auth-server.ts foi alterado.
type HubUser = { id: string; email: string };

export function AuthWidget({ variant = "desktop" }: { variant?: "desktop" | "mobile" }) {
  const [user, setUser] = useState<HubUser | null>(null);
  const [checked, setChecked] = useState(false);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"identify" | "confirm">("identify");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    getCurrentUser()
      .then((u) => {
        if (!cancelled) setUser(u);
      })
      .finally(() => {
        if (!cancelled) setChecked(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!open || variant === "mobile") return;
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
  }, [open, variant]);

  function resetForm() {
    setStep("identify");
    setEmail("");
    setCode("");
    setError(null);
  }

  async function handleRequestCode(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await requestEmailCode({ data: { email: email.trim() } });
      if (res.ok) {
        setStep("confirm");
        setCode("");
      } else {
        setError(res.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao pedir código.");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmCode(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await verifyEmailCode({ data: { email: email.trim(), code: code.trim() } });
      if (res.ok) {
        setUser(res.user);
        setOpen(false);
        resetForm();
      } else {
        setError(res.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao confirmar código.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await logout();
    setUser(null);
    setOpen(false);
  }

  if (!checked) return null;

  const triggerClass =
    "group relative flex items-center gap-1.5 rounded-sm border border-border/60 px-3 py-2 font-mono-tech text-[11px] uppercase tracking-widest text-muted-foreground transition hover:border-neon-green/60 hover:text-neon-green";

  const panel = (
    <div className="flex w-72 flex-col gap-3 p-3.5">
      {user ? (
        <>
          <div className="flex items-center gap-2 font-mono-tech text-[11px]" style={{ color: "var(--foreground)" }}>
            <UserIcon className="h-3.5 w-3.5 text-neon-green" />
            {user.email}
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-sm border border-border/60 px-3 py-2 font-mono-tech text-[10.5px] uppercase tracking-widest text-muted-foreground transition hover:border-destructive/60 hover:text-destructive"
          >
            Sair
          </button>
        </>
      ) : step === "identify" ? (
        <form onSubmit={handleRequestCode} className="flex flex-col gap-2.5">
          <span className="font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground">
            Entrar ou criar conta
          </span>
          <input
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            className="rounded-sm border border-border/60 bg-background/60 px-3 py-2 text-[13px] outline-none focus:border-neon-green/60"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-sm bg-neon-green px-3 py-2 font-mono-tech text-[10.5px] uppercase tracking-widest text-primary-foreground transition disabled:opacity-50"
          >
            {loading ? "Enviando…" : "Enviar código"}
          </button>
          {error && <span className="font-mono-tech text-[10.5px] text-destructive">{error}</span>}
        </form>
      ) : (
        <form onSubmit={handleConfirmCode} className="flex flex-col gap-2.5">
          <span className="font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground">
            Código enviado para {email}
          </span>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            required
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="000000"
            className="rounded-sm border border-border/60 bg-background/60 px-3 py-2 text-center text-[15px] tracking-[0.3em] outline-none focus:border-neon-green/60"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-sm bg-neon-green px-3 py-2 font-mono-tech text-[10.5px] uppercase tracking-widest text-primary-foreground transition disabled:opacity-50"
          >
            {loading ? "Confirmando…" : "Confirmar"}
          </button>
          <button
            type="button"
            onClick={() => {
              setStep("identify");
              setError(null);
            }}
            className="font-mono-tech text-[10.5px] uppercase tracking-widest text-muted-foreground"
          >
            Trocar e-mail
          </button>
          {error && <span className="font-mono-tech text-[10.5px] text-destructive">{error}</span>}
        </form>
      )}
    </div>
  );

  if (variant === "mobile") {
    return (
      <div className="flex flex-col gap-1">
        {!open ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="mt-2 inline-flex items-center justify-center gap-2 rounded-sm border border-border/60 px-4 py-3 font-mono-tech text-[11px] uppercase tracking-widest text-foreground"
          >
            <UserIcon className="h-3.5 w-3.5" />
            {user ? user.email : "Entrar"}
          </button>
        ) : (
          <div className="rounded-sm border border-border/60 bg-background/40">{panel}</div>
        )}
      </div>
    );
  }

  return (
    <div ref={ref} className="relative hidden sm:block">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className={triggerClass}>
        <UserIcon className="h-3.5 w-3.5" />
        {user ? user.email.split("@")[0] : "Entrar"}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-40 mt-2 rounded-sm border border-border/60 bg-background/95 shadow-[0_16px_40px_-12px_oklch(0_0_0/0.6)] backdrop-blur">
          {panel}
        </div>
      )}
    </div>
  );
}

function SpecialProjectLinks({ onNavigate }: { onNavigate: () => void }) {
  return <div className="space-y-3"><p className="text-xs text-muted-foreground">Projetos especiais</p><div className="flex flex-wrap gap-4">{SPECIAL_PROJECTS.map(item => <a key={item.id} href={item.to} onClick={onNavigate} target={item.external ? "_blank" : undefined} rel={item.external ? "noopener noreferrer" : undefined} className="text-sm text-muted-foreground hover:text-foreground">{item.name}<span className="block text-xs">{item.status}</span></a>)}</div></div>;
}

// Páginas com carteira mantêm seus próprios controles de sessão.
export function SiteHeader({ showAuth = true }: { showAuth?: boolean }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setMobileOpen(false); };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, []);
  return <header className="sticky top-0 z-30 text-foreground border-b border-border/40 bg-background/95 backdrop-blur-md">
    <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-6 py-4">
      <Link to="/" aria-label="Veronica Hub — início" className="shrink-0 font-display text-base">Veronica · Hub</Link>
      <nav aria-label="Navegação principal" className="hidden items-center gap-2 text-sm lg:flex">
        {PRIMARY_NAV.map((item, index) => <span key={item.id} className="contents"><Link to={item.to} className="px-3 py-2 hover:text-neon-green">{item.name}</Link>{index === 0 && <EcosystemMenu />}</span>)}
      </nav>
      <div className="flex items-center gap-3">{showAuth && <AuthWidget />}<button type="button" onClick={() => setMobileOpen(v => !v)} aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"} aria-expanded={mobileOpen} aria-controls="mobile-navigation" className="min-h-11 min-w-11 rounded-sm border border-border/60 lg:hidden">{mobileOpen ? <X className="mx-auto h-5 w-5" /> : <Menu className="mx-auto h-5 w-5" />}</button></div>
    </div>
    {mobileOpen && <nav id="mobile-navigation" aria-label="Navegação principal mobile" className="max-h-[80vh] overflow-y-auto border-t border-border/40 bg-background px-6 pb-6 lg:hidden">
      {showAuth && <div className="sm:hidden"><AuthWidget variant="mobile" /></div>}
      {PRIMARY_NAV.map((item, index) => <div key={item.id}><Link to={item.to} onClick={() => setMobileOpen(false)} className="block border-b border-border/40 py-4 text-base">{item.name}</Link>{index === 0 && <details><summary className="cursor-pointer py-4 text-base">Ferramentas</summary><MobileEcosystemIntentMenu onNavigate={() => setMobileOpen(false)} /></details>}</div>)}
    </nav>}
  </header>;
}

// Moldura reutilizável de qualquer hero com fundo da Veronica — fade pras
// bordas se fundirem com o resto da página + corner brackets. Usada tanto
// pelo CyborgBackdrop (imagem estática) quanto pela hero WebGL da Studio.
export function HeroFrame() {
  return (
    <>
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

export function CyborgBackdrop() {
  return (
    <>
      {/* Imagem estática da Veronica — sem WebGL, sem shimmer/hue-rotate,
          sem sweep, sem scanlines. Só posição, contraste e brilho ajustados
          pra ficar limpa e nítida em qualquer tela, igual em toda página que
          usa este componente. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-cover bg-no-repeat opacity-[0.48] bg-[position:50%_16%] md:opacity-[0.44] md:bg-[position:46%_22%] lg:opacity-[0.4] lg:bg-[position:center_26%]"
        style={{
          backgroundImage: `url(${cyborgAsset.url})`,
          filter: "contrast(1.08) saturate(0.88) brightness(0.98)",
          mixBlendMode: "screen",
        }}
      />
      <HeroFrame />
    </>
  );
}

export function SiteFooter() {
  return <footer className="text-foreground border-t border-border/40 bg-background px-6 py-10">
    <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-3">
      <div><Link to="/" className="font-display text-lg">Veronica Hub</Link><p className="mt-3 text-sm text-muted-foreground">Escola de Inteligência Artificial</p><p className="mt-2 text-xs text-muted-foreground">© 2026 Veronica Hub</p></div>
      <nav aria-label="Navegação do rodapé" className="flex flex-col items-start gap-3">{PRIMARY_NAV.map(item => <Link key={item.id} to={item.to} className="text-sm hover:text-neon-green">{item.name}</Link>)}<a href={SOCIAL_LINKS.email} className="text-sm">Contato</a></nav>
      <div><p className="mb-3 text-sm">Acompanhe a Veronica</p><div className="flex flex-wrap gap-4">{[{label:"YouTube",href:SOCIAL_LINKS.youtube},{label:"Instagram",href:SOCIAL_LINKS.instagram},{label:"WhatsApp",href:SOCIAL_LINKS.whatsapp}].map(item => <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-neon-green">{item.label}</a>)}</div></div>
    </div>
  </footer>;
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