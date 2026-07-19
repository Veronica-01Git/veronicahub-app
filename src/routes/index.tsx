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
} from "lucide-react";
import cyborgAsset from "@/assets/veronica-cyborg.jpeg.asset.json";

export const Route = createFileRoute("/")({
  component: Index,
});

const courses = [
  { title: "Canais Dark", tag: "Conteúdo" },
  { title: "VSL Cinematográfico", tag: "Vídeo" },
  { title: "Avatar Digital IA", tag: "IA" },
  { title: "Afiliado", tag: "Vendas" },
  { title: "iFood", tag: "Delivery" },
  { title: "Meta Ads", tag: "Tráfego" },
  { title: "VFX com IA", tag: "IA" },
  { title: "Copywriting", tag: "Escrita" },
  { title: "App no-code", tag: "Dev" },
  { title: "Criar Site", tag: "Dev" },
  { title: "Hacking Ético", tag: "Segurança" },
];

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Top status bar */}
      <div className="border-b border-border/60 bg-background/70 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-6 gap-y-1 px-6 py-2 text-[10px] font-mono-tech uppercase text-muted-foreground">
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-neon-green animate-pulse-dot" />
            Veronica Hub ativo · <span className="text-neon-green">11 cursos</span>
          </span>
          <span className="opacity-40">/</span>
          <span>Acesso <span className="text-foreground">vitalício</span></span>
          <span className="opacity-40">/</span>
          <span>A partir de <span className="text-neon-green">R$ 19,90</span></span>
          <span className="opacity-40">/</span>
          <span>Cursos + Vídeo AI · um único hub</span>
        </div>
      </div>

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
              <span className="block text-outline-neon animate-glow-pulse">Prompt.</span>
            </h1>

            <p className="mt-8 max-w-xl text-base leading-[1.65] text-muted-foreground sm:text-lg">
              Cursos diretos ao ponto para quem quer entrar no digital sem enrolação,
              guiados pela Veronica. Do dark content à IA, do tráfego pago ao hacking ético.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <a
                href="#cursos"
                className="group relative inline-flex items-center gap-3 overflow-hidden rounded-sm bg-neon-green px-7 py-4 font-mono-tech text-xs uppercase tracking-[0.18em] text-primary-foreground shadow-glow-green transition duration-200 hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_0_60px_oklch(0.85_0.22_155/0.6)] active:translate-y-0 active:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-green focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <span className="text-[10px] transition-transform group-hover:translate-x-0.5">▸</span>
                Explorar cursos
                <span aria-hidden className="pointer-events-none absolute inset-y-0 -left-full w-1/2 -skew-x-12 bg-white/25 transition-all duration-700 group-hover:left-[150%]" />
              </a>
              <a
                href="#sobre"
                className="group inline-flex items-center gap-2 rounded-sm border border-border/60 bg-background/40 px-7 py-4 font-mono-tech text-xs uppercase tracking-[0.18em] text-muted-foreground backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:border-neon-cyan/60 hover:bg-neon-cyan/5 hover:text-neon-cyan active:translate-y-0"
              >
                Sobre a Veronica <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </a>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {[
              { value: "11", suffix: "+", label: "Cursos" },
              { value: "100", suffix: "%", label: "Online" },
              { value: "∞", suffix: "", label: "Acesso" },
              { value: "R$19", suffix: ",90", label: "A partir de" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-sm border border-border/60 bg-background/50 p-5 backdrop-blur transition hover:border-neon-green/50 hover:shadow-glow-green"
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

      {/* Courses grid */}
      <section id="cursos" className="mx-auto max-w-7xl px-6 py-24">
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

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c, i) => (
            <a
              key={c.title}
              href="#"
              className="group relative overflow-hidden rounded-sm border border-border/60 bg-surface/70 p-6 backdrop-blur transition hover:border-neon-green/60 hover:bg-surface hover:shadow-glow-green"
            >
              <div className="mb-6 flex items-center justify-between">
                <span className="font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground">
                  [ {String(i + 1).padStart(2, "0")} ]
                </span>
                <span className="rounded-full border border-border/60 px-2.5 py-0.5 font-mono-tech text-[9px] uppercase tracking-widest text-muted-foreground group-hover:border-neon-cyan/50 group-hover:text-neon-cyan">
                  {c.tag}
                </span>
              </div>
              <h3 className="font-display text-2xl text-foreground" style={{ letterSpacing: "-0.03em", lineHeight: "1" }}>{c.title}</h3>
              <div className="mt-8 flex items-center gap-2 font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground transition group-hover:text-neon-green">
                Acessar curso <ArrowRight className="h-3 w-3" />
              </div>
              {/* corner accent */}
              <div className="pointer-events-none absolute right-3 top-3 h-4 w-4 border-r border-t border-neon-green/0 transition group-hover:border-neon-green/80" />
            </a>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="sobre" className="border-t border-border/40 bg-surface/40 py-24">
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

      {/* CTA */}
      <section id="video-ai" className="relative overflow-hidden py-24">
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
            href="#cursos"
            className="group relative mt-10 inline-flex items-center gap-3 overflow-hidden rounded-sm bg-neon-green px-10 py-5 font-mono-tech text-sm uppercase tracking-[0.18em] text-primary-foreground shadow-glow-green transition duration-200 hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_0_80px_oklch(0.85_0.22_155/0.7)] active:translate-y-0 active:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-green focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Ver todos os cursos <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            <span aria-hidden className="pointer-events-none absolute inset-y-0 -left-full w-1/2 -skew-x-12 bg-white/25 transition-all duration-700 group-hover:left-[150%]" />
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground md:flex-row">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-neon-green animate-pulse-dot" />
            Veronica Hub · Laboratório Digital · 2026
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="transition hover:text-neon-green">Termos</a>
            <a href="#" className="transition hover:text-neon-green">Privacidade</a>
            <a href="#" className="transition hover:text-neon-green">Contato</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
