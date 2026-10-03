import { useEffect, useState } from "react";
import { memberAgentOverview, runMemberAgent, toggleMemberAgent } from "./agent-server";
import { MEMBERS_AGENT_SKILLS } from "./agent-policy";
export function MemberAgentControl({ onComplete }: { onComplete: () => Promise<void> }) {
  const [data, setData] = useState<Awaited<ReturnType<typeof memberAgentOverview>> | null>(null);
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  async function refresh() {
    try {
      setData(await memberAgentOverview());
    } catch {
      setMessage("Não foi possível ler a operação do agente.");
    }
  }
  useEffect(() => {
    void refresh();
  }, []);
  async function act(run: boolean) {
    setBusy(true);
    setMessage("");
    try {
      if (run) {
        const result = await runMemberAgent();
        setMessage(
          result.paused
            ? "O agente está pausado. Retome antes de executar."
            : `${result.published} publicação · ${result.replies} respostas · ${result.review} para revisão · ${result.failed} falhas. Tarefas concluídas não são repetidas.`,
        );
        await onComplete();
      } else await toggleMemberAgent({ data: !data?.enabled });
      await refresh();
    } catch {
      setMessage(
        "Rodada indisponível. Verifique provedor e histórico; a publicação não é simulada.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="vm-agent-control">
      <span className="vm-eyebrow">AGENTE MEMBERS · SUPERVISÃO</span>
      <h2>A comunidade, em operação.</h2>
      <p>
        Um exercício por dia. Até duas respostas por rodada, apenas em comentários aprovados.
        Agendamento a cada quatro horas, sujeito à disponibilidade do GitHub Actions.
      </p>
      <div className="vm-agent-skills">
        {MEMBERS_AGENT_SKILLS.map((s) => (
          <div key={s.key}>
            <strong>{s.name}</strong>
            <p>{s.description}</p>
          </div>
        ))}
      </div>
      {data && (
        <>
          <p>
            {data.enabled ? "Ativado" : "Pausado"} ·{" "}
            {data.providerConfigured ? "Provedor configurado" : "Provedor não configurado"} ·{" "}
            {data.counts.callsToday}/18 chamadas reservadas hoje
          </p>
          <div className="vm-agent-counts">
            <span>{data.counts.posts} publicações</span>
            <span>{data.counts.pending} aguardando moderação</span>
            <span>{data.counts.replies} respostas oficiais</span>
          </div>
          <div className="vm-agent-buttons">
            <button
              className="vm-primary"
              disabled={busy || !data.enabled}
              onClick={() => void act(true)}
            >
              {busy ? "Executando…" : "Executar rodada"}
            </button>
            <button className="vm-secondary" disabled={busy} onClick={() => void act(false)}>
              {data.enabled ? "Pausar agente" : "Retomar agente"}
            </button>
          </div>
          <details>
            <summary>Histórico de execução</summary>
            {data.tasks.length ? (
              <ul>
                {data.tasks.map((t) => (
                  <li key={t.key}>
                    <strong>{t.kind === "editorial" ? "Editorial" : "Resposta"}</strong> ·{" "}
                    {(
                      {
                        SUCCEEDED: "Concluída",
                        FAILED: "Falhou · verificar",
                        REVIEW: "Revisão humana",
                        RUNNING: "Em execução",
                      } as Record<string, string>
                    )[t.status] ?? t.status}{" "}
                    · {new Date(t.createdAt).toLocaleString("pt-BR")}
                  </li>
                ))}
              </ul>
            ) : (
              <p>A primeira execução ainda não aconteceu.</p>
            )}
            <p>
              Falhas e temas sensíveis ficam na supervisão. Nenhum comentário é aprovado ou excluído
              pelo agente. Custo do modelo é estimado; a cobrança real depende do provedor.
            </p>
          </details>
        </>
      )}
      {message && <p role="status">{message}</p>}
    </section>
  );
}
