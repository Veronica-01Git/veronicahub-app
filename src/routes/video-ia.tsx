import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Play, Sparkles, Wand2, Film, Cpu, Check } from "lucide-react";
import cyborgAsset from "@/assets/veronica-cyborg-v2.jpg.asset.json";
import { SiteHeader, SiteFooter, PageHero, HUB_URL } from "@/components/SiteChrome";

export const Route = createFileRoute("/video-ia")({
  component: VideoIA,
  head: () => ({
    meta: [
      { title: "Vídeo IA — Veronica Hub" },
      {
        name: "description",
        content:
          "Vídeo IA: crie vídeos cinematográficos com IA generativa. Runway, Kling, avatar digital, VSL e pipeline pro guiado pela Veronica.",
      },
      { property: "og:title", content: "Vídeo IA — Veronica Hub" },
      {
        property: "og:description",
        content: "Crie vídeos cinematográficos com IA. Pipeline completo, VFX e avatar digital.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preload", as: "image", href: cyborgAsset.url, fetchpriority: "high" },
    ],
  }),
});

const stack = [
  { icon: Wand2, title: "Runway + Kling", desc: "Geração de cenas cinematográficas com IA de ponta." },
  { icon: Film, title: "VFX generativo", desc: "Efeitos, motion e transições impossíveis no editor tradicional." },
  { icon: Cpu, title: "Avatar digital", desc: "Clone da sua voz e do seu rosto rodando no automático." },
  { icon: Sparkles, title: "Pipeline pro", desc: "Do roteiro à entrega. Um fluxo que escala sem virar mão de obra." },
];

const perks = [
  "Roteiro cinematográfico validado",
  "Prompts prontos pra Runway e Kling",
  "Edição rápida em CapCut + IA",
  "Voz clonada com qualidade broadcast",
  "Templates de VSL que convertem",
  "Pipeline replicável pra clientes",
];

