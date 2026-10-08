export const ANALYTICS_AGENT = {
  slug: "analytics-commerce",
  version: "1.0.2",
  name: "Agente de Analytics",
  mission:
    "Transformar o catálogo habilitado em divulgações verificáveis e orientar a operação da Hub com dados reais.",
  cadence: "Uma rodada por hora · até três sugestões · uma chamada de modelo",
  tasks: [
    "Conferir links e informações do catálogo",
    "Priorizar ofertas pelo interesse registrado e pela completude",
    "Preparar sugestões de divulgação com link rastreado",
    "Registrar evidências, falhas e duração da execução",
  ],
  permissions: [
    "Ler produtos habilitados da Hub",
    "Ler contagens agregadas de cliques da própria Hub",
    "Gravar somente sugestões e histórico do próprio agente",
  ],
  limits: [
    "Sem acesso a dados de clientes, contas ou conversas",
    "Não altera preços, produtos, comissões ou repasses",
    "Não publica em redes sociais nem compra produtos",
    "Não trata cliques como vendas nem promete lucro",
  ],
  metrics: [
    "Rodadas concluídas",
    "Produtos conferidos",
    "Links recusados",
    "Sugestões preparadas",
    "Duração da rodada",
    "Uso do modelo ou de regras",
  ],
} as const;
export type AgentOffer = {
  id: string;
  name: string;
  category: string;
  priceLabel: string;
  coverUrl?: string | null;
  affiliateUrl: string;
};
export type Briefing = {
  productId: string;
  reason: string;
  hook: string;
  script: string;
  caption: string;
  mode: "model" | "rules";
};
export function validateCreative(input: unknown): Pick<Briefing, "hook" | "script" | "caption"> {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new Error("INVALID_OUTPUT");
  const v = input as Record<string, unknown>;
  if (Object.keys(v).sort().join(",") !== "caption,hook,script") throw new Error("INVALID_OUTPUT");
  const output = {} as Pick<Briefing, "hook" | "script" | "caption">;
  for (const key of ["hook", "script", "caption"] as const) {
    const text = v[key];
    if (
      typeof text !== "string" ||
      text.trim().length < 15 ||
      text.length > 800 ||
      /[<>\d]|https?:|www\.|\b(?:api[_ -]?key|cron_secret|database_url|garantid|milagre|emagre|cura|depoimento|avaliações|mais vendido|vendidos|desconto|frete gr[aá]tis|lucro|comiss[aã]o|pre[cç]o|humano)\b/i.test(
        text,
      )
    )
      throw new Error("OUTPUT_REVIEW_REQUIRED");
    output[key] = text.trim();
  }
  return output;
}
export function fallbackCreative(): Pick<Briefing, "hook" | "script" | "caption"> {
  return {
    hook: "Antes de escolher, confira os detalhes desta oferta.",
    script:
      "Mostre o anúncio e destaque as informações que você verificou. Se tiver o produto, demonstre seu uso real. Confira condições e disponibilidade na Shopee antes de publicar.",
    caption:
      "Conheça a oferta e confira as condições atuais na Shopee. Link de afiliado: uma compra elegível pode remunerar a Veronica Hub.",
  };
}
