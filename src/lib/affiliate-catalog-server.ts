import { createServerFn } from "@tanstack/react-start";
import { and, count, desc, eq, gte, or, sql } from "drizzle-orm";
import { getDb } from "./db";
import { requireAdmin } from "./admin-server";
import { affiliateCatalogProducts, affiliateLinkClicks } from "./schema";
import {
  affiliateProducts as seedProducts,
  isAffiliateAudience,
  sanitizeMediaUrlList,
  type AffiliateProduct,
} from "./affiliate-products";
import {
  finalizeProduct,
  validateProduct,
  validateStatus,
  type ProductInput,
  type RawProductInput,
} from "./affiliate-catalog-core";
import type { FeedCategory } from "./trending-videos";

let catalogReady = false;

export async function ensureAffiliateCatalogStorage() {
  if (catalogReady) return;
  const db = getDb();
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "AffiliateProduct" (
      "id" text PRIMARY KEY NOT NULL,
      "name" text NOT NULL,
      "category" text NOT NULL,
      "affiliateUrl" text NOT NULL,
      "priceLabel" text NOT NULL,
      "commissionLabel" text,
      "angle" text NOT NULL,
      "active" boolean DEFAULT true NOT NULL,
      "priority" integer DEFAULT 0 NOT NULL,
      "createdBy" text REFERENCES "User"("id"),
      "createdAt" timestamp DEFAULT now() NOT NULL,
      "updatedAt" timestamp DEFAULT now() NOT NULL
    )
  `);
  // 0015 — mídia e público. ADD COLUMN IF NOT EXISTS é idempotente, então
  // roda em todo cold start sem custo relevante e dispensa migração manual.
  await db.execute(sql`ALTER TABLE "AffiliateProduct" ADD COLUMN IF NOT EXISTS "coverUrl" text`);
  await db.execute(sql`ALTER TABLE "AffiliateProduct" ADD COLUMN IF NOT EXISTS "videoUrl" text`);
  await db.execute(sql`ALTER TABLE "AffiliateProduct" ADD COLUMN IF NOT EXISTS "galleryUrls" text`);
  await db.execute(
    sql`ALTER TABLE "AffiliateProduct" ADD COLUMN IF NOT EXISTS "audience" text DEFAULT 'unissex' NOT NULL`,
  );
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS "AffiliateProduct_affiliateUrl_key"
    ON "AffiliateProduct" ("affiliateUrl")
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "AffiliateProduct_active_priority_idx"
    ON "AffiliateProduct" ("active", "priority")
  `);

  for (const product of seedProducts) {
    const { galleryUrls, ...seed } = product;
    await db
      .insert(affiliateCatalogProducts)
      .values({
        ...seed,
        galleryUrls: galleryUrls && galleryUrls.length > 0 ? JSON.stringify(galleryUrls) : null,
        priority: 100,
      })
      .onConflictDoNothing();
  }
  catalogReady = true;
}

export function mapProduct(row: typeof affiliateCatalogProducts.$inferSelect): AffiliateProduct {
  return {
    id: row.id,
    name: row.name,
    category: row.category as FeedCategory,
    affiliateUrl: row.affiliateUrl,
    priceLabel: row.priceLabel,
    commissionLabel: row.commissionLabel ?? undefined,
    angle: row.angle,
    coverUrl: row.coverUrl ?? undefined,
    videoUrl: row.videoUrl ?? undefined,
    galleryUrls: parseGalleryUrls(row.galleryUrls),
    audience: isAffiliateAudience(row.audience) ? row.audience : "unissex",
  };
}

// A coluna guarda um JSON de string[] em texto (mesmo padrão do resto do
// schema — ver MediaImage.data). Uma linha antiga ou corrompida vira galeria
// vazia em vez de derrubar a página.
function parseGalleryUrls(value: string | null): string[] | undefined {
  if (!value) return undefined;
  try {
    const parsed = JSON.parse(value);
    const urls = sanitizeMediaUrlList(parsed);
    return urls.length > 0 ? urls : undefined;
  } catch {
    return undefined;
  }
}

