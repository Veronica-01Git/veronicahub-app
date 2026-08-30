/**
 * cf-image.ts
 *
 * Helpers para gerar URLs de imagem redimensionada/otimizada.
 *
 * É o equivalente ao padrão que a Adobe usa em www.adobe.com
 * (".../media_xxx.png?width=750&format=webp"): a partir de UM único
 * arquivo original, cada dispositivo recebe a versão de tamanho e
 * formato certos, sem precisar gerar/versionar vários arquivos manualmente.
 *
 * Monta URLs pra /api/img — rota registrada em src/server.ts que roda a
 * transformação dentro do próprio Worker (fetch com opções `cf.image`),
 * em vez de depender de /cdn-cgi/image/ no nível de zona. O motivo: esta
 * zona não tem origin HTTP tradicional por trás (é só um Worker com static
 * assets), e o self-fetch que /cdn-cgi/image/ precisa fazer pra buscar a
 * imagem original antes de transformar retornava erro 9509 (500) por causa
 * disso — ver src/lib/image-transform-server.ts para o handler.
 */

export type CfImageFormat = "auto" | "avif" | "webp" | "jpeg" | "baseline-jpeg";
export type CfImageFit = "scale-down" | "contain" | "cover" | "crop" | "pad";

export interface CfImageOptions {
  /** Largura alvo em pixels. Se omitido, usa a largura original. */
  width?: number;
  /** Qualidade de compressão (1-100). 82 é um bom equilíbrio peso/nitidez. */
  quality?: number;
  /** "auto" deixa o Cloudflare escolher AVIF/WebP conforme o navegador que pediu. */
  format?: CfImageFormat;
  /** Como encaixar a imagem nas dimensões pedidas. */
  fit?: CfImageFit;
}

const DEFAULT_OPTIONS: Required<Pick<CfImageOptions, "quality" | "format" | "fit">> = {
  quality: 82,
  format: "auto",
  fit: "scale-down",
};

/**
 * Monta a URL /api/img?src=<caminho-original>&<opções>.
 *
 * cfImageUrl("/images/home/veronica-cyborg-hero-poster.webp", { width: 750 })
 * -> "/api/img?src=%2Fimages%2Fhome%2Fveronica-cyborg-hero-poster.webp&width=750&format=auto&quality=82&fit=scale-down"
 */
export function cfImageUrl(src: string, options: CfImageOptions = {}): string {
  const { width, quality, format, fit } = { ...DEFAULT_OPTIONS, ...options };

  const path = src.startsWith("/") ? src : `/${src}`;
  const params = new URLSearchParams({ src: path, format, quality: String(quality), fit });
  if (width) params.set("width", String(width));

  return `/api/img?${params.toString()}`;
}

/**
 * Gera uma string pronta para o atributo srcSet, com uma variante por
 * largura informada, todas derivadas do mesmo arquivo original.
 *
 * buildSrcSet("/images/home/hero.webp", [400, 800, 1200])
 * -> ".../width=400 400w, .../width=800 800w, .../width=1200 1200w"
 */
export function buildSrcSet(
  src: string,
  widths: number[],
  options: Omit<CfImageOptions, "width"> = {},
): string {
  return widths.map((width) => `${cfImageUrl(src, { ...options, width })} ${width}w`).join(", ");
}
