/** Catch-all das subrotas antigas. O redirect real está no layout ao lado. */

import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/preview/express-operations-b/$")({
  beforeLoad: () => {
    throw redirect({ to: "/clientes/express-entulho/operacoes", replace: true });
  },
});
