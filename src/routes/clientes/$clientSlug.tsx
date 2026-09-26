import { createFileRoute } from "@tanstack/react-router";

import { PrivateClientWorkspace } from "@/features/private-clients/components/workspace-page";

export const Route = createFileRoute("/clientes/$clientSlug")({
  component: PrivateClientWorkspaceRoute,
  head: () => ({
    meta: [
      { title: "Veronica Private Clients | Ambiente privado" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function PrivateClientWorkspaceRoute() {
  const { clientSlug } = Route.useParams();
  return <PrivateClientWorkspace clientSlug={clientSlug} />;
}
