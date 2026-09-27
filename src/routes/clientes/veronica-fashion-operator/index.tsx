import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Play, Sparkles } from "lucide-react";

import { AppleClientFrame } from "@/features/private-clients/components/apple-client-ui";
import { fashionMediaById } from "@/features/private-clients/data/fashion-media";

export const Route = createFileRoute("/clientes/veronica-fashion-operator/")({
  component: VeronicaFashion,
  head: () => ({
    meta: [
      { title: "Veronica Fashion & Co. | Human System" },
      {
        name: "description",
        content:
          "Maison digital de inteligência para criar, desenvolver e operar marcas de moda.",
      },
      { property: "og:title", content: "Veronica Fashion & Co. — Human System" },
      {
        property: "og:description",
        content: "From idea to label. Collection 001 — Human System.",
      },
    ],
  }),
});

const heroDesktop = fashionMediaById("human-system-hero-desktop")!;
const heroMobile = fashionMediaById("human-system-hero-mobile")!;
const editorialPortrait = fashionMediaById("human-system-editorial")!;
const collectionLook = fashionMediaById("human-system-full-look")!;

const cards = [
  {
    eyebrow: "Para novas marcas",
    title: "Crie sua marca",
    copy: "Da ideia ao posicionamento, coleção, produção e mercado.",
    cta: "Comece aqui",
    image: editorialPortrait,
    href: "#atelier",
  },
  {
    eyebrow: "Coleção",
    title: "Desenvolva sua coleção",
    copy: "Transforme conceito em peças reais com direção e tecnologia.",
    cta: "Veja como",
    image: collectionLook,
    href: "#collection",
  },
  {
    eyebrow: "Operação",
    title: "Opere com inteligência",
    copy: "Fashion OS: gestão, produção, estoque, margem e crescimento.",
    cta: "Explorar Fashion OS",
    image: heroDesktop,
    href: "/clientes/veronica-fashion-operator/execucao",
  },
  {
    eyebrow: "Human System",
    title: "Faça parte",
    copy: "Uma nova geração de marcas de moda, humanas e inteligentes.",
    cta: "Conheça a maison",
    image: heroMobile,
    href: "#manifesto",
  },
] as const;

