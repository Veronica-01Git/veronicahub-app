import { createFileRoute } from "@tanstack/react-router";
import { ProfessionalHome } from "@/features/wellness/pages";
export const Route = createFileRoute("/clientes/lee-ricardo/")({
  component: () => <ProfessionalHome identity="lee-ricardo" />,
  head: () => ({
    meta: [
      { title: "Lee Ricardo · Nutrição | Veronica" },
      {
        name: "description",
        content:
          "Conheça Lee Ricardo e prepare sua primeira conversa sobre nutrição, hábitos e rotina.",
      },
    ],
    links: [{ rel: "canonical", href: "https://veronicahub.com/clientes/lee-ricardo" }],
  }),
});
