/**
 * OAUTH 2.1 DO CONECTOR MCP — servidor de autorização mínimo, só para o Claude.
 *
 * Por que não @cloudflare/workers-oauth-provider: ele guarda tudo num KV
 * (binding OAUTH_KV) e embrulha o `export default` do Worker inteiro. Este
 * repositório não tem wrangler.toml (o Worker é gerado pelo nitro do build da
 * Lovable), então não há onde declarar o KV, e o fetch padrão já é do
 * src/server.ts. A alternativa foi este módulo pequeno, com o estado no Neon.
 *
 * O QUE ELE FAZ, E O QUE O CLAUDE EXIGE (claude.com/docs/connectors/building/authentication):
 *   - 401 com `WWW-Authenticate: Bearer resource_metadata=…` em /mcp sem token;
 *   - metadados RFC 9728 (recurso) e RFC 8414 (servidor de autorização);
 *   - registro dinâmico de cliente (RFC 7591) SEM ESTADO: o client_id carrega
 *     as redirect_uris registradas, assinadas com HMAC — nada de tabela de
 *     cliente, e ninguém troca a redirect_uri de um client_id existente;
 *   - PKCE S256 obrigatório; código de uso único com 5 minutos;
 *   - token de acesso de 1 hora e refresh de 14 dias com rotação. Reapresentar
 *     um refresh já usado revoga a família inteira (roubo de token);
 *   - revogação RFC 7009 em /oauth/revoke.
 *
 * Token nunca é gravado em claro: o banco guarda SHA-256. Este arquivo não
 * conhece banco, e-mail nem sessão — tudo chega por `OAuthDeps`, e é isso que
 * deixa o teste rodar sem rede.
 */

import { MCP_PATH } from "./paths.ts";

export { MCP_PATH };

export const ACCESS_TTL_S = 60 * 60;
export const REFRESH_TTL_S = 14 * 24 * 60 * 60;
export const CODE_TTL_S = 5 * 60;
export const SCOPE = "analytics";
const MAX_REDIRECTS = 5;

/** Callbacks aceitos. Hosted (claude.ai/claude.com) e o loopback do Claude Code. */
const HOSTED_CALLBACKS = new Set([
  "https://claude.ai/api/mcp/auth_callback",
  "https://claude.com/api/mcp/auth_callback",
]);

export type GrantKind = "code" | "access" | "refresh";

export type Grant = {
  kind: GrantKind;
  userId: string;
  clientId: string;
  /** Liga código, acessos e refreshes de uma mesma autorização — revoga junto. */
  familyId: string;
  scope: string;
  expiresAt: Date;
  codeChallenge?: string | null;
  redirectUri?: string | null;
};

export interface OAuthStore {
  insert(tokenHash: string, grant: Grant): Promise<void>;
  /** Uso único: marca como consumido e devolve, ou null se inválido/usado/vencido. */
  consume(tokenHash: string, kind: GrantKind, now: Date): Promise<Grant | null>;
  /** Válido, não revogado, não consumido e dentro da validade. */
  findActive(tokenHash: string, kind: GrantKind, now: Date): Promise<Grant | null>;
  /** Família de qualquer token já emitido (mesmo usado ou vencido), ou null. */
  familyOf(tokenHash: string): Promise<string | null>;
  revokeFamily(familyId: string, now: Date): Promise<void>;
  /** Revoga só os tokens de um tipo na família (ex.: acessos antigos no refresh). */
  revokeKind(familyId: string, kind: GrantKind, now: Date): Promise<void>;
}

export type AdminRef = { id: string };

export type OAuthDeps = {
  /** MCP_OAUTH_SECRET — assina o client_id. Mínimo 32 caracteres. */
  secret: string;
  /** MCP_PUBLIC_ORIGIN; sem ele, a origem da própria requisição. */
  publicOrigin?: string;
  store: OAuthStore;
  now?: () => Date;
  findAdminByEmail(email: string): Promise<AdminRef | null>;
  findAdminById(id: string): Promise<AdminRef | null>;
  sendLoginCode(email: string): Promise<{ ok: true } | { ok: false; error: string }>;
  consumeLoginCode(
    email: string,
    code: string,
  ): Promise<{ ok: true } | { ok: false; error: string }>;
};

/* ------------------------------------------------------------ cripto */

const enc = new TextEncoder();

function b64url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(value: string): string {
  const pad = value.replace(/-/g, "+").replace(/_/g, "/");
  return atob(pad + "=".repeat((4 - (pad.length % 4)) % 4));
}

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(value));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmac(secret: string, value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return b64url(new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(value))));
}

