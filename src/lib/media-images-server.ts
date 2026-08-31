import { createServerFn } from "@tanstack/react-start";
import { desc, eq } from "drizzle-orm";
import { getDb } from "./db";
import { mediaImages } from "./schema";
import { requireAdmin } from "./admin-server";

// Mesmos MIME types que o resto do site já lida com em imagem (capa,
// avatar) — sem svg: servir SVG enviado por usuário como imagem pública é
// vetor de XSS armazenado (pode carregar <script>).
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

type MediaImageListRow = Pick<
  typeof mediaImages.$inferSelect,
  "id" | "filename" | "mimeType" | "sizeBytes" | "width" | "height" | "altText" | "createdAt"
>;

function mapImage(row: MediaImageListRow) {
  return {
    id: row.id,
    filename: row.filename,
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    width: row.width,
    height: row.height,
    altText: row.altText,
    url: `/api/media-images/${row.id}`,
    createdAt: row.createdAt.toISOString(),
  };
}

export const listMediaImagesAdmin = createServerFn({ method: "GET" }).handler(async () => {
  const admin = await requireAdmin();
  if (!admin) {
    return { ok: false as const, error: "Acesso restrito." };
  }

  const db = getDb();
  // Nunca seleciona a coluna `data` (base64) na listagem — só a miniatura
  // (via <img src={url}>) precisa dos bytes, buscados um de cada vez pelo
  // endpoint /api/media-images/:id.
  const rows = await db
    .select({
      id: mediaImages.id,
      filename: mediaImages.filename,
      mimeType: mediaImages.mimeType,
      sizeBytes: mediaImages.sizeBytes,
      width: mediaImages.width,
      height: mediaImages.height,
      altText: mediaImages.altText,
      createdAt: mediaImages.createdAt,
    })
    .from(mediaImages)
    .orderBy(desc(mediaImages.createdAt))
    .limit(200);

  return { ok: true as const, images: rows.map(mapImage) };
});

const uploadValidator = (input: unknown) => {
  const data = input as {
    filename?: unknown;
    mimeType?: unknown;
    data?: unknown;
    width?: unknown;
    height?: unknown;
    altText?: unknown;
  };
  if (typeof data?.filename !== "string" || !data.filename.trim()) {
    throw new Error("Nome do arquivo obrigatório.");
  }
  if (typeof data?.mimeType !== "string" || !ALLOWED_MIME_TYPES.has(data.mimeType)) {
    throw new Error("Formato de imagem não suportado (use JPEG, PNG, WEBP ou GIF).");
  }
  if (typeof data?.data !== "string" || !data.data) {
    throw new Error("Arquivo vazio.");
  }
  return {
    filename: data.filename.trim().slice(0, 200),
    mimeType: data.mimeType,
    data: data.data,
    width: typeof data.width === "number" && data.width > 0 ? Math.round(data.width) : null,
    height: typeof data.height === "number" && data.height > 0 ? Math.round(data.height) : null,
    altText:
      typeof data.altText === "string" && data.altText.trim()
        ? data.altText.trim().slice(0, 300)
        : null,
  };
};

export const uploadMediaImageAdmin = createServerFn({ method: "POST" })
  .validator(uploadValidator)
  .handler(async ({ data }) => {
    const admin = await requireAdmin();
    if (!admin) {
      return { ok: false as const, error: "Acesso restrito." };
    }

    // Tamanho real em bytes a partir do base64 (~4/3 do tamanho original),
    // não do length da string — confere antes de gravar no Postgres.
    const sizeBytes = Math.floor((data.data.length * 3) / 4);
    if (sizeBytes > MAX_IMAGE_BYTES) {
      return { ok: false as const, error: "Imagem maior que 5 MB — reduza antes de enviar." };
    }

    const db = getDb();
    const [row] = await db
      .insert(mediaImages)
      .values({
        filename: data.filename,
        mimeType: data.mimeType,
        sizeBytes,
        width: data.width,
        height: data.height,
        altText: data.altText,
        data: data.data,
        uploadedBy: admin.id,
      })
      .returning();

    return { ok: true as const, image: mapImage(row) };
  });

const idValidator = (input: unknown) => {
  const data = input as { id?: unknown };
  if (typeof data?.id !== "string" || !data.id) throw new Error("id obrigatório.");
  return { id: data.id };
};

export const deleteMediaImageAdmin = createServerFn({ method: "POST" })
  .validator(idValidator)
  .handler(async ({ data }) => {
    const admin = await requireAdmin();
    if (!admin) {
      return { ok: false as const, error: "Acesso restrito." };
    }
    const db = getDb();
    await db.delete(mediaImages).where(eq(mediaImages.id, data.id));
    return { ok: true as const };
  });

// Chamado direto do src/server.ts (mesmo padrão de cover-image-server.ts) —
// serve os bytes como imagem pública de verdade, com URL própria e estável,
// sem checar sessão (a imagem em si não é sensível; só upload/exclusão são
// restritos a admin).
export async function handleMediaImage(id: string): Promise<Response> {
  const db = getDb();
  const [row] = await db
    .select({ data: mediaImages.data, mimeType: mediaImages.mimeType })
    .from(mediaImages)
    .where(eq(mediaImages.id, id))
    .limit(1);

  if (!row) {
    return new Response("not found", { status: 404 });
  }

  const bytes = Uint8Array.from(atob(row.data), (c) => c.charCodeAt(0));

  return new Response(bytes, {
    headers: {
      "content-type": row.mimeType,
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}
