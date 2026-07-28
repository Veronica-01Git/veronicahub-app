import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { useReveal } from "@/hooks/use-reveal";

type Beat = {
  id: string;
  eyebrow: string;
  title: string;
  copy: string;
  desktop: { webp: string; jpg: string };
  mobile: { webp: string; jpg: string };
};

const BEATS: Beat[] = [
  {
    id: "identidade",
    eyebrow: "Identidade",
    title: "Por fora, Veronica.",
    copy: "Por dentro, um sistema inteiro — construído pra processar, decidir e executar sem parar.",
    desktop: { webp: "/images/cinematic/cine-01-identidade-1920.webp", jpg: "/images/cinematic/cine-01-identidade-1920.jpg" },
    mobile: { webp: "/images/cinematic/cine-01-identidade-960.webp", jpg: "/images/cinematic/cine-01-identidade-960.jpg" },
  },
  {
    id: "energia",
    eyebrow: "Energia digital",
    title: "Cada decisão, dado em movimento.",
    copy: "O que parece luz é informação correndo em tempo real por trás de cada resposta.",
    desktop: { webp: "/images/cinematic/cine-02-energia-1920.webp", jpg: "/images/cinematic/cine-02-energia-1920.jpg" },
    mobile: { webp: "/images/cinematic/cine-02-energia-960.webp", jpg: "/images/cinematic/cine-02-energia-960.jpg" },
  },
  {
    id: "interface",
    eyebrow: "Interface",
    title: "Onde comando vira execução.",
    copy: "A ponte entre o que você pede e o que o sistema entrega — sem fricção.",
    desktop: { webp: "/images/cinematic/cine-03-interface-1920.webp", jpg: "/images/cinematic/cine-03-interface-1920.jpg" },
    mobile: { webp: "/images/cinematic/cine-03-interface-960.webp", jpg: "/images/cinematic/cine-03-interface-960.jpg" },
  },
  {
    id: "percepcao",
    eyebrow: "Percepção",
    title: "Ela lê o que você não teria tempo de ler.",
    copy: "Processamento constante, atenção que não pisca.",
    desktop: { webp: "/images/cinematic/cine-04-percepcao-1920.webp", jpg: "/images/cinematic/cine-04-percepcao-1920.jpg" },
    mobile: { webp: "/images/cinematic/cine-04-percepcao-960.webp", jpg: "/images/cinematic/cine-04-percepcao-960.jpg" },
  },
  {
    id: "nucleo",
    eyebrow: "Núcleo",
    title: "O centro que conecta tudo.",
    copy: "Cada ferramenta do ecossistema fala com o mesmo núcleo — por isso tudo funciona junto.",
    desktop: { webp: "/images/cinematic/cine-05-nucleo-1920.webp", jpg: "/images/cinematic/cine-05-nucleo-1920.jpg" },
    mobile: { webp: "/images/cinematic/cine-05-nucleo-960.webp", jpg: "/images/cinematic/cine-05-nucleo-960.jpg" },
  },
  {
    id: "sistema",
    eyebrow: "Sistema ativo",
    title: "Pronta. Rodando. Sem pausa.",
    copy: "24 horas por dia, todos os produtos Veronica compartilhando a mesma inteligência.",
    desktop: { webp: "/images/cinematic/cine-06-sistema-1920.webp", jpg: "/images/cinematic/cine-06-sistema-1920.jpg" },
    mobile: { webp: "/images/cinematic/cine-06-sistema-960.webp", jpg: "/images/cinematic/cine-06-sistema-960.jpg" },
  },
];

