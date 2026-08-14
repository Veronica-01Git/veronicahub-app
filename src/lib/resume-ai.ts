import Anthropic from "@anthropic-ai/sdk";

// Reescrita de redação das linhas de "Experiência Profissional" — a Veronica
// nunca vê o currículo inteiro, só a lista de linhas de conquista já isoladas
// pelo motor determinístico (ver extractExperienceLines em resume-tools.ts).
// Fatos (empresa, cargo, período) não passam por aqui.
const MODEL = "claude-haiku-4-5-20251001";
const MAX_TOKENS = 1000;

const SYSTEM_PROMPT = `
Você é a Veronica, redatora de currículos ATS do Veronica Hub.

Você recebe uma lista numerada de linhas de "Experiência Profissional" já
extraídas de um currículo real. Sua única tarefa é reescrever cada linha pra
ficar mais forte pro ATS — verbo de ação forte no início, direta, sem clichê
("proativo", "dinâmico", "team player") — mantendo exatamente os mesmos
fatos.

REGRAS RÍGIDAS:
1. Nunca invente número, empresa, cargo, data ou resultado que não esteja
   na linha original. Se a linha não tem métrica, não invente uma métrica.
2. Nunca remova um fato que já estava na linha original.
3. Devolva exatamente o mesmo número de linhas, na mesma ordem.
4. Responda só com um JSON: {"lines": ["...", "..."]} — nada antes, nada
   depois, sem markdown.
`.trim();

export async function rewriteExperienceBullets(
  lines: string[],
): Promise<{ ok: true; lines: string[] } | { ok: false; error: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "ANTHROPIC_API_KEY não configurada." };
  }

  try {
    const anthropic = new Anthropic({ apiKey });
    const numbered = lines.map((l, i) => `${i + 1}. ${l}`).join("\n");
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: numbered }],
    });

    const text = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();

    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      return { ok: false, error: "Resposta da Veronica não veio em JSON." };
    }

    const parsed = JSON.parse(match[0]) as { lines?: unknown };
    if (!Array.isArray(parsed.lines) || parsed.lines.length !== lines.length) {
      return { ok: false, error: "Resposta da Veronica não bateu com o número de linhas enviadas." };
    }
    if (!parsed.lines.every((l): l is string => typeof l === "string" && l.trim().length > 0)) {
      return { ok: false, error: "Resposta da Veronica veio com linha vazia ou inválida." };
    }

    return { ok: true, lines: parsed.lines.map((l) => l.trim()) };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Falha ao chamar a Veronica.",
    };
  }
}
