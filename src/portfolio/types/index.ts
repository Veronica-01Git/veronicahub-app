export type PortfolioSectionId =
  | "hero"
  | "about"
  | "specialties"
  | "skills"
  | "projects"
  | "cases"
  | "experience"
  | "education"
  | "proof"
  | "contact";

export type PreviewDevice = "desktop" | "mobile";

export type PortfolioDraft = {
  ownerName: string;
  profession: string;
  headline: string;
  about: string;
  specialties: string[];
  skills: string[];
  projects: Array<{ title: string; description: string; result: string }>;
  experience: string;
  education: string;
  proof: string;
  contact: string;
};

export type ArchitectureProduct = {
  name: string;
  price: string;
  description: string;
  category: "interface" | "intelligence" | "platform" | "infrastructure";
};

export type ArchitecturePackage = {
  name: string;
  price: string;
  description: string;
};
