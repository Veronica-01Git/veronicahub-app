import { useEffect, useState } from "react";
import { ArrowUpRight, Sparkles } from "lucide-react";
export type MembersAgentStatus = {
  name: string;
  enabled: boolean;
  providerConfigured: boolean;
  cadence: string;
  health: "active" | "paused" | "unconfigured" | "awaiting" | "attention";
  recent: Array<{ title: string; postId: string; publishedAt: string | null; href: string }>;
};
export function useMembersAgentStatus() {
  const [data, setData] = useState<MembersAgentStatus | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const r = await fetch("/api/agents/members/status", {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!r.ok) throw new Error();
        const body = await r.json();
        if (!body || typeof body.enabled !== "boolean" || !Array.isArray(body.recent))
          throw new Error();
        setData(body);
        setUnavailable(false);
      } catch {
        if (!controller.signal.aborted) setUnavailable(true);
      }
    }
    void load();
    const interval = window.setInterval(() => {
      void load();
    }, 60_000);
    return () => {
      controller.abort();
      window.clearInterval(interval);
    };
  }, []);
  return { data, unavailable };
}
export function MembersAgentPresence() {
  const { data, unavailable } = useMembersAgentStatus();
  const label = unavailable
    ? "Status indisponível"
    : !data
      ? "Verificando operação"
      : membersHealthLabel(data.health);
  return (
    <section className="vm-agent-presence" aria-label="Agente oficial do Members">
      <div className="vm-agent-symbol">
        <Sparkles size={23} aria-hidden="true" />
      </div>
      <div className="vm-agent-intro">
        <span className="vm-eyebrow">MEMBERS · IA DA CASA</span>
        <h2>Uma ideia boa merece o próximo passo.</h2>
        <p>
          Seu agente de comunidade prepara exercícios, conecta ferramentas da Hub e ajuda nas
          conversas aprovadas.
        </p>
        {data?.recent[0] && (
          <a className="vm-agent-latest" href={data.recent[0].href}>
            Último exercício: {data.recent[0].title} <ArrowUpRight size={14} />
          </a>
        )}
      </div>
      <div className="vm-agent-presence-actions">
        <span className="vm-agent-status">{label}</span>
        <a href="/agentes#portfolio-members">
          Conhecer o agente <ArrowUpRight size={15} />
        </a>
      </div>
    </section>
  );
}

export function membersHealthLabel(health: MembersAgentStatus["health"]) {
  return (
    {
      active: "Operação ativa",
      paused: "Operação pausada",
      unconfigured: "Aguardando configuração",
      awaiting: "Primeira rodada pendente",
      attention: "Supervisão necessária",
    }[health] ?? "Status indisponível"
  );
}
