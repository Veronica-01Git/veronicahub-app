import type { ProviderAdapter } from "../model-router.ts";
import { groqFailure } from "./groq-json.ts";
export const GEMINI_JSON_MODEL = "gemini-3.5-flash-lite";
// Official standard text rates checked 2026-10-08: USD 0.30 / 2.50 per M tokens.
export function createGeminiJsonAdapter(
  options: {
    key: string | undefined;
    system: string;
    maxTokens: number;
    maxInputChars: number;
    maxOutputChars: number;
  },
  transport: typeof fetch = (url, init) => globalThis.fetch(url, init),
): ProviderAdapter<string, unknown> {
  return {
    provider: "gemini",
    model: GEMINI_JSON_MODEL,
    type: "LLM",
    isConfigured: () => !!options.key,
    estimateCostMicros: ({ input }) =>
      Math.ceil(
        (new TextEncoder().encode(input + options.system).length + 1024) * 0.3 +
          options.maxTokens * 2.5,
      ),
    describeError: groqFailure,
    async invoke({ input }, signal) {
      if (input.length + options.system.length > options.maxInputChars)
        throw new Error("INPUT_LIMIT");
      const response = await transport(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_JSON_MODEL}:generateContent`,
        {
          method: "POST",
          signal,
          headers: { "content-type": "application/json", "x-goog-api-key": options.key ?? "" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: options.system }] },
            contents: [{ role: "user", parts: [{ text: input }] }],
            generationConfig: {
              maxOutputTokens: options.maxTokens,
              responseMimeType: "application/json",
            },
          }),
        },
      );
      if (!response.ok) {
        await response.body?.cancel();
        throw new Error(
          [401, 403].includes(response.status)
            ? "PROVIDER_AUTH"
            : response.status === 429
              ? "PROVIDER_RATE_LIMIT"
              : "PROVIDER_UNAVAILABLE",
        );
      }
      let data: {
        candidates?: {
          finishReason?: string;
          content?: { parts?: { text?: string; thought?: boolean }[] };
        }[];
        usageMetadata?: {
          promptTokenCount?: number;
          candidatesTokenCount?: number;
          thoughtsTokenCount?: number;
        };
      };
      try {
        data = await response.json();
      } catch {
        throw new Error("INVALID_OUTPUT");
      }
      const candidate = data.candidates?.[0];
      if (candidate?.finishReason === "MAX_TOKENS") throw new Error("OUTPUT_TRUNCATED");
      const text = candidate?.content?.parts
        ?.filter((p) => !p.thought)
        .map((p) => p.text ?? "")
        .join("")
        .trim();
      if (!text || text.length > options.maxOutputChars) throw new Error("INVALID_OUTPUT");
      let output: unknown;
      try {
        output = JSON.parse(text);
      } catch {
        throw new Error("INVALID_OUTPUT");
      }
      const u = data.usageMetadata;
      const estimated =
        u && Number.isFinite(u.promptTokenCount) && Number.isFinite(u.candidatesTokenCount)
          ? Math.ceil(
              u.promptTokenCount! * 0.3 +
                (u.candidatesTokenCount! + (u.thoughtsTokenCount ?? 0)) * 2.5,
            )
          : null;
      return { output, costMicros: null, metadata: { estimatedCostMicros: estimated } };
    },
  };
}
