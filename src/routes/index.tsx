import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Infinity as InfinityIcon,
  Instagram,
  Youtube,
  MessageCircle,
  Mail,
  Zap,
  Wifi,
  Target,
  Award,
  Check,
  Plus,
  Minus,
  Sparkles,
  Wand2,
  FileText,
  BarChart3,
  ShieldCheck,
  Layers,
  Anchor,
  ShoppingBag,
  Menu,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import ogImage from "@/assets/og-veronica-hub.jpg";
import { useReveal, useCountUp } from "@/hooks/use-reveal";
import { useParallax } from "@/hooks/use-parallax";
import { TerminalBoot } from "@/components/TerminalBoot";
import {
  SOCIAL_LINKS,
  EcosystemMenu,
  ECOSYSTEM_LINKS,
  HeroFrame,
  AuthWidget,
} from "@/components/SiteChrome";
import { VeronicaHero } from "@/components/VeronicaHero";
import { VeronicaDrawer } from "@/components/VeronicaDrawer";import { LazyImage } from "@/components/media/LazyImage";
import { HudAccent, GREEN as HOLO_GREEN, CYAN as HOLO_CYAN } from "@/components/HoloOrbits";
import { IntentPortal } from "@/components/home/IntentPortal";
import { StudioShowcase } from "@/components/home/StudioShowcase";
import { ToolShowcase } from "@/components/home/ToolShowcase";
import { ProofSection } from "@/components/home/ProofSection";
import { courses } from "@/lib/courses";

const HUB_URL = "https://veronicahub.com";

type EcosystemItem = {
  icon: typeof Wand2;
  name: string;
  tag: string;
  desc: string;
  ready: boolean;
  to?: string;
  note?: string;
  image?: string;
  external?: boolean;
};

const ecosystem: EcosystemItem[] = [
  {
    icon: Wand2,
    name: "Veronica Studio",
    tag: "Geração com IA",
    desc: "Imagem, vídeo e voz gerados com IA. Do prompt à entrega, um pipeline pro que roda em qualquer nicho.",
    ready: true,
    to: "/video-ia",
    image: "/images/ecosystem/studio.webp",
  },
  {
    icon: FileText,
    name: "Currículo-Certo",
    tag: "Carreira",
    desc: "Otimização de currículo pra passar em ATS, chamar recrutador e virar entrevista.",
    ready: true,
    to: "/veronica-curriculo-certo",
    image: "/images/ecosystem/curriculo.webp",
  },
  {
    icon: BarChart3,
    name: "Veronica Analytics",
    tag: "TikTok Shop",
    desc: "Calculadora de engajamento e plano de ação pra vender mais no TikTok Shop.",
    ready: true,
    to: "/veronica-analytics",
    image: "/images/ecosystem/analytics.webp",
  },
  {
    icon: ShieldCheck,
    name: "Veronica Security",
    tag: "Segurança",
    desc: "Triagem gratuita de segurança em linguagem simples, mais diagnóstico completo sob demanda.",
    ready: true,
    to: "/veronica-security",
    image: "/images/ecosystem/security.webp",
  },
  {
    icon: Layers,
    name: "Prompt Packs",
    tag: "Comandos prontos",
    desc: "Documentos com prompts prontos pra IA real — Nano Banana Pro, Veo, Midjourney, ElevenLabs.",
    ready: true,
    to: "/prompt-packs",
    image: "/images/ecosystem/prompt-packs.webp",
  },
  {
    icon: Anchor,
    name: "Veronica Náutica",
    tag: "Seguro náutico",
    desc: "Corretagem de seguros náuticos para jetskis guardados em marinas de SC. Projeto em estruturação, sujeito a habilitação regulatória.",
    ready: true,
    to: "/veronica-nautica",
    note: "Em estruturação",
  },
  {
    icon: ShoppingBag,
    name: "Negócio da China",
    tag: "Marketplace C2C",
    desc: "Compra e venda de produtos novos e usados, direto entre pessoas. Domínio próprio, fora deste app.",
    ready: true,
    external: true,
    to: "https://negociodachina.veronicahub.com",
  },
];

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { property: "og:image", content: ogImage },
      { name: "twitter:image", content: ogImage },
    ],
    links: [
      {
        rel: "preload",
        as: "image",
        href: "/images/home/veronica-cyborg-hero-poster.webp",
        fetchpriority: "high",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Veronica Hub",
          url: "https://veronicahub.com",
          description:
            "Laboratório digital com 11 cursos: dark content, IA generativa, tráfego pago, VSL, hacking ético.",
          sameAs: ["https://instagram.com/veronicahub_", "https://youtube.com/@veronica-hub"],
        }),
      },
    ],
  }),
});

type PartnerCourse = {
  title: string;
  author: string;
  desc: string;
  url: string;
  tag: string;
};

// Curadoria de terceiros — fora do catálogo oficial do Hub. Nenhum parceiro
// publicado ainda; a seção só renderiza quando este array tiver itens.
const partnerCourses: PartnerCourse[] = [
  // {
  //   title: "Nome do curso",
  //   author: "Nome do instrutor/autor",
  //   desc: "Descrição curta do que o curso ensina.",
  //   url: "https://exemplo.com/curso",
  //   tag: "Parceiro",
  // },
];

