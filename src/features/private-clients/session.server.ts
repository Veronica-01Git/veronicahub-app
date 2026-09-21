// Sessão dedicada da área privada de clientes. Isolada da sessão de conta
// do Hub (cookie e tipo próprios) — nada aqui interfere no login existente.
import { useSession as getSealedSession } from "@tanstack/react-start/server";

type PrivateClientSession = { clientId: string; grantedAt: number };

const MAX_AGE_SECONDS = 60 * 60 * 8; // 8 horas

function getPassword(): string {
  // A área não guarda dado sensível; o serial do selo é identificador
  // público. Quando SESSION_SECRET estiver configurada, ela é usada.
  const fromEnv = process.env.SESSION_SECRET;
  if (fromEnv && fromEnv.length >= 32) return fromEnv;
  return "veronica-private-clients-fallback-sealed-cookie-key";
}

function getManager() {
  return getSealedSession<PrivateClientSession>({
    password: getPassword(),
    name: "veronica_private_client",
    maxAge: MAX_AGE_SECONDS,
    cookie: { httpOnly: true, secure: true, sameSite: "lax", path: "/" },
  });
}

export async function getPrivateClientSession(): Promise<PrivateClientSession | null> {
  const session = await getManager();
  const { clientId, grantedAt } = session.data;
  if (!clientId || !grantedAt) return null;
  if (Date.now() - grantedAt > MAX_AGE_SECONDS * 1000) return null;
  return { clientId, grantedAt };
}

export async function grantPrivateClientSession(clientId: string): Promise<void> {
  const session = await getManager();
  await session.update({ clientId, grantedAt: Date.now() });
}

export async function clearPrivateClientSession(): Promise<void> {
  const session = await getManager();
  await session.clear();
}