/** Comparação em tempo constante para strings do mesmo alfabeto. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function randomToken(prefix: string): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return `${prefix}${b64url(bytes)}`;
}

async function pkceS256(verifier: string): Promise<string> {
  return b64url(new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(verifier))));
}

/* ------------------------------------------------- cliente sem estado */

export type RegisteredClient = { redirectUris: string[]; name: string };

/**
 * Callback aceito: os dois hosted do Claude, exatos, ou loopback HTTP com
 * qualquer porta (RFC 8252 §7.3), como o Claude Code usa.
 */
export function isAllowedRedirect(uri: string): boolean {
  if (HOSTED_CALLBACKS.has(uri)) return true;
  try {
    const u = new URL(uri);
    return (
      u.protocol === "http:" &&
      (u.hostname === "localhost" || u.hostname === "127.0.0.1") &&
      !u.username &&
      !u.password &&
      !u.hash
    );
  } catch {
    return false;
  }
}

function isLoopback(uri: string): boolean {
  return !HOSTED_CALLBACKS.has(uri);
}

/** Igualdade exata, salvo loopback, que ignora só a porta (RFC 8252 §7.3). */
function redirectMatches(registered: string, presented: string): boolean {
  if (registered === presented) return true;
  if (!isLoopback(registered) || !isAllowedRedirect(presented)) return false;
  const a = new URL(registered);
  const b = new URL(presented);
  return a.hostname === b.hostname && a.pathname === b.pathname && a.search === b.search;
}

export async function issueClientId(secret: string, client: RegisteredClient): Promise<string> {
  const body = b64url(enc.encode(JSON.stringify({ r: client.redirectUris, n: client.name })));
  return `vmcp.${body}.${await hmac(secret, body)}`;
}

export async function readClientId(
  secret: string,
  clientId: string | null,
): Promise<RegisteredClient | null> {
  if (!clientId) return null;
  const [prefix, body, sig] = clientId.split(".");
  if (prefix !== "vmcp" || !body || !sig) return null;
  if (!safeEqual(sig, await hmac(secret, body))) return null;
  try {
    const parsed = JSON.parse(fromB64url(body)) as { r?: unknown; n?: unknown };
    if (!Array.isArray(parsed.r) || !parsed.r.every((u) => typeof u === "string")) return null;
    return {
      redirectUris: parsed.r as string[],
      name: typeof parsed.n === "string" ? parsed.n : "",
    };
  } catch {
    return null;
  }
}

/* --------------------------------------------------------- respostas */

const NO_STORE = { "cache-control": "no-store", pragma: "no-cache" };

function json(body: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...NO_STORE, ...extra },
  });
}

function oauthError(error: string, description: string, status = 400): Response {
  return json({ error, error_description: description }, status);
}

export function originOf(request: Request, deps: Pick<OAuthDeps, "publicOrigin">): string {
  return (deps.publicOrigin || new URL(request.url).origin).replace(/\/+$/, "");
}

export function resourceMetadataUrl(origin: string): string {
  return `${origin}/.well-known/oauth-protected-resource`;
}

export function unauthorized(origin: string, error?: "invalid_token"): Response {
  const parts = [
    `resource_metadata="${resourceMetadataUrl(origin)}"`,
    `scope="${SCOPE}"`,
    ...(error ? [`error="${error}"`] : []),
  ];
  return json(
    { error: error ?? "unauthorized", error_description: "Token ausente ou inválido." },
    401,
    { "www-authenticate": `Bearer ${parts.join(", ")}` },
  );
}

export function protectedResourceMetadata(origin: string) {
  return {
    resource: `${origin}${MCP_PATH}`,
    authorization_servers: [origin],
    scopes_supported: [SCOPE],
    bearer_methods_supported: ["header"],
    resource_name: "Veronica Analytics (MCP)",
  };
}

export function authorizationServerMetadata(origin: string) {
  return {
    issuer: origin,
    authorization_endpoint: `${origin}/oauth/authorize`,
    token_endpoint: `${origin}/oauth/token`,
    registration_endpoint: `${origin}/oauth/register`,
    revocation_endpoint: `${origin}/oauth/revoke`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["none"],
    revocation_endpoint_auth_methods_supported: ["none"],
    scopes_supported: [SCOPE, "offline_access"],
  };
}

/* ------------------------------------------------------ registro DCR */

