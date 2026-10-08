/**
 * AI WORKFORCE — fonte canônica do que a Veronica opera hoje.
 *
 * POR QUE ESTE ARQUIVO EXISTE. A Home passou a apresentar a Veronica como
 * uma força de trabalho digital: agentes com função, rota, painel e prova.
 * Essa é exatamente a informação que mais tenta virar marketing. Então ela
 * mora num só lugar, tipada, com um campo `prova` obrigatório em todo agente
 * que se declara em operação — e um teste (tests/ai-workforce.test.mjs) que
 * quebra quando alguém promove um agente sem apontar onde a prova está.
 *
 * NÃO DUPLICA DADO QUE JÁ EXISTE. Preço, plano e procedência vivem em
 * `agentes.ts`; rota, categoria e disponibilidade comercial vivem em
 * `ecosystem.ts`; cliente e procedência de entrega vivem em `seals.ts`.
 * Aqui só existe o que não existia em lugar nenhum: o recorte de FORÇA DE
 * TRABALHO — qual trabalho o agente tira das costas de alguém, qual rota ele
 * opera, qual painel administra esse trabalho e o que prova que ele roda.
 * Quando um campo pode ser derivado, ele é derivado (ver `rotaDoAgente`).
 *
 * REGRA DE CLAIM, herdada de whatsapp-rules.ts e agentes.ts: **nada se
 * declara pronto sem prova verificável**. Não existe aqui, e não deve passar
 * a existir, nenhuma afirmação de:
 *   - percentual de operação automatizada ("100% operado por IA");
 *   - pioneirismo ("primeira IA brasileira");
 *   - valuation, faturamento, ROI garantido ou número de clientes;
 *   - métrica de atividade em tempo real que não venha de um endpoint real.
 * O único sinal vivo que a Home consome hoje é o feed público do Wire TV
 * (/api/wire/feed.json), que já existe e é somente leitura. Enquanto não
 * houver /api/agents/status, o estado mostrado é o estado estático declarado
 * abaixo — e ele é verdadeiro.
 */

// Extensão .ts explícita: os testes importam este módulo direto pelo Node,
// sem bundler, como já fazem com agentes.ts e ecosystem.ts.
import { product, type Product } from "./ecosystem.ts";
import type { AgenteId as AgenteComercialId } from "./agentes.ts";
import { sealRecords } from "./seals.ts";

/* ------------------------------------------------------------- estados */

/**
 * Em que estado o agente realmente está. O rótulo é o que a tela mostra; a
 * descrição é o que o rótulo significa, e aparece na própria interface para
 * que ninguém precise adivinhar o que "parcial" quer dizer.
 */
export type EstadoId =
  "producao" | "implantacao" | "parcial" | "demonstracao" | "oferta" | "conceito";

export type Estado = {
  readonly id: EstadoId;
  readonly rotulo: string;
  readonly significa: string;
  /** Agente neste estado pode ser apresentado como algo que já roda? */
  readonly operando: boolean;
};

export const ESTADOS: Record<EstadoId, Estado> = {
  producao: {
    id: "producao",
    rotulo: "Em produção",
    significa: "Roda sozinho hoje e o resultado é público — dá para conferir sem pedir acesso.",
    operando: true,
  },
  implantacao: {
    id: "implantacao",
    rotulo: "Em implantação",
    significa:
      "Cliente real, trabalho em andamento. Parte já opera, parte ainda está sendo ligada.",
    operando: true,
  },
  parcial: {
    id: "parcial",
    rotulo: "Parcial",
    significa: "Uma parte das capacidades funciona hoje; o resto está declarado como pendente.",
    operando: true,
  },
  demonstracao: {
    id: "demonstracao",
    rotulo: "Demonstração",
    significa: "Funciona com dados de demonstração, identificados como tal na própria tela.",
    operando: false,
  },
  oferta: {
    id: "oferta",
    rotulo: "Implantação sob escopo",
    significa: "A capacidade existe; o agente é montado para a empresa, não se contrata num botão.",
    operando: false,
  },
  conceito: {
    id: "conceito",
    rotulo: "Solução possível",
    significa:
      "Desenho de solução. Não é produto existente: é construído sob escopo, a partir de um diagnóstico da operação.",
    operando: false,
  },
};

/* ------------------------------------------------------------- painéis */

/**
 * ROTA → AGENTE → PAINEL → TAREFAS → MÉTRICAS → APROVAÇÕES → LOGS.
 *
 * Essa é a arquitetura alvo. O campo abaixo diz, por agente, o que dela
 * EXISTE hoje. `null` quer dizer que o painel ainda não foi construído — e
 * a Home mostra isso escrito, em vez de desenhar um painel que não abre.
 */
export type Painel = {
  readonly to: string;
  readonly rotulo: string;
  /** Quem entra. Painel restrito não vira link aberto na vitrine. */
  readonly acesso: "cliente" | "interno";
  /** O que o painel administra hoje, de verdade. */
  readonly administra: readonly string[];
};

/* -------------------------------------------------------------- agentes */

export type AgenteWorkforceId =
  | "comercial"
  | "atendimento"
  | "redacao"
  | "estudio"
  | "social-shorts"
  | "analytics"
  | "tutor"
  | "carreira"
  | "seguranca"
  | "consignacao"
  | "portfolio"
  | "fashion"
  | "members"
  | "lz-fitness";

