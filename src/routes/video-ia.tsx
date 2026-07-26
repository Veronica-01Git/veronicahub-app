import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Video, Image as ImageIcon, AudioLines, User, Play, Check, ArrowRight, Sparkles } from "lucide-react";
import cyborgAsset from "@/assets/veronica-cyborg-v2.jpg.asset.json";
import { SiteHeader, SiteFooter, CyborgBackdrop } from "@/components/SiteChrome";
import { HoloStudioCore } from "@/components/HoloStudioCore";
import { courses } from "@/lib/courses";
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
      { title: "Veronica Studio — Vídeo, imagem, voz e avatar com IA | Veronica Hub" },
      {
        name: "description",
        content:
          "Descreva sua ideia e gere vídeo, imagem, voz ou avatar com IA. 1 vídeo em 1080p e 2 imagens Nano Banana Pro grátis ao criar sua conta.",
      },
      { property: "og:title", content: "Veronica Studio — Vídeo, imagem, voz e avatar com IA" },
      { property: "og:description", content: "Sua ideia, em execução. Geração com IA, pague só pelo que gerar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "preload", as: "image", href: cyborgAsset.url, fetchpriority: "high" }],
  }),
});

type Format = "video" | "image" | "voice" | "avatar";

const FORMAT_META: Record<Format, { label: string; icon: typeof Video }> = {
  video: { label: "Vídeo", icon: Video },
  image: { label: "Imagem", icon: ImageIcon },
  voice: { label: "Voz", icon: AudioLines },
  avatar: { label: "Avatar", icon: User },
};

// Vídeo tem quatro motores à escolha — os mais fortes do mercado pra geração
// por prompt — cada um com sua faixa de qualidade. O crédito grátis do
// cadastro só cobre a qualidade 1080p, de qualquer motor.
type VideoModelKey = "seedance" | "veo" | "kling" | "sora";
type VideoTier = { key: string; label: string; priceCents: number; freeEligible: boolean };

const VIDEO_MODELS: Record<VideoModelKey, { label: string; tiers: VideoTier[] }> = {
  seedance: {
    label: "Seedance 2.0",
    tiers: [
      { key: "low", label: "Baixo", priceCents: 1490, freeEligible: false },
      { key: "1080p", label: "1080p", priceCents: 2990, freeEligible: true },
      { key: "4k", label: "4K", priceCents: 5990, freeEligible: false },
    ],
  },
  veo: {
    label: "Veo 3.1",
    tiers: [
      { key: "simple", label: "Simples", priceCents: 1990, freeEligible: false },
      { key: "1080p", label: "1080p", priceCents: 3490, freeEligible: true },
      { key: "4kpro", label: "4K Pro", priceCents: 7990, freeEligible: false },
    ],
  },
  kling: {
    label: "Kling 2.5",
    tiers: [
      { key: "low", label: "Baixo", priceCents: 1390, freeEligible: false },
      { key: "1080p", label: "1080p", priceCents: 2790, freeEligible: true },
      { key: "4k", label: "4K", priceCents: 5490, freeEligible: false },
    ],
  },
  sora: {
    label: "Sora 2",
    tiers: [
      { key: "simple", label: "Simples", priceCents: 2190, freeEligible: false },
      { key: "1080p", label: "1080p", priceCents: 3990, freeEligible: true },
      { key: "4kpro", label: "4K Pro", priceCents: 8990, freeEligible: false },
    ],
  },
};

// Imagem e voz também ganham escolha de motor — os créditos grátis do
// cadastro (2 imagens) valem só no motor padrão, Nano Banana Pro.
type ImageEngineKey = "nanobanana" | "midjourney" | "flux";
type Engine = { label: string; priceCents: number; freeEligible: boolean };

const IMAGE_ENGINES: Record<ImageEngineKey, Engine> = {
  nanobanana: { label: "Nano Banana Pro", priceCents: 490, freeEligible: true },
  midjourney: { label: "Midjourney v7", priceCents: 690, freeEligible: false },
  flux: { label: "FLUX 1.1 Pro", priceCents: 590, freeEligible: false },
};

type VoiceEngineKey = "elevenlabs" | "openai";

const VOICE_ENGINES: Record<VoiceEngineKey, Engine> = {
  elevenlabs: { label: "ElevenLabs v3", priceCents: 790, freeEligible: false },
  openai: { label: "OpenAI Voice", priceCents: 590, freeEligible: false },
};

