// Alias sem prefixo "use" — a função da TanStack Start não é um hook React
// (é uma sessão selada server-side), mas o nome confunde a regra
// react-hooks/rules-of-hooks do eslint quando chamada fora de um componente.
import { useSession as getSealedSession } from "@tanstack/react-start/server";

type SessionData = { userId: string };

function getSessionManager() {
  const password = process.env.SESSION_SECRET;
  if (!password) {
    throw new Error("SESSION_SECRET não configurada");
  }
  return getSealedSession<SessionData>({
    password,
    name: "veronica_session",
    cookie: { httpOnly: true, secure: true, sameSite: "lax", path: "/" },
  });
}

export async function getSessionUserId(): Promise<string | null> {
  const session = await getSessionManager();
  return session.data.userId ?? null;
}

export async function setSessionUserId(userId: string): Promise<void> {
  const session = await getSessionManager();
  await session.update({ userId });
}

export async function clearSessionUser(): Promise<void> {
  const session = await getSessionManager();
  await session.clear();
}
