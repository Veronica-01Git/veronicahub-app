import { createFileRoute } from "@tanstack/react-router";
import { type CSSProperties } from "react";
import {
  Anchor,
  ShieldAlert,
  Waves,
  Building2,
  MessageCircle,
  ArrowRight,
  Check,
  MapPin,
  ClipboardCheck,
  FileCheck,
  Users,
  ScrollText,
} from "lucide-react";
import { SiteHeader, SiteFooter, SOCIAL_LINKS } from "@/components/SiteChrome";
import { useReveal } from "@/hooks/use-reveal";

export const Route = createFileRoute("/veronica-nautica")({
  component: VeronicaNautica,
  head: () => ({
    meta: [
      { title: "Veronica Náutica — Projeto em Estruturação | Veronica Hub" },
      {
        name: "description",
        content:
          "Projeto em estruturação para corretagem de seguros náuticos de jetskis em marinas de Santa Catarina. Ainda em fase de habilitação regulatória — sem vendas nesta página.",
      },
      { property: "og:title", content: "Veronica Náutica — Projeto em Estruturação" },
      {
        property: "og:description",
        content: "Seguro náutico para jetskis guardados em marinas de SC. Projeto em desenvolvimento, sujeito a habilitação SUSEP.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
});

// Paleta sóbria própria — grafite/azul-marinho profundo, deliberadamente
// dissociada do dourado/gradiente vibrante da Veronica Rede. Verde/ciano do
// site só aparecem em doses mínimas (ex.: ponto do logo), nunca dominantes.
const nt = {
  "--nt-bg": "#0a0e16",
  "--nt-surface": "#111826",
  "--nt-surface-raised": "#161f30",
  "--nt-navy": "#1c3556",
  "--nt-steel": "#5c7594",
  "--nt-ink": "#e8ecf2",
  "--nt-ink-soft": "#9aa7ba",
  "--nt-ink-faint": "#5f6b7d",
  "--nt-line": "#22304a",
  "--nt-amber": "#b8923f",
} as CSSProperties;

const REGIOES = ["Balneário Camboriú", "Itajaí", "Florianópolis", "Região"];

const PASSOS = [
  {
    icon: ClipboardCheck,
    title: "Avaliação",
    desc: "Vamos levantar os dados da embarcação e do local de guarda — inclusive a estrutura da marina — para entender o risco real.",
  },
  {
    icon: FileCheck,
    title: "Cotação com seguradora habilitada",
    desc: "As cotações serão sempre obtidas junto a seguradoras devidamente habilitadas pela SUSEP, nunca apresentadas diretamente por nós.",
  },
  {
    icon: ScrollText,
    title: "Contratação formal",
    desc: "A contratação da apólice vai acontecer formalmente com a seguradora escolhida, dentro das regras do órgão regulador.",
  },
  {
    icon: Users,
    title: "Suporte contínuo",
    desc: "Depois da contratação, pretendemos acompanhar o segurado em caso de sinistro e dúvidas sobre a apólice.",
  },
];

function buildWhatsappUrl(msg: string) {
  return `${SOCIAL_LINKS.whatsapp}?text=${encodeURIComponent(msg)}`;
}

const MSG_PROPRIETARIO =
  "Olá! Vi a página da Veronica Náutica e quero entender melhor o projeto de seguro para jetski em marinas de SC. Ainda não é uma contratação, só quero saber mais.";

const MSG_MARINA =
  "Olá! Sou responsável por uma marina em Santa Catarina e quero conversar sobre o projeto Veronica Náutica para uma futura parceria.";

function VeronicaNautica() {
  const problema = useReveal<HTMLElement>();
  const como = useReveal<HTMLElement>();
  const regioes = useReveal<HTMLElement>();
  const compliance = useReveal<HTMLElement>();
  const marinas = useReveal<HTMLElement>();
  const cta = useReveal<HTMLElement>();

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ ...nt, background: "var(--nt-bg)", color: "var(--nt-ink)" }}>
      <SiteHeader />

      {/* Hero — sóbrio de propósito: sem imagem/hologram vibrante, só um único
          elemento gráfico discreto (âncora) e um selo claro de "em estruturação". */}
      <section className="relative overflow-hidden border-b" style={{ borderColor: "var(--nt-line)" }}>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 85% 0%, color-mix(in oklab, var(--nt-navy) 40%, transparent), transparent 70%)",
          }}
        />
        <Anchor
          aria-hidden
          className="pointer-events-none absolute -right-8 -top-8 h-56 w-56 opacity-[0.06] sm:h-72 sm:w-72"
          style={{ color: "var(--nt-steel)" }}
          strokeWidth={0.7}
        />

        <div className="relative mx-auto max-w-5xl px-6 pb-20 pt-16 md:pb-28 md:pt-24">
          <div
            className="inline-flex items-center gap-2.5 rounded-full border px-4 py-1.5 font-mono-tech text-[10px] uppercase tracking-widest"
            style={{ borderColor: "var(--nt-amber)", color: "var(--nt-amber)" }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--nt-amber)" }} />
            Projeto em Estruturação
          </div>

          <h1
            className="mt-8 font-display text-4xl sm:text-5xl md:text-6xl"
            style={{ letterSpacing: "-0.035em", lineHeight: "1.05", color: "var(--nt-ink)" }}
          >
            Seu jetski está protegido enquanto fica{" "}
            <span style={{ color: "var(--nt-steel)" }}>guardado na marina</span>?
          </h1>

          <p className="mt-6 max-w-xl text-base leading-[1.7] sm:text-lg" style={{ color: "var(--nt-ink-soft)" }}>
            A Veronica Náutica é um projeto em desenvolvimento para estruturar corretagem de seguros náuticos
            voltados a jetskis guardados em marinas de Santa Catarina. Ainda não vendemos nada — esta página existe
            para explicar o que estamos construindo e por quê.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-3 font-mono-tech text-[11px] uppercase tracking-widest" style={{ color: "var(--nt-ink-faint)" }}>
            <Waves className="h-3.5 w-3.5" style={{ color: "var(--nt-steel)" }} />
            Em fase de estruturação · sujeito a habilitação regulatória
          </div>
        </div>
      </section>

      {/* O Problema — educativo */}
      <section
        ref={problema.ref}
        className={`reveal ${problema.visible ? "reveal-visible" : ""} mx-auto max-w-5xl px-6 py-20 md:py-24`}
      >
        <div className="flex items-center gap-3 font-mono-tech text-[11px] uppercase tracking-widest" style={{ color: "var(--nt-steel)" }}>
          <span className="h-px w-8" style={{ background: "var(--nt-steel)" }} />
          O problema
        </div>
        <h2 className="mt-4 max-w-2xl font-display text-3xl sm:text-4xl" style={{ letterSpacing: "-0.03em", lineHeight: "1.1" }}>
          A maioria dos seguros náuticos não cobre dano dentro da própria marina.
        </h2>
        <div className="mt-6 max-w-2xl space-y-4 text-[15px] leading-[1.75]" style={{ color: "var(--nt-ink-soft)" }}>
          <p>
            Jetskis guardados em marinas de Balneário Camboriú, Itajaí, Florianópolis e região ficam expostos a
            colisão de outras embarcações, falha de guincho, tempestade e movimentação de terceiros dentro da
            própria estrutura — riscos que muitas apólices tradicionais simplesmente não cobrem, por não terem
            sido desenhadas para o ambiente de marina.
          </p>
          <p>
            O resultado é um vazio: o proprietário confia a embarcação a um espaço de terceiros sem clareza sobre
            quem responde pelo prejuízo se algo acontecer lá dentro. É esse vazio que o projeto Veronica Náutica
            quer endereçar — não com promessas, mas com estruturação séria junto a seguradoras habilitadas.
          </p>
        </div>
      </section>

      {/* Como Funcionará — 4 passos, tempo futuro/condicional */}
      <section
        ref={como.ref}
        className={`reveal ${como.visible ? "reveal-visible" : ""} border-t px-6 py-20 md:py-24`}
        style={{ borderColor: "var(--nt-line)", background: "var(--nt-surface)" }}
      >
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center gap-3 font-mono-tech text-[11px] uppercase tracking-widest" style={{ color: "var(--nt-steel)" }}>
            <span className="h-px w-8" style={{ background: "var(--nt-steel)" }} />
            Como vai funcionar
          </div>
          <h2 className="mt-4 max-w-2xl font-display text-3xl sm:text-4xl" style={{ letterSpacing: "-0.03em", lineHeight: "1.1" }}>
            O processo planejado, passo a passo.
          </h2>

          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            {PASSOS.map((p, i) => (
              <div
                key={p.title}
                className="rounded-sm border p-6"
                style={{ borderColor: "var(--nt-line)", background: "var(--nt-surface-raised)" }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-sm border font-mono-tech text-[11px]"
                    style={{ borderColor: "var(--nt-steel)", color: "var(--nt-steel)" }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <p.icon className="h-5 w-5" style={{ color: "var(--nt-steel)" }} />
                </div>
                <h3 className="mt-5 font-display text-xl" style={{ letterSpacing: "-0.02em", color: "var(--nt-ink)" }}>
                  {p.title}
                </h3>
                <p className="mt-2 text-sm leading-[1.65]" style={{ color: "var(--nt-ink-soft)" }}>
                  {p.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Regiões de Atuação Planejadas */}
      <section
        ref={regioes.ref}
        className={`reveal ${regioes.visible ? "reveal-visible" : ""} mx-auto max-w-5xl px-6 py-20 md:py-24`}
      >
        <div className="flex items-center gap-3 font-mono-tech text-[11px] uppercase tracking-widest" style={{ color: "var(--nt-steel)" }}>
          <span className="h-px w-8" style={{ background: "var(--nt-steel)" }} />
          Regiões de atuação planejadas
        </div>
        <h2 className="mt-4 max-w-2xl font-display text-3xl sm:text-4xl" style={{ letterSpacing: "-0.03em", lineHeight: "1.1" }}>
          Onde pretendemos atuar primeiro.
        </h2>
        <div className="mt-8 flex flex-wrap gap-3">
          {REGIOES.map((r) => (
            <div
              key={r}
              className="inline-flex items-center gap-2 rounded-sm border px-4 py-2.5 text-sm"
              style={{ borderColor: "var(--nt-line)", background: "var(--nt-surface)", color: "var(--nt-ink-soft)" }}
            >
              <MapPin className="h-3.5 w-3.5" style={{ color: "var(--nt-steel)" }} />
              {r}
            </div>
          ))}
        </div>
      </section>

      {/* Transparência e Compliance — bloco obrigatório, visualmente
          destacado (borda/fundo âmbar), com as 4 regras de honestidade. */}
      <section
        ref={compliance.ref}
        className={`reveal ${compliance.visible ? "reveal-visible" : ""} px-6 py-4`}
      >
        <div className="mx-auto max-w-5xl">
          <div
            className="rounded-sm border-2 p-6 sm:p-8"
            style={{
              borderColor: "var(--nt-amber)",
              background: "color-mix(in oklab, var(--nt-amber) 8%, var(--nt-surface))",
            }}
          >
            <div className="flex items-center gap-3 font-mono-tech text-[11px] uppercase tracking-widest" style={{ color: "var(--nt-amber)" }}>
              <ShieldAlert className="h-4 w-4" />
              Transparência e Compliance
            </div>
            <div className="mt-5 space-y-4 text-[14px] leading-[1.75]" style={{ color: "var(--nt-ink-soft)" }}>
              <p>
                O fundador da Veronica Náutica está em processo de habilitação como corretor de seguros junto à
                SUSEP (Superintendência de Seguros Privados) e ainda não possui registro ativo de corretagem.
              </p>
              <p>
                Não existe, até o momento, nenhuma parceria firmada com seguradora específica. Quando o projeto
                estiver estruturado, as cotações serão sempre apresentadas por seguradoras devidamente habilitadas
                pela SUSEP — nunca vendidas ou intermediadas diretamente por nós fora desse processo.
              </p>
              <p>
                Este projeto está em fase de estruturação: não comercializamos apólices, não simulamos preços e não
                coletamos dados de pagamento nesta página.
              </p>
              <p style={{ color: "var(--nt-ink-faint)" }}>
                Todas as informações apresentadas aqui são prospectivas e podem mudar conforme o andamento do
                processo de habilitação regulatória.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Para Marinas — convite B2B, sem termos comerciais prometidos */}
      <section
        ref={marinas.ref}
        className={`reveal ${marinas.visible ? "reveal-visible" : ""} mx-auto max-w-5xl px-6 py-20 md:py-24`}
      >
        <div className="flex items-center gap-3 font-mono-tech text-[11px] uppercase tracking-widest" style={{ color: "var(--nt-steel)" }}>
          <span className="h-px w-8" style={{ background: "var(--nt-steel)" }} />
          Para marinas
        </div>
        <div className="mt-4 flex flex-col gap-6 rounded-sm border p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8" style={{ borderColor: "var(--nt-line)", background: "var(--nt-surface)" }}>
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-sm border" style={{ borderColor: "var(--nt-steel)", color: "var(--nt-steel)" }}>
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-2xl" style={{ letterSpacing: "-0.02em", color: "var(--nt-ink)" }}>
                É responsável por uma marina?
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-[1.65]" style={{ color: "var(--nt-ink-soft)" }}>
                Se você administra uma marina em Santa Catarina, gostaríamos de conversar sobre como o projeto
                Veronica Náutica pode fazer sentido para a sua estrutura no futuro. Ainda não temos termos
                comerciais definidos — essa conversa é para entender o cenário real das marinas antes de
                estruturar qualquer proposta.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA — dois botões distintos, claramente não é venda */}
      <section
        ref={cta.ref}
        className={`reveal ${cta.visible ? "reveal-visible" : ""} border-t px-6 py-20 md:py-24`}
        style={{ borderColor: "var(--nt-line)", background: "var(--nt-surface)" }}
      >
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="font-display text-3xl sm:text-4xl" style={{ letterSpacing: "-0.03em", lineHeight: "1.1", color: "var(--nt-ink)" }}>
            Quer acompanhar o projeto de perto?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-[1.65]" style={{ color: "var(--nt-ink-soft)" }}>
            Fale com a gente pelo WhatsApp — sem compromisso, sem cotação, sem venda. É só uma conversa sobre um
            projeto que ainda está sendo estruturado.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <a
              href={buildWhatsappUrl(MSG_PROPRIETARIO)}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2.5 rounded-sm px-6 py-3.5 font-mono-tech text-xs uppercase tracking-[0.16em] transition duration-200 hover:-translate-y-0.5"
              style={{ background: "var(--nt-steel)", color: "#0a0e16" }}
            >
              <MessageCircle className="h-4 w-4" />
              Sou dono de jetski, quero saber mais
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </a>
            <a
              href={buildWhatsappUrl(MSG_MARINA)}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2.5 rounded-sm border px-6 py-3.5 font-mono-tech text-xs uppercase tracking-[0.16em] transition duration-200 hover:-translate-y-0.5"
              style={{ borderColor: "var(--nt-steel)", color: "var(--nt-ink)" }}
            >
              <Building2 className="h-4 w-4" />
              Represento uma marina
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </a>
          </div>
          <div className="mt-4 flex items-center justify-center gap-2 font-mono-tech text-[10px] uppercase tracking-widest" style={{ color: "var(--nt-ink-faint)" }}>
            <Check className="h-3 w-3" style={{ color: "var(--nt-steel)" }} />
            Nenhum dado de pagamento é coletado nesta página
          </div>
        </div>
      </section>

      {/* Footer — aviso de compliance condensado, adicional ao rodapé padrão do site */}
      <div className="border-t px-6 py-8" style={{ borderColor: "var(--nt-line)", background: "var(--nt-bg)" }}>
        <div className="mx-auto max-w-5xl">
          <p className="text-[11px] leading-[1.6]" style={{ color: "var(--nt-ink-faint)" }}>
            Veronica Náutica é um projeto em estruturação. Ainda não há corretor licenciado ativo nem parceria
            firmada com seguradoras. Nenhuma apólice é vendida, nenhuma cotação é simulada e nenhum dado de
            pagamento é coletado nesta página.
          </p>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
