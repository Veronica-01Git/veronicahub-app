import { useEffect, useRef, useState } from "react";
import type { HologramHandle } from "./hologram-scene";

// Holograma "YO" da hero (public/models/yo-hologram.glb). O palco — halo,
// pedestal e marcas de mira — é CSS puro e pinta no primeiro quadro; o
// three.js entra por import() dinâmico e o canvas surge por cima em fade.
// Sem WebGL, o palco sozinho segura a composição.
export function HeroHologram({ className = "" }: { className?: string }) {
  const canvasHost = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "failed">("loading");

  useEffect(() => {
    const host = canvasHost.current;
    if (!host) return;
    let handle: HologramHandle | null = null;
    let cancelled = false;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    import("./hologram-scene")
      .then(({ mountHologram }) =>
        mountHologram(host, {
          src: "/models/yo-hologram.glb",
          reducedMotion,
          onReady: () => !cancelled && setState("ready"),
          onError: () => !cancelled && setState("failed"),
        }),
      )
      .then((h) => {
        if (cancelled) h.dispose();
        else handle = h;
      })
      .catch(() => !cancelled && setState("failed"));

    return () => {
      cancelled = true;
      handle?.dispose();
    };
  }, []);

  return (
    <div
      className={`yo-holo relative mx-auto aspect-square w-full max-w-[560px] ${className}`}
      data-state={state}
      role="img"
      aria-label="Holograma tridimensional da marca YO"
    >
      <div className="yo-holo-halo" aria-hidden="true" />
      <div className="yo-holo-floor" aria-hidden="true" />
      <span className="yo-holo-tick yo-holo-tick-tl" aria-hidden="true" />
      <span className="yo-holo-tick yo-holo-tick-tr" aria-hidden="true" />
      <span className="yo-holo-tick yo-holo-tick-bl" aria-hidden="true" />
      <span className="yo-holo-tick yo-holo-tick-br" aria-hidden="true" />
      <div ref={canvasHost} className="yo-holo-canvas" />
      <p className="yo-holo-caption" aria-hidden="true">
        <span className="vh-led" /> YO · holograma 8D
      </p>
    </div>
  );
}
