import { ShieldCheck } from "lucide-react";

interface UniverseCoreProps {
  isHighlighted?: boolean;
  activeRelation?: string | null;
}

export function UniverseCore({ isHighlighted = false, activeRelation }: UniverseCoreProps) {
  return (
    <div className="relative flex flex-col items-center justify-center p-6 select-none">
      {/* Precision Core Visual Structure */}
      <div className="relative flex h-64 w-64 items-center justify-center sm:h-72 sm:w-72">
        {/* Subtle Ambient Halo */}
        <div
          className={`absolute inset-0 rounded-full transition-all duration-700 pointer-events-none ${
            isHighlighted ? "bg-neon-green/10 blur-2xl" : "bg-neon-green/5 blur-xl"
          }`}
          style={{
            animation: "core-breath 7s ease-in-out infinite",
          }}
        />

        {/* Outer Orbit Technical Ring */}
        <svg
          className="absolute inset-0 h-full w-full pointer-events-none"
          viewBox="0 0 288 288"
          fill="none"
          aria-hidden="true"
        >
          {/* Outermost dotted orbit */}
          <circle
            cx="144"
            cy="144"
            r="138"
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="2 6"
            className="text-border/60 transition-colors duration-500"
          />

          {/* Secondary Precision Ring with Tick Marks */}
          <circle
            cx="144"
            cy="144"
            r="108"
            stroke="currentColor"
            strokeWidth="1"
            className={`transition-colors duration-500 ${
              isHighlighted ? "text-neon-green/50" : "text-border/40"
            }`}
          />

          {/* Dynamic rotating radar orbit tick */}
          <circle
            cx="144"
            cy="144"
            r="82"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeDasharray="40 180"
            className="text-neon-green/40 origin-center"
            style={{
              animation: "core-spin 32s linear infinite",
            }}
          />

          {/* Inner Geometric Shield Target */}
          <circle
            cx="144"
            cy="144"
            r="54"
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="4 4"
            className="text-border/80"
          />
        </svg>

        {/* Center Nucleus */}
        <div
          className={`relative z-10 flex h-24 w-24 flex-col items-center justify-center rounded-full border bg-background/90 shadow-2xl backdrop-blur transition-all duration-500 ${
            isHighlighted
              ? "border-neon-green/70 shadow-[0_0_30px_rgba(46,230,166,0.2)]"
              : "border-border/80"
          }`}
        >
          {/* Subtle Inner Glow */}
          <span className="font-display text-3xl font-extrabold tracking-tighter text-foreground sm:text-4xl">
            V
          </span>

          <span className="mt-0.5 font-mono-tech text-[9px] tracking-[0.2em] text-neon-green uppercase font-semibold">
            CORE
          </span>
        </div>
      </div>

      {/* Identity Core Precision Labels */}
      <div className="mt-4 flex flex-col items-center text-center">
        <div className="flex items-center gap-2 font-mono-tech text-[10px] tracking-[0.2em] text-foreground/90 uppercase">
          <ShieldCheck className="h-3 w-3 text-neon-green" />
          <span>IDENTITY CORE</span>
          <span className="text-border">/</span>
          <span className="text-neon-green font-medium">ACTIVE</span>
        </div>

        {activeRelation ? (
          <div className="mt-1.5 font-mono-tech text-[10px] tracking-wider text-neon-cyan animate-pulse">
            TRANSMITTING: [{activeRelation.toUpperCase()}]
          </div>
        ) : (
          <div className="mt-1 font-mono-tech text-[9.5px] tracking-wider text-muted-foreground">
            AUTONOMOUS FREQUENCY · 432 HZ · NODE: 00
          </div>
        )}
      </div>

      <style>{`
        @keyframes core-breath {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.08); opacity: 0.85; }
        }
        @keyframes core-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="core-breath"], [style*="core-spin"] {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
