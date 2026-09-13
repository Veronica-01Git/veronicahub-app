import { useState } from "react";
import { Check, Copy, Download, Instagram, Share2, Type } from "lucide-react";
import { SOCIAL_LINKS } from "@/components/SiteChrome";
import {
  buildWireCaption,
  drawWireInstagramCard,
  WIRE_CARD_HEIGHT,
  WIRE_CARD_WIDTH,
  WIRE_INSTAGRAM_HANDLE,
  type WireCardImage,
} from "@/lib/wire-instagram-card";

const SITE_URL = "https://veronicahub.com";

type ShareStatus =
  | "idle"
  | "preparing"
  | "shared"
  | "downloaded"
  | "copiedLink"
  | "copiedCaption"
  | "error";

function loadImage(src: string): Promise<WireCardImage> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    // As capas são servidas pelo mesmo domínio do site, então o modo CORS
    // passa e o canvas não fica "sujo" (toBlob continua permitido). Se a
    // matéria apontar pra uma capa de outro domínio sem CORS, o onerror
    // abaixo dispara e o card é redesenhado sem foto.
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Não foi possível carregar a capa."));
    image.src = src;
  });
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

async function buildCardBlob(input: {
  headline: string;
  beatLabel: string;
  coverImageUrl: string | null;
  canonicalUrl: string;
}): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = WIRE_CARD_WIDTH;
  canvas.height = WIRE_CARD_HEIGHT;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Seu navegador não conseguiu preparar o card.");
  await drawWireInstagramCard(context, input, loadImage);
  return exportJpeg(canvas);
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
  const caption = buildWireCaption({ headline, excerpt, canonicalUrl });

  async function copy(value: string) {
    await navigator.clipboard.writeText(value);
  }

  async function handleInstagramShare() {
    setStatus("preparing");
    try {
      const blob = await buildCardBlob({ headline, beatLabel, coverImageUrl, canonicalUrl });
      const file = new File([blob], `wire-tv-${slug}.jpg`, { type: "image/jpeg" });
      const canShareFile = Boolean(
        typeof navigator.share === "function" &&
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [file] }),
      );

      // A legenda vai pra área de transferência nos dois caminhos: o app do
      // Instagram descarta o texto que vem junto da imagem no menu de
      // compartilhamento, então sem isso o card chega ao feed sem legenda.
      const copiedCaption = await copy(caption).then(
        () => true,
        () => false,
      );

      if (canShareFile) {
        await navigator.share({ files: [file], title: headline, text: caption });
        setStatus(copiedCaption ? "shared" : "downloaded");
        return;
      }

      downloadCard(blob, slug);
      setStatus("downloaded");
    } catch (error) {
      // Fechar o menu de compartilhamento do sistema não é falha.
      if (error instanceof DOMException && error.name === "AbortError") {
        setStatus("idle");
        return;
      }
      setStatus("error");
    }
  }

  async function handleCopy(value: string, next: ShareStatus) {
    try {
      await copy(value);
      setStatus(next);
    } catch {
      setStatus("error");
    }
  }

  const statusText: Record<ShareStatus, string> = {
    idle: "Card vertical 1080 × 1350 com legenda pronta para o feed.",
    preparing: "Preparando o card editorial…",
    shared: "Card enviado e legenda copiada. Cole a legenda ao publicar.",
    downloaded: "Card salvo e legenda copiada. Abra o Instagram para publicar.",
    copiedLink: "Link da matéria copiado.",
    copiedCaption: "Legenda copiada.",
    error: "Não foi possível compartilhar neste navegador. Copie o link e tente novamente.",
  };

  const shareDone = status === "shared" || status === "downloaded";

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
            ) : shareDone ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Share2 className="h-3.5 w-3.5" />
            )}
            Compartilhar no Instagram
          </button>
          <button
            type="button"
            onClick={() => handleCopy(caption, "copiedCaption")}
            className="inline-flex min-h-10 items-center gap-2 rounded-sm border border-border/70 px-3 font-mono-tech text-[10px] uppercase tracking-wider text-muted-foreground transition hover:border-neon-green/60 hover:text-neon-green"
          >
            <Type className="h-3.5 w-3.5" /> Copiar legenda
          </button>
          <button
            type="button"
            onClick={() => handleCopy(canonicalUrl, "copiedLink")}
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
            <Instagram className="h-3.5 w-3.5" /> {WIRE_INSTAGRAM_HANDLE}
          </a>
        </div>
      </div>
    </section>
  );
}
