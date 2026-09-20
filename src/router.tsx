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
    // Transição contínua entre rotas em vez de corte seco: o roteador
    // embrulha a troca de tela em document.startViewTransition, e o navegador
    // anima a diferença entre o antes e o depois. O que morre e o que nasce é
    // decidido pelo CSS, em src/styles.css (bloco "View Transitions").
    //
    // MELHORIA PROGRESSIVA DE VERDADE: em navegador sem suporte o próprio
    // roteador cai na navegação normal, então nada aqui pode quebrar a troca
    // de página. E quem pede prefers-reduced-motion recebe corte seco por
    // CSS, que é o comportamento correto — transição é enfeite, navegar não é.
    defaultViewTransition: true,
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
