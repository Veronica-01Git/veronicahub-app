/**
 * TELA DE AUTORIZAÇÃO DO CONECTOR — o login por código de e-mail do site,
 * servido direto pelo Worker (sem React, sem JS no navegador).
 *
 * Duas etapas, ambas POST para /oauth/authorize carregando de novo os
 * parâmetros do pedido (validados a cada passo — não há estado entre elas):
 *   1. e-mail → se for de admin, envia o código pelo mesmo fluxo do site
 *      (issueEmailCodeCore: cooldown, hash, 10 min). Se não for, NÃO envia,
 *      e a tela diz a mesma coisa — não revela quem é admin;
 *   2. código → confere e consome (consumeEmailCodeCore) e só então, se a
 *      conta for admin, emite o código OAuth e redireciona para o Claude.
 */

import {
  issueAuthorizationCode,
  originOf,
  parseAuthorizeRequest,
  type AuthorizeParams,
  type OAuthDeps,
} from "./oauth.ts";

const PASS_THROUGH = [
  "response_type",
  "client_id",
  "redirect_uri",
  "code_challenge",
  "code_challenge_method",
  "state",
  "scope",
  "resource",
] as const;

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function page(body: string, status = 200): Response {
  const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Conectar ao Claude — Veronica Analytics</title>
<style>
:root{color-scheme:light dark;--bg:#f7f5f2;--card:#fff;--fg:#1c1917;--muted:#57534e;--line:#e7e5e4;--accent:#7c3aed;--warn:#b45309}
@media (prefers-color-scheme:dark){:root{--bg:#0c0a09;--card:#1c1917;--fg:#f5f5f4;--muted:#a8a29e;--line:#292524;--accent:#a78bfa;--warn:#fbbf24}}
*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:var(--bg);color:var(--fg);font:16px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;padding:16px}
main{width:100%;max-width:420px;background:var(--card);border:1px solid var(--line);border-radius:16px;padding:28px}
h1{font-size:1.25rem;margin:0 0 4px}p{margin:8px 0;color:var(--muted)}
label{display:block;font-weight:600;margin:18px 0 6px}
input[type=email],input[type=text]{width:100%;padding:12px;border:1px solid var(--line);border-radius:10px;background:transparent;color:var(--fg);font-size:1rem}
button{margin-top:16px;width:100%;padding:12px;border:0;border-radius:10px;background:var(--accent);color:#fff;font-weight:600;font-size:1rem;cursor:pointer}
.host{font-family:ui-monospace,monospace;color:var(--fg)}.err{color:#dc2626}.warn{color:var(--warn)}
ul{padding-left:20px;color:var(--muted);margin:8px 0}
</style></head><body><main>${body}</main></body></html>`;
  return new Response(html, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      // Sem script nenhum; formulário só para cá. O redirect final para o
      // Claude é 302 do servidor, que form-action também cobre — daí os hosts.
      "content-security-policy":
        "default-src 'none'; style-src 'unsafe-inline'; form-action 'self' https://claude.ai https://claude.com http://localhost:* http://127.0.0.1:*; frame-ancestors 'none'; base-uri 'none'",
      "x-frame-options": "DENY",
    },
  });
}

function hidden(params: URLSearchParams): string {
  return PASS_THROUGH.filter((k) => params.has(k))
    .map((k) => `<input type="hidden" name="${k}" value="${esc(params.get(k) ?? "")}">`)
    .join("");
}

function header(req: AuthorizeParams): string {
  const host = new URL(req.redirectUri).host;
  const loopback = !/^claude\.(ai|com)$/.test(new URL(req.redirectUri).hostname);
  return `<h1>Conectar o Claude ao Veronica Analytics</h1>
<p>Quem pede: <strong>${esc(req.clientName || "Claude")}</strong>, retornando para <span class="host">${esc(host)}</span>.</p>
${loopback ? `<p class="warn">Atenção: o retorno é um endereço local deste computador (Claude Code). Só continue se foi você quem iniciou a conexão.</p>` : ""}
<p>O conector poderá:</p>
<ul><li>ver e cadastrar produtos do catálogo, inclusive arquivados;</li>
<li>trocar capa e galeria, ativar e arquivar produtos;</li>
<li>ver cliques e o estado dos agentes.</li></ul>
<p>Acesso só para a conta administradora. O token vale 1 hora e é renovado enquanto a conexão existir.</p>`;
}

function emailForm(req: AuthorizeParams, params: URLSearchParams, error = ""): string {
  return `${header(req)}
<form method="post" action="/oauth/authorize">${hidden(params)}
<input type="hidden" name="step" value="email">
<label for="email">E-mail da conta admin</label>
<input id="email" name="email" type="email" required autocomplete="email" autofocus>
${error ? `<p class="err">${esc(error)}</p>` : ""}
<button type="submit">Enviar código</button></form>`;
}

function codeForm(
  req: AuthorizeParams,
  params: URLSearchParams,
  email: string,
  note: string,
  error = "",
): string {
  return `${header(req)}
<form method="post" action="/oauth/authorize">${hidden(params)}
<input type="hidden" name="step" value="code"><input type="hidden" name="email" value="${esc(email)}">
<p>${esc(note)}</p>
<label for="code">Código de 6 dígitos</label>
<input id="code" name="code" type="text" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" required autocomplete="one-time-code" autofocus>
${error ? `<p class="err">${esc(error)}</p>` : ""}
<button type="submit">Autorizar</button></form>`;
}

const SENT_NOTE =
  "Se este e-mail for de uma conta administradora, enviamos um código válido por 10 minutos.";

export async function handleAuthorize(request: Request, deps: OAuthDeps): Promise<Response> {
  const origin = originOf(request, deps);
  if (request.method !== "GET" && request.method !== "POST") {
    return new Response(null, { status: 405, headers: { allow: "GET, POST" } });
  }
  const params =
    request.method === "GET"
      ? new URL(request.url).searchParams
      : new URLSearchParams(await request.text());

  const parsed = await parseAuthorizeRequest(params, deps, origin);
  if (!parsed.ok) {
    return page(
      `<h1>Pedido de autorização inválido</h1><p class="err">${esc(parsed.error)}</p>
<p>Volte ao Claude e adicione o conector de novo.</p>`,
      400,
    );
  }
  const req = parsed.value;
  if (request.method === "GET") return page(emailForm(req, params));

  const email = (params.get("email") ?? "").trim().toLowerCase();
  if (!email.includes("@") || email.length > 254) {
    return page(emailForm(req, params, "Informe um e-mail válido."), 400);
  }

  if (params.get("step") === "email") {
    const admin = await deps.findAdminByEmail(email);
    if (admin) {
      const sent = await deps.sendLoginCode(email);
      // Cooldown ("aguarde 60s") é útil a quem é admin; falha de envio também.
      if (!sent.ok) return page(emailForm(req, params, sent.error), 429);
    }
    return page(codeForm(req, params, email, SENT_NOTE));
  }

  if (params.get("step") === "code") {
    const code = (params.get("code") ?? "").trim();
    const admin = await deps.findAdminByEmail(email);
    if (!admin) {
      return page(
        codeForm(req, params, email, SENT_NOTE, "Código inválido ou conta sem acesso."),
        403,
      );
    }
    const consumed = await deps.consumeLoginCode(email, code);
    if (!consumed.ok) return page(codeForm(req, params, email, SENT_NOTE, consumed.error), 400);
    const target = await issueAuthorizationCode(req, admin.id, deps);
    return new Response(null, {
      status: 302,
      headers: { location: target, "cache-control": "no-store" },
    });
  }

  return page(emailForm(req, params), 400);
}
