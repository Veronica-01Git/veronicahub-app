// ---------------------------------------------------------------------------
// Calculadora de engajamento do TikTok — matemática real sobre os números que
// a própria pessoa informa (sem API do TikTok, sem dado inventado). Mesmo
// espírito do motor do Currículo-Certo: determinístico, roda no navegador.
// ---------------------------------------------------------------------------

export type EngagementInput = {
  followers: number;
  avgLikes: number;
  avgComments: number;
  avgShares: number;
  avgViews: number;
};

export type Tier = "baixa" | "boa" | "otima" | "excelente";

export type Tip = { title: string; detail: string };

export type EngagementResult = {
  erByFollowers: number;
  erByViews: number | null;
  tier: Tier;
  tierLabel: string;
  tips: Tip[];
};

export const TIER_META: Record<Tier, { label: string; range: string }> = {
  baixa: { label: "Abaixo da média", range: "< 2%" },
  boa: { label: "Boa", range: "2% – 6%" },
  otima: { label: "Ótima", range: "6% – 10%" },
  excelente: { label: "Excelente", range: "> 10%" },
};

function tierFor(er: number): Tier {
  if (er < 2) return "baixa";
  if (er < 6) return "boa";
  if (er < 10) return "otima";
  return "excelente";
}

export function calcEngagement(input: EngagementInput): EngagementResult {
  const interactions = input.avgLikes + input.avgComments + input.avgShares;
  const erByFollowers = input.followers > 0 ? (interactions / input.followers) * 100 : 0;
  const erByViews = input.avgViews > 0 ? (interactions / input.avgViews) * 100 : null;
  const tier = tierFor(erByFollowers);

  const commentRatio = interactions > 0 ? input.avgComments / interactions : 0;
  const shareRatio = interactions > 0 ? input.avgShares / interactions : 0;
  const viewToFollowerRatio = input.followers > 0 && input.avgViews > 0 ? input.avgViews / input.followers : null;

  const tips: Tip[] = [];

  if (tier === "baixa") {
    tips.push({
      title: "Prenda a atenção nos 3 primeiros segundos",
      detail: "Vídeos com engajamento baixo costumam perder o espectador logo no início. Abra com o resultado ou a pergunta, não com introdução.",
    });
    tips.push({
      title: "Poste com mais consistência",
      detail: "O algoritmo do TikTok favorece contas ativas. Defina uma frequência realista e mantenha por pelo menos 2-3 semanas antes de reavaliar.",
    });
  }

  if (commentRatio < 0.15) {
    tips.push({
      title: "Puxe conversa nos vídeos",
      detail: "Poucos comentários em relação a curtidas e compartilhamentos. Termine os vídeos com uma pergunta direta ou peça a opinião de quem assiste.",
    });
  }

  if (shareRatio < 0.1) {
    tips.push({
      title: "Crie conteúdo pensado pra ser compartilhado",
      detail: "Listas, comparações de antes/depois e tutoriais rápidos tendem a gerar mais compartilhamentos do que vídeos só de entretenimento.",
    });
  }

  if (viewToFollowerRatio !== null && viewToFollowerRatio < 0.3) {
    tips.push({
      title: "Suas visualizações estão baixas frente aos seguidores",
      detail: "Isso costuma indicar pouco alcance fora da sua base atual. Teste sons e hashtags em alta e publique nos horários de pico do seu público.",
    });
  }

  if (tier === "otima" || tier === "excelente") {
    tips.push({
      title: "Sua taxa de engajamento já está pronta pra converter",
      detail: "Com esse engajamento, o próximo passo é monetizar: comece a testar produtos no TikTok Shop nos vídeos que já performam bem.",
    });
  }

  // Always-on TikTok Shop playbook — the point of the tool.
  tips.push({
    title: "Marque produtos do TikTok Shop nos vídeos de melhor desempenho",
    detail: "Priorize os formatos que já têm engajamento comprovado antes de criar conteúdo novo só para vender.",
  });
  tips.push({
    title: "Faça pelo menos 1 live de vendas por semana",
    detail: "Lives têm alcance orgânico maior no TikTok Shop e permitem mostrar o produto em uso, tirando dúvidas em tempo real.",
  });
  tips.push({
    title: "Ofereça amostra grátis pra criadores afiliados",
    detail: "Criadores menores testando seu produto de graça geram prova social e tráfego qualificado com baixo custo de aquisição.",
  });

  return { erByFollowers, erByViews, tier, tierLabel: TIER_META[tier].label, tips };
}
