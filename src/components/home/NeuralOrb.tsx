// Núcleo holográfico da hero: anéis concêntricos em rotação oposta, nós de
// dados e pulsos neurais que percorrem as conexões. Tudo em SVG + CSS
// (sem dependências novas) e desligado sob prefers-reduced-motion.
const GREEN = "oklch(0.85 0.22 155)";
const CYAN = "oklch(0.88 0.15 195)";

const NODES = [
  { x: 150, y: 34 },
  { x: 246, y: 86 },
  { x: 262, y: 186 },
  { x: 186, y: 256 },
  { x: 92, y: 248 },
  { x: 38, y: 160 },
  { x: 60, y: 68 },
  { x: 150, y: 150 },
];

const LINKS: [number, number][] = [
  [0, 7], [1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [6, 7],
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 0],
];

export function NeuralOrb({ className = "" }: { className?: string }) {
  return (
    <div
      className={`neural-orb relative mx-auto aspect-square w-full max-w-[520px] ${className}`}
      aria-hidden="true"
    >
      <div className="neural-orb-glow" />
      <div className="neural-orb-ring neural-orb-ring-a" />
      <div className="neural-orb-ring neural-orb-ring-b" />
      <div className="neural-orb-ring neural-orb-ring-c" />
      <svg viewBox="0 0 300 300" className="relative z-10 h-full w-full">
        <defs>
          <radialGradient id="orb-core" cx="38%" cy="30%">
            <stop offset="0%" stopColor={CYAN} stopOpacity="0.55" />
            <stop offset="55%" stopColor={GREEN} stopOpacity="0.12" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="150" cy="150" r="118" fill="url(#orb-core)" />
        {LINKS.map(([a, b], i) => (
          <g key={i}>
            <line
              x1={NODES[a].x}
              y1={NODES[a].y}
              x2={NODES[b].x}
              y2={NODES[b].y}
              stroke={i % 3 === 0 ? GREEN : CYAN}
              strokeWidth="0.7"
              opacity="0.3"
            />
            <circle r="2" fill={GREEN} className="neural-pulse">
              <animateMotion
                dur={`${2.4 + (i % 5) * 0.6}s`}
                begin={`${i * 0.22}s`}
                repeatCount="indefinite"
                path={`M${NODES[a].x},${NODES[a].y} L${NODES[b].x},${NODES[b].y}`}
              />
              <animate
                attributeName="opacity"
                values="0;1;0"
                dur={`${2.4 + (i % 5) * 0.6}s`}
                begin={`${i * 0.22}s`}
                repeatCount="indefinite"
              />
            </circle>
          </g>
        ))}
        {NODES.map((n, i) => (
          <g key={i}>
            <circle
              cx={n.x}
              cy={n.y}
              r={i === 7 ? 5 : 2.6}
              fill={i % 3 === 0 ? GREEN : CYAN}
              opacity="0.9"
              style={{ filter: `drop-shadow(0 0 8px ${i % 3 === 0 ? GREEN : CYAN})` }}
            />
            <circle cx={n.x} cy={n.y} r="3" fill="none" stroke={CYAN} strokeWidth="0.6" opacity="0">
              <animate
                attributeName="r"
                values="3;22"
                dur="3.6s"
                begin={`${i * 0.4}s`}
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0.7;0"
                dur="3.6s"
                begin={`${i * 0.4}s`}
                repeatCount="indefinite"
              />
            </circle>
          </g>
        ))}
      </svg>
    </div>
  );
}
