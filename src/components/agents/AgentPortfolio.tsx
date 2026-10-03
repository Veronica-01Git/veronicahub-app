import { useAnalyticsAgentStatus, analyticsHealthLabel } from "../../analytics-agent/Presence";
import { routesForAgent } from "../../lib/agent-portfolio";
import { ArrowUpRight, ChevronDown, Sparkles } from "lucide-react";
import { WORKFORCE, ESTADOS } from "../../lib/ai-workforce";
import { useMembersAgentStatus, membersHealthLabel } from "../../members/AgentPresence";
import "./agent-portfolio.css";
export function AgentPortfolio() {
  const { data, unavailable } = useMembersAgentStatus();
  const analytics = useAnalyticsAgentStatus();
  return (
    <section className="vap-section" id="portfolio-agentes" aria-labelledby="vap-title">
      <div className="vap-heading">
        <div>
          <span className="vap-eyebrow">VERONICA AI WORKFORCE</span>
          <h2 id="vap-title">
            Conheça quem faz.
            <br />
            <span>Veja onde acontece.</span>
          </h2>
        </div>
        <p>
          O portfólio de cada IA começa dentro da Hub. Conheça suas habilidades, abra o ambiente de
          trabalho e confira o que já funciona.
        </p>
      </div>
      <div className="vap-grid">
        {WORKFORCE.map((a, i) => {
          const state = ESTADOS[a.estado],
            routes = routesForAgent(a),
            members = a.id === "members";
          const status = members
            ? unavailable
              ? "Status indisponível"
              : !data
                ? "Verificando operação"
                : membersHealthLabel(data.health)
            : a.id === "analytics"
              ? analytics.unavailable
                ? "Status indisponível"
                : analytics.data
                  ? analyticsHealthLabel(analytics.data.health)
                  : "Verificando operação"
              : state.rotulo;
          return (
            <article
              className={`vap-card ${members ? "vap-featured" : ""}`}
              id={`portfolio-${a.id}`}
              key={a.id}
            >
              <div className="vap-cover">
                <img
                  src={`/images/home/platforms/${a.midia.base}-1280.webp`}
                  alt={a.midia.alt}
                  loading="lazy"
                  width="1280"
                  height="720"
                />
                <span className="vap-number">
                  {String(i + 1).padStart(2, "0")} / {a.etiqueta}
                </span>
                <span className="vap-badge">{status}</span>
              </div>
              <div className="vap-body">
                <span className="vap-eyebrow">
                  {members ? "SEU AGENTE DE COMUNIDADE" : a.curto.toUpperCase()}
                </span>
                <h3>{a.nome}</h3>
                <p className="vap-function">{a.funcao}</p>
                <div className="vap-skills">
                  {a.capacidades.map((c) => (
                    <span key={c}>{c}</span>
                  ))}
                </div>
                <div className="vap-routes">
                  <span>AMBIENTES DE TRABALHO</span>
                  {routes.map((r) => (
                    <a href={r.href} key={r.href}>
                      {r.label} <ArrowUpRight size={16} />
                    </a>
                  ))}
                </div>
                <details className="vap-proof">
                  <summary>
                    <Sparkles size={15} /> Portfólio e evidências <ChevronDown size={14} />
                  </summary>
                  <p>{a.prova}</p>
                  {members &&
                    data?.recent.map((p) => (
                      <a key={p.postId} href={p.href}>
                        {p.title} <ArrowUpRight size={13} />
                      </a>
                    ))}
                  {a.id === "analytics" &&
                    analytics.data?.recommendations.map((b) => (
                      <a key={b.productId} href="/veronica-analytics#agente-analytics">
                        {b.title} <ArrowUpRight size={13} />
                      </a>
                    ))}
                  <strong>Escopo atual</strong>
                  <p>{state.significa}</p>
                  <ul>
                    {a.pendencias.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                </details>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
