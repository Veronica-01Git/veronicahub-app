/**
 * MODEL ROUTER — qual provedor atende cada capacidade, e o que acontece
 * quando ele não atende.
 *
 * O QUE JÁ EXISTIA. src/lib/whatsapp-provedores.ts tem uma cadeia de
 * provedores (Anthropic → Groq → Groq reserva → Gemini) para a agente de
 * WhatsApp, nascida dos incidentes de 19/09. Ela funciona e continua
 * intocada. O que ela não tem — e este router acrescenta — é timeout por
 * tentativa, orçamento global de tempo, teto de custo verificado ANTES de
 * gastar, cancelamento e resultado estruturado com o motivo de cada
 * fallback. Os provedores dela entram aqui por adaptador
 * (./adapters/legacy-provedor.ts), sem reescrever nenhum.
 *
 * INDEPENDÊNCIA DE FORNECEDOR. Este arquivo não importa SDK nenhum. Quem fala
 * com o provedor é o adaptador; o router só conhece a interface. Trocar de
 * fornecedor é registrar outro adaptador e mudar a rota.
 *
 * REGRAS DURAS:
 *   - no máximo PRIMARY + 2 FALLBACKS. A cadeia é validada na configuração,
 *     então loop infinito não é possível nem por erro de configuração;
 *   - o timeout de cada tentativa nunca passa do que sobra do orçamento
 *     global (`deadlineMs`). Timeout não é "tente o próximo para sempre";
 *   - com teto de custo, a estimativa é conferida antes da chamada. Se o
 *     custo real só aparece depois e estoura o teto, nenhuma tentativa nova
 *     é feita;
 *   - cancelamento externo (AbortSignal) encerra a rota inteira, sem fallback.
 *
 * Sem singleton exportado, de propósito: nenhum adaptador está ligado a
 * produção nesta fase. Quem precisa de um router cria o seu com
 * `new ModelRouter()` e registra o que vai usar.
 */

import type { CostMicros, ModelCapability } from "./platform-types.ts";
import {
  NOOP_SINK,
  emit,
  sanitizeText,
  type EventMetadataValue,
  type ObservabilitySink,
} from "./observability.ts";

/* -------------------------------------------------------------- contrato */

export type AdapterRequest<I> = {
  readonly capability: ModelCapability;
  readonly input: I;
};

export type AdapterResult<O> = {
  readonly output: O;
  /** Custo real informado pelo provedor. null quando ele não informa. */
  readonly costMicros: CostMicros | null;
  readonly metadata?: Readonly<Record<string, EventMetadataValue>>;
};

export interface ProviderAdapter<I = unknown, O = unknown> {
  /** Slug do provedor ("anthropic", "groq"…). É o id de ModelProvider. */
  readonly provider: string;
  readonly model: string;
  readonly type: ModelCapability;
  /** Há credencial no runtime? Adaptador sem credencial é pulado sem chamada. */
  isConfigured(): boolean;
  /** Estimativa ANTES da chamada. null = não sabe estimar (nunca chute). */
  estimateCostMicros(request: AdapterRequest<I>): CostMicros | null;
  /** Deve respeitar `signal` quando o SDK permitir; o router corta por tempo de qualquer jeito. */
  invoke(request: AdapterRequest<I>, signal: AbortSignal): Promise<AdapterResult<O>>;
  /** Frase curta do erro, sem corpo de resposta nem credencial. */
  describeError?(error: unknown): string;
}

export function adapterId(adapter: { provider: string; model: string }): string {
  return `${adapter.provider}/${adapter.model}`;
}

/** PRIMARY + até 2 FALLBACKS. */
export const MAX_FALLBACKS = 2;

/* ----------------------------------------------------------- execução */

export type RouteContext = {
  readonly agentSlug: string;
  readonly tenantId: string;
  readonly executionId: string;
};

export type RouteOptions<I> = {
  readonly capability: ModelCapability;
  readonly input: I;
  readonly context: RouteContext;
  /** Teto da tarefa inteira (todas as tentativas). null = sem teto. */
  readonly maxCostMicros: CostMicros | null;
  /**
   * O que fazer quando há teto e o adaptador não sabe estimar.
   * "allow" (padrão) tenta e registra que o custo era desconhecido;
   * "block" pula o adaptador.
   */
  readonly unknownCostPolicy?: "allow" | "block";
  /** Tempo máximo de UMA tentativa. */
  readonly attemptTimeoutMs: number;
  /** Orçamento global da rota, somando todas as tentativas. */
  readonly deadlineMs: number;
  readonly signal?: AbortSignal;
};

export type AttemptOutcome =
  | "success"
  | "error"
  | "timeout"
  | "cancelled"
  | "skipped-unconfigured"
  | "skipped-cost";

