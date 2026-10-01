import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Lock } from "lucide-react";
import { useRef, useState, type KeyboardEvent } from "react";
import {
  WORKFORCE,
  estadoDoAgente,
  rotaDoAgente,
  type AgenteWorkforceId,
} from "@/lib/ai-workforce";
import { haQuantoTempo, type SinalDoWire } from "./useWireSignal";

/**
 * 02 — LIVE NETWORK.
 *
 * A Veronica no centro, os agentes em volta, cada um ligado a ela. O desenho
 * é SVG puro (anéis e arestas) e os nós são <button> de verdade posicionados
 * por cima — foco, teclado e leitor de tela funcionam sem um segundo modelo
 * de acessibilidade escondido atrás do gráfico.
 *
 * "Ao vivo" aqui é literal e restrito: a aresta do agente selecionado ganha
 * fluxo animado (decoração, sem número), e só o Agente de Redação mostra
 * atividade real — a última matéria do feed público. Os outros mostram o
 * estado declarado e escrevem que ainda não há sinal público para eles.
 */

const RAIO = 41; // % do palco, centro em 50/50

function posicao(i: number, total: number) {
  // Começa no topo e anda no sentido horário.
  const ang = (-90 + (360 / total) * i) * (Math.PI / 180);
  return { x: 50 + RAIO * Math.cos(ang), y: 50 + RAIO * Math.sin(ang) };
}

