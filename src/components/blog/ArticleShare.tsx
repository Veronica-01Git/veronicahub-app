import { useState } from "react";
import { Check, Copy, Download, Instagram, Share2 } from "lucide-react";
import { SOCIAL_LINKS } from "@/components/SiteChrome";

const SITE_URL = "https://veronicahub.com";

type ShareStatus = "idle" | "preparing" | "shared" | "downloaded" | "copied" | "error";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Não foi possível carregar a capa."));
    image.src = src;
  });
}

function cropCover(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number,
) {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const sourceWidth = width / scale;
  const sourceHeight = height / scale;
  const sourceX = (image.naturalWidth - sourceWidth) / 2;
  const sourceY = (image.naturalHeight - sourceHeight) / 2;
  context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, width, height);
}

function headlineLines(
  context: CanvasRenderingContext2D,
  headline: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const words = headline.trim().split(/\s+/);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (context.measureText(test).width <= maxWidth) {
      line = test;
      continue;
    }
    if (line) lines.push(line);
    line = word;
    if (lines.length === maxLines - 1) break;
  }

  if (line && lines.length < maxLines) lines.push(line);
  const usedWords = lines.join(" ").split(/\s+/).length;
  if (usedWords < words.length && lines.length) {
    let last = lines[lines.length - 1];
    while (context.measureText(`${last}…`).width > maxWidth && last.includes(" ")) {
      last = last.slice(0, last.lastIndexOf(" "));
    }
    lines[lines.length - 1] = `${last}…`;
  }
  return lines;
}

function exportJpeg(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Falha ao criar o card."))),
        "image/jpeg",
        0.92,
      );
    } catch (error) {
      reject(error);
    }
  });
}

async function buildInstagramCard(input: {
  headline: string;
  beatLabel: string;
  coverImageUrl: string | null;
  canonicalUrl: string;
}): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Seu navegador não conseguiu preparar o card.");

  const draw = async (withCover: boolean) => {
    context.clearRect(0, 0, canvas.width, canvas.height);
    const base = context.createLinearGradient(0, 0, 1080, 1350);
    base.addColorStop(0, "#07110e");
    base.addColorStop(0.55, "#101312");
    base.addColorStop(1, "#050606");
    context.fillStyle = base;
    context.fillRect(0, 0, canvas.width, canvas.height);

    if (withCover && input.coverImageUrl) {
      const image = await loadImage(input.coverImageUrl);
      cropCover(context, image, 1080, 1350);
    }

    const veil = context.createLinearGradient(0, 0, 0, 1350);
    veil.addColorStop(0, "rgba(0,0,0,.22)");
    veil.addColorStop(0.42, "rgba(0,0,0,.34)");
    veil.addColorStop(0.68, "rgba(0,0,0,.82)");
    veil.addColorStop(1, "rgba(0,0,0,.97)");
    context.fillStyle = veil;
    context.fillRect(0, 0, 1080, 1350);

    context.fillStyle = "#63e6a6";
    context.fillRect(76, 72, 54, 5);
    context.font = "700 30px Arial, sans-serif";
    context.letterSpacing = "5px";
    context.fillText("WIRE TV", 76, 128);

    context.fillStyle = "rgba(255,255,255,.76)";
    context.font = "700 24px Arial, sans-serif";
    context.letterSpacing = "3px";
    context.fillText(input.beatLabel.toUpperCase(), 76, 760);

    context.fillStyle = "#ffffff";
    context.font = "700 65px Georgia, serif";
    context.letterSpacing = "0px";
    const lines = headlineLines(context, input.headline, 928, 5);
    lines.forEach((line, index) => context.fillText(line, 76, 842 + index * 76));

    context.fillStyle = "#63e6a6";
    context.fillRect(76, 1240, 928, 2);
    context.fillStyle = "rgba(255,255,255,.8)";
    context.font = "500 22px Arial, sans-serif";
    context.fillText("@wire___tv", 76, 1295);
    context.textAlign = "right";
    context.fillText(input.canonicalUrl.replace("https://", ""), 1004, 1295);
    context.textAlign = "left";
  };

  try {
    await draw(Boolean(input.coverImageUrl));
    return await exportJpeg(canvas);
  } catch {
    await draw(false);
    return exportJpeg(canvas);
  }
}

