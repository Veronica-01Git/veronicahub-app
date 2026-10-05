import { createFileRoute } from "@tanstack/react-router";
import { ProfessionalWorkspace } from "@/features/wellness/pages";
export const Route = createFileRoute("/clientes/lee-ricardo/membros")({
  component: () => <ProfessionalWorkspace identity="lee-ricardo" />,
  head: () => ({
    meta: [
      { title: "Minha jornada · Lee Ricardo" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});
