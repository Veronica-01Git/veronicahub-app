// Sessão dedicada da área privada de clientes. Isolada da sessão de conta
// do Hub (cookie e tipo próprios) — nada aqui interfere no login existente.
import { useSession as getSealedSession } from "@tanstack/react-start/server";

type PrivateClientSession = { clientId: string; grantedAt: number };

const MAX_AGE_SECONDS = 60 * 60 * 8; // 8 horas

function getPassword(): string {
  const fromEnv = process.env.SESSION_SECRET;
  if (!fromEnv || fromEnv.length < 32) {
    throw new Error("SESSION_SECRET não configurada corretamente.");
  }
  return fromEnv;
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
  // Sem segredo válido: trata como "sem sessão" em vez de derrubar a página.
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) return null;
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
