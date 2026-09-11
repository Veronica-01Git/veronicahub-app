import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, Bot, CalendarDays, Check, Clock3, MessageCircle, ShieldCheck, Sparkles } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { SealAtmosphere } from "@/components/seals/SealAtmosphere";
import { VeronicaSeal } from "@/components/VeronicaSeal";

export const Route = createFileRoute("/clientes/express-entulho/proposta")({
  component: ExpressEntulhoProposal,
  head: () => ({ meta: [
    { title: "Proposta Express Entulho × YO LAB & CO. | Veronica Hub" },
    { name: "description", content: "Proposta para implantação do agente de IA da Express Entulho: atendimento por WhatsApp, acompanhamento e suporte." },
    { property: "og:title", content: "Express Entulho — Agente de IA para WhatsApp" },
    { property: "og:description", content: "Proposta oficial desenvolvida por YO LAB & CO., laboratório da Veronica Hub." },
  ] }),
});

const serial = "VH-AUT-WA-2026-000001";
const steps = [
  { date: "11 SET", title: "Início", text: "Entrada, briefing e definição das regras do atendimento." },
  { date: "12–14 SET", title: "Construção", text: "Fluxos, base de conhecimento e organização dos leads." },
  { date: "15–16 SET", title: "Homologação", text: "Simulações, correções e refinamento das respostas." },
  { date: "17 SET", title: "Entrega", text: "Ativação prevista e início dos 30 dias de suporte." },
];

