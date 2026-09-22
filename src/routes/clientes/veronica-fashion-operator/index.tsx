import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  Boxes,
  Factory,
  Layers3,
  Scissors,
  Sparkles,
  UsersRound,
} from "lucide-react";

import {
  AppleClientFrame,
  GlassCard,
  HoloBadge,
  HolographicField,
  SectionLabel,
} from "@/features/private-clients/components/apple-client-ui";

export const Route = createFileRoute("/clientes/veronica-fashion-operator/")({
  component: VeronicaFashion,
  head: () => ({
    meta: [
      { title: "Veronica Fashion & Co. | Fashion Intelligence" },
      {
        name: "description",
        content:
          "Plataforma da Veronica para donos e futuros donos de marcas de roupa: coleção, produção, margem, estoque, leads e operação.",
      },
      { property: "og:title", content: "Veronica Fashion & Co." },
      {
        property: "og:description",
        content: "From idea to label. Fashion intelligence para construir e operar marcas de roupa.",
      },
    ],
  }),
});

const atelier = [
  {
    index: "01",
    icon: Scissors,
    title: "Crie a marca",
    copy: "Posicionamento, universo visual, coleção e arquitetura de produto em uma direção única.",
  },
  {
    index: "02",
    icon: Factory,
    title: "Produza melhor",
    copy: "Leitura de grade, prioridade por peça e decisões de produção preparadas para dados reais.",
  },
  {
    index: "03",
    icon: BarChart3,
    title: "Proteja a margem",
    copy: "Giro, ruptura, estoque parado e caixa transformados em uma visão operacional simples.",
  },
  {
    index: "04",
    icon: UsersRound,
    title: "Venda com contexto",
    copy: "B2B e B2C organizados para transformar audiência, lojistas e consumidores em próximos movimentos.",
  },
];

const runway = [
  { code: "DROP / 01", title: "Identity", note: "marca · direção · linguagem", gradient: "from-[#0d0d0f] via-[#29242c] to-[#8f7b86]" },
  { code: "DROP / 02", title: "Collection", note: "peças · grade · variações", gradient: "from-[#d8d0c4] via-[#f3eee7] to-[#8ea0a7]" },
  { code: "DROP / 03", title: "Demand", note: "leads · sinais · intenção", gradient: "from-[#171a22] via-[#253745] to-[#b2d8d1]" },
];

