import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  BadgeDollarSign,
  CheckCircle2,
  FileUp,
  Loader2,
  ShieldAlert,
  Undo2,
} from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import {
  importAffiliateSalesAdmin,
  listAffiliateSalesAdmin,
  setAffiliatePaymentAdmin,
} from "@/lib/affiliate-commission-server";
import { formatBRL } from "@/lib/account";

export const Route = createFileRoute("/admin/comissoes-shopee")({
  component: ShopeeCommissionsAdmin,
  head: () => ({
    meta: [{ title: "Comissões Shopee | Admin Veronica Hub" }],
  }),
});

type SalesSuccess = Extract<Awaited<ReturnType<typeof listAffiliateSalesAdmin>>, { ok: true }>;
type SalesState = SalesSuccess | { ok: false; error: string };
type Sale = SalesSuccess["sales"][number];

const template = [
  "pedido\tsub_id\tproduto\tcomissao\tstatus\tdata",
  "PEDIDO-001\tdiv-exemplo\t123456789\t12,50\tconfirmado\t2026-09-22",
].join("\n");

const statusLabel: Record<string, string> = {
  pending: "Pendente",
  confirmed: "Confirmada",
  cancelled: "Cancelada",
};

function ShopeeCommissionsAdmin() {
  const [state, setState] = useState<SalesState | null>(null);
  const [raw, setRaw] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  const refresh = useCallback(async () => {
    setState(await listAffiliateSalesAdmin());
  }, []);

  useEffect(() => {
    refresh().catch((error) =>
      setState({
        ok: false,
        error: error instanceof Error ? error.message : "Falha ao carregar as comissões.",
      }),
    );
  }, [refresh]);

  async function handleImport() {
    setBusy(true);
    setMessage(null);
    try {
      const result = await importAffiliateSalesAdmin({ data: { raw } });
      if ("error" in result && result.error) throw new Error(result.error);
      const errors = result.errors ?? [];
      const imported = result.imported ?? 0;
      const details = errors.length ? ` ${errors.slice(0, 4).join(" ")}` : "";
      setMessage({
        kind: imported > 0 ? "success" : "error",
        text: `${imported} pedido(s) conciliado(s).${details}`,
      });
      if (imported > 0) {
        setRaw("");
        await refresh();
      }
    } catch (error) {
      setMessage({
        kind: "error",
        text: error instanceof Error ? error.message : "Não foi possível importar o relatório.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function togglePayment(sale: Sale) {
    let reference = "";
    if (sale.paidAt) {
      if (!window.confirm(`Desfazer a baixa do pedido ${sale.externalOrderId}?`)) return;
    } else {
      reference = window.prompt("Informe a referência do PIX ou pagamento:")?.trim() ?? "";
      if (!reference) return;
    }

    setBusy(true);
    setMessage(null);
    try {
      const result = await setAffiliatePaymentAdmin({
        data: { id: sale.id, paid: !sale.paidAt, reference },
      });
      if (!result.ok) throw new Error(result.error);
      setMessage({
        kind: "success",
        text: sale.paidAt ? "Baixa desfeita." : "Comissão registrada como paga.",
      });
      await refresh();
    } catch (error) {
      setMessage({
        kind: "error",
        text: error instanceof Error ? error.message : "Não foi possível atualizar o pagamento.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-5 py-12 sm:px-6">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link
              to="/admin"
              className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar ao admin
            </Link>
            <div className="flex items-center gap-3">
              <BadgeDollarSign className="h-7 w-7 text-emerald-500" />
              <div>
                <h1 className="font-display text-3xl">Comissões Shopee</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Concilie pedidos, confira a divisão e registre os pagamentos.
                </p>
              </div>
            </div>
          </div>
        </div>

        {!state ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando…
          </div>
        ) : !state.ok ? (
          <div className="flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/5 p-5">
            <ShieldAlert className="mt-0.5 h-5 w-5 text-destructive" />
            <p>{state.error}</p>
          </div>
        ) : (
          <div className="space-y-8">
            <section className="grid gap-3 sm:grid-cols-3">
              <Summary label="Comissão confirmada" value={state.totals.commissionCents} />
              <Summary
                label="A pagar aos divulgadores"
                value={state.totals.affiliateCents}
                accent
              />
              <Summary label="Receita Veronica Hub" value={state.totals.houseCents} />
            </section>

            <section className="grid gap-6 rounded-2xl border border-border/60 bg-card/40 p-5 lg:grid-cols-[1fr_0.78fr] lg:p-7">
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <FileUp className="h-5 w-5 text-emerald-500" />
                  <h2 className="font-display text-xl">Importar relatório</h2>
                </div>
                <p className="mb-4 text-sm leading-6 text-muted-foreground">
                  Cole dados separados por tabulação ou ponto e vírgula, com o Sub_id usado no link
                  divulgado. A comissão deve ser o valor total creditado pela Shopee; a divisão é
                  calculada automaticamente.
                </p>
                <textarea
                  value={raw}
                  onChange={(event) => setRaw(event.target.value)}
                  placeholder={template}
                  className="min-h-48 w-full resize-y rounded-xl border border-border bg-background px-4 py-3 font-mono text-xs outline-none transition focus:border-emerald-500"
                />
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleImport}
                    disabled={busy || !raw.trim()}
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {busy ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <FileUp className="h-4 w-4" />
                    )}
                    Conciliar pedidos
                  </button>
                  <button
                    type="button"
                    onClick={() => setRaw(template)}
                    className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                  >
                    Usar modelo
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-border/60 bg-background/60 p-5 text-sm">
                <h3 className="font-semibold">Colunas aceitas</h3>
                <ol className="mt-3 space-y-2 text-muted-foreground">
                  <li>1. pedido — identificador único</li>
                  <li>2. sub_id — código do divulgador</li>
                  <li>3. produto — ID opcional</li>
                  <li>4. comissão — valor em reais</li>
                  <li>5. status — pendente, confirmado ou cancelado</li>
                  <li>6. data — formato AAAA-MM-DD</li>
                </ol>
                <p className="mt-4 border-t border-border/60 pt-4 text-xs leading-5 text-muted-foreground">
                  Reimportar um pedido atualiza seu status sem duplicá-lo. Pedidos já pagos ficam
                  protegidos contra alteração acidental.
                </p>
              </div>
            </section>

            {message ? (
              <div
                className={`rounded-xl border p-4 text-sm ${
                  message.kind === "success"
                    ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-600"
                    : "border-destructive/40 bg-destructive/5 text-destructive"
                }`}
              >
                {message.text}
              </div>
            ) : null}

            <section>
              <h2 className="mb-4 font-display text-xl">
                Pedidos conciliados ({state.sales.length})
              </h2>
              {state.sales.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  Nenhum pedido importado ainda.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-border/60">
                  <table className="w-full min-w-[1050px] border-collapse text-left text-xs">
                    <thead className="bg-muted/30 font-mono-tech uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3">Pedido</th>
                        <th className="px-4 py-3">Divulgador</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Comissão</th>
                        <th className="px-4 py-3">Divulgador</th>
                        <th className="px-4 py-3">Veronica</th>
                        <th className="px-4 py-3">Pagamento</th>
                        <th className="px-4 py-3 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {state.sales.map((sale) => (
                        <tr key={sale.id} className="border-t border-border/50">
                          <td className="px-4 py-3">
                            <div className="font-medium">{sale.externalOrderId}</div>
                            <div className="mt-0.5 text-muted-foreground">
                              {sale.orderAt
                                ? new Date(sale.orderAt).toLocaleDateString("pt-BR", {
                                    timeZone: "UTC",
                                  })
                                : "Sem data"}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div>{sale.email ?? "Conta não localizada"}</div>
                            <code className="text-[11px] text-muted-foreground">
                              {sale.affiliateCode}
                            </code>
                          </td>
                          <td className="px-4 py-3">
                            <span className="rounded-full bg-muted px-2 py-1">
                              {statusLabel[sale.status] ?? sale.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 tabular-nums">
                            {formatBRL(sale.commissionCents)}
                          </td>
                          <td className="px-4 py-3 tabular-nums text-emerald-600">
                            {formatBRL(sale.affiliateCents)}
                          </td>
                          <td className="px-4 py-3 tabular-nums">{formatBRL(sale.houseCents)}</td>
                          <td className="px-4 py-3">
                            {sale.paidAt ? (
                              <div>
                                <div className="inline-flex items-center gap-1 text-emerald-600">
                                  <CheckCircle2 className="h-3.5 w-3.5" /> Pago
                                </div>
                                <div
                                  className="mt-0.5 max-w-40 truncate text-muted-foreground"
                                  title={sale.paymentReference ?? ""}
                                >
                                  {sale.paymentReference}
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">Em aberto</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {sale.status === "confirmed" ? (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => togglePayment(sale)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 font-medium transition hover:border-emerald-500 disabled:opacity-50"
                              >
                                {sale.paidAt ? (
                                  <Undo2 className="h-3.5 w-3.5" />
                                ) : (
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                )}
                                {sale.paidAt ? "Desfazer" : "Marcar pago"}
                              </button>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function Summary({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/40 p-5">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-2 font-display text-2xl tabular-nums ${accent ? "text-emerald-500" : ""}`}>
        {formatBRL(value)}
      </p>
    </div>
  );
}
