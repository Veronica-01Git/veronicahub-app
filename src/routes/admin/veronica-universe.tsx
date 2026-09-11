import { PRODUCTS } from "@/lib/ecosystem";
import { createFileRoute } from "@tanstack/react-router";
import { getUniverseAdminAccess } from "@/lib/veronica-universe-access";
import { useEffect, useState } from "react";
import { ShieldAlert, Loader2, ArrowLeft, Compass } from "lucide-react";
import { UniverseShell } from "@/components/universe/UniverseShell";
import { UniverseHero } from "@/components/universe/UniverseHero";
import { EcosystemConstellation } from "@/components/universe/EcosystemConstellation";
import { SystemStatus } from "@/components/universe/SystemStatus";
import { NextSystemLayers } from "@/components/universe/NextSystemLayers";
import { CharacterBible } from "@/components/universe/CharacterBible";
import { ECOSYSTEM_NODES, type UniverseTab } from "@/components/universe/types";

export const Route = createFileRoute("/admin/veronica-universe")({
  component: VeronicaUniversePage,
  head: () => ({
    meta: [{ title: "Veronica Universe · Admin | Veronica Hub" }],
  }),
});

type AdminState = Awaited<ReturnType<typeof getUniverseAdminAccess>>;

const TAB_METADATA: Record<UniverseTab, { title: string; subtitle: string }> = {
  "00": { title: "OVERVIEW", subtitle: "Root System & Ecosystem Map" },
  "01": { title: "ESSENCE", subtitle: "Brand Core Archetype & Principles" },
  "02": { title: "ECOSYSTEM", subtitle: "Constellation Topology & Interconnections" },
  "03": { title: "CHARACTER", subtitle: "Character Bible & Behavioral Canon" },
  "04": { title: "VISUAL SYSTEM", subtitle: "Optical Grammar, Motion & Design Tokens" },
  "05": { title: "VOICE", subtitle: "Acoustic Tone, Cadence & Vocal Synthesis" },
  "06": { title: "MEDIA", subtitle: "Radar & Algorithmic Narrative Distribution" },
  "07": { title: "PROMPT LAB", subtitle: "Directives, Reasoning Chains & Automations" },
  "08": { title: "DECISIONS", subtitle: "Governance, Expansion Thresholds & Brand Matrix" },
};

