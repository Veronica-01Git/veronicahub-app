import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, Wand2, FileText, BarChart3, Layers } from "lucide-react";
import { useMemo, useState } from "react";
import { SiteHeader, SiteFooter, HUB_URL } from "@/components/SiteChrome";
import { courses } from "@/lib/courses";

export const Route = createFileRoute("/comandos")({
  component: Comandos,
  head: () => ({
    meta: [
      { title: "Comandos — Catálogo Completo | Veronica Hub" },
      {
        name: "description",
        content: "Os 11 comandos do Veronica Hub: dark content, IA generativa, tráfego pago, VSL, hacking ético. Aprenda e execute no ecossistema.",
      },
      { property: "og:title", content: "Comandos — Catálogo Completo | Veronica Hub" },
      { property: "og:description", content: "Comandos diretos ao ponto pra quem quer entrar no digital sem enrolação." },
      { property: "og:type", content: "website" },
    ],
  }),
});

const TAG_ALL = "Todos";

// Comandos que têm um Prompt Pack correspondente em /prompt-packs.
const PACK_BY_COURSE: Record<string, { label: string; slug: string }> = {
  "VFX com IA": { label: "VFX Ultra-Realista", slug: "vfx-ultra-realista" },
  "Avatar Digital IA": { label: "Avatar Digital", slug: "avatar-digital" },
  "VSL Cinematográfico": { label: "VSL Cinematográfica", slug: "vsl-cinematografica" },
};

type EcosystemCta = {
  icon: typeof Wand2;
  name: string;
  tag: string;
  desc: string;
  to: string;
};

const ECOSYSTEM_CTAS: EcosystemCta[] = [
  {
    icon: Wand2,
    name: "Veronica Studio",
    tag: "Geração com IA",
    desc: "Pegue o que aprendeu no comando e gere imagem, vídeo e voz com IA — do prompt à entrega.",
    to: "/video-ia",
  },
  {
    icon: FileText,
    name: "Currículo-Certo",
    tag: "Carreira",
    desc: "Transforme a execução em currículo pronto pra ATS, feito pra virar entrevista.",
    to: "/veronica-curriculo-certo",
  },
  {
    icon: BarChart3,
    name: "Veronica Analytics",
    tag: "TikTok Shop",
    desc: "Meça o resultado do que você executou e ajuste a rota pra vender mais.",
    to: "/veronica-analytics",
  },
];

