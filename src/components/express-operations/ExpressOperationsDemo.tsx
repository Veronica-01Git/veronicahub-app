import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowUpRight,
  Bot,
  Building2,
  CalendarDays,
  Check,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  FileCheck2,
  Headphones,
  Menu,
  MessageCircle,
  MoreHorizontal,
  Navigation,
  PackageCheck,
  Route as RouteIcon,
  Search,
  ShieldCheck,
  Sparkles,
  Truck,
  UserCheck,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const serial = "VH-AUT-WA-2026-000001";

const conversations = [
  {
    id: "EX-024",
    name: "Cliente 024",
    summary: "Questionou a previsão da entrega",
    time: "há 2 min",
    status: "Ação necessária",
    tone: "critical",
  },
  {
    id: "EX-031",
    name: "Cliente 031",
    summary: "Enviou localização e fotos da obra",
    time: "há 6 min",
    status: "Agente conduzindo",
    tone: "active",
  },
  {
    id: "EX-018",
    name: "Cliente 018",
    summary: "Pagamento identificado",
    time: "há 11 min",
    status: "Pronto para agendar",
    tone: "success",
  },
];

const routeStops = [
  { time: "07:30", area: "São João · Itajaí", task: "Entrega", item: "Caçamba menor" },
  { time: "09:10", area: "Centro · Itajaí", task: "Retirada", item: "Tambor" },
  { time: "11:00", area: "Fazenda · Itajaí", task: "Troca", item: "Porte a confirmar" },
];

const fleetRows = [
  { label: "Tambor", total: "A cadastrar", available: "—", inUse: "—" },
  { label: "Caçamba menor", total: "A cadastrar", available: "—", inUse: "—" },
  { label: "Caçamba grande", total: "A cadastrar", available: "—", inUse: "—" },
];

function BrandMark() {
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#0b8f4d] text-white shadow-[0_8px_24px_rgba(11,143,77,.2)]">
      <span className="font-display text-lg leading-none">E</span>
    </div>
  );
}

function StatusPill({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "success" | "warning" | "critical" | "active" }) {
  const tones = {
    neutral: "bg-black/[.045] text-black/55",
    success: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200/70",
    warning: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200/80",
    critical: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200/80",
    active: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200/70",
  };

  return (
    <span className={`inline-flex min-h-7 items-center rounded-full px-3 text-[12px] font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}

function MetricCard({ icon, label, value, note, tone = "default" }: { icon: ReactNode; label: string; value: string; note: string; tone?: "default" | "green" | "red" }) {
  return (
    <article className={`group rounded-[24px] border p-5 transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_50px_rgba(18,35,27,.08)] ${tone === "green" ? "border-emerald-200/70 bg-emerald-50/70" : tone === "red" ? "border-red-200/80 bg-red-50/60" : "border-black/[.07] bg-white"}`}>
      <div className="flex items-start justify-between gap-4">
        <div className={`flex h-10 w-10 items-center justify-center rounded-[14px] ${tone === "green" ? "bg-emerald-600 text-white" : tone === "red" ? "bg-red-600 text-white" : "bg-black/[.045] text-black/65"}`}>
          {icon}
        </div>
        <ArrowUpRight className="h-4 w-4 text-black/25 transition group-hover:text-black/60" />
      </div>
      <p className="mt-6 text-[14px] font-medium text-black/45">{label}</p>
      <p className="mt-1 font-display text-[32px] tracking-[-.045em] text-[#111612]">{value}</p>
      <p className="mt-2 text-[13px] leading-relaxed text-black/45">{note}</p>
    </article>
  );
}

function SectionCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-[28px] border border-black/[.07] bg-white shadow-[0_16px_60px_rgba(19,35,27,.045)] ${className}`}>{children}</section>;
}

