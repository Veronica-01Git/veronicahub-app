/**
 * GUARDA DE TENANT DA PLATAFORMA.
 *
 * Antes de qualquer agente executar, a plataforma confere se o tenant da
 * execução está entre os permitidos na especificação. A decisão é do código,
 * não do modelo: um agente nunca recebe uma tarefa em nome de um tenant que
 * não é dele, então não depende de o modelo "saber recusar".
 *
 * É a mesma função que o executor de avaliação usa (executors/) e que a
 * execução real vai usar quando o router for ligado a um agente — o V-IVA
 * testa a guarda de verdade, não uma cópia.
 */

import type { AgentSpecification } from "./agent-registry.ts";
import { isValidTenantId, type TenantId } from "./platform-types.ts";

export type TenantCheck =
  | { readonly ok: true; readonly tenantId: TenantId }
  | {
      readonly ok: false;
      readonly code: "TENANT_MISSING" | "TENANT_INVALID" | "TENANT_FORBIDDEN";
      readonly reason: string;
    };

export function checkTenantAccess(
  spec: Pick<AgentSpecification, "slug" | "allowedTenants">,
  tenantId: TenantId | null | undefined,
): TenantCheck {
  if (!tenantId) {
    return { ok: false, code: "TENANT_MISSING", reason: "Execução sem tenant não existe" };
  }
  if (!isValidTenantId(tenantId)) {
    return { ok: false, code: "TENANT_INVALID", reason: "Tenant com formato inválido" };
  }
  if (!spec.allowedTenants.includes(tenantId)) {
    return {
      ok: false,
      code: "TENANT_FORBIDDEN",
      reason: `${spec.slug} não opera para o tenant ${tenantId}`,
    };
  }
  return { ok: true, tenantId };
}
