import { sql } from "drizzle-orm";
import { getDb } from "../lib/db";
import { getRuntimeSecret } from "../lib/runtime-secret.server";
import { authorizeCommercialRequest } from "./http";
import { guardianSnapshot } from "./server";
export async function handleCommercialOperations(request: Request) {
  const action = authorizeCommercialRequest(request, await getRuntimeSecret("CRON_SECRET"));
  if (typeof action === "number") return new Response("Acesso indisponível.", { status: action });
  const db = getDb();
  if (action === "status") {
    const r = await db.execute(sql`SELECT count(*)::int AS total FROM "CommercialBrief"`);
    return Response.json({
      version: "1.0.0",
      name: "Veronica Comercial",
      stage: "internal",
      briefsReceived: Number(r.rows[0]?.total ?? 0),
      requiresProposalApproval: true,
      externalSending: false,
    });
  }
  const hour = new Date().toISOString().slice(0, 13);
  const previous = await db.execute(sql`SELECT result FROM "GuardianSnapshot" WHERE id=${hour}`);
  if (previous.rows.length)
    return Response.json({
      ok: true,
      reused: true,
      ...JSON.parse(String(previous.rows[0].result)),
    });
  const result = await guardianSnapshot();
  await db.execute(
    sql`INSERT INTO "GuardianSnapshot" (id,result) VALUES (${hour},${JSON.stringify(result)}) ON CONFLICT DO NOTHING`,
  );
  return Response.json({ ok: true, ...result });
}