export type EixoDeImpacto = "Receita" | "Conversão" | "Custo" | "Eficiência" | "Ativos" | "Margem";

export type AgenteWorkforce = {
  readonly id: AgenteWorkforceId;
  /** Nome de produto. */
  readonly nome: string;
  /** Uma palavra, para o nó da rede e para o índice da vitrine. */
  readonly curto: string;
  /** Rótulo técnico, em inglês, para a coluna de labels da vitrine. */
  readonly etiqueta: string;
  /**
   * A frase do cliente, não a nossa. É o problema que faz alguém procurar
   * este agente — escrito do ponto de vista de quem tem o problema.
   */
  readonly problema: string;
  /** O que ele faz, em uma linha. */
  readonly funcao: string;
  /** Verbos curtos. O que ele executa. */
  readonly capacidades: readonly string[];
  /** Id do produto em ecosystem.ts — de onde sai rota, categoria e status comercial. */
  readonly produtoId: string;
  /** Id em agentes.ts quando o agente tem catálogo comercial com preço. */
  readonly comercialId?: AgenteComercialId;
  readonly estado: EstadoId;
  /**
   * Onde conferir. Precisa ser verificável por alguém de fora, ou — quando
   * é material de cliente — precisa dizer qual selo registra a entrega.
   * O teste exige este campo preenchido em todo agente com estado operando.
   */
  readonly prova: string;
  /** Selo de procedência, quando a prova é uma entrega registrada. */
  readonly selo?: string;
  readonly painel: Painel | null;
  /** O que ainda não faz. Fica na tela, não escondido. */
  readonly pendencias: readonly string[];
  /**
   * AGENTS GOLD: o eixo de negócio que o agente toca diretamente. A frase usa
   * verbo de desenho ("projetado para", "pode reduzir", "mede") — nunca
   * promessa de retorno. Ausente = o agente não é vendido por impacto direto.
   */
  readonly impacto?: { readonly eixo: EixoDeImpacto; readonly texto: string };
  /** Imagem grande da vitrine. Os arquivos já existem em /images/home/platforms. */
  readonly midia: { readonly base: string; readonly alt: string };
};

