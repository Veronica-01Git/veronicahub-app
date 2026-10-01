import { ArrowRight } from "lucide-react";
import { useRef, useState, type KeyboardEvent } from "react";
import { DEPARTAMENTOS, ESTADOS, agenteWorkforce } from "@/lib/ai-workforce";

/**
 * 05 — ENTERPRISE.
 *
 * Não é uma grade de "features". É um seletor de departamento: a pessoa
 * escolhe a área dela e vê quais agentes caberiam ali.
 *
 * TUDO AQUI É SOLUÇÃO POSSÍVEL, e a tela diz isso três vezes — no título da
 * seção, no selo do painel e no rodapé. Quando já existe um agente real que
 * encosta naquele departamento, ele aparece separado, com o estado real
 * dele, para a pessoa ver a diferença entre o que existe e o que se desenha.
 */
export function EnterpriseWorkforce() {
  const [ativo, setAtivo] = useState(DEPARTAMENTOS[0].id);
  const abas = useRef<(HTMLButtonElement | null)[]>([]);
  const dep = DEPARTAMENTOS.find((d) => d.id === ativo) ?? DEPARTAMENTOS[0];
  const real = dep.jaExiste ? agenteWorkforce(dep.jaExiste) : null;

  function navegar(event: KeyboardEvent<HTMLButtonElement>, i: number) {
    const total = DEPARTAMENTOS.length;
    const prox =
      event.key === "ArrowDown" || event.key === "ArrowRight"
        ? (i + 1) % total
        : event.key === "ArrowUp" || event.key === "ArrowLeft"
          ? (i - 1 + total) % total
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? total - 1
              : -1;
    if (prox < 0) return;
    event.preventDefault();
    setAtivo(DEPARTAMENTOS[prox].id);
    abas.current[prox]?.focus();
  }

  return (
    <section
      id="enterprise"
      className="border-t border-[color:var(--wf-line)] py-[clamp(5rem,11vw,10rem)]"
      aria-labelledby="wf-ent-title"
    >
      <div className="wf-wrap">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-end">
          <div className="wf-reveal">
            <p className="wf-index">05 — Enterprise</p>
            <h2 id="wf-ent-title" className="wf-h2 mt-5">
              Uma workforce
              <span className="block text-[color:var(--wf-faint)]">para cada operação.</span>
            </h2>
          </div>
          <p className="wf-lede wf-reveal max-w-[32rem] lg:justify-self-end">
            Escolha um departamento. Os agentes abaixo são soluções possíveis, desenhadas a partir
            do que a Veronica já opera — não produtos prontos na prateleira.
          </p>
        </div>

        <div className="wf-ent mt-14">
          <div className="wf-ent-tabs" role="tablist" aria-label="Departamentos">
            {DEPARTAMENTOS.map((d, i) => (
              <button
                key={d.id}
                id={`tab-${d.id}`}
                type="button"
                role="tab"
                ref={(n) => {
                  abas.current[i] = n;
                }}
                aria-selected={d.id === ativo}
                aria-controls="wf-ent-painel"
                tabIndex={d.id === ativo ? 0 : -1}
                className="wf-ent-tab wf-focus"
                onClick={() => setAtivo(d.id)}
                onKeyDown={(e) => navegar(e, i)}
              >
                {d.nome}
                <ArrowRight size={16} aria-hidden="true" className="opacity-40" />
              </button>
            ))}
          </div>

          <div
            id="wf-ent-painel"
            role="tabpanel"
            aria-labelledby={`tab-${dep.id}`}
            className="wf-ent-panel"
          >
            <div key={dep.id} className="wf-fade-swap">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="wf-label">{dep.nome}</span>
                <span className="wf-chip">
                  <span className="wf-led" data-estado="conceito" aria-hidden="true" />
                  {ESTADOS.conceito.rotulo}
                </span>
              </div>
              <p className="wf-quote mt-6">“{dep.dor}”</p>

              <ul className="mt-8">
                {dep.agentes.map((a) => (
                  <li key={a.nome} className="wf-ent-agent">
                    <span className="font-mono-tech text-xs uppercase tracking-[0.14em] text-[color:var(--wf-text)]">
                      {a.nome}
                    </span>
                    <span className="text-sm leading-relaxed text-[color:var(--wf-dim)]">
                      {a.faz}
                    </span>
                  </li>
                ))}
              </ul>

              {real && (
                <a
                  href={`#agente-${real.id}`}
                  className="mt-6 flex items-start gap-3 rounded-xl border border-[color:var(--wf-line-2)] p-4 text-sm leading-relaxed wf-focus hover:border-[color:var(--wf-signal)]"
                >
                  <span className="wf-led mt-1.5" data-estado={real.estado} aria-hidden="true" />
                  <span>
                    <span className="text-[color:var(--wf-text)]">Já existe hoje: {real.nome}</span>
                    <span className="block text-[color:var(--wf-faint)]">
                      {ESTADOS[real.estado].rotulo} — é a base de onde esta solução partiria.
                    </span>
                  </span>
                </a>
              )}

              <p className="mt-6 text-xs leading-relaxed text-[color:var(--wf-faint)]">
                {ESTADOS.conceito.significa}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
