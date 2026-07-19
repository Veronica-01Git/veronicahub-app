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
      <div className="border-b border-border/60 bg-background/60 backdrop-blur">
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
      <header className="relative z-20 border-b border-border/40">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <a href="#" className="flex items-center gap-2 font-mono-tech text-sm uppercase tracking-widest">
            <span className="h-2 w-2 rounded-full bg-neon-green animate-pulse-dot" />
            <span className="font-display text-base">Veronica</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">Hub</span>
          </a>
          <nav className="hidden items-center gap-8 text-xs font-mono-tech uppercase tracking-wider md:flex">
            <a href="#cursos" className="text-muted-foreground transition hover:text-neon-green">Cursos</a>
            <a href="#sobre" className="text-muted-foreground transition hover:text-neon-green">Sobre</a>
            <a href="#video-ai" className="text-muted-foreground transition hover:text-neon-green">Vídeo AI</a>
          </nav>
          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-3 text-muted-foreground sm:flex">
              <a href="#" aria-label="YouTube" className="transition hover:text-neon-green"><Youtube className="h-4 w-4" /></a>
              <a href="#" aria-label="Instagram" className="transition hover:text-neon-green"><Instagram className="h-4 w-4" /></a>
              <a href="#" aria-label="WhatsApp" className="transition hover:text-neon-green"><MessageCircle className="h-4 w-4" /></a>
            </div>
            <a
              href="#cursos"
              className="rounded-sm border border-neon-green/60 bg-neon-green/5 px-4 py-2 font-mono-tech text-[11px] uppercase tracking-widest text-neon-green transition hover:bg-neon-green/15 hover:shadow-glow-green"
            >
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
          className="pointer-events-none absolute inset-0 animate-flicker"
          style={{
            backgroundImage: `url(${cyborgAsset.url})`,
            backgroundSize: "cover",
            backgroundPosition: "center right",
            backgroundRepeat: "no-repeat",
            filter: "contrast(1.05) saturate(0.55) hue-rotate(140deg) brightness(0.85)",
            mixBlendMode: "screen",
            opacity: 0.42,
          }}
        />
        {/* Fade overlays to blend with dark bg */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, var(--background) 0%, transparent 45%, transparent 70%, var(--background) 100%), linear-gradient(180deg, transparent 0%, transparent 60%, var(--background) 100%)",
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

            <h1 className="mt-8 font-display text-5xl leading-[0.95] sm:text-7xl md:text-8xl">
              <span className="block text-foreground">O Segredo</span>
              <span className="block text-foreground">Tá no</span>
              <span className="block text-outline-neon animate-glow-pulse">Prompt.</span>
            </h1>

            <p className="mt-8 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Cursos diretos ao ponto para quem quer entrar no digital sem enrolação,
              guiados pela Veronica. Do dark content à IA, do tráfego pago ao hacking ético.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <a
                href="#cursos"
                className="group inline-flex items-center gap-2 rounded-sm bg-neon-green px-6 py-3.5 font-mono-tech text-xs uppercase tracking-widest text-primary-foreground shadow-glow-green transition hover:brightness-110"
              >
                <span className="text-[10px]">▸</span>
                Explorar cursos
              </a>
              <a
                href="#sobre"
                className="inline-flex items-center gap-2 rounded-sm border border-border/60 px-6 py-3.5 font-mono-tech text-xs uppercase tracking-widest text-muted-foreground transition hover:border-neon-cyan/60 hover:text-neon-cyan"
              >
                Sobre a Veronica <ArrowRight className="h-3 w-3" />
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
          <h2 className="font-display text-4xl leading-tight sm:text-5xl md:text-6xl">
            Do <span className="text-neon-green text-glow-green">dark content</span>
            <br />
            ao <span className="text-neon-cyan text-glow-cyan">hacking ético</span>.
          </h2>
          <p className="max-w-2xl text-muted-foreground">
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
              <h3 className="font-display text-2xl leading-tight text-foreground">{c.title}</h3>
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
              <div key={f.title} className="rounded-sm border border-border/60 bg-background/60 p-6 backdrop-blur transition hover:border-neon-green/50">
                <f.icon className="h-6 w-6 text-neon-green" />
                <h3 className="mt-5 font-display text-xl">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
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
          <h2 className="mt-6 font-display text-4xl leading-tight sm:text-6xl">
            Entre no <span className="text-outline-neon">Hub</span>.<br />
            Domine o <span className="text-neon-cyan text-glow-cyan">digital</span>.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-muted-foreground">
            11 cursos, acesso vitalício, a partir de R$ 19,90. Sem enrolação.
          </p>
          <a
            href="#cursos"
            className="mt-10 inline-flex items-center gap-2 rounded-sm bg-neon-green px-8 py-4 font-mono-tech text-xs uppercase tracking-widest text-primary-foreground shadow-glow-green transition hover:brightness-110"
          >
            Ver todos os cursos <ArrowRight className="h-4 w-4" />
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
