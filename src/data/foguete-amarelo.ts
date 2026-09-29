/**
 * Conteúdo da landing /foguete-amarelo — Veronica Foguete Amarelo, agente de
 * IA para consignação farmacêutica.
 *
 * Mesma regra de procedência de src/lib/agentes.ts: nenhum número de
 * resultado é inventado aqui. O produto ainda não tem cliente em produção,
 * então a página fala do que o agente FAZ e dos indicadores que ele
 * ACOMPANHA — não de "reduziu X%" sem fonte. Preço fica "sob proposta" até o
 * dono do negócio fechar a tabela.
 */

export type Passo = { titulo: string; desc: string };
export type Publico = { id: string; titulo: string; dor: string; entrega: string[] };
export type Recurso = { titulo: string; desc: string };
export type Indicador = { sigla: string; nome: string; desc: string };
export type Plano = {
  id: string;
  nome: string;
  paraQuem: string;
  inclui: string[];
  destaque?: boolean;
};
export type Pergunta = { p: string; r: string };

export const PASSOS: Passo[] = [
  {
    titulo: "Leitura do sell-out",
    desc: "O agente lê as vendas da farmácia — exportação do ERP, planilha ou foto do relatório — e cruza com o que está consignado em cada loja.",
  },
  {
    titulo: "Sugestão de mix e reposição",
    desc: "Calcula o que girou, o que parou e o que está perto de vencer. Sugere o pedido de reposição e o que deve voltar para a distribuidora.",
  },
  {
    titulo: "Conversa pelo WhatsApp",
    desc: "Manda o resumo para o dono da farmácia ou o comprador no WhatsApp, em português de balcão. Ele aprova, ajusta ou pergunta — o agente responde.",
  },
  {
    titulo: "Acerto de contas",
    desc: "No fechamento do ciclo, gera o acerto: o que foi vendido e deve ser faturado, o que fica, o que volta. Tudo com lote e validade.",
  },
];

export const PUBLICOS: Publico[] = [
  {
    id: "farmacias",
    titulo: "Farmácias independentes",
    dor: "Capital preso em estoque parado e ruptura nos itens que mais giram.",
    entrega: [
      "Recebe mercadoria em consignação e paga só o que vendeu",
      "Alerta de validade antes de virar perda",
      "Pedido de reposição pronto para aprovar no WhatsApp",
    ],
  },
  {
    id: "distribuidoras",
    titulo: "Distribuidoras",
    dor: "Carteira grande de PDVs, pouca visibilidade do que acontece depois da entrega.",
    entrega: [
      "Painel de sell-out por loja e por SKU",
      "Acerto de consignação gerado sem planilha manual",
      "Prioridade de visita do representante por risco de ruptura",
    ],
  },
  {
    id: "industria",
    titulo: "Indústria",
    dor: "Lançamento que não chega na gôndola certa e dado de giro que chega tarde.",
    entrega: [
      "Leitura de giro no ponto de venda, não só no sell-in",
      "Distribuição de lançamentos guiada por demanda real",
      "Relatório por região, rede e canal",
    ],
  },
];

export const RECURSOS: Recurso[] = [
  {
    titulo: "Controle de lote e validade",
    desc: "Cada item consignado carrega lote e vencimento. O agente avisa com antecedência e sugere remanejar para a loja que gira mais.",
  },
  {
    titulo: "Curva ABC por loja",
    desc: "O mix de cada farmácia é calculado com o que ela vende, não com a média da rede.",
  },
  {
    titulo: "Atendimento no WhatsApp",
    desc: "O comprador fala com o agente como fala com o representante. Sem aplicativo novo, sem senha nova.",
  },
  {
    titulo: "Acerto automático",
    desc: "Fechamento do ciclo com vendido, remanescente e devolução — pronto para faturar e conferir.",
  },
  {
    titulo: "Não inventa preço",
    desc: "Preço, condição e prazo vêm da tabela que você cadastra. Se não estiver lá, o agente diz que vai confirmar — não chuta.",
  },
  {
    titulo: "Humano no comando",
    desc: "Pedido, devolução e acerto passam pela aprovação de uma pessoa. O agente prepara; quem decide é você.",
  },
];

export const INDICADORES: Indicador[] = [
  {
    sigla: "GIRO",
    nome: "Giro por SKU",
    desc: "Quantas vezes cada item vendeu no ciclo, loja a loja.",
  },
  {
    sigla: "RUPT",
    nome: "Ruptura",
    desc: "Itens que zeraram na gôndola enquanto ainda havia demanda.",
  },
  {
    sigla: "VAL",
    nome: "Risco de validade",
    desc: "Unidades a menos de 90 dias do vencimento e sem giro para escoar.",
  },
  {
    sigla: "DEV",
    nome: "Devolução",
    desc: "O que volta para a distribuidora no acerto — e por quê.",
  },
];

export const PLANOS: Plano[] = [
  {
    id: "piloto",
    nome: "Piloto",
    paraQuem: "Uma farmácia ou uma pequena rede testando o modelo",
    inclui: [
      "Até 1 CNPJ de farmácia",
      "Leitura de sell-out por planilha ou foto",
      "Resumo semanal no WhatsApp",
      "Acerto de consignação mensal",
    ],
  },
  {
    id: "distribuidora",
    nome: "Distribuidora",
    paraQuem: "Distribuidora com carteira de farmácias em consignação",
    inclui: [
      "Vários PDVs no mesmo painel",
      "Integração com o ERP da distribuidora",
      "Agente atendendo os compradores das farmácias",
      "Prioridade de visita para o time de campo",
    ],
    destaque: true,
  },
  {
    id: "industria",
    nome: "Indústria",
    paraQuem: "Laboratório ou marca com programa próprio de consignação",
    inclui: [
      "Programa desenhado com a sua regra comercial",
      "Relatórios por região, rede e canal",
      "Implantação acompanhada pela Yo Lab & co.",
      "Ambiente dedicado",
    ],
  },
];

export const PERGUNTAS: Pergunta[] = [
  {
    p: "O que é consignação farmacêutica?",
    r: "A farmácia recebe o produto sem pagar na entrega e acerta só o que vendeu ao fim de um ciclo combinado. O que não girou volta ou é remanejado. Isso libera capital da farmácia e coloca produto na gôndola mais rápido.",
  },
  {
    p: "Isso é o programa da Cimed?",
    r: "Não. O Veronica Foguete Amarelo é um produto independente da Yo Lab & co., inspirado no modelo de consignação inteligente que ficou conhecido no varejo farmacêutico. Não há vínculo, parceria ou endosso da Cimed ou de qualquer indústria citada.",
  },
  {
    p: "Preciso trocar meu sistema?",
    r: "Não. O agente começa lendo o que você já tem: exportação do ERP, planilha ou até foto de relatório. A integração direta com o ERP entra quando o volume justificar.",
  },
  {
    p: "O agente vende medicamento para o consumidor final?",
    r: "Não. Ele opera entre farmácia, distribuidora e indústria — reposição, validade e acerto. Não faz dispensação, não orienta paciente e não substitui o farmacêutico responsável.",
  },
  {
    p: "E se o agente errar um pedido?",
    r: "Nenhum pedido, devolução ou acerto sai sem aprovação de uma pessoa. O agente prepara a sugestão e mostra de onde tirou cada número; quem confirma é o comprador ou o gestor.",
  },
  {
    p: "Quanto custa?",
    r: "A tabela ainda está sendo fechada e depende do número de lojas e do nível de integração. Por enquanto trabalhamos com proposta sob medida — fale com a gente pelo WhatsApp.",
  },
];
