import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { articles } from "./schema";

// Chamado direto do src/server.ts (interceptado antes do handler do
// TanStack), mesmo padrão do webhook do Mercado Pago e do sitemap — precisa
// de URL fixa e estável pra funcionar como og:image (crawler de rede social
// não aceita data: URI). Os bytes ficam no Postgres (coverImageData, base64)
// em vez de R2: tentativas anteriores de bindar R2 nesse stack (Vite/nitro,
// não wrangler puro) quebraram o build — ver ARQUITETURA-STUDIO.md § 4.5.
export async function handleCoverImage(slug: string): Promise<Response> {
  const db = getDb();
  const [row] = await db
    .select({
      coverImageData: articles.coverImageData,
      coverImageMimeType: articles.coverImageMimeType,
    })
    .from(articles)
    .where(eq(articles.slug, slug))
    .limit(1);

  if (!row?.coverImageData || !row.coverImageMimeType) {
    return new Response("not found", { status: 404 });
  }

  const bytes = Uint8Array.from(atob(row.coverImageData), (c) => c.charCodeAt(0));

  return new Response(bytes, {
    headers: {
      "content-type": row.coverImageMimeType,
      "cache-control": "public, max-age=86400",
    },
  });
}
