import vfx1 from "@/assets/vfx/pexels-merlin-11308988.jpg.asset.json";
import vfx2 from "@/assets/vfx/pexels-themob000-30895543.jpg.asset.json";
import vfx3 from "@/assets/vfx/pexels-yaroslav-shuraev-7688551.jpg.asset.json";
import vfx4 from "@/assets/vfx/pexels-leo-gilmant-1144880343-30459143.jpg.asset.json";
import vfx5 from "@/assets/vfx/pexels-cottonbro-6153739.jpg.asset.json";
import vfx6 from "@/assets/vfx/pexels-merlin-14268798.jpg.asset.json";

export type Course = {
  slug: string;
  status: "available" | "planned";
  cta: string;
  outcome: string;
  availability: string;
  href?: string;
  title: string;
  tag: string;
  lessons: number;
  hours: string;
  level: "Iniciante" | "Intermediário" | "Avançado";
  featured?: boolean;
  perks: [string, string, string];
  image: string;
};

// Fonte única — usada tanto pelo teaser da home quanto pela grade completa
// em /comandos (ex-"Cursos").
const plannedCourses = [
  { title: "Canais Dark", tag: "Conteúdo", lessons: 32, hours: "6h", level: "Intermediário", featured: true, image: vfx1.url, perks: ["Nichos ocultos que faturam", "Automação com IA", "Monetização YouTube"] },
  { title: "VSL Cinematográfico", tag: "Vídeo", lessons: 24, hours: "5h", level: "Intermediário", image: vfx6.url, perks: ["Roteiro que converte", "Edição cinematográfica", "CapCut + IA"] },
  { title: "Avatar Digital IA", tag: "IA", lessons: 18, hours: "4h", level: "Iniciante", image: vfx4.url, perks: ["Clone da sua voz", "Avatar realista", "Automação total"] },
  { title: "Afiliado", tag: "Vendas", lessons: 28, hours: "5h", level: "Iniciante", image: vfx2.url, perks: ["Primeira comissão", "Funil validado", "Escala orgânica"] },
  { title: "iFood", tag: "Delivery", lessons: 20, hours: "3h", level: "Iniciante", image: vfx3.url, perks: ["Dark kitchen", "Anúncios que vendem", "Escala local"] },
  { title: "Meta Ads", tag: "Tráfego", lessons: 26, hours: "6h", level: "Intermediário", image: vfx2.url, perks: ["Estrutura de campanha", "Escala vertical", "Otimização diária"] },
  { title: "VFX com IA", tag: "IA", lessons: 16, hours: "4h", level: "Avançado", image: vfx5.url, perks: ["Runway + Kling", "Efeitos cinematográficos", "Pipeline pro"] },
  { title: "Copywriting", tag: "Escrita", lessons: 22, hours: "4h", level: "Iniciante", image: vfx6.url, perks: ["Fórmulas que vendem", "IA como parceira", "Portfolio real"] },
  { title: "App no-code", tag: "Dev", lessons: 30, hours: "7h", level: "Intermediário", image: vfx3.url, perks: ["App em 7 dias", "Backend automático", "Publicar nas stores"] },
  { title: "Criar Site", tag: "Dev", lessons: 24, hours: "5h", level: "Iniciante", image: vfx1.url, perks: ["Sem código", "Deploy grátis", "SEO técnico"] },
  { title: "Hacking Ético", tag: "Segurança", lessons: 34, hours: "8h", level: "Avançado", image: vfx5.url, perks: ["Pentesting real", "Bug bounty", "Lab dedicado"] },
];

export const courses: Course[] = plannedCourses.map(course => ({
  ...course,
  level: course.level as Course["level"],
  perks: course.perks as Course["perks"],
  slug: course.title.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
  status: "planned",
  cta: "Em produção",
  outcome: course.perks[0],
  availability: "Em produção — acesso ainda indisponível",
}));