type AvatarEngineKey = "heygen" | "synthesia";

const AVATAR_ENGINES: Record<AvatarEngineKey, Engine> = {
  heygen: { label: "HeyGen", priceCents: 1290, freeEligible: false },
  synthesia: { label: "Synthesia", priceCents: 1490, freeEligible: false },
};

// Passo a passo que a Veronica indica pra transformar um produto qualquer
// numa VSL que vende — da escolha do produto até a montagem final.
const STUDIO_PLAYBOOK = [
  {
    n: "01",
    title: "Escolha o produto",
    body: "Pesquise no Google o que já tem demanda no seu nicho — o que as pessoas já procuram e compram bate mais forte que achismo. Ex: \"perfume importado\" já chega buscando comparação de preço.",
  },
  {
    n: "02",
    title: "Nome certo",
    body: "Dê ao produto um nome de marca simples, fácil de lembrar e de falar em voz alta — ele vai aparecer no roteiro, na embalagem visual e na copy inteira.",
  },
  {
    n: "03",
    title: "Copy: dor → solução",
    body: "A Big Idea nasce da dor, não da solução. Ex (perfume): dor = \"seu perfume some no almoço, você reaplica toda hora e ainda assim ninguém sente\"; solução = \"fixação de 12h comprovada, borrifou de manhã, ainda sente à noite\".",
  },
  {
    n: "04",
    title: "Narrador",
    body: "Escolha a voz que combina com quem compra — feminina pra leveza e identificação, masculina pra autoridade e confiança. Gere a narração na aba Voz do gerador acima.",
  },
  {
    n: "05",
    title: "Takes e imagens",
    body: "Baixe vídeos e fotos de banco gratuitos no Pexels — qualidade cinematográfica sem custo nenhum de produção.",
  },
  {
    n: "06",
    title: "Efeitos sonoros",
    body: "Busque efeitos e trilha livre de direitos no Mixkit. O som certo no corte certo é o que separa amador de profissional.",
  },
  {
    n: "07",
    title: "Montagem final",
    body: "Monte tudo no CapCut: corte no ritmo da copy (dor → solução → prova → oferta), overlay de texto nos pontos-chave, exporte em 1080p ou 4K.",
  },
];

// Comandos do catálogo que ensinam a técnica por trás do que se produz na
// Studio — vídeo cinematográfico, avatar/voz e VFX.
const STUDIO_COMMANDS = courses.filter((c) =>
  ["VSL Cinematográfico", "Avatar Digital IA", "VFX com IA"].includes(c.title),
);

