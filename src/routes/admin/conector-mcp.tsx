import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, PlugZap } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { desconectarConectorMcp, painelDoConectorMcp } from "@/lib/mcp/admin-functions";

/**
 * /admin/conector-mcp — o que o Claude fez pelo conector "Veronica" e o botão
 * para cortar todas as conexões. Só metadado: ferramenta, status, duração.
 */

export const Route = createFileRoute("/admin/conector-mcp")({
  component: PainelConectorMcp,
  head: () => ({ meta: [{ title: "Conector MCP · Painel Admin | Veronica Hub" }] }),
});

type Painel = Awaited<ReturnType<typeof painelDoConectorMcp>>;

const COR: Record<string, string> = {
  SUCCEEDED: "text-neon-green",
  FAILED: "text-destructive",
  RUNNING: "text-gold",
};

const quando = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

function PainelConectorMcp() {
  const [painel, setPainel] = useState<Painel | null>(null);
  const [confirmado, setConfirmado] = useState(false);
  const [cortando, setCortando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  const carregar = useCallback(() => {
    painelDoConectorMcp()
      .then(setPainel)
      .catch(() => setPainel({ ok: false, error: "Acesso restrito." }));
  }, []);

  useEffect(carregar, [carregar]);

  async function desconectar() {
    setCortando(true);
    try {
      const r = await desconectarConectorMcp({ data: { confirmo: true } });
      setAviso(
        r.ok
          ? `${r.revogados} token(s) revogado(s). O Claude vai pedir para autorizar de novo.`
          : r.error,
      );
      setConfirmado(false);
      carregar();
    } catch {
      setAviso("Falha ao desconectar. Tente de novo.");
    } finally {
      setCortando(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <Link
          to="/admin"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-neon-green"
        >
          <ArrowLeft className="h-4 w-4" /> Painel admin
        </Link>
        <header className="mt-8 border-b border-border/60 pb-6">
          <div className="flex items-center gap-2 font-mono-tech text-xs uppercase tracking-[0.2em] text-neon-green">
            <PlugZap className="h-4 w-4" /> Conector do Claude
          </div>
          <h1 className="mt-3 font-display text-3xl">Conector MCP “Veronica”</h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            Tudo o que o Claude fez no Veronica Analytics pelo conector, a partir de
            veronicahub.com/mcp. Limite de 60 chamadas por minuto; token de acesso de 1 hora.
          </p>
        </header>

        {!painel ? (
          <p className="py-10 text-muted-foreground">Carregando…</p>
        ) : !painel.ok ? (
          <p className="py-10 text-destructive">{painel.error}</p>
        ) : (
          <>
            <section className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-sm border border-border/60 p-4">
                <p className="text-xs text-muted-foreground">Chamadas nas últimas 24 h</p>
                <p className="mt-1 font-display text-2xl">{painel.chamadas24h}</p>
              </div>
              <div className="rounded-sm border border-border/60 p-4">
                <p className="text-xs text-muted-foreground">Recusadas ou com falha (24 h)</p>
                <p className="mt-1 font-display text-2xl">{painel.falhas24h}</p>
              </div>
              <div className="rounded-sm border border-border/60 p-4">
                <p className="text-xs text-muted-foreground">Conexões ativas</p>
                <p className="mt-1 font-display text-2xl">{painel.conexoes.length}</p>
              </div>
            </section>

            <section className="mt-8 rounded-sm border border-destructive/40 p-4">
              <h2 className="text-sm font-semibold">Desconectar tudo</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Revoga todos os tokens na hora. Use se perder o acesso a um aparelho ou suspeitar de
                uso indevido. Para voltar a usar, conecte de novo pelo Claude.
              </p>
              {painel.conexoes.length > 0 && (
                <ul className="mt-2 text-xs text-muted-foreground">
                  {painel.conexoes.map((c) => (
                    <li key={c.renovadaEm}>
                      Renovada em {quando(c.renovadaEm)} · expira em {quando(c.expiraEm)}
                    </li>
                  ))}
                </ul>
              )}
              <label className="mt-3 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={confirmado}
                  onChange={(e) => setConfirmado(e.target.checked)}
                />
                Entendo que o Claude vai perder o acesso até eu conectar de novo.
              </label>
              <button
                type="button"
                disabled={!confirmado || cortando}
                onClick={desconectar}
                className="mt-3 rounded-sm border border-destructive/60 px-4 py-2 text-sm text-destructive disabled:opacity-40"
              >
                {cortando ? "Desconectando…" : "Desconectar todas as conexões"}
              </button>
              {aviso && <p className="mt-3 text-sm">{aviso}</p>}
            </section>

            <section className="mt-10">
              <h2 className="font-display text-xl">Últimas 50 chamadas</h2>
              {painel.execucoes.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">Nenhuma chamada ainda.</p>
              ) : (
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[520px] text-left text-xs">
                    <thead className="text-muted-foreground">
                      <tr>
                        <th className="py-1 pr-3">Quando</th>
                        <th className="py-1 pr-3">Ferramenta</th>
                        <th className="py-1 pr-3">Status</th>
                        <th className="py-1 pr-3">Motivo</th>
                        <th className="py-1">Duração</th>
                      </tr>
                    </thead>
                    <tbody>
                      {painel.execucoes.map((e) => (
                        <tr key={e.id} className="border-t border-border/40">
                          <td className="py-1.5 pr-3">{quando(e.em)}</td>
                          <td className="py-1.5 pr-3 font-mono-tech">{e.ferramenta}</td>
                          <td className={`py-1.5 pr-3 font-semibold ${COR[e.status] ?? ""}`}>
                            {e.status}
                          </td>
                          <td className="py-1.5 pr-3">{e.erro ?? "—"}</td>
                          <td className="py-1.5">
                            {e.duracaoMs === null ? "—" : `${e.duracaoMs} ms`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
