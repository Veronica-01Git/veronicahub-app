import { createServerFn } from "@tanstack/react-start";
import { requireAdmin } from "./admin-server";

export const getInstagramPublisherStatusAdmin = createServerFn({ method: "GET" }).handler(
  async () => {
    const admin = await requireAdmin();
    if (!admin) return { ok: false as const, error: "Acesso restrito." };
    const { getInstagramPublisherStatusCore } = await import("./instagram-publisher.server");
    const status = await getInstagramPublisherStatusCore({ probe: true });
    return { ok: true as const, status };
  },
);

const publishValidator = (input: unknown) => {
  const data = input as { slug?: unknown };
  if (typeof data?.slug !== "string" || !data.slug.trim()) {
    throw new Error("Slug obrigatório.");
  }
  return { slug: data.slug.trim() };
};

export const publishArticleToInstagramAdmin = createServerFn({ method: "POST" })
  .validator(publishValidator)
  .handler(async ({ data }) => {
    const admin = await requireAdmin();
    if (!admin) return { ok: false as const, error: "Acesso restrito." };
    const { publishArticleBySlugToInstagram } = await import("./instagram-publisher.server");
    return publishArticleBySlugToInstagram(data.slug);
  });