export const WORKFORCE: readonly AgenteWorkforce[] = [
  {
    id: "comercial",
    nome: "Veronica Comercial",
    curto: "Comercial",
    etiqueta: "COMMERCIAL OPERATIONS",
    problema: "Um interessado precisa de direção e uma proposta com escopo claro.",
    funcao:
      "Organiza o diagnóstico do visitante e entrega um briefing persistente para revisão da equipe.",
    capacidades: [
      "Qualifica briefing",
      "Organiza perguntas",
      "Registra pedido",
      "Acompanha proposta",
    ],
    produtoId: "commercial",
    estado: "parcial",
    prova:
      "Diagnósticos persistem em /implementar. A fila e as decisões ficam em /admin/comercial; /api/agents/commercial/status mostra contagem real agregada.",
    painel: {
      to: "/admin/comercial",
      rotulo: "Operação Comercial",
      acesso: "interno",
      administra: ["Briefings recebidos", "Escopo e valores", "Decisões auditadas", "Guardian"],
    },
    pendencias: [
      "Proposta e contratação dependem da equipe",
      "Sem envio automático externo ou confirmação de pagamento",
      "Implantação em empresas exige integração e piloto próprios",
    ],
    midia: {
      base: "portfolio",
      alt: "Ambiente de arquitetura digital para planejar uma operação comercial",
    },
  },
  {
    id: "members",
    nome: "Agente Members",
    curto: "Members",
    etiqueta: "COMMUNITY OPERATOR",
    problema: "Uma comunidade precisa de conteúdo útil e de respostas que ajudam a avançar.",
    funcao:
      "Publica exercícios práticos, acolhe perguntas aprovadas e acompanha a atividade real do Members.",
    capacidades: ["Publica exercícios", "Responde perguntas", "Conecta rotas", "Lê atividade"],
    produtoId: "members",
    estado: "parcial",
    prova:
      "A operação pode ser conferida em /membros e no histórico público em /api/agents/members/status. Publicações e respostas têm autoria oficial de IA.",
    painel: {
      to: "/admin/membros",
      rotulo: "Operação Members",
      acesso: "interno",
      administra: [
        "Pausa do agente",
        "Rodada manual",
        "Histórico de execução",
        "Moderação de comentários",
      ],
    },
    pendencias: [
      "Comentários aguardam aprovação da equipe antes da resposta da IA",
      "Sem envio automático de mensagens externas ou promessa de retorno financeiro",
    ],
    impacto: {
      eixo: "Eficiência",
      texto:
        "Mantém uma cadência de conteúdo e ajuda membros a encontrar a próxima ação dentro da Hub.",
    },
    midia: { base: "members", alt: "Comunidade criativa trabalhando em um encontro" },
  },
  {
    id: "lz-fitness",
    nome: "Verônica Wellness",
    curto: "Wellness",
    etiqueta: "FITNESS LAB",
    problema:
      "Um personal independente precisa cuidar dos alunos e manter conteúdo com a própria identidade todos os dias.",
    funcao:
      "Organiza avaliações iniciais e guias educativos personalizados; encaminha a jornada para revisão do profissional autorizado.",
    capacidades: [
      "Organiza avaliações",
      "Personaliza guias educativos",
      "Encaminha revisão profissional",
    ],
    produtoId: "clientes",
    estado: "parcial",
    prova:
      "A vitrine de Agentes Humanos oferece avaliação e guia educativo por regras. Planos individuais são liberados pela equipe autorizada; não há prescrição autônoma por IA.",
    selo: "VH-MEM-2026-000002",
    painel: {
      to: "/clientes/lz-team/painel",
      rotulo: "Laboratório LZ",
      acesso: "cliente",
      administra: ["Casos fornecidos pelo coach", "Condutas esperadas", "Turma e aulas"],
    },
    pendencias: [
      "Conectar o modelo e avaliar respostas contra os casos aprovados",
      "Criar calendário editorial, revisão humana e integração autorizada com o Instagram",
      "Avatar ao vivo e publicação automática ainda não estão ativos",
    ],
    midia: { base: "members", alt: "Pessoas reunidas para compartilhar uma rotina de treinamento" },
  },
  {
    id: "atendimento",
    nome: "Agente de Atendimento",
    curto: "Atendimento",
    etiqueta: "CUSTOMER OPERATIONS",
    problema: "Seu atendimento não deveria parar quando sua equipe sai do escritório.",
    funcao:
      "Atende no WhatsApp da empresa com a tabela de preços dela, qualifica o pedido e chama uma pessoa quando falta informação.",
    capacidades: ["Atende", "Qualifica", "Consulta regra", "Escala para humano", "Registra"],
    produtoId: "agentes",
    comercialId: "whatsapp-empresarial",
    estado: "implantacao",
    // A central da Express roda hoje com DOIS tipos de tela, e a prova diz
    // qual é qual: a sala de teste chama a agente real (testarAgente, mesma
    // guarda de preço, sem caminho para a Meta); atendimento, aprovações e
    // despacho leem `expressOpsMock` até a implantação ligar o número
    // dedicado (ver src/features/express-ops-b/data/queries.ts).
    prova:
      "Na central da Express Entulho, a sala de teste conversa com a agente real — mesma regra, mesma guarda de preço, sem envio para a Meta. Selo de procedência emitido.",
    selo: "VH-AUT-WA-2026-000001",
    painel: {
      to: "/clientes/express-entulho/operacoes",
      rotulo: "Express Operations",
      acesso: "cliente",
      administra: [
        "Sala de teste com a agente real",
        "Regras do agente",
        "Atendimento, aprovações humanas e despacho — interface pronta, dados de demonstração",
      ],
    },
    pendencias: [
      "Atendimento, aprovações e despacho da central ainda exibem dados de demonstração",
      "Número dedicado e novo: o número atual da empresa nunca é migrado",
      "Verificação de negócio na Meta é do dono da empresa, com documentos dela",
    ],
    impacto: {
      eixo: "Conversão",
      texto:
        "Projetado para que nenhum pedido fique sem resposta fora do horário — o lead não espera a equipe voltar.",
    },
    midia: {
      base: "agentes",
      alt: "Profissional conversando por voz com uma assistente digital em uma mesa de trabalho à noite",
    },
  },
  {
    id: "redacao",
    nome: "Agente de Redação",
    curto: "Redação",
    etiqueta: "EDITORIAL OPERATIONS",
    problema: "Uma redação que precisa publicar de hora em hora não dorme — e a sua equipe dorme.",
    funcao:
      "Lê uma rede de fontes, confirma o fato em duas fontes independentes, escreve, ilustra com foto creditada e publica.",
    capacidades: ["Pauta", "Apura", "Escreve", "Ilustra", "Publica", "Audita"],
    produtoId: "wire",
    comercialId: "agente-tv",
    estado: "producao",
    prova:
      "O Wire TV publica no ar, em /blog, com feed público em /api/wire/feed.json e crédito de fotógrafo em cada capa.",
    painel: {
      to: "/admin/wire",
      rotulo: "Desempenho do Wire",
      acesso: "interno",
      administra: [
        "Matérias publicadas, editoria e procedência das fontes",
        "Banco de capas, troca automática e capa escolhida à mão",
        "Guardião que avisa quando a redação para de publicar",
      ],
    },
    pendencias: [
      "Ligar a redação ao site de um veículo é implantação feita por pessoa, ainda não é autosserviço",
      "Postar no Instagram do veículo depende do token da Meta da própria empresa",
    ],
    impacto: {
      eixo: "Eficiência",
      texto:
        "Pode reduzir o custo de manter publicação contínua: pauta, apuração, foto e card saem da mesma esteira.",
    },
    midia: {
      base: "wire",
      alt: "Equipe editorial trabalhando em uma redação durante a madrugada",
    },
  },
  {
    id: "estudio",
    nome: "Agente de Criação",
    curto: "Criação",
    etiqueta: "CREATIVE OPERATIONS",
    problema: "Campanha trava esperando imagem, e imagem trava esperando briefing.",
    funcao:
      "Conduz o briefing junto com quem pede e devolve a imagem pronta, dentro da conta e do saldo do Hub.",
    capacidades: ["Entrevista", "Dirige", "Gera imagem", "Versiona"],
    produtoId: "studio",
    estado: "parcial",
    prova:
      "A geração de imagem funciona hoje em /studio-veronica, com a assistente conduzindo o briefing passo a passo.",
    painel: null,
    pendencias: [
      "Vídeo, voz e avatar ainda em desenvolvimento — a própria página declara",
      "Sem painel administrativo próprio: o histórico fica na conta de quem gerou",
    ],
    midia: { base: "studio", alt: "Direção criativa dentro de um estúdio cinematográfico" },
  },
  {
    id: "social-shorts",
    nome: "Agente Social Shorts",
    curto: "Shorts",
    etiqueta: "SOCIAL CONTENT OPERATIONS",
    problema: "Os vídeos escolhidos ficam espalhados e cada rede exige um novo criativo.",
    funcao:
      "Organiza fontes autorizadas e prepara gancho, capa, legenda, hashtags e convite para a Hub em quatro redes.",
    capacidades: [
      "Organiza fila",
      "Prepara rascunho",
      "Monta capa",
      "Adapta convite",
      "Registra visitas",
    ],
    produtoId: "studio",
    estado: "parcial",
    prova:
      "Fila persistente e preparação editorial em /admin/shorts; estado agregado verificável em /api/agents/social-shorts/status. Edição automática e publicação ainda não estão conectadas.",
    painel: {
      to: "/admin/shorts",
      rotulo: "Banco de Shorts",
      acesso: "interno",
      administra: [
        "Fontes escolhidas",
        "Objetivos e prioridade",
        "Kits das quatro redes",
        "Histórico de preparação",
      ],
    },
    pendencias: [
      "Aquisição autorizada e edição automática de vídeo",
      "Conector de publicação e confirmação por rede",
      "Cadência ainda será definida pelo dono",
    ],
    impacto: {
      eixo: "Conversão",
      texto:
        "Prepara convites para a Hub e mede visitas aos links; conversão e receita dependem de eventos reais.",
    },
    midia: { base: "studio", alt: "Operação de shorts dentro do estúdio criativo da Veronica Hub" },
  },
  {
    id: "analytics",
    nome: "Agente de Analytics",
    curto: "Analytics",
    etiqueta: "COMMERCE INTELLIGENCE",
    problema: "Escolher o que divulgar no escuro custa mais caro do que divulgar errado.",
    funcao:
      "Confere o catálogo habilitado, prioriza ofertas pelo interesse registrado nos links da Hub e prepara sugestões de divulgação rastreáveis.",
    capacidades: [
      "Ranqueia oferta",
      "Recomenda",
      "Monta kit",
      "Rastreia link",
      "Registra evidências",
    ],
    produtoId: "analytics",
    comercialId: "analytics-afiliado",
    estado: "parcial",
    prova:
      "A curadoria e as sugestões publicadas em /veronica-analytics têm execução persistida e histórico em /api/agents/analytics/status. Modelo e regras são identificados. A conciliação financeira permanece humana.",
    painel: {
      to: "/admin/comissoes-shopee",
      rotulo: "Conciliação de comissões",
      acesso: "interno",
      administra: [
        "Importação do relatório oficial de Sub_id",
        "Comissão conciliada por divulgador",
        "Catálogo de produtos habilitados",
      ],
    },
    pendencias: [
      "A venda e a comissão acontecem na Shopee; a confirmação depende do relatório oficial",
      "O repasse bancário ao divulgador é manual e fica registrado por referência",
    ],
    impacto: {
      eixo: "Receita",
      texto:
        "Usa o interesse registrado e a qualidade do cadastro para orientar divulgações; receita depende de vendas elegíveis e comissões confirmadas.",
    },
    midia: { base: "analytics", alt: "Analista estudando produtos e dados de comércio digital" },
  },
  {
    id: "tutor",
    nome: "Veronica Tutor",
    curto: "Tutor",
    etiqueta: "LEARNING OPERATIONS",
    problema: "Curso gravado responde a todo mundo igual. Aluno travado precisa de resposta dele.",
    funcao:
      "Acompanha quem está estudando dentro da Escola e responde sobre o que existe no Hub, sem inventar aula.",
    capacidades: ["Situa", "Explica", "Encaminha", "Acompanha"],
    produtoId: "school",
    estado: "parcial",
    prova:
      "A assistente está montada na Escola, em /escola, com skill própria no registro interno.",
    painel: null,
    pendencias: [
      "Catálogo de formações em produção: a trilha completa ainda está sendo publicada",
      "Sem painel de turma, progresso ou aprovação — o acompanhamento é por conta",
    ],
    midia: {
      base: "school",
      alt: "Grupo aprendendo inteligência artificial em um estúdio de ensino",
    },
  },
  {
    id: "carreira",
    nome: "Agente de Carreira",
    curto: "Carreira",
    etiqueta: "PEOPLE OPERATIONS",
    problema: "Currículo bom é reprovado por um filtro antes de uma pessoa ler.",
    funcao:
      "Lê o currículo, aponta o que o filtro automático derruba e reescreve; do outro lado, tria currículos para quem recruta.",
    capacidades: ["Lê documento", "Avalia", "Reescreve", "Exporta", "Tria para RH"],
    produtoId: "career",
    estado: "parcial",
    prova:
      "As duas pontas existem como rota aberta: a avaliação em /veronica-curriculo-certo e a triagem em /veronica-curriculo-certo-rh.",
    painel: null,
    pendencias: ["Sem painel de vaga, pipeline ou histórico de candidato para a empresa"],
    midia: { base: "career", alt: "Profissional preparando o currículo com orientação" },
  },
  {
    id: "seguranca",
    nome: "Agente de Segurança",
    curto: "Segurança",
    etiqueta: "SECURITY OPERATIONS",
    problema: "Quase ninguém descobre a porta aberta antes de alguém entrar por ela.",
    funcao:
      "Conduz a autoavaliação de segurança da operação digital e organiza o que precisa ser corrigido primeiro.",
    capacidades: ["Questiona", "Classifica risco", "Prioriza", "Encaminha"],
    produtoId: "security",
    estado: "parcial",
    prova: "A autoavaliação é pública e funciona em /veronica-security.",
    painel: null,
    pendencias: [
      "A análise aprofundada e o atendimento seguem manuais, feitos por pessoa",
      "Sem varredura automática, sem monitoramento contínuo e sem painel de incidente",
    ],
    midia: { base: "security", alt: "Especialista analisando a segurança de sistemas digitais" },
  },
  {
    id: "consignacao",
    nome: "Foguete Amarelo",
    curto: "Consignação",
    etiqueta: "SUPPLY OPERATIONS",
    problema:
      "Consignação entre farmácia, distribuidora e indústria vive de planilha, telefone e memória.",
    funcao:
      "Agente desenhado para a cadeia de consignação farmacêutica: acerto, reposição e prestação de contas entre os três elos.",
    capacidades: ["Organiza acerto", "Agenda", "Confere", "Presta contas"],
    produtoId: "foguete",
    estado: "oferta",
    prova:
      "A rota /foguete-amarelo publica o desenho da solução por público. É captação com escopo aberto — não há preço fechado nem cliente em operação declarado.",
    painel: null,
    pendencias: [
      "Nenhuma implantação em operação declarada até aqui",
      "Preço e escopo saem por proposta, não por tabela",
    ],
    impacto: {
      eixo: "Ativos",
      texto:
        "Projetado para dar rastreabilidade ao estoque consignado — o ativo que mais some entre um acerto e outro.",
    },
    midia: {
      base: "clientes",
      alt: "Cliente e consultora planejando juntos um projeto digital",
    },
  },
  {
    id: "portfolio",
    nome: "Agente de Portfólio",
    curto: "Portfólio",
    etiqueta: "PERSONAL BRAND",
    problema: "Trabalho bom que ninguém consegue ver não vira proposta.",
    funcao:
      "Monta um portfólio profissional a partir do que a pessoa já fez, com a primeira geração gratuita.",
    capacidades: ["Entrevista", "Organiza", "Gera página"],
    produtoId: "portfolio",
    estado: "parcial",
    prova: "A primeira geração é pública e gratuita em /portfolio.",
    painel: null,
    pendencias: [
      "Edição, pré-visualização e loja declaradas como marcos seguintes no README do módulo",
    ],
    midia: { base: "portfolio", alt: "Designer organizando o próprio portfólio digital" },
  },
  {
    id: "fashion",
    nome: "Fashion Operator",
    curto: "Fashion",
    etiqueta: "BRAND OPERATIONS",
    problema: "Marca de roupa não trava na criação. Trava em lançar, repor e operar a coleção.",
    funcao:
      "Ambiente de operação de uma marca de moda — criação, coleção e execução no mesmo lugar.",
    capacidades: ["Dirige coleção", "Gera peça", "Organiza lançamento"],
    produtoId: "fashion",
    estado: "demonstracao",
    prova:
      "Ambiente navegável com dados demonstrativos identificados na tela, registrado pelo selo de membro da Veronica Fashion & Co.",
    selo: "VH-MEM-2026-000003",
    painel: {
      to: "/clientes/veronica-fashion-operator/execucao",
      rotulo: "Execução da coleção",
      acesso: "cliente",
      administra: ["Coleção e peças", "Execução do lançamento"],
    },
    pendencias: ["As integrações operacionais da marca seguem em preparação"],
    midia: { base: "fashion", alt: "Designer criando uma peça em um ateliê de moda" },
  },
];