// 3 comandos em destaque no teaser da home — a grade completa mora em /comandos.
const TEASER_TITLES = ["Canais Dark", "Avatar Digital IA", "VFX com IA"];

const plans = [
  {
    name: "Curso Avulso",
    price: "19",
    cents: "90",
    tag: "A partir de",
    cta: "Escolher curso",
    features: [
      "Acesso vitalício ao curso",
      "Atualizações incluídas",
      "Certificado de conclusão",
      "Comunidade no Telegram",
    ],
  },
  {
    name: "Hub Completo",
    price: "197",
    cents: "00",
    tag: "Acesso completo",
    cta: "Quero o Hub",
    featured: true,
    features: [
      "Todos os 11 cursos",
      "Acesso vitalício a tudo",
      "Cursos novos incluídos",
      "Certificados",
      "Comunidade VIP",
      "Suporte direto",
    ],
  },
  {
    name: "Hub + Mentoria",
    price: "497",
    cents: "00",
    tag: "Aceleração",
    cta: "Aplicar agora",
    features: [
      "Tudo do Hub Completo",
      "4 mentorias em grupo/mês",
      "Revisão de projeto",
      "Grupo fechado",
      "Prioridade no suporte",
    ],
  },
];

const faqs = [
  {
    q: "Como funciona o acesso?",
    a: "Após a compra você recebe login imediato na plataforma. É 100% online, no seu ritmo, em qualquer dispositivo — e o acesso é vitalício.",
  },
  {
    q: "Serve pra quem tá começando do zero?",
    a: "Sim. Cada curso tem trilha do básico ao avançado. A gente parte do princípio que você nunca fez nada disso — e te leva ao resultado.",
  },
  {
    q: "Tem suporte?",
    a: "Sim. Comunidade ativa no Telegram, tira-dúvidas com a equipe, e no plano de mentoria você tem contato direto com a Veronica.",
  },
  {
    q: "Emite nota fiscal?",
    a: "Sim, emitimos NF-e automaticamente após a compra. Serve pra CNPJ MEI, ME e pessoa física.",
  },
  {
    q: "Posso pedir reembolso?",
    a: "Garantia incondicional de 7 dias. Não gostou? A gente devolve 100% do valor, sem perguntas.",
  },
  {
    q: "Como recebo os cursos novos?",
    a: "Todo curso lançado dentro do Hub Completo já entra na sua conta automaticamente, sem custo adicional.",
  },
  {
    q: "Preciso de equipamento caro?",
    a: "Não. Todos os cursos são pensados pra funcionar com celular + notebook básico. As ferramentas de IA usadas têm plano free.",
  },
  {
    q: "Quanto tempo leva pra ter resultado?",
    a: "Depende de execução. Alunos aplicando 1h/dia costumam ter primeiros resultados entre 30 e 90 dias.",
  },
];

