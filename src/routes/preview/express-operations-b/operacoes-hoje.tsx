/** Operações de hoje — tabela semântica no desktop, cards no celular. */

import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Camera } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { usePainelOps } from "@/features/express-ops-b/data/queries";
import { EsqueletoLista } from "@/features/express-ops-b/components/esqueleto";
import {
  EstadoBadge,
  OpsCard,
  SegmentedControl,
  type Tom,
} from "@/features/express-ops-b/components/primitives";
import {
  ROTULO_OPERACAO,
  type Operacao,
  type OperacaoEstado,
} from "@/features/express-ops-b/data/types";

type Filtro = "todas" | "entregas" | "retiradas" | "trocas" | "atrasadas";
const FILTROS: readonly Filtro[] = ["todas", "entregas", "retiradas", "trocas", "atrasadas"];

export const Route = createFileRoute("/preview/express-operations-b/operacoes-hoje")({
  component: OperacoesHoje,
  validateSearch: (busca: Record<string, unknown>): { filtro: Filtro } => {
    const bruto = busca.filtro;
    const valido = FILTROS.find((f) => f === bruto);
    return { filtro: valido ?? "todas" };
  },
});

const ESTADO_COPY: Record<OperacaoEstado, { rotulo: string; tom: Tom }> = {
  agendada: { rotulo: "Agendada", tom: "neutro" },
  "a-caminho": { rotulo: "A caminho", tom: "acento" },
  "no-local": { rotulo: "No local", tom: "acento" },
  concluida: { rotulo: "Concluída", tom: "ok" },
  atrasada: { rotulo: "Atrasada", tom: "critico" },
};

function aplicaFiltro(ops: readonly Operacao[], filtro: Filtro): readonly Operacao[] {
  if (filtro === "entregas") return ops.filter((o) => o.tipo === "entrega");
  if (filtro === "retiradas") return ops.filter((o) => o.tipo === "retirada");
  if (filtro === "trocas") return ops.filter((o) => o.tipo === "troca");
  if (filtro === "atrasadas") return ops.filter((o) => o.estado === "atrasada");
  return ops;
}

