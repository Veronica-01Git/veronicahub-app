import type { PortfolioDraft } from "../../types";

export const BRIEF_STORAGE_KEY = "veronica.portfolio.brief.v1";
export const BRIEF_LIMITS = {
  name: 80,
  profession: 80,
  headline: 180,
  about: 1600,
  skills: 400,
  experience: 1200,
  education: 800,
  contact: 254,
} as const;

export type PersonalBrief = Record<keyof typeof BRIEF_LIMITS, string> & {
  projects: PortfolioDraft["projects"];
};

export const emptyProject = () => ({ title: "", description: "", result: "" });
export const emptyBrief = (): PersonalBrief => ({
  name: "",
  profession: "Designer",
  headline: "",
  about: "",
  skills: "",
  experience: "",
  education: "",
  contact: "",
  projects: [emptyProject()],
});

/** Validate persisted data as untrusted input, without spreading extra keys. */
export function parseStoredBrief(raw: string): PersonalBrief {
  if (raw.length > 20000) throw new Error("Briefing muito grande.");
  const envelope: unknown = JSON.parse(raw);
  if (
    !envelope ||
    typeof envelope !== "object" ||
    !("version" in envelope) ||
    envelope.version !== 1 ||
    !("brief" in envelope)
  )
    throw new Error("Formato de briefing incompatível.");
  const value = envelope.brief;
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Briefing inválido.");
  const result = emptyBrief();
  for (const [key, limit] of Object.entries(BRIEF_LIMITS)) {
    const field = key as keyof typeof BRIEF_LIMITS;
    const text = (value as Record<string, unknown>)[field];
    if (typeof text !== "string" || text.length > limit)
      throw new Error("Campo inválido no briefing.");
    result[field] = text;
  }
  const projects = (value as Record<string, unknown>).projects;
  if (!Array.isArray(projects) || projects.length < 1 || projects.length > 3)
    throw new Error("Projetos inválidos.");
  result.projects = projects.map((project: unknown) => {
    if (!project || typeof project !== "object")
      throw new Error("Projeto inválido.");
    const item = emptyProject();
    for (const [key, limit] of Object.entries({
      title: 120,
      description: 1000,
      result: 400,
    })) {
      const field = key as keyof typeof item;
      const text = (project as Record<string, unknown>)[field];
      if (typeof text !== "string" || text.length > limit)
        throw new Error("Projeto inválido.");
      item[field] = text;
    }
    return item;
  });
  return result;
}

export function serializeBrief(brief: PersonalBrief): string {
  const raw = JSON.stringify({ version: 1, brief });
  parseStoredBrief(raw);
  return raw;
}

export function contactHref(contact: string): string | undefined {
  const email = contact.trim();
  // Contact is an email only, never a user-supplied URL or mailto query.
  return /^[a-zA-Z0-9.!#$%&'*+/=_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9.-]*[a-zA-Z0-9])?\.[a-zA-Z]{2,}$/.test(
    email,
  )
    ? `mailto:${encodeURIComponent(email)}`
    : undefined;
}

/** Assemble only supplied facts. No synthetic jobs, clients, scores or testimonials. */
export function createPersonalDraft(brief: PersonalBrief): PortfolioDraft {
  const safe = parseStoredBrief(serializeBrief(brief));
  const name = safe.name.trim();
  if (!name) throw new Error("Informe seu nome para montar a prévia.");
  if (!safe.profession.trim())
    throw new Error("Informe sua área profissional.");
  if (safe.contact.trim() && !contactHref(safe.contact))
    throw new Error("Informe um e-mail válido ou deixe o contato em branco.");
  if (
    safe.projects.some(
      (p) => !p.title.trim() && (p.description.trim() || p.result.trim()),
    )
  )
    throw new Error("Dê um título ao projeto que você começou a preencher.");
  const skills = [
    ...new Set(
      safe.skills
        .split(/[,;\n]/)
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  ];
  return {
    ownerName: name,
    profession: safe.profession.trim(),
    headline: safe.headline.trim() || `${name} · ${safe.profession.trim()}`,
    about: safe.about.trim(),
    specialties: [],
    skills,
    projects: safe.projects
      .filter((p) => p.title.trim())
      .map((p) => ({
        title: p.title.trim(),
        description: p.description.trim(),
        result: p.result.trim(),
      })),
    experience: safe.experience.trim(),
    education: safe.education.trim(),
    proof: "",
    contact: safe.contact.trim(),
  };
}

export function reviewDraft(draft: PortfolioDraft) {
  return [
    {
      label: "Apresentação",
      complete: Boolean(draft.about),
      hint: "Conte o que você faz, para quem e como trabalha.",
    },
    {
      label: "Competências",
      complete: draft.skills.length > 0,
      hint: "Inclua habilidades que consegue demonstrar.",
    },
    {
      label: "Projetos",
      complete:
        draft.projects.length > 0 &&
        draft.projects.every((p) => Boolean(p.description)),
      hint: "Inclua ao menos um trabalho e explique sua participação.",
    },
    {
      label: "Resultados",
      complete:
        draft.projects.length > 0 &&
        draft.projects.every((p) => Boolean(p.result)),
      hint: "Descreva o resultado observado; use números apenas quando tiver uma fonte.",
    },
    {
      label: "Contato",
      complete: Boolean(contactHref(draft.contact)),
      hint: "Adicione um e-mail profissional para receber oportunidades.",
    },
  ];
}
