import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, BarChart3, MousePointerClick, ShieldAlert, Target } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { getWireCommercialSnapshot } from "@/lib/wire-commerce-server";

export const Route = createFileRoute("/admin/wire")({
  component: WireCommercialPanel,
  head: () => ({ meta: [{ title: "Desempenho do Wire · Painel Admin | Veronica Hub" }] }),
});

type Snapshot = Awaited<ReturnType<typeof getWireCommercialSnapshot>>;

function WireCommercialPanel() {
  const [state, setState] = useState<Snapshot | null>(null);

  useEffect(() => {
    getWireCommercialSnapshot()
      .then(setState)
      .catch(() => setState({ ok: false, error: "Acesso restrito." }));
  }, []);

  const maxClicks =
    state?.ok && state.available ? Math.max(1, ...state.offers.map((offer) => offer.clicks)) : 1;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 py-14">
        <Link
          to="/admin"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-neon-green"
        >
          <ArrowLeft className="h-4 w-4" /> Painel admin
        </Link>
        <header className="mt-8 border-b border-border/60 pb-8">
          <div className="flex items-center gap-2 font-mono-tech text-xs uppercase tracking-[0.2em] text-neon-green">
            <Target className="h-4 w-4" /> Inteligência comercial editorial
          </div>
          <h1 className="mt-3 font-display text-3xl sm:text-4xl">Desempenho do Wire TV</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Intenções geradas pelas recomendações contextuais das matérias. Cliques não são vendas;
            a receita confirmada deverá ser conciliada com o checkout.
          </p>
        </header>

        {!state ? (
          <p className="py-10 text-muted-foreground">Carregando…</p>
        ) : !state.ok ? (
          <div className="mt-8 flex items-start gap-3 rounded-sm border border-destructive/40 bg-destructive/5 p-5">
            <ShieldAlert className="mt-0.5 h-5 w-5 text-destructive" />
            <div>
              <p className="font-medium">{state.error}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Entre com a conta administrativa e recarregue.
              </p>
            </div>
          </div>
        ) : (
          <>
            <section className="grid gap-4 py-8 sm:grid-cols-2">
              <div className="rounded-sm border border-neon-green/35 bg-neon-green/[0.06] p-6">
                <div className="flex items-center gap-2 font-mono-tech text-xs uppercase tracking-widest text-muted-foreground">
                  <MousePointerClick className="h-4 w-4 text-neon-green" /> Cliques em soluções
                </div>
                <div className="mt-5 font-display text-5xl text-neon-green">
                  {state.totalClicks}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Últimos {state.periodDays} dias.
                </p>
              </div>
              <div className="rounded-sm border border-border/60 bg-surface/25 p-6">
                <div className="flex items-center gap-2 font-mono-tech text-xs uppercase tracking-widest text-muted-foreground">
                  <BarChart3 className="h-4 w-4 text-neon-green" /> Leitura correta
                </div>
                <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                  Esta primeira camada mede interesse por oferta. O próximo estágio conecta
                  campanha, pedido aprovado e receita para calcular conversão e valor por matéria.
                </p>
              </div>
            </section>

            <section className="overflow-hidden rounded-sm border border-border/60">
              <div className="border-b border-border/60 bg-surface/30 px-5 py-4">
                <h2 className="font-display text-xl">Interesse por solução</h2>
              </div>
              {!state.available ? (
                <p className="p-6 text-sm text-muted-foreground">
                  A medição está temporariamente indisponível.
                </p>
              ) : state.offers.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground">
                  A coleta começou agora. Os primeiros cliques aparecerão aqui automaticamente.
                </p>
              ) : (
                <div className="divide-y divide-border/50">
                  {state.offers.map((offer) => (
                    <div
                      key={offer.offerId}
                      className="grid gap-3 px-5 py-4 sm:grid-cols-[minmax(220px,1fr)_2fr_60px] sm:items-center"
                    >
                      <div>
                        <div className="text-sm font-medium">{offer.label}</div>
                        <div className="mt-0.5 font-mono-tech text-[10px] uppercase tracking-wider text-muted-foreground">
                          {offer.offerId}
                        </div>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-border/60">
                        <div
                          className="h-full rounded-full bg-neon-green"
                          style={{ width: `${(offer.clicks / maxClicks) * 100}%` }}
                        />
                      </div>
                      <div className="text-right font-mono-tech text-sm text-neon-green">
                        {offer.clicks}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
