import { useEffect, useRef, useState } from "react";

const GREEN = "oklch(0.85 0.22 155)";
const CYAN = "oklch(0.88 0.15 195)";

/* ── Rede neural reativa ao mouse ── */
function NeuralNet({ w = 190, h = 150 }: { w?: number; h?: number }) {
  const ref = useRef<SVGSVGElement>(null);
  const [m, setM] = useState({ x: -999, y: -999 });

  const nodes = [
    { x: 20, y: 40 }, { x: 62, y: 18 }, { x: 58, y: 72 }, { x: 104, y: 46 },
    { x: 96, y: 104 }, { x: 146, y: 26 }, { x: 152, y: 84 }, { x: 122, y: 130 },
    { x: 34, y: 112 }, { x: 178, y: 56 },
  ];
  const links: [number, number][] = [
    [0,1],[0,2],[1,3],[2,3],[2,4],[3,5],[3,6],[4,6],[4,7],[5,9],[6,9],[2,8],[4,8],[6,7],
  ];

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const r = ref.current?.getBoundingClientRect();
      if (!r) return;
      setM({ x: ((e.clientX - r.left) / r.width) * w, y: ((e.clientY - r.top) / r.height) * h });
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [w, h]);

  const near = (x: number, y: number) => {
    const d = Math.hypot(x - m.x, y - m.y);
    return Math.max(0, 1 - d / 90);
  };

  return (
    <svg ref={ref} width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden>
      {links.map(([a, b], i) => {
        const boost = Math.max(near(nodes[a].x, nodes[a].y), near(nodes[b].x, nodes[b].y));
        return (
          <line
            key={i}
            x1={nodes[a].x} y1={nodes[a].y} x2={nodes[b].x} y2={nodes[b].y}
            stroke={CYAN}
            strokeWidth={0.5 + boost * 1.1}
            opacity={0.14 + boost * 0.62}
            style={{ transition: "opacity 380ms ease, stroke-width 380ms ease" }}
          />
        );
      })}
      {nodes.map((n, i) => {
        const boost = near(n.x, n.y);
        return (
          <g key={i}>
            <circle
              cx={n.x} cy={n.y} r={1.8 + boost * 2.6}
              fill={i % 3 === 0 ? GREEN : CYAN}
              opacity={0.45 + boost * 0.55}
              style={{ transition: "r 380ms ease, opacity 380ms ease", filter: `drop-shadow(0 0 ${3 + boost * 8}px ${i % 3 === 0 ? GREEN : CYAN})` }}
            />
            <circle cx={n.x} cy={n.y} r="1.8" fill="none" stroke={GREEN} strokeWidth="0.4" opacity="0">
              <animate attributeName="r" values="2;13" dur="3.4s" begin={`${i * 0.42}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.7;0" dur="3.4s" begin={`${i * 0.42}s`} repeatCount="indefinite" />
            </circle>
          </g>
        );
      })}
    </svg>
  );
}

/* ── Scanner HUD ── */
function HudScanner({ size = 92, hue = GREEN }: { size?: number; hue?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden
      style={{ filter: `drop-shadow(0 0 5px ${hue})` }}>
      <g stroke={hue} fill="none">
        <path d="M8 26 V8 H26" strokeWidth="1.4" opacity="0.85" />
        <path d="M74 8 H92 V26" strokeWidth="1.4" opacity="0.6" />
        <path d="M92 74 V92 H74" strokeWidth="1.4" opacity="0.45" />
        <path d="M26 92 H8 V74" strokeWidth="1.4" opacity="0.6" />
        <circle cx="50" cy="50" r="27" strokeWidth="0.7" opacity="0.32" strokeDasharray="3 6">
          <animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="14s" repeatCount="indefinite" />
        </circle>
        <circle cx="50" cy="50" r="19" strokeWidth="0.9" opacity="0.5" strokeDasharray="30 90">
          <animateTransform attributeName="transform" type="rotate" from="360 50 50" to="0 50 50" dur="7s" repeatCount="indefinite" />
        </circle>
        <path d="M50 32 V40 M50 60 V68 M32 50 H40 M60 50 H68" strokeWidth="0.9" opacity="0.7" />
        <line x1="14" y1="50" x2="86" y2="50" strokeWidth="0.6" opacity="0.5">
          <animate attributeName="y1" values="16;84;16" dur="5.5s" repeatCount="indefinite" />
          <animate attributeName="y2" values="16;84;16" dur="5.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;0.75;0" dur="5.5s" repeatCount="indefinite" />
        </line>
      </g>
      <circle cx="50" cy="50" r="2.6" fill={hue}>
        <animate attributeName="opacity" values="1;0.2;1" dur="2.2s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

/* ── Telemetria ── */
function Telemetry({ hue = CYAN }: { hue?: string }) {
  const bars = [10, 22, 14, 30, 18, 26, 12, 24];
  return (
    <svg width="86" height="34" viewBox="0 0 86 34" aria-hidden style={{ filter: `drop-shadow(0 0 4px ${hue})` }}>
      {bars.map((v, i) => (
        <rect key={i} x={i * 11} y={34 - v} width="4" height={v} fill={hue} opacity="0.55" rx="1">
          <animate attributeName="height" values={`${v};${34 - v + 6};${v}`} dur={`${1.6 + i * 0.22}s`} repeatCount="indefinite" />
          <animate attributeName="y" values={`${34 - v};${v - 6};${34 - v}`} dur={`${1.6 + i * 0.22}s`} repeatCount="indefinite" />
        </rect>
      ))}
    </svg>
  );
}

export function HoloOrbits() {
  const [on, setOn] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const small = window.matchMedia("(max-width: 1023px)").matches;
    setOn(!reduced && !small);
  }, []);

  if (!on) return null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-10 hidden lg:block">
      <div className="absolute left-[2.5%] top-[26%] opacity-[0.55]">
        <NeuralNet />
      </div>
      <div className="absolute right-[4%] top-[30%] opacity-[0.42]">
        <HudScanner size={96} hue={GREEN} />
      </div>
      <div className="absolute right-[7%] bottom-[22%] opacity-[0.3]">
        <HudScanner size={58} hue={CYAN} />
      </div>
      <div className="absolute left-[5%] bottom-[15%] opacity-[0.34]">
        <Telemetry />
      </div>
    </div>
  );
}
