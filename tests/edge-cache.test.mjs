import test from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { existsSync } from "node:fs";

registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith("./") && !/\.[a-z]+$/.test(specifier) && context.parentURL) {
      const alvo = new URL(specifier + ".ts", context.parentURL);
      if (existsSync(alvo)) return { url: alvo.href, shortCircuit: true };
    }
    return next(specifier, context);
  },
});

const { podeCachear, lerDoCacheDeBorda, guardarNoCacheDeBorda } =
  await import("../src/lib/edge-cache.ts");

const DEMO = "https://veronicahub.com/preview/express-operations-b/regras-do-agente";

function html(corpo = "<html></html>", init = {}) {
  return new Response(corpo, {
    status: init.status ?? 200,
    headers: { "content-type": "text/html; charset=utf-8", ...(init.headers ?? {}) },
  });
}

/** Cache falso com a mesma forma do `caches.default` do Cloudflare. */
function cacheFalso() {
  const guardado = new Map();
  const c = {
    async match(request) {
      return guardado.get(request.url)?.clone();
    },
    async put(request, response) {
      guardado.set(request.url, response);
    },
  };
  globalThis.caches = { default: c };
  return guardado;
}

test("as páginas públicas e estáticas entram no cache compartilhado", () => {
  for (const dentro of [
    DEMO,
    "https://veronicahub.com/preview/express-operations-b",
    "https://veronicahub.com/clientes/express-entulho/proposta",
    "https://veronicahub.com/clientes/express-entulho/operacoes-demo",
    "https://veronicahub.com/",
    "https://veronicahub.com/comandos",
    "https://veronicahub.com/selos",
  ]) {
    assert.equal(podeCachear(new Request(dentro)), true, dentro);
  }
});

test("nada ligado a login ou carteira entra no cache, nunca", () => {
  // O risco aqui não é lentidão, é vazamento: HTML de pessoa em cache
  // compartilhado seria entregue a outra pessoa.
  for (const fora of [
    "https://veronicahub.com/admin/wire",
    "https://veronicahub.com/admin",
    "https://veronicahub.com/conta",
    "https://veronicahub.com/video-ia",
    "https://veronicahub.com/veronica-curriculo-certo",
    "https://veronicahub.com/veronica-curriculo-certo-rh",
    "https://veronicahub.com/api/whatsapp/diagnostico",
  ]) {
    assert.equal(podeCachear(new Request(fora)), false, fora);
  }
});

test("o casamento de rota é exato — prefixo parecido não entra", () => {
  for (const fora of [
    "https://veronicahub.com/preview/express-operations-bXY",
    "https://veronicahub.com/comandos-extra",
    "https://veronicahub.com/blog",
    "https://veronicahub.com/blog/alguma-materia",
    "https://veronicahub.com/clientes/outra-empresa",
  ]) {
    assert.equal(podeCachear(new Request(fora)), false, fora);
  }
});

test("requisição que pode ser personalizada nunca é servida do cache", () => {
  // O risco real de cache compartilhado de HTML: entregar a página de uma
  // pessoa para outra. Cookie e Authorization barram antes de qualquer coisa.
  assert.equal(podeCachear(new Request(DEMO, { headers: { cookie: "sessao=abc" } })), false);
  assert.equal(podeCachear(new Request(DEMO, { headers: { authorization: "Bearer x" } })), false);
  assert.equal(podeCachear(new Request(DEMO, { method: "POST" })), false);
  assert.equal(podeCachear(new Request(DEMO + "?debug=1")), false);
});

test("guarda o HTML e serve a visita seguinte sem renderizar de novo", async () => {
  cacheFalso();
  const req = new Request(DEMO);

  assert.equal(await lerDoCacheDeBorda(req), undefined);

  const resposta = guardarNoCacheDeBorda(req, html("<html>matriz</html>"));
  assert.equal(await resposta.text(), "<html>matriz</html>", "o cliente recebe o corpo intacto");

  const guardada = await lerDoCacheDeBorda(req);
  assert.ok(guardada, "a segunda visita sai do cache");
  assert.equal(await guardada.text(), "<html>matriz</html>");
  assert.match(guardada.headers.get("cache-control") ?? "", /s-maxage=300/);
  assert.equal(
    guardada.headers.get("x-veronica-edge-cache"),
    "hit",
    "o acerto tem de ser visível num curl -I",
  );
  assert.equal(resposta.headers.get("x-veronica-edge-cache"), "store");
});

test("erro nunca é guardado — falha momentânea não vira cinco minutos de falha", async () => {
  const guardado = cacheFalso();
  const req = new Request(DEMO);

  guardarNoCacheDeBorda(req, html("<html>erro</html>", { status: 500 }));
  assert.equal(guardado.size, 0);

  guardarNoCacheDeBorda(req, html("<html>x</html>", { headers: { "set-cookie": "s=1" } }));
  assert.equal(guardado.size, 0, "resposta que cria sessão não pode ser compartilhada");

  guardarNoCacheDeBorda(
    req,
    new Response("{}", { status: 200, headers: { "content-type": "application/json" } }),
  );
  assert.equal(guardado.size, 0, "só HTML");
});

test("sem o cache do Cloudflare, tudo segue funcionando", async () => {
  // Em `vite dev` e nos testes `caches.default` não existe. A ausência tem de
  // ser silenciosa: sem cache o site funciona igual, só renderiza sempre.
  delete globalThis.caches;
  const req = new Request(DEMO);
  assert.equal(await lerDoCacheDeBorda(req), undefined);
  const r = guardarNoCacheDeBorda(req, html("<html>ok</html>"));
  assert.equal(await r.text(), "<html>ok</html>");
});
