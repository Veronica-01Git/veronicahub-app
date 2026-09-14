/**
 * Navegação do Express Operations: as 16 seções.
 *
 * Cinco estão desenhadas por completo; as outras onze caem no catch-all e
 * mostram o que vão conter na implantação. Os ícones vêm do lucide-react que
 * o repo já usa — SVG inline, sem dependência nova e sem ícone duplicado.
 */

import {
  BarChart3,
  Bot,
  Building2,
  CalendarClock,
  CalendarDays,
  Container,
  FileText,
  LayoutDashboard,
  Map as MapIcon,
  MessagesSquare,
  ShieldCheck,
  Truck,
  UsersRound,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type ItemNav = {
  /** Slug da rota. `""` é o índice da seção. */
  readonly slug: string;
  readonly rotulo: string;
  readonly icone: LucideIcon;
  /** Pronta = tela desenhada por completo. */
  readonly pronta: boolean;
  /** O que a seção vai conter — aparece no estado "Em construção". */
  readonly conteudo?: readonly string[];
};

export const ITENS_NAV: readonly ItemNav[] = [
  { slug: "", rotulo: "Visão geral", icone: LayoutDashboard, pronta: true },
  { slug: "atendimento", rotulo: "Central de atendimento", icone: MessagesSquare, pronta: true },
  { slug: "aprovacoes", rotulo: "Aprovações humanas", icone: ShieldCheck, pronta: true },
  {
    slug: "agenda",
    rotulo: "Agenda",
    icone: CalendarDays,
    pronta: false,
    conteudo: [
      "Calendário de entregas e retiradas por semana e por mês",
      "Janelas de atendimento por bairro e por veículo",
      "Bloqueios de feriado, chuva e manutenção",
      "Reagendamento com aviso automático ao cliente",
    ],
  },
  { slug: "operacoes-hoje", rotulo: "Operações de hoje", icone: Truck, pronta: true },
  {
    slug: "planejamento-amanha",
    rotulo: "Planejamento de amanhã",
    icone: CalendarClock,
    pronta: false,
    conteudo: [
      "Fechamento do dia seguinte com conferência de conflitos",
      "Distribuição de carga por motorista e por veículo",
      "Sugestão de ordem de parada por região",
      "Confirmação em massa pelo WhatsApp na véspera",
    ],
  },
  {
    slug: "veiculos",
    rotulo: "Veículos",
    icone: Truck,
    pronta: false,
    conteudo: [
      "Cadastro de frota com placa, capacidade e ano",
      "Disponibilidade diária e status de manutenção",
      "Documentação: licenciamento, seguro e vistoria",
      "Custo por quilômetro e consumo por rota",
    ],
  },
  { slug: "cacambas", rotulo: "Caçambas", icone: Container, pronta: true },
  {
    slug: "motoristas",
    rotulo: "Motoristas",
    icone: UsersRound,
    pronta: false,
    conteudo: [
      "Cadastro com CNH, categoria e validade",
      "Escala do dia e histórico de operações",
      "Aplicativo do motorista com comprovante por foto",
      "Indicadores de pontualidade por profissional",
    ],
  },
  {
    slug: "mapa-e-rotas",
    rotulo: "Mapa e rotas",
    icone: MapIcon,
    pronta: false,
    conteudo: [
      "Mapa ao vivo com posição da frota",
      "Roteirização por proximidade e janela de horário",
      "Área atendida com faixas de preço por distância",
      "Histórico de trajeto por operação",
    ],
  },
  {
    slug: "clientes",
    rotulo: "Clientes",
    icone: Building2,
    pronta: false,
    conteudo: [
      "Ficha com endereços recorrentes e contatos",
      "Histórico completo de pedidos e conversas",
      "Condições comerciais por cliente e por obra",
      "Separação entre pessoa física, obra e construtora",
    ],
  },
  {
    slug: "documentos",
    rotulo: "Documentos",
    icone: FileText,
    pronta: false,
    conteudo: [
      "CTR e MTR por operação, com numeração controlada",
      "Contrato de locação e termo de responsabilidade",
      "Comprovantes de entrega e retirada por foto",
      "Exportação para prestação de contas ambiental",
    ],
  },
  {
    slug: "financeiro",
    rotulo: "Financeiro",
    icone: Wallet,
    pronta: false,
    conteudo: [
      "Pedidos originados pelo agente e por canal",
      "Cobrança por Pix, link de pagamento e faturamento",
      "Inadimplência e régua de cobrança automática",
      "Fechamento mensal por cliente e por tipo de resíduo",
    ],
  },
  {
    slug: "regras-do-agente",
    rotulo: "Regras do agente",
    icone: Bot,
    pronta: false,
    conteudo: [
      "Tabela de preços, prazos e área atendida",
      "Alçada: o que a IA decide sozinha e o que escala",
      "Tom de voz e respostas obrigatórias",
      "Horário de atendimento e resposta fora do expediente",
    ],
  },
  {
    slug: "relatorios",
    rotulo: "Relatórios",
    icone: BarChart3,
    pronta: false,
    conteudo: [
      "Conversão de conversa em pedido, por origem",
      "Tempo médio de resposta e de resolução",
      "Giro de caçamba e ociosidade por unidade",
      "Exportação em planilha e envio agendado",
    ],
  },
  {
    slug: "equipe-e-permissoes",
    rotulo: "Equipe e permissões",
    icone: UsersRound,
    pronta: false,
    conteudo: [
      "Usuários por papel: atendimento, operação e gestão",
      "Alçada de aprovação por pessoa e por valor",
      "Registro de auditoria de quem decidiu o quê",
      "Acesso revogável e sessão com expiração",
    ],
  },
];

export const NAV_POR_SLUG = new Map(ITENS_NAV.map((i) => [i.slug, i]));

export const BASE = "/preview/express-operations-b";

export function hrefDe(slug: string): string {
  return slug === "" ? BASE : `${BASE}/${slug}`;
}
