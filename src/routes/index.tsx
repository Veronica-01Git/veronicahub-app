import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  Infinity as InfinityIcon,
  Instagram,
  Youtube,
  MessageCircle,
  Zap,
  Wifi,
  Target,
  Award,
  Check,
  Star,
  Plus,
  Minus,
  Sparkles,
} from "lucide-react";
import { useMemo, useState } from "react";
import cyborgAsset from "@/assets/veronica-cyborg.jpeg.asset.json";
import ogImage from "@/assets/og-veronica-hub.jpg";
import { useReveal, useCountUp } from "@/hooks/use-reveal";
import { TerminalBoot } from "@/components/TerminalBoot";

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
        href: cyborgAsset.url,
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
          sameAs: [
            "https://instagram.com/veronicahub",
            "https://youtube.com/@veronicahub",
          ],
        }),
      },
    ],
  }),
});

type Course = {
  title: string;
  tag: string;
  lessons: number;
  hours: string;
  level: "Iniciante" | "Intermediário" | "Avançado";
  featured?: boolean;
  perks: [string, string, string];
};

const courses: Course[] = [
  { title: "Canais Dark", tag: "Conteúdo", lessons: 32, hours: "6h", level: "Intermediário", featured: true, perks: ["Nichos ocultos que faturam", "Automação com IA", "Monetização YouTube"] },
  { title: "VSL Cinematográfico", tag: "Vídeo", lessons: 24, hours: "5h", level: "Intermediário", perks: ["Roteiro que converte", "Edição cinematográfica", "CapCut + IA"] },
  { title: "Avatar Digital IA", tag: "IA", lessons: 18, hours: "4h", level: "Iniciante", perks: ["Clone da sua voz", "Avatar realista", "Automação total"] },
  { title: "Afiliado", tag: "Vendas", lessons: 28, hours: "5h", level: "Iniciante", perks: ["Primeira comissão", "Funil validado", "Escala orgânica"] },
  { title: "iFood", tag: "Delivery", lessons: 20, hours: "3h", level: "Iniciante", perks: ["Dark kitchen", "Anúncios que vendem", "Escala local"] },
  { title: "Meta Ads", tag: "Tráfego", lessons: 26, hours: "6h", level: "Intermediário", perks: ["Estrutura de campanha", "Escala vertical", "Otimização diária"] },
  { title: "VFX com IA", tag: "IA", lessons: 16, hours: "4h", level: "Avançado", perks: ["Runway + Kling", "Efeitos cinematográficos", "Pipeline pro"] },
  { title: "Copywriting", tag: "Escrita", lessons: 22, hours: "4h", level: "Iniciante", perks: ["Fórmulas que vendem", "IA como parceira", "Portfolio real"] },
  { title: "App no-code", tag: "Dev", lessons: 30, hours: "7h", level: "Intermediário", perks: ["App em 7 dias", "Backend automático", "Publicar nas stores"] },
  { title: "Criar Site", tag: "Dev", lessons: 24, hours: "5h", level: "Iniciante", perks: ["Sem código", "Deploy grátis", "SEO técnico"] },
  { title: "Hacking Ético", tag: "Segurança", lessons: 34, hours: "8h", level: "Avançado", perks: ["Pentesting real", "Bug bounty", "Lab dedicado"] },
];

const testimonials = [
  { name: "Marina R.", handle: "@marinacria", course: "Canais Dark", result: "R$ 12k/mês em 90 dias", quote: "Larguei a CLT. O método é execução pura, sem enrolação. Em 3 meses tinha 2 canais rodando no automático." },
  { name: "Diego F.", handle: "@diegoflow", course: "VSL + Meta Ads", result: "+340% ROAS", quote: "Nunca vi uma didática tão direta. A Veronica corta o fluff e vai pro que faz vender. Aplicável no dia 1." },
  { name: "Camila S.", handle: "@camilaia", course: "Avatar Digital IA", result: "8 clientes em 30 dias", quote: "Comecei do zero em IA. Hoje entrego avatar digital pra advogados e nutricionistas. Case real, resultado real." },
];

