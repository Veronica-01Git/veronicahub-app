/**
 * Acesso aos dados da demonstração via React Query.
 *
 * O `queryFn` hoje resolve o mock local. Quando a API existir, a troca é de
 * uma linha por hook — a assinatura que os componentes consomem não muda.
 */

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { expressOpsMock } from "./mock";
import type { ExpressOpsData } from "./types";

export const expressOpsKeys = {
  all: ["express-ops-b"] as const,
  painel: () => [...expressOpsKeys.all, "painel"] as const,
};

/** Troque por `fetch("/api/express-ops").then((r) => r.json())` na implantação. */
async function carregarPainel(): Promise<ExpressOpsData> {
  return expressOpsMock;
}

export function usePainelOps(): UseQueryResult<ExpressOpsData> {
  return useQuery({
    queryKey: expressOpsKeys.painel(),
    queryFn: carregarPainel,
    staleTime: Infinity,
  });
}
