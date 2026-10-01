import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { resumoDoVIVA, rodarAvaliacaoReal } from "@/lib/ai/evaluation-functions";
import type { EvaluationReport } from "@/lib/ai/agents/v-iva";

/**
 * /admin/v-iva — painel técnico mínimo do V-IVA.
 *
 * UI mínima de propósito: a interface definitiva da plataforma é trabalho de
 * front-end separado. Aqui só o necessário para operar com segurança:
 *   - a avaliação sobre a especificação de cada agente (sem custo);
 *   - para quem tem executor real, o botão que roda os cenários contra a
 *     agente, mostrando ANTES o teto de custo da rodada e exigindo marcar a
 *     confirmação. Nenhuma mensagem é enviada pelo WhatsApp.
 */

export const Route = createFileRoute("/admin/v-iva")({
  component: PainelVIVA,
  head: () => ({ meta: [{ title: "V-IVA · Painel Admin | Veronica Hub" }] }),
});

type Resumo = Awaited<ReturnType<typeof resumoDoVIVA>>;
type Rodada = Awaited<ReturnType<typeof rodarAvaliacaoReal>>;

const usd = (micros: number) =>
  (micros / 1_000_000).toLocaleString("pt-BR", { style: "currency", currency: "USD" });

const COR: Record<string, string> = {
  PASS: "text-neon-green",
  FAIL: "text-destructive",
  REVIEW: "text-gold",
};

function Relatorio({ report }: { report: EvaluationReport }) {
  return (
    <div className="mt-4">
      <p className="text-sm">
        <strong>{report.recommendation.verdict}</strong> · {report.summary.pass} PASS ·{" "}
        {report.summary.fail} FAIL · {report.summary.review} REVIEW
        <span className="ml-2 font-mono-tech text-xs text-muted-foreground">{report.runId}</span>
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Executado contra:{" "}
        {report.executedAgainst === "specification-only"
          ? "somente a especificação"
          : report.executedAgainst.executor}
      </p>
      <table className="mt-3 w-full text-left text-xs">
        <thead className="text-muted-foreground">
          <tr>
            <th className="py-1 pr-3">Cenário</th>
            <th className="py-1 pr-3">Veredito</th>
            <th className="py-1">Motivo</th>
          </tr>
        </thead>
        <tbody>
          {report.results.map((r) => (
            <tr key={r.scenarioId} className="border-t border-border/40 align-top">
              <td className="py-1.5 pr-3 font-mono-tech">{r.scenarioId}</td>
              <td className={`py-1.5 pr-3 font-semibold ${COR[r.verdict]}`}>{r.verdict}</td>
              <td className="py-1.5">
                {r.reason}
                {r.evidence.length > 0 && (
                  <span className="block text-muted-foreground">{r.evidence.join(" · ")}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-xs text-muted-foreground">{report.disclaimer}</p>
    </div>
  );
}

function PainelVIVA() {
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [confirmado, setConfirmado] = useState<Record<string, boolean>>({});
  const [rodando, setRodando] = useState<string | null>(null);
  const [rodadas, setRodadas] = useState<Record<string, Rodada>>({});

  useEffect(() => {
    resumoDoVIVA()
      .then(setResumo)
      .catch(() => setResumo({ ok: false, error: "Acesso restrito." }));
  }, []);

  async function rodar(slug: string, teto: number | null) {
    if (teto === null) return;
    setRodando(slug);
    try {
      const r = await rodarAvaliacaoReal({ data: { slug, confirmoCustoMaximoMicros: teto } });
      setRodadas((atual) => ({ ...atual, [slug]: r }));
    } catch {
      setRodadas((atual) => ({ ...atual, [slug]: { ok: false, error: "Falha ao rodar." } }));
    } finally {
      setRodando(null);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 py-14">
        <Link
          to="/admin"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-neon-green"
        >
          <ArrowLeft className="h-4 w-4" /> Painel admin
        </Link>
        <header className="mt-8 border-b border-border/60 pb-6">
          <div className="flex items-center gap-2 font-mono-tech text-xs uppercase tracking-[0.2em] text-neon-green">
            <ShieldCheck className="h-4 w-4" /> Validação interna
          </div>
          <h1 className="mt-3 font-display text-3xl">V-IVA</h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            O V-IVA recomenda; nunca promove. A avaliação real roda os cenários contra a agente pela
            mesma função da sala de teste — nenhuma mensagem é enviada pelo WhatsApp.
          </p>
        </header>

        {!resumo ? (
          <p className="py-10 text-muted-foreground">Carregando…</p>
        ) : !resumo.ok ? (
          <p className="py-10 text-destructive">{resumo.error}</p>
        ) : (
          resumo.agentes.map((a) => {
            const est = a.estimativa;
            const rodada = rodadas[a.slug];
            return (
              <section key={a.slug} className="mt-10 border-t border-border/60 pt-6">
                <h2 className="font-display text-xl">
                  {a.slug} <span className="text-sm text-muted-foreground">· {a.status}</span>
                </h2>

                <h3 className="mt-4 text-sm font-semibold">
                  Avaliação da especificação (sem custo)
                </h3>
                {a.especificacao && <Relatorio report={a.especificacao} />}

                {est?.executor && (
                  <div className="mt-6 rounded-sm border border-border/60 p-4">
                    <h3 className="text-sm font-semibold">Avaliação real</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Executor: {est.executor}. {est.chegamAAgente} cenários chegam à agente
                      {est.custoMaximoMicros !== null &&
                        ` — custo máximo da rodada: ${usd(est.custoMaximoMicros)} (teto por resposta × cenários)`}
                      . Uma rodada a cada 10 minutos.
                    </p>
                    <label className="mt-3 flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={Boolean(confirmado[a.slug])}
                        onChange={(e) =>
                          setConfirmado((c) => ({ ...c, [a.slug]: e.target.checked }))
                        }
                      />
                      Confirmo o custo máximo desta rodada.
                    </label>
                    <button
                      type="button"
                      disabled={
                        !confirmado[a.slug] || rodando !== null || est.custoMaximoMicros === null
                      }
                      onClick={() => rodar(a.slug, est.custoMaximoMicros)}
                      className="mt-3 rounded-sm border border-neon-green/50 px-4 py-2 text-sm text-neon-green disabled:opacity-40"
                    >
                      {rodando === a.slug
                        ? "Rodando… (pode levar até 1 minuto)"
                        : "Rodar avaliação real"}
                    </button>
                    {rodada &&
                      (rodada.ok ? (
                        <>
                          <p className="mt-3 text-xs text-muted-foreground">
                            {rodada.gravados} registros gravados no banco.
                          </p>
                          <Relatorio report={rodada.report} />
                        </>
                      ) : (
                        <p className="mt-3 text-sm text-destructive">{rodada.error}</p>
                      ))}
                  </div>
                )}
              </section>
            );
          })
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
