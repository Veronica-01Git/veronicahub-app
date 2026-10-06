import test from "node:test";
import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { handleMcpHttp, MCP_INSTRUCTIONS } from "../src/lib/mcp/http.ts";
import { isMcpPath } from "../src/lib/mcp/paths.ts";
import { issueClientId, sha256Hex, ACCESS_TTL_S } from "../src/lib/mcp/oauth.ts";
import { TOOLS, MAX_CALLS_PER_MINUTE } from "../src/lib/mcp/tools.ts";
import { registeredAgent, toolDefinition } from "../src/lib/ai/agent-registry.ts";

/**
 * Conector MCP "Veronica", fase 1. Nada aqui toca rede ou banco: o
 * armazenamento OAuth, o catálogo, o registro de execução e o envio do código
 * por e-mail são falsos, controlados pelo teste.
 */

const ORIGIN = "https://veronicahub.com";
const CALLBACK = "https://claude.ai/api/mcp/auth_callback";
const SECRET = "s".repeat(40);
const ler = (rel) => readFileSync(new URL(rel, import.meta.url), "utf8");

const LINK_OK =
  "https://shopee.com.br/Produto-teste-i.123.456?mmp_pid=an_18123456789&utm_content=veronica----&utm_source=an_18123456789";
const LINK_SEM_AFILIADO = "https://shopee.com.br/Produto-teste-i.123.456?utm_content=veronica----";

function memoryStore() {
  const rows = new Map();
  return {
    rows,
    async insert(hash, grant) {
      rows.set(hash, { ...grant, consumedAt: null, revokedAt: null });
    },
    async consume(hash, kind, now) {
      const r = rows.get(hash);
      if (!r || r.kind !== kind || r.consumedAt || r.revokedAt || r.expiresAt <= now) return null;
      r.consumedAt = now;
      return r;
    },
    async findActive(hash, kind, now) {
      const r = rows.get(hash);
      if (!r || r.kind !== kind || r.consumedAt || r.revokedAt || r.expiresAt <= now) return null;
      return r;
    },
    async familyOf(hash) {
      return rows.get(hash)?.familyId ?? null;
    },
    async revokeKind(familyId, kind, now) {
      for (const r of rows.values())
        if (r.familyId === familyId && r.kind === kind && !r.revokedAt) r.revokedAt = now;
    },
    async revokeFamily(familyId, now) {
      for (const r of rows.values()) if (r.familyId === familyId && !r.revokedAt) r.revokedAt = now;
    },
  };
}

