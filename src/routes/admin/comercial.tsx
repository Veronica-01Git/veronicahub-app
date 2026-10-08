import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { commercialAdmin, decideCommercialBrief, guardianAdmin } from "@/commercial/server";
import { qualification, readAnalysis } from "@/commercial/qualification";
import { STATE_LABEL, type BriefState } from "@/commercial/core";
export const Route = createFileRoute("/admin/comercial")({
  component: CommercialAdmin,
  head: () => ({
    meta: [
      { title: "Operação Comercial | Veronica Hub" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
});
function CommercialAdmin() {
  const [data, setData] = useState<Awaited<ReturnType<typeof commercialAdmin>> | null>(null),
    [health, setHealth] = useState<Awaited<ReturnType<typeof guardianAdmin>> | null>(null),
    [error, setError] = useState("");
  const [selected, setSelected] = useState(""),
    [scope, setScope] = useState(""),
    [note, setNote] = useState(""),
    [setup, setSetup] = useState("0"),
    [monthly, setMonthly] = useState("0"),
    [busy, setBusy] = useState(false);
  async function refresh() {
    try {
      const [d, h] = await Promise.all([commercialAdmin(), guardianAdmin()]);
      setData(d);
      setHealth(h);
    } catch {
      setError("Não foi possível carregar. Tente atualizar a página.");
    }
  }
  useEffect(() => {
    void refresh();
  }, []);
  const brief = data?.ok ? data.briefs.find((b) => String(b.id) === selected) : undefined;
  const analysis = brief ? readAnalysis(brief.analysis) : null;
  const coverage = brief ? qualification(brief) : null;
  async function decide(state: BriefState) {
    if (!brief) return;
    setBusy(true);
    setError("");
    try {
      const r = await decideCommercialBrief({
        data: {
          id: selected,
          expectedState: brief.state,
          state,
          setupCents: Math.round(Number(setup) * 100),
          monthlyCents: Math.round(Number(monthly) * 100),
          scope,
          note,
        },
      });
      if (!r.ok) setError(r.error);
      else {
        setNote("");
        await refresh();
      }
    } catch {
      setError("Confira escopo, valores e motivo. Nenhuma decisão foi confirmada.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 py-16">
        <p className="text-xs uppercase tracking-widest text-emerald-400">YO · Operação interna</p>
        <h1 className="mt-4 font-display text-4xl">Comercial & Guardian</h1>
        <p className="mt-4 text-muted-foreground">
          Diagnósticos reais, propostas supervisionadas e sinais de operação. Contratação confirmada
          é registro manual; não comprova pagamento.
        </p>
        <p role="status" className="mt-4 text-amber-400">
          {error}
        </p>
        {!data ? (
          <p className="mt-8">Carregando…</p>
        ) : !data.ok ? (
          <p className="mt-8">{data.error} Entre com sua conta administrativa.</p>
        ) : (
          <>
            <section
              className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
              aria-label="Métricas comerciais reais"
            >
              {[
                ["Diagnósticos recebidos", String(data.metrics.total)],
                ["Sem revisão há 48h", String(data.metrics.overdue)],
                ["Análises aceitas por IA", String(data.metrics.modeled)],
                ["Análises por regras", String(data.metrics.fallback)],
              ].map(([label, value]) => (
                <article className="rounded-xl border border-border p-5" key={label}>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="mt-3 font-display text-3xl">{value}</p>
                </article>
              ))}
            </section>
            <p className="mt-4 text-sm text-muted-foreground">
              Dados de toda a fila · {data.metrics.pending} análises pendentes · Tempo médio até a
              primeira revisão:{" "}
              {data.metrics.averageReviewHours === null
                ? "sem revisões registradas"
                : `${data.metrics.averageReviewHours.toFixed(1)}h (${data.metrics.reviewedCount} pedidos)`}
              . Contratações abaixo são registros manuais; receita depende de pagamento conciliado.
            </p>
            <section className="mt-8 grid gap-3 sm:grid-cols-4" aria-label="Guardian">
              {health?.ok ? (
                health.checks.map((c) => (
                  <article className="rounded-xl border border-border p-5" key={c.name}>
                    <h2>{c.name}</h2>
                    <p className="mt-2 text-sm text-emerald-400">{c.state}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{c.detail}</p>
                  </article>
                ))
              ) : (
                <p>
                  Guardian indisponível; nenhuma fonte foi considerada saudável por ausência de
                  evidência.
                </p>
              )}
            </section>
            <div className="mt-10 flex flex-wrap gap-3">
              {data.totals.map((t) => (
                <p className="rounded-full border px-4 py-2 text-sm" key={String(t.state)}>
                  {STATE_LABEL[t.state as BriefState]}: {Number(t.total)}
                </p>
              ))}
            </div>
            <div className="mt-10 grid gap-6 lg:grid-cols-2">
              <section aria-label="Fila de diagnósticos">
                {!data.briefs.length ? (
                  <p>Nenhum diagnóstico recebido.</p>
                ) : (
                  data.briefs.map((b) => (
                    <button
                      className={`mb-3 block w-full rounded-xl border p-5 text-left ${selected === b.id ? "border-emerald-400" : "border-border"}`}
                      key={String(b.id)}
                      onClick={() => {
                        setSelected(String(b.id));
                        setScope(String(b.scope));
                        setSetup(String(Number(b.setupCents) / 100));
                        setMonthly(String(Number(b.monthlyCents) / 100));
                        setNote("");
                      }}
                    >
                      <p>{String(b.company) || String(b.service)}</p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {String(b.email)} · {STATE_LABEL[b.state as BriefState]}
                      </p>
                    </button>
                  ))
                )}
              </section>
              {brief && (
                <section className="rounded-2xl border border-border p-6">
                  <h2 className="font-display text-2xl">Revisar diagnóstico</h2>
                  <p className="mt-4 whitespace-pre-wrap">{String(brief.challenge)}</p>
                  <p className="mt-3 text-sm">Objetivo: {String(brief.goal)}</p>
                  <p className="mt-3 text-sm">
                    Volume: {String(brief.volume) || "Não informado"} · Sistemas:{" "}
                    {String(brief.systems) || "Não informado"}
                  </p>
                  <p className="mt-3 text-sm">
                    Análise: {String(brief.modelState)} · {String(brief.provider ?? "regras")} ·{" "}
                    {String(brief.model ?? "sem modelo")}
                  </p>
                  <div className="mt-5 rounded-xl border border-border p-4">
                    <h3 className="text-sm font-medium">
                      Qualificação · {coverage?.supplied}/{coverage?.total} informações
                    </h3>
                    <p className="mt-3 text-sm">{analysis?.summary}</p>
                    <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                      {analysis?.questions.map((q, i) => (
                        <li key={i}>— {q}</li>
                      ))}
                    </ul>
                    <p className="mt-3 text-sm text-muted-foreground">{coverage?.next}</p>
                    {analysis?.runtime && (
                      <p className="mt-3 text-xs text-muted-foreground">
                        Versão {analysis.runtime.version} · {analysis.runtime.durationMs}ms ·
                        Estimativa reservada de IA:{" "}
                        {analysis.runtime.estimatedCostMicros == null
                          ? "sem chamada estimada"
                          : `US$ ${(analysis.runtime.estimatedCostMicros / 1000000).toFixed(6)}`}{" "}
                        ·{" "}
                        {analysis.runtime.failure
                          ? `Falha: ${analysis.runtime.failure}; briefing por regras preservado`
                          : "Resposta aceita"}
                        . Custo estimado, sem conciliação da fatura.
                      </p>
                    )}
                  </div>
                  <div className="mt-6 grid gap-4">
                    <label className="grid gap-2">
                      Escopo
                      <textarea
                        className="rounded-lg border border-border bg-background p-3"
                        value={scope}
                        maxLength={2500}
                        onChange={(e) => setScope(e.target.value)}
                      />
                    </label>
                    <label className="grid gap-2">
                      Implantação em R$
                      <input
                        className="rounded-lg border border-border bg-background p-3"
                        type="number"
                        min="0"
                        step="0.01"
                        value={setup}
                        onChange={(e) => setSetup(e.target.value)}
                      />
                    </label>
                    <label className="grid gap-2">
                      Operação mensal em R$
                      <input
                        className="rounded-lg border border-border bg-background p-3"
                        type="number"
                        min="0"
                        step="0.01"
                        value={monthly}
                        onChange={(e) => setMonthly(e.target.value)}
                      />
                    </label>
                    <label className="grid gap-2">
                      Motivo / referência do acordo
                      <textarea
                        className="rounded-lg border border-border bg-background p-3"
                        value={note}
                        maxLength={1000}
                        onChange={(e) => setNote(e.target.value)}
                      />
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {(brief.state === "received"
                        ? ["reviewed", "lost"]
                        : brief.state === "reviewed"
                          ? ["approved", "lost"]
                          : brief.state === "approved"
                            ? ["reviewed", "won", "lost"]
                            : []
                      ).map((s) => (
                        <button
                          disabled={busy || !note.trim()}
                          key={s}
                          onClick={() => decide(s as BriefState)}
                          className="rounded-full border border-emerald-500 px-4 py-2 disabled:opacity-40"
                        >
                          {STATE_LABEL[s as BriefState]}
                        </button>
                      ))}
                    </div>
                  </div>
                </section>
              )}
            </div>
            <section
              className="mt-10 rounded-2xl border border-border p-6"
              aria-label="Critérios do piloto"
            >
              <h2 className="font-display text-2xl">Piloto antes da expansão</h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Defina uma empresa, base autorizada e responsável. Teste pedidos normais, dados
                ausentes, exceções e tentativa de obter informação de outra conta. Compare
                encaminhamentos, tempo de revisão, falhas e consumo. Aprovar proposta exige escopo e
                motivo; lançar receita exige conferência de pagamento.
              </p>
            </section>
            <section className="mt-10">
              <h2 className="font-display text-2xl">Histórico de decisões</h2>
              {data.history.map((h, i) => (
                <p key={i} className="mt-3 text-sm text-muted-foreground">
                  {String(h.briefId)} · {String(h.fromState)} → {String(h.toState)} ·{" "}
                  {String(h.note)}
                </p>
              ))}
            </section>
          </>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
