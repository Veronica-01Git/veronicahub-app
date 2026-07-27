import { useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

export const GREEN = "oklch(0.85 0.22 155)";
export const CYAN = "oklch(0.88 0.15 195)";
const VIOLET = "oklch(0.65 0.2 250)";

function NeuralNet({ w = 230, h = 185 }: { w?: number; h?: number }) {
  const ref = useRef<SVGSVGElement>(null);
  const [m, setM] = useState({ x: -999, y: -999 });

  const nodes = [
    { x: 24, y: 48 }, { x: 74, y: 22 }, { x: 70, y: 88 }, { x: 126, y: 56 },
    { x: 116, y: 126 }, { x: 176, y: 32 }, { x: 184, y: 102 }, { x: 148, y: 158 },
    { x: 40, y: 136 }, { x: 214, y: 68 }, { x: 96, y: 170 }, { x: 206, y: 140 },
  ];
  const links: [number, number][] = [
    [0,1],[0,2],[1,3],[2,3],[2,4],[3,5],[3,6],[4,6],[4,7],[5,9],[6,9],[2,8],
    [4,8],[6,7],[8,10],[7,10],[6,11],[7,11],[9,11],[1,5],
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

  const near = (x: number, y: number) => Math.max(0, 1 - Math.hypot(x - m.x, y - m.y) / 110);

  return (
    <svg ref={ref} width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden>
      {links.map(([a, b], i) => {
        const boost = Math.max(near(nodes[a].x, nodes[a].y), near(nodes[b].x, nodes[b].y));
        return (
          <g key={i}>
            <line x1={nodes[a].x} y1={nodes[a].y} x2={nodes[b].x} y2={nodes[b].y}
              stroke={boost > 0.45 ? GREEN : CYAN} strokeWidth={0.7 + boost * 1.6}
              opacity={0.24 + boost * 0.66}
              style={{ transition: "opacity 340ms ease, stroke-width 340ms ease, stroke 340ms ease" }} />
            {i % 3 === 0 && (
              <circle r="1.6" fill={GREEN} opacity="0.9">
                <animateMotion dur={`${2.6 + (i % 4) * 0.7}s`} repeatCount="indefinite"
                  path={`M${nodes[a].x},${nodes[a].y} L${nodes[b].x},${nodes[b].y}`} />
                <animate attributeName="opacity" values="0;1;0" dur={`${2.6 + (i % 4) * 0.7}s`} repeatCount="indefinite" />
              </circle>
            )}
          </g>
        );
      })}
      {nodes.map((n, i) => {
        const boost = near(n.x, n.y);
        const c = i % 4 === 0 ? GREEN : i % 4 === 2 ? VIOLET : CYAN;
        return (
          <g key={i}>
            <circle cx={n.x} cy={n.y} r={2.2 + boost * 3.4} fill={c}
              opacity={0.6 + boost * 0.4}
              style={{ transition: "r 340ms ease, opacity 340ms ease", filter: `drop-shadow(0 0 ${5 + boost * 14}px ${c})` }} />
            <circle cx={n.x} cy={n.y} r="2" fill="none" stroke={c} strokeWidth="0.5" opacity="0">
              <animate attributeName="r" values="2;18" dur="3.2s" begin={`${i * 0.34}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.8;0" dur="3.2s" begin={`${i * 0.34}s`} repeatCount="indefinite" />
            </circle>
          </g>
        );
      })}
    </svg>
  );
}

export function HudScanner({ size = 110, hue = GREEN }: { size?: number; hue?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden
      style={{ filter: `drop-shadow(0 0 1.5px ${hue})` }}>
      <g stroke={hue} fill="none">
        <path d="M8 26 V8 H26" strokeWidth="1.4" opacity="0.6" />
        <path d="M74 8 H92 V26" strokeWidth="1.4" opacity="0.45" />
        <path d="M92 74 V92 H74" strokeWidth="1.4" opacity="0.35" />
        <path d="M26 92 H8 V74" strokeWidth="1.4" opacity="0.45" />
        <circle cx="50" cy="50" r="34" strokeWidth="0.6" opacity="0.3" strokeDasharray="2 8">
          <animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="20s" repeatCount="indefinite" />
        </circle>
        <circle cx="50" cy="50" r="27" strokeWidth="0.7" opacity="0.3" strokeDasharray="4 7">
          <animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="12s" repeatCount="indefinite" />
        </circle>
        <circle cx="50" cy="50" r="19" strokeWidth="0.9" opacity="0.42" strokeDasharray="34 86">
          <animateTransform attributeName="transform" type="rotate" from="360 50 50" to="0 50 50" dur="6s" repeatCount="indefinite" />
        </circle>
        <path d="M50 30 V40 M50 60 V70 M30 50 H40 M60 50 H70" strokeWidth="0.8" opacity="0.5" />
        <line x1="12" y1="50" x2="88" y2="50" strokeWidth="0.6" opacity="0.35">
          <animate attributeName="y1" values="14;86;14" dur="4.5s" repeatCount="indefinite" />
          <animate attributeName="y2" values="14;86;14" dur="4.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;0.5;0" dur="6.5s" repeatCount="indefinite" />
        </line>
      </g>
      <circle cx="50" cy="50" r="2.4" fill={hue} opacity="0.4">
        <animate attributeName="opacity" values="1;0.15;1" dur="1.8s" repeatCount="indefinite" />
        <animate attributeName="r" values="3.4;4.6;3.4" dur="1.8s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

// Routes with their own light "paper" identity opt out of this dark-cyber overlay.
const LIGHT_THEME_ROUTES = ["/veronica-curriculo-certo"];

export function HoloOrbits() {
  const [on, setOn] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isLightRoute = LIGHT_THEME_ROUTES.some((r) => pathname.startsWith(r));

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const small = window.matchMedia("(max-width: 1023px)").matches;
    setOn(!reduced && !small);
  }, []);

  if (!on || isLightRoute) return null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-10 hidden lg:block">
      <div className="absolute inset-0" style={{
        background: "radial-gradient(ellipse 120% 80% at 50% 50%, transparent 55%, oklch(0.14 0.015 200 / 0.55) 100%)",
      }} />
      <div className="absolute inset-x-0 h-[2px]" style={{
        background: `linear-gradient(90deg, transparent, ${GREEN}, transparent)`,
        filter: "blur(1.5px)", opacity: 0.4, animation: "holo-beam 16s cubic-bezier(0.4,0,0.2,1) infinite",
      }} />
      <div className="absolute right-[3.5%] top-[27%] opacity-[0.34]" style={{ animation: "holo-drift-a 19s ease-in-out infinite" }}><HudScanner size={118} hue={GREEN} /></div>
      <div className="absolute right-[6%] bottom-[19%] opacity-[0.26]" style={{ animation: "holo-drift-b 24s ease-in-out infinite" }}><HudScanner size={72} hue={CYAN} /></div>
      <div className="absolute left-5 top-20 h-14 w-14 border-l-2 border-t-2" style={{ borderColor: `${GREEN}`, opacity: 0.3 }} />
      <div className="absolute right-5 bottom-20 h-14 w-14 border-r-2 border-b-2" style={{ borderColor: `${CYAN}`, opacity: 0.3 }} />
    </div>
  );
}
