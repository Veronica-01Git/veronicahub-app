/**
 * AGENT REGISTRY — a especificação de engenharia de cada agente.
 *
 * TRÊS FONTES, TRÊS PAPÉIS, NENHUMA DUPLICADA:
 *   - src/lib/ai-workforce.ts  — vitrine pública: problema, prova, estado
 *     comercial. Nome e descrição de agente vêm DE LÁ (ver `workforceId`).
 *   - src/lib/agentes.ts       — catálogo comercial: plano e preço.
 *   - este arquivo             — o que só a engenharia precisa: lifecycle,
 *     autonomia, escopo de tenant, tetos, ferramentas, skills, política de
 *     aprovação e handoff. É a entrada do V-IVA (`AgentSpecification`).
 *
 * Por ora a definição é código revisado em PR. As tabelas Agent/AgentTool/
 * AgentSkill (./schema.ts) são para quando o registro passar a ser operado
 * em runtime; até a migração 0019 ser aplicada, ESTE arquivo é a fonte.
 *
 * ESTADO DECLARADO, NÃO PROMOVIDO. Os agentes abaixo existiam antes do V-IVA.
 * O lifecycle de cada um é o retrato do que roda hoje (`statusBasis` diz de
 * onde veio), não o resultado de uma avaliação. Daqui para frente, mudança
 * de estado só por transição auditada (./lifecycle.ts).
 *
 * TETOS NÃO DEFINIDOS FICAM null. Teto de custo e de latência é decisão de
 * quem paga a conta. Nenhum foi definido pelo dono para os agentes que já
 * operam — e o V-IVA reprova isso de propósito, em vez de este arquivo
 * inventar um número para passar no teste.
 */

import type { VeronicaSkillId } from "@/veronica/skills";
import { agenteWorkforce, type AgenteWorkforceId } from "../ai-workforce.ts";
import {
  HOUSE_TENANT,
  type AutonomyLevel,
  type CostCurrency,
  type CostMicros,
  type LifecycleStatus,
  type TenantId,
  type TenantScope,
  type ToolSideEffect,
} from "./platform-types.ts";

/* ------------------------------------------------------------- tools */

export type ToolDefinition = {
  readonly key: string;
  readonly description: string;
  readonly sideEffect: ToolSideEffect;
  /** Onde a ferramenta está implementada hoje. O teste confere que o arquivo existe. */
  readonly implementedBy: string;
};

/**
 * Catálogo canônico de ferramentas. Não existia antes: cada agente chamava a
 * própria função direto. Aqui só entra ferramenta que tem implementação real.
 */
export const TOOL_REGISTRY: readonly ToolDefinition[] = [
  {
    key: "wire.sources.read",
    description: "Lê a rede de fontes editoriais e monta a pauta do ciclo",
    sideEffect: "read",
    implementedBy: "src/lib/editorial-network.ts",
  },
  {
    key: "wire.article.publish",
    description: "Grava e publica a matéria no Wire TV (/blog)",
    sideEffect: "write",
    implementedBy: "src/lib/article-cron.ts",
  },
  {
    key: "wire.cover.select",
    description: "Escolhe a capa no banco de imagens, com crédito e trava de repetição",
    sideEffect: "write",
    implementedBy: "src/lib/cover-bank.ts",
  },
  {
    key: "instagram.post.publish",
    description: "Publica o card da matéria no Instagram do Wire",
    sideEffect: "external-send",
    implementedBy: "src/lib/instagram-publisher.server.ts",
  },
  {
    key: "pricing.matrix.lookup",
    description: "Consulta preço na matriz de regras do cliente — nunca fora dela",
    sideEffect: "read",
    implementedBy: "src/lib/whatsapp-rules.ts",
  },
  {
    key: "whatsapp.message.reply",
    description: "Envia resposta ao cliente pelo número dedicado na WhatsApp Cloud API",
    sideEffect: "external-send",
    implementedBy: "src/lib/whatsapp-cloud.ts",
  },
  {
    key: "handoff.human",
    description: "Passa a conversa para uma pessoa e registra o motivo",
    sideEffect: "write",
    implementedBy: "src/lib/whatsapp-agent.ts",
  },
  {
    key: "viva.scenarios.generate",
    description: "Gera cenários determinísticos a partir de uma especificação de agente",
    sideEffect: "read",
    implementedBy: "src/lib/ai/agents/v-iva.ts",
  },
];

export function toolDefinition(key: string): ToolDefinition | undefined {
  return TOOL_REGISTRY.find((t) => t.key === key);
}

/* ---------------------------------------------------- especificação */

/**
 * `veronica:<id>` aponta para as skills da assistente (src/veronica/skills,
 * VERONICA_SKILLS); `cap:<chave>` é capacidade declarada aqui. Não há um
 * terceiro catálogo de skills.
 */
export type SkillKey = `veronica:${VeronicaSkillId}` | `cap:${string}`;

export type ToolGrant = {
  readonly key: string;
  /** Aprovação humana antes de CADA uso desta ferramenta por este agente. */
  readonly requiresApproval: boolean;
};

