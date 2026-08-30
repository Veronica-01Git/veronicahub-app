import { useEffect, useRef, useState } from "react";

export interface LazyVideoProps {
  /** Caminho do arquivo de vídeo, ex: "/videos/veronica-guia.mp4" */
  src: string;
  /** Poster mostrado instantaneamente, antes do vídeo real carregar. */
  poster: string;
  /** Tipo MIME do arquivo em `src`. */
  type?: string;
  className?: string;
  /**
   * true APENAS para um vídeo que já nasce visível na primeira tela.
   * Nesse caso ele carrega de cara, com preload="metadata". Para qualquer
   * vídeo mais abaixo na página, deixe false: ele só é montado quando entra
   * (ou está perto de entrar) na viewport.
   */
  priority?: boolean;
  loop?: boolean;
  muted?: boolean;
  autoPlay?: boolean;
  playsInline?: boolean;
  controls?: boolean;
}

/**
 * Vídeo que só baixa o arquivo real quando o usuário está prestes a vê-lo.
 * Antes disso, mostra só o poster (uma imagem leve, com lazy loading nativo),
 * então a navegação nunca "paga" pelo peso de um vídeo que a pessoa talvez
 * nem role a página até ver.
 *
 * Uso:
 *   <LazyVideo src="/videos/veronica-guia.mp4" poster="/images/vfx/veronica-guia-poster.webp" />
 */
export function LazyVideo({
  src,
  poster,
  type = "video/mp4",
  className,
  priority = false,
  loop = false,
  muted = true,
  autoPlay = true,
  playsInline = true,
  controls = false,
}: LazyVideoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(priority);

  useEffect(() => {
    if (priority || shouldLoad) return;

    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      // Sem suporte a IntersectionObserver: melhor carregar do que nunca mostrar.
      setShouldLoad(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShouldLoad(true);
            observer.disconnect();
            break;
          }
        }
      },
      { rootMargin: "200px" }, // começa a carregar um pouco antes de entrar na tela
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [priority, shouldLoad]);

  return (
    <div ref={containerRef} className={className}>
      {shouldLoad ? (
        <video
          controls={controls}
          playsInline={playsInline}
          autoPlay={autoPlay}
          muted={muted}
          loop={loop}
          preload={priority ? "metadata" : "none"}
          poster={poster}
          className="block h-auto w-full aspect-video"
        >
          <source src={src} type={type} />
        </video>
      ) : (
        <img
          src={poster}
          alt=""
          loading="lazy"
          decoding="async"
          className="block h-auto w-full aspect-video object-cover"
        />
      )}
    </div>
  );
}
