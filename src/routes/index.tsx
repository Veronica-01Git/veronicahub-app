import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpenCheck,
  Check,
  CirclePlay,
  Compass,
  Layers3,
  Sparkles,
} from "lucide-react";
import ogImage from "@/assets/og-veronica-hub.jpg";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { CoverThumb } from "@/components/blog/CoverThumb";
import { IntentPortal } from "@/components/home/IntentPortal";
import { ToolShowcase } from "@/components/home/ToolShowcase";
import { VeronicaPresence } from "@/components/home/VeronicaPresence";
import { LazyImage } from "@/components/media/LazyImage";
import { getPublishedArticles } from "@/lib/articles-server";
import { BEAT_LABELS } from "@/lib/beats";
import { courses } from "@/lib/courses";
import { product, SPECIAL_PROJECTS } from "@/lib/ecosystem";

export const Route = createFileRoute("/")({
  component: Index,
  loader: async () => {
    try {
      return await getPublishedArticles();
    } catch {
      return { ok: false as const, articles: [], current24hCount: 0 };
    }
  },
  head: () => ({
    meta: [
      { title: "Veronica — Escola de Inteligência Artificial" },
      {
        name: "description",
        content:
          "Aprenda inteligência artificial criando projetos reais com formações e ferramentas da Veronica Hub.",
      },
      { property: "og:title", content: "Veronica — Escola de Inteligência Artificial" },
      {
        property: "og:description",
        content: "Aprenda inteligência artificial criando projetos reais.",
      },
      { name: "twitter:title", content: "Veronica — Escola de Inteligência Artificial" },
      { property: "og:image", content: ogImage },
      { name: "twitter:image", content: ogImage },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "EducationalOrganization",
          name: "Veronica Hub",
          url: "https://veronicahub.com",
          description: "Escola de Inteligência Artificial com aprendizado baseado em projetos.",
          sameAs: ["https://instagram.com/veronicahub_", "https://youtube.com/@veronica-hub"],
        }),
      },
    ],
  }),
});

const highlightedCourses = courses.filter((course) =>
  ["Canais Dark", "Avatar Digital IA"].includes(course.title),
);

const method = [
  { icon: BookOpenCheck, title: "Aprenda", text: "Entenda o fundamento com orientação direta." },
  { icon: CirclePlay, title: "Pratique", text: "Transforme cada conceito em uma ação guiada." },
  { icon: Sparkles, title: "Produza", text: "Use as ferramentas do Hub para criar uma entrega." },
  { icon: Compass, title: "Acompanhe", text: "Evolua com novas formações e com o Veronica Wire." },
];