// Interlúdio cinematográfico entre Ecossistema e Planos. Desktop/tablet:
// GSAP+ScrollTrigger+Lenis pinam a seção e "esfregam" 6 imagens conforme o
// scroll (like Apple product pages). Mobile e prefers-reduced-motion: cai
// pra uma lista empilhada normal, sem pin/scrub — mais leve e sem o risco
// de travar em telas pequenas. Lenis só existe enquanto este componente
// está montado (é destruído no unmount), então o resto do site continua
// com scroll nativo.
export function CinematicReveal() {
  const [mode, setMode] = useState<"pending" | "cinematic" | "stacked">("pending");
  const [active, setActive] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);
  const imageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const textRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const small = window.matchMedia("(max-width: 767px)").matches;
    setMode(reduced || small ? "stacked" : "cinematic");
  }, []);

  useEffect(() => {
    if (mode !== "cinematic" || !sectionRef.current) return;

    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis();
    lenis.on("scroll", ScrollTrigger.update);
    const tickerCallback = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tickerCallback);
    gsap.ticker.lagSmoothing(0);

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
          onUpdate: (self) => {
            setActive(Math.min(BEATS.length - 1, Math.floor(self.progress * BEATS.length)));
          },
        },
      });

      BEATS.forEach((_, i) => {
        const img = imageRefs.current[i];
        const txt = textRefs.current[i];
        if (!img || !txt) return;

        // Deriva de Ken Burns lenta ao longo de todo o segmento do beat —
        // nunca corta/pula, só um zoom contínuo e suave.
        tl.fromTo(img, { scale: 1.04 }, { scale: 1.16, ease: "none", duration: 1 }, i);

        if (i === 0) {
          gsap.set(img, { opacity: 1 });
          gsap.set(txt, { opacity: 1, y: 0 });
        } else {
          tl.fromTo(img, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "none" }, i - 0.3);
          tl.fromTo(txt, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.25, ease: "none" }, i - 0.2);
        }
        if (i < BEATS.length - 1) {
          tl.to(img, { opacity: 0, duration: 0.3, ease: "none" }, i + 0.7);
          tl.to(txt, { opacity: 0, y: -16, duration: 0.25, ease: "none" }, i + 0.65);
        }
      });
    }, sectionRef);

    return () => {
      ctx.revert();
      lenis.destroy();
      gsap.ticker.remove(tickerCallback);
    };
  }, [mode]);

  if (mode === "pending") return <div className="h-[100vh]" aria-hidden />;

  if (mode === "stacked") {
    return (
      <section className="border-t border-border/40 bg-surface/30 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-14 flex items-center gap-3 font-mono-tech text-[11px] uppercase tracking-widest text-neon-cyan">
            <span className="h-px w-8 bg-neon-cyan" />
            Por dentro da Veronica
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {BEATS.map((beat) => (
              <StackedBeat key={beat.id} beat={beat} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section ref={sectionRef} className="relative" style={{ height: `${BEATS.length * 100}vh` }}>
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-background">
        {BEATS.map((beat, i) => (
          <div
            key={beat.id}
            ref={(el) => {
              imageRefs.current[i] = el;
            }}
            aria-hidden={i !== active}
            className="absolute inset-0"
            style={{ opacity: i === 0 ? 1 : 0, zIndex: i }}
          >
            <picture>
              <source type="image/webp" srcSet={beat.desktop.webp} />
              <img src={beat.desktop.jpg} alt="" className="h-full w-full object-cover" />
            </picture>
            <div
              aria-hidden
              className="absolute inset-0"
              style={{ background: "linear-gradient(0deg, oklch(0.09 0.01 200 / 0.9) 0%, oklch(0.09 0.01 200 / 0.3) 38%, transparent 62%)" }}
            />
          </div>
        ))}

        <div className="absolute inset-x-0 bottom-0 z-30 mx-auto max-w-7xl px-6 pb-20 md:pb-28">
          {BEATS.map((beat, i) => (
            <div
              key={beat.id}
              ref={(el) => {
                textRefs.current[i] = el;
              }}
              className="absolute inset-x-0 bottom-0 max-w-xl"
              style={{ opacity: i === 0 ? 1 : 0 }}
            >
              <div className="flex items-center gap-3 font-mono-tech text-[11px] uppercase tracking-widest text-neon-cyan">
                <span className="h-px w-8 bg-neon-cyan" />
                {beat.eyebrow}
              </div>
              <h3 className="mt-4 font-display text-3xl text-foreground sm:text-4xl" style={{ letterSpacing: "-0.03em", lineHeight: "1.05" }}>
                {beat.title}
              </h3>
              <p className="mt-3 text-base leading-[1.65] text-muted-foreground">{beat.copy}</p>
            </div>
          ))}
        </div>

        {/* Indicador de progresso — mostra a posição dentro da sequência. */}
        <div className="absolute right-6 top-1/2 z-30 hidden -translate-y-1/2 flex-col gap-3 lg:flex">
          {BEATS.map((beat, i) => (
            <span
              key={beat.id}
              aria-hidden
              className="rounded-full border border-neon-cyan/50 transition-all duration-300"
              style={{
                width: i === active ? 8 : 6,
                height: i === active ? 8 : 6,
                background: i === active ? "var(--neon-cyan)" : "transparent",
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function StackedBeat({ beat }: { beat: Beat }) {
  const reveal = useReveal<HTMLDivElement>();
  return (
    <div
      ref={reveal.ref}
      className={`reveal ${reveal.visible ? "reveal-visible" : ""} overflow-hidden rounded-sm border border-border/60 bg-surface/70`}
    >
      <picture>
        <source type="image/webp" srcSet={beat.mobile.webp} />
        <img src={beat.mobile.jpg} alt="" loading="lazy" className="h-56 w-full object-cover" />
      </picture>
      <div className="p-6">
        <div className="flex items-center gap-3 font-mono-tech text-[11px] uppercase tracking-widest text-neon-cyan">
          <span className="h-px w-8 bg-neon-cyan" />
          {beat.eyebrow}
        </div>
        <h3 className="mt-4 font-display text-xl text-foreground" style={{ letterSpacing: "-0.03em", lineHeight: "1.1" }}>
          {beat.title}
        </h3>
        <p className="mt-2 text-sm leading-[1.6] text-muted-foreground">{beat.copy}</p>
      </div>
    </div>
  );
}
