import { createServerFn } from "@tanstack/react-start";
import { and, count, desc, eq, gte, sql } from "drizzle-orm";
import { getDb } from "./db";
import { getSessionUserId } from "./session";
import { affiliates, affiliateLinkClicks, users } from "./schema";

// Conta de divulgador da Veronica Rede (Fase 2 da afiliação).
//
// O que muda em relação à Fase 1: lá a pessoa digitava o próprio @ e esse
// texto virava o Sub_id. Funcionava, mas qualquer um podia digitar o @ de
// outro. Aqui o identificador vem da conta logada e é imutável — é ele que
// a Shopee devolve no relatório por Sub_id, então trocar o código de alguém
// invalidaria todo link já postado por essa pessoa.
//
// O que esta camada NÃO faz, de propósito: creditar comissão. A venda
// acontece na Shopee e não existe callback dela pra cá — a conciliação
// depende do relatório por Sub_id. Enquanto essa entrada não existir,
// prometer saldo aqui seria inventar número.

let affiliateStorageReady = false;

async function ensureAffiliateAccountStorage() {
  if (affiliateStorageReady) return;
  const db = getDb();
  // Bootstrap idempotente, mesmo padrão do /r/wire: a migração formal
  // (0009) é a fonte da verdade, isto só evita erro caso o deploy chegue
  // antes dela ser aplicada.
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "Affiliate" (
      "id" text PRIMARY KEY NOT NULL,
      "userId" text NOT NULL UNIQUE REFERENCES "User"("id"),
      "code" text NOT NULL UNIQUE,
      "createdAt" timestamp DEFAULT now() NOT NULL
    )
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "Affiliate_code_idx" ON "Affiliate" ("code")
  `);
  affiliateStorageReady = true;
}

// O código nasce do e-mail pra ser reconhecível pela própria pessoa quando
// ela for conferir no painel da Shopee, com um sufixo curto que evita
// colisão entre "maria@gmail" e "maria@hotmail".
function baseCodeFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "";
  const slug = local
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 16);
  return slug || "div";
}

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 6);
}

export const getMyAffiliate = createServerFn({ method: "GET" }).handler(async () => {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false as const, reason: "anonimo" as const };

  await ensureAffiliateAccountStorage();
  const db = getDb();

  const [existing] = await db
    .select({ code: affiliates.code, createdAt: affiliates.createdAt })
    .from(affiliates)
    .where(eq(affiliates.userId, userId))
    .limit(1);
  if (existing) return { ok: true as const, code: existing.code, createdAt: existing.createdAt };

  const [user] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!user) return { ok: false as const, reason: "anonimo" as const };

  const base = baseCodeFromEmail(user.email);
  // Corrida entre duas abas pedindo o código ao mesmo tempo é real: o UNIQUE
  // no banco é quem decide, e aqui a gente só tenta de novo com outro sufixo.
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = `${base}${randomSuffix()}`;
    try {
      const [created] = await db
        .insert(affiliates)
        .values({ userId, code })
        .returning({ code: affiliates.code, createdAt: affiliates.createdAt });
      if (created) return { ok: true as const, code: created.code, createdAt: created.createdAt };
    } catch {
      const [raced] = await db
        .select({ code: affiliates.code, createdAt: affiliates.createdAt })
        .from(affiliates)
        .where(eq(affiliates.userId, userId))
        .limit(1);
      if (raced) return { ok: true as const, code: raced.code, createdAt: raced.createdAt };
      // Colisão de código: tenta outro sufixo.
    }
  }
  return { ok: false as const, reason: "codigo_indisponivel" as const };
});

/**
 * Cliques encaminhados por este divulgador nos últimos 30 dias, por produto.
 * É intenção, não venda — quem confirma venda é o relatório da Shopee.
 */
export const getMyAffiliateStats = createServerFn({ method: "GET" }).handler(async () => {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false as const, reason: "anonimo" as const };

  await ensureAffiliateAccountStorage();
  const db = getDb();

  const [affiliate] = await db
    .select({ code: affiliates.code })
    .from(affiliates)
    .where(eq(affiliates.userId, userId))
    .limit(1);
  if (!affiliate) return { ok: true as const, code: null, total: 0, byProduct: [] };

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const rows = await db
    .select({ productId: affiliateLinkClicks.productId, clicks: count() })
    .from(affiliateLinkClicks)
    .where(
      and(
        eq(affiliateLinkClicks.affiliateHandle, affiliate.code),
        gte(affiliateLinkClicks.clickedAt, since),
      ),
    )
    .groupBy(affiliateLinkClicks.productId)
    .orderBy(desc(count()));

  const total = rows.reduce((sum, row) => sum + Number(row.clicks), 0);
  return {
    ok: true as const,
    code: affiliate.code,
    total,
    byProduct: rows.map((r) => ({ productId: r.productId, clicks: Number(r.clicks) })),
  };
});
