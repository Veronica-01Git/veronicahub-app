import { Layers, Shield, Sparkles } from "lucide-react";

interface NextLayer {
  id: string;
  name: string;
  status: "ACTIVE" | "NEXT" | "WAITING" | "OFFLINE";
  description: string;
}

const NEXT_LAYERS_DATA: NextLayer[] = [
  {
    id: "character",
    name: "CHARACTER BIBLE",
    status: "ACTIVE",
    description:
      "Cânone narrativo, biografia sintética, arquétipo, limites éticos e tom comportamental.",
  },
  {
    id: "visual",
    name: "VISUAL SYSTEM",
    status: "NEXT",
    description:
      "Gramática ótica, proporções cinéticas, paletas semânticas e estética dimensional.",
  },
  {
    id: "voice",
    name: "VOICE INTELLIGENCE",
    status: "NEXT",
    description: "Cadência sonora, modelo acústico, entonação proprietária e síntese vocal neural.",
  },
  {
    id: "media",
    name: "MEDIA INTELLIGENCE",
    status: "NEXT",
    description:
      "Curadoria algorítmica de narrativas digitais, reverberação e monitoramento de canais.",
  },
  {
    id: "prompt",
    name: "PROMPT LAB",
    status: "WAITING",
    description:
      "Laboratório de diretivas avançadas, auto-otimização e cadeias de raciocínio de marca.",
  },
  {
    id: "decisions",
    name: "DECISION INTELLIGENCE",
    status: "WAITING",
    description:
      "Critérios de validação para novas parcerias, lançamentos e alinhamento de ecossistema.",
  },
];

export function NextSystemLayers() {
  return (
    <div
      data-universe-element="future"
      className="my-12 grid grid-cols-1 gap-6 lg:grid-cols-3"
      aria-label="Futuras Camadas do Sistema"
    >
      {/* 2 Columns: Next System Layers List */}
      <section className="lg:col-span-2 rounded-sm border border-border/50 bg-surface/20 p-6">
        <div className="flex items-center gap-2 border-b border-border/40 pb-4">
          <Layers className="h-4 w-4 text-neon-cyan" />
          <h3 className="font-mono-tech text-xs tracking-widest text-foreground uppercase">
            NEXT SYSTEM LAYERS [ ROADMAP ]
          </h3>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {NEXT_LAYERS_DATA.map((layer) => (
            <div
              key={layer.id}
              className="flex flex-col justify-between rounded-sm border border-border/30 bg-background/40 p-3.5 transition hover:border-border/70"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono-tech text-xs font-medium text-foreground">
                    {layer.name}
                  </span>
                  <span
                    className={`font-mono-tech text-[9px] tracking-widest px-1.5 py-0.5 rounded ${
                      layer.status === "ACTIVE"
                        ? "text-neon-green bg-neon-green/10 border border-neon-green/30"
                        : layer.status === "NEXT"
                          ? "text-neon-cyan bg-neon-cyan/10 border border-neon-cyan/30"
                          : "text-muted-foreground bg-muted/20 border border-border/30"
                    }`}
                  >
                    {layer.status}
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed font-sans">
                  {layer.description}
                </p>
              </div>

              <div className="mt-3 font-mono-tech text-[9px] text-muted-foreground/60 uppercase">
                {layer.status === "ACTIVE"
                  ? "// CANON v1.0.0 ONLINE"
                  : "// LAYER RESERVED FOR PHASE 2+"}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 1 Column: Guardian Teaser */}
      <section className="flex flex-col justify-between rounded-sm border border-border/60 bg-surface/30 p-6">
        <div>
          <div className="flex items-center justify-between border-b border-border/40 pb-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-mono-tech text-xs tracking-widest text-foreground uppercase">
                VERONICA GUARDIAN
              </h3>
            </div>
            <span className="font-mono-tech text-[9px] tracking-widest uppercase text-muted-foreground bg-muted/20 px-2 py-0.5 rounded border border-border/40">
              OFFLINE
            </span>
          </div>

          <div className="mt-5">
            <span className="font-mono-tech text-[10px] tracking-widest text-neon-green uppercase block">
              [ FUTURE BRAND INTELLIGENCE LAYER ]
            </span>
            <p className="mt-2 font-sans text-sm text-foreground/80 leading-relaxed">
              Módulo de auditoria heurística que inspeciona em tempo real se qualquer ativo,
              conteúdo ou expansão gerada respeita com rigor a bíblia e os princípios da marca
              Veronica.
            </p>
          </div>

          <div className="mt-6 rounded-sm border border-border/40 bg-background/50 p-4 font-mono-tech text-xs text-muted-foreground space-y-2">
            <div className="flex justify-between">
              <span>CANONICAL COMPLIANCE:</span>
              <span className="text-muted-foreground">STANDBY</span>
            </div>
            <div className="flex justify-between">
              <span>TONE MONITOR:</span>
              <span className="text-muted-foreground">STANDBY</span>
            </div>
            <div className="flex justify-between">
              <span>AUTONOMY THRESHOLD:</span>
              <span className="text-muted-foreground">DISABLED</span>
            </div>
          </div>
        </div>

        <div className="mt-6 border-t border-border/30 pt-4 font-mono-tech text-[10px] text-muted-foreground">
          STATUS: NÃO-OPERACIONAL NA PHASE 1
        </div>
      </section>
    </div>
  );
}
