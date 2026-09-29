/**
 * /foguete-amarelo — Veronica Foguete Amarelo, agente de IA para
 * consignação farmacêutica (farmácias, distribuidoras e indústria).
 *
 * Página de captação de leads. Todo CTA abre o WhatsApp da Hub com uma
 * mensagem já dizendo de qual público o lead vem, para a triagem não
 * começar do zero.
 *
 * Paleta própria (preto puro, verde neon, ciano e o amarelo da marca) fixada
 * em variáveis locais: a página é sempre escura, independente do tema do
 * site. O amarelo aparece só onde reforça a marca "Foguete Amarelo".
 *
 * Conteúdo (passos, públicos, planos, FAQ) vive em src/data/foguete-amarelo.ts
 * — sem métrica de resultado inventada e sem preço fechado.
 */

import { createFileRoute } from "@tanstack/react-router";
import { type CSSProperties, type ReactNode } from "react";
import {
  ArrowRight,
  Rocket,
  Pill,
  Truck,
  Factory,
  MessageCircle,
  Check,
  CalendarClock,
  BarChart3,
  Receipt,
  ShieldCheck,
  UserCheck,
  AlertTriangle,
} from "lucide-react";
import { SiteHeader, SiteFooter, SOCIAL_LINKS } from "@/components/SiteChrome";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { INDICADORES, PASSOS, PERGUNTAS, PLANOS, PUBLICOS, RECURSOS } from "@/data/foguete-amarelo";

