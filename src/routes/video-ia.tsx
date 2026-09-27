import { createFileRoute, redirect } from "@tanstack/react-router";

// Mantém links antigos e retornos de checkout funcionando durante a mudança de nome.
export const Route = createFileRoute("/video-ia")({
  beforeLoad: ({ location }) => {
    throw redirect({ to: "/studio-veronica", search: location.search, replace: true });
  },
});
