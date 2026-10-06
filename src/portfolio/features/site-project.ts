export const SITE_PRODUCTS = [
  {
    id: "portfolio",
    name: "Portfólio autoral",
    description: "Seu trabalho, projetos e contato em um endereço próprio.",
  },
  {
    id: "landing",
    name: "Landing page",
    description: "Uma página focada em apresentar e vender uma oferta.",
  },
  {
    id: "institutional",
    name: "Site institucional",
    description: "Sua empresa, serviços e conteúdo em várias páginas.",
  },
  {
    id: "platform",
    name: "Plataforma personalizada",
    description: "Uma experiência com áreas, dados e fluxos próprios.",
  },
] as const;
export const SITE_FEATURES = [
  "Galeria de projetos",
  "Formulário de contato",
  "Conteúdo editável",
  "Agendamento",
  "Área de membros",
  "Agente de IA",
  "Catálogo de produtos",
  "Integrações",
] as const;
export const SITE_DELIVERIES = [
  "Site publicado",
  "Design e desenvolvimento",
  "Evolução de um site existente",
] as const;
export type SiteProject = {
  product: (typeof SITE_PRODUCTS)[number]["id"];
  features: readonly string[];
  delivery: (typeof SITE_DELIVERIES)[number];
  goal: string;
};

/** Only the explicitly chosen scope travels to the contact link; never the portfolio draft. */
export function siteProjectMessage(project: SiteProject) {
  const product = SITE_PRODUCTS.find((item) => item.id === project.product);
  if (!product || !SITE_DELIVERIES.includes(project.delivery)) throw new Error("Projeto inválido.");
  const features = [...new Set(project.features)].filter((item) =>
    (SITE_FEATURES as readonly string[]).includes(item),
  );
  const goal = project.goal
    // Strip controls from the user's one-line scope before building contact links.
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .trim()
    .slice(0, 600);
  return [
    "Olá! Quero uma proposta personalizada da YO LAB & CO. / Veronica Hub.",
    `Produto: ${product.name}`,
    `Entrega: ${project.delivery}`,
    `Recursos: ${features.length ? features.join(", ") : "A definir no diagnóstico"}`,
    goal && `Objetivo: ${goal}`,
    "Gostaria de definir escopo, tecnologias, prazo e investimento antes de contratar.",
    "Vim pelo Veronica Portfolio.",
  ]
    .filter(Boolean)
    .join("\n");
}
