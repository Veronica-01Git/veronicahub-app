/**
 * Seções administrativas complementares.
 *
 * Nenhuma tela inventa dado operacional. O que foi confirmado aparece como
 * regra; o que depende de ERP, GPS, agenda ou cadastro real aparece como
 * pendência explícita.
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CalendarDays,
  CheckCircle2,
  CircleDashed,
  Clock3,
  ExternalLink,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { OpsCard, SectionTitle } from "@/features/express-ops-b/components/primitives";
import { BASE, NAV_POR_SLUG, hrefDe } from "@/features/express-ops-b/nav";
import { REGRAS_EXPRESS_ENTULHO as R } from "@/lib/whatsapp-rules";

export const Route = createFileRoute("/clientes/express-entulho/operacoes/$secao")({
  component: SecaoOperacional,
});

type SecaoInfo = {
  readonly resumo: string;
  readonly confirmados: readonly string[];
  readonly pendencias: readonly string[];
  readonly link?: { readonly rotulo: string; readonly href: string };
};

const SECOES: Record<string, SecaoInfo> = {
  agenda: {
    resumo: "Regras reais de recebimento de pedidos e capacidade de segunda-feira.",
    confirmados: [
      `Agenda operacional de ${R.agenda.diasOperacao}.`,
      `No sábado, atendimento/agendamento até ${R.agenda.sabadoAte}.`,
      `No fim de semana, a agenda de segunda-feira continua aberta para até ${R.agenda.limitePedidosSegundaFimDeSemana} pedidos.`,
      "O preço não muda por cidade; a distância altera somente a janela logística.",
    ],
    pendencias: [
      "Contagem em tempo real dos pedidos de segunda depende da integração com a agenda/ERP.",
      "Feriados e bloqueios extraordinários ainda precisam de fonte operacional.",
    ],
    link: { rotulo: "Ver regras do agente", href: hrefDe("regras-do-agente") },
  },
  "planejamento-amanha": {
    resumo: "Pré-fechamento do próximo dia sem prometer janela que o sistema ainda não confirmou.",
    confirmados: [
      "Segunda-feira pode receber até 40 pedidos captados durante o fim de semana.",
      "Entregas mais distantes da central de Itajaí podem exigir até 1 hora ou 1 dia a mais.",
      "O valor comercial permanece o mesmo nas cidades atendidas.",
    ],
    pendencias: [
      "Distribuição por veículo e motorista depende do cadastro real da frota.",
      "Otimização automática de rota entra depois da fonte de localização/agenda.",
    ],
    link: { rotulo: "Abrir agenda", href: hrefDe("agenda") },
  },
  veiculos: {
    resumo: "Inventário da frota sem preencher modelo, placa ou disponibilidade por suposição.",
    confirmados: ["A Express informou 7 veículos no total."],
    pendencias: [
      "Modelo de cada veículo.",
      "Placa de cada veículo.",
      "Capacidade e disponibilidade por turno.",
      "Status de manutenção.",
    ],
  },
  motoristas: {
    resumo: "Escala de motoristas pronta para receber dados reais.",
    confirmados: ["A frota total tem 7 veículos."],
    pendencias: [
      "Nomes dos motoristas autorizados.",
      "Vínculo motorista ↔ veículo.",
      "Escala e disponibilidade por dia.",
      "Documentos e vencimentos, se a Express quiser controlar por aqui.",
    ],
  },
  "mapa-e-rotas": {
    resumo: "Regra logística centralizada em Itajaí, sem alterar preço por deslocamento.",
    confirmados: [
      "Central operacional em Itajaí.",
      "Mesmo preço nas cidades atendidas.",
      "Quanto maior a distância, a entrega pode levar até 1 hora ou 1 dia a mais.",
    ],
    pendencias: [
      "GPS/telemetria dos veículos.",
      "Matriz real de tempo por destino.",
      "Ordem automática de paradas.",
    ],
  },
  clientes: {
    resumo: "Cadastro de clientes separado do histórico original do WhatsApp.",
    confirmados: [
      "O modo assistido permite colar a mensagem e gerar resposta sem conectar o WhatsApp.",
      "Nenhuma mensagem, contato ou mídia do WhatsApp original é apagada ou alterada.",
    ],
    pendencias: [
      "Importação/sincronização oficial de contatos somente quando o canal aprovado estiver definido.",
      "Cadastro recorrente de obras e endereços depende da fonte operacional da Express.",
    ],
    link: { rotulo: "Abrir atendimento assistido", href: hrefDe("atendimento") },
  },
  documentos: {
    resumo: "Controle documental preparado, sem emissão automática não autorizada.",
    confirmados: [
      "Documentos financeiros e comprovantes permanecem sob revisão humana.",
      "O agente não envia chave Pix nem valida comprovante sozinho.",
    ],
    pendencias: [
      "Fonte oficial de CTR/MTR.",
      "Templates de contrato/termo usados pela Express.",
      "Integração de emissão e armazenamento.",
    ],
  },
  financeiro: {
    resumo: "Financeiro permanece humano até existir integração e autorização específicas.",
    confirmados: [
      "Pagamento aceito conforme regra comercial cadastrada.",
      "O agente pode informar formas de pagamento, mas não movimenta dinheiro.",
    ],
    pendencias: [
      "Integração com cobrança/ERP.",
      "Tabela de multa e diária extra ainda sem confirmação.",
      "Conciliação e emissão fiscal.",
    ],
  },
  relatorios: {
    resumo: "Indicadores preparados para dados reais, sem fabricar métricas.",
    confirmados: [
      "Relatórios só devem exibir contagens derivadas de eventos reais.",
      "A trilha do agente separa atendimento, escalonamento e decisão humana.",
    ],
    pendencias: [
      "Fonte persistente de agenda e pedidos.",
      "Eventos reais de entrega/retirada.",
      "Tempo de resposta do canal oficial.",
    ],
  },
  "equipe-e-permissoes": {
    resumo: "Acesso do cliente já passa pelo portal privado; papéis internos ainda serão cadastrados.",
    confirmados: [
      "O workspace da Express é restrito por credencial do cliente.",
      "Ações sensíveis continuam exigindo humano.",
    ],
    pendencias: [
      "Usuários internos da Express.",
      "Papéis: atendimento, operação e gestão.",
      "Alçada individual por tipo de decisão.",
    ],
  },
};

function Linha({ texto, ok }: { texto: string; ok: boolean }) {
  return (
    <li className="flex items-start gap-2.5 rounded-[10px] bg-[var(--ops-surface)] px-3.5 py-2.5 text-[13px] leading-relaxed text-[var(--ops-ink-soft)]">
      {ok ? (
        <CheckCircle2 aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-[var(--ops-ok)]" />
      ) : (
        <CircleDashed aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-[var(--ops-warn)]" />
      )}
      <span>{texto}</span>
    </li>
  );
}

function SecaoOperacional() {
  const { secao } = Route.useParams();
  const item = NAV_POR_SLUG.get(secao);
  const info = SECOES[secao];

  if (!item || !info) {
    return (
      <OpsCard as="section">
        <SectionTitle titulo="Seção não encontrada" apoio="Use o menu para voltar ao painel." />
        <Link to={BASE} className="text-[13px] font-medium text-[var(--ops-accent-ink)]">
          Voltar à visão geral
        </Link>
      </OpsCard>
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_330px]">
      <div className="grid content-start gap-4">
        <OpsCard as="section">
          <SectionTitle titulo={item.rotulo} apoio={info.resumo} />
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--ops-ok-soft)] px-2.5 py-1 text-[11.5px] font-medium text-[var(--ops-ok)]">
              <ShieldCheck aria-hidden className="h-3.5 w-3.5" />
              Regras confirmadas
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--ops-warn-soft)] px-2.5 py-1 text-[11.5px] font-medium text-[var(--ops-warn)]">
              <Clock3 aria-hidden className="h-3.5 w-3.5" />
              Dados operacionais pendentes
            </span>
          </div>
        </OpsCard>

        <OpsCard as="section">
          <SectionTitle titulo="Confirmado" apoio="Informações que podem orientar a operação agora" />
          <ul className="grid gap-2">
            {info.confirmados.map((texto) => <Linha key={texto} texto={texto} ok />)}
          </ul>
        </OpsCard>

        <OpsCard as="section">
          <SectionTitle titulo="Falta conectar ou cadastrar" apoio="Nenhum valor é preenchido por suposição" />
          <ul className="grid gap-2">
            {info.pendencias.map((texto) => <Linha key={texto} texto={texto} ok={false} />)}
          </ul>
        </OpsCard>
      </div>

      <aside className="grid h-fit content-start gap-4">
        <OpsCard>
          <div className="flex items-center gap-2">
            {secao === "agenda" || secao === "planejamento-amanha" ? (
              <CalendarDays aria-hidden className="h-5 w-5 text-[var(--ops-accent)]" />
            ) : (
              <Truck aria-hidden className="h-5 w-5 text-[var(--ops-accent)]" />
            )}
            <h2 className="text-[14px] font-semibold text-[var(--ops-ink)]">Estado da implantação</h2>
          </div>
          <p className="mt-3 text-[12.5px] leading-relaxed text-[var(--ops-ink-muted)]">
            A tela está utilizável para consulta das regras confirmadas. Ações que exigem fonte real
            permanecem bloqueadas até a integração correspondente.
          </p>
          {info.link ? (
            <Link
              to={info.link.href}
              className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--ops-accent-ink)]"
            >
              {info.link.rotulo}
              <ExternalLink aria-hidden className="h-3.5 w-3.5" />
            </Link>
          ) : null}
        </OpsCard>
      </aside>
    </div>
  );
}
