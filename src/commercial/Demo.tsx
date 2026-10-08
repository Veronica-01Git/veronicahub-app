import { useState } from "react";
import { DEMO_SCENARIOS } from "./qualification";

export function CommercialDemo() {
  const [scenario, setScenario] = useState(0);
  const [stage, setStage] = useState(0);
  const d = DEMO_SCENARIOS[scenario];
  return (
    <section
      id="demonstracao"
      className="mt-12 overflow-hidden rounded-3xl border border-black/10 bg-[#18201d] text-white"
      aria-label="Demonstração do atendimento"
    >
      <div className="grid gap-8 p-6 sm:p-10 lg:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-[.2em] text-emerald-300">Experimente o fluxo</p>
          <h2 className="mt-4 font-display text-3xl sm:text-4xl">
            Atender. Entender.
            <br />
            Encaminhar com contexto.
          </h2>
          <p className="mt-5 text-sm leading-relaxed text-white/70">
            Demonstração com roteiro e negócio de exemplo. As respostas abaixo ilustram regras de
            atendimento; não são uma conversa ao vivo com IA e não são salvas.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {DEMO_SCENARIOS.map((s, i) => (
              <button
                type="button"
                key={s.id}
                aria-pressed={scenario === i}
                onClick={() => {
                  setScenario(i);
                  setStage(0);
                }}
                className={`rounded-full border px-4 py-2 text-sm ${scenario === i ? "border-emerald-300 bg-emerald-300 text-[#18201d]" : "border-white/25 hover:bg-white/10"}`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <p className="mt-6 text-sm text-white/70">
            Na sua operação: base aprovada, canais autorizados e piloto medido antes de expandir.
          </p>
          <a
            href="#diagnostico"
            className="mt-6 inline-block rounded-full bg-white px-6 py-3 text-sm text-[#18201d]"
          >
            Projetar para o meu negócio
          </a>
        </div>
        <div className="rounded-2xl border border-white/15 bg-white/5 p-5 sm:p-6">
          <p className="text-xs text-white/60">
            Cenário {scenario + 1} · Atendimento supervisionado
          </p>
          <div className="mt-5 grid gap-4" aria-live="polite" aria-atomic="true">
            <div className="ml-6 rounded-2xl bg-white/10 p-4">
              <p className="mb-2 text-xs text-white/50">Cliente de exemplo</p>
              <p>{d.customer}</p>
            </div>
            {stage >= 1 && (
              <div className="mr-6 rounded-2xl bg-emerald-300/10 p-4">
                <p className="mb-2 text-xs text-emerald-300">Verônica · resposta do roteiro</p>
                <p>{d.response}</p>
              </div>
            )}
            {stage >= 2 && (
              <div className="rounded-2xl border border-emerald-300/30 p-4">
                <p className="text-xs text-emerald-300">Encaminhamento para a equipe</p>
                <p className="mt-2 text-sm text-white/70">{d.context}</p>
                <p className="mt-3 text-sm">{d.handoff}</p>
              </div>
            )}
          </div>
          <button
            type="button"
            className="mt-5 rounded-full border border-white/30 px-5 py-2 text-sm hover:bg-white/10"
            onClick={() => setStage(stage < 2 ? stage + 1 : 0)}
          >
            {stage === 0
              ? "Ver resposta"
              : stage === 1
                ? "Ver encaminhamento"
                : "Recomeçar cenário"}
          </button>
        </div>
      </div>
    </section>
  );
}