const plans = [
  { name: "Curso Avulso", price: "19", cents: "90", tag: "A partir de", cta: "Escolher curso", features: ["Acesso vitalício ao curso", "Atualizações incluídas", "Certificado de conclusão", "Comunidade no Telegram"] },
  { name: "Hub Completo", price: "197", cents: "00", tag: "Mais vendido", cta: "Quero o Hub", featured: true, features: ["Todos os 11 cursos", "Acesso vitalício a tudo", "Cursos novos incluídos", "Certificados", "Comunidade VIP", "Suporte direto"] },
  { name: "Hub + Mentoria", price: "497", cents: "00", tag: "Aceleração", cta: "Aplicar agora", features: ["Tudo do Hub Completo", "4 mentorias em grupo/mês", "Revisão de projeto", "Grupo fechado", "Prioridade no suporte"] },
];

const faqs = [
  { q: "Como funciona o acesso?", a: "Após a compra você recebe login imediato na plataforma. É 100% online, no seu ritmo, em qualquer dispositivo — e o acesso é vitalício." },
  { q: "Serve pra quem tá começando do zero?", a: "Sim. Cada curso tem trilha do básico ao avançado. A gente parte do princípio que você nunca fez nada disso — e te leva ao resultado." },
  { q: "Tem suporte?", a: "Sim. Comunidade ativa no Telegram, tira-dúvidas com a equipe, e no plano de mentoria você tem contato direto com a Veronica." },
  { q: "Emite nota fiscal?", a: "Sim, emitimos NF-e automaticamente após a compra. Serve pra CNPJ MEI, ME e pessoa física." },
  { q: "Posso pedir reembolso?", a: "Garantia incondicional de 7 dias. Não gostou? A gente devolve 100% do valor, sem perguntas." },
  { q: "Como recebo os cursos novos?", a: "Todo curso lançado dentro do Hub Completo já entra na sua conta automaticamente, sem custo adicional." },
  { q: "Preciso de equipamento caro?", a: "Não. Todos os cursos são pensados pra funcionar com celular + notebook básico. As ferramentas de IA usadas têm plano free." },
  { q: "Quanto tempo leva pra ter resultado?", a: "Depende de execução. Alunos aplicando 1h/dia costumam ter primeiros resultados entre 30 e 90 dias." },
];

const TAG_ALL = "Todos";

