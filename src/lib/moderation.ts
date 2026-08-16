// Checagem rápida de prompt ANTES de chamar o provedor de geração — evita
// gastar a chamada (e o tempo do usuário) num prompt que sabidamente seria
// recusado. Complementa, não substitui, a moderação da própria Higgsfield
// (que roda depois, na imagem já gerada) — ver ARQUITETURA-STUDIO.md § 4.4.
//
// Lista deliberadamente curta e focada na categoria mais grave (menores em
// contexto sexual). Não é um substituto de um serviço de moderação de
// verdade — é a primeira barreira, sem custo e sem chamada externa.
const BLOCKED_PATTERNS: RegExp[] = [
  /\b(child|kid|minor|toddler|little\s*girl|little\s*boy)\b.{0,40}\b(nude|naked|nsfw|sex|porn|explicit)\b/i,
  /\b(nude|naked|nsfw|sex|porn|explicit)\b.{0,40}\b(child|kid|minor|toddler)\b/i,
  /\bcrian[çc]a\b.{0,40}\b(nu[ao]s?|sexual|porn[ôo]?)\b/i,
  /\b(nu[ao]s?|sexual|porn[ôo]?)\b.{0,40}\bcrian[çc]a\b/i,
];

export function precheckPrompt(prompt: string): { ok: true } | { ok: false; error: string } {
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(prompt)) {
      return {
        ok: false,
        error: "Esse prompt não pode ser gerado. Reformule e tente de novo.",
      };
    }
  }
  return { ok: true };
}
