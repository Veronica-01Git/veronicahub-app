import { useEffect, useRef, type CSSProperties } from "react";

type EyeStyle = CSSProperties & {
  "--eye-x": string;
  "--eye-y": string;
};

const eyeStyle: EyeStyle = {
  "--eye-x": "0px",
  "--eye-y": "0px",
  transform: "translate3d(var(--eye-x), var(--eye-y), 0)",
};

function TrackedEye({ side }: { side: "left" | "right" }) {
  return (
    <span
      className={`absolute top-[34.95%] h-[4.05%] w-[9%] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[50%] ${
        side === "left" ? "left-[31.25%]" : "left-[66.05%]"
      }`}
    >
      <span
        data-eye
        style={eyeStyle}
        className="absolute left-1/2 top-1/2 aspect-square h-[68%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_50%_50%,rgba(1,5,8,0.96)_0_29%,rgba(3,43,54,0.72)_31_42%,rgba(20,172,199,0.28)_48_61%,rgba(20,172,199,0)_72%)] opacity-80 will-change-transform transition-transform duration-150 ease-out"
      />
    </span>
  );
}

export function VeronicaPresence() {
  const figureRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!finePointer.matches || reducedMotion.matches) return;

    let animationFrame = 0;

    const moveEyes = (x: number, y: number) => {
      const figure = figureRef.current;
      if (!figure) return;

      figure.querySelectorAll<HTMLElement>("[data-eye]").forEach((eye) => {
        eye.style.setProperty("--eye-x", `${x.toFixed(2)}px`);
        eye.style.setProperty("--eye-y", `${y.toFixed(2)}px`);
      });
    };

    const handlePointerMove = (event: PointerEvent) => {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(() => {
        const normalizedX = (event.clientX / window.innerWidth - 0.5) * 2;
        const normalizedY = (event.clientY / window.innerHeight - 0.5) * 2;
        const distance = Math.hypot(normalizedX, normalizedY);
        const damping = distance > 1 ? 1 / distance : 1;

        moveEyes(normalizedX * damping * 1.8, normalizedY * damping * 1.1);
      });
    };

    const resetEyes = () => moveEyes(0, 0);

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("blur", resetEyes);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("blur", resetEyes);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-y-0 right-0 w-full sm:w-[72%] lg:w-[54%]">
        <div className="absolute left-1/2 top-[28rem] h-[34rem] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-neon-cyan/10 blur-[70px]" />
        <div className="absolute left-1/2 top-[59rem] h-px w-[58%] -translate-x-1/2 bg-gradient-to-r from-transparent via-neon-cyan/80 to-transparent shadow-[0_0_22px_rgba(34,211,238,0.8)]" />

        <div
          ref={figureRef}
          className="absolute right-[-20%] top-14 w-[76%] opacity-35 sm:right-[-5%] sm:top-10 sm:w-[72%] sm:opacity-65 lg:right-[3%] lg:top-4 lg:w-[76%] lg:opacity-95"
        >
          <img
            src="/images/veronica/veronica-hero-hologram-v2.webp"
            alt=""
            width={768}
            height={1365}
            decoding="async"
            fetchPriority="high"
            className="block h-auto w-full drop-shadow-[0_0_24px_rgba(34,211,238,0.2)]"
          />

          <TrackedEye side="left" />
          <TrackedEye side="right" />

          <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,rgba(34,211,238,0.08)_48%,transparent_51%)] bg-[length:100%_9px] opacity-35 mix-blend-screen" />
          <div className="absolute inset-x-[7%] top-1/2 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent opacity-0 motion-safe:animate-[pulse_4s_ease-in-out_infinite]" />
        </div>
      </div>

      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/15 lg:via-background/70 lg:to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/35" />
      <div className="absolute bottom-5 right-6 font-mono-tech text-[8px] uppercase tracking-[0.28em] text-neon-cyan/60 lg:bottom-8 lg:right-10">
        Veronica 7 · interface neural ativa
      </div>
    </div>
  );
}
