import { eq, desc } from "drizzle-orm";
import { getDb } from "./db";
import { articles } from "./schema";

const SITE_URL = "https://veronicahub.com";

// Páginas estáticas e públicas do hub. /selo-demo e /admin/* ficam de fora
// de propósito (rota temporária de teste e área restrita, respectivamente).
const STATIC_PATHS = [
  "/",
  "/blog",
  "/comandos",
  "/prompt-packs",
  "/veronica-analytics",
  "/veronica-curriculo-certo",
  "/veronica-curriculo-certo-rh",
  "/veronica-nautica",
  "/veronica-rede",
  "/veronica-security",
  "/video-ia",
];

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

async function getPublishedArticlesForFeed() {
  const db = getDb();
  return db
    .select({
      slug: articles.slug,
      headline: articles.headline,
      excerpt: articles.excerpt,
      publishedAt: articles.publishedAt,
      updatedAt: articles.updatedAt,
    })
    .from(articles)
    .where(eq(articles.status, "published"))
    .orderBy(desc(articles.publishedAt))
    .limit(200);
}

// Chamado direto do src/server.ts (interceptado antes do handler do
// TanStack), mesmo padrão do webhook do Mercado Pago — precisa de URL fixa
// (/sitemap.xml) pra ser encontrada por crawlers, o que a URL de RPC do
// createServerFn não permite.
export async function handleSitemap(): Promise<Response> {
  const rows = await getPublishedArticlesForFeed();

  const staticEntries = STATIC_PATHS.map(
    (path) => `  <url>\n    <loc>${SITE_URL}${path}</loc>\n  </url>`,
  );
  const articleEntries = rows.map((row) => {
    const lastmod = (row.updatedAt ?? row.publishedAt)?.toISOString().slice(0, 10);
    return `  <url>\n    <loc>${SITE_URL}/blog/${xmlEscape(row.slug)}</loc>\n${
      lastmod ? `    <lastmod>${lastmod}</lastmod>\n` : ""
    }  </url>`;
  });

  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[
    ...staticEntries,
    ...articleEntries,
  ].join("\n")}\n</urlset>\n`;

  return new Response(body, {
    headers: { "content-type": "application/xml; charset=utf-8" },
  });
}

export async function handleRssFeed(): Promise<Response> {
  const rows = await getPublishedArticlesForFeed();

  const items = rows.map((row) => {
    const link = `${SITE_URL}/blog/${xmlEscape(row.slug)}`;
    const pubDate = row.publishedAt ? new Date(row.publishedAt).toUTCString() : undefined;
    return `  <item>\n    <title>${xmlEscape(row.headline)}</title>\n    <link>${link}</link>\n    <guid>${link}</guid>\n    <description>${xmlEscape(row.excerpt)}</description>\n${
      pubDate ? `    <pubDate>${pubDate}</pubDate>\n` : ""
    }  </item>`;
  });

  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n<channel>\n  <title>Veronica Wire</title>\n  <link>${SITE_URL}/blog</link>\n  <description>Cobertura contínua de IA, energia limpa, geopolítica e mercado tecnológico global — pela Veronica Hub.</description>\n  <language>pt-BR</language>\n${items.join("\n")}\n</channel>\n</rss>\n`;

  return new Response(body, {
    headers: { "content-type": "application/rss+xml; charset=utf-8" },
  });
}
