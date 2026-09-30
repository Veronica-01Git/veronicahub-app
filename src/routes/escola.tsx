import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  Code2,
  GraduationCap,
  MessageCircle,
  Play,
  Rocket,
  ShieldCheck,
  Sparkles,
  Wand2,
} from "lucide-react";
import { useState } from "react";
import ogImage from "@/assets/og-veronica-hub.jpg";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { VeronicaDrawer } from "@/components/VeronicaDrawer";
import { courses } from "@/lib/courses";

export const Route = createFileRoute("/escola")({
  component: Escola,
  head: () => ({
    meta: [
      { title: "Veronica School of Artificial Intelligence" },
      {
        name: "description",
        content:
          "Aprenda inteligência artificial construindo projetos reais. Trilhas CREATE, BUILD, GROW e SECURE.",
      },
      { property: "og:title", content: "Veronica School of Artificial Intelligence" },
      {
        property: "og:description",
        content: "Watch. Build. Test. Publish. Uma escola de IA orientada à execução.",
      },
      { property: "og:image", content: ogImage },
      { name: "twitter:image", content: ogImage },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "EducationalOrganization",
          name: "Veronica School of Artificial Intelligence",
          url: "https://veronicahub.com/escola",
          description:
            "Escola de inteligência artificial orientada a projetos práticos e publicação.",
        }),
      },
    ],
  }),
});

const tracks = [
  {
    code: "01",
    label: "CREATE",
    title: "Crie com IA",
    copy: "Avatar, vídeo, VFX, conteúdo e direção criativa.",
    icon: Sparkles,
    href: "/formacoes",
    hash: "create",
  },
  {
    code: "02",
    label: "BUILD",
    title: "Construa produtos",
    copy: "Sites, apps e experiências digitais orientadas a resultado.",
    icon: Code2,
    href: "/formacoes",
    hash: "build",
  },
  {
    code: "03",
    label: "GROW",
    title: "Cresça com contexto",
    copy: "Copy, mídia, afiliados e operação comercial com leitura de dados.",
    icon: Rocket,
    href: "/formacoes",
    hash: "grow",
  },
  {
    code: "04",
    label: "SECURE",
    title: "Proteja o que criou",
    copy: "Segurança defensiva, análise autorizada e prevenção.",
    icon: ShieldCheck,
    href: "/formacoes",
    hash: "secure",
  },
] as const;

const method = [
  ["01", "WATCH", "Assista apenas o necessário para entender a habilidade."],
  ["02", "BUILD", "Construa enquanto aprende. A aula já nasce como projeto."],
  ["03", "TEST", "Compare versões, revise decisões e valide o resultado."],
  ["04", "PUBLISH", "Transforme o exercício em algo demonstrável e publicável."],
] as const;

