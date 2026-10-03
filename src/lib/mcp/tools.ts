/**
 * FERRAMENTAS DO CONECTOR MCP "Veronica" — fase 1, só admin.
 *
 * Nenhuma regra de catálogo nasce aqui: cadastro usa validateProduct +
 * finalizeProduct (as mesmas do painel admin, em affiliate-catalog-core.ts),
 * mídia usa sanitizeMediaUrl via validateMediaPatch e status usa
 * validateStatus. Banco, registro de execução e status dos agentes chegam por
 * `ToolDeps` — o teste injeta falsos, a produção injeta Drizzle
 * (./deps.server.ts).
 *
 * AUDITORIA. Toda chamada abre uma linha em AgentExecution ANTES de agir e a
 * fecha depois. Se a linha não puder ser aberta, nada é executado. A linha
 * guarda nome da ferramenta, duração, status, código de erro genérico e
 * metadados de lista fechada (id de produto, contagens) — nunca e-mail,
 * token, link de afiliado ou texto livre vindo do Claude.
 */

import { z } from "zod";
import {
  finalizeProduct,
  validateMediaPatch,
  validateProduct,
  validateStatus,
  type ProductInput,
} from "../affiliate-catalog-core.ts";
import {
  AFFILIATE_CATEGORIES,
  AFFILIATE_AUDIENCES,
  MAX_GALLERY_IMAGES,
} from "../affiliate-products.ts";
import type { AffiliateProduct } from "../affiliate-products.ts";
import { AGENT_REGISTRY, toPublicAgent } from "../ai/agent-registry.ts";

export const MCP_AGENT_SLUG = "veronica-mcp";

export type AdminProduct = AffiliateProduct & {
  active: boolean;
  priority: number;
  clicks30d: number;
  updatedAt: string;
};

export type CatalogPort = {
  list(): Promise<AdminProduct[]>;
  save(input: ProductInput, adminId: string): Promise<AffiliateProduct>;
  updateMedia(
    id: string,
    coverUrl: string | null,
    galleryUrls: string[],
  ): Promise<AffiliateProduct | null>;
  setActive(id: string, active: boolean): Promise<boolean>;
  clicks(opts: { productId?: string; days: number }): Promise<{
    byProduct: { productId: string; clicks: number }[];
    daily: { date: string; clicks: number }[];
  }>;
};

export type ExecutionMetadata = Record<string, string | number | boolean | null>;

export type ExecutionPort = {
  /** Abre a linha (RUNNING) e devolve o id. Lança se não conseguir gravar. */
  start(entry: { toolKey: string; toolName: string; actorId: string }): Promise<string>;
  finish(
    id: string,
    result: {
      status: "SUCCEEDED" | "FAILED";
      durationMs: number;
      errorCode: string | null;
      metadata: ExecutionMetadata;
    },
  ): Promise<void>;
};

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export type ToolDeps = {
  catalog: CatalogPort;
  executions: ExecutionPort;
  /** Mesmo dado de GET /api/agents/members/status (membersAgentStatus). */
  membersStatus(): Promise<unknown>;
  fetchImpl?: FetchLike;
};

export type ToolResult = {
  content: { type: "text"; text: string }[];
  isError?: boolean;
};

/** Erro esperado (entrada recusada, produto inexistente): a mensagem vai ao Claude. */
class ToolError extends Error {
  readonly code: "VALIDATION" | "NOT_FOUND";
  constructor(code: "VALIDATION" | "NOT_FOUND", message: string) {
    super(message);
    this.code = code;
  }
}

