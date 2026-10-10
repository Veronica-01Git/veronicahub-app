/**
 * Conteúdo da /veronica-pharma. Mesma regra de procedência do resto do Hub:
 * nenhum resultado de cliente é inventado, nenhuma integração é anunciada
 * antes de existir, e cada automação diz se funciona nesta página ou se
 * entra na implantação.
 *
 * O projeto nasceu com o nome de trabalho "Foguete Amarelo"; o endereço
 * antigo encaminha para cá.
 */

export type Disponibilidade = "agora" | "implantacao";

export const DISPONIBILIDADE: Record<Disponibilidade, string> = {
  agora: "Funciona nesta página",
  implantacao: "Entra na implantação",
};

export type Visao = {
  id: "farmacia" | "rede" | "distribuidora" | "industria";
  rotulo: string;
  titulo: string;
  resumo: string;
  ve: string[];
  decide: string[];
  supply: string[];
  disponibilidade: Disponibilidade;
};

export const VISOES: Visao[] = [
  {
    id: "rede",
    rotulo: "Rede",
    titulo: "Dono e diretoria de rede",
    resumo:
      "A rede inteira numa tela, com o que pede decisão no topo. Cada filial também tem a sua visão.",
    ve: [
      "Consolidado da rede e o recorte de cada filial",
      "Ruptura prevista antes da próxima entrega",
      "Capital parado em excesso e em lote perto de vencer",
    ],
    decide: [
      "Pedidos acima da alçada do gerente",
      "Transferências entre filiais",
      "Troca ou devolução de lote em risco",
    ],
    supply: [
      "Usa o estoque de uma filial antes de comprar para outra",
      "Agrupa a compra por fornecedor e por filial",
      "Sobe para o proprietário só o que passa da alçada",
    ],
    disponibilidade: "agora",
  },
  {
    id: "farmacia",
    rotulo: "Farmácia",
    titulo: "Farmácia independente e gerente de filial",
    resumo: "O pedido chega pronto, com o motivo de cada quantidade. Basta revisar e aprovar.",
    ve: [
      "Itens abaixo do ponto de pedido, com a cobertura em dias",
      "Lotes que vencem antes de vender no ritmo atual",
      "Pedido sugerido por fornecedor, com prazo de entrega considerado",
    ],
    decide: [
      "Aprovar ou ajustar o pedido dentro da sua alçada",
      "Segregar lote vencido",
      "Ação de giro para o que está parado",
    ],
    supply: [
      "Calcula a reposição com venda, saldo, trânsito e prazo",
      "Avisa a validade com antecedência",
      "Mostra a conta de cada número",
    ],
    disponibilidade: "agora",
  },
  {
    id: "distribuidora",
    rotulo: "Distribuidora",
    titulo: "Distribuidora com carteira de farmácias",
    resumo:
      "Com autorização de cada farmácia, a distribuidora enxerga o giro depois da entrega e atende antes da falta.",
    ve: [
      "Giro e ruptura prevista por ponto de venda da carteira",
      "Pedidos sugeridos aguardando aprovação do cliente",
      "Prioridade de visita do representante",
    ],
    decide: [
      "Rota e agenda do time de campo",
      "Condição comercial por cliente",
      "Remanejamento de lote entre clientes, quando o contrato permitir",
    ],
    supply: [
      "Prepara a proposta de reposição para cada farmácia",
      "Separa o que é ruptura do que é excesso",
      "Registra quem aprovou o quê",
    ],
    disponibilidade: "implantacao",
  },
  {
    id: "industria",
    rotulo: "Indústria",
    titulo: "Laboratório e indústria",
    resumo:
      "Giro no ponto de venda, não só o volume vendido à distribuidora — com dados autorizados pelas farmácias.",
    ve: [
      "Giro por região, rede e canal",
      "Chegada de lançamentos na gôndola",
      "Validade na ponta, antes de virar devolução",
    ],
    decide: [
      "Distribuição de lançamentos por demanda real",
      "Programas de consignação e reposição",
      "Ações de giro por região",
    ],
    supply: [
      "Consolida o dado autorizado de várias redes no mesmo formato",
      "Aponta onde o produto falta e onde sobra",
      "Prepara o fechamento do programa para conferência",
    ],
    disponibilidade: "implantacao",
  },
];

export type Automacao = {
  id: string;
  titulo: string;
  como: string;
  valor: string;
  disponibilidade: Disponibilidade;
};