function downloadCard(blob: Blob, slug: string) {
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = `wire-tv-${slug}.jpg`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(href), 1000);
}

export function ArticleShare({
  headline,
  excerpt,
  slug,
  beatLabel,
  coverImageUrl,
}: {
  headline: string;
  excerpt: string;
  slug: string;
  beatLabel: string;
  coverImageUrl: string | null;
}) {
  const [status, setStatus] = useState<ShareStatus>("idle");
  const canonicalUrl = `${SITE_URL}/blog/${slug}`;
  const caption = `${headline}\n\n${excerpt}\n\nLeia a matéria completa: ${canonicalUrl}\n\n@wire___tv`;

  async function copy(value: string) {
    await navigator.clipboard.writeText(value);
  }

  async function handleInstagramShare() {
    setStatus("preparing");
    try {
      const blob = await buildInstagramCard({ headline, beatLabel, coverImageUrl, canonicalUrl });
      const file = new File([blob], `wire-tv-${slug}.jpg`, { type: "image/jpeg" });
      const canShareFile = Boolean(
        typeof navigator.share === "function" &&
          typeof navigator.canShare === "function" &&
          navigator.canShare({ files: [file] }),
      );

      if (canShareFile) {
        await navigator.share({
          files: [file],
          title: headline,
          text: `${headline}\n\nLeia em ${canonicalUrl}\n@wire___tv`,
        });
        setStatus("shared");
        return;
      }

      downloadCard(blob, slug);
      await copy(caption).catch(() => undefined);
      setStatus("downloaded");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setStatus("idle");
        return;
      }
      setStatus("error");
    }
  }

  async function handleCopyLink() {
    try {
      await copy(canonicalUrl);
      setStatus("copied");
    } catch {
      setStatus("error");
    }
  }

  const statusText: Record<ShareStatus, string> = {
    idle: "Card vertical 1080 × 1350 com legenda pronta para o feed.",
    preparing: "Preparando o card editorial…",
    shared: "Compartilhamento aberto no seu celular.",
    downloaded: "Card baixado e legenda copiada. Abra o Instagram para publicar.",
    copied: "Link da matéria copiado.",
    error: "Não foi possível compartilhar neste navegador. Copie o link e tente novamente.",
  };

  return (
    <section
      aria-label="Compartilhar matéria"
      className="mt-6 border-y border-border/60 bg-surface/25 px-4 py-4 sm:px-5"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 font-mono-tech text-[10px] uppercase tracking-[0.16em] text-neon-green">
            <Instagram className="h-3.5 w-3.5" /> Wire TV no Instagram
          </div>
          <p aria-live="polite" className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {statusText[status]}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleInstagramShare}
            disabled={status === "preparing"}
            className="inline-flex min-h-10 items-center gap-2 rounded-sm bg-foreground px-4 font-mono-tech text-[10px] uppercase tracking-wider text-background transition hover:bg-neon-green hover:text-primary-foreground disabled:cursor-wait disabled:opacity-60"
          >
            {status === "preparing" ? (
              <Download className="h-3.5 w-3.5 animate-pulse" />
            ) : status === "shared" || status === "downloaded" ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Share2 className="h-3.5 w-3.5" />
            )}
            Compartilhar no Instagram
          </button>
          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex min-h-10 items-center gap-2 rounded-sm border border-border/70 px-3 font-mono-tech text-[10px] uppercase tracking-wider text-muted-foreground transition hover:border-neon-green/60 hover:text-neon-green"
          >
            <Copy className="h-3.5 w-3.5" /> Copiar link
          </button>
          <a
            href={SOCIAL_LINKS.wireInstagram}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-10 items-center gap-2 rounded-sm border border-border/70 px-3 font-mono-tech text-[10px] uppercase tracking-wider text-muted-foreground transition hover:border-neon-green/60 hover:text-neon-green"
          >
            <Instagram className="h-3.5 w-3.5" /> @wire___tv
          </a>
        </div>
      </div>
    </section>
  );
}