type GenerationResult = {
  format: Format;
  prompt: string;
  createdAt: string;
  free: boolean;
  videoModel?: VideoModelKey;
  videoTier?: string;
  imageEngine?: ImageEngineKey;
  voiceEngine?: VoiceEngineKey;
  avatarEngine?: AvatarEngineKey;
};

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
          {result.videoModel && VIDEO_MODELS[result.videoModel].label} ·{" "}
          {result.videoModel && result.videoTier && VIDEO_MODELS[result.videoModel].tiers.find((t) => t.key === result.videoTier)?.label} · simulado
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
          {IMAGE_ENGINES[result.imageEngine ?? "nanobanana"].label} · simulado
        </span>
      </div>
    );
  }
  if (result.format === "voice") {
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
          {VOICE_ENGINES[result.voiceEngine ?? "elevenlabs"].label} · simulado
        </span>
      </div>
    );
  }
  return (
    <div className="relative aspect-video w-full max-w-md overflow-hidden rounded-sm border border-[oklch(0.72_0.18_290)]/40 bg-black">
      <div
        aria-hidden
        className="absolute inset-0 opacity-55"
        style={{
          background:
            "radial-gradient(circle at 50% 35%, oklch(0.72 0.18 290 / 0.4), transparent 55%), radial-gradient(circle at 50% 90%, oklch(0.85 0.22 155 / 0.25), transparent 60%)",
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <User className="h-10 w-10 text-[oklch(0.78_0.14_290)]" />
      </div>
      <span className="absolute left-3 top-3 rounded-sm border border-[oklch(0.72_0.18_290)]/50 bg-background/70 px-2 py-1 font-mono-tech text-[9px] uppercase tracking-widest text-[oklch(0.78_0.14_290)]">
        {AVATAR_ENGINES[result.avatarEngine ?? "heygen"].label} · simulado
      </span>
    </div>
  );
}

function VeronicaStudio() {
  const [format, setFormat] = useState<Format>("video");
  const [videoModel, setVideoModel] = useState<VideoModelKey>("seedance");
  const [videoTier, setVideoTier] = useState<string>("1080p");
  const [imageEngine, setImageEngine] = useState<ImageEngineKey>("nanobanana");
  const [voiceEngine, setVoiceEngine] = useState<VoiceEngineKey>("elevenlabs");
  const [avatarEngine, setAvatarEngine] = useState<AvatarEngineKey>("heygen");
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
    const t = window.setTimeout(() => setToast(null), 7000);
    return () => window.clearTimeout(t);
  }, [toast]);

  const currentVideoTier = useMemo(
    () => VIDEO_MODELS[videoModel].tiers.find((t) => t.key === videoTier) ?? VIDEO_MODELS[videoModel].tiers[0],
    [videoModel, videoTier],
  );

  function priceFor(fmt: Format): number {
    if (fmt === "video") return currentVideoTier.priceCents;
    if (fmt === "image") return IMAGE_ENGINES[imageEngine].priceCents;
    if (fmt === "voice") return VOICE_ENGINES[voiceEngine].priceCents;
    return AVATAR_ENGINES[avatarEngine].priceCents;
  }

  function hasFreeFor(fmt: Format, s: Session): boolean {
    if (fmt === "video") return s.freeVideoCredits > 0 && currentVideoTier.freeEligible;
    if (fmt === "image") return s.freeImageCredits > 0 && IMAGE_ENGINES[imageEngine].freeEligible;
    return false;
  }

  const freeLeft = useMemo(() => {
    if (!session) return null;
    if (format === "video") return currentVideoTier.freeEligible ? session.freeVideoCredits : 0;
    if (format === "image") return IMAGE_ENGINES[imageEngine].freeEligible ? session.freeImageCredits : 0;
    return 0;
  }, [session, format, currentVideoTier, imageEngine]);

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
    const price = priceFor(format);
    const hasFree = hasFreeFor(format, currentSession);
    setGenerating(true);
    window.setTimeout(() => {
      setSession((prev) => {
        const base = prev ?? currentSession;
        if (hasFree) {
          return format === "video" ? { ...base, freeVideoCredits: base.freeVideoCredits - 1 } : { ...base, freeImageCredits: base.freeImageCredits - 1 };
        }
        return { ...base, balanceCents: base.balanceCents - price };
      });
      setResult({
        format,
        prompt: prompt.trim(),
        createdAt: new Date().toLocaleTimeString("pt-BR"),
        free: hasFree,
        ...(format === "video" ? { videoModel, videoTier: currentVideoTier.key } : {}),
        ...(format === "image" ? { imageEngine } : {}),
        ...(format === "voice" ? { voiceEngine } : {}),
        ...(format === "avatar" ? { avatarEngine } : {}),
      });
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
      const price = priceFor(format);
      const hasFree = hasFreeFor(format, newSession);
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
    const price = priceFor(format);
    const hasFree = hasFreeFor(format, session);
    if (!hasFree && session.balanceCents < price) {
      setDepositError(null);
      setDepositOpen(true);
      return;
    }
    performGeneration(session);
  }

  const price = priceFor(format);
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
                {pendingCode && (
                  <button
                    type="button"
                    onClick={() => setAuthCode(pendingCode)}
                    className="rounded-sm border border-dashed border-neon-green px-3 py-1.5 font-mono-tech text-[13px] tracking-[0.3em] text-neon-green"
                    title="Clique para preencher automaticamente"
                  >
                    {pendingCode}
                  </button>
                )}
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
                Veronica Studio · Vídeo · Imagem · Voz · Avatar
              </div>
              <h1 className="mt-8 font-display text-5xl sm:text-6xl md:text-7xl" style={{ letterSpacing: "-0.045em", lineHeight: "0.9" }}>
                <span className="block text-foreground">Sua ideia.</span>
                <span className="block text-outline-neon animate-glow-pulse">
                  Em execução<span className="text-neon-green">_</span>
                </span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-[1.65] text-muted-foreground sm:text-lg">
                Descreva o que você quer e a IA gera vídeo, imagem, voz ou avatar. 1 vídeo em 1080p e 2 imagens Nano Banana Pro grátis ao criar sua conta — depois, pague só pelo que gerar.
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
          <div className="mb-4 flex items-center gap-3 font-mono-tech text-[11px] uppercase tracking-widest text-neon-cyan">
            <span className="h-px w-8 bg-neon-cyan" />
            [ 01 ] Gerador
          </div>
          <p className="mb-8 max-w-2xl text-sm leading-[1.6] text-muted-foreground">
            As APIs mais fortes do mercado, num só lugar: Seedance, Veo, Kling e Sora pra vídeo · Nano Banana Pro,
            Midjourney e FLUX pra imagem · ElevenLabs e OpenAI Voice pra narração · HeyGen e Synthesia pra avatar.
          </p>

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

          <div className="mt-4 flex flex-col gap-4 rounded-sm border border-border/60 bg-background/40 p-4">
            {format === "video" && (
              <>
                <div>
                  <div className="mb-2 font-mono-tech text-[9.5px] uppercase tracking-widest text-muted-foreground/70">Motor</div>
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(VIDEO_MODELS) as VideoModelKey[]).map((m) => {
                      const active = videoModel === m;
                      return (
                        <button
                          key={m}
                          onClick={() => {
                            setVideoModel(m);
                            setVideoTier(VIDEO_MODELS[m].tiers.find((t) => t.freeEligible)?.key ?? VIDEO_MODELS[m].tiers[0].key);
                          }}
                          className={`rounded-sm border px-3.5 py-1.5 font-mono-tech text-[10.5px] uppercase tracking-widest transition ${
                            active ? "border-neon-cyan bg-neon-cyan/10 text-neon-cyan" : "border-border/60 text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {VIDEO_MODELS[m].label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <div className="mb-2 font-mono-tech text-[9.5px] uppercase tracking-widest text-muted-foreground/70">Qualidade</div>
                  <div className="flex flex-wrap gap-2">
                    {VIDEO_MODELS[videoModel].tiers.map((t) => {
                      const active = videoTier === t.key;
                      const freeNow = t.freeEligible && (session?.freeVideoCredits ?? 0) > 0;
                      return (
                        <button
                          key={t.key}
                          onClick={() => setVideoTier(t.key)}
                          className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 font-mono-tech text-[10.5px] uppercase tracking-widest transition ${
                            active
                              ? "border-neon-green bg-neon-green/15 text-neon-green"
                              : "border-border/60 text-muted-foreground hover:border-neon-green/40 hover:text-foreground"
                          }`}
                        >
                          {t.label}
                          <span className={active ? "text-neon-green/80" : "text-muted-foreground/70"}>
                            {freeNow ? "grátis" : formatBRL(t.priceCents)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {format === "image" && (
              <div>
                <div className="mb-2 font-mono-tech text-[9.5px] uppercase tracking-widest text-muted-foreground/70">Motor</div>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(IMAGE_ENGINES) as ImageEngineKey[]).map((k) => {
                    const e = IMAGE_ENGINES[k];
                    const active = imageEngine === k;
                    const freeNow = e.freeEligible && (session?.freeImageCredits ?? 0) > 0;
                    return (
                      <button
                        key={k}
                        onClick={() => setImageEngine(k)}
                        className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 font-mono-tech text-[10.5px] uppercase tracking-widest transition ${
                          active
                            ? "border-neon-green bg-neon-green/15 text-neon-green"
                            : "border-border/60 text-muted-foreground hover:border-neon-green/40 hover:text-foreground"
                        }`}
                      >
                        {e.label}
                        <span className={active ? "text-neon-green/80" : "text-muted-foreground/70"}>
                          {freeNow ? "grátis" : formatBRL(e.priceCents)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {format === "voice" && (
              <div>
                <div className="mb-2 font-mono-tech text-[9.5px] uppercase tracking-widest text-muted-foreground/70">Motor</div>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(VOICE_ENGINES) as VoiceEngineKey[]).map((k) => {
                    const e = VOICE_ENGINES[k];
                    const active = voiceEngine === k;
                    return (
                      <button
                        key={k}
                        onClick={() => setVoiceEngine(k)}
                        className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 font-mono-tech text-[10.5px] uppercase tracking-widest transition ${
                          active
                            ? "border-neon-green bg-neon-green/15 text-neon-green"
                            : "border-border/60 text-muted-foreground hover:border-neon-green/40 hover:text-foreground"
                        }`}
                      >
                        {e.label}
                        <span className={active ? "text-neon-green/80" : "text-muted-foreground/70"}>{formatBRL(e.priceCents)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {format === "avatar" && (
              <div>
                <div className="mb-2 font-mono-tech text-[9.5px] uppercase tracking-widest text-muted-foreground/70">Motor</div>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(AVATAR_ENGINES) as AvatarEngineKey[]).map((k) => {
                    const e = AVATAR_ENGINES[k];
                    const active = avatarEngine === k;
                    return (
                      <button
                        key={k}
                        onClick={() => setAvatarEngine(k)}
                        className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 font-mono-tech text-[10.5px] uppercase tracking-widest transition ${
                          active
                            ? "border-neon-green bg-neon-green/15 text-neon-green"
                            : "border-border/60 text-muted-foreground hover:border-neon-green/40 hover:text-foreground"
                        }`}
                      >
                        {e.label}
                        <span className={active ? "text-neon-green/80" : "text-muted-foreground/70"}>{formatBRL(e.priceCents)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
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
                {format === "video"
                  ? `${VIDEO_MODELS[videoModel].label} · ${currentVideoTier.label}`
                  : format === "image"
                    ? IMAGE_ENGINES[imageEngine].label
                    : format === "voice"
                      ? VOICE_ENGINES[voiceEngine].label
                      : AVATAR_ENGINES[avatarEngine].label}{" "}
                ·{" "}
                {session ? formatBRL(session.balanceCents) + " de saldo" : "grátis pra começar"}
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
              Ambiente de teste — geração simulada, sem custo real ainda. Integração real com os motores acima entra na próxima fase.
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

      {/* Vitrine — comandos que ensinam a técnica por trás do que se gera aqui */}
      <section className="border-t border-border/40 py-24 cv-auto">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-4 flex items-center gap-3 font-mono-tech text-[11px] uppercase tracking-widest text-neon-green">
            <span className="h-px w-8 bg-neon-green" />
            [ 02 ] Domine a técnica
          </div>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl" style={{ letterSpacing: "-0.04em", lineHeight: "0.95" }}>
            A IA gera. <span className="text-neon-green text-glow-green">Você dirige.</span>
          </h2>
          <p className="mt-4 max-w-2xl leading-[1.65] text-muted-foreground">
            Prompt bom nasce de roteiro bom. É a mesma ordem pra vender qualquer produto — a Veronica te guia passo a
            passo, do produto escolhido até a VSL cinematográfica pronta pra rodar.
          </p>

          <div className="mt-10 grid gap-x-8 gap-y-6 sm:grid-cols-2">
            {STUDIO_PLAYBOOK.map((s) => (
              <div key={s.n} className="flex gap-4">
                <span className="font-display text-2xl text-neon-green/70" style={{ letterSpacing: "-0.02em" }}>
                  {s.n}
                </span>
                <div>
                  <h3 className="font-display text-base text-foreground" style={{ letterSpacing: "-0.02em" }}>
                    {s.title}
                  </h3>
                  <p className="mt-1.5 text-[13.5px] leading-[1.6] text-muted-foreground">{s.body}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-14 flex items-center gap-3 font-mono-tech text-[10px] uppercase tracking-widest text-neon-cyan">
            <span className="h-px w-8 bg-neon-cyan" />
            Quer se aprofundar em cada etapa?
          </div>
          <p className="mt-3 max-w-2xl leading-[1.65] text-muted-foreground">
            Esses comandos ensinam exatamente o que fazer render aqui dentro — do roteiro de VSL ao VFX que separa
            amador de profissional.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {STUDIO_COMMANDS.map((c) => (
              <Link
                key={c.title}
                to="/comandos"
                className="group relative overflow-hidden rounded-sm border border-border/60 bg-background/60 p-6 backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-neon-cyan/60 hover:shadow-[0_0_30px_-8px_oklch(0.88_0.15_195/0.5)]"
              >
                <span className="rounded-full border border-border/60 px-2.5 py-0.5 font-mono-tech text-[9px] uppercase tracking-widest text-muted-foreground group-hover:border-neon-cyan/60 group-hover:text-neon-cyan">
                  {c.tag}
                </span>
                <h3 className="mt-5 font-display text-xl text-foreground" style={{ letterSpacing: "-0.03em" }}>
                  {c.title}
                </h3>
                <p className="mt-2 text-[13px] leading-[1.5] text-muted-foreground">{c.perks[0]}</p>
                <div className="mt-5 flex items-center gap-2 font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground transition group-hover:text-neon-cyan">
                  Ver comando <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-6 flex flex-col items-start gap-4 rounded-sm border border-neon-cyan/30 bg-gradient-to-br from-neon-cyan/8 via-surface/60 to-surface p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="font-display text-lg text-foreground" style={{ letterSpacing: "-0.02em" }}>
                Comando aprendido, execução na hora.
              </div>
              <p className="mt-1 text-sm text-muted-foreground">Termine o comando e volte pra cá — o gerador já tá esperando.</p>
            </div>
            <Link
              to="/comandos"
              className="group inline-flex flex-shrink-0 items-center gap-2 rounded-sm border border-neon-cyan/60 bg-background/60 px-6 py-3 font-mono-tech text-xs uppercase tracking-[0.18em] text-neon-cyan transition duration-200 hover:-translate-y-0.5 hover:bg-neon-cyan/10 active:translate-y-0"
            >
              Ver todos os comandos <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing transparency */}
      <section className="border-t border-border/40 py-24 cv-auto">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-10 flex items-center gap-3 font-mono-tech text-[11px] uppercase tracking-widest text-neon-green">
            <span className="h-px w-8 bg-neon-green" />
            [ 03 ] Como funciona o custo
          </div>
          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-sm border border-border/60 bg-border/60 sm:grid-cols-2 lg:grid-cols-3">
            {(Object.keys(VIDEO_MODELS) as VideoModelKey[]).flatMap((m) =>
              VIDEO_MODELS[m].tiers.map((t) => (
                <div key={`${m}-${t.key}`} className="flex flex-col gap-1 bg-background/70 p-5">
                  <span className="text-[13px] text-foreground">{VIDEO_MODELS[m].label} · {t.label}</span>
                  <span className="font-mono-tech text-[11px] uppercase tracking-widest text-neon-green">
                    {t.freeEligible ? `${formatBRL(t.priceCents)} · 1º grátis no cadastro` : formatBRL(t.priceCents)}
                  </span>
                </div>
              )),
            )}
            {(Object.keys(IMAGE_ENGINES) as ImageEngineKey[]).map((k) => {
              const e = IMAGE_ENGINES[k];
              return (
                <div key={k} className="flex flex-col gap-1 bg-background/70 p-5">
                  <span className="text-[13px] text-foreground">Imagem · {e.label}</span>
                  <span className="font-mono-tech text-[11px] uppercase tracking-widest text-neon-green">
                    {e.freeEligible ? `${formatBRL(e.priceCents)} · 2 grátis no cadastro` : formatBRL(e.priceCents)}
                  </span>
                </div>
              );
            })}
            {(Object.keys(VOICE_ENGINES) as VoiceEngineKey[]).map((k) => {
              const e = VOICE_ENGINES[k];
              return (
                <div key={k} className="flex flex-col gap-1 bg-background/70 p-5">
                  <span className="text-[13px] text-foreground">Voz · {e.label}</span>
                  <span className="font-mono-tech text-[11px] uppercase tracking-widest text-neon-green">{formatBRL(e.priceCents)}</span>
                </div>
              );
            })}
            {(Object.keys(AVATAR_ENGINES) as AvatarEngineKey[]).map((k) => {
              const e = AVATAR_ENGINES[k];
              return (
                <div key={k} className="flex flex-col gap-1 bg-background/70 p-5">
                  <span className="text-[13px] text-foreground">Avatar · {e.label}</span>
                  <span className="font-mono-tech text-[11px] uppercase tracking-widest text-neon-green">{formatBRL(e.priceCents)}</span>
                </div>
              );
            })}
            <div className="flex flex-col gap-1 bg-background/70 p-5">
              <span className="text-[13px] text-foreground">Depósito mínimo</span>
              <span className="font-mono-tech text-[11px] uppercase tracking-widest text-neon-green">{formatBRL(MIN_DEPOSIT_CENTS)}</span>
            </div>
          </div>
          <ul className="mt-8 space-y-2.5">
            {["Sem mensalidade — paga só quando gera", "Conta compartilhada com o resto do ecossistema Veronica", "Créditos grátis valem uma vez por conta, só na qualidade 1080p"].map((p) => (
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
