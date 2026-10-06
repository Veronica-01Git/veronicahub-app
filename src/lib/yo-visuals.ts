/** Approved campus and short-bob Veronica identity. Image-only mapping. */
const CAMPUS = "/images/yo-campus";
const SCHOOL = "/images/escola";

export function campusImage(name: string, width = 1280) {
  const schoolScenes: Record<string, string> = {
    school: "campus-v2",
    analytics: "grow-v2",
    security: "secure-v2",
    studio: "create-v2",
  };
  if (schoolScenes[name]) return `${SCHOOL}/${schoolScenes[name]}-${width}.webp`;
  return `${CAMPUS}/${name}-${width}.webp`;
}

export function campusSrcSet(name: string) {
  return [640, 1280, 1600].map((width) => `${campusImage(name, width)} ${width}w`).join(", ");
}

const workforceMedia: Record<string, [string, string]> = {
  members: [CAMPUS, "members"],
  agentes: [CAMPUS, "agentes"],
  wire: [CAMPUS, "wire"],
  studio: [SCHOOL, "create-v2"],
  analytics: [SCHOOL, "grow-v2"],
  school: [CAMPUS, "formacoes"],
  career: [CAMPUS, "career"],
  security: [SCHOOL, "secure-v2"],
  clientes: [CAMPUS, "clientes"],
  portfolio: [CAMPUS, "portfolio"],
  fashion: [CAMPUS, "fashion"],
};

export function workforceImage(base: string, width = 1280) {
  const [root, name] = workforceMedia[base] ?? [CAMPUS, "agentes"];
  return `${root}/${name}-${width}.webp`;
}

export function workforceSrcSet(base: string) {
  return [640, 1280, 1600].map((width) => `${workforceImage(base, width)} ${width}w`).join(", ");
}