function VeronicaFashion() {
  return (
    <AppleClientFrame tone="violet">
      <main className="bg-[#f3efe8] text-[#111]">
        <section id="maison" className="relative min-h-[100svh] overflow-hidden bg-[#0b0b0b] text-white">
          <picture>
            <source media="(max-width: 767px)" srcSet={heroMobile.src} />
            <img
              src={heroDesktop.src}
              alt={heroDesktop.alt}
              className="absolute inset-0 h-full w-full object-cover object-[58%_center] md:object-center"
              loading="eager"
              fetchPriority="high"
            />
          </picture>

          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,.88)_0%,rgba(0,0,0,.62)_34%,rgba(0,0,0,.08)_69%,rgba(0,0,0,.08)_100%)] md:bg-[linear-gradient(90deg,rgba(0,0,0,.86)_0%,rgba(0,0,0,.58)_38%,rgba(0,0,0,.08)_68%,rgba(0,0,0,.08)_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.2),transparent_28%,transparent_68%,rgba(0,0,0,.46))]" />

          <header className="relative z-20 mx-auto flex h-[82px] max-w-[1500px] items-center px-5 sm:px-8 lg:px-10">
            <Link to="/" className="shrink-0">
              <span className="block font-serif text-[24px] leading-none tracking-[.055em] sm:text-[30px]">VERONICA</span>
              <span className="mt-2 block text-[8px] uppercase tracking-[.52em] text-white/72">Fashion & Co.</span>
            </Link>

            <nav className="ml-auto hidden items-center gap-7 text-[10px] uppercase tracking-[.08em] text-white/82 lg:flex">
              <a href="#maison" className="border-b border-white/60 pb-2">Início</a>
              <a href="#manifesto" className="transition hover:text-white">A Maison</a>
              <a href="#atelier" className="transition hover:text-white">Crie sua marca</a>
              <a href="#collection" className="transition hover:text-white">Coleções</a>
              <Link to="/clientes/veronica-fashion-operator/execucao" className="transition hover:text-white">Fashion OS</Link>
            </nav>

            <Link
              to="/membros"
              className="ml-auto hidden rounded-full border border-white/60 bg-white/10 px-6 py-3 text-[9px] uppercase tracking-[.14em] backdrop-blur-md transition hover:bg-white hover:text-black sm:inline-flex lg:ml-9"
            >
              Área de membros
            </Link>
          </header>

          <div className="relative z-10 mx-auto flex min-h-[calc(100svh-82px)] max-w-[1500px] items-center px-5 pb-12 pt-8 sm:px-8 lg:px-10">
            <div className="grid w-full gap-12 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
              <div className="max-w-[760px]">
                <div className="text-[9px] uppercase tracking-[.44em] text-white/76">Moda · Tecnologia · Negócios · Impacto</div>
                <h1 className="mt-5 font-serif text-[clamp(4.2rem,8vw,8.5rem)] leading-[.76] tracking-[-.065em]">
                  VERONICA
                  <span className="block">FASHION & CO.</span>
                </h1>
                <div className="mt-5 text-[11px] uppercase tracking-[.48em] text-white/84">From idea to label</div>
                <p className="mt-6 max-w-lg text-sm leading-7 text-white/72 sm:text-[15px]">
                  A maison digital para criar, desenvolver e operar marcas de moda com visão, identidade e inteligência.
                </p>

                <div className="mt-7 flex flex-wrap gap-3">
                  <a
                    href="#atelier"
                    className="inline-flex min-h-12 items-center gap-5 rounded-full bg-white px-6 text-[10px] font-semibold uppercase tracking-[.1em] text-black transition duration-500 hover:scale-[1.02]"
                  >
                    Crie sua marca <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </a>
                  <Link
                    to="/clientes/veronica-fashion-operator/execucao"
                    className="inline-flex min-h-12 items-center gap-5 rounded-full border border-white/65 px-6 text-[10px] font-semibold uppercase tracking-[.1em] text-white backdrop-blur-sm transition duration-500 hover:bg-white hover:text-black"
                  >
                    Conheça o Fashion OS <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </Link>
                </div>

                <div className="mt-9 flex flex-wrap gap-x-10 gap-y-4 border-t border-white/18 pt-5 text-[9px] uppercase tracking-[.16em] text-white/55">
                  <span>Collection 001</span>
                  <span>Human System</span>
                  <span>Member 03</span>
                </div>
              </div>

              <aside className="hidden self-end justify-self-end pb-8 text-right lg:block">
                <div className="border-l border-white/38 pl-6 text-left">
                  <div className="font-serif text-[26px] leading-[1.15]">Create the label.<br />Operate the maison.</div>
                  <div className="mt-7 space-y-2 text-[9px] uppercase tracking-[.25em] text-white/54">
                    <div>Visão</div><div>Coleção</div><div>Produção</div><div>Margem</div><div>Mercado</div><div>Liberdade</div>
                  </div>
                </div>
                <a href="#collection" className="mt-10 inline-flex items-center gap-4 text-[9px] uppercase tracking-[.22em] text-white/72">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full border border-white/60 backdrop-blur-md"><Play className="ml-0.5 h-3.5 w-3.5" aria-hidden /></span>
                  Explorar
                </a>
              </aside>
            </div>
          </div>
        </section>

        <section className="grid bg-[#101010] md:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => {
            const cardContent = (
              <>
                <img src={card.image.src} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover transition duration-[1200ms] ease-out group-hover:scale-[1.035] motion-reduce:transform-none motion-reduce:transition-none" />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.08),rgba(0,0,0,.75))]" />
                <div className="relative flex h-full min-h-[300px] flex-col justify-end p-6 text-white sm:min-h-[360px] lg:p-8">
                  <div className="text-[9px] uppercase tracking-[.24em] text-white/52">{card.eyebrow}</div>
                  <h2 className="mt-3 max-w-[14ch] font-serif text-4xl leading-[.9] tracking-[-.035em]">{card.title}</h2>
                  <p className="mt-4 max-w-xs text-xs leading-5 text-white/64">{card.copy}</p>
                  <div className="mt-6 inline-flex items-center gap-3 text-[9px] uppercase tracking-[.18em] text-white/78">
                    {card.cta} <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </div>
                </div>
              </>
            );
            return card.href === "/clientes/veronica-fashion-operator/execucao" ? (
              <Link key={card.title} to="/clientes/veronica-fashion-operator/execucao" className="group relative overflow-hidden border-white/15 xl:border-r">
                {cardContent}
              </Link>
            ) : (
              <a key={card.title} href={card.href} className="group relative overflow-hidden border-white/15 xl:border-r">
                {cardContent}
              </a>
            );
          })}
        </section>

        <section id="collection" className="scroll-mt-20 bg-[#f4f0e9] px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
          <div className="mx-auto grid max-w-[1500px] gap-12 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
            <div className="lg:sticky lg:top-24">
              <div className="text-[9px] uppercase tracking-[.38em] text-black/48">Collection 001</div>
              <h2 className="mt-4 font-serif text-[clamp(4rem,7vw,7.3rem)] leading-[.78] tracking-[-.06em]">HUMAN SYSTEM</h2>
              <p className="mt-5 text-[10px] uppercase tracking-[.3em] text-black/58">Roupas para um mundo real.</p>
              <p className="mt-4 max-w-lg text-sm leading-7 text-black/56">
                Design, matéria, propósito e tecnologia para uma nova geração de marcas que pensam o futuro sem perder humanidade.
              </p>
              <a href="#atelier" className="mt-7 inline-flex min-h-11 items-center gap-4 rounded-full border border-black/20 px-5 text-[9px] uppercase tracking-[.14em] transition hover:bg-black hover:text-white">
                Explorar coleção <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </a>
            </div>

            <div className="grid gap-2 sm:grid-cols-[1.45fr_.75fr_.75fr]">
              <figure className="group relative min-h-[460px] overflow-hidden sm:min-h-[590px]">
                <img src={collectionLook.src} alt={collectionLook.alt} className="absolute inset-0 h-full w-full object-cover transition duration-[1200ms] group-hover:scale-[1.025] motion-reduce:transform-none" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-5 text-white">
                  <figcaption className="text-[9px] uppercase tracking-[.2em]">Silhueta</figcaption>
                </div>
              </figure>
              <div className="grid gap-2">
                <figure className="group relative min-h-[225px] overflow-hidden sm:min-h-[290px]">
                  <img src={heroDesktop.src} alt={heroDesktop.alt} className="absolute inset-0 h-full w-full object-cover transition duration-[1200ms] group-hover:scale-[1.025] motion-reduce:transform-none" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-4 text-white"><figcaption className="text-[9px] uppercase tracking-[.2em]">Território</figcaption></div>
                </figure>
                <figure className="group relative min-h-[225px] overflow-hidden sm:min-h-[290px]">
                  <img src={editorialPortrait.src} alt={editorialPortrait.alt} className="absolute inset-0 h-full w-full object-cover transition duration-[1200ms] group-hover:scale-[1.025] motion-reduce:transform-none" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-4 text-white"><figcaption className="text-[9px] uppercase tracking-[.2em]">Identidade</figcaption></div>
                </figure>
              </div>
              <figure className="group relative min-h-[460px] overflow-hidden sm:min-h-[590px]">
                <img src={heroMobile.src} alt={heroMobile.alt} className="absolute inset-0 h-full w-full object-cover transition duration-[1200ms] group-hover:scale-[1.025] motion-reduce:transform-none" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-5 text-white">
                  <figcaption className="text-[9px] uppercase tracking-[.2em]">Matéria</figcaption>
                </div>
              </figure>
            </div>
          </div>
        </section>

        <section id="atelier" className="scroll-mt-20 bg-[#111] px-5 py-24 text-white sm:px-8 lg:px-10 lg:py-32">
          <div className="mx-auto grid max-w-[1500px] gap-12 lg:grid-cols-[.8fr_1.2fr]">
            <div>
              <div className="text-[9px] uppercase tracking-[.32em] text-white/42">Atelier operacional</div>
              <h2 className="mt-5 max-w-xl font-serif text-5xl leading-[.86] tracking-[-.055em] sm:text-7xl">A grife por trás da sua grife.</h2>
              <p className="mt-6 max-w-lg text-sm leading-7 text-white/48">
                A Veronica conecta identidade, coleção, produção e leitura operacional para transformar intenção em uma marca executável.
              </p>
            </div>
            <div className="grid gap-px bg-white/10 sm:grid-cols-2">
              {[
                ["01", "Identidade", "Posicionamento, linguagem e direção visual."],
                ["02", "Coleção", "Peças, grade, variações e arquitetura de produto."],
                ["03", "Operação", "Estoque, produção, margem e próximos movimentos."],
                ["04", "Mercado", "B2B, B2C, leads e contexto comercial."],
              ].map(([index, title, copy]) => (
                <article key={index} className="min-h-[260px] bg-[#111] p-6 transition duration-700 hover:bg-white/[.045]">
                  <div className="font-mono text-[9px] tracking-[.22em] text-white/25">{index}</div>
                  <h3 className="mt-14 font-serif text-4xl tracking-[-.04em]">{title}</h3>
                  <p className="mt-4 max-w-xs text-xs leading-6 text-white/42">{copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="manifesto" className="scroll-mt-20 bg-[#f4f0e9] px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
          <div className="mx-auto grid max-w-[1500px] gap-10 border-t border-black/12 pt-10 lg:grid-cols-[1.1fr_.9fr] lg:items-end">
            <div>
              <div className="text-[9px] uppercase tracking-[.32em] text-black/38">Veronica Fashion & Co.</div>
              <h2 className="mt-4 max-w-4xl font-serif text-5xl leading-[.86] tracking-[-.055em] sm:text-7xl">Uma nova geração de marcas de moda.</h2>
            </div>
            <div>
              <p className="max-w-lg text-sm leading-7 text-black/54">
                Uma maison digital onde direção criativa, tecnologia e operação trabalham juntas. O objetivo não é parecer uma marca pronta — é construir uma marca que possa existir, crescer e operar.
              </p>
              <Link
                to="/clientes/veronica-fashion-operator/execucao"
                className="mt-7 inline-flex min-h-12 items-center gap-4 rounded-full bg-black px-6 text-[10px] font-semibold uppercase tracking-[.13em] text-white transition hover:scale-[1.02]"
              >
                Abrir Fashion OS <Sparkles className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </AppleClientFrame>
  );
}