export async function upsertProduct(data: ProductInput, adminId: string) {
  const db = getDb();
  const [existing] = await db
    .select({ id: affiliateCatalogProducts.id })
    .from(affiliateCatalogProducts)
    .where(
      or(
        eq(affiliateCatalogProducts.id, data.id ?? ""),
        eq(affiliateCatalogProducts.affiliateUrl, data.affiliateUrl),
      ),
    )
    .limit(1);
  const id = existing?.id ?? data.id ?? "";
  // Coluna é texto — a galeria vira JSON aqui e só volta a ser array em
  // mapProduct/parseGalleryUrls. Lista vazia grava null (sem lixo no banco).
  const galleryUrls = data.galleryUrls.length > 0 ? JSON.stringify(data.galleryUrls) : null;

  const [row] = await db
    .insert(affiliateCatalogProducts)
    .values({ ...data, id, galleryUrls, createdBy: adminId, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: affiliateCatalogProducts.id,
      set: {
        name: data.name,
        category: data.category,
        affiliateUrl: data.affiliateUrl,
        priceLabel: data.priceLabel,
        commissionLabel: data.commissionLabel,
        angle: data.angle,
        priority: data.priority,
        coverUrl: data.coverUrl,
        videoUrl: data.videoUrl,
        galleryUrls,
        audience: data.audience,
        active: true,
        updatedAt: new Date(),
      },
    })
    .returning();
  return row;
}

export const getPublicAffiliateCatalog = createServerFn({ method: "GET" }).handler(async () => {
  try {
    await ensureAffiliateCatalogStorage();
    const rows = await getDb()
      .select()
      .from(affiliateCatalogProducts)
      .where(eq(affiliateCatalogProducts.active, true))
      .orderBy(desc(affiliateCatalogProducts.priority), desc(affiliateCatalogProducts.updatedAt))
      .limit(100);
    return { products: rows.map(mapProduct) };
  } catch (error) {
    console.error("Falha ao carregar catálogo persistente:", error);
    return { products: seedProducts };
  }
});

export async function findPublicAffiliateProduct(
  id: string,
): Promise<AffiliateProduct | undefined> {
  try {
    await ensureAffiliateCatalogStorage();
    const [row] = await getDb()
      .select()
      .from(affiliateCatalogProducts)
      .where(and(eq(affiliateCatalogProducts.id, id), eq(affiliateCatalogProducts.active, true)))
      .limit(1);
    return row ? mapProduct(row) : seedProducts.find((product) => product.id === id);
  } catch {
    return seedProducts.find((product) => product.id === id);
  }
}

// Lista completa do admin — inclui arquivados e os cliques dos últimos 30 dias.
// Função simples (sem sessão) para o painel e o conector MCP compartilharem a
// mesma leitura; quem chama é que decide a autorização.
export async function listAffiliateProductsCore() {
  await ensureAffiliateCatalogStorage();
  const db = getDb();
  const rows = await db
    .select()
    .from(affiliateCatalogProducts)
    .orderBy(desc(affiliateCatalogProducts.active), desc(affiliateCatalogProducts.priority))
    .limit(200);

  let clickMap = new Map<string, number>();
  try {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const clicks = await db
      .select({ productId: affiliateLinkClicks.productId, total: count() })
      .from(affiliateLinkClicks)
      .where(gte(affiliateLinkClicks.clickedAt, since))
      .groupBy(affiliateLinkClicks.productId);
    clickMap = new Map(clicks.map((item) => [item.productId, Number(item.total)]));
  } catch {
    // A telemetria é opcional; o catálogo continua administrável sem ela.
  }

  return rows.map((row) => ({
    ...mapProduct(row),
    active: row.active,
    priority: row.priority,
    clicks30d: clickMap.get(row.id) ?? 0,
    updatedAt: row.updatedAt.toISOString(),
  }));
}

export const listAffiliateProductsAdmin = createServerFn({ method: "GET" }).handler(async () => {
  const admin = await requireAdmin();
  if (!admin) return { ok: false as const, error: "Acesso restrito." };
  return { ok: true as const, products: await listAffiliateProductsCore() };
});

export const saveAffiliateProductAdmin = createServerFn({ method: "POST" })
  .validator(validateProduct)
  .handler(async ({ data }) => {
    const admin = await requireAdmin();
    if (!admin) return { ok: false as const, error: "Acesso restrito." };

    await ensureAffiliateCatalogStorage();
    try {
      const row = await upsertProduct(await finalizeProduct(data), admin.id);
      return { ok: true as const, product: mapProduct(row) };
    } catch (error) {
      return {
        ok: false as const,
        error: error instanceof Error ? error.message : "Falha ao salvar produto.",
      };
    }
  });

