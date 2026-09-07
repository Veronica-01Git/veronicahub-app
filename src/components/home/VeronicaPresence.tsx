import { useEffect, useRef, type CSSProperties } from "react";

type PupilStyle = CSSProperties & {
  "--pupil-x": string;
  "--pupil-y": string;
};

const pupilStyle: PupilStyle = {
  "--pupil-x": "0px",
  "--pupil-y": "0px",
  transform: "translate3d(var(--pupil-x), var(--pupil-y), 0)",
};

function TrackedPupil({ side }: { side: "left" | "right" }) {
  return (
    <span
      className={`absolute top-[34.9%] aspect-square w-[4.1%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_48%_45%,#55eaff_0%,#19bde2_34%,#087da9_72%,#032f4c_100%)] shadow-[inset_0_0_6px_rgba(220,255,255,0.65),0_0_8px_rgba(28,220,255,0.4)] ${
        side === "left" ? "left-[31.25%]" : "left-[66.05%]"
      }`}
    >
      <span
        data-pupil
        style={pupilStyle}
        className="absolute left-[24%] top-[24%] aspect-square w-[52%] rounded-full bg-[radial-gradient(circle_at_38%_35%,#dfffff_0_7%,#061015_12%,#000_74%)] shadow-[0_0_4px_rgba(0,0,0,0.9)] will-change-transform transition-transform duration-100 ease-out"
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

    const movePupils = (x: number, y: number) => {
      const figure = figureRef.current;
      if (!figure) return;

      figure.querySelectorAll<HTMLElement>("[data-pupil]").forEach((pupil) => {
        pupil.style.setProperty("--pupil-x", `${x.toFixed(2)}px`);
        pupil.style.setProperty("--pupil-y", `${y.toFixed(2)}px`);
      });
    };

    const handlePointerMove = (event: PointerEvent) => {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(() => {
        const normalizedX = (event.clientX / window.innerWidth - 0.5) * 2;
        const normalizedY = (event.clientY / window.innerHeight - 0.5) * 2;
        const distance = Math.hypot(normalizedX, normalizedY);
        const damping = distance > 1 ? 1 / distance : 1;

        movePupils(normalizedX * damping * 4.5, normalizedY * damping * 3.2);
      });
    };

    const resetPupils = () => movePupils(0, 0);

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("blur", resetPupils);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("blur", resetPupils);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-y-0 right-0 w-full sm:w-[72%] lg:w-[54%]">
        <div className="absolute left-1/2 top-[53%] h-[58%] w-[64%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-neon-cyan/10 blur-[70px]" />
        <div className="absolute bottom-[7%] left-1/2 h-px w-[58%] -translate-x-1/2 bg-gradient-to-r from-transparent via-neon-cyan/80 to-transparent shadow-[0_0_22px_rgba(34,211,238,0.8)]" />

        <div
          ref={figureRef}
          className="absolute bottom-[-16%] right-[-17%] w-[78%] opacity-40 sm:bottom-[-20%] sm:right-[-4%] sm:w-[74%] sm:opacity-65 lg:bottom-[-19%] lg:right-[2%] lg:w-[82%] lg:opacity-95"
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

          <TrackedPupil side="left" />
          <TrackedPupil side="right" />

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
