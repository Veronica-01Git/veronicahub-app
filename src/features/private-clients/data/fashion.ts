import type { WorkspaceContent } from "./types";

/**
 * TODOS os números deste arquivo são DEMONSTRAÇÃO. Nada aqui vem de
 * integração, banco ou ERP. A UI marca cada bloco com o selo "DEMO".
 */

export const fashionWorkspace: WorkspaceContent = {
  operationStatus: {
    label: "Protótipo de apresentação",
    tone: "cyan",
    detail:
      "Ambiente navegável para avaliação. Nenhuma fonte de dados real está conectada — todos os números exibidos são demonstração.",
  },
  mission: {
    title: "Mostrar como a operação de moda ganha caixa com decisão assistida",
    body:
      "Diagnóstico de estoque e margem, sugestão de produção, funil de lojistas e consumidores, coleções e plano de ação — tudo em um só ambiente, com acompanhamento mensal.",
  },
  nextActions: [
    { label: "01", detail: "Validar os módulos com o cliente", state: "current" },
    { label: "02", detail: "Levantar fontes de dados reais (ERP, planilhas, loja)", state: "next" },
    { label: "03", detail: "Selo de membro VH-MEM-2026-000003 emitido", state: "done" },
    { label: "04", detail: "Conectar dados reais — não configurado", state: "blocked" },
  ],
  activity: [
    { when: "Hoje", text: "Protótipo montado para apresentação.", demo: true },
    { when: "Demo", text: "Diagnóstico de caixa simulado sobre os cards de demonstração.", demo: true },
  ],
};

export const moneyMap = {
  cards: [
    { label: "Estoque parado", value: "R$ 184.200", hint: "peças sem venda há 90+ dias" },
    { label: "Margem média", value: "42%", hint: "sobre o preço praticado" },
    { label: "Giro mensal", value: "1,4x", hint: "meta saudável: 2,0x" },
    { label: "Risco de ruptura", value: "7 SKUs", hint: "abaixo do estoque mínimo" },
  ],
  risky: [
    { sku: "VST-014 · Vestido midi", issue: "118 peças paradas", impact: "R$ 23.600 travados" },
    { sku: "CJT-007 · Conjunto linho", issue: "margem 19%", impact: "abaixo do piso" },
    { sku: "BLS-022 · Blusa canelada", issue: "ruptura em 6 dias", impact: "perda estimada R$ 9.800" },
  ],
} as const;

export const production = {
  rows: [
    { piece: "Vestido midi", p: 40, m: 90, g: 70, gg: 30, note: "repor grade central" },
    { piece: "Conjunto linho", p: 20, m: 50, g: 45, gg: 20, note: "revisar preço antes" },
    { piece: "Blusa canelada", p: 60, m: 120, g: 95, gg: 40, note: "prioridade alta" },
  ],
} as const;

export const leads = {
  base: 1000,
  b2b: [
    { stage: "Lojistas na base", value: 420 },
    { stage: "Contato ativo", value: 180 },
    { stage: "Pedido em negociação", value: 64 },
    { stage: "Compra recorrente", value: 22 },
  ],
  b2c: [
    { stage: "Consumidores na base", value: 580 },
    { stage: "Engajados", value: 310 },
    { stage: "Compraram", value: 96 },
    { stage: "Recompra", value: 31 },
  ],
} as const;

export const collections = {
  ideas: [
    { name: "Alto Verão · Linho Cru", pieces: 12, variations: 34, status: "briefing" },
    { name: "Básicos Premium", pieces: 8, variations: 24, status: "em criação" },
    { name: "Festa · Cetim", pieces: 6, variations: 18, status: "histórico" },
  ],
  briefing:
    "Paleta neutra com dois pontos de cor, foco em caimento e tecidos de toque. Grade concentrada em M e G, com peças-âncora de recompra.",
} as const;

export const actionPlan = [
  { action: "Liquidar o vestido midi parado em campanha de 7 dias", impact: "Alto", effort: "Baixo", status: "recomendado" },
  { action: "Recompor preço do conjunto linho (+11%)", impact: "Alto", effort: "Médio", status: "em análise" },
  { action: "Repor blusa canelada antes da ruptura", impact: "Médio", effort: "Baixo", status: "recomendado" },
  { action: "Reativar 180 lojistas sem pedido há 60 dias", impact: "Alto", effort: "Médio", status: "planejado" },
] as const;

export const recurrence = [
  { title: "Diagnóstico mensal", body: "Leitura de estoque, margem e giro com pontos de atenção." },
  { title: "Acompanhamento", body: "Evolução das decisões tomadas e do que ficou parado." },
  { title: "Alertas", body: "Ruptura, encalhe e margem fora do piso, assim que acontecem." },
  { title: "Decisões", body: "Recomendações priorizadas por impacto e esforço." },
] as const;

/** Conversa demonstrativa: respostas derivadas dos próprios cards DEMO. */
export const demoConversation: readonly { ask: string; answer: string }[] = [
  {
    ask: "O que está travando meu caixa?",
    answer:
      "Pelos dados de demonstração desta tela: R$ 184.200 estão parados em peças sem venda há mais de 90 dias, e o vestido midi VST-014 sozinho responde por R$ 23.600. O giro está em 1,4x contra uma meta de 2,0x. Liquidar o midi em campanha curta é a ação de maior impacto e menor esforço do plano.",
  },
  {
    ask: "Qual peça eu produzo primeiro?",
    answer:
      "A blusa canelada BLS-022 — na demonstração ela entra em ruptura em 6 dias, com perda estimada de R$ 9.800. A sugestão de grade é 60 P, 120 M, 95 G e 40 GG.",
  },
  {
    ask: "Como está minha base de leads?",
    answer:
      "A base informada é de aproximadamente 1.000 leads, divididos em 420 lojistas e 580 consumidores nesta demonstração. 180 lojistas estão em contato ativo e 22 já compram de forma recorrente.",
  },
];