export const AUTOMACOES: Automacao[] = [
  {
    id: "reposicao",
    titulo: "Reposição antecipada",
    como: "Cruza venda, saldo, pedido em trânsito e prazo do fornecedor para pedir antes da falta.",
    valor: "Menos venda perdida por ruptura",
    disponibilidade: "agora",
  },
  {
    id: "transferencia",
    titulo: "Estoque conectado entre filiais",
    como: "Encontra sobra numa loja e falta em outra e prepara a transferência antes de comprar.",
    valor: "Usa o estoque que a rede já pagou",
    disponibilidade: "agora",
  },
  {
    id: "validade",
    titulo: "Controle de validade",
    como: "Projeta quanto do lote vende até vencer e escoa o excedente para a filial que gira mais.",
    valor: "Perda evitada antes de virar baixa",
    disponibilidade: "agora",
  },
  {
    id: "excecao",
    titulo: "Gestão por exceção e alçada",
    como: "Entrega uma lista curta do que pede decisão, com motivo, valor e quem pode aprovar.",
    valor: "O dono decide o que importa",
    disponibilidade: "agora",
  },
  {
    id: "cotacao",
    titulo: "Cotação entre fornecedores",
    como: "Compara o mesmo produto e apresentação por custo final, frete, prazo e pedido mínimo.",
    valor: "Comprar melhor, com comparação conferível",
    disponibilidade: "implantacao",
  },
  {
    id: "recebimento",
    titulo: "Conferência de recebimento",
    como: "Confronta pedido, nota fiscal e o que chegou; destaca quantidade, preço ou item divergente.",
    valor: "Menos conferência manual e erro",
    disponibilidade: "implantacao",
  },
  {
    id: "consignacao",
    titulo: "Acerto de consignação",
    como: "Reconcilia vendido, devolvido e saldo e prepara o fechamento do ciclo para aprovação.",
    valor: "Consignação em escala, rastreável",
    disponibilidade: "implantacao",
  },
  {
    id: "whatsapp",
    titulo: "Aprovação pelo WhatsApp",
    como: "O gestor recebe o alerta e aprova a proposta pelo WhatsApp, com identidade e permissão conferidas.",
    valor: "Decisão sem abrir o painel",
    disponibilidade: "implantacao",
  },
];

export type Fundacao = { id: string; titulo: string; texto: string };

export const FUNDACOES: Fundacao[] = [
  {
    id: "isolamento",
    titulo: "Cada rede no seu ambiente",
    texto: "Dados, preços, contratos e permissões isolados por cliente. Uma rede nunca vê a outra.",
  },
  {
    id: "perfis",
    titulo: "Perfis e alçadas",
    texto:
      "Proprietário, comprador, gerente, representante e administrador, com limite de aprovação por valor, filial e tipo de operação.",
  },
  {
    id: "cadastro",
    titulo: "Cadastro padronizado",
    texto:
      "Produto, apresentação, EAN, unidade, lote e fornecedor no mesmo formato, para comparar filiais e fornecedores.",
  },
  {
    id: "integracao",
    titulo: "Integração em etapas",
    texto:
      "Começa por planilha validada; depois conector com o sistema de gestão da rede e com os fornecedores que derem acesso.",
  },
  {
    id: "registro",
    titulo: "Registro de cada ação",
    texto:
      "Quem sugeriu, quem aprovou, quando e com qual dado. Pedido repetido é barrado antes de sair.",
  },
  {
    id: "frescor",
    titulo: "Dado com data",
    texto:
      "A tela diz quando cada filial foi atualizada pela última vez e qual integração precisa de atenção.",
  },
];

export const PERFIS = [
  "Proprietário",
  "Comprador",
  "Gerente de filial",
  "Representante",
  "Administrador",
];

export type Passo = { titulo: string; texto: string };

export const PASSOS: Passo[] = [
  {
    titulo: "Diagnóstico",
    texto:
      "Você envia 30 dias de venda e o saldo atual, em planilha. Rodamos a análise junto e apontamos o que ela encontrou.",
  },
  {
    titulo: "Piloto",
    texto:
      "Algumas filiais com reposição, validade, transferência e aprovação por alçada, nas regras da sua rede.",
  },
  {
    titulo: "Integração",
    texto:
      "Conector com o sistema de gestão da rede e com os fornecedores que liberarem acesso técnico e comercial.",
  },
  {
    titulo: "Expansão",
    texto:
      "Cotação, conferência de recebimento, consignação e aprovação pelo WhatsApp, na ordem que fizer sentido.",
  },
];

export type Pergunta = { p: string; r: string };

export const PERGUNTAS: Pergunta[] = [
  {
    p: "A Veronica Pharma substitui o meu sistema de gestão?",
    r: "Não. Ela lê o que o sistema já registra — venda, saldo, pedido — e trabalha em cima disso. O sistema de gestão continua sendo onde a nota é emitida e o estoque é baixado.",
  },
  {
    p: "Minha planilha sai do meu computador nesta página?",
    r: "Não. A análise roda no seu navegador; o arquivo não é enviado a servidor nenhum e some quando você fecha a aba. No piloto, os dados passam a ficar no ambiente isolado da sua rede.",
  },
  {
    p: "A IA decide a compra sozinha?",
    r: 'Não. Quantidade, valor e prazo saem de regras fixas e conferíveis, que esta página mostra em "Como calculamos". O agente Veronica Supply explica e prepara; quem aprova é uma pessoa, dentro da alçada definida pela rede.',
  },
  {
    p: "Vocês já têm integração com a minha distribuidora ou com a indústria?",
    r: "Não anunciamos integração antes de ela existir. A Veronica Pharma é independente de laboratórios, distribuidoras e redes; cada fornecedor entra quando houver acesso técnico e acordo comercial. Até lá, a planilha resolve.",
  },
  {
    p: "O agente atende paciente ou faz dispensação?",
    r: "Não. Ele opera a relação entre farmácia, distribuidora e indústria — reposição, validade, transferência e acerto. Dispensação e orientação ao paciente seguem com o farmacêutico responsável.",
  },
  {
    p: "E o Foguete Amarelo?",
    r: "Foi o nome de trabalho do projeto. O endereço antigo continua abrindo esta página.",
  },
  {
    p: "Quanto custa?",
    r: "Depende do número de filiais e das integrações. O piloto é definido a partir do diagnóstico, com proposta sob medida.",
  },
];
