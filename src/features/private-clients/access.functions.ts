import { createServerFn } from "@tanstack/react-start";

export type ValidateSealResult =
  | { status: "granted"; slug: string; displayName: string }
  | { status: "awaiting-seal"; displayName: string }
  | { status: "invalid" };

/**
 * Valida o serial no servidor. O navegador nunca recebe a lista de seriais
 * válidos, e o serial nunca trafega por query string (método POST).
 */
export const validateSeal = createServerFn({ method: "POST" })
  .inputValidator((input: { serial: string }) => {
    const serial = String(input?.serial ?? "").trim();
    if (!serial || serial.length > 64) throw new Error("Serial inválido.");
    return { serial };
  })
  .handler(async ({ data }): Promise<ValidateSealResult> => {
    const { getPrivateClientBySerial, normalizeSerial } = await import("./registry");
    const { findSeal } = await import("@/lib/seals");
    const { grantPrivateClientSession } = await import("./session.server");

    const client = getPrivateClientBySerial(data.serial);
    if (client && client.accessState === "active") {
      // Confirma na fonte canônica de selos antes de liberar.
      const seal = client.sealSerial ? findSeal(client.sealSerial) : undefined;
      if (seal && !seal.isDemonstration) {
        await grantPrivateClientSession(client.id);
        return { status: "granted", slug: client.slug, displayName: client.displayName };
      }
    }

    // Serial existe no registro de selos, mas ainda não corresponde a um
    // ambiente privado liberado (ex.: registro demonstrativo).
    const seal = findSeal(normalizeSerial(data.serial));
    if (seal) return { status: "awaiting-seal", displayName: seal.client };

    return { status: "invalid" };

  });

export type WorkspaceAccess =
  | { ok: true; slug: string }
  | { ok: false; reason: "unauthenticated" | "forbidden" };

/** Um cliente autenticado só enxerga o próprio workspace. */
export const getWorkspaceAccess = createServerFn({ method: "POST" })
  .inputValidator((input: { slug: string }) => ({ slug: String(input?.slug ?? "") }))
  .handler(async ({ data }): Promise<WorkspaceAccess> => {
    const { getPrivateClientSession } = await import("./session.server");
    const { getPrivateClientBySlug } = await import("./registry");

    const session = await getPrivateClientSession();
    if (!session) return { ok: false, reason: "unauthenticated" };

    const client = getPrivateClientBySlug(data.slug);
    if (!client || client.id !== session.clientId) return { ok: false, reason: "forbidden" };

    return { ok: true, slug: client.slug };
  });

export const endPrivateClientSession = createServerFn({ method: "POST" }).handler(async () => {
  const { clearPrivateClientSession } = await import("./session.server");
  await clearPrivateClientSession();
  return { ok: true as const };
});
