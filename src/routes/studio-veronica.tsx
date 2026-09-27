import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  Video,
  Image as ImageIcon,
  AudioLines,
  User,
  Check,
  ArrowRight,
  ChevronDown,
  Home as HomeIcon,
  Compass,
  LayoutGrid,
  History,
  Wand2,
  Clapperboard,
  BookOpen,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { VeronicaDrawer } from "@/components/VeronicaDrawer";
import { LazyImage } from "@/components/media/LazyImage";
import type { StudioCriativoStepId } from "@/veronica/skills";
import { courses } from "@/lib/courses";
import { formatBRL, MIN_DEPOSIT_CENTS } from "@/lib/account";
import { requestEmailCode, verifyEmailCode, logout, getCurrentUser } from "@/lib/auth-server";
import { createDeposit, generateNanoBanana } from "@/lib/wallet-server";

const NANO_BANANA_PRICE_CENTS = 490;

type Wallet = {
  id: string;
  email: string;
  balanceCents: number;
  freeVideoCredits: number;
  freeImageCredits: number;
};

export const Route = createFileRoute("/studio-veronica")({
  component: VeronicaStudio,
  head: () => ({
    meta: [
      { title: "Studio Veronica — seu espaço de criação | Veronica Hub" },
      {
        name: "description",
        content:
          "Crie imagens com IA no Studio Veronica. Explore prévias de vídeo, voz e avatar e transforme ideias em projetos criativos.",
      },
      { property: "og:title", content: "Studio Veronica — seu espaço de criação" },
      {
        property: "og:description",
        content: "Ideias ganham forma no Studio Veronica. Crie imagens e explore novos formatos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
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
    stepId: "escolha-produto" as const,
    title: "Escolha o produto",
    body: 'Pesquise no Google o que já tem demanda no seu nicho — o que as pessoas já procuram e compram bate mais forte que achismo. Ex: "perfume importado" já chega buscando comparação de preço.',
  },
  {
    n: "02",
    stepId: "nome-certo" as const,
    title: "Nome certo",
    body: "Dê ao produto um nome de marca simples, fácil de lembrar e de falar em voz alta — ele vai aparecer no roteiro, na embalagem visual e na copy inteira.",
  },
  {
    n: "03",
    stepId: "copy-dor-solucao" as const,
    title: "Copy: dor → solução",
    body: 'A Big Idea nasce da dor, não da solução. Ex (perfume): dor = "seu perfume some no almoço, você reaplica toda hora e ainda assim ninguém sente"; solução = "fixação de 12h comprovada, borrifou de manhã, ainda sente à noite".',
  },
  {
    n: "04",
    stepId: "narrador" as const,
    title: "Narrador",
    body: "Escolha a voz que combina com quem compra — feminina pra leveza e identificação, masculina pra autoridade e confiança. Gere a narração na aba Voz do gerador acima.",
  },
  {
    n: "05",
    stepId: "takes-imagens" as const,
    title: "Takes e imagens",
    body: "Baixe vídeos e fotos de banco gratuitos no Pexels — qualidade cinematográfica sem custo nenhum de produção.",
  },
  {
    n: "06",
    stepId: "efeitos-sonoros" as const,
    title: "Efeitos sonoros",
    body: "Busque efeitos e trilha livre de direitos no Mixkit. O som certo no corte certo é o que separa amador de profissional.",
  },
  {
    n: "07",
    stepId: "montagem-final" as const,
    title: "Montagem final",
    body: "Monte tudo no CapCut: corte no ritmo da copy (dor → solução → prova → oferta), overlay de texto nos pontos-chave, exporte em 1080p ou 4K.",
  },
];

// Comandos do catálogo que ensinam a técnica por trás do que se produz na
// Studio — vídeo cinematográfico, avatar/voz e VFX.
const STUDIO_COMMANDS = courses.filter((c) =>
  ["VSL Cinematográfico", "Avatar Digital IA", "VFX com IA"].includes(c.title),
);

// Controles secundários do workspace — cosméticos, não afetam preço (o preço
// já é resolvido por Motor + Qualidade). Só reforçam o padrão de ferramenta
// profissional de geração.
const ASPECT_RATIOS = ["16:9", "9:16", "1:1"] as const;
const VIDEO_DURATIONS = ["5s", "10s", "15s"] as const;

const PROMPT_PLACEHOLDER: Record<Format, string> = {
  video:
    'Ex.: "closeup cinematográfico de uma xícara de café fumegante ao amanhecer, luz suave, câmera lenta"',
  image: 'Ex.: "still de produto minimalista, fundo branco, luz de estúdio, alta definição"',
  voice: 'Ex.: "narração calma e confiante pra um vídeo de 30 segundos sobre rotina matinal"',
  avatar: 'Ex.: "avatar apresentando o produto, olhando pra câmera, tom acolhedor e direto"',
};

const CREATIVE_STARTERS: {
  title: string;
  category: string;
  format: Format;
  prompt: string;
  image: string;
}[] = [
  {
    title: "Editorial de moda",
    category: "Imagem · Direção de arte",
    format: "image",
    prompt:
      "Editorial de moda contemporânea em arquitetura de concreto, luz natural cinematográfica, tecidos em movimento, fotografia realista",
    image: "/media/fashion/collection-001/hero/human-system-hero-desktop-v2-1280.webp",
  },
  {
    title: "Cena cinematográfica",
    category: "Vídeo · Prévia",
    format: "video",
    prompt:
      "Plano cinematográfico de uma equipe criativa em um estúdio de filmagem, câmera com movimento suave, luz azul e verde, atmosfera realista",
    image: "/images/studio/studio-film-set.webp",
  },
  {
    title: "Universo visual",
    category: "Imagem · Conceito",
    format: "image",
    prompt:
      "Conceito visual de um estúdio de criação futurista e acolhedor, materiais táteis, luz editorial, composição sofisticada",
    image: "/images/home/platforms/portfolio-1280.webp",
  },
  {
    title: "Narrativa de marca",
    category: "Imagem · Campanha",
    format: "image",
    prompt:
      "Campanha editorial de uma marca de moda independente, atelier iluminado pela manhã, direção de arte refinada, fotografia realista",
    image: "/images/home/platforms/fashion-1280.webp",
  },
];

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
  imageUrl?: string;
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
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center">
          <Video className="h-8 w-8 text-neon-green" />
          <span className="max-w-[240px] text-sm text-white/80">
            Conceito de vídeo · nenhum arquivo foi gerado
          </span>
        </div>
        <span className="absolute left-3 top-3 rounded-sm border border-neon-green/40 bg-background/70 px-2 py-1 font-mono-tech text-[9px] uppercase tracking-widest text-neon-green">
          {result.videoModel && VIDEO_MODELS[result.videoModel].label} ·{" "}
          {result.videoModel &&
            result.videoTier &&
            VIDEO_MODELS[result.videoModel].tiers.find((t) => t.key === result.videoTier)
              ?.label}{" "}
          · prévia
        </span>
      </div>
    );
  }
  if (result.format === "image") {
    if (result.imageUrl) {
      return (
        <div className="relative w-full max-w-xs overflow-hidden rounded-sm border border-neon-cyan/40 bg-black">
          <LazyImage
            src={result.imageUrl}
            alt={result.prompt}
            useCfResize={false}
            className="w-full"
          />
          <span className="absolute left-3 top-3 rounded-sm border border-neon-cyan/40 bg-background/70 px-2 py-1 font-mono-tech text-[9px] uppercase tracking-widest text-neon-cyan">
            {IMAGE_ENGINES.nanobanana.label}
          </span>
        </div>
      );
    }
    return (
      <div className="relative aspect-square w-full max-w-xs overflow-hidden rounded-sm border border-neon-cyan/40 bg-black">
        <div
          aria-hidden
          className="absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(circle at 35% 30%, oklch(0.88 0.15 195 / 0.4), transparent 55%), radial-gradient(circle at 70% 75%, oklch(0.85 0.22 155 / 0.3), transparent 55%)",
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <ImageIcon className="h-10 w-10 text-neon-cyan/80" />
        </div>
        <span className="absolute left-3 top-3 rounded-sm border border-neon-cyan/40 bg-background/70 px-2 py-1 font-mono-tech text-[9px] uppercase tracking-widest text-neon-cyan">
          {IMAGE_ENGINES[result.imageEngine ?? "nanobanana"].label} · prévia
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

// Controle compacto do workspace: mini-label + fileira de pills. Reaproveitado
// pelos seletores de motor/qualidade/proporção/duração — mantém tudo enxuto
// e sem ocupar espaço vertical excessivo.
function PillGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="font-mono-tech text-[9px] uppercase tracking-widest text-muted-foreground/70">
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function Pill({
  active,
  onClick,
  tone = "green",
  children,
}: {
  active: boolean;
  onClick: () => void;
  tone?: "green" | "cyan";
  children: ReactNode;
}) {
  const activeClass =
    tone === "cyan"
      ? "border-neon-cyan bg-neon-cyan/10 text-neon-cyan"
      : "border-neon-green bg-neon-green/15 text-neon-green";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono-tech text-[10px] uppercase tracking-widest transition ${
        active
          ? activeClass
          : "border-border/60 text-muted-foreground hover:border-neon-green/40 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

// Sidebar do Studio Criativo — só navegação/visual, não toca em nenhum
// estado de carteira/geração. Itens sem função real ainda ficam marcados
// "em breve" em vez de fingir que funcionam.
function StudioSidebar({
  format,
  onSelect,
  onOpenVeronica,
}: {
  format: Format;
  onSelect: (f: Format) => void;
  onOpenVeronica: () => void;
}) {
  const modalities: { key: Format; label: string; icon: typeof Video }[] = [
    { key: "image", label: "Imagem", icon: ImageIcon },
    { key: "video", label: "Vídeo", icon: Video },
    { key: "voice", label: "Voz", icon: AudioLines },
    { key: "avatar", label: "Avatar", icon: User },
  ];
  const soon = [
    { icon: Compass, label: "Descobrir" },
    { icon: LayoutGrid, label: "Quadros" },
    { icon: History, label: "Linha do tempo" },
    { icon: Clapperboard, label: "Produção" },
  ];
  return (
    <aside className="fixed bottom-0 left-0 top-16 z-20 hidden w-60 flex-col overflow-y-auto border-r border-border/40 bg-surface/60 backdrop-blur md:flex">
      <nav className="flex flex-col gap-0.5 p-3">
        <Link
          to="/"
          className="flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm text-muted-foreground transition hover:bg-background/60 hover:text-foreground"
        >
          <HomeIcon className="h-4 w-4" /> Início
        </Link>
        {modalities.map((item) => {
          const active = format === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onSelect(item.key)}
              aria-pressed={active}
              className={`flex items-center gap-3 rounded-sm px-3 py-2.5 text-left text-sm transition ${
                active
                  ? "bg-neon-green/10 text-neon-green"
                  : "text-muted-foreground hover:bg-background/60 hover:text-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" /> {item.label}
            </button>
          );
        })}
      </nav>
      <div className="mx-3 my-1 h-px bg-border/40" />
      <nav className="flex flex-col gap-0.5 p-3">
        <button
          type="button"
          onClick={onOpenVeronica}
          className="flex items-center gap-3 rounded-sm px-3 py-2.5 text-left text-sm text-neon-green transition hover:bg-neon-green/5"
        >
          <Wand2 className="h-4 w-4" /> ✦ Assistente Veronica
        </button>
        {soon.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm text-muted-foreground/50"
          >
            <item.icon className="h-4 w-4" /> {item.label}
            <span className="ml-auto rounded-full border border-border/50 px-1.5 py-0.5 font-mono-tech text-[8px] uppercase tracking-widest">
              em breve
            </span>
          </div>
        ))}
      </nav>
      <div className="mx-3 my-1 h-px bg-border/40" />
      <nav className="flex flex-col gap-0.5 p-3">
        <Link
          to="/prompt-packs"
          className="flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm text-muted-foreground transition hover:bg-background/60 hover:text-foreground"
        >
          <BookOpen className="h-4 w-4" /> Prompt Packs
        </Link>
      </nav>
    </aside>
  );
}

function VeronicaStudio() {
  const [veronicaOpen, setVeronicaOpen] = useState(false);
  const [veronicaStepId, setVeronicaStepId] = useState<StudioCriativoStepId | null>(null);
  const [format, setFormat] = useState<Format>("image");
  const [videoModel, setVideoModel] = useState<VideoModelKey>("seedance");
  const [videoTier, setVideoTier] = useState<string>("1080p");
  const [imageEngine, setImageEngine] = useState<ImageEngineKey>("nanobanana");
  const [voiceEngine, setVoiceEngine] = useState<VoiceEngineKey>("elevenlabs");
  const [avatarEngine, setAvatarEngine] = useState<AvatarEngineKey>("heygen");
  const [aspectRatio, setAspectRatio] = useState<(typeof ASPECT_RATIOS)[number]>("16:9");
  const [duration, setDuration] = useState<(typeof VIDEO_DURATIONS)[number]>("10s");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);

  const [user, setUser] = useState<Wallet | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);
  const [authStep, setAuthStep] = useState<"identify" | "confirm">("identify");
  const [authEmail, setAuthEmail] = useState("");
  const [authCode, setAuthCode] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<"generate" | null>(null);
  const [depositOpen, setDepositOpen] = useState(false);
  const [depositValue, setDepositValue] = useState(String(MIN_DEPOSIT_CENTS / 100));
  const [depositError, setDepositError] = useState<string | null>(null);
  const [depositLoading, setDepositLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  async function refreshUser() {
    const u = await getCurrentUser();
    setUser(u);
    setUserLoading(false);
    return u;
  }

  useEffect(() => {
    refreshUser();
    // Voltando de um checkout do Mercado Pago — o webhook pode levar alguns
    // segundos pra creditar; confere de novo depois de um instante.
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).has("topup")) {
      setToast("Confirmando pagamento…");
      window.setTimeout(() => refreshUser(), 4000);
    }
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 7000);
    return () => window.clearTimeout(t);
  }, [toast]);

  const currentVideoTier = useMemo(
    () =>
      VIDEO_MODELS[videoModel].tiers.find((t) => t.key === videoTier) ??
      VIDEO_MODELS[videoModel].tiers[0],
    [videoModel, videoTier],
  );

  // Só imagem via Nano Banana Pro está integrada de verdade (Higgsfield);
  // o resto (vídeo, outros motores de imagem, voz, avatar) continua sendo
  // uma prévia simulada e gratuita, sem débito — não faz sentido cobrar
  // dinheiro real por uma geração que não vai acontecer de verdade.
  const isRealPath = format === "image" && imageEngine === "nanobanana";

  function priceFor(fmt: Format): number {
    if (fmt === "video") return currentVideoTier.priceCents;
    if (fmt === "image") return IMAGE_ENGINES[imageEngine].priceCents;
    if (fmt === "voice") return VOICE_ENGINES[voiceEngine].priceCents;
    return AVATAR_ENGINES[avatarEngine].priceCents;
  }

  const freeLeft = useMemo(() => {
    if (!user) return null;
    if (format === "video") return currentVideoTier.freeEligible ? user.freeVideoCredits : 0;
    if (format === "image")
      return IMAGE_ENGINES[imageEngine].freeEligible ? user.freeImageCredits : 0;
    return 0;
  }, [user, format, currentVideoTier, imageEngine]);

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
    setAuthEmail("");
    setPendingAction(null);
  }

  async function requestCode(e: FormEvent) {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    try {
      const res = await requestEmailCode({ data: { email: authEmail.trim() } });
      if (res.ok) {
        setAuthStep("confirm");
        setAuthCode("");
      } else {
        setAuthError(res.error);
      }
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Falha ao pedir código.");
    } finally {
      setAuthLoading(false);
    }
  }

  function performSimulatedGeneration() {
    setGenerating(true);
    window.setTimeout(() => {
      setResult({
        format,
        prompt: prompt.trim(),
        createdAt: new Date().toLocaleTimeString("pt-BR"),
        free: true,
        ...(format === "video" ? { videoModel, videoTier: currentVideoTier.key } : {}),
        ...(format === "image" ? { imageEngine } : {}),
        ...(format === "voice" ? { voiceEngine } : {}),
        ...(format === "avatar" ? { avatarEngine } : {}),
      });
      setGenerating(false);
      setToast(
        "Prévia — esse motor ainda não tem geração real, só a Nano Banana Pro por enquanto.",
      );
    }, 1600);
  }

  async function performRealGeneration() {
    setGenerating(true);
    try {
      const res = await generateNanoBanana({ data: { prompt: prompt.trim() } });
      if (res.ok) {
        setResult({
          format: "image",
          prompt: prompt.trim(),
          createdAt: new Date().toLocaleTimeString("pt-BR"),
          free: res.free,
          imageEngine: "nanobanana",
          imageUrl: res.imageUrl,
        });
        await refreshUser();
        setToast(
          res.free
            ? "Gerado usando seu crédito grátis."
            : `Gerado. ${formatBRL(NANO_BANANA_PRICE_CENTS)} debitado do saldo.`,
        );
      } else if (res.error === "insufficient_funds") {
        setDepositError(null);
        setDepositOpen(true);
      } else {
        setToast(`Erro ao gerar: ${res.error}`);
      }
    } finally {
      setGenerating(false);
    }
  }

  async function confirmCode(e: FormEvent) {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    try {
      const res = await verifyEmailCode({
        data: { email: authEmail.trim(), code: authCode.trim() },
      });
      if (!res.ok) {
        setAuthError(res.error);
        return;
      }
      setUser(res.user);
      closeAuth();
      if (pendingAction === "generate" && prompt.trim()) {
        if (!isRealPath) {
          performSimulatedGeneration();
        } else {
          const hasFree = res.user.freeImageCredits > 0;
          if (hasFree || res.user.balanceCents >= NANO_BANANA_PRICE_CENTS) {
            await performRealGeneration();
          } else {
            setDepositError(null);
            setDepositOpen(true);
          }
        }
      }
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Falha ao confirmar código.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleLogout() {
    await logout();
    setUser(null);
    setResult(null);
  }

  async function handleDeposit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    const cents = Math.round(parseFloat(depositValue.replace(",", ".")) * 100);
    if (Number.isNaN(cents) || cents < MIN_DEPOSIT_CENTS) {
      setDepositError(`Depósito mínimo é ${formatBRL(MIN_DEPOSIT_CENTS)}.`);
      return;
    }
    setDepositError(null);
    setDepositLoading(true);
    try {
      const res = await createDeposit({ data: { amountCents: cents } });
      if (res.ok) {
        window.location.href = res.checkoutUrl;
      } else {
        setDepositError(res.error);
      }
    } finally {
      setDepositLoading(false);
    }
  }

  function chooseModality(f: Format) {
    setFormat(f);
    window.setTimeout(() => {
      document.getElementById("gerar")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  function openVeronica(stepId?: StudioCriativoStepId) {
    setVeronicaStepId(stepId ?? "escolha-produto");
    setVeronicaOpen(true);
  }

  function handleGenerate() {
    if (!prompt.trim() || generating) return;
    if (!isRealPath) {
      performSimulatedGeneration();
      return;
    }
    if (!user) {
      openAuth("generate");
      return;
    }
    const hasFree = user.freeImageCredits > 0;
    if (!hasFree && user.balanceCents < NANO_BANANA_PRICE_CENTS) {
      setDepositError(null);
      setDepositOpen(true);
      return;
    }
    performRealGeneration();
  }

  const price = isRealPath ? NANO_BANANA_PRICE_CENTS : priceFor(format);
  const generateLabel = !isRealPath
    ? "Visualizar conceito"
    : !user
      ? "Entrar para gerar imagem"
      : freeLeft && freeLeft > 0
        ? `Gerar grátis · ${freeLeft} restante${freeLeft > 1 ? "s" : ""}`
        : user.balanceCents < price
          ? `Depositar para gerar · faltam ${formatBRL(price - user.balanceCents)}`
          : `Gerar ${FORMAT_META[format].label.toLowerCase()} · ${formatBRL(price)}`;

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <SiteHeader />
      <StudioSidebar
        format={format}
        onSelect={chooseModality}
        onOpenVeronica={() => openVeronica()}
      />
      <VeronicaDrawer
        skillId="studio-criativo"
        open={veronicaOpen}
        stepId={veronicaStepId}
        onClose={() => setVeronicaOpen(false)}
      />

      <div
        className={`transition-[padding] duration-300 ease-out md:pl-60 ${veronicaOpen ? "sm:pr-[420px]" : ""}`}
      >
        {authOpen && !user && (
          <div className="border-b border-border/40 bg-surface/80 px-6 py-4 backdrop-blur">
            <div className="mx-auto max-w-7xl">
              {authStep === "identify" ? (
                <form onSubmit={requestCode} className="flex flex-wrap items-center gap-2.5">
                  <span className="font-mono-tech text-[10.5px] uppercase tracking-widest text-muted-foreground">
                    Entrar ou criar conta —
                  </span>
                  <input
                    type="email"
                    required
                    autoFocus
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="rounded-sm border border-border/60 bg-background/60 px-3 py-1.5 text-[13px] outline-none"
                  />
                  <button
                    type="submit"
                    disabled={authLoading}
                    className="rounded-sm bg-neon-green px-4 py-1.5 font-mono-tech text-[10.5px] uppercase tracking-widest text-primary-foreground disabled:opacity-50"
                  >
                    {authLoading ? "Enviando…" : "Enviar código"}
                  </button>
                  <button
                    type="button"
                    onClick={closeAuth}
                    className="font-mono-tech text-[10.5px] uppercase tracking-widest text-muted-foreground"
                  >
                    Cancelar
                  </button>
                  {authError && (
                    <span className="w-full font-mono-tech text-[10.5px] uppercase tracking-widest text-destructive">
                      {authError}
                    </span>
                  )}
                </form>
              ) : (
                <form onSubmit={confirmCode} className="flex flex-wrap items-center gap-2.5">
                  <span className="font-mono-tech text-[10.5px] uppercase tracking-widest text-muted-foreground">
                    Código enviado para {authEmail} —
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
                  <button
                    type="submit"
                    disabled={authLoading}
                    className="rounded-sm bg-neon-green px-4 py-1.5 font-mono-tech text-[10.5px] uppercase tracking-widest text-primary-foreground disabled:opacity-50"
                  >
                    {authLoading ? "Confirmando…" : "Confirmar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthStep("identify");
                      setAuthError(null);
                    }}
                    className="font-mono-tech text-[10.5px] uppercase tracking-widest text-muted-foreground"
                  >
                    Trocar e-mail
                  </button>
                  <button
                    type="button"
                    onClick={closeAuth}
                    className="font-mono-tech text-[10.5px] uppercase tracking-widest text-muted-foreground"
                  >
                    Cancelar
                  </button>
                  {authError && (
                    <span className="w-full font-mono-tech text-[10.5px] uppercase tracking-widest text-destructive">
                      {authError}
                    </span>
                  )}
                </form>
              )}
            </div>
          </div>
        )}

        {depositOpen && user && (
          <div className="border-b border-border/40 bg-surface/80 px-6 py-4 backdrop-blur">
            <form
              onSubmit={handleDeposit}
              className="mx-auto flex max-w-7xl flex-wrap items-center gap-2.5"
            >
              <span className="font-mono-tech text-[10.5px] uppercase tracking-widest text-muted-foreground">
                Depositar via Mercado Pago — mínimo {formatBRL(MIN_DEPOSIT_CENTS)}
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
              <button
                type="submit"
                disabled={depositLoading}
                className="rounded-sm bg-neon-green px-4 py-1.5 font-mono-tech text-[10.5px] uppercase tracking-widest text-primary-foreground disabled:opacity-50"
              >
                {depositLoading ? "Criando…" : "Ir para pagamento"}
              </button>
              <button
                type="button"
                onClick={() => setDepositOpen(false)}
                className="font-mono-tech text-[10.5px] uppercase tracking-widest text-muted-foreground"
              >
                Cancelar
              </button>
              {depositError && (
                <span className="w-full font-mono-tech text-[10.5px] uppercase tracking-widest text-destructive">
                  {depositError}
                </span>
              )}
            </form>
          </div>
        )}

        {toast && (
          <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-sm border border-neon-green/50 bg-background/95 px-4 py-2.5 font-mono-tech text-[11px] uppercase tracking-widest text-neon-green shadow-glow-green backdrop-blur">
            {toast}
          </div>
        )}

        <section className="relative isolate overflow-hidden bg-[#0c1012]">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_12%_24%,rgba(4,148,112,.2),transparent_40%),radial-gradient(ellipse_at_84%_8%,rgba(58,132,163,.19),transparent_35%),radial-gradient(ellipse_at_58%_72%,rgba(78,43,108,.16),transparent_45%)]"
          />
          <div className="relative mx-auto max-w-[1440px] px-5 pb-12 pt-12 sm:px-8 md:pt-16 xl:px-12">
            <div className="mx-auto mb-8 max-w-4xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-neon-green/25 bg-neon-green/5 px-4 py-2 font-mono-tech text-[10px] uppercase tracking-[.2em] text-neon-green">
                <Sparkles className="h-3.5 w-3.5" /> Studio Veronica
              </div>
              <h1 className="mt-5 font-display text-[clamp(2.8rem,6vw,5.5rem)] font-semibold leading-[.96] tracking-[-.055em] text-white">
                Sua ideia ganha <span className="text-neon-green">forma.</span>
              </h1>
              <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-white/65 sm:text-base">
                Crie imagens agora. Explore vídeo, voz e avatar em um só espaço com a direção da
                Veronica.
              </p>
            </div>

            <div
              id="gerar"
              className="relative mx-auto max-w-5xl rounded-[24px] border border-white/15 bg-[#1b2327]/95 p-4 shadow-[0_32px_90px_-28px_rgba(0,0,0,.8),0_0_90px_-60px_rgba(0,255,170,.6)] backdrop-blur-xl sm:p-6"
            >
              {/* formato */}
              <div className="flex flex-wrap gap-2">
                {(Object.keys(FORMAT_META) as Format[]).map((f) => {
                  const meta = FORMAT_META[f];
                  const active = format === f;
                  return (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFormat(f)}
                      aria-pressed={active}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition sm:px-4 ${
                        active
                          ? "border-neon-green/50 bg-neon-green/15 text-neon-green"
                          : "border-white/10 bg-white/[.04] text-white/65 hover:border-neon-green/40 hover:text-white"
                      }`}
                    >
                      <meta.icon className="h-3.5 w-3.5" />
                      {meta.label}
                    </button>
                  );
                })}
              </div>

              {/* prompt — em destaque */}
              <label
                htmlFor="studio-prompt"
                className="mt-5 block text-xs font-medium text-white/70"
              >
                Descreva o que você quer criar
              </label>
              <textarea
                id="studio-prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={PROMPT_PLACEHOLDER[format]}
                rows={3}
                className="mt-2 w-full resize-y rounded-2xl border border-white/10 bg-black/30 p-4 text-[15px] leading-[1.6] text-white outline-none transition placeholder:text-white/35 focus:border-neon-green/60 focus:ring-2 focus:ring-neon-green/10 sm:p-5 sm:text-base"
              />

              {/* opções avançadas — sempre visível no desktop, recolhe no mobile */}
              <button
                type="button"
                onClick={() => setAdvancedOpen((v) => !v)}
                aria-expanded={advancedOpen}
                aria-controls="studio-settings"
                className="mt-4 flex min-h-[44px] w-full items-center justify-between rounded-xl border border-white/10 bg-white/[.04] px-4 py-2.5 text-xs font-medium text-white/80 transition hover:bg-white/10"
              >
                <span>
                  Modelo e configurações{" "}
                  <span className="ml-2 text-neon-green">
                    {format === "image"
                      ? IMAGE_ENGINES[imageEngine].label
                      : format === "video"
                        ? VIDEO_MODELS[videoModel].label
                        : format === "voice"
                          ? VOICE_ENGINES[voiceEngine].label
                          : AVATAR_ENGINES[avatarEngine].label}
                  </span>
                </span>
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform ${advancedOpen ? "rotate-180" : ""}`}
                />
              </button>

              <div
                id="studio-settings"
                className={`${advancedOpen ? "mt-4 flex" : "hidden"} flex-wrap gap-x-6 gap-y-4 rounded-xl border border-white/10 bg-black/20 p-4`}
              >
                {format === "video" && (
                  <>
                    <PillGroup label="Motor">
                      {(Object.keys(VIDEO_MODELS) as VideoModelKey[]).map((m) => (
                        <Pill
                          key={m}
                          tone="cyan"
                          active={videoModel === m}
                          onClick={() => {
                            setVideoModel(m);
                            setVideoTier(
                              VIDEO_MODELS[m].tiers.find((t) => t.freeEligible)?.key ??
                                VIDEO_MODELS[m].tiers[0].key,
                            );
                          }}
                        >
                          {VIDEO_MODELS[m].label}
                        </Pill>
                      ))}
                    </PillGroup>
                    <PillGroup label="Qualidade">
                      {VIDEO_MODELS[videoModel].tiers.map((t) => (
                        <Pill
                          key={t.key}
                          active={videoTier === t.key}
                          onClick={() => setVideoTier(t.key)}
                        >
                          {t.label}
                          <span
                            className={
                              videoTier === t.key
                                ? "text-neon-green/80"
                                : "text-muted-foreground/70"
                            }
                          >
                            em breve
                          </span>
                        </Pill>
                      ))}
                    </PillGroup>
                    <PillGroup label="Proporção">
                      {ASPECT_RATIOS.map((r) => (
                        <Pill key={r} active={aspectRatio === r} onClick={() => setAspectRatio(r)}>
                          {r}
                        </Pill>
                      ))}
                    </PillGroup>
                    <PillGroup label="Duração">
                      {VIDEO_DURATIONS.map((d) => (
                        <Pill key={d} active={duration === d} onClick={() => setDuration(d)}>
                          {d}
                        </Pill>
                      ))}
                    </PillGroup>
                  </>
                )}

                {format === "image" && (
                  <>
                    <PillGroup label="Motor">
                      {(Object.keys(IMAGE_ENGINES) as ImageEngineKey[]).map((k) => {
                        const e = IMAGE_ENGINES[k];
                        const isReal = k === "nanobanana";
                        const freeNow = isReal && (user?.freeImageCredits ?? 0) > 0;
                        return (
                          <Pill
                            key={k}
                            active={imageEngine === k}
                            onClick={() => setImageEngine(k)}
                          >
                            {e.label}
                            <span
                              className={
                                imageEngine === k
                                  ? "text-neon-green/80"
                                  : "text-muted-foreground/70"
                              }
                            >
                              {!isReal ? "em breve" : freeNow ? "grátis" : formatBRL(e.priceCents)}
                            </span>
                          </Pill>
                        );
                      })}
                    </PillGroup>
                    <PillGroup label="Proporção">
                      {ASPECT_RATIOS.map((r) => (
                        <Pill key={r} active={aspectRatio === r} onClick={() => setAspectRatio(r)}>
                          {r}
                        </Pill>
                      ))}
                    </PillGroup>
                  </>
                )}

                {format === "voice" && (
                  <PillGroup label="Motor">
                    {(Object.keys(VOICE_ENGINES) as VoiceEngineKey[]).map((k) => {
                      const e = VOICE_ENGINES[k];
                      return (
                        <Pill key={k} active={voiceEngine === k} onClick={() => setVoiceEngine(k)}>
                          {e.label}
                          <span
                            className={
                              voiceEngine === k ? "text-neon-green/80" : "text-muted-foreground/70"
                            }
                          >
                            {formatBRL(e.priceCents)}
                          </span>
                        </Pill>
                      );
                    })}
                  </PillGroup>
                )}

                {format === "avatar" && (
                  <>
                    <PillGroup label="Motor">
                      {(Object.keys(AVATAR_ENGINES) as AvatarEngineKey[]).map((k) => {
                        const e = AVATAR_ENGINES[k];
                        return (
                          <Pill
                            key={k}
                            active={avatarEngine === k}
                            onClick={() => setAvatarEngine(k)}
                          >
                            {e.label}
                            <span
                              className={
                                avatarEngine === k
                                  ? "text-neon-green/80"
                                  : "text-muted-foreground/70"
                              }
                            >
                              {formatBRL(e.priceCents)}
                            </span>
                          </Pill>
                        );
                      })}
                    </PillGroup>
                    <PillGroup label="Proporção">
                      {ASPECT_RATIOS.map((r) => (
                        <Pill key={r} active={aspectRatio === r} onClick={() => setAspectRatio(r)}>
                          {r}
                        </Pill>
                      ))}
                    </PillGroup>
                    <PillGroup label="Duração">
                      {VIDEO_DURATIONS.map((d) => (
                        <Pill key={d} active={duration === d} onClick={() => setDuration(d)}>
                          {d}
                        </Pill>
                      ))}
                    </PillGroup>
                  </>
                )}
              </div>

              {/* gerar — sempre visível, nunca compete com o fundo */}
              <div className="mt-5 flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-xs text-white/60">
                  {format === "video"
                    ? `${VIDEO_MODELS[videoModel].label} · ${currentVideoTier.label}`
                    : format === "image"
                      ? IMAGE_ENGINES[imageEngine].label
                      : format === "voice"
                        ? VOICE_ENGINES[voiceEngine].label
                        : AVATAR_ENGINES[avatarEngine].label}{" "}
                  ·{" "}
                  {isRealPath
                    ? user
                      ? formatBRL(user.balanceCents) + " de saldo"
                      : "2 imagens grátis ao criar conta"
                    : "prévia sem cobrança"}
                </span>
                <button
                  onClick={handleGenerate}
                  disabled={!prompt.trim() || generating || userLoading}
                  className="group relative inline-flex min-h-[46px] w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-neon-green px-7 py-3 text-sm font-bold text-primary-foreground transition duration-200 hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
                >
                  <Sparkles className="h-4 w-4" /> {generating ? "Gerando…" : generateLabel}
                </button>
              </div>
              <p className="mt-3 text-xs leading-[1.5] text-white/50">
                {isRealPath
                  ? "Imagens com Nano Banana Pro são geradas de verdade. O uso após os créditos grátis pode consumir saldo."
                  : "Este formato ainda é uma demonstração: não gera um arquivo e não consome saldo."}
              </p>

              {result && (
                <div className="mt-6 flex flex-col items-start gap-4 rounded-sm border border-border/60 bg-background/60 p-6 backdrop-blur sm:p-8">
                  <div className="flex w-full flex-wrap items-center justify-between gap-2 font-mono-tech text-[10.5px] uppercase tracking-widest text-muted-foreground">
                    <span>
                      Gerado às {result.createdAt}{" "}
                      {result.free && <span className="text-neon-green">· crédito grátis</span>}
                    </span>
                    <span className="text-neon-cyan">
                      "{result.prompt.slice(0, 60)}
                      {result.prompt.length > 60 ? "…" : ""}"
                    </span>
                  </div>
                  <GenerationPreview result={result} />
                </div>
              )}
            </div>
            <div className="mt-10 flex items-end justify-between gap-4">
              <div>
                <span className="font-mono-tech text-[10px] uppercase tracking-[.2em] text-neon-cyan">
                  Inspiração criativa
                </span>
                <h2 className="mt-2 font-display text-2xl tracking-tight text-white sm:text-3xl">
                  Comece por uma direção.
                </h2>
                <p className="mt-2 text-sm text-white/55">
                  Escolha uma ideia para preencher o compositor e dar seu próprio toque.
                </p>
              </div>
              <span className="hidden text-xs text-white/40 sm:block">Deslize para explorar →</span>
            </div>
            <div className="mt-5 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-5 [scrollbar-width:thin] [scrollbar-color:rgba(0,255,170,.3)_transparent]">
              {CREATIVE_STARTERS.map((idea) => (
                <button
                  key={idea.title}
                  type="button"
                  onClick={() => {
                    setFormat(idea.format);
                    setPrompt(idea.prompt);
                    document
                      .getElementById("gerar")
                      ?.scrollIntoView({ behavior: "smooth", block: "center" });
                    document.getElementById("studio-prompt")?.focus({ preventScroll: true });
                  }}
                  className="group relative aspect-[4/5] w-[220px] shrink-0 snap-start overflow-hidden rounded-[20px] border border-white/10 bg-[#172023] text-left transition hover:-translate-y-1 hover:border-neon-green/60 focus-visible:outline-2 focus-visible:outline-neon-green sm:w-[260px] lg:w-[calc((100%_-_3rem)/4)]"
                >
                  <img
                    src={idea.image}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  />
                  <span
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent"
                  />
                  <span className="absolute bottom-0 left-0 right-0 p-5">
                    <span className="block font-mono-tech text-[9px] uppercase tracking-widest text-neon-green">
                      {idea.category}
                    </span>
                    <span className="mt-1.5 flex items-center justify-between text-lg font-semibold text-white">
                      {idea.title}
                      <ArrowUpRight className="h-4 w-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Vitrine — comandos que ensinam a técnica por trás do que se gera aqui */}
        <section className="border-t border-border/40 py-16 cv-auto">
          <div className="mx-auto max-w-5xl px-6">
            <div className="mb-4 flex items-center gap-3 font-mono-tech text-[11px] uppercase tracking-widest text-neon-green">
              <span className="h-px w-8 bg-neon-green" /> Aprenda com a Veronica
            </div>
            <h2
              className="font-display text-3xl sm:text-4xl md:text-5xl"
              style={{ letterSpacing: "-0.04em", lineHeight: "0.95" }}
            >
              A IA gera. <span className="text-neon-green text-glow-green">Você dirige.</span>
            </h2>
            <p className="mt-4 max-w-2xl leading-[1.65] text-muted-foreground">
              Prompt bom nasce de roteiro bom. É a mesma ordem pra vender qualquer produto — a
              Veronica te guia passo a passo, do produto escolhido até a VSL cinematográfica pronta
              pra rodar.
            </p>

            <details className="group mt-7 rounded-2xl border border-border/60 bg-surface/30 p-5 sm:p-7">
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold marker:hidden">
                Guia de criação em 7 etapas
                <ChevronDown className="h-4 w-4 text-neon-green transition group-open:rotate-180" />
              </summary>
              <div className="mt-8 grid gap-x-8 gap-y-6 sm:grid-cols-2">
                {STUDIO_PLAYBOOK.map((s) => (
                  <div key={s.n} className="flex gap-4">
                    <span
                      className="font-display text-2xl text-neon-green/70"
                      style={{ letterSpacing: "-0.02em" }}
                    >
                      {s.n}
                    </span>
                    <div>
                      <h3
                        className="font-display text-base text-foreground"
                        style={{ letterSpacing: "-0.02em" }}
                      >
                        {s.title}
                      </h3>
                      <p className="mt-1.5 text-[13.5px] leading-[1.6] text-muted-foreground">
                        {s.body}
                      </p>
                      <button
                        type="button"
                        onClick={() => openVeronica(s.stepId)}
                        className="mt-2.5 inline-flex items-center gap-1.5 rounded-full border border-neon-green/30 bg-neon-green/5 px-3 py-1.5 font-mono-tech text-[10.5px] text-neon-green transition hover:border-neon-green/60"
                      >
                        ✦ perguntar à veronica
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-14 flex items-center gap-3 font-mono-tech text-[10px] uppercase tracking-widest text-neon-cyan">
                <span className="h-px w-8 bg-neon-cyan" />
                Quer se aprofundar em cada etapa?
              </div>
              <p className="mt-3 max-w-2xl leading-[1.65] text-muted-foreground">
                Estas formações em produção vão explorar o que criar aqui dentro — do roteiro de VSL
                ao VFX que separa amador de profissional.
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
                    <h3
                      className="mt-5 font-display text-xl text-foreground"
                      style={{ letterSpacing: "-0.03em" }}
                    >
                      {c.title}
                    </h3>
                    <p className="mt-2 text-[13px] leading-[1.5] text-muted-foreground">
                      {c.description}
                    </p>
                    <div className="mt-5 flex items-center gap-2 font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground transition group-hover:text-neon-cyan">
                      Ver formação{" "}
                      <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                    </div>
                  </Link>
                ))}
              </div>

              <div className="mt-6 flex flex-col items-start gap-4 rounded-sm border border-neon-cyan/30 bg-gradient-to-br from-neon-cyan/8 via-surface/60 to-surface p-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div
                    className="font-display text-lg text-foreground"
                    style={{ letterSpacing: "-0.02em" }}
                  >
                    Formações em produção. Studio disponível.
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Enquanto as formações são preparadas, explore a geração de imagens.
                  </p>
                </div>
                <Link
                  to="/comandos"
                  className="group inline-flex flex-shrink-0 items-center gap-2 rounded-sm border border-neon-cyan/60 bg-background/60 px-6 py-3 font-mono-tech text-xs uppercase tracking-[0.18em] text-neon-cyan transition duration-200 hover:-translate-y-0.5 hover:bg-neon-cyan/10 active:translate-y-0"
                >
                  Ver todas as formações{" "}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </details>
          </div>
        </section>

        <section
          className="border-t border-border/40 py-16 cv-auto"
          aria-labelledby="studio-availability"
        >
          <div className="mx-auto max-w-5xl px-6">
            <div className="mb-3 flex items-center gap-3 font-mono-tech text-[11px] uppercase tracking-widest text-neon-green">
              <span className="h-px w-8 bg-neon-green" /> Disponibilidade
            </div>
            <h2
              id="studio-availability"
              className="font-display text-3xl tracking-tight sm:text-4xl"
            >
              O que já funciona aqui.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Escolha com clareza antes de começar. A geração real disponível hoje é imagem com Nano
              Banana Pro.
            </p>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-neon-green/35 bg-neon-green/5 p-6">
                <div className="flex items-center gap-2 text-sm font-semibold text-neon-green">
                  <ImageIcon className="h-4 w-4" /> Imagem · Disponível
                </div>
                <p className="mt-3 text-xl font-semibold">Nano Banana Pro</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Duas imagens grátis ao criar conta. Depois, {formatBRL(NANO_BANANA_PRICE_CENTS)}{" "}
                  por imagem gerada, usando o saldo da conta.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[.03] p-6">
                <div className="flex items-center gap-2 text-sm font-semibold text-white/75">
                  <Video className="h-4 w-4" /> Outros formatos · Em preparação
                </div>
                <p className="mt-3 text-xl font-semibold">Vídeo, voz e avatar</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Você pode explorar conceitos no compositor, mas essas opções ainda não produzem
                  arquivos nem debitam saldo. Os demais motores de imagem também são prévias.
                </p>
              </div>
            </div>
            <p className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
              <Check className="h-4 w-4 text-neon-green" /> Sem mensalidade para usar o Studio.
              Depósito mínimo para gerações pagas: {formatBRL(MIN_DEPOSIT_CENTS)}.
            </p>
          </div>
        </section>
      </div>

      <SiteFooter />
    </div>
  );
}
