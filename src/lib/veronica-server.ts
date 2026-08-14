import { createServerFn } from "@tanstack/react-start";
import Anthropic from "@anthropic-ai/sdk";
import { eq } from "drizzle-orm";
import { VERONICA_SKILLS, getVeronicaStep, type VeronicaSkillId } from "@/veronica/skills";
import { getDb } from "./db";
import { veronicaMemories } from "./schema";
import { getSessionUserId } from "./session";

// Governadores de custo simples — sem rate-limit de verdade ainda (não tem
// infra de Redis neste projeto, diferente do negocio-da-china-app). Isso
// limita o tamanho de cada chamada à API da Anthropic, não a frequência.
const MAX_MESSAGE_CHARS = 800;
const MAX_HISTORY_MESSAGES = 8;
const MODEL = "claude-haiku-4-5-20251001";
const MAX_TOKENS = 400;
// Trava contra um loop indefinido de tool_use — na prática a Veronica grava
// no máximo 1-2 fatos por mensagem do usuário.
const MAX_TOOL_ROUNDS = 3;

type ChatTurn = { role: "user" | "assistant"; content: string };

const chatValidator = (input: unknown) => {
  const data = input as {
    skillId?: unknown;
    stepId?: unknown;
    message?: unknown;
    history?: unknown;
  };

  if (data?.skillId !== "studio-criativo") {
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

// Ferramenta que dá à Veronica um jeito de gravar fatos que o usuário conta
// sobre o próprio projeto durante a conversa — sem precisar de formulário
// nenhum. As chaves aceitas vêm do contrato da própria skill (payloadFields
// de cada passo, ver studio-criativo.ts), então cada skill nova define seu
// próprio vocabulário sem mexer aqui.
function rememberFactTool(allowedKeys: string[]): Anthropic.Tool {
  return {
    name: "remember_fact",
    description:
      "Grava um fato que o usuário contou sobre o próprio projeto/produto, pra não precisar perguntar de novo — nem nesta conversa, nem em outra página do Hub no futuro. Chame só quando o usuário disser o fato explicitamente; nunca invente ou deduza um valor que ele não disse.",
    input_schema: {
      type: "object",
      properties: {
        key: { type: "string", enum: allowedKeys },
        value: {
          type: "string",
          description: "O fato, o mais próximo possível do que o usuário disse.",
        },
      },
      required: ["key", "value"],
    },
  };
}

type StoredMemory = { skillId: string; key: string; value: string };

// Busca por usuário, sem filtrar por skill — um fato aprendido no Studio
// Criativo já vira contexto se a Veronica aparecer em outra página amanhã.
async function loadMemories(userId: string): Promise<StoredMemory[]> {
  const db = getDb();
  return db
    .select({
      skillId: veronicaMemories.skillId,
      key: veronicaMemories.key,
      value: veronicaMemories.value,
    })
    .from(veronicaMemories)
    .where(eq(veronicaMemories.userId, userId));
}

function memoriesToPromptBlock(memories: StoredMemory[]): string {
  if (memories.length === 0) return "";
  const lines = memories.map((m) => `- ${m.key}: ${m.value} (de: ${m.skillId})`);
  return `\n\nO QUE VOCÊ JÁ SABE SOBRE ESSE USUÁRIO — não pergunte de novo, só confirme se for usar:\n${lines.join("\n")}`;
}

async function saveMemory(userId: string, skillId: VeronicaSkillId, key: string, value: string) {
  const db = getDb();
  await db
    .insert(veronicaMemories)
    .values({ userId, skillId, key, value })
    .onConflictDoUpdate({
      target: [veronicaMemories.userId, veronicaMemories.skillId, veronicaMemories.key],
      set: { value, updatedAt: new Date() },
    });
}

export const veronicaChat = createServerFn({ method: "POST" })
  .validator(chatValidator)
  .handler(async ({ data }) => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return { ok: false as const, error: "Assistente indisponível no momento." };
    }

    const skill = VERONICA_SKILLS[data.skillId];
    const step = getVeronicaStep(data.skillId, data.stepId);
    const allowedKeys = [...new Set(skill.steps.flatMap((s) => s.payloadFields ?? []))];

    // Sem login não tem como guardar fato nenhum (não existe userId pra
    // chavear) — o chat continua funcionando normalmente, só sem memória.
    const userId = await getSessionUserId();
    const memories = userId ? await loadMemories(userId) : [];

    const stepContext = step
      ? `\n\nPASSO ATUAL DO USUÁRIO: "${step.title}" (${step.order}/7).\nContexto específico deste passo: ${step.instructorContext}`
      : "";
    const systemPrompt = `${skill.systemPrompt}${stepContext}${memoriesToPromptBlock(memories)}`;

    const tools = userId && allowedKeys.length > 0 ? [rememberFactTool(allowedKeys)] : undefined;

    try {
      const anthropic = new Anthropic({ apiKey });
      const messages: Anthropic.MessageParam[] = [
        ...data.history.map((t) => ({ role: t.role, content: t.content })),
        { role: "user", content: data.message },
      ];

      let response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: systemPrompt,
        messages,
        tools,
      });

      let rounds = 0;
      while (response.stop_reason === "tool_use" && rounds < MAX_TOOL_ROUNDS) {
        rounds++;
        messages.push({ role: "assistant", content: response.content });

        const toolResults: Anthropic.ToolResultBlockParam[] = [];
        for (const block of response.content) {
          if (block.type !== "tool_use" || block.name !== "remember_fact") continue;
          const input = block.input as { key?: unknown; value?: unknown };
          const key = typeof input.key === "string" ? input.key : null;
          const value = typeof input.value === "string" ? input.value.trim().slice(0, 500) : null;

          if (key && value && userId && allowedKeys.includes(key)) {
            await saveMemory(userId, data.skillId, key, value);
            toolResults.push({ type: "tool_result", tool_use_id: block.id, content: "Salvo." });
          } else {
            toolResults.push({
              type: "tool_result",
              tool_use_id: block.id,
              content: "Não consegui salvar — chave inválida ou valor vazio.",
              is_error: true,
            });
          }
        }

        messages.push({ role: "user", content: toolResults });
        response = await anthropic.messages.create({
          model: MODEL,
          max_tokens: MAX_TOKENS,
          system: systemPrompt,
          messages,
          tools,
        });
      }

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
