/**
 * Segunda barreira para ambientes que podem exibir dados operacionais reais.
 *
 * O selo identifica o cliente, mas é público. Por isso, clientes marcados com
 * `requiresVerifiedAccount` também exigem uma conta OTP cujo e-mail esteja em
 * uma allowlist mantida exclusivamente no ambiente do servidor.
 */

export type PrivateClientAccountPolicy = {
  readonly allowlistEnv: string;
};

const ACCOUNT_POLICIES: Readonly<Record<string, PrivateClientAccountPolicy>> = {
  "express-entulho": {
    allowlistEnv: "EXPRESS_OPERATIONS_ALLOWED_EMAILS",
  },
};

export function getPrivateClientAccountPolicy(clientId: string): PrivateClientAccountPolicy | null {
  return ACCOUNT_POLICIES[clientId] ?? null;
}

export function normalizeAccessEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function parseAllowedEmails(raw: string | undefined): readonly string[] {
  if (!raw?.trim()) return [];

  return [
    ...new Set(
      raw
        .split(/[;,\n]/)
        .map(normalizeAccessEmail)
        .filter((email) => email.includes("@") && email.length <= 254),
    ),
  ];
}

export function evaluatePrivateClientAccountAccess(input: {
  readonly clientId: string;
  readonly email: string | null;
  readonly environment: Readonly<Record<string, string | undefined>>;
}): "allowed" | "account-required" | "account-not-authorized" | "configuration-missing" {
  const policy = getPrivateClientAccountPolicy(input.clientId);
  if (!policy) return "allowed";
  if (!input.email) return "account-required";

  const allowedEmails = parseAllowedEmails(input.environment[policy.allowlistEnv]);
  if (allowedEmails.length === 0) return "configuration-missing";

  return allowedEmails.includes(normalizeAccessEmail(input.email))
    ? "allowed"
    : "account-not-authorized";
}
