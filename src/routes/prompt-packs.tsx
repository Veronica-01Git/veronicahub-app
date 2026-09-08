import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Check,
  ShieldCheck,
  Zap,
  FileStack,
  Download,
  Copy,
  FileText,
  MessageCircle,
  Plus,
  Minus,
  ArrowRight,
  BookOpen,
  Target,
  Timer,
  Volume2,
} from "lucide-react";
import { SiteHeader, SiteFooter, SOCIAL_LINKS } from "@/components/SiteChrome";
import { VeronicaSeal } from "@/components/VeronicaSeal";
import { formatBRL } from "@/lib/account";
import { getVoicePackCheckoutUrl } from "@/lib/prompt-pack-commerce";

export const Route = createFileRoute("/prompt-packs")({
  component: PromptPacks,
  head: () => ({
    meta: [
      { title: "Prompt Packs — Comandos prontos pra IA real | Veronica Hub" },
      {
        name: "description",
        content:
          "Documentos com comandos prontos pra Nano Banana Pro, Veo, Midjourney e ElevenLabs. Cada pack vem com o Selo de Originalidade Veronica.",
      },
      { property: "og:title", content: "Prompt Packs — Comandos prontos pra IA real" },
      {
        property: "og:description",
        content: "Os comandos exatos. As plataformas certas. Resultado hoje.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

type Level = "Iniciante" | "Intermediário" | "Avançado";

type PromptPack = {
  slug: string;
  serial: string;
  name: string;
  level: Level;
  platforms: string[];
  commandCount: number;
  priceCents: number;
  description: string;
  available: boolean;
};

const PACKS: PromptPack[] = [
  {
    slug: "vfx-ultra-realista",
    serial: "VH-VFX-000001",
    name: "VFX Ultra-Realista",
    level: "Avançado",
    platforms: ["Nano Banana Pro", "Midjourney", "Veo"],
    commandCount: 40,
    priceCents: 2790,
    description: "Comandos pra efeitos visuais que parecem produção de estúdio — sem estúdio.",
    available: false,
  },
  {
    slug: "vsl-cinematografica",
    serial: "VH-VSL-000001",
    name: "VSL Cinematográfica",
    level: "Intermediário",
    platforms: ["Veo", "Nano Banana Pro"],
    commandCount: 30,
    priceCents: 2490,
    description: "Roteiro cena a cena, pronto pra virar vídeo de vendas cinematográfico.",
    available: false,
  },
  {
    slug: "voz-narracao-ia",
    serial: "VH-VOZ-000001",
    name: "Voz e Narração IA",
    level: "Iniciante",
    platforms: ["ElevenLabs"],
    commandCount: 25,
    priceCents: 1990,
    description: "Comandos pra narração natural, no tom certo pra cada tipo de conteúdo.",
    available: true,
  },
  {
    slug: "avatar-digital",
    serial: "VH-AVT-000001",
    name: "Avatar Digital",
    level: "Intermediário",
    platforms: ["Veo", "ElevenLabs", "Nano Banana Pro"],
    commandCount: 35,
    priceCents: 2990,
    description: "Do rosto à voz: comandos pra criar e animar seu avatar digital completo.",
    available: false,
  },
];

const LEVEL_CLASS: Record<Level, string> = {
  Iniciante: "border-neon-green/50 text-neon-green",
  Intermediário: "border-neon-cyan/50 text-neon-cyan",
  Avançado: "border-destructive/50 text-destructive",
};

const TRUST_ITEMS = [
  { icon: Check, label: "Comandos testados" },
  { icon: ShieldCheck, label: "Material original Veronica" },
  { icon: Zap, label: "Aplicação prática e imediata" },
];

const DELIVERABLES = [
  {
    icon: Download,
    title: "Documento em PDF",
    desc: "Arquivo único, organizado por plataforma, pra abrir no celular ou no computador.",
  },
  {
    icon: Copy,
    title: "Comandos prontos pra copiar",
    desc: "Cada prompt já formatado — cola na ferramenta e roda, sem precisar adaptar nada.",
  },
  {
    icon: FileText,
    title: "Dicas de uso",
    desc: "Orientação curta em cada comando: quando usar, o que ajustar, o que evitar.",
  },
  {
    icon: ShieldCheck,
    title: "Selo de Originalidade",
    desc: "Carimbo digital de autenticidade Veronica, com número de série, gravado no documento.",
  },
];

const SPRINT_MISSIONS = [
  "Defina uma identidade vocal",
  "Prepare o texto para ser ouvido",
  "Compare três direções emocionais",
  "Revise pronúncia e ritmo",
  "Finalize um áudio de 30 segundos",
];

const LEARNING_PATH = [
  {
    step: "01",
    title: "Direção",
    desc: "Transforme público, objetivo e personalidade em uma ficha de voz.",
  },
  {
    step: "02",
    title: "Preparação",
    desc: "Converta texto escrito em roteiro com pausas, ênfases e duração.",
  },
  {
    step: "03",
    title: "Laboratório",
    desc: "Teste emoções diferentes e aprenda a escolher com critério.",
  },
  {
    step: "04",
    title: "Revisão",
    desc: "Corrija nomes, números, siglas, ritmo e trechos artificiais.",
  },
  {
    step: "05",
    title: "Projeto final",
    desc: "Produza uma peça publicável de 30 segundos e faça um teste A/B.",
  },
];

const FAQS = [
  {
    q: "Preciso pagar pelas plataformas de IA?",
    a: "O pack não inclui assinatura de ferramentas. Planos, limites e disponibilidade podem mudar; confira as condições atuais da plataforma indicada antes de usar.",
  },
  {
    q: "Os comandos funcionam em qualquer conta?",
    a: "São comandos em texto, mas alguns recursos podem depender do plano e da versão disponível na ferramenta indicada. O documento mostra o que ajustar em cada uso.",
  },
  {
    q: "Como recebo o documento?",
    a: "Depois de confirmar a compra pelo WhatsApp, o PDF do pack é enviado direto na conversa.",
  },
  {
    q: "O que é o Selo de Originalidade?",
    a: "Um carimbo digital de autenticidade que vem gravado no documento entregue, com número de série único — comprova que o material é original da Veronica Hub.",
  },
];

function buildPackWhatsappUrl(pack: PromptPack, waitlist = false): string {
  const msg = waitlist
    ? `Olá! Quero entrar na lista de espera do Prompt Pack "${pack.name}". Vim pela página de Prompt Packs.`
    : `Olá! Quero comprar o Prompt Pack "${pack.name}" (${formatBRL(pack.priceCents)}). Pode me enviar a opção de pagamento por Pix e as instruções de entrega? Vim pelo site.`;
  return `${SOCIAL_LINKS.whatsapp}?text=${encodeURIComponent(msg)}`;
}

function PackCard({ pack }: { pack: PromptPack }) {
  const hostedCheckoutUrl = pack.slug === "voz-narracao-ia" ? getVoicePackCheckoutUrl() : null;
  const actionUrl = hostedCheckoutUrl ?? buildPackWhatsappUrl(pack, !pack.available);

  return (
    <div
      id={pack.slug}
      className="flex flex-col gap-4 rounded-sm border border-border/60 bg-surface/70 p-5 backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-neon-green/60 hover:shadow-glow-green sm:p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono-tech text-[9px] uppercase tracking-widest ${LEVEL_CLASS[pack.level]}`}
            >
              {pack.level}
            </span>
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono-tech text-[9px] uppercase tracking-widest ${pack.available ? "border-neon-green/50 bg-neon-green/10 text-neon-green" : "border-border/60 text-muted-foreground"}`}
            >
              {pack.available ? "Disponível agora" : "Em preparação"}
            </span>
          </div>
          <h3
            className="mt-3 font-display text-xl text-foreground"
            style={{ letterSpacing: "-0.02em", lineHeight: "1.1" }}
          >
            {pack.name}
          </h3>
        </div>
        <VeronicaSeal
          serialNumber={pack.serial}
          issuedDate="2026"
          productName={pack.name}
          size="sm"
          className="h-16 w-16 flex-shrink-0"
        />
      </div>

      <p className="text-[13.5px] leading-[1.55] text-muted-foreground">{pack.description}</p>

      <div className="flex flex-wrap gap-1.5">
        {pack.platforms.map((p) => (
          <span
            key={p}
            className="rounded-full border border-border/60 px-2.5 py-1 font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground"
          >
            {p}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-2 font-mono-tech text-[10.5px] uppercase tracking-widest text-muted-foreground">
        <FileStack className="h-3.5 w-3.5 flex-shrink-0 text-neon-cyan/80" />
        {pack.commandCount} comandos inclusos
      </div>

      <div className="mt-auto flex flex-col gap-3 border-t border-border/50 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <span
          className={`font-display text-2xl ${pack.available ? "text-neon-green" : "text-muted-foreground"}`}
        >
          {pack.available ? formatBRL(pack.priceCents) : "Em breve"}
        </span>
        <a
          href={actionUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-sm px-5 py-3 font-mono-tech text-[11px] uppercase tracking-widest transition duration-200 hover:-translate-y-0.5 sm:w-auto ${pack.available ? "bg-neon-green text-primary-foreground shadow-glow-green hover:brightness-110" : "border border-border/70 text-foreground hover:border-neon-green/60 hover:text-neon-green"}`}
        >
          {pack.available ? (
            <ArrowRight className="h-4 w-4" />
          ) : (
            <MessageCircle className="h-4 w-4" />
          )}
          {pack.available
            ? hostedCheckoutUrl
              ? "Comprar agora"
              : "Comprar por Pix"
            : "Entrar na lista"}
        </a>
      </div>
    </div>
  );
}

function FaqItem({ q, a, defaultOpen = false }: { q: string; a: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-[44px] w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-neon-green/5 sm:px-6"
        aria-expanded={open}
      >
        <span
          className="font-display text-[15px] text-foreground sm:text-base"
          style={{ letterSpacing: "-0.01em" }}
        >
          {q}
        </span>
        <span
          className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-sm border transition ${
            open
              ? "border-neon-green bg-neon-green/10 text-neon-green rotate-180"
              : "border-border/60 text-muted-foreground"
          }`}
        >
          {open ? <Minus className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
        </span>
      </button>
      <div
        className="grid overflow-hidden px-5 transition-all duration-300 ease-out sm:px-6"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="min-h-0 overflow-hidden">
          <p className="pb-4 pr-8 text-[13.5px] leading-[1.65] text-muted-foreground">{a}</p>
        </div>
      </div>
    </div>
  );
}

function PromptPacks() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <SiteHeader />

      {/* Hero — direto, sem CTA genérico */}
      <section className="relative overflow-hidden border-b border-border/40 py-14 md:py-20">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(circle at 20% 10%, oklch(0.85 0.22 155 / 0.16), transparent 55%)",
          }}
        />
        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <div className="mx-auto inline-flex items-center gap-3 rounded-full border border-neon-green/40 bg-background/60 px-4 py-1.5 font-mono-tech text-[10px] uppercase tracking-widest text-neon-green backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-neon-green animate-pulse-dot" />
            Prompt Packs
          </div>
          <h1
            className="mx-auto mt-6 max-w-2xl font-display text-3xl sm:text-4xl md:text-5xl"
            style={{ letterSpacing: "-0.03em", lineHeight: "1.05" }}
          >
            Prompts que saem do papel.{" "}
            <span className="text-neon-green text-glow-green">Resultado aplicável.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-[15px] leading-[1.6] text-muted-foreground sm:text-base">
            Guias diretos, organizados e testados para você produzir melhor com inteligência
            artificial — mesmo que esteja começando agora.
          </p>
        </div>
      </section>

      {/* Faixa de confiança */}
      <section className="border-b border-border/40 bg-surface/40 px-6 py-6">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-x-8 sm:gap-y-3">
          {TRUST_ITEMS.map((t) => (
            <div
              key={t.label}
              className="flex items-center gap-2 font-mono-tech text-[11px] uppercase tracking-widest text-muted-foreground"
            >
              <t.icon className="h-4 w-4 flex-shrink-0 text-neon-green" />
              {t.label}
            </div>
          ))}
        </div>
      </section>

      {/* Degustação gratuita */}
      <section className="border-b border-border/40 bg-surface/30 py-14 md:py-20">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div className="relative overflow-hidden rounded-sm border border-neon-green/40 bg-background p-6 shadow-glow-green sm:p-8">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-40"
              style={{
                background:
                  "radial-gradient(circle at 100% 0%, oklch(0.85 0.22 155 / 0.24), transparent 48%)",
              }}
            />
            <div className="relative">
              <div className="flex items-center justify-between gap-4">
                <span className="font-mono-tech text-[10px] uppercase tracking-[0.2em] text-neon-green">
                  Material gratuito
                </span>
                <span className="rounded-full border border-border/70 px-3 py-1 font-mono-tech text-[9px] uppercase tracking-widest text-muted-foreground">
                  PDF · 8 páginas
                </span>
              </div>
              <Volume2 className="mt-10 h-10 w-10 text-neon-cyan" />
              <h2
                className="mt-5 max-w-md font-display text-3xl text-foreground sm:text-4xl"
                style={{ letterSpacing: "-0.035em", lineHeight: "1.05" }}
              >
                Sprint Voz IA
              </h2>
              <p className="mt-4 max-w-md text-[14px] leading-relaxed text-muted-foreground">
                Cinco comandos e uma missão guiada para transformar um texto comum em uma narração
                clara, humana e publicável.
              </p>
              <a
                href="/downloads/sprint-voz-ia-5-comandos-veronica.pdf"
                download
                className="mt-7 inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-sm bg-neon-green px-6 py-3 font-mono-tech text-[11px] uppercase tracking-widest text-primary-foreground shadow-glow-green transition hover:-translate-y-0.5 hover:brightness-110 sm:w-auto"
              >
                <Download className="h-4 w-4" />
                Baixar sprint gratuito
              </a>
              <p className="mt-3 font-mono-tech text-[9px] uppercase tracking-widest text-muted-foreground">
                Sem cadastro · acesso imediato
              </p>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3 font-mono-tech text-[11px] uppercase tracking-widest text-neon-cyan">
              <span className="h-px w-8 bg-neon-cyan" />
              Aprenda fazendo
            </div>
            <h2
              className="mt-4 max-w-2xl font-display text-2xl sm:text-3xl md:text-4xl"
              style={{ letterSpacing: "-0.03em", lineHeight: "1.08" }}
            >
              Um pequeno projeto completo, não uma amostra vazia.
            </h2>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {SPRINT_MISSIONS.map((mission, index) => (
                <div
                  key={mission}
                  className="flex items-start gap-3 rounded-sm border border-border/60 bg-background/50 p-4"
                >
                  <span className="font-mono-tech text-[10px] text-neon-green">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[13px] leading-snug text-foreground">{mission}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground">
              <span className="flex items-center gap-2">
                <Timer className="h-4 w-4 text-neon-green" /> 20–30 minutos
              </span>
              <span className="flex items-center gap-2">
                <Target className="h-4 w-4 text-neon-green" /> Resultado verificável
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Método de aprendizagem */}
      <section className="border-b border-border/40 py-14 md:py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-10 max-w-2xl">
            <div className="flex items-center gap-3 font-mono-tech text-[11px] uppercase tracking-widest text-neon-green">
              <BookOpen className="h-4 w-4" />
              Método Veronica
            </div>
            <h2
              className="mt-4 font-display text-2xl sm:text-3xl md:text-4xl"
              style={{ letterSpacing: "-0.03em" }}
            >
              Informação, exercício, execução e revisão.
            </h2>
            <p className="mt-4 text-[14px] leading-relaxed text-muted-foreground sm:text-[15px]">
              Cada etapa explica uma decisão, entrega um comando e exige uma produção real. Você
              termina com uma peça pronta e um critério para avaliar a própria evolução.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {LEARNING_PATH.map((item) => (
              <article
                key={item.step}
                className="group rounded-sm border border-border/60 bg-surface/40 p-5 transition hover:-translate-y-1 hover:border-neon-cyan/50"
              >
                <span className="font-mono-tech text-[10px] tracking-widest text-neon-green">
                  {item.step}
                </span>
                <h3 className="mt-5 font-display text-lg text-foreground">{item.title}</h3>
                <p className="mt-3 text-[12.5px] leading-relaxed text-muted-foreground">
                  {item.desc}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Grade de produtos */}
      <section id="packs" className="mx-auto max-w-6xl px-6 py-14 md:py-20">
        <div className="mb-10 flex flex-col gap-3">
          <div className="flex items-center gap-3 font-mono-tech text-[11px] uppercase tracking-widest text-neon-green">
            <span className="h-px w-8 bg-neon-green" />
            Comece pelo que já está pronto
          </div>
          <h2
            className="font-display text-2xl sm:text-3xl md:text-4xl"
            style={{ letterSpacing: "-0.03em" }}
          >
            Um produto completo hoje. Os próximos já estão a caminho.
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[...PACKS]
            .sort((a, b) => Number(b.available) - Number(a.available))
            .map((pack) => (
              <PackCard key={pack.slug} pack={pack} />
            ))}
        </div>
      </section>

      {/* O que você recebe */}
      <section className="border-t border-border/40 bg-surface/40 py-14 md:py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-10 flex items-center gap-3 font-mono-tech text-[11px] uppercase tracking-widest text-neon-cyan">
            <span className="h-px w-8 bg-neon-cyan" />O que você recebe
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {DELIVERABLES.map((d) => (
              <div
                key={d.title}
                className="flex flex-col gap-3 rounded-sm border border-border/60 bg-background/60 p-5"
              >
                <d.icon className="h-6 w-6 text-neon-green" />
                <h3
                  className="font-display text-base text-foreground"
                  style={{ letterSpacing: "-0.02em" }}
                >
                  {d.title}
                </h3>
                <p className="text-[13px] leading-[1.5] text-muted-foreground">{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-border/40 py-14 md:py-20">
        <div className="mx-auto max-w-3xl px-6">
          <div className="mb-8 flex items-center gap-3 font-mono-tech text-[11px] uppercase tracking-widest text-neon-green">
            <span className="h-px w-8 bg-neon-green" />
            Dúvidas rápidas
          </div>
          <div className="divide-y divide-border/60 rounded-sm border border-border/60 bg-background/50 backdrop-blur">
            {FAQS.map((f, i) => (
              <FaqItem key={f.q} q={f.q} a={f.a} defaultOpen={i === 0} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="border-t border-border/40 bg-surface/40 py-14 md:py-20">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <h2 className="font-display text-2xl sm:text-3xl" style={{ letterSpacing: "-0.03em" }}>
            Ainda não decidiu qual pack?
          </h2>
          <p className="mt-3 text-[14px] leading-[1.6] text-muted-foreground sm:text-[15px]">
            Fala com a gente pelo WhatsApp ou dá mais uma olhada nos packs acima.
          </p>
          <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <a
              href="#packs"
              className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-sm border border-border/60 bg-background/40 px-6 py-3 font-mono-tech text-[11px] uppercase tracking-widest text-foreground backdrop-blur transition hover:-translate-y-0.5 hover:border-neon-green/60 hover:text-neon-green sm:w-auto"
            >
              Ver os packs
            </a>
            <a
              href={SOCIAL_LINKS.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-sm bg-neon-green px-6 py-3 font-mono-tech text-[11px] uppercase tracking-widest text-primary-foreground shadow-glow-green transition hover:-translate-y-0.5 hover:brightness-110 sm:w-auto"
            >
              <MessageCircle className="h-4 w-4" />
              Falar no WhatsApp
            </a>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
