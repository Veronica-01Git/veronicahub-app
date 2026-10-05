import { createServerFn } from "@tanstack/react-start";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { assessmentSchema, buildGuide, workoutSchema } from "./guide";

const professionalSchema = z.enum(["lz-team", "lee-ricardo"]);
// The idempotent, additive migration also allows a safe first request after
// deployment. No existing tables, students or client permissions are changed.
let ready: Promise<unknown> | undefined;
async function database() {
  const { getDb } = await import("@/lib/db");
  const db = getDb();
  ready ??= (async () => {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS "WellnessJourney" (
    "id" text PRIMARY KEY,
    "userId" text NOT NULL REFERENCES "User"("id"),
    "professional" text NOT NULL CHECK ("professional" IN ('lz-team','lee-ricardo')),
    "assessment" jsonb NOT NULL, "guide" jsonb NOT NULL,
    "plan" jsonb, "reviewerId" text REFERENCES "User"("id"),
    "reviewedAt" timestamptz, "createdAt" timestamptz NOT NULL DEFAULT now(),
    "consentVersion" text NOT NULL DEFAULT 'wellness-v1'
  )`);
    await db.execute(
      sql`CREATE INDEX IF NOT EXISTS "WellnessJourney_owner_idx" ON "WellnessJourney" ("userId", "professional", "createdAt")`,
    );
    await db.execute(
      sql`CREATE INDEX IF NOT EXISTS "WellnessJourney_professional_idx" ON "WellnessJourney" ("professional", "createdAt")`,
    );
  })().catch((error) => {
    ready = undefined;
    throw error;
  });
  await ready;
  return db;
}
async function userId() {
  const { getSessionUserId } = await import("@/lib/session");
  const id = await getSessionUserId();
  if (!id) throw new Error("Entre na sua conta para continuar.");
  return id;
}
async function isStaff(id: string, professional: string) {
  const [{ getDb }, { users }, { eq }, { parseAllowedEmails }] = await Promise.all([
    import("@/lib/db"),
    import("@/lib/schema"),
    import("drizzle-orm"),
    import("@/features/private-clients/access-policy"),
  ]);
  const [user] = await getDb()
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  const emails = parseAllowedEmails(
    professional === "lz-team"
      ? process.env.LZ_TEAM_STAFF_EMAILS
      : process.env.LEE_RICARDO_STAFF_EMAILS,
  );
  return !!user && emails.includes(user.email.toLowerCase());
}
export const saveWellnessAssessment = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => assessmentSchema.parse(input))
  .handler(async ({ data }) => {
    const id = await userId();
    const db = await database();
    const guide = buildGuide(data);
    const journeyId = crypto.randomUUID();
    const rows =
      await db.execute(sql`INSERT INTO "WellnessJourney" ("id","userId","professional","assessment","guide")
      SELECT ${journeyId},${id},${data.professional},${JSON.stringify(data)}::jsonb,${JSON.stringify(guide)}::jsonb
      WHERE NOT EXISTS (SELECT 1 FROM "WellnessJourney" WHERE "userId"=${id} AND "createdAt">now()-interval '1 minute')
      RETURNING "id"`);
    if (!rows.rows.length) throw new Error("Aguarde um minuto antes de criar outro guia.");
    return { id: journeyId, guide };
  });
export const getWellnessJourney = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => professionalSchema.parse(input))
  .handler(async ({ data }) => {
    const { getSessionUserId } = await import("@/lib/session");
    const id = await getSessionUserId();
    if (!id) return { signedIn: false, staff: false, journeys: [] };
    const staff = await isStaff(id, data);
    const db = await database();
    const rows = staff
      ? await db.execute(
          sql`SELECT "id","assessment","guide","plan","reviewedAt","createdAt" FROM "WellnessJourney" WHERE "professional"=${data} ORDER BY "createdAt" DESC LIMIT 100`,
        )
      : await db.execute(
          sql`SELECT "id","assessment","guide","plan","reviewedAt","createdAt" FROM "WellnessJourney" WHERE "professional"=${data} AND "userId"=${id} ORDER BY "createdAt" DESC LIMIT 10`,
        );
    return {
      signedIn: true,
      staff,
      journeys: rows.rows.map((r) => ({
        id: String(r.id),
        assessment: assessmentSchema.parse(r.assessment),
        guide: r.guide as ReturnType<typeof buildGuide>,
        plan: r.plan ? workoutSchema.parse(r.plan) : null,
        reviewedAt: r.reviewedAt ? String(r.reviewedAt) : null,
        createdAt: String(r.createdAt),
      })),
    };
  });
export const reviewWellnessJourney = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({ professional: professionalSchema, id: z.string().uuid(), plan: workoutSchema })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const id = await userId();
    if (!(await isStaff(id, data.professional)))
      throw new Error("Acesso reservado ao profissional responsável.");
    const db = await database();
    const result = await db.execute(
      sql`UPDATE "WellnessJourney" SET "plan"=${JSON.stringify(data.plan)}::jsonb,"reviewerId"=${id},"reviewedAt"=now() WHERE "id"=${data.id} AND "professional"=${data.professional} RETURNING "id"`,
    );
    if (!result.rows.length) throw new Error("Avaliação não encontrada neste ambiente.");
    return { ok: true };
  });
export const deleteWellnessJourney = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.string().uuid().parse(input))
  .handler(async ({ data }) => {
    const id = await userId();
    const db = await database();
    await db.execute(sql`DELETE FROM "WellnessJourney" WHERE "id"=${data} AND "userId"=${id}`);
    return { ok: true };
  });
