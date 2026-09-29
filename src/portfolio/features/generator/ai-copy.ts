import { createPersonalDraft, parseStoredBrief, serializeBrief, type PersonalBrief } from "./personal-brief.ts";
import type { PortfolioDraft } from "../../types";

export function validateAiBrief(input: unknown): PersonalBrief {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Briefing inválido.");
  const brief = parseStoredBrief(JSON.stringify({ version: 1, brief: input }));
  const base = createPersonalDraft(brief);
  if (!base.about && !base.projects.some((project) => project.description))
    throw new Error("Conte sobre seu trabalho ou descreva ao menos um projeto para a IA criar uma apresentação fiel.");
  serializeBrief(brief);
  return brief;
}

/** Only rewrite the presentation. Project titles, results, contact and credentials stay verbatim. */
export function applyAiCopy(brief: PersonalBrief, reply: string): PortfolioDraft {
  const draft = createPersonalDraft(brief);
  const json = reply.match(/\{[\s\S]*\}/)?.[0];
  if (!json) throw new Error("Resposta incompleta do modelo.");
  const copy: unknown = JSON.parse(json);
  if (!copy || typeof copy !== "object" || Array.isArray(copy)) throw new Error("Resposta inválida do modelo.");
  const { headline, about } = copy as Record<string, unknown>;
  if (typeof headline !== "string" || typeof about !== "string" || !headline.trim() || !about.trim() || headline.length > 180 || about.length > 1600)
    throw new Error("Texto gerado fora dos limites.");
  const source = JSON.stringify({ name: brief.name, profession: brief.profession, about: brief.about, projects: brief.projects, skills: brief.skills, experience: brief.experience, education: brief.education });
  // Do not introduce numerical claims that the visitor did not provide.
  const sourceNumbers = new Set(source.match(/\d+(?:[.,]\d+)?%?/g) ?? []);
  const outputNumbers = `${headline} ${about}`.match(/\d+(?:[.,]\d+)?%?/g) ?? [];
  if (outputNumbers.some((number) => !sourceNumbers.has(number))) throw new Error("A IA introduziu um número não informado.");
  draft.headline = headline.trim();
  draft.about = about.trim();
  return draft;
}
