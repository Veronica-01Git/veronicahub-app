import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, Check, Sparkles } from "lucide-react";
import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { SiteFooter, SiteHeader, SOCIAL_LINKS } from "@/components/SiteChrome";
import { HeroHologram } from "@/components/home/HeroHologram";
import { product, WIRE_NAME } from "@/lib/ecosystem";

// Curadoria de IDs; os dados e destinos continuam na fonte canônica.
const BROWSE = [
  "school",
  "agentes",
  "studio",
  "analytics",
  "portfolio",
  "career",
  "wire",
  "security",
  "fashion",
  "members",
  "clientes",
] as const;
const FEATURED = ["school", "agentes", "studio", "analytics", "wire"] as const;
const MEDIA: Record<(typeof BROWSE)[number], string> = {
  school: "Grupo aprendendo inteligência artificial em um estúdio de ensino",
  agentes: "Profissional interagindo por voz com uma assistente digital",
  studio: "Direção criativa em um estúdio cinematográfico",
  analytics: "Analista estudando produtos e dados de comércio digital",
  portfolio: "Designer organizando seu portfólio digital",
  career: "Profissional preparando currículo com orientação",
  wire: "Equipe editorial trabalhando em uma redação noturna",
  security: "Especialista analisando a segurança de sistemas digitais",
  fashion: "Designer criando uma peça em um ateliê de moda",
  members: "Comunidade criativa compartilhando ideias em uma mesa de trabalho",
  clientes: "Cliente e consultora planejando um projeto digital",
};

export const Route = createFileRoute("/")({
  component: EcosystemHome,
  head: () => ({
    meta: [
      { title: "YO LAB & CO · Ecossistema Veronica" },
      {
        name: "description",
        content:
          "Conheça a Escola Veronica, plataformas de criação, inteligência, agentes e soluções digitais da YO LAB & CO.",
      },
      { property: "og:title", content: "YO LAB & CO · Ecossistema Veronica" },
      {
        property: "og:description",
        content: "Da descoberta à execução: aprenda, crie e opere com as plataformas Veronica.",
      },
      { name: "twitter:title", content: "YO LAB & CO · Ecossistema Veronica" },
      { property: "og:image", content: "https://veronicahub.com/images/brand/yo-lab-logo.webp" },
      { name: "twitter:image", content: "https://veronicahub.com/images/brand/yo-lab-logo.webp" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "YO LAB & CO / Veronica Hub",
          url: "https://veronicahub.com",
          description: "Ecossistema de educação, criação e soluções digitais da YO LAB & CO.",
        }),
      },
    ],
  }),
});

function ProductLink({
  id,
  children,
  className = "",
}: {
  id: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link to={product(id).to} className={className}>
      {children}
    </Link>
  );
}

