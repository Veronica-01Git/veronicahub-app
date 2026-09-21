import type { CSSProperties, ReactNode } from "react";
import { useState } from "react";

export type HoloTone = "aqua" | "violet" | "rose" | "gold" | "lime";

const palettes: Record<HoloTone, [string, string, string]> = {
  aqua: ["rgba(0,199,255,.30)", "rgba(77,255,214,.26)", "rgba(175,122,255,.22)"],
  violet: ["rgba(128,86,255,.28)", "rgba(77,153,255,.24)", "rgba(255,111,214,.22)"],
  rose: ["rgba(255,90,160,.26)", "rgba(255,160,90,.22)", "rgba(141,111,255,.20)"],
  gold: ["rgba(255,189,46,.28)", "rgba(255,111,97,.20)", "rgba(111,212,255,.18)"],
  lime: ["rgba(93,230,130,.25)", "rgba(99,215,255,.22)", "rgba(205,255,108,.20)"],
};

export function HolographicField({
  tone = "aqua",
  className = "",
  intensity = 1,
}: {
  tone?: HoloTone;
  className?: string;
  intensity?: number;
}) {
  const [[x, y], setPointer] = useState([50, 42]);
  const colors = palettes[tone];

  const move = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const px = ((event.clientX - rect.left) / rect.width) * 100;
    const py = ((event.clientY - rect.top) / rect.height) * 100;
    setPointer([Math.max(0, Math.min(100, px)), Math.max(0, Math.min(100, py))]);
  };

  const style = {
    "--holo-x": `${x}%`,
    "--holo-y": `${y}%`,
    "--holo-a": colors[0],
    "--holo-b": colors[1],
    "--holo-c": colors[2],
    "--holo-alpha": intensity,
  } as CSSProperties;

  return (
    <div
      aria-hidden
      onPointerMove={move}
      onPointerLeave={() => setPointer([50, 42])}
      className={`pointer-events-auto absolute inset-0 overflow-hidden ${className}`}
      style={style}
    >
      <div
        className="absolute left-[var(--holo-x)] top-[var(--holo-y)] h-[24rem] w-[24rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl transition-[left,top] duration-500 ease-out motion-reduce:transition-none"
        style={{
          background:
            "radial-gradient(circle at 35% 35%, var(--holo-a), transparent 58%), radial-gradient(circle at 65% 58%, var(--holo-b), transparent 62%)",
          opacity: intensity,
        }}
      />
      <div
        className="absolute -right-20 top-8 h-80 w-80 rounded-full blur-3xl motion-safe:animate-pulse"
        style={{ background: "radial-gradient(circle, var(--holo-c), transparent 66%)", opacity: .9 * intensity }}
      />
      <div
        className="absolute bottom-[-8rem] left-[12%] h-96 w-96 rounded-full blur-3xl motion-safe:animate-pulse"
        style={{
          background: "radial-gradient(circle, var(--holo-b), transparent 68%)",
          opacity: .55 * intensity,
          animationDelay: "900ms",
        }}
      />
    </div>
  );
}

export function AppleClientFrame({
  children,
  tone = "aqua",
}: {
  children: ReactNode;
  tone?: HoloTone;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f5f5f7] text-[#1d1d1f]">
      <div className="pointer-events-none fixed inset-0 z-0">
        <HolographicField tone={tone} intensity={0.72} />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export function AppleClientNav({
  eyebrow,
  title,
  right,
}: {
  eyebrow: string;
  title: string;
  right?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-black/[.055] bg-white/70 backdrop-blur-2xl">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
        <div className="min-w-0">
          <div className="truncate text-[10px] font-semibold uppercase tracking-[.18em] text-black/45">
            {eyebrow}
          </div>
          <div className="truncate text-[15px] font-semibold tracking-[-.02em] text-black/90">{title}</div>
        </div>
        {right ? <div className="flex items-center gap-2">{right}</div> : null}
      </div>
    </header>
  );
}

export function GlassCard({
  children,
  className = "",
  interactive = false,
}: {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-[30px] border border-white/80 bg-white/72 shadow-[0_20px_70px_rgba(16,24,40,.09)] backdrop-blur-2xl",
        interactive
          ? "transition duration-500 hover:-translate-y-1 hover:shadow-[0_28px_90px_rgba(16,24,40,.14)] motion-reduce:transform-none"
          : "",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="text-[11px] font-semibold uppercase tracking-[.2em] text-black/40">{children}</div>
  );
}

export function SoftButton({
  children,
  variant = "dark",
  disabled = false,
  onClick,
}: {
  children: ReactNode;
  variant?: "dark" | "light";
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={[
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-[13px] font-semibold transition duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black/50",
        variant === "dark"
          ? "bg-[#1d1d1f] text-white hover:bg-black"
          : "border border-black/[.08] bg-white/75 text-black/80 hover:bg-white",
        disabled ? "cursor-not-allowed opacity-45" : "",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export function MetricTile({
  label,
  value,
  detail,
  accent,
}: {
  label: string;
  value: string;
  detail: string;
  accent?: string;
}) {
  return (
    <div className="rounded-[24px] border border-black/[.055] bg-white/78 p-5 backdrop-blur-xl">
      <div className="text-[11px] font-semibold uppercase tracking-[.16em] text-black/42">{label}</div>
      <div className="mt-3 text-3xl font-semibold tracking-[-.05em] text-black/90" style={accent ? { color: accent } : undefined}>
        {value}
      </div>
      <p className="mt-2 text-[13px] leading-5 text-black/48">{detail}</p>
    </div>
  );
}

export function HoloBadge({ children }: { children: ReactNode }) {
  return (
    <span
      className="inline-flex items-center rounded-full border border-white/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[.18em] text-black/65 shadow-[0_8px_30px_rgba(80,90,180,.12)]"
      style={{
        background:
          "linear-gradient(115deg, rgba(255,255,255,.92), rgba(210,245,255,.76) 35%, rgba(239,220,255,.70) 68%, rgba(255,240,215,.80))",
      }}
    >
      {children}
    </span>
  );
}
