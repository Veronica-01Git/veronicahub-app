import type { WorkspaceAccess } from "./access.functions";

/**
 * A regra de acesso a um workspace, fora de server function.
 *
 * Existe para que outras server functions — as que chamam a agente, que custam
 * cota de modelo — confiram o MESMO portão que a tela confere, em vez de cada
 * uma inventar a sua. Um cliente autenticado só enxerga o próprio workspace.
 */
export async function avaliarAcessoAoWorkspace(slug: string): Promise<WorkspaceAccess> {
  const { getPrivateClientSession } = await import("./session.server");
  const { getPrivateClientBySlug } = await import("./registry");

  const session = await getPrivateClientSession();
  if (!session) return { ok: false, reason: "unauthenticated" };

  const client = getPrivateClientBySlug(slug);
  if (!client || client.id !== session.clientId) return { ok: false, reason: "forbidden" };

  if (client.requiresVerifiedAccount) {
    const { evaluatePrivateClientAccountAccess } = await import("./access-policy");
    const { getSessionUserId } = await import("@/lib/session");
    const userId = await getSessionUserId();

    let email: string | null = null;
    if (userId) {
      const [{ getDb }, { users }, { eq }] = await Promise.all([
        import("@/lib/db"),
        import("@/lib/schema"),
        import("drizzle-orm"),
      ]);
      const [user] = await getDb()
        .select({ email: users.email })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      email = user?.email ?? null;
    }

    const accountAccess = evaluatePrivateClientAccountAccess({
      clientId: client.id,
      email,
      environment: process.env,
    });
    if (accountAccess !== "allowed") return { ok: false, reason: accountAccess };
  }

  return { ok: true, slug: client.slug };
}
