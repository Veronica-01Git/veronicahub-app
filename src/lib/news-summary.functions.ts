import { createServerFn } from "@tanstack/react-start";

export type NewsSummaryResult = { ok: true; text: string } | { ok: false; error: string };

export const summarizeNews = createServerFn({ method: "POST" })
  .inputValidator((input: { headline: string; body: string; question: string }) => {
    const headline = String(input?.headline ?? "").slice(0, 300);
    const body = String(input?.body ?? "").slice(0, 12000);
    const question = String(input?.question ?? "").trim().slice(0, 2000);
    if (!body && !question) throw new Error("Envie um texto ou uma pergunta.");
    return { headline, body, question };
  })
  .handler(async ({ data }): Promise<NewsSummaryResult> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) return { ok: false, error: "Recurso de IA não configurado." };

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        reasoning_effort: "low",
        messages: [
          {
            role: "system",
            content:
              "Você é a redação da Wire TV. Responda em português do Brasil, em no máximo 180 palavras. Gere um resumo contextualizado e neutro, baseado apenas na matéria fornecida. Se a pergunta exigir fatos ausentes da matéria, diga isso claramente. Não invente dados.",
          },
          {
            role: "user",
            content: `Matéria: ${data.headline}\n\n${data.body}\n\nPedido do leitor: ${data.question || "Resuma a notícia com contexto."}`,
          },
        ],
      }),
    });

    if (!res.ok) {
      if (res.status === 429) return { ok: false, error: "Muitas solicitações. Tente em instantes." };
      if (res.status === 402) return { ok: false, error: "Créditos de IA esgotados." };
      return { ok: false, error: `Não foi possível gerar o resumo (${res.status}).` };
    }
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = json.choices?.[0]?.message?.content?.trim();
    return text ? { ok: true, text } : { ok: false, error: "Resposta vazia do modelo." };
  });
