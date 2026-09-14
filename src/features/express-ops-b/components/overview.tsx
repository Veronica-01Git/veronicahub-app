/** Blocos da Visão geral. */

import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fmtEspera, fmtInteiro, fmtMoeda, fmtPct } from "../format";
import { hrefDe } from "../nav";
import { CACAMBA_ESTADOS } from "../data/mock";
import {
  isAwaiting,
  type AgendaAmanha,
  type Aprovacao,
  type Cacamba,
  type CacambaEstado,
  type Frota,
  type Kpi,
  type Maybe,
  type ParadaRota,
  type ProgressoDia,
  type ResumoFinanceiro,
} from "../data/types";
import {
  BarraSegmentada,
  LegendaSegmentos,
  SetaVariacao,
  Sparkline,
  type Segmento,
} from "./charts";
import { AguardandoCadastro, ComDado, EstadoBadge, OpsCard, SectionTitle } from "./primitives";

function textoKpi(k: Kpi, valor: number): string {
  if (k.format === "moeda") return fmtMoeda(valor);
  if (k.format === "duracao-min") return fmtInteiro(valor);
  return fmtInteiro(valor);
}

export function CardKpi({ kpi }: { kpi: Kpi }) {
  return (
    <OpsCard as="div" className="flex h-full min-w-0 flex-col justify-between gap-4">
      <p className="ops-label">{kpi.label}</p>

      {isAwaiting(kpi.value) ? (
        <AguardandoCadastro motivo={kpi.value.motivo} compacto />
      ) : (
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="ops-num text-[30px] font-semibold leading-none text-[var(--ops-ink)]">
              {textoKpi(kpi, kpi.value)}
              {kpi.format === "duracao-min" ? (
                <span className="ml-1 text-[15px] font-medium text-[var(--ops-ink-muted)]">
                  min
                </span>
              ) : null}
            </p>
            {isAwaiting(kpi.deltaPct) ? null : (
              <p className="mt-2 flex items-center gap-1.5 text-[12.5px] text-[var(--ops-ink-muted)]">
                <SetaVariacao
                  direcao={kpi.deltaPct === 0 ? "igual" : kpi.deltaPct > 0 ? "sobe" : "desce"}
                  bom={
                    kpi.deltaPct === 0 ||
                    (kpi.deltaPct > 0
                      ? kpi.deltaBoaDirecao === "sobe"
                      : kpi.deltaBoaDirecao === "desce")
                  }
                />
                <span className="ops-num">{fmtPct(kpi.deltaPct)}</span>
                <span>vs. ontem</span>
              </p>
            )}
          </div>
          {isAwaiting(kpi.serie) ? null : (
            <div className="shrink-0 pb-1">
              <Sparkline serie={kpi.serie} />
            </div>
          )}
        </div>
      )}
    </OpsCard>
  );
}

export function CardOperacoesDia({ progresso }: { progresso: ProgressoDia }) {
  const total = progresso.concluidas + progresso.emRota + progresso.pendentes + progresso.atrasadas;
  const segmentos: readonly Segmento[] = [
    { id: "concluidas", rotulo: "Concluídas", valor: progresso.concluidas, cor: "var(--ops-ok)" },
    { id: "em-rota", rotulo: "Em rota", valor: progresso.emRota, cor: "var(--ops-accent)" },
    {
      id: "pendentes",
      rotulo: "Pendentes",
      valor: progresso.pendentes,
      cor: "var(--ops-line-strong)",
    },
    { id: "atrasadas", rotulo: "Atrasadas", valor: progresso.atrasadas, cor: "var(--ops-danger)" },
  ];

  return (
    <OpsCard className="h-full">
      <SectionTitle
        titulo="Operações do dia"
        apoio={`${total} entregas e retiradas programadas`}
        acao={
          <Link
            to={hrefDe("operacoes-hoje")}
            className="ops-motion inline-flex items-center gap-1 text-[13px] font-medium text-[var(--ops-accent-ink)] hover:gap-1.5"
          >
            Ver todas <ArrowRight aria-hidden className="h-3.5 w-3.5" />
          </Link>
        }
      />
      <BarraSegmentada segmentos={segmentos} altura={10} />
      <LegendaSegmentos segmentos={segmentos} />
      {progresso.atrasadas > 0 ? (
        <Link
          to={hrefDe("operacoes-hoje")}
          search={{ filtro: "atrasadas" }}
          className="ops-motion mt-4 flex items-center gap-2 rounded-[10px] bg-[var(--ops-danger-soft)] px-3 py-2.5 text-[13px] text-[var(--ops-danger)] hover:brightness-[0.98]"
        >
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[var(--ops-danger)]" />
          <span className="font-medium">
            {progresso.atrasadas} operação atrasada — abrir para resolver
          </span>
          <ArrowRight aria-hidden className="ml-auto h-3.5 w-3.5" />
        </Link>
      ) : null}
    </OpsCard>
  );
}