export function agenteWorkforce(id: AgenteWorkforceId): AgenteWorkforce {
  const encontrado = WORKFORCE.find((a) => a.id === id);
  if (!encontrado) throw new Error(`Agente de workforce desconhecido: ${id}`);
  return encontrado;
}

/** Rota operada pelo agente — derivada de ecosystem.ts, nunca redigitada. */
export function rotaDoAgente(a: AgenteWorkforce): Product {
  return product(a.produtoId);
}

export function estadoDoAgente(a: AgenteWorkforce): Estado {
  return ESTADOS[a.estado];
}

/** Os que podem ser apresentados como algo que já roda hoje. */
export const WORKFORCE_OPERANDO = WORKFORCE.filter((a) => ESTADOS[a.estado].operando);

/** Selo citado por um agente, quando existe. Confere contra seals.ts. */
export function seloDoAgente(a: AgenteWorkforce) {
  if (!a.selo) return null;
  return sealRecords.find((s) => s.serial === a.selo) ?? null;
}

/* --------------------------------------------- rotas como operação viva */

/**
 * INSIDE VERONICA — as rotas do Hub lidas como departamentos de uma empresa,
 * e não como páginas soltas. Cada uma aponta os agentes que trabalham nela.
 */
export type Operacao = {
  readonly id: string;
  readonly nome: string;
  readonly etiqueta: string;
  readonly descricao: string;
  readonly produtoId: string;
  readonly agentes: readonly AgenteWorkforceId[];
  /** Painéis administrativos que EXISTEM para esta operação. Vazio é honesto. */
  readonly paineis: readonly { readonly to: string; readonly rotulo: string }[];
};

