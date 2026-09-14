import { createFileRoute } from "@tanstack/react-router";
import { ExpressOperationsDemo } from "@/components/express-operations/ExpressOperationsDemo";

export const Route = createFileRoute("/clientes/express-entulho/operacoes-demo")({
  component: ExpressOperationsDemo,
  head: () => ({
    meta: [
      { title: "Express Operations · Demonstração | YO LAB & CO." },
      {
        name: "description",
        content:
          "Demonstração visual da central operacional e do agente de atendimento da Express Entulho.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Express Operations · Demonstração operacional" },
      {
        property: "og:description",
        content: "Projeto registrado VH-AUT-WA-2026-000001 · YO LAB & CO. e Inteligências Veronica.",
      },
    ],
  }),
});
