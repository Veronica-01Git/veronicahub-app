/** Caçambas — inventário e ciclo de vida. */

import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { usePainelOps } from "@/features/express-ops-b/data/queries";
import { EsqueletoLista } from "@/features/express-ops-b/components/esqueleto";
import {
  EstadoBadge,
  OpsCard,
  SectionTitle,
  type Tom,
} from "@/features/express-ops-b/components/primitives";
import { BarraPrazo, DiagramaCiclo } from "@/features/express-ops-b/components/charts";
import { CACAMBA_ESTADOS } from "@/features/express-ops-b/data/mock";
import { fmtDias } from "@/features/express-ops-b/format";
import type { Cacamba, CacambaEstado } from "@/features/express-ops-b/data/types";

export const Route = createFileRoute("/preview/express-operations-b/cacambas")({
  component: Cacambas,
});

const ESTADO_COPY: Record<CacambaEstado, { rotulo: string; tom: Tom }> = {
  disponivel: { rotulo: "Disponível", tom: "ok" },
  reservada: { rotulo: "Reservada", tom: "acento" },
  "em-transito": { rotulo: "Em trânsito", tom: "acento" },
  instalada: { rotulo: "Instalada", tom: "atencao" },
  "aguardando-retirada": { rotulo: "Aguardando retirada", tom: "atencao" },
  descarregada: { rotulo: "Descarregada", tom: "neutro" },
};

const TIPO_COPY: Record<Cacamba["tipo"], string> = {
  tambor: "Tambor",
  "cacamba-menor": "Caçamba menor",
};

function Cacambas() {
  const { data } = usePainelOps();
  const [filtro, setFiltro] = useState<CacambaEstado | "todas">("todas");

  if (!data) return <EsqueletoLista linhas={6} />;

  const todas = data.cacambas;
  const contagens = CACAMBA_ESTADOS.reduce<Record<CacambaEstado, number>>(
    (acc, e) => ({ ...acc, [e]: todas.filter((c) => c.estado === e).length }),
    {} as Record<CacambaEstado, number>,
  );
  const lista = filtro === "todas" ? todas : todas.filter((c) => c.estado === filtro);

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_312px]">
      <div className="grid content-start gap-4">
        <OpsCard as="div">
          <SectionTitle
            titulo="Inventário"
            apoio={`${todas.length} unidades cadastradas`}
            acao={
              filtro !== "todas" ? (
                <button
                  type="button"
                  onClick={() => setFiltro("todas")}
                  className="ops-motion text-[13px] font-medium text-[var(--ops-accent-ink)] hover:underline"
                >
                  Limpar filtro
                </button>
              ) : undefined
            }
          />
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {CACAMBA_ESTADOS.map((e) => {
              const ativo = filtro === e;
              return (
                <li key={e}>
                  <button
                    type="button"
                    onClick={() => setFiltro(ativo ? "todas" : e)}
                    aria-pressed={ativo}
                    className={cn(
                      "ops-motion w-full rounded-[10px] border p-3 text-left transition-colors",
                      ativo
                        ? "border-[var(--ops-accent)] bg-[var(--ops-accent-soft)]"
                        : "border-[var(--ops-line)] hover:bg-[var(--ops-surface)]",
                    )}
                  >
                    <span className="ops-num block text-[20px] font-semibold leading-none text-[var(--ops-ink)]">
                      {contagens[e]}
                    </span>
                    <span className="mt-1.5 block text-[11.5px] leading-tight text-[var(--ops-ink-muted)]">
                      {ESTADO_COPY[e].rotulo}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </OpsCard>

        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {lista.map((c) => {
            const estado = ESTADO_COPY[c.estado];
            const prorrogado = c.prazo ? c.prazo.decorridoDias > c.prazo.contratadoDias : false;
            return (
              <li key={c.id}>
                <article className="ops-card flex h-full flex-col p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="ops-num text-[15px] font-semibold leading-none text-[var(--ops-ink)]">
                      {c.id}
                    </h3>
                    <EstadoBadge
                      tom={estado.tom}
                      className="shrink-0 whitespace-nowrap text-[11px]"
                    >
                      {estado.rotulo}
                    </EstadoBadge>
                  </div>
                  <p className="mt-1.5 text-[12px] text-[var(--ops-ink-muted)]">
                    {TIPO_COPY[c.tipo]} · <span className="ops-num">{c.capacidadeM3}</span> m³
                  </p>

                  {c.cliente ? (
                    <div className="mt-4 border-t border-[var(--ops-line)] pt-3">
                      <p className="text-[13px] font-medium text-[var(--ops-ink)]">{c.cliente}</p>
                      <p className="mt-0.5 text-[12px] leading-relaxed text-[var(--ops-ink-muted)]">
                        {c.endereco}
                      </p>
                    </div>
                  ) : (
                    <p className="mt-4 border-t border-[var(--ops-line)] pt-3 text-[12px] text-[var(--ops-ink-muted)]">
                      {c.endereco}
                    </p>
                  )}

                  {c.prazo ? (
                    <div className="mt-auto pt-4">
                      <div className="mb-1.5 flex items-baseline justify-between gap-2">
                        <span className="ops-label text-[10px]">Prazo</span>
                        <span
                          className={cn(
                            "ops-num text-[12px] font-medium",
                            prorrogado ? "text-[var(--ops-danger)]" : "text-[var(--ops-ink-soft)]",
                          )}
                        >
                          {c.prazo.decorridoDias}/{c.prazo.contratadoDias} dias
                        </span>
                      </div>
                      <BarraPrazo
                        decorrido={c.prazo.decorridoDias}
                        contratado={c.prazo.contratadoDias}
                      />
                      {prorrogado ? (
                        <p className="mt-2 text-[11.5px] font-medium text-[var(--ops-danger)]">
                          Em prorrogação · {fmtDias(c.prazo.decorridoDias - c.prazo.contratadoDias)}{" "}
                          além
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </article>
              </li>
            );
          })}
        </ul>
      </div>

      <OpsCard as="aside" className="h-fit">
        <SectionTitle titulo="Ciclo de vida" apoio="Toque num estado para filtrar o inventário" />
        <DiagramaCiclo
          selecionado={filtro}
          contagens={contagens}
          onSelecionar={(e) => setFiltro(filtro === e ? "todas" : e)}
        />
      </OpsCard>
    </div>
  );
}