function OperacoesHoje() {
  const { filtro } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const { data } = usePainelOps();
  const [aberta, setAberta] = useState<Operacao | null>(null);

  if (!data) return <EsqueletoLista linhas={8} />;

  const todas = data.operacoesHoje;
  const lista = aplicaFiltro(todas, filtro);

  const opcoes = [
    { id: "todas" as const, rotulo: "Todas", contagem: todas.length },
    {
      id: "entregas" as const,
      rotulo: "Entregas",
      contagem: todas.filter((o) => o.tipo === "entrega").length,
    },
    {
      id: "retiradas" as const,
      rotulo: "Retiradas",
      contagem: todas.filter((o) => o.tipo === "retirada").length,
    },
    {
      id: "trocas" as const,
      rotulo: "Trocas",
      contagem: todas.filter((o) => o.tipo === "troca").length,
    },
    {
      id: "atrasadas" as const,
      rotulo: "Atrasadas",
      contagem: todas.filter((o) => o.estado === "atrasada").length,
    },
  ];

  return (
    <div className="grid gap-5">
      <SegmentedControl
        rotulo="Filtrar operações"
        opcoes={opcoes}
        valor={filtro}
        onChange={(f) => void navigate({ search: { filtro: f } })}
      />

      {/* Desktop: tabela de verdade. É dado genuinamente tabular. */}
      <OpsCard as="div" className="hidden overflow-hidden p-0 md:block">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-[var(--ops-line)] hover:bg-transparent">
                {[
                  "Horário",
                  "Tipo",
                  "Cliente",
                  "Endereço",
                  "Motorista",
                  "Veículo",
                  "Caçamba",
                  "Estado",
                ].map((h) => (
                  <TableHead
                    key={h}
                    scope="col"
                    className="ops-label h-11 whitespace-nowrap text-[10.5px] text-[var(--ops-ink-muted)]"
                  >
                    {h}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {lista.map((o) => {
                const estado = ESTADO_COPY[o.estado];
                return (
                  <TableRow
                    key={o.id}
                    tabIndex={0}
                    role="button"
                    aria-label={`Abrir operação ${o.id} — ${o.cliente}`}
                    onClick={() => setAberta(o)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setAberta(o);
                      }
                    }}
                    className={cn(
                      "ops-motion relative cursor-pointer border-[var(--ops-line)] transition-colors hover:bg-[var(--ops-surface)]",
                      o.estado === "atrasada" &&
                        "before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-[var(--ops-danger)]",
                    )}
                  >
                    <TableCell className="ops-num whitespace-nowrap font-medium text-[var(--ops-ink)]">
                      {o.hora}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-[13px] text-[var(--ops-ink-soft)]">
                      {ROTULO_OPERACAO[o.tipo]}
                    </TableCell>
                    <TableCell className="text-[13px] font-medium text-[var(--ops-ink)]">
                      {o.cliente}
                    </TableCell>
                    <TableCell className="max-w-[240px] truncate text-[13px] text-[var(--ops-ink-muted)]">
                      {o.endereco} · {o.bairro}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-[13px] text-[var(--ops-ink-soft)]">
                      {o.motorista}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-[13px] text-[var(--ops-ink-soft)]">
                      {o.veiculo}{" "}
                      <span className="ops-num text-[12px] text-[var(--ops-ink-muted)]">
                        {o.placa}
                      </span>
                    </TableCell>
                    <TableCell className="ops-num whitespace-nowrap text-[13px] text-[var(--ops-ink-soft)]">
                      {o.cacamba}
                    </TableCell>
                    <TableCell>
                      <EstadoBadge tom={estado.tom}>
                        {estado.rotulo}
                        {o.atrasoMin ? ` · ${o.atrasoMin} min` : ""}
                      </EstadoBadge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </OpsCard>

      {/* Celular: cada linha vira card — nada de tabela larga rolando. */}
      <ul className="grid gap-2.5 md:hidden">
        {lista.map((o) => {
          const estado = ESTADO_COPY[o.estado];
          return (
            <li key={o.id}>
              <button
                type="button"
                onClick={() => setAberta(o)}
                className={cn(
                  "ops-card ops-motion relative w-full p-4 text-left transition-colors hover:bg-[var(--ops-surface)]",
                  o.estado === "atrasada" &&
                    "before:absolute before:inset-y-3 before:left-0 before:w-[3px] before:rounded-r before:bg-[var(--ops-danger)]",
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="ops-num text-[15px] font-semibold text-[var(--ops-ink)]">
                    {o.hora}
                  </span>
                  <EstadoBadge tom={estado.tom}>{estado.rotulo}</EstadoBadge>
                </div>
                <p className="mt-2 text-[14px] font-medium text-[var(--ops-ink)]">{o.cliente}</p>
                <p className="mt-0.5 text-[12.5px] text-[var(--ops-ink-muted)]">
                  {ROTULO_OPERACAO[o.tipo]} · {o.endereco} · {o.bairro}
                </p>
                <p className="mt-2 text-[12.5px] text-[var(--ops-ink-muted)]">
                  {o.motorista} · {o.veiculo} <span className="ops-num">{o.placa}</span> ·{" "}
                  <span className="ops-num">{o.cacamba}</span>
                </p>
              </button>
            </li>
          );
        })}
      </ul>

      {lista.length === 0 ? (
        <OpsCard as="div" className="text-center">
          <p className="text-[13.5px] text-[var(--ops-ink-muted)]">
            Nenhuma operação neste filtro.
          </p>
        </OpsCard>
      ) : null}

      <PainelOperacao operacao={aberta} onFechar={() => setAberta(null)} />
    </div>
  );
}

function PainelOperacao({
  operacao,
  onFechar,
}: {
  operacao: Operacao | null;
  onFechar: () => void;
}) {
  return (
    <Sheet open={operacao !== null} onOpenChange={(o) => !o && onFechar()}>
      <SheetContent
        side="right"
        className="express-ops-b w-full overflow-y-auto border-l border-[var(--ops-line)] bg-[var(--ops-card)] sm:max-w-[420px]"
      >
        {operacao ? (
          <>
            <SheetHeader className="text-left">
              <SheetTitle className="text-[17px] font-semibold text-[var(--ops-ink)]">
                {operacao.cliente}
              </SheetTitle>
              <SheetDescription className="text-[13px] text-[var(--ops-ink-muted)]">
                {ROTULO_OPERACAO[operacao.tipo]} · <span className="ops-num">{operacao.id}</span> ·{" "}
                {operacao.endereco}, {operacao.bairro}
              </SheetDescription>
            </SheetHeader>

            <dl className="mt-6 grid grid-cols-2 gap-4">
              {[
                ["Motorista", operacao.motorista],
                ["Veículo", `${operacao.veiculo} · ${operacao.placa}`],
                ["Caçamba", operacao.cacamba],
                ["Janela", operacao.hora],
              ].map(([rotulo, valor]) => (
                <div key={rotulo}>
                  <dt className="ops-label mb-1">{rotulo}</dt>
                  <dd className="text-[13.5px] text-[var(--ops-ink)]">{valor}</dd>
                </div>
              ))}
            </dl>

            <section className="mt-7">
              <h3 className="ops-label mb-3">Linha do tempo</h3>
              <ol className="relative grid gap-4 pl-5">
                <span
                  aria-hidden
                  className="absolute left-[5px] top-2 bottom-2 w-px bg-[var(--ops-line)]"
                />
                {operacao.etapas.map((e) => (
                  <li key={e.rotulo} className="relative">
                    <span
                      aria-hidden
                      className={cn(
                        "absolute -left-5 top-1 h-[11px] w-[11px] rounded-full border-2 border-[var(--ops-card)]",
                        e.concluida ? "bg-[var(--ops-ok)]" : "bg-[var(--ops-line-strong)]",
                      )}
                    />
                    <div className="flex items-baseline justify-between gap-3">
                      <span
                        className={cn(
                          "text-[13.5px]",
                          e.concluida ? "text-[var(--ops-ink)]" : "text-[var(--ops-ink-muted)]",
                        )}
                      >
                        {e.rotulo}
                      </span>
                      <span className="ops-num text-[12.5px] text-[var(--ops-ink-muted)]">
                        {e.hora ?? "—"}
                      </span>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            <section className="mt-7">
              <h3 className="ops-label mb-3">Comprovantes</h3>
              {operacao.comprovantes.length > 0 ? (
                <ul className="grid grid-cols-2 gap-3">
                  {operacao.comprovantes.map((c) => (
                    <li key={c}>
                      <div
                        className="grid aspect-[4/3] place-items-center rounded-[10px] border border-dashed border-[var(--ops-line-strong)] bg-[var(--ops-surface)]"
                        role="img"
                        aria-label={`Foto do motorista: ${c}`}
                      >
                        <Camera aria-hidden className="h-5 w-5 text-[var(--ops-neutral)]" />
                      </div>
                      <p className="mt-1.5 text-[11.5px] leading-snug text-[var(--ops-ink-muted)]">
                        Foto do motorista · {c}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[13px] text-[var(--ops-ink-muted)]">
                  Os comprovantes aparecem aqui quando o motorista conclui a operação.
                </p>
              )}
            </section>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
