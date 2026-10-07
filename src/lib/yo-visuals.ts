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

const WORLDS = "/images/yo-worlds";

export function worldImage(name: string, width = 1280) {
  return `${WORLDS}/${name}-${width}.webp`;
}
export function worldSrcSet(name: string) {
  return [640, 1280, 1600].map((width) => `${worldImage(name, width)} ${width}w`).join(", ");
}
function worldScene(base: string, agentId?: string) {
  return agentId === "lz-fitness" ? "wellness" : base;
}
export function workforceImage(base: string, width = 1280, agentId?: string) {
  return worldImage(worldScene(base, agentId), width);
}
export function workforceSrcSet(base: string, agentId?: string) {
  return worldSrcSet(worldScene(base, agentId));
}
const worldDescriptions: Record<string, string> = {
  members: "Salão de convivência com uma instalação suspensa de conexões luminosas.",
  wellness: "Veronica acompanha uma atleta em um laboratório de movimento e biomecânica.",
  agentes: "Humanoide de titânio em um laboratório de robótica e interfaces de voz.",
  wire: "Observatório editorial com um globo luminoso e sinais orbitais.",
  studio: "Estúdio cinematográfico com câmera robotizada e uma escultura de luz.",
  analytics: "Laboratório de inteligência comercial com uma estrutura holográfica de dados.",
  school: "Anfiteatro de aprendizagem com uma instalação tecnológica suspensa.",
  career: "Veronica orienta um profissional em um estúdio de marca pessoal.",
  security: "Anéis cristalinos de proteção em um laboratório de segurança digital.",
  clientes: "Braço robótico organiza componentes em um laboratório industrial.",
  portfolio: "Veronica e uma designer em uma galeria de arquitetura digital.",
  fashion: "Humanoide de alta precisão trabalha em uma peça YO num ateliê têxtil.",
};
export function workforceImageAlt(base: string, agentId?: string) {
  return worldDescriptions[worldScene(base, agentId)] ?? "Ambiente tecnológico da Veronica Hub.";
}
