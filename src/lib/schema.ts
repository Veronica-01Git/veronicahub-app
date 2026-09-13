import { pgTable, text, integer, boolean, timestamp, pgEnum, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

export const userRole = pgEnum("UserRole", ["user", "admin"]);

// Carteira compartilhada do ecossistema Veronica Hub (Studio, Currículo-Certo,
// Currículo-Certo RH). Créditos grátis ficam ligados permanentemente ao
// e-mail — ao contrário da versão simulada anterior (localStorage), não dá
// pra "resetar" limpando o navegador.
export const users = pgTable("User", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  email: text("email").notNull().unique(),
  role: userRole("role").notNull().default("user"),
  balanceCents: integer("balanceCents").notNull().default(0),
  freeVideoCredits: integer("freeVideoCredits").notNull().default(1),
  freeImageCredits: integer("freeImageCredits").notNull().default(2),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

// Código de login por e-mail. Sem relação com User: o código pode ser
// pedido antes da conta existir (verifyEmailCode cria o User no sucesso).
export const emailOtps = pgTable(
  "EmailOtp",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    email: text("email").notNull(),
    codeHash: text("codeHash").notNull(),
    expiresAt: timestamp("expiresAt").notNull(),
    consumedAt: timestamp("consumedAt"),
    attempts: integer("attempts").notNull().default(0),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (table) => [index("EmailOtp_email_createdAt_idx").on(table.email, table.createdAt)],
);

export const topUpStatus = pgEnum("TopUpStatus", ["PENDENTE", "PAGO", "CANCELADO"]);

// Depósito de saldo via Mercado Pago (Checkout Pro). Só credita balanceCents
// quando o webhook confirma status PAGO — nunca no momento da criação.
export const walletTopUps = pgTable(
  "WalletTopUp",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text("userId")
      .notNull()
      .references(() => users.id),
    amountCents: integer("amountCents").notNull(),
    status: topUpStatus("status").notNull().default("PENDENTE"),
    gatewayPaymentId: text("gatewayPaymentId"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    paidAt: timestamp("paidAt"),
  },
  (table) => [
    index("WalletTopUp_userId_status_idx").on(table.userId, table.status),
    index("WalletTopUp_gatewayPaymentId_idx").on(table.gatewayPaymentId),
  ],
);

// Auditoria de todo débito/crédito de saldo (geração, crédito grátis,
// top-up, estorno). Nunca existe um débito sem uma linha aqui.
export const ledgerEntries = pgTable(
  "LedgerEntry",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text("userId")
      .notNull()
      .references(() => users.id),
    deltaCents: integer("deltaCents").notNull(),
    reason: text("reason").notNull(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (table) => [index("LedgerEntry_userId_createdAt_idx").on(table.userId, table.createdAt)],
);

export const articleBeat = pgEnum("ArticleBeat", [
  "ia",
  "clima",
  "economia",
  "geopolitica",
  "mercado",
]);
export const articleStatus = pgEnum("ArticleStatus", ["draft", "published"]);

// Matérias do Veronica Wire (/blog). Duas formas de virar "published": um
// admin gera rascunhos em /admin/artigos e controla a publicação
// (autoPublished = false), ou o cron de /api/cron/generate-article publica
// direto (autoPublished = true) — metadado interno do fluxo editorial.
export const articles = pgTable(
  "Article",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    slug: text("slug").notNull().unique(),
    beat: articleBeat("beat").notNull(),
    headline: text("headline").notNull(),
    excerpt: text("excerpt").notNull(),
    body: text("body").notNull(),
    desk: text("desk").notNull(),
    // coverImageUrl aponta sempre pro nosso próprio domínio, nunca direto pro
    // provedor de origem — hoje normalmente um asset estático em
    // public/images/blog-covers/, servido pelo próprio Worker. As colunas
    // abaixo (base64 + mime) são um caminho alternativo — servido por
    // src/lib/cover-image-server.ts em /api/cover-image/:slug — pra quando o
    // arquivo não pode virar asset estático do repo. Ambos evitam depender
    // de R2 e mantêm o link estável (não expira) pra funcionar como og:image.
    coverImageUrl: text("coverImageUrl"),
    coverImageData: text("coverImageData"),
    coverImageMimeType: text("coverImageMimeType"),
    // Capa fotográfica (Pexels/Pixabay, ver scripts/fetch-cover-photo.mjs).
    // coverPhotoId é a chave de antirrepetição (últimas 20 matérias, todas
    // editorias); credit/Url alimentam o crédito discreto na página da
    // matéria. Ficam null quando a capa é o card tipográfico (fallback) ou
    // uma foto genérica fixa por editoria.
    coverPhotoId: text("coverPhotoId"),
    coverPhotoCredit: text("coverPhotoCredit"),
    coverPhotoUrl: text("coverPhotoUrl"),
    // true assim que um admin define coverImageUrl manualmente em
    // /admin/artigos — protege contra o pipeline automático (ou um
    // reprocessamento em lote) sobrescrever a escolha humana depois.
    coverManual: boolean("coverManual").notNull().default(false),
    sourceUrls: text("sourceUrls")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    status: articleStatus("status").notNull().default("draft"),
    aiGenerated: boolean("aiGenerated").notNull().default(false),
    autoPublished: boolean("autoPublished").notNull().default(false),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
    publishedAt: timestamp("publishedAt"),
  },
  (table) => [
    index("Article_status_publishedAt_idx").on(table.status, table.publishedAt),
    index("Article_beat_idx").on(table.beat),
  ],
);

// Cliques de saída para as fontes citadas. Não guarda IP, cookie, e-mail ou
// user-agent: o relatório público precisa medir tráfego enviado, não pessoas.
export const sourceReferrals = pgTable(
  "SourceReferral",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    articleId: text("articleId")
      .notNull()
      .references(() => articles.id, { onDelete: "cascade" }),
    beat: articleBeat("beat").notNull(),
    sourceDomain: text("sourceDomain").notNull(),
    destinationUrl: text("destinationUrl").notNull(),
    clickedAt: timestamp("clickedAt").notNull().defaultNow(),
  },
  (table) => [
    index("SourceReferral_clickedAt_idx").on(table.clickedAt),
    index("SourceReferral_sourceDomain_clickedAt_idx").on(table.sourceDomain, table.clickedAt),
  ],
);

// Cliques em ofertas próprias exibidas ao fim das matérias. O evento mede a
// capacidade editorial de encaminhar interesse para produtos Veronica sem
// guardar IP, cookie, e-mail ou user-agent. Receita confirmada continua sendo
// responsabilidade do checkout; aqui medimos apenas intenção comercial.
export const wireOfferClicks = pgTable(
  "WireOfferClick",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    articleId: text("articleId")
      .notNull()
      .references(() => articles.id, { onDelete: "cascade" }),
    beat: articleBeat("beat").notNull(),
    offerId: text("offerId").notNull(),
    placement: text("placement").notNull(),
    clickedAt: timestamp("clickedAt").notNull().defaultNow(),
  },
  (table) => [
    index("WireOfferClick_clickedAt_idx").on(table.clickedAt),
    index("WireOfferClick_offerId_clickedAt_idx").on(table.offerId, table.clickedAt),
  ],
);

