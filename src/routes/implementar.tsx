import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader, SiteFooter, AuthWidget } from "@/components/SiteChrome";
import { SERVICES, STATE_LABEL, type Brief, type BriefState, qualify } from "@/commercial/core";
import { CommercialDemo } from "@/commercial/Demo";
import { qualification, readAnalysis } from "@/commercial/qualification";
import { submitCommercialBrief, myCommercialBriefs } from "@/commercial/server";
export const Route = createFileRoute("/implementar")({
  component: CommercialPage,
  head: () => ({
    meta: [
      { title: "Projete sua operação | Veronica Hub" },
      {
        name: "description",
        content:
          "Diagnóstico guiado para implantar agentes de IA no seu negócio. Escopo, integrações e proposta sob revisão.",
      },
    ],
  }),
});
function CommercialPage() {
  const [step, setStep] = useState(0),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [saved, setSaved] = useState(false);
  const [brief, setBrief] = useState<Brief>({
    requestId: "",
    company: "",
    service: "commercial",
    challenge: "",
    volume: "",
    systems: "",
    goal: "",
    consent: false,
  });
  const [mine, setMine] = useState<Awaited<ReturnType<typeof myCommercialBriefs>> | null>(null);
  const service = SERVICES.find((s) => s.id === brief.service)!;
  const coverage = qualification(brief);
  const refresh = () =>
    myCommercialBriefs()
      .then(setMine)
      .catch(() =>
        setMessage("Não foi possível atualizar o acompanhamento. Seu formulário continua aqui."),
      );
  useEffect(() => {
    setBrief((b) => ({ ...b, requestId: crypto.randomUUID() }));
    void refresh();
  }, []);
  async function submit() {
    setBusy(true);
    setMessage("");
    try {
      const result = await submitCommercialBrief({ data: brief });
      if (result.ok) {
        setSaved(true);
        setMessage("Diagnóstico salvo. A equipe revisará escopo e valores; acompanhe abaixo.");
        await refresh();
      } else setMessage(result.error);
    } catch {
      setMessage("Não foi possível concluir. Seus campos foram preservados; tente novamente.");
    } finally {
      setBusy(false);
    }
  }
  const field = (
    key: "company" | "challenge" | "volume" | "systems" | "goal",
    label: string,
    max: number,
    multiline = false,
  ) => (
    <label className="grid gap-2 text-sm" key={key}>
      {label}
      {multiline ? (
        <textarea
          className="min-h-28 rounded-xl border border-black/15 bg-white p-4 text-[#18201d] focus:outline-2 focus:outline-emerald-700"
          value={brief[key]}
          maxLength={max}
          disabled={busy || saved}
          onChange={(e) => setBrief({ ...brief, [key]: e.target.value })}
        />
      ) : (
        <input
          className="rounded-xl border border-black/15 bg-white p-4 text-[#18201d] focus:outline-2 focus:outline-emerald-700"
          value={brief[key]}
          maxLength={max}
          disabled={busy || saved}
          onChange={(e) => setBrief({ ...brief, [key]: e.target.value })}
        />
      )}
    </label>
  );
  return (
    <>
      <SiteHeader />
      <main className="bg-[#f5f5f1] text-[#18201d]">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <p className="text-xs uppercase tracking-[.22em] text-emerald-800">
            Veronica · Operações para empresas
          </p>
          <h1 className="mt-5 max-w-3xl font-display text-5xl sm:text-7xl">
            Seu próximo processo.
            <br />
            Uma operação melhor.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-black/60">
            Conte o que precisa funcionar. Organizamos o diagnóstico, as integrações e os próximos
            passos para uma proposta feita para o seu negócio.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#demonstracao" className="rounded-full bg-[#18201d] px-6 py-3 text-white">
              Experimentar atendimento
            </a>
            <a href="#diagnostico" className="rounded-full border border-black/20 px-6 py-3">
              Criar meu diagnóstico
            </a>
          </div>
          <CommercialDemo />
          <section
            className="mt-12 grid gap-6 rounded-3xl border border-black/10 p-6 sm:p-10 md:grid-cols-3"
            aria-label="Como contratar"
          >
            {[
              [
                "01 · Implantação",
                "Escopo, base de conhecimento e integrações definidos conforme a complexidade do seu negócio.",
              ],
              [
                "02 · Operação mensal",
                "Manutenção, acompanhamento e suporte com responsabilidades e limites acordados.",
              ],
              [
                "03 · Consumo de IA",
                "Franquia e excedentes descritos na proposta. O diagnóstico não inicia cobrança.",
              ],
            ].map(([title, description]) => (
              <div key={title}>
                <h2 className="font-display text-xl">{title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-black/60">{description}</p>
              </div>
            ))}
          </section>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {SERVICES.map((s) => (
              <button
                type="button"
                key={s.id}
                aria-pressed={brief.service === s.id}
                disabled={busy || saved}
                onClick={() => setBrief({ ...brief, service: s.id })}
                className={`rounded-2xl border p-6 text-left transition ${brief.service === s.id ? "border-emerald-800 bg-white shadow-sm" : "border-black/10 hover:bg-white"}`}
              >
                <h2 className="font-display text-xl">{s.name}</h2>
                <p className="mt-3 text-sm text-black/60">{s.deliverables.join(" · ")}</p>
                <p className="mt-4 text-xs text-emerald-800">{s.stage}</p>
              </button>
            ))}
          </div>
          <section
            id="diagnostico"
            className="mt-12 scroll-mt-24 grid gap-10 rounded-3xl bg-white p-6 sm:p-10 lg:grid-cols-[1fr_1.2fr]"
            aria-label="Diagnóstico comercial"
          >
            <div>
              <p className="text-xs uppercase tracking-widest text-emerald-800">
                Veronica Comercial
              </p>
              <h2 className="mt-4 font-display text-3xl">Vamos entender seu negócio.</h2>
              <p className="mt-4 text-black/60">
                Etapa {step + 1} de 3 · {service.name}
              </p>
              <p className="mt-5 text-sm">
                {coverage.supplied} de {coverage.total} informações preenchidas
              </p>
              <div className="mt-3 grid grid-cols-4 gap-2" aria-hidden="true">
                {coverage.checks.map((c) => (
                  <span
                    key={c.label}
                    className={`h-1 rounded-full ${c.supplied ? "bg-emerald-700" : "bg-black/10"}`}
                  />
                ))}
              </div>
              <ul className="mt-4 space-y-2 text-xs text-black/60">
                {coverage.checks.map((c) => (
                  <li key={c.label}>
                    {c.supplied ? "✓" : "○"} {c.label}
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-sm text-black/60">{coverage.next}</p>
              <ul className="mt-8 space-y-3 text-sm">
                {service.needs.map((n) => (
                  <li key={n}>— {n}</li>
                ))}
              </ul>
              <p className="mt-8 text-sm text-black/60">
                O diagnóstico não contrata nem cobra. Escopo, investimento e entrega dependem de
                revisão da equipe. Uma solicitação por conta a cada dia, no horário de Brasília.
              </p>
            </div>
            <div className="grid gap-5">
              {step === 0 ? (
                <>
                  {field("company", "Empresa ou projeto (opcional)", 120)}
                  {field("challenge", "Qual processo está tomando seu tempo?", 2000, true)}
                </>
              ) : step === 1 ? (
                <>
                  {field("volume", "Qual o volume aproximado de pedidos ou tarefas?", 160)}
                  {field("systems", "Quais sistemas e canais você usa?", 300)}
                  {field("goal", "O que seria uma entrega útil para você?", 500, true)}
                </>
              ) : (
                <>
                  <h3 className="font-display text-2xl">Confira antes de enviar</h3>
                  <p className="whitespace-pre-wrap text-sm">{brief.challenge}</p>
                  <p className="text-sm">Objetivo: {brief.goal}</p>
                  <p className="text-sm">
                    Volume: {brief.volume || "A confirmar"} · Sistemas:{" "}
                    {brief.systems || "A confirmar"}
                  </p>
                  {mine && !mine.ok && (
                    <div className="rounded-xl border border-black/10 p-4">
                      <p className="mb-3 text-sm">
                        Entre para salvar na sua conta. Seu formulário permanece nesta página
                        enquanto você entra.
                      </p>
                      <AuthWidget />
                    </div>
                  )}
                  <p className="text-sm text-black/60">{qualify(brief).questions.join(" ")}</p>
                  <label className="flex items-start gap-3 text-sm">
                    <input
                      type="checkbox"
                      checked={brief.consent}
                      disabled={busy || saved}
                      onChange={(e) => setBrief({ ...brief, consent: e.target.checked })}
                    />
                    Autorizo salvar este diagnóstico na minha conta e usar IA para organizar o
                    desafio descrito. Evitarei incluir informações confidenciais de terceiros.
                  </label>
                </>
              )}
              <div className="flex gap-3">
                {step > 0 && (
                  <button
                    type="button"
                    onClick={() => setStep(step - 1)}
                    disabled={busy}
                    className="rounded-full border border-black/20 px-6 py-3"
                  >
                    Voltar
                  </button>
                )}
                {step < 2 ? (
                  <button
                    type="button"
                    disabled={step === 0 ? !brief.challenge.trim() : !brief.goal.trim()}
                    onClick={() => setStep(step + 1)}
                    className="rounded-full bg-[#18201d] px-6 py-3 text-white disabled:opacity-40"
                  >
                    Continuar
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={busy || saved || !brief.consent || !brief.requestId}
                    onClick={submit}
                    className="rounded-full bg-emerald-900 px-6 py-3 text-white disabled:opacity-40"
                  >
                    {saved ? "Diagnóstico salvo" : busy ? "Organizando…" : "Salvar diagnóstico"}
                  </button>
                )}
              </div>
              <p role="status" className="text-sm text-emerald-900">
                {message}
              </p>
            </div>
          </section>
          <section className="mt-16" aria-label="Meus diagnósticos">
            <h2 className="font-display text-3xl">Seu acompanhamento</h2>
            {!mine ? (
              <p className="mt-4">Carregando…</p>
            ) : !mine.ok ? (
              <p className="mt-4">{mine.error}</p>
            ) : !mine.briefs.length ? (
              <p className="mt-4 text-black/60">
                Seus diagnósticos aparecerão aqui depois de enviados.
              </p>
            ) : (
              <div className="mt-6 grid gap-4">
                {mine.briefs.map((b) => {
                  const a = readAnalysis(b.analysis);
                  return (
                    <article
                      className="rounded-2xl border border-black/10 bg-white p-6"
                      key={String(b.id)}
                    >
                      <p className="text-xs uppercase tracking-widest text-emerald-800">
                        {STATE_LABEL[b.state as BriefState]}
                      </p>
                      <h3 className="mt-3 text-xl">
                        {SERVICES.find((s) => s.id === b.service)?.name}
                      </h3>
                      <p className="mt-3 whitespace-pre-wrap">{a.summary}</p>
                      {a.questions.length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm font-medium">Pontos para a revisão</p>
                          <ul className="mt-2 space-y-2 text-sm text-black/60">
                            {a.questions.map((q, i) => (
                              <li key={i}>— {q}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <p className="mt-3 text-xs text-black/60">
                        Organização: {a.mode === "model" ? "IA" : "regras do serviço"} · revisão da
                        equipe necessária
                      </p>
                      {b.scope && (
                        <div className="mt-5 border-t pt-5">
                          <p className="whitespace-pre-wrap">{String(b.scope)}</p>
                          <p className="mt-3">
                            Implantação: {money(b.setupCents)} · Operação mensal:{" "}
                            {money(b.monthlyCents)}
                          </p>
                          <p className="mt-2 text-xs">
                            Proposta sujeita ao acordo de contratação. Nenhum pagamento foi
                            iniciado.
                          </p>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
            <Link to="/portfolio" className="mt-8 inline-block text-emerald-800 underline">
              Ainda precisa apresentar seu trabalho? Comece pelo portfólio.
            </Link>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
function money(n: unknown) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number(n ?? 0) / 100,
  );
}
