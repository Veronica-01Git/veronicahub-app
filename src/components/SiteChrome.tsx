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
  Briefcase,
  Bot,
  Users,
  Newspaper,
  LayoutGrid,
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
  wireInstagram: "https://instagram.com/wire__tv",
  whatsapp: "https://wa.me/5547996057436",
  email: "mailto:yo-tech01@outlook.com",
};

export { INTENT_LINKS } from "@/lib/ecosystem";
import {
  HEADER_NAV_GROUPS,
  PRIMARY_NAV,
  HOME_PRODUCTS,
  WIRE_LIVE_BADGE_ENABLED,
} from "@/lib/ecosystem";
export const ECOSYSTEM_LINKS = HOME_PRODUCTS.map((item) => ({
  ...item,
  tag: item.description,
  ready: item.status === "Disponível",
}));

const HEADER_GROUP_ICONS: Record<(typeof HEADER_NAV_GROUPS)[number]["id"], LucideIcon> = {
  learn: GraduationCap,
  create: Wand2,
  business: Briefcase,
  explore: LayoutGrid,
};

// O selo só é ligado para uma transmissão real. Notícias publicadas em
// intervalos não devem ser anunciadas como uma transmissão ao vivo.
function WireLiveBadge({ className = "" }: { className?: string }) {
  if (!WIRE_LIVE_BADGE_ENABLED) return null;
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full border border-neon-green/40 bg-neon-green/10 px-1.5 py-0.5 font-mono-tech text-[9px] uppercase tracking-wider text-neon-green ${className}`}
    >
      <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-neon-green" />
      Ao vivo
    </span>
  );
}
function WireNewsShortcut({
  mobile = false,
  onNavigate,
}: {
  mobile?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      to="/blog"
      onClick={onNavigate}
      aria-label="Wire TV — notícias"
      className={
        mobile
          ? "flex min-h-12 items-center justify-between gap-3 rounded-xl border border-neon-green/35 bg-neon-green/[0.06] px-4 py-3 text-foreground transition hover:border-neon-green/65"
          : "inline-flex min-h-10 shrink-0 items-center gap-2.5 rounded-full border border-neon-green/30 bg-neon-green/[0.05] px-3 py-2 text-foreground transition hover:border-neon-green/70 hover:bg-neon-green/[0.1]"
      }
    >
      <span className="flex items-center gap-2">
        <Newspaper aria-hidden="true" className="h-4 w-4 shrink-0 text-neon-green" />
        <span className="font-display text-sm font-semibold">Wire TV</span>
      </span>
      {WIRE_LIVE_BADGE_ENABLED ? (
        <WireLiveBadge />
      ) : (
        <span className="font-mono-tech text-[9px] uppercase tracking-[0.12em] text-neon-green">
          Notícias
        </span>
      )}
    </Link>
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
          <div
            className="flex items-center gap-2 font-mono-tech text-[11px]"
            style={{ color: "var(--foreground)" }}
          >
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
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={triggerClass}
      >
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

function NavigationGroupLinks({
  group,
  onNavigate,
}: {
  group: (typeof HEADER_NAV_GROUPS)[number];
  onNavigate: () => void;
}) {
  return (
    <div className="grid gap-1 p-2">
      {group.id === "business" ? (
        <div className="border-b border-border/50 pb-2">
          <a
            href="/agentes"
            onClick={onNavigate}
            className="block rounded-lg px-3 py-3 hover:bg-neon-green/10"
          >
            <span className="flex items-center gap-2 text-sm font-semibold">
              <Bot size={18} /> AGENTES DE IA
            </span>
            <span className="mt-1 block text-xs text-muted-foreground">
              Automação e escala 24/7
            </span>
          </a>
          <a
            href="/agentes-humanos"
            onClick={onNavigate}
            className="block rounded-lg px-3 py-3 hover:bg-neon-green/10"
          >
            <span className="flex items-center gap-2 text-sm font-semibold">
              <Users size={18} /> AGENTES HUMANOS
            </span>
            <span className="mt-1 block text-xs text-muted-foreground">
              Curadoria, consultoria e suporte humano especializado
            </span>
          </a>
        </div>
      ) : null}
      {group.items
        .filter((item) => group.id !== "business" || !["agentes", "human-agents"].includes(item.id))
        .map((item) => (
          <Link
            key={item.id}
            to={item.to}
            onClick={onNavigate}
            className="group rounded-lg px-3 py-2.5 transition hover:bg-neon-green/[0.07] focus-visible:outline-2 focus-visible:outline-neon-green"
          >
            <span className="block text-sm font-medium text-foreground group-hover:text-neon-green">
              {item.name}
            </span>
            <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
              {item.description}
            </span>
          </Link>
        ))}
    </div>
  );
}

// Páginas com carteira mantêm seus próprios controles de sessão.
export function SiteHeader({
  showAuth = true,
  brand = "veronica",
}: {
  showAuth?: boolean;
  brand?: "veronica" | "yo";
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<(typeof HEADER_NAV_GROUPS)[number]["id"] | null>(
    null,
  );
  const navRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
        setActiveMenu(null);
      }
    };
    const onPointerDown = (event: PointerEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) setActiveMenu(null);
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, []);
  return (
    <header className="vt-cabecalho sticky top-0 z-30 text-foreground border-b border-border/40 bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link
          to="/"
          aria-label="Início do ecossistema"
          className="flex shrink-0 items-center gap-2.5 font-display text-base"
        >
          {brand === "yo" ? (
            <>
              <img
                src="/images/brand/yo-lab-logo.webp"
                alt=""
                width="38"
                height="38"
                className="size-9"
              />
              <span className="text-sm tracking-tight sm:text-base">
                YO LAB <span className="font-normal">& CO.</span>
              </span>
            </>
          ) : (
            "Veronica · Hub"
          )}
        </Link>
        <nav
          ref={navRef}
          aria-label="Navegação principal"
          className="hidden items-center gap-0.5 text-sm lg:flex"
        >
          {HEADER_NAV_GROUPS.map((group) => {
            const Icon = HEADER_GROUP_ICONS[group.id];
            const open = activeMenu === group.id;
            return (
              <div
                key={group.id}
                className="relative"
                onMouseEnter={() => setActiveMenu(group.id)}
                onMouseLeave={() => setActiveMenu(null)}
              >
                <button
                  type="button"
                  aria-expanded={open}
                  aria-controls={`header-menu-${group.id}`}
                  onClick={() => setActiveMenu(open ? null : group.id)}
                  className={`inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2.5 py-2 transition hover:bg-surface/60 hover:text-neon-green focus-visible:outline-2 focus-visible:outline-neon-green ${open ? "bg-surface/60 text-neon-green" : "text-foreground"}`}
                >
                  <Icon aria-hidden="true" className="h-3.5 w-3.5 opacity-65" />
                  {group.label}
                  <ChevronDown
                    aria-hidden="true"
                    className={`h-3.5 w-3.5 opacity-65 transition-transform ${open ? "rotate-180" : ""}`}
                  />
                </button>
                {open && (
                  <div
                    id={`header-menu-${group.id}`}
                    className="absolute left-1/2 top-full z-40 pt-3 w-80 max-h-[min(70vh,540px)] -translate-x-1/2 overflow-y-auto rounded-xl border border-border/70 bg-background/95 shadow-[0_24px_70px_-20px_oklch(0_0_0/0.85)] backdrop-blur-xl"
                  >
                    <p className="border-b border-border/50 px-5 py-3 font-mono-tech text-[10px] uppercase tracking-[0.2em] text-neon-green">
                      {group.label}
                    </p>
                    <NavigationGroupLinks group={group} onNavigate={() => setActiveMenu(null)} />
                  </div>
                )}
              </div>
            );
          })}
        </nav>
        <div className="flex items-center gap-2 lg:gap-3">
          <div className="hidden lg:block">
            <WireNewsShortcut />
          </div>
          {showAuth && <AuthWidget />}
          <button
            type="button"
            onClick={() => {
              setActiveMenu(null);
              setMobileOpen((v) => !v);
            }}
            aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation"
            className="min-h-11 min-w-11 rounded-lg border border-border/60 lg:hidden"
          >
            {mobileOpen ? <X className="mx-auto h-5 w-5" /> : <Menu className="mx-auto h-5 w-5" />}
          </button>
        </div>
      </div>
      {mobileOpen && (
        <nav
          id="mobile-navigation"
          aria-label="Navegação principal mobile"
          className="max-h-[80vh] overflow-y-auto border-t border-border/40 bg-background px-6 pb-6 lg:hidden"
        >
          {showAuth && (
            <div className="sm:hidden">
              <AuthWidget variant="mobile" />
            </div>
          )}
          <div className="pt-4">
            <WireNewsShortcut mobile onNavigate={() => setMobileOpen(false)} />
          </div>
          <div className="mt-4 space-y-1">
            {HEADER_NAV_GROUPS.map((group) => {
              const Icon = HEADER_GROUP_ICONS[group.id];
              return (
                <details
                  key={group.id}
                  name="mobile-header-group"
                  className="group rounded-lg border border-border/50 bg-surface/20 open:border-neon-green/35"
                >
                  <summary className="flex min-h-12 cursor-pointer list-none items-center gap-3 px-4 py-3 font-display text-base [&::-webkit-details-marker]:hidden">
                    <Icon aria-hidden="true" className="h-4 w-4 text-neon-green" />
                    {group.label}
                    <ChevronDown
                      aria-hidden="true"
                      className="ml-auto h-4 w-4 transition-transform group-open:rotate-180"
                    />
                  </summary>
                  <div className="border-t border-border/50">
                    <NavigationGroupLinks group={group} onNavigate={() => setMobileOpen(false)} />
                  </div>
                </details>
              );
            })}
          </div>
        </nav>
      )}
      {/* Fio de acento apenas na borda superior; a base mantém a divisória neutra do cabeçalho. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-red-700 via-red-600 to-red-500 shadow-[0_2px_12px_rgba(220,38,38,.28)]"
      />
    </header>
  );
}

// Moldura reutilizável de qualquer hero com fundo da Veronica — fade pras
// bordas se fundirem com o resto da página. Usada tanto pelo CyborgBackdrop
// (imagem estática) quanto pela hero WebGL da Studio. Os corner brackets
// verde/ciano que ficavam nos cantos foram removidos a pedido do usuário.
export function HeroFrame() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{
        background:
          "linear-gradient(90deg, var(--background) 0%, oklch(0.14 0.015 200 / 0.6) 40%, transparent 75%, oklch(0.14 0.015 200 / 0.85) 100%), linear-gradient(180deg, transparent 0%, transparent 55%, var(--background) 100%)",
      }}
    />
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

export function SiteFooter({
  tagline = "Escola de Inteligência Artificial",
  brand = "veronica",
}: {
  tagline?: string;
  brand?: "veronica" | "yo";
}) {
  return (
    <footer className="vt-rodape text-foreground border-t border-border/40 bg-background px-6 py-10">
      <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-3">
        <div>
          <Link to="/" className="inline-flex items-center gap-2 font-display text-lg">
            {brand === "yo" ? (
              <>
                <img
                  src="/images/brand/yo-lab-logo.webp"
                  alt=""
                  width="34"
                  height="34"
                  className="size-[34px]"
                />{" "}
                YO LAB & CO.
              </>
            ) : (
              "Veronica Hub"
            )}
          </Link>
          <p className="mt-3 text-sm text-muted-foreground">{tagline}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            © 2026 {brand === "yo" ? "YO LAB & CO. / Veronica Hub" : "Veronica Hub"}
          </p>
        </div>
        <nav aria-label="Navegação do rodapé" className="flex flex-col items-start gap-3">
          <Link to="/escola" className="text-sm hover:text-neon-green">
            Escola Veronica
          </Link>
          {PRIMARY_NAV.map((item) => (
            <Link
              key={item.id}
              to={item.to}
              className="flex items-center gap-1.5 text-sm hover:text-neon-green"
            >
              {item.name}
              {item.id === "wire" && <WireLiveBadge />}
            </Link>
          ))}
          <a href={SOCIAL_LINKS.email} className="text-sm">
            Contato
          </a>
          <Link to="/privacidade" className="text-sm text-muted-foreground hover:text-neon-green">
            Política de Privacidade
          </Link>
        </nav>
        <div>
          <p className="mb-3 text-sm">Acompanhe a Veronica</p>
          <div className="flex flex-wrap gap-4">
            {[
              { label: "YouTube", href: SOCIAL_LINKS.youtube },
              { label: "Instagram", href: SOCIAL_LINKS.instagram },
              { label: "Instagram Wire TV", href: SOCIAL_LINKS.wireInstagram },
              { label: "WhatsApp", href: SOCIAL_LINKS.whatsapp },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-neon-green"
              >
                {item.label}
              </a>
            ))}
          </div>
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
