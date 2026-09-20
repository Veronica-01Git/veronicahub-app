import { PRODUCTS } from "@/lib/ecosystem";
import { createFileRoute } from "@tanstack/react-router";
import { getUniverseAdminAccess } from "@/lib/veronica-universe-access";
import { getAdminOverview } from "@/lib/admin-server";
import { getPublishedArticles } from "@/lib/articles-server";
import { getWireCommercialSnapshot } from "@/lib/wire-commerce-server";
import { useEffect, useState } from "react";
import { ShieldAlert, Loader2, ArrowLeft, Compass, Database } from "lucide-react";
import { UniverseShell } from "@/components/universe/UniverseShell";
import { EcosystemConstellation } from "@/components/universe/EcosystemConstellation";
import { CharacterBible } from "@/components/universe/CharacterBible";
import {
  UniverseToday,
  type UniverseSnapshot,
} from "@/components/universe/UniverseToday";
import {
  UniverseRevenue,
  UniverseCustomers,
  UniverseFunnels,
  UniverseHealth,
} from "@/components/universe/UniverseOperations";
import { ECOSYSTEM_NODES, type UniverseTab } from "@/components/universe/types";

export const Route = createFileRoute("/admin/veronica-universe")({
  component: VeronicaUniversePage,
  head: () => ({
    meta: [{ title: "Veronica Universe · Operating System | Veronica Hub" }],
  }),
});

type AdminState = Awaited<ReturnType<typeof getUniverseAdminAccess>>;

const TAB_METADATA: Record<UniverseTab, { title: string; subtitle: string }> = {
  "00": { title: "TODAY", subtitle: "Executive operating view" },
  "01": { title: "ESSENCE", subtitle: "Brand core archetype & principles" },
  "02": { title: "ECOSYSTEM", subtitle: "Topology, products & interconnections" },
  "03": { title: "CHARACTER", subtitle: "Character bible & behavioral canon" },
  "04": { title: "VISUAL SYSTEM", subtitle: "Optical grammar, motion & design tokens" },
  "05": { title: "VOICE", subtitle: "Acoustic tone, cadence & vocal synthesis" },
  "06": { title: "MEDIA", subtitle: "Editorial and distribution intelligence" },
  "07": { title: "PROMPT LAB", subtitle: "Directives, skills & automations" },
  "08": { title: "DECISIONS", subtitle: "Founder decisions & governance" },
  "09": { title: "MONEY", subtitle: "Verified financial signals" },
  "10": { title: "CUSTOMERS", subtitle: "Veronica ID & customer view" },
  "11": { title: "FUNNELS", subtitle: "Telemetry coverage & conversion gaps" },
  "12": { title: "SYSTEM HEALTH", subtitle: "Connected capabilities & truth layer" },
};

