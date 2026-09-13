import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, BarChart3, ChevronLeft, ChevronRight, FileCheck2, ShieldCheck } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { BEAT_LABELS, BEAT_VALUES } from "@/lib/beats";
import { getPublicSourceReport } from "@/lib/source-network-server";
import { WIRE_NAME } from "@/lib/ecosystem";

const SITE_URL = "https://veronicahub.com";

function shiftMonth(month: string, delta: number): string {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, monthNumber - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(month: string): string {
  return new Date(`${month}-01T12:00:00Z`).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export const Route = createFileRoute("/blog/rede-de-fontes/relatorios")({
  component: SourceReportsPage,
  validateSearch: (search: Record<string, unknown>) => ({
    month: typeof search.month === "string" ? search.month : undefined,
  }),
  loaderDeps: ({ search }) => ({ month: search.month }),
  loader: ({ deps }) => getPublicSourceReport({ data: { month: deps.month } }),
  head: () => ({
    meta: [
      { title: `Relatórios de Fontes | ${WIRE_NAME}` },
      {
        name: "description",
        content: "Relatório mensal público de acessos encaminhados pelo Veronica Wire às fontes citadas.",
      },
      { property: "og:title", content: `Relatórios de Fontes | ${WIRE_NAME}` },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/blog/rede-de-fontes/relatorios` }],
  }),
});

function SourceReportsPage() {
  const report = Route.useLoaderData();
  const previousMonth = shiftMonth(report.month, -1);
  const nextMonth = shiftMonth(report.month, 1);
  const currentMonth = new Date().toISOString().slice(0, 7);
  const maxReferrals = Math.max(1, ...report.rows.map((row) => row.referrals));
  const byBeat = Object.fromEntries(
    BEAT_VALUES.map((beat) => [
      beat,
      report.rows
        .filter((row) => row.beat === beat)
        .reduce((sum, row) => sum + row.referrals, 0),
    ]),
  ) as Record<(typeof BEAT_VALUES)[number], number>;

  return (
    <div className="home-hybrid min-h-screen bg-background text-foreground">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-6 py-14 sm:py-20">
        <Link
          to="/blog/rede-de-fontes"
          className="inline-flex items-center gap-1.5 font-mono-tech text-xs uppercase tracking-widest text-muted-foreground transition hover:text-neon-green"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Rede de Fontes
        </Link>

        <header className="mt-9 grid gap-8 border-b border-border/60 pb-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <div className="flex items-center gap-2 font-mono-tech text-xs uppercase tracking-[0.2em] text-neon-green">
              <BarChart3 className="h-4 w-4" /> Transparência de distribuição
            </div>
            <h1 className="mt-4 font-display text-4xl sm:text-5xl">Relatório mensal de fontes</h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
              Cliques encaminhados pelo Wire às publicações originais. Nenhum dado pessoal do
              leitor é armazenado para produzir este relatório.
            </p>
          </div>
          <div className="flex items-center rounded-sm border border-border/60 bg-surface/40">
            <Link
              to="/blog/rede-de-fontes/relatorios"
              search={{ month: previousMonth }}
              aria-label="Mês anterior"
              className="p-3 text-muted-foreground transition hover:text-neon-green"
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>
            <div className="min-w-44 border-x border-border/60 px-5 py-3 text-center font-mono-tech text-sm capitalize">
              {monthLabel(report.month)}
            </div>
            {report.month < currentMonth ? (
              <Link
                to="/blog/rede-de-fontes/relatorios"
                search={{ month: nextMonth }}
                aria-label="Próximo mês"
                className="p-3 text-muted-foreground transition hover:text-neon-green"
              >
                <ChevronRight className="h-4 w-4" />
              </Link>
            ) : (
              <span className="p-3 text-muted-foreground/25">
                <ChevronRight className="h-4 w-4" />
              </span>
            )}
          </div>
        </header>

        <section className="grid gap-4 py-10 sm:grid-cols-2 lg:grid-cols-[1fr_2fr]">
          <div className="rounded-sm border border-neon-green/35 bg-neon-green/[0.06] p-6">
            <div className="font-mono-tech text-xs uppercase tracking-widest text-muted-foreground">
              Acessos encaminhados
            </div>
            <div className="mt-5 font-display text-5xl text-neon-green">{report.totalReferrals}</div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Total registrado no período selecionado.
            </p>
          </div>
          <div className="rounded-sm border border-border/60 bg-surface/30 p-6">
            <div className="font-mono-tech text-xs uppercase tracking-widest text-muted-foreground">
              Distribuição por tema
            </div>
            <div className="mt-5 grid gap-x-6 gap-y-4 sm:grid-cols-2">
              {BEAT_VALUES.map((beat) => (
                <div key={beat}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate">{BEAT_LABELS[beat]}</span>
                    <span className="font-mono-tech text-xs text-neon-green">{byBeat[beat]}</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border/60">
                    <div
                      className="h-full rounded-full bg-neon-green"
                      style={{ width: `${report.totalReferrals ? (byBeat[beat] / report.totalReferrals) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-sm border border-border/60">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 bg-surface/40 px-5 py-4">
            <h2 className="font-display text-xl">Encaminhamentos por fonte</h2>
            <span className="inline-flex items-center gap-1.5 font-mono-tech text-xs uppercase tracking-widest text-muted-foreground">
              <FileCheck2 className="h-3.5 w-3.5 text-neon-green" /> Dados verificados no banco
            </span>
          </div>

          {!report.available ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              O relatório está temporariamente indisponível. Os links originais continuam funcionando.
            </div>
          ) : report.rows.length === 0 ? (
            <div className="p-8 text-center">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-border/60 bg-surface/40">
                <BarChart3 className="h-5 w-5 text-neon-green" />
              </div>
              <h3 className="mt-4 font-medium">Coleta iniciada</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                Ainda não há encaminhamentos registrados neste período. O painel será atualizado
                automaticamente conforme os leitores acessarem as fontes.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {report.rows.map((row) => (
                <div
                  key={`${row.sourceDomain}-${row.beat}`}
                  className="grid gap-3 px-5 py-4 sm:grid-cols-[minmax(180px,1fr)_minmax(180px,1fr)_2fr_48px] sm:items-center"
                >
                  <div>
                    <div className="text-sm font-medium">{row.sourceLabel}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">{row.sourceDomain}</div>
                  </div>
                  <div className="text-sm text-muted-foreground">{row.beatLabel}</div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-border/60">
                    <div
                      className="h-full rounded-full bg-neon-green"
                      style={{ width: `${(row.referrals / maxReferrals) * 100}%` }}
                    />
                  </div>
                  <div className="text-right font-mono-tech text-sm text-neon-green">{row.referrals}</div>
                </div>
              ))}
            </div>
          )}
        </section>

        <aside className="mt-10 flex flex-col gap-5 rounded-sm border border-border/60 bg-surface/30 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-neon-green" />
            <div>
              <h2 className="font-medium">Relatório para veículos e instituições</h2>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Uma fonte citada pode solicitar detalhes do tráfego recebido e conversar sobre uma
                colaboração formal com a Veronica Hub.
              </p>
            </div>
          </div>
          <a
            href={`mailto:yo-tech01@outlook.com?subject=Relat%C3%B3rio%20de%20fontes%20-%20${report.month}`}
            className="shrink-0 rounded-sm border border-neon-green/50 px-4 py-2.5 font-mono-tech text-xs uppercase tracking-widest text-neon-green transition hover:bg-neon-green hover:text-primary-foreground"
          >
            Solicitar relatório
          </a>
        </aside>
      </main>

      <SiteFooter />
    </div>
  );
}