function parseBulkInput(input: unknown): { items: RawProductInput[] } {
  const raw = (input as { raw?: unknown })?.raw;
  if (typeof raw !== "string" || !raw.trim()) throw new Error("Cole os produtos para importar.");

  let values: unknown[];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error();
    values = parsed;
  } catch {
    const lines = raw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    values = lines
      .filter((line, index) => !(index === 0 && /^(nome|name)\t/i.test(line)))
      .map((line) => {
        // Colunas: nome, categoria, preço, comissão, ângulo, link, prioridade,
        // público, capa, vídeo e imagens complementares. As quatro últimas
        // são opcionais; complementares aceita várias URLs separadas por ";"
        // dentro da própria célula (TAB continua separando as colunas).
        const [
          name,
          category,
          priceLabel,
          commissionLabel,
          angle,
          affiliateUrl,
          priority,
          audience,
          coverUrl,
          videoUrl,
          galleryUrls,
        ] = line.split("\t");
        return {
          name,
          category,
          priceLabel,
          commissionLabel,
          angle,
          affiliateUrl,
          priority,
          audience,
          coverUrl,
          videoUrl,
          galleryUrls: galleryUrls?.split(";"),
        };
      });
  }

  if (values.length === 0 || values.length > 50) {
    throw new Error("Envie entre 1 e 50 produtos por lote.");
  }
  return { items: values.map(validateProduct) };
}

export const importAffiliateProductsAdmin = createServerFn({ method: "POST" })
  .validator(parseBulkInput)
  .handler(async ({ data }) => {
    const admin = await requireAdmin();
    if (!admin) return { ok: false as const, error: "Acesso restrito." };

    await ensureAffiliateCatalogStorage();
    const errors: string[] = [];
    let imported = 0;
    for (const item of data.items) {
      try {
        await upsertProduct(await finalizeProduct(item), admin.id);
        imported += 1;
      } catch (error) {
        errors.push(`${item.name}: ${error instanceof Error ? error.message : "falha"}`);
      }
    }
    return { ok: errors.length === 0, imported, errors };
  });

// Devolve false quando o produto não existe — o painel ignora, o conector MCP
// precisa dizer ao agente que o id estava errado.
export async function setProductActiveCore(id: string, active: boolean): Promise<boolean> {
  await ensureAffiliateCatalogStorage();
  const rows = await getDb()
    .update(affiliateCatalogProducts)
    .set({ active, updatedAt: new Date() })
    .where(eq(affiliateCatalogProducts.id, id))
    .returning({ id: affiliateCatalogProducts.id });
  return rows.length > 0;
}

export async function updateProductMediaCore(
  id: string,
  coverUrl: string | null,
  galleryUrls: string[],
): Promise<AffiliateProduct | null> {
  await ensureAffiliateCatalogStorage();
  const [row] = await getDb()
    .update(affiliateCatalogProducts)
    .set({
      coverUrl,
      galleryUrls: galleryUrls.length > 0 ? JSON.stringify(galleryUrls) : null,
      updatedAt: new Date(),
    })
    .where(eq(affiliateCatalogProducts.id, id))
    .returning();
  return row ? mapProduct(row) : null;
}

// Cliques por produto num período. Sem productId, soma o catálogo inteiro e
// devolve o ranking; com productId, devolve o total e a série diária (UTC).
export async function countAffiliateClicksCore(opts: { productId?: string; days: number }) {
  const db = getDb();
  const since = new Date(Date.now() - opts.days * 24 * 60 * 60 * 1000);
  const scope = opts.productId
    ? and(
        gte(affiliateLinkClicks.clickedAt, since),
        eq(affiliateLinkClicks.productId, opts.productId),
      )
    : gte(affiliateLinkClicks.clickedAt, since);
  const day = sql<string>`to_char(${affiliateLinkClicks.clickedAt}, 'YYYY-MM-DD')`;
  const [byProduct, daily] = await Promise.all([
    db
      .select({ productId: affiliateLinkClicks.productId, clicks: count() })
      .from(affiliateLinkClicks)
      .where(scope)
      .groupBy(affiliateLinkClicks.productId)
      .orderBy(desc(count()))
      .limit(100),
    opts.productId
      ? db
          .select({ date: day, clicks: count() })
          .from(affiliateLinkClicks)
          .where(scope)
          .groupBy(day)
          .orderBy(day)
      : Promise.resolve([] as { date: string; clicks: number }[]),
  ]);
  return {
    byProduct: byProduct.map((row) => ({ productId: row.productId, clicks: Number(row.clicks) })),
    daily: daily.map((row) => ({ date: row.date, clicks: Number(row.clicks) })),
  };
}

export const setAffiliateProductStatusAdmin = createServerFn({ method: "POST" })
  .validator(validateStatus)
  .handler(async ({ data }) => {
    const admin = await requireAdmin();
    if (!admin) return { ok: false as const, error: "Acesso restrito." };

    await setProductActiveCore(data.id, data.active);
    return { ok: true as const };
  });