// Banco de imagens do painel admin (/admin/imagens) — upload manual pelo
// admin, guardado como base64 no Postgres. Mesmo caminho já usado por
// Article.coverImageData (ver comentário acima e src/lib/cover-image-server.ts):
// R2 já quebrou o build nesse stack antes, e isso mantém uma URL própria e
// estável (/api/media-images/:id), sem depender de storage externo. Serve
// pra ter fotos prontas (ex: com pessoas) pra colar como coverImageUrl de
// uma matéria ou usar em qualquer outro lugar do site.
export const mediaImages = pgTable(
  "MediaImage",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    filename: text("filename").notNull(),
    mimeType: text("mimeType").notNull(),
    sizeBytes: integer("sizeBytes").notNull(),
    width: integer("width"),
    height: integer("height"),
    altText: text("altText"),
    data: text("data").notNull(),
    uploadedBy: text("uploadedBy")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (table) => [index("MediaImage_createdAt_idx").on(table.createdAt)],
);

// Divulgador da Veronica Rede. O `code` é o que vai carimbado no Sub_id do
// link de afiliado da Shopee — é ele que faz a comissão de cada pessoa ser
// rastreável no relatório da plataforma, então precisa ser estável e único
// pra sempre. Trocar o código de alguém invalida todo link já postado por
// essa pessoa; por isso ele nasce com a conta e não tem update.
export const affiliates = pgTable(
  "Affiliate",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text("userId")
      .notNull()
      .unique()
      .references(() => users.id),
    code: text("code").notNull().unique(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (table) => [index("Affiliate_code_idx").on(table.code)],
);

// Clique encaminhado pelo /r/afiliado. Mede só a intenção: a venda e a
// comissão acontecem na Shopee e chegam pelo relatório por Sub_id, não por
// callback. Guardar os dois lados permite comparar "quantos cliques mandei"
// com "quantas vendas a Shopee reportou". Sem IP, cookie, e-mail ou
// user-agent — `affiliateCode` é o apelido público do divulgador.
export const affiliateLinkClicks = pgTable(
  "AffiliateLinkClick",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    productId: text("productId").notNull(),
    category: text("category").notNull(),
    affiliateHandle: text("affiliateHandle"),
    placement: text("placement").notNull(),
    clickedAt: timestamp("clickedAt").notNull().defaultNow(),
  },
  (table) => [
    index("AffiliateLinkClick_clickedAt_idx").on(table.clickedAt),
    index("AffiliateLinkClick_productId_clickedAt_idx").on(table.productId, table.clickedAt),
    index("AffiliateLinkClick_handle_clickedAt_idx").on(table.affiliateHandle, table.clickedAt),
  ],
);
