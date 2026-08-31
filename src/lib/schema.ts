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
// admin gera rascunho com IA em /admin/artigos e revisa antes de publicar
// (autoPublished = false), ou o cron de /api/cron/generate-article publica
// direto, sem revisão humana (autoPublished = true) — usado pra diferenciar
// o selo "revisado pela redação" na página da matéria.
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
