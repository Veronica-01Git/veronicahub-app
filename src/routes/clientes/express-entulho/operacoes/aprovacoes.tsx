/** Aprovações humanas — fila de decisões escaladas pela IA. */

import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Bot, Check, ShieldCheck, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePainelOps } from "@/features/express-ops-b/data/queries";
import { EsqueletoLista } from "@/features/express-ops-b/components/esqueleto";
import {
  ComDado,
  EstadoBadge,
  OpsCard,
  SectionTitle,
} from "@/features/express-ops-b/components/primitives";
import { fmtEspera, fmtMoeda } from "@/features/express-ops-b/format";
import type { Aprovacao, DecisaoRegistrada } from "@/features/express-ops-b/data/types";

export const Route = createFileRoute("/clientes/express-entulho/operacoes/aprovacoes")({
  component: Aprovacoes,
});

const TIPO_COPY: Record<Aprovacao["tipo"], string> = {
  desconto: "Desconto fora da tabela",
  prazo: "Prazo especial",
  cancelamento: "Cancelamento",
};

const DECISAO_COPY: Record<
  DecisaoRegistrada["decisao"],
  { rotulo: string; tom: "ok" | "atencao" | "critico" }
> = {
  aprovado: { rotulo: "Aprovado", tom: "ok" },
  ajustado: { rotulo: "Ajustado", tom: "atencao" },
  recusado: { rotulo: "Recusado", tom: "critico" },
};

