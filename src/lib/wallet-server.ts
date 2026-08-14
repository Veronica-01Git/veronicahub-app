import { createServerFn } from "@tanstack/react-start";
import { eq, sql, and, gt, gte } from "drizzle-orm";
import { getDb } from "./db";
import { users, walletTopUps, ledgerEntries } from "./schema";
import { getSessionUserId } from "./session";
import { createTopUpPreference } from "./mercadopago";
import { generateNanoBananaImage } from "./higgsfield";
import { checkGenerationRateLimit } from "./rate-limit";
import { storeGeneratedImage } from "./generations-storage";

const MAX_DEPOSIT_CENTS = 200_000; // R$2.000 — anti-abuso simples pra v1

// Único formato/motor com integração real hoje (ver src/lib/higgsfield.ts).
// Preço vive só aqui — o servidor nunca confia num preço vindo do cliente.
const NANO_BANANA_PRICE_CENTS = 490;

// Preços do Currículo-Certo — mesma regra: fixos no servidor, nunca vêm do
// cliente. A geração em si (generateAtsResume) é local/determinística, sem
// chamada externa — só o débito precisa ser real e autoritativo.
const CURRICULO_GENERATION_PRICE_CENTS = 990;
const CURRICULO_RH_SCREEN_PRICE_CENTS = 190;
const MAX_RH_SCREEN_QTY = 50;

export const getWallet = createServerFn({ method: "GET" }).handler(async () => {
  const userId = await getSessionUserId();
  if (!userId) return null;

  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return null;

  return {
    balanceCents: user.balanceCents,
    freeVideoCredits: user.freeVideoCredits,
    freeImageCredits: user.freeImageCredits,
  };
});

const createDepositValidator = (input: unknown) => {
  const amountCents = (input as { amountCents?: unknown })?.amountCents;
  if (typeof amountCents !== "number" || !Number.isInteger(amountCents) || amountCents <= 0) {
    throw new Error("Valor inválido");
  }
  if (amountCents > MAX_DEPOSIT_CENTS) {
    throw new Error(`Valor máximo por depósito: R$${(MAX_DEPOSIT_CENTS / 100).toFixed(2)}`);
  }
  return { amountCents };
};

export const createDeposit = createServerFn({ method: "POST" })
  .validator(createDepositValidator)
  .handler(async ({ data }) => {
    const userId = await getSessionUserId();
    if (!userId) {
      return { ok: false as const, error: "Faça login para depositar." };
    }

    const webhookBaseUrl = process.env.WEBHOOK_BASE_URL;
    if (!webhookBaseUrl) {
      return { ok: false as const, error: "WEBHOOK_BASE_URL não configurada." };
    }

    const db = getDb();
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) {
      return { ok: false as const, error: "Usuário não encontrado." };
    }

    const [topUp] = await db
      .insert(walletTopUps)
      .values({ userId, amountCents: data.amountCents, status: "PENDENTE" })
      .returning();

    try {
      const { checkoutUrl } = await createTopUpPreference({
        topUpId: topUp.id,
        amountCents: data.amountCents,
        payerEmail: user.email,
        webhookBaseUrl,
      });
      return { ok: true as const, checkoutUrl, topUpId: topUp.id };
    } catch (error) {
      await db.delete(walletTopUps).where(eq(walletTopUps.id, topUp.id));
      return {
        ok: false as const,
        error: error instanceof Error ? error.message : "Falha ao iniciar pagamento.",
      };
    }
  });

const generateNanoBananaValidator = (input: unknown) => {
  const prompt = (input as { prompt?: unknown })?.prompt;
  if (typeof prompt !== "string" || !prompt.trim()) {
    throw new Error("Prompt inválido");
  }
  return { prompt: prompt.trim() };
};

