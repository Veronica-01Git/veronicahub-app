import { createFileRoute } from "@tanstack/react-router";
import { PortfolioExperience } from "@/portfolio/components/PortfolioExperience";

export const Route = createFileRoute("/portfolio")({
  component: PortfolioExperience,
  head: () => ({
    meta: [
      { title: "Veronica Portfolio · Monte a prévia do seu portfólio" },
      {
        name: "description",
        content:
          "Organize sua trajetória, projetos e competências em uma prévia profissional gratuita. Revise o resultado em desktop e celular.",
      },
      { property: "og:title", content: "Veronica Portfolio" },
      { property: "og:description", content: "Sua trajetória projetada para abrir portas." },
    ],
  }),
});