export const OPERACOES: readonly Operacao[] = [
  {
    id: "wire",
    nome: "Wire TV",
    etiqueta: "EDITORIAL",
    descricao:
      "A redação. Pauta, apuração em duas fontes, edição por regra fixa, capa creditada e publicação.",
    produtoId: "wire",
    agentes: ["redacao"],
    paineis: [
      { to: "/admin/wire", rotulo: "Desempenho" },
      { to: "/admin/artigos", rotulo: "Artigos" },
      { to: "/admin/imagens", rotulo: "Banco de imagens" },
    ],
  },
  {
    id: "school",
    nome: "Escola",
    etiqueta: "LEARNING",
    descricao: "O campus. Aula aberta, formações e a tutora acompanhando quem está estudando.",
    produtoId: "school",
    agentes: ["tutor"],
    paineis: [],
  },
  {
    id: "studio",
    nome: "Studio",
    etiqueta: "CREATIVE",
    descricao: "A produção. Briefing conduzido e imagem gerada dentro da conta de quem pediu.",
    produtoId: "studio",
    agentes: ["estudio", "portfolio"],
    paineis: [],
  },
  {
    id: "analytics",
    nome: "Analytics",
    etiqueta: "COMMERCE",
    descricao: "O comercial. Oferta, kit criativo, link rastreado e comissão conciliada.",
    produtoId: "analytics",
    agentes: ["analytics"],
    paineis: [
      { to: "/admin/comissoes-shopee", rotulo: "Comissões" },
      { to: "/admin/produtos-shopee", rotulo: "Catálogo" },
    ],
  },
  {
    id: "clientes",
    nome: "Client Operations",
    etiqueta: "DELIVERY",
    descricao:
      "A entrega. Cada cliente entra pelo número do selo e encontra o próprio ambiente de operação.",
    produtoId: "clientes",
    agentes: ["atendimento", "fashion", "lz-fitness"],
    paineis: [
      { to: "/clientes/express-entulho/operacoes", rotulo: "Express Operations" },
      { to: "/clientes/lz-team/painel", rotulo: "LZ Team" },
    ],
  },
  {
    id: "members",
    nome: "Members",
    etiqueta: "COMMUNITY",
    descricao: "A comunidade. Acesso por e-mail, novidades e material publicado pela equipe.",
    produtoId: "members",
    agentes: [],
    paineis: [{ to: "/admin/membros", rotulo: "Comunidade" }],
  },
];

