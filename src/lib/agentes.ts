/**
 * Catálogo dos Agentes de IA — guiados pela Veronica, desenvolvidos pela
 * Yo Lab & co.
 *
 * ESTE ARQUIVO É A ÚNICA FONTE DE VERDADE COMERCIAL DA ROTA /agentes.
 *
 * REGRA DE PROCEDÊNCIA, herdada de whatsapp-rules.ts: **nenhum preço existe
 * sem fonte**. Cada valor abaixo carrega um campo `procedencia`, e a rota
 * mostra o preço de um jeito diferente conforme ele esteja confirmado pelo
 * dono ou ainda seja proposta. A razão é a mesma que já derrubou dezesseis
 * preços do agente da Express Entulho em 19/09: um número errado aqui é um
 * número que a página repete com confiança total para cliente pagante.
 *
 * Os valores atuais são PROPOSTA minha (Claude Code, 20/09/2026), calculados
 * sobre o custo real por conversa, não sobre chute de mercado. Para confirmar,
 * troque `confirmadoPor` e `confirmadoEm` — nada mais precisa mudar, e a
 * marcação de "a confirmar" some sozinha da tela.
 *
 * MOEDA. Tudo em centavos, inteiro, como no resto do Hub (User.balanceCents,
 * wallet-server.ts). Não existe uma segunda moeda de "token" com câmbio
 * próprio: um crédito é um preço em centavos debitado da mesma carteira que
 * o Studio e o Currículo-Certo já usam. Duas moedas seriam dois saldos para
 * conciliar, e o ledger deixaria de fechar com o extrato.
 */

export type Procedencia = {
  /** De onde veio o número. Texto livre, mas nunca vazio. */
  readonly fonte: string;
  /** Quem confirmou. `null` = ainda é proposta, e a tela avisa. */
  readonly confirmadoPor: string | null;
  /** Data da confirmação, ISO curto. `null` junto com confirmadoPor. */
  readonly confirmadoEm: string | null;
};

export function precoConfirmado(p: Procedencia): boolean {
  return Boolean(p.confirmadoPor && p.confirmadoEm);
}

export type AgenteId = "whatsapp-empresarial" | "analytics-afiliado" | "agente-tv";

export type PlanoId = "avulso" | "mensal" | "anual";

export type Plano = {
  readonly id: PlanoId;
  readonly rotulo: string;
  /** O que o cliente leva por esse valor, na língua dele. */
  readonly unidade: string;
  readonly precoCents: number;
  readonly procedencia: Procedencia;
  /** Texto curto de economia, só no anual. */
  readonly economia?: string;
};

export type Agente = {
  readonly id: AgenteId;
  readonly nome: string;
  readonly tagline: string;
  /** Uma frase sobre o trabalho que ele tira das costas do cliente. */
  readonly promessa: string;
  /** Slug da rota-âncora dentro de /agentes. */
  readonly ancora: string;
  readonly guia: "Veronica";
  readonly desenvolvedor: "Yo Lab & co.";
  /**
   * Horas de teste grátis antes de qualquer pagamento. Zero = sem teste.
   * O relógio começa no primeiro uso real, não no cadastro — quem abre a
   * página e fecha não queima o teste.
   */
  readonly testeHoras: number;
  readonly planos: readonly Plano[];
  /** O que o agente FAZ hoje, de verdade. Não é promessa de roadmap. */
  readonly entregas: readonly string[];
  /** O que ainda não existe. Fica na página, não escondido. */
  readonly pendencias: readonly string[];
};

/* --------------------------------------------------------- procedências */

const PROPOSTA_CLAUDE: Procedencia = {
  fonte: "proposta de Claude Code em 20/09/2026, calculada sobre custo de API por conversa",
  confirmadoPor: null,
  confirmadoEm: null,
};

/* -------------------------------------------------------------- agentes */

/**
 * Agente 1 — WhatsApp empresarial.
 *
 * COMO O PREÇO FOI TIRADO. O custo real de uma conversa atendida é de
 * centavos: a cadeia de provedores (whatsapp-provedores.ts) roda Anthropic
 * como principal com `effort: low` e a Groq de reserva, e uma cotação típica
 * da Express Entulho fecha em poucas trocas. O que se vende aqui não é o
 * token — é o atendimento que não dorme e não inventa preço. Por isso a
 * mensalidade ancora em cima do trabalho substituído (um atendente de
 * plantão), não em cima do custo de inferência.
 *
 * O avulso existe pelo motivo oposto: deixar alguém provar com dez conversas
 * sem assinar nada. No mensal, R$ 497 equivalem a ~171 conversas avulsas — a
 * partir daí o plano é mais barato, e é assim que ele deve ser vendido.
 */
