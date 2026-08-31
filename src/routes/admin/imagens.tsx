import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ShieldAlert, Upload, Copy, Check, Trash2, Loader2, ImageIcon } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import {
  listMediaImagesAdmin,
  uploadMediaImageAdmin,
  deleteMediaImageAdmin,
} from "@/lib/media-images-server";

// Rota não listada em ECOSYSTEM_LINKS de propósito, mesmo padrão de
// /admin e /admin/artigos — acesso só por URL direta, protegido no servidor
// via requireAdmin() em cada server function (ver media-images-server.ts).
export const Route = createFileRoute("/admin/imagens")({
  component: MediaImagesAdmin,
  head: () => ({
    meta: [{ title: "Banco de imagens · Painel Admin | Veronica Hub" }],
  }),
});

type MediaImageRow = {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  altText: string | null;
  url: string;
  createdAt: string;
};

type ListState = { ok: true; images: MediaImageRow[] } | { ok: false; error: string } | null;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Lê o arquivo como data URL e separa o base64 puro (sem o prefixo
// "data:image/...;base64,") — é isso que o server function espera.
function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const comma = result.indexOf(",");
      resolve(comma === -1 ? result : result.slice(comma + 1));
    };
    reader.onerror = () => reject(reader.error ?? new Error("Falha ao ler o arquivo."));
    reader.readAsDataURL(file);
  });
}

function readImageDimensions(file: File): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

function MediaImagesAdmin() {
  const [state, setState] = useState<ListState>(null);
  const [altText, setAltText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function refresh() {
    listMediaImagesAdmin()
      .then((res) => setState(res as ListState))
      .catch((err) =>
        setState({ ok: false, error: err instanceof Error ? err.message : "Falha ao carregar." }),
      );
  }

  useEffect(refresh, []);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploading(true);
    setNotice(null);
    try {
      const [base64, dimensions] = await Promise.all([
        readFileAsBase64(file),
        readImageDimensions(file),
      ]);
      const res = await uploadMediaImageAdmin({
        data: {
          filename: file.name,
          mimeType: file.type,
          data: base64,
          width: dimensions?.width,
          height: dimensions?.height,
          altText: altText.trim() || undefined,
        },
      });
      if (!res.ok) {
        setNotice(`Erro ao enviar: ${res.error}`);
      } else {
        setNotice(`"${res.image.filename}" enviada.`);
        setAltText("");
        refresh();
      }
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Falha ao enviar imagem.");
    } finally {
      setUploading(false);
    }
  }

  async function copyUrl(img: MediaImageRow) {
    const fullUrl = `${window.location.origin}${img.url}`;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopiedId(img.id);
      setTimeout(() => setCopiedId((cur) => (cur === img.id ? null : cur)), 1500);
    } catch {
      setNotice(`URL: ${fullUrl}`);
    }
  }

  async function remove(img: MediaImageRow) {
    if (!window.confirm(`Excluir "${img.filename}"? Não dá pra desfazer.`)) return;
    const res = await deleteMediaImageAdmin({ data: { id: img.id } });
    if (!res.ok) setNotice(`Erro: ${res.error}`);
    else refresh();
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <div className="mx-auto max-w-5xl px-6 py-14">
        <div className="mb-8 flex items-center gap-3 font-mono-tech text-[11px] uppercase tracking-widest text-neon-green">
          <span className="h-1.5 w-1.5 rounded-full bg-neon-green animate-pulse-dot" />
          Banco de imagens
        </div>

        {state && !state.ok ? (
          <div className="flex items-start gap-3 rounded-sm border border-destructive/40 bg-destructive/5 p-5">
            <ShieldAlert className="mt-0.5 h-5 w-5 flex-shrink-0 text-destructive" />
            <div>
              <p className="font-medium text-foreground">{state.error}</p>
              <p className="mt-1 text-[13px] text-muted-foreground">
                Faça login pelo botão "Entrar" no topo com o e-mail autorizado e recarregue.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-10">
            {notice && (
              <div className="rounded-sm border border-border/60 bg-surface/40 px-4 py-3 text-sm text-foreground">
                {notice}
              </div>
            )}

            <section>
              <h2 className="mb-4 font-display text-xl">Enviar imagem</h2>
              <div className="flex flex-col gap-3 rounded-sm border border-border/60 bg-surface/30 p-5 sm:flex-row sm:items-center">
                <input
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  placeholder="Descrição / alt text (opcional)"
                  className="flex-1 rounded-sm border border-border/60 bg-background px-3 py-2 text-sm outline-none focus:border-neon-green"
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center justify-center gap-2 rounded-sm bg-neon-green px-4 py-2 text-sm font-medium text-primary-foreground transition hover:brightness-110 disabled:opacity-50"
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {uploading ? "Enviando…" : "Escolher arquivo"}
                </button>
              </div>
              <p className="mt-2 text-[12.5px] text-muted-foreground">
                JPEG, PNG, WEBP ou GIF — até 5 MB.
              </p>
            </section>

            <section>
              <h2 className="mb-4 font-display text-xl">
                Imagens {state?.ok ? `(${state.images.length})` : ""}
              </h2>
              {!state ? (
                <p className="text-muted-foreground">Carregando…</p>
              ) : state.images.length === 0 ? (
                <p className="text-muted-foreground">Nenhuma imagem ainda.</p>
              ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {state.images.map((img) => (
                    <div
                      key={img.id}
                      className="flex flex-col overflow-hidden rounded-sm border border-border/60 bg-surface/30"
                    >
                      <div className="aspect-square bg-background/60">
                        <img
                          src={img.url}
                          alt={img.altText ?? img.filename}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex flex-1 flex-col gap-1 p-3">
                        <span className="line-clamp-1 text-xs font-medium" title={img.filename}>
                          {img.filename}
                        </span>
                        <span className="font-mono-tech text-[10.5px] text-muted-foreground">
                          {img.width && img.height ? `${img.width}×${img.height} · ` : ""}
                          {formatBytes(img.sizeBytes)}
                        </span>
                        <div className="mt-auto flex items-center gap-3 pt-2">
                          <button
                            onClick={() => copyUrl(img)}
                            className="inline-flex items-center gap-1 text-xs text-neon-cyan hover:underline"
                          >
                            {copiedId === img.id ? (
                              <Check className="h-3 w-3" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                            {copiedId === img.id ? "Copiada" : "Copiar URL"}
                          </button>
                          <button
                            onClick={() => remove(img)}
                            className="inline-flex items-center gap-1 text-xs text-destructive hover:underline"
                          >
                            <Trash2 className="h-3 w-3" />
                            Excluir
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {state?.ok && state.images.length === 0 && (
                <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <ImageIcon className="h-4 w-4" /> Envie a primeira imagem acima.
                </div>
              )}
            </section>
          </div>
        )}
      </div>

      <SiteFooter />
    </div>
  );
}
