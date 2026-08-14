import { and, eq, gte, sql } from "drizzle-orm";
import { getDb } from "./db";
import { ledgerEntries } from "./schema";

// Sem infra de Redis neste projeto (diferente do negocio-da-china-app) —
// aproveita o LedgerEntry que toda geração/débito já grava (grátis, paga ou
// estornada). Contar linhas recentes do usuário já mede volume de
// tentativas sem precisar de tabela ou serviço novo. Usa o índice
// LedgerEntry_userId_createdAt_idx que já existe.
const BURST_WINDOW_MS = 60_000;
const BURST_MAX = 5;
const DAILY_WINDOW_MS = 24 * 60 * 60 * 1000;
const DAILY_MAX = 60;

async function countRecentEntries(userId: string, sinceMs: number): Promise<number> {
  const db = getDb();
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(ledgerEntries)
    .where(and(eq(ledgerEntries.userId, userId), gte(ledgerEntries.createdAt, new Date(sinceMs))));
  return Number(row?.count ?? 0);
}

// Chamado antes de qualquer débito nas rotas de geração (generateNanoBanana,
// debitCurriculoGeneration, debitCurriculoRhScreening) — protege contra
// abuso/custo, não contra duplo-gasto (isso já é o UPDATE condicional).
export async function checkGenerationRateLimit(
  userId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const now = Date.now();

  const burstCount = await countRecentEntries(userId, now - BURST_WINDOW_MS);
  if (burstCount >= BURST_MAX) {
    return { ok: false, error: "Muitas tentativas seguidas. Aguarde um minuto e tente de novo." };
  }

  const dailyCount = await countRecentEntries(userId, now - DAILY_WINDOW_MS);
  if (dailyCount >= DAILY_MAX) {
    return { ok: false, error: "Limite diário de gerações atingido. Tente novamente amanhã." };
  }

  return { ok: true };
}
