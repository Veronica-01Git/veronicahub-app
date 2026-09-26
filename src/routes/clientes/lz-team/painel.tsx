import { createFileRoute } from "@tanstack/react-router";

import { PrivateClientWorkspace } from "@/features/private-clients/components/workspace-page";

/**
 * Workspace privado do LZ Team. Mesmo componente e mesmo portão
 * (`getWorkspaceAccess`) de `/clientes/$clientSlug` — só mudou de endereço
 * porque `/clientes/lz-team` virou a página pública do cliente.
 */
export const Route = createFileRoute("/clientes/lz-team/painel")({
  component: LzTeamWorkspaceRoute,
  head: () => ({
    meta: [
      { title: "Veronica Private Clients | Ambiente privado" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function LzTeamWorkspaceRoute() {
  return <PrivateClientWorkspace clientSlug="lz-team" />;
}