/**
 * A arquitetura alvo de painel, escrita uma vez. A Home mostra isso como
 * desenho declarado — e, ao lado, quais etapas já existem em cada operação.
 */
export const CADEIA_DE_PAINEL = [
  "ROTA",
  "AGENTE",
  "PAINEL",
  "TAREFAS",
  "MÉTRICAS",
  "APROVAÇÕES",
  "LOGS",
] as const;

export type EtapaDePainel = (typeof CADEIA_DE_PAINEL)[number];

/**
 * Até onde cada etapa da cadeia chegou, no melhor caso entre as operações:
 *   opera     — existe e lê dado real em ao menos uma operação;
 *   interface — a tela existe, mas hoje roda com dado de demonstração;
 *   desenho   — ainda não foi construída.
 *
 * ROTA, AGENTE e PAINEL operam (rotas públicas, agentes com código em
 * produção, painéis /admin do Wire lendo o banco). MÉTRICAS opera no
 * Desempenho do Wire. TAREFAS, APROVAÇÕES e LOGS existem como interface na
 * central da Express, que lê `expressOpsMock` até a implantação — então
 * ficam como interface, não como operação.
 */
export const ESTAGIO_DA_CADEIA: Record<EtapaDePainel, "opera" | "interface" | "desenho"> = {
  ROTA: "opera",
  AGENTE: "opera",
  PAINEL: "opera",
  TAREFAS: "interface",
  MÉTRICAS: "opera",
  APROVAÇÕES: "interface",
  LOGS: "interface",
};

/* ------------------------------------------------------- enterprise */

/**
 * Departamentos de uma empresa e os agentes que CABERIAM neles.
 *
 * Tudo aqui é conceito, e o tipo obriga a dizer isso: não existe campo de
 * status, porque nada desta lista é produto existente. A tela escreve
 * "solução possível" uma vez, no alto, e repete no rodapé de cada painel.
 * Quando um agente destes virar real, ele sobe para WORKFORCE com prova.
 */
export type Departamento = {
  readonly id: string;
  readonly nome: string;
  readonly dor: string;
  /** Agentes conceituais. Nome curto + o trabalho que ele assumiria. */
  readonly agentes: readonly { readonly nome: string; readonly faz: string }[];
  /** Quando já existe um agente real que encosta neste departamento. */
  readonly jaExiste?: AgenteWorkforceId;
};

