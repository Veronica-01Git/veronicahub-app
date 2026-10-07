import { createServerFn } from "@tanstack/react-start";
import {
  validateConversation,
  validateLive,
  VERONICA_PERSONA,
  liveBody,
  liveCreateError,
} from "./core";
export const conversationReply = createServerFn({ method: "POST" })
  .validator(validateConversation)
  .handler(async ({ data }) => {
    const { generateText } = await import("@/lib/text-generation.server");
    try {
      const result = await generateText({
        system:
          VERONICA_PERSONA +
          "\nRotas públicas: /escola, /aula-zero, /formacoes, /prompt-packs, /portfolio, /studio-veronica, /agentes, /veronica-analytics, /blog, /membros. Não afirme que todos os serviços estão automatizados ou disponíveis sem verificar.",
        messages: [...data.history, { role: "user", content: data.message }],
        maxTokens: 700,
        groqModel: "openai/gpt-oss-20b",
      });
      return { ok: true as const, reply: result.text };
    } catch {
      return {
        ok: false as const,
        error:
          "Não consegui responder agora. Sua mensagem continua disponível para tentar novamente.",
      };
    }
  });
export const conversationCapabilities = createServerFn({ method: "GET" }).handler(async () => {
  const { getRuntimeSecret } = await import("@/lib/runtime-secret.server");
  const configured =
    !!(await getRuntimeSecret("VIDU_API_KEY")) &&
    !!(await getRuntimeSecret("VIDU_AVATAR_IMAGE_URL")) &&
    !!(await getRuntimeSecret("VIDU_SESSION_SECRET"));
  return {
    liveConfigured: configured,
    liveEnabled: configured && (await getRuntimeSecret("VIDU_LIVE_ENABLED")) === "true",
  };
});
export const startVeronicaLive = createServerFn({ method: "POST" })
  .validator(validateLive)
  .handler(async ({ data }) => {
    const { requireAdminCore } = await import("@/lib/admin-core.server");
    // Live remains operator-only until real credential/voice/device acceptance tests pass.
    if (!(await requireAdminCore()))
      return {
        ok: false as const,
        error: "A conversa ao vivo está em ativação. O texto já pode ser usado.",
      };
    const { getRuntimeSecret } = await import("@/lib/runtime-secret.server");
    const apiKey = await getRuntimeSecret("VIDU_API_KEY"),
      secret = await getRuntimeSecret("VIDU_SESSION_SECRET"),
      image = await getRuntimeSecret("VIDU_AVATAR_IMAGE_URL");
    if (
      !apiKey ||
      !secret ||
      secret.length < 32 ||
      !image ||
      (await getRuntimeSecret("VIDU_LIVE_ENABLED")) !== "true"
    )
      return { ok: false as const, error: "O Vidu ainda não foi ativado neste ambiente." };
    try {
      const u = new URL(image);
      if (u.protocol !== "https:") throw new Error("image");
      const voice = await getRuntimeSecret("VIDU_VOICE_ID");
      const response = await fetch("https://api.vidu.com/live/s_avatar/realtime", {
        method: "POST",
        headers: { Authorization: `Token ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(liveBody(data.model, data.mode, image, voice)),
        signal: AbortSignal.timeout(20_000),
      });
      if (!response.ok)
        return {
          ok: false as const,
          error: liveCreateError(response.status, (await response.text()).slice(0, 2000)),
        };
      const result = (await response.json()) as {
        live?: { id?: string };
        rtc?: { token?: string; user_id?: string };
      };
      const id = result.live?.id;
      if (!id || !/^\d{1,30}$/.test(id) || !result.rtc?.token || !result.rtc.user_id)
        throw new Error("response");
      const { signLiveTicket } = await import("./ticket.server");
      return {
        ok: true as const,
        ticket: await signLiveTicket(id, secret),
        liveId: id,
        rtc: { token: result.rtc.token, userId: result.rtc.user_id },
      };
    } catch {
      return {
        ok: false as const,
        error:
          "Não foi possível conectar ao Vidu. Continue por texto e tente o modo ao vivo mais tarde.",
      };
    }
  });