export function LiveNetwork({ sinal }: { sinal: SinalDoWire | null }) {
  const [ativo, setAtivo] = useState<AgenteWorkforceId>("redacao");
  const botoes = useRef<(HTMLButtonElement | null)[]>([]);
  const agente = WORKFORCE.find((a) => a.id === ativo) ?? WORKFORCE[0];
  const estado = estadoDoAgente(agente);
  const rota = rotaDoAgente(agente);

  function navegar(event: KeyboardEvent<HTMLButtonElement>, i: number) {
    const total = WORKFORCE.length;
    const prox =
      event.key === "ArrowRight" || event.key === "ArrowDown"
        ? (i + 1) % total
        : event.key === "ArrowLeft" || event.key === "ArrowUp"
          ? (i - 1 + total) % total
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? total - 1
              : -1;
    if (prox < 0) return;
    event.preventDefault();
    setAtivo(WORKFORCE[prox].id);
    botoes.current[prox]?.focus();
  }

  return (
    <section id="rede" className="py-[clamp(5rem,11vw,10rem)]" aria-labelledby="wf-rede-title">
      <div className="wf-wrap">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end">
          <div className="wf-reveal">
            <p className="wf-index">02 — Live network</p>
            <h2 id="wf-rede-title" className="wf-h2 mt-5">
              Uma inteligência.
              <span className="block text-[color:var(--wf-faint)]">Múltiplos agentes.</span>
            </h2>
          </div>
          <p className="wf-lede wf-reveal max-w-[32rem] lg:justify-self-end">
            A Veronica é a camada que orquestra: guarda a regra, decide quando o agente responde e
            quando chama uma pessoa. Cada agente tem uma função, uma rota e um estado declarado.
            Selecione um.
          </p>
        </div>

        <div className="wf-net mt-14 sm:mt-20">
          <div className="wf-net-stage">
            <svg viewBox="0 0 100 100" aria-hidden="true" preserveAspectRatio="none">
              <circle className="wf-net-ring" cx="50" cy="50" r={RAIO} />
              <circle className="wf-net-ring" cx="50" cy="50" r={RAIO * 0.62} />
              {WORKFORCE.map((a, i) => {
                const p = posicao(i, WORKFORCE.length);
                const sel = a.id === ativo;
                return (
                  <g key={a.id}>
                    <line
                      className="wf-net-edge"
                      data-active={sel}
                      x1="50"
                      y1="50"
                      x2={p.x}
                      y2={p.y}
                    />
                    {sel && <line className="wf-net-flow" x1={p.x} y1={p.y} x2="50" y2="50" />}
                  </g>
                );
              })}
            </svg>

            <div className="wf-net-core">
              <div>
                <span className="wf-label wf-label-signal block">Core</span>
                <span className="mt-1 block font-display text-[clamp(1rem,2.2vw,1.6rem)] tracking-[-0.03em]">
                  Veronica
                </span>
              </div>
            </div>

            <div role="group" aria-label="Agentes da rede Veronica">
              {WORKFORCE.map((a, i) => {
                const p = posicao(i, WORKFORCE.length);
                return (
                  <button
                    key={a.id}
                    type="button"
                    ref={(n) => {
                      botoes.current[i] = n;
                    }}
                    className="wf-net-node wf-focus"
                    style={{ left: `${p.x}%`, top: `${p.y}%` }}
                    aria-pressed={a.id === ativo}
                    aria-controls="wf-rede-detalhe"
                    tabIndex={a.id === ativo ? 0 : -1}
                    onClick={() => setAtivo(a.id)}
                    onKeyDown={(e) => navegar(e, i)}
                  >
                    <span className="wf-led" data-estado={a.estado} aria-hidden="true" />
                    {a.curto}
                    <span className="sr-only">· {estadoDoAgente(a).rotulo}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div id="wf-rede-detalhe" className="wf-net-detail" aria-live="polite">
            <div key={agente.id} className="wf-fade-swap">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="wf-label">{agente.etiqueta}</span>
                <span className="wf-chip">
                  <span className="wf-led" data-estado={agente.estado} aria-hidden="true" />
                  {estado.rotulo}
                </span>
              </div>
              <h3 className="mt-5 font-display text-[clamp(1.9rem,3vw,2.8rem)] leading-none tracking-[-0.035em]">
                {agente.nome}
              </h3>
              <p className="mt-4 text-[color:var(--wf-dim)]">{agente.funcao}</p>

              <dl className="wf-dl mt-8">
                <dt>Problema</dt>
                <dd className="text-[color:var(--wf-text)]">{agente.problema}</dd>
                <dt>Rota</dt>
                <dd>
                  <Link to={rota.to} className="wf-link">
                    {rota.name} <span className="wf-index">{rota.to}</span>
                    <ArrowUpRight size={13} aria-hidden="true" />
                  </Link>
                </dd>
                <dt>Estado</dt>
                <dd>{estado.significa}</dd>
                <dt>Capacidades</dt>
                <dd className="flex flex-wrap">
                  {agente.capacidades.map((c) => (
                    <span key={c} className="wf-cap">
                      {c}
                    </span>
                  ))}
                </dd>
                <dt>Painel</dt>
                <dd>
                  {agente.painel ? (
                    <span className="inline-flex items-center gap-2">
                      <Lock size={12} aria-hidden="true" className="opacity-60" />
                      {agente.painel.rotulo} · acesso{" "}
                      {agente.painel.acesso === "cliente" ? "do cliente" : "interno"}
                    </span>
                  ) : (
                    "Ainda não existe painel administrativo próprio."
                  )}
                </dd>
                <dt>Atividade</dt>
                <dd>
                  {agente.id === "redacao" && sinal?.ultimaMateria ? (
                    <span>
                      <span className="mr-2 inline-flex items-center gap-1.5 text-[color:var(--wf-signal)]">
                        <span className="wf-led wf-led-live" aria-hidden="true" />
                        matéria publicada {haQuantoTempo(sinal.ultimaMateria.em)}
                      </span>
                      <Link
                        to="/blog/$slug"
                        params={{ slug: sinal.ultimaMateria.slug }}
                        className="wf-link"
                      >
                        {sinal.ultimaMateria.titulo}
                      </Link>
                    </span>
                  ) : agente.id === "redacao" ? (
                    "Lida do feed público do Wire TV quando ele responde."
                  ) : (
                    "Sem sinal público de atividade para este agente — o estado acima é o declarado."
                  )}
                </dd>
              </dl>

              <p className="mt-6 text-sm leading-relaxed text-[color:var(--wf-faint)]">
                <span className="wf-label mr-2">Prova</span>
                {agente.prova}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
