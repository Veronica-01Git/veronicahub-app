import { createServerFn } from "@tanstack/react-start";
import { desc, eq } from "drizzle-orm";
import { getDb } from "./db";
import { generations } from "./schema";
import { getSessionUserId } from "./session";

// Leitura só — "Minhas gerações". Não toca em carteira/débito (isso
// continua em wallet-server.ts); só lista o que já foi registrado na
// tabela Generation depois de cada geração real.
export const getMyGenerations = createServerFn({ method: "GET" }).handler(async () => {
  const userId = await getSessionUserId();
  if (!userId) return [];

  const db = getDb();
  const rows = await db
    .select()
    .from(generations)
    .where(eq(generations.userId, userId))
    .orderBy(desc(generations.createdAt))
    .limit(60);

  return rows.map((g) => ({
    id: g.id,
    prompt: g.prompt,
    status: g.status,
    previewUrl: g.publicUrl,
    createdAt: g.createdAt.toISOString(),
  }));
});