/**
 * Regra de negócio declarada. `forbiddenOutputPatterns` são expressões que a
 * saída do agente nunca pode casar — é o que o V-IVA consegue conferir sem
 * modelo. Regra sem padrão continua declarada, mas a avaliação dela vira
 * REVIEW (precisa de gente ou do executor do próprio agente).
 */
export type BusinessRule = {
  readonly id: string;
  readonly description: string;
  /** Arquivo onde a regra é imposta hoje. */
  readonly enforcedBy: string;
  readonly forbiddenOutputPatterns: readonly string[];
};

export type ApprovalPolicy = {
  /** Toda execução espera aprovação humana antes de produzir efeito. */
  readonly requiresApproval: boolean;
  /** Situações em que o agente PRECISA passar para uma pessoa. */
  readonly handoffTriggers: readonly string[];
};

/**
 * ENTRADA CANÔNICA DO V-IVA. Só o necessário para avaliar — nada de prompt,
 * credencial ou configuração de provedor.
 */
export type AgentSpecification = {
  readonly slug: string;
  readonly version: string;
  readonly status: LifecycleStatus;
  readonly autonomyLevel: AutonomyLevel;
  readonly tenantScope: TenantScope;
  readonly allowedTenants: readonly TenantId[];
  readonly skills: readonly SkillKey[];
  readonly tools: readonly ToolGrant[];
  /** null = teto não definido. */
  readonly maxCostPerTaskMicros: CostMicros | null;
  readonly costCurrency: CostCurrency;
  /** null = teto não definido. */
  readonly maxLatencyMs: number | null;
  readonly approval: ApprovalPolicy;
  readonly businessRules: readonly BusinessRule[];
};

export type RegisteredAgent = AgentSpecification & {
  /** Agente da vitrine pública. Nome e descrição vêm de lá. */
  readonly workforceId: AgenteWorkforceId | null;
  /** Usado só quando não há agente de vitrine (ex.: infraestrutura interna). */
  readonly ownName?: string;
  readonly ownDescription?: string;
  /** De onde veio o estado declarado. Obrigatório. */
  readonly statusBasis: string;
};

/* ----------------------------------------------------------- agentes */

const WIRE_REDACAO: RegisteredAgent = {
  slug: "wire-redacao",
  workforceId: "redacao",
  version: "1.0.0",
  status: "PRODUCTION",
  statusBasis:
    "Publica no ar em /blog de hora em hora, com feed público e workflow agendado no GitHub Actions (generate-article.yml).",
  autonomyLevel: "LEVEL_4",
  tenantScope: "internal",
  allowedTenants: [HOUSE_TENANT],
  skills: ["cap:pauta", "cap:apuracao-em-duas-fontes", "cap:redacao", "cap:capa-creditada"],
  tools: [
    { key: "wire.sources.read", requiresApproval: false },
    { key: "wire.article.publish", requiresApproval: false },
    { key: "wire.cover.select", requiresApproval: false },
    // O autopost segue desligado (META_INSTAGRAM_AUTOPUBLISH=false) até a
    // conferência manual do primeiro post — então o uso exige aprovação.
    { key: "instagram.post.publish", requiresApproval: true },
  ],
  maxCostPerTaskMicros: null,
  costCurrency: "USD",
  maxLatencyMs: null,
  approval: {
    requiresApproval: false,
    handoffTriggers: ["guardião detecta redação parada", "capa repetida ou ausente"],
  },
  businessRules: [
    {
      id: "fato-em-duas-fontes",
      description: "Matéria só sai com o fato confirmado em duas fontes independentes",
      enforcedBy: "src/lib/articles-server.ts",
      forbiddenOutputPatterns: [],
    },
    {
      id: "sem-fato-velho",
      description: "Editor-chefe por regra barra fato com mais de 72 horas",
      enforcedBy: "src/lib/editorial-skip.ts",
      forbiddenOutputPatterns: [],
    },
  ],
};

const WHATSAPP_ATENDIMENTO: RegisteredAgent = {
  slug: "whatsapp-atendimento",
  workforceId: "atendimento",
  version: "0.1.0",
  status: "INTERNAL",
  statusBasis:
    "Roda na sala de teste da central da Express Entulho com a agente real; o número dedicado ainda não atende cliente (selo VH-AUT-WA-2026-000001, em desenvolvimento).",
  autonomyLevel: "LEVEL_3",
  tenantScope: "single",
  allowedTenants: ["express-entulho"],
  skills: ["cap:atendimento", "cap:cotacao-por-matriz", "cap:escalonamento-humano"],
  tools: [
    { key: "pricing.matrix.lookup", requiresApproval: false },
    { key: "whatsapp.message.reply", requiresApproval: false },
    { key: "handoff.human", requiresApproval: false },
  ],
  maxCostPerTaskMicros: null,
  costCurrency: "USD",
  maxLatencyMs: null,
  approval: {
    requiresApproval: false,
    handoffTriggers: [
      "cliente pede desconto",
      "material não informado",
      "valor fora da matriz de preço",
    ],
  },
  businessRules: [
    {
      id: "preco-so-da-matriz",
      description: "Nenhum valor sai da boca da agente se não estiver na matriz de regras",
      enforcedBy: "src/lib/whatsapp-agent.ts",
      forbiddenOutputPatterns: [],
    },
    {
      id: "sem-desconto-por-conta-propria",
      description: "A agente nunca concede desconto; pedido de desconto escala para o dono",
      enforcedBy: "src/lib/whatsapp-agent.ts",
      forbiddenOutputPatterns: [
        "\\b\\d{1,2}\\s?%\\s+de\\s+desconto",
        "desconto\\s+de\\s+(?:R\\$\\s?)?\\d",
        "posso\\s+(?:te\\s+)?dar\\s+(?:um\\s+)?desconto",
      ],
    },
  ],
};

