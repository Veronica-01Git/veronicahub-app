import { createFileRoute } from "@tanstack/react-router";
import { ProfessionalWorkspace } from "@/features/wellness/pages";
export const Route = createFileRoute("/clientes/lee-ricardo/painel")({
  component: () => <ProfessionalWorkspace identity="lee-ricardo" management />,
  head: () => ({
    meta: [{ title: "Gestão · Lee Ricardo" }, { name: "robots", content: "noindex, nofollow" }],
  }),
});
