import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};

// Registra o tipo do router (nunca tinha sido feito neste projeto) — sem
// isso, hooks como Route.useLoaderData() não conseguem resolver o tipo real
// da árvore de rotas e caem silenciosamente em `any`. Peça padrão de
// qualquer app TanStack Start, só nunca foi necessária aqui porque nenhuma
// rota usava `loader` antes do Veronica Wire.
declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