function EcosystemHome() {
  const [selected, setSelected] = useState<(typeof BROWSE)[number]>("school");
  const browseButtons = useRef<(HTMLButtonElement | null)[]>([]);
  const active = product(selected);
  function handleBrowseKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? BROWSE.length - 1
          : event.key === "ArrowDown" || event.key === "ArrowRight"
            ? (index + 1) % BROWSE.length
            : event.key === "ArrowUp" || event.key === "ArrowLeft"
              ? (index - 1 + BROWSE.length) % BROWSE.length
              : -1;
    if (next === -1) return;
    event.preventDefault();
    setSelected(BROWSE[next]);
    browseButtons.current[next]?.focus();
    browseButtons.current[next]?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }
  return (
    <div className="yolab-home home-hybrid min-h-screen overflow-x-hidden bg-background text-foreground">
      <SiteHeader brand="yo" />
      <main>
        <section className="vh-hero relative isolate overflow-hidden px-6 pb-16 pt-16 sm:pb-20 sm:pt-24">
          <div className="vh-hero-grid" aria-hidden="true" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.15fr_.85fr]">
            <div>
              <p className="vh-eyebrow">
                <span className="vh-led" aria-hidden="true" /> YO LAB &amp; CO · Veronica Hub
              </p>
              <h1 className="vh-h1 mt-7">
                Inteligência aplicada
                <br />à sua operação.
              </h1>
              <p className="vh-lead mt-6 max-w-xl">
                Educação, criação, análise e agentes autônomos em um só ecossistema. A Veronica
                conduz cada etapa, do primeiro passo ao sistema rodando.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#plataformas" className="vh-cta vh-cta-primary">
                  Explorar o ecossistema <ArrowRight size={16} />
                </a>
                <a href="#solucoes" className="vh-cta vh-cta-ghost">
                  Soluções para negócios <ArrowUpRight size={16} />
                </a>
              </div>

              <nav aria-label="Áreas do ecossistema" className="vh-console mt-10">
                {(
                  [
                    { label: "Aprender", ids: ["school", "zero", "formations"] },
                    { label: "Criar", ids: ["studio", "portfolio", "packs"] },
                    { label: "Operar", ids: ["agentes", "analytics", "security", "clientes"] },
                  ] as const
                ).map((group) => (
                  <div key={group.label} className="vh-console-group">
                    <span className="vh-console-label">{group.label}</span>
                    <div className="flex flex-wrap gap-1.5">
                      {group.ids.map((id) => (
                        <ProductLink key={id} id={id} className="vh-console-link">
                          {product(id).name}
                        </ProductLink>
                      ))}
                    </div>
                  </div>
                ))}
              </nav>

              {/* Jornal — canal editorial, separado das plataformas. */}
              <Link
                to="/noticias"
                className="vh-news mt-6"
                aria-label={`${WIRE_NAME} — últimas notícias`}
              >
                <span className="vh-news-dot" aria-hidden="true" />
                <span className="vh-news-kicker">Últimas notícias</span>
                <span className="vh-news-name">{WIRE_NAME}</span>
                <ArrowUpRight size={13} className="opacity-60" />
              </Link>
            </div>

            <HeroHologram />
          </div>
        </section>

        <section
          className="border-y border-black/10 bg-white px-6 py-10"
          aria-label="Escolha seu caminho"
        >
          <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-3 md:gap-0">
            {[
              {
                number: "01",
                title: "Quero aprender",
                text: "Comece com a Aula Zero e conheça a Escola Veronica.",
                id: "school",
              },
              {
                number: "02",
                title: "Quero fazer",
                text: "Escolha uma plataforma e coloque sua ideia em movimento.",
                id: "studio",
              },
              {
                number: "03",
                title: "Quero implementar",
                text: "Explore aplicações reais e converse sobre a sua operação.",
                id: "clientes",
              },
            ].map((path) => (
              <ProductLink
                key={path.number}
                id={path.id}
                className="yolab-path group flex flex-col justify-between gap-7 px-1 py-4 md:px-8"
              >
                <span className="font-mono-tech text-[11px] tracking-widest text-muted-foreground">
                  /{path.number}
                </span>
                <span>
                  <strong className="block font-display text-2xl tracking-tight">
                    {path.title}
                  </strong>
                  <span className="mt-2 block max-w-xs text-sm leading-relaxed text-muted-foreground">
                    {path.text}
                  </span>
                </span>
                <ArrowUpRight
                  size={20}
                  className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1"
                />
              </ProductLink>
            ))}
          </div>
        </section>

        <section id="plataformas" className="px-6 py-24 sm:py-32">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-wrap items-end justify-between gap-8">
              <div>
                <p className="yolab-eyebrow">01 / O ECOSSISTEMA</p>
                <h2 className="yolab-title mt-5">Uma plataforma leva à próxima.</h2>
              </div>
              <p className="max-w-sm leading-relaxed text-muted-foreground">
                Escolha uma área para ver o que ela faz, seu estágio atual e por onde começar.
              </p>
            </div>
            <div className="yolab-browser mt-12" aria-label="Explore as plataformas Veronica">
              <nav className="yolab-browser-nav" aria-label="Plataformas Veronica">
                <p className="yolab-browser-label">
                  Selecione uma área <span>· 11 plataformas</span>
                </p>
                <div
                  className="yolab-browser-list"
                  role="group"
                  aria-label="Escolha uma plataforma"
                >
                  {BROWSE.map((id, i) => {
                    const item = product(id);
                    return (
                      <button
                        key={id}
                        type="button"
                        aria-pressed={selected === id}
                        aria-label={`Mostrar ${item.name}`}
                        ref={(node) => {
                          browseButtons.current[i] = node;
                        }}
                        onClick={() => setSelected(id)}
                        onKeyDown={(event) => handleBrowseKeyDown(event, i)}
                        className={`yolab-browser-tab ${selected === id ? "yolab-browser-tab-active" : ""}`}
                      >
                        <span className="yolab-browser-tab-name">
                          <span className="yolab-browser-number">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          {item.name}
                        </span>
                        <ArrowUpRight
                          size={15}
                          aria-hidden="true"
                          className="yolab-browser-arrow"
                        />
                      </button>
                    );
                  })}
                </div>
              </nav>
              <div className="yolab-preview" aria-live="polite" aria-atomic="true">
                <div
                  className="yolab-preview-ambient"
                  aria-hidden="true"
                  style={{ backgroundImage: `url(/images/home/platforms/${selected}-1280.webp)` }}
                />
                <div className="yolab-preview-frame" key={selected}>
                  <img
                    src={`/images/home/platforms/${selected}-1280.webp`}
                    srcSet={`/images/home/platforms/${selected}-1280.webp 1280w, /images/home/platforms/${selected}-4k.webp 3840w`}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 640px"
                    alt={MEDIA[selected]}
                    width="3840"
                    height="2160"
                    loading="lazy"
                    decoding="async"
                    className="yolab-preview-image"
                  />
                  <span className="yolab-preview-sheen" aria-hidden="true" />
                </div>
                <span className="yolab-preview-caption">
                  <span className="vh-led" aria-hidden="true" /> {active.name}{" "}
                  <span>· universo Veronica</span>
                </span>
              </div>
              <div className="yolab-browser-detail" aria-live="polite" aria-atomic="true">
                <div>
                  <span className="yolab-browser-status">{active.status}</span>
                  <p className="mt-8 font-mono-tech text-[10px] uppercase tracking-widest text-white/50">
                    {active.category}
                  </p>
                  <h3 className="mt-3 font-display text-[clamp(1.9rem,3vw,2.75rem)] leading-tight tracking-[-.03em] text-white">
                    {active.name}
                  </h3>
                  <p className="mt-5 leading-relaxed text-white/70">{active.description}</p>
                </div>
                <ProductLink id={selected} className="yolab-browser-link">
                  Explorar {active.name} <ArrowUpRight size={18} aria-hidden="true" />
                </ProductLink>
              </div>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Disponibilidade conforme o catálogo de cada produto. Prévia visual não equivale a
              funcionalidade ativa.
            </p>
          </div>
        </section>

        <section className="yolab-flow px-6 py-24 sm:py-32">
          <div className="mx-auto max-w-7xl">
            <p className="yolab-eyebrow">02 / UMA JORNADA CONECTADA</p>
            <h2 className="yolab-title mt-5 max-w-4xl">Do primeiro sinal à próxima operação.</h2>
            <p className="mt-6 max-w-xl leading-relaxed text-muted-foreground">
              Cada etapa abre uma possibilidade concreta. Entre onde fizer sentido para você.
            </p>
            <ol className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-3xl bg-black/10 sm:grid-cols-3 lg:grid-cols-6">
              {["Descobrir", "Aprender", "Criar", "Executar", "Analisar", "Escalar"].map(
                (step, index) => (
                  <li key={step} className="group min-h-40 bg-[#f2f5f1] p-5 sm:p-6">
                    <span className="font-mono-tech text-xs text-muted-foreground">
                      0{index + 1}
                    </span>
                    <span className="mt-14 flex items-center justify-between gap-1 font-display text-lg tracking-tight sm:text-xl">
                      {step}
                      <ArrowRight
                        size={17}
                        className="shrink-0 text-[#168858] transition-transform group-hover:translate-x-1"
                      />
                    </span>
                  </li>
                ),
              )}
            </ol>
            <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-sm text-muted-foreground">
              <ProductLink id="wire" className="hover:text-foreground">
                Descobrir no {WIRE_NAME} ↗
              </ProductLink>
              <ProductLink id="school" className="hover:text-foreground">
                Aprender na Escola ↗
              </ProductLink>
              <ProductLink id="agentes" className="hover:text-foreground">
                Executar com Agentes ↗
              </ProductLink>
            </div>
          </div>
        </section>

        <section className="px-6 py-24 sm:py-32" aria-labelledby="destaques-title">
          <div className="mx-auto max-w-7xl">
            <p className="yolab-eyebrow">03 / COMEÇAR AGORA</p>
            <h2 id="destaques-title" className="yolab-title mt-5">
              Portas de entrada.
            </h2>
            <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              {FEATURED.map((id, index) => {
                const item = product(id);
                return (
                  <ProductLink
                    key={id}
                    id={id}
                    className={`yolab-spotlight group flex min-h-[350px] flex-col justify-between overflow-hidden rounded-[1.5rem] p-6 ${index === 0 ? "lg:col-span-2" : ""}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono-tech text-[10px] uppercase tracking-widest opacity-70">
                        {item.status}
                      </span>
                      <ArrowUpRight
                        size={19}
                        className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1"
                      />
                    </div>
                    <div>
                      <p className="font-mono-tech text-[10px] uppercase tracking-widest opacity-60">
                        {item.category}
                      </p>
                      <h3 className="mt-3 font-display text-2xl leading-tight tracking-tight">
                        {item.name}
                      </h3>
                      <p className="mt-3 text-sm leading-relaxed opacity-70">{item.description}</p>
                    </div>
                  </ProductLink>
                );
              })}
            </div>
          </div>
        </section>

        <section className="yolab-school px-6 py-24 sm:py-32">
          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-24">
            <div>
              <p className="yolab-eyebrow">04 / APRENDER</p>
              <h2 className="yolab-title mt-5">A Escola Veronica tem sua própria casa.</h2>
              <p className="mt-7 max-w-lg text-lg leading-relaxed text-muted-foreground">
                A experiência original continua inteira: portais de intenção, formações, projetos e
                a presença da Veronica. A Aula Zero já está disponível; o catálogo indica o estágio
                das outras formações.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <ProductLink id="school" className="yolab-button yolab-button-dark">
                  Entrar na Escola <ArrowUpRight size={17} />
                </ProductLink>
                <ProductLink id="zero" className="yolab-button yolab-button-light">
                  Conhecer a Aula Zero <ArrowUpRight size={17} />
                </ProductLink>
              </div>
            </div>
            <ProductLink
              id="school"
              className="yolab-school-image group relative block min-h-[420px] overflow-hidden rounded-[2rem] bg-[#101c20]"
            >
              <img
                src="/images/veronica/veronica-hero-static.webp"
                alt="Retrato visual da Veronica"
                width="768"
                height="1366"
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover object-top opacity-85 transition-transform duration-700 group-hover:scale-[1.035]"
              />
              <span className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-8 font-display text-3xl text-white">
                Escola Veronica <ArrowUpRight className="inline" size={24} />
              </span>
            </ProductLink>
          </div>
        </section>

        <section id="solucoes" className="yolab-business px-6 py-24 text-white sm:py-32">
          <div className="mx-auto grid max-w-7xl gap-16 lg:grid-cols-[1.2fr_.8fr]">
            <div>
              <p className="yolab-eyebrow text-[#9cf7c9]">05 / SOLUÇÕES PARA NEGÓCIOS</p>
              <h2 className="yolab-title mt-5 max-w-3xl">Uma engenharia. Múltiplas operações.</h2>
              <p className="mt-7 max-w-xl text-lg leading-relaxed text-white/65">
                Aplicamos plataformas e agentes a contextos reais. Para uma marca própria, a
                conversa começa pelo problema e pelo escopo da implementação. Licenciamento de
                arquitetura e white-label são propostas sob avaliação.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <ProductLink id="clientes" className="yolab-button yolab-button-green">
                  Ver aplicações <ArrowUpRight size={17} />
                </ProductLink>
                <a href={SOCIAL_LINKS.email} className="yolab-button yolab-button-outline">
                  Conversar sobre um projeto <ArrowUpRight size={17} />
                </a>
              </div>
            </div>
            <div className="self-center rounded-[2rem] border border-white/15 bg-white/5 p-7 sm:p-10">
              <Sparkles className="text-[#9cf7c9]" size={27} />
              <h3 className="mt-10 font-display text-3xl tracking-tight">
                Da plataforma à sua marca.
              </h3>
              <ul className="mt-7 space-y-4 text-sm text-white/70">
                {[
                  "Design e interface",
                  "Plataformas e agentes",
                  "Integração e operação",
                  "Escopo e licença sob proposta",
                ].map((line) => (
                  <li key={line} className="flex items-center gap-3">
                    <Check size={15} className="text-[#9cf7c9]" />
                    {line}
                  </li>
                ))}
              </ul>
              <p className="mt-10 border-t border-white/15 pt-5 font-mono-tech text-[10px] uppercase leading-relaxed tracking-widest text-white/45">
                Módulos, preço e condições definidos por projeto.
              </p>
            </div>
          </div>
        </section>

        <section className="px-6 py-24 sm:py-32">
          <div className="mx-auto grid max-w-7xl items-end gap-8 md:grid-cols-[1fr_auto]">
            <div>
              <p className="yolab-eyebrow">06 / ACOMPANHE</p>
              <h2 className="yolab-title mt-5">O ecossistema em movimento.</h2>
              <p className="mt-6 max-w-lg leading-relaxed text-muted-foreground">
                Acompanhe as publicações do {WIRE_NAME} e explore as plataformas conforme evoluem.
                Cada área informa o que já está disponível.
              </p>
            </div>
            <ProductLink id="wire" className="yolab-button yolab-button-light">
              Abrir {WIRE_NAME} <ArrowUpRight size={17} />
            </ProductLink>
          </div>
        </section>
        <section className="yolab-end px-6 py-24 sm:py-32">
          <div className="mx-auto max-w-7xl">
            <p className="yolab-eyebrow">SEU PRÓXIMO PASSO</p>
            <h2 className="mt-6 max-w-5xl font-display text-[clamp(3rem,7vw,7rem)] leading-none tracking-[-.035em] text-balance">
              O futuro começa em alguma parte. Escolha a sua.
            </h2>
            <div className="mt-12 grid gap-3 sm:grid-cols-3">
              {[
                { id: "school", label: "Aprender com a Veronica" },
                { id: "studio", label: "Usar uma plataforma" },
                { id: "clientes", label: "Explorar soluções" },
              ].map((item) => (
                <ProductLink
                  key={item.id}
                  id={item.id}
                  className="group flex min-h-24 items-center justify-between gap-4 border-t border-black/20 py-5 font-display text-xl tracking-tight transition-colors hover:text-[#168858]"
                >
                  {item.label}{" "}
                  <ArrowUpRight
                    size={22}
                    className="shrink-0 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1"
                  />
                </ProductLink>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter brand="yo" tagline="Educação, plataformas e soluções digitais." />
    </div>
  );
}
