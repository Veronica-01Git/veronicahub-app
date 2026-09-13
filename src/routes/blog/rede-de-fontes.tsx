import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  CheckCircle2,
  ExternalLink,
  Mail,
  Network,
  ShieldCheck,
} from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { WirePulseGlobe } from "@/components/blog/WirePulseGlobe";
import { BEAT_LABELS, BEAT_VALUES } from "@/lib/beats";
import { EDITORIAL_CHANNELS } from "@/lib/editorial-network";
import { getSourceNetworkSnapshot } from "@/lib/source-network-server";
import { WIRE_NAME } from "@/lib/ecosystem";

const SITE_URL = "https://veronicahub.com";

export const Route = createFileRoute("/blog/rede-de-fontes")({
  component: SourceNetworkRoute,
  loader: () => getSourceNetworkSnapshot(),
  head: () => ({
    meta: [
      { title: `Rede de Fontes | ${WIRE_NAME}` },
      {
        name: "description",
        content:
          "Conheça os canais editoriais, as fontes citadas e a política de colaboração do Veronica Wire.",
      },
      { property: "og:title", content: `Rede de Fontes | ${WIRE_NAME}` },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/blog/rede-de-fontes` }],
  }),
});

function SourceNetworkRoute() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  if (pathname.replace(/\/$/, "") !== "/blog/rede-de-fontes") return <Outlet />;
  return <SourceNetworkPage />;
}

function SourceNetworkPage() {
  const snapshot = Route.useLoaderData();

  return (
    <div className="home-hybrid min-h-screen overflow-x-hidden bg-background text-foreground">
      <SiteHeader />

      <main>
        <header className="relative overflow-hidden border-b border-border/50">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_76%_32%,color-mix(in_oklch,var(--neon-green)_12%,transparent),transparent_34%)]" />
          <div className="relative mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[1fr_360px] lg:items-end lg:py-24">
            <div>
              <Link
                to="/blog"
                className="inline-flex items-center gap-1.5 font-mono-tech text-xs uppercase tracking-widest text-muted-foreground transition hover:text-neon-green"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao {WIRE_NAME}
              </Link>
              <div className="mt-10 flex items-center gap-2 font-mono-tech text-xs uppercase tracking-[0.2em] text-neon-green">
                <Network className="h-4 w-4" /> Transparência editorial
              </div>
              <h1 className="mt-4 max-w-3xl font-display text-4xl leading-[1.03] sm:text-5xl lg:text-6xl">
                Rede de Fontes
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                Uma visão pública de como o Wire organiza temas, atribui informações e transforma
                referências confiáveis em cobertura contextualizada.
              </p>
            </div>

            <div className="rounded-sm border border-border/60 bg-surface/40 p-6 backdrop-blur">
              <div className="flex items-center justify-between">
                <WirePulseGlobe size={48} />
                <span className="rounded-full border border-neon-green/40 bg-neon-green/10 px-3 py-1 font-mono-tech text-xs uppercase tracking-widest text-neon-green">
                  Rede aberta
                </span>
              </div>
              <div className="mt-8 grid grid-cols-2 gap-5">
                <div>
                  <div className="font-display text-3xl">10</div>
                  <div className="mt-1 text-sm text-muted-foreground">canais editoriais</div>
                </div>
                <div>
                  <div className="font-display text-3xl">{snapshot.sources.length}</div>
                  <div className="mt-1 text-sm text-muted-foreground">domínios citados</div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <section className="mx-auto max-w-7xl px-6 py-16">
          <div className="max-w-2xl">
            <div className="font-mono-tech text-xs uppercase tracking-[0.2em] text-neon-green">
              Dois canais por tema
            </div>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl">Cobertura com foco definido</h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Cada tema possui duas lentes editoriais. Isso reduz dispersão e torna a proposta de
              cada matéria reconhecível para o leitor.
            </p>
          </div>

          <div className="mt-10 grid gap-4 lg:grid-cols-5">
            {BEAT_VALUES.map((beat, beatIndex) => (
              <article key={beat} className="overflow-hidden rounded-sm border border-border/60 bg-surface/30">
                <div className="border-b border-border/50 p-5">
                  <div className="font-mono-tech text-xs text-neon-green">
                    {String(beatIndex + 1).padStart(2, "0")}
                  </div>
                  <h3 className="mt-3 text-base font-semibold leading-snug">{BEAT_LABELS[beat]}</h3>
                </div>
                <div className="divide-y divide-border/50">
                  {EDITORIAL_CHANNELS[beat].map((channel) => (
                    <div key={channel.id} className="p-5">
                      <div className="font-display text-lg">{channel.label}</div>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {channel.description}
                      </p>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-border/50 bg-foreground py-16 text-background">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr]">
              <div>
                <div className="font-mono-tech text-xs uppercase tracking-[0.2em] text-neon-green">
                  Fontes citadas
                </div>
                <h2 className="mt-3 font-display text-3xl sm:text-4xl">Crédito que gera retorno</h2>
                <p className="mt-4 max-w-xl text-base leading-relaxed text-background/65">
                  Cada link de origem recebe identificação de referência da Veronica. A partir de
                  agora, os acessos enviados serão consolidados em relatórios mensais públicos.
                </p>
                <Link
                  to="/blog/rede-de-fontes/relatorios"
                  search={{ month: undefined }}
                  className="mt-7 inline-flex items-center gap-2 rounded-sm border border-neon-green/50 bg-neon-green/10 px-4 py-3 font-mono-tech text-xs uppercase tracking-widest text-neon-green transition hover:bg-neon-green hover:text-primary-foreground"
                >
                  <BarChart3 className="h-4 w-4" /> Abrir relatórios
                </Link>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {snapshot.sources.length > 0 ? (
                  snapshot.sources.slice(0, 12).map((source) => (
                    <div
                      key={source.domain}
                      className="flex items-center justify-between gap-4 rounded-sm border border-background/15 bg-background/[0.04] px-4 py-3"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-background">{source.label}</div>
                        <div className="mt-0.5 truncate text-xs text-background/45">{source.domain}</div>
                      </div>
                      <span className="shrink-0 font-mono-tech text-xs text-neon-green">
                        {source.citations}×
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="rounded-sm border border-background/15 p-5 text-sm text-background/60 sm:col-span-2">
                    A rede será preenchida conforme novas matérias forem publicadas.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-2">
          <div>
            <div className="font-mono-tech text-xs uppercase tracking-[0.2em] text-neon-green">
              Política de relacionamento
            </div>
            <h2 className="mt-3 font-display text-3xl">Da citação à parceria</h2>
            <div className="mt-7 space-y-5">
              {[
                [BookOpenCheck, "Fonte citada", "O veículo foi consultado e recebeu crédito na matéria."],
                [BarChart3, "Resultado documentado", "O tráfego encaminhado aparece no relatório mensal."],
                [Mail, "Convite formal", "A colaboração é proposta com base em dados reais."],
                [ShieldCheck, "Parceiro verificado", "O selo só é liberado depois da concordância entre as partes."],
              ].map(([Icon, title, description], index) => {
                const StepIcon = Icon as typeof CheckCircle2;
                return (
                  <div key={String(title)} className="grid grid-cols-[38px_1fr] gap-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-surface/40">
                      <StepIcon className="h-4 w-4 text-neon-green" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono-tech text-xs text-muted-foreground">0{index + 1}</span>
                        <h3 className="font-medium">{String(title)}</h3>
                      </div>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {String(description)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <aside className="rounded-sm border border-neon-green/35 bg-[linear-gradient(145deg,color-mix(in_oklch,var(--neon-green)_9%,transparent),transparent_58%)] p-7 sm:p-9">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 px-3 py-1 font-mono-tech text-xs uppercase tracking-widest text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 text-neon-green" /> Canal institucional
            </div>
            <h2 className="mt-6 font-display text-3xl">Seu veículo na Rede Veronica</h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Veículos, pesquisadores e instituições podem solicitar o relatório de referências e
              iniciar uma conversa sobre colaboração editorial.
            </p>
            <p className="mt-5 border-l-2 border-neon-green pl-4 text-sm leading-relaxed text-muted-foreground">
              Estar listado como fonte citada não significa parceria. A identificação de parceiro é
              publicada somente após autorização formal.
            </p>
            <a
              href="mailto:yo-tech01@outlook.com?subject=Rede%20de%20Fontes%20Veronica%20Wire"
              className="mt-7 inline-flex items-center gap-2 rounded-sm bg-neon-green px-5 py-3 font-mono-tech text-xs uppercase tracking-widest text-primary-foreground transition hover:brightness-110"
            >
              Solicitar contato <ArrowRight className="h-4 w-4" />
            </a>
            <Link
              to="/selos"
              className="ml-0 mt-3 inline-flex items-center gap-2 px-2 py-3 font-mono-tech text-xs uppercase tracking-widest text-muted-foreground transition hover:text-foreground sm:ml-3"
            >
              Registro de selos <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </aside>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