function Aprovacoes() {
  const { data } = usePainelOps();
  /** Estado local só da demo — nada é persistido. */
  const [resolvidas, setResolvidas] = useState<
    Record<string, "aprovado" | "ajustado" | "recusado">
  >({});

  if (!data) return <EsqueletoLista linhas={4} />;

  const fila = [...data.aprovacoes].sort((a, b) => b.aguardandoMin - a.aguardandoMin);
  const pendentes = fila.filter((a) => !resolvidas[a.id]);

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_330px]">
      <div className="grid content-start gap-4">
        <OpsCard as="div" className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div>
            <p className="ops-label mb-1.5">Na fila</p>
            <p className="ops-num text-[26px] font-semibold leading-none text-[var(--ops-ink)]">
              {pendentes.length}
            </p>
          </div>
          <div>
            <p className="ops-label mb-1.5">Espera mais longa</p>
            <p className="ops-num text-[26px] font-semibold leading-none text-[var(--ops-ink)]">
              {pendentes.length > 0 ? fmtEspera(pendentes[0].aguardandoMin) : "—"}
            </p>
          </div>
          <p className="ml-auto max-w-[280px] text-[12.5px] leading-relaxed text-[var(--ops-ink-muted)]">
            A IA só escala o que está fora da alçada dela. Toda decisão fica registrada com autor e
            horário.
          </p>
        </OpsCard>

        {pendentes.length === 0 ? (
          <OpsCard as="div" className="py-10 text-center">
            <ShieldCheck aria-hidden className="mx-auto h-7 w-7 text-[var(--ops-ok)]" />
            <p className="mt-3 text-[14px] font-medium text-[var(--ops-ink)]">Fila vazia</p>
            <p className="mt-1 text-[13px] text-[var(--ops-ink-muted)]">
              Nenhuma decisão aguardando um humano agora.
            </p>
          </OpsCard>
        ) : (
          <ul className="grid gap-3">
            {pendentes.map((a) => (
              <li key={a.id}>
                <ItemAprovacao
                  aprovacao={a}
                  onDecidir={(d) => setResolvidas((prev) => ({ ...prev, [a.id]: d }))}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      <HistoricoDecisoes
        registradas={data.historicoDecisoes}
        novas={fila
          .filter((a) => resolvidas[a.id])
          .map((a) => ({
            id: a.id,
            resumo: `${TIPO_COPY[a.tipo]} — ${a.cliente}`,
            decisao: resolvidas[a.id],
            quem: "Você (demonstração)",
            quando: "Agora",
          }))}
      />
    </div>
  );
}

function ItemAprovacao({
  aprovacao,
  onDecidir,
}: {
  aprovacao: Aprovacao;
  onDecidir: (d: "aprovado" | "ajustado" | "recusado") => void;
}) {
  const [justificativa, setJustificativa] = useState("");
  const campoId = `justificativa-${aprovacao.id}`;

  return (
    <article className="ops-card p-5">
      <header className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <EstadoBadge tom="atencao">{TIPO_COPY[aprovacao.tipo]}</EstadoBadge>
        <h3 className="text-[14.5px] font-semibold text-[var(--ops-ink)]">{aprovacao.cliente}</h3>
        <span className="ml-auto text-[12.5px] text-[var(--ops-ink-muted)]">
          aguarda há {fmtEspera(aprovacao.aguardandoMin)}
        </span>
      </header>

      <dl className="mt-4 grid gap-3.5 sm:grid-cols-2">
        <div>
          <dt className="ops-label mb-1.5">O cliente pediu</dt>
          <dd className="text-[13.5px] leading-relaxed text-[var(--ops-ink)]">
            {aprovacao.pedidoDoCliente}
          </dd>
        </div>
        <div>
          <dt className="ops-label mb-1.5 flex items-center gap-1.5">
            <Bot aria-hidden className="h-3 w-3" />A IA propôs
          </dt>
          <dd className="text-[13.5px] leading-relaxed text-[var(--ops-ink)]">
            {aprovacao.propostaDaIa}
          </dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-[10px] bg-[var(--ops-surface)] px-3.5 py-3">
        <p className="text-[12.5px] text-[var(--ops-ink-soft)]">
          <span className="ops-label mr-1.5 inline">Regra</span>
          {aprovacao.regraVioloda}
        </p>
        <div className="ml-auto text-right">
          <p className="ops-label mb-0.5">Valor em jogo</p>
          <ComDado valor={aprovacao.valorEmJogo} compacto>
            {(v) => (
              <p className="ops-num text-[15px] font-semibold text-[var(--ops-ink)]">
                {fmtMoeda(v)}
              </p>
            )}
          </ComDado>
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor={campoId} className="ops-label mb-1.5 block">
          Justificativa
        </label>
        <textarea
          id={campoId}
          rows={2}
          value={justificativa}
          onChange={(e) => setJustificativa(e.target.value)}
          placeholder="Por que esta decisão? Fica registrado no histórico."
          className="w-full resize-none rounded-[10px] border border-[var(--ops-line-strong)] bg-[var(--ops-card)] px-3 py-2.5 text-[13.5px] text-[var(--ops-ink)] placeholder:text-[var(--ops-ink-muted)]"
        />
      </div>

      <footer className="mt-4 flex flex-wrap gap-2">
        <Button type="button" size="sm" className="h-9 px-4" onClick={() => onDecidir("aprovado")}>
          <Check aria-hidden className="h-4 w-4" />
          Aprovar
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-9 px-4"
          onClick={() => onDecidir("ajustado")}
        >
          <SlidersHorizontal aria-hidden className="h-4 w-4" />
          Ajustar
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-9 px-4 text-[var(--ops-danger)] hover:bg-[var(--ops-danger-soft)] hover:text-[var(--ops-danger)]"
          onClick={() => onDecidir("recusado")}
        >
          <X aria-hidden className="h-4 w-4" />
          Recusar
        </Button>
      </footer>
    </article>
  );
}

function HistoricoDecisoes({
  registradas,
  novas,
}: {
  registradas: readonly DecisaoRegistrada[];
  novas: readonly DecisaoRegistrada[];
}) {
  const todas = [...novas, ...registradas];
  return (
    <OpsCard as="aside" className="h-fit">
      <SectionTitle titulo="Histórico de decisões" apoio="Quem decidiu, o quê e quando" />
      <ol className="grid gap-3">
        {todas.map((d) => {
          const copy = DECISAO_COPY[d.decisao];
          return (
            <li
              key={d.id}
              className={cn(
                "border-l-2 pl-3",
                d.decisao === "aprovado" && "border-[var(--ops-ok)]",
                d.decisao === "ajustado" && "border-[var(--ops-warn)]",
                d.decisao === "recusado" && "border-[var(--ops-danger)]",
              )}
            >
              <p className="text-[13px] leading-snug text-[var(--ops-ink)]">{d.resumo}</p>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-[var(--ops-ink-muted)]">
                <EstadoBadge tom={copy.tom} className="text-[11px]">
                  {copy.rotulo}
                </EstadoBadge>
                <span>{d.quem}</span>
                <span aria-hidden className="opacity-40">
                  ·
                </span>
                <span>{d.quando}</span>
              </p>
            </li>
          );
        })}
      </ol>
    </OpsCard>
  );
}
