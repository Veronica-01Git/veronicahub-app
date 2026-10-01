import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { HOME_PRODUCTS, PRODUCTS, type Product } from "@/lib/ecosystem";

/**
 * ÍNDICE DA PLATAFORMA.
 *
 * O contrato de HOME_PRODUCTS (ecosystem.ts) é "a vitrine da home": o teste
 * de rota órfã em tests/agentes.test.mjs conta essas rotas como linkadas
 * PORQUE a Home as renderiza. Esta seção cumpre esse contrato inteiro —
 * primeiro HOME_PRODUCTS, na ordem do catálogo, depois todo o resto que é
 * público — com o estado comercial que o catálogo declara para cada um.
 *
 * É também a última prova da Home: a plataforma inteira, listada, com o
 * estado de cada parte escrito ao lado.
 */
export function PlatformIndex() {
  const vistos = new Set(HOME_PRODUCTS.map((p) => p.id));
  const demais = PRODUCTS.filter((p) => p.public && !vistos.has(p.id));
  const todos = [...HOME_PRODUCTS, ...demais];

  return (
    <section
      id="plataforma"
      className="border-t border-[color:var(--wf-line)] py-[clamp(4rem,8vw,7rem)]"
      aria-labelledby="wf-plat-title"
    >
      <div className="wf-wrap">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="wf-index">Índice</p>
            <h2
              id="wf-plat-title"
              className="mt-4 font-display text-[clamp(1.8rem,3vw,2.6rem)] tracking-[-0.035em]"
            >
              Tudo o que existe no Hub, com estado.
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-[color:var(--wf-faint)]">
            {todos.length} áreas públicas. O estado é o do catálogo de cada produto — prévia visual
            não equivale a funcionalidade ativa.
          </p>
        </div>

        <div className="wf-platform mt-10">
          {todos.map((p) => (
            <Item key={p.id} produto={p} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Item({ produto: p }: { produto: Product }) {
  const conteudo = (
    <>
      <span className="flex items-start justify-between gap-3">
        <span className="font-display text-lg tracking-[-0.02em]">{p.name}</span>
        <ArrowUpRight size={15} aria-hidden="true" className="mt-1 shrink-0 opacity-40" />
      </span>
      <span>
        <span className="block text-xs leading-relaxed text-[color:var(--wf-dim)]">
          {p.description}
        </span>
        <span className="wf-label mt-2 block">{p.status}</span>
      </span>
    </>
  );
  if (p.external) {
    return (
      <a href={p.to} target="_blank" rel="noopener noreferrer" className="wf-focus">
        {conteudo}
      </a>
    );
  }
  return (
    <Link to={p.to} className="wf-focus">
      {conteudo}
    </Link>
  );
}