function OverviewPanel() {
  return (
    <div className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
      <SectionCard className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/[.06] px-5 py-5 sm:px-6">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-[24px] tracking-[-.035em] text-[#111612]">Operação em andamento</h2>
              <StatusPill tone="active">Simulação</StatusPill>
            </div>
            <p className="mt-1 text-[14px] text-black/45">Acompanhamento consolidado de atendimento, entrega e retirada.</p>
          </div>
          <button className="flex min-h-11 items-center gap-2 rounded-full bg-[#111612] px-4 text-[14px] font-semibold text-white transition hover:bg-black">
            Ver central <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="divide-y divide-black/[.055]">
          {conversations.map((conversation) => (
            <button key={conversation.id} className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-black/[.018] sm:px-6">
              <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f0f4f1] text-[13px] font-bold text-black/55">
                {conversation.id.slice(-2)}
                {conversation.tone === "critical" && <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-red-500" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <p className="truncate text-[15px] font-semibold text-[#111612]">{conversation.name}</p>
                  <span className="text-[12px] text-black/35">{conversation.time}</span>
                </div>
                <p className="mt-0.5 truncate text-[14px] text-black/45">{conversation.summary}</p>
              </div>
              <StatusPill tone={conversation.tone as "critical" | "active" | "success"}>{conversation.status}</StatusPill>
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard className="overflow-hidden bg-[#111612] text-white">
        <div className="relative p-6">
          <div aria-hidden className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" />
          <div className="relative flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[15px] bg-emerald-400 text-[#0b2417]">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[15px] font-semibold">Agente Express</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-[13px] text-white/50">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 motion-safe:animate-pulse" /> Operação demonstrativa
                </p>
              </div>
            </div>
            <MoreHorizontal className="h-5 w-5 text-white/40" />
          </div>

          <div className="relative mt-8 rounded-[22px] bg-white/[.075] p-5 ring-1 ring-inset ring-white/10">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
              <div>
                <p className="text-[14px] font-semibold">Possível atraso identificado</p>
                <p className="mt-2 text-[14px] leading-relaxed text-white/60">O cliente pediu uma previsão. Falta a confirmação de localização do motorista para enviar um horário confiável.</p>
              </div>
            </div>
          </div>

          <div className="relative mt-4 rounded-[22px] bg-emerald-400 p-5 text-[#0c2417]">
            <p className="text-[12px] font-bold uppercase tracking-[.13em] text-[#0c2417]/55">Resposta preparada</p>
            <p className="mt-3 text-[15px] font-medium leading-relaxed">“Entendi sua preocupação e já estou verificando a posição da entrega. Retorno com uma previsão confirmada em alguns minutos.”</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button className="min-h-10 rounded-full bg-[#0d2b1b] px-4 text-[13px] font-semibold text-white">Solicitar aprovação</button>
              <button className="min-h-10 rounded-full bg-white/55 px-4 text-[13px] font-semibold">Editar resposta</button>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

function AtendimentoPanel() {
  return (
    <div className="grid gap-5 lg:grid-cols-[.72fr_1.28fr]">
      <SectionCard className="overflow-hidden">
        <div className="border-b border-black/[.06] p-5">
          <div className="flex min-h-11 items-center gap-3 rounded-full bg-black/[.035] px-4 text-black/40">
            <Search className="h-4 w-4" />
            <span className="text-[14px]">Buscar atendimento</span>
          </div>
        </div>
        <div className="divide-y divide-black/[.055]">
          {conversations.map((conversation, index) => (
            <button key={conversation.id} className={`w-full p-5 text-left transition hover:bg-black/[.02] ${index === 0 ? "bg-emerald-50/60" : ""}`}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-[15px] font-semibold">{conversation.name}</p>
                <span className="text-[12px] text-black/35">{conversation.time}</span>
              </div>
              <p className="mt-2 text-[14px] text-black/45">{conversation.summary}</p>
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard className="overflow-hidden">
        <div className="flex items-center justify-between gap-4 border-b border-black/[.06] p-5 sm:px-6">
          <div>
            <p className="text-[15px] font-semibold">Cliente 024</p>
            <p className="text-[13px] text-black/40">Atendimento EX-024 · dados anonimizados</p>
          </div>
          <StatusPill tone="critical">Aguardando previsão</StatusPill>
        </div>
        <div className="min-h-[360px] bg-[#f7f8f7] p-5 sm:p-6">
          <div className="max-w-[82%] rounded-[20px_20px_20px_6px] bg-white p-4 text-[14px] leading-relaxed shadow-sm ring-1 ring-black/[.055]">
            Minha entrega estava prevista para hoje. Por que ainda não chegou?
          </div>
          <div className="ml-auto mt-4 max-w-[86%] rounded-[20px_20px_6px_20px] bg-[#d9fdd3] p-4 text-[14px] leading-relaxed text-[#17301e] shadow-sm">
            Entendi sua preocupação. Estou confirmando a posição da entrega para informar uma previsão confiável. Seu atendimento está em prioridade.
          </div>
          <div className="mt-5 rounded-[20px] border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
              <div>
                <p className="text-[13px] font-semibold text-amber-900">Próxima atualização em até 5 minutos</p>
                <p className="mt-1 text-[13px] leading-relaxed text-amber-800/70">O agente solicitou um check-in operacional. Se não houver resposta, o atendimento será encaminhado.</p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 border-t border-black/[.06] p-4">
          <div className="min-h-11 flex-1 rounded-full bg-black/[.035] px-4 py-3 text-[14px] text-black/35">Responder como Express Entulho…</div>
          <button className="flex h-11 w-11 items-center justify-center rounded-full bg-[#111612] text-white" aria-label="Enviar mensagem"><ChevronRight className="h-5 w-5" /></button>
        </div>
      </SectionCard>
    </div>
  );
}

function AgendaPanel() {
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_.8fr]">
      <SectionCard className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <StatusPill tone="active">Planejamento demonstrativo</StatusPill>
            <h2 className="mt-4 font-display text-[28px] tracking-[-.04em]">Rota sugerida para amanhã</h2>
            <p className="mt-2 text-[14px] text-black/45">A ordem definitiva dependerá de veículo, disponibilidade e confirmação dos motoristas.</p>
          </div>
          <button className="flex min-h-11 items-center gap-2 rounded-full border border-black/10 px-4 text-[14px] font-semibold"><RouteIcon className="h-4 w-4" /> Otimizar rota</button>
        </div>
        <div className="mt-7 space-y-3">
          {routeStops.map((stop, index) => (
            <article key={`${stop.time}-${stop.area}`} className="flex items-center gap-4 rounded-[22px] bg-[#f6f8f6] p-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-[13px] font-bold shadow-sm ring-1 ring-black/[.05]">{index + 1}</div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{stop.area}</p><StatusPill>{stop.task}</StatusPill></div>
                <p className="mt-1 text-[13px] text-black/45">{stop.item}</p>
              </div>
              <p className="font-mono-tech text-[13px] font-semibold text-black/55">{stop.time}</p>
            </article>
          ))}
        </div>
      </SectionCard>

      <SectionCard className="overflow-hidden">
        <div className="relative flex min-h-[250px] items-center justify-center bg-[radial-gradient(circle_at_30%_25%,rgba(54,193,116,.16),transparent_28%),linear-gradient(145deg,#eef3ef,#f9faf9)]">
          <div aria-hidden className="absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(20,45,32,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(20,45,32,.12)_1px,transparent_1px)] [background-size:38px_38px]" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-[0_18px_50px_rgba(11,143,77,.18)]">
            <Navigation className="h-8 w-8 text-[#0b8f4d]" />
            <span className="absolute h-28 w-28 rounded-full border border-emerald-400/30 motion-safe:animate-ping" />
          </div>
        </div>
        <div className="p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div><p className="text-[14px] text-black/40">Localização dos veículos</p><p className="mt-1 font-display text-[24px]">Aguardando integração</p></div>
            <StatusPill tone="warning">GPS pendente</StatusPill>
          </div>
          <p className="mt-4 text-[13px] leading-relaxed text-black/45">A posição exata só será exibida durante operações autorizadas. O cliente receberá progresso e previsão por um link temporário.</p>
        </div>
      </SectionCard>
    </div>
  );
}

function FrotaPanel() {
  return (
    <SectionCard className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/[.06] p-5 sm:px-6">
        <div><h2 className="font-display text-[26px]">Inventário de caçambas</h2><p className="mt-1 text-[14px] text-black/45">Estrutura pronta para receber os números oficiais da Express Entulho.</p></div>
        <StatusPill tone="warning">Aguardando cadastro</StatusPill>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[650px] border-collapse text-left">
          <thead className="bg-black/[.018] text-[12px] uppercase tracking-[.08em] text-black/35">
            <tr><th className="px-6 py-4 font-semibold">Categoria</th><th className="px-6 py-4 font-semibold">Total</th><th className="px-6 py-4 font-semibold">Disponíveis</th><th className="px-6 py-4 font-semibold">Em operação</th><th className="px-6 py-4 font-semibold">Próxima ação</th></tr>
          </thead>
          <tbody className="divide-y divide-black/[.055]">
            {fleetRows.map((row) => (
              <tr key={row.label} className="text-[14px]">
                <td className="px-6 py-5 font-semibold">{row.label}</td><td className="px-6 py-5 text-black/45">{row.total}</td><td className="px-6 py-5 text-black/45">{row.available}</td><td className="px-6 py-5 text-black/45">{row.inUse}</td><td className="px-6 py-5"><button className="font-semibold text-[#0b8f4d]">Cadastrar dados</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid gap-4 border-t border-black/[.06] bg-[#f8faf8] p-5 sm:grid-cols-3 sm:p-6">
        {[{ icon: Truck, label: "Veículos", value: "A cadastrar" }, { icon: UserCheck, label: "Motoristas", value: "A cadastrar" }, { icon: PackageCheck, label: "Caçambas", value: "A cadastrar" }].map((item) => <div key={item.label} className="rounded-[20px] bg-white p-4 ring-1 ring-black/[.055]"><item.icon className="h-5 w-5 text-[#0b8f4d]" /><p className="mt-4 text-[13px] text-black/40">{item.label}</p><p className="mt-1 text-[16px] font-semibold">{item.value}</p></div>)}
      </div>
    </SectionCard>
  );
}

function ClientesPanel() {
  return (
    <div className="grid gap-5 lg:grid-cols-[.7fr_1.3fr]">
      <SectionCard className="p-5 sm:p-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700"><Building2 className="h-6 w-6" /></div>
        <StatusPill tone="active"><span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-blue-600" />Perfil demonstrativo</StatusPill>
        <h2 className="mt-5 font-display text-[30px]">Cliente Empresa 018</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-black/45">Histórico centralizado sem expor os dados reais utilizados na operação da empresa.</p>
        <button className="mt-6 min-h-11 rounded-full bg-[#111612] px-5 text-[14px] font-semibold text-white">Abrir histórico</button>
      </SectionCard>
      <SectionCard className="p-5 sm:p-6">
        <h3 className="font-display text-[24px]">Jornada registrada</h3>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {[{ icon: MessageCircle, label: "Origem", value: "WhatsApp" }, { icon: FileCheck2, label: "Cadastro", value: "Dados recebidos" }, { icon: CircleDollarSign, label: "Pagamento", value: "Identificado" }, { icon: CalendarDays, label: "Operação", value: "Aguardando agenda" }].map((item) => <div key={item.label} className="rounded-[20px] bg-[#f6f8f6] p-4"><item.icon className="h-5 w-5 text-[#0b8f4d]" /><p className="mt-4 text-[13px] text-black/40">{item.label}</p><p className="mt-1 text-[15px] font-semibold">{item.value}</p></div>)}
        </div>
      </SectionCard>
    </div>
  );
}

function FinanceiroPanel() {
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_.78fr]">
      <SectionCard className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[14px] font-semibold text-[#0b8f4d]">Taxa de sucesso</p><h2 className="mt-2 font-display text-[36px]">10% por pedido concluído</h2></div><StatusPill tone="warning">Simulação · não ativa</StatusPill></div>
        <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-black/45">A divisão financeira será ativada somente após contrato, gateway e regras de cancelamento estarem homologados.</p>
        <div className="mt-7 grid gap-3 sm:grid-cols-3">
          {[{ label: "Valor do pedido", value: "R$ 240" }, { label: "Express Entulho · 90%", value: "R$ 216" }, { label: "Plataforma · 10%", value: "R$ 24" }].map((item, index) => <div key={item.label} className={`rounded-[20px] p-4 ${index === 2 ? "bg-emerald-600 text-white" : "bg-[#f6f8f6]"}`}><p className={`text-[12px] ${index === 2 ? "text-white/60" : "text-black/40"}`}>{item.label}</p><p className="mt-2 font-display text-[24px]">{item.value}</p></div>)}
        </div>
      </SectionCard>
      <SectionCard className="p-5 sm:p-6">
        <h3 className="font-display text-[24px]">Critério de liberação</h3>
        <div className="mt-6 space-y-4">
          {["Pagamento confirmado", "Operação concluída", "Sem cancelamento ou reembolso"].map((item, index) => <div key={item} className="flex items-center gap-3"><div className={`flex h-8 w-8 items-center justify-center rounded-full ${index === 0 ? "bg-emerald-600 text-white" : "bg-black/[.045] text-black/30"}`}><Check className="h-4 w-4" /></div><span className="text-[14px] font-medium">{item}</span></div>)}
        </div>
      </SectionCard>
    </div>
  );
}

export function ExpressOperationsDemo() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="express-ops-light min-h-screen overflow-x-hidden bg-[#f3f5f3] text-[#111612]">
      <div className="border-b border-black/[.07] bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 max-w-[1480px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <BrandMark />
            <div className="min-w-0">
              <p className="truncate text-[15px] font-bold tracking-[-.015em]">Express Operations</p>
              <p className="truncate text-[12px] text-black/40">Central operacional · demonstração</p>
            </div>
          </div>
          <div className="hidden items-center gap-3 sm:flex">
            <StatusPill tone="active"><span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-blue-600 motion-safe:animate-pulse" />Projeto em desenvolvimento</StatusPill>
            <Link to="/selo/$serial" params={{ serial }} className="flex min-h-10 items-center gap-2 rounded-full border border-black/10 px-4 text-[13px] font-semibold transition hover:bg-black/[.025]"><ShieldCheck className="h-4 w-4 text-[#0b8f4d]" /> Ver registro</Link>
          </div>
          <button onClick={() => setMenuOpen((value) => !value)} className="flex h-11 w-11 items-center justify-center rounded-full bg-black/[.04] sm:hidden" aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}>{menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
        </div>
        {menuOpen && <div className="border-t border-black/[.06] p-4 sm:hidden"><Link to="/selo/$serial" params={{ serial }} className="flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#111612] text-[14px] font-semibold text-white"><ShieldCheck className="h-4 w-4" /> Ver registro do projeto</Link></div>}
      </div>

      <main className="mx-auto max-w-[1480px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-5">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <StatusPill tone="warning">Ambiente demonstrativo</StatusPill>
              <span className="text-[12px] text-black/35">Sem dados reais · sem integrações ativas</span>
            </div>
            <h1 className="font-display text-[38px] tracking-[-.055em] sm:text-[48px]">Visão de hoje</h1>
            <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-black/45">O agente organiza o WhatsApp e transforma cada conversa em uma próxima ação clara.</p>
          </div>
          <div className="flex w-full gap-2 sm:w-auto">
            <button className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full border border-black/10 bg-white px-4 text-[14px] font-semibold sm:flex-none"><Headphones className="h-4 w-4" /> Aprovações</button>
            <button className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-[#0b8f4d] px-5 text-[14px] font-semibold text-white shadow-[0_10px_28px_rgba(11,143,77,.2)] transition hover:bg-[#087943] sm:flex-none"><MessageCircle className="h-4 w-4" /> Abrir agente</button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard icon={<MessageCircle className="h-5 w-5" />} label="Atendimentos de hoje" value="50–70" note="Volume diário informado pela operação" tone="green" />
          <MetricCard icon={<AlertTriangle className="h-5 w-5" />} label="Exigem atenção humana" value="1" note="Exemplo de atraso aguardando validação" tone="red" />
          <MetricCard icon={<CalendarDays className="h-5 w-5" />} label="Agenda de amanhã" value="3" note="Operações demonstrativas em planejamento" />
          <MetricCard icon={<Truck className="h-5 w-5" />} label="Frota disponível" value="—" note="Aguardando inventário oficial" />
        </div>

        <Tabs defaultValue="overview" className="mt-6">
          <div className="overflow-x-auto pb-1">
            <TabsList className="inline-flex h-auto min-w-max gap-1 rounded-full border border-black/[.07] bg-white p-1.5 shadow-sm">
              <TabsTrigger value="overview" className="min-h-10 rounded-full px-4 text-[13px] font-semibold data-[state=active]:bg-[#111612] data-[state=active]:text-white data-[state=active]:shadow-none">Visão geral</TabsTrigger>
              <TabsTrigger value="atendimento" className="min-h-10 rounded-full px-4 text-[13px] font-semibold data-[state=active]:bg-[#111612] data-[state=active]:text-white data-[state=active]:shadow-none">Atendimento</TabsTrigger>
              <TabsTrigger value="agenda" className="min-h-10 rounded-full px-4 text-[13px] font-semibold data-[state=active]:bg-[#111612] data-[state=active]:text-white data-[state=active]:shadow-none">Agenda e rotas</TabsTrigger>
              <TabsTrigger value="frota" className="min-h-10 rounded-full px-4 text-[13px] font-semibold data-[state=active]:bg-[#111612] data-[state=active]:text-white data-[state=active]:shadow-none">Frota</TabsTrigger>
              <TabsTrigger value="clientes" className="min-h-10 rounded-full px-4 text-[13px] font-semibold data-[state=active]:bg-[#111612] data-[state=active]:text-white data-[state=active]:shadow-none">Clientes</TabsTrigger>
              <TabsTrigger value="financeiro" className="min-h-10 rounded-full px-4 text-[13px] font-semibold data-[state=active]:bg-[#111612] data-[state=active]:text-white data-[state=active]:shadow-none">Financeiro</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="overview" className="mt-5"><OverviewPanel /></TabsContent>
          <TabsContent value="atendimento" className="mt-5"><AtendimentoPanel /></TabsContent>
          <TabsContent value="agenda" className="mt-5"><AgendaPanel /></TabsContent>
          <TabsContent value="frota" className="mt-5"><FrotaPanel /></TabsContent>
          <TabsContent value="clientes" className="mt-5"><ClientesPanel /></TabsContent>
          <TabsContent value="financeiro" className="mt-5"><FinanceiroPanel /></TabsContent>
        </Tabs>

        <footer className="mt-8 flex flex-col gap-3 border-t border-black/[.07] py-6 text-[12px] text-black/40 sm:flex-row sm:items-center sm:justify-between">
          <p>Dados apresentados apenas para validação visual e de arquitetura.</p>
          <div className="flex items-center gap-2"><Sparkles className="h-3.5 w-3.5 text-[#0b8f4d]" /><span className="font-semibold text-black/55">YO LAB & CO. · Inteligências Veronica</span></div>
        </footer>
      </main>

      <div aria-hidden className="pointer-events-none fixed bottom-3 right-3 z-50 rounded-full border border-black/[.07] bg-white/80 px-3 py-1.5 text-[10px] font-semibold tracking-[.05em] text-black/35 shadow-sm backdrop-blur-md sm:bottom-5 sm:right-5">
        {serial} · YO LAB & CO.
      </div>
    </div>
  );
}
