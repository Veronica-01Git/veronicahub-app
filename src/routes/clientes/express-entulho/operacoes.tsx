/**
 * Express Operations — a central operacional da Express Entulho.
 *
 * Saiu de /preview/express-operations-b em 21/09 e passou a viver junto das
 * outras entregas do mesmo cliente. O endereço antigo redireciona para cá,
 * porque o dono já tem aquele link salvo.
 *
 * O QUE MUDOU DE POSTURA, e é o que importa aqui: a rota deixou de ser
 * escondida. Ela entra na listagem /clientes e é indexável. O que NÃO mudou é
 * a natureza dos dados — continuam fictícios, e a TarjaDemo continua no topo
 * de todas as telas dizendo isso. Página pública com número inventado só é
 * honesta enquanto o aviso estiver visível; se um dia entrar dado real de
 * cliente, esta rota volta a ser fechada.
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

export const Route = createFileRoute("/clientes/express-entulho/operacoes")({
  component: ExpressOperationsLayout,
  head: () => ({
    meta: [
      { title: "Express Operations · Express Entulho | Veronica Hub" },
      {
        name: "description",
        content:
          "Central operacional da Express Entulho: atendimento por WhatsApp, aprovações humanas, frota e regras do agente. Demonstração visual com dados fictícios.",
      },
      { property: "og:title", content: "Express Operations · Express Entulho" },
      {
        property: "og:description",
        content:
          "Painel de operações e agente de WhatsApp. Projeto registrado VH-AUT-WA-2026-000001 · YO LAB & CO.",
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
  "regras-do-agente": "Preços por material e conversa com o agente",
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
