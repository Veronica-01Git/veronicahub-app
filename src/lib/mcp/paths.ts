// Caminhos do conector MCP, num arquivo sem dependência: src/server.ts testa
// o caminho em toda requisição, e o SDK do MCP só deve carregar quando o
// caminho for de fato do conector.

export const MCP_PATH = "/mcp";
export const WELL_KNOWN_RESOURCE = "/.well-known/oauth-protected-resource";
export const WELL_KNOWN_AS = "/.well-known/oauth-authorization-server";

export function isMcpPath(pathname: string): boolean {
  return (
    pathname === MCP_PATH ||
    pathname === WELL_KNOWN_RESOURCE ||
    pathname === `${WELL_KNOWN_RESOURCE}${MCP_PATH}` ||
    pathname === WELL_KNOWN_AS ||
    pathname === `${WELL_KNOWN_AS}${MCP_PATH}` ||
    pathname.startsWith("/oauth/")
  );
}