function VideoIA() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <SiteHeader />
      <PageHero
        eyebrow="Curso · Vídeo IA · Runway + Kling"
        title={
          <>
            <span className="block text-foreground">Vídeo</span>
            <span className="block text-outline-neon animate-glow-pulse">
              IA<span className="text-neon-green">_</span>
            </span>
          </>
        }
        subtitle="Cria vídeos cinematográficos com IA generativa. Do prompt à entrega, um pipeline pro que roda em qualquer nicho."
      >
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <a
            href={HUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative inline-flex items-center gap-3 overflow-hidden rounded-sm bg-neon-green px-7 py-4 font-mono-tech text-xs uppercase tracking-[0.18em] text-primary-foreground shadow-glow-green transition duration-200 hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_0_60px_oklch(0.85_0.22_155/0.6)]"
          >
            <span className="text-[10px] transition-transform group-hover:translate-x-0.5">▸</span>
            Entrar no curso
            <span aria-hidden className="pointer-events-none absolute inset-y-0 -left-full w-1/2 -skew-x-12 bg-white/25 transition-all duration-700 group-hover:left-[150%]" />
          </a>
          <a
            href="#player"
            className="group inline-flex items-center gap-2 rounded-sm border border-border/60 bg-background/40 px-7 py-4 font-mono-tech text-xs uppercase tracking-[0.18em] text-muted-foreground backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:border-neon-cyan/60 hover:bg-neon-cyan/5 hover:text-neon-cyan"
          >
            Ver demo <Play className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </a>
        </div>
      </PageHero>

      {/* Player */}
      <section id="player" className="mx-auto max-w-6xl px-6 py-24 cv-auto">
        <div className="mb-10 flex items-center gap-3 font-mono-tech text-[11px] uppercase tracking-widest text-neon-cyan">
          <span className="h-px w-8 bg-neon-cyan" />
          [ 00 ] Demo · aula grátis
        </div>
        <div className="group relative overflow-hidden rounded-sm border border-border/60 bg-surface/70 shadow-glow-cyan">
          <div className="relative aspect-video w-full bg-black">
            {/* Placeholder — troque por <iframe src="..." /> do YouTube/Vimeo/embed real */}
            <div
              aria-hidden
              className="absolute inset-0 opacity-40"
              style={{
                background:
                  "radial-gradient(circle at 50% 50%, oklch(0.88 0.15 195 / 0.4), transparent 60%), repeating-linear-gradient(0deg, transparent 0 2px, oklch(0.14 0.015 200 / 0.4) 2px 3px)",
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                type="button"
                className="group/play relative flex h-24 w-24 items-center justify-center rounded-full border border-neon-green/60 bg-background/60 backdrop-blur transition duration-300 hover:scale-105 hover:border-neon-green hover:shadow-glow-green"
                aria-label="Reproduzir demo"
              >
                <span aria-hidden className="absolute inset-0 rounded-full bg-neon-green/10 animate-pulse-dot" />
                <Play className="h-8 w-8 translate-x-0.5 fill-neon-green text-neon-green" />
              </button>
            </div>
            <div className="absolute left-4 top-4 flex items-center gap-2 rounded-sm border border-neon-green/40 bg-background/70 px-3 py-1 font-mono-tech text-[10px] uppercase tracking-widest text-neon-green backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-neon-green animate-pulse-dot" />
              LIVE · 4K
            </div>
          </div>
        </div>
        <p className="mt-4 text-center font-mono-tech text-[11px] uppercase tracking-widest text-muted-foreground">
          Cole aqui o embed do YouTube/Vimeo pra substituir o placeholder.
        </p>
      </section>

      {/* Stack */}
      <section className="border-t border-border/40 bg-surface/40 py-24 cv-auto">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-14 flex items-center gap-3 font-mono-tech text-[11px] uppercase tracking-widest text-neon-green">
            <span className="h-px w-8 bg-neon-green" />
            [ 01 ] Stack do curso
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {stack.map((s) => (
              <div
                key={s.title}
                className="group rounded-sm border border-border/60 bg-background/60 p-6 backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:border-neon-green/50 hover:shadow-glow-green"
              >
                <s.icon className="h-6 w-6 text-neon-green transition-transform group-hover:scale-110" />
                <h3
                  className="mt-5 font-display text-xl"
                  style={{ letterSpacing: "-0.03em", lineHeight: "1.05" }}
                >
                  {s.title}
                </h3>
                <p className="mt-2 text-sm leading-[1.6] text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Perks */}
      <section className="mx-auto max-w-7xl px-6 py-24 cv-auto">
        <div className="grid gap-12 md:grid-cols-2">
          <div>
            <div className="flex items-center gap-3 font-mono-tech text-[11px] uppercase tracking-widest text-neon-cyan">
              <span className="h-px w-8 bg-neon-cyan" />
              [ 02 ] O que você domina
            </div>
            <h2
              className="mt-3 font-display text-4xl sm:text-5xl"
              style={{ letterSpacing: "-0.04em", lineHeight: "0.95" }}
            >
              Pipeline <span className="text-neon-cyan text-glow-cyan">cinematográfico</span>
              <br />
              guiado pela Veronica.
            </h2>
          </div>
          <ul className="space-y-3">
            {perks.map((p) => (
              <li
                key={p}
                className="flex items-start gap-3 rounded-sm border border-border/60 bg-surface/70 p-4 backdrop-blur transition hover:-translate-y-0.5 hover:border-neon-cyan/50"
              >
                <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-neon-cyan" />
                <span className="text-sm text-foreground/90">{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden py-24 cv-auto">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(circle at 30% 50%, oklch(0.85 0.22 155 / 0.25), transparent 50%), radial-gradient(circle at 70% 50%, oklch(0.88 0.15 195 / 0.25), transparent 50%)",
          }}
        />
        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <h2
            className="font-display text-4xl sm:text-6xl"
            style={{ letterSpacing: "-0.04em", lineHeight: "0.95" }}
          >
            Cria vídeo <span className="text-outline-neon">cinematográfico</span>.<br />
            <span className="text-neon-green text-glow-green">Hoje</span>.
          </h2>
          <a
            href={HUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative mt-10 inline-flex items-center gap-3 overflow-hidden rounded-sm bg-neon-green px-10 py-5 font-mono-tech text-sm uppercase tracking-[0.18em] text-primary-foreground shadow-glow-green transition duration-200 hover:-translate-y-0.5 hover:brightness-110"
          >
            Entrar no curso <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            <span aria-hidden className="pointer-events-none absolute inset-y-0 -left-full w-1/2 -skew-x-12 bg-white/25 transition-all duration-700 group-hover:left-[150%]" />
          </a>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}