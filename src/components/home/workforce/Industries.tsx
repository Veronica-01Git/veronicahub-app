import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { VERTICAIS } from "@/lib/ai-workforce";
import { product } from "@/lib/ecosystem";

/**
 * 06 — INDUSTRIES.
 *
 * Trilho horizontal com scroll-snap: no celular vira um carrossel nativo de
 * polegar, sem biblioteca. Nenhum logo e nenhum nome de empresa — os setores
 * são perfis-alvo, não clientes, parceiros ou prospects. As soluções listadas
 * são possíveis; quando a vertical já tem endereço no Hub (Náutica), o link
 * leva para ele com o estado que o catálogo declara.
 */
export function Industries() {
  return (
    <section
      id="industrias"
      className="border-t border-[color:var(--wf-line)] py-[clamp(5rem,11vw,10rem)]"
      aria-labelledby="wf-ind-title"
    >
      <div className="wf-wrap">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-end">
          <div className="wf-reveal">
            <p className="wf-index">06 — Industries</p>
            <h2 id="wf-ind-title" className="wf-h2 mt-5">
              Uma fábrica não precisa de uma IA.
              <span className="block text-[color:var(--wf-faint)]">
                Precisa de inteligências especializadas.
              </span>
            </h2>
          </div>
          <p className="wf-lede wf-reveal max-w-[32rem] lg:justify-self-end">
            Production. Maintenance. Quality. Procurement. Logistics. Cada setor tem funções que
            pedem um agente próprio — com a regra daquele setor, não uma regra genérica.
          </p>
        </div>
      </div>

      <ul className="wf-ind-track mt-14" aria-label="Setores-alvo">
        {VERTICAIS.map((v, i) => {
          const rota = v.produtoId ? product(v.produtoId) : null;
          return (
            <li key={v.id} className="wf-ind">
              <div>
                <div className="flex items-center justify-between">
                  <span className="wf-index">{String(i + 1).padStart(2, "0")}</span>
                  <span className="wf-label">Perfil-alvo</span>
                </div>
                <h3 className="mt-10 font-display text-[clamp(2rem,3vw,2.6rem)] leading-none tracking-[-0.035em]">
                  {v.nome}
                </h3>
                <p className="mt-5 text-[0.95rem] leading-relaxed text-[color:var(--wf-dim)]">
                  {v.tese}
                </p>
              </div>
              <div className="mt-10">
                <p className="wf-label">Soluções possíveis</p>
                <p className="mt-3 flex flex-wrap gap-1.5">
                  {v.solucoes.map((s) => (
                    <span key={s} className="wf-chip">
                      {s}
                    </span>
                  ))}
                </p>
                {rota && (
                  <Link to={rota.to} className="wf-link mt-6 text-sm">
                    {rota.name} · {rota.status.toLowerCase()}
                    <ArrowUpRight size={13} aria-hidden="true" />
                  </Link>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="wf-wrap">
        <p className="mt-6 text-xs text-[color:var(--wf-faint)]">
          Setores apresentados como perfil de aplicação. Nenhuma empresa citada ou sugerida aqui é
          cliente, parceira ou prospect confirmada.
        </p>
      </div>
    </section>
  );
}
