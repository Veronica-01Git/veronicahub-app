/**
 * Regras do agente — a matriz de preços e um chat com o agente real.
 *
 * O chat conversa com o MESMO núcleo que responderia no WhatsApp, com a
 * mesma guarda de preço. Serve para testar sem instalar nada e para
 * demonstrar ao cliente na reunião.
 */

import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Bot, Send, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { conversarComAgente } from "@/features/express-ops-b/data/agente";
import { OpsCard, SectionTitle, EstadoBadge } from "@/features/express-ops-b/components/primitives";
import { REGRAS_EXPRESS_ENTULHO as R, buscarPreco, type ProdutoId } from "@/lib/whatsapp-rules";

export const Route = createFileRoute("/clientes/express-entulho/operacoes/regras-do-agente")({
  component: RegrasDoAgente,
});

type Fala = {
  readonly de: "cliente" | "agente";
  readonly texto: string;
  readonly escalou?: boolean;
  readonly motivo?: string;
};

const SUGESTOES = [
  "quanto custa uma caçamba?",
  "é demolição, em Itajaí",
  // Mesmo preço fora da sede; a distância só pode alterar a janela logística.
  "menor, demolição, em Itapema",
  "e se for gesso na grande?",
  "me dá 20% de desconto",
  "a caçamba encheu, preciso de outra",
];

