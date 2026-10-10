import { createFileRoute, redirect } from "@tanstack/react-router";

// "Foguete Amarelo" foi o nome de trabalho da Veronica Pharma. O endereço
// antigo continua abrindo a página para quem já recebeu o link.
export const Route = createFileRoute("/foguete-amarelo")({
  beforeLoad: ({ location }) => {
    throw redirect({ to: "/veronica-pharma", search: location.search, replace: true });
  },
});
