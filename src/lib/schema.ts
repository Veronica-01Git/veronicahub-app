import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  pgEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
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

// Catálogo comercial da Veronica Analytics. Esta tabela permite publicar e
// arquivar produtos Shopee sem novo deploy.
export const affiliateCatalogProducts = pgTable(
  "AffiliateProduct",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    category: text("category").notNull(),
    affiliateUrl: text("affiliateUrl").notNull(),
    priceLabel: text("priceLabel").notNull(),
    commissionLabel: text("commissionLabel"),
    angle: text("angle").notNull(),
    active: boolean("active").notNull().default(true),
    priority: integer("priority").notNull().default(0),
    createdBy: text("createdBy").references(() => users.id),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("AffiliateProduct_affiliateUrl_key").on(table.affiliateUrl),
    index("AffiliateProduct_active_priority_idx").on(table.active, table.priority),
    index("AffiliateProduct_category_active_idx").on(table.category, table.active),
  ],
);

// Venda/comissão importada do relatório oficial da Shopee. Um pedido só
// aparece como saldo confirmado depois que o próprio relatório o marca assim;
// clique nunca cria comissão. O pagamento é uma baixa administrativa
// auditável, sem movimentação bancária automática.
export const affiliateSales = pgTable(
  "AffiliateSale",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    externalOrderId: text("externalOrderId").notNull().unique(),
    affiliateCode: text("affiliateCode").notNull(),
    productId: text("productId"),
    commissionCents: integer("commissionCents").notNull(),
    affiliateCents: integer("affiliateCents").notNull(),
    houseCents: integer("houseCents").notNull(),
    status: text("status").notNull().default("pending"),
    orderAt: timestamp("orderAt"),
    importedAt: timestamp("importedAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
    paidAt: timestamp("paidAt"),
    paymentReference: text("paymentReference"),
  },
  (table) => [
    index("AffiliateSale_code_status_idx").on(table.affiliateCode, table.status),
    index("AffiliateSale_status_paidAt_idx").on(table.status, table.paidAt),
  ],
);

/* ------------------------------------------------------------------ *
 * Agente de WhatsApp — Express Entulho (VH-AUT-WA-2026-000001)
 *
 * IMPORTANTE: o agente opera em número DEDICADO. O número atual da
 * empresa não é migrado nem tocado — ver AGENTS.md.
 * ------------------------------------------------------------------ */

export const waConversationStatus = pgEnum("WaConversationStatus", [
  "ia",
  "aguardando_humano",
  "resolvida",
]);

export const waDirection = pgEnum("WaDirection", ["entrada", "saida"]);

export const waAuthor = pgEnum("WaAuthor", ["cliente", "ia", "humano", "sistema"]);

/**
 * Uma conversa por (tenant, número do cliente).
 *
 * `tenant` já existe aqui porque o Veronica Operations é multiempresa por
 * projeto: adicionar a segunda empresa não deve exigir migração de tabela.
 */
export const waConversations = pgTable(
  "WaConversation",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    tenant: text("tenant").notNull().default("express-entulho"),
    /** Número do cliente no formato que a Meta devolve (E.164 sem "+"). */
    waId: text("waId").notNull(),
    profileName: text("profileName"),
    status: waConversationStatus("status").notNull().default("ia"),
    /**
     * Última mensagem RECEBIDA. É o que abre a janela de 24 h da Meta —
     * fora dela só se escreve por modelo aprovado. Não confundir com
     * lastMessageAt, que também anda quando nós respondemos.
     */
    lastInboundAt: timestamp("lastInboundAt"),
    lastMessageAt: timestamp("lastMessageAt"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("WaConversation_tenant_waId_key").on(table.tenant, table.waId),
    index("WaConversation_status_idx").on(table.status, table.lastInboundAt),
  ],
);

/**
 * Toda mensagem, de entrada e de saída.
 *
 * `providerId` é o wamid da Meta e é ÚNICO: a Meta reentrega webhook quando
 * não recebe 200 a tempo, e essa restrição é o que torna o reenvio inofensivo.
 */