export async function handleRegister(request: Request, deps: OAuthDeps): Promise<Response> {
  if (request.method !== "POST")
    return new Response(null, { status: 405, headers: { allow: "POST" } });
  let body: { redirect_uris?: unknown; client_name?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return oauthError("invalid_client_metadata", "Corpo JSON inválido.");
  }
  const uris = body.redirect_uris;
  if (
    !Array.isArray(uris) ||
    uris.length === 0 ||
    uris.length > MAX_REDIRECTS ||
    !uris.every((u) => typeof u === "string" && isAllowedRedirect(u))
  ) {
    return oauthError(
      "invalid_redirect_uri",
      "Só são aceitos o callback do Claude (claude.ai/claude.com) e loopback local.",
    );
  }
  const name =
    typeof body.client_name === "string"
      ? body.client_name.replace(/[^\p{L}\p{N} ._-]/gu, "").slice(0, 60)
      : "";
  const clientId = await issueClientId(deps.secret, { redirectUris: uris as string[], name });
  return json(
    {
      client_id: clientId,
      client_id_issued_at: Math.floor((deps.now?.() ?? new Date()).getTime() / 1000),
      client_name: name || undefined,
      redirect_uris: uris,
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
    },
    201,
  );
}

/* ------------------------------------------------- pedido de autorização */

export type AuthorizeParams = {
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  state: string;
  clientName: string;
};

/**
 * Valida o pedido de autorização. Erro aqui NUNCA redireciona: sem client_id
 * e redirect_uri conferidos, mandar o navegador para a URL do pedido seria
 * um redirecionamento aberto.
 */
export async function parseAuthorizeRequest(
  params: URLSearchParams,
  deps: OAuthDeps,
  origin: string,
): Promise<{ ok: true; value: AuthorizeParams } | { ok: false; error: string }> {
  const client = await readClientId(deps.secret, params.get("client_id"));
  if (!client) return { ok: false, error: "Cliente OAuth desconhecido." };
  const redirectUri = params.get("redirect_uri") ?? "";
  if (!client.redirectUris.some((r) => redirectMatches(r, redirectUri))) {
    return { ok: false, error: "redirect_uri não registrada para este cliente." };
  }
  if (params.get("response_type") !== "code")
    return { ok: false, error: "response_type deve ser code." };
  const codeChallenge = params.get("code_challenge") ?? "";
  if (
    params.get("code_challenge_method") !== "S256" ||
    !/^[A-Za-z0-9_-]{43,128}$/.test(codeChallenge)
  ) {
    return { ok: false, error: "PKCE S256 é obrigatório." };
  }
  const resource = params.get("resource");
  if (resource && resource.replace(/\/+$/, "") !== `${origin}${MCP_PATH}`) {
    return { ok: false, error: "resource não corresponde a este servidor." };
  }
  return {
    ok: true,
    value: {
      clientId: params.get("client_id")!,
      redirectUri,
      codeChallenge,
      state: (params.get("state") ?? "").slice(0, 500),
      clientName: client.name,
    },
  };
}

/** Depois do login por código: emite o código de autorização e o redirect. */
export async function issueAuthorizationCode(
  req: AuthorizeParams,
  userId: string,
  deps: OAuthDeps,
): Promise<string> {
  const now = deps.now?.() ?? new Date();
  const code = randomToken("vmcp_code_");
  await deps.store.insert(await sha256Hex(code), {
    kind: "code",
    userId,
    clientId: req.clientId,
    familyId: crypto.randomUUID(),
    scope: SCOPE,
    expiresAt: new Date(now.getTime() + CODE_TTL_S * 1000),
    codeChallenge: req.codeChallenge,
    redirectUri: req.redirectUri,
  });
  const target = new URL(req.redirectUri);
  target.searchParams.set("code", code);
  if (req.state) target.searchParams.set("state", req.state);
  return target.toString();
}

/* ------------------------------------------------------------- token */

async function issuePair(
  base: { userId: string; clientId: string; familyId: string },
  deps: OAuthDeps,
): Promise<Response> {
  const now = deps.now?.() ?? new Date();
  const access = randomToken("vmcp_at_");
  const refresh = randomToken("vmcp_rt_");
  await deps.store.insert(await sha256Hex(access), {
    ...base,
    kind: "access",
    scope: SCOPE,
    expiresAt: new Date(now.getTime() + ACCESS_TTL_S * 1000),
  });
  await deps.store.insert(await sha256Hex(refresh), {
    ...base,
    kind: "refresh",
    scope: SCOPE,
    expiresAt: new Date(now.getTime() + REFRESH_TTL_S * 1000),
  });
  return json({
    access_token: access,
    token_type: "Bearer",
    expires_in: ACCESS_TTL_S,
    refresh_token: refresh,
    scope: SCOPE,
  });
}

async function readForm(request: Request): Promise<URLSearchParams | null> {
  const type = request.headers.get("content-type") ?? "";
  if (!type.includes("application/x-www-form-urlencoded")) return null;
  return new URLSearchParams(await request.text());
}

