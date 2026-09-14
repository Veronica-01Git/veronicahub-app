/**
 * Catch-all das onze seções ainda não desenhadas.
 *
 * É a tela que o cliente mais clica durante a demonstração, então ela não
 * pode parecer um 404: mesmo cabeçalho, mesmo acabamento, e o escopo do que
 * a seção vai conter na implantação.
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { OpsCard } from "@/features/express-ops-b/components/primitives";
import { BASE, NAV_POR_SLUG } from "@/features/express-ops-b/nav";

export const Route = createFileRoute("/preview/express-operations-b/$secao")({
  component: SecaoEmConstrucao,
});

/** Blueprint discreto — sugere planta em obra sem virar ilustração barulhenta. */
function MarcaConstrucao() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 96 96"
      className="h-16 w-16"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect
        x="8.5"
        y="8.5"
        width="79"
        height="79"
        rx="12"
        stroke="var(--ops-line-strong)"
        strokeDasharray="4 5"
      />
      <path
        d="M26 62V40.5M26 40.5 40 31l14 9.5M40 31v31"
        stroke="var(--ops-line-strong)"
        strokeWidth="1.6"
      />
      <rect
        x="54"
        y="46"
        width="16"
        height="16"
        rx="3"
        stroke="var(--ops-accent)"
        strokeWidth="1.6"
      />
      <path d="M26 70h44" stroke="var(--ops-line-strong)" strokeWidth="1.6" />
      <circle cx="62" cy="54" r="2" fill="var(--ops-accent)" />
    </svg>
  );
}

function SecaoEmConstrucao() {
  const { secao } = Route.useParams();
  const item = NAV_POR_SLUG.get(secao);
  const titulo = item?.rotulo ?? "Seção";

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-4">
      <OpsCard as="section" className="px-6 py-10 text-center sm:px-10 sm:py-14">
        <div className="flex justify-center">
          <MarcaConstrucao />
        </div>
        <h2 className="mt-6 text-[22px] font-semibold tracking-[-0.02em] text-[var(--ops-ink)]">
          {titulo}
        </h2>
        <p className="mt-2 text-[14px] text-[var(--ops-ink-muted)]">
          Em construção — disponível na implantação
        </p>

        {item?.conteudo ? (
          <div className="mx-auto mt-8 max-w-md text-left">
            <h3 className="ops-label mb-3 text-center">O que esta seção vai conter</h3>
            <ul className="grid gap-2.5">
              {item.conteudo.map((linha) => (
                <li
                  key={linha}
                  className="flex items-start gap-2.5 rounded-[10px] bg-[var(--ops-surface)] px-3.5 py-2.5 text-[13px] leading-relaxed text-[var(--ops-ink-soft)]"
                >
                  <span
                    aria-hidden
                    className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--ops-accent)]"
                  />
                  {linha}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="mx-auto mt-6 max-w-md text-[13px] leading-relaxed text-[var(--ops-ink-muted)]">
            Esta seção não faz parte do protótipo. Use o menu lateral para voltar às telas
            desenhadas.
          </p>
        )}

        <Link
          to={BASE}
          className="ops-motion mt-9 inline-flex items-center gap-1.5 text-[13.5px] font-medium text-[var(--ops-accent-ink)] hover:gap-2"
        >
          Voltar à visão geral <ArrowRight aria-hidden className="h-3.5 w-3.5" />
        </Link>
      </OpsCard>
    </div>
  );
}
