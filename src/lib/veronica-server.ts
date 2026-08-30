import { createServerFn } from "@tanstack/react-start";
import Anthropic from "@anthropic-ai/sdk";
import { VERONICA_SKILLS, getVeronicaStep, type VeronicaSkillId } from "@/veronica/skills";

// Governadores de custo simples — sem rate-limit de verdade ainda (não tem
// infra de Redis neste projeto, diferente do negocio-da-china-app). Isso
// limita o tamanho de cada chamada à API da Anthropic, não a frequência.
const MAX_MESSAGE_CHARS = 800;
const MAX_HISTORY_MESSAGES = 8;
const MODEL = "claude-haiku-4-5-20251001";
const MAX_TOKENS = 400;

type ChatTurn = { role: "user" | "assistant"; content: string };

const chatValidator = (input: unknown) => {
  const data = input as {
    skillId?: unknown;
    stepId?: unknown;
    message?: unknown;
    history?: unknown;
  };

   if (
    data?.skillId !== "studio-criativo" &&
    data?.skillId !== "curriculo-certo" &&
    data?.skillId !== "home"
  ) {
    throw new Error("Skill inválida.");
  }
  const message = data?.message;
  if (typeof message !== "string" || !message.trim()) {
    throw new Error("Mensagem vazia.");
  }
  if (message.length > MAX_MESSAGE_CHARS) {
    throw new Error(`Mensagem muito longa (máx. ${MAX_MESSAGE_CHARS} caracteres).`);
  }
  const stepId = typeof data?.stepId === "string" ? data.stepId : null;
  const rawHistory = Array.isArray(data?.history) ? data.history : [];
  const history: ChatTurn[] = rawHistory
    .filter(
      (t): t is ChatTurn =>
        !!t && (t.role === "user" || t.role === "assistant") && typeof t.content === "string",
    )
    .slice(-MAX_HISTORY_MESSAGES);

  return { skillId: data.skillId as VeronicaSkillId, stepId, message: message.trim(), history };
};

export const veronicaChat = createServerFn({ method: "POST" })
  .validator(chatValidator)
  .handler(async ({ data }) => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return { ok: false as const, error: "Assistente indisponível no momento." };
    }

    const skill = VERONICA_SKILLS[data.skillId];
    const step = getVeronicaStep(data.skillId, data.stepId);

    // Contexto do passo atual entra como adendo ao system prompt do skill,
    // nunca substitui as regras rígidas dele.
    const systemPrompt = step
      ? `${skill.systemPrompt}\n\nPASSO ATUAL DO USUÁRIO: "${step.title}" (${step.order}/7).\nContexto específico deste passo: ${step.instructorContext}`
      : skill.systemPrompt;

    try {
      const anthropic = new Anthropic({ apiKey });
      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: systemPrompt,
        messages: [
          ...data.history.map((t) => ({ role: t.role, content: t.content })),
          { role: "user" as const, content: data.message },
        ],
      });

      const reply = response.content
        .filter((block) => block.type === "text")
        .map((block) => block.text)
        .join("\n")
        .trim();

      return {
        ok: true as const,
        reply: reply || "Não consegui gerar uma resposta agora — tenta de novo.",
      };
    } catch (error) {
      return {
        ok: false as const,
        error: error instanceof Error ? error.message : "Falha ao falar com a Veronica.",
      };
    }
  });
