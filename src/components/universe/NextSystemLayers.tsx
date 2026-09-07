import { Layers, ShieldCheck, Sparkles } from "lucide-react";

const CANON_LAYERS = [
  ["ESSENCE", "ACTIVE", "Propósito, promessa, princípios e filtros canônicos."],
  ["CHARACTER BIBLE", "ACTIVE", "Arquétipo, modos de expressão, invariantes e limites."],
  ["VISUAL SYSTEM", "ACTIVE", "Gramática ótica, tokens, motion e matriz por produto."],
  ["VOICE INTELLIGENCE", "ACTIVE", "Cadência, tom, TTS direction e regras verbais."],
  ["MEDIA INTELLIGENCE", "ACTIVE", "Ciclo de vida, critérios e matriz de uso de mídia."],
  ["PROMPT LAB", "ACTIVE", "Diretivas canônicas reutilizáveis e model-agnostic."],
  ["DECISION INTELLIGENCE", "ADVISORY", "Matriz consultiva de alinhamento antes de execução."],
  ["GUARDIAN", "PASSIVE", "Auditoria manual de conformidade sem automação ou bloqueio."],
  ["ASK UNIVERSE", "READ ONLY", "Consulta do cânone versionado com fallback local seguro."],
] as const;

export function NextSystemLayers() {
  return (
    <div data-universe-element="future" className="my-12 grid grid-cols-1 gap-6 lg:grid-cols-3" aria-label="Estado e evolução do Veronica Universe">
      <section className="rounded-sm border border-border/50 bg-surface/20 p-6 lg:col-span-2">
        <div className="flex items-center justify-between gap-3 border-b border-border/40 pb-4">
          <div className="flex items-center gap-2"><Layers className="h-4 w-4 text-neon-cyan" /><h3 className="font-mono-tech text-xs tracking-widest text-foreground uppercase">CANONICAL SYSTEM [ CURRENT STATE ]</h3></div>
          <span className="font-mono-tech text-[9px] tracking-widest text-neon-green">ADMIN V1 CORE READY</span>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {CANON_LAYERS.map(([name, status, description]) => (
            <div key={name} className="rounded-sm border border-border/30 bg-background/40 p-3.5 transition hover:border-border/70">
              <div className="flex items-center justify-between gap-2"><span className="font-mono-tech text-xs font-medium text-foreground">{name}</span><span className={`rounded border px-1.5 py-0.5 font-mono-tech text-[9px] tracking-widest ${status === "ACTIVE" ? "border-neon-green/30 bg-neon-green/10 text-neon-green" : "border-neon-cyan/30 bg-neon-cyan/10 text-neon-cyan"}`}>{status}</span></div>
              <p className="mt-2 font-sans text-xs leading-relaxed text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col justify-between rounded-sm border border-border/60 bg-surface/30 p-6">
        <div>
          <div className="flex items-center justify-between border-b border-border/40 pb-4">
            <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-neon-cyan" /><h3 className="font-mono-tech text-xs tracking-widest text-foreground uppercase">NEXT CREATIVE SYSTEM</h3></div>
            <span className="rounded border border-neon-green/30 bg-neon-green/10 px-2 py-0.5 font-mono-tech text-[9px] tracking-widest text-neon-green uppercase">NEXT</span>
          </div>
          <div className="mt-5">
            <span className="block font-mono-tech text-[10px] tracking-widest text-neon-green uppercase">[ VERONICA CONSISTENT AVATAR ]</span>
            <p className="mt-2 font-sans text-sm leading-relaxed text-foreground/80">A próxima frente transforma Character, Visual, Voice, Media e Prompt Lab em uma identidade visual consistente para imagem e vídeo. O objetivo é criar uma Veronica reconhecível entre ferramentas, ângulos, roupas e cenas.</p>
          </div>
          <div className="mt-6 space-y-2 rounded-sm border border-border/40 bg-background/50 p-4 font-mono-tech text-xs text-muted-foreground">
            <div className="flex justify-between gap-3"><span>CANON READ:</span><span className="text-neon-green">READY</span></div>
            <div className="flex justify-between gap-3"><span>REFERENCE SET:</span><span>NEXT</span></div>
            <div className="flex justify-between gap-3"><span>FACE CONSISTENCY:</span><span>NEXT</span></div>
            <div className="flex justify-between gap-3"><span>VIDEO CONTINUITY:</span><span>NEXT</span></div>
          </div>
        </div>
        <div className="mt-6 border-t border-border/30 pt-4 font-mono-tech text-[10px] text-muted-foreground"><Sparkles className="mr-1 inline h-3 w-3 text-neon-cyan" /> ADMIN STAYS GOVERNANCE; AVATAR BECOMES THE NEXT BUILD TRACK</div>
      </section>
    </div>
  );
}
