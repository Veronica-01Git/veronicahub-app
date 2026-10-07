import { Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { workforceImage, workforceSrcSet, workforceImageAlt } from "@/lib/yo-visuals";
import { agente as agenteComercial } from "@/lib/agentes";
import {
  WORKFORCE,
  estadoDoAgente,
  rotaDoAgente,
  type AgenteWorkforce,
  type AgenteWorkforceId,
} from "@/lib/ai-workforce";

/**
 * 03 — AI WORKFORCE.
 *
 * Vitrine de produto, não marketplace. Os agentes que tocam receita, custo,
 * conversão e ativos (os que têm `impacto`) ganham prancha inteira com foto
 * grande; os demais entram numa segunda fila, mais compacta, para a página
 * não virar uma parede de pranchas iguais.
 *
 * "Conhecer" leva à rota real do agente (ou à âncora dele em /agentes,
 * quando há catálogo comercial). "Implementar" não abre checkout: rola até o
 * fechamento com o agente já marcado na proposta.
 */

function destinoConhecer(a: AgenteWorkforce) {
  if (a.comercialId) return { to: "/agentes", hash: agenteComercial(a.comercialId).ancora };
  return { to: rotaDoAgente(a).to, hash: undefined };
}

export function WorkforceStore({
  aoImplementar,
}: {
  aoImplementar: (id: AgenteWorkforceId) => void;
}) {
  const destaque = WORKFORCE.filter((a) => a.impacto);
  const demais = WORKFORCE.filter((a) => !a.impacto);

  return (
    <section
      id="workforce"
      className="border-t border-[color:var(--wf-line)] pt-[clamp(5rem,11vw,10rem)]"
      aria-labelledby="wf-store-title"
    >
      <div className="wf-wrap">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-end">
          <div className="wf-reveal">
            <p className="wf-index">03 — AI workforce</p>
            <h2 id="wf-store-title" className="wf-h2 mt-5">
              Trabalhadores digitais,
              <span className="block text-[color:var(--wf-faint)]">com função e prova.</span>
            </h2>
          </div>
          <p className="wf-lede wf-reveal max-w-[32rem] lg:justify-self-end">
            Cada agente nasce de um trabalho que alguém fazia à mão. Ele tem rota, regra e estado
            declarado — e o que ainda não faz fica escrito ao lado do que já faz.
          </p>
        </div>

        <nav className="wf-store-index mt-10" aria-label="Índice da workforce">
          {WORKFORCE.map((a) => (
            <a key={a.id} href={`#agente-${a.id}`} className="wf-chip wf-focus hover:text-white">
              <span className="wf-led" data-estado={a.estado} aria-hidden="true" />
              {a.curto}
            </a>
          ))}
        </nav>

        <div className="mt-10">
          {destaque.map((a) => (
            <Prancha key={a.id} agente={a} aoImplementar={aoImplementar} />
          ))}
        </div>

        <div className="border-t border-[color:var(--wf-line)] py-[clamp(3rem,7vw,6rem)]">
          <p className="wf-label">Também na workforce</p>
          <ul className="mt-8 grid gap-x-10 gap-y-12 md:grid-cols-2 xl:grid-cols-3">
            {demais.map((a) => (
              <AgenteCompacto key={a.id} agente={a} />
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function Prancha({
  agente: a,
  aoImplementar,
}: {
  agente: AgenteWorkforce;
  aoImplementar: (id: AgenteWorkforceId) => void;
}) {
  const estado = estadoDoAgente(a);
  const conhecer = destinoConhecer(a);
  return (
    <article id={`agente-${a.id}`} className="wf-plate scroll-mt-24" aria-labelledby={`t-${a.id}`}>
      <div className="wf-plate-media wf-reveal">
        <img
          src={workforceImage(a.midia.base, 1280, a.id)}
          srcSet={workforceSrcSet(a.midia.base, a.id)}
          sizes="(max-width: 960px) 100vw, 56vw"
          alt={workforceImageAlt(a.midia.base, a.id)}
          width={1280}
          height={720}
          loading="lazy"
          decoding="async"
          className="wf-parallax"
        />
        <span className="wf-plate-tag wf-chip bg-[color:var(--wf-ink)]/70 backdrop-blur">
          <span className="wf-led" data-estado={a.estado} aria-hidden="true" />
          {estado.rotulo}
        </span>
      </div>

      <div className="wf-reveal">
        <p className="wf-label">{a.etiqueta}</p>
        <p className="wf-quote mt-5">“{a.problema}”</p>
        <h3 id={`t-${a.id}`} className="mt-8 font-mono-tech text-sm uppercase tracking-[0.18em]">
          {a.nome}
        </h3>
        <p className="mt-3 max-w-[34rem] text-[color:var(--wf-dim)]">{a.funcao}</p>

        <p className="mt-5 flex flex-wrap">
          {a.capacidades.map((c) => (
            <span key={c} className="wf-cap">
              {c}
            </span>
          ))}
        </p>

        {a.impacto && (
          <p className="mt-6 border-l border-[color:var(--wf-signal)] pl-4 text-sm leading-relaxed text-[color:var(--wf-dim)]">
            <span className="wf-label wf-label-signal mr-2">{a.impacto.eixo}</span>
            {a.impacto.texto}
          </p>
        )}

        <p className="mt-5 text-sm leading-relaxed text-[color:var(--wf-faint)]">
          <span className="wf-label mr-2">Prova</span>
          {a.prova}
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link to={conhecer.to} hash={conhecer.hash} className="wf-btn wf-btn-ghost">
            Conhecer <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
          <a
            href="#implementar"
            className="wf-btn wf-btn-primary"
            onClick={() => aoImplementar(a.id)}
          >
            Implementar <ArrowRight size={15} aria-hidden="true" />
          </a>
        </div>
      </div>
    </article>
  );
}

function AgenteCompacto({ agente: a }: { agente: AgenteWorkforce }) {
  const estado = estadoDoAgente(a);
  const conhecer = destinoConhecer(a);
  return (
    <li id={`agente-${a.id}`} className="wf-reveal scroll-mt-24">
      <Link to={conhecer.to} hash={conhecer.hash} className="group block wf-focus rounded-xl">
        <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-[color:var(--wf-ink-2)]">
          <img
            src={workforceImage(a.midia.base, 1280, a.id)}
            alt={workforceImageAlt(a.midia.base, a.id)}
            width={1280}
            height={720}
            loading="lazy"
            decoding="async"
            srcSet={workforceSrcSet(a.midia.base, a.id)}
            sizes="(max-width: 768px) 100vw, 33vw"
            className="h-full w-full object-cover opacity-80 transition duration-700 group-hover:scale-[1.03] group-hover:opacity-100"
          />
          <span className="wf-chip absolute bottom-3 left-3 bg-[color:var(--wf-ink)]/70 backdrop-blur">
            <span className="wf-led" data-estado={a.estado} aria-hidden="true" />
            {estado.rotulo}
          </span>
        </div>
        <p className="wf-label mt-5">{a.etiqueta}</p>
        <h3 className="mt-2 flex items-center justify-between gap-3 font-display text-2xl tracking-[-0.03em]">
          {a.nome}
          <ArrowUpRight
            size={18}
            aria-hidden="true"
            className="shrink-0 opacity-50 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100"
          />
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-[color:var(--wf-dim)]">{a.problema}</p>
        <p className="mt-3 text-xs leading-relaxed text-[color:var(--wf-faint)]">
          Ainda não faz: {a.pendencias[0]}
        </p>
      </Link>
    </li>
  );
}
