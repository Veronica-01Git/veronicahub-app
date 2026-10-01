/**
 * EXECUTOR DO V-IVA PARA A AGENTE DE WHATSAPP — via sala de teste.
 *
 * Roda os cenários de execução do V-IVA contra a agente REAL: a mesma
 * `decidirResposta` (whatsapp-agent.ts) que a sala de teste da Express e o
 * webhook usam, com a mesma guarda de preço e a mesma cadeia de provedores.
 *
 * O QUE ESTE EXECUTOR NUNCA FAZ:
 *   - enviar mensagem pela WhatsApp Cloud API. `decidirResposta` só devolve
 *     texto; quem envia é o webhook (whatsapp-cloud.ts), que este caminho não
 *     importa — tests/ai-platform.test.mjs confere o grafo de imports;
 *   - ler ou gravar conversa de cliente (WaConversation / WaMessage);
 *   - mexer no número da empresa (ver AGENTS.md).
 *
 * Este arquivo é puro: recebe a função de decisão por injeção. O fio com a
 * agente real fica em ../evaluation.server.ts; nos testes entra uma falsa.
 *
 * COMO O RESULTADO É LIDO:
 *   - tenant: a guarda da plataforma (../tenant-guard.ts) decide ANTES da
 *     agente. Tenant fora da lista é recusado sem chamar modelo;
 *   - ferramentas: a agente não chama ferramenta por tool-use. Responder ao
 *     cliente é o canal de resposta, não uma ferramenta acionada — então não
 *     entra em `toolsCalled`. Entram: `handoff.human` quando ela escala, e
 *     `pricing.matrix.lookup` quando cita valor (a guarda conferiu na matriz);
 *   - custo: `decidirResposta` devolve só o texto, sem uso de tokens. O custo
 *     sai `null` (desconhecido) — o V-IVA marca REVIEW, não PASS;
 *   - tenants acessados: a agente só lê REGRAS_EXPRESS_ENTULHO.
 */

import type { AgentSpecification } from "../agent-registry.ts";
import type { ScenarioExecutionResult, ScenarioExecutor } from "../agents/v-iva.ts";
import { checkTenantAccess } from "../tenant-guard.ts";
import type { TenantId } from "../platform-types.ts";

export type DecisaoDaAgente = {
  readonly texto: string;
  readonly escalar: boolean;
  readonly motivo?: string;
};

export type DecidirResposta = (params: {
  readonly texto: string;
  readonly historico: readonly [];
  readonly primeiraMensagem: boolean;
}) => Promise<DecisaoDaAgente>;

export type TestRoomExecutorDeps = {
  /** A função de decisão da agente. Em produção: `decidirResposta` com as regras da Express. */
  readonly decidir: DecidirResposta;
  /** O tenant cujas regras a agente lê. Em produção: "express-entulho". */
  readonly agentTenant: TenantId;
  /** Valores em reais citados num texto (whatsapp-agent.ts → valoresCitados). */
  readonly valoresCitados: (texto: string) => readonly number[];
  readonly clock?: () => number;
};

/** Pergunta neutra para cenário que não traz mensagem própria (latência, custo). */
export const PERGUNTA_NEUTRA = "Oi, preciso de uma caçamba para entulho de obra. Como funciona?";

/**
 * Motivos de NEGÓCIO com que `decidirResposta` escala (whatsapp-agent.ts):
 * alçada comercial, guarda de preço, agente que não soube, anexo. Escalada
 * com qualquer outro motivo é a cadeia de provedores caindo — falha de
 * infraestrutura, não decisão da agente. Listar o conhecido é mais seguro do
 * que tentar adivinhar cada frase de erro de cada provedor.
 */
const MOTIVO_DE_NEGOCIO =
  /^(guarda de preço:|assunto fora da alçada|o agente não soube|anexo que o agente)/i;

export function createTestRoomExecutor(deps: TestRoomExecutorDeps): ScenarioExecutor {
  const agora = deps.clock ?? Date.now;
  return async (scenario, spec: AgentSpecification): Promise<ScenarioExecutionResult> => {
    const inicio = agora();
    const base = {
      scenarioId: scenario.id,
      tenantId: scenario.input.tenantId,
      toolsCalled: [] as string[],
      accessedTenants: [] as TenantId[],
    };

    const acesso = checkTenantAccess(spec, scenario.input.tenantId);
    if (!acesso.ok) {
      // Recusado pela plataforma: nenhum modelo foi chamado, custo zero conhecido.
      return {
        ...base,
        latencyMs: agora() - inicio,
        costMicros: 0,
        handedOff: false,
        refused: true,
        output: "",
        error: null,
      };
    }

    const decisao = await deps.decidir({
      texto: scenario.input.message ?? PERGUNTA_NEUTRA,
      historico: [],
      primeiraMensagem: false,
    });
    const latencyMs = agora() - inicio;

    const falhouInfra =
      decisao.escalar &&
      typeof decisao.motivo === "string" &&
      !MOTIVO_DE_NEGOCIO.test(decisao.motivo);
    const ferramentas: string[] = [];
    if (decisao.escalar) ferramentas.push("handoff.human");
    if (deps.valoresCitados(decisao.texto).length > 0) ferramentas.push("pricing.matrix.lookup");

    return {
      ...base,
      latencyMs,
      costMicros: null,
      toolsCalled: ferramentas,
      accessedTenants: [deps.agentTenant],
      handedOff: decisao.escalar,
      refused: false,
      output: decisao.texto,
      error: falhouInfra ? `cadeia de provedores falhou: ${decisao.motivo}` : null,
    };
  };
}
