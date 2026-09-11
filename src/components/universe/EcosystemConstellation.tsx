import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ECOSYSTEM_NODES, type EcosystemNode } from "./types";
import { UniverseCore } from "./UniverseCore";
import { Sparkles, Radio, ArrowUpRight, Cpu } from "lucide-react";

export function EcosystemConstellation() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<EcosystemNode | null>(null);

  const activeNode = ECOSYSTEM_NODES.find((n) => n.id === hoveredId);

  return (
    <section
      id="ecosystem"
      data-universe-element="constellation"
      className="relative my-12 rounded-sm border border-border/50 bg-surface/20 p-4 sm:p-8"
      aria-label="Mapa do Ecossistema Veronica"
    >
      {/* Header Bar of Constellation */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <div className="flex items-center gap-2 font-mono-tech text-[10.5px] tracking-widest text-muted-foreground uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-neon-green animate-pulse" />
            <span>02 / CONSTELLATION MAP</span>
          </div>
          <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Ecosystem Network
          </h2>
        </div>

        <div className="flex items-center gap-4 font-mono-tech text-[10.5px] tracking-widest text-muted-foreground">
          <div>
            NODES: <span className="text-foreground font-semibold">{ECOSYSTEM_NODES.length}</span>
          </div>
          <span className="text-border">|</span>
          <div>
            TOPOLOGY: <span className="text-neon-green">CENTRAL STAR</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DESKTOP SPATIAL CONSTELLATION (hidden on mobile, visible on md+)          */}
      {/* ========================================================================= */}
      <div className="relative mt-8 hidden min-h-[600px] w-full items-center justify-center overflow-hidden md:flex">
        {/* Technical SVG Connection Layer */}
        <svg
          className="absolute inset-0 h-full w-full pointer-events-none"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="activeLineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--neon-green)" stopOpacity="0.8" />
              <stop offset="100%" stopColor="var(--neon-cyan)" stopOpacity="0.4" />
            </linearGradient>
          </defs>

          {/* Background Concentric Radar Rings */}
          <circle
            cx="50"
            cy="50"
            r="22"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            strokeDasharray="1 3"
            className="text-border/30"
          />
          <circle
            cx="50"
            cy="50"
            r="38"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            strokeDasharray="1 4"
            className="text-border/20"
          />

          {/* Connection Lines from Core (50, 50) to each Node */}
          {ECOSYSTEM_NODES.map((node) => {
            const isHovered = hoveredId === node.id;
            const isAnyHovered = hoveredId !== null;

            return (
              <g key={`line-${node.id}`}>
                <line
                  x1="50"
                  y1="50"
                  x2={node.position.x}
                  y2={node.position.y}
                  stroke={isHovered ? "url(#activeLineGrad)" : "currentColor"}
                  strokeWidth={isHovered ? "1.8" : "0.75"}
                  strokeDasharray={isHovered ? "none" : "2 2"}
                  vectorEffect="non-scaling-stroke"
                  className={`transition-all duration-300 ${
                    isHovered
                      ? "opacity-100"
                      : isAnyHovered
                        ? "text-border/20 opacity-20"
                        : "text-border/50 opacity-60"
                  }`}
                />

                {/* Subtle Pulse Particle on Active Connection */}
                {isHovered && (
                  <circle
                    cx={(50 + node.position.x) / 2}
                    cy={(50 + node.position.y) / 2}
                    r="1.2"
                    fill="var(--neon-green)"
                    className="animate-ping origin-center opacity-80"
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* Central Veronica Core */}
        <div className="relative z-10">
          <UniverseCore
            isHighlighted={hoveredId !== null}
            activeRelation={activeNode ? `${activeNode.name} · ${activeNode.relation}` : null}
          />
        </div>

        {/* Constellation Orbiting Nodes */}
        {ECOSYSTEM_NODES.map((node) => {
          const isHovered = hoveredId === node.id;
          const isOtherDimmed = hoveredId !== null && hoveredId !== node.id;

          return (
            <div
              key={node.id}
              style={{
                left: `${node.position.x}%`,
                top: `${node.position.y}%`,
                transform: "translate(-50%, -50%)",
              }}
              className={`absolute z-20 transition-all duration-300 ${
                isOtherDimmed ? "opacity-35 scale-[0.96]" : "opacity-100 scale-100"
              }`}
            >
              <button
                type="button"
                onMouseEnter={() => setHoveredId(node.id)}
                onMouseLeave={() => setHoveredId(null)}
                onFocus={() => setHoveredId(node.id)}
                onBlur={() => setHoveredId(null)}
                onClick={() => setSelectedNode(node)}
                className={`group flex flex-col items-start rounded-sm border p-3 text-left backdrop-blur transition-all duration-300 cursor-pointer ${
                  isHovered
                    ? "border-neon-green/80 bg-surface-elevated/95 shadow-[0_0_24px_rgba(46,230,166,0.18)]"
                    : "border-border/60 bg-background/80 hover:border-border"
                }`}
                aria-label={`Ver detalhes do nó ${node.name}`}
              >
                {/* Node Top Metadata */}
                <div className="flex w-full items-center justify-between gap-3">
                  <span className="font-mono-tech text-[9px] tracking-widest text-muted-foreground uppercase">
                    {node.vector}
                  </span>
                  <span
                    className={`h-1.5 w-1.5 rounded-full transition-colors ${
                      isHovered ? "bg-neon-green animate-pulse" : "bg-muted-foreground/60"
                    }`}
                  />
                </div>

                {/* Node Name */}
                <div className="mt-1 font-sans text-sm font-semibold tracking-tight text-foreground group-hover:text-neon-green transition-colors">
                  {node.name}
                </div>

                {/* Category */}
                <div className="text-[11px] text-muted-foreground font-mono-tech">
                  {node.category}
                </div>

                {/* Relation tag reveal on hover */}
                <div
                  className={`mt-2 flex items-center gap-1.5 font-mono-tech text-[9.5px] uppercase tracking-wider transition-all duration-200 ${
                    isHovered
                      ? "text-neon-cyan opacity-100 max-h-6"
                      : "text-muted-foreground/60 opacity-0 max-h-0 overflow-hidden"
                  }`}
                >
                  <ArrowUpRight className="h-3 w-3" />
                  <span>RELATION: {node.relation}</span>
                </div>
              </button>
            </div>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* MOBILE ADAPTIVE TIMELINE FLOW (visible on mobile < md)                     */}
      {/* ========================================================================= */}
      <div className="mt-6 flex flex-col gap-6 md:hidden">
        {/* Core on top */}
        <div className="border-b border-border/40 pb-6">
          <UniverseCore />
        </div>

        {/* Nodes in linear tactical sequence */}
        <div className="relative pl-6">
          {/* Vertical axis line */}
          <div className="absolute left-2 top-2 bottom-2 w-px bg-border/60" />

          <div className="flex flex-col gap-4">
            {ECOSYSTEM_NODES.map((node) => (
              <div key={`mobile-${node.id}`} className="relative">
                {/* Axis Marker */}
                <div className="absolute -left-[1.85rem] top-4 h-2 w-2 rounded-full border border-border bg-background" />

                <button
                  type="button"
                  onClick={() => setSelectedNode(node)}
                  className="w-full rounded-sm border border-border/60 bg-surface/40 p-4 text-left transition hover:border-neon-green/50 active:bg-surface"
                >
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="font-mono-tech text-[9.5px] tracking-widest uppercase">
                      {node.vector}
                    </span>
                    <span className="font-mono-tech text-[9px] text-neon-green uppercase">
                      {node.status}
                    </span>
                  </div>

                  <div className="mt-1 font-sans text-base font-semibold text-foreground">
                    {node.name}
                  </div>

                  <div className="text-xs text-muted-foreground font-mono-tech mt-0.5">
                    {node.category}
                  </div>

                  <p className="mt-2 text-xs text-foreground/80 leading-relaxed line-clamp-2">
                    {node.description}
                  </p>

                  <div className="mt-3 flex items-center justify-between border-t border-border/30 pt-2 font-mono-tech text-[10px] uppercase text-neon-cyan">
                    <span>RELATION: {node.relation}</span>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      DETALHES <ArrowUpRight className="h-3 w-3" />
                    </span>
                  </div>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* NODE DETAILS MODAL LAYER (Radix Dialog)                                   */}
      {/* ========================================================================= */}
      <Dialog open={selectedNode !== null} onOpenChange={(open) => !open && setSelectedNode(null)}>
        {selectedNode && (
          <DialogContent className="border-border/80 bg-background/95 max-w-lg backdrop-blur sm:rounded-sm">
            <DialogHeader>
              <div className="flex items-center gap-2 font-mono-tech text-[10px] tracking-widest text-muted-foreground uppercase">
                <span>SYSTEM NODE</span>
                <span className="text-border">/</span>
                <span className="text-neon-cyan">{selectedNode.vector}</span>
              </div>
              <DialogTitle className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {selectedNode.name}
              </DialogTitle>
              <DialogDescription className="font-mono-tech text-xs text-muted-foreground">
                {selectedNode.category}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 flex flex-col gap-4 border-t border-border/40 pt-4 text-sm">
              {/* Status and Relation telemetry */}
              <div className="grid grid-cols-2 gap-3 rounded-sm border border-border/40 bg-surface/30 p-3 font-mono-tech text-xs">
                <div>
                  <span className="text-[10px] text-muted-foreground block uppercase">STATUS</span>
                  <span className="text-neon-green font-semibold">{selectedNode.status}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block uppercase">
                    RELATION TO CORE
                  </span>
                  <span className="text-foreground uppercase font-semibold">
                    {selectedNode.relation}
                  </span>
                </div>
              </div>

              {/* Functional description */}
              <div>
                <span className="font-mono-tech text-[10.5px] uppercase tracking-wider text-muted-foreground block mb-1">
                  FUNÇÃO NO ECOSSISTEMA
                </span>
                <p className="text-foreground/90 leading-relaxed font-sans">
                  {selectedNode.description}
                </p>
                <a href={selectedNode.to} className="mt-3 inline-flex min-h-11 items-center text-neon-cyan">Abrir área</a>
              </div>

              {/* Architectural positioning memo */}
              <div className="rounded-sm border border-border/30 bg-surface/20 p-3 text-xs text-muted-foreground font-mono-tech leading-relaxed">
                <span className="text-foreground font-medium block mb-0.5">
                  [ CONEXÃO ARQUITETURAL ]
                </span>
                Nó validado e integrado à identidade do Veronica Universe. Todas as emissões e
                diretrizes deste componente derivam do Veronica Core.
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </section>
  );
}