function ExpressEntulhoProposal() {
  return (
    <div className="home-hybrid min-h-screen overflow-x-hidden bg-background text-foreground">
      <SiteHeader />
      <main>
        <section className="relative isolate overflow-hidden border-b border-border/70 py-16 md:py-24">
          <SealAtmosphere />
          <div className="relative mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-[1fr_22rem] lg:items-center">
            <div>
              <div className="flex items-center gap-3 font-mono-tech text-[10px] uppercase tracking-[.2em] text-neon-green"><span className="h-px w-8 bg-neon-green" />Proposta oficial · 11.09.2026</div>
              <h1 className="mt-6 max-w-4xl font-display text-5xl leading-[.9] tracking-[-.06em] sm:text-6xl md:text-7xl">Seu atendimento no ritmo da <span className="text-neon-green">obra.</span></h1>
              <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">Um agente de inteligência artificial preparado para atender o WhatsApp da Express Entulho, organizar demandas e acelerar o caminho entre a primeira mensagem e o pedido.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#investimento" className="inline-flex min-h-12 items-center gap-2 rounded-sm bg-neon-green px-6 font-mono-tech text-[10px] uppercase tracking-widest text-primary-foreground shadow-glow-green">Ver proposta · R$ 1.500 <ArrowRight className="h-4 w-4" /></a>
                <Link to="/selo/$serial" params={{ serial }} className="inline-flex min-h-12 items-center gap-2 rounded-sm border border-neon-cyan/40 bg-white/55 px-6 font-mono-tech text-[10px] uppercase tracking-widest text-neon-cyan backdrop-blur">Verificar procedência <ShieldCheck className="h-4 w-4" /></Link>
              </div>
            </div>
            <Link to="/selo/$serial" params={{ serial }} className="group relative mx-auto flex min-h-80 w-full max-w-sm items-center justify-center overflow-hidden rounded-sm border border-neon-cyan/25 bg-white/55 [perspective:900px] shadow-[0_35px_120px_oklch(0.56_0.13_195/.13)] backdrop-blur-xl">
              <div aria-hidden className="absolute h-64 w-64 rounded-full border border-neon-green/25 motion-safe:animate-[spin_22s_linear_infinite]" />
              <VeronicaSeal serialNumber={serial} issuedTo="Express Entulho" issuedDate="11/09/2026" productName="SOLUÇÃO IA" size="md" className="relative transition duration-700 [transform:rotateX(4deg)_rotateY(-5deg)] drop-shadow-[0_24px_35px_oklch(0.58_0.17_155/.24)] group-hover:[transform:rotateX(0)_rotateY(0)_scale(1.04)]" />
              <div className="absolute bottom-5 font-mono-tech text-[9px] uppercase tracking-[.18em] text-neon-green">Solução registrada · toque para verificar</div>
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-16 md:py-24">
          <div className="grid gap-5 md:grid-cols-3">
            {[{ label: "Atendimento", value: "WhatsApp", icon: MessageCircle }, { label: "Implantação", value: "5 dias", icon: CalendarDays }, { label: "Suporte", value: "30 dias", icon: Clock3 }].map((item) => <article key={item.label} className="rounded-sm border border-border/70 bg-white/65 p-6 shadow-sm backdrop-blur"><item.icon className="h-5 w-5 text-neon-green" /><div className="mt-8 font-mono-tech text-[9px] uppercase tracking-widest text-muted-foreground">{item.label}</div><div className="mt-2 font-display text-3xl">{item.value}</div></article>)}
          </div>
        </section>

        <section className="border-y border-border/70 bg-white/45 py-16 md:py-24">
          <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-[.8fr_1.2fr]">
            <div><div className="font-mono-tech text-[10px] uppercase tracking-[.2em] text-neon-cyan">A solução</div><h2 className="mt-4 font-display text-4xl tracking-[-.045em] sm:text-5xl">Uma conversa mais simples para o cliente. Uma operação mais organizada para a empresa.</h2></div>
            <div className="grid gap-3 sm:grid-cols-2">{["Receber o cliente imediatamente", "Identificar a necessidade inicial", "Apresentar portes P, M e G", "Coletar local e dados do pedido", "Organizar e encaminhar leads", "Operar conforme regras validadas"].map((item) => <div key={item} className="flex min-h-20 items-start gap-3 rounded-sm border border-border/70 bg-white/80 p-5 text-sm"><Check className="mt-0.5 h-4 w-4 shrink-0 text-neon-green" />{item}</div>)}</div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-16 md:py-24">
          <div className="font-mono-tech text-[10px] uppercase tracking-[.2em] text-neon-green">Plano de implantação</div>
          <h2 className="mt-4 max-w-3xl font-display text-4xl tracking-[-.045em] sm:text-5xl">Do acordo ao agente entregue.</h2>
          <div className="mt-10 grid gap-3 md:grid-cols-4">{steps.map((step, index) => <article key={step.date} className="relative overflow-hidden rounded-sm border border-border/70 bg-white/65 p-6"><div className="font-mono-tech text-[10px] uppercase tracking-widest text-neon-cyan">{step.date}</div><div className="mt-10 font-display text-2xl">{step.title}</div><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{step.text}</p><span aria-hidden className="absolute right-4 top-3 font-display text-5xl text-neon-green/[.08]">0{index + 1}</span></article>)}</div>
          <div className="mt-5 flex items-start gap-3 rounded-sm border border-neon-cyan/25 bg-neon-cyan/[.045] p-5 text-sm leading-relaxed"><Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-neon-cyan" /><p><strong>Atualização contínua:</strong> durante o desenvolvimento, o progresso será comunicado automaticamente todos os dias às 12h e às 00h.</p></div>
        </section>

        <section id="investimento" className="border-y border-border/70 bg-gradient-to-br from-neon-green/[.08] via-white to-neon-cyan/[.08] py-16 md:py-24">
          <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[1fr_.8fr] lg:items-center">
            <div><div className="font-mono-tech text-[10px] uppercase tracking-[.2em] text-neon-green">Investimento total</div><div className="mt-4 font-display text-7xl tracking-[-.065em] sm:text-8xl">R$ 1.500</div><p className="mt-5 max-w-xl leading-relaxed text-muted-foreground">Implantação do agente de IA, atualizações do desenvolvimento e 30 dias corridos de suporte após a entrega.</p></div>
            <div className="overflow-hidden rounded-sm border border-border/70 bg-white/75 p-6 shadow-lg backdrop-blur">
              <div className="flex justify-between gap-4 border-b border-border/70 pb-5"><span className="text-muted-foreground">Entrada · 11/09/2026</span><strong>R$ 750</strong></div>
              <div className="flex justify-between gap-4 border-b border-border/70 py-5"><span className="text-muted-foreground">Entrega · 17/09/2026</span><strong>R$ 750</strong></div>
              <div className="flex justify-between gap-4 pt-5"><span className="text-muted-foreground">Suporte incluído</span><strong>30 dias</strong></div>
              <p className="mt-6 rounded-sm bg-surface p-4 text-xs leading-relaxed text-muted-foreground">A chave PIX é fornecida diretamente no atendimento para preservar os dados pessoais em uma página pública.</p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-16 md:py-24">
          <div className="grid gap-5 lg:grid-cols-2">
            <article className="rounded-sm border border-border/70 bg-white/70 p-7"><Bot className="h-6 w-6 text-neon-green" /><div className="mt-8 font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground">Continuidade opcional</div><h2 className="mt-3 font-display text-3xl">Evolução acompanhada</h2><p className="mt-4 leading-relaxed text-muted-foreground">Após o suporte inicial: R$ 300 mensais durante seis meses e, posteriormente, R$ 500 mensais, caso a Express Entulho opte pela continuidade da gestão e das atualizações.</p></article>
            <article className="rounded-sm border border-neon-green/30 bg-neon-green/[.075] p-7"><BadgeCheck className="h-6 w-6 text-neon-green" /><div className="mt-8 font-mono-tech text-[10px] uppercase tracking-widest text-neon-green">Procedência digital</div><h2 className="mt-3 font-display text-3xl">Projeto registrado.</h2><p className="mt-4 leading-relaxed text-muted-foreground">Esta proposta está conectada ao registro oficial de soluções da Veronica Hub e pode ser verificada pelo número de série.</p><div className="mt-6 flex flex-wrap gap-3"><Link to="/selo/$serial" params={{ serial }} className="inline-flex min-h-11 items-center gap-2 rounded-sm bg-neon-green px-5 font-mono-tech text-[10px] uppercase tracking-widest text-primary-foreground">Abrir selo <ShieldCheck className="h-4 w-4" /></Link><Link to="/selos" className="inline-flex min-h-11 items-center gap-2 rounded-sm border border-neon-green/40 px-5 font-mono-tech text-[10px] uppercase tracking-widest text-neon-green">Registro oficial</Link></div></article>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
