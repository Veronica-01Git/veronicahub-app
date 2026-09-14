/** Central de atendimento — lista · thread · contexto. */

import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Bot, Clock, Info, Send, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePainelOps } from "@/features/express-ops-b/data/queries";
import { EsqueletoLista } from "@/features/express-ops-b/components/esqueleto";
import {
  AguardandoCadastro,
  ComDado,
  EstadoBadge,
  OpsCard,
  type Tom,
} from "@/features/express-ops-b/components/primitives";
import { BarraPrazo } from "@/features/express-ops-b/components/charts";
import { fmtDias } from "@/features/express-ops-b/format";
import type { Conversa, ConversaEstado, Mensagem } from "@/features/express-ops-b/data/types";

export const Route = createFileRoute("/preview/express-operations-b/atendimento")({
  component: CentralAtendimento,
});

const ESTADO_CONVERSA: Record<ConversaEstado, { rotulo: string; tom: Tom }> = {
  "ia-respondendo": { rotulo: "IA respondendo", tom: "acento" },
  "aguardando-humano": { rotulo: "Aguardando humano", tom: "atencao" },
  resolvida: { rotulo: "Resolvida", tom: "ok" },
};

function iniciais(nome: string): string {
  return nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function CentralAtendimento() {
  const { data } = usePainelOps();
  const [selecionadaId, setSelecionadaId] = useState<string | null>(null);

  if (!data) return <EsqueletoLista linhas={6} />;

  const conversas = data.conversas;
  const atual = conversas.find((c) => c.id === selecionadaId) ?? conversas[0];

  return (
    <div className="grid gap-4 md:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)_320px]">
      <ListaConversas
        conversas={conversas}
        atualId={atual.id}
        onSelecionar={setSelecionadaId}
        className="md:row-span-2 xl:row-span-1"
      />
      <Thread conversa={atual} />
      <ContextoCliente conversa={atual} />
    </div>
  );
}

function ListaConversas({
  conversas,
  atualId,
  onSelecionar,
  className,
}: {
  conversas: readonly Conversa[];
  atualId: string;
  onSelecionar: (id: string) => void;
  className?: string;
}) {
  return (
    <nav aria-label="Conversas" className={cn("ops-card overflow-hidden p-0", className)}>
      <h2 className="ops-label border-b border-[var(--ops-line)] px-4 py-3">
        Conversas · {conversas.length}
      </h2>
      <ul className="max-h-[560px] overflow-y-auto">
        {conversas.map((c) => {
          const ativo = c.id === atualId;
          const estado = ESTADO_CONVERSA[c.estado];
          return (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => onSelecionar(c.id)}
                aria-current={ativo ? "true" : undefined}
                className={cn(
                  "ops-motion flex w-full gap-3 border-b border-[var(--ops-line)] px-4 py-3.5 text-left transition-colors",
                  ativo ? "bg-[var(--ops-accent-soft)]" : "hover:bg-[var(--ops-surface)]",
                )}
              >
                <span
                  aria-hidden
                  className="ops-num grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--ops-surface)] text-[12px] font-semibold text-[var(--ops-ink-soft)]"
                >
                  {iniciais(c.cliente)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-[13.5px] font-medium text-[var(--ops-ink)]">
                      {c.cliente}
                    </span>
                    <span className="shrink-0 text-[11.5px] text-[var(--ops-ink-muted)]">
                      {c.quandoRel}
                    </span>
                  </span>
                  <span className="mt-0.5 block truncate text-[12.5px] text-[var(--ops-ink-muted)]">
                    {c.previa}
                  </span>
                  <span className="mt-2 flex flex-wrap items-center gap-1.5">
                    <EstadoBadge tom={estado.tom} className="text-[11px]">
                      {estado.rotulo}
                    </EstadoBadge>
                    {c.slaEstourando ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--ops-danger-soft)] px-2 py-0.5 text-[11px] font-medium text-[var(--ops-danger)]">
                        <Clock aria-hidden className="h-3 w-3" />
                        SLA
                      </span>
                    ) : null}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function Bolha({ m }: { m: Mensagem }) {
  if (m.autor === "cliente") {
    return (
      <li className="flex justify-start">
        <div className="max-w-[86%] rounded-[14px] rounded-bl-[4px] bg-[var(--ops-surface)] px-3.5 py-2.5">
          <p className="text-[13.5px] leading-relaxed text-[var(--ops-ink)]">{m.texto}</p>
          <p className="ops-num mt-1 text-[11px] text-[var(--ops-ink-muted)]">{m.hora}</p>
        </div>
      </li>
    );
  }

  const daIa = m.autor === "ia";
  return (
    <li className="flex justify-end">
      <div
        className={cn(
          "max-w-[86%] rounded-[14px] rounded-br-[4px] px-3.5 py-2.5",
          daIa
            ? "bg-[var(--ops-accent-soft)] ring-1 ring-inset ring-[oklch(0.48_0.13_255_/_0.14)]"
            : "bg-[var(--ops-accent)]",
        )}
      >
        <p
          className={cn(
            "flex items-center gap-1.5 text-[11px] font-medium",
            daIa ? "text-[var(--ops-accent-ink)]" : "text-[oklch(0.99_0_0_/_0.8)]",
          )}
        >
          {daIa ? (
            <>
              <Bot aria-hidden className="h-3 w-3" />
              Respondido pelo agente
            </>
          ) : (
            m.assinatura
          )}
        </p>
        <p
          className={cn(
            "mt-1 text-[13.5px] leading-relaxed",
            daIa ? "text-[var(--ops-ink)]" : "text-[oklch(0.99_0_0)]",
          )}
        >
          {m.texto}
        </p>
        <p
          className={cn(
            "ops-num mt-1 text-[11px]",
            daIa ? "text-[var(--ops-ink-muted)]" : "text-[oklch(0.99_0_0_/_0.7)]",
          )}
        >
          {m.hora}
        </p>
      </div>
    </li>
  );
}

function Thread({ conversa }: { conversa: Conversa }) {
  const fim = useRef<HTMLDivElement>(null);

  // Caixa de entrada abre na mensagem mais recente, não no começo do histórico.
  useEffect(() => {
    fim.current?.scrollIntoView({ block: "end" });
  }, [conversa.id]);

  return (
    <section
      className="ops-card flex min-w-0 flex-col p-0"
      aria-label={`Conversa com ${conversa.cliente}`}
    >
      <header className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-[var(--ops-line)] px-4 py-3">
        <h2 className="text-[14.5px] font-semibold text-[var(--ops-ink)]">{conversa.cliente}</h2>
        <span className="ops-num text-[12.5px] text-[var(--ops-ink-muted)]">
          {conversa.telefone}
        </span>
        <EstadoBadge tom={ESTADO_CONVERSA[conversa.estado].tom} className="ml-auto">
          {ESTADO_CONVERSA[conversa.estado].rotulo}
        </EstadoBadge>
      </header>

      <ul className="grid flex-1 content-start gap-2.5 overflow-y-auto p-4 md:max-h-[430px]">
        {conversa.mensagens.map((m) => (
          <Bolha key={m.id} m={m} />
        ))}
        <div ref={fim} aria-hidden />
      </ul>

      <footer className="border-t border-[var(--ops-line)] p-3">
        {conversa.janela24hAberta ? null : (
          <p className="mb-2.5 flex items-start gap-2 rounded-[10px] bg-[var(--ops-warn-soft)] px-3 py-2 text-[12px] leading-relaxed text-[oklch(0.4_0.09_75)]">
            <Info aria-hidden className="mt-[1px] h-3.5 w-3.5 shrink-0" />
            Janela de 24 h da Meta encerrada. Só é possível reabrir com modelo de mensagem aprovado.
          </p>
        )}
        <div className="flex items-end gap-2">
          <label htmlFor="resposta" className="sr-only">
            Escrever resposta
          </label>
          <textarea
            id="resposta"
            rows={2}
            disabled={!conversa.janela24hAberta}
            placeholder={
              conversa.janela24hAberta
                ? "Escreva a resposta ou assuma a conversa…"
                : "Requer modelo aprovado pela Meta"
            }
            className="ops-motion min-h-[44px] w-full resize-none rounded-[10px] border border-[var(--ops-line-strong)] bg-[var(--ops-card)] px-3 py-2.5 text-[13.5px] text-[var(--ops-ink)] placeholder:text-[var(--ops-ink-muted)] disabled:bg-[var(--ops-surface)] disabled:text-[var(--ops-ink-muted)]"
          />
          <Button
            type="button"
            size="sm"
            disabled={!conversa.janela24hAberta}
            className="h-11 shrink-0 px-3"
          >
            <Send aria-hidden className="h-4 w-4" />
            <span className="sr-only">Enviar resposta</span>
          </Button>
        </div>
      </footer>
    </section>
  );
}

function ContextoCliente({ conversa }: { conversa: Conversa }) {
  const ctx = conversa.contexto;
  return (
    <aside className="grid content-start gap-4" aria-label="Contexto do cliente">
      <OpsCard as="div">
        <h2 className="ops-label mb-3">Cliente</h2>
        <p className="text-[13.5px] leading-relaxed text-[var(--ops-ink)]">{ctx.endereco}</p>

        <h3 className="ops-label mb-2 mt-5">Caçamba instalada</h3>
        <ComDado valor={ctx.cacambaInstalada} compacto>
          {(c) => {
            const prorrogado = c.decorridoDias > c.contratadoDias;
            return (
              <div>
                <p className="flex items-baseline justify-between gap-2 text-[13.5px]">
                  <span className="ops-num font-semibold text-[var(--ops-ink)]">{c.id}</span>
                  <span
                    className={cn(
                      "ops-num text-[12.5px]",
                      prorrogado ? "text-[var(--ops-danger)]" : "text-[var(--ops-ink-muted)]",
                    )}
                  >
                    {c.decorridoDias}/{c.contratadoDias} dias
                  </span>
                </p>
                <BarraPrazo
                  decorrido={c.decorridoDias}
                  contratado={c.contratadoDias}
                  className="mt-2"
                />
                {prorrogado ? (
                  <p className="mt-2 text-[12px] font-medium text-[var(--ops-danger)]">
                    Em prorrogação há {fmtDias(c.decorridoDias - c.contratadoDias)}
                  </p>
                ) : null}
              </div>
            );
          }}
        </ComDado>

        <h3 className="ops-label mb-2 mt-5">Histórico</h3>
        {ctx.historico.length > 0 ? (
          <ul className="grid gap-2">
            {ctx.historico.map((h) => (
              <li key={`${h.data}-${h.resumo}`} className="flex gap-2.5 text-[12.5px]">
                <span className="ops-num shrink-0 text-[var(--ops-ink-muted)]">{h.data}</span>
                <span className="text-[var(--ops-ink-soft)]">{h.resumo}</span>
              </li>
            ))}
          </ul>
        ) : (
          <AguardandoCadastro motivo="Cliente novo — sem pedidos anteriores." compacto />
        )}
      </OpsCard>

      {ctx.escalonamento ? (
        <OpsCard as="div" className="border-[oklch(0.86_0.09_85)] bg-[var(--ops-warn-soft)]">
          <h2 className="ops-label mb-2 flex items-center gap-1.5 text-[oklch(0.42_0.1_75)]">
            <ShieldCheck aria-hidden className="h-3.5 w-3.5" />
            Escalonamento
          </h2>
          <p className="text-[13px] leading-relaxed text-[oklch(0.32_0.07_75)]">
            {ctx.escalonamento.motivo}
          </p>
          <h3 className="ops-label mb-2 mt-4 text-[oklch(0.42_0.1_75)]">A IA não decide sozinha</h3>
          <ul className="grid gap-1.5">
            {ctx.escalonamento.foraDaAlcada.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2 text-[12.5px] leading-relaxed text-[oklch(0.35_0.07_75)]"
              >
                <span
                  aria-hidden
                  className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[var(--ops-warn)]"
                />
                {r}
              </li>
            ))}
          </ul>
        </OpsCard>
      ) : null}
    </aside>
  );
}
