import { sql } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { BEAT_VALUES, CYCLE_HOURS, type Beat } from "./beats";
import { getDb } from "./db";

// Um ciclo completo visita as cinco editorias uma vez. A reserva é uma única
// instrução SQL: duas requisições (inclusive retries do Actions) não passam
// juntas. O bootstrap segue o padrão idempotente das outras tabelas do Hub.
export const INSTAGRAM_BEAT_COOLDOWN_HOURS = CYCLE_HOURS * BEAT_VALUES.length;
let storageReady = false;

async function ensureStorage(): Promise<void> {
  if (storageReady) return;
  await getDb().execute(sql`
    CREATE TABLE IF NOT EXISTS "InstagramBeatGate" (
      "beat" text PRIMARY KEY NOT NULL,
      "lastPublishedAt" timestamp,
      "lastSlug" text,
      "claimId" text,
      "claimSlug" text,
      "claimUntil" timestamp,
      "needsReview" boolean DEFAULT false NOT NULL
    )
  `);
  storageReady = true;
}

export async function claimInstagramBeat(beat: Beat, slug: string): Promise<string | null> {
  await ensureStorage();
  const claimId = createId();
  const rows = await getDb().execute(sql`
    INSERT INTO "InstagramBeatGate" ("beat", "claimId", "claimSlug", "claimUntil")
    VALUES (${beat}, ${claimId}, ${slug}, now() + interval '10 minutes')
    ON CONFLICT ("beat") DO UPDATE SET
      "claimId" = EXCLUDED."claimId",
      "claimSlug" = EXCLUDED."claimSlug",
      "claimUntil" = EXCLUDED."claimUntil"
    WHERE "InstagramBeatGate"."needsReview" = false
      AND ("InstagramBeatGate"."claimUntil" IS NULL
        OR "InstagramBeatGate"."claimUntil" < now())
      AND ("InstagramBeatGate"."lastPublishedAt" IS NULL
        OR "InstagramBeatGate"."lastPublishedAt" <= now() - ${INSTAGRAM_BEAT_COOLDOWN_HOURS} * interval '1 hour')
    RETURNING "claimId"
  `);
  return rows.rows.length ? claimId : null;
}

export async function markInstagramPublishAttempt(beat: Beat, claimId: string): Promise<void> {
  // A partir deste ponto uma falha de rede pode esconder um post já publicado.
  // Bloqueia a editoria até o sucesso ser confirmado ou revisado manualmente.
  const rows = await getDb().execute(sql`
    UPDATE "InstagramBeatGate" SET "needsReview" = true
    WHERE "beat" = ${beat} AND "claimId" = ${claimId}
    RETURNING "beat"
  `);
  if (!rows.rows.length) throw new Error("A reserva editorial expirou antes da publicação.");
}

export async function completeInstagramBeat(
  beat: Beat,
  slug: string,
  claimId: string,
): Promise<void> {
  const rows = await getDb().execute(sql`
    UPDATE "InstagramBeatGate" SET
      "lastPublishedAt" = now(), "lastSlug" = ${slug},
      "claimId" = NULL, "claimSlug" = NULL, "claimUntil" = NULL,
      "needsReview" = false
    WHERE "beat" = ${beat} AND "claimId" = ${claimId}
    RETURNING "beat"
  `);
  if (!rows.rows.length)
    throw new Error("Publicação confirmada, mas a reserva editorial não foi encontrada.");
}

export async function releaseInstagramBeat(beat: Beat, claimId: string): Promise<void> {
  await getDb().execute(sql`
    UPDATE "InstagramBeatGate" SET
      "claimId" = NULL, "claimSlug" = NULL, "claimUntil" = NULL
    WHERE "beat" = ${beat} AND "claimId" = ${claimId} AND "needsReview" = false
  `);
}

export async function reconcileExistingInstagramPost(
  beat: Beat,
  slug: string,
  timestamp?: string,
): Promise<void> {
  await ensureStorage();
  // Só libera uma reserva incerta se a própria matéria apareceu no Instagram.
  const publishedAt =
    timestamp && !Number.isNaN(Date.parse(timestamp)) ? new Date(timestamp) : new Date();
  await getDb().execute(sql`
    UPDATE "InstagramBeatGate" SET
      "lastPublishedAt" = ${publishedAt}, "lastSlug" = ${slug},
      "claimId" = NULL, "claimSlug" = NULL, "claimUntil" = NULL,
      "needsReview" = false
    WHERE "beat" = ${beat} AND "claimSlug" = ${slug}
  `);
}

export async function rememberInstagramBeatPost(
  beat: Beat,
  slug: string,
  timestamp: string,
): Promise<void> {
  await ensureStorage();
  const publishedAt = new Date(timestamp);
  if (Number.isNaN(publishedAt.getTime())) return;
  await getDb().execute(sql`
    INSERT INTO "InstagramBeatGate" ("beat", "lastPublishedAt", "lastSlug")
    VALUES (${beat}, ${publishedAt}, ${slug})
    ON CONFLICT ("beat") DO UPDATE SET
      "lastPublishedAt" = EXCLUDED."lastPublishedAt",
      "lastSlug" = EXCLUDED."lastSlug"
    WHERE "InstagramBeatGate"."needsReview" = false
      AND "InstagramBeatGate"."claimId" IS NULL
      AND ("InstagramBeatGate"."lastPublishedAt" IS NULL
        OR "InstagramBeatGate"."lastPublishedAt" < EXCLUDED."lastPublishedAt")
  `);
}