// Única geração real hoje (Nano Banana Pro via Higgsfield). Débito
// acontece ANTES da chamada à API — se a geração falhar depois, o catch
// estorna. Isso evita cobrar por uma geração que não aconteceu, e evita um
// usuário gerar de graça se a chamada à Higgsfield falhar no meio.
export const generateNanoBanana = createServerFn({ method: "POST" })
  .validator(generateNanoBananaValidator)
  .handler(async ({ data }) => {
    const userId = await getSessionUserId();
    if (!userId) {
      return { ok: false as const, error: "Faça login para gerar." };
    }

    const rateLimit = await checkGenerationRateLimit(userId);
    if (!rateLimit.ok) {
      return { ok: false as const, error: rateLimit.error };
    }

    const db = getDb();

    // Crédito grátis primeiro — update condicional de uma instrução só,
    // só "ganha" se afetar exatamente 1 linha (protege contra duplo-clique).
    const [freeDebit] = await db
      .update(users)
      .set({ freeImageCredits: sql`${users.freeImageCredits} - 1` })
      .where(and(eq(users.id, userId), gt(users.freeImageCredits, 0)))
      .returning();

    const usedFree = Boolean(freeDebit);
    let paidDebit: typeof freeDebit | undefined;

    if (!usedFree) {
      [paidDebit] = await db
        .update(users)
        .set({ balanceCents: sql`${users.balanceCents} - ${NANO_BANANA_PRICE_CENTS}` })
        .where(and(eq(users.id, userId), gte(users.balanceCents, NANO_BANANA_PRICE_CENTS)))
        .returning();

      if (!paidDebit) {
        return { ok: false as const, error: "insufficient_funds" as const };
      }
    }

    await db.insert(ledgerEntries).values({
      userId,
      deltaCents: usedFree ? 0 : -NANO_BANANA_PRICE_CENTS,
      reason: usedFree ? "free_credit:image" : "generation:image:nanobanana",
    });

    const result = await generateNanoBananaImage({ prompt: data.prompt });

    if (!result.ok) {
      // Estorna exatamente o que foi debitado.
      if (usedFree) {
        await db
          .update(users)
          .set({ freeImageCredits: sql`${users.freeImageCredits} + 1` })
          .where(eq(users.id, userId));
      } else {
        await db
          .update(users)
          .set({ balanceCents: sql`${users.balanceCents} + ${NANO_BANANA_PRICE_CENTS}` })
          .where(eq(users.id, userId));
      }
      await db.insert(ledgerEntries).values({
        userId,
        deltaCents: usedFree ? 0 : NANO_BANANA_PRICE_CENTS,
        reason: result.reason === "nsfw" ? "refund:moderation_nsfw" : "refund:generation_failed",
      });
      return { ok: false as const, error: result.error };
    }

    // A geração já foi cobrada e funcionou — um problema no download ou no
    // R2 nunca deve estornar nem quebrar a resposta; na pior das hipóteses
    // cai pra URL crua da Higgsfield.
    const stored = await storeGeneratedImage({ userId, sourceUrl: result.imageUrl });

    return {
      ok: true as const,
      imageUrl: stored.ok ? stored.dataUrl : result.imageUrl,
      free: usedFree,
    };
  });

// Débito atômico condicional — só "ganha" se afetar exatamente 1 linha
// (protege contra duplo-clique/duas-abas). Sem crédito grátis: gerar
// currículo sempre foi pago, mesmo na versão simulada.
export const debitCurriculoGeneration = createServerFn({ method: "POST" }).handler(async () => {
  const userId = await getSessionUserId();
  if (!userId) {
    return { ok: false as const, error: "Faça login para gerar." };
  }

  const rateLimit = await checkGenerationRateLimit(userId);
  if (!rateLimit.ok) {
    return { ok: false as const, error: rateLimit.error };
  }

  const db = getDb();
  const [debit] = await db
    .update(users)
    .set({ balanceCents: sql`${users.balanceCents} - ${CURRICULO_GENERATION_PRICE_CENTS}` })
    .where(and(eq(users.id, userId), gte(users.balanceCents, CURRICULO_GENERATION_PRICE_CENTS)))
    .returning();

  if (!debit) {
    return { ok: false as const, error: "insufficient_funds" as const };
  }

  await db.insert(ledgerEntries).values({
    userId,
    deltaCents: -CURRICULO_GENERATION_PRICE_CENTS,
    reason: "generation:curriculo",
  });

  return { ok: true as const, balanceCents: debit.balanceCents };
});

const debitRhScreeningValidator = (input: unknown) => {
  const qty = (input as { qty?: unknown })?.qty;
  if (typeof qty !== "number" || !Number.isInteger(qty) || qty < 1 || qty > MAX_RH_SCREEN_QTY) {
    throw new Error("Quantidade inválida");
  }
  return { qty };
};

export const debitCurriculoRhScreening = createServerFn({ method: "POST" })
  .validator(debitRhScreeningValidator)
  .handler(async ({ data }) => {
    const userId = await getSessionUserId();
    if (!userId) {
      return { ok: false as const, error: "Faça login para triar." };
    }

    const rateLimit = await checkGenerationRateLimit(userId);
    if (!rateLimit.ok) {
      return { ok: false as const, error: rateLimit.error };
    }

    const amountCents = data.qty * CURRICULO_RH_SCREEN_PRICE_CENTS;
    const db = getDb();
    const [debit] = await db
      .update(users)
      .set({ balanceCents: sql`${users.balanceCents} - ${amountCents}` })
      .where(and(eq(users.id, userId), gte(users.balanceCents, amountCents)))
      .returning();

    if (!debit) {
      return { ok: false as const, error: "insufficient_funds" as const };
    }

    await db.insert(ledgerEntries).values({
      userId,
      deltaCents: -amountCents,
      reason: `curriculo_rh_screen:qty=${data.qty}`,
    });

    return { ok: true as const, balanceCents: debit.balanceCents };
  });
