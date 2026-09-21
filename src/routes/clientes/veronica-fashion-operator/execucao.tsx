import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowLeft,
  BarChart3,
  Boxes,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Factory,
  Layers3,
  MessageCircle,
  Mic,
  PlugZap,
  Sparkles,
  UsersRound,
  WandSparkles,
} from "lucide-react";
import { useMemo, useState } from "react";

import {
  AppleClientFrame,
  AppleClientNav,
  GlassCard,
  HoloBadge,
  HolographicField,
  MetricTile,
  SectionLabel,
} from "@/features/private-clients/components/apple-client-ui";
import {
  actionPlan,
  collections,
  demoConversation,
  leads,
  moneyMap,
  production,
  recurrence,
} from "@/features/private-clients/data/fashion";

export const Route = createFileRoute("/clientes/veronica-fashion-operator/execucao")({
  component: FashionExecution,
  head: () => ({
    meta: [
      { title: "Execução | Veronica Fashion Operator" },
      {
        name: "description",
        content: "Ambiente de execução demonstrativo do Veronica Fashion Operator.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

const sections = [
  { id: "visao", label: "Visão", icon: Sparkles },
  { id: "dinheiro", label: "Dinheiro", icon: CircleDollarSign },
  { id: "producao", label: "Produção", icon: Factory },
  { id: "leads", label: "Leads", icon: UsersRound },
  { id: "colecoes", label: "Coleções", icon: Layers3 },
  { id: "plano", label: "Plano", icon: CheckCircle2 },
] as const;

type SectionId = (typeof sections)[number]["id"];

function FashionExecution() {
  const [active, setActive] = useState<SectionId>("visao");
  const [questionIndex, setQuestionIndex] = useState(0);
  const question = demoConversation[questionIndex] ?? demoConversation[0];

  const currentLabel = useMemo(
    () => sections.find((item) => item.id === active)?.label ?? "Visão",
    [active],
  );

  return (
    <AppleClientFrame tone={toneFor(active)}>
      <AppleClientNav
        eyebrow="Veronica Fashion Operator"
        title={`Execução · ${currentLabel}`}
        right={
          <>
            <HoloBadge>DEMO</HoloBadge>
            <Link
              to="/clientes/veronica-fashion-operator"
              className="hidden min-h-10 items-center gap-2 rounded-full border border-black/[.08] bg-white/80 px-4 text-[12px] font-semibold text-black/65 transition hover:bg-white sm:inline-flex"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Vitrine
            </Link>
          </>
        }
      />

      <main className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <GlassCard className="relative overflow-hidden p-4 sm:p-5">
          <div className="pointer-events-none absolute inset-0">
            <HolographicField tone={toneFor(active)} intensity={0.58} />
          </div>
          <div className="relative flex gap-2 overflow-x-auto pb-1">
            {sections.map((item) => {
              const Icon = item.icon;
              const selected = item.id === active;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActive(item.id)}
                  className={[
                    "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 text-[12px] font-semibold transition",
                    selected
                      ? "bg-[#1d1d1f] text-white shadow-[0_10px_30px_rgba(0,0,0,.14)]"
                      : "border border-black/[.06] bg-white/72 text-black/58 hover:bg-white",
                  ].join(" ")}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  {item.label}
                </button>
              );
            })}
            <button
              type="button"
              disabled
              className="ml-auto inline-flex min-h-11 shrink-0 cursor-not-allowed items-center gap-2 rounded-full border border-black/[.06] bg-white/60 px-4 text-[11px] font-semibold text-black/35"
            >
              <PlugZap className="h-4 w-4" aria-hidden />
              Conectar dados reais · roadmap
            </button>
          </div>
        </GlassCard>

        <div className="mt-5">
          {active === "visao" ? (
            <OverviewSection questionIndex={questionIndex} setQuestionIndex={setQuestionIndex} question={question} />
          ) : null}
          {active === "dinheiro" ? <MoneySection /> : null}
          {active === "producao" ? <ProductionSection /> : null}
          {active === "leads" ? <LeadsSection /> : null}
          {active === "colecoes" ? <CollectionsSection /> : null}
          {active === "plano" ? <ActionSection /> : null}
        </div>
      </main>
    </AppleClientFrame>
  );
}

function OverviewSection({
  questionIndex,
  setQuestionIndex,
  question,
}: {
  questionIndex: number;
  setQuestionIndex: (value: number) => void;
  question: { ask: string; answer: string };
}) {
  return (
    <div className="grid gap-5">
      <div className="grid gap-5 xl:grid-cols-[1.12fr_.88fr]">
        <GlassCard className="relative min-h-[500px] overflow-hidden p-6 sm:p-8">
          <div className="pointer-events-none absolute inset-0">
            <HolographicField tone="violet" intensity={0.82} />
          </div>
          <div className="relative flex h-full min-h-[440px] flex-col">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <SectionLabel>Veronica Live</SectionLabel>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-.045em] text-black/88">A operação conversa.</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_24px_rgba(52,211,153,.85)]" />
                <span className="text-[11px] font-medium text-black/45">demo local</span>
              </div>
            </div>

            <div className="mt-7 grid flex-1 gap-5 lg:grid-cols-[.76fr_1.24fr]">
              <div className="relative flex min-h-64 items-center justify-center overflow-hidden rounded-[30px] border border-white/80 bg-white/58 backdrop-blur-2xl">
                <div className="absolute inset-8 rounded-full bg-gradient-to-br from-cyan-200/60 via-violet-200/55 to-pink-200/60 blur-2xl" />
                <div className="relative flex flex-col items-center text-center">
                  <div className="flex h-28 w-28 items-center justify-center rounded-full border border-white/80 bg-white/55 shadow-[0_20px_70px_rgba(87,83,181,.16)] backdrop-blur-2xl">
                    <WandSparkles className="h-10 w-10 text-violet-500" aria-hidden />
                  </div>
                  <div className="mt-5 text-xl font-semibold tracking-[-.03em]">Veronica</div>
                  <div className="mt-1 text-[11px] text-black/42">assistente visual · provider agnostic</div>
                  <button
                    type="button"
                    disabled
                    className="mt-5 inline-flex cursor-not-allowed items-center gap-2 rounded-full border border-black/[.07] bg-white/65 px-4 py-2 text-[11px] font-medium text-black/38"
                  >
                    <Mic className="h-4 w-4" aria-hidden /> Voz · roadmap
                  </button>
                </div>
              </div>

              <div className="rounded-[30px] border border-black/[.055] bg-white/82 p-5 backdrop-blur-xl">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.16em] text-black/38">
                  <MessageCircle className="h-4 w-4" aria-hidden />
                  Perguntas rápidas
                </div>
                <div className="mt-4 grid gap-2">
                  {demoConversation.map((item, index) => (
                    <button
                      key={item.ask}
                      type="button"
                      onClick={() => setQuestionIndex(index)}
                      className={[
                        "rounded-[18px] border px-4 py-3 text-left text-[13px] font-medium transition",
                        index === questionIndex
                          ? "border-black/[.10] bg-[#1d1d1f] text-white"
                          : "border-black/[.055] bg-white/72 text-black/62 hover:bg-white",
                      ].join(" ")}
                    >
                      {item.ask}
                    </button>
                  ))}
                </div>
                <div className="mt-4 rounded-[20px] border border-cyan-200/70 bg-cyan-50/70 p-4">
                  <div className="text-[10px] font-semibold uppercase tracking-[.16em] text-cyan-700/70">
                    Resposta simulada
                  </div>
                  <p className="mt-3 text-[13px] leading-6 text-black/62">{question.answer}</p>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6 sm:p-8">
          <SectionLabel>Resumo operacional</SectionLabel>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-.045em] text-black/88">O que merece atenção agora.</h2>
          <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            {moneyMap.cards.map((card, index) => (
              <MetricTile
                key={card.label}
                label={card.label}
                value={card.value}
                detail={card.hint}
                accent={["#7c3aed", "#0891b2", "#059669", "#db2777"][index]}
              />
            ))}
          </div>
        </GlassCard>
      </div>

      <GlassCard className="p-6 sm:p-8">
        <div className="grid gap-8 lg:grid-cols-[.7fr_1.3fr]">
          <div>
            <SectionLabel>Modelo recorrente</SectionLabel>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-.045em] text-black/88">Acompanhamento contínuo, não relatório parado.</h2>
            <p className="mt-4 text-sm leading-6 text-black/48">
              Os blocos abaixo representam o valor mensal do produto. Nesta fase não existe cobrança conectada.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {recurrence.map((item, index) => {
              const Icon = [CircleDollarSign, BarChart3, Factory, Boxes][index] ?? Sparkles;
              return (
                <div key={item.title} className="rounded-[24px] border border-black/[.055] bg-white/72 p-5">
                  <Icon className="h-5 w-5 text-violet-500" aria-hidden />
                  <div className="mt-4 text-base font-semibold tracking-[-.02em]">{item.title}</div>
                  <p className="mt-2 text-[13px] leading-5 text-black/46">{item.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

function MoneySection() {
  return (
    <div className="grid gap-5">
      <GlassCard className="relative overflow-hidden p-6 sm:p-8">
        <div className="pointer-events-none absolute inset-0">
          <HolographicField tone="gold" intensity={0.58} />
        </div>
        <div className="relative">
          <SectionLabel>Mapa de Dinheiro · DEMO</SectionLabel>
          <h2 className="mt-3 max-w-4xl text-4xl font-semibold tracking-[-.052em] text-black/88 sm:text-5xl">
            Caixa travado vira prioridade visível.
          </h2>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {moneyMap.cards.map((card, index) => (
              <MetricTile
                key={card.label}
                label={card.label}
                value={card.value}
                detail={card.hint}
                accent={["#d97706", "#059669", "#0891b2", "#dc267f"][index]}
              />
            ))}
          </div>
        </div>
      </GlassCard>

      <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
        <GlassCard className="p-6 sm:p-8">
          <SectionLabel>Riscos por SKU</SectionLabel>
          <div className="mt-6 grid gap-3">
            {moneyMap.risky.map((item) => (
              <div key={item.sku} className="rounded-[24px] border border-black/[.055] bg-white/72 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="font-semibold tracking-[-.02em] text-black/82">{item.sku}</div>
                    <div className="mt-2 text-sm text-black/45">{item.issue}</div>
                  </div>
                  <span className="rounded-full bg-amber-100 px-3 py-1.5 text-[11px] font-semibold text-amber-800">
                    {item.impact}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-6 sm:p-8">
          <SectionLabel>Leitura Veronica</SectionLabel>
          <div className="mt-6 rounded-[28px] bg-[#1d1d1f] p-6 text-white">
            <div className="text-[10px] font-semibold uppercase tracking-[.18em] text-white/45">prioridade demonstrativa</div>
            <div className="mt-4 text-2xl font-semibold tracking-[-.035em]">Liberar estoque parado antes de produzir mais do mesmo.</div>
            <p className="mt-4 text-sm leading-6 text-white/58">
              A ação sugerida nesta demonstração parte apenas dos cards visíveis. Dados reais precisam ser conectados e validados antes de qualquer decisão operacional.
            </p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function ProductionSection() {
  return (
    <GlassCard className="relative overflow-hidden p-6 sm:p-8">
      <div className="pointer-events-none absolute inset-0">
        <HolographicField tone="aqua" intensity={0.48} />
      </div>
      <div className="relative">
        <SectionLabel>Produção · DEMO</SectionLabel>
        <h2 className="mt-3 text-4xl font-semibold tracking-[-.052em] text-black/88 sm:text-5xl">
          Grade recomendada, contexto incluído.
        </h2>
        <div className="mt-8 overflow-x-auto rounded-[26px] border border-black/[.055] bg-white/78 backdrop-blur-xl">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead>
              <tr className="border-b border-black/[.06] text-[10px] font-semibold uppercase tracking-[.16em] text-black/38">
                <th className="px-5 py-4">Peça</th>
                <th className="px-4 py-4">P</th>
                <th className="px-4 py-4">M</th>
                <th className="px-4 py-4">G</th>
                <th className="px-4 py-4">GG</th>
                <th className="px-5 py-4">Leitura</th>
              </tr>
            </thead>
            <tbody>
              {production.rows.map((row) => (
                <tr key={row.piece} className="border-b border-black/[.045] last:border-0">
                  <td className="px-5 py-5 font-semibold text-black/78">{row.piece}</td>
                  <td className="px-4 py-5 text-sm text-black/55">{row.p}</td>
                  <td className="px-4 py-5 text-sm text-black/55">{row.m}</td>
                  <td className="px-4 py-5 text-sm text-black/55">{row.g}</td>
                  <td className="px-4 py-5 text-sm text-black/55">{row.gg}</td>
                  <td className="px-5 py-5">
                    <span className="rounded-full bg-cyan-100 px-3 py-1.5 text-[11px] font-semibold text-cyan-800">{row.note}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-5 text-xs leading-5 text-black/40">
          Quantidades demonstrativas. Nenhuma ordem de produção é criada ou enviada por esta tela.
        </p>
      </div>
    </GlassCard>
  );
}

function LeadsSection() {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <FunnelCard title="B2B · lojistas" total="420 na base DEMO" items={leads.b2b} tone="violet" />
      <FunnelCard title="B2C · consumidores" total="580 na base DEMO" items={leads.b2c} tone="aqua" />
    </div>
  );
}

function FunnelCard({
  title,
  total,
  items,
  tone,
}: {
  title: string;
  total: string;
  items: readonly { stage: string; value: number }[];
  tone: "violet" | "aqua";
}) {
  return (
    <GlassCard className="relative overflow-hidden p-6 sm:p-8">
      <div className="pointer-events-none absolute inset-0">
        <HolographicField tone={tone} intensity={0.42} />
      </div>
      <div className="relative">
        <SectionLabel>Leads · DEMO</SectionLabel>
        <div className="mt-3 flex items-end justify-between gap-4">
          <h2 className="text-3xl font-semibold tracking-[-.045em] text-black/88">{title}</h2>
          <span className="text-xs font-medium text-black/42">{total}</span>
        </div>
        <div className="mt-8 grid gap-4">
          {items.map((item, index) => (
            <div key={item.stage}>
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="text-black/52">{item.stage}</span>
                <span className="font-semibold text-black/78">{item.value}</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/[.05]">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.max(14, 100 - index * 24)}%`,
                    background:
                      tone === "violet"
                        ? "linear-gradient(90deg,#7c3aed,#38bdf8)"
                        : "linear-gradient(90deg,#06b6d4,#34d399)",
                  }}
                  aria-hidden
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}

function CollectionsSection() {
  return (
    <div className="grid gap-5 lg:grid-cols-[1.05fr_.95fr]">
      <GlassCard className="relative overflow-hidden p-6 sm:p-8">
        <div className="pointer-events-none absolute inset-0">
          <HolographicField tone="rose" intensity={0.44} />
        </div>
        <div className="relative">
          <SectionLabel>Coleções · DEMO</SectionLabel>
          <h2 className="mt-3 text-4xl font-semibold tracking-[-.052em] text-black/88">Portfólio em movimento.</h2>
          <div className="mt-8 grid gap-3">
            {collections.ideas.map((idea) => (
              <div key={idea.name} className="rounded-[24px] border border-white/80 bg-white/74 p-5 backdrop-blur-xl">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="font-semibold tracking-[-.02em] text-black/80">{idea.name}</div>
                  <span className="rounded-full bg-rose-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-[.12em] text-rose-700">
                    {idea.status}
                  </span>
                </div>
                <div className="mt-2 text-sm text-black/45">{idea.pieces} peças · {idea.variations} variações</div>
              </div>
            ))}
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-6 sm:p-8">
        <SectionLabel>Briefing ativo · DEMO</SectionLabel>
        <div className="mt-6 rounded-[28px] bg-gradient-to-br from-rose-50 via-white to-violet-50 p-6">
          <p className="text-lg leading-8 tracking-[-.015em] text-black/66">{collections.briefing}</p>
        </div>
        <div className="mt-6 flex items-center gap-3 rounded-[24px] border border-black/[.055] bg-white/72 p-5">
          <Layers3 className="h-5 w-5 text-rose-500" aria-hidden />
          <div>
            <div className="text-sm font-semibold text-black/76">Histórico preservado</div>
            <div className="mt-1 text-xs text-black/42">Briefings e variações podem receber versionamento quando a fonte real for conectada.</div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

function ActionSection() {
  return (
    <div className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
      <GlassCard className="p-6 sm:p-8">
        <SectionLabel>Plano de Ação · DEMO</SectionLabel>
        <h2 className="mt-3 text-4xl font-semibold tracking-[-.052em] text-black/88">Prioridades sem ruído.</h2>
        <div className="mt-8 grid gap-3">
          {actionPlan.map((item, index) => (
            <div key={item.action} className="group rounded-[26px] border border-black/[.055] bg-white/72 p-5 transition hover:bg-white">
              <div className="grid gap-4 sm:grid-cols-[auto_1fr_auto] sm:items-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1d1d1f] text-sm font-semibold text-white">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <div>
                  <div className="font-semibold tracking-[-.02em] text-black/78">{item.action}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-semibold text-emerald-800">Impacto {item.impact}</span>
                    <span className="rounded-full bg-cyan-100 px-2.5 py-1 text-[10px] font-semibold text-cyan-800">Esforço {item.effort}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-semibold text-black/44">
                  {item.status} <ChevronRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" aria-hidden />
                </div>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="relative overflow-hidden p-6 sm:p-8">
        <div className="pointer-events-none absolute inset-0">
          <HolographicField tone="lime" intensity={0.54} />
        </div>
        <div className="relative">
          <SectionLabel>Regra do sistema</SectionLabel>
          <div className="mt-10 text-5xl font-semibold tracking-[-.06em] text-black/88">Dados → leitura → ação.</div>
          <p className="mt-6 text-sm leading-7 text-black/48">
            O produto deve explicar por que uma ação está sendo sugerida, qual dado sustenta a leitura e o que ainda é apenas demonstração.
          </p>
          <div className="mt-8 rounded-[24px] border border-white/80 bg-white/68 p-5 backdrop-blur-xl">
            <div className="flex items-center gap-2 text-[11px] font-semibold text-black/55">
              <BarChart3 className="h-4 w-4 text-emerald-500" aria-hidden />
              Nenhuma automação executa produção ou contato comercial nesta fase.
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

function toneFor(section: SectionId): "aqua" | "violet" | "rose" | "gold" | "lime" {
  if (section === "dinheiro") return "gold";
  if (section === "producao") return "aqua";
  if (section === "leads") return "lime";
  if (section === "colecoes") return "rose";
  if (section === "plano") return "violet";
  return "aqua";
}
