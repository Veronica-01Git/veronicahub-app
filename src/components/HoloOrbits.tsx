import { useEffect, useState } from "react";

type OrbitProps = {
  size: number;
  delay: number;
  duration: number;
  hue: "green" | "cyan";
};

function OrbitNode({ size, delay, duration, hue }: OrbitProps) {
  const color = hue === "green" ? "oklch(0.85 0.22 155)" : "oklch(0.88 0.15 195)";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-hidden
      style={{
        filter: `drop-shadow(0 0 6px ${color})`,
        animation: `holo-breathe ${duration}s ease-in-out ${delay}s infinite`,
      }}
    >
      <ellipse
        cx="50" cy="50" rx="42" ry="16"
        fill="none" stroke={color} strokeWidth="1" opacity="0.55"
        style={{ transformOrigin: "50% 50%", animation: `holo-spin ${duration * 1.8}s linear infinite` }}
      />
      <ellipse
        cx="50" cy="50" rx="42" ry="16"
        fill="none" stroke={color} strokeWidth="0.8" opacity="0.4"
        transform="rotate(60 50 50)"
        style={{ transformOrigin: "50% 50%", animation: `holo-spin-rev ${duration * 2.4}s linear infinite` }}
      />
      <ellipse
        cx="50" cy="50" rx="42" ry="16"
        fill="none" stroke={color} strokeWidth="0.8" opacity="0.3"
        transform="rotate(120 50 50)"
        style={{ transformOrigin: "50% 50%", animation: `holo-spin ${duration * 3}s linear infinite` }}
      />
      <circle cx="50" cy="50" r="3" fill={color} opacity="0.9">
        <animate attributeName="opacity" values="0.9;0.25;0.9" dur={`${duration}s`} repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

export function HoloOrbits() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const small = window.matchMedia("(max-width: 767px)").matches;
    setEnabled(!reduced && !small);
  }, []);

  if (!enabled) return null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-10 hidden md:block">
      <div className="absolute left-[4%] top-[22%] opacity-45">
        <OrbitNode size={78} delay={0} duration={7} hue="green" />
      </div>
      <div className="absolute right-[6%] top-[38%] opacity-35">
        <OrbitNode size={58} delay={1.4} duration={9} hue="cyan" />
      </div>
      <div className="absolute left-[12%] bottom-[16%] opacity-30">
        <OrbitNode size={46} delay={2.8} duration={8} hue="cyan" />
      </div>
      <div className="absolute right-[16%] bottom-[26%] opacity-40">
        <OrbitNode size={64} delay={0.9} duration={10} hue="green" />
      </div>
    </div>
  );
}
