import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import {
  CADEIA_DE_PAINEL,
  ESTAGIO_DA_CADEIA,
  OPERACOES,
  WORKFORCE,
  agenteWorkforce,
} from "@/lib/ai-workforce";
import { product } from "@/lib/ecosystem";

/**
 * 04 — INSIDE VERONICA.
 *
 * As rotas do Hub lidas como departamentos de uma mesma empresa. A coluna
 * "painéis" lista só o que existe — a operação sem painel diz isso, e a
 * cadeia ROTA → … → LOGS no rodapé mostra, etapa por etapa, até onde cada
 * uma chegou (ESTAGIO_DA_CADEIA em ai-workforce.ts): operando com dado real,
 * só interface com dado de demonstração, ou ainda desenho.
 *
 * Os painéis são restritos (admin ou cliente), então aparecem como nome e
 * não como link: a vitrine não convida o visitante para uma porta que vai
 * recusá-lo.
 */

const ROTULO_ESTAGIO = {
  opera: "já opera com dado real",
  interface: "tela pronta, dado de demonstração",
  desenho: "ainda é desenho",
} as const;

export function InsideVeronica() {
  return (
    <section
      id="dentro"
      className="border-t border-[color:var(--wf-line)] py-[clamp(5rem,11vw,10rem)]"
      aria-labelledby="wf-inside-title"
    >
      <div className="wf-wrap">
        <div className="max-w-[60rem] wf-reveal">
          <p className="wf-index">04 — Inside Veronica</p>
          <h2 id="wf-inside-title" className="wf-h2 mt-5">
            The workforce
            <span className="block text-[color:var(--wf-faint)]">behind the platform.</span>
          </h2>
          <p className="wf-lede mt-8 max-w-[38rem]">
            O Hub não é uma coleção de páginas. Cada rota é uma operação, com agente trabalhando
            nela e, quando já existe, um painel para quem administra. É o mesmo sistema visto de
            dentro.
          </p>
        </div>

        <div className="wf-ops mt-14" role="list">
          {OPERACOES.map((op) => (
            <div key={op.id} className="wf-op wf-reveal" role="listitem">
              <span className="wf-label">{op.etiqueta}</span>
              <div>
                <Link
                  to={product(op.produtoId).to}
                  className="group inline-flex items-center gap-2 font-display text-[clamp(1.5rem,2.4vw,2.2rem)] tracking-[-0.03em] wf-focus"
                >
                  {op.nome}
                  <ArrowUpRight
                    size={18}
                    aria-hidden="true"
                    className="opacity-40 transition group-hover:opacity-100"
                  />
                </Link>
                <p className="mt-2 max-w-[32rem] text-sm leading-relaxed text-[color:var(--wf-dim)]">
                  {op.descricao}
                </p>
              </div>
              <div>
                <p className="wf-label">Agentes</p>
                <p className="mt-2 text-sm text-[color:var(--wf-text)]">
                  {op.agentes.length
                    ? op.agentes.map((id) => agenteWorkforce(id).nome).join(" · ")
                    : "Operação conduzida pela equipe"}
                </p>
              </div>
              <div>
                <p className="wf-label">Painéis</p>
                <p className="mt-2 text-sm text-[color:var(--wf-text)]">
                  {op.paineis.length ? (
                    op.paineis.map((p) => p.rotulo).join(" · ")
                  ) : (
                    <span className="text-[color:var(--wf-faint)]">Ainda não existe</span>
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] lg:items-center wf-reveal">
          <div>
            <p className="wf-label">Arquitetura de painel por vertical</p>
            <p className="mt-3 text-sm leading-relaxed text-[color:var(--wf-dim)]">
              Toda vertical operacional pode ganhar painel próprio nesta ordem. Verde já opera com
              dado real em ao menos uma operação; contorno é tela pronta rodando com dado de
              demonstração.
            </p>
          </div>
          <ol className="wf-chain" aria-label="Cadeia de painel administrativo">
            {CADEIA_DE_PAINEL.map((etapa, i) => (
              <li key={etapa} className="contents">
                <span className="wf-chain-step" data-estagio={ESTAGIO_DA_CADEIA[etapa]}>
                  {etapa}
                  <span className="sr-only"> — {ROTULO_ESTAGIO[ESTAGIO_DA_CADEIA[etapa]]}</span>
                </span>
                {i < CADEIA_DE_PAINEL.length - 1 && (
                  <span className="wf-chain-arrow" aria-hidden="true">
                    →
                  </span>
                )}
              </li>
            ))}
          </ol>
        </div>

        <p className="mt-8 text-xs text-[color:var(--wf-faint)]">
          {WORKFORCE.filter((a) => a.painel).length} de {WORKFORCE.length} agentes têm painel
          administrativo próprio hoje. Os demais operam pela rota pública e pela conta de quem usa.
        </p>
      </div>
    </section>
  );
}
