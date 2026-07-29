import { useEffect, useRef } from "react";

// Parallax leve pra camadas decorativas: desloca o elemento em Y proporcional
// à distância do centro da viewport (não ao scroll acumulado — evita drift e
// funciona certo não importa de onde a página começou a ser rolada). Só roda
// enquanto o elemento está perto da viewport (IntersectionObserver com
// margem generosa) e nunca em prefers-reduced-motion.
export function useParallax<T extends HTMLElement>(speed = 0.08) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let inView = false;
    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
      },
      { rootMargin: "25% 0px 25% 0px" },
    );
    io.observe(el);

    let raf = 0;
    const update = () => {
      if (!inView) return;
      const rect = el.getBoundingClientRect();
      const center = rect.top + rect.height / 2 - window.innerHeight / 2;
      el.style.transform = `translateY(${(-center * speed).toFixed(1)}px)`;
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    update();

    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [speed]);

  return ref;
}
