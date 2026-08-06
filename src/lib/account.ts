// Utilitários compartilhados da carteira real do ecossistema Veronica
// (Studio, Currículo-Certo, Currículo-Certo RH). Login/saldo reais vivem em
// src/lib/auth-server.ts e src/lib/wallet-server.ts — este arquivo só
// mantém os helpers puros que não dependem de servidor.

export const MIN_DEPOSIT_CENTS = 1000; // R$10,00 — depósito mínimo na plataforma

export function formatBRL(cents: number): string {
  return `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;
}
