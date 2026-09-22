/** Visão geral — grid de 12 colunas. */

import { createFileRoute } from "@tanstack/react-router";
import {
  CardAgendaAmanha,
  CardAprovacoes,
  CardFinanceiro,
  CardFrota,
  CardKpi,
  CardOperacoesDia,
  CardRotas,
} from "@/features/express-ops-b/components/overview";
import { usePainelOps } from "@/features/express-ops-b/data/queries";
import { EsqueletoPainel } from "@/features/express-ops-b/components/esqueleto";

export const Route = createFileRoute("/clientes/express-entulho/operacoes/")({
  component: VisaoGeral,
});

function VisaoGeral() {
  const { data } = usePainelOps();
  if (!data) return <EsqueletoPainel />;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-8 lg:grid-cols-12">
      {data.kpis.map((kpi) => (
        <div key={kpi.id} className="md:col-span-4 lg:col-span-3">
          <CardKpi kpi={kpi} />
        </div>
      ))}

      <div className="md:col-span-8 lg:col-span-8">
        <CardOperacoesDia progresso={data.progressoDia} />
      </div>
      <div className="md:col-span-8 lg:col-span-4">
        <CardFrota frota={data.frota} cacambas={data.cacambas} />
      </div>

      <div className="md:col-span-8 lg:col-span-8">
        <CardAprovacoes itens={data.aprovacoes} />
      </div>
      <div className="md:col-span-8 lg:col-span-4">
        <CardRotas paradas={data.proximasRotas} />
      </div>

      <div className="md:col-span-8 lg:col-span-8">
        <CardFinanceiro financeiro={data.financeiro} />
      </div>
      <div className="md:col-span-8 lg:col-span-4">
        <CardAgendaAmanha agenda={data.agendaAmanha} />
      </div>
    </div>
  );
}
