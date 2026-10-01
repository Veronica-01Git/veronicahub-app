/**
 * OBSERVABILIDADE DOS AGENTES — a abstração, não o produto final.
 *
 * `ObservabilitySink` é a porta. A implementação desta fase,
 * `InMemoryObservabilitySink`, é um buffer em memória com limite: serve para
 * teste, para o V-IVA e para depurar uma execução local. NÃO é observabilidade
 * de produção — num Worker da Cloudflare a memória some a cada isolate. A
 * mesma porta recebe depois um sink de banco (AgentExecution), Langfuse,
 * OpenTelemetry ou os logs da Cloudflare, sem mudar quem emite.
 *
 * O QUE NUNCA É REGISTRADO. Todo evento passa por `sanitizeEvent` antes de
 * chegar a qualquer sink — não depende de quem emite lembrar:
 *   - chave de metadado com cara de segredo ou conteúdo (key, token, secret,
 *     password, authorization, cookie, prompt, body, content, message,
 *     document, transcript) é descartada inteira;
 *   - valor com cara de credencial (sk-…, Bearer …, JWT) é mascarado;
 *   - e-mail e telefone são mascarados;
 *   - texto longo é cortado — documento inteiro não entra em log.
 */

import type { CostMicros, TenantId } from "./platform-types.ts";

export type EventMetadataValue = string | number | boolean | null;

export type AgentEvent = {
  readonly timestamp: string;
  readonly agentSlug: string;
  readonly tenantId: TenantId | null;
  readonly executionId: string | null;
  /** Nome do evento: "model.attempt", "model.fallback", "tool.call", "decision.handoff"… */
  readonly event: string;
  readonly tool?: string;
  readonly decision?: string;
  readonly provider?: string;
  readonly model?: string;
  /** null = custo desconhecido; ausente = não se aplica a este evento. */
  readonly costMicros?: CostMicros | null;
  readonly latencyMs?: number | null;
  readonly error?: string | null;
  readonly metadata?: Readonly<Record<string, EventMetadataValue>>;
};

export interface ObservabilitySink {
  record(event: AgentEvent): void;
}

/** Sink que descarta tudo. Padrão quando ninguém pediu observação. */
export const NOOP_SINK: ObservabilitySink = { record() {} };

/* --------------------------------------------------------- sanitização */

const CHAVE_PROIBIDA =
  /key|token|secret|senha|password|passwd|authorization|cookie|credential|prompt|body|content|message|document|transcri|raw/i;

const MAX_TEXTO = 240;

const MASCARAS: readonly [RegExp, string][] = [
  [/\bsk-[A-Za-z0-9_-]{8,}/g, "[credencial]"],
  [/\b(?:gsk|xai|AIza)[A-Za-z0-9_-]{10,}/g, "[credencial]"],
  [/\bBearer\s+[A-Za-z0-9._~+/=-]{8,}/gi, "Bearer [credencial]"],
  [/\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g, "[jwt]"],
  [/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, "[email]"],
];

/**
 * Telefone: sequência com 10 a 13 dígitos, com ou sem +, espaço, parêntese
 * ou hífen. Data ISO ("2026-10-01T03:55") também é uma sequência de dígitos
 * com hífen — fica de fora, senão todo horário viraria "[telefone]".
 */
const CANDIDATO_TELEFONE = /\+?\d[\d\s().-]{8,}\d/g;
const DATA_ISO = /^\d{4}-\d{2}-\d{2}/;

function mascararTelefone(trecho: string): string {
  if (DATA_ISO.test(trecho)) return trecho;
  const digitos = trecho.replace(/\D/g, "").length;
  return digitos >= 10 && digitos <= 13 ? "[telefone]" : trecho;
}

export function sanitizeText(value: string): string {
  let out = value;
  for (const [padrao, troca] of MASCARAS) out = out.replace(padrao, troca);
  out = out.replace(CANDIDATO_TELEFONE, mascararTelefone);
  return out.length > MAX_TEXTO ? `${out.slice(0, MAX_TEXTO)}…[cortado]` : out;
}

