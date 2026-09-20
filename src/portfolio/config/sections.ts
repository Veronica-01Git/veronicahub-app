import type { PortfolioSectionId } from "../types";

export const PORTFOLIO_SECTIONS: Array<{ id: PortfolioSectionId; label: string }> = [
  { id: "hero", label: "Início" },
  { id: "about", label: "Sobre" },
  { id: "specialties", label: "Especialidades" },
  { id: "skills", label: "Competências" },
  { id: "projects", label: "Projetos" },
  { id: "cases", label: "Cases" },
  { id: "experience", label: "Experiência" },
  { id: "education", label: "Formação" },
  { id: "proof", label: "Provas sociais" },
  { id: "contact", label: "Contato" },
];

export const SUPPORTED_PROFESSIONS = [
  "Designer",
  "Desenvolvedor",
  "Arquiteto",
  "Fotógrafo",
  "Videomaker",
  "Social media",
  "Especialista em IA",
  "Consultor",
];
