import type { Beat } from "./beats";

export type WireOffer = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  cta: string;
  path: string;
};

// Uma oferta própria e coerente por editoria. A matéria continua editorial;
// este bloco aparece depois do texto, com identificação explícita de solução
// Veronica, e nunca altera a apuração ou as fontes da notícia.
export const WIRE_OFFERS: Record<Beat, WireOffer> = {
  ia: {
    id: "formacoes-ia",
    eyebrow: "Aplicação prática · Veronica Hub",
    title: "Aprenda a transformar IA em trabalho real",
    description:
      "Formações guiadas para usar inteligência artificial com método, contexto e projetos aplicáveis.",
    cta: "Conhecer formações",
    path: "/comandos",
  },
  clima: {
    id: "formacoes-pesquisa",
    eyebrow: "Leitura crítica · Veronica Hub",
    title: "Investigue dados e fontes com mais clareza",
    description:
      "Use inteligência artificial para organizar evidências, comparar informações e construir uma análise responsável.",
    cta: "Explorar formações",
    path: "/comandos",
  },
  economia: {
    id: "analytics-economia",
    eyebrow: "Inteligência de mercado · Veronica Hub",
    title: "Transforme sinais econômicos em decisões",
    description:
      "Conheça o Veronica Analytics e acompanhe oportunidades com uma leitura mais estruturada de mercado.",
    cta: "Abrir Veronica Analytics",
    path: "/veronica-analytics",
  },
  geopolitica: {
    id: "formacoes-contexto",
    eyebrow: "Contexto e estratégia · Veronica Hub",
    title: "Continue a investigação com método",
    description:
      "Aprenda a pesquisar, cruzar fontes e usar IA para compreender movimentos globais sem perder o contexto.",
    cta: "Ver formações",
    path: "/comandos",
  },
  mercado: {
    id: "analytics-mercado",
    eyebrow: "Oportunidades · Veronica Hub",
    title: "Do movimento de mercado à próxima oportunidade",
    description:
      "Explore produtos, tendências e sinais comerciais no ambiente demonstrativo do Veronica Analytics.",
    cta: "Explorar oportunidades",
    path: "/veronica-analytics",
  },
};

export function trackedWireOfferHref(
  articleSlug: string,
  placement: "article_end" | "related",
): string {
  const params = new URLSearchParams({ article: articleSlug, placement });
  return `/r/wire?${params.toString()}`;
}
