import { createFileRoute } from "@tanstack/react-router";
import { getUniverseAdminAccess } from "@/lib/veronica-universe-access";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, ShieldAlert } from "lucide-react";
import { UniverseShell } from "@/components/universe/UniverseShell";
import { UniverseHero } from "@/components/universe/UniverseHero";
import { EssenceModule } from "@/components/universe/EssenceModule";
import { EcosystemConstellation } from "@/components/universe/EcosystemConstellation";
import { CharacterModule } from "@/components/universe/CharacterModule";
import { VisualSystemModule } from "@/components/universe/VisualSystemModule";
import { VoiceModule } from "@/components/universe/VoiceModule";
import { MediaModule } from "@/components/universe/MediaModule";
import { PromptLabModule } from "@/components/universe/PromptLabModule";
import { DecisionsModule } from "@/components/universe/DecisionsModule";
import { SystemStatus } from "@/components/universe/SystemStatus";
import { NextSystemLayers } from "@/components/universe/NextSystemLayers";
import { ECOSYSTEM_NODES, type UniverseTab } from "@/components/universe/types";

export const Route = createFileRoute("/admin/veronica-universe")({
  component: VeronicaUniversePage,
  head: () => ({
    meta: [{ title: "Veronica Universe · Admin | Veronica Hub" }],
  }),
});

type AdminState = Awaited<ReturnType<typeof getUniverseAdminAccess>>;

function VeronicaUniversePage() {
  const [authState, setAuthState] = useState<AdminState | { ok: false; error: string } | null>(null);
  const [activeTab, setActiveTab] = useState<UniverseTab>("00");

  useEffect(() => {
    getUniverseAdminAccess()
      .then(setAuthState)
      .catch((err) =>
        setAuthState({
          ok: false,
          error: err instanceof Error ? err.message : "Falha na validação de sessão administrativa.",
        }),
      );
  }, []);

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
                A rota <code className="text-foreground">/admin/veronica-universe</code> exige autenticação de administrador.
                Realize login com e-mail autorizado através da interface principal.
              </p>
              <div className="mt-5">
                <a href="/" className="inline-flex items-center gap-1.5 rounded-sm border border-border/60 px-3 py-1.5 font-mono-tech text-xs text-foreground transition hover:border-foreground">
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
    <UniverseShell activeTab={activeTab} onSelectTab={setActiveTab} adminEmail={authState.admin?.email}>
      {activeTab === "00" && (
        <div className="flex flex-col gap-2">
          <UniverseHero
            onOpenCommand={() => {
              window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }));
            }}
            onExploreEcosystem={() => setActiveTab("02")}
          />
          <EcosystemConstellation />
          <SystemStatus />
          <NextSystemLayers />
        </div>
      )}

      {activeTab === "01" && <EssenceModule />}

      {activeTab === "02" && (
        <div className="flex flex-col gap-8">
          <div className="border-b border-border/40 pb-4">
            <div className="font-mono-tech text-[10px] tracking-widest text-muted-foreground uppercase">MODULE 02 / DEEP DIVE</div>
            <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Ecosystem Topology & Node Directory</h1>
            <p className="mt-2 text-sm text-muted-foreground">Estrutura de todas as 8 extensões ativas conectadas ao Veronica Core.</p>
          </div>

          <EcosystemConstellation />

          <section className="rounded-sm border border-border/50 bg-surface/20 p-5 sm:p-7">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-mono-tech text-xs tracking-widest text-foreground uppercase">NODE SPECIFICATION DIRECTORY (08 NODES)</h2>
              <span className="font-mono-tech text-[10px] text-neon-green">ALL NODES VALIDATED</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] border-collapse text-left text-xs font-mono-tech">
                <thead>
                  <tr className="border-b border-border/40 text-muted-foreground">
                    <th className="px-3 py-2.5">VECTOR</th><th className="px-3 py-2.5">NODE</th><th className="px-3 py-2.5">CATEGORY</th><th className="px-3 py-2.5">RELATION</th><th className="px-3 py-2.5">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {ECOSYSTEM_NODES.map((node) => (
                    <tr key={node.id} className="transition hover:bg-surface/30">
                      <td className="px-3 py-3 text-neon-cyan">{node.vector}</td>
                      <td className="px-3 py-3 font-medium text-foreground">{node.name}</td>
                      <td className="px-3 py-3 text-muted-foreground">{node.category}</td>
                      <td className="px-3 py-3 uppercase text-foreground/80">{node.relation}</td>
                      <td className="px-3 py-3"><span className="inline-flex items-center gap-1 rounded bg-neon-green/10 px-2 py-0.5 text-[9px] text-neon-green"><span className="h-1 w-1 rounded-full bg-neon-green" />{node.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {activeTab === "03" && <CharacterModule />}
      {activeTab === "04" && <VisualSystemModule />}
      {activeTab === "05" && <VoiceModule />}
      {activeTab === "06" && <MediaModule />}
      {activeTab === "07" && <PromptLabModule />}
      {activeTab === "08" && <DecisionsModule />}
    </UniverseShell>
  );
}
