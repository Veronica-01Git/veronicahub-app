import { createFileRoute } from "@tanstack/react-router";
import { HumanAgentsPage } from "@/features/wellness/human-agents-page";

const TITLE = "Agentes Humanos · Treino e nutrição com a Verônica | Veronica Hub";
const DESCRIPTION =
  "Profissionais de treino e nutrição com identidade própria. Responda à avaliação, receba um guia educativo gratuito e tenha seu plano revisado pelo especialista.";
const URL = "https://veronicahub.com/agentes-humanos";
const IMAGE = "https://veronicahub.com/images/yo-worlds/wellness-1280.webp";

export const Route = createFileRoute("/agentes-humanos")({
  component: HumanAgentsPage,
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: URL },
      { property: "og:title", content: "Agentes Humanos · Pessoas transformam" },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:image", content: IMAGE },
      { property: "og:image:width", content: "1280" },
      { property: "og:image:height", content: "720" },
      {
        property: "og:image:alt",
        content: "Profissional acompanha uma aluna em um estúdio de treino YO Lab & Co.",
      },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Agentes Humanos · Pessoas transformam" },
      { name: "twitter:description", content: DESCRIPTION },
      { name: "twitter:image", content: IMAGE },
    ],
    links: [{ rel: "canonical", href: URL }],
  }),
});
