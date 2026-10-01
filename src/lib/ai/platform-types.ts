/**
 * VOCABULÁRIO DA VERONICA AI WORKFORCE PLATFORM.
 *
 * Fonte única dos valores permitidos para estado, autonomia, veredito e
 * execução. O TypeScript deriva os tipos daqui, e o schema (./schema.ts)
 * deriva daqui as CHECK constraints do Postgres — o mesmo array alimenta os
 * dois lados, então eles não têm como divergir.
 *
 * POR QUE `text` + CHECK E NÃO `pgEnum`. O repositório usa os dois padrões,
 * mas a migração mais recente (0018_portfolio_generation.sql) já escolheu
 * text + CHECK. Para uma fundação que ainda vai mudar, é a escolha
 * reversível: remover um valor de um pgEnum exige recriar o tipo; mudar uma
 * CHECK é um ALTER TABLE comum.
 *
 * Sem `enum` do TypeScript de propósito: a suíte de testes carrega .ts pelo
 * Node em modo strip-only, que não aceita `enum`.
 */

/* --------------------------------------------------------- lifecycle */

/**
 * Ordem importa: é a ordem de promoção. Ver ./lifecycle.ts para a política
 * de transição — esta lista só diz quais estados existem.
 */
export const LIFECYCLE_STATUSES = [
  "LAB",
  "ALPHA",
  "INTERNAL",
  "PILOT",
  "VALIDATED",
  "PRODUCTION",
  "ENTERPRISE",
] as const;
export type LifecycleStatus = (typeof LIFECYCLE_STATUSES)[number];

/* --------------------------------------------------------- autonomia */

export const AUTONOMY_LEVELS = [
  "LEVEL_0",
  "LEVEL_1",
  "LEVEL_2",
  "LEVEL_3",
  "LEVEL_4",
  "LEVEL_5",
] as const;
export type AutonomyLevel = (typeof AUTONOMY_LEVELS)[number];

/**
 * O que cada nível autoriza. É contrato, não decoração: o V-IVA usa essa
 * definição para exigir aprovação humana em ferramenta de efeito externo
 * abaixo do nível 3.
 */
export const AUTONOMY_DEFINITIONS: Record<AutonomyLevel, string> = {
  LEVEL_0: "Só sugere. Toda ação é executada por uma pessoa.",
  LEVEL_1: "Executa leitura. Toda ação com efeito exige aprovação humana.",
  LEVEL_2: "Executa ações internas reversíveis. Envio para fora exige aprovação.",
  LEVEL_3: "Envia para fora dentro de regra dura. Exceção escala para uma pessoa.",
  LEVEL_4: "Opera o fluxo completo. Uma pessoa audita depois, por amostragem e alerta.",
  LEVEL_5: "Autonomia total sob política. Reservado: nenhum agente opera neste nível.",
};

export function autonomyRank(level: AutonomyLevel): number {
  return AUTONOMY_LEVELS.indexOf(level);
}

/* ----------------------------------------------------------- tenant */

/**
 * Escopo de tenant do agente.
 *   internal — opera só para a própria casa (HOUSE_TENANT);
 *   single   — opera para exatamente um tenant cliente;
 *   multi    — opera para vários tenants, sempre isolados por execução.
 */
export const TENANT_SCOPES = ["internal", "single", "multi"] as const;
export type TenantScope = (typeof TENANT_SCOPES)[number];

/**
 * ABSTRAÇÃO MÍNIMA DE TENANT. Não existe tabela de tenant no projeto; o que
 * existe é `WaConversation.tenant`, um texto com o slug da empresa
 * ("express-entulho"). Este tipo segue o mesmo formato — slug estável — e é
 * a única porta: quando houver tabela de tenant, ela passa a ser a fonte
 * deste slug e nenhuma execução já gravada precisa mudar.
 */
export type TenantId = string;

/** A própria Veronica Hub como tenant das operações internas (Wire, V-IVA). */
export const HOUSE_TENANT: TenantId = "veronica-hub";

const TENANT_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isValidTenantId(value: string): boolean {
  return value.length >= 2 && value.length <= 64 && TENANT_SLUG.test(value);
}

/* --------------------------------------------------------- execução */

export const EXECUTION_STATUSES = [
  "QUEUED",
  "RUNNING",
  "AWAITING_APPROVAL",
  "SUCCEEDED",
  "FAILED",
  "CANCELLED",
] as const;
export type ExecutionStatus = (typeof EXECUTION_STATUSES)[number];

/** O que disparou a execução. */
export const EXECUTION_TRIGGERS = ["manual", "schedule", "webhook", "api", "evaluation"] as const;
export type ExecutionTrigger = (typeof EXECUTION_TRIGGERS)[number];

/* -------------------------------------------------------- avaliação */

export const EVALUATION_VERDICTS = ["PASS", "FAIL", "REVIEW"] as const;
export type EvaluationVerdict = (typeof EVALUATION_VERDICTS)[number];

export const SCENARIO_CATEGORIES = [
  "LATENCY_GUARD",
  "COST_GUARD",
  "TENANT_ISOLATION",
  "PROMPT_INJECTION",
  "TOOL_USAGE",
  "HUMAN_HANDOFF",
  "BUSINESS_RULES",
] as const;
export type ScenarioCategory = (typeof SCENARIO_CATEGORIES)[number];

/* -------------------------------------------------------- ferramenta */

/**
 * Classe de efeito de uma ferramenta — o que define quanto risco ela carrega.
 *   read          — só lê; nada muda no mundo;
 *   write         — muda estado interno (banco, arquivo, publicação no Hub);
 *   external-send — fala com alguém de fora (cliente, rede social, e-mail).
 */
export const TOOL_SIDE_EFFECTS = ["read", "write", "external-send"] as const;
export type ToolSideEffect = (typeof TOOL_SIDE_EFFECTS)[number];

/* ------------------------------------------------------------ modelo */

export const MODEL_CAPABILITIES = ["LLM", "VISION", "IMAGE", "VIDEO", "VOICE", "SEARCH"] as const;
export type ModelCapability = (typeof MODEL_CAPABILITIES)[number];

/* ------------------------------------------------------------ custo */

/**
 * DINHEIRO EM MICRO-UNIDADES INTEIRAS.
 *
 * O resto do Hub guarda centavos (`balanceCents`), mas o custo de uma chamada
 * de modelo é fração de centavo — em centavos ele arredondaria para zero e o
 * teto de custo nunca dispararia. Então aqui a unidade é o milionésimo da
 * moeda: 1 USD = 1_000_000 micros. Inteiro, sem float, sem arredondamento
 * acumulado.
 *
 * Custo desconhecido é `null`, nunca zero. Zero quer dizer "não custou nada";
 * null quer dizer "o provedor não informou" — e o V-IVA trata os dois de
 * jeito diferente.
 */
export type CostMicros = number;
export const MICROS_PER_UNIT = 1_000_000;

/** Moedas aceitas. Provedores de modelo cobram em USD; o resto do Hub, em BRL. */
export const COST_CURRENCIES = ["USD", "BRL"] as const;
export type CostCurrency = (typeof COST_CURRENCIES)[number];

export function isOneOf<T extends string>(values: readonly T[], value: string): value is T {
  return (values as readonly string[]).includes(value);
}

/** Fragmento SQL `'A', 'B', 'C'` para CHECK constraints. Valores são constantes do código. */
export function sqlList(values: readonly string[]): string {
  return values.map((v) => `'${v.replace(/'/g, "''")}'`).join(", ");
}
