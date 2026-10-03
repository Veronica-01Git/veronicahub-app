import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { requireAdmin } from "../lib/admin-server";
import { getDb } from "../lib/db";
import { memberAgentSettings } from "./schema";
async function admin() {
  if (!(await requireAdmin())) throw new Error("Acesso restrito ao administrador.");
}
export const memberAgentOverview = createServerFn({ method: "GET" }).handler(async () => {
  await admin();
  const { membersAgentOverview } = await import("./agent-runtime.server");
  return membersAgentOverview();
});
export const toggleMemberAgent = createServerFn({ method: "POST" })
  .validator((v: unknown) => z.boolean().parse(v))
  .handler(async ({ data }) => {
    await admin();
    await getDb()
      .update(memberAgentSettings)
      .set({ enabled: data, updatedAt: new Date() })
      .where(eq(memberAgentSettings.id, "members-community"));
    return { ok: true };
  });
export const runMemberAgent = createServerFn({ method: "POST" }).handler(async () => {
  await admin();
  const { runMembersAgent } = await import("./agent-runtime.server");
  return runMembersAgent("manual");
});
