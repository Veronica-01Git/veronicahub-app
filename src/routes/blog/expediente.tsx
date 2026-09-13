import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  BookOpenCheck,
  Building2,
  CheckCircle2,
  ExternalLink,
  FileClock,
  Landmark,
  Mail,
  Scale,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { SiteFooter, SiteHeader, SOCIAL_LINKS } from "@/components/SiteChrome";
import { WIRE_NAME } from "@/lib/ecosystem";

const SITE_URL = "https://veronicahub.com";

export const Route = createFileRoute("/blog/expediente")({
  component: EditorialStandardsPage,
  head: () => ({
    meta: [
      { title: `Expediente e transparência | ${WIRE_NAME}` },
      {
        name: "description",
        content:
          "Conheça a responsabilidade institucional, o método editorial, a política de fontes, correções e relações comerciais do Wire TV.",
      },
      { property: "og:title", content: `Expediente e transparência | ${WIRE_NAME}` },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/blog/expediente` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: WIRE_NAME,
          url: `${SITE_URL}/blog`,
          parentOrganization: {
            "@type": "Organization",
            name: "Veronica Hub",
            url: SITE_URL,
          },
          email: "yo-tech01@outlook.com",
          sameAs: [SOCIAL_LINKS.youtube, SOCIAL_LINKS.instagram, SOCIAL_LINKS.wireInstagram],
        }),
      },
    ],
  }),
});

const PRINCIPLES = [
  {
    icon: BookOpenCheck,
    title: "Precisão antes da velocidade",
    text: "Publicamos somente quando o fato central, a data e as fontes podem ser identificados. A agenda automática não obriga a existência de uma matéria.",
  },
  {
    icon: Scale,
    title: "Fato, análise e publicidade separados",
    text: "Notícia descreve acontecimentos verificáveis. Interpretação recebe contexto. Conteúdo comercial é identificado e não interfere na conclusão editorial.",
  },
  {
    icon: ShieldCheck,
    title: "Correções visíveis",
    text: "Erros relevantes devem ser corrigidos no texto, com atualização de data e registro proporcional à mudança realizada.",
  },
];

function EditorialStandardsPage() {
  return (
    <div className="home-hybrid min-h-screen bg-background text-foreground">
      <SiteHeader />

      <main>
        <header className="relative overflow-hidden border-b border-border/60">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,color-mix(in_oklch,var(--neon-green)_9%,transparent),transparent_44%)]" />
          <div className="relative mx-auto max-w-7xl px-6 py-16 sm:py-20 lg:py-24">
            <Link
              to="/blog"
              className="inline-flex items-center gap-1.5 font-mono-tech text-xs uppercase tracking-widest text-muted-foreground transition hover:text-neon-green"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao {WIRE_NAME}
            </Link>
            <div className="mt-10 flex items-center gap-2 font-mono-tech text-xs uppercase tracking-[0.2em] text-neon-green">
              <Landmark className="h-4 w-4" /> Governança editorial
            </div>
            <h1 className="mt-4 max-w-4xl font-display text-4xl leading-[1.02] sm:text-5xl lg:text-6xl">
              Expediente e transparência
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Quem publica, como verificamos informações, onde a tecnologia participa e quais
              limites separam cobertura jornalística de interesse comercial.
            </p>
          </div>
        </header>

        <nav
          aria-label="Seções desta página"
          className="sticky top-0 z-20 border-b border-border/60 bg-background/90 backdrop-blur-xl"
        >
          <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-6 py-3 font-mono-tech text-xs uppercase tracking-wider">
            {[
              ["#expediente", "Expediente"],
              ["#metodo", "Método"],
              ["#tecnologia", "Tecnologia"],
              ["#correcoes", "Correções"],
              ["#comercial", "Comercial"],
              ["#contato", "Contato"],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="whitespace-nowrap rounded-sm px-3 py-2 text-muted-foreground transition hover:bg-surface hover:text-foreground"
              >
                {label}
              </a>
            ))}
          </div>
        </nav>

        <section id="expediente" className="scroll-mt-20 border-b border-border/50">
          <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[.75fr_1.25fr]">
            <div>
              <div className="font-mono-tech text-xs uppercase tracking-[0.2em] text-neon-green">
                Identidade institucional
              </div>
              <h2 className="mt-3 font-display text-3xl sm:text-4xl">Expediente</h2>
              <p className="mt-4 max-w-lg text-base leading-relaxed text-muted-foreground">
                O Wire TV é o canal oficial de notícias e inteligência da Veronica Hub. Não é
                um veículo governamental nem representa órgãos públicos.
              </p>
            </div>
            <dl className="overflow-hidden rounded-sm border border-border/60 bg-surface/25">
              {[
                ["Publicação", WIRE_NAME],
                ["Mantenedora", "Veronica Hub"],
                ["Laboratório desenvolvedor", "YO LAB & CO."],
                ["Responsável pelo projeto", "Matheus Amorim"],
                ["Assinatura editorial", "Redação Wire TV"],
                ["Sede declarada", "Balneário Camboriú · Santa Catarina · Brasil"],
              ].map(([term, value]) => (
                <div
                  key={term}
                  className="grid gap-1 border-b border-border/50 px-5 py-4 last:border-0 sm:grid-cols-[190px_1fr] sm:gap-5"
                >
                  <dt className="font-mono-tech text-xs uppercase tracking-wider text-muted-foreground">
                    {term}
                  </dt>
                  <dd className="text-sm font-medium sm:text-base">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section id="metodo" className="scroll-mt-20 mx-auto max-w-7xl px-6 py-16">
          <div className="max-w-2xl">
            <div className="font-mono-tech text-xs uppercase tracking-[0.2em] text-neon-green">
              Política editorial
            </div>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl">Princípios de publicação</h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {PRINCIPLES.map(({ icon: Icon, title, text }, index) => (
              <article key={title} className="rounded-sm border border-border/60 bg-surface/25 p-6">
                <div className="flex items-center justify-between">
                  <Icon className="h-5 w-5 text-neon-green" />
                  <span className="font-mono-tech text-xs text-muted-foreground">0{index + 1}</span>
                </div>
                <h3 className="mt-7 font-display text-xl">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{text}</p>
              </article>
            ))}
          </div>
          <div className="mt-8 grid gap-4 rounded-sm border border-border/60 p-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              "Identificar o fato e sua data",
              "Consultar fontes rastreáveis",
              "Separar projeção de confirmação",
              "Publicar com atribuição e contexto",
            ].map((step, index) => (
              <div key={step} className="flex gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-neon-green" />
                <div>
                  <div className="font-mono-tech text-xs text-muted-foreground">
                    ETAPA {index + 1}
                  </div>
                  <p className="mt-1 text-sm leading-relaxed">{step}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section
          id="tecnologia"
          className="scroll-mt-20 border-y border-border/50 bg-foreground text-background"
        >
          <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[.8fr_1.2fr]">
            <div>
              <div className="flex items-center gap-2 font-mono-tech text-xs uppercase tracking-[0.2em] text-neon-green">
                <Sparkles className="h-4 w-4" /> Tecnologia editorial
              </div>
              <h2 className="mt-3 font-display text-3xl sm:text-4xl">
                Automação com limites claros
              </h2>
            </div>
            <div className="space-y-5 text-base leading-relaxed text-background/70">
              <p>
                O Wire utiliza sistemas automatizados e modelos de inteligência artificial para
                monitorar pautas, organizar referências, estruturar rascunhos e apoiar a
                distribuição.
              </p>
              <p>
                A automação não transforma hipótese em fato. Cada publicação precisa apresentar
                fontes acessíveis, data coerente e conteúdo útil. Pautas sensíveis ou sem
                confirmação suficiente podem ser retidas para avaliação adicional.
              </p>
              <p>
                O uso de tecnologia será aperfeiçoado continuamente, preservando atribuição,
                possibilidade de correção e responsabilidade institucional da Veronica Hub.
              </p>
            </div>
          </div>
        </section>

        <section
          id="correcoes"
          className="scroll-mt-20 mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-2"
        >
          <div>
            <div className="flex items-center gap-2 font-mono-tech text-xs uppercase tracking-[0.2em] text-neon-green">
              <FileClock className="h-4 w-4" /> Política de correções
            </div>
            <h2 className="mt-3 font-display text-3xl">Como corrigimos</h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Correções factuais devem preservar a compreensão do que mudou. Ajustes relevantes
              recebem nova data de atualização e nota explicativa; alterações apenas ortográficas
              não exigem registro público individual.
            </p>
          </div>
          <aside className="rounded-sm border border-neon-green/35 bg-neon-green/[0.06] p-7">
            <h3 className="font-display text-2xl">Encontrou um possível erro?</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Informe o endereço da matéria, o trecho questionado e, quando possível, a fonte que
              sustenta a correção.
            </p>
            <a
              href="mailto:yo-tech01@outlook.com?subject=Solicita%C3%A7%C3%A3o%20de%20corre%C3%A7%C3%A3o%20-%20Veronica%20Wire"
              className="mt-6 inline-flex items-center gap-2 rounded-sm bg-neon-green px-5 py-3 font-mono-tech text-xs uppercase tracking-widest text-primary-foreground transition hover:brightness-110"
            >
              Enviar correção <Mail className="h-4 w-4" />
            </a>
          </aside>
        </section>

        <section id="comercial" className="scroll-mt-20 border-y border-border/50 bg-surface/25">
          <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[.75fr_1.25fr]">
            <div>
              <div className="flex items-center gap-2 font-mono-tech text-xs uppercase tracking-[0.2em] text-neon-green">
                <Building2 className="h-4 w-4" /> Integridade comercial
              </div>
              <h2 className="mt-3 font-display text-3xl">Receita sem vender confiança</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                [
                  "Soluções próprias",
                  "Produtos e formações da Veronica podem ser recomendados depois da matéria, identificados como aplicação prática.",
                ],
                [
                  "Conteúdo patrocinado",
                  "Recebe identificação clara antes do título. O anunciante não compra conclusão editorial nem omissão de informação relevante.",
                ],
                [
                  "Fontes e parceiros",
                  "Ser citado como fonte não significa parceria. O selo de parceiro exige concordância formal.",
                ],
                [
                  "Medição responsável",
                  "Cliques em fontes e ofertas podem ser contabilizados sem armazenar IP, e-mail, cookie ou identificação pessoal.",
                ],
              ].map(([title, text]) => (
                <article
                  key={title}
                  className="rounded-sm border border-border/60 bg-background p-5"
                >
                  <h3 className="font-medium">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="contato" className="scroll-mt-20 mx-auto max-w-7xl px-6 py-16">
          <div className="rounded-sm border border-border/60 bg-foreground p-7 text-background sm:p-10">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <div className="font-mono-tech text-xs uppercase tracking-[0.2em] text-neon-green">
                  Contato institucional
                </div>
                <h2 className="mt-3 font-display text-3xl sm:text-4xl">Fale com a redação</h2>
                <p className="mt-4 max-w-2xl text-base leading-relaxed text-background/65">
                  Correções, direitos de resposta, sugestões de pauta, colaboração editorial e
                  propostas comerciais são tratados por canais identificados.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <a
                  href={SOCIAL_LINKS.email}
                  className="inline-flex items-center gap-2 rounded-sm bg-neon-green px-5 py-3 font-mono-tech text-xs uppercase tracking-widest text-primary-foreground"
                >
                  Enviar e-mail <Mail className="h-4 w-4" />
                </a>
                <Link
                  to="/blog/rede-de-fontes"
                  className="inline-flex items-center gap-2 rounded-sm border border-background/25 px-5 py-3 font-mono-tech text-xs uppercase tracking-widest text-background transition hover:border-neon-green hover:text-neon-green"
                >
                  Rede de Fontes <ExternalLink className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
