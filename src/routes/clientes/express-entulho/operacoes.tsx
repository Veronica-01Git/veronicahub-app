/**
 * Express Operations — a central operacional da Express Entulho.
 *
 * Saiu de /preview/express-operations-b em 21/09 e passou a viver junto das
 * outras entregas do mesmo cliente. O endereço antigo redireciona para cá,
 * porque o dono já tem aquele link salvo.
 *
 * ACESSO FECHADO desde 22/09. Esta rota é o **endereço oficial** da Express
 * Entulho no Hub, e só o dono do selo entra — mais quem dá suporte. A
 * verificação é por identidade, em `acesso-cliente.server.ts`: login por
 * e-mail, e o e-mail precisa estar liberado para o selo.
 *
 * A rota já foi pública por um dia (21/09), enquanto era vitrine de
 * protótipo. Virou espaço de cliente e voltou a ser fechada, com `noindex`.
 * Quem fica pública é a listagem /clientes, que mostra QUEM a Veronica
 * atende sem abrir o painel de ninguém.
 *
 * A natureza dos dados não mudou: continuam fictícios, e a TarjaDemo segue no
 * topo de todas as telas dizendo isso.
 */

import { useEffect, useState } from "react";
import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { autorizarAcessoCliente, type Autorizacao } from "@/lib/acesso-cliente-server";
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
      // Espaço de cliente: fora do índice de busca. A vitrine é /clientes.
      { name: "robots", content: "noindex, nofollow, noarchive, nosnippet" },
      { name: "googlebot", content: "noindex, nofollow" },
      {
        name: "description",
        content: "Endereço oficial da Express Entulho no Veronica Hub. Acesso restrito.",
      },
    ],
  }),
});

/** Enquanto o servidor decide. Sem piscar conteúdo do cliente. */
function Verificando() {
  return (
    <div className="express-ops-b flex min-h-screen items-center justify-center p-6">
      <p className="text-[13px] text-[var(--ops-ink-muted)]">Verificando seu acesso…</p>
    </div>
  );
}

/**
 * Sem acesso.
 *
 * As duas causas recebem texto diferente porque a ação é diferente: quem não
 * está logado tem o que fazer agora; quem está logado com outro e-mail não
 * tem, e mandá-lo tentar de novo seria enrolação.
 *
 * O texto NÃO diz quem tem acesso, e não confirma nem nega que este selo
 * exista para tal pessoa. Página de acesso negado que conta quem entra é uma
 * lista de alvos.
 */
function PortaFechada({ motivo }: { motivo: "sem-sessao" | "sem-permissao" }) {
  return (
    <div className="express-ops-b flex min-h-screen items-center justify-center p-6">
      <div className="ops-card max-w-md p-7">
        <div className="flex items-center gap-2 text-[var(--ops-ink-muted)]">
          <Lock className="h-4 w-4" />
          <span className="text-[11px] uppercase tracking-[.14em]">Acesso restrito</span>
        </div>
        <h1 className="mt-3 text-[20px] font-semibold leading-tight text-[var(--ops-ink)]">
          Este é o espaço da Express Entulho
        </h1>
        {motivo === "sem-sessao" ? (
          <>
            <p className="mt-3 text-[13.5px] leading-relaxed text-[var(--ops-ink-muted)]">
              Entre com o e-mail liberado para este cliente. O acesso é por identidade — não existe
              link que abra sem login.
            </p>
            <Link
              to="/clientes"
              className="mt-5 inline-flex rounded-md bg-[var(--ops-accent)] px-4 py-2 text-[13px] font-medium text-white"
            >
              Ir para a lista de clientes
            </Link>
          </>
        ) : (
          <>
            <p className="mt-3 text-[13.5px] leading-relaxed text-[var(--ops-ink-muted)]">
              Você está conectado, mas esta conta não está liberada para este cliente. Se deveria
              estar, fale com a YO LAB &amp; CO.
            </p>
            <Link
              to="/clientes"
              className="mt-5 inline-flex rounded-md border border-[var(--ops-line)] px-4 py-2 text-[13px] text-[var(--ops-ink)]"
            >
              Ver os clientes da Veronica
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

const APOIO: Record<string, string> = {
  "": "Sexta-feira, 14 de setembro · dados fictícios",
  atendimento: "Conversas do WhatsApp atendidas pelo agente",
  aprovacoes: "Decisões que a IA escalou para um humano",
  "operacoes-hoje": "Entregas e retiradas do dia",
  cacambas: "Inventário e ciclo de vida",
  "regras-do-agente": "Preços por material e conversa com o agente",
};

const SELO = "VH-AUT-WA-2026-000001";

function ExpressOperationsLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const resto = pathname.replace(/\/$/, "").slice(BASE.length).replace(/^\//, "");
  const item = NAV_POR_SLUG.get(resto);
  const titulo = item?.rotulo ?? "Seção";

  const [acesso, setAcesso] = useState<Autorizacao | null>(null);
  useEffect(() => {
    autorizarAcessoCliente({ data: SELO })
      .then(setAcesso)
      .catch(() => setAcesso({ ok: false, motivo: "sem-sessao" }));
  }, []);

  // Enquanto o servidor não responde, nada do painel é montado. Mostrar o
  // conteúdo e esconder depois seria pior que não mostrar: daria um piscar
  // com o painel do cliente visível.
  if (acesso === null) return <Verificando />;
  if (!acesso.ok) return <PortaFechada motivo={acesso.motivo} />;

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