export type Attempt = {
  readonly provider: string;
  readonly model: string;
  readonly outcome: AttemptOutcome;
  readonly latencyMs: number;
  readonly estimatedCostMicros: CostMicros | null;
  readonly costMicros: CostMicros | null;
  readonly error: string | null;
  /** Por que a rota seguiu para o próximo (ou parou). null no sucesso. */
  readonly fallbackReason: string | null;
};

export type RouteFailureCode =
  | "NO_ROUTE"
  | "NO_PROVIDER_CONFIGURED"
  | "COST_GUARD_TRIGGERED"
  | "DEADLINE_EXCEEDED"
  | "ALL_PROVIDERS_FAILED"
  | "CANCELLED";

type RouteBase = {
  readonly attempts: readonly Attempt[];
  readonly latencyMs: number;
  /** Soma do custo conhecido. null quando alguma tentativa executada teve custo desconhecido. */
  readonly totalCostMicros: CostMicros | null;
};

export type RouteSuccess<O> = RouteBase & {
  readonly ok: true;
  readonly output: O;
  readonly provider: string;
  readonly model: string;
  /** true quando o custo real (conhecido só depois) passou do teto. */
  readonly costCeilingExceeded: boolean;
};

export type RouteFailure = RouteBase & {
  readonly ok: false;
  readonly code: RouteFailureCode;
  readonly message: string;
  /** Falha de infraestrutura ou guarda: o próximo passo é uma pessoa, não outra tentativa. */
  readonly handoff: true;
};

export type RouteResult<O> = RouteSuccess<O> | RouteFailure;

type Resultado<O> =
  | { kind: "ok"; result: AdapterResult<O> }
  | { kind: "timeout" }
  | { kind: "cancelled" }
  | { kind: "error"; error: unknown };

/**
 * Uma tentativa, cortada por tempo e por cancelamento. O adaptador recebe um
 * signal próprio, abortado em qualquer dos dois casos — e mesmo que ele
 * ignore o signal, a corrida devolve o controle ao router na hora.
 */
function tentar<I, O>(
  adapter: ProviderAdapter<I, O>,
  request: AdapterRequest<I>,
  timeoutMs: number,
  externo: AbortSignal | undefined,
): Promise<Resultado<O>> {
  const controle = new AbortController();
  return new Promise((resolve) => {
    let terminou = false;
    const aoCancelar = () => {
      controle.abort();
      fim({ kind: "cancelled" });
    };
    const relogio = setTimeout(() => {
      controle.abort();
      fim({ kind: "timeout" });
    }, timeoutMs);
    function fim(valor: Resultado<O>) {
      if (terminou) return;
      terminou = true;
      clearTimeout(relogio);
      externo?.removeEventListener("abort", aoCancelar);
      resolve(valor);
    }
    externo?.addEventListener("abort", aoCancelar, { once: true });

    let chamada: Promise<AdapterResult<O>>;
    try {
      chamada = Promise.resolve(adapter.invoke(request, controle.signal));
    } catch (error) {
      chamada = Promise.reject(error);
    }
    chamada.then(
      (result) => fim({ kind: "ok", result }),
      (error) => fim({ kind: "error", error }),
    );
  });
}

/** Custo que o adaptador anexou a um erro, quando o provedor cobrou e mesmo assim falhou. */
function custoAnexado(error: unknown): CostMicros | null {
  const valor = (error as { costMicros?: unknown } | null | undefined)?.costMicros;
  return typeof valor === "number" && Number.isFinite(valor) && valor >= 0 ? valor : null;
}

function descreverErro(adapter: ProviderAdapter<unknown, unknown>, error: unknown): string {
  const bruto = adapter.describeError
    ? adapter.describeError(error)
    : error instanceof Error
      ? error.message
      : String(error);
  return sanitizeText(bruto);
}

/* ---------------------------------------------------------------- router */

export type ModelRouterOptions = {
  readonly sink?: ObservabilitySink;
  /** Relógio injetável, em ms. Padrão: Date.now. */
  readonly clock?: () => number;
};

export class ModelRouter {
  private readonly adapters = new Map<string, ProviderAdapter<unknown, unknown>>();
  private readonly routes = new Map<ModelCapability, readonly string[]>();
  private readonly sink: ObservabilitySink;
  private readonly clock: () => number;

  constructor(options: ModelRouterOptions = {}) {
    this.sink = options.sink ?? NOOP_SINK;
    this.clock = options.clock ?? Date.now;
  }

  register<I, O>(adapter: ProviderAdapter<I, O>): this {
    const id = adapterId(adapter);
    if (this.adapters.has(id)) throw new Error(`Adaptador já registrado: ${id}`);
    this.adapters.set(id, adapter as ProviderAdapter<unknown, unknown>);
    return this;
  }