export const DEPARTAMENTOS: readonly Departamento[] = [
  {
    id: "vendas",
    nome: "Vendas",
    dor: "Lead esfria no intervalo entre chegar e alguém responder.",
    agentes: [
      { nome: "Sales Agent", faz: "atende, qualifica e devolve o lead pronto para o vendedor" },
      { nome: "Quote Agent", faz: "monta a cotação dentro da matriz de preço aprovada" },
      { nome: "Follow-up Agent", faz: "retoma a conversa parada antes de ela virar perda" },
    ],
    jaExiste: "atendimento",
  },
  {
    id: "operacoes",
    nome: "Operações",
    dor: "O dia da operação é decidido no grito, e o que deu errado ninguém registra.",
    agentes: [
      { nome: "Dispatch Agent", faz: "organiza a fila do dia e avisa quem precisa saber" },
      { nome: "Exception Agent", faz: "separa o que saiu do padrão e pede decisão humana" },
      { nome: "Shift Agent", faz: "fecha o turno com o que foi feito e o que ficou" },
    ],
    jaExiste: "atendimento",
  },
  {
    id: "logistica",
    nome: "Logística",
    dor: "A rota existe na cabeça do motorista mais antigo.",
    agentes: [
      { nome: "Route Agent", faz: "projeta a rota do dia com as restrições reais da frota" },
      { nome: "Fleet Agent", faz: "acompanha disponibilidade de veículo e equipamento" },
      { nome: "Dispatch Agent", faz: "distribui a ordem de serviço e confirma recebimento" },
      { nome: "Exception Agent", faz: "trata atraso, recusa e reagendamento" },
    ],
  },
  {
    id: "producao",
    nome: "Produção",
    dor: "A parada da linha vira relatório depois, nunca aviso antes.",
    agentes: [
      { nome: "Production Agent", faz: "lê o plano de produção e sinaliza desvio de ritmo" },
      { nome: "Quality Agent", faz: "organiza a não conformidade e cobra a tratativa" },
      { nome: "Handover Agent", faz: "passa o turno sem perder contexto" },
    ],
  },
  {
    id: "manutencao",
    nome: "Manutenção",
    dor: "Manutenção corretiva custa o triplo da preventiva que ninguém agendou.",
    agentes: [
      { nome: "Maintenance Agent", faz: "mantém o plano preventivo vivo e cobra a execução" },
      { nome: "Asset Agent", faz: "guarda histórico, peça trocada e custo por ativo" },
    ],
  },
  {
    id: "compras",
    nome: "Compras",
    dor: "Cotação some no e-mail e o preço comparado nunca fica registrado.",
    agentes: [
      { nome: "Procurement Agent", faz: "abre a cotação, organiza as respostas e compara" },
      { nome: "Supplier Agent", faz: "mantém cadastro, prazo e histórico do fornecedor" },
    ],
  },
  {
    id: "atendimento",
    nome: "Atendimento",
    dor: "O cliente repete a mesma história para cada pessoa que atende.",
    agentes: [
      { nome: "Support Agent", faz: "atende, resolve o repetitivo e escala o resto" },
      { nome: "Knowledge Agent", faz: "transforma o que foi resolvido em resposta reaproveitável" },
    ],
    jaExiste: "atendimento",
  },
  {
    id: "dados",
    nome: "Dados",
    dor: "O relatório chega depois que a decisão já foi tomada.",
    agentes: [
      { nome: "Report Agent", faz: "monta o fechamento recorrente sem alguém montar à mão" },
      { nome: "Anomaly Agent", faz: "aponta o número fora da curva no dia em que ele acontece" },
    ],
    jaExiste: "analytics",
  },
  {
    id: "marketing",
    nome: "Marketing",
    dor: "A campanha espera a peça, e a peça espera o briefing.",
    agentes: [
      { nome: "Content Agent", faz: "produz a peça dentro da marca e do que foi aprovado" },
      { nome: "Channel Agent", faz: "adapta a mesma peça para cada canal" },
    ],
    jaExiste: "estudio",
  },
  {
    id: "treinamento",
    nome: "Treinamento",
    dor: "Quem entra aprende olhando quem já estava — e herda o vício junto.",
    agentes: [
      { nome: "Onboarding Agent", faz: "conduz os primeiros dias com o procedimento da casa" },
      { nome: "Procedure Agent", faz: "responde sobre a regra interna com a fonte citada" },
    ],
    jaExiste: "tutor",
  },
  {
    id: "seguranca",
    nome: "Segurança",
    dor: "Acesso de quem já saiu da empresa continua funcionando.",
    agentes: [
      { nome: "Access Agent", faz: "revisa acesso, permissão e desligamento" },
      { nome: "Posture Agent", faz: "mantém a autoavaliação viva em vez de anual" },
    ],
    jaExiste: "seguranca",
  },
];

/* -------------------------------------------------------- verticais */

export type Vertical = {
  readonly id: string;
  readonly nome: string;
  readonly tese: string;
  readonly solucoes: readonly string[];
  /** Rota real do Hub quando a vertical já tem endereço próprio. */
  readonly produtoId?: string;
};

export const VERTICAIS: readonly Vertical[] = [
  {
    id: "transporte",
    nome: "Transporte",
    tese: "A operação acontece na rua; o sistema fica parado no escritório.",
    solucoes: ["Dispatch", "Routing", "Fleet", "Customer Operations", "Documents", "Maintenance"],
  },
  {
    id: "industria",
    nome: "Indústria",
    tese: "Uma fábrica não precisa de uma IA. Precisa de inteligências especializadas, uma por função.",
    solucoes: ["Production", "Maintenance", "Quality", "Procurement", "Logistics"],
  },
  {
    id: "distribuicao",
    nome: "Distribuição",
    tese: "O giro depende de reposição, acerto e prestação de contas entre elos diferentes.",
    solucoes: ["Replenishment", "Consignment", "Billing", "Field Operations"],
  },
  {
    id: "agronegocio",
    nome: "Agronegócio",
    tese: "A janela de decisão é curta e a informação chega por caminhos diferentes.",
    solucoes: ["Field Reporting", "Compliance", "Logistics", "Procurement"],
  },
  {
    id: "portos",
    nome: "Portos",
    tese: "Atraso em porto é documento parado, não navio parado.",
    solucoes: ["Scheduling", "Documentation", "Operations", "Equipment", "Exceptions"],
  },
  {
    id: "marinas",
    nome: "Náutica e Marinas",
    tese: "Vaga, manutenção e proprietário vivem em três planilhas que não se falam.",
    solucoes: ["Bookings", "Berths", "Maintenance", "Customer Service", "Fleet Operations"],
    produtoId: "nautica",
  },
  {
    id: "enterprise",
    nome: "Enterprise",
    tese: "Quanto maior a operação, mais cara fica a função que ninguém consegue padronizar.",
    solucoes: ["Shared Services", "Procurement", "People Operations", "Governance", "Security"],
  },
];