function VeronicaFashion() {
  return (
    <AppleClientFrame tone="violet">
      <div className="fixed inset-x-0 top-0 z-50 border-b border-black/[.055] bg-[#f7f5f2]/80 backdrop-blur-2xl">
        <div className="mx-auto flex h-16 max-w-[1500px] items-center gap-6 px-5 sm:px-8">
          <Link to="/" className="font-serif text-[13px] font-semibold tracking-[.14em] text-black/80">
            VERONICA
          </Link>
          <span className="h-4 w-px bg-black/10" />
          <span className="text-[11px] font-medium tracking-[.18em] text-black/45">FASHION & CO.</span>
          <nav className="ml-auto hidden items-center gap-7 text-[11px] font-medium text-black/48 md:flex">
            <a href="#maison" className="transition hover:text-black">Maison</a>
            <a href="#atelier" className="transition hover:text-black">Atelier</a>
            <a href="#intelligence" className="transition hover:text-black">Intelligence</a>
          </nav>
          <Link
            to="/clientes/veronica-fashion-operator/execucao"
            className="ml-auto inline-flex min-h-10 items-center gap-2 rounded-full bg-black px-4 text-[11px] font-semibold text-white md:ml-3"
          >
            Entrar <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
      </div>

      <main className="bg-[#f7f5f2] text-[#111113]">
        <section id="maison" className="relative flex min-h-screen items-end overflow-hidden px-5 pb-12 pt-28 sm:px-8 lg:pb-16">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-[9%] top-[12%] h-[52vw] max-h-[720px] w-[52vw] max-w-[720px] rounded-full border border-black/[.04]" />
            <div className="absolute right-[-8%] top-[8%] h-[70%] w-[58%] opacity-80">
              <HolographicField tone="rose" intensity={0.9} />
            </div>
            <div className="absolute left-[43%] top-[20%] h-[48%] w-px bg-gradient-to-b from-transparent via-black/10 to-transparent" />
          </div>

          <div className="relative mx-auto grid w-full max-w-[1500px] gap-12 lg:grid-cols-[1.18fr_.82fr] lg:items-end">
            <div>
              <div className="flex items-center gap-3">
                <span className="h-px w-10 bg-black/40" />
                <span className="text-[10px] font-semibold uppercase tracking-[.28em] text-black/45">Fashion intelligence maison · 2026</span>
              </div>
              <h1 className="mt-8 max-w-5xl font-serif text-[clamp(4.8rem,11vw,11.5rem)] font-normal leading-[.72] tracking-[-.075em] text-black">
                Veronica
                <span className="block italic text-black/58">Fashion</span>
                <span className="ml-[18%] block text-[.42em] tracking-[-.045em]">& Co.</span>
              </h1>
              <p className="mt-10 max-w-xl text-[clamp(1rem,1.7vw,1.25rem)] leading-8 text-black/52">
                Para quem vai lançar uma marca. Para quem já tem uma. Uma plataforma para transformar criação em produto, produto em operação e operação em uma marca mais inteligente.
              </p>
            </div>

            <div className="relative min-h-[420px] overflow-hidden rounded-[2px] bg-[#111113] p-7 text-white shadow-[0_35px_100px_rgba(0,0,0,.16)] sm:p-9">
              <div className="absolute inset-0 opacity-90">
                <div className="absolute -right-[12%] -top-[10%] h-[75%] w-[75%] rounded-full bg-[radial-gradient(circle_at_40%_40%,rgba(255,221,238,.48),rgba(111,90,166,.2)_35%,transparent_70%)] blur-xl" />
                <div className="absolute -bottom-[22%] -left-[12%] h-[68%] w-[68%] rounded-full bg-[radial-gradient(circle_at_center,rgba(114,230,222,.34),transparent_68%)] blur-xl" />
              </div>
              <div className="relative flex h-full min-h-[350px] flex-col justify-between">
                <div className="flex items-start justify-between">
                  <span className="font-mono text-[9px] uppercase tracking-[.28em] text-white/48">Private platform / 03</span>
                  <HoloBadge>membro registrado</HoloBadge>
                </div>
                <div>
                  <div className="font-serif text-5xl leading-[.92] tracking-[-.05em] sm:text-6xl">
                    From idea
                    <span className="block italic text-white/55">to label.</span>
                  </div>
                  <div className="mt-8 flex items-center justify-between border-t border-white/15 pt-5 text-[10px] uppercase tracking-[.18em] text-white/45">
                    <span>VH-MEM-2026-000003</span>
                    <span>Veronica Hub</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-black/[.065] bg-[#111113] py-4 text-white">
          <div className="mx-auto flex max-w-[1500px] gap-10 overflow-hidden px-5 font-mono text-[9px] uppercase tracking-[.24em] text-white/48 sm:px-8">
            {["Brand system", "Collection", "Production", "Margin", "Inventory", "Leads", "Fashion AI"].map((item) => (
              <span key={item} className="shrink-0">{item}</span>
            ))}
          </div>
        </section>

        <section id="atelier" className="mx-auto max-w-[1500px] px-5 py-24 sm:px-8 lg:py-36">
          <div className="grid gap-12 lg:grid-cols-[.72fr_1.28fr]">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <SectionLabel>Atelier operacional</SectionLabel>
              <h2 className="mt-5 max-w-md font-serif text-5xl leading-[.92] tracking-[-.055em] sm:text-7xl">
                A grife por trás da sua grife.
              </h2>
              <p className="mt-7 max-w-sm text-[15px] leading-7 text-black/48">
                Não é uma loja virtual. É a camada de inteligência que acompanha o nascimento, a coleção e a operação da marca.
              </p>
            </div>

            <div className="border-t border-black/10">
              {atelier.map((item) => {
                const Icon = item.icon;
                return (
                  <article key={item.index} className="group grid gap-5 border-b border-black/10 py-8 sm:grid-cols-[64px_1fr_auto] sm:items-center sm:py-10">
                    <div className="font-mono text-[10px] tracking-[.2em] text-black/30">{item.index}</div>
                    <div>
                      <h3 className="font-serif text-4xl tracking-[-.04em] sm:text-5xl">{item.title}</h3>
                      <p className="mt-3 max-w-xl text-sm leading-6 text-black/45">{item.copy}</p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-black/10 transition duration-500 group-hover:rotate-12 group-hover:bg-black group-hover:text-white">
                      <Icon className="h-4 w-4" aria-hidden />
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-[#111113] px-5 py-24 text-white sm:px-8 lg:py-36">
          <div className="mx-auto max-w-[1500px]">
            <div className="grid gap-8 lg:grid-cols-[1fr_.65fr] lg:items-end">
              <div>
                <div className="font-mono text-[9px] uppercase tracking-[.28em] text-white/38">Collection architecture</div>
                <h2 className="mt-5 max-w-4xl font-serif text-5xl leading-[.9] tracking-[-.055em] sm:text-8xl">
                  Uma coleção é uma decisão editorial.
                </h2>
              </div>
              <p className="max-w-lg text-sm leading-7 text-white/45 lg:justify-self-end">
                Organize ideia, peça, variação, grade, estágio e leitura comercial em um mesmo ambiente — sem transformar criatividade em uma planilha sem identidade.
              </p>
            </div>

            <div className="mt-16 grid gap-px overflow-hidden bg-white/10 lg:grid-cols-3">
              {runway.map((item, index) => (
                <article key={item.code} className="group relative min-h-[520px] overflow-hidden bg-[#161619] p-7">
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-80 transition duration-700 group-hover:scale-105`} />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_35%,rgba(0,0,0,.78))]" />
                  <div className="absolute inset-x-[22%] top-[13%] h-[48%] rounded-[48%_48%_12%_12%] border border-white/20 bg-white/[.06] shadow-[inset_0_0_80px_rgba(255,255,255,.08)] backdrop-blur-[2px]" />
                  <div className="relative flex h-full flex-col justify-between">
                    <div className="flex justify-between font-mono text-[9px] uppercase tracking-[.22em] text-white/55">
                      <span>{item.code}</span><span>0{index + 1}</span>
                    </div>
                    <div>
                      <h3 className="font-serif text-5xl tracking-[-.05em]">{item.title}</h3>
                      <p className="mt-3 text-[11px] uppercase tracking-[.18em] text-white/45">{item.note}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="intelligence" className="relative overflow-hidden px-5 py-24 sm:px-8 lg:py-36">
          <div className="pointer-events-none absolute inset-0 opacity-80">
            <HolographicField tone="aqua" intensity={0.65} />
          </div>
          <div className="relative mx-auto max-w-[1500px]">
            <div className="mx-auto max-w-4xl text-center">
              <HoloBadge>Veronica Fashion Intelligence</HoloBadge>
              <h2 className="mt-7 font-serif text-5xl leading-[.9] tracking-[-.06em] sm:text-8xl">
                A estética atrai.
                <span className="block italic text-black/45">A inteligência sustenta.</span>
              </h2>
              <p className="mx-auto mt-7 max-w-2xl text-[15px] leading-7 text-black/50">
                O ambiente operacional reúne os módulos que dão continuidade à marca: dinheiro, produção, leads, coleções e plano de ação. Integrações reais entram somente quando conectadas e validadas.
              </p>
            </div>

            <div className="mt-16 grid gap-4 md:grid-cols-3">
              <GlassCard className="p-7">
                <Boxes className="h-5 w-5 text-violet-500" aria-hidden />
                <div className="mt-14 font-serif text-4xl tracking-[-.04em]">Estoque</div>
                <p className="mt-3 text-sm leading-6 text-black/45">Veja o que gira, o que trava caixa e o que precisa de contexto antes da próxima produção.</p>
              </GlassCard>
              <GlassCard className="p-7">
                <Layers3 className="h-5 w-5 text-cyan-600" aria-hidden />
                <div className="mt-14 font-serif text-4xl tracking-[-.04em]">Coleção</div>
                <p className="mt-3 text-sm leading-6 text-black/45">Mantenha conceito, peças, variações e decisões conectados à mesma narrativa.</p>
              </GlassCard>
              <GlassCard className="p-7">
                <Sparkles className="h-5 w-5 text-rose-500" aria-hidden />
                <div className="mt-14 font-serif text-4xl tracking-[-.04em]">Veronica</div>
                <p className="mt-3 text-sm leading-6 text-black/45">Uma interface preparada para conversar com a operação e explicar por que cada movimento é sugerido.</p>
              </GlassCard>
            </div>
          </div>
        </section>

        <section className="px-5 pb-28 pt-10 sm:px-8 lg:pb-40">
          <div className="mx-auto max-w-[1500px] border-t border-black/10 pt-12">
            <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <div className="font-mono text-[9px] uppercase tracking-[.25em] text-black/35">Veronica Fashion & Co. · member 03</div>
                <h2 className="mt-5 max-w-4xl font-serif text-5xl leading-[.9] tracking-[-.055em] sm:text-8xl">
                  Sua marca começa antes da primeira peça.
                </h2>
              </div>
              <Link
                to="/clientes/veronica-fashion-operator/execucao"
                className="inline-flex min-h-14 items-center justify-center gap-3 rounded-full bg-black px-7 text-[12px] font-semibold text-white transition hover:scale-[1.02]"
              >
                Abrir Fashion Operator <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </AppleClientFrame>
  );
}
