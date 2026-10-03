import { useEffect, useState } from "react";
import { ArrowUpRight, Sparkles, RefreshCw } from "lucide-react";
import { ANALYTICS_AGENT } from "./policy";
import { runAnalyticsAgentAdmin, pauseAnalyticsAgentAdmin } from "./server";
import type { analyticsAgentStatus } from "./runtime.server";
export type AnalyticsStatus = Awaited<ReturnType<typeof analyticsAgentStatus>>;
export function analyticsHealthLabel(h: string) {
  return (
    (
      {
        active: "Operação ativa",
        paused: "Operação pausada",
        awaiting: "Primeira rodada pendente",
        attention: "Supervisão necessária",
      } as Record<string, string>
    )[h] ?? "Status indisponível"
  );
}
export function useAnalyticsAgentStatus() {
  const [data, setData] = useState<AnalyticsStatus | null>(null),
    [unavailable, setUnavailable] = useState(false),
    [refresh, setRefresh] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const r = await fetch("/api/agents/analytics/status", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!r.ok) throw new Error();
        const v = await r.json();
        if (
          v.version !== ANALYTICS_AGENT.version ||
          !Array.isArray(v.recommendations) ||
          !Array.isArray(v.recent)
        )
          throw new Error();
        setData(v);
        setUnavailable(false);
      } catch {
        if (!controller.signal.aborted) setUnavailable(true);
      }
    }
    void load();
    const timer = window.setInterval(() => void load(), 60000);
    return () => {
      controller.abort();
      window.clearInterval(timer);
    };
  }, [refresh]);
  return { data, unavailable, refresh: () => setRefresh((v) => v + 1) };
}
export function AnalyticsAgentPresence({
  admin = false,
  onOpen,
}: {
  admin?: boolean;
  onOpen?: (id: string) => void;
}) {
  const { data, unavailable, refresh } = useAnalyticsAgentStatus();
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  async function operate(kind: "run" | "pause") {
    setBusy(true);
    setMessage("");
    try {
      const r =
        kind === "run"
          ? await runAnalyticsAgentAdmin()
          : await pauseAnalyticsAgentAdmin({ data: !data?.enabled });
      if (!r.ok) throw new Error();
      setMessage(
        kind === "run"
          ? "Rodada conferida. O limite é de uma execução por hora."
          : "Estado da operação atualizado.",
      );
      refresh();
    } catch {
      setMessage("Não foi possível executar. Confira seu acesso e a operação.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      id="agente-analytics"
      className="my-6 rounded-[26px] border border-black/10 bg-white p-5 sm:p-7"
      aria-label="Operação do agente de Analytics"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-800">
            Agente exclusivo · Analytics
          </p>
          <h2 className="mt-2 flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <Sparkles size={21} />
            Uma oferta, um próximo passo.
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#7f8881]">
            Confiro o catálogo e o interesse registrado nos links da Hub. Preparo sugestões para
            você revisar e divulgar.
          </p>
        </div>
        <div className="text-sm">
          <span className="rounded-full bg-emerald-50 px-3 py-2 text-emerald-900">
            {unavailable
              ? "Status indisponível"
              : data
                ? analyticsHealthLabel(data.health)
                : "Verificando operação"}
          </span>
          <a
            href="/agentes#portfolio-analytics"
            className="mt-4 flex items-center gap-2 font-medium text-emerald-800"
          >
            Conhecer o agente <ArrowUpRight size={14} />
          </a>
        </div>
      </div>
      {data?.lastRunAt && (
        <p className="mt-4 text-xs text-[#7f8881]">
          Última rodada concluída:{" "}
          {new Date(String(data.lastRunAt)).toLocaleString("pt-BR", {
            timeZone: "America/Sao_Paulo",
          })}
          . Conteúdo{" "}
          {data.mode === "model"
            ? "preparado pelo modelo e validado por regras"
            : "preparado por regras"}
          .
        </p>
      )}
      {data?.recommendations.length ? (
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {data.recommendations.map((b) => (
            <article key={b.productId} className="rounded-2xl bg-[#f3f6f2] p-4">
              <h3 className="text-sm font-semibold">{b.title}</h3>
              <p className="mt-2 text-xs leading-5 text-[#7f8881]">{b.reason}</p>
              <details className="mt-3 text-xs">
                <summary className="cursor-pointer font-semibold text-emerald-800">
                  Sugestão de divulgação
                </summary>
                <p className="mt-3 leading-6">{b.hook}</p>
                <p className="mt-2 leading-6">{b.script}</p>
                <p className="mt-2 leading-6">{b.caption}</p>
              </details>
              <div className="mt-4 flex flex-wrap gap-3">
                {onOpen && (
                  <button
                    onClick={() => onOpen(b.productId)}
                    className="text-xs font-semibold text-emerald-800"
                  >
                    Preparar meu conteúdo
                  </button>
                )}
                <a
                  href={b.buyPath}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="text-xs font-semibold text-emerald-800"
                >
                  Ver na Shopee ↗
                </a>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-5 text-sm text-[#7f8881]">
          {unavailable
            ? "As sugestões estão indisponíveis. O catálogo continua disponível."
            : data?.health === "paused"
              ? "Novas sugestões pausadas pelo administrador."
              : "Ainda não há sugestões recentes publicadas. Você pode explorar o catálogo."}
        </p>
      )}
      <details className="mt-6 border-t border-black/5 pt-4 text-sm">
        <summary className="cursor-pointer font-semibold">Missão, habilidades e evidências</summary>
        <p className="mt-3 leading-6">{ANALYTICS_AGENT.mission}</p>
        <p className="mt-2 text-xs text-[#7f8881]">{ANALYTICS_AGENT.cadence}</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {[
            ["Tarefas", ANALYTICS_AGENT.tasks],
            ["Permissões", ANALYTICS_AGENT.permissions],
            ["Limites", ANALYTICS_AGENT.limits],
            ["Métricas", ANALYTICS_AGENT.metrics],
          ].map(([title, items]) => (
            <div key={String(title)}>
              <h3 className="font-semibold">{String(title)}</h3>
              <ul className="mt-2 space-y-2 text-xs leading-5 text-[#7f8881]">
                {(items as readonly string[]).map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        {data?.metrics && (
          <p className="mt-5 text-xs leading-6">
            Na última rodada: {data.metrics.checked} produtos conferidos ·{" "}
            {data.metrics.rejectedLinks} links recusados · {data.metrics.suggestions} sugestões ·{" "}
            {data.metrics.missingImages} ofertas sem imagem.{" "}
            {data.metrics.modelIssue && "Modelo ou saída indisponível; conteúdo por regras."}
          </p>
        )}
        <div className="mt-4 space-y-2">
          {data?.recent.map((r) => (
            <p key={r.id} className="text-xs text-[#7f8881]">
              {new Date(String(r.startedAt)).toLocaleString("pt-BR", {
                timeZone: "America/Sao_Paulo",
              })}{" "}
              ·{" "}
              {r.status === "completed"
                ? "Concluída"
                : r.status === "failed"
                  ? "Falhou"
                  : "Em execução"}
              {r.durationMs !== null ? ` · ${r.durationMs} ms` : ""}
            </p>
          ))}
        </div>
        <a
          href="/api/agents/analytics/status"
          className="mt-4 inline-flex text-xs font-semibold text-emerald-800"
        >
          Conferir histórico público ↗
        </a>
      </details>
      {admin && (
        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-black/5 pt-4">
          <button
            disabled={busy}
            onClick={() => void operate("run")}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#14271e] px-4 text-sm text-white disabled:opacity-40"
          >
            <RefreshCw size={15} />
            Executar rodada
          </button>
          <button
            disabled={busy || !data}
            onClick={() => void operate("pause")}
            className="min-h-11 rounded-full border border-black/10 px-4 text-sm disabled:opacity-40"
          >
            {data?.enabled ? "Pausar agente" : "Retomar agente"}
          </button>
          <p role="status" className="text-xs">
            {message}
          </p>
        </div>
      )}
    </section>
  );
}
