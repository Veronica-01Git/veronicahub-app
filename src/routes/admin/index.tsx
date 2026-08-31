import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldAlert, Newspaper, ImageIcon } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { getAdminOverview } from "@/lib/admin-server";
import { formatBRL } from "@/lib/account";

// Rota não listada em ECOSYSTEM_LINKS de propósito — acesso só por URL
// direta, e mesmo assim protegido de verdade no servidor (getAdminOverview
// só retorna dado pra quem já é admin na sessão). Sem isso, é só uma
// página em branco pedindo login.
export const Route = createFileRoute("/admin/")({
  component: AdminPanel,
  head: () => ({
    meta: [{ title: "Painel Admin | Veronica Hub" }],
  }),
});

type Overview = Awaited<ReturnType<typeof getAdminOverview>>;

function AdminPanel() {
  const [state, setState] = useState<Overview | { ok: false; error: string } | null>(null);

  useEffect(() => {
    getAdminOverview()
      .then(setState)
      .catch((err) =>
        setState({ ok: false, error: err instanceof Error ? err.message : "Falha ao carregar." }),
      );
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 font-mono-tech text-[11px] uppercase tracking-widest text-neon-green">
            <span className="h-1.5 w-1.5 rounded-full bg-neon-green animate-pulse-dot" />
            Painel admin
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/admin/artigos"
              className="inline-flex items-center gap-1.5 rounded-sm border border-border/60 px-3 py-1.5 text-sm text-muted-foreground transition hover:border-neon-green/50 hover:text-foreground"
            >
              <Newspaper className="h-4 w-4" /> Artigos do Veronica Wire
            </Link>
            <Link
              to="/admin/imagens"
              className="inline-flex items-center gap-1.5 rounded-sm border border-border/60 px-3 py-1.5 text-sm text-muted-foreground transition hover:border-neon-green/50 hover:text-foreground"
            >
              <ImageIcon className="h-4 w-4" /> Banco de imagens
            </Link>
          </div>
        </div>

        {!state ? (
          <p className="text-muted-foreground">Carregando…</p>
        ) : !state.ok ? (
          <div className="flex items-start gap-3 rounded-sm border border-destructive/40 bg-destructive/5 p-5">
            <ShieldAlert className="mt-0.5 h-5 w-5 flex-shrink-0 text-destructive" />
            <div>
              <p className="font-medium text-foreground">{state.error}</p>
              <p className="mt-1 text-[13px] text-muted-foreground">
                Faça login pelo botão "Entrar" no topo da página com o e-mail autorizado e
                recarregue.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-10">
            <section>
              <h2 className="mb-4 font-display text-xl">Usuários ({state.users.length})</h2>
              <div className="overflow-x-auto rounded-sm border border-border/60">
                <table className="w-full min-w-[720px] border-collapse text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-border/60 font-mono-tech text-[10.5px] uppercase tracking-widest text-muted-foreground">
                      <th className="px-4 py-3">E-mail</th>
                      <th className="px-4 py-3">Papel</th>
                      <th className="px-4 py-3">Saldo</th>
                      <th className="px-4 py-3">Créditos vídeo</th>
                      <th className="px-4 py-3">Créditos imagem</th>
                      <th className="px-4 py-3">Cadastro</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.users.map((u) => (
                      <tr key={u.id} className="border-b border-border/30 last:border-0">
                        <td className="px-4 py-3">{u.email}</td>
                        <td className="px-4 py-3">
                          {u.role === "admin" ? (
                            <span className="rounded-full bg-neon-green/15 px-2 py-0.5 font-mono-tech text-[10px] uppercase tracking-widest text-neon-green">
                              admin
                            </span>
                          ) : (
                            <span className="text-muted-foreground">usuário</span>
                          )}
                        </td>
                        <td className="px-4 py-3 tabular-nums">{formatBRL(u.balanceCents)}</td>
                        <td className="px-4 py-3 tabular-nums">{u.freeVideoCredits}</td>
                        <td className="px-4 py-3 tabular-nums">{u.freeImageCredits}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {new Date(u.createdAt).toLocaleDateString("pt-BR")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="mb-4 font-display text-xl">
                Depósitos recentes ({state.topUps.length})
              </h2>
              <div className="overflow-x-auto rounded-sm border border-border/60">
                <table className="w-full min-w-[640px] border-collapse text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-border/60 font-mono-tech text-[10.5px] uppercase tracking-widest text-muted-foreground">
                      <th className="px-4 py-3">Usuário</th>
                      <th className="px-4 py-3">Valor</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Criado em</th>
                      <th className="px-4 py-3">Pago em</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.topUps.map((t) => (
                      <tr key={t.id} className="border-b border-border/30 last:border-0">
                        <td className="px-4 py-3 text-muted-foreground">{t.userId}</td>
                        <td className="px-4 py-3 tabular-nums">{formatBRL(t.amountCents)}</td>
                        <td className="px-4 py-3">
                          <span
                            className="rounded-full px-2 py-0.5 font-mono-tech text-[10px] uppercase tracking-widest"
                            style={{
                              background:
                                t.status === "PAGO"
                                  ? "color-mix(in oklab, var(--neon-green) 15%, transparent)"
                                  : t.status === "CANCELADO"
                                    ? "color-mix(in oklab, var(--destructive) 15%, transparent)"
                                    : "color-mix(in oklab, var(--muted-foreground) 15%, transparent)",
                              color:
                                t.status === "PAGO"
                                  ? "var(--neon-green)"
                                  : t.status === "CANCELADO"
                                    ? "var(--destructive)"
                                    : "var(--muted-foreground)",
                            }}
                          >
                            {t.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {new Date(t.createdAt).toLocaleString("pt-BR")}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {t.paidAt ? new Date(t.paidAt).toLocaleString("pt-BR") : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </div>

      <SiteFooter />
    </div>
  );
}
