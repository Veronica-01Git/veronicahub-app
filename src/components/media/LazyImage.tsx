import type { ImgHTMLAttributes } from "react";
import { buildSrcSet, cfImageUrl, type CfImageOptions } from "@/lib/cf-image";

type NativeImgProps = Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  "loading" | "srcSet" | "sizes" | "src"
>;

export interface LazyImageProps extends NativeImgProps {
  /** Caminho da imagem original, ex: "/images/home/veronica-cyborg-hero-poster.webp" */
  src: string;
  alt: string;
  /**
   * Larguras (em px) a gerar para o srcSet responsivo. O navegador escolhe
   * sozinho qual baixar, de acordo com o tamanho da tela do dispositivo.
   */
  widths?: number[];
  /** Atributo `sizes` padrão do HTML. Ajuste por imagem quando ela não ocupa 100% da largura da tela. */
  sizes?: string;
  /**
   * true APENAS para a imagem principal acima da dobra (ex: hero da home).
   * Isso desliga o lazy loading e sobe a prioridade de rede — é o mesmo
   * papel do fetchpriority="high" que a Adobe usa na imagem principal.
   */
  priority?: boolean;
  /**
   * Usa /api/img (transformação dentro do Worker, ver src/lib/cf-image.ts)
   * pra gerar as variantes de tamanho/formato a partir do arquivo original.
   * Default true — desligue pontualmente pra imagens com src externo (ex.:
   * URL de geração de IA), onde não faz sentido tentar redimensionar via
   * nossa própria rota.
   */
  useCfResize?: boolean;
  cfOptions?: Omit<CfImageOptions, "width">;
}

const DEFAULT_WIDTHS = [400, 800, 1200, 1600];

/**
 * <img> com lazy loading nativo, decodificação assíncrona e (opcionalmente)
 * variantes responsivas via /api/img — a versão do componente para o padrão
 * que a Adobe usa com "?width=750&format=webp" nas próprias imagens.
 *
 * Uso:
 *   <LazyImage src="/images/home/veronica-cyborg-hero-poster.webp" alt="..." priority />
 *   <LazyImage src="/images/courses/modulo-3.webp" alt="..." sizes="(min-width: 768px) 33vw, 100vw" />
 */
export function LazyImage({
  src,
  alt,
  widths = DEFAULT_WIDTHS,
  sizes = "100vw",
  priority = false,
  useCfResize = true,
  cfOptions,
  className,
  ...rest
}: LazyImageProps) {
  const largestWidth = widths[widths.length - 1];

  const finalSrc = useCfResize ? cfImageUrl(src, { ...cfOptions, width: largestWidth }) : src;

  const srcSet = useCfResize ? buildSrcSet(src, widths, cfOptions) : undefined;

  return (
    <img
      src={finalSrc}
      srcSet={srcSet}
      sizes={srcSet ? sizes : undefined}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : "auto"}
      className={className}
      {...rest}
    />
  );
}