export const waMessages = pgTable(
  "WaMessage",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    conversationId: text("conversationId")
      .notNull()
      .references(() => waConversations.id, { onDelete: "cascade" }),
    providerId: text("providerId").notNull(),
    direction: waDirection("direction").notNull(),
    author: waAuthor("author").notNull(),
    /** text, image, audio, location… conforme a Meta classifica. */
    kind: text("kind").notNull().default("text"),
    body: text("body"),
    /** Payload cru do webhook, para depurar sem depender de log volátil. */
    raw: text("raw"),
    occurredAt: timestamp("occurredAt").notNull(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("WaMessage_providerId_key").on(table.providerId),
    index("WaMessage_conversation_idx").on(table.conversationId, table.occurredAt),
  ],
);

/* ------------------------------------------------------------------ *
 * Agentes de IA (/agentes) — guiados pela Veronica, desenvolvidos pela
 * Yo Lab & co.
 *
 * Preço e catálogo NÃO moram aqui: moram em src/lib/agentes.ts, com
 * procedência por valor. Estas tabelas guardam só o que é do usuário —
 * o que ele contratou e o que ele ensinou para a própria agente.
 * ------------------------------------------------------------------ */

export const agenteAssinaturaStatus = pgEnum("AgenteAssinaturaStatus", [
  "teste",
  "ativa",
  "expirada",
  "cancelada",
]);

export const agentePlano = pgEnum("AgentePlano", ["teste", "avulso", "mensal", "anual"]);

/**
 * O que cada usuário tem em cada agente. Uma linha por (usuário, agente) —
 * o índice único é o que impede alguém de ganhar um segundo teste grátis
 * abrindo a página de novo, e é ele que torna `iniciarTeste` idempotente.
 *
 * `expiraEm` serve aos dois casos: fim das 6 horas de teste e fim do período
 * pago. Quem decide se ainda vale é sempre o servidor comparando com now() —
 * o relógio do navegador só desenha o que sobrou.
 */
export const agenteAssinaturas = pgTable(
  "AgenteAssinatura",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text("userId")
      .notNull()
      .references(() => users.id),
    /** AgenteId de src/lib/agentes.ts. Texto porque o catálogo é dado, não enum. */
    agenteId: text("agenteId").notNull(),
    status: agenteAssinaturaStatus("status").notNull().default("teste"),
    plano: agentePlano("plano").notNull().default("teste"),
    expiraEm: timestamp("expiraEm"),
    /** WalletTopUp que pagou o período vigente, quando houve pagamento. */
    topUpId: text("topUpId").references(() => walletTopUps.id),
    criadoEm: timestamp("criadoEm").notNull().defaultNow(),
    atualizadoEm: timestamp("atualizadoEm").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("AgenteAssinatura_userId_agenteId_key").on(table.userId, table.agenteId),
    index("AgenteAssinatura_status_expiraEm_idx").on(table.status, table.expiraEm),
  ],
);

export const agenteBriefingFonte = pgEnum("AgenteBriefingFonte", [
  "audio",
  "conversa",
  "texto",
  "simulacao",
]);

/**
 * O que o dono ensinou para a própria agente, cru e extraído.
 *
 * `conteudo` é o material original (transcrição do áudio, trecho de conversa
 * colado, texto digitado). `extraido` é o que o modelo entendeu dali, em
 * JSON — preços, cidades, jeito de responder.
 *
 * OS DOIS FICAM, e essa é a regra que importa: o extraído é palpite de
 * modelo e vai ser conferido por gente antes de virar resposta a cliente
 * real. Guardar só o extraído seria perder a fonte — o mesmo erro que
 * whatsapp-rules.ts documenta ter cometido com dezesseis preços.
 */
export const agenteBriefings = pgTable(
  "AgenteBriefing",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text("userId")
      .notNull()
      .references(() => users.id),
    agenteId: text("agenteId").notNull(),
    fonte: agenteBriefingFonte("fonte").notNull(),
    conteudo: text("conteudo").notNull(),
    /** JSON do que o modelo extraiu. Null enquanto a extração não rodou. */
    extraido: text("extraido"),
    /** true quando uma pessoa conferiu o extraído. Só aí vale para cliente real. */
    conferido: boolean("conferido").notNull().default(false),
    criadoEm: timestamp("criadoEm").notNull().defaultNow(),
  },
  (table) => [index("AgenteBriefing_userId_agenteId_idx").on(table.userId, table.agenteId)],
);

// Additive community tables share the existing migration schema.
export { memberPosts, memberComments, memberCommentCooldown } from "../members/schema";