function sanitizeValue(value: EventMetadataValue): EventMetadataValue {
  return typeof value === "string" ? sanitizeText(value) : value;
}

export function sanitizeEvent(event: AgentEvent): AgentEvent {
  const metadata = event.metadata
    ? Object.fromEntries(
        Object.entries(event.metadata)
          .filter(([chave]) => !CHAVE_PROIBIDA.test(chave))
          .map(([chave, valor]) => [chave, sanitizeValue(valor)]),
      )
    : undefined;
  return {
    ...event,
    error: event.error == null ? event.error : sanitizeText(event.error),
    decision: event.decision === undefined ? undefined : sanitizeText(event.decision),
    ...(metadata ? { metadata } : {}),
  };
}

/** Único caminho recomendado para emitir: sanitiza e entrega ao sink. */
export function emit(sink: ObservabilitySink, event: AgentEvent): void {
  sink.record(sanitizeEvent(event));
}

/* ------------------------------------------------------ sink em memória */

export type AgentSummary = {
  readonly agentSlug: string;
  readonly events: number;
  readonly errors: number;
  readonly executions: number;
  /** Soma só do custo conhecido. Eventos com custo null contam em unknownCostEvents. */
  readonly knownCostMicros: CostMicros;
  readonly unknownCostEvents: number;
  readonly avgLatencyMs: number | null;
  readonly maxLatencyMs: number | null;
};

export class InMemoryObservabilitySink implements ObservabilitySink {
  private readonly limit: number;
  private buffer: AgentEvent[] = [];

  /** `limit` evita crescimento sem fim: ao estourar, o evento mais antigo sai. */
  constructor(limit = 1_000) {
    this.limit = Math.max(1, Math.floor(limit));
  }

  record(event: AgentEvent): void {
    this.buffer.push(sanitizeEvent(event));
    if (this.buffer.length > this.limit) this.buffer.splice(0, this.buffer.length - this.limit);
  }

  events(): readonly AgentEvent[] {
    return [...this.buffer];
  }

  filterByAgent(agentSlug: string): readonly AgentEvent[] {
    return this.buffer.filter((e) => e.agentSlug === agentSlug);
  }

  /** Isolamento: nunca devolve evento de outro tenant, nem evento sem tenant. */
  filterByTenant(tenantId: TenantId): readonly AgentEvent[] {
    return this.buffer.filter((e) => e.tenantId === tenantId);
  }

  filterByExecution(executionId: string): readonly AgentEvent[] {
    return this.buffer.filter((e) => e.executionId === executionId);
  }

  summaryByAgent(): Readonly<Record<string, AgentSummary>> {
    const grupos = new Map<string, AgentEvent[]>();
    for (const e of this.buffer) {
      const lista = grupos.get(e.agentSlug) ?? [];
      lista.push(e);
      grupos.set(e.agentSlug, lista);
    }
    const resumo: Record<string, AgentSummary> = {};
    for (const [agentSlug, eventos] of grupos) {
      const latencias = eventos
        .map((e) => e.latencyMs)
        .filter((l): l is number => typeof l === "number");
      resumo[agentSlug] = {
        agentSlug,
        events: eventos.length,
        errors: eventos.filter((e) => e.error).length,
        executions: new Set(eventos.map((e) => e.executionId).filter(Boolean)).size,
        knownCostMicros: eventos.reduce(
          (soma, e) => soma + (typeof e.costMicros === "number" ? e.costMicros : 0),
          0,
        ),
        unknownCostEvents: eventos.filter((e) => e.costMicros === null).length,
        avgLatencyMs: latencias.length
          ? Math.round(latencias.reduce((a, b) => a + b, 0) / latencias.length)
          : null,
        maxLatencyMs: latencias.length ? Math.max(...latencias) : null,
      };
    }
    return resumo;
  }

  clear(): void {
    this.buffer = [];
  }
}