  /**
   * Define a cadeia de uma capacidade: o primeiro é o PRIMARY, os demais são
   * FALLBACKS em ordem. Validada aqui para que erro de configuração apareça
   * no boot, não no meio de uma execução.
   */
  setRoute(capability: ModelCapability, chain: readonly string[]): this {
    if (chain.length === 0) throw new Error(`Rota vazia para ${capability}`);
    if (chain.length > 1 + MAX_FALLBACKS) {
      throw new Error(
        `Rota de ${capability} com ${chain.length - 1} fallbacks; o limite é ${MAX_FALLBACKS}`,
      );
    }
    if (new Set(chain).size !== chain.length) {
      throw new Error(`Rota de ${capability} repete adaptador`);
    }
    for (const id of chain) {
      const adapter = this.adapters.get(id);
      if (!adapter) throw new Error(`Adaptador não registrado: ${id}`);
      if (adapter.type !== capability) {
        throw new Error(`${id} é ${adapter.type}, não pode atender ${capability}`);
      }
    }
    this.routes.set(capability, [...chain]);
    return this;
  }

  routeFor(capability: ModelCapability): readonly string[] {
    return this.routes.get(capability) ?? [];
  }

  async route<I, O>(options: RouteOptions<I>): Promise<RouteResult<O>> {
    const inicio = this.clock();
    const attempts: Attempt[] = [];
    const politica = options.unknownCostPolicy ?? "allow";
    const request: AdapterRequest<I> = { capability: options.capability, input: options.input };
    const { agentSlug, tenantId, executionId } = options.context;
    let gastoConhecido = 0;
    let custoDesconhecido = false;

    const base = () => ({
      attempts,
      latencyMs: this.clock() - inicio,
      totalCostMicros: custoDesconhecido ? null : gastoConhecido,
    });

    const falhar = (code: RouteFailureCode, message: string): RouteFailure => {
      const resultado: RouteFailure = { ok: false, code, message, handoff: true, ...base() };
      emit(this.sink, {
        timestamp: new Date().toISOString(),
        agentSlug,
        tenantId,
        executionId,
        event: "model.route.failure",
        decision: code,
        costMicros: resultado.totalCostMicros,
        latencyMs: resultado.latencyMs,
        error: message,
        metadata: { capability: options.capability, attempts: attempts.length },
      });
      return resultado;
    };

    const registrar = (adapter: ProviderAdapter<unknown, unknown>, tentativa: Attempt) => {
      attempts.push(tentativa);
      emit(this.sink, {
        timestamp: new Date().toISOString(),
        agentSlug,
        tenantId,
        executionId,
        event: tentativa.outcome === "success" ? "model.attempt" : "model.fallback",
        provider: adapter.provider,
        model: adapter.model,
        decision: tentativa.outcome,
        costMicros: tentativa.costMicros,
        latencyMs: tentativa.latencyMs,
        error: tentativa.error,
        metadata: {
          capability: options.capability,
          fallbackReason: tentativa.fallbackReason,
          estimatedCostMicros: tentativa.estimatedCostMicros,
        },
      });
    };

    const cadeia = this.routes.get(options.capability);
    if (!cadeia) return falhar("NO_ROUTE", `Nenhuma rota configurada para ${options.capability}`);

    for (const id of cadeia) {
      const adapter = this.adapters.get(id) as ProviderAdapter<I, O>;
      const vazio = (
        outcome: AttemptOutcome,
        fallbackReason: string,
        estimatedCostMicros: CostMicros | null = null,
      ): Attempt => ({
        provider: adapter.provider,
        model: adapter.model,
        outcome,
        latencyMs: 0,
        estimatedCostMicros,
        costMicros: 0,
        error: null,
        fallbackReason,
      });

      if (options.signal?.aborted)
        return falhar("CANCELLED", "Execução cancelada antes da tentativa");

      const restante = options.deadlineMs - (this.clock() - inicio);
      if (restante <= 0) {
        return falhar("DEADLINE_EXCEEDED", `Orçamento global de ${options.deadlineMs} ms esgotado`);
      }

      if (!adapter.isConfigured()) {
        registrar(adapter, vazio("skipped-unconfigured", "provedor sem credencial no runtime"));
        continue;
      }

      let estimativa: CostMicros | null = null;
      if (options.maxCostMicros !== null) {
        // Estouro já aconteceu (custo real conhecido só depois): não amplia.
        if (gastoConhecido >= options.maxCostMicros) {
          return falhar(
            "COST_GUARD_TRIGGERED",
            `Teto de ${options.maxCostMicros} micros já consumido; nenhuma tentativa nova`,
          );
        }
        estimativa = adapter.estimateCostMicros(request);
        if (estimativa === null && politica === "block") {
          registrar(adapter, vazio("skipped-cost", "custo desconhecido sob teto (política block)"));
          continue;
        }
        if (estimativa !== null && gastoConhecido + estimativa > options.maxCostMicros) {
          registrar(
            adapter,
            vazio(
              "skipped-cost",
              `estimativa de ${estimativa} micros passa do teto restante de ${options.maxCostMicros - gastoConhecido}`,
              estimativa,
            ),
          );
          continue;
        }
      } else {
        estimativa = adapter.estimateCostMicros(request);
      }

      const limite = Math.min(options.attemptTimeoutMs, restante);
      const comeco = this.clock();
      const resultado = await tentar(adapter, request, limite, options.signal);
      const latencia = this.clock() - comeco;

      if (resultado.kind === "ok") {
        const custo = resultado.result.costMicros;
        if (custo === null) custoDesconhecido = true;
        else gastoConhecido += custo;
        registrar(adapter, {
          provider: adapter.provider,
          model: adapter.model,
          outcome: "success",
          latencyMs: latencia,
          estimatedCostMicros: estimativa,
          costMicros: custo,
          error: null,
          fallbackReason: null,
        });
        const sucesso: RouteSuccess<O> = {
          ok: true,
          output: resultado.result.output,
          provider: adapter.provider,
          model: adapter.model,
          costCeilingExceeded:
            options.maxCostMicros !== null && !custoDesconhecido
              ? gastoConhecido > options.maxCostMicros
              : false,
          ...base(),
        };
        emit(this.sink, {
          timestamp: new Date().toISOString(),
          agentSlug,
          tenantId,
          executionId,
          event: "model.route.success",
          provider: adapter.provider,
          model: adapter.model,
          costMicros: sucesso.totalCostMicros,
          latencyMs: sucesso.latencyMs,
          metadata: {
            capability: options.capability,
            attempts: attempts.length,
            costCeilingExceeded: sucesso.costCeilingExceeded,
          },
        });
        return sucesso;
      }

      if (resultado.kind === "cancelled") {
        registrar(adapter, {
          ...vazio("cancelled", "cancelamento externo", estimativa),
          latencyMs: latencia,
          costMicros: null,
        });
        custoDesconhecido = true;
        return falhar("CANCELLED", "Execução cancelada durante a tentativa");
      }

      // Tentativa que falhou ou estourou o tempo pode ter consumido tokens. Se
      // o adaptador anexou o custo ao erro (`costMicros` numérico), ele entra
      // no gasto — e é o que impede a próxima tentativa de ampliar um estouro.
      // Sem essa informação, o custo é desconhecido, não zero.
      const custoDaFalha = custoAnexado(resultado.kind === "error" ? resultado.error : undefined);
      if (custoDaFalha === null) custoDesconhecido = true;
      else gastoConhecido += custoDaFalha;
      registrar(adapter, {
        provider: adapter.provider,
        model: adapter.model,
        outcome: resultado.kind,
        latencyMs: latencia,
        estimatedCostMicros: estimativa,
        costMicros: custoDaFalha,
        error:
          resultado.kind === "timeout"
            ? `sem resposta em ${limite} ms`
            : descreverErro(adapter as ProviderAdapter<unknown, unknown>, resultado.error),
        fallbackReason:
          resultado.kind === "timeout"
            ? limite < options.attemptTimeoutMs
              ? "timeout (cortado pelo orçamento global)"
              : "timeout da tentativa"
            : "erro do provedor",
      });

      // Se o corte veio do orçamento global (o limite desta tentativa era o que
      // sobrava do prazo), o prazo acabou — ponto. Não se pergunta de novo ao
      // relógio: timer e relógio podem discordar em 1 ms, e foi exatamente
      // isso que fez a rota tentar um fallback com 1 ms no CI de 01/10/2026.
      if (resultado.kind === "timeout" && limite < options.attemptTimeoutMs) {
        return falhar("DEADLINE_EXCEEDED", `Orçamento global de ${options.deadlineMs} ms esgotado`);
      }
    }

    const tentadas = attempts.filter((a) => !a.outcome.startsWith("skipped"));
    if (tentadas.length === 0) {
      if (attempts.some((a) => a.outcome === "skipped-cost")) {
        return falhar(
          "COST_GUARD_TRIGGERED",
          "Nenhum provedor cabe no teto de custo da tarefa; nada foi executado",
        );
      }
      return falhar("NO_PROVIDER_CONFIGURED", "Nenhum provedor da rota tem credencial no runtime");
    }
    if (options.deadlineMs - (this.clock() - inicio) <= 0) {
      return falhar("DEADLINE_EXCEEDED", `Orçamento global de ${options.deadlineMs} ms esgotado`);
    }
    return falhar(
      "ALL_PROVIDERS_FAILED",
      `Todos os provedores da rota falharam: ${tentadas.map((a) => `${a.provider}/${a.model} (${a.error})`).join("; ")}`,
    );
  }
}
