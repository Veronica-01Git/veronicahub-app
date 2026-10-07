import { getRuntimeSecret } from "../../lib/runtime-secret.server.ts";
import { validateDictation } from "./dictation-core.ts";
const attempts = new Map<string, { count: number; since: number }>();
// Per-worker burst governor. Provider account quotas remain the global limit.
export function allowDictation(key: string, now = Date.now()) {
  for (const [id, entry] of attempts) if (now - entry.since >= 60_000) attempts.delete(id);
  const entry = attempts.get(key) ?? { count: 0, since: now };
  if (entry.count >= 4 || (!attempts.has(key) && attempts.size >= 1024)) return false;
  entry.count++;
  attempts.set(key, entry);
  return true;
}
export async function transcribeDictation(
  data: FormData,
  deps = {
    secret: getRuntimeSecret,
    fetch: (url: string, options: RequestInit) => globalThis.fetch(url, options),
  },
) {
  const { audio, type } = validateDictation(data);
  const key = await deps.secret("GROQ_API_KEY");
  if (!key)
    return {
      ok: false as const,
      error: "A transcrição está indisponível agora. Continue por texto.",
    };
  const body = new FormData();
  const ext = type === "audio/mp4" ? "m4a" : type.split("/")[1];
  body.set("file", audio, `prompt.${ext}`);
  body.set("model", "whisper-large-v3-turbo");
  body.set("language", "pt");
  body.set("response_format", "json");
  body.set("temperature", "0");
  try {
    const response = await deps.fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}` },
      body,
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok)
      return {
        ok: false as const,
        error:
          response.status === 429
            ? "A transcrição atingiu o limite temporário. Aguarde e tente novamente."
            : "Não consegui transcrever. Você pode tentar novamente ou digitar.",
      };
    const result = (await response.json()) as { text?: unknown };
    const text = typeof result.text === "string" ? result.text.trim() : "";
    if (!text)
      return {
        ok: false as const,
        error: "Não identifiquei fala. Grave novamente em um local silencioso.",
      };
    if (text.length > 1600)
      return {
        ok: false as const,
        error: "A transcrição excedeu 1.600 caracteres. Grave um trecho menor.",
      };
    return { ok: true as const, text };
  } catch {
    return {
      ok: false as const,
      error: "A transcrição não respondeu. Sua gravação pode ser tentada novamente.",
    };
  }
}