export const Route = createFileRoute("/foguete-amarelo")({
  component: FogueteAmarelo,
  head: () => ({
    meta: [
      { title: "Veronica Foguete Amarelo — IA para consignação farmacêutica | Veronica Hub" },
      {
        name: "description",
        content:
          "Agente de IA que opera a consignação entre farmácia, distribuidora e indústria: lê o sell-out, sugere reposição, avisa validade e fecha o acerto — tudo pelo WhatsApp.",
      },
      { property: "og:title", content: "Veronica Foguete Amarelo — IA para farmácias" },
      {
        property: "og:description",
        content:
          "Consignação inteligente para o varejo farmacêutico: menos estoque parado, menos ruptura, acerto sem planilha.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const fa = {
  "--fa-bg": "#000000",
  "--fa-bg-alt": "#0A0A0A",
  "--fa-green": "#00FF88",
  "--fa-cyan": "#00E5FF",
  "--fa-yellow": "#FFD700",
  "--fa-ink": "#FFFFFF",
  "--fa-ink-soft": "#A0A0A0",
  "--fa-line": "rgba(255, 255, 255, 0.1)",
  "--fa-card": "linear-gradient(135deg, rgba(0, 255, 136, 0.06), rgba(0, 229, 255, 0.06))",
  "--fa-glow": "0 0 20px rgba(0, 255, 136, 0.5)",
} as CSSProperties;

const GRID_BG: CSSProperties = {
  backgroundImage:
    "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
  backgroundSize: "48px 48px",
};

const ICONES_PUBLICO = { farmacias: Pill, distribuidoras: Truck, industria: Factory } as const;
const ICONES_RECURSO = [CalendarClock, BarChart3, MessageCircle, Receipt, ShieldCheck, UserCheck];

function whatsapp(msg: string) {
  return `${SOCIAL_LINKS.whatsapp}?text=${encodeURIComponent(msg)}`;
}

const MSG_GERAL =
  "Olá! Vi a página do Veronica Foguete Amarelo e quero entender como o agente de consignação funciona para o meu negócio.";

const MSG_PUBLICO: Record<string, string> = {
  farmacias:
    "Olá! Tenho farmácia e quero conversar sobre o Veronica Foguete Amarelo (consignação com IA).",
  distribuidoras:
    "Olá! Sou de uma distribuidora e quero conversar sobre o Veronica Foguete Amarelo para a nossa carteira de farmácias.",
  industria:
    "Olá! Sou da indústria farmacêutica e quero conversar sobre o Veronica Foguete Amarelo para um programa de consignação.",
};

/* ------------------------------------------------------------ primitivos */

function Secao({
  id,
  numero,
  rotulo,
  titulo,
  alt,
  children,
}: {
  id: string;
  numero: string;
  rotulo: string;
  titulo: ReactNode;
  alt?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-24 border-t px-4 py-16 sm:px-6 md:py-24"
      style={{
        borderColor: "var(--fa-line)",
        background: alt ? "var(--fa-bg-alt)" : "var(--fa-bg)",
      }}
    >
      <div className="mx-auto max-w-7xl">
        <div className="revelar">
          <span
            className="font-mono-tech text-xs uppercase tracking-widest"
            style={{ color: "var(--fa-green)" }}
          >
            [{numero}] {rotulo}
          </span>
          <h2
            className="mt-4 max-w-3xl font-display text-3xl md:text-5xl"
            style={{ letterSpacing: "-0.03em", lineHeight: "1.05" }}
          >
            {titulo}
          </h2>
        </div>
        <div className="mt-10 md:mt-14">{children}</div>
      </div>
    </section>
  );
}

/** Cartão com o gradiente verde→ciano e glow neon no hover. */
function CartaoNeon({ className = "", children }: { className?: string; children: ReactNode }) {
  return (
    <Card
      className={`revelar-curto rounded-sm border text-[color:var(--fa-ink)] shadow-none transition duration-300 hover:-translate-y-0.5 hover:border-[color:var(--fa-green)] hover:[box-shadow:var(--fa-glow)] ${className}`}
      style={{ borderColor: "var(--fa-line)", background: "var(--fa-card)" }}
    >
      {children}
    </Card>
  );
}

function BotaoPrimario({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Button
      asChild
      size="lg"
      className="group h-12 rounded-sm px-6 font-mono-tech text-xs uppercase tracking-[0.14em] text-black transition duration-200 hover:-translate-y-0.5 hover:[box-shadow:var(--fa-glow)]"
      style={{ background: "var(--fa-green)" }}
    >
      <a href={href} target="_blank" rel="noopener noreferrer">
        {children}
        <ArrowRight className="transition-transform group-hover:translate-x-1" />
      </a>
    </Button>
  );
}

function BotaoSecundario({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Button
      asChild
      size="lg"
      variant="outline"
      className="h-12 rounded-sm bg-transparent px-6 font-mono-tech text-xs uppercase tracking-[0.14em] text-[color:var(--fa-ink)] transition duration-200 hover:bg-transparent hover:text-[color:var(--fa-cyan)]"
      style={{ borderColor: "var(--fa-cyan)" }}
    >
      <a href={href}>{children}</a>
    </Button>
  );
}

/* ------------------------------------------------------ painel do hero */

/**
 * Painel ilustrativo do que o comprador recebe. Os números são de exemplo e
 * a tela diz isso — não é dado de cliente.
 */
const LINHAS_EXEMPLO = [
  { sku: "Analgésico 750mg cx20", giro: "alto", acao: "Repor 24 un", tom: "green" },
  { sku: "Vitamina C efervescente", giro: "médio", acao: "Manter", tom: "cyan" },
  { sku: "Antigripal cx10", giro: "baixo", acao: "Vence em 60d · remanejar", tom: "yellow" },
  { sku: "Protetor labial FPS30", giro: "parado", acao: "Devolver no acerto", tom: "soft" },
] as const;

const COR_TOM = {
  green: "var(--fa-green)",
  cyan: "var(--fa-cyan)",
  yellow: "var(--fa-yellow)",
  soft: "var(--fa-ink-soft)",
} as const;

function PainelExemplo() {
  return (
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-6 rounded-full opacity-40 blur-3xl"
        style={{
          background:
            "radial-gradient(circle at 70% 30%, rgba(255,215,0,0.25), transparent 60%), radial-gradient(circle at 30% 70%, rgba(0,255,136,0.2), transparent 60%)",
        }}
      />
      <div
        className="relative rounded-sm border p-5 sm:p-6"
        style={{ borderColor: "var(--fa-line)", background: "rgba(10,10,10,0.85)" }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Rocket className="h-4 w-4" style={{ color: "var(--fa-yellow)" }} />
            <span
              className="font-mono-tech text-[11px] uppercase tracking-widest"
              style={{ color: "var(--fa-ink-soft)" }}
            >
              Ciclo de consignação · loja 01
            </span>
          </div>
          <span
            className="rounded-full border px-2 py-0.5 font-mono-tech text-[9px] uppercase tracking-widest"
            style={{ borderColor: "var(--fa-line)", color: "var(--fa-ink-soft)" }}
          >
            exemplo ilustrativo
          </span>
        </div>

        <Separator className="my-4" style={{ background: "var(--fa-line)" }} />

        <ul className="space-y-3">
          {LINHAS_EXEMPLO.map((l) => (
            <li key={l.sku} className="flex items-start justify-between gap-4 text-sm">
              <div className="min-w-0">
                <p className="truncate">{l.sku}</p>
                <p
                  className="font-mono-tech text-[10px] uppercase tracking-widest"
                  style={{ color: "var(--fa-ink-soft)" }}
                >
                  giro {l.giro}
                </p>
              </div>
              <span
                className="shrink-0 text-right font-mono-tech text-xs"
                style={{ color: COR_TOM[l.tom] }}
              >
                {l.acao}
              </span>
            </li>
          ))}
        </ul>

        <Separator className="my-4" style={{ background: "var(--fa-line)" }} />

        <div
          className="rounded-sm border p-3 text-sm leading-relaxed"
          style={{ borderColor: "rgba(0,255,136,0.3)", background: "rgba(0,255,136,0.05)" }}
        >
          <div
            className="mb-1 flex items-center gap-2 font-mono-tech text-[10px] uppercase tracking-widest"
            style={{ color: "var(--fa-green)" }}
          >
            <MessageCircle className="h-3.5 w-3.5" /> Veronica · WhatsApp
          </div>
          Bom dia! Separei a reposição da semana e 1 item perto do vencimento. Posso mandar o pedido
          para a distribuidora?
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- página */

function FogueteAmarelo() {
  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{ ...fa, background: "var(--fa-bg)", color: "var(--fa-ink)" }}
    >
      <SiteHeader />

      {/* ------------------------------------------------------ hero */}
      <section className="relative overflow-hidden scanlines">
        <div aria-hidden className="pointer-events-none absolute inset-0" style={GRID_BG} />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 80% 10%, rgba(255,215,0,0.12), transparent 70%), radial-gradient(ellipse 50% 50% at 10% 90%, rgba(0,229,255,0.08), transparent 70%)",
          }}
        />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 md:min-h-[calc(100svh-4rem)] md:py-24 lg:grid-cols-2">
          <div>
            <Badge
              variant="outline"
              className="rounded-full border-[#00FF88] bg-black/60 px-4 py-1.5 font-mono-tech text-[10px] uppercase tracking-widest text-[#00FF88] backdrop-blur"
            >
              <span className="mr-2 h-1.5 w-1.5 rounded-full bg-[#00FF88] animate-pulse-dot" />
              Yo Lab & co. · Foguete Amarelo · IA para farmácias
            </Badge>

            <h1
              className="mt-8 font-display text-[32px] sm:text-5xl lg:text-[64px]"
              style={{ letterSpacing: "-0.04em", lineHeight: "1" }}
            >
              Consignação farmacêutica{" "}
              <span
                style={{ color: "var(--fa-yellow)", textShadow: "0 0 30px rgba(255,215,0,0.35)" }}
              >
                no piloto automático.
              </span>
            </h1>

            <p
              className="mt-6 max-w-[65ch] text-base leading-[1.6] sm:text-lg"
              style={{ color: "var(--fa-ink-soft)" }}
            >
              O Veronica Foguete Amarelo é um agente de IA que opera a consignação entre farmácia,
              distribuidora e indústria: lê o que vendeu, sugere a reposição, avisa o que vai vencer
              e fecha o acerto — conversando pelo WhatsApp com quem compra.
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              <BotaoPrimario href={whatsapp(MSG_GERAL)}>Quero uma demonstração</BotaoPrimario>
              <BotaoSecundario href="#como-funciona">Ver como funciona</BotaoSecundario>
            </div>

            <ul
              className="mt-10 flex flex-wrap gap-x-6 gap-y-2 font-mono-tech text-[11px] uppercase tracking-widest"
              style={{ color: "var(--fa-ink-soft)" }}
            >
              {["Paga só o que vende", "Lote e validade", "Humano aprova"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5" style={{ color: "var(--fa-green)" }} />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <PainelExemplo />
        </div>
      </section>

      {/* ---------------------------------------------- [01] problema */}
      <Secao
        id="problema"
        numero="01"
        rotulo="O problema"
        alt
        titulo={
          <>
            Farmácia com dinheiro parado na prateleira e{" "}
            <span style={{ color: "var(--fa-cyan)" }}>falta do que o cliente pede.</span>
          </>
        }
      >
        <div className="grid gap-8 md:grid-cols-2">
          <p
            className="revelar max-w-[65ch] text-base leading-[1.6]"
            style={{ color: "var(--fa-ink-soft)" }}
          >
            A farmácia independente compra à vista ou a prazo curto, e boa parte do capital fica
            imobilizada em itens que giram devagar. Enquanto isso, o que o cliente procura acaba
            antes da próxima visita do representante — e o que ninguém levou vence no fundo da
            gôndola.
          </p>
          <p
            className="revelar max-w-[65ch] text-base leading-[1.6]"
            style={{ color: "var(--fa-ink-soft)" }}
          >
            A consignação resolve a parte financeira: a farmácia paga só o que vendeu. Mas operar
            consignação em dezenas de lojas exige ler vendas, calcular reposição, controlar validade
            e fazer acerto todo ciclo. É esse trabalho repetitivo que o agente assume.
          </p>
        </div>
      </Secao>

      {/* ----------------------------------------- [02] como funciona */}
      <Secao
        id="como-funciona"
        numero="02"
        rotulo="Como funciona"
        titulo="Um ciclo, quatro etapas."
      >
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PASSOS.map((p, i) => (
            <li key={p.titulo}>
              <CartaoNeon className="h-full">
                <CardHeader>
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-sm border font-mono-tech text-xs"
                    style={{ borderColor: "var(--fa-yellow)", color: "var(--fa-yellow)" }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <CardTitle
                    className="pt-4 font-display text-xl"
                    style={{ letterSpacing: "-0.02em" }}
                  >
                    {p.titulo}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-[1.6]" style={{ color: "var(--fa-ink-soft)" }}>
                    {p.desc}
                  </p>
                </CardContent>
              </CartaoNeon>
            </li>
          ))}
        </ol>
      </Secao>

      {/* --------------------------------------------- [03] para quem */}
      <Secao
        id="para-quem"
        numero="03"
        rotulo="Para quem"
        alt
        titulo="Cada elo da cadeia ganha uma coisa diferente."
      >
        <div className="grid gap-6 lg:grid-cols-3">
          {PUBLICOS.map((pub) => {
            const Icone = ICONES_PUBLICO[pub.id as keyof typeof ICONES_PUBLICO];
            return (
              <CartaoNeon key={pub.id} className="flex flex-col">
                <CardHeader>
                  <Icone className="h-7 w-7" style={{ color: "var(--fa-cyan)" }} />
                  <CardTitle
                    className="pt-3 font-display text-2xl"
                    style={{ letterSpacing: "-0.02em" }}
                  >
                    {pub.titulo}
                  </CardTitle>
                  <p className="text-sm leading-[1.6]" style={{ color: "var(--fa-ink-soft)" }}>
                    {pub.dor}
                  </p>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col">
                  <ul className="space-y-2">
                    {pub.entrega.map((e) => (
                      <li key={e} className="flex items-start gap-2 text-sm">
                        <Check
                          className="mt-0.5 h-4 w-4 shrink-0"
                          style={{ color: "var(--fa-green)" }}
                        />
                        <span>{e}</span>
                      </li>
                    ))}
                  </ul>
                  <a
                    href={whatsapp(MSG_PUBLICO[pub.id] ?? MSG_GERAL)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group mt-6 inline-flex items-center gap-1.5 pt-2 text-sm hover:underline md:mt-auto"
                    style={{ color: "var(--fa-cyan)" }}
                  >
                    Falar sobre {pub.titulo.toLowerCase()}
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </a>
                </CardContent>
              </CartaoNeon>
            );
          })}
        </div>
      </Secao>

      {/* --------------------------------------------- [04] recursos */}
      <Secao
        id="recursos"
        numero="04"
        rotulo="O que o agente faz"
        titulo="Trabalho de representante, sem planilha no meio."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {RECURSOS.map((r, i) => {
            const Icone = ICONES_RECURSO[i % ICONES_RECURSO.length];
            return (
              <CartaoNeon key={r.titulo}>
                <CardHeader>
                  <Icone className="h-6 w-6" style={{ color: "var(--fa-green)" }} />
                  <CardTitle className="pt-3 text-lg">{r.titulo}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-[1.6]" style={{ color: "var(--fa-ink-soft)" }}>
                    {r.desc}
                  </p>
                </CardContent>
              </CartaoNeon>
            );
          })}
        </div>
      </Secao>

      {/* ------------------------------------------- [05] indicadores */}
      <Secao
        id="indicadores"
        numero="05"
        rotulo="Indicadores"
        alt
        titulo="O que o agente acompanha em cada loja, a cada ciclo."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {INDICADORES.map((ind) => (
            <div
              key={ind.sigla}
              className="revelar-curto rounded-sm border p-6"
              style={{ borderColor: "var(--fa-line)", background: "var(--fa-bg)" }}
            >
              <span
                className="font-mono-tech text-3xl font-bold md:text-4xl"
                style={{ color: "var(--fa-yellow)" }}
              >
                {ind.sigla}
              </span>
              <p className="mt-4 font-medium">{ind.nome}</p>
              <p className="mt-2 text-sm leading-[1.6]" style={{ color: "var(--fa-ink-soft)" }}>
                {ind.desc}
              </p>
            </div>
          ))}
        </div>
        <p
          className="mt-6 max-w-[65ch] text-xs leading-relaxed"
          style={{ color: "var(--fa-ink-soft)" }}
        >
          O produto ainda não tem cliente em produção, então esta página não mostra percentual de
          resultado. Os primeiros números publicados aqui virão de pilotos reais, com a fonte ao
          lado.
        </p>
      </Secao>

      {/* ------------------------------------------------ [06] planos */}
      <Secao
        id="planos"
        numero="06"
        rotulo="Planos"
        titulo="Começa pequeno. Escala com a carteira."
      >
        <div className="grid gap-6 lg:grid-cols-3">
          {PLANOS.map((plano) => (
            <CartaoNeon
              key={plano.id}
              className={`flex flex-col ${plano.destaque ? "border-[color:var(--fa-yellow)]" : ""}`}
            >
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="font-display text-2xl" style={{ letterSpacing: "-0.02em" }}>
                    {plano.nome}
                  </CardTitle>
                  {plano.destaque && (
                    <Badge
                      variant="outline"
                      className="rounded-full border-[#FFD700] font-mono-tech text-[9px] uppercase tracking-widest text-[#FFD700]"
                    >
                      Mais procurado
                    </Badge>
                  )}
                </div>
                <p className="text-sm leading-[1.6]" style={{ color: "var(--fa-ink-soft)" }}>
                  {plano.paraQuem}
                </p>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                <p className="font-display text-3xl">Sob proposta</p>
                <p
                  className="mt-1 font-mono-tech text-[10px] uppercase tracking-widest"
                  style={{ color: "var(--fa-ink-soft)" }}
                >
                  tabela em fechamento
                </p>
                <Separator className="my-5" style={{ background: "var(--fa-line)" }} />
                <ul className="space-y-2">
                  {plano.inclui.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm">
                      <Check
                        className="mt-0.5 h-4 w-4 shrink-0"
                        style={{ color: "var(--fa-green)" }}
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8 md:mt-auto md:pt-8">
                  <a
                    href={whatsapp(
                      `Olá! Quero uma proposta do plano ${plano.nome} do Veronica Foguete Amarelo.`,
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-sm border px-5 font-mono-tech text-xs uppercase tracking-[0.14em] transition duration-200 hover:[box-shadow:var(--fa-glow)]"
                    style={
                      plano.destaque
                        ? {
                            background: "var(--fa-green)",
                            borderColor: "var(--fa-green)",
                            color: "#000",
                          }
                        : { borderColor: "var(--fa-green)", color: "var(--fa-green)" }
                    }
                  >
                    Pedir proposta <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              </CardContent>
            </CartaoNeon>
          ))}
        </div>
      </Secao>

      {/* --------------------------------------------------- [07] FAQ */}
      <Secao
        id="faq"
        numero="07"
        rotulo="Perguntas frequentes"
        alt
        titulo="Antes de você perguntar."
      >
        <Accordion type="single" collapsible className="max-w-3xl">
          {PERGUNTAS.map((q, i) => (
            <AccordionItem key={q.p} value={`q${i}`} style={{ borderColor: "var(--fa-line)" }}>
              <AccordionTrigger className="text-left text-base hover:no-underline hover:text-[color:var(--fa-green)]">
                {q.p}
              </AccordionTrigger>
              <AccordionContent className="max-w-[65ch] text-sm leading-[1.6] text-[color:var(--fa-ink-soft)]">
                {q.r}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Secao>

      {/* ---------------------------------------------------- CTA final */}
      <section
        className="relative overflow-hidden border-t px-4 py-20 sm:px-6 md:py-28"
        style={{ borderColor: "var(--fa-line)" }}
      >
        <div aria-hidden className="pointer-events-none absolute inset-0" style={GRID_BG} />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 50% 60% at 50% 100%, rgba(255,215,0,0.12), transparent 70%)",
          }}
        />
        <div className="revelar relative mx-auto max-w-3xl text-center">
          <Rocket
            className="mx-auto h-10 w-10"
            style={{
              color: "var(--fa-yellow)",
              filter: "drop-shadow(0 0 12px rgba(255,215,0,0.6))",
            }}
          />
          <h2
            className="mt-6 font-display text-3xl md:text-5xl"
            style={{ letterSpacing: "-0.03em", lineHeight: "1.05" }}
          >
            Coloque a consignação da sua carteira{" "}
            <span style={{ color: "var(--fa-green)" }}>em órbita.</span>
          </h2>
          <p
            className="mx-auto mt-5 max-w-[65ch] text-base leading-[1.6]"
            style={{ color: "var(--fa-ink-soft)" }}
          >
            Conte quantas lojas você atende e como faz o acerto hoje. A gente mostra o agente
            rodando com um recorte dos seus próprios dados antes de qualquer contrato.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <BotaoPrimario href={whatsapp(MSG_GERAL)}>Falar no WhatsApp</BotaoPrimario>
            <BotaoSecundario href="#planos">Ver planos</BotaoSecundario>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------- aviso de marca */}
      <div
        className="border-t px-4 py-8 sm:px-6"
        style={{ borderColor: "var(--fa-line)", background: "var(--fa-bg-alt)" }}
      >
        <p
          className="mx-auto flex max-w-7xl items-start gap-2 text-[11px] leading-[1.6]"
          style={{ color: "var(--fa-ink-soft)" }}
        >
          <AlertTriangle
            className="mt-0.5 h-3.5 w-3.5 shrink-0"
            style={{ color: "var(--fa-yellow)" }}
          />
          <span>
            Veronica Foguete Amarelo é um produto da Yo Lab & co., sem vínculo, parceria ou endosso
            da Cimed ou de qualquer laboratório, distribuidora ou rede citada. O agente não faz
            dispensação nem orientação ao paciente; a responsabilidade técnica segue com o
            farmacêutico responsável de cada estabelecimento.
          </span>
        </p>
      </div>

      <SiteFooter />
    </div>
  );
}
