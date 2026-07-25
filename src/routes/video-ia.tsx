import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Video, Image as ImageIcon, AudioLines, Play, Sparkles, Check } from "lucide-react";
import cyborgAsset from "@/assets/veronica-cyborg-v2.jpg.asset.json";
import { SiteHeader, SiteFooter, CyborgBackdrop } from "@/components/SiteChrome";
import { HoloStudioCore } from "@/components/HoloStudioCore";
import {
  loadSession,
  persistSession,
  createSession,
  generateCode,
  formatBRL,
  MIN_DEPOSIT_CENTS,
  type AuthChannel,
  type Session,
} from "@/lib/account";

export const Route = createFileRoute("/video-ia")({
  component: VeronicaStudio,
  head: () => ({
    meta: [
      { title: "Veronica Studio — Vídeo, imagem e voz com IA | Veronica Hub" },
      {
        name: "description",
        content:
          "Descreva sua ideia e gere vídeo, imagem ou voz com IA. 1 vídeo em 1080p e 2 imagens Nano Banana Pro grátis ao criar sua conta.",
      },
      { property: "og:title", content: "Veronica Studio — Vídeo, imagem e voz com IA" },
      { property: "og:description", content: "Sua ideia, em execução. Geração com IA, pague só pelo que gerar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "preload", as: "image", href: cyborgAsset.url, fetchpriority: "high" }],
  }),
});

type Format = "video" | "image" | "voice";

const PRICES: Record<Format, number> = {
  video: 2990, // R$29,90 por vídeo 1080p — placeholder
  image: 490, // R$4,90 por imagem (Nano Banana Pro) — placeholder
  voice: 790, // R$7,90 por voz — placeholder
};

const FORMAT_META: Record<Format, { label: string; icon: typeof Video; unit: string }> = {
  video: { label: "Vídeo", icon: Video, unit: "1080p" },
  image: { label: "Imagem", icon: ImageIcon, unit: "Nano Banana Pro" },
  voice: { label: "Voz", icon: AudioLines, unit: "Narração" },
};

type GenerationResult = { format: Format; prompt: string; createdAt: string; free: boolean };

function GenerationPreview({ result }: { result: GenerationResult }) {
  if (result.format === "video") {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-sm border border-neon-green/40 bg-black">
        <div
          aria-hidden
          className="absolute inset-0 opacity-50"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, oklch(0.85 0.22 155 / 0.35), transparent 60%), repeating-linear-gradient(0deg, transparent 0 2px, oklch(0.14 0.015 200 / 0.4) 2px 3px)",
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-neon-green/60 bg-background/60 backdrop-blur">
            <Play className="h-6 w-6 translate-x-0.5 fill-neon-green text-neon-green" />
          </div>
        </div>
        <span className="absolute left-3 top-3 rounded-sm border border-neon-green/40 bg-background/70 px-2 py-1 font-mono-tech text-[9px] uppercase tracking-widest text-neon-green">
          1080p · simulado
        </span>
      </div>
    );
  }
  if (result.format === "image") {
    return (
      <div className="relative aspect-square w-full max-w-xs overflow-hidden rounded-sm border border-neon-cyan/40 bg-black">
        <div
          aria-hidden
          className="absolute inset-0 opacity-60"
          style={{ background: "radial-gradient(circle at 35% 30%, oklch(0.88 0.15 195 / 0.4), transparent 55%), radial-gradient(circle at 70% 75%, oklch(0.85 0.22 155 / 0.3), transparent 55%)" }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <ImageIcon className="h-10 w-10 text-neon-cyan/80" />
        </div>
        <span className="absolute left-3 top-3 rounded-sm border border-neon-cyan/40 bg-background/70 px-2 py-1 font-mono-tech text-[9px] uppercase tracking-widest text-neon-cyan">
          Nano Banana Pro · simulado
        </span>
      </div>
    );
  }
  return (
    <div className="relative w-full max-w-md overflow-hidden rounded-sm border border-[oklch(0.72_0.18_290)]/40 bg-black p-6">
      <div className="flex items-end gap-1">
        {Array.from({ length: 28 }).map((_, i) => (
          <span
            key={i}
            className="w-1.5 rounded-full"
            style={{
              height: `${8 + ((i * 37) % 34)}px`,
              background: i % 3 === 0 ? "oklch(0.85 0.22 155)" : "oklch(0.72 0.18 290)",
              opacity: 0.85,
            }}
          />
        ))}
      </div>
      <span className="mt-4 block font-mono-tech text-[9px] uppercase tracking-widest text-muted-foreground">
        Narração · simulado
      </span>
    </div>
  );
}

function VeronicaStudio() {
  const [format, setFormat] = useState<Format>("video");
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);

  const [session, setSession] = useState<Session | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authStep, setAuthStep] = useState<"identify" | "confirm">("identify");
  const [authChannel, setAuthChannel] = useState<AuthChannel>("email");
  const [authIdentifier, setAuthIdentifier] = useState("");
  const [authCode, setAuthCode] = useState("");
  const [pendingCode, setPendingCode] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<"generate" | null>(null);
  const [depositOpen, setDepositOpen] = useState(false);
  const [depositValue, setDepositValue] = useState(String(MIN_DEPOSIT_CENTS / 100));
  const [depositError, setDepositError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setSession(loadSession());
  }, []);

  useEffect(() => {
    persistSession(session);
  }, [session]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(t);
  }, [toast]);

  const freeLeft = useMemo(() => {
    if (!session) return null;
    if (format === "video") return session.freeVideoCredits;
    if (format === "image") return session.freeImageCredits;
    return 0;
  }, [session, format]);

  function openAuth(action: "generate" | null) {
    setPendingAction(action);
    setAuthOpen(true);
    setAuthStep("identify");
    setAuthError(null);
  }

  function closeAuth() {
    setAuthOpen(false);
    setAuthStep("identify");
    setAuthError(null);
    setAuthCode("");
    setPendingCode(null);
    setPendingAction(null);
  }

  function requestCode(e: FormEvent) {
    e.preventDefault();
    const id = authIdentifier.trim();
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(id);
    const digits = id.replace(/\D/g, "");
    const validPhone = digits.length >= 10 && digits.length <= 13;
    if (authChannel === "email" && !validEmail) {
      setAuthError("Digite um e-mail válido.");
      return;
    }
    if (authChannel === "phone" && !validPhone) {
      setAuthError("Digite um celular válido, com DDD.");
      return;
    }
    const code = generateCode();
    setPendingCode(code);
    setAuthStep("confirm");
    setAuthError(null);
    setAuthCode("");
    setToast(`Ambiente de teste — código (simulado) que seria enviado por ${authChannel === "email" ? "e-mail" : "SMS"}: ${code}`);
  }

  function resendCode() {
    const code = generateCode();
    setPendingCode(code);
    setAuthCode("");
    setAuthError(null);
    setToast(`Ambiente de teste — novo código (simulado): ${code}`);
  }

  function performGeneration(currentSession: Session) {
    const price = PRICES[format];
    const hasFree = format === "video" ? currentSession.freeVideoCredits > 0 : format === "image" ? currentSession.freeImageCredits > 0 : false;
    setGenerating(true);
    window.setTimeout(() => {
      setSession((prev) => {
        const base = prev ?? currentSession;
        if (hasFree) {
          return format === "video" ? { ...base, freeVideoCredits: base.freeVideoCredits - 1 } : { ...base, freeImageCredits: base.freeImageCredits - 1 };
        }
        return { ...base, balanceCents: base.balanceCents - price };
      });
      setResult({ format, prompt: prompt.trim(), createdAt: new Date().toLocaleTimeString("pt-BR"), free: hasFree });
      setGenerating(false);
      setToast(hasFree ? "Gerado usando seu crédito grátis (simulado)." : `Gerado. ${formatBRL(price)} debitado do saldo (simulado).`);
    }, 1600);
  }

  function confirmCode(e: FormEvent) {
    e.preventDefault();
    if (!pendingCode) return;
    if (authCode.trim() !== pendingCode) {
      setAuthError("Código incorreto. Confira e tente de novo.");
      return;
    }
    const newSession = session ?? createSession(authChannel, authIdentifier.trim());
    setSession(newSession);
    setToast("Sessão confirmada (simulada).");
    if (pendingAction === "generate" && prompt.trim()) {
      const price = PRICES[format];
      const hasFree = format === "video" ? newSession.freeVideoCredits > 0 : format === "image" ? newSession.freeImageCredits > 0 : false;
      if (hasFree || newSession.balanceCents >= price) {
        performGeneration(newSession);
      } else {
        setDepositError(null);
        setDepositOpen(true);
      }
    }
    closeAuth();
  }

  function handleLogout() {
    setSession(null);
    setResult(null);
  }

  function handleDeposit(e: FormEvent) {
    e.preventDefault();
    if (!session) return;
    const cents = Math.round(parseFloat(depositValue.replace(",", ".")) * 100);
    if (Number.isNaN(cents) || cents < MIN_DEPOSIT_CENTS) {
      setDepositError(`Depósito mínimo é ${formatBRL(MIN_DEPOSIT_CENTS)}.`);
      return;
    }
    setDepositError(null);
    setSession({ ...session, balanceCents: session.balanceCents + cents });
    setDepositOpen(false);
    setToast(`Depósito simulado de ${formatBRL(cents)} creditado. Nenhum valor real foi cobrado.`);
  }

  function handleGenerate() {
    if (!prompt.trim() || generating) return;
    if (!session) {
      openAuth("generate");
      return;
    }
    const price = PRICES[format];
    const hasFree = format === "video" ? session.freeVideoCredits > 0 : format === "image" ? session.freeImageCredits > 0 : false;
    if (!hasFree && session.balanceCents < price) {
      setDepositError(null);
      setDepositOpen(true);
      return;
    }
    performGeneration(session);
  }

  const price = PRICES[format];
  const generateLabel = !session
    ? "Entrar para gerar"
    : freeLeft && freeLeft > 0
      ? `Gerar grátis · ${freeLeft} restante${freeLeft > 1 ? "s" : ""}`
      : session.balanceCents < price
        ? `Depositar para gerar · faltam ${formatBRL(price - session.balanceCents)}`
        : `Gerar ${FORMAT_META[format].label.toLowerCase()} · ${formatBRL(price)}`;

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <SiteHeader />

      {authOpen && !session && (
        <div className="border-b border-border/40 bg-surface/80 px-6 py-4 backdrop-blur">
          <div className="mx-auto max-w-7xl">
            {authStep === "identify" ? (
              <form onSubmit={requestCode} className="flex flex-wrap items-center gap-2.5">
                <span className="font-mono-tech text-[10.5px] uppercase tracking-widest text-muted-foreground">
                  Entrar ou criar conta —
                </span>
                <div className="flex overflow-hidden rounded-sm border border-border/60">
                  <button
                    type="button"
                    onClick={() => { setAuthChannel("email"); setAuthIdentifier(""); setAuthError(null); }}
                    className="px-3 py-1.5 font-mono-tech text-[10.5px] uppercase tracking-widest transition"
                    style={{ background: authChannel === "email" ? "oklch(0.85 0.22 155)" : "transparent", color: authChannel === "email" ? "oklch(0.12 0.02 200)" : undefined }}
                  >
                    E-mail
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAuthChannel("phone"); setAuthIdentifier(""); setAuthError(null); }}
                    className="px-3 py-1.5 font-mono-tech text-[10.5px] uppercase tracking-widest transition"
                    style={{ background: authChannel === "phone" ? "oklch(0.85 0.22 155)" : "transparent", color: authChannel === "phone" ? "oklch(0.12 0.02 200)" : undefined }}
                  >
                    Celular
                  </button>
                </div>
                <input
                  type={authChannel === "email" ? "email" : "tel"}
                  required
                  autoFocus
                  value={authIdentifier}
                  onChange={(e) => setAuthIdentifier(e.target.value)}
                  placeholder={authChannel === "email" ? "seu@email.com" : "(11) 98888-7777"}
                  className="rounded-sm border border-border/60 bg-background/60 px-3 py-1.5 text-[13px] outline-none"
                />
                <button type="submit" className="rounded-sm bg-neon-green px-4 py-1.5 font-mono-tech text-[10.5px] uppercase tracking-widest text-primary-foreground">
                  Enviar código
                </button>
                <button type="button" onClick={closeAuth} className="font-mono-tech text-[10.5px] uppercase tracking-widest text-muted-foreground">
                  Cancelar
                </button>
                {authError && <span className="w-full font-mono-tech text-[10.5px] uppercase tracking-widest text-destructive">{authError}</span>}
              </form>
            ) : (
              <form onSubmit={confirmCode} className="flex flex-wrap items-center gap-2.5">
                <span className="font-mono-tech text-[10.5px] uppercase tracking-widest text-muted-foreground">
                  Código enviado (simulado) para {authIdentifier} —
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  autoFocus
                  value={authCode}
                  onChange={(e) => setAuthCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  className="w-28 rounded-sm border border-border/60 bg-background/60 px-3 py-1.5 text-center text-[15px] font-mono-tech tracking-[0.3em] outline-none"
                />
                <button type="submit" className="rounded-sm bg-neon-green px-4 py-1.5 font-mono-tech text-[10.5px] uppercase tracking-widest text-primary-foreground">
                  Confirmar
                </button>
                <button type="button" onClick={resendCode} className="font-mono-tech text-[10.5px] uppercase tracking-widest text-muted-foreground">
                  Reenviar
                </button>
                <button type="button" onClick={() => { setAuthStep("identify"); setAuthError(null); }} className="font-mono-tech text-[10.5px] uppercase tracking-widest text-muted-foreground">
                  Trocar
                </button>
                <button type="button" onClick={closeAuth} className="font-mono-tech text-[10.5px] uppercase tracking-widest text-muted-foreground">
                  Cancelar
                </button>
                {authError && <span className="w-full font-mono-tech text-[10.5px] uppercase tracking-widest text-destructive">{authError}</span>}
              </form>
            )}
          </div>
        </div>
      )}

      {depositOpen && session && (
        <div className="border-b border-border/40 bg-surface/80 px-6 py-4 backdrop-blur">
          <form onSubmit={handleDeposit} className="mx-auto flex max-w-7xl flex-wrap items-center gap-2.5">
            <span className="font-mono-tech text-[10.5px] uppercase tracking-widest text-muted-foreground">
              Depósito simulado — mínimo {formatBRL(MIN_DEPOSIT_CENTS)}
            </span>
            <span className="font-mono-tech text-[12px]">R$</span>
            <input
              type="text"
              inputMode="decimal"
              required
              autoFocus
              value={depositValue}
              onChange={(e) => setDepositValue(e.target.value)}
              className="w-24 rounded-sm border border-border/60 bg-background/60 px-3 py-1.5 text-[13px] outline-none"
            />
            <button type="submit" className="rounded-sm bg-neon-green px-4 py-1.5 font-mono-tech text-[10.5px] uppercase tracking-widest text-primary-foreground">
              Confirmar (simulado)
            </button>
            <button type="button" onClick={() => setDepositOpen(false)} className="font-mono-tech text-[10.5px] uppercase tracking-widest text-muted-foreground">
              Cancelar
            </button>
            {depositError && <span className="w-full font-mono-tech text-[10.5px] uppercase tracking-widest text-destructive">{depositError}</span>}
          </form>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-sm border border-neon-green/50 bg-background/95 px-4 py-2.5 font-mono-tech text-[11px] uppercase tracking-widest text-neon-green shadow-glow-green backdrop-blur">
          {toast}
        </div>
      )}

      {/* Hero — ultra-modern, futuretech background, living holographic core */}
      <section className="relative overflow-hidden scanlines">
        <CyborgBackdrop />
        <div className="relative mx-auto max-w-7xl px-6 pb-20 pt-16 md:pb-28 md:pt-24">
          <div className="flex flex-col items-start gap-10 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-3 rounded-full border border-neon-green/40 bg-background/60 px-4 py-1.5 font-mono-tech text-[10px] uppercase tracking-widest text-neon-green backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-neon-green animate-pulse-dot" />
                Veronica Studio · Vídeo · Imagem · Voz
              </div>
              <h1 className="mt-8 font-display text-5xl sm:text-6xl md:text-7xl" style={{ letterSpacing: "-0.045em", lineHeight: "0.9" }}>
                <span className="block text-foreground">Sua ideia.</span>
                <span className="block text-outline-neon animate-glow-pulse">
                  Em execução<span className="text-neon-green">_</span>
                </span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-[1.65] text-muted-foreground sm:text-lg">
                Descreva o que você quer e a IA gera vídeo, imagem ou voz. 1 vídeo em 1080p e 2 imagens Nano Banana Pro grátis ao criar sua conta — depois, pague só pelo que gerar.
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <a
                  href="#gerar"
                  className="group relative inline-flex items-center gap-3 overflow-hidden rounded-sm bg-neon-green px-7 py-4 font-mono-tech text-xs uppercase tracking-[0.18em] text-primary-foreground shadow-glow-green transition duration-200 hover:-translate-y-0.5 hover:brightness-110"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Começar agora
                  <span aria-hidden className="pointer-events-none absolute inset-y-0 -left-full w-1/2 -skew-x-12 bg-white/25 transition-all duration-700 group-hover:left-[150%]" />
                </a>
              </div>
            </div>
            <div className="hidden shrink-0 lg:block">
              <HoloStudioCore />
            </div>
          </div>
        </div>
      </section>

      {/* Tool */}
      <section id="gerar" className="border-t border-border/40 bg-surface/40 py-24 cv-auto">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-10 flex items-center gap-3 font-mono-tech text-[11px] uppercase tracking-widest text-neon-cyan">
            <span className="h-px w-8 bg-neon-cyan" />
            [ 01 ] Gerador
          </div>

          <div className="flex flex-wrap gap-2">
            {(Object.keys(FORMAT_META) as Format[]).map((f) => {
              const meta = FORMAT_META[f];
              const active = format === f;
              return (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`flex items-center gap-2 rounded-full border px-4 py-2 font-mono-tech text-[11px] uppercase tracking-widest transition ${
                    active
                      ? "border-neon-green bg-neon-green/15 text-neon-green shadow-[0_0_20px_-4px_oklch(0.85_0.22_155/0.7)]"
                      : "border-border/60 text-muted-foreground hover:border-neon-green/40 hover:text-foreground"
                  }`}
                >
                  <meta.icon className="h-3.5 w-3.5" />
                  {meta.label}
                </button>
              );
            })}
          </div>

          <div className="relative mt-6 rounded-sm border border-border/60 bg-background/60 p-5 backdrop-blur sm:p-7">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={`Descreva o ${FORMAT_META[format].label.toLowerCase()} que você quer gerar...`}
              rows={5}
              className="w-full resize-y rounded-sm border border-border/60 bg-background/50 p-4 text-[14.5px] leading-[1.6] text-foreground outline-none placeholder:text-muted-foreground/60"
            />
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <span className="font-mono-tech text-[10.5px] uppercase tracking-widest text-muted-foreground">
                {FORMAT_META[format].unit} · {session ? formatBRL(session.balanceCents) + " de saldo" : "grátis pra começar"}
              </span>
              <button
                onClick={handleGenerate}
                disabled={!prompt.trim() || generating}
                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-sm bg-neon-green px-6 py-3 font-mono-tech text-[11px] uppercase tracking-[0.12em] text-primary-foreground shadow-glow-green transition duration-200 hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {generating ? "Gerando…" : generateLabel}
              </button>
            </div>
            <p className="mt-3 text-[12px] leading-[1.5] text-muted-foreground">
              Ambiente de teste — geração simulada, sem custo real ainda. Motor de IA (Nano Banana Pro / vídeo / voz) entra na próxima fase.
            </p>
          </div>

          {result && (
            <div className="mt-8 flex flex-col items-start gap-4 rounded-sm border border-border/60 bg-background/60 p-6 backdrop-blur sm:p-8">
              <div className="flex w-full flex-wrap items-center justify-between gap-2 font-mono-tech text-[10.5px] uppercase tracking-widest text-muted-foreground">
                <span>Gerado às {result.createdAt} {result.free && <span className="text-neon-green">· crédito grátis</span>}</span>
                <span className="text-neon-cyan">"{result.prompt.slice(0, 60)}{result.prompt.length > 60 ? "…" : ""}"</span>
              </div>
              <GenerationPreview result={result} />
            </div>
          )}
        </div>
      </section>

      {/* Pricing transparency */}
      <section className="border-t border-border/40 py-24 cv-auto">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-10 flex items-center gap-3 font-mono-tech text-[11px] uppercase tracking-widest text-neon-green">
            <span className="h-px w-8 bg-neon-green" />
            [ 02 ] Como funciona o custo
          </div>
          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-sm border border-border/60 bg-border/60 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["1 vídeo 1080p", "Grátis no cadastro"],
              ["Vídeo (depois)", formatBRL(PRICES.video)],
              ["2 imagens Nano Banana Pro", "Grátis no cadastro"],
              ["Imagem (depois)", formatBRL(PRICES.image)],
              ["Voz", formatBRL(PRICES.voice)],
              ["Depósito mínimo", formatBRL(MIN_DEPOSIT_CENTS)],
            ].map(([label, value]) => (
              <div key={label} className="flex flex-col gap-1 bg-background/70 p-5">
                <span className="text-[13px] text-foreground">{label}</span>
                <span className="font-mono-tech text-[11px] uppercase tracking-widest text-neon-green">{value}</span>
              </div>
            ))}
          </div>
          <ul className="mt-8 space-y-2.5">
            {["Sem mensalidade — paga só quando gera", "Conta compartilhada com o resto do ecossistema Veronica", "Créditos grátis valem uma vez por conta"].map((p) => (
              <li key={p} className="flex items-start gap-3 text-sm text-foreground/90">
                <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-neon-green" />
                {p}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
