import { and, eq } from "drizzle-orm";
import { getDb } from "./db";
import type { WireArticle } from "./meta-graph.server";
import { articles } from "./schema";

// Separado de meta-graph.server.ts para que o banco só seja carregado (por
// import tardio) quando um publicador realmente precisa da matéria.
export async function findPublishedWireArticle(slug: string): Promise<WireArticle | null> {
  const [article] = await getDb()
    .select({
      slug: articles.slug,
      beat: articles.beat,
      headline: articles.headline,
      excerpt: articles.excerpt,
      coverImageUrl: articles.coverImageUrl,
      coverPhotoCredit: articles.coverPhotoCredit,
    })
    .from(articles)
    .where(and(eq(articles.slug, slug), eq(articles.status, "published")))
    .limit(1);
  return article ?? null;
}
