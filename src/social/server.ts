import { createServerFn } from "@tanstack/react-start";
import { requireAdmin } from "../lib/admin-server";
export const getSocialQueue = createServerFn({ method: "GET" }).handler(async () => {
  if (!(await requireAdmin()))
    return { ok: false as const, error: "Acesso restrito. Entre com sua conta de administrador." };
  const { queueSnapshot } = await import("./runtime.server");
  return { ok: true as const, ...(await queueSnapshot()) };
});
export type Command = {
  action: "add" | "revise" | "archive" | "restore" | "prepare" | "attach";
  id?: string;
  value?: unknown;
  mediaUrl?: string;
  desiredAt?: string | null;
};
export const socialCommand = createServerFn({ method: "POST" })
  .validator((v: unknown): Command => {
    const c = v as Command;
    if (!c || !["add", "revise", "archive", "restore", "prepare", "attach"].includes(c.action))
      throw new Error("Ação inválida.");
    if (
      !["add", "prepare"].includes(c.action) &&
      (typeof c.id !== "string" || !/^[\w-]{36}$/.test(c.id))
    )
      throw new Error("Item inválido.");
    if (
      c.action === "attach" &&
      (typeof c.mediaUrl !== "string" ||
        c.mediaUrl.length > 1000 ||
        (c.desiredAt !== null && typeof c.desiredAt !== "string"))
    )
      throw new Error("Mídia inválida.");
    return c;
  })
  .handler(async ({ data }) => {
    if (!(await requireAdmin())) return { ok: false as const, error: "Acesso restrito." };
    const r = await import("./runtime.server");
    if (data.action === "add") return r.saveSource(data.value);
    if (data.action === "revise") return r.reviseSource(data.id!, data.value);
    if (data.action === "archive") return r.archiveSource(data.id!);
    if (data.action === "restore") return r.restoreSource(data.id!);
    if (data.action === "attach")
      return r.attachEditedVideo(data.id!, data.mediaUrl!, data.desiredAt ?? null);
    return r.runSocialPreparation();
  });