function Index() {
  const tags = useMemo(() => [TAG_ALL, ...Array.from(new Set(courses.map((c) => c.tag)))], []);
  const [activeTag, setActiveTag] = useState<string>(TAG_ALL);
  const filtered = activeTag === TAG_ALL ? courses : courses.filter((c) => c.tag === activeTag);

  const stats = useReveal<HTMLDivElement>();
  const proof = useReveal<HTMLElement>();
  const catalog = useReveal<HTMLElement>();
  const featuresR = useReveal<HTMLElement>();
  const pricingR = useReveal<HTMLElement>();
  const faqR = useReveal<HTMLElement>();
  const ctaR = useReveal<HTMLElement>();

  const c1 = useCountUp(11, stats.visible);
  const c2 = useCountUp(100, stats.visible);
  const c3 = useCountUp(2400, stats.visible, 1800);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Announcement bar with inline CTA */}
      <a
        href="#pricing"
        className="group block border-b border-neon-green/30 bg-gradient-to-r from-neon-green/15 via-neon-green/5 to-neon-cyan/15 transition hover:from-neon-green/25 hover:to-neon-cyan/25"
      >
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-4 gap-y-1 px-6 py-2.5 text-[11px] font-mono-tech uppercase tracking-widest">
          <span className="flex items-center gap-2 text-neon-green">
            <Zap className="h-3 w-3" />
            Acesso vitalício por R$ 19,90
          </span>
          <span className="text-muted-foreground opacity-50">·</span>
          <span className="text-foreground">Últimas vagas do mês</span>
          <span className="ml-2 inline-flex items-center gap-1 text-neon-cyan">
            Garantir <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </a>

      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-border/40 bg-background/70 backdrop-blur-md supports-[backdrop-filter]:bg-background/55">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <a href="#" className="flex items-center gap-2 font-mono-tech text-sm uppercase tracking-widest">
            <span className="h-2 w-2 rounded-full bg-neon-green animate-pulse-dot" />
            <span className="font-display text-base tracking-tight">Veronica</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">Hub</span>
          </a>
          <nav className="hidden items-center gap-1 text-xs font-mono-tech uppercase tracking-wider md:flex">
            {[
              { href: "#cursos", label: "Cursos" },
              { href: "#sobre", label: "Sobre" },
              { href: "#video-ai", label: "Vídeo AI" },
            ].map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="group relative px-3 py-2 text-muted-foreground transition hover:text-neon-green"
              >
                {l.label}
                <span className="absolute inset-x-3 -bottom-0.5 h-px origin-left scale-x-0 bg-neon-green transition-transform duration-300 group-hover:scale-x-100" />
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-3 text-muted-foreground sm:flex">
              <a href="#" aria-label="YouTube" className="transition hover:text-neon-green hover:-translate-y-0.5"><Youtube className="h-4 w-4" /></a>
              <a href="#" aria-label="Instagram" className="transition hover:text-neon-green hover:-translate-y-0.5"><Instagram className="h-4 w-4" /></a>
              <a href="#" aria-label="WhatsApp" className="transition hover:text-neon-green hover:-translate-y-0.5"><MessageCircle className="h-4 w-4" /></a>
            </div>
            <a
              href="#cursos"
              className="group relative inline-flex items-center gap-2 rounded-sm bg-neon-green px-4 py-2 font-mono-tech text-[11px] uppercase tracking-widest text-primary-foreground shadow-[0_0_0_1px_oklch(0.85_0.22_155),0_8px_24px_-8px_oklch(0.85_0.22_155/0.6)] transition duration-200 hover:-translate-y-0.5 hover:shadow-glow-green active:translate-y-0 active:brightness-95"
            >
              <span className="text-[10px] opacity-70 group-hover:opacity-100">▸</span>
              Ver Cursos
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden scanlines">
        {/* Cyborg holographic background */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 animate-holo-shimmer"
          style={{
            backgroundImage: `url(${cyborgAsset.url})`,
            backgroundSize: "cover",
            backgroundPosition: "center right",
            backgroundRepeat: "no-repeat",
            filter: "contrast(1.02) saturate(0.4) hue-rotate(150deg) brightness(0.75) blur(0.3px)",
            mixBlendMode: "screen",
            opacity: 0.22,
          }}
        />
        {/* Holographic scanline sweep */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-32 animate-holo-sweep"
          style={{
            background:
              "linear-gradient(180deg, transparent 0%, oklch(0.88 0.15 195 / 0.14) 45%, oklch(0.85 0.22 155 / 0.22) 50%, oklch(0.88 0.15 195 / 0.14) 55%, transparent 100%)",
            mixBlendMode: "screen",
          }}
        />
        {/* Static scanlines overlay */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent 0 2px, oklch(0.14 0.015 200 / 0.35) 2px 3px)",
            mixBlendMode: "multiply",
          }}
        />
        {/* Fade overlays to blend with dark bg */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, var(--background) 0%, oklch(0.14 0.015 200 / 0.6) 40%, transparent 75%, oklch(0.14 0.015 200 / 0.85) 100%), linear-gradient(180deg, transparent 0%, transparent 55%, var(--background) 100%)",
          }}
        />
        {/* Corner bracket */}
        <div aria-hidden className="pointer-events-none absolute left-6 top-6 h-16 w-16 border-l-2 border-t-2 border-neon-green/70" />
        <div aria-hidden className="pointer-events-none absolute right-6 bottom-6 h-16 w-16 border-r-2 border-b-2 border-neon-cyan/70" />

        <div className="relative mx-auto max-w-7xl px-6 pb-24 pt-20 md:pb-32 md:pt-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-3 rounded-full border border-neon-green/40 bg-background/60 px-4 py-1.5 font-mono-tech text-[10px] uppercase tracking-widest text-neon-green backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-neon-green animate-pulse-dot" />
              Veronica Hub · Laboratório Digital · 2026
            </div>

            <h1 className="mt-8 font-display text-5xl sm:text-7xl md:text-8xl" style={{ letterSpacing: "-0.045em", lineHeight: "0.9" }}>
              <span className="block text-foreground">O Segredo</span>
              <span className="block text-foreground">Tá no</span>
              <span className="block text-outline-neon animate-glow-pulse">
                Prompt<span className="text-neon-green">_</span>
              </span>
            </h1>

            <p className="mt-8 max-w-xl text-base leading-[1.65] text-muted-foreground sm:text-lg">
              Cursos diretos ao ponto para quem quer entrar no digital sem enrolação,
              guiados pela Veronica. Do dark content à IA, do tráfego pago ao hacking ético.
            </p>

            <TerminalBoot />

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <a
                href="#pricing"
                className="group relative inline-flex items-center gap-3 overflow-hidden rounded-sm bg-neon-green px-7 py-4 font-mono-tech text-xs uppercase tracking-[0.18em] text-primary-foreground shadow-glow-green transition duration-200 hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_0_60px_oklch(0.85_0.22_155/0.6)] active:translate-y-0 active:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-green focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <span className="text-[10px] transition-transform group-hover:translate-x-0.5">▸</span>
                Entrar no Hub
                <span aria-hidden className="pointer-events-none absolute inset-y-0 -left-full w-1/2 -skew-x-12 bg-white/25 transition-all duration-700 group-hover:left-[150%]" />
              </a>
              <a
                href="#cursos"
                className="group inline-flex items-center gap-2 rounded-sm border border-border/60 bg-background/40 px-7 py-4 font-mono-tech text-xs uppercase tracking-[0.18em] text-muted-foreground backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:border-neon-cyan/60 hover:bg-neon-cyan/5 hover:text-neon-cyan active:translate-y-0"
              >
                Ver os 11 cursos <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </a>
            </div>
          </div>

          {/* Stats */}
          <div
            ref={stats.ref}
            className={`reveal ${stats.visible ? "reveal-visible" : ""} mt-20 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4`}
          >
            {[
              { value: `${c1}`, suffix: "+", label: "Cursos no hub" },
              { value: `${c2}`, suffix: "%", label: "Online · vitalício" },
              { value: `${c3.toLocaleString("pt-BR")}`, suffix: "+", label: "Alunos ativos" },
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
      <section className="relative overflow-hidden border-y border-border/40 bg-surface/60 py-6">
        <div className="flex animate-marquee gap-10 whitespace-nowrap font-mono-tech text-sm uppercase tracking-widest text-muted-foreground">
          {[...courses, ...courses].map((c, i) => (
            <span key={i} className="flex items-center gap-10">
              <span className="text-neon-green">·</span>
              <span className="transition hover:text-foreground">{c.title}</span>
            </span>
          ))}
        </div>
      </section>

      {/* Social proof */}
      <section
        ref={proof.ref}
        className={`reveal ${proof.visible ? "reveal-visible" : ""} mx-auto max-w-7xl px-6 py-24`}
      >
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 font-mono-tech text-[11px] uppercase tracking-widest text-neon-green">
              <span className="h-px w-8 bg-neon-green" />
              [ 00 ] Prova real
            </div>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl md:text-5xl" style={{ letterSpacing: "-0.04em", lineHeight: "0.95" }}>
              Quem já entrou no Hub<br />
              <span className="text-neon-green text-glow-green">colhe resultado</span>.
            </h2>
          </div>
          <div className="flex items-center gap-3 rounded-sm border border-border/60 bg-background/60 px-4 py-2.5 backdrop-blur">
            <div className="flex items-center gap-0.5 text-neon-green">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-neon-green" />
              ))}
            </div>
            <div className="font-mono-tech text-[11px] uppercase tracking-widest text-muted-foreground">
              <span className="text-foreground">4.9</span> · 2.4k avaliações
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {testimonials.map((t) => (
            <figure
              key={t.name}
              className="group relative overflow-hidden rounded-sm border border-border/60 bg-surface/70 p-6 backdrop-blur transition hover:-translate-y-1 hover:border-neon-green/50 hover:shadow-glow-green"
            >
              <div className="flex items-center justify-between font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground">
                <span className="text-neon-green">{t.course}</span>
                <span className="rounded-full border border-neon-cyan/40 px-2 py-0.5 text-neon-cyan">{t.result}</span>
              </div>
              <blockquote className="mt-5 text-sm leading-[1.65] text-foreground/90">"{t.quote}"</blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-neon font-display text-sm text-primary-foreground">
                  {t.name.charAt(0)}
                </div>
                <div className="font-mono-tech text-[11px] uppercase tracking-widest">
                  <div className="text-foreground">{t.name}</div>
                  <div className="text-muted-foreground">{t.handle}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* Courses grid */}
      <section
        id="cursos"
        ref={catalog.ref}
        className={`reveal ${catalog.visible ? "reveal-visible" : ""} mx-auto max-w-7xl px-6 py-24`}
      >
        <div className="mb-14 flex flex-col gap-3">
          <div className="flex items-center gap-3 font-mono-tech text-[11px] uppercase tracking-widest text-neon-green">
            <span className="h-px w-8 bg-neon-green" />
            [ 01 ] Catálogo · 11 cursos
          </div>
          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl" style={{ letterSpacing: "-0.04em", lineHeight: "0.95" }}>
            Do <span className="text-neon-green text-glow-green">dark content</span>
            <br />
            ao <span className="text-neon-cyan text-glow-cyan">hacking ético</span>.
          </h2>
          <p className="max-w-2xl leading-[1.65] text-muted-foreground">
            Sem fluff. Cada curso é construído sobre resultado real e execução prática.
          </p>
        </div>

        {/* Tag filter */}
        <div className="mb-8 flex flex-wrap gap-2">
          {tags.map((tag) => {
            const active = activeTag === tag;
            return (
              <button
                key={tag}
                onClick={() => setActiveTag(tag)}
                className={`rounded-full border px-3.5 py-1.5 font-mono-tech text-[10px] uppercase tracking-widest transition ${
                  active
                    ? "border-neon-green bg-neon-green/15 text-neon-green shadow-[0_0_20px_-4px_oklch(0.85_0.22_155/0.7)]"
                    : "border-border/60 text-muted-foreground hover:border-neon-green/40 hover:text-foreground"
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c, i) => (
            <a
              key={c.title}
              href="#pricing"
              className={`group relative overflow-hidden rounded-sm border p-6 backdrop-blur transition duration-300 hover:-translate-y-1 hover:shadow-glow-green ${
                c.featured
                  ? "border-neon-green/60 bg-gradient-to-br from-neon-green/8 via-surface/70 to-surface"
                  : "border-border/60 bg-surface/70 hover:border-neon-green/60 hover:bg-surface"
              }`}
            >
              {c.featured && (
                <span className="absolute right-3 top-3 rounded-full bg-neon-green px-2 py-0.5 font-mono-tech text-[9px] uppercase tracking-widest text-primary-foreground">
                  Mais vendido
                </span>
              )}
              <div className="mb-6 flex items-center justify-between">
                <span className="font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground">
                  [ {String(i + 1).padStart(2, "0")} ]
                </span>
                <span className="rounded-full border border-border/60 px-2.5 py-0.5 font-mono-tech text-[9px] uppercase tracking-widest text-muted-foreground group-hover:border-neon-cyan/50 group-hover:text-neon-cyan">
                  {c.tag}
                </span>
              </div>
              <h3 className="font-display text-2xl text-foreground" style={{ letterSpacing: "-0.03em", lineHeight: "1" }}>{c.title}</h3>
              <div className="mt-3 flex items-center gap-3 font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground">
                <span>{c.lessons} aulas</span>
                <span className="opacity-40">·</span>
                <span>{c.hours}</span>
                <span className="opacity-40">·</span>
                <span className="text-neon-cyan/80">{c.level}</span>
              </div>
              <ul className="mt-5 space-y-1.5 text-[13px] text-muted-foreground">
                {c.perks.map((p) => (
                  <li key={p} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-neon-green/80" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex items-center gap-2 font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground transition group-hover:text-neon-green">
                Acessar curso <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
              </div>
              <div className="pointer-events-none absolute right-3 bottom-3 h-4 w-4 border-r border-b border-neon-green/0 transition group-hover:border-neon-green/80" />
            </a>
          ))}
        </div>
      </section>

      {/* Features */}
      <section
        id="sobre"
        ref={featuresR.ref}
        className={`reveal ${featuresR.visible ? "reveal-visible" : ""} border-t border-border/40 bg-surface/40 py-24`}
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-14 flex items-center gap-3 font-mono-tech text-[11px] uppercase tracking-widest text-neon-cyan">
            <span className="h-px w-8 bg-neon-cyan" />
            [ 02 ] Por que Veronica Hub
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: InfinityIcon, title: "Acesso Vitalício", desc: "Pague uma vez, acesse para sempre. Atualizações incluídas." },
              { icon: Wifi, title: "100% Online", desc: "No seu ritmo, no seu horário, em qualquer dispositivo." },
              { icon: Target, title: "Foco em Execução", desc: "Sem fluff. Cada aula é construída sobre resultado real." },
              { icon: Award, title: "Certificado", desc: "Comprovante de conclusão para cada curso finalizado." },
            ].map((f) => (
              <div key={f.title} className="group rounded-sm border border-border/60 bg-background/60 p-6 backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:border-neon-green/50 hover:shadow-glow-green">
                <f.icon className="h-6 w-6 text-neon-green transition-transform group-hover:scale-110" />
                <h3 className="mt-5 font-display text-xl" style={{ letterSpacing: "-0.03em", lineHeight: "1.05" }}>{f.title}</h3>
                <p className="mt-2 text-sm leading-[1.6] text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section
        id="pricing"
        ref={pricingR.ref}
        className={`reveal ${pricingR.visible ? "reveal-visible" : ""} relative border-t border-border/40 py-24`}
      >
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-30" style={{ background: "radial-gradient(circle at 50% 0%, oklch(0.85 0.22 155 / 0.2), transparent 60%)" }} />
        <div className="relative mx-auto max-w-7xl px-6">
          <div className="mb-14 flex flex-col gap-3 text-center">
            <div className="mx-auto flex items-center gap-3 font-mono-tech text-[11px] uppercase tracking-widest text-neon-green">
              <span className="h-px w-8 bg-neon-green" />
              [ 03 ] Planos · escolha o seu
              <span className="h-px w-8 bg-neon-green" />
            </div>
            <h2 className="mx-auto max-w-3xl font-display text-4xl sm:text-5xl md:text-6xl" style={{ letterSpacing: "-0.04em", lineHeight: "0.95" }}>
              Pague uma vez.<br />
              <span className="text-outline-neon">Acesse pra sempre.</span>
            </h2>
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            {plans.map((p) => (
              <div
                key={p.name}
                className={`relative flex flex-col rounded-sm border p-8 backdrop-blur transition duration-300 hover:-translate-y-1 ${
                  p.featured
                    ? "border-neon-green bg-gradient-to-br from-neon-green/10 via-surface to-neon-cyan/5 shadow-glow-green lg:scale-105"
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
                <h3 className="mt-3 font-display text-2xl" style={{ letterSpacing: "-0.03em" }}>{p.name}</h3>
                <div className="mt-6 flex items-baseline gap-1 font-display">
                  <span className="text-2xl text-muted-foreground">R$</span>
                  <span className={`text-6xl ${p.featured ? "text-neon-green text-glow-green" : "text-foreground"}`}>{p.price}</span>
                  <span className="text-2xl text-muted-foreground">,{p.cents}</span>
                </div>
                <div className="mt-1 font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground">
                  Pagamento único · sem mensalidade
                </div>
                <ul className="mt-8 flex-1 space-y-3 text-sm">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-foreground/90">
                      <Check className={`mt-0.5 h-4 w-4 flex-shrink-0 ${p.featured ? "text-neon-green" : "text-neon-cyan/80"}`} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href="#"
                  className={`group mt-10 inline-flex items-center justify-center gap-2 rounded-sm px-6 py-3.5 font-mono-tech text-xs uppercase tracking-[0.18em] transition duration-200 hover:-translate-y-0.5 active:translate-y-0 ${
                    p.featured
                      ? "bg-neon-green text-primary-foreground shadow-glow-green hover:brightness-110"
                      : "border border-border/60 text-foreground hover:border-neon-green/60 hover:text-neon-green"
                  }`}
                >
                  {p.cta} <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </a>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground">
            <span className="flex items-center gap-2"><Check className="h-3 w-3 text-neon-green" /> Garantia 7 dias</span>
            <span className="flex items-center gap-2"><Check className="h-3 w-3 text-neon-green" /> Emite NF</span>
            <span className="flex items-center gap-2"><Check className="h-3 w-3 text-neon-green" /> Cartão · Pix · Boleto</span>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section
        id="faq"
        ref={faqR.ref}
        className={`reveal ${faqR.visible ? "reveal-visible" : ""} border-t border-border/40 bg-surface/30 py-24`}
      >
        <div className="mx-auto max-w-4xl px-6">
          <div className="mb-12">
            <div className="flex items-center gap-3 font-mono-tech text-[11px] uppercase tracking-widest text-neon-cyan">
              <span className="h-px w-8 bg-neon-cyan" />
              [ 04 ] Dúvidas frequentes
            </div>
            <h2 className="mt-3 font-display text-4xl sm:text-5xl" style={{ letterSpacing: "-0.04em", lineHeight: "0.95" }}>
              Antes de entrar,<br />
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
        id="video-ai"
        ref={ctaR.ref}
        className={`reveal ${ctaR.visible ? "reveal-visible" : ""} relative overflow-hidden py-24`}
      >
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-40" style={{ background: "radial-gradient(circle at 30% 50%, oklch(0.85 0.22 155 / 0.25), transparent 50%), radial-gradient(circle at 70% 50%, oklch(0.88 0.15 195 / 0.25), transparent 50%)" }} />
        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <div className="inline-flex items-center gap-2 font-mono-tech text-[10px] uppercase tracking-widest text-neon-green">
            <Zap className="h-3 w-3" /> Comece agora
          </div>
          <h2 className="mt-6 font-display text-4xl sm:text-6xl" style={{ letterSpacing: "-0.04em", lineHeight: "0.95" }}>
            Entre no <span className="text-outline-neon">Hub</span>.<br />
            Domine o <span className="text-neon-cyan text-glow-cyan">digital</span>.
          </h2>
          <p className="mx-auto mt-6 max-w-xl leading-[1.65] text-muted-foreground">
            11 cursos, acesso vitalício, a partir de R$ 19,90. Sem enrolação.
          </p>
          <a
            href="#pricing"
            className="group relative mt-10 inline-flex items-center gap-3 overflow-hidden rounded-sm bg-neon-green px-10 py-5 font-mono-tech text-sm uppercase tracking-[0.18em] text-primary-foreground shadow-glow-green transition duration-200 hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_0_80px_oklch(0.85_0.22_155/0.7)] active:translate-y-0 active:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-green focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Garantir meu acesso <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            <span aria-hidden className="pointer-events-none absolute inset-y-0 -left-full w-1/2 -skew-x-12 bg-white/25 transition-all duration-700 group-hover:left-[150%]" />
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
                Laboratório digital de execução. Cursos diretos ao ponto, do dark content
                à IA generativa. Sem fluff, só resultado.
              </p>
              <div className="mt-6 flex items-center gap-3 text-muted-foreground">
                <a href="#" aria-label="YouTube" className="rounded-sm border border-border/60 p-2 transition hover:-translate-y-0.5 hover:border-neon-green/60 hover:text-neon-green"><Youtube className="h-4 w-4" /></a>
                <a href="#" aria-label="Instagram" className="rounded-sm border border-border/60 p-2 transition hover:-translate-y-0.5 hover:border-neon-green/60 hover:text-neon-green"><Instagram className="h-4 w-4" /></a>
                <a href="#" aria-label="WhatsApp" className="rounded-sm border border-border/60 p-2 transition hover:-translate-y-0.5 hover:border-neon-green/60 hover:text-neon-green"><MessageCircle className="h-4 w-4" /></a>
              </div>
            </div>
            <div>
              <div className="font-mono-tech text-[10px] uppercase tracking-widest text-neon-green">Navegar</div>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li><a href="#cursos" className="transition hover:text-neon-green">Cursos</a></li>
                <li><a href="#pricing" className="transition hover:text-neon-green">Planos</a></li>
                <li><a href="#faq" className="transition hover:text-neon-green">FAQ</a></li>
                <li><a href="#sobre" className="transition hover:text-neon-green">Sobre</a></li>
              </ul>
            </div>
            <div>
              <div className="font-mono-tech text-[10px] uppercase tracking-widest text-neon-green">Drops da Veronica</div>
              <p className="mt-4 text-sm text-muted-foreground">
                Receba táticas, prompts e cases direto no seu email.
              </p>
              <form onSubmit={(e) => e.preventDefault()} className="mt-4 flex overflow-hidden rounded-sm border border-border/60 focus-within:border-neon-green/60">
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
              <a href="#" className="transition hover:text-neon-green">Termos</a>
              <a href="#" className="transition hover:text-neon-green">Privacidade</a>
              <a href="#" className="transition hover:text-neon-green">Contato</a>
            </div>
          </div>
        </div>
      </footer>
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
        <span className="font-display text-base text-foreground sm:text-lg" style={{ letterSpacing: "-0.02em" }}>{q}</span>
        <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-sm border transition ${open ? "border-neon-green bg-neon-green/10 text-neon-green rotate-180" : "border-border/60 text-muted-foreground"}`}>
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
