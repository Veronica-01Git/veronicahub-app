import { useEffect, useState } from "react";

// Emblema "3D" leve do masthead — sem three.js/WebGL (custaria ~1.8MB de
// bundle por um acento decorativo): três elipses girando em velocidades e
// eixos diferentes simulam meridianos de um globo (mesmo truque de
// perspectiva usado em globos SVG), com 4 pontos pulsando fora de fase nas
// bordas — um por desk do Wire (São Paulo/San Francisco/Pequim/Londres),
// como se um sinal estivesse chegando de cada fuso agora. Mesma técnica de
// HudScanner (components/HoloOrbits.tsx): SMIL puro, então não é coberto
// pela regra CSS global de prefers-reduced-motion — checa na mão e some.
const GREEN = "oklch(0.85 0.22 155)";
const CYAN = "oklch(0.88 0.15 195)";

const SIGNALS = [
  { angle: -55, delay: 0, color: GREEN },
  { angle: 35, delay: 0.7, color: CYAN },
  { angle: 145, delay: 1.4, color: GREEN },
  { angle: 215, delay: 2.1, color: CYAN },
];

export function WirePulseGlobe({
  size = 40,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);
  if (reduced) return null;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-hidden
      className={className}
      style={{ filter: `drop-shadow(0 0 4px ${GREEN}66)` }}
    >
      <circle cx="50" cy="50" r="40" stroke={GREEN} strokeWidth="1" fill="none" opacity="0.3" />
      <g stroke={GREEN} strokeWidth="0.8" fill="none" opacity="0.5">
        <ellipse cx="50" cy="50" rx="40" ry="15">
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 50 50"
            to="360 50 50"
            dur="10s"
            repeatCount="indefinite"
          />
        </ellipse>
        <ellipse cx="50" cy="50" rx="40" ry="15" transform="rotate(60 50 50)">
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="60 50 50"
            to="420 50 50"
            dur="10s"
            repeatCount="indefinite"
          />
        </ellipse>
        <ellipse cx="50" cy="50" rx="15" ry="40" opacity="0.6">
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="360 50 50"
            to="0 50 50"
            dur="16s"
            repeatCount="indefinite"
          />
        </ellipse>
      </g>
      {SIGNALS.map((s, i) => {
        const rad = (s.angle * Math.PI) / 180;
        const x = 50 + 40 * Math.cos(rad);
        const y = 50 + 40 * Math.sin(rad);
        return (
          <circle key={i} cx={x} cy={y} r="2" fill={s.color}>
            <animate
              attributeName="opacity"
              values="0;1;0"
              dur="2.8s"
              begin={`${s.delay}s`}
              repeatCount="indefinite"
            />
            <animate
              attributeName="r"
              values="1.3;3;1.3"
              dur="2.8s"
              begin={`${s.delay}s`}
              repeatCount="indefinite"
            />
          </circle>
        );
      })}
      <circle cx="50" cy="50" r="4" fill={GREEN} opacity="0.85">
        <animate
          attributeName="opacity"
          values="0.85;0.35;0.85"
          dur="2.4s"
          repeatCount="indefinite"
        />
      </circle>
    </svg>
  );
}
