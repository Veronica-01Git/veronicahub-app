import { createFileRoute, redirect } from "@tanstack/react-router";

// Endereço curto e discreto do jornal. O acervo, o RSS e os links já
// publicados continuam em /blog — aqui só encaminhamos, sem duplicar página.
export const Route = createFileRoute("/noticias")({
  beforeLoad: () => {
    throw redirect({ to: "/blog" });
  },
});