function VeronicaUniversePage() {
  const [authState, setAuthState] = useState<AdminState | { ok: false; error: string } | null>(null);
  const [snapshot, setSnapshot] = useState<UniverseSnapshot | null>(null);
  const [snapshotError, setSnapshotError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<UniverseTab>("00");

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      try {
        const access = await getUniverseAdminAccess();
        if (cancelled) return;
        setAuthState(access);

        if (!access.ok) return;

        try {
          const [overview, articles, wire] = await Promise.all([
            getAdminOverview(),
            getPublishedArticles(),
            getWireCommercialSnapshot(),
          ]);

          if (cancelled) return;
          setSnapshot({ overview, articles, wire });
        } catch (error) {
          if (cancelled) return;
          setSnapshotError(
            error instanceof Error ? error.message : "Falha ao carregar a telemetria do Universe.",
          );
        }
      } catch (error) {
        if (cancelled) return;
        setAuthState({
          ok: false,
          error:
            error instanceof Error ? error.message : "Falha na validação de sessão administrativa.",
        });
      }
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!authState) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
        <div className="flex items-center gap-3 font-mono-tech text-xs uppercase tracking-widest text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-neon-green" />
          <span>INICIALIZANDO VERONICA UNIVERSE…</span>
        </div>
      </div>
    );
  }

  if (!authState.ok) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-foreground">
        <div className="w-full max-w-md rounded-sm border border-destructive/40 bg-destructive/5 p-6 backdrop-blur">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-6 w-6 shrink-0 text-destructive" />
            <div>
              <h2 className="font-display text-lg font-bold text-foreground">Acesso Restrito</h2>
              <p className="mt-1 font-mono-tech text-xs text-muted-foreground">{authState.error}</p>
              <p className="mt-4 text-xs text-muted-foreground">
                A rota <code className="text-foreground">/admin/veronica-universe</code> exige
                autenticação de administrador.
              </p>
              <a
                href="/"
                className="mt-5 inline-flex items-center gap-1.5 rounded-sm border border-border/60 px-3 py-2 font-mono-tech text-xs text-foreground transition hover:border-foreground"
              >
                <ArrowLeft className="h-3 w-3" />
                Voltar ao início
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <UniverseShell
      activeTab={activeTab}
      onSelectTab={setActiveTab}
      adminEmail={authState.admin?.email}
    >
      {!snapshot && !snapshotError && (
        <div className="flex min-h-[420px] items-center justify-center rounded-sm border border-border/50 bg-surface/20">
          <div className="flex items-center gap-3 font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-neon-green" />
            conectando dados operacionais…
          </div>
        </div>
      )}

      {snapshotError && (
        <div className="rounded-sm border border-destructive/40 bg-destructive/5 p-5">
          <div className="flex items-start gap-3">
            <Database className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
            <div>
              <h2 className="text-sm font-medium text-foreground">Telemetria não carregada</h2>
              <p className="mt-1 text-xs text-muted-foreground">{snapshotError}</p>
              <p className="mt-3 text-xs text-muted-foreground">
                O acesso ao Universe continua protegido; recarregue a página para tentar novamente.
              </p>
            </div>
          </div>
        </div>
      )}

      {snapshot && activeTab === "00" && <UniverseToday snapshot={snapshot} />}
      {snapshot && activeTab === "09" && <UniverseRevenue snapshot={snapshot} />}
      {snapshot && activeTab === "10" && <UniverseCustomers snapshot={snapshot} />}
      {snapshot && activeTab === "11" && <UniverseFunnels snapshot={snapshot} />}
      {snapshot && activeTab === "12" && <UniverseHealth snapshot={snapshot} />}

      {snapshot && activeTab === "02" && (
        <div className="flex flex-col gap-8">
          <div className="border-b border-border/40 pb-4">
            <div className="font-mono-tech text-[9px] uppercase tracking-[0.2em] text-neon-cyan">
              ECOSYSTEM / TOPOLOGY
            </div>
            <h1 className="mt-2 font-display text-3xl tracking-tight text-foreground sm:text-4xl">
              O mapa vivo da Veronica.
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Relações do ecossistema no mapa; disponibilidade e links vêm do registro canônico de
              produtos.
            </p>
          </div>

          <EcosystemConstellation />

          <section className="rounded-sm border border-border/50 bg-surface/20 p-5 sm:p-7">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-mono-tech text-[10px] uppercase tracking-widest text-foreground">
                Product directory ({PRODUCTS.length})
              </h2>
              <span className="font-mono-tech text-[9px] uppercase tracking-widest text-neon-green">
                canonical registry
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left text-xs">
                <thead className="font-mono-tech text-[9px] uppercase tracking-widest text-muted-foreground">
                  <tr className="border-b border-border/40">
                    <th className="px-3 py-3">#</th>
                    <th className="px-3 py-3">Produto</th>
                    <th className="px-3 py-3">Categoria</th>
                    <th className="px-3 py-3">Relação</th>
                    <th className="px-3 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {PRODUCTS.map((node, index) => {
                    const mapped = ECOSYSTEM_NODES.find((item) => item.id === node.id);
                    return (
                      <tr key={node.id} className="bg-background/35 transition hover:bg-surface/30">
                        <td className="px-3 py-3 font-mono-tech text-[9px] text-neon-cyan">
                          {String(index + 1).padStart(2, "0")}
                        </td>
                        <td className="px-3 py-3">
                          <a
                            href={node.to}
                            target={node.external ? "_blank" : undefined}
                            rel={node.external ? "noopener noreferrer" : undefined}
                            className="font-medium text-foreground underline-offset-4 hover:underline"
                          >
                            {node.name}
                          </a>
                        </td>
                        <td className="px-3 py-3 text-muted-foreground">{node.category}</td>
                        <td className="px-3 py-3 font-mono-tech text-[9px] uppercase text-foreground/80">
                          {mapped?.relation ?? "directory"}
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className={
                              "inline-flex items-center gap-1 rounded-full border px-2 py-1 font-mono-tech text-[8px] uppercase tracking-wider " +
                              (node.status === "Disponível"
                                ? "border-neon-green/30 bg-neon-green/5 text-neon-green"
                                : node.status === "Parcial"
                                  ? "border-neon-cyan/30 bg-neon-cyan/5 text-neon-cyan"
                                  : "border-border/50 bg-muted/20 text-muted-foreground")
                            }
                          >
                            <span className="h-1 w-1 rounded-full bg-current" />
                            {node.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {snapshot && activeTab === "03" && <CharacterBible />}

      {snapshot && activeTab === "08" && (
        <div className="rounded-sm border border-border/50 bg-surface/20 p-7 sm:p-10">
          <div className="font-mono-tech text-[9px] uppercase tracking-[0.2em] text-neon-cyan">
            GOVERNANCE / DECISIONS
          </div>
          <h1 className="mt-3 font-display text-3xl text-foreground sm:text-4xl">
            Decisões precisam de memória.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            A interface está reservada, mas ainda não existe persistência canônica para hipóteses,
            decisões, impacto e resultado. Esta versão não inventa decisões salvas.
          </p>
          <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-border/50 bg-muted/20 px-3 py-1 font-mono-tech text-[9px] uppercase tracking-widest text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
            módulo sem persistência
          </div>
        </div>
      )}

      {snapshot &&
        !["00", "02", "03", "08", "09", "10", "11", "12"].includes(activeTab) && (
          <div className="my-8 flex flex-col items-center justify-center rounded-sm border border-border/50 bg-surface/20 p-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border/60 bg-background/50">
              <Compass className="h-6 w-6 animate-pulse text-neon-cyan" />
            </div>
            <div className="mt-5 font-mono-tech text-[9px] uppercase tracking-widest text-muted-foreground">
              MODULE {activeTab} / STRUCTURE
            </div>
            <h2 className="mt-2 font-display text-3xl text-foreground">
              {TAB_METADATA[activeTab].title}
            </h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              {TAB_METADATA[activeTab].subtitle}
            </p>
            <div className="mt-6 rounded-full border border-border/60 bg-muted/20 px-3 py-1 font-mono-tech text-[9px] uppercase tracking-widest text-muted-foreground">
              ainda não conectado
            </div>
            <button
              type="button"
              onClick={() => setActiveTab("00")}
              className="mt-8 inline-flex items-center gap-2 rounded-sm border border-border/60 bg-surface/50 px-4 py-2 font-mono-tech text-xs text-foreground transition hover:border-neon-green/50 hover:text-neon-green"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Voltar para Today
            </button>
          </div>
        )}
    </UniverseShell>
  );
}
