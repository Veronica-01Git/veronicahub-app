import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { ArrowUpRight, Check, ChevronDown } from "lucide-react";
import {
  cancelScopedTransition,
  updateWithScopedTransition,
} from "@/lib/scoped-view-transition";
import "./creative-directions.css";

type Direction = {
  title: string;
  category: string;
  format: "image" | "video" | "voice" | "avatar";
  prompt: string;
  image: string;
};

const FILTERS = [
  { id: "all", label: "Todas as ideias" },
  { id: "image", label: "Imagens" },
  { id: "video", label: "Vídeo · prévias" },
] as const;
type Filter = (typeof FILTERS)[number]["id"];

export function CreativeDirections({
  ideas,
  onSelect,
}: {
  ideas: readonly Direction[];
  onSelect: (idea: Direction) => void;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const scope = useRef<HTMLDivElement>(null);
  const disclosure = useRef<HTMLDetailsElement>(null);
  const visible = ideas.filter(
    (idea) => filter === "all" || idea.format === filter,
  );

  useEffect(() => {
    const gallery = scope.current;
    const dismiss = (event: PointerEvent) => {
      const element = disclosure.current;
      if (element?.open && !element.contains(event.target as Node))
        element.open = false;
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && disclosure.current?.open) {
        disclosure.current.open = false;
        disclosure.current.querySelector("summary")?.focus();
      }
    };
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", escape);
    return () => {
      cancelScopedTransition(gallery);
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("keydown", escape);
    };
  }, []);

  const selectFilter = (next: Filter) => {
    if (disclosure.current) {
      disclosure.current.open = false;
      disclosure.current.querySelector("summary")?.focus();
    }
    // Keep the input composer and the rest of the page outside the capture.
    updateWithScopedTransition(
      scope.current,
      () => {
        flushSync(() => setFilter(next));
        if (scope.current) scope.current.scrollLeft = 0;
      },
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
  };

  return (
    <section
      className="studio-directions mt-10"
      aria-labelledby="studio-directions-title"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="font-mono-tech text-[10px] uppercase tracking-[.2em] text-neon-cyan">
            Inspiração criativa
          </span>
          <h2
            id="studio-directions-title"
            className="mt-2 font-display text-2xl tracking-tight text-white sm:text-3xl"
          >
            Comece por uma direção.
          </h2>
          <p className="mt-2 text-sm text-white/55">
            Escolha uma ideia para preencher o compositor e dar seu próprio
            toque.
          </p>
        </div>
        <details ref={disclosure} className="studio-directions-filter">
          <summary className="studio-directions-trigger">
            <span className="sr-only">Filtrar inspiração: </span>
            {FILTERS.find((item) => item.id === filter)?.label}
            <ChevronDown aria-hidden className="h-4 w-4" />
          </summary>
          <div
            className="studio-directions-options"
            role="group"
            aria-label="Filtrar ideias por formato"
          >
            {FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={filter === item.id}
                onClick={() => selectFilter(item.id)}
              >
                {item.label}
                {filter === item.id && (
                  <Check aria-hidden className="h-4 w-4" />
                )}
              </button>
            ))}
          </div>
        </details>
      </div>
      <p
        className="mt-3 text-xs text-white/45"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {visible.length}{" "}
        {visible.length === 1 ? "ideia disponível" : "ideias disponíveis"}
      </p>
      <div
        ref={scope}
        className="studio-directions-track mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-5 [scrollbar-width:thin] [scrollbar-color:rgba(0,255,170,.3)_transparent]"
      >
        {visible.map((idea) => (
          <button
            key={idea.title}
            type="button"
            onClick={() => onSelect(idea)}
            className="group relative aspect-[4/5] w-[220px] shrink-0 snap-start overflow-hidden rounded-[20px] border border-white/10 bg-[#172023] text-left transition hover:-translate-y-1 hover:border-neon-green/60 focus-visible:outline-2 focus-visible:outline-neon-green motion-reduce:transform-none motion-reduce:transition-none sm:w-[260px] lg:w-[calc((100%_-_3rem)/4)]"
          >
            <img
              src={idea.image}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover transition duration-700 group-hover:scale-105 motion-reduce:transform-none motion-reduce:transition-none"
            />
            <span
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent"
            />
            <span className="absolute bottom-0 left-0 right-0 p-5">
              <span className="block font-mono-tech text-[9px] uppercase tracking-widest text-neon-green">
                {idea.category}
              </span>
              <span className="mt-1.5 flex items-center justify-between text-lg font-semibold text-white">
                {idea.title}
                <ArrowUpRight
                  aria-hidden
                  className="h-4 w-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transform-none motion-reduce:transition-none"
                />
              </span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
