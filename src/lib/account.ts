// ---------------------------------------------------------------------------
// Conta simulada do ecossistema Veronica — sem backend ainda. Login (PIN por
// e-mail/celular) e saldo vivem em localStorage, compartilhados pela MESMA
// chave entre ferramentas (Currículo-Certo, Veronica Studio, ...), simulando
// login único: uma sessão aberta em uma ferramenta já aparece logada na outra.
// Nenhum valor real é movimentado por este código.
// ---------------------------------------------------------------------------

export const ACCOUNT_SESSION_KEY = "veronica_account_sim_v1";
export const MIN_DEPOSIT_CENTS = 1000; // R$10,00 — investimento mínimo na plataforma

export type AuthChannel = "email" | "phone";

export type Session = {
  channel: AuthChannel;
  identifier: string;
  balanceCents: number;
  freeVideoCredits: number;
  freeImageCredits: number;
};

export function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function formatBRL(cents: number): string {
  return `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;
}

export function loadSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(ACCOUNT_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Session>;
    if (!parsed.channel || !parsed.identifier) return null;
    return {
      channel: parsed.channel,
      identifier: parsed.identifier,
      balanceCents: parsed.balanceCents ?? 0,
      freeVideoCredits: parsed.freeVideoCredits ?? 0,
      freeImageCredits: parsed.freeImageCredits ?? 0,
    };
  } catch {
    return null;
  }
}

export function persistSession(session: Session | null): void {
  if (typeof window === "undefined") return;
  if (session) window.localStorage.setItem(ACCOUNT_SESSION_KEY, JSON.stringify(session));
  else window.localStorage.removeItem(ACCOUNT_SESSION_KEY);
}

// New accounts start with 1 free 1080p video + 2 free Nano Banana Pro images.
export function createSession(channel: AuthChannel, identifier: string): Session {
  return { channel, identifier, balanceCents: 0, freeVideoCredits: 1, freeImageCredits: 2 };
}
