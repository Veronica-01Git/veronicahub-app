import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Check, Download, FileText, Sparkles, Target, Zap } from "lucide-react";
import cyborgAsset from "@/assets/veronica-cyborg-v2.jpg.asset.json";
import { SiteHeader, SiteFooter, PageHero, HUB_URL } from "@/components/SiteChrome";

export const Route = createFileRoute("/veronica-curriculo-certo")({
  component: CurriculoCerto,
  head: () => ({
    meta: [
      { title: "Currículo Certo — Veronica Hub" },
      {
        name: "description",
        content:
          "O método Currículo Certo da Veronica: monte um currículo que passa em ATS, chama recrutador e converte em entrevista. Modelos + templates + roteiro.",
      },
      { property: "og:title", content: "Currículo Certo — Veronica Hub" },
      {
        property: "og:description",
        content: "Método completo pra montar o currículo que passa em ATS e chama recrutador.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preload", as: "image", href: cyborgAsset.url, fetchpriority: "high" },
    ],
  }),
});

const modules = [
  { icon: Target, title: "Diagnóstico da vaga", desc: "Leia a vaga certa antes de tocar no currículo. Palavras-chave, senioridade, stack." },
  { icon: FileText, title: "Estrutura ATS-friendly", desc: "Template que passa filtro automatizado de RH sem perder o toque humano." },
  { icon: Sparkles, title: "Copy que converte", desc: "Bullet points com verbo + resultado + métrica. Cada linha vende." },
  { icon: Zap, title: "IA como copiloto", desc: "Prompts prontos pra refinar, traduzir e adaptar o currículo em minutos." },
  { icon: Check, title: "Portfólio + LinkedIn", desc: "Alinhamento total entre currículo, LinkedIn e portfólio pra fechar a narrativa." },
  { icon: Download, title: "Templates prontos", desc: "3 modelos editáveis (Docs + Notion + Figma) revisados pra entrega imediata." },
];

const deliverables = [
  "Template de currículo ATS-friendly (Google Docs)",
  "Checklist de revisão em 10 pontos",
  "Biblioteca de bullets prontos por área",
  "Prompts de IA pra reescrever e adaptar",
  "Guia de otimização do LinkedIn",
  "Aula de storytelling pra entrevista",
];

function CurriculoCerto() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <SiteHeader />
      <PageHero
        eyebrow="Método · Currículo Certo"
        title={
          <>
            <span className="block text-foreground">Currículo</span>
            <span className="block text-outline-neon animate-glow-pulse">
              Certo<span className="text-neon-green">_</span>
            </span>
          </>
        }
        subtitle="Um currículo não é biografia. É funil. Aprende a montar o seu pra passar em ATS, chamar recrutador e virar entrevista."
      >
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <a
            href={HUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative inline-flex items-center gap-3 overflow-hidden rounded-sm bg-neon-green px-7 py-4 font-mono-tech text-xs uppercase tracking-[0.18em] text-primary-foreground shadow-glow-green transition duration-200 hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_0_60px_oklch(0.85_0.22_155/0.6)] active:translate-y-0"
          >
            <span className="text-[10px] transition-transform group-hover:translate-x-0.5">▸</span>
            Quero o método
            <span aria-hidden className="pointer-events-none absolute inset-y-0 -left-full w-1/2 -skew-x-12 bg-white/25 transition-all duration-700 group-hover:left-[150%]" />
          </a>
          <a
            href="#modulos"
            className="group inline-flex items-center gap-2 rounded-sm border border-border/60 bg-background/40 px-7 py-4 font-mono-tech text-xs uppercase tracking-[0.18em] text-muted-foreground backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:border-neon-cyan/60 hover:bg-neon-cyan/5 hover:text-neon-cyan"
          >
            Ver módulos <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </a>
        </div>
      </PageHero>

      {/* Modules */}
      <section id="modulos" className="mx-auto max-w-7xl px-6 py-24 cv-auto">
        <div className="mb-14 flex flex-col gap-3">
          <div className="flex items-center gap-3 font-mono-tech text-[11px] uppercase tracking-widest text-neon-green">
            <span className="h-px w-8 bg-neon-green" />
            [ 01 ] Módulos do método
          </div>
          <h2
            className="font-display text-4xl sm:text-5xl md:text-6xl"
            style={{ letterSpacing: "-0.04em", lineHeight: "0.95" }}
          >
            Da <span className="text-neon-green text-glow-green">vaga</span> ao{" "}
            <span className="text-neon-cyan text-glow-cyan">sim</span>.
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((m, i) => (
            <div
              key={m.title}
              className="group relative overflow-hidden rounded-sm border border-border/60 bg-surface/70 p-6 backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-neon-green/60 hover:shadow-glow-green"
            >
              <div className="mb-6 flex items-center justify-between">
                <span className="font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground">
                  [ {String(i + 1).padStart(2, "0")} ]
                </span>
                <m.icon className="h-5 w-5 text-neon-green transition-transform group-hover:scale-110" />
              </div>
              <h3
                className="font-display text-2xl text-foreground"
                style={{ letterSpacing: "-0.03em", lineHeight: "1" }}
              >
                {m.title}
              </h3>
              <p className="mt-3 text-sm leading-[1.6] text-muted-foreground">{m.desc}</p>
              <div className="pointer-events-none absolute right-3 bottom-3 h-4 w-4 border-r border-b border-neon-green/0 transition group-hover:border-neon-green/80" />
            </div>
          ))}
        </div>
      </section>

      {/* Deliverables */}
      <section className="border-t border-border/40 bg-surface/40 py-24 cv-auto">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 md:grid-cols-2">
          <div>
            <div className="flex items-center gap-3 font-mono-tech text-[11px] uppercase tracking-widest text-neon-cyan">
              <span className="h-px w-8 bg-neon-cyan" />
              [ 02 ] O que você leva
            </div>
            <h2
              className="mt-3 font-display text-4xl sm:text-5xl"
              style={{ letterSpacing: "-0.04em", lineHeight: "0.95" }}
            >
              Tudo pronto pra usar<br />
              <span className="text-neon-green text-glow-green">no mesmo dia</span>.
            </h2>
            <p className="mt-6 text-muted-foreground leading-[1.65]">
              Nada de teoria solta. Você entra na plataforma e sai com um currículo revisado,
              LinkedIn arrumado e um pitch pra entrevista.
            </p>
          </div>
          <ul className="space-y-3">
            {deliverables.map((d) => (
              <li
                key={d}
                className="flex items-start gap-3 rounded-sm border border-border/60 bg-background/60 p-4 backdrop-blur transition hover:-translate-y-0.5 hover:border-neon-green/50"
              >
                <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-neon-green" />
                <span className="text-sm text-foreground/90">{d}</span>
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
            Chega de <span className="text-outline-neon">enviar no vazio</span>.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-muted-foreground leading-[1.65]">
            Entra pro Currículo Certo e transforma envio em entrevista.
          </p>
          <a
            href={HUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative mt-10 inline-flex items-center gap-3 overflow-hidden rounded-sm bg-neon-green px-10 py-5 font-mono-tech text-sm uppercase tracking-[0.18em] text-primary-foreground shadow-glow-green transition duration-200 hover:-translate-y-0.5 hover:brightness-110"
          >
            Garantir meu acesso <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            <span aria-hidden className="pointer-events-none absolute inset-y-0 -left-full w-1/2 -skew-x-12 bg-white/25 transition-all duration-700 group-hover:left-[150%]" />
          </a>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}