/** Carregamento. Reaproveita o Skeleton do kit do repo. */

import { Skeleton } from "@/components/ui/skeleton";

export function EsqueletoPainel() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-8 lg:grid-cols-12" aria-busy="true">
      <span className="sr-only">Carregando painel</span>
      {[0, 1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-[124px] rounded-xl md:col-span-4 lg:col-span-3" />
      ))}
      <Skeleton className="h-[240px] rounded-xl md:col-span-8 lg:col-span-8" />
      <Skeleton className="h-[240px] rounded-xl md:col-span-8 lg:col-span-4" />
    </div>
  );
}

export function EsqueletoLista({ linhas = 6 }: { linhas?: number }) {
  return (
    <div className="grid gap-2.5" aria-busy="true">
      <span className="sr-only">Carregando</span>
      {Array.from({ length: linhas }, (_, i) => (
        <Skeleton key={i} className="h-16 rounded-xl" />
      ))}
    </div>
  );
}
