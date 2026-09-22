import { sql } from "drizzle-orm";
import { getDb } from "./db";
import { buildAffiliateUrl, normalizeHandle } from "./affiliate-products";
import { findPublicAffiliateProduct } from "./affiliate-catalog-server";

// Redirect rastreado dos produtos de afiliado (/r/afiliado) — mesmo desenho
// do /r/wire: registra a intenção comercial e manda a pessoa pro destino.
// Não guarda IP, cookie, e-mail nem user-agent; o identificador do
// divulgador é o apelido público que ele mesmo escolheu pra carimbar no
// Sub_id da Shopee, não um dado pessoal que a gente coletou.
//
// A conversão de verdade (pedido e comissão) fica na Shopee, atribuída pelo
// Sub_id. Aqui medimos só o encaminhamento — o que permite comparar
// "quantos cliques mandei" com "quantas vendas a Shopee reportou".

let affiliateStorageReady = false;

async function ensureAffiliateStorage() {
  if (affiliateStorageReady) return;
  const db = getDb();
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "AffiliateLinkClick" (
      "id" text PRIMARY KEY NOT NULL,
      "productId" text NOT NULL,
      "category" text NOT NULL,
      "affiliateHandle" text,
      "placement" text NOT NULL,
      "clickedAt" timestamp DEFAULT now() NOT NULL
    )
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "AffiliateLinkClick_clickedAt_idx"
    ON "AffiliateLinkClick" ("clickedAt")
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "AffiliateLinkClick_productId_clickedAt_idx"
    ON "AffiliateLinkClick" ("productId", "clickedAt")
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "AffiliateLinkClick_handle_clickedAt_idx"
    ON "AffiliateLinkClick" ("affiliateHandle", "clickedAt")
  `);
  affiliateStorageReady = true;
}

const ALLOWED_PLACEMENTS = new Set([
  "analytics_catalogo",
  "analytics_feed",
  "rede_catalogo",
  "link_divulgador",
]);

export async function handleAffiliateRedirect(request: Request): Promise<Response> {
  if (request.method !== "GET") return new Response("method not allowed", { status: 405 });

  const url = new URL(request.url);
  const productId = url.searchParams.get("produto")?.trim() ?? "";
  const rawPlacement = url.searchParams.get("origem")?.trim() ?? "analytics_catalogo";
  const placement = ALLOWED_PLACEMENTS.has(rawPlacement) ? rawPlacement : "analytics_catalogo";
  const handle = normalizeHandle(url.searchParams.get("div") ?? "");

  const product = await findPublicAffiliateProduct(productId);
  if (!product) return new Response("produto não encontrado", { status: 404 });

  const destination = buildAffiliateUrl(product, { handle, placement });

  const userAgent = request.headers.get("user-agent") ?? "";
  const isAutomatedPreview = /bot|crawler|spider|preview|facebookexternalhit|whatsapp/i.test(
    userAgent,
  );
  if (!isAutomatedPreview) {
    try {
      await ensureAffiliateStorage();
      const db = getDb();
      await db.execute(sql`
        INSERT INTO "AffiliateLinkClick" ("id", "productId", "category", "affiliateHandle", "placement")
        VALUES (
          ${crypto.randomUUID()},
          ${product.id},
          ${product.category},
          ${handle || null},
          ${placement}
        )
      `);
    } catch (error) {
      // Telemetria nunca pode impedir a pessoa de chegar na oferta.
      console.error("Falha ao registrar clique de afiliado:", error);
    }
  }

  return Response.redirect(destination, 302);
}