export function CardFrota({
  frota,
  cacambas,
}: {
  frota: Maybe<Frota>;
  cacambas: readonly Cacamba[];
}) {
  const contagens = CACAMBA_ESTADOS.reduce<Record<CacambaEstado, number>>(
    (acc, e) => ({ ...acc, [e]: cacambas.filter((c) => c.estado === e).length }),
    {} as Record<CacambaEstado, number>,
  );
  const segmentos: readonly Segmento[] = [
    { id: "disponivel", rotulo: "Disponíveis", valor: contagens.disponivel, cor: "var(--ops-ok)" },
    { id: "reservada", rotulo: "Reservadas", valor: contagens.reservada, cor: "var(--ops-accent)" },
    { id: "instalada", rotulo: "Instaladas", valor: contagens.instalada, cor: "var(--ops-warn)" },
  ];

  return (
    <OpsCard className="h-full">
      <SectionTitle
        titulo="Frota e caçambas"
        apoio="Veículos em operação e inventário por estado"
      />
      <div className="grid gap-5">
        <div>
          <p className="ops-label mb-2">Veículos em operação</p>
          <ComDado valor={frota} compacto>
            {(f) => (
              <p className="ops-num text-[24px] font-semibold leading-none text-[var(--ops-ink)]">
                {f.veiculosEmOperacao}
                <span className="text-[15px] font-medium text-[var(--ops-ink-muted)]">
                  /{f.veiculosTotal}
                </span>
              </p>
            )}
          </ComDado>
        </div>
        <div>
          <p className="ops-label mb-2.5">Caçambas por estado</p>
          <BarraSegmentada segmentos={segmentos} altura={10} />
          <LegendaSegmentos segmentos={segmentos} />
        </div>
      </div>
    </OpsCard>
  );
}

const TIPO_APROVACAO: Record<Aprovacao["tipo"], string> = {
  desconto: "Desconto fora da tabela",
  prazo: "Prazo especial",
  cancelamento: "Cancelamento",
};

