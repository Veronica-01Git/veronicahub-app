import { createServerFn } from "@tanstack/react-start";
import { and, count, desc, eq, gte, or, sql } from "drizzle-orm";
import { getDb } from "./db";
import { requireAdmin } from "./admin-server";
import { affiliateCatalogProducts, affiliateLinkClicks } from "./schema";
import {
  affiliateProducts as seedProducts,
  isAffiliateAudience,
  isAffiliateCategory,
  sanitizeMediaUrl,
  validateShopeeAffiliateUrl,
  type AffiliateAudience,
  type AffiliateProduct,
} from "./affiliate-products";
import type { FeedCategory } from "./trending-videos";

let catalogReady = false;

async function ensureAffiliateCatalogStorage() {
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
    await db
      .insert(affiliateCatalogProducts)
      .values({ ...product, priority: 100 })
      .onConflictDoNothing();
  }
  catalogReady = true;
}

function mapProduct(row: typeof affiliateCatalogProducts.$inferSelect): AffiliateProduct {
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
    audience: isAffiliateAudience(row.audience) ? row.audience : "unissex",
  };
}

function normalizeProductId(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

type ProductInput = {
  id?: string;
  name: string;
  category: FeedCategory;
  affiliateUrl: string;
  priceLabel: string;
  commissionLabel: string | null;
  angle: string;
  priority: number;
  coverUrl: string | null;
  videoUrl: string | null;
  audience: AffiliateAudience;
};

const SHORT_LINK_HOSTS = new Set(["s.shopee.com.br", "shope.ee"]);

// Link curto do painel (s.shopee.com.br/XXXX) → link completo. O painel de
// afiliados entrega link curto por padrão; expandir aqui poupa a Veronica de
// abrir um por um no navegador. Segue no máximo 5 saltos e para assim que
// chega em shopee.com.br — o destino final já traz mmp_pid/utm_content.
export async function expandShopeeShortLink(value: string): Promise<string> {
  let current = value.trim();
  for (let hop = 0; hop < 5; hop += 1) {
    let url: URL;
    try {
      url = new URL(current);
    } catch {
      return value;
    }
    if (!SHORT_LINK_HOSTS.has(url.hostname.toLowerCase())) return url.toString();
    const response = await fetch(url.toString(), {
      method: "GET",
      redirect: "manual",
      headers: { "user-agent": "Mozilla/5.0 (VeronicaHub link-expander)" },
    });
    const location = response.headers.get("location");
    if (!location)
      throw new Error("Link curto não redirecionou — confira se ele abre no navegador.");
    current = new URL(location, url).toString();
  }
  return current;
}

type RawProductInput = Omit<ProductInput, "affiliateUrl" | "id"> & {
  id: string;
  rawUrl: string;
};

function validateProduct(raw: unknown): RawProductInput {
  const data = raw as Record<string, unknown>;
  const name = typeof data?.name === "string" ? data.name.trim() : "";
  const category = typeof data?.category === "string" ? data.category.trim().toLowerCase() : "";
  const priceLabel = typeof data?.priceLabel === "string" ? data.priceLabel.trim() : "";
  const angle = typeof data?.angle === "string" ? data.angle.trim() : "";
  const commissionLabel =
    typeof data?.commissionLabel === "string" && data.commissionLabel.trim()
      ? data.commissionLabel.trim().slice(0, 80)
      : null;
  const rawUrl = typeof data?.affiliateUrl === "string" ? data.affiliateUrl.trim() : "";
  const audienceRaw =
    typeof data?.audience === "string" ? data.audience.trim().toLowerCase() : "unissex";
  const audience: AffiliateAudience = isAffiliateAudience(audienceRaw) ? audienceRaw : "unissex";

  if (name.length < 3) throw new Error("Nome do produto obrigatório.");
  if (!isAffiliateCategory(category)) throw new Error(`Categoria inválida para "${name}".`);
  if (!priceLabel) throw new Error(`Preço obrigatório para "${name}".`);
  if (angle.length < 10) throw new Error(`Informe um ângulo de venda para "${name}".`);
  if (!rawUrl) throw new Error(`Link de afiliado obrigatório para "${name}".`);

  const priorityValue =
    typeof data?.priority === "number" ? data.priority : Number(data?.priority ?? 0);
  const priority = Number.isFinite(priorityValue)
    ? Math.max(-100, Math.min(999, Math.round(priorityValue)))
    : 0;

  return {
    id: typeof data?.id === "string" ? normalizeProductId(data.id) : "",
    name: name.slice(0, 180),
    category,
    rawUrl,
    priceLabel: priceLabel.slice(0, 80),
    commissionLabel,
    angle: angle.slice(0, 500),
    priority,
    coverUrl: sanitizeMediaUrl(data?.coverUrl),
    videoUrl: sanitizeMediaUrl(data?.videoUrl),
    audience,
  };
}

// Parte assíncrona da validação: expande link curto e só então confere
// afiliado/Sub_id. Fica fora do validator porque envolve rede.
async function finalizeProduct(input: RawProductInput): Promise<ProductInput> {
  const expanded = await expandShopeeShortLink(input.rawUrl);
  const checkedUrl = validateShopeeAffiliateUrl(expanded);
  if (!checkedUrl.ok) throw new Error(`${input.name}: ${checkedUrl.error}`);

  const pathId = new URL(checkedUrl.url).pathname.split("/").filter(Boolean).at(-1) ?? "";
  const id = input.id || normalizeProductId(`${input.name}-${pathId}`);
  if (!id) throw new Error(`Não foi possível gerar o identificador de "${input.name}".`);

  const { rawUrl: _rawUrl, ...rest } = input;
  return { ...rest, id, affiliateUrl: checkedUrl.url };
}

async function upsertProduct(data: ProductInput, adminId: string) {
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

  const [row] = await db
    .insert(affiliateCatalogProducts)
    .values({ ...data, id, createdBy: adminId, updatedAt: new Date() })
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

export const listAffiliateProductsAdmin = createServerFn({ method: "GET" }).handler(async () => {
  const admin = await requireAdmin();
  if (!admin) return { ok: false as const, error: "Acesso restrito." };

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

  return {
    ok: true as const,
    products: rows.map((row) => ({
      ...mapProduct(row),
      active: row.active,
      priority: row.priority,
      clicks30d: clickMap.get(row.id) ?? 0,
      updatedAt: row.updatedAt.toISOString(),
    })),
  };
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
        // público, capa, vídeo. As três últimas são opcionais.
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

function statusValidator(input: unknown) {
  const data = input as { id?: unknown; active?: unknown };
  if (typeof data?.id !== "string" || !data.id) throw new Error("Produto obrigatório.");
  if (typeof data?.active !== "boolean") throw new Error("Status inválido.");
  return { id: data.id, active: data.active };
}

export const setAffiliateProductStatusAdmin = createServerFn({ method: "POST" })
  .validator(statusValidator)
  .handler(async ({ data }) => {
    const admin = await requireAdmin();
    if (!admin) return { ok: false as const, error: "Acesso restrito." };

    await ensureAffiliateCatalogStorage();
    await getDb()
      .update(affiliateCatalogProducts)
      .set({ active: data.active, updatedAt: new Date() })
      .where(eq(affiliateCatalogProducts.id, data.id));
    return { ok: true as const };
  });
