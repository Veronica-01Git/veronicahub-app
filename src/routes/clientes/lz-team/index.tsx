import { createFileRoute } from "@tanstack/react-router";
import { ProfessionalHome } from "@/features/wellness/pages";
export const Route = createFileRoute("/clientes/lz-team/")({
  component: () => <ProfessionalHome identity="lz-team" />,
  head: () => ({
    meta: [
      { title: "LZ Training Club · Lucas Tomaz" },
      {
        name: "description",
        content:
          "Treinamento com identidade, técnica e acompanhamento de Lucas Tomaz. Crie seu guia inicial gratuito e conheça sua jornada LZ.",
      },
    ],
    links: [{ rel: "canonical", href: "https://veronicahub.com/clientes/lz-team" }],
  }),
});
