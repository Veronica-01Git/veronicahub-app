import { createServerFn } from "@tanstack/react-start";
import Groq from "groq-sdk";
import { VERONICA_SKILLS, getVeronicaStep, type VeronicaSkillId } from "@/veronica/skills";
import { checkMemoryRateLimit } from "./security";
import { clientIpFromContext } from "./request-context.server";

// Governadores de custo. O endpoint é anônimo por natureza (a Veronica
// responde antes de a pessoa ter conta), então o teto tem que vir do
// tamanho da chamada E da frequência dela.
const MAX_MESSAGE_CHARS = 800;
const MAX_HISTORY_MESSAGES = 8;
// O `history` vem inteiro do cliente. Limitar a QUANTIDADE de mensagens sem
// limitar o TAMANHO delas não limita nada: oito mensagens de 1 MB cada
// entram na mesma chamada e viram a conta da Groq. Cada turno do histórico
// segue o mesmo teto da mensagem nova, e ainda há um teto para a soma.
const MAX_HISTORY_TURN_CHARS = MAX_MESSAGE_CHARS;
const MAX_HISTORY_TOTAL_CHARS = MAX_MESSAGE_CHARS * MAX_HISTORY_MESSAGES;
// Frequência por IP. Vale por isolate (ver security.ts) — é a primeira
// barreira contra alguém rodando a conta da Groq num loop, não um teto
// global exato.
const IP_CHAMADAS_MAX = 12;
const IP_JANELA_MS = 60_000;
// Groq (não Anthropic nem Gemini) — mesma chave/mesmo provedor do
// Veronica Wire (articles-server.ts). Tier grátis sem cartão (ao
// contrário do Gemini, que travou mesmo com faturamento configurado —
// ver PROGRESSO.md). Modelo mais forte do Groq (não o compound — chat
// não precisa buscar na web), pra qualidade de resposta boa.
const MODEL = "qwen/qwen3.6-27b";
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
  const recortado: ChatTurn[] = rawHistory
    .filter(
      (t): t is ChatTurn =>
        !!t &&
        (t.role === "user" || t.role === "assistant") &&
        typeof t.content === "string" &&
        t.content.length <= MAX_HISTORY_TURN_CHARS,
    )
    .slice(-MAX_HISTORY_MESSAGES);

  // Corta do começo (turno mais antigo) até caber no teto da soma — o fim do
  // histórico é o que dá contexto útil para a resposta.
  const history: ChatTurn[] = [];
  let totalChars = 0;
  for (let i = recortado.length - 1; i >= 0; i -= 1) {
    const turno = recortado[i]!;
    if (totalChars + turno.content.length > MAX_HISTORY_TOTAL_CHARS) break;
    totalChars += turno.content.length;
    history.unshift(turno);
  }

  return { skillId: data.skillId as VeronicaSkillId, stepId, message: message.trim(), history };
};

export const veronicaChat = createServerFn({ method: "POST" })
  .validator(chatValidator)
  .handler(async ({ data }) => {
    const porIp = checkMemoryRateLimit(
      `veronica-chat:${clientIpFromContext()}`,
      IP_CHAMADAS_MAX,
      IP_JANELA_MS,
    );
    if (!porIp.ok) {
      return {
        ok: false as const,
        error: `Muitas mensagens seguidas. Espera ${porIp.retryAfterSec}s e tenta de novo.`,
      };
    }

    const apiKey = process.env.GROQ_API_KEY;
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
      const groq = new Groq({ apiKey });
      const response = await groq.chat.completions.create({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          ...data.history.map((t) => ({ role: t.role, content: t.content })),
          { role: "user" as const, content: data.message },
        ],
        max_completion_tokens: MAX_TOKENS,
      });

      const reply = (response.choices[0]?.message?.content ?? "").trim();

      return {
        ok: true as const,
        reply: reply || "Não consegui gerar uma resposta agora — tenta de novo.",
      };
    } catch (error) {
      // O erro da Groq pode trazer modelo, organização, cota e recorte da
      // chave — contexto de infraestrutura que não deve sair na resposta de
      // um endpoint anônimo. Detalhe vai pro log; a pessoa recebe o genérico.
      console.error("Falha na chamada à Groq (veronicaChat):", error);
      return { ok: false as const, error: "Falha ao falar com a Veronica." };
    }
  });
