/**
 * Registry central das skills da assistente Veronica.
 *
 * Cada skill é um contrato auto-contido (steps + system prompt) associado
 * a uma página do Hub. Pra adicionar uma nova skill (ex.: Currículo-Certo,
 * Analytics): criar o arquivo em src/veronica/skills/<nome>.ts seguindo o
 * mesmo formato de studio-criativo.ts, e registrar aqui.
 */

import {
  studioCriativoSteps,
  studioCriativoSystemPrompt,
  type StudioCriativoStep,
  type StudioCriativoStepId,
} from "./studio-criativo";

export type VeronicaSkillId = "studio-criativo";

export type VeronicaSkill = {
  id: VeronicaSkillId;
  label: string;
  steps: StudioCriativoStep[];
  systemPrompt: string;
};

export const VERONICA_SKILLS: Record<VeronicaSkillId, VeronicaSkill> = {
  "studio-criativo": {
    id: "studio-criativo",
    label: "Studio Criativo",
    steps: studioCriativoSteps,
    systemPrompt: studioCriativoSystemPrompt,
  },
};

export function getVeronicaSkill(id: VeronicaSkillId): VeronicaSkill {
  return VERONICA_SKILLS[id];
}

export function getVeronicaStep(id: VeronicaSkillId, stepId: string | null | undefined) {
  if (!stepId) return null;
  return VERONICA_SKILLS[id].steps.find((s) => s.id === stepId) ?? null;
}

export type { StudioCriativoStep, StudioCriativoStepId };
