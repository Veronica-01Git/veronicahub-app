import { Layers, Shield, Sparkles } from "lucide-react";

const CANON_LAYERS = [
  { id: "essence", name: "ESSENCE", status: "ACTIVE", description: "Propósito, promessa, princípios não negociáveis e filtros de decisão." },
  { id: "character", name: "CHARACTER BIBLE", status: "ACTIVE", description: "Arquétipo, modos de expressão, invariantes e limites comportamentais." },
  { id: "visual", name: "VISUAL SYSTEM", status: "ACTIVE", description: "Gramática ótica, tokens, composição, motion e matriz visual por produto." },
  { id: "voice", name: "VOICE INTELLIGENCE", status: "ACTIVE", description: "Cadência, tom, TTS direction e regras verbais por contexto." },
  { id: "media", name: "MEDIA INTELLIGENCE", status: "ACTIVE", description: "Ciclo de vida, critérios e matriz de uso de imagem e vídeo." },
  { id: "prompt", name: "PROMPT LAB", status: "ACTIVE", description: "Diretivas canônicas reutilizáveis para imagem, vídeo, ensino, editorial e governança." },
  { id: "decisions", name: "DECISION INTELLIGENCE", status: "ADVISORY", description: "Matriz de alinhamento para revisar novas iniciativas sem executar ações automaticamente." },
] as const;

export function NextSystemLayers() {
  return (
    <div data-universe-element="future" className="my-12 grid grid-cols-1 gap-6 lg:grid-cols-3" aria-label="Camadas do Veronica Universe">
      <section className="rounded-sm border border-border/50 bg-surface/20 p-6 lg:col-span-2">
        <div className="flex items-center justify-between gap-3 border-b border-border/40 pb-4">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-neon-cyan" />
            <h3 className="font-mono-tech text-xs tracking-widest text-foreground uppercase">CANONICAL LAYERS [ CURRENT STATE ]</h3>
          </div>
          <span className="font-mono-tech text-[9px] tracking-widest text-neon-green">PHASE 2 CORE COMPLETE</span>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {CANON_LAYERS.map((layer) => (
            <div key={layer.id} className="flex flex-col justify-between rounded-sm border border-border/30 bg-background/40 p-3.5 transition hover:border-border/70">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono-tech text-xs font-medium text-foreground">{layer.name}</span>
                  <span className={`rounded border px-1.5 py-0.5 font-mono-tech text-[9px] tracking-widest ${layer.status === "ACTIVE" ? "border-neon-green/30 bg-neon-green/10 text-neon-green" : "border-neon-cyan/30 bg-neon-cyan/10 text-neon-cyan"}`}>{layer.status}</span>
                </div>
                <p className="mt-2 font-sans text-xs leading-relaxed text-muted-foreground">{layer.description}</p>
              </div>
              <div className="mt-3 font-mono-tech text-[9px] text-muted-foreground/60 uppercase">// CANONICAL MODULE AVAILABLE</div>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col justify-between rounded-sm border border-border/60 bg-surface/30 p-6">
        <div>
          <div className="flex items-center justify-between border-b border-border/40 pb-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-mono-tech text-xs tracking-widest text-foreground uppercase">VERONICA GUARDIAN</h3>
            </div>
            <span className="rounded border border-neon-cyan/25 bg-neon-cyan/5 px-2 py-0.5 font-mono-tech text-[9px] tracking-widest text-neon-cyan uppercase">NEXT</span>
          </div>

          <div className="mt-5">
            <span className="block font-mono-tech text-[10px] tracking-widest text-neon-green uppercase">[ PHASE 3 / PASSIVE AUDIT FIRST ]</span>
            <p className="mt-2 font-sans text-sm leading-relaxed text-foreground/80">Próxima camada: auditoria consultiva usando Essence, Character, Visual, Voice, Media, Prompt Lab e Decisions como fonte de verdade. A primeira versão apenas sinaliza conflitos; não altera nenhum produto.</p>
          </div>

          <div className="mt-6 space-y-2 rounded-sm border border-border/40 bg-background/50 p-4 font-mono-tech text-xs text-muted-foreground">
            <div className="flex justify-between gap-3"><span>CANONICAL COMPLIANCE:</span><span className="text-neon-cyan">READY FOR DESIGN</span></div>
            <div className="flex justify-between gap-3"><span>TONE MONITOR:</span><span>STANDBY</span></div>
            <div className="flex justify-between gap-3"><span>AUTONOMY THRESHOLD:</span><span>DISABLED</span></div>
          </div>
        </div>

        <div className="mt-6 border-t border-border/30 pt-4 font-mono-tech text-[10px] text-muted-foreground">
          <Sparkles className="mr-1 inline h-3 w-3 text-neon-cyan" /> NEXT: GUARDIAN ADVISORY / NO AUTO-ACTIONS
        </div>
      </section>
    </div>
  );
}
