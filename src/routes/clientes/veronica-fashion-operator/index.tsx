import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  Boxes,
  BrainCircuit,
  ChartNoAxesCombined,
  Layers3,
  MessagesSquare,
  ScanSearch,
  Sparkles,
  UsersRound,
  WandSparkles,
} from "lucide-react";

import {
  AppleClientFrame,
  AppleClientNav,
  GlassCard,
  HoloBadge,
  HolographicField,
  SectionLabel,
} from "@/features/private-clients/components/apple-client-ui";

export const Route = createFileRoute("/clientes/veronica-fashion-operator/")({
  component: FashionShowcase,
  head: () => ({
    meta: [
      { title: "Veronica Fashion Operator | Veronica Hub" },
      {
        name: "description",
        content:
          "Vitrine do Veronica Fashion Operator: inteligência operacional para estoque, produção, leads e coleções de moda.",
      },
      { property: "og:title", content: "Veronica Fashion Operator" },
      {
        property: "og:description",
        content: "Uma camada de decisão para transformar dados de moda em ação.",
      },
    ],
  }),
});

const capabilities = [
  {
    icon: ChartNoAxesCombined,
    title: "Mapa de Dinheiro",
    copy: "Enxerga margem, giro, ruptura e estoque parado como decisões — não como planilhas soltas.",
    tone: "from-emerald-100 via-cyan-100 to-violet-100",
  },
  {
    icon: Boxes,
    title: "Produção",
    copy: "Transforma demanda e histórico em uma leitura visual de prioridade por peça e grade.",
    tone: "from-sky-100 via-indigo-100 to-fuchsia-100",
  },
  {
    icon: UsersRound,
    title: "Leads",
    copy: "Separa lojistas e consumidores e mostra o que merece contato, reativação ou acompanhamento.",
    tone: "from-cyan-100 via-teal-100 to-lime-100",
  },
  {
    icon: Layers3,
    title: "Coleções",
    copy: "Centraliza briefing, peças, variações, estágio e contexto para a próxima decisão comercial.",
    tone: "from-rose-100 via-orange-100 to-violet-100",
  },
];

