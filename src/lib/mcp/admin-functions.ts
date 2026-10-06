/**
 * Server functions do painel do conector MCP — só para admin.
 *
 * Mesmo padrão de src/lib/ai/evaluation-functions.ts: `requireAdmin` em cada
 * função (server function é endpoint público) e o núcleo por import dinâmico.
 */

import { createServerFn } from "@tanstack/react-start";
import { requireAdmin } from "../admin-server";

export const painelDoConectorMcp = createServerFn({ method: "GET" }).handler(async () => {
  const admin = await requireAdmin();
  if (!admin) return { ok: false as const, error: "Acesso restrito." };
  const { mcpPanelCore } = await import("./admin.server");
  try {
    return { ok: true as const, ...(await mcpPanelCore()) };
  } catch {
    return { ok: false as const, error: "Painel indisponível agora." };
  }
});

function validarConfirmacao(data: unknown): { confirmo: true } {
  if ((data as { confirmo?: unknown })?.confirmo !== true) throw new Error("Confirmação ausente.");
  return { confirmo: true };
}

export const desconectarConectorMcp = createServerFn({ method: "POST" })
  .validator(validarConfirmacao)
  .handler(async () => {
    const admin = await requireAdmin();
    if (!admin) return { ok: false as const, error: "Acesso restrito." };
    const { revokeAllMcpGrantsCore } = await import("./admin.server");
    return { ok: true as const, revogados: await revokeAllMcpGrantsCore() };
  });