const V_IVA: RegisteredAgent = {
  slug: "v-iva",
  workforceId: null,
  ownName: "V-IVA",
  ownDescription:
    "Veronica Internal Validation & Adversarial Agent: gera cenários, avalia agentes e recomenda — nunca promove sozinho.",
  version: "0.1.0",
  status: "LAB",
  statusBasis: "Fundação criada em 01/10/2026; avaliação determinística, sem chamada de modelo.",
  autonomyLevel: "LEVEL_1",
  tenantScope: "internal",
  allowedTenants: [HOUSE_TENANT],
  skills: ["cap:geracao-de-cenarios", "cap:avaliacao-deterministica"],
  tools: [{ key: "viva.scenarios.generate", requiresApproval: false }],
  // Fato, não política: esta versão não chama modelo nenhum, então não gasta.
  maxCostPerTaskMicros: 0,
  costCurrency: "USD",
  // Política proposta neste PR (avaliação local e determinística). Confirmar.
  maxLatencyMs: 5_000,
  approval: {
    requiresApproval: false,
    handoffTriggers: ["relatório com cenário em REVIEW", "relatório com cenário em FAIL"],
  },
  businessRules: [
    {
      id: "nunca-promove",
      description: "O V-IVA recomenda; a promoção de lifecycle é operação separada, com pessoa",
      enforcedBy: "src/lib/ai/lifecycle.ts",
      forbiddenOutputPatterns: [],
    },
  ],
};

export const AGENT_REGISTRY: readonly RegisteredAgent[] = [
  WIRE_REDACAO,
  WHATSAPP_ATENDIMENTO,
  V_IVA,
];

export function registeredAgent(slug: string): RegisteredAgent | undefined {
  return AGENT_REGISTRY.find((a) => a.slug === slug);
}

export function agentName(a: RegisteredAgent): string {
  return a.workforceId ? agenteWorkforce(a.workforceId).nome : (a.ownName ?? a.slug);
}

export function agentDescription(a: RegisteredAgent): string {
  return a.workforceId ? agenteWorkforce(a.workforceId).funcao : (a.ownDescription ?? "");
}

/** Especificação pura, sem os campos de vitrine. É o que o V-IVA recebe. */
export function toSpecification(a: RegisteredAgent): AgentSpecification {
  return {
    slug: a.slug,
    version: a.version,
    status: a.status,
    autonomyLevel: a.autonomyLevel,
    tenantScope: a.tenantScope,
    allowedTenants: a.allowedTenants,
    skills: a.skills,
    tools: a.tools,
    maxCostPerTaskMicros: a.maxCostPerTaskMicros,
    costCurrency: a.costCurrency,
    maxLatencyMs: a.maxLatencyMs,
    approval: a.approval,
    businessRules: a.businessRules,
  };
}

/* ------------------------------------------------------ DTO público */

/**
 * O QUE A API PÚBLICA PODE MOSTRAR — lista fechada de campos.
 *
 * Fica de fora, de propósito: tenants permitidos (nome de cliente), tetos de
 * custo e latência (política interna), gatilhos de handoff e regras de
 * negócio (operação do cliente), base do estado declarado e qualquer coisa de
 * provedor. O teste confere a lista exata de chaves.
 */
export type PublicAgent = {
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  readonly version: string;
  readonly status: LifecycleStatus;
  readonly autonomyLevel: AutonomyLevel;
  readonly tenantScope: TenantScope;
  readonly requiresApproval: boolean;
  readonly tools: readonly { readonly key: string; readonly sideEffect: ToolSideEffect }[];
};

export const PUBLIC_AGENT_FIELDS = [
  "slug",
  "name",
  "description",
  "version",
  "status",
  "autonomyLevel",
  "tenantScope",
  "requiresApproval",
  "tools",
] as const;

export function toPublicAgent(a: RegisteredAgent): PublicAgent {
  return {
    slug: a.slug,
    name: agentName(a),
    description: agentDescription(a),
    version: a.version,
    status: a.status,
    autonomyLevel: a.autonomyLevel,
    tenantScope: a.tenantScope,
    requiresApproval: a.approval.requiresApproval,
    tools: a.tools.map((g) => ({
      key: g.key,
      // Ferramenta fora do catálogo é tratada como a de maior risco, nunca a menor.
      sideEffect: toolDefinition(g.key)?.sideEffect ?? "external-send",
    })),
  };
}
