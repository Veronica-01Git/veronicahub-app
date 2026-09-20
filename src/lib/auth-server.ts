import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq, gt, gte, isNull, sql } from "drizzle-orm";
import { getDb } from "./db";
import { emailOtps, users } from "./schema";
import { getSessionUserId, setSessionUserId, clearSessionUser } from "./session";
import { checkMemoryRateLimit, hmacSha256Hex, timingSafeEqual } from "./security";
import { clientIpFromContext } from "./request-context.server";

const CODE_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

// Teto por endereço num dia. O cooldown de 60s sozinho só espaça os envios;
// ele não impede alguém de pedir código pro e-mail de outra pessoa a noite
// inteira. Cada envio custa uma cota da Resend e cai na caixa de uma pessoa
// que não pediu nada, então o teto diário é o que transforma isso de
// incômodo em nada.
const MAX_CODIGOS_POR_EMAIL_POR_DIA = 10;
const JANELA_DIARIA_MS = 24 * 60 * 60 * 1000;

// Limites por IP. Valem por isolate (ver security.ts), então são a primeira
// barreira, não a única — o teto por e-mail acima é o que persiste no banco.
const IP_PEDIDOS_MAX = 8;
const IP_PEDIDOS_JANELA_MS = 15 * 60 * 1000;
const IP_TENTATIVAS_MAX = 30;
const IP_TENTATIVAS_JANELA_MS = 15 * 60 * 1000;

function generateCode(): string {
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  return String(100000 + (bytes[0] % 900000));
}

/**
 * Sela o código com um segredo do servidor E com o e-mail de destino.
 *
 * O que havia antes era SHA-256 puro de um número de 6 dígitos: o espaço
 * inteiro são 900 mil valores, então uma tabela pré-computada reverte
 * qualquer hash desses em tempo de lookup. Quem lesse a tabela EmailOtp (um
 * dump, um backup, uma credencial de leitura vazada) lia os códigos vivos e
 * entrava na conta de qualquer pessoa. Com HMAC a tabela não serve pra nada
 * sem o segredo, e amarrar o e-mail impede reaproveitar o hash de um destino
 * em outro.
 *
 * Usa OTP_PEPPER quando existir; senão cai em SESSION_SECRET, que já é
 * obrigatória. Trocar qualquer uma delas invalida os códigos em voo — como o
 * TTL é de 10 minutos, o efeito prático é alguém pedir outro código.
 */
function getOtpPepper(): string {
  const pepper = process.env.OTP_PEPPER ?? process.env.SESSION_SECRET;
  if (!pepper) {
    throw new Error("OTP_PEPPER/SESSION_SECRET não configurada");
  }
  return pepper;
}

async function hashCode(email: string, code: string): Promise<string> {
  return hmacSha256Hex(getOtpPepper(), `${email}:${code}`);
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
    // O corpo do erro da Resend fica no log do servidor, não na resposta: ele
    // descreve a conta, o domínio e o motivo da recusa, e nada disso ajuda
    // quem está do outro lado da tela.
    console.error("Falha ao enviar e-mail pela Resend:", res.status, await res.text());
    throw new Error("Falha ao enviar e-mail.");
  }
}

const requestEmailCodeValidator = (input: unknown) => {
  const email = (input as { email?: unknown })?.email;
  if (typeof email !== "string" || !email.includes("@")) {
    throw new Error("E-mail inválido");
  }
  return { email: email.trim().toLowerCase() };
};

export const requestEmailCode = createServerFn({ method: "POST" })
  .validator(requestEmailCodeValidator)
  .handler(async ({ data }) => {
    const db = getDb();
    const { email } = data;

    const porIp = checkMemoryRateLimit(
      `otp:pedido:${clientIpFromContext()}`,
      IP_PEDIDOS_MAX,
      IP_PEDIDOS_JANELA_MS,
    );
    if (!porIp.ok) {
      return { ok: false as const, error: "Muitos pedidos de código. Tente de novo mais tarde." };
    }

    // Cooldown olha o último código PEDIDO, não o último ainda válido.
    //
    // Filtrar por `consumedAt IS NULL` aqui era um portão que se abria
    // sozinho: cinco tentativas erradas marcam o código como consumido (ver
    // verifyEmailCode), e a partir daí não sobrava nenhuma linha não-consumida
    // pro cooldown encontrar — dava pra pedir código atrás de código sem
    // esperar nada. Contar pelo createdAt fecha isso.
    const recent = await db
      .select({ createdAt: emailOtps.createdAt })
      .from(emailOtps)
      .where(eq(emailOtps.email, email))
      .orderBy(desc(emailOtps.createdAt))
      .limit(1);

    const last = recent[0];
    if (last && Date.now() - last.createdAt.getTime() < RESEND_COOLDOWN_MS) {
      const waitSec = Math.ceil(
        (RESEND_COOLDOWN_MS - (Date.now() - last.createdAt.getTime())) / 1000,
      );
      return { ok: false as const, error: `Aguarde ${waitSec}s antes de pedir um novo código.` };
    }

    const [{ total: enviadosHoje } = { total: 0 }] = await db
      .select({ total: sql<number>`count(*)` })
      .from(emailOtps)
      .where(
        and(
          eq(emailOtps.email, email),
          gte(emailOtps.createdAt, new Date(Date.now() - JANELA_DIARIA_MS)),
        ),
      );
    if (Number(enviadosHoje) >= MAX_CODIGOS_POR_EMAIL_POR_DIA) {
      return {
        ok: false as const,
        error: "Limite de códigos para este e-mail hoje. Tente de novo amanhã.",
      };
    }

    const code = generateCode();
    const codeHash = await hashCode(email, code);

    try {
      await sendCodeEmail(email, code);
    } catch {
      // Mensagem fixa: o detalhe já foi para o log em sendCodeEmail.
      return { ok: false as const, error: "Falha ao enviar e-mail." };
    }

    await db.insert(emailOtps).values({
      email,
      codeHash,
      expiresAt: new Date(Date.now() + CODE_TTL_MS),
    });

    return { ok: true as const };
  });

const verifyEmailCodeValidator = (input: unknown) => {
  const body = input as { email?: unknown; code?: unknown };
  if (typeof body?.email !== "string" || typeof body?.code !== "string") {
    throw new Error("Dados inválidos");
  }
  return { email: body.email.trim().toLowerCase(), code: body.code.trim() };
};

export const verifyEmailCode = createServerFn({ method: "POST" })
  .validator(verifyEmailCodeValidator)
  .handler(async ({ data }) => {
    const db = getDb();
    const { email, code } = data;

    // O teto de 5 tentativas vive na linha do OTP, então ele some junto com
    // ela quando o atacante pede um código novo. O limite por IP é o que
    // segura alguém alternando pedir-código/chutar-código em loop.
    const porIp = checkMemoryRateLimit(
      `otp:verificacao:${clientIpFromContext()}`,
      IP_TENTATIVAS_MAX,
      IP_TENTATIVAS_JANELA_MS,
    );
    if (!porIp.ok) {
      return { ok: false as const, error: "Muitas tentativas. Tente de novo mais tarde." };
    }

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

    const codeHash = await hashCode(email, code);
    if (!timingSafeEqual(codeHash, otp.codeHash)) {
      await db
        .update(emailOtps)
        .set({ attempts: otp.attempts + 1 })
        .where(eq(emailOtps.id, otp.id));
      return { ok: false as const, error: "Código incorreto." };
    }

    await db.update(emailOtps).set({ consumedAt: new Date() }).where(eq(emailOtps.id, otp.id));

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
