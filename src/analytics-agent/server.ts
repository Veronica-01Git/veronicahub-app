import { createServerFn } from "@tanstack/react-start";
import { requireAdmin } from "../lib/admin-server";
export const runAnalyticsAgentAdmin = createServerFn({ method: "POST" }).handler(async () => {
  if (!(await requireAdmin())) return { ok: false, error: "Acesso restrito." };
  const { runAnalyticsAgent } = await import("./runtime.server");
  return runAnalyticsAgent("manual");
});
export const pauseAnalyticsAgentAdmin = createServerFn({ method: "POST" })
  .validator((v: unknown) => {
    if (typeof v !== "boolean") throw new Error("Estado inválido.");
    return v;
  })
  .handler(async ({ data }) => {
    if (!(await requireAdmin())) return { ok: false, error: "Acesso restrito." };
    const { setAnalyticsAgentEnabled } = await import("./runtime.server");
    return setAnalyticsAgentEnabled(data);
  });