/* --------------------------------------------------- implementações */

/**
 * PRODUÇÃO, PILOTO, DEMONSTRAÇÃO e LABORATÓRIO, mais IMPLANTAÇÃO — que é
 * onde a Express Entulho está de fato: o selo diz "em desenvolvimento" e o
 * agente ainda não atende cliente real pelo número dedicado. Chamar isso de
 * piloto seria dizer que já atende; não atende. Quando atender, sobe para
 * "piloto" aqui e no selo, juntos.
 */
export type TipoDeImplementacao =
  "producao" | "piloto" | "implantacao" | "demonstracao" | "laboratorio";

export const TIPO_DE_IMPLEMENTACAO: Record<TipoDeImplementacao, string> = {
  producao: "Produção",
  piloto: "Piloto",
  implantacao: "Implantação",
  demonstracao: "Demonstração",
  laboratorio: "Laboratório",
};

export type Implementacao = {
  readonly id: string;
  readonly cliente: string;
  readonly tipo: TipoDeImplementacao;
  readonly setor: string;
  readonly oQueFoiEntregue: string;
  /**
   * Selo de procedência da entrega. `null` só quando a implementação é da
   * própria casa — aí não existe cliente para registrar, e a tela diz isso
   * em vez de pendurar o selo de outro cliente no lugar.
   */
  readonly selo: string | null;
  readonly to: string;
  readonly agentes: readonly AgenteWorkforceId[];
};

export const IMPLEMENTACOES: readonly Implementacao[] = [
  {
    id: "express-entulho",
    cliente: "Express Entulho",
    tipo: "implantacao",
    setor: "Locação de caçambas · operação local",
    oQueFoiEntregue:
      "Site público, agente de atendimento com as regras e a tabela da empresa, e uma central de operações: a sala de teste já conversa com a agente real; atendimento, aprovações e despacho mostram dados de demonstração até o número dedicado entrar no ar.",
    selo: "VH-AUT-WA-2026-000001",
    to: "/express-entulho",
    agentes: ["atendimento"],
  },
  {
    id: "lz-team",
    cliente: "LZ Team",
    tipo: "producao",
    setor: "Treinamento esportivo · relacionamento",
    oQueFoiEntregue:
      "Página pública do método, painel seguro para cadastrar alunos e aulas, comunidade privada e laboratório de regras do futuro agente fitness. A automação editorial ainda não está ativa.",
    selo: "VH-MEM-2026-000002",
    to: "/clientes/lz-team",
    agentes: [],
  },
  {
    id: "veronica-fashion",
    cliente: "Veronica Fashion & Co.",
    tipo: "laboratorio",
    setor: "Moda · laboratório criativo",
    oQueFoiEntregue:
      "Ambiente de operação de marca com direção visual própria, usado como laboratório — os dados exibidos são demonstrativos e identificados na tela.",
    selo: "VH-MEM-2026-000003",
    to: "/clientes/veronica-fashion-operator",
    agentes: ["fashion"],
  },
  {
    id: "wire-tv",
    cliente: "Wire TV",
    tipo: "producao",
    setor: "Mídia · operação própria da casa",
    oQueFoiEntregue:
      "A redação automática publicando no ar: pauta, apuração em duas fontes, capa creditada e card social. É a prova aberta do Agente de Redação.",
    // Operação da própria casa: não há cliente, logo não há selo de cliente.
    selo: null,
    to: "/blog",
    agentes: ["redacao"],
  },
];

/* ---------------------------------------------------------- YO LAB */

export const PIPELINE_DO_LAB = [
  {
    etapa: "RESEARCH",
    titulo: "Entender o trabalho",
    texto:
      "Antes do agente existe a função: quem faz hoje, com qual regra e onde a regra não está escrita.",
  },
  {
    etapa: "BUILD",
    titulo: "Construir com guarda",
    texto:
      "O agente nasce com a regra dura por fora — preço, área, limite — para não depender do modelo acertar.",
  },
  {
    etapa: "SIMULATE",
    titulo: "Rodar em sala de teste",
    texto:
      "Sala de teste e modo sombra: o agente responde ao lado da operação antes de responder por ela.",
  },
  {
    etapa: "VALIDATE",
    titulo: "Provar no próprio Hub",
    texto:
      "O que a casa vende, a casa usa. Um agente só vai para cliente depois de operar aqui dentro.",
  },
  {
    etapa: "DEPLOY",
    titulo: "Implantar com painel",
    texto:
      "Entra em operação com painel, aprovação humana e registro — e um selo de procedência emitido.",
  },
] as const;