function Comandos() {
  const tags = useMemo(() => [TAG_ALL, ...Array.from(new Set(courses.map((c) => c.tag)))], []);
  const [activeTag, setActiveTag] = useState<string>(TAG_ALL);
  const filtered = activeTag === TAG_ALL ? courses : courses.filter((c) => c.tag === activeTag);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <SiteHeader />

      {/* Page header */}
      <section className="relative overflow-hidden border-b border-border/40 py-16 md:py-20">
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-30" style={{ background: "radial-gradient(circle at 20% 0%, oklch(0.85 0.22 155 / 0.18), transparent 55%)" }} />
        <div className="relative mx-auto max-w-7xl px-6">
          <div className="flex items-center gap-3 font-mono-tech text-[11px] uppercase tracking-widest text-neon-green">
            <span className="h-px w-8 bg-neon-green" />
            Catálogo · 11 comandos
          </div>
          <h1 className="mt-4 font-display text-4xl sm:text-5xl md:text-6xl" style={{ letterSpacing: "-0.04em", lineHeight: "0.95" }}>
            Do <span className="text-neon-green text-glow-green">dark content</span>
            <br />
            ao <span className="text-neon-cyan text-glow-cyan">hacking ético</span>.
          </h1>
          <p className="mt-6 max-w-2xl leading-[1.65] text-muted-foreground">
            Sem fluff. Cada comando é construído sobre resultado real e execução prática — e não termina no
            curso: continua nas ferramentas do ecossistema.
          </p>
        </div>
      </section>

      {/* Grid — sem scroll-reveal/content-visibility de propósito: seção alta
          (11 cards, 1 coluna no mobile) já causou bug de seção invisível no
          mobile quando combinada com content-visibility:auto no passado. */}
      <section className="mx-auto max-w-7xl px-6 py-16">
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
          {filtered.map((c, i) => {
            const pack = PACK_BY_COURSE[c.title];
            return (
            <div key={c.title} className="flex flex-col gap-2">
            <a
              id={c.title === "Hacking Ético" ? "hacking-etico" : undefined}
              href={HUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={`group relative overflow-hidden rounded-sm border p-6 backdrop-blur transition duration-300 hover:-translate-y-1 hover:shadow-glow-green ${
                c.featured
                  ? "border-neon-green/60 bg-gradient-to-br from-neon-green/8 via-surface/70 to-surface"
                  : "border-border/60 bg-surface/70 hover:border-neon-green/60 hover:bg-surface"
              }`}
            >
              <div className="relative -mx-6 -mt-6 mb-6 h-36 overflow-hidden border-b border-border/50">
                <img
                  src={c.image}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-cover transition-all duration-700 ease-out group-hover:scale-110 group-hover:[filter:contrast(1.15)_saturate(1.2)_hue-rotate(-8deg)] [filter:contrast(1.05)_saturate(0.75)_brightness(0.75)_hue-rotate(140deg)]"
                />
                <div
                  aria-hidden
                  className="absolute inset-0 opacity-70 transition-opacity duration-500 group-hover:opacity-40"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.85 0.22 155 / 0.35) 0%, transparent 45%, oklch(0.88 0.15 195 / 0.25) 100%)",
                    mixBlendMode: "screen",
                  }}
                />
                <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent" />
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 opacity-50"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(0deg, transparent 0 2px, oklch(0.14 0.015 200 / 0.4) 2px 3px)",
                  }}
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-neon-cyan/25 to-transparent transition-transform duration-1000 ease-out group-hover:translate-x-full"
                />
                <div aria-hidden className="pointer-events-none absolute inset-x-0 top-3 h-px bg-neon-green/0 transition-colors duration-300 group-hover:bg-neon-green/70" />
                <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-4 h-px bg-neon-cyan/0 transition-colors duration-500 group-hover:bg-neon-cyan/60" />
                <span aria-hidden className="absolute left-2 top-2 h-3 w-3 border-l border-t border-neon-green/70" />
                <span aria-hidden className="absolute right-2 top-2 h-3 w-3 border-r border-t border-neon-cyan/70" />
                <span className="absolute left-3 bottom-3 font-mono-tech text-[10px] uppercase tracking-widest text-foreground/90">
                  [ {String(i + 1).padStart(2, "0")} ]
                </span>
                <span className="absolute right-3 bottom-3 rounded-full border border-border/60 bg-background/60 px-2.5 py-0.5 font-mono-tech text-[9px] uppercase tracking-widest text-muted-foreground backdrop-blur group-hover:border-neon-cyan/60 group-hover:text-neon-cyan">
                  {c.tag}
                </span>
                {c.featured && (
                  <span className="absolute right-3 top-3 rounded-full bg-neon-green px-2 py-0.5 font-mono-tech text-[9px] uppercase tracking-widest text-primary-foreground shadow-glow-green">
                    Mais vendido
                  </span>
                )}
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
                Acessar comando <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
              </div>
              <div className="pointer-events-none absolute right-3 bottom-3 h-4 w-4 border-r border-b border-neon-green/0 transition group-hover:border-neon-green/80" />
            </a>
            {pack && (
              <Link
                to="/prompt-packs"
                hash={pack.slug}
                className="flex min-h-[44px] items-center justify-center gap-2 rounded-sm border border-border/50 bg-surface/40 px-3 py-2.5 font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground transition hover:border-neon-cyan/60 hover:text-neon-cyan"
              >
                <Layers className="h-3 w-3" />
                Ver Prompt Pack: {pack.label}
              </Link>
            )}
            </div>
            );
          })}
        </div>
      </section>

      {/* Transição pro ecossistema — a página de comandos nunca deve ser um
          beco sem saída que termina só na compra do curso. */}
      <section className="border-t border-border/40 bg-surface/40 py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 flex flex-col gap-3 text-center">
            <div className="mx-auto flex items-center gap-3 font-mono-tech text-[11px] uppercase tracking-widest text-neon-cyan">
              <span className="h-px w-8 bg-neon-cyan" />
              Depois do comando
              <span className="h-px w-8 bg-neon-cyan" />
            </div>
            <h2 className="mx-auto max-w-2xl font-display text-3xl sm:text-4xl md:text-5xl" style={{ letterSpacing: "-0.04em", lineHeight: "0.95" }}>
              Terminou o comando?<br />
              <span className="text-neon-cyan text-glow-cyan">Agora execute.</span>
            </h2>
            <p className="mx-auto mt-2 max-w-xl leading-[1.65] text-muted-foreground">
              Cada comando entregue vira ação real nas ferramentas do ecossistema. Cadastro grátis, execução na hora.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {ECOSYSTEM_CTAS.map((e) => (
              <Link
                key={e.name}
                to={e.to}
                className="group relative overflow-hidden rounded-sm border border-border/60 bg-background/60 p-6 backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-neon-green/60 hover:shadow-glow-green"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-sm border border-neon-green/50 text-neon-green">
                    <e.icon className="h-5 w-5" />
                  </div>
                  <span className="rounded-full border border-neon-cyan/40 px-2.5 py-0.5 font-mono-tech text-[9px] uppercase tracking-widest text-neon-cyan">
                    {e.tag}
                  </span>
                </div>
                <h3 className="mt-6 font-display text-2xl text-foreground" style={{ letterSpacing: "-0.03em", lineHeight: "1" }}>
                  {e.name}
                </h3>
                <p className="mt-3 text-sm leading-[1.6] text-muted-foreground">{e.desc}</p>
                <div className="mt-6 flex items-center gap-2 font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground transition group-hover:text-neon-green">
                  Cadastrar grátis <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
