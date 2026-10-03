import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq, gt, isNull } from "drizzle-orm";
import { getDb } from "./db";
import { emailOtps, users } from "./schema";
import { getSessionUserId, setSessionUserId, clearSessionUser } from "./session";

const CODE_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

function generateCode(): string {
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  return String(100000 + (bytes[0] % 900000));
}

async function hashCode(code: string): Promise<string> {
  const data = new TextEncoder().encode(code);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sendCodeEmail(email: string, code: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    throw new Error("RESEND_API_KEY/EMAIL_FROM não configurados");
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: email,
      subject: `${code} é seu código de acesso — Veronica Hub`,
      text: `Seu código de acesso é ${code}. Ele expira em 10 minutos. Se você não pediu esse código, ignore este e-mail.`,
    }),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Falha ao enviar e-mail (${res.status}): ${detail}`);
  }
}

const requestEmailCodeValidator = (input: unknown) => {
  const email = (input as { email?: unknown })?.email;
  if (typeof email !== "string" || !email.includes("@")) {
    throw new Error("E-mail inválido");
  }
  return { email: email.trim().toLowerCase() };
};

// Núcleo do envio de código: o login do site e a tela de autorização do
// conector MCP usam o MESMO fluxo (cooldown, hash, validade), cada um com a sua
// camada de entrada.
export async function issueEmailCodeCore(
  email: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const db = getDb();

  const recent = await db
    .select()
    .from(emailOtps)
    .where(and(eq(emailOtps.email, email), isNull(emailOtps.consumedAt)))
    .orderBy(desc(emailOtps.createdAt))
    .limit(1);

  const last = recent[0];
  if (last && Date.now() - last.createdAt.getTime() < RESEND_COOLDOWN_MS) {
    const waitSec = Math.ceil(
      (RESEND_COOLDOWN_MS - (Date.now() - last.createdAt.getTime())) / 1000,
    );
    return { ok: false as const, error: `Aguarde ${waitSec}s antes de pedir um novo código.` };
  }

  const code = generateCode();
  const codeHash = await hashCode(code);

  try {
    await sendCodeEmail(email, code);
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Falha ao enviar e-mail.",
    };
  }

  await db.insert(emailOtps).values({
    email,
    codeHash,
    expiresAt: new Date(Date.now() + CODE_TTL_MS),
  });

  return { ok: true as const };
}

export const requestEmailCode = createServerFn({ method: "POST" })
  .validator(requestEmailCodeValidator)
  .handler(async ({ data }) => issueEmailCodeCore(data.email));

const verifyEmailCodeValidator = (input: unknown) => {
  const body = input as { email?: unknown; code?: unknown };
  if (typeof body?.email !== "string" || typeof body?.code !== "string") {
    throw new Error("Dados inválidos");
  }
  return { email: body.email.trim().toLowerCase(), code: body.code.trim() };
};

// Confere e consome o código. Não cria usuário nem sessão: quem chama decide o
// que o código dá direito (cookie de sessão no site; token OAuth no conector).
export async function consumeEmailCodeCore(
  email: string,
  code: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const db = getDb();

  const rows = await db
    .select()
    .from(emailOtps)
    .where(
      and(
        eq(emailOtps.email, email),
        isNull(emailOtps.consumedAt),
        gt(emailOtps.expiresAt, new Date()),
      ),
    )
    .orderBy(desc(emailOtps.createdAt))
    .limit(1);

  const otp = rows[0];
  if (!otp) {
    return { ok: false as const, error: "Código expirado ou não encontrado. Peça um novo." };
  }

  if (otp.attempts >= MAX_ATTEMPTS) {
    await db.update(emailOtps).set({ consumedAt: new Date() }).where(eq(emailOtps.id, otp.id));
    return { ok: false as const, error: "Muitas tentativas erradas. Peça um novo código." };
  }

  const codeHash = await hashCode(code);
  if (codeHash !== otp.codeHash) {
    await db
      .update(emailOtps)
      .set({ attempts: otp.attempts + 1 })
      .where(eq(emailOtps.id, otp.id));
    return { ok: false as const, error: "Código incorreto." };
  }

  await db.update(emailOtps).set({ consumedAt: new Date() }).where(eq(emailOtps.id, otp.id));
  return { ok: true as const };
}

export const verifyEmailCode = createServerFn({ method: "POST" })
  .validator(verifyEmailCodeValidator)
  .handler(async ({ data }) => {
    const db = getDb();
    const { email, code } = data;

    const consumed = await consumeEmailCodeCore(email, code);
    if (!consumed.ok) return consumed;

    let [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user) {
      [user] = await db.insert(users).values({ email }).returning();
    }

    await setSessionUserId(user.id);

    return {
      ok: true as const,
      user: {
        id: user.id,
        email: user.email,
        balanceCents: user.balanceCents,
        freeVideoCredits: user.freeVideoCredits,
        freeImageCredits: user.freeImageCredits,
      },
    };
  });

export const logout = createServerFn({ method: "POST" }).handler(async () => {
  await clearSessionUser();
  return { ok: true as const };
});

export const getCurrentUser = createServerFn({ method: "GET" }).handler(async () => {
  const userId = await getSessionUserId();
  if (!userId) return null;

  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    balanceCents: user.balanceCents,
    freeVideoCredits: user.freeVideoCredits,
    freeImageCredits: user.freeImageCredits,
  };
});
