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
import { curriculoCertoSteps, curriculoCertoSystemPrompt } from "./curriculo-certo";
import { homeSteps, homeSystemPrompt } from "./home";

export type VeronicaSkillId = "studio-criativo" | "curriculo-certo" | "home";

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
    "curriculo-certo": {
    id: "curriculo-certo",
    label: "Currículo-Certo",
    steps: curriculoCertoSteps,
    systemPrompt: curriculoCertoSystemPrompt,
  },
  home: {
    id: "home",
    label: "Home",
    steps: homeSteps,
    systemPrompt: homeSystemPrompt,
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