function VeronicaUniversePage() {
  const [authState, setAuthState] = useState<AdminState | { ok: false; error: string } | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState<UniverseTab>("00");

  useEffect(() => {
    getUniverseAdminAccess()
      .then(setAuthState)
      .catch((err) =>
        setAuthState({
          ok: false,
          error:
            err instanceof Error ? err.message : "Falha na validação de sessão administrativa.",
        }),
      );
  }, []);

  // Loading state
  if (!authState) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
        <div className="flex items-center gap-3 font-mono-tech text-xs tracking-widest text-muted-foreground uppercase">
          <Loader2 className="h-4 w-4 animate-spin text-neon-green" />
          <span>INICIALIZANDO VERONICA UNIVERSE CORE…</span>
        </div>
      </div>
    );
  }

  // Access denied state
  if (!authState.ok) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-foreground">
        <div className="w-full max-w-md rounded-sm border border-destructive/40 bg-destructive/5 p-6 backdrop-blur">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-6 w-6 flex-shrink-0 text-destructive" />
            <div>
              <h2 className="font-display text-lg font-bold text-foreground">Acesso Restrito</h2>
              <p className="mt-1 font-mono-tech text-xs text-muted-foreground">{authState.error}</p>
              <p className="mt-4 text-xs text-muted-foreground">
                A rota <code className="text-foreground">/admin/veronica-universe</code> exige
                autenticação de administrador. Realize login com e-mail autorizado através da
                interface principal.
              </p>
              <div className="mt-5">
                <a
                  href="/"
                  className="inline-flex items-center gap-1.5 rounded-sm border border-border/60 px-3 py-1.5 font-mono-tech text-xs text-foreground transition hover:border-foreground"
                >
                  <ArrowLeft className="h-3 w-3" />
                  <span>Voltar ao início</span>
                </a>
              </div>
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
      {/* ===================================================================== */}
      {/* 00 / OVERVIEW TAB (Full System View)                                 */}
      {/* ===================================================================== */}
      {activeTab === "00" && (
        <div className="flex flex-col gap-2">
          <UniverseHero
            onOpenCommand={() => {
              window.dispatchEvent(
                new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }),
              );
            }}
            onExploreEcosystem={() => setActiveTab("02")}
          />

          <EcosystemConstellation />

          <SystemStatus />

          <NextSystemLayers />
        </div>
      )}

      {/* ===================================================================== */}
      {/* 02 / ECOSYSTEM TAB (Deep Dive Constellation & Directory)             */}
      {/* ===================================================================== */}
      {activeTab === "02" && (
        <div className="flex flex-col gap-8">
          <div className="border-b border-border/40 pb-4">
            <div className="font-mono-tech text-[10px] tracking-widest text-muted-foreground uppercase">
              MODULE 02 / DEEP DIVE
            </div>
            <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Ecosystem Topology & Node Directory
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Mapa das áreas do ecossistema e sua disponibilidade editorial.
            </p>
          </div>

          <EcosystemConstellation />

          {/* Node Directory Table */}
          <section className="rounded-sm border border-border/50 bg-surface/20 p-5 sm:p-7">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-mono-tech text-xs tracking-widest text-foreground uppercase">
                NODE SPECIFICATION DIRECTORY ({PRODUCTS.length})
              </h2>
              <span className="font-mono-tech text-[10px] text-neon-green">
                STATUS DO CATÁLOGO
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] border-collapse text-left text-xs font-mono-tech">
                <thead>
                  <tr className="border-b border-border/40 text-muted-foreground">
                    <th className="py-2.5 px-3">VECTOR</th>
                    <th className="py-2.5 px-3">NODE</th>
                    <th className="py-2.5 px-3">CATEGORY</th>
                    <th className="py-2.5 px-3">RELATION</th>
                    <th className="py-2.5 px-3">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {PRODUCTS.map((node, index) => (
                    <tr key={node.id} className="hover:bg-surface/30 transition">
                      <td className="py-3 px-3 text-neon-cyan">{String(index + 1).padStart(2, "0")}</td>
                      <td className="py-3 px-3 font-medium text-foreground"><a href={node.to} className="underline underline-offset-4">{node.name}</a></td>
                      <td className="py-3 px-3 text-muted-foreground">{node.category}</td>
                      <td className="py-3 px-3 uppercase text-foreground/80">{ECOSYSTEM_NODES.find(item => item.id === node.id)?.relation ?? "—"}</td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1 rounded bg-neon-green/10 px-2 py-0.5 text-[9px] text-neon-green">
                          <span className="h-1 w-1 rounded-full bg-neon-green" />
                          {node.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {activeTab === "03" && <CharacterBible />}

      {/* ===================================================================== */}
      {/* IN DEVELOPMENT MODULES (01, 03-08)                                   */}
      {/* ===================================================================== */}
      {activeTab !== "00" && activeTab !== "02" && activeTab !== "03" && (
        <div className="my-12 flex flex-col items-center justify-center rounded-sm border border-border/50 bg-surface/20 p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border/60 bg-background/50">
            <Compass className="h-6 w-6 text-neon-cyan animate-pulse" />
          </div>

          <div className="mt-5 font-mono-tech text-[10px] tracking-widest text-muted-foreground uppercase">
            MODULE {activeTab} / SYSTEM ARCHITECTURE
          </div>

          <h2 className="mt-2 font-display text-3xl font-bold text-foreground">
            {TAB_METADATA[activeTab].title}
          </h2>

          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            {TAB_METADATA[activeTab].subtitle}
          </p>

          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/20 px-3 py-1 font-mono-tech text-xs text-muted-foreground uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
            STATUS: IN DEVELOPMENT (PHASE 2+)
          </div>

          <p className="mt-4 max-w-lg text-xs text-muted-foreground font-mono-tech leading-relaxed">
            As especificações canônicas desta camada serão orquestradas e consolidadas nas próximas
            iterações do Veronica Universe.
          </p>

          <button
            type="button"
            onClick={() => setActiveTab("00")}
            className="mt-8 inline-flex items-center gap-2 rounded-sm border border-border/60 bg-surface/50 px-4 py-2 font-mono-tech text-xs text-foreground transition hover:border-neon-green/50 hover:text-neon-green"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Retornar ao Overview (00)</span>
          </button>
        </div>
      )}
    </UniverseShell>
  );
}
