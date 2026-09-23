/**
 * Express Operations — a central operacional da Express Entulho.
 *
 * Saiu de /preview/express-operations-b em 21/09 e passou a viver junto das
 * outras entregas do mesmo cliente. O endereço antigo redireciona para cá,
 * porque o dono já tem aquele link salvo.
 *
 * ACESSO FECHADO. Esta rota é o espaço da Express Entulho, e quem guarda a
 * porta é o **portal de clientes privados** que já existe no Hub
 * (`src/features/private-clients`): o cliente entra em /clientes, digita o
 * número do selo, e a sessão dele libera o próprio workspace.
 *
 * POR QUE NÃO FIZ UM PORTÃO PRÓPRIO. Eu havia escrito um, com login por
 * e-mail liberado por selo, sem saber que este sistema estava sendo
 * construído em paralelo. Dois portões para a mesma porta é pior que um
 * portão imperfeito: dobra o lugar onde uma regra de acesso pode divergir, e
 * um dia alguém conserta um e esquece o outro. O meu saiu; este ficou, porque
 * é mais completo — tem registro por cliente, estado de liberação, painel de
 * administração e confere o selo na fonte canônica.
 *
 * A rota já foi pública por um dia (21/09), enquanto era vitrine de
 * protótipo. Virou espaço de cliente e voltou a ser fechada, com `noindex`.
 * Quem mostra QUEM a Veronica atende é a vitrine em /clientes-veronica, sem
 * abrir o espaço de ninguém.
 *
 * A natureza dos dados não mudou: continuam fictícios, e a TarjaDemo segue no
 * topo de todas as telas dizendo isso.
 */

import { useCallback, useEffect, useState } from "react";
import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import {
  getWorkspaceAccess,
  type WorkspaceAccess,
} from "@/features/private-clients/access.functions";
import { PrivateClientAccountGate } from "@/features/private-clients/components/account-gate";
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
type AccessDeniedReason = Extract<WorkspaceAccess, { ok: false }>["reason"];

function PortaFechada({
  motivo,
  onAccessChanged,
}: {
  motivo: AccessDeniedReason;
  onAccessChanged: () => void | Promise<void>;
}) {
  const accountGateReason = motivo !== "unauthenticated" && motivo !== "forbidden" ? motivo : null;

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
        {accountGateReason ? (
          <div className="mt-5">
            <PrivateClientAccountGate mode={accountGateReason} onAccessChanged={onAccessChanged} />
          </div>
        ) : motivo === "unauthenticated" ? (
          <>
            <p className="mt-3 text-[13.5px] leading-relaxed text-[var(--ops-ink-muted)]">
              Entre no portal de clientes com o número do seu selo. O acesso é por credencial — não
              existe link que abra sem ela.
            </p>
            <Link
              to="/clientes"
              className="mt-5 inline-flex rounded-md bg-[var(--ops-accent)] px-4 py-2 text-[13px] font-medium text-white"
            >
              Entrar com o número do selo
            </Link>
          </>
        ) : (
          <>
            <p className="mt-3 text-[13.5px] leading-relaxed text-[var(--ops-ink-muted)]">
              Você está conectado, mas com o selo de outro cliente. Cada cliente enxerga só o
              próprio espaço.
            </p>
            <Link
              to="/clientes"
              className="mt-5 inline-flex rounded-md border border-[var(--ops-line)] px-4 py-2 text-[13px] text-[var(--ops-ink)]"
            >
              Voltar ao portal
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

/** O slug deste cliente no registro de clientes privados. */
const SLUG = "express-entulho";

function ExpressOperationsLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const resto = pathname.replace(/\/$/, "").slice(BASE.length).replace(/^\//, "");
  const item = NAV_POR_SLUG.get(resto);
  const titulo = item?.rotulo ?? "Seção";

  const [acesso, setAcesso] = useState<WorkspaceAccess | null>(null);
  const verificarAcesso = useCallback(async () => {
    setAcesso(null);
    try {
      setAcesso(await getWorkspaceAccess({ data: { slug: SLUG } }));
    } catch {
      setAcesso({ ok: false, reason: "unauthenticated" });
    }
  }, []);

  useEffect(() => {
    void verificarAcesso();
  }, [verificarAcesso]);

  // Enquanto o servidor não responde, nada do painel é montado. Mostrar o
  // conteúdo e esconder depois seria pior que não mostrar: daria um piscar
  // com o painel do cliente visível.
  if (acesso === null) return <Verificando />;
  if (!acesso.ok) {
    return <PortaFechada motivo={acesso.reason} onAccessChanged={verificarAcesso} />;
  }

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
