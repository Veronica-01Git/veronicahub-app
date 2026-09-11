// Fonte canônica de navegação e disponibilidade editorial. Não é telemetria.
export const CATEGORIES = ["Escola", "Formações", "Ferramentas", "Mídia", "Produtos digitais", "Governança", "Projetos especiais"] as const;
export type ProductStatus = "Disponível" | "Parcial" | "Demonstração" | "Em produção" | "Em estruturação" | "Externo";
export type Product = { id: string; name: string; category: typeof CATEGORIES[number]; to: string; status: ProductStatus; description: string; external: boolean; public: boolean };
export const PRODUCTS: Product[] = [
  {
    "id": "school",
    "name": "Veronica Hub",
    "category": "Escola",
    "to": "/",
    "status": "Disponível",
    "description": "Escola de Inteligência Artificial",
    "external": false,
    "public": true
  },
  {
    "id": "formations",
    "name": "Formações",
    "category": "Formações",
    "to": "/comandos",
    "status": "Em produção",
    "description": "Catálogo de formações em preparação",
    "external": false,
    "public": true
  },
  {
    "id": "zero",
    "name": "Aula Zero",
    "category": "Formações",
    "to": "/aula-zero",
    "status": "Disponível",
    "description": "Primeiro projeto guiado de narração com IA",
    "external": false,
    "public": true
  },
  {
    "id": "studio",
    "name": "Studio Criativo",
    "category": "Ferramentas",
    "to": "/video-ia",
    "status": "Parcial",
    "description": "Geração de imagem disponível; vídeo, voz e avatar em desenvolvimento",
    "external": false,
    "public": true
  },
  {
    "id": "analytics",
    "name": "Veronica Analytics",
    "category": "Ferramentas",
    "to": "/veronica-analytics",
    "status": "Demonstração",
    "description": "Calculadora funcional e descoberta de produtos demonstrativa",
    "external": false,
    "public": true
  },
  {
    "id": "security",
    "name": "Veronica Security",
    "category": "Ferramentas",
    "to": "/veronica-security",
    "status": "Disponível",
    "description": "Autoavaliação de segurança e atendimento manual",
    "external": false,
    "public": true
  },
  {
    "id": "career",
    "name": "Currículo-Certo",
    "category": "Ferramentas",
    "to": "/veronica-curriculo-certo",
    "status": "Disponível",
    "description": "Avaliação e preparação de currículo",
    "external": false,
    "public": true
  },
  {
    "id": "rh",
    "name": "Área RH",
    "category": "Ferramentas",
    "to": "/veronica-curriculo-certo-rh",
    "status": "Disponível",
    "description": "Triagem de currículos para recrutamento",
    "external": false,
    "public": true
  },
  {
    "id": "wire",
    "name": "Veronica Wire",
    "category": "Mídia",
    "to": "/blog",
    "status": "Disponível",
    "description": "Notícias com fontes e contexto",
    "external": false,
    "public": true
  },
  {
    "id": "packs",
    "name": "Prompt Packs",
    "category": "Produtos digitais",
    "to": "/prompt-packs",
    "status": "Parcial",
    "description": "Guias de prompts; disponibilidade indicada em cada produto",
    "external": false,
    "public": true
  },
  {
    "id": "universe",
    "name": "Veronica Universe",
    "category": "Governança",
    "to": "/admin/veronica-universe",
    "status": "Parcial",
    "description": "Governança da marca; módulos em desenvolvimento",
    "external": false,
    "public": false
  },
  {
    "id": "rede",
    "name": "Veronica Rede",
    "category": "Projetos especiais",
    "to": "/veronica-rede",
    "status": "Em estruturação",
    "description": "Programa de afiliados em formação",
    "external": false,
    "public": true
  },
  {
    "id": "nautica",
    "name": "Veronica Náutica",
    "category": "Projetos especiais",
    "to": "/veronica-nautica",
    "status": "Em estruturação",
    "description": "Projeto náutico em estruturação",
    "external": false,
    "public": true
  },
  {
    "id": "china",
    "name": "Negócio da China",
    "category": "Projetos especiais",
    "to": "https://negociodachina.veronicahub.com",
    "status": "Externo",
    "description": "Marketplace externo; disponibilidade não monitorada pelo Hub",
    "external": true,
    "public": true
  }
];
export function product(id: string): Product {
  const item = PRODUCTS.find(item => item.id === id);
  if (!item) throw new Error(`Área desconhecida: ${id}`);
  return item;
}
export type IntentId = "learn" | "create" | "sell" | "protect" | "work" | "update";
export const INTENTS: { id: IntentId; label: string; productId: string }[] = [
  { id: "learn", label: "Aprender", productId: "formations" },
  { id: "create", label: "Criar", productId: "studio" },
  { id: "sell", label: "Vender", productId: "analytics" },
  { id: "protect", label: "Proteger", productId: "security" },
  { id: "work", label: "Trabalhar", productId: "career" },
  { id: "update", label: "Me atualizar", productId: "wire" },
];
export const INTENT_LINKS = INTENTS.map(intent => ({ ...intent, name: product(intent.productId).name, tag: product(intent.productId).description, to: product(intent.productId).to }));
export const PRIMARY_NAV = ["formations", "packs", "wire"].map(product);
export const SPECIAL_PROJECTS = PRODUCTS.filter(item => item.category === "Projetos especiais");
export const HOME_PRODUCTS = ["studio", "career", "analytics", "security", "packs", "nautica", "china"].map(product);
