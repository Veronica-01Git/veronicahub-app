import { getRuntimeSecret } from "./runtime-secret.server.ts";

type Turn = { role: "user" | "assistant"; content: string };
type Provider = "groq" | "gemini" | "anthropic";
type Input = {
  system: string;
  messages: Turn[];
  maxTokens: number;
  groqModel: string;
  json?: boolean;
};
type Dependencies = {
  secret: (name: string) => Promise<string | undefined>;
  fetch: typeof fetch;
};

/** One bounded attempt per configured provider. No raw provider error leaks. */
export async function generateText(
  input: Input,
  deps: Dependencies = { secret: getRuntimeSecret, fetch: globalThis.fetch },
): Promise<{ text: string; provider: Provider; model: string }> {
  if (input.system.length + input.messages.reduce((n, m) => n + m.content.length, 0) > 24_000)
    throw new Error("Entrada de IA excede o limite desta operação.");
  const maxTokens = Math.max(1, Math.min(input.maxTokens, 1800));
  const failures: string[] = [];
  const providers: Provider[] = ["groq", "gemini", "anthropic"];
  for (const provider of providers) {
    const key = await deps.secret(`${provider.toUpperCase()}_API_KEY`);
    if (!key) {
      failures.push(`${provider}: não configurado`);
      continue;
    }
    const model =
      provider === "groq"
        ? input.groqModel
        : provider === "gemini"
          ? "gemini-2.5-flash-lite"
          : "claude-haiku-4-5-20251001";
    let url: string;
    let headers: Record<string, string>;
    let body: unknown;
    if (provider === "groq") {
      url = "https://api.groq.com/openai/v1/chat/completions";
      headers = { "content-type": "application/json", authorization: `Bearer ${key}` };
      body = {
        model,
        max_completion_tokens: maxTokens,
        messages: [{ role: "system", content: input.system }, ...input.messages],
        ...(model.startsWith("openai/gpt-oss") ? { reasoning_effort: "low" } : {}),
      };
    } else if (provider === "gemini") {
      url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
      headers = { "content-type": "application/json", "x-goog-api-key": key };
      body = {
        systemInstruction: { parts: [{ text: input.system }] },
        contents: input.messages.map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        })),
        generationConfig: {
          maxOutputTokens: maxTokens,
          ...(input.json ? { responseMimeType: "application/json" } : {}),
        },
      };
    } else {
      url = "https://api.anthropic.com/v1/messages";
      headers = {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      };
      body = { model, max_tokens: maxTokens, system: input.system, messages: input.messages };
    }
    try {
      const response = await deps.fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok) {
        failures.push(`${provider}: HTTP ${response.status}`);
        await response.body?.cancel();
        continue;
      }
      const result = (await response.json()) as {
        choices?: { message?: { content?: string } }[];
        candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[];
        content?: { type?: string; text?: string }[];
      };
      const text = (
        provider === "groq"
          ? result.choices?.[0]?.message?.content
          : provider === "gemini"
            ? result.candidates?.[0]?.content?.parts
                ?.filter((p) => !p.thought)
                .map((p) => p.text ?? "")
                .join("")
            : result.content
                ?.filter((p) => p.type === "text")
                .map((p) => p.text ?? "")
                .join("")
      )?.trim();
      if (text) return { text, provider, model };
      failures.push(`${provider}: resposta vazia`);
    } catch {
      failures.push(`${provider}: falha de rede, timeout ou resposta inválida`);
    }
  }
  throw new Error(`Nenhum provedor de IA respondeu (${failures.join("; ")}).`);
}
