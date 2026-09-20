import { createFileRoute } from "@tanstack/react-router";
import { PortfolioExperience } from "@/portfolio/components/PortfolioExperience";

export const Route = createFileRoute("/portfolio")({
  component: PortfolioExperience,
  head: () => ({
    meta: [
      { title: "Veronica Portfolio · Portfólios profissionais com IA" },
      {
        name: "description",
        content:
          "Crie, navegue e analise um portfólio profissional com a Veronica. Primeira geração gratuita.",
      },
      { property: "og:title", content: "Veronica Portfolio" },
      { property: "og:description", content: "Sua trajetória projetada para abrir portas." },
    ],
  }),
});