export async function handleToken(request: Request, deps: OAuthDeps): Promise<Response> {
  if (request.method !== "POST")
    return new Response(null, { status: 405, headers: { allow: "POST" } });
  const form = await readForm(request);
  if (!form) return oauthError("invalid_request", "Use application/x-www-form-urlencoded.");
  const now = deps.now?.() ?? new Date();
  const clientId = form.get("client_id") ?? "";
  if (!(await readClientId(deps.secret, clientId))) {
    return oauthError("invalid_client", "Cliente OAuth desconhecido.", 401);
  }

  const grantType = form.get("grant_type");
  if (grantType === "authorization_code") {
    const code = form.get("code") ?? "";
    const grant = await deps.store.consume(await sha256Hex(code), "code", now);
    if (!grant || grant.clientId !== clientId) {
      return oauthError("invalid_grant", "Código inválido, vencido ou já usado.");
    }
    if (grant.redirectUri !== (form.get("redirect_uri") ?? grant.redirectUri)) {
      return oauthError("invalid_grant", "redirect_uri diferente da autorização.");
    }
    const verifier = form.get("code_verifier") ?? "";
    if (
      !/^[A-Za-z0-9._~-]{43,128}$/.test(verifier) ||
      (await pkceS256(verifier)) !== grant.codeChallenge
    ) {
      return oauthError("invalid_grant", "code_verifier não confere.");
    }
    if (!(await deps.findAdminById(grant.userId))) {
      return oauthError("invalid_grant", "Conta sem acesso ao conector.");
    }
    return issuePair(grant, deps);
  }

  if (grantType === "refresh_token") {
    const hash = await sha256Hex(form.get("refresh_token") ?? "");
    const grant = await deps.store.consume(hash, "refresh", now);
    if (!grant) {
      // Refresh já usado reapresentado = token copiado. Derruba a família.
      const family = await deps.store.familyOf(hash);
      if (family) await deps.store.revokeFamily(family, now);
      return oauthError("invalid_grant", "Refresh token inválido, vencido ou revogado.");
    }
    if (grant.clientId !== clientId) {
      await deps.store.revokeFamily(grant.familyId, now);
      return oauthError("invalid_grant", "Refresh token de outro cliente.");
    }
    if (!(await deps.findAdminById(grant.userId))) {
      await deps.store.revokeFamily(grant.familyId, now);
      return oauthError("invalid_grant", "Conta sem acesso ao conector.");
    }
    // Renovou: o acesso anterior desta conexão deixa de valer agora, e não só
    // quando vencer. Só um token de acesso vivo por conexão.
    await deps.store.revokeKind(grant.familyId, "access", now);
    return issuePair(grant, deps);
  }

  return oauthError("unsupported_grant_type", "Use authorization_code ou refresh_token.");
}

/** RFC 7009: responde 200 sempre, revogando a família se o token existir. */
export async function handleRevoke(request: Request, deps: OAuthDeps): Promise<Response> {
  if (request.method !== "POST")
    return new Response(null, { status: 405, headers: { allow: "POST" } });
  const form = await readForm(request);
  if (!form) return oauthError("invalid_request", "Use application/x-www-form-urlencoded.");
  const token = form.get("token") ?? "";
  if (token) {
    const family = await deps.store.familyOf(await sha256Hex(token));
    if (family) await deps.store.revokeFamily(family, deps.now?.() ?? new Date());
  }
  return new Response(null, { status: 200, headers: NO_STORE });
}

/* ------------------------------------------------- portão do /mcp */

export type BearerCheck = { ok: true; userId: string } | { ok: false; response: Response };

/**
 * Sem token / token vencido / revogado → 401 (o Claude renova ou reautoriza).
 * Token válido de quem não é (mais) admin → 403: reautorizar não resolve.
 */
export async function checkBearer(request: Request, deps: OAuthDeps): Promise<BearerCheck> {
  const origin = originOf(request, deps);
  const header = request.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(\S+)$/i.exec(header);
  if (!match) return { ok: false, response: unauthorized(origin) };
  const grant = await deps.store.findActive(
    await sha256Hex(match[1]),
    "access",
    deps.now?.() ?? new Date(),
  );
  if (!grant) return { ok: false, response: unauthorized(origin, "invalid_token") };
  const admin = await deps.findAdminById(grant.userId);
  if (!admin) {
    return {
      ok: false,
      response: json(
        { error: "forbidden", error_description: "Conector restrito à conta admin." },
        403,
      ),
    };
  }
  return { ok: true, userId: admin.id };
}