function SectionHeading({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string;
  title: string;
  text?: string;
}) {
  return (
    <div className="max-w-3xl">
      <p className="font-mono-tech text-xs uppercase tracking-[0.18em] text-neon-green">
        {eyebrow}
      </p>
      <h2 className="mt-3 font-display text-3xl leading-tight tracking-[-0.035em] sm:text-4xl md:text-5xl">
        {title}
      </h2>
      {text && <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">{text}</p>}
    </div>
  );
}

function Status({ children }: { children: string }) {
  return (
    <span className="inline-flex min-h-7 w-fit items-center rounded-full border border-neon-green/30 bg-neon-green/[0.07] px-3 font-mono-tech text-[11px] uppercase tracking-wider text-neon-green">
      {children}
    </span>
  );
}

function Index() {
  const { articles } = Route.useLoaderData();
  const latestArticles = articles.slice(0, 3);
  const zero = product("zero");

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <SiteHeader />
      <main>
        {/* 1. Hero */}
        <section className="relative isolate min-h-[620px] overflow-hidden bg-black">
          <VeronicaPresence />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,oklch(0.09_0.01_200)_0%,oklch(0.09_0.01_200/0.96)_42%,oklch(0.09_0.01_200/0.42)_72%,oklch(0.09_0.01_200/0.72)_100%)]" />
          <div className="relative z-10 mx-auto flex min-h-[620px] max-w-7xl items-center px-6 py-20">
            <div className="max-w-2xl lg:max-w-[58%]">
              <p className="font-mono-tech text-xs uppercase tracking-[0.2em] text-neon-green">
                Escola de Inteligência Artificial
              </p>
              <h1 className="mt-5 font-display text-4xl leading-[1.03] tracking-[-0.045em] sm:text-5xl md:text-6xl lg:text-7xl">
                Aprenda inteligência artificial criando projetos reais.
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-foreground/70 sm:text-lg">
                Para quem quer transformar IA em habilidade prática para criar, trabalhar e
                desenvolver novos projetos.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to={zero.to}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-sm bg-neon-green px-6 text-sm font-semibold text-primary-foreground transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-green focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                >
                  Começar pela Aula Zero <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to={product("formations").to}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-sm border border-white/20 bg-black/30 px-6 text-sm font-semibold text-white transition hover:border-neon-green/60 hover:text-neon-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-green"
                >
                  Explorar formações
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Prova objetiva */}
        <section aria-labelledby="prova-title" className="border-y border-border/40 bg-surface/30">
          <div className="mx-auto max-w-7xl px-6 py-10">
            <h2 id="prova-title" className="sr-only">
              O que já está disponível
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Aula Zero", "Projeto guiado disponível agora"],
                ["Studio Criativo", "Geração de imagens disponível"],
                ["Currículo e Security", "Avaliações disponíveis"],
                ["Ecossistema integrado", "Navegação entre escola, ferramentas e mídia"],
              ].map(([title, text]) => (
                <div key={title} className="flex gap-3">
                  <Check className="mt-1 h-5 w-5 shrink-0 text-neon-green" />
                  <div>
                    <h3 className="font-display text-lg">{title}</h3>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 3. Escolha por objetivo */}
        <section className="mx-auto max-w-7xl px-6 py-16 md:py-20">
          <SectionHeading
            eyebrow="Escolha por objetivo"
            title="Comece pelo que você quer realizar."
            text="Cada caminho leva a uma área real do ecossistema e informa com clareza o que está disponível."
          />
          <div className="mt-10">
            <IntentPortal />
          </div>
        </section>

        {/* 4. Formações em destaque */}
        <section className="border-y border-border/40 bg-surface/30">
          <div className="mx-auto max-w-7xl px-6 py-16 md:py-20">
            <SectionHeading
              eyebrow="Formações em destaque"
              title="Aprenda com uma entrega em vista."
              text="Comece por uma experiência disponível ou acompanhe o que está sendo produzido."
            />
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              <Link
                to={zero.to}
                className="group flex min-h-full flex-col rounded-md border border-neon-green/35 bg-background p-6 transition hover:border-neon-green/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-green"
              >
                <Status>{zero.status}</Status>
                <h3 className="mt-5 font-display text-2xl">{zero.name}</h3>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm text-muted-foreground">
                  <div>
                    <dt className="text-xs uppercase tracking-wider">Nível</dt>
                    <dd className="mt-1 text-foreground">Iniciante</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wider">Duração</dt>
                    <dd className="mt-1 text-foreground">No seu ritmo</dd>
                  </div>
                </dl>
                <p className="mt-5 flex-1 text-sm leading-6 text-muted-foreground">
                  Resultado: publique uma narração criada com IA.
                </p>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-neon-green">
                  Começar agora{" "}
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </Link>
              {highlightedCourses.map((course) => (
                <article
                  key={course.slug}
                  className="overflow-hidden rounded-md border border-border/50 bg-background"
                >
                  <LazyImage
                    src={course.image}
                    alt=""
                    className="aspect-[16/8] w-full object-cover opacity-75"
                  />
                  <div className="p-6">
                    <Status>{course.status === "planned" ? "Em produção" : "Disponível"}</Status>
                    <h3 className="mt-4 font-display text-2xl">{course.title}</h3>
                    <dl className="mt-4 grid grid-cols-2 gap-3 text-sm text-muted-foreground">
                      <div>
                        <dt className="text-xs uppercase tracking-wider">Nível</dt>
                        <dd className="mt-1 text-foreground">{course.level}</dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-wider">Duração</dt>
                        <dd className="mt-1 text-foreground">{course.hours} previstas</dd>
                      </div>
                    </dl>
                    <p className="mt-5 text-sm leading-6 text-muted-foreground">
                      Resultado esperado: {course.outcome}.
                    </p>
                  </div>
                </article>
              ))}
            </div>
            <Link
              to={product("formations").to}
              className="mt-8 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-neon-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-green"
            >
              Ver todas as formações <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* 5. Ferramentas */}
        <ToolShowcase />

        {/* 6. Como funciona */}
        <section className="border-y border-border/40 bg-surface/30">
          <div className="mx-auto max-w-7xl px-6 py-16 md:py-20">
            <SectionHeading
              eyebrow="Como a escola funciona"
              title="Da aprendizagem ao projeto, em quatro passos."
            />
            <ol className="mt-10 grid gap-5 md:grid-cols-4">
              {method.map((step, index) => (
                <li key={step.title} className="rounded-md bg-background p-6">
                  <div className="flex items-center justify-between">
                    <step.icon className="h-6 w-6 text-neon-green" />
                    <span className="font-mono-tech text-xs text-muted-foreground">
                      0{index + 1}
                    </span>
                  </div>
                  <h3 className="mt-6 font-display text-xl">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* 7. Wire, projetos especiais e CTA final */}
        <section className="mx-auto max-w-7xl px-6 py-16 md:py-20">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <SectionHeading
              eyebrow="Veronica Wire"
              title="Informação para continuar aprendendo."
              text="Notícias publicadas no Wire, com fontes e contexto para entender o que está mudando."
            />
            <Link
              to={product("wire").to}
              className="inline-flex min-h-11 shrink-0 items-center gap-2 text-sm font-semibold text-neon-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-green"
            >
              Acessar o Wire <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {latestArticles.length > 0 ? (
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {latestArticles.map((article) => (
                <Link
                  key={article.id}
                  to="/blog/$slug"
                  params={{ slug: article.slug }}
                  className="group overflow-hidden rounded-md border border-border/50 bg-surface/30 transition hover:border-neon-green/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-green"
                >
                  <CoverThumb
                    beat={article.beat}
                    coverImageUrl={article.coverImageUrl}
                    className="aspect-[16/9]"
                  />
                  <div className="p-5">
                    <p className="text-xs uppercase tracking-[0.16em] text-neon-green">
                      {BEAT_LABELS[article.beat]}
                    </p>
                    <h3 className="mt-3 font-display text-xl leading-snug transition group-hover:text-neon-green">
                      {article.headline}
                    </h3>
                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">
                      {article.excerpt}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-8 rounded-md border border-border/50 bg-surface/30 p-6 text-sm text-muted-foreground">
              As notícias mais recentes estão disponíveis diretamente no Veronica Wire.
            </p>
          )}

          <div className="mt-14 border-t border-border/40 pt-10">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Layers3 className="h-4 w-4" /> Projetos especiais
            </div>
            <div className="mt-4 flex flex-wrap gap-x-8 gap-y-4">
              {SPECIAL_PROJECTS.map((item) =>
                item.external ? (
                  <a
                    key={item.id}
                    href={item.to}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-11 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-green"
                  >
                    <span className="font-semibold">{item.name}</span>
                    <span className="ml-2 text-muted-foreground">{item.status}</span>
                  </a>
                ) : (
                  <Link
                    key={item.id}
                    to={item.to}
                    className="min-h-11 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-green"
                  >
                    <span className="font-semibold">{item.name}</span>
                    <span className="ml-2 text-muted-foreground">{item.status}</span>
                  </Link>
                ),
              )}
            </div>
          </div>

          <div className="mt-12 rounded-md bg-foreground px-6 py-10 text-background sm:px-10 md:flex md:items-center md:justify-between md:gap-8">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-background/60">
                Seu primeiro projeto começa aqui
              </p>
              <h2 className="mt-3 max-w-2xl font-display text-3xl leading-tight tracking-[-0.03em] sm:text-4xl">
                Aprenda IA fazendo algo que você pode publicar.
              </h2>
            </div>
            <Link
              to={zero.to}
              className="mt-7 inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-sm bg-neon-green px-6 text-sm font-semibold text-primary-foreground transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-background md:mt-0"
            >
              Começar pela Aula Zero <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