function FashionShowcase() {
  return (
    <AppleClientFrame tone="violet">
      <AppleClientNav
        eyebrow="Veronica Private Clients · Fashion"
        title="Veronica Fashion Operator"
        right={
          <Link
            to="/clientes/veronica-fashion-operator/execucao"
            className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#1d1d1f] px-4 text-[12px] font-semibold text-white transition hover:bg-black"
          >
            Abrir operação <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        }
      />

      <main>
        <section className="relative mx-auto flex min-h-[88vh] max-w-7xl items-center overflow-hidden px-5 py-20 sm:px-8 lg:py-28">
          <div className="pointer-events-none absolute inset-x-[8%] top-[13%] h-[54%] overflow-hidden rounded-[64px]">
            <HolographicField tone="violet" intensity={1} />
          </div>

          <div className="relative z-10 mx-auto max-w-5xl text-center">
            <HoloBadge>Fashion intelligence · demo navegável</HoloBadge>

            <h1 className="mt-8 text-balance text-[clamp(3.6rem,9vw,8.8rem)] font-semibold leading-[.86] tracking-[-.072em] text-black/90">
              Moda precisa de
              <span
                className="block bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    "linear-gradient(92deg,#1d1d1f 4%,#6d5dfc 30%,#00a7c8 58%,#d65fa9 82%,#1d1d1f 100%)",
                }}
              >
                decisões vivas.
              </span>
            </h1>

            <p className="mx-auto mt-8 max-w-2xl text-balance text-[clamp(1.05rem,2vw,1.35rem)] leading-8 text-black/52">
              Uma experiência operacional para enxergar dinheiro parado, produção, leads, coleções e prioridades em um único lugar.
            </p>

            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Link
                to="/clientes/veronica-fashion-operator/execucao"
                className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#1d1d1f] px-6 text-[13px] font-semibold text-white shadow-[0_14px_36px_rgba(0,0,0,.14)] transition duration-300 hover:-translate-y-0.5 hover:bg-black motion-reduce:transform-none"
              >
                Entrar na execução <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <a
                href="#produto"
                className="inline-flex min-h-12 items-center gap-2 rounded-full border border-black/[.08] bg-white/75 px-6 text-[13px] font-semibold text-black/72 backdrop-blur-xl transition hover:bg-white"
              >
                Ver como funciona <ScanSearch className="h-4 w-4" aria-hidden />
              </a>
            </div>

            <div className="mx-auto mt-16 grid max-w-4xl gap-3 sm:grid-cols-3">
              {[
                ["01", "Vitrine", "explica o produto"],
                ["02", "Execução", "mostra a operação"],
                ["03", "Dados reais", "entra depois da validação"],
              ].map(([step, title, detail]) => (
                <GlassCard key={step} className="p-5 text-left">
                  <div className="text-[10px] font-semibold uppercase tracking-[.2em] text-black/35">{step}</div>
                  <div className="mt-5 text-lg font-semibold tracking-[-.03em]">{title}</div>
                  <div className="mt-1 text-sm text-black/45">{detail}</div>
                </GlassCard>
              ))}
            </div>
          </div>
        </section>

        <section id="produto" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <SectionLabel>Produto</SectionLabel>
            <h2 className="mt-5 text-balance text-4xl font-semibold tracking-[-.055em] text-black/88 sm:text-6xl">
              Um sistema que mostra o que fazer a seguir.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-black/48">
              A home apresenta valor. A rota de execução concentra o trabalho. Cada módulo possui uma linguagem visual própria e permanece desacoplado para receber dados reais no futuro.
            </p>
          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-2">
            {capabilities.map((item) => {
              const Icon = item.icon;
              return (
                <GlassCard key={item.title} interactive className="group relative overflow-hidden p-7 sm:p-9">
                  <div className={`absolute -right-20 -top-20 h-56 w-56 rounded-full bg-gradient-to-br ${item.tone} blur-3xl transition duration-700 group-hover:scale-125`} />
                  <div className="relative">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-black/[.05] bg-white/80 shadow-sm">
                      <Icon className="h-5 w-5 text-black/72" aria-hidden />
                    </div>
                    <h3 className="mt-12 text-3xl font-semibold tracking-[-.045em] text-black/88">{item.title}</h3>
                    <p className="mt-4 max-w-xl text-[15px] leading-7 text-black/48">{item.copy}</p>
                    <div className="mt-8 inline-flex items-center gap-2 text-[12px] font-semibold text-black/62">
                      Explorar na execução <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" aria-hidden />
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
          <GlassCard className="relative overflow-hidden px-6 py-14 sm:px-12 lg:px-16 lg:py-20">
            <div className="pointer-events-none absolute inset-0">
              <HolographicField tone="aqua" intensity={0.85} />
            </div>
            <div className="relative grid items-center gap-12 lg:grid-cols-[.92fr_1.08fr]">
              <div>
                <HoloBadge>Veronica Live</HoloBadge>
                <h2 className="mt-7 text-4xl font-semibold tracking-[-.055em] text-black/88 sm:text-6xl">
                  A interface conversa com o negócio.
                </h2>
                <p className="mt-5 max-w-xl text-base leading-7 text-black/50">
                  A experiência foi preparada para uma Veronica visual, multimodal e modular. Voz, avatar e providers futuros entram por adapters, sem acoplar a operação a um único fornecedor.
                </p>
                <div className="mt-7 flex flex-wrap gap-2">
                  {["texto", "voz · roadmap", "avatar · roadmap", "providers modulares"].map((label) => (
                    <span key={label} className="rounded-full border border-black/[.07] bg-white/65 px-3 py-1.5 text-[11px] font-medium text-black/55 backdrop-blur-xl">
                      {label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="relative mx-auto w-full max-w-xl">
                <div className="absolute inset-10 rounded-full bg-gradient-to-r from-cyan-300/35 via-violet-300/35 to-pink-300/35 blur-3xl" />
                <div className="relative rounded-[36px] border border-white/90 bg-white/70 p-5 shadow-[0_30px_100px_rgba(38,52,92,.14)] backdrop-blur-3xl sm:p-7">
                  <div className="flex items-center gap-3 border-b border-black/[.06] pb-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-white">
                      <WandSparkles className="h-4 w-4" aria-hidden />
                    </div>
                    <div>
                      <div className="text-sm font-semibold">Veronica</div>
                      <div className="mt-0.5 text-[11px] text-black/42">Fashion Operator · demonstração</div>
                    </div>
                    <span className="ml-auto h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_20px_rgba(52,211,153,.8)]" />
                  </div>

                  <div className="mt-6 space-y-4">
                    <div className="ml-auto max-w-[84%] rounded-[22px_22px_6px_22px] bg-[#1d1d1f] px-4 py-3 text-sm leading-6 text-white">
                      O que está travando meu caixa?
                    </div>
                    <div className="max-w-[90%] rounded-[22px_22px_22px_6px] border border-black/[.055] bg-white/90 px-4 py-3 text-sm leading-6 text-black/65">
                      Na execução eu cruzo estoque parado, margem e giro e transformo isso em um plano priorizado. Os números atuais são DEMO até conectarmos sua fonte real.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
          <div className="grid gap-5 lg:grid-cols-3">
            <GlassCard className="p-8 lg:col-span-2">
              <div className="flex items-center gap-3">
                <BrainCircuit className="h-5 w-5 text-violet-500" aria-hidden />
                <SectionLabel>Arquitetura</SectionLabel>
              </div>
              <h2 className="mt-6 max-w-3xl text-4xl font-semibold tracking-[-.052em] text-black/88 sm:text-5xl">
                Vitrine pública. Operação separada. Núcleo privado isolado.
              </h2>
              <p className="mt-5 max-w-3xl text-[15px] leading-7 text-black/48">
                O design é uma camada. Os providers de IA, dados, regras e segurança ficam isolados em módulos próprios. Isso permite evoluir o produto sem expor o núcleo sensível da Veronica.
              </p>
            </GlassCard>

            <GlassCard className="relative overflow-hidden p-8">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-100/80 via-white/50 to-violet-100/80" />
              <div className="relative">
                <MessagesSquare className="h-6 w-6 text-black/70" aria-hidden />
                <div className="mt-16 text-4xl font-semibold tracking-[-.055em] text-black/90">1 rota</div>
                <div className="mt-2 text-sm leading-6 text-black/48">de execução concentrando o trabalho do cliente.</div>
                <Sparkles className="mt-10 h-5 w-5 text-violet-500" aria-hidden />
              </div>
            </GlassCard>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-5 pb-28 pt-16 text-center sm:px-8">
          <SectionLabel>Próximo passo</SectionLabel>
          <h2 className="mt-5 text-balance text-4xl font-semibold tracking-[-.055em] text-black/88 sm:text-6xl">
            Entre na operação.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-black/48">
            A próxima tela é a experiência de trabalho: módulos navegáveis, dados DEMO identificados e estrutura pronta para conexão real.
          </p>
          <Link
            to="/clientes/veronica-fashion-operator/execucao"
            className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#1d1d1f] px-6 text-[13px] font-semibold text-white transition hover:bg-black"
          >
            Abrir Veronica Fashion Operator <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </section>
      </main>

      <footer className="border-t border-black/[.055] bg-white/55 px-5 py-8 backdrop-blur-xl sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 text-[11px] text-black/40">
          <span>Veronica Hub · Private Clients</span>
          <span>Demonstração sem dados reais · sem cobrança conectada</span>
        </div>
      </footer>
    </AppleClientFrame>
  );
}
