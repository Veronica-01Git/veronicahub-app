/**
 * ENTRADA HTTP DO CONECTOR MCP — tudo o que src/server.ts encaminha para cá.
 *
 *   /.well-known/oauth-protected-resource[/mcp]  metadados do recurso (RFC 9728)
 *   /.well-known/oauth-authorization-server      metadados do OAuth (RFC 8414)
 *   /oauth/register | authorize | token | revoke
 *   /mcp                                          MCP Streamable HTTP, sem sessão
 *
 * O /mcp só passa com Bearer válido de uma conta que É admin no momento da
 * chamada (checkBearer consulta o papel a cada requisição — rebaixar a conta
 * corta o acesso na hora, sem esperar o token vencer).
 *
 * Sem estado de sessão MCP: cada POST monta um servidor e um transporte novos
 * (o isolate do Worker não guarda nada entre requisições). Resposta em JSON,
 * não em SSE — nenhuma ferramenta aqui transmite progresso.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { CfWorkerJsonSchemaValidator } from "@modelcontextprotocol/sdk/validation/cfworker";
import { handleAuthorize } from "./authorize.ts";
import {
  MCP_PATH,
  authorizationServerMetadata,
  checkBearer,
  handleRegister,
  handleRevoke,
  handleToken,
  originOf,
  protectedResourceMetadata,
  type OAuthDeps,
} from "./oauth.ts";
import { WELL_KNOWN_AS, WELL_KNOWN_RESOURCE } from "./paths.ts";
import { TOOLS, runTool, type ToolDeps, type ToolResult, type ToolSpec } from "./tools.ts";

export type McpDeps = OAuthDeps & { tools: ToolDeps };

export const MCP_SERVER_NAME = "veronica";

/** Persona da Veronica (src/veronica/skills), curta, para quem opera o catálogo. */
export const MCP_INSTRUCTIONS = `Você está operando o Veronica Analytics pelo conector da Veronica, a assistente do Veronica Hub. Fale em português do Brasil, direta e calorosa, sem jargão e sem inventar dado.
- Quem está do outro lado é a administradora do Hub. Confirme antes de gravar (cadastrar, trocar mídia, ativar ou arquivar) e resuma o que mudou depois.
- Preço, comissão e link vêm dela ou do painel da Shopee — nunca invente. Link precisa ter a identificação de afiliado an_; link curto é expandido aqui.
- Capa e galeria: só HTTPS, até 4 imagens na galeria. Para tirar um produto do ar, arquive; nada é apagado.
- Clique não é venda: a venda acontece na Shopee. Quando um número não existir, diga isso.`;

function metadata(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=300",
      "access-control-allow-origin": "*",
    },
  });
}

export function buildMcpServer(adminId: string, deps: ToolDeps): McpServer {
  const server = new McpServer(
    { name: MCP_SERVER_NAME, title: "Veronica", version: "1.0.0" },
    {
      instructions: MCP_INSTRUCTIONS,
      // O validador padrão (Ajv) gera código com new Function, que o Worker proíbe.
      jsonSchemaValidator: new CfWorkerJsonSchemaValidator(),
    },
  );
  // Tipagem achatada de propósito: o genérico do SDK sobre ZodRawShape estoura
  // o limite de instanciação do TypeScript (TS2589) num laço de ferramentas.
  const register = server.registerTool.bind(server) as unknown as (
    name: string,
    config: {
      title: string;
      description: string;
      inputSchema: ToolSpec["inputSchema"];
      annotations: Record<string, boolean>;
    },
    cb: (input: Record<string, unknown>) => Promise<ToolResult>,
  ) => void;
  for (const spec of TOOLS) {
    register(
      spec.name,
      {
        title: spec.title,
        description: spec.description,
        inputSchema: spec.inputSchema,
        annotations: {
          readOnlyHint: spec.readOnly,
          destructiveHint: false,
          idempotentHint: spec.readOnly,
          openWorldHint: spec.name === "cadastrar_produto",
        },
      },
      // O SDK já validou os tipos contra o schema; as regras ficam no runTool.
      async (input: Record<string, unknown>) => runTool(spec, input, { adminId, deps }),
    );
  }
  return server;
}

async function handleMcp(request: Request, deps: McpDeps): Promise<Response> {
  const auth = await checkBearer(request, deps);
  if (!auth.ok) return auth.response;
  if (request.method !== "POST") {
    // Sem sessão não há stream GET nem DELETE de sessão para atender.
    return new Response(null, { status: 405, headers: { allow: "POST" } });
  }
  const server = buildMcpServer(auth.userId, deps.tools);
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  await server.connect(transport);
  try {
    return await transport.handleRequest(request);
  } finally {
    // Resposta JSON já está pronta aqui; fechar libera o servidor do isolate.
    void server.close();
  }
}

export async function handleMcpHttp(request: Request, deps: McpDeps): Promise<Response> {
  const { pathname } = new URL(request.url);
  const origin = originOf(request, deps);

  if (pathname.startsWith(WELL_KNOWN_RESOURCE)) return metadata(protectedResourceMetadata(origin));
  if (pathname.startsWith(WELL_KNOWN_AS)) return metadata(authorizationServerMetadata(origin));
  if (pathname === "/oauth/register") return handleRegister(request, deps);
  if (pathname === "/oauth/authorize") return handleAuthorize(request, deps);
  if (pathname === "/oauth/token") return handleToken(request, deps);
  if (pathname === "/oauth/revoke") return handleRevoke(request, deps);
  if (pathname === MCP_PATH) return handleMcp(request, deps);
  return new Response("not found", { status: 404 });
}