function text(data: unknown): ToolResult {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

type Outcome = { data: unknown; metadata?: ExecutionMetadata };

export type ToolSpec = {
  name: string;
  toolKey: string;
  title: string;
  description: string;
  readOnly: boolean;
  inputSchema: z.ZodRawShape;
  run(input: Record<string, unknown>, ctx: { adminId: string; deps: ToolDeps }): Promise<Outcome>;
};

// Os schemas só tipam e descrevem. A conferência de verdade fica nas funções
// do catálogo: assim uma entrada ruim chega ao handler, recebe a mensagem do
// painel e gera a linha de auditoria — em vez de morrer no zod sem registro.
const optionalText = (describe: string) => z.string().optional().describe(describe);

export const TOOLS: readonly ToolSpec[] = [
  {
    name: "listar_produtos",
    toolKey: "mcp.products.list",
    title: "Listar produtos",
    description:
      "Lista o catálogo do Veronica Analytics, inclusive produtos arquivados, com prioridade, público, mídia e cliques dos últimos 30 dias.",
    readOnly: true,
    inputSchema: {},
    async run(_input, { deps }) {
      const products = await deps.catalog.list();
      return {
        data: { total: products.length, produtos: products },
        metadata: { count: products.length },
      };
    },
  },
  {
    name: "cadastrar_produto",
    toolKey: "mcp.products.create",
    title: "Cadastrar produto",
    description: `Cadastra (ou atualiza, se o id ou o link já existirem) um produto de afiliado Shopee, com a mesma validação do painel admin: link curto s.shopee.com.br é expandido; o link final precisa ser HTTPS de shopee.com.br com identificação de afiliado an_…; sem Sub_id, recebe o Sub_id da casa ("veronica"). Categorias: ${AFFILIATE_CATEGORIES.join(", ")}. Público: ${AFFILIATE_AUDIENCES.join(", ")}. Mídia só HTTPS; galeria até ${MAX_GALLERY_IMAGES} imagens. O produto entra ativo.`,
    readOnly: false,
    inputSchema: {
      name: z.string().describe("Nome do produto (mínimo 3 caracteres)"),
      category: z.string().describe(`Uma de: ${AFFILIATE_CATEGORIES.join(", ")}`),
      affiliateUrl: z.string().describe("Link de afiliado da Shopee (completo ou curto)"),
      priceLabel: z.string().describe('Preço como texto, ex.: "R$ 49,90"'),
      angle: z.string().describe("Ângulo de venda para vídeo curto (mínimo 10 caracteres)"),
      commissionLabel: optionalText('Comissão anunciada, ex.: "~8%"'),
      priority: z.number().optional().describe("Prioridade de -100 a 999 (maior aparece antes)"),
      audience: optionalText(`Público: ${AFFILIATE_AUDIENCES.join(", ")} (padrão unissex)`),
      coverUrl: optionalText("URL HTTPS da capa"),
      videoUrl: optionalText("URL HTTPS do criativo em vídeo 9:16"),
      galleryUrls: z
        .array(z.string())
        .optional()
        .describe(`Até ${MAX_GALLERY_IMAGES} URLs HTTPS de imagens complementares`),
      id: optionalText("Id existente, para atualizar um produto específico"),
    },
    async run(input, { adminId, deps }) {
      let product: ProductInput;
      try {
        product = await finalizeProduct(validateProduct(input), deps.fetchImpl);
      } catch (error) {
        throw new ToolError(
          "VALIDATION",
          error instanceof Error ? error.message : "Produto inválido.",
        );
      }
      const saved = await deps.catalog.save(product, adminId);
      // O painel descarta em silêncio mídia que não é HTTPS; aqui o Claude é avisado.
      const asked = [
        input.coverUrl,
        input.videoUrl,
        ...(Array.isArray(input.galleryUrls) ? input.galleryUrls : []),
      ].filter((u): u is string => typeof u === "string" && u.trim() !== "");
      const kept = new Set([saved.coverUrl, saved.videoUrl, ...(saved.galleryUrls ?? [])]);
      const descartadas = asked.filter((u) => !kept.has(u.trim()) && !kept.has(safeHref(u)));
      return {
        data: {
          ok: true,
          produto: saved,
          ...(descartadas.length ? { midiaDescartada: descartadas } : {}),
        },
        metadata: {
          productId: saved.id,
          gallery: saved.galleryUrls?.length ?? 0,
          discarded: descartadas.length,
        },
      };
    },
  },
  {
    name: "definir_capa_e_galeria",
    toolKey: "mcp.products.media",
    title: "Definir capa e galeria",
    description: `Troca a capa e a galeria de um produto. Só URLs HTTPS; galeria com até ${MAX_GALLERY_IMAGES} imagens. Qualquer URL inválida recusa a chamada inteira. coverUrl vazio remove a capa; galleryUrls vazio remove a galeria.`,
    readOnly: false,
    inputSchema: {
      id: z.string().describe("Id do produto (veja listar_produtos)"),
      coverUrl: optionalText("URL HTTPS da capa"),
      galleryUrls: z.array(z.string()).optional().describe(`Até ${MAX_GALLERY_IMAGES} URLs HTTPS`),
    },
    async run(input, { deps }) {
      let patch: ReturnType<typeof validateMediaPatch>;
      try {
        patch = validateMediaPatch(input);
      } catch (error) {
        throw new ToolError(
          "VALIDATION",
          error instanceof Error ? error.message : "Mídia inválida.",
        );
      }
      const saved = await deps.catalog.updateMedia(patch.id, patch.coverUrl, patch.galleryUrls);
      if (!saved) throw new ToolError("NOT_FOUND", `Produto "${patch.id}" não encontrado.`);
      return {
        data: { ok: true, produto: saved },
        metadata: {
          productId: saved.id,
          gallery: patch.galleryUrls.length,
          cover: !!patch.coverUrl,
        },
      };
    },
  },
  {
    name: "ativar_arquivar_produto",
    toolKey: "mcp.products.status",
    title: "Ativar ou arquivar produto",
    description:
      "Ativa (active=true) ou arquiva (active=false) um produto. Arquivar tira da vitrine sem apagar nada; dá para reativar depois.",
    readOnly: false,
    inputSchema: {
      id: z.string().describe("Id do produto"),
      active: z.boolean().describe("true ativa, false arquiva"),
    },
    async run(input, { deps }) {
      let status: { id: string; active: boolean };
      try {
        status = validateStatus(input);
      } catch (error) {
        throw new ToolError(
          "VALIDATION",
          error instanceof Error ? error.message : "Status inválido.",
        );
      }
      if (!(await deps.catalog.setActive(status.id, status.active))) {
        throw new ToolError("NOT_FOUND", `Produto "${status.id}" não encontrado.`);
      }
      return {
        data: { ok: true, id: status.id, active: status.active },
        metadata: { productId: status.id, active: status.active },
      };
    },
  },
  {
    name: "ver_cliques",
    toolKey: "mcp.clicks.read",
    title: "Ver cliques",
    description:
      "Cliques de afiliado (encaminhamentos pelo /r/afiliado) num período de 1 a 365 dias (padrão 30). Sem productId, ranking do catálogo; com productId, total e série diária em UTC. Clique não é venda: a venda acontece na Shopee.",
    readOnly: true,
    inputSchema: {
      productId: optionalText("Id do produto (opcional)"),
      days: z.number().optional().describe("Período em dias, de 1 a 365 (padrão 30)"),
    },
    async run(input, { deps }) {
      const raw = typeof input.days === "number" ? input.days : 30;
      if (!Number.isFinite(raw) || raw < 1 || raw > 365) {
        throw new ToolError("VALIDATION", "days precisa estar entre 1 e 365.");
      }
      const days = Math.round(raw);
      const productId =
        typeof input.productId === "string" && input.productId.trim()
          ? input.productId.trim()
          : undefined;
      const result = await deps.catalog.clicks({ productId, days });
      const total = result.byProduct.reduce((sum, row) => sum + row.clicks, 0);
      return {
        data: { periodoDias: days, ...(productId ? { productId } : {}), total, ...result },
        metadata: { days, total, ...(productId ? { productId } : {}) },
      };
    },
  },
  {
    name: "status_dos_agentes",
    toolKey: "mcp.agents.status",
    title: "Status dos agentes",
    description:
      "Somente leitura: o registro de agentes da Veronica (estado, autonomia, ferramentas) e o estado do agente Members (o mesmo de /api/agents/members/status).",
    readOnly: true,
    inputSchema: {},
    async run(_input, { deps }) {
      let members: unknown;
      try {
        members = await deps.membersStatus();
      } catch {
        members = { erro: "Status do Members indisponível agora." };
      }
      return {
        data: { registro: AGENT_REGISTRY.map(toPublicAgent), members },
        metadata: { agents: AGENT_REGISTRY.length },
      };
    },
  },
];

function safeHref(value: string): string {
  try {
    return new URL(value.trim()).toString();
  } catch {
    return value;
  }
}

/**
 * Executa uma ferramenta com auditoria. Erro esperado volta como isError com a
 * mensagem do catálogo; erro inesperado volta genérico (sem detalhe interno).
 */
export async function runTool(
  spec: ToolSpec,
  input: Record<string, unknown>,
  ctx: { adminId: string; deps: ToolDeps; now?: () => number },
): Promise<ToolResult> {
  const clock = ctx.now ?? Date.now;
  let executionId: string;
  try {
    executionId = await ctx.deps.executions.start({
      toolKey: spec.toolKey,
      toolName: spec.name,
      actorId: ctx.adminId,
    });
  } catch {
    return {
      isError: true,
      content: [{ type: "text", text: "Registro de auditoria indisponível; nada foi executado." }],
    };
  }

  const started = clock();
  let result: ToolResult;
  let status: "SUCCEEDED" | "FAILED" = "SUCCEEDED";
  let errorCode: string | null = null;
  let metadata: ExecutionMetadata = { tool: spec.name };
  try {
    const outcome = await spec.run(input ?? {}, ctx);
    metadata = { tool: spec.name, ...(outcome.metadata ?? {}) };
    result = text(outcome.data);
  } catch (error) {
    status = "FAILED";
    if (error instanceof ToolError) {
      errorCode = error.code;
      result = { isError: true, content: [{ type: "text", text: error.message }] };
    } else {
      errorCode = "INTERNAL";
      console.error(`Ferramenta MCP ${spec.name} falhou:`, error);
      result = {
        isError: true,
        content: [{ type: "text", text: "Falha interna ao executar a ferramenta. Tente de novo." }],
      };
    }
  }

  try {
    await ctx.deps.executions.finish(executionId, {
      status,
      durationMs: Math.max(0, Math.round(clock() - started)),
      errorCode,
      metadata,
    });
  } catch (error) {
    // A ação já aconteceu; a linha fica RUNNING e aparece na auditoria.
    console.error("Falha ao fechar AgentExecution do MCP:", error);
  }
  return result;
}
