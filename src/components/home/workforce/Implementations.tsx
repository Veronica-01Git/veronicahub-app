import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { IMPLEMENTACOES, TIPO_DE_IMPLEMENTACAO, agenteWorkforce } from "@/lib/ai-workforce";
import { sealRecords } from "@/lib/seals";

/**
 * 07 — REAL IMPLEMENTATIONS.
 *
 * Só prova real. Cada linha carrega o tipo (produção, implantação,
 * laboratório…) e o número do selo de procedência, que abre a página pública
 * do selo em /selo/$serial — quem lê confere sozinho. A operação da própria
 * casa (Wire TV) não tem selo de cliente e diz isso, em vez de pegar
 * emprestado o selo de outra entrega.
 */
export function Implementations() {
  return (
    <section
      id="implementacoes"
      className="border-t border-[color:var(--wf-line)] py-[clamp(5rem,11vw,10rem)]"
      aria-labelledby="wf-impl-title"
    >
      <div className="wf-wrap">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-end">
          <div className="wf-reveal">
            <p className="wf-index">07 — Real implementations</p>
            <h2 id="wf-impl-title" className="wf-h2 mt-5">
              Não é promessa.
              <span className="block text-[color:var(--wf-faint)]">É registro.</span>
            </h2>
          </div>
          <p className="wf-lede wf-reveal max-w-[32rem] lg:justify-self-end">
            Toda entrega da Veronica leva um selo de procedência com número de série, estado e linha
            do tempo. O tipo de cada uma está escrito — produção não se confunde com laboratório.
          </p>
        </div>

        <div className="mt-14 border-t border-[color:var(--wf-line-2)]">
          {IMPLEMENTACOES.map((impl) => {
            const selo = impl.selo ? sealRecords.find((s) => s.serial === impl.selo) : null;
            return (
              <article key={impl.id} className="wf-impl wf-reveal" aria-labelledby={`i-${impl.id}`}>
                <span className="wf-impl-type" data-tipo={impl.tipo}>
                  {TIPO_DE_IMPLEMENTACAO[impl.tipo]}
                </span>
                <div>
                  <h3
                    id={`i-${impl.id}`}
                    className="font-display text-[clamp(1.5rem,2.4vw,2.1rem)] leading-tight tracking-[-0.03em]"
                  >
                    {impl.cliente}
                  </h3>
                  <p className="mt-1 text-sm text-[color:var(--wf-faint)]">{impl.setor}</p>
                </div>
                <div>
                  <p className="text-sm leading-relaxed text-[color:var(--wf-dim)]">
                    {impl.oQueFoiEntregue}
                  </p>
                  <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[color:var(--wf-faint)]">
                    {selo ? (
                      <Link
                        to="/selo/$serial"
                        params={{ serial: selo.serial }}
                        className="wf-link font-mono-tech"
                      >
                        Selo {selo.serial} · {selo.statusLabel}
                      </Link>
                    ) : (
                      <span className="font-mono-tech">
                        Operação própria da casa · sem selo de cliente
                      </span>
                    )}
                    {impl.agentes.length > 0 && (
                      <span>
                        Agente: {impl.agentes.map((id) => agenteWorkforce(id).nome).join(", ")}
                      </span>
                    )}
                  </p>
                </div>
                <Link
                  to={impl.to}
                  className="inline-flex size-11 items-center justify-center justify-self-end rounded-full border border-[color:var(--wf-line-2)] transition hover:border-[color:var(--wf-signal)] wf-focus"
                  aria-label={`Abrir ${impl.cliente}`}
                >
                  <ArrowUpRight size={17} aria-hidden="true" />
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
