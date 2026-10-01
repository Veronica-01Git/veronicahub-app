/**
 * API DO AGENT REGISTRY — somente leitura.
 *
 *   GET /api/agents/registry          → lista de agentes (DTO público)
 *   GET /api/agents/registry/<slug>   → um agente (DTO público)
 *
 * Interceptada em src/server.ts antes do handler do TanStack, no mesmo
 * padrão de /api/wire/feed.json: URL fixa é contrato com quem consome, e a
 * URL de RPC do createServerFn não é fixa.
 *
 * O QUE SAI. Só `toPublicAgent` (lista fechada em PUBLIC_AGENT_FIELDS). Não
 * saem tenants permitidos, tetos de custo e latência, gatilhos de handoff,
 * regras de negócio, base do estado declarado nem nada de provedor. Sem
 * método de escrita: POST, PUT, PATCH e DELETE recebem 405.
 *
 * FONTE. O registro em código (agent-registry.ts), não o banco: a migração
 * 0019 ainda não foi aplicada em produção, e a API não pode depender de uma
 * tabela que não existe. Quando o registro for para o banco, só o corpo
 * destas funções muda — a URL e o formato ficam.
 */

import { AGENT_REGISTRY, registeredAgent, toPublicAgent } from "./agent-registry.ts";

export const REGISTRY_PATH = "/api/agents/registry";

/** Cinco minutos, como o feed do Wire: o registro muda por deploy, não por segundo. */
const CACHE_SECONDS = 300;

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control":
        status === 200 ? `public, max-age=${CACHE_SECONDS}, s-maxage=${CACHE_SECONDS}` : "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}

export function isRegistryPath(pathname: string): boolean {
  return pathname === REGISTRY_PATH || pathname.startsWith(`${REGISTRY_PATH}/`);
}

export function handleAgentRegistry(request: Request): Response {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response(null, { status: 405, headers: { allow: "GET, HEAD" } });
  }
  const pathname = new URL(request.url).pathname.replace(/\/$/, "");

  if (pathname === REGISTRY_PATH) {
    return json({ agents: AGENT_REGISTRY.map(toPublicAgent) });
  }

  const slug = pathname.slice(REGISTRY_PATH.length + 1);
  if (!SLUG.test(slug)) return json({ error: "slug inválido" }, 400);
  const agente = registeredAgent(slug);
  if (!agente) return json({ error: "agente não encontrado" }, 404);
  return json({ agent: toPublicAgent(agente) });
}