function MatrizPrecos() {
  const materiais = R.materiais;
  const produtos = R.produtos;
  return (
    <div className="min-w-0 overflow-x-auto">
      <table className="w-full border-collapse text-[13px]">
        <caption className="sr-only">
          Preços padrão por produto e material nas cidades atendidas
        </caption>
        <thead>
          <tr>
            <th
              scope="col"
              className="ops-label border-b border-[var(--ops-line)] px-3 py-2 text-left"
            >
              Produto
            </th>
            <th
              scope="col"
              className="ops-label border-b border-[var(--ops-line)] px-3 py-2 text-left"
            >
              Prazo
            </th>
            {materiais.map((m) => (
              <th
                key={m.id}
                scope="col"
                className="ops-label border-b border-[var(--ops-line)] px-3 py-2 text-right"
              >
                {m.rotulo}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {produtos.map((p) => (
            <tr key={p.id} className="border-b border-[var(--ops-line)] last:border-0">
              <td className="px-3 py-2.5 font-medium text-[var(--ops-ink)]">
                {p.rotulo}
                {p.cidades.length < R.cidades.length ? (
                  <span className="ml-1.5 text-[11px] text-[var(--ops-ink-muted)]">só Itajaí</span>
                ) : null}
              </td>
              <td className="ops-num px-3 py-2.5 text-[var(--ops-ink-soft)]">
                {p.diasIncluidos} dias
              </td>
              {materiais.map((m) => {
                const valor = buscarPreco(R, p.id as ProdutoId, m.id, "itajai");
                const preco = valor == null ? null : { valorReais: valor };
                return (
                  <td key={m.id} className="px-3 py-2.5 text-right">
                    {preco ? (
                      <span className="ops-num font-semibold text-[var(--ops-ink)]">
                        R$ {preco.valorReais}
                      </span>
                    ) : (
                      <span className="text-[12px] italic text-[var(--ops-ink-muted)]">
                        não informado
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RegrasDoAgente() {
  const [falas, setFalas] = useState<readonly Fala[]>([]);
  const [rascunho, setRascunho] = useState("");
  const [pensando, setPensando] = useState(false);
  const fim = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fim.current?.scrollIntoView({ block: "end" });
  }, [falas.length, pensando]);

  async function enviar(texto: string) {
    const limpo = texto.trim();
    if (!limpo || pensando) return;
    setRascunho("");
    const comCliente = [...falas, { de: "cliente" as const, texto: limpo }];
    setFalas(comCliente);
    setPensando(true);
    try {
      const historico = falas.map((f) => ({
        role: f.de === "cliente" ? ("user" as const) : ("assistant" as const),
        content: f.texto,
      }));
      const r = await conversarComAgente({ data: { mensagem: limpo, historico } });
      if ("erro" in r) {
        setFalas([...comCliente, { de: "agente", texto: r.erro }]);
        return;
      }
      setFalas([
        ...comCliente,
        { de: "agente", texto: r.texto, escalou: r.escalar, motivo: r.motivo },
      ]);
    } catch {
      setFalas([
        ...comCliente,
        {
          de: "agente",
          texto: "Não consegui responder agora. Tente de novo.",
          escalou: true,
          motivo: "falha de rede",
        },
      ]);
    } finally {
      setPensando(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="grid min-w-0 content-start gap-4">
        <OpsCard className="min-w-0">
          <SectionTitle
            titulo="Preços por material"
            apoio="O material define o preço; a cidade não altera o valor"
          />
          <MatrizPrecos />
          <p className="mt-4 border-t border-[var(--ops-line)] pt-3 text-[12.5px] leading-relaxed text-[var(--ops-ink-muted)]">
            Onde está "não informado", o agente não inventa nem estima. Os valores confirmados são
            padrão em todas as cidades onde o produto é atendido; distância da central de Itajaí
            altera somente prazo ou janela de entrega.
          </p>
        </OpsCard>

        <OpsCard className="min-w-0">
          <SectionTitle
            titulo="Agenda operacional"
            apoio="Regras confirmadas para receber e organizar pedidos"
          />
          <dl className="grid gap-3 text-[13px] sm:grid-cols-2">
            <div className="rounded-[10px] bg-[var(--ops-surface)] p-3">
              <dt className="ops-label mb-1">Funcionamento</dt>
              <dd className="text-[var(--ops-ink)]">{R.agenda.diasOperacao}</dd>
            </div>
            <div className="rounded-[10px] bg-[var(--ops-surface)] p-3">
              <dt className="ops-label mb-1">Sábado</dt>
              <dd className="text-[var(--ops-ink)]">até {R.agenda.sabadoAte}</dd>
            </div>
            <div className="rounded-[10px] bg-[var(--ops-surface)] p-3 sm:col-span-2">
              <dt className="ops-label mb-1">Fim de semana → segunda-feira</dt>
              <dd className="text-[var(--ops-ink)]">
                Agenda aberta para até {R.agenda.limitePedidosSegundaFimDeSemana} pedidos.
              </dd>
            </div>
            <div className="rounded-[10px] bg-[var(--ops-surface)] p-3 sm:col-span-2">
              <dt className="ops-label mb-1">Distância da central</dt>
              <dd className="text-[var(--ops-ink)]">
                Mesmo preço. Conforme a distância/rota, a entrega pode levar até{" "}
                {R.ajusteLogisticoForaItajai.acrescimoHorasMaximo} hora ou{" "}
                {R.ajusteLogisticoForaItajai.acrescimoDiasMaximo} dia a mais.
              </dd>
            </div>
          </dl>
        </OpsCard>

        <OpsCard className="min-w-0">
          <SectionTitle
            titulo="Alçada"
            apoio="O que ele decide sozinho e o que sobe para um humano"
          />
          <ul className="grid gap-2 text-[13px]">
            {[
              ["Cotar o que está na matriz", true],
              ["Informar prazo e cidades atendidas", true],
              [`Prorrogar até ${R.prorrogacaoSemAprovacaoDias} dias`, true],
              ["Desconto de qualquer valor", false],
              ["Multa, cancelamento, faturamento", false],
              ["Confirmar agendamento ou disponibilidade", false],
              ["Ouvir áudio ou conferir comprovante", false],
            ].map(([rotulo, pode]) => (
              <li key={String(rotulo)} className="flex items-center gap-2.5">
                <EstadoBadge tom={pode ? "ok" : "atencao"} className="shrink-0 text-[11px]">
                  {pode ? "sozinho" : "humano"}
                </EstadoBadge>
                <span className="text-[var(--ops-ink-soft)]">{rotulo}</span>
              </li>
            ))}
          </ul>
        </OpsCard>
      </div>

      <OpsCard as="div" className="flex h-fit min-w-0 flex-col p-0">
        <div className="border-b border-[var(--ops-line)] p-5 pb-4">
          <SectionTitle
            titulo="Converse com o agente"
            apoio="É o mesmo núcleo que responderia no WhatsApp, com a mesma guarda de preço"
          />
          <div className="flex flex-wrap gap-1.5">
            {SUGESTOES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => void enviar(s)}
                disabled={pensando}
                className="ops-motion rounded-full border border-[var(--ops-line)] px-2.5 py-1 text-[12px] text-[var(--ops-ink-muted)] transition-colors hover:border-[var(--ops-accent)] hover:text-[var(--ops-accent-ink)] disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <ul className="grid max-h-[420px] min-h-[220px] content-start gap-2.5 overflow-y-auto p-5">
          {falas.length === 0 ? (
            <li className="m-auto max-w-xs text-center text-[13px] leading-relaxed text-[var(--ops-ink-muted)]">
              <Bot aria-hidden className="mx-auto mb-2 h-6 w-6 opacity-40" />
              Escreva como se fosse um cliente, ou toque numa sugestão acima.
            </li>
          ) : null}
          {falas.map((f, i) => (
            <li
              key={i}
              className={cn("flex", f.de === "cliente" ? "justify-end" : "justify-start")}
            >
              <div className="max-w-[88%]">
                <div
                  className={cn(
                    "rounded-[14px] px-3.5 py-2.5 text-[13.5px] leading-relaxed",
                    f.de === "cliente"
                      ? "rounded-br-[4px] bg-[var(--ops-accent)] text-[oklch(0.99_0_0)]"
                      : "rounded-bl-[4px] bg-[var(--ops-surface)] text-[var(--ops-ink)]",
                  )}
                >
                  {f.texto}
                </div>
                {f.escalou ? (
                  <p className="mt-1.5 flex items-center gap-1.5 text-[11.5px] text-[var(--ops-warn)]">
                    <ShieldCheck aria-hidden className="h-3 w-3" />
                    Escalado para humano
                    {f.motivo ? (
                      <span className="text-[var(--ops-ink-muted)]">· {f.motivo}</span>
                    ) : null}
                  </p>
                ) : null}
              </div>
            </li>
          ))}
          {pensando ? (
            <li className="text-[12.5px] italic text-[var(--ops-ink-muted)]">
              o agente está escrevendo…
            </li>
          ) : null}
          <div ref={fim} aria-hidden />
        </ul>

        <form
          className="flex items-end gap-2 border-t border-[var(--ops-line)] p-3"
          onSubmit={(e) => {
            e.preventDefault();
            void enviar(rascunho);
          }}
        >
          <label htmlFor="msg" className="sr-only">
            Mensagem para o agente
          </label>
          <input
            id="msg"
            value={rascunho}
            onChange={(e) => setRascunho(e.target.value)}
            maxLength={500}
            placeholder="Escreva como um cliente…"
            className="h-11 w-full rounded-[10px] border border-[var(--ops-line-strong)] bg-[var(--ops-card)] px-3 text-[13.5px] text-[var(--ops-ink)] placeholder:text-[var(--ops-ink-muted)]"
          />
          <Button
            type="submit"
            size="sm"
            disabled={pensando || !rascunho.trim()}
            className="h-11 shrink-0 px-3"
          >
            <Send aria-hidden className="h-4 w-4" />
            <span className="sr-only">Enviar</span>
          </Button>
        </form>
      </OpsCard>
    </div>
  );
}
