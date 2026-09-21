import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/clientes/admin")({
  component: PrivateClientsAdmin,
  head: () => ({ meta: [{ title: "Admin · Veronica Private Clients" }, { name: "robots", content: "noindex, nofollow" }] }),
});

function PrivateClientsAdmin() {
  return <main>Veronica Private Clients Admin</main>;
}
