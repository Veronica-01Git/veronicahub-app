import type { ProviderAdapter, RouteResult } from "../model-router.ts";

export const GROQ_FAILURE_CODES = [
  "PROVIDER_UNAVAILABLE",
  "PROVIDER_AUTH",
  "PROVIDER_RATE_LIMIT",
  "INVALID_OUTPUT",
  "OUTPUT_TRUNCATED",
  "INPUT_LIMIT",
  "PROVIDER_TIMEOUT",
  "MODEL_BUDGET_EXHAUSTED",
] as const;
export function groqFailure(error: unknown): string {
  const code = error instanceof Error ? error.message : "";
  return (GROQ_FAILURE_CODES as readonly string[]).includes(code) ? code : "PROVIDER_UNAVAILABLE";
}
export function routeFailure(result: RouteResult<unknown>): string {
  if (!result.ok && result.code === "COST_GUARD_TRIGGERED") return "MODEL_BUDGET_EXHAUSTED";
  if (result.attempts.some((a) => a.outcome === "timeout")) return "PROVIDER_TIMEOUT";
  return result.attempts.find((a) => a.outcome === "error")?.error ?? "PROVIDER_UNAVAILABLE";
}
/** Credential is resolved by the caller for this request, never at build time. */
export function createGroqJsonAdapter(
  options: {
    key: string | undefined;
    system: string;
    maxTokens: number;
    maxInputChars: number;
    maxOutputChars: number;
    reserveMicros: number;
  },
  transport: typeof fetch = (url, init) => globalThis.fetch(url, init),
): ProviderAdapter<string, unknown> {
  return {
    provider: "groq",
    model: "openai/gpt-oss-20b",
    type: "LLM",
    isConfigured: () => !!options.key,
    estimateCostMicros: () => options.reserveMicros,
    describeError: groqFailure,
    async invoke({ input }, signal) {
      if (input.length + options.system.length > options.maxInputChars)
        throw new Error("INPUT_LIMIT");
      const response = await transport("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        signal,
        headers: { "content-type": "application/json", authorization: `Bearer ${options.key}` },
        body: JSON.stringify({
          model: "openai/gpt-oss-20b",
          temperature: 0.3,
          max_completion_tokens: options.maxTokens,
          reasoning_effort: "low",
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: options.system },
            { role: "user", content: input },
          ],
        }),
      });
      if (!response.ok) {
        await response.body?.cancel();
        throw new Error(
          response.status === 401 || response.status === 403
            ? "PROVIDER_AUTH"
            : response.status === 429
              ? "PROVIDER_RATE_LIMIT"
              : "PROVIDER_UNAVAILABLE",
        );
      }
      let data: {
        choices?: { finish_reason?: string; message?: { content?: string } }[];
        usage?: { prompt_tokens?: number; completion_tokens?: number };
      };
      try {
        data = await response.json();
      } catch {
        throw new Error("INVALID_OUTPUT");
      }
      if (data.choices?.[0]?.finish_reason === "length") throw new Error("OUTPUT_TRUNCATED");
      const text = data.choices?.[0]?.message?.content;
      if (typeof text !== "string" || !text || text.length > options.maxOutputChars)
        throw new Error("INVALID_OUTPUT");
      let output: unknown;
      try {
        output = JSON.parse(text);
      } catch {
        throw new Error("INVALID_OUTPUT");
      }
      const u = data.usage;
      const estimated =
        u &&
        Number.isFinite(u.prompt_tokens) &&
        Number.isFinite(u.completion_tokens) &&
        u.prompt_tokens! >= 0 &&
        u.completion_tokens! >= 0
          ? Math.ceil(u.prompt_tokens! * 0.075 + u.completion_tokens! * 0.3)
          : options.reserveMicros;
      return { output, costMicros: null, metadata: { estimatedCostMicros: estimated } };
    },
  };
}
