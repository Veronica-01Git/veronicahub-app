import { getRuntimeSecret } from "../../runtime-secret.server.ts";
import { createGeminiJsonAdapter } from "./gemini-json.ts";
import { createGroqJsonAdapter } from "./groq-json.ts";
import { ModelRouter, adapterId } from "../model-router.ts";
export async function jsonRoute(
  options: {
    system: string;
    maxTokens: number;
    maxInputChars: number;
    maxOutputChars: number;
    reserveMicros: number;
  },
  deps = { secret: getRuntimeSecret },
) {
  const gemini = await deps.secret("GEMINI_API_KEY");
  const adapter = gemini
    ? createGeminiJsonAdapter({ ...options, key: gemini })
    : createGroqJsonAdapter({ ...options, key: await deps.secret("GROQ_API_KEY") });
  // One provider per reserved task; unknown-cost failures never multiply calls.
  return {
    adapter,
    router: new ModelRouter().register(adapter).setRoute("LLM", [adapterId(adapter)]),
  };
}
