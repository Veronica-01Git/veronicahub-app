import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";

export const requireAdmin = createServerOnlyFn(async () => {
  const { requireAdminCore } = await import("./admin-core.server");
  return requireAdminCore();
});

export const getAdminOverview = createServerFn({ method: "GET" }).handler(async () => {
  const { getAdminOverviewCore } = await import("./admin-core.server");
  return getAdminOverviewCore();
});
