import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, Check, Sparkles } from "lucide-react";
import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { SiteFooter, SiteHeader, SOCIAL_LINKS } from "@/components/SiteChrome";
import { HeroHologram } from "@/components/home/HeroHologram";
import { product, WIRE_NAME } from "@/lib/ecosystem";

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

const INTENTS = [
  {
    number: "01",
    kicker: "APRENDER",
    title: "Domine IA construindo.",
    text: "Entre pela Escola, avance por formações e transforme conteúdo em execução prática.",
    id: "school",
    cta: "Entrar na Escola",
  },
  {
    number: "02",
    kicker: "CRIAR",
    title: "Transforme ideia em ativo.",
    text: "Use o Studio e o Portfolio para criar, apresentar e publicar trabalho com IA.",
    id: "studio",
    cta: "Abrir o Studio",
  },
  {
    number: "03",
    kicker: "AUTOMATIZAR",
    title: "Coloque inteligência para operar.",
    text: "Agentes conectam conversa, regras e processos reais de negócio.",
    id: "agentes",
    cta: "Explorar Agentes",
  },
  {
    number: "04",
    kicker: "VENDER",
    title: "Leve tecnologia ao mercado.",
    text: "Projetos, clientes e arquitetura aplicável transformam capacidade em proposta comercial.",
    id: "clientes",
    cta: "Ver aplicações",
  },
] as const;

const VALUE_LOOP = [
  {
    step: "Descobrir",
    title: "Conteúdo chama atenção.",
    text: `${WIRE_NAME} e experiências abertas trazem contexto, repertório e novas entradas.`,
    id: "wire",
  },
  {
    step: "Aprender",
    title: "Conhecimento vira habilidade.",
    text: "A Escola conecta teoria, laboratório e execução dentro do mesmo ecossistema.",
    id: "school",
  },
  {
    step: "Criar",
    title: "Habilidade vira ativo.",
    text: "Studio, Portfolio e ferramentas transformam intenção em material utilizável.",
    id: "studio",
  },
  {
    step: "Operar",
    title: "Ativo vira sistema.",
    text: "Agentes, analytics e segurança levam a criação para a rotina da operação.",
    id: "agentes",
  },
  {
    step: "Escalar",
    title: "Sistema vira negócio.",
    text: "Clientes, implantação, licença e novas verticais ampliam o valor produzido.",
    id: "clientes",
  },
] as const;

