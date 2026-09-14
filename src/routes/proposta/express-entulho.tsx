import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/proposta/express-entulho")({
  beforeLoad: () => {
    throw redirect({
      to: "/clientes/express-entulho/proposta",
      replace: true,
    });
  },
});
