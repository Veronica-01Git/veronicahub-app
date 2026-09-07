import { createServerFn } from "@tanstack/react-start";

export const getUniverseAdminAccess = createServerFn({ method: "GET" }).handler(async () => {
  const { requireAdmin } = await import("./admin-server");
  const admin = await requireAdmin();

  if (!admin) {
    return { ok: false as const, error: "Acesso restrito." };
  }

  return {
    ok: true as const,
    admin: { email: admin.email },
  };
});
