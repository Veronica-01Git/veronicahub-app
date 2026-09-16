/**
 * Express Operations — contratos de dados da demonstração.
 *
 * Regra de honestidade comercial: onde a Express Entulho ainda não cadastrou
 * a informação, o campo NÃO recebe um número inventado. Ele carrega o
 * sentinela `AwaitingSetup` e a UI renderiza "Aguardando cadastro".
 */

export type AwaitingSetup = {
  readonly status: "aguardando-cadastro";
  /** Frase curta que explica ao cliente o que falta. Aparece na UI. */
  readonly motivo?: string;
};

export type Maybe<T> = T | AwaitingSetup;

export const awaiting = (motivo?: string): AwaitingSetup => ({
  status: "aguardando-cadastro",
  motivo,
});

export function isAwaiting<T>(value: Maybe<T>): value is AwaitingSetup {
  return (
    typeof value === "object" &&
    value !== null &&
    "status" in value &&
    (value as AwaitingSetup).status === "aguardando-cadastro"
  );
}

/** Estreita `Maybe<T>` para `T`. Só chamar depois de `isAwaiting` dar falso. */
export function present<T>(value: Maybe<T>): T {
  return value as T;
}

/* ------------------------------------------------------------------ KPIs */

export type KpiFormat = "inteiro" | "duracao-min" | "moeda";

export type Kpi = {
  readonly id: string;
  readonly label: string;
  readonly value: Maybe<number>;
  readonly format: KpiFormat;
  /** Variação percentual vs. ontem. Negativo é queda. */
  readonly deltaPct: Maybe<number>;
  /** Sentido bom da variação — SLA que cai é bom, conversa que cai não é. */
  readonly deltaBoaDirecao: "sobe" | "desce";
  readonly serie: Maybe<readonly number[]>;
};

/* ------------------------------------------------- Operações e logística */

/**
 * Troca é uma operação de verdade, não entrega + retirada: uma visita só,
 * leva a vazia e traz a cheia. Aparece o tempo todo na operação real.
 */
export type OperacaoTipo = "entrega" | "retirada" | "troca";

/**
 * Rótulo por tipo. É `Record` e não ternário de propósito: acrescentar um
 * quarto tipo passa a quebrar o build em vez de renderizar o rótulo errado —
 * foi exatamente o que aconteceu quando "troca" entrou e virou "Retirada".
 */
export const ROTULO_OPERACAO: Record<OperacaoTipo, string> = {
  entrega: "Entrega",
  retirada: "Retirada",
  troca: "Troca",
};

export type OperacaoEstado = "agendada" | "a-caminho" | "no-local" | "concluida" | "atrasada";

export type EtapaOperacao = {
  readonly rotulo: string;
  readonly hora: string | null;
  readonly concluida: boolean;
};

export type Operacao = {
  readonly id: string;
  readonly hora: string;
  readonly tipo: OperacaoTipo;
  readonly cliente: string;
  readonly endereco: string;
  readonly bairro: string;
  readonly motorista: string;
  readonly veiculo: string;
  readonly placa: string;
  readonly cacamba: string;
  readonly estado: OperacaoEstado;
  readonly atrasoMin: number | null;
  readonly etapas: readonly EtapaOperacao[];
  readonly comprovantes: readonly string[];
};

export type ProgressoDia = {
  readonly concluidas: number;
  readonly emRota: number;
  readonly pendentes: number;
  readonly atrasadas: number;
};

/* ------------------------------------------------------- Frota e caçambas */

export type CacambaEstado =
  | "disponivel"
  | "reservada"
  | "em-transito"
  | "instalada"
  | "aguardando-retirada"
  | "descarregada";

export type Cacamba = {
  readonly id: string;
  readonly tipo: "tambor" | "cacamba-menor";
  readonly capacidadeM3: number;
  readonly estado: CacambaEstado;
  readonly cliente: string | null;
  readonly endereco: string | null;
  /** Dias já corridos e contratados. Ausente quando não está instalada. */
  readonly prazo: { readonly decorridoDias: number; readonly contratadoDias: number } | null;
};