const WHATSAPP_EMPRESARIAL: Agente = {
  id: "whatsapp-empresarial",
  nome: "WhatsApp Empresarial",
  tagline: "Atende como o dono atende. E quando não sabe, chama o dono.",
  promessa:
    "Sua agente responde cliente no WhatsApp com os SEUS preços, as SUAS cidades e o SEU jeito — e encaminha para uma pessoa toda vez que não tiver certeza.",
  ancora: "whatsapp",
  guia: "Veronica",
  desenvolvedor: "Yo Lab & co.",
  testeHoras: 6,
  planos: [
    {
      id: "avulso",
      rotulo: "Avulso",
      unidade: "1 conversa atendida do início ao fim",
      precoCents: 290,
      procedencia: PROPOSTA_CLAUDE,
    },
    {
      id: "mensal",
      rotulo: "Mensal",
      unidade: "conversas ilimitadas, 1 número",
      precoCents: 49_700,
      procedencia: PROPOSTA_CLAUDE,
    },
    {
      id: "anual",
      rotulo: "Anual",
      unidade: "conversas ilimitadas, 1 número, 12 meses",
      precoCents: 497_000,
      procedencia: PROPOSTA_CLAUDE,
      economia: "2 meses grátis",
    },
  ],
  entregas: [
    "Responde no seu WhatsApp com a sua tabela de preços, nunca com uma genérica",
    "Guarda de preço: valor que não está na sua matriz não sai da boca dela",
    "Escala para humano quando falta informação, quando o cliente pede desconto ou quando o assunto sai do combinado",
    "Painel com toda conversa, quem respondeu (ela ou você) e por que escalou",
  ],
  pendencias: [
    "Número dedicado e novo — o número atual da empresa nunca é migrado (ver AGENTS.md)",
    "Verificação de negócio na Meta é do dono da empresa, com documentos dela",
  ],
};

/**
 * Agente 2 — Analytics do afiliado.
 *
 * O preço aqui é baixo de propósito: quem paga é afiliado, e afiliado só
 * continua pagando se o kit virar venda. A margem do Hub não está na
 * mensalidade — está na comissão dividida (ver affiliate-products.json,
 * revenueShare) e no volume de gente postando com o Sub_id da casa.
 */
const ANALYTICS_AFILIADO: Agente = {
  id: "analytics-afiliado",
  nome: "Veronica Analytics",
  tagline: "Ofertas reais, interesse registrado e sugestões para o próximo passo.",
  promessa:
    "Confira ofertas habilitadas, receba sugestões de divulgação e acompanhe seus links rastreados. O agente identifica o interesse registrado; vendas e comissões dependem do relatório da Shopee.",
  ancora: "analytics",
  guia: "Veronica",
  desenvolvedor: "Yo Lab & co.",
  testeHoras: 0,
  planos: [
    {
      id: "avulso",
      rotulo: "Avulso",
      unidade: "1 kit criativo completo",
      precoCents: 990,
      procedencia: PROPOSTA_CLAUDE,
    },
    {
      id: "mensal",
      rotulo: "Mensal",
      unidade: "kits ilimitados + acompanhamento",
      precoCents: 9_700,
      procedencia: PROPOSTA_CLAUDE,
    },
    {
      id: "anual",
      rotulo: "Anual",
      unidade: "kits ilimitados + acompanhamento, 12 meses",
      precoCents: 97_000,
      procedencia: PROPOSTA_CLAUDE,
      economia: "2 meses grátis",
    },
  ],
  entregas: [
    "Curadoria horária do catálogo habilitado, com histórico verificável",
    "Sugestões de gancho, roteiro e legenda, com revisão e modo de geração identificado",
    "Link de afiliado carimbado com o seu código e painel de comissão conciliada",
    "Prioriza pelo interesse registrado nos links da Hub e pela completude do cadastro",
  ],
  pendencias: [
    "A venda e a comissão acontecem na Shopee; a confirmação depende da importação do relatório oficial",
    "O repasse bancário ao divulgador é manual e fica registrado por referência no painel admin",
  ],
};

/**
 * Agente 3 — Agente TV, a redação automática.
 *
 * É o Wire TV (veronicahub.com/blog) vendido para o veículo do cliente: a
 * mesma equipe de agentes que publica o Wire de hora em hora — pauta,
 * apuração em duas fontes, editor-chefe por regra, capa única do Pexels e
 * card do Instagram — rodando para o site de uma empresa de notícias.
 *
 * COMO O PREÇO FOI TIRADO. O custo de inferência é quase zero (Groq no plano
 * gratuito, Pexels e Pixabay gratuitos). O que se vende é o trabalho
 * substituído: um redator de plantão, um editor de foto e quem posta nas
 * redes, 24 horas por dia. Por isso a mensalidade ancora nesse trabalho, e o
 * piloto de sete dias existe para o veículo ver a redação publicando no site
 * dele antes de assinar.
 *
 * O QUE NÃO É AUTOSSERVIÇO. A redação roda na infraestrutura da Yo Lab e é
 * ligada ao site do cliente numa implantação feita por pessoa. Isso fica
 * declarado nas pendências e na tela — a página não vende como pronto o que
 * ainda passa por implantação.
 */
