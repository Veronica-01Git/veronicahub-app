/**
 * Express Operations — demonstração visual (variante B).
 *
 * Rota isolada e não indexável. Não aparece em nenhum menu, nav ou listagem
 * do Hub: só é alcançável por URL direta. Nenhum dado real.
 */

import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import {
  RodapeProcedencia,
  Sidebar,
  TarjaDemo,
  Topbar,
} from "@/features/express-ops-b/components/shell";
import { BASE, NAV_POR_SLUG } from "@/features/express-ops-b/nav";
import "@/features/express-ops-b/tokens.css";

export const Route = createFileRoute("/preview/express-operations-b")({
  component: ExpressOperationsLayout,
  head: () => ({
    meta: [
      { title: "Express Operations · Protótipo visual" },
      { name: "robots", content: "noindex, nofollow, noarchive, nosnippet" },
      { name: "googlebot", content: "noindex, nofollow" },
      {
        name: "description",
        content: "Demonstração visual com dados fictícios. Não é sistema em operação.",
      },
    ],
  }),
});

const APOIO: Record<string, string> = {
  "": "Sexta-feira, 14 de setembro · dados fictícios",
  atendimento: "Conversas do WhatsApp atendidas pelo agente",
  aprovacoes: "Decisões que a IA escalou para um humano",
  "operacoes-hoje": "Entregas e retiradas do dia",
  cacambas: "Inventário e ciclo de vida",
};

function ExpressOperationsLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const resto = pathname.replace(/\/$/, "").slice(BASE.length).replace(/^\//, "");
  const item = NAV_POR_SLUG.get(resto);
  const titulo = item?.rotulo ?? "Seção";

  return (
    <div className="express-ops-b min-h-screen">
      <TarjaDemo />
      <div className="grid md:grid-cols-[72px_minmax(0,1fr)] lg:grid-cols-[264px_minmax(0,1fr)]">
        <Sidebar />
        <div className="flex min-h-[calc(100vh-37px)] min-w-0 flex-col">
          <Topbar titulo={titulo} apoio={APOIO[resto]} />
          <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <Outlet />
          </main>
          <RodapeProcedencia />
        </div>
      </div>
    </div>
  );
}