function Escola() {
  const [tutorOpen, setTutorOpen] = useState(false);

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <VeronicaDrawer
        skillId="school"
        open={tutorOpen}
        stepId={null}
        onClose={() => setTutorOpen(false)}
      />
      <SiteHeader />

      <main>
        <section className="relative min-h-[88svh] overflow-hidden border-b border-border/40 bg-[#020605]">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 76% 24%, oklch(0.84 0.2 155 / .18), transparent 28%), radial-gradient(circle at 18% 78%, oklch(0.74 0.13 205 / .12), transparent 30%), linear-gradient(135deg, rgba(255,255,255,.015), transparent 45%)",
            }}
          />
          <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[.055] [background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:72px_72px]" />

          <div className="relative mx-auto grid min-h-[88svh] max-w-7xl gap-12 px-6 py-20 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-3 rounded-full border border-neon-green/30 bg-neon-green/[.045] px-4 py-2 font-mono-tech text-[9px] uppercase tracking-[.24em] text-neon-green">
                <span className="h-1.5 w-1.5 rounded-full bg-neon-green shadow-glow-green" />
                Veronica School of Artificial Intelligence
              </div>
              <h1
                className="mt-7 max-w-5xl font-display text-5xl sm:text-6xl md:text-8xl lg:text-[7rem]"
                style={{ letterSpacing: "-.06em", lineHeight: ".87" }}
              >
                Learn.
                <span className="block text-neon-green text-glow-green">Build.</span>
                <span className="block">Ship.</span>
              </h1>
              <p className="mt-7 max-w-xl text-base leading-7 text-white/58 sm:text-lg">
                Aprenda inteligência artificial construindo coisas reais — não acumulando horas de vídeo.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/aula-zero"
                  className="inline-flex min-h-12 items-center gap-2 rounded-full bg-neon-green px-6 font-mono-tech text-[10px] uppercase tracking-[.16em] text-primary-foreground shadow-glow-green transition hover:scale-[1.02]"
                >
                  Começar pela Aula Zero <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  to="/formacoes"
                  className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/20 bg-white/[.025] px-6 font-mono-tech text-[10px] uppercase tracking-[.16em] text-white/72 backdrop-blur transition hover:border-neon-cyan/50 hover:text-neon-cyan"
                >
                  Explorar formações
                </Link>
              </div>

              <div className="mt-10 grid max-w-2xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-4">
                {["Watch", "Build", "Test", "Publish"].map((item) => (
                  <div key={item} className="bg-[#07100e]/95 px-4 py-4 text-center font-mono-tech text-[9px] uppercase tracking-[.2em] text-white/42">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-10 rounded-full bg-neon-green/10 blur-3xl" aria-hidden />
              <div className="relative overflow-hidden rounded-[34px] border border-neon-green/25 bg-[linear-gradient(145deg,#07120f,#020504)] p-6 shadow-[0_50px_140px_-60px_oklch(0.84_0.2_155/.6)] sm:p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-mono-tech text-[9px] uppercase tracking-[.24em] text-neon-green">
                      Start here
                    </div>
                    <div className="mt-2 font-display text-2xl">Aula Zero</div>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-neon-green/35 bg-neon-green/[.06] text-neon-green">
                    <Play className="ml-0.5 h-4 w-4" />
                  </div>
                </div>
                <h2 className="mt-12 max-w-md font-display text-4xl sm:text-5xl">
                  Sua primeira entrega começa em minutos.
                </h2>
                <p className="mt-5 max-w-md text-sm leading-7 text-white/48">
                  Faça uma aula curta, produza uma narração com IA e entenda a metodologia antes de escolher uma trilha.
                </p>
                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  <Link
                    to="/aula-zero"
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white px-5 font-mono-tech text-[9px] uppercase tracking-[.15em] text-black"
                  >
                    Abrir Aula Zero <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setTutorOpen(true)}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/18 px-5 font-mono-tech text-[9px] uppercase tracking-[.15em] text-white/70"
                  >
                    <MessageCircle className="h-3.5 w-3.5" /> Perguntar à Veronica
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-20 md:py-28">
          <div className="grid gap-8 lg:grid-cols-[.72fr_1.28fr] lg:items-end">
            <div>
              <div className="font-mono-tech text-[10px] uppercase tracking-[.26em] text-neon-green">
                Escolha sua direção
              </div>
              <h2 className="mt-4 font-display text-4xl sm:text-5xl md:text-6xl">
                Quatro trilhas.
                <span className="block text-muted-foreground">Uma lógica de execução.</span>
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-muted-foreground lg:justify-self-end">
              Em vez de uma parede de cursos, a Escola organiza o aprendizado pelo que você quer criar, construir, crescer ou proteger.
            </p>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-2">
            {tracks.map((track) => {
              const Icon = track.icon;
              return (
                <Link
                  key={track.label}
                  to={track.href}
                  hash={track.hash}
                  className="group relative overflow-hidden rounded-[28px] border border-border/60 bg-surface/30 p-6 transition duration-500 hover:-translate-y-1 hover:border-neon-green/35 sm:p-8"
                >
                  <div
                    aria-hidden
                    className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-neon-green/[.05] blur-3xl transition group-hover:bg-neon-green/[.09]"
                  />
                  <div className="relative">
                    <div className="flex items-center justify-between">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-neon-green/25 bg-neon-green/[.045] text-neon-green">
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="font-mono-tech text-[9px] tracking-[.22em] text-muted-foreground">{track.code}</span>
                    </div>
                    <div className="mt-12 font-mono-tech text-[9px] uppercase tracking-[.25em] text-neon-green">{track.label}</div>
                    <h3 className="mt-3 font-display text-4xl">{track.title}</h3>
                    <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">{track.copy}</p>
                    <div className="mt-8 inline-flex items-center gap-2 font-mono-tech text-[9px] uppercase tracking-[.16em] text-muted-foreground transition group-hover:text-neon-green">
                      Abrir trilha <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="border-y border-border/40 bg-[#04100e] py-20 text-white md:py-28">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid gap-10 lg:grid-cols-[.7fr_1.3fr]">
              <div>
                <div className="font-mono-tech text-[9px] uppercase tracking-[.26em] text-neon-green">
                  Método Veronica
                </div>
                <h2 className="mt-4 max-w-md font-display text-5xl leading-[.92] sm:text-6xl">
                  Assista menos.
                  <span className="block text-neon-green">Execute mais.</span>
                </h2>
              </div>
              <div className="grid gap-px overflow-hidden rounded-[28px] bg-white/10 sm:grid-cols-2">
                {method.map(([number, title, copy]) => (
                  <article key={number} className="min-h-[230px] bg-[#06110f] p-6 sm:p-8">
                    <div className="font-mono-tech text-[9px] tracking-[.22em] text-white/28">{number}</div>
                    <div className="mt-12 font-display text-3xl">{title}</div>
                    <p className="mt-4 max-w-sm text-sm leading-6 text-white/42">{copy}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-20 md:py-28">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
            <div>
              <div className="font-mono-tech text-[10px] uppercase tracking-[.25em] text-neon-cyan">
                Primeira formação em construção
              </div>
              <h2 className="mt-4 max-w-3xl font-display text-5xl leading-[.94] sm:text-6xl">
                Avatar Digital IA.
                <span className="block text-muted-foreground">Identidade antes da imagem.</span>
              </h2>
              <p className="mt-6 max-w-xl text-sm leading-7 text-muted-foreground">
                A prévia já tem página de formação e Classroom funcional com laboratório, progresso local e Veronica Tutor. Os módulos seguintes continuam marcados como em produção.
              </p>
              <Link
                to="/formacoes/avatar-digital-ia"
                className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-full border border-neon-green/35 bg-neon-green/[.04] px-6 font-mono-tech text-[10px] uppercase tracking-[.16em] text-neon-green"
              >
                Ver formação <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="rounded-[30px] border border-border/60 bg-surface/35 p-6 sm:p-8">
              <div className="flex items-center gap-3">
                <GraduationCap className="h-5 w-5 text-neon-green" />
                <span className="font-mono-tech text-[9px] uppercase tracking-[.2em] text-neon-green">Course architecture</span>
              </div>
              <div className="mt-8 space-y-3">
                {[
                  "01 · Identidade antes da imagem — prévia disponível",
                  "02 · Voz e presença — em produção",
                  "03 · Direção visual — em produção",
                  "04 · Roteiro e performance — em produção",
                  "05 · Publicação responsável — em produção",
                ].map((item, index) => (
                  <div key={item} className="flex items-center gap-3 border-t border-border/55 pt-3 text-sm text-muted-foreground">
                    <span className={index === 0 ? "h-2 w-2 rounded-full bg-neon-green shadow-glow-green" : "h-2 w-2 rounded-full bg-border"} />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-border/40 bg-surface/30 py-20 md:py-28">
          <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[.85fr_1.15fr] lg:items-center">
            <div>
              <MessageCircle className="h-6 w-6 text-neon-green" />
              <div className="mt-5 font-mono-tech text-[9px] uppercase tracking-[.24em] text-neon-green">
                Veronica Tutor
              </div>
              <h2 className="mt-3 font-display text-5xl sm:text-6xl">A professora fica dentro da aula.</h2>
              <p className="mt-6 max-w-xl text-sm leading-7 text-muted-foreground">
                O tutor já funciona com um contexto próprio da Escola. Ele ajuda com a metodologia, a trilha CREATE e a prévia de Avatar Digital IA sem fingir módulos, vídeos ou rastreamento que ainda não existem.
              </p>
              <button
                type="button"
                onClick={() => setTutorOpen(true)}
                className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-full bg-neon-green px-6 font-mono-tech text-[10px] uppercase tracking-[.16em] text-primary-foreground shadow-glow-green"
              >
                Abrir Veronica Tutor <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="rounded-[30px] border border-neon-green/25 bg-background/75 p-6 sm:p-8">
              <div className="font-mono-tech text-[9px] uppercase tracking-[.22em] text-muted-foreground">Aluno</div>
              <div className="mt-3 rounded-2xl border border-border/60 bg-surface/45 p-4 text-sm text-muted-foreground">
                “Meu avatar está bonito, mas parece genérico. O que eu corrijo primeiro?”
              </div>
              <div className="mt-5 font-mono-tech text-[9px] uppercase tracking-[.22em] text-neon-green">Veronica</div>
              <div className="mt-3 rounded-2xl border border-neon-green/25 bg-neon-green/[.035] p-4 text-sm leading-6">
                Volte para identidade: função, público, personalidade e assinatura visual. Se esses quatro itens ainda poderiam descrever qualquer avatar, a imagem está tentando compensar uma direção que ainda não foi decidida.
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-20 md:py-28">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                icon: Wand2,
                title: "Studio",
                copy: "Execute imagem, voz e mídia no ambiente criativo do ecossistema.",
                to: "/studio-veronica" as const,
              },
              {
                icon: BookOpen,
                title: "Portfolio",
                copy: "Transforme projetos concluídos em material demonstrável e publicável.",
                to: "/portfolio" as const,
              },
              {
                icon: MessageCircle,
                title: "Members",
                copy: "Continue aprendendo com novidades, prompts e comunidade.",
                to: "/membros" as const,
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.title}
                  to={item.to}
                  className="group rounded-[26px] border border-border/60 bg-surface/30 p-6 transition hover:-translate-y-1 hover:border-neon-green/30 sm:p-8"
                >
                  <Icon className="h-5 w-5 text-neon-green" />
                  <h3 className="mt-10 font-display text-3xl">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.copy}</p>
                  <div className="mt-6 inline-flex items-center gap-2 font-mono-tech text-[9px] uppercase tracking-[.16em] text-muted-foreground transition group-hover:text-neon-green">
                    Continuar <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
