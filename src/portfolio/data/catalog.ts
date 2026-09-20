import type { ArchitecturePackage, ArchitectureProduct } from "../types";

export const ARCHITECTURE_PRODUCTS: ArchitectureProduct[] = [
  {
    name: "UI Portfolio Engine",
    price: "R$ 297",
    description: "Blocos responsivos e temas licenciáveis.",
    category: "interface",
  },
  {
    name: "Design System",
    price: "R$ 397",
    description: "Tokens, estados e componentes sanitizados.",
    category: "interface",
  },
  {
    name: "Portfolio Generator",
    price: "R$ 697",
    description: "Fluxo modular de coleta, geração e preview.",
    category: "intelligence",
  },
  {
    name: "AI Prompt Engine",
    price: "R$ 597",
    description: "Camada licenciável sem prompts centrais da Veronica.",
    category: "intelligence",
  },
  {
    name: "Media Engine",
    price: "R$ 497",
    description: "Contratos para imagem, vídeo e voz.",
    category: "intelligence",
  },
  {
    name: "Database Schema",
    price: "R$ 697",
    description: "Modelo sanitizado para projetos independentes.",
    category: "platform",
  },
  {
    name: "Authentication",
    price: "R$ 797",
    description: "Blueprint desacoplado de identidade e sessão.",
    category: "platform",
  },
  {
    name: "User/Profile System",
    price: "R$ 497",
    description: "Perfis, preferências e permissões de produto.",
    category: "platform",
  },
  {
    name: "Storage Architecture",
    price: "R$ 497",
    description: "Estratégia de mídia e arquivos por adaptador.",
    category: "infrastructure",
  },
  {
    name: "Payments Engine",
    price: "R$ 997",
    description: "Contrato neutro para futura fintech; sem gateway conectado.",
    category: "platform",
  },
  {
    name: "Email Engine",
    price: "R$ 597",
    description: "Eventos e mensagens transacionais por provider.",
    category: "platform",
  },
  {
    name: "Analytics Engine",
    price: "R$ 797",
    description: "Eventos de produto sem dados sensíveis do núcleo.",
    category: "platform",
  },
  {
    name: "Admin Panel",
    price: "R$ 1.497",
    description: "Operação modular com escopos e auditoria.",
    category: "platform",
  },
  {
    name: "AI Orchestrator",
    price: "R$ 1.997",
    description: "Roteamento entre modelos por capacidade.",
    category: "intelligence",
  },
  {
    name: "Licensing Engine",
    price: "R$ 1.497",
    description: "Entitlements para módulos comercializáveis.",
    category: "platform",
  },
  {
    name: "Observability",
    price: "R$ 997",
    description: "Telemetria, falhas e saúde operacional.",
    category: "infrastructure",
  },
  {
    name: "Deployment Architecture",
    price: "R$ 1.497",
    description: "Blueprint de ambientes e entrega contínua.",
    category: "infrastructure",
  },
  {
    name: "Security Core",
    price: "R$ 3.997",
    description: "Edição licenciável e sanitizada; nunca o núcleo privado.",
    category: "infrastructure",
  },
];

export const ARCHITECTURE_PACKAGES: ArchitecturePackage[] = [
  { name: "Developer", price: "R$ 1.997", description: "Base para construir e personalizar." },
  { name: "Startup", price: "R$ 4.997", description: "Produto, dados e operação inicial." },
  { name: "SaaS", price: "R$ 9.900", description: "Arquitetura comercial modular." },
  { name: "White-label", price: "R$ 24.900", description: "Marca, licenciamento e implantação." },
  {
    name: "Enterprise",
    price: "A partir de R$ 49.900",
    description: "Escopo, governança e suporte dedicados.",
  },
];

export const PORTFOLIO_PLANS = [
  {
    name: "Primeira geração",
    price: "R$ 0",
    description: "Gere, navegue e analise uma versão completa.",
    featured: false,
  },
  {
    name: "Edição",
    price: "R$ 29,90",
    description: "Desbloqueio de edição persistente quando o pagamento estiver ativo.",
    featured: false,
  },
  {
    name: "Portfolio Pro",
    price: "R$ 79,90",
    description: "Publicação, domínio e recursos avançados na próxima etapa.",
    featured: true,
  },
];
