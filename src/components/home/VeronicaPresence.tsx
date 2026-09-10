import { useEffect, useRef, type CSSProperties } from "react";

type EyeStyle = CSSProperties & {
  "--eye-x": string;
  "--eye-y": string;
};

const eyeStyle: EyeStyle = {
  "--eye-x": "0px",
  "--eye-y": "0px",
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
        className="absolute left-1/2 top-1/2 aspect-square h-[68%] rounded-full bg-[radial-gradient(circle_at_50%_50%,rgba(1,5,8,0.96)_0_29%,rgba(3,43,54,0.72)_31_42%,rgba(20,172,199,0.28)_48_61%,rgba(20,172,199,0)_72%)] opacity-80 will-change-transform lg:h-[72%] lg:bg-[radial-gradient(circle_at_46%_42%,rgba(255,255,255,0.82)_0_5%,transparent_7%),radial-gradient(circle_at_50%_50%,rgba(1,5,8,0.96)_0_27%,rgba(5,39,48,0.78)_29_43%,rgba(33,139,157,0.3)_48_61%,rgba(20,172,199,0)_72%)] lg:opacity-65 lg:mix-blend-multiply"
        style={{
          ...eyeStyle,
          transform: "translate3d(calc(-50% + var(--eye-x)), calc(-50% + var(--eye-y)), 0)",
        }}
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
    let currentX = 0;
    let currentY = 0;
    let targetX = 0;
    let targetY = 0;

    const renderEyes = () => {
      const figure = figureRef.current;
      if (!figure) {
        animationFrame = 0;
        return;
      }

      currentX += (targetX - currentX) * 0.16;
      currentY += (targetY - currentY) * 0.16;

      figure.querySelectorAll<HTMLElement>("[data-eye]").forEach((eye) => {
        eye.style.setProperty("--eye-x", `${currentX.toFixed(2)}px`);
        eye.style.setProperty("--eye-y", `${currentY.toFixed(2)}px`);
      });

      const settled = Math.abs(targetX - currentX) < 0.02 && Math.abs(targetY - currentY) < 0.02;
      if (settled) {
        currentX = targetX;
        currentY = targetY;
        animationFrame = 0;
        return;
      }

      animationFrame = window.requestAnimationFrame(renderEyes);
    };

    const scheduleEyes = () => {
      if (!animationFrame) animationFrame = window.requestAnimationFrame(renderEyes);
    };

    const handlePointerMove = (event: PointerEvent) => {
      const figure = figureRef.current;
      if (!figure) return;

      const bounds = figure.getBoundingClientRect();
      const normalizedX =
        (event.clientX - (bounds.left + bounds.width / 2)) / (window.innerWidth * 0.5);
      const normalizedY =
        (event.clientY - (bounds.top + bounds.height * 0.35)) / (window.innerHeight * 0.5);
      const distance = Math.hypot(normalizedX, normalizedY);
      const damping = distance > 1 ? 1 / distance : 1;

      targetX = normalizedX * damping * 4.8;
      targetY = normalizedY * damping * 2.8;
      scheduleEyes();
    };

    const resetEyes = () => {
      targetX = 0;
      targetY = 0;
      scheduleEyes();
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", resetEyes);
    window.addEventListener("blur", resetEyes);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("pointermove", handlePointerMove);
      document.documentElement.removeEventListener("pointerleave", resetEyes);
      window.removeEventListener("blur", resetEyes);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-y-0 right-0 w-full sm:w-[72%] lg:w-[54%]">
        <div className="absolute left-1/2 top-[28rem] h-[34rem] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-neon-cyan/10 blur-[70px] lg:left-[58%] lg:top-[26rem] lg:h-[28rem] lg:w-[54%] lg:bg-neon-cyan/[0.08] lg:blur-[85px] lg:motion-safe:animate-[pulse_7s_ease-in-out_infinite]" />
        <div className="absolute left-[62%] top-[27rem] hidden h-[21rem] w-[38%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-400/[0.055] blur-[95px] lg:block lg:motion-safe:animate-[pulse_9s_ease-in-out_infinite]" />
        <div className="absolute left-1/2 top-[59rem] h-px w-[58%] -translate-x-1/2 bg-gradient-to-r from-transparent via-neon-cyan/80 to-transparent shadow-[0_0_22px_rgba(34,211,238,0.8)]" />

        <div
          ref={figureRef}
          className="absolute right-[-20%] top-14 w-[76%] opacity-35 sm:right-[-5%] sm:top-10 sm:w-[72%] sm:opacity-65 lg:right-[7%] lg:top-10 lg:w-[58%] lg:opacity-85"
        >
          <div className="absolute -inset-[8%] hidden rounded-[48%] bg-[radial-gradient(ellipse_at_50%_38%,rgba(170,250,255,0.18),rgba(34,211,238,0.07)_38%,transparent_72%)] blur-2xl mix-blend-screen lg:block lg:motion-safe:animate-[pulse_7s_ease-in-out_infinite]" />
          <img
            src="/images/veronica/veronica-hero-hologram-v2.webp"
            alt=""
            width={768}
            height={1365}
            decoding="async"
            fetchPriority="high"
            className="relative block h-auto w-full drop-shadow-[0_0_24px_rgba(34,211,238,0.2)] lg:opacity-90 lg:saturate-[0.82] lg:contrast-[1.08] lg:brightness-[0.92] lg:drop-shadow-[0_0_18px_rgba(120,235,255,0.24)] lg:drop-shadow-[0_0_58px_rgba(34,211,238,0.13)]"
          />

          <TrackedEye side="left" />
          <TrackedEye side="right" />

          <div className="absolute inset-[2%] hidden bg-[radial-gradient(ellipse_at_50%_40%,rgba(210,252,255,0.12),rgba(34,211,238,0.045)_46%,transparent_76%)] opacity-70 mix-blend-screen lg:block" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,rgba(34,211,238,0.08)_48%,transparent_51%)] bg-[length:100%_9px] opacity-35 mix-blend-screen lg:bg-[linear-gradient(180deg,transparent_0%,rgba(34,211,238,0.07)_48%,transparent_51%)] lg:bg-[length:100%_10px] lg:opacity-25" />
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