function cenario() {
  const clock = { now: new Date("2026-10-03T12:00:00Z") };
  const users = new Map([
    ["admin@veronicahub.com", { id: "u-admin", admin: true }],
    ["membro@exemplo.com", { id: "u-membro", admin: false }],
  ]);
  const enviados = [];
  const codigos = new Map();
  const execucoes = [];
  const produtos = new Map([
    [
      "garrafa-termica",
      {
        id: "garrafa-termica",
        name: "Garrafa térmica",
        category: "casa",
        affiliateUrl: LINK_OK,
        priceLabel: "R$ 49,90",
        angle: "Mantém gelado o dia inteiro na academia",
        audience: "unissex",
        active: false,
        priority: 10,
        clicks30d: 7,
        updatedAt: "2026-10-01T00:00:00.000Z",
      },
    ],
  ]);
  const deps = {
    secret: SECRET,
    publicOrigin: ORIGIN,
    now: () => clock.now,
    store: memoryStore(),
    async findAdminByEmail(email) {
      const u = users.get(email);
      return u?.admin ? { id: u.id } : null;
    },
    async findAdminById(id) {
      const u = [...users.values()].find((x) => x.id === id);
      return u?.admin ? { id: u.id } : null;
    },
    async sendLoginCode(email) {
      enviados.push(email);
      codigos.set(email, "123456");
      return { ok: true };
    },
    async consumeLoginCode(email, code) {
      if (codigos.get(email) !== code) return { ok: false, error: "Código incorreto." };
      codigos.delete(email);
      return { ok: true };
    },
    tools: {
      catalog: {
        async list() {
          return [...produtos.values()];
        },
        async save(input) {
          const p = { ...input, active: true, clicks30d: 0, updatedAt: clock.now.toISOString() };
          produtos.set(input.id, p);
          return input;
        },
        async updateMedia(id, coverUrl, galleryUrls) {
          const p = produtos.get(id);
          if (!p) return null;
          Object.assign(p, { coverUrl: coverUrl ?? undefined, galleryUrls });
          return p;
        },
        async setActive(id, active) {
          const p = produtos.get(id);
          if (!p) return false;
          p.active = active;
          return true;
        },
        async clicks({ productId, days }) {
          return {
            byProduct: [{ productId: productId ?? "garrafa-termica", clicks: days === 7 ? 3 : 7 }],
            daily: productId ? [{ date: "2026-10-02", clicks: 3 }] : [],
          };
        },
      },
      executions: {
        async countSince(actorId, since) {
          return execucoes.filter((e) => e.actorId === actorId && e.queuedAt > since).length;
        },
        async start(entry) {
          const id = `exec-${execucoes.length + 1}`;
          execucoes.push({ id, ...entry, status: "RUNNING", queuedAt: new Date() });
          return id;
        },
        async finish(id, result) {
          Object.assign(
            execucoes.find((e) => e.id === id),
            result,
          );
        },
      },
      async membersStatus() {
        return { name: "Agente Members", enabled: true, health: "active" };
      },
      // Link curto da Shopee: um salto para o link completo, sem rede.
      async fetchImpl(url) {
        assert.match(url, /^https:\/\/s\.shopee\.com\.br\//);
        return new Response(null, { status: 302, headers: { location: LINK_OK } });
      },
    },
  };
  return { deps, clock, users, enviados, execucoes, produtos };
}

const call = (deps, path, init = {}) => handleMcpHttp(new Request(`${ORIGIN}${path}`, init), deps);
const form = (data) => ({
  method: "POST",
  headers: { "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams(data).toString(),
});

function pkce() {
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

/** Fluxo completo como o Claude faz: registro, tela de login, código, token. */
async function autorizar(c, email = "admin@veronicahub.com") {
  const reg = await call(c.deps, "/oauth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ redirect_uris: [CALLBACK], client_name: "Claude" }),
  });
  assert.equal(reg.status, 201);
  const { client_id } = await reg.json();
  const { verifier, challenge } = pkce();
  const pedido = {
    response_type: "code",
    client_id,
    redirect_uri: CALLBACK,
    code_challenge: challenge,
    code_challenge_method: "S256",
    state: "estado-xyz",
    resource: `${ORIGIN}/mcp`,
  };
  const tela = await call(c.deps, `/oauth/authorize?${new URLSearchParams(pedido)}`);
  assert.equal(tela.status, 200);
  assert.match(await tela.text(), /claude\.ai/);
  const passo1 = await call(c.deps, "/oauth/authorize", form({ ...pedido, step: "email", email }));
  assert.equal(passo1.status, 200);
  const passo2 = await call(
    c.deps,
    "/oauth/authorize",
    form({ ...pedido, step: "code", email, code: "123456" }),
  );
  return { passo2, client_id, verifier };
}

async function tokenAdmin(c) {
  const { passo2, client_id, verifier } = await autorizar(c);
  assert.equal(passo2.status, 302);
  const destino = new URL(passo2.headers.get("location"));
  assert.equal(`${destino.origin}${destino.pathname}`, CALLBACK);
  assert.equal(destino.searchParams.get("state"), "estado-xyz");
  const resp = await call(
    c.deps,
    "/oauth/token",
    form({
      grant_type: "authorization_code",
      code: destino.searchParams.get("code"),
      redirect_uri: CALLBACK,
      client_id,
      code_verifier: verifier,
    }),
  );
  assert.equal(resp.status, 200);
  return { ...(await resp.json()), client_id };
}

async function rpc(deps, token, method, params = {}) {
  const resp = await call(deps, "/mcp", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  return { status: resp.status, resp, body: resp.status === 200 ? await resp.json() : null };
}

const ferramenta = async (c, token, name, args = {}) => {
  const { body } = await rpc(c.deps, token, "tools/call", { name, arguments: args });
  const r = body.result;
  return { ...r, data: r.isError ? null : JSON.parse(r.content[0].text), texto: r.content[0].text };
};

/* =============================================================== auth */

test("sem token → 401 com o ponteiro de metadados que o Claude exige", async () => {
  const c = cenario();
  const { status, resp } = await rpc(c.deps, null, "tools/list");
  assert.equal(status, 401);
  assert.match(
    resp.headers.get("www-authenticate"),
    /^Bearer resource_metadata="https:\/\/veronicahub\.com\/\.well-known\/oauth-protected-resource"/,
  );
  const meta = await (await call(c.deps, "/.well-known/oauth-protected-resource")).json();
  assert.equal(meta.resource, `${ORIGIN}/mcp`);
  assert.deepEqual(meta.authorization_servers, [ORIGIN]);
  const as = await (await call(c.deps, "/.well-known/oauth-authorization-server")).json();
  assert.deepEqual(as.code_challenge_methods_supported, ["S256"]);
  assert.ok(as.registration_endpoint.endsWith("/oauth/register"));
  // Token inventado também é 401.
  assert.equal((await rpc(c.deps, "vmcp_at_inventado", "tools/list")).status, 401);
});

test("admin completa o login por código e recebe token de validade curta", async () => {
  const c = cenario();
  const t = await tokenAdmin(c);
  assert.equal(t.token_type, "Bearer");
  assert.equal(t.expires_in, ACCESS_TTL_S);
  assert.ok(ACCESS_TTL_S <= 3600, "token de acesso precisa ser curto");
  assert.deepEqual(c.enviados, ["admin@veronicahub.com"]);
  // O banco guarda hash, nunca o token.
  assert.ok(!c.deps.store.rows.has(t.access_token));
  assert.ok(c.deps.store.rows.has(await sha256Hex(t.access_token)));
  const { status, body } = await rpc(c.deps, t.access_token, "tools/list");
  assert.equal(status, 200);
  assert.deepEqual(body.result.tools.map((x) => x.name).sort(), [
    "ativar_arquivar_produto",
    "cadastrar_produto",
    "definir_capa_e_galeria",
    "listar_produtos",
    "status_dos_agentes",
    "ver_cliques",
  ]);
});

test("não-admin não recebe código nem token", async () => {
  const c = cenario();
  const { passo2 } = await autorizar(c, "membro@exemplo.com");
  assert.equal(passo2.status, 403);
  assert.equal(c.enviados.length, 0, "código não pode ser enviado a quem não é admin");
  assert.equal(c.deps.store.rows.size, 0, "nenhum código OAuth emitido");
});

test("token de não-admin → recusado (403), inclusive admin rebaixado depois", async () => {
  const c = cenario();
  // Token emitido direto para uma conta comum (simula linha antiga no banco).
  await c.deps.store.insert(await sha256Hex("vmcp_at_comum"), {
    kind: "access",
    userId: "u-membro",
    clientId: "x",
    familyId: "f-comum",
    scope: "analytics",
    expiresAt: new Date(c.clock.now.getTime() + 60_000),
  });
  assert.equal((await rpc(c.deps, "vmcp_at_comum", "tools/list")).status, 403);

  const t = await tokenAdmin(c);
  assert.equal((await rpc(c.deps, t.access_token, "tools/list")).status, 200);
  c.users.get("admin@veronicahub.com").admin = false;
  assert.equal((await rpc(c.deps, t.access_token, "tools/list")).status, 403);
  const refresh = await call(
    c.deps,
    "/oauth/token",
    form({ grant_type: "refresh_token", refresh_token: t.refresh_token, client_id: t.client_id }),
  );
  assert.equal(refresh.status, 400);
  assert.equal((await refresh.json()).error, "invalid_grant");
});

test("token expirado → 401 invalid_token; refresh rotaciona e reuso derruba a família", async () => {
  const c = cenario();
  const t = await tokenAdmin(c);
  c.clock.now = new Date(c.clock.now.getTime() + (ACCESS_TTL_S + 1) * 1000);
  const vencido = await rpc(c.deps, t.access_token, "tools/list");
  assert.equal(vencido.status, 401);
  assert.match(vencido.resp.headers.get("www-authenticate"), /error="invalid_token"/);

  const renovar = (rt) =>
    call(
      c.deps,
      "/oauth/token",
      form({ grant_type: "refresh_token", refresh_token: rt, client_id: t.client_id }),
    );
  const novo = await (await renovar(t.refresh_token)).json();
  assert.ok(novo.access_token && novo.refresh_token !== t.refresh_token);
  assert.equal((await rpc(c.deps, novo.access_token, "tools/list")).status, 200);

  // Reapresentar o refresh antigo = token copiado: tudo da família cai.
  assert.equal((await renovar(t.refresh_token)).status, 400);
  assert.equal((await rpc(c.deps, novo.access_token, "tools/list")).status, 401);
});

test("revogação RFC 7009 corta o acesso na hora", async () => {
  const c = cenario();
  const t = await tokenAdmin(c);
  const r = await call(c.deps, "/oauth/revoke", form({ token: t.refresh_token }));
  assert.equal(r.status, 200);
  assert.equal((await rpc(c.deps, t.access_token, "tools/list")).status, 401);
});

test("OAuth recusa callback estranho, client_id adulterado, PKCE errado e código reusado", async () => {
  const c = cenario();
  const reg = await call(c.deps, "/oauth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ redirect_uris: ["https://evil.example/callback"] }),
  });
  assert.equal(reg.status, 400);

  // client_id assinado com outro segredo não vale.
  const falso = await issueClientId("x".repeat(40), { redirectUris: [CALLBACK], name: "Claude" });
  const tela = await call(
    c.deps,
    `/oauth/authorize?${new URLSearchParams({ response_type: "code", client_id: falso, redirect_uri: CALLBACK, code_challenge: "a".repeat(43), code_challenge_method: "S256" })}`,
  );
  assert.equal(tela.status, 400);

  const { passo2, client_id } = await autorizar(c);
  const code = new URL(passo2.headers.get("location")).searchParams.get("code");
  const troca = (verifier) =>
    call(
      c.deps,
      "/oauth/token",
      form({
        grant_type: "authorization_code",
        code,
        redirect_uri: CALLBACK,
        client_id,
        code_verifier: verifier,
      }),
    );
  assert.equal((await troca(pkce().verifier)).status, 400, "verifier errado");
  // O código é de uso único: mesmo com o verifier certo, já foi consumido.
  assert.equal((await troca(pkce().verifier)).status, 400);
});

/* ========================================================== ferramentas */

test("cadastrar_produto rejeita link sem an_ e aceita link válido (inclusive curto)", async () => {
  const c = cenario();
  const { access_token: tk } = await tokenAdmin(c);
  const base = {
    name: "Mini processador",
    category: "casa",
    priceLabel: "R$ 39,90",
    angle: "Pica cebola em três segundos, ótimo para vídeo curto",
  };

  const semAfiliado = await ferramenta(c, tk, "cadastrar_produto", {
    ...base,
    affiliateUrl: LINK_SEM_AFILIADO,
  });
  assert.equal(semAfiliado.isError, true);
  assert.match(semAfiliado.texto, /an_/);

  const http = await ferramenta(c, tk, "cadastrar_produto", {
    ...base,
    affiliateUrl: LINK_OK.replace("https", "http"),
  });
  assert.equal(http.isError, true);

  const semSubId = await ferramenta(c, tk, "cadastrar_produto", {
    ...base,
    affiliateUrl: "https://shopee.com.br/x-i.1.2?mmp_pid=an_123",
  });
  // Mesma regra do painel: sem Sub_id, recebe o da casa.
  assert.match(semSubId.data.produto.affiliateUrl, /utm_content=veronica----/);

  const ok = await ferramenta(c, tk, "cadastrar_produto", {
    ...base,
    affiliateUrl: "https://s.shopee.com.br/abc123",
    coverUrl: "https://cdn.exemplo.com/capa.webp",
    galleryUrls: ["https://cdn.exemplo.com/1.webp", "http://inseguro.exemplo.com/2.webp"],
  });
  assert.equal(ok.isError, undefined);
  assert.equal(ok.data.produto.affiliateUrl, LINK_OK);
  assert.deepEqual(ok.data.produto.galleryUrls, ["https://cdn.exemplo.com/1.webp"]);
  assert.deepEqual(ok.data.midiaDescartada, ["http://inseguro.exemplo.com/2.webp"]);
  assert.ok(c.produtos.has(ok.data.produto.id));

  const categoria = await ferramenta(c, tk, "cadastrar_produto", {
    ...base,
    category: "armas",
    affiliateUrl: LINK_OK,
  });
  assert.equal(categoria.isError, true);
});

test("definir_capa_e_galeria rejeita http e mais de 4 URLs", async () => {
  const c = cenario();
  const { access_token: tk } = await tokenAdmin(c);
  const https = (n) => `https://cdn.exemplo.com/${n}.webp`;

  const capaHttp = await ferramenta(c, tk, "definir_capa_e_galeria", {
    id: "garrafa-termica",
    coverUrl: "http://cdn.exemplo.com/capa.webp",
  });
  assert.equal(capaHttp.isError, true);

  const galeriaHttp = await ferramenta(c, tk, "definir_capa_e_galeria", {
    id: "garrafa-termica",
    galleryUrls: [https(1), "http://cdn.exemplo.com/2.webp"],
  });
  assert.equal(galeriaHttp.isError, true);

  const cinco = await ferramenta(c, tk, "definir_capa_e_galeria", {
    id: "garrafa-termica",
    galleryUrls: [1, 2, 3, 4, 5].map(https),
  });
  assert.equal(cinco.isError, true);
  assert.match(cinco.texto, /4/);
  assert.equal(c.produtos.get("garrafa-termica").galleryUrls, undefined, "nada gravado na recusa");

  const ok = await ferramenta(c, tk, "definir_capa_e_galeria", {
    id: "garrafa-termica",
    coverUrl: https("capa"),
    galleryUrls: [1, 2, 3, 4].map(https),
  });
  assert.equal(ok.isError, undefined);
  assert.equal(c.produtos.get("garrafa-termica").galleryUrls.length, 4);

  const inexistente = await ferramenta(c, tk, "definir_capa_e_galeria", {
    id: "nao-existe",
    coverUrl: https("x"),
  });
  assert.equal(inexistente.isError, true);
});

test("listar, ativar/arquivar, cliques e status dos agentes", async () => {
  const c = cenario();
  const { access_token: tk } = await tokenAdmin(c);

  const lista = await ferramenta(c, tk, "listar_produtos");
  assert.equal(lista.data.produtos[0].active, false, "inclui arquivados");
  assert.equal(lista.data.produtos[0].clicks30d, 7);

  const ativar = await ferramenta(c, tk, "ativar_arquivar_produto", {
    id: "garrafa-termica",
    active: true,
  });
  assert.equal(ativar.data.active, true);
  assert.equal(c.produtos.get("garrafa-termica").active, true);

  const cliques = await ferramenta(c, tk, "ver_cliques", { productId: "garrafa-termica", days: 7 });
  assert.equal(cliques.data.total, 3);
  assert.equal(cliques.data.daily.length, 1);
  assert.equal((await ferramenta(c, tk, "ver_cliques", { days: 0 })).isError, true);

  const status = await ferramenta(c, tk, "status_dos_agentes");
  assert.ok(status.data.registro.some((a) => a.slug === "veronica-mcp"));
  assert.equal(status.data.members.health, "active");
  // DTO público: sem tetos, tenants ou regras internas.
  assert.ok(!JSON.stringify(status.data.registro).includes("maxCost"));
});

test("toda chamada de ferramenta gera registro em AgentExecution, sem e-mail nem token", async () => {
  const c = cenario();
  const t = await tokenAdmin(c);
  const chamadas = [
    ["listar_produtos", {}],
    [
      "cadastrar_produto",
      { name: "X", category: "casa", affiliateUrl: LINK_OK, priceLabel: "R$ 1", angle: "curto" },
    ],
    [
      "cadastrar_produto",
      {
        name: "Produto ok",
        category: "casa",
        affiliateUrl: LINK_OK,
        priceLabel: "R$ 1",
        angle: "ângulo de venda claro",
      },
    ],
    ["definir_capa_e_galeria", { id: "garrafa-termica", coverUrl: "http://x.com/a.png" }],
    ["definir_capa_e_galeria", { id: "garrafa-termica", coverUrl: "https://x.com/a.png" }],
    ["ativar_arquivar_produto", { id: "nao-existe", active: false }],
    ["ativar_arquivar_produto", { id: "garrafa-termica", active: true }],
    ["ver_cliques", {}],
    ["status_dos_agentes", {}],
  ];
  for (const [name, args] of chamadas) await ferramenta(c, t.access_token, name, args);

  assert.equal(
    c.execucoes.length,
    chamadas.length,
    "uma linha por chamada, inclusive as recusadas",
  );
  for (const [i, e] of c.execucoes.entries()) {
    assert.equal(e.toolName, chamadas[i][0]);
    assert.ok(["SUCCEEDED", "FAILED"].includes(e.status), `${e.toolName} ficou ${e.status}`);
    assert.equal(e.actorId, "u-admin");
    assert.ok(toolDefinition(e.toolKey), `${e.toolKey} fora do TOOL_REGISTRY`);
  }
  assert.deepEqual(
    c.execucoes.map((e) => e.status),
    [
      "SUCCEEDED",
      "FAILED",
      "SUCCEEDED",
      "FAILED",
      "SUCCEEDED",
      "FAILED",
      "SUCCEEDED",
      "SUCCEEDED",
      "SUCCEEDED",
    ],
  );
  const log = JSON.stringify(c.execucoes);
  assert.ok(!log.includes("admin@veronicahub.com"), "e-mail no log");
  assert.ok(!log.includes(t.access_token) && !log.includes("vmcp_"), "token no log");
  assert.ok(!log.includes("an_18123456789"), "link de afiliado no log");
});

test("auditoria indisponível = nada é executado", async () => {
  const c = cenario();
  const { access_token: tk } = await tokenAdmin(c);
  c.deps.tools.executions.start = async () => {
    throw new Error("banco fora");
  };
  const r = await ferramenta(c, tk, "ativar_arquivar_produto", {
    id: "garrafa-termica",
    active: true,
  });
  assert.equal(r.isError, true);
  assert.equal(c.produtos.get("garrafa-termica").active, false);
});

/* ======================================================== registro e rota */

test("agente veronica-mcp registrado, ferramentas de escrita declaradas como write", () => {
  const agente = registeredAgent("veronica-mcp");
  assert.ok(agente);
  assert.equal(agente.tenantScope, "internal");
  for (const spec of TOOLS) {
    const def = toolDefinition(spec.toolKey);
    assert.ok(def, spec.toolKey);
    assert.equal(def.sideEffect, spec.readOnly ? "read" : "write", spec.name);
    assert.ok(
      agente.tools.some((g) => g.key === spec.toolKey),
      `${spec.toolKey} sem concessão`,
    );
  }
  assert.match(MCP_INSTRUCTIONS, /Veronica/);
  assert.ok(MCP_INSTRUCTIONS.length < 1_200, "instruções curtas");
});

test("rota fixa interceptada em src/server.ts, migração 0021 aditiva", () => {
  for (const p of [
    "/mcp",
    "/oauth/authorize",
    "/oauth/token",
    "/.well-known/oauth-protected-resource",
    "/.well-known/oauth-protected-resource/mcp",
    "/.well-known/oauth-authorization-server",
  ])
    assert.ok(isMcpPath(p), p);
  assert.ok(!isMcpPath("/mcpx") && !isMcpPath("/admin"));
  assert.match(ler("../src/server.ts"), /isMcpPath\(url\.pathname\)/);
  const sql = ler("../drizzle/0021_mcp_oauth.sql").replace(/--.*$/gm, "");
  assert.ok(!/\bDROP\b|\bTRUNCATE\b|\bDELETE\b|\bALTER\s+TABLE\b|\bRENAME\b/i.test(sql));
  assert.match(sql, /CREATE TABLE IF NOT EXISTS "McpOAuthGrant"/);
});

/* ======================================================== fase 2: segurança */

test("refresh revoga na hora o token de acesso anterior da mesma conexão", async () => {
  const c = cenario();
  const t = await tokenAdmin(c);
  assert.equal((await rpc(c.deps, t.access_token, "tools/list")).status, 200);
  const novo = await (
    await call(
      c.deps,
      "/oauth/token",
      form({ grant_type: "refresh_token", refresh_token: t.refresh_token, client_id: t.client_id }),
    )
  ).json();
  assert.equal((await rpc(c.deps, t.access_token, "tools/list")).status, 401, "antigo ainda vale");
  assert.equal((await rpc(c.deps, novo.access_token, "tools/list")).status, 200);
});

test("limite de chamadas por minuto: a 61ª é recusada sem executar nem gravar", async () => {
  const c = cenario();
  const { access_token: tk } = await tokenAdmin(c);
  for (let i = 0; i < MAX_CALLS_PER_MINUTE; i += 1) {
    assert.equal(
      (await ferramenta(c, tk, "listar_produtos")).isError,
      undefined,
      `chamada ${i + 1}`,
    );
  }
  const antes = c.execucoes.length;
  const recusada = await ferramenta(c, tk, "ativar_arquivar_produto", {
    id: "garrafa-termica",
    active: true,
  });
  assert.equal(recusada.isError, true);
  assert.match(recusada.texto, /Limite de 60 chamadas por minuto/);
  assert.equal(c.execucoes.length, antes, "recusa por limite não grava linha");
  assert.equal(c.produtos.get("garrafa-termica").active, false, "nada executado");
  // Passado o minuto, volta a funcionar.
  for (const e of c.execucoes) e.queuedAt = new Date(Date.now() - 61_000);
  assert.equal((await ferramenta(c, tk, "listar_produtos")).isError, undefined);
});
