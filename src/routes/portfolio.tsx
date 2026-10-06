import { createFileRoute } from "@tanstack/react-router";
import { PortfolioExperience } from "@/portfolio/components/PortfolioExperience";

export const Route = createFileRoute("/portfolio")({
  component: PortfolioExperience,
  head: () => ({
    meta: [
      { title: "Veronica Portfolio · Seu portfólio gratuito, seu próximo site" },
      {
        name: "description",
        content:
          "Crie seu portfólio gratuito, visualize em computador e celular e solicite um site personalizado com investimento conforme seu projeto.",
      },
      { property: "og:title", content: "Veronica Portfolio" },
      {
        property: "og:image",
        content: "https://veronicahub.com/images/yo-worlds/portfolio-1600.webp",
      },
      { property: "og:description", content: "Sua trajetória projetada para abrir portas." },
    ],
    links: [
      {
        rel: "preload",
        as: "image",
        href: "/images/yo-worlds/portfolio-1280.webp",
        imageSrcSet:
          "/images/yo-worlds/portfolio-640.webp 640w, /images/yo-worlds/portfolio-1280.webp 1280w, /images/yo-worlds/portfolio-1600.webp 1600w",
        imageSizes: "100vw",
        type: "image/webp",
      },
    ],
  }),
});