const PROPOSTA_TV: Procedencia = {
  fonte:
    "proposta de Claude Code em 27/09/2026, ancorada no trabalho substituído (redator de plantão, editor de foto e social media), não no custo de API",
  confirmadoPor: null,
  confirmadoEm: null,
};

const AGENTE_TV: Agente = {
  id: "agente-tv",
  nome: "Agente TV",
  tagline: "Uma redação que apura, escreve e ilustra. De hora em hora.",
  promessa:
    "Para a sua empresa de notícias: a mesma redação automática que publica o Wire TV, rodando no SEU site — pauta do dia, fato confirmado em duas fontes, capa única e card pronto para o Instagram.",
  ancora: "tv",
  guia: "Veronica",
  desenvolvedor: "Yo Lab & co.",
  testeHoras: 0,
  planos: [
    {
      id: "avulso",
      rotulo: "Piloto",
      unidade: "7 dias no seu site, 1 editoria",
      precoCents: 19_700,
      procedencia: PROPOSTA_TV,
    },
    {
      id: "mensal",
      rotulo: "Mensal",
      unidade: "1 site, até 5 editorias, até 12 matérias por dia",
      precoCents: 99_700,
      procedencia: PROPOSTA_TV,
    },
    {
      id: "anual",
      rotulo: "Anual",
      unidade: "1 site, até 5 editorias, 12 meses",
      precoCents: 997_000,
      procedencia: PROPOSTA_TV,
      economia: "2 meses grátis",
    },
  ],
  entregas: [
    "Pauta do dia a partir de uma rede de fontes, com o fato confirmado em duas fontes independentes",
    "Editor-chefe por regra: barra fato velho, fonte repetida e manchete parecida com outra já publicada",
    "Capa única por matéria (Pexels e Pixabay), com crédito do fotógrafo — nenhuma foto repete",
    "Card do Instagram pronto com a manchete, e um guardião que avisa quando a redação para",
  ],
  pendencias: [
    "A ligação com o site do veículo é feita pela Yo Lab numa implantação — ainda não é autosserviço",
    "Postar no Instagram do veículo depende do token da Meta da própria empresa",
  ],
};

export const AGENTES: readonly Agente[] = [WHATSAPP_EMPRESARIAL, ANALYTICS_AFILIADO, AGENTE_TV];

export function agente(id: AgenteId): Agente {
  const encontrado = AGENTES.find((a) => a.id === id);
  if (!encontrado) throw new Error(`Agente desconhecido: ${id}`);
  return encontrado;
}

export function plano(id: AgenteId, planoId: PlanoId): Plano {
  const encontrado = agente(id).planos.find((p) => p.id === planoId);
  if (!encontrado) throw new Error(`Plano desconhecido: ${id}/${planoId}`);
  return encontrado;
}

/* ------------------------------------------------------ pacotes de saldo */

/**
 * Recargas sugeridas. São depósitos comuns na carteira do Hub — o mesmo
 * saldo que o Studio e o Currículo-Certo gastam.
 *
 * SEM BÔNUS, de propósito. "Pague 100 e leve 120" é decisão comercial do
 * dono e mexe no webhook do Mercado Pago (creditar mais do que entrou),
 * então não entra aqui por conta própria — entraria como número sem fonte,
 * que é exatamente o que esta casa não faz.
 */
export const PACOTES_DE_SALDO: readonly { readonly rotulo: string; readonly valorCents: number }[] =
  [
    { rotulo: "Começar", valorCents: 2_900 },
    { rotulo: "Testar de verdade", valorCents: 9_900 },
    { rotulo: "Rodar o mês", valorCents: 29_900 },
  ];

/* ------------------------------------------------------------- formatação */

export function formatarBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** "6 horas", "1 hora" — usado no selo do teste grátis. */
export function formatarHoras(horas: number): string {
  return horas === 1 ? "1 hora" : `${horas} horas`;
}

/**
 * Quanto falta do teste, em texto curto. Recebe o fim do teste já calculado
 * pelo servidor — o relógio do navegador não decide se alguém ainda tem
 * teste, só desenha o que sobrou.
 */
export function restanteDoTeste(terminaEm: string | Date, agora: Date = new Date()): string {
  const fim = typeof terminaEm === "string" ? new Date(terminaEm) : terminaEm;
  const ms = fim.getTime() - agora.getTime();
  if (ms <= 0) return "teste encerrado";
  const minutos = Math.floor(ms / 60_000);
  const horas = Math.floor(minutos / 60);
  if (horas >= 1) return `${horas}h${String(minutos % 60).padStart(2, "0")} de teste`;
  return `${minutos}min de teste`;
}
