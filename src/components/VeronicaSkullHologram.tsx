import { useEffect, useRef, useState } from "react";

const WEBP_SRCSET =
  "/images/hero/veronica-skull-500.webp 500w, /images/hero/veronica-skull-800.webp 800w, /images/hero/veronica-skull-1200.webp 1200w, /images/hero/veronica-skull-1760.webp 1760w";
const PNG_SRCSET =
  "/images/hero/veronica-skull-500.png 500w, /images/hero/veronica-skull-800.png 800w, /images/hero/veronica-skull-1200.png 1200w";
const SIZES = "(min-width: 1280px) 480px, (min-width: 1024px) 400px, (min-width: 640px) 300px, 220px";
// Camadas fantasma (drift + aberração cromática) reaproveitam este mesmo
// arquivo já buscado pelo <source>, então não custam requisição extra.
const GHOST_URL = "/images/hero/veronica-skull-800.webp";

// Crânio holográfico estático da hero do Hub. Enquadramento fixo — nunca
// rotaciona, nem dá zoom/pan — toda "vida própria" vem de camadas internas:
// respiração de brilho, drift de partículas em poucos px, flicker orgânico
// ocasional e aberração cromática pontual no flicker.
export function VeronicaSkullHologram({ className = "" }: { className?: string }) {
  const [active, setActive] = useState(false);
  const [flicker, setFlicker] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const flickerTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const small = window.matchMedia("(max-width: 767px)").matches;
    setActive(!reduced && !small);
  }, []);

  useEffect(() => {
    if (!active) return;
    function scheduleNext() {
      const delay = 3200 + Math.random() * 5400;
      timeoutRef.current = setTimeout(() => {
        setFlicker(true);
        flickerTimeoutRef.current = setTimeout(() => setFlicker(false), 240 + Math.random() * 180);
        scheduleNext();
      }, delay);
    }
    scheduleNext();
    return () => {
      clearTimeout(timeoutRef.current);
      clearTimeout(flickerTimeoutRef.current);
    };
  }, [active]);

  return (
    <div aria-hidden className={`pointer-events-none absolute ${className}`} style={{ mixBlendMode: "screen" }}>
      {/* Halo ambiente atrás do crânio — só a opacidade pulsa, nunca a escala. */}
      <div
        className="absolute inset-0 -z-10 animate-skull-halo"
        style={{
          background: "radial-gradient(closest-side, oklch(0.75 0.14 220 / 0.35), transparent 72%)",
          filter: "blur(28px)",
        }}
      />

      <div className="relative aspect-[1760/2160] w-full animate-skull-breathe">
        <picture>
          <source type="image/webp" srcSet={WEBP_SRCSET} sizes={SIZES} />
          <img
            src="/images/hero/veronica-skull-800.png"
            srcSet={PNG_SRCSET}
            sizes={SIZES}
            width={1760}
            height={2160}
            alt=""
            loading="lazy"
            decoding="async"
            className="relative z-10 h-full w-full object-contain"
          />
        </picture>

        {active && (
          <>
            {/* Drift sutil — duas camadas fantasma com deriva independente de poucos px. */}
            <div
              className="absolute inset-0 z-0 animate-skull-drift-a opacity-[0.22]"
              style={{ backgroundImage: `url(${GHOST_URL})`, backgroundSize: "contain", backgroundPosition: "center", backgroundRepeat: "no-repeat" }}
            />
            <div
              className="absolute inset-0 z-0 animate-skull-drift-b opacity-[0.16]"
              style={{ backgroundImage: `url(${GHOST_URL})`, backgroundSize: "contain", backgroundPosition: "center", backgroundRepeat: "no-repeat" }}
            />

            {/* Aberração cromática — quieta por padrão, só reforça no flicker. */}
            <div
              className="absolute inset-0 z-20 transition-opacity duration-200"
              style={{
                backgroundImage: `url(${GHOST_URL})`,
                backgroundSize: "contain",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                transform: "translateX(-2px)",
                filter: "sepia(1) saturate(6) hue-rotate(-40deg) brightness(1.3)",
                mixBlendMode: "screen",
                opacity: flicker ? 0.4 : 0,
              }}
            />
            <div
              className="absolute inset-0 z-20 transition-opacity duration-200"
              style={{
                backgroundImage: `url(${GHOST_URL})`,
                backgroundSize: "contain",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                transform: "translateX(2px)",
                filter: "sepia(1) saturate(6) hue-rotate(140deg) brightness(1.3)",
                mixBlendMode: "screen",
                opacity: flicker ? 0.32 : 0,
              }}
            />

            {/* Linha de scan — flash breve durante o flicker, nunca constante. */}
            <div
              className="absolute inset-x-0 z-30 h-px transition-opacity duration-150"
              style={{
                top: "38%",
                background: "linear-gradient(90deg, transparent, oklch(0.85 0.15 195 / 0.9), transparent)",
                opacity: flicker ? 0.8 : 0,
                filter: "blur(0.5px)",
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}
