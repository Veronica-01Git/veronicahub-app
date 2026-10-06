import { getRuntimeSecret } from "./runtime-secret.server.ts";
import { generateText } from "./text-generation.server.ts";

/** Operator-only probe. No articles, user data or credential values returned. */
export async function handleWireHealth(
  request: Request,
  deps = { secret: getRuntimeSecret, generate: generateText },
): Promise<Response> {
  const secret = await deps.secret("CRON_SECRET");
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`)
    return new Response("unauthorized", { status: 401 });
  if (request.method !== "GET" && request.method !== "POST")
    return new Response("method not allowed", { status: 405, headers: { Allow: "GET, POST" } });
  const headers = { "content-type": "application/json", "cache-control": "no-store" };
  if (request.method === "GET") return Response.json({ revision: "wire-recovery-v2" }, { headers });
  try {
    const result = await deps.generate({
      system: "Responda somente OK.",
      messages: [{ role: "user", content: "Teste de disponibilidade." }],
      maxTokens: 32,
      groqModel: "openai/gpt-oss-20b",
    });
    return Response.json(
      { ok: true, revision: "wire-recovery-v2", provider: result.provider, model: result.model },
      { headers },
    );
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "Falha no provedor." },
      { status: 502, headers },
    );
  }
}