function Index() {
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

  const stats = useReveal<HTMLDivElement>();
  const proof = useReveal<HTMLElement>();
  const featuresR = useReveal<HTMLElement>();
  const ecosystemR = useReveal<HTMLElement>();
  const pricingR = useReveal<HTMLElement>();
  const faqR = useReveal<HTMLElement>();
  const ctaR = useReveal<HTMLElement>();

  const c1 = useCountUp(courses.length, stats.visible);
  const c2 = useCountUp(100, stats.visible);
  const c3 = useCountUp(ecosystem.length, stats.visible, 900);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Grão cinematográfico — textura estática (sem jitter quadro a quadro),
          mesmo vocabulário do .scanlines da hero, cobrindo a página inteira. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-40 film-grain opacity-[0.05]"
      />
      {/* Nav */}
      <header className="relative sticky top-0 z-30 border-b border-border/40 bg-background/70 backdrop-blur-md supports-[backdrop-filter]:bg-background/55">
        {/* Sutil linha vermelha de ponta a ponta no topo */}
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-destructive/60 to-transparent"
        />
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <a
            href="#"
            className="flex items-center gap-2 font-mono-tech text-sm uppercase tracking-widest"
          >
            <span className="h-2 w-2 rounded-full bg-neon-green animate-pulse-dot" />
            <span className="font-display text-base tracking-tight">Veronica</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">Hub</span>
          </a>
          <nav className="hidden items-center gap-1 text-xs font-mono-tech uppercase tracking-wider md:flex">
            <Link
              to="/comandos"
              className="group relative px-3 py-2 text-muted-foreground transition hover:text-neon-green"
            >
              Comandos
              <span className="absolute inset-x-3 -bottom-0.5 h-px origin-left scale-x-0 bg-neon-green transition-transform duration-300 group-hover:scale-x-100" />
            </Link>
            <a
              href="#sobre"
              className="group relative px-3 py-2 text-muted-foreground transition hover:text-neon-green"
            >
              Sobre
              <span className="absolute inset-x-3 -bottom-0.5 h-px origin-left scale-x-0 bg-neon-green transition-transform duration-300 group-hover:scale-x-100" />
            </a>
            <EcosystemMenu />
          </nav>
          <div className="flex items-center gap-3">
            <Link
              to="/blog"
              className="group relative hidden px-3 py-2 font-mono-tech text-xs uppercase tracking-wider text-muted-foreground transition hover:text-neon-green sm:block"
            >
              Blog
              <span className="absolute inset-x-3 -bottom-0.5 h-px origin-left scale-x-0 bg-neon-green transition-transform duration-300 group-hover:scale-x-100" />
            </Link>
            <AuthWidget />
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
            <AuthWidget variant="mobile" />
            <Link
              to="/comandos"
              onClick={() => setMobileOpen(false)}
              className="border-b border-border/40 py-3.5 text-foreground"
            >
              Comandos
            </Link>
            <a
              href="#sobre"
              onClick={() => setMobileOpen(false)}
              className="border-b border-border/40 py-3.5 text-foreground"
            >
              Sobre
            </a>
            <Link
              to="/blog"
              onClick={() => setMobileOpen(false)}
              className="border-b border-border/40 py-3.5 text-foreground"
            >
              Blog
            </Link>
            <div className="pt-4 pb-1 text-[10px] uppercase tracking-widest text-muted-foreground">
              Ecossistema
            </div>
            {ECOSYSTEM_LINKS.map((item) =>
              item.ready ? (
                <Link
                  key={item.name}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className="flex flex-col gap-0.5 border-b border-border/40 py-3.5"
                >
                  <span className="text-foreground">{item.name}</span>
                  <span className="text-[11px] normal-case tracking-normal text-muted-foreground">
                    {item.tag}
                  </span>
                </Link>
              ) : (
                <div
                  key={item.name}
                  className="flex flex-col gap-0.5 border-b border-border/40 py-3.5 opacity-50"
                >
                  <span className="flex items-center gap-2 text-foreground">
                    {item.name}
                    <span className="rounded-full border border-border/60 px-1.5 py-0.5 text-[8px] normal-case tracking-normal text-muted-foreground">
                      em breve
                    </span>
                  </span>
                  <span className="text-[11px] normal-case tracking-normal text-muted-foreground">
                    {item.tag}
                  </span>
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
              <a
                href={SOCIAL_LINKS.youtube}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
              >
                <Youtube className="h-5 w-5" />
              </a>
              <a
                href={SOCIAL_LINKS.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href={SOCIAL_LINKS.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
              >
                <MessageCircle className="h-5 w-5" />
              </a>
              <a href={SOCIAL_LINKS.email} aria-label="E-mail">
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </nav>
        </div>
      )}

      {/* Hero */}
      <section className="relative overflow-hidden scanlines">
        {/* Vídeo em loop da cyborg — rosto humano/robótico, screen blend,
            fallback estático no mobile/reduced-motion. */}
        <VeronicaHero />
        <HeroFrame />

        <div className="relative mx-auto max-w-7xl px-6 pb-24 pt-20 md:pb-32 md:pt-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-3 rounded-full border border-neon-green/40 bg-background/60 px-4 py-1.5 font-mono-tech text-[10px] uppercase tracking-widest text-neon-green backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-neon-green animate-pulse-dot" />
              Veronica Hub · Laboratório Digital · 2026
            </div>

            <h1
              className="mt-8 font-display text-5xl sm:text-7xl md:text-8xl"
              style={{ letterSpacing: "-0.045em", lineHeight: "0.9" }}
            >
              <span className="block text-foreground">Uma inteligência.</span>
              <span className="block text-outline-neon animate-glow-pulse">
                Um ecossistema<span className="text-neon-green">_</span>
              </span>
            </h1>

            <p className="mt-8 max-w-xl text-base leading-[1.65] text-muted-foreground sm:text-lg">
              Crie, aprenda, trabalhe, analise e proteja — a Veronica direciona você para a
              ferramenta certa.
            </p>

            <TerminalBoot />
          </div>

          {/* Portal de intenção — a porta de entrada real do Hub. Cinco
              caminhos, cinco ferramentas de verdade, sem card genérico. */}
          <div className="mt-12 max-w-5xl">
            <IntentPortal />
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href={HUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 font-mono-tech text-xs uppercase tracking-[0.18em] text-muted-foreground transition hover:text-neon-green"
            >
              <span className="text-[10px] transition-transform group-hover:translate-x-0.5">
                ▸
              </span>
              Entrar no Hub de comandos
            </a>
          </div>

          {/* Stats */}
          <div
            ref={stats.ref}
            className={`reveal ${stats.visible ? "reveal-visible" : ""} mt-14 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 cv-auto`}
          >
            {[
              { value: `${c1}`, suffix: "+", label: "Comandos no hub" },
              { value: `${c2}`, suffix: "%", label: "Online · vitalício" },
              { value: `${c3}`, suffix: "", label: "Ferramentas no ecossistema" },
              { value: "R$19", suffix: ",90", label: "A partir de" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-sm border border-border/60 bg-background/50 p-5 backdrop-blur transition hover:-translate-y-0.5 hover:border-neon-green/50 hover:shadow-glow-green"
              >
                <div className="font-display text-3xl text-foreground sm:text-4xl">
                  {s.value}
                  <span className="text-neon-green">{s.suffix}</span>
                </div>
                <div className="mt-2 font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Marquee */}
      <section className="relative overflow-hidden border-y border-border/40 bg-surface/60 py-6 cv-auto">
        <div className="flex animate-marquee gap-10 whitespace-nowrap font-mono-tech text-sm uppercase tracking-widest text-muted-foreground">
          {[...courses, ...courses].map((c, i) => (
            <span key={i} className="flex items-center gap-10">
              <span className="text-neon-green">·</span>
              <span className="transition hover:text-foreground">{c.title}</span>
            </span>
          ))}
        </div>
      </section>

      <StudioShowcase />

      <ToolShowcase />

      {/* Comandos teaser — enxuto de propósito. A grade completa com filtro
          por categoria mora em /comandos; aqui é só a porta de entrada. */}
      <section id="comandos" className="relative mx-auto max-w-7xl px-6 py-24">
        <HudAccent size={72} hue={HOLO_GREEN} className="absolute right-6 top-6" />
        <div className="mb-14 flex flex-col gap-3">
          <div className="flex items-center gap-3 font-mono-tech text-[11px] uppercase tracking-widest text-neon-green">
            <span className="h-px w-8 bg-neon-green" />[ 01 ] Comandos · 11 no catálogo
          </div>
          <h2
            className="font-display text-4xl sm:text-5xl md:text-6xl"
            style={{ letterSpacing: "-0.04em", lineHeight: "0.95" }}
          >
            Do <span className="text-neon-green text-glow-green">dark content</span>
            <br />
            ao <span className="text-neon-cyan text-glow-cyan">hacking ético</span>.
          </h2>
          <p className="max-w-2xl leading-[1.65] text-muted-foreground">
            Sem fluff. Cada comando é construído sobre resultado real e execução prática.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {courses
            .filter((c) => TEASER_TITLES.includes(c.title))
            .map((c) => (
              <Link
                key={c.title}
                to="/comandos"
                className="group relative overflow-hidden rounded-sm border border-border/60 bg-surface/70 p-6 backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-neon-green/60 hover:bg-surface hover:shadow-glow-green"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-full border border-border/60 px-2.5 py-0.5 font-mono-tech text-[9px] uppercase tracking-widest text-muted-foreground group-hover:border-neon-cyan/60 group-hover:text-neon-cyan">
                    {c.tag}
                  </span>
                  {c.featured && (
                    <span className="rounded-full bg-neon-green px-2 py-0.5 font-mono-tech text-[9px] uppercase tracking-widest text-primary-foreground shadow-glow-green">
                      Mais vendido
                    </span>
                  )}
                </div>
                <h3
                  className="mt-5 font-display text-2xl text-foreground"
                  style={{ letterSpacing: "-0.03em", lineHeight: "1" }}
                >
                  {c.title}
                </h3>
                <p className="mt-3 text-[13px] leading-[1.5] text-muted-foreground">{c.perks[0]}</p>
                <div className="mt-6 flex items-center gap-2 font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground transition group-hover:text-neon-green">
                  Ver comando{" "}
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
        </div>

        <div className="mt-6 flex flex-col items-start gap-5 rounded-sm border border-neon-green/30 bg-gradient-to-br from-neon-green/8 via-surface/60 to-surface p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div
              className="font-display text-xl text-foreground"
              style={{ letterSpacing: "-0.02em" }}
            >
              Aprenda o comando. Execute na Studio.
            </div>
            <p className="mt-1.5 max-w-xl text-sm leading-[1.6] text-muted-foreground">
              11 comandos prontos — do conteúdo à IA — pra você sair do curso e já rodar nas
              ferramentas do ecossistema.
            </p>
          </div>
          <Link
            to="/comandos"
            className="group inline-flex flex-shrink-0 items-center gap-2 rounded-sm bg-neon-green px-6 py-3.5 font-mono-tech text-xs uppercase tracking-[0.18em] text-primary-foreground shadow-glow-green transition duration-200 hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0"
          >
            Ver todos os comandos{" "}
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      {/* Recomendados (curadoria de parceiros — fora do catálogo oficial) */}
      {partnerCourses.length > 0 && (
        <section id="recomendados" className="mx-auto max-w-7xl px-6 pb-24">
          <div className="mb-8 flex flex-col gap-3 rounded-sm border border-border/50 bg-muted/20 p-6">
            <div className="flex items-center gap-3 font-mono-tech text-[11px] uppercase tracking-widest text-muted-foreground">
              <span className="h-px w-8 bg-muted-foreground/50" />
              Recomendados pela Veronica
            </div>
            <p className="max-w-2xl text-xs leading-[1.6] text-muted-foreground">
              Conteúdo de parceiros selecionados — fora do catálogo oficial do Hub.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {partnerCourses.map((p) => (
              <a
                key={p.title}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="group relative overflow-hidden rounded-sm border border-border/50 bg-surface/40 p-6 transition duration-300 hover:-translate-y-1 hover:border-muted-foreground/60"
              >
                <span className="absolute right-3 top-3 rounded-full border border-border/60 bg-background/60 px-2.5 py-0.5 font-mono-tech text-[9px] uppercase tracking-widest text-muted-foreground">
                  {p.tag}
                </span>
                <h3
                  className="pr-16 font-display text-xl text-foreground"
                  style={{ letterSpacing: "-0.03em", lineHeight: "1.05" }}
                >
                  {p.title}
                </h3>
                <p className="mt-1 font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground">
                  {p.author}
                </p>
                <p className="mt-4 text-[13px] leading-[1.6] text-muted-foreground">{p.desc}</p>
                <div className="mt-6 flex items-center gap-2 font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground transition group-hover:text-foreground">
                  Ver curso{" "}
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Features */}
      <section
        id="sobre"
        ref={featuresR.ref}
        className={`reveal ${featuresR.visible ? "reveal-visible" : ""} border-t border-border/40 bg-surface/40 py-24 cv-auto`}
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-14 flex items-center gap-3 font-mono-tech text-[11px] uppercase tracking-widest text-neon-cyan">
            <span className="h-px w-8 bg-neon-cyan" />[ 02 ] Por que Veronica Hub
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: InfinityIcon,
                title: "Acesso Vitalício",
                desc: "Pague uma vez, acesse para sempre. Atualizações incluídas.",
              },
              {
                icon: Wifi,
                title: "100% Online",
                desc: "No seu ritmo, no seu horário, em qualquer dispositivo.",
              },
              {
                icon: Target,
                title: "Foco em Execução",
                desc: "Sem fluff. Cada aula é construída sobre resultado real.",
              },
              {
                icon: Award,
                title: "Certificado",
                desc: "Comprovante de conclusão para cada curso finalizado.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="group rounded-sm border border-border/60 bg-background/60 p-6 backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:border-neon-green/50 hover:shadow-glow-green"
              >
                <f.icon className="h-6 w-6 text-neon-green transition-transform group-hover:scale-110" />
                <h3
                  className="mt-5 font-display text-xl"
                  style={{ letterSpacing: "-0.03em", lineHeight: "1.05" }}
                >
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-[1.6] text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ecosystem */}
      <section
        id="ecossistema"
        ref={ecosystemR.ref}
        className={`reveal ${ecosystemR.visible ? "reveal-visible" : ""} relative overflow-hidden mx-auto max-w-7xl px-6 py-24 cv-auto`}
      >
        <EcosystemBackdrop />
        {/* "Organismo vivo" — pontos sutis pulsando ao fundo, células vivas do
            ecossistema. Puramente atmosférico, opacidade baixíssima. */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <span
              key={i}
              className="absolute rounded-full animate-sparkle"
              style={{
                left: `${8 + ((i * 17) % 90)}%`,
                top: `${10 + ((i * 29) % 80)}%`,
                width: i % 2 === 0 ? 4 : 3,
                height: i % 2 === 0 ? 4 : 3,
                background: i % 2 === 0 ? "var(--neon-green)" : "var(--neon-cyan)",
                opacity: 0.35,
                animationDelay: `${i * 0.4}s`,
              }}
            />
          ))}
        </div>
        <HudAccent size={80} hue={HOLO_CYAN} className="absolute right-4 top-4 lg:right-10" />

        <div className="relative mb-14 flex flex-col gap-3">
          <div className="flex items-center gap-3 font-mono-tech text-[11px] uppercase tracking-widest text-neon-green">
            <span className="h-px w-8 bg-neon-green" />[ 03 ] O Ecossistema
          </div>
          <h2
            className="font-display text-4xl sm:text-5xl md:text-6xl"
            style={{ letterSpacing: "-0.04em", lineHeight: "0.95" }}
          >
            Além do Hub,
            <br />
            <span className="text-neon-green text-glow-green">um ecossistema</span> inteiro.
          </h2>
          <p className="max-w-2xl leading-[1.65] text-muted-foreground">
            O complexo digital mais completo e atualizado do laboratório: produtos, marcas e
            ferramentas próprias, multidisciplinares, conectados numa conta só. Um cadastro abre
            todas elas.
          </p>
        </div>

        <div className="relative grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ecosystem.map((e) => {
            const cardClass = `group relative overflow-hidden rounded-sm border p-6 backdrop-blur transition duration-300 ${
              e.ready
                ? "border-border/60 bg-surface/70 hover:-translate-y-1 hover:border-neon-green/60 hover:bg-surface hover:shadow-glow-green"
                : "border-border/40 bg-surface/40 opacity-80"
            }`;
            const content = (
              <>
                {e.image && (
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 z-0 opacity-30 transition-[opacity,filter] duration-300 group-hover:opacity-45"
                    style={{
                      backgroundImage: `linear-gradient(180deg, rgba(5,8,12,.5), rgba(5,8,12,.94)), url(${e.image})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      filter: "saturate(0.9)",
                    }}
                  />
                )}
                <div className="relative z-10 flex items-start justify-between">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-sm border ${e.ready ? "border-neon-green/50 text-neon-green" : "border-border/60 text-muted-foreground"}`}
                  >
                    <e.icon className="h-5 w-5" />
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 font-mono-tech text-[9px] uppercase tracking-widest ${
                      e.ready
                        ? "border border-neon-cyan/40 text-neon-cyan"
                        : "border border-dashed border-muted-foreground/40 text-muted-foreground/70"
                    }`}
                  >
                    {e.ready ? e.tag : "Em breve"}
                  </span>
                </div>
                <h3
                  className="relative z-10 mt-6 flex items-center gap-2 font-display text-2xl text-foreground"
                  style={{ letterSpacing: "-0.03em", lineHeight: "1" }}
                >
                  {e.name}
                  {e.note && (
                    <span className="rounded-full border border-dashed border-muted-foreground/50 px-2 py-0.5 font-mono-tech text-[8px] font-normal uppercase tracking-widest text-muted-foreground">
                      {e.note}
                    </span>
                  )}
                </h3>
                <p className="relative z-10 mt-3 text-sm leading-[1.6] text-muted-foreground">
                  {e.desc}
                </p>
                <div
                  className={`relative z-10 mt-6 flex items-center gap-2 font-mono-tech text-[10px] uppercase tracking-widest ${e.ready ? "text-muted-foreground transition group-hover:text-neon-green" : "text-muted-foreground/50"}`}
                >
                  {e.ready ? (
                    <>
                      Explorar{" "}
                      <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                    </>
                  ) : (
                    "Em desenvolvimento"
                  )}
                </div>
              </>
            );
            if (e.ready && e.to && e.external) {
              return (
                <a
                  key={e.name}
                  href={e.to}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cardClass}
                >
                  {content}
                </a>
              );
            }
            return e.ready && e.to ? (
              <Link key={e.name} to={e.to} className={cardClass}>
                {content}
              </Link>
            ) : (
              <div key={e.name} className={cardClass}>
                {content}
              </div>
            );
          })}
        </div>

        <div className="relative mt-6 flex flex-col items-start gap-5 rounded-sm border border-neon-cyan/30 bg-gradient-to-br from-neon-cyan/8 via-surface/60 to-surface p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div
              className="font-display text-xl text-foreground"
              style={{ letterSpacing: "-0.02em" }}
            >
              Um cadastro. {ecosystem.length} ferramentas. Resultado em cada uma.
            </div>
            <p className="mt-1.5 max-w-xl text-sm leading-[1.6] text-muted-foreground">
              Multidisciplinar, atualizado e completo — o ecossistema Veronica te acompanha do
              conteúdo à venda, sem sair da plataforma.
            </p>
          </div>
          <Link
            to="/video-ia"
            className="group inline-flex flex-shrink-0 items-center gap-2 rounded-sm bg-neon-cyan px-6 py-3.5 font-mono-tech text-xs uppercase tracking-[0.18em] text-primary-foreground shadow-[0_0_24px_-8px_oklch(0.88_0.15_195/0.7)] transition duration-200 hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0"
          >
            Começar grátis na Studio{" "}
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      {/* Prova real */}
      <section
        ref={proof.ref}
        className={`reveal ${proof.visible ? "reveal-visible" : ""} relative overflow-hidden mx-auto max-w-7xl px-6 py-24 cv-auto`}
      >
        <ProofBackdrop />
        <ProofSection />
      </section>

      {/* Pricing */}
      <section
        id="pricing"
        ref={pricingR.ref}
        className={`reveal ${pricingR.visible ? "reveal-visible" : ""} relative border-t border-border/40 py-24 cv-auto`}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(circle at 50% 0%, oklch(0.85 0.22 155 / 0.2), transparent 60%)",
          }}
        />
        <HudAccent size={76} hue={HOLO_GREEN} className="absolute right-6 top-6" />
        <div className="relative mx-auto max-w-7xl px-6">
          <div className="mb-14 flex flex-col gap-3 text-center">
            <div className="mx-auto flex items-center gap-3 font-mono-tech text-[11px] uppercase tracking-widest text-neon-green">
              <span className="h-px w-8 bg-neon-green" />
              [ 04 ] Planos · escolha o seu
              <span className="h-px w-8 bg-neon-green" />
            </div>
            <h2
              className="mx-auto max-w-3xl font-display text-4xl sm:text-5xl md:text-6xl"
              style={{ letterSpacing: "-0.04em", lineHeight: "0.95" }}
            >
              Pague uma vez.
              <br />
              <span className="text-outline-neon">Acesse pra sempre.</span>
            </h2>
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            {plans.map((p) => (
              <div
                key={p.name}
                className={`relative flex flex-col rounded-sm border p-8 backdrop-blur transition duration-300 hover:-translate-y-1 ${
                  p.featured
                    ? "glow-on-reveal border-neon-green bg-gradient-to-br from-neon-green/10 via-surface to-neon-cyan/5 lg:scale-105"
                    : "border-border/60 bg-surface/60 hover:border-neon-green/50 hover:shadow-glow-green"
                }`}
              >
                {p.featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-neon-green px-3 py-1 font-mono-tech text-[10px] uppercase tracking-widest text-primary-foreground shadow-glow-green">
                    <Sparkles className="mr-1 inline h-3 w-3" /> {p.tag}
                  </span>
                )}
                {!p.featured && (
                  <span className="font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground">
                    {p.tag}
                  </span>
                )}
                <h3 className="mt-3 font-display text-2xl" style={{ letterSpacing: "-0.03em" }}>
                  {p.name}
                </h3>
                <div className="mt-6 flex items-baseline gap-1 font-display">
                  <span className="text-2xl text-muted-foreground">R$</span>
                  <span
                    className={`text-6xl ${p.featured ? "text-neon-green text-glow-green" : "text-foreground"}`}
                  >
                    {p.price}
                  </span>
                  <span className="text-2xl text-muted-foreground">,{p.cents}</span>
                </div>
                <div className="mt-1 font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground">
                  Pagamento único · sem mensalidade
                </div>
                <ul className="mt-8 flex-1 space-y-3 text-sm">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-foreground/90">
                      <Check
                        className={`mt-0.5 h-4 w-4 flex-shrink-0 ${p.featured ? "text-neon-green" : "text-neon-cyan/80"}`}
                      />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href={HUB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group mt-10 inline-flex items-center justify-center gap-2 rounded-sm px-6 py-3.5 font-mono-tech text-xs uppercase tracking-[0.18em] transition duration-200 hover:-translate-y-0.5 active:translate-y-0 ${
                    p.featured
                      ? "bg-neon-green text-primary-foreground shadow-glow-green hover:brightness-110"
                      : "border border-border/60 text-foreground hover:border-neon-green/60 hover:text-neon-green"
                  }`}
                >
                  {p.cta}{" "}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </a>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground">
            <span className="flex items-center gap-2">
              <Check className="h-3 w-3 text-neon-green" /> Garantia 7 dias
            </span>
            <span className="flex items-center gap-2">
              <Check className="h-3 w-3 text-neon-green" /> Emite NF
            </span>
            <span className="flex items-center gap-2">
              <Check className="h-3 w-3 text-neon-green" /> Cartão · Pix · Boleto
            </span>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section
        id="faq"
        ref={faqR.ref}
        className={`reveal ${faqR.visible ? "reveal-visible" : ""} border-t border-border/40 bg-surface/30 py-24 cv-auto`}
      >
        <div className="mx-auto max-w-4xl px-6">
          <div className="mb-12">
            <div className="flex items-center gap-3 font-mono-tech text-[11px] uppercase tracking-widest text-neon-cyan">
              <span className="h-px w-8 bg-neon-cyan" />[ 05 ] Dúvidas frequentes
            </div>
            <h2
              className="mt-3 font-display text-4xl sm:text-5xl"
              style={{ letterSpacing: "-0.04em", lineHeight: "0.95" }}
            >
              Antes de entrar,
              <br />
              <span className="text-neon-cyan text-glow-cyan">se liga</span>.
            </h2>
          </div>
          <div className="divide-y divide-border/60 rounded-sm border border-border/60 bg-background/50 backdrop-blur">
            {faqs.map((f, i) => (
              <FaqItem key={f.q} q={f.q} a={f.a} defaultOpen={i === 0} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        id="cta"
        ref={ctaR.ref}
        className={`reveal ${ctaR.visible ? "reveal-visible" : ""} relative overflow-hidden py-24 cv-auto`}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(circle at 30% 50%, oklch(0.85 0.22 155 / 0.25), transparent 50%), radial-gradient(circle at 70% 50%, oklch(0.88 0.15 195 / 0.25), transparent 50%)",
          }}
        />
        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <div className="inline-flex items-center gap-2 font-mono-tech text-[10px] uppercase tracking-widest text-neon-green">
            <Zap className="h-3 w-3" /> Comece agora
          </div>
          <h2
            className="mt-6 font-display text-4xl sm:text-6xl"
            style={{ letterSpacing: "-0.04em", lineHeight: "0.95" }}
          >
            Entre no <span className="text-outline-neon">Hub</span>.<br />
            Domine o <span className="text-neon-cyan text-glow-cyan">digital</span>.
          </h2>
          <p className="mx-auto mt-6 max-w-xl leading-[1.65] text-muted-foreground">
            11 cursos, acesso vitalício, a partir de R$ 19,90. Sem enrolação.
          </p>
          <a
            href={HUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative mt-10 inline-flex items-center gap-3 overflow-hidden rounded-sm bg-neon-green px-10 py-5 font-mono-tech text-sm uppercase tracking-[0.18em] text-primary-foreground shadow-glow-green transition duration-200 hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_0_80px_oklch(0.85_0.22_155/0.7)] active:translate-y-0 active:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-green focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Garantir meu acesso{" "}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-0 -left-full w-1/2 -skew-x-12 bg-white/25 transition-all duration-700 group-hover:left-[150%]"
            />
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-background/80">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="grid gap-10 md:grid-cols-4">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 font-mono-tech text-sm uppercase tracking-widest">
                <span className="h-2 w-2 rounded-full bg-neon-green animate-pulse-dot" />
                <span className="font-display text-base">Veronica</span>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground">Hub</span>
              </div>
              <p className="mt-4 max-w-sm text-sm leading-[1.65] text-muted-foreground">
                Laboratório digital de execução. Cursos diretos ao ponto, do dark content à IA
                generativa. Sem fluff, só resultado.
              </p>
              <div className="mt-6 flex items-center gap-3 text-muted-foreground">
                <a
                  href={SOCIAL_LINKS.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube"
                  className="rounded-sm border border-border/60 p-2 transition hover:-translate-y-0.5 hover:border-neon-green/60 hover:text-neon-green"
                >
                  <Youtube className="h-4 w-4" />
                </a>
                <a
                  href={SOCIAL_LINKS.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="rounded-sm border border-border/60 p-2 transition hover:-translate-y-0.5 hover:border-neon-green/60 hover:text-neon-green"
                >
                  <Instagram className="h-4 w-4" />
                </a>
                <a
                  href={SOCIAL_LINKS.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                  className="rounded-sm border border-border/60 p-2 transition hover:-translate-y-0.5 hover:border-neon-green/60 hover:text-neon-green"
                >
                  <MessageCircle className="h-4 w-4" />
                </a>
                <a
                  href={SOCIAL_LINKS.email}
                  aria-label="E-mail"
                  className="rounded-sm border border-border/60 p-2 transition hover:-translate-y-0.5 hover:border-neon-green/60 hover:text-neon-green"
                >
                  <Mail className="h-4 w-4" />
                </a>
              </div>
            </div>
            <div>
              <div className="font-mono-tech text-[10px] uppercase tracking-widest text-neon-green">
                Navegar
              </div>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link to="/comandos" className="transition hover:text-neon-green">
                    Comandos
                  </Link>
                </li>
                <li>
                  <a href="#ecossistema" className="transition hover:text-neon-green">
                    Ecossistema
                  </a>
                </li>
                <li>
                  <a
                    href={HUB_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition hover:text-neon-green"
                  >
                    Planos
                  </a>
                </li>
                <li>
                  <a href="#faq" className="transition hover:text-neon-green">
                    FAQ
                  </a>
                </li>
                <li>
                  <a href="#sobre" className="transition hover:text-neon-green">
                    Sobre
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <div className="font-mono-tech text-[10px] uppercase tracking-widest text-neon-green">
                Drops da Veronica
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Receba táticas, prompts e cases direto no seu email.
              </p>
              <form
                onSubmit={(e) => e.preventDefault()}
                className="mt-4 flex overflow-hidden rounded-sm border border-border/60 focus-within:border-neon-green/60"
              >
                <input
                  type="email"
                  required
                  placeholder="seu@email.com"
                  className="flex-1 bg-transparent px-3 py-2.5 font-mono-tech text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
                />
                <button className="bg-neon-green px-4 font-mono-tech text-[10px] uppercase tracking-widest text-primary-foreground transition hover:brightness-110">
                  OK
                </button>
              </form>
            </div>
          </div>
          <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-border/40 pt-6 font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground md:flex-row md:items-center">
            <div>© 2026 Veronica Hub · CNPJ 00.000.000/0001-00</div>
            <div className="flex items-center gap-6">
              <a href="#" className="transition hover:text-neon-green">
                Termos
              </a>
              <a href="#" className="transition hover:text-neon-green">
                Privacidade
              </a>
              <a href="#" className="transition hover:text-neon-green">
                Contato
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Crânio wireframe holográfico em loop, fundo já removido — reforça o eixo
// "laboratório digital" atrás dos depoimentos. Some em mobile/reduced-motion
// (vídeo decorativo pesado não compensa em tela pequena).
function ProofBackdrop() {
  const [active, setActive] = useState(false);
  const parallaxRef = useParallax<HTMLDivElement>(0.06);
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const small = window.matchMedia("(max-width: 767px)").matches;
    setActive(!reduced && !small);
  }, []);
  if (!active) return null;
  return (
    <div
      ref={parallaxRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.16] lg:opacity-[0.2]"
      style={{
        mixBlendMode: "screen",
        maskImage: "radial-gradient(ellipse 65% 60% at 50% 38%, black 35%, transparent 82%)",
        WebkitMaskImage: "radial-gradient(ellipse 65% 60% at 50% 38%, black 35%, transparent 82%)",
      }}
    >
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute left-1/2 top-1/2 h-full w-auto min-w-full -translate-x-1/2 -translate-y-1/2 object-cover blur-[1px]"
      >
        <source src="/videos/skull-reference-nobg.webm" type="video/webm" />
      </video>
    </div>
  );
}

// Esfera de partículas flutuando atrás do grid do ecossistema — profundidade
// sutil, nunca sobre os cards (z-index abaixo, blur leve de fundo).
function EcosystemBackdrop() {
  const [active, setActive] = useState(false);
  const parallaxRef = useParallax<HTMLDivElement>(0.05);
  useEffect(() => {
    setActive(!window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);
  if (!active) return null;
  return (
    <div
      ref={parallaxRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 hidden overflow-hidden opacity-[0.14] md:block"
      style={{
        mixBlendMode: "screen",
        maskImage: "radial-gradient(ellipse 55% 60% at 50% 45%, black 30%, transparent 78%)",
        WebkitMaskImage: "radial-gradient(ellipse 55% 60% at 50% 45%, black 30%, transparent 78%)",
      }}
    >
      <LazyImage
        src="/images/vfx/particle-sphere-nobg.webp"
        alt=""
        className="absolute left-1/2 top-1/2 w-[85%] max-w-3xl -translate-x-1/2 -translate-y-1/2 blur-[2px]"
      />
    </div>
  );
}

function FaqItem({ q, a, defaultOpen = false }: { q: string; a: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition hover:bg-neon-green/5"
        aria-expanded={open}
      >
        <span
          className="font-display text-base text-foreground sm:text-lg"
          style={{ letterSpacing: "-0.02em" }}
        >
          {q}
        </span>
        <span
          className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-sm border transition ${open ? "border-neon-green bg-neon-green/10 text-neon-green rotate-180" : "border-border/60 text-muted-foreground"}`}
        >
          {open ? <Minus className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
        </span>
      </button>
      <div
        className="grid overflow-hidden px-6 transition-all duration-300 ease-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="min-h-0 overflow-hidden">
          <p className="pb-5 pr-10 text-sm leading-[1.7] text-muted-foreground">{a}</p>
        </div>
      </div>
    </div>
  );
}
