import { createFileRoute } from "@tanstack/react-router";
import Members from "@/members/Members";
export const Route = createFileRoute("/membros")({
  component: Members,
  head: () => ({
    meta: [
      { title: "Members | Veronica Hub" },
      {
        name: "description",
        content:
          "Novidades em primeira mão, prompts gratuitos e uma comunidade para criar com inteligência artificial.",
      },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
});
