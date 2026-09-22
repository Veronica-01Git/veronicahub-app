import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq, gt, isNull } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { emailOtps } from "@/lib/schema";

const CODE_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;
const ADMIN_SESSION_MAX_AGE = 2 * 60 * 60;

type AdminSessionData = {
  email: string;
  verifiedAt: number;
};

function normalizeEmail(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase();
}

function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function isAllowedAdminEmail(email: string): boolean {
  return adminEmails().includes(email);
}

function generateCode(): string {
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  return String(100000 + (bytes[0] % 900000));
}

async function hashCode(code: string): Promise<string> {
  const data = new TextEncoder().encode(code);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function sendAdminCode(email: string, code: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    throw new Error("Canal de e-mail de segurança não configurado.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: email,
      subject: `${code} · senha de segurança — Veronica Private Clients`,
      text: [
        `Sua senha temporária de segurança é ${code}.`,
        "Ela expira em 10 minutos e só pode ser usada uma vez.",
        "Se você não tentou acessar o painel privado, ignore este e-mail.",
      ].join("\n"),
    }),
  });

  if (!response.ok) {
    throw new Error("Não foi possível enviar a senha de segurança.");
  }
}

async function getAdminSessionManager() {
  const { useSession } = await import("@tanstack/react-start/server");
  const password = process.env.SESSION_SECRET;
  if (!password || password.length < 32) {
    throw new Error("SESSION_SECRET não configurada corretamente.");
  }

  return useSession<AdminSessionData>({
    password,
    name: "veronica_clients_admin",
    maxAge: ADMIN_SESSION_MAX_AGE,
    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/clientes",
    },
  });
}

async function requireClientsAdmin(): Promise<{ email: string } | null> {
  const session = await getAdminSessionManager();
  const email = normalizeEmail(session.data.email);
  const verifiedAt = Number(session.data.verifiedAt ?? 0);

  if (!email || !verifiedAt || !isAllowedAdminEmail(email)) return null;
  if (Date.now() - verifiedAt > ADMIN_SESSION_MAX_AGE * 1000) {
    await session.clear();
    return null;
  }

  return { email };
}

export const requestClientsAdminSecurityCode = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const email = normalizeEmail((input as { email?: unknown })?.email);
    if (!email || !email.includes("@")) throw new Error("E-mail inválido.");
    return { email };
  })
  .handler(async ({ data }) => {
    const { email } = data;

    // Resposta deliberadamente neutra para não revelar quais e-mails são admins.
    if (!isAllowedAdminEmail(email)) {
      return {
        ok: true as const,
        message: "Se o e-mail estiver autorizado, a senha de segurança será enviada.",
      };
    }

    const db = getDb();
    const [recent] = await db
      .select()
      .from(emailOtps)
      .where(and(eq(emailOtps.email, email), isNull(emailOtps.consumedAt)))
      .orderBy(desc(emailOtps.createdAt))
      .limit(1);

    if (recent && Date.now() - recent.createdAt.getTime() < RESEND_COOLDOWN_MS) {
      const waitSeconds = Math.ceil(
        (RESEND_COOLDOWN_MS - (Date.now() - recent.createdAt.getTime())) / 1000,
      );
      return {
        ok: false as const,
        error: `Aguarde ${waitSeconds}s antes de solicitar uma nova senha.`,
      };
    }

    const code = generateCode();
    await sendAdminCode(email, code);

    await db.insert(emailOtps).values({
      email,
      codeHash: await hashCode(code),
      expiresAt: new Date(Date.now() + CODE_TTL_MS),
    });

    return {
      ok: true as const,
      message: "Senha de segurança enviada ao e-mail autorizado.",
    };
  });

export const verifyClientsAdminSecurityCode = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const body = input as { email?: unknown; code?: unknown };
    const email = normalizeEmail(body?.email);
    const code = typeof body?.code === "string" ? body.code.trim() : "";

    if (!email || !/^[0-9]{6}$/.test(code)) {
      throw new Error("Dados de segurança inválidos.");
    }

    return { email, code };
  })
  .handler(async ({ data }) => {
    const { email, code } = data;
    if (!isAllowedAdminEmail(email)) {
      return { ok: false as const, error: "Senha inválida ou expirada." };
    }

    const db = getDb();
    const [otp] = await db
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

    if (!otp) return { ok: false as const, error: "Senha inválida ou expirada." };

    if (otp.attempts >= MAX_ATTEMPTS) {
      await db.update(emailOtps).set({ consumedAt: new Date() }).where(eq(emailOtps.id, otp.id));
      return { ok: false as const, error: "Muitas tentativas. Solicite uma nova senha." };
    }

    const codeHash = await hashCode(code);
    if (codeHash !== otp.codeHash) {
      await db
        .update(emailOtps)
        .set({ attempts: otp.attempts + 1 })
        .where(eq(emailOtps.id, otp.id));
      return { ok: false as const, error: "Senha inválida ou expirada." };
    }

    await db.update(emailOtps).set({ consumedAt: new Date() }).where(eq(emailOtps.id, otp.id));

    const session = await getAdminSessionManager();
    await session.update({ email, verifiedAt: Date.now() });

    return { ok: true as const };
  });

export const getPrivateClientsAdminDashboard = createServerFn({ method: "GET" }).handler(async () => {
  const admin = await requireClientsAdmin();
  if (!admin) {
    return { ok: false as const, error: "Acesso administrativo não confirmado." };
  }

  const { privateClients } = await import("./registry");

  return {
    ok: true as const,
    admin: { email: admin.email },
    clients: privateClients.map((client) => ({
      id: client.id,
      slug: client.slug,
      displayName: client.displayName,
      tagline: client.tagline,
      sealSerial: client.sealSerial,
      accessState: client.accessState,
      modules: client.modules.map((module) => ({
        id: module.id,
        label: module.label,
        state: module.state,
      })),
      homePath:
        client.slug === "veronica-fashion-operator"
          ? "/clientes/veronica-fashion-operator"
          : `/clientes/${client.slug}`,
      executionPath:
        client.slug === "veronica-fashion-operator"
          ? "/clientes/veronica-fashion-operator/execucao"
          : client.slug === "express-entulho"
            ? "/clientes/express-entulho/operacoes-demo"
            : null,
    })),
  };
});

export const logoutPrivateClientsAdmin = createServerFn({ method: "POST" }).handler(async () => {
  const session = await getAdminSessionManager();
  await session.clear();
  return { ok: true as const };
});
