import { ArrowRight, ArrowUpRight } from "lucide-react";
import { CampusImage } from "@/components/learning/CampusVisuals";
import { WORKFORCE, WORKFORCE_OPERANDO } from "@/lib/ai-workforce";
import { haQuantoTempo, type SinalDoWire } from "./useWireSignal";

/**
 * 01 — HERO · VERONICA CORE.
 *
 * A Veronica de cabelo curto e o campus YO são a identidade visual canônica.
 * Fotografia responsiva com prioridade de carregamento na primeira tela.
 *
 * O "AGENT NETWORK" do trilho só afirma o que é contável no código: quantos
 * agentes estão declarados e quantos estão em estado de operação. O único
 * dado vivo é a última publicação do Wire, e ele só aparece se o feed
 * respondeu — sem feed, a célula diz o que é verdade sem ele.
 */
export function WorkforceHero({ sinal }: { sinal: SinalDoWire | null }) {
  return (
    <section className="wf-hero" aria-labelledby="wf-hero-title">
      <div className="wf-hero-portrait" aria-hidden="true">
        <CampusImage name="core" alt="" hero />
      </div>

      <div className="wf-hero-frame" aria-hidden="true">
        <span className="wf-label">Intelligence layer</span>
        <span className="wf-label">Orchestration · Rules · Handoff</span>
      </div>

      <div className="wf-wrap">
        <p className="wf-label flex items-center gap-2.5">
          <span className="wf-led" aria-hidden="true" />
          Veronica Hub · AI Workforce Platform
        </p>

        <h1 id="wf-hero-title" className="wf-display wf-hero-title mt-6">
          Veronica
        </h1>
        <p className="wf-hero-sub mt-2 max-w-[16ch] sm:mt-3">
          AI Workforce<span className="text-[color:var(--wf-signal)]">.</span>
        </p>

        <div className="mt-8 grid gap-8 sm:mt-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <p className="wf-lede max-w-[34rem]">
            Uma inteligência central. Agentes especializados para operar funções reais de empresas.
          </p>
          <div className="flex flex-wrap gap-3">
            <a href="#workforce" className="wf-btn wf-btn-primary">
              Explorar agentes <ArrowRight size={16} aria-hidden="true" />
            </a>
            <a href="#implementar" className="wf-btn wf-btn-ghost">
              Implementar na minha empresa <ArrowUpRight size={16} aria-hidden="true" />
            </a>
          </div>
        </div>

        <dl className="wf-hero-rail mt-12 sm:mt-16" aria-label="Estado da rede de agentes">
          <div>
            <dt className="wf-label">Agent network</dt>
            <dd className="mt-2 flex items-center gap-2 text-sm text-[color:var(--wf-text)]">
              <span className="wf-led wf-led-live" aria-hidden="true" />
              {WORKFORCE.length} agentes declarados
            </dd>
          </div>
          <div>
            <dt className="wf-label">Operando hoje</dt>
            <dd className="mt-2 text-sm text-[color:var(--wf-text)]">
              {WORKFORCE_OPERANDO.length} — no todo ou em parte
            </dd>
          </div>
          <div>
            <dt className="wf-label">Sinal vivo · Wire TV</dt>
            <dd className="mt-2 text-sm text-[color:var(--wf-text)]">
              {sinal ? (
                <>Feed atualizado {haQuantoTempo(sinal.atualizadoEm)}</>
              ) : (
                <>Redação publicando em /blog</>
              )}
            </dd>
          </div>
          <div>
            <dt className="wf-label">Laboratório</dt>
            <dd className="mt-2 text-sm text-[color:var(--wf-text)]">YO LAB &amp; CO.</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
