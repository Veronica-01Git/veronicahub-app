import vfx1 from "@/assets/vfx/pexels-merlin-11308988.jpg.asset.json";
import vfx2 from "@/assets/vfx/pexels-themob000-30895543.jpg.asset.json";
import vfx3 from "@/assets/vfx/pexels-yaroslav-shuraev-7688551.jpg.asset.json";
import vfx4 from "@/assets/vfx/pexels-leo-gilmant-1144880343-30459143.jpg.asset.json";
import vfx5 from "@/assets/vfx/pexels-cottonbro-6153739.jpg.asset.json";
import vfx6 from "@/assets/vfx/pexels-merlin-14268798.jpg.asset.json";

export type CourseStatus = "available" | "in-production" | "coming-soon";

export type Course = {
  slug: string;
  futurePath: `/formacoes/${string}`;
  status: CourseStatus;
  cta: string;
  description: string;
  outcome: string;
  availability: string;
  href?: string;
  title: string;
  tag: string;
  duration: string;
  level: "Iniciante" | "Intermediário" | "Avançado";
  featured?: boolean;
  topics: [string, string, string];
  image: string;
};

// Fonte canônica do catálogo. As rotas futuras já têm endereço estável, mas só
// devem ser criadas e linkadas quando existir conteúdo real para a formação.
const catalog = [
  { title: "Canais Dark", tag: "Conteúdo", level: "Intermediário", featured: true, image: vfx1.url, description: "Planejamento e produção de canais de conteúdo com apoio de inteligência artificial.", outcome: "Estruturar um fluxo de conteúdo para um canal digital.", topics: ["Pesquisa de pauta", "Produção com IA", "Rotina de publicação"] },
  { title: "VSL Cinematográfico", tag: "Vídeo", level: "Intermediário", image: vfx6.url, description: "Construção de vídeos de venda com roteiro, direção visual e ferramentas de IA.", outcome: "Planejar uma VSL do roteiro à edição.", topics: ["Estrutura de roteiro", "Direção visual", "Edição com IA"] },
  { title: "Avatar Digital IA", tag: "IA", level: "Iniciante", image: vfx4.url, description: "Criação responsável de um avatar digital para comunicação e conteúdo.", outcome: "Montar o plano de produção de um avatar digital.", topics: ["Identidade do avatar", "Voz e apresentação", "Fluxo de produção"] },
  { title: "Afiliado", tag: "Vendas", level: "Iniciante", image: vfx2.url, description: "Fundamentos para avaliar, divulgar e acompanhar produtos como afiliado.", outcome: "Organizar uma primeira estratégia de divulgação.", topics: ["Seleção de produto", "Conteúdo e oferta", "Acompanhamento"] },
  { title: "iFood", tag: "Delivery", level: "Iniciante", image: vfx3.url, description: "Organização da presença digital e da operação comercial em delivery.", outcome: "Mapear uma operação de delivery e seus pontos de melhoria.", topics: ["Cardápio e posicionamento", "Operação digital", "Divulgação local"] },
  { title: "Meta Ads", tag: "Tráfego", level: "Intermediário", image: vfx2.url, description: "Fundamentos de planejamento, leitura e otimização de campanhas na Meta.", outcome: "Estruturar um plano de campanha e seus indicadores.", topics: ["Objetivos de campanha", "Criativos e públicos", "Leitura de métricas"] },
  { title: "VFX com IA", tag: "IA", level: "Avançado", image: vfx5.url, description: "Aplicação de ferramentas de IA em fluxos de efeitos visuais.", outcome: "Planejar um fluxo de VFX assistido por IA.", topics: ["Conceito visual", "Geração e composição", "Refino de cenas"] },
  { title: "Copywriting", tag: "Escrita", level: "Iniciante", image: vfx6.url, description: "Escrita clara e persuasiva aplicada a páginas, anúncios e conteúdo.", outcome: "Criar e revisar uma peça de comunicação orientada a objetivo.", topics: ["Mensagem e público", "Estrutura de texto", "Revisão com IA"] },
  { title: "App no-code", tag: "Dev", level: "Intermediário", image: vfx3.url, description: "Planejamento e prototipação de aplicações usando ferramentas sem código.", outcome: "Estruturar um protótipo funcional de aplicação.", topics: ["Escopo do produto", "Fluxos e dados", "Protótipo e validação"] },
  { title: "Criar Site", tag: "Dev", level: "Iniciante", image: vfx1.url, description: "Criação de um site com estrutura, conteúdo, publicação e fundamentos técnicos.", outcome: "Planejar e construir uma primeira versão de site.", topics: ["Arquitetura da página", "Implementação", "Publicação e revisão"] },
  { title: "Hacking Ético", tag: "Segurança", level: "Avançado", image: vfx5.url, description: "Princípios defensivos de segurança digital, análise responsável e prevenção.", outcome: "Reconhecer riscos comuns e organizar medidas de proteção.", topics: ["Fundamentos de segurança", "Análise autorizada", "Correção e prevenção"] },
] as const;

export const courses: Course[] = catalog.map((course) => {
  const slug = course.title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return {
    ...course,
    topics: [...course.topics],
    slug,
    futurePath: `/formacoes/${slug}`,
    status: "in-production",
    cta: "Conteúdo em produção",
    duration: "A definir",
    availability: "Em produção — acesso ainda indisponível",
  };
});
