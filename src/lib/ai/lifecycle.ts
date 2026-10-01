/**
 * LIFECYCLE — como um agente muda de estado, e o que é recusado.
 *
 * Política desta fase, simples de propósito:
 *   - promoção anda UM degrau por vez. LAB → ENTERPRISE é recusado, sempre;
 *   - de PILOT para cima (agente que encosta em cliente real) a promoção
 *     exige uma pessoa aprovando;
 *   - de VALIDATED para cima exige, além disso, um relatório do V-IVA que
 *     recomende a promoção, da mesma versão do agente;
 *   - rebaixamento (rollback) é permitido para qualquer degrau abaixo, só com
 *     motivo — tirar um agente de operação tem que ser rápido;
 *   - quem aprova não pode ser o próprio agente nem o V-IVA. O V-IVA
 *     recomenda; nunca promove.
 *
 * A função é pura: devolve o registro de transição a gravar (append-only em
 * AgentLifecycleTransition) ou o motivo da recusa. Nenhuma promoção apaga o
 * estado anterior — ele fica em `fromStatus` para sempre.
 */

import { LIFECYCLE_STATUSES, type LifecycleStatus } from "./platform-types.ts";

/** Estados em que o agente encosta em cliente real: exigem aprovação humana. */
export const HUMAN_APPROVAL_FROM: LifecycleStatus = "PILOT";
/** Estados que exigem relatório do V-IVA recomendando a promoção. */
export const EVALUATION_REQUIRED_FROM: LifecycleStatus = "VALIDATED";

export function lifecycleRank(status: LifecycleStatus): number {
  return LIFECYCLE_STATUSES.indexOf(status);
}

/** Estrutura mínima de relatório que a promoção aceita (ver v-iva.ts). */
export type PromotionEvidence = {
  readonly agentSlug: string;
  readonly agentVersion: string;
  readonly runId: string;
  readonly recommendation: { readonly verdict: string };
};

export type TransitionRequest = {
  readonly agentSlug: string;
  readonly agentVersion: string;
  readonly fromStatus: LifecycleStatus;
  readonly toStatus: LifecycleStatus;
  readonly reason: string;
  readonly requestedBy: string;
  readonly approvedBy?: string | null;
  readonly evaluation?: PromotionEvidence | null;
  readonly now?: Date;
};

export type TransitionRecord = {
  readonly agentSlug: string;
  readonly fromStatus: LifecycleStatus;
  readonly toStatus: LifecycleStatus;
  readonly reason: string;
  readonly requestedBy: string;
  readonly approvedBy: string | null;
  readonly evaluationRunId: string | null;
  readonly createdAt: string;
};

export type TransitionRefusal =
  | "SAME_STATUS"
  | "SKIPS_STAGE"
  | "MISSING_REASON"
  | "MISSING_REQUESTER"
  | "APPROVAL_REQUIRED"
  | "INVALID_APPROVER"
  | "EVALUATION_REQUIRED"
  | "EVALUATION_MISMATCH"
  | "EVALUATION_NOT_ELIGIBLE";

export type TransitionResult =
  | {
      readonly ok: true;
      readonly kind: "promotion" | "demotion";
      readonly record: TransitionRecord;
    }
  | { readonly ok: false; readonly code: TransitionRefusal; readonly reason: string };

/** Atores que nunca aprovam promoção. */
const NAO_APROVAM = new Set(["v-iva"]);

export function planTransition(req: TransitionRequest): TransitionResult {
  const recusa = (code: TransitionRefusal, reason: string): TransitionResult => ({
    ok: false,
    code,
    reason,
  });
  const de = lifecycleRank(req.fromStatus);
  const para = lifecycleRank(req.toStatus);

  if (de === para) return recusa("SAME_STATUS", `${req.agentSlug} já está em ${req.toStatus}`);
  if (req.reason.trim().length < 10) {
    return recusa("MISSING_REASON", "Transição precisa de motivo escrito (mínimo 10 caracteres)");
  }
  if (!req.requestedBy.trim())
    return recusa("MISSING_REQUESTER", "Transição precisa de solicitante");

  const aprovador = req.approvedBy?.trim() || null;
  const registro = (kind: "promotion" | "demotion"): TransitionResult => ({
    ok: true,
    kind,
    record: {
      agentSlug: req.agentSlug,
      fromStatus: req.fromStatus,
      toStatus: req.toStatus,
      reason: req.reason.trim(),
      requestedBy: req.requestedBy.trim(),
      approvedBy: aprovador,
      evaluationRunId: req.evaluation?.runId ?? null,
      createdAt: (req.now ?? new Date()).toISOString(),
    },
  });

  // Rebaixar é sempre permitido com motivo: tirar de operação não espera fila.
  if (para < de) return registro("demotion");

  if (para !== de + 1) {
    return recusa(
      "SKIPS_STAGE",
      `${req.fromStatus} → ${req.toStatus} pula etapa; promoção anda um degrau por vez`,
    );
  }

  if (para >= lifecycleRank(HUMAN_APPROVAL_FROM)) {
    if (!aprovador) {
      return recusa("APPROVAL_REQUIRED", `Promoção para ${req.toStatus} exige aprovação humana`);
    }
    if (NAO_APROVAM.has(aprovador) || aprovador === req.agentSlug) {
      return recusa("INVALID_APPROVER", `${aprovador} não pode aprovar promoção`);
    }
  }

  if (para >= lifecycleRank(EVALUATION_REQUIRED_FROM)) {
    const ev = req.evaluation;
    if (!ev) {
      return recusa(
        "EVALUATION_REQUIRED",
        `Promoção para ${req.toStatus} exige relatório do V-IVA`,
      );
    }
    if (ev.agentSlug !== req.agentSlug || ev.agentVersion !== req.agentVersion) {
      return recusa(
        "EVALUATION_MISMATCH",
        `Relatório é de ${ev.agentSlug}@${ev.agentVersion}, não de ${req.agentSlug}@${req.agentVersion}`,
      );
    }
    if (ev.recommendation.verdict !== "ELIGIBLE_FOR_PROMOTION") {
      return recusa(
        "EVALUATION_NOT_ELIGIBLE",
        `Relatório ${ev.runId} recomenda ${ev.recommendation.verdict}, não a promoção`,
      );
    }
  }

  return registro("promotion");
}

/** Próximo degrau, ou null no topo. Usado pelo V-IVA só para SUGERIR. */
export function nextStatus(status: LifecycleStatus): LifecycleStatus | null {
  return LIFECYCLE_STATUSES[lifecycleRank(status) + 1] ?? null;
}