export const Route = createFileRoute("/")({
  component: EcosystemHome,
  head: () => ({
    meta: [
      { title: "Veronica Hub · Aprenda, crie, automatize e opere com IA" },
      {
        name: "description",
        content:
          "Um ecossistema de inteligência artificial que conecta educação, criação, agentes, conteúdo e aplicações reais em uma única jornada.",
      },
      {
        property: "og:title",
        content: "Veronica Hub · Um ecossistema de inteligência aplicada",
      },
      {
        property: "og:description",
        content:
          "Aprenda, crie, automatize, publique e leve inteligência artificial para operações reais.",
      },
      { name: "twitter:title", content: "Veronica Hub · Inteligência aplicada" },
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
          description:
            "Ecossistema de inteligência artificial, educação, criação, agentes e soluções digitais.",
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
    <div className="yolab-home min-h-screen overflow-x-hidden bg-[#f4f5f2] text-[#111512]">
      <SiteHeader brand="yo" />

      <main>
        <section className="relative isolate overflow-hidden bg-[#050706] px-6 pb-16 pt-12 text-white sm:pb-20 sm:pt-20 lg:min-h-[calc(100svh-72px)] lg:pb-24">
          <div
            className="pointer-events-none absolute inset-0 opacity-80"
            aria-hidden="true"
            style={{
              background:
                "radial-gradient(circle at 78% 32%, rgba(37,210,142,.18), transparent 28%), radial-gradient(circle at 12% 15%, rgba(255,255,255,.08), transparent 22%), linear-gradient(180deg, rgba(255,255,255,.025), transparent 28%)",
            }}
          />
          <div
            className="pointer-events-none absolute inset-0 opacity-[.13]"
            aria-hidden="true"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,.18) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.18) 1px, transparent 1px)",
              backgroundSize: "72px 72px",
              maskImage: "linear-gradient(to bottom, black, transparent 72%)",
            }}
          />

          <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.06fr_.94fr] lg:gap-16">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[.055] px-3.5 py-2 font-mono-tech text-[10px] uppercase tracking-[.18em] text-white/62 backdrop-blur-xl">
                <span className="h-1.5 w-1.5 rounded-full bg-[#7cffbd] shadow-[0_0_16px_rgba(124,255,189,.9)]" />
                Veronica Hub · AI operating ecosystem
              </div>

              <h1 className="mt-8 max-w-5xl font-display text-[clamp(3.4rem,8vw,8.4rem)] font-medium leading-[.88] tracking-[-.055em] text-balance">
                Aprenda.
                <br />
                Crie. Opere.
                <br />
                <span className="text-white/42">Venda melhor.</span>
              </h1>

              <p className="mt-8 max-w-2xl text-base leading-relaxed text-white/62 sm:text-lg">
                A Veronica conecta educação, criação, agentes, conteúdo e aplicações reais em uma
                única jornada. Você entra por uma necessidade e encontra o próximo passo sem sair do
                ecossistema.
              </p>

              <div className="mt-9 flex flex-wrap gap-3">
                <a
                  href="#caminhos"
                  className="inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-6 text-sm font-medium text-black transition-transform hover:scale-[1.02]"
                >
                  Encontrar meu caminho <ArrowRight size={16} />
                </a>
                <a
                  href="#negocios"
                  className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/16 bg-white/[.04] px-6 text-sm text-white/84 backdrop-blur-xl transition-colors hover:bg-white/[.08]"
                >
                  Soluções para negócios <ArrowUpRight size={16} />
                </a>
              </div>

              <div className="mt-12 grid max-w-2xl grid-cols-2 gap-px overflow-hidden rounded-[1.4rem] border border-white/10 bg-white/10 sm:grid-cols-4">
                {[
                  ["01", "Aprender"],
                  ["02", "Criar"],
                  ["03", "Automatizar"],
                  ["04", "Escalar"],
                ].map(([number, label]) => (
                  <div key={number} className="bg-[#0b0e0c]/90 px-4 py-4 backdrop-blur-xl">
                    <span className="block font-mono-tech text-[9px] tracking-widest text-white/32">
                      {number}
                    </span>
                    <span className="mt-3 block text-sm text-white/78">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative lg:min-h-[640px]">
              <div
                className="pointer-events-none absolute -inset-12 rounded-full opacity-70 blur-3xl"
                aria-hidden="true"
                style={{
                  background:
                    "radial-gradient(circle, rgba(60,220,151,.22), rgba(60,220,151,.04) 42%, transparent 68%)",
                }}
              />
              <div className="relative overflow-hidden rounded-[2.25rem] border border-white/12 bg-white/[.04] shadow-[0_40px_140px_rgba(0,0,0,.45)] backdrop-blur-2xl">
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                  <div className="flex items-center gap-2 text-[11px] text-white/55">
                    <span className="h-2 w-2 rounded-full bg-[#7cffbd] shadow-[0_0_12px_rgba(124,255,189,.8)]" />
                    Veronica online
                  </div>
                  <span className="font-mono-tech text-[9px] uppercase tracking-[.16em] text-white/30">
                    intelligence layer
                  </span>
                </div>
                <div className="min-h-[520px] sm:min-h-[600px]">
                  <HeroHologram />
                </div>
                <div className="grid grid-cols-3 gap-px border-t border-white/10 bg-white/10">
                  {[
                    ["LEARN", "Escola"],
                    ["BUILD", "Studio"],
                    ["OPERATE", "Agentes"],
                  ].map(([kicker, label]) => (
                    <div key={kicker} className="bg-[#090c0a]/94 px-4 py-4">
                      <span className="block font-mono-tech text-[8px] tracking-[.16em] text-white/30">
                        {kicker}
                      </span>
                      <span className="mt-2 block text-xs text-white/66">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="relative mx-auto mt-14 flex max-w-7xl flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-5 text-xs text-white/40">
            <span>Uma inteligência. Múltiplas portas de entrada.</span>
            <Link
              to="/noticias"
              className="inline-flex items-center gap-2 transition-colors hover:text-white/75"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
              {WIRE_NAME} · acompanhar agora <ArrowUpRight size={12} />
            </Link>
          </div>
        </section>

        <section id="caminhos" className="px-6 py-20 sm:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
              <div>
                <p className="font-mono-tech text-[10px] uppercase tracking-[.18em] text-[#168858]">
                  01 / ENTRE PELA SUA NECESSIDADE
                </p>
                <h2 className="mt-5 max-w-2xl font-display text-[clamp(2.8rem,5vw,5.8rem)] leading-[.96] tracking-[-.045em] text-balance">
                  Não procure uma ferramenta.
                  <span className="block text-black/35">Comece pelo resultado.</span>
                </h2>
              </div>
              <p className="max-w-xl text-base leading-relaxed text-black/56 lg:justify-self-end lg:text-lg">
                A Home agora organiza a Veronica por intenção. Cada entrada leva a um produto real e
                já prepara a próxima etapa da jornada.
              </p>
            </div>

            <div className="mt-12 grid gap-4 md:grid-cols-2">
              {INTENTS.map((intent, index) => (
                <ProductLink
                  key={intent.number}
                  id={intent.id}
                  className={`group relative min-h-[360px] overflow-hidden rounded-[2rem] border border-black/10 p-7 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_30px_80px_rgba(15,24,18,.12)] sm:p-9 ${
                    index === 0
                      ? "bg-[#0a0e0b] text-white"
                      : index === 1
                        ? "bg-white"
                        : index === 2
                          ? "bg-[#dceee5]"
                          : "bg-[#e8e8e1]"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span
                        className={`font-mono-tech text-[9px] tracking-[.18em] ${
                          index === 0 ? "text-white/38" : "text-black/38"
                        }`}
                      >
                        {intent.number}
                      </span>
                      <p
                        className={`mt-3 font-mono-tech text-[10px] tracking-[.15em] ${
                          index === 0 ? "text-[#93f4be]" : "text-[#168858]"
                        }`}
                      >
                        {intent.kicker}
                      </p>
                    </div>
                    <ArrowUpRight
                      size={22}
                      className="transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1"
                    />
                  </div>

                  <div className="mt-20 max-w-xl">
                    <h3 className="font-display text-[clamp(2rem,4vw,4rem)] leading-[.98] tracking-[-.04em]">
                      {intent.title}
                    </h3>
                    <p
                      className={`mt-5 max-w-lg text-sm leading-relaxed sm:text-base ${
                        index === 0 ? "text-white/58" : "text-black/52"
                      }`}
                    >
                      {intent.text}
                    </p>
                  </div>

                  <div
                    className={`absolute bottom-7 left-7 inline-flex items-center gap-2 text-sm font-medium sm:bottom-9 sm:left-9 ${
                      index === 0 ? "text-white/84" : "text-black/72"
                    }`}
                  >
                    {intent.cta} <ArrowRight size={15} />
                  </div>
                </ProductLink>
              ))}
            </div>
          </div>
        </section>

        <section id="plataformas" className="bg-white px-6 py-20 sm:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-wrap items-end justify-between gap-8">
              <div>
                <p className="font-mono-tech text-[10px] uppercase tracking-[.18em] text-[#168858]">
                  02 / O ECOSSISTEMA
                </p>
                <h2 className="mt-5 max-w-3xl font-display text-[clamp(2.8rem,5vw,5.8rem)] leading-[.96] tracking-[-.045em] text-balance">
                  Uma plataforma leva à próxima.
                </h2>
              </div>
              <p className="max-w-md text-base leading-relaxed text-black/50">
                Explore as áreas da Veronica sem perder o contexto. Cada produto tem função própria,
                mas nenhum precisa viver isolado.
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
                        className={`yolab-browser-tab ${
                          selected === id ? "yolab-browser-tab-active" : ""
                        }`}
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

            <p className="mt-4 text-xs text-black/40">
              Disponibilidade conforme o catálogo de cada produto. Prévia visual não equivale a
              funcionalidade ativa.
            </p>
          </div>
        </section>

        <section className="overflow-hidden bg-[#07100b] px-6 py-20 text-white sm:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
              <div>
                <p className="font-mono-tech text-[10px] uppercase tracking-[.18em] text-[#8bf1b8]">
                  03 / LOOP DE VALOR
                </p>
                <h2 className="mt-5 font-display text-[clamp(2.8rem,5vw,5.8rem)] leading-[.96] tracking-[-.045em] text-balance">
                  Uma entrada pode gerar a próxima receita.
                </h2>
              </div>
              <p className="max-w-xl text-base leading-relaxed text-white/52 lg:justify-self-end">
                O ecossistema foi organizado para criar continuidade: conteúdo traz atenção, ensino
                gera capacidade, ferramentas viram ativos, agentes entram na operação e aplicações
                abrem novas propostas comerciais.
              </p>
            </div>

            <div className="mt-14 grid gap-px overflow-hidden rounded-[2rem] border border-white/10 bg-white/10 md:grid-cols-5">
              {VALUE_LOOP.map((item, index) => (
                <ProductLink
                  key={item.step}
                  id={item.id}
                  className="group flex min-h-[310px] flex-col justify-between bg-[#0b120e] p-6 transition-colors hover:bg-[#101a14]"
                >
                  <div>
                    <span className="font-mono-tech text-[9px] tracking-[.17em] text-white/28">
                      0{index + 1}
                    </span>
                    <p className="mt-4 font-mono-tech text-[9px] uppercase tracking-[.17em] text-[#86eeb4]">
                      {item.step}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-display text-2xl leading-tight tracking-[-.025em]">
                      {item.title}
                    </h3>
                    <p className="mt-4 text-sm leading-relaxed text-white/46">{item.text}</p>
                    <span className="mt-7 inline-flex items-center gap-2 text-xs text-white/64">
                      Continuar <ArrowRight size={13} />
                    </span>
                  </div>
                </ProductLink>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-20 sm:py-28">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.95fr_1.05fr] lg:items-center">
            <div>
              <p className="font-mono-tech text-[10px] uppercase tracking-[.18em] text-[#168858]">
                04 / ESCOLA VERONICA
              </p>
              <h2 className="mt-5 max-w-3xl font-display text-[clamp(2.8rem,5vw,5.8rem)] leading-[.96] tracking-[-.045em] text-balance">
                Aprender é o começo.
                <span className="block text-black/35">Construir é o método.</span>
              </h2>
              <p className="mt-7 max-w-xl text-base leading-relaxed text-black/52 sm:text-lg">
                A Escola mantém uma jornada própria com formações, classroom, laboratório e Veronica
                Tutor. A proposta não é acumular aulas: é sair com algo funcionando.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <ProductLink
                  id="school"
                  className="inline-flex min-h-12 items-center gap-2 rounded-full bg-black px-6 text-sm text-white"
                >
                  Entrar na Escola <ArrowUpRight size={16} />
                </ProductLink>
                <ProductLink
                  id="formations"
                  className="inline-flex min-h-12 items-center gap-2 rounded-full border border-black/14 bg-white px-6 text-sm text-black/72"
                >
                  Ver formações <ArrowUpRight size={16} />
                </ProductLink>
              </div>
            </div>

            <ProductLink
              id="school"
              className="group relative block min-h-[520px] overflow-hidden rounded-[2.3rem] bg-[#101c20] shadow-[0_30px_90px_rgba(19,35,25,.14)]"
            >
              <img
                src="/images/veronica/veronica-hero-static.webp"
                alt="Retrato visual da Veronica"
                width="768"
                height="1366"
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover object-top opacity-90 transition-transform duration-700 group-hover:scale-[1.025]"
              />
              <span
                className="absolute inset-0"
                aria-hidden="true"
                style={{
                  background:
                    "linear-gradient(180deg, transparent 38%, rgba(5,9,7,.1) 56%, rgba(5,9,7,.92) 100%)",
                }}
              />
              <div className="absolute inset-x-0 bottom-0 p-7 text-white sm:p-9">
                <p className="font-mono-tech text-[9px] uppercase tracking-[.17em] text-white/48">
                  watch → build → test → publish
                </p>
                <div className="mt-4 flex items-end justify-between gap-6">
                  <span className="font-display text-3xl tracking-[-.03em] sm:text-4xl">
                    Escola Veronica
                  </span>
                  <ArrowUpRight
                    size={26}
                    className="shrink-0 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1"
                  />
                </div>
              </div>
            </ProductLink>
          </div>
        </section>

        <section id="negocios" className="bg-[#dceee5] px-6 py-20 sm:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-14 lg:grid-cols-[1.05fr_.95fr]">
              <div>
                <p className="font-mono-tech text-[10px] uppercase tracking-[.18em] text-[#126c48]">
                  05 / NEGÓCIOS
                </p>
                <h2 className="mt-5 max-w-4xl font-display text-[clamp(3rem,6vw,6.5rem)] leading-[.92] tracking-[-.05em] text-balance">
                  A tecnologia precisa chegar na operação.
                </h2>
                <p className="mt-7 max-w-xl text-base leading-relaxed text-black/54 sm:text-lg">
                  A Veronica transforma arquitetura, agentes e interfaces em aplicações para
                  contextos reais. O escopo comercial parte do problema, da regra e do resultado que
                  precisa existir.
                </p>
                <div className="mt-9 flex flex-wrap gap-3">
                  <ProductLink
                    id="clientes"
                    className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#0a1710] px-6 text-sm text-white"
                  >
                    Ver aplicações reais <ArrowUpRight size={16} />
                  </ProductLink>
                  <a
                    href={SOCIAL_LINKS.email}
                    className="inline-flex min-h-12 items-center gap-2 rounded-full border border-black/14 bg-white/65 px-6 text-sm text-black/72 backdrop-blur"
                  >
                    Falar sobre um projeto <ArrowUpRight size={16} />
                  </a>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  {
                    tag: "AUTOMAÇÃO",
                    title: "Agentes",
                    text: "Atendimento, regras, handoff e operação conectada.",
                    id: "agentes",
                  },
                  {
                    tag: "INTELIGÊNCIA",
                    title: "Analytics",
                    text: "Dados e sinais para decisões comerciais mais claras.",
                    id: "analytics",
                  },
                  {
                    tag: "APLICAÇÃO",
                    title: "Clientes",
                    text: "Projetos reais que mostram como a arquitetura se comporta.",
                    id: "clientes",
                  },
                  {
                    tag: "PROTEÇÃO",
                    title: "Security",
                    text: "Camadas de segurança e proteção do ecossistema digital.",
                    id: "security",
                  },
                ].map((card) => (
                  <ProductLink
                    key={card.title}
                    id={card.id}
                    className="group flex min-h-[240px] flex-col justify-between rounded-[1.8rem] border border-black/10 bg-white/62 p-6 backdrop-blur-xl transition-all hover:-translate-y-1 hover:bg-white/78"
                  >
                    <div className="flex items-start justify-between">
                      <span className="font-mono-tech text-[9px] tracking-[.16em] text-[#126c48]">
                        {card.tag}
                      </span>
                      <ArrowUpRight
                        size={18}
                        className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1"
                      />
                    </div>
                    <div>
                      <h3 className="font-display text-2xl tracking-[-.025em]">{card.title}</h3>
                      <p className="mt-3 text-sm leading-relaxed text-black/52">{card.text}</p>
                    </div>
                  </ProductLink>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white px-6 py-20 sm:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
              <div>
                <p className="font-mono-tech text-[10px] uppercase tracking-[.18em] text-[#168858]">
                  06 / PROVA DE EXECUÇÃO
                </p>
                <h2 className="mt-5 font-display text-[clamp(2.8rem,5vw,5.8rem)] leading-[.96] tracking-[-.045em] text-balance">
                  Não é só conceito.
                </h2>
              </div>
              <p className="max-w-xl text-base leading-relaxed text-black/50 lg:justify-self-end">
                Projetos de clientes funcionam como laboratório público da Veronica: diferentes
                setores, necessidades e camadas do mesmo ecossistema.
              </p>
            </div>

            <div className="mt-12 grid gap-4 lg:grid-cols-3">
              {[
                {
                  name: "Express Entulho",
                  category: "Operação + agente",
                  description:
                    "Arquitetura para atendimento, regras operacionais e evolução do agente de WhatsApp.",
                  href: "/express-entulho",
                },
                {
                  name: "LZ Team",
                  category: "Experiência + membros",
                  description:
                    "Presença digital, área privada e estrutura de relacionamento com membros.",
                  href: "/clientes/lz-team",
                },
                {
                  name: "Veronica Fashion & Co.",
                  category: "Brand experience",
                  description:
                    "Direção visual, experiência editorial e execução digital de uma vertical de moda.",
                  href: "/clientes/veronica-fashion-operator",
                },
              ].map((client, index) => (
                <a
                  key={client.name}
                  href={client.href}
                  className={`group flex min-h-[360px] flex-col justify-between rounded-[2rem] border p-7 transition-all duration-500 hover:-translate-y-1 sm:p-8 ${
                    index === 0
                      ? "border-black/10 bg-[#0b0e0c] text-white"
                      : "border-black/10 bg-[#f1f2ee] text-black"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span
                      className={`font-mono-tech text-[9px] uppercase tracking-[.16em] ${
                        index === 0 ? "text-[#86eeb4]" : "text-[#168858]"
                      }`}
                    >
                      {client.category}
                    </span>
                    <ArrowUpRight
                      size={21}
                      className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1"
                    />
                  </div>
                  <div>
                    <h3 className="font-display text-3xl tracking-[-.03em]">{client.name}</h3>
                    <p
                      className={`mt-4 max-w-md text-sm leading-relaxed ${
                        index === 0 ? "text-white/54" : "text-black/50"
                      }`}
                    >
                      {client.description}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-20 sm:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="rounded-[2.4rem] bg-[#e9ebe5] p-7 sm:p-10 lg:p-14">
              <div className="grid gap-12 lg:grid-cols-[1.1fr_.9fr]">
                <div>
                  <p className="font-mono-tech text-[10px] uppercase tracking-[.18em] text-[#168858]">
                    07 / CAMADAS COMERCIAIS
                  </p>
                  <h2 className="mt-5 max-w-3xl font-display text-[clamp(2.8rem,5vw,5.6rem)] leading-[.96] tracking-[-.045em] text-balance">
                    Diferentes entradas.
                    <span className="block text-black/35">Um mesmo ecossistema.</span>
                  </h2>
                  <p className="mt-7 max-w-xl text-base leading-relaxed text-black/52">
                    A Home prepara caminhos para conteúdo aberto, produtos digitais, implantação B2B
                    e propostas de arquitetura/licenciamento — sem fingir disponibilidade ou preço
                    quando isso ainda depende de escopo.
                  </p>
                </div>

                <div className="grid gap-px overflow-hidden rounded-[1.7rem] border border-black/10 bg-black/10 sm:grid-cols-2">
                  {[
                    ["01", "Descoberta", "Conteúdo e experiências abertas"],
                    ["02", "Produto", "Formações, ferramentas e ativos digitais"],
                    ["03", "Implantação", "Projetos e agentes para operações"],
                    ["04", "Expansão", "Arquitetura e licença sob proposta"],
                  ].map(([number, title, text]) => (
                    <div key={number} className="min-h-[180px] bg-white/76 p-5">
                      <span className="font-mono-tech text-[9px] tracking-widest text-black/32">
                        {number}
                      </span>
                      <h3 className="mt-8 font-display text-xl tracking-[-.02em]">{title}</h3>
                      <p className="mt-2 text-xs leading-relaxed text-black/48">{text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-[#050706] px-6 py-20 text-white sm:py-28">
          <div
            className="pointer-events-none absolute inset-0 opacity-70"
            aria-hidden="true"
            style={{
              background:
                "radial-gradient(circle at 72% 35%, rgba(46,210,143,.18), transparent 30%), radial-gradient(circle at 18% 80%, rgba(255,255,255,.06), transparent 24%)",
            }}
          />
          <div className="relative mx-auto max-w-7xl">
            <div className="flex items-center gap-2 font-mono-tech text-[10px] uppercase tracking-[.18em] text-white/38">
              <span className="h-1.5 w-1.5 rounded-full bg-[#7cffbd]" />
              Veronica Hub
            </div>
            <h2 className="mt-7 max-w-6xl font-display text-[clamp(3.6rem,8vw,8.8rem)] leading-[.88] tracking-[-.055em] text-balance">
              Entre por onde faz sentido.
              <span className="block text-white/34">O ecossistema continua.</span>
            </h2>
            <div className="mt-12 grid gap-px overflow-hidden rounded-[1.8rem] border border-white/10 bg-white/10 sm:grid-cols-3">
              {[
                { id: "school", label: "Quero aprender", text: "Escola e formações" },
                { id: "studio", label: "Quero criar", text: "Studio e Portfolio" },
                { id: "clientes", label: "Quero implementar", text: "Projetos e soluções" },
              ].map((item) => (
                <ProductLink
                  key={item.id}
                  id={item.id}
                  className="group flex min-h-[170px] items-end justify-between gap-5 bg-[#090c0a] p-6 transition-colors hover:bg-[#101611]"
                >
                  <span>
                    <span className="block font-display text-2xl tracking-[-.025em]">
                      {item.label}
                    </span>
                    <span className="mt-2 block text-xs text-white/38">{item.text}</span>
                  </span>
                  <ArrowUpRight
                    size={22}
                    className="shrink-0 text-white/58 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1"
                  />
                </ProductLink>
              ))}
            </div>

            <div className="mt-9 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6">
              <ProductLink
                id="wire"
                className="inline-flex items-center gap-2 text-sm text-white/56 transition-colors hover:text-white"
              >
                Acompanhar {WIRE_NAME} <ArrowUpRight size={14} />
              </ProductLink>
              <a
                href={SOCIAL_LINKS.email}
                className="inline-flex items-center gap-2 text-sm text-white/56 transition-colors hover:text-white"
              >
                Conversar com a equipe <ArrowUpRight size={14} />
              </a>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter brand="yo" tagline="Um ecossistema de inteligência aplicada." />
    </div>
  );
}
