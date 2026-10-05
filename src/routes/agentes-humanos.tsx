import { createFileRoute } from "@tanstack/react-router";
import { HumanAgentsPage } from "@/features/wellness/pages";
export const Route = createFileRoute("/agentes-humanos")({
  component: HumanAgentsPage,
  head: () => ({
    meta: [
      { title: "Agentes Humanos · Verônica" },
      {
        name: "description",
        content:
          "Profissionais com identidade própria, treinamento, nutrição e jornadas conectadas pela Verônica. Crie seu guia educativo gratuito.",
      },
    ],
    links: [{ rel: "canonical", href: "https://veronicahub.com/agentes-humanos" }],
  }),
});