/**
 * Só veículos. A contagem por estado das caçambas é DERIVADA do inventário
 * (`cacambas`), nunca digitada duas vezes — duas fontes divergiriam.
 */
export type Frota = {
  readonly veiculosEmOperacao: number;
  readonly veiculosTotal: number;
};

/* -------------------------------------------------------------- Aprovações */

export type AprovacaoTipo = "desconto" | "prazo" | "cancelamento";

export type Aprovacao = {
  readonly id: string;
  readonly tipo: AprovacaoTipo;
  readonly cliente: string;
  readonly pedidoDoCliente: string;
  readonly propostaDaIa: string;
  readonly regraVioloda: string;
  readonly valorEmJogo: Maybe<number>;
  readonly aguardandoMin: number;
};

export type DecisaoRegistrada = {
  readonly id: string;
  readonly resumo: string;
  readonly decisao: "aprovado" | "ajustado" | "recusado";
  readonly quem: string;
  readonly quando: string;
};

/* ------------------------------------------------------------ Atendimento */

export type ConversaEstado = "ia-respondendo" | "aguardando-humano" | "resolvida";

export type Autor = "cliente" | "ia" | "humano";

export type Mensagem = {
  readonly id: string;
  readonly autor: Autor;
  readonly texto: string;
  readonly hora: string;
  /** Nome do atendente, quando `autor === "humano"`. */
  readonly assinatura?: string;
};

export type ContextoCliente = {
  readonly endereco: string;
  readonly historico: readonly { readonly data: string; readonly resumo: string }[];
  readonly cacambaInstalada: Maybe<{
    readonly id: string;
    readonly decorridoDias: number;
    readonly contratadoDias: number;
  }>;
  readonly escalonamento: {
    readonly motivo: string;
    readonly foraDaAlcada: readonly string[];
  } | null;
};

export type Conversa = {
  readonly id: string;
  readonly cliente: string;
  readonly telefone: string;
  readonly previa: string;
  readonly quandoRel: string;
  readonly estado: ConversaEstado;
  readonly slaEstourando: boolean;
  /** Janela de 24h da Meta aberta? Fechada trava resposta livre. */
  readonly janela24hAberta: boolean;
  readonly naoLidas: number;
  readonly mensagens: readonly Mensagem[];
  readonly contexto: ContextoCliente;
};

/* --------------------------------------------------- Rotas, agenda, caixa */

export type ParadaRota = {
  readonly hora: string;
  readonly motorista: string;
  readonly veiculo: string;
  readonly placa: string;
  readonly destino: string;
  readonly tipo: OperacaoTipo;
};

export type ResumoFinanceiro = {
  readonly pedidosPeloAgente: number;
  readonly pagamentosAprovados: Maybe<number>;
  readonly pendentesConclusao: number;
  readonly documentosResiduos: Maybe<{ readonly emitidos: number; readonly pendentes: number }>;
};

export type AgendaAmanha = {
  readonly operacoes: number;
  readonly conflitos: readonly string[];
};

/* ------------------------------------------------------------- Raiz mock */

export type ExpressOpsData = {
  readonly kpis: readonly Kpi[];
  readonly progressoDia: ProgressoDia;
  readonly frota: Maybe<Frota>;
  readonly aprovacoes: readonly Aprovacao[];
  readonly historicoDecisoes: readonly DecisaoRegistrada[];
  readonly proximasRotas: readonly ParadaRota[];
  readonly financeiro: ResumoFinanceiro;
  readonly agendaAmanha: AgendaAmanha;
  readonly conversas: readonly Conversa[];
  readonly operacoesHoje: readonly Operacao[];
  readonly cacambas: readonly Cacamba[];
};