export function CardAprovacoes({ itens }: { itens: readonly Aprovacao[] }) {
  return (
    <OpsCard className="h-full">
      <SectionTitle
        titulo="Aprovações pendentes"
        apoio="A IA parou e pediu decisão humana"
        acao={
          <Link
            to={hrefDe("aprovacoes")}
            className="ops-motion inline-flex items-center gap-1 text-[13px] font-medium text-[var(--ops-accent-ink)] hover:gap-1.5"
          >
            Abrir fila <ArrowRight aria-hidden className="h-3.5 w-3.5" />
          </Link>
        }
      />
      <ul className="grid gap-2.5">
        {itens.map((a) => (
          <li
            key={a.id}
            className="grid gap-3 rounded-[10px] border border-[var(--ops-line)] p-3.5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <EstadoBadge tom="atencao">{TIPO_APROVACAO[a.tipo]}</EstadoBadge>
                <span className="text-[13.5px] font-medium text-[var(--ops-ink)]">{a.cliente}</span>
              </div>
              <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-[var(--ops-ink-muted)]">
                {isAwaiting(a.valorEmJogo) ? (
                  <span className="italic">Valor aguardando cadastro</span>
                ) : (
                  <span className="ops-num font-medium text-[var(--ops-ink-soft)]">
                    {fmtMoeda(a.valorEmJogo)}
                  </span>
                )}
                <span aria-hidden className="opacity-40">
                  ·
                </span>
                <span>aguarda há {fmtEspera(a.aguardandoMin)}</span>
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button size="sm" className="h-8 px-3 text-[12.5px]">
                Aprovar
              </Button>
              <Button size="sm" variant="outline" className="h-8 px-3 text-[12.5px]">
                Revisar
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </OpsCard>
  );
}

export function CardRotas({ paradas }: { paradas: readonly ParadaRota[] }) {
  return (
    <OpsCard className="h-full">
      <SectionTitle titulo="Próximas rotas" apoio="Saídas confirmadas para o restante do dia" />
      <ol className="relative grid gap-5 pl-5">
        <span
          aria-hidden
          className="absolute left-[5px] top-2 bottom-2 w-px bg-[var(--ops-line)]"
        />
        {paradas.map((p) => (
          <li key={`${p.hora}-${p.placa}`} className="relative">
            <span
              aria-hidden
              className={cn(
                "absolute -left-5 top-1.5 h-[11px] w-[11px] rounded-full border-2 border-[var(--ops-card)]",
                p.tipo === "entrega" ? "bg-[var(--ops-accent)]" : "bg-[var(--ops-warn)]",
              )}
            />
            <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
              <span className="ops-num text-[14px] font-semibold text-[var(--ops-ink)]">
                {p.hora}
              </span>
              <span className="text-[13.5px] text-[var(--ops-ink)]">{p.destino}</span>
              <span className="ops-label text-[10px]">
                {p.tipo === "entrega" ? "Entrega" : "Retirada"}
              </span>
            </div>
            <p className="mt-0.5 text-[12.5px] text-[var(--ops-ink-muted)]">
              {p.motorista} · {p.veiculo} · <span className="ops-num">{p.placa}</span>
            </p>
          </li>
        ))}
      </ol>
    </OpsCard>
  );
}

export function CardFinanceiro({ financeiro }: { financeiro: ResumoFinanceiro }) {
  return (
    <OpsCard className="h-full">
      <SectionTitle
        titulo="Resumo financeiro e documental"
        apoio="O que o agente originou e o que falta fechar"
      />
      <dl className="grid gap-4 sm:grid-cols-3">
        <div>
          <dt className="ops-label mb-1.5">Pedidos pelo agente</dt>
          <dd className="ops-num text-[22px] font-semibold leading-none text-[var(--ops-ink)]">
            {financeiro.pedidosPeloAgente}
          </dd>
        </div>
        <div>
          <dt className="ops-label mb-1.5">Pagamentos aprovados</dt>
          <dd>
            <ComDado valor={financeiro.pagamentosAprovados} compacto>
              {(v) => (
                <span className="ops-num text-[22px] font-semibold leading-none text-[var(--ops-ink)]">
                  {fmtMoeda(v)}
                </span>
              )}
            </ComDado>
          </dd>
        </div>
        <div>
          <dt className="ops-label mb-1.5">Pendentes de conclusão</dt>
          <dd className="ops-num text-[22px] font-semibold leading-none text-[var(--ops-ink)]">
            {financeiro.pendentesConclusao}
          </dd>
        </div>
      </dl>
      <div className="mt-5 border-t border-[var(--ops-line)] pt-4">
        <p className="ops-label mb-2">Documentos de resíduos (CTR / MTR)</p>
        <ComDado valor={financeiro.documentosResiduos} compacto>
          {(d) => (
            <p className="text-[13.5px] text-[var(--ops-ink-soft)]">
              <span className="ops-num font-semibold">{d.emitidos}</span> emitidos ·{" "}
              <span className="ops-num font-semibold">{d.pendentes}</span> pendentes
            </p>
          )}
        </ComDado>
      </div>
    </OpsCard>
  );
}

export function CardAgendaAmanha({ agenda }: { agenda: AgendaAmanha }) {
  return (
    <OpsCard className="h-full">
      <SectionTitle titulo="Agenda de amanhã" apoio="Fechamento provisório do dia seguinte" />
      <p className="ops-num text-[30px] font-semibold leading-none text-[var(--ops-ink)]">
        {agenda.operacoes}
        <span className="ml-1.5 text-[14px] font-medium text-[var(--ops-ink-muted)]">
          operações
        </span>
      </p>
      {agenda.conflitos.length > 0 ? (
        <ul className="mt-4 grid gap-2">
          {agenda.conflitos.map((c) => (
            <li
              key={c}
              className="flex items-start gap-2 rounded-[10px] bg-[var(--ops-warn-soft)] px-3 py-2.5 text-[12.5px] leading-relaxed text-[oklch(0.42_0.1_75)]"
            >
              <span
                aria-hidden
                className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--ops-warn)]"
              />
              {c}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-[13px] text-[var(--ops-ink-muted)]">Sem conflitos de agenda.</p>
      )}
    </OpsCard>
  );
}
