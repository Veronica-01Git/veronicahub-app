import { ArrowUpRight, Check, Mail, MessageCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { worldImage, worldSrcSet } from "@/lib/yo-visuals";
import { SOCIAL_LINKS } from "@/components/SiteChrome";
import { DEPARTAMENTOS, WORKFORCE, type AgenteWorkforceId } from "@/lib/ai-workforce";

/**
 * 09 — BUILD YOUR WORKFORCE.
 *
 * Fechamento Enterprise SEM pagamento e SEM preço: a pessoa marca o que quer
 * resolver e a mensagem de proposta sai montada para o WhatsApp ou o e-mail
 * da casa — os mesmos canais de SOCIAL_LINKS que o rodapé já usa. O diagnóstico
 * persistente tem entrada própria em /implementar; o visitante escolhe salvar
 * ali o briefing na sua conta. Preço e proposta dependem de revisão humana.
 *
 * O botão "Implementar" das pranchas da vitrine chega aqui com o agente já
 * marcado (`selecionados` vem do estado da Home).
 */
export function BuildWorkforce({
  selecionados,
  alternar,
}: {
  selecionados: ReadonlySet<AgenteWorkforceId>;
  alternar: (id: AgenteWorkforceId) => void;
}) {
  const [areas, setAreas] = useState<ReadonlySet<string>>(new Set());
  const [empresa, setEmpresa] = useState("");

  function alternarArea(id: string) {
    setAreas((atual) => {
      const novo = new Set(atual);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
  }

  const mensagem = useMemo(() => {
    const agentes = WORKFORCE.filter((a) => selecionados.has(a.id)).map((a) => a.nome);
    const deps = DEPARTAMENTOS.filter((d) => areas.has(d.id)).map((d) => d.nome);
    return [
      "Olá! Quero projetar a AI Workforce da minha empresa.",
      empresa.trim() && `Empresa: ${empresa.trim()}`,
      agentes.length > 0 && `Agentes de interesse: ${agentes.join(", ")}`,
      deps.length > 0 && `Áreas da operação: ${deps.join(", ")}`,
      "Vim pela Home da Veronica Hub.",
    ]
      .filter(Boolean)
      .join("\n");
  }, [selecionados, areas, empresa]);

  const whatsapp = `${SOCIAL_LINKS.whatsapp}?text=${encodeURIComponent(mensagem)}`;
  const email = `${SOCIAL_LINKS.email}?subject=${encodeURIComponent(
    "AI Workforce · proposta Enterprise",
  )}&body=${encodeURIComponent(mensagem)}`;

  return (
    <section
      id="implementar"
      className="wf-final scroll-mt-16 border-t border-[color:var(--wf-line)] py-[clamp(5rem,12vw,11rem)]"
      aria-labelledby="wf-final-title"
    >
      <img
        src={worldImage("portfolio")}
        srcSet={worldSrcSet("portfolio")}
        sizes="60vw"
        alt=""
        aria-hidden="true"
        width={1280}
        height={720}
        loading="lazy"
        decoding="async"
        className="wf-final-portrait"
      />
      <div className="wf-wrap">
        <p className="wf-index">09 — Build your workforce</p>
        <h2
          id="wf-final-title"
          className="wf-display mt-6 max-w-[14ch] text-[clamp(3rem,8.5vw,8.4rem)]"
        >
          Construa a força de trabalho digital
          <span className="text-[color:var(--wf-faint)]"> da sua empresa.</span>
        </h2>

        <p className="mt-8 flex flex-wrap text-[clamp(1rem,1.4vw,1.25rem)]">
          {["Agentes especializados", "Skills", "Regras", "Integrações", "Governança"].map((t) => (
            <span key={t} className="wf-cap text-[color:var(--wf-text)]">
              {t}
            </span>
          ))}
        </p>

        <div className="mt-14 grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <div className="grid gap-8">
            <fieldset>
              <legend className="wf-label">Agentes que interessam</legend>
              <div className="mt-4 flex flex-wrap gap-2">
                {WORKFORCE.map((a) => {
                  const on = selecionados.has(a.id);
                  return (
                    <button
                      key={a.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => alternar(a.id)}
                      className={`wf-chip wf-focus min-h-10 transition ${
                        on
                          ? "border-[color:var(--wf-paper)] bg-[color:var(--wf-paper)] text-[color:var(--wf-ink)]"
                          : "hover:text-white"
                      }`}
                    >
                      {on && <Check size={12} aria-hidden="true" />}
                      {a.curto}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <fieldset>
              <legend className="wf-label">Áreas da operação</legend>
              <div className="mt-4 flex flex-wrap gap-2">
                {DEPARTAMENTOS.map((d) => {
                  const on = areas.has(d.id);
                  return (
                    <button
                      key={d.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => alternarArea(d.id)}
                      className={`wf-chip wf-focus min-h-10 transition ${
                        on
                          ? "border-[color:var(--wf-paper)] bg-[color:var(--wf-paper)] text-[color:var(--wf-ink)]"
                          : "hover:text-white"
                      }`}
                    >
                      {on && <Check size={12} aria-hidden="true" />}
                      {d.nome}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <label className="block max-w-md">
              <span className="wf-label">Empresa (opcional)</span>
              <input
                type="text"
                value={empresa}
                onChange={(e) => setEmpresa(e.target.value)}
                maxLength={80}
                autoComplete="organization"
                placeholder="Nome da empresa"
                className="mt-3 block w-full rounded-full border border-[color:var(--wf-line-2)] bg-transparent px-5 py-3 text-sm text-[color:var(--wf-text)] placeholder:text-[color:var(--wf-faint)] focus:border-[color:var(--wf-signal)] focus:outline-none"
              />
            </label>
          </div>

          <div className="self-end rounded-2xl border border-[color:var(--wf-line-2)] bg-[color:var(--wf-ink-2)]/80 p-6 backdrop-blur">
            <p className="wf-label">Sua mensagem</p>
            <pre className="mt-4 whitespace-pre-wrap font-sans text-sm leading-relaxed text-[color:var(--wf-dim)]">
              {mensagem}
            </pre>
            <div className="mt-6 grid gap-3">
              <a href="/implementar" className="wf-btn wf-btn-primary justify-center">
                Criar meu diagnóstico
              </a>
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="wf-btn wf-btn-primary justify-center"
              >
                <MessageCircle size={16} aria-hidden="true" />
                Projetar minha AI Workforce
                <ArrowUpRight size={15} aria-hidden="true" />
              </a>
              <a href={email} className="wf-btn wf-btn-ghost justify-center">
                <Mail size={16} aria-hidden="true" />
                Prefiro por e-mail
              </a>
            </div>
            <p className="mt-5 text-xs leading-relaxed text-[color:var(--wf-faint)]">
              Sem pagamento na página e sem tabela de preço: escopo, integrações e investimento saem
              de um diagnóstico da operação. Nada é enviado antes de você tocar em um dos botões.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
