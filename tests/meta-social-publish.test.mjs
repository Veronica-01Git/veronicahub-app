import test, { afterEach } from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { existsSync, readFileSync } from "node:fs";

// src/lib importa sem extensão ("./meta-graph.server"), que é a convenção do
// repo e o que o bundler resolve. O executor do Node é estrito, então
// completa o ".ts" aqui — mesmo recurso do whatsapp-webhook.test.mjs.
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith("./") && !/\.(ts|mjs|js|json)$/.test(specifier) && context.parentURL) {
      const alvo = new URL(specifier + ".ts", context.parentURL);
      if (existsSync(alvo)) return { url: alvo.href, shortCircuit: true };
    }
    return next(specifier, context);
  },
});

const { publishArticleBySlugToInstagram, dryRunInstagramPublication } =
  await import("../src/lib/instagram-publisher.server.ts");
const {
  publishArticleBySlugToFacebook,
  dryRunFacebookPublication,
  facebookCaptionFromWireCaption,
  buildFacebookCaption,
} = await import("../src/lib/facebook-publisher.server.ts");
const { handlePublishFacebookCron } = await import("../src/lib/facebook-cron.ts");
const { handlePublishInstagramCron } = await import("../src/lib/instagram-cron.ts");
const { parseWireCardUrl, checkCardImage } = await import("../src/lib/meta-graph.server.ts");
const { registeredAgent, toolDefinition } = await import("../src/lib/ai/agent-registry.ts");

const SLUG = "chuva-forte-em-sc";
const CANONICAL = `https://veronicahub.com/blog/${SLUG}`;
const CARD = `https://veronicahub.com/images/instagram/wire-tv-${SLUG}.jpg`;
const TXT = `https://veronicahub.com/images/instagram/wire-tv-${SLUG}.txt`;
const IG_TOKEN = "token-ig-de-teste";
const FB_TOKEN = "token-fb-de-teste";
const ARTICLE = {
  slug: SLUG,
  beat: "sc",
  headline: "Chuva forte provoca alagamentos em SC",
  excerpt: "Defesa Civil emitiu alerta para o litoral norte.",
  coverImageUrl: `https://veronicahub.com/images/blog-covers/${SLUG}.jpg`,
  coverPhotoCredit: "Fulana de Tal",
};

const ENV_KEYS = [
  "META_INSTAGRAM_ACCOUNT_ID",
  "META_INSTAGRAM_ACCESS_TOKEN",
  "META_INSTAGRAM_AUTOPUBLISH",
  "META_INSTAGRAM_GRAPH_HOST",
  "META_FACEBOOK_PAGE_ID",
  "META_FACEBOOK_PAGE_TOKEN",
  "META_FACEBOOK_AUTOPUBLISH",
  "META_GRAPH_API_VERSION",
  "CRON_SECRET",
];
const savedEnv = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
afterEach(() => {
  for (const k of ENV_KEYS) {
    if (savedEnv[k] === undefined) delete process.env[k];
    else process.env[k] = savedEnv[k];
  }
});

function igEnv(autopublish = "false") {
  process.env.META_INSTAGRAM_ACCOUNT_ID = "1784";
  process.env.META_INSTAGRAM_ACCESS_TOKEN = IG_TOKEN;
  process.env.META_INSTAGRAM_AUTOPUBLISH = autopublish;
}
function fbEnv(autopublish = "false") {
  process.env.META_FACEBOOK_PAGE_ID = "9900";
  process.env.META_FACEBOOK_PAGE_TOKEN = FB_TOKEN;
  process.env.META_FACEBOOK_AUTOPUBLISH = autopublish;
}

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
const jpeg = () =>
  new Response(new Uint8Array([0xff, 0xd8]), { headers: { "content-type": "image/jpeg" } });

/**
 * fetch simulado: cada rota é [método, trecho da URL, resposta]. Registra
 * todas as chamadas para o teste conferir o que foi (e o que NÃO foi) à Meta.
 */
function fakeFetch(routes) {
  const calls = [];
  const fn = async (url, init = {}) => {
    const method = (init.method ?? "GET").toUpperCase();
    const headers = new Headers(init.headers);
    const body = init.body ? String(init.body) : "";
    calls.push({ url, method, auth: headers.get("authorization"), body });
    const route = routes.find(([m, part]) => m === method && url.includes(part));
    if (!route) throw new Error(`rota inesperada: ${method} ${url}`);
    return typeof route[2] === "function" ? route[2](url, init) : route[2]();
  };
  return { fn, calls };
}

const deps = (fetchFn, article = ARTICLE) => ({ fetch: fetchFn, loadArticle: async () => article });
const posts = (calls) => calls.filter((c) => c.method === "POST");
const metaCalls = (calls) => calls.filter((c) => c.url.includes("graph."));

/* ============================================================ Instagram */

test("instagram: com AUTOPUBLISH desligado a rodada automática não toca na rede", async () => {
  igEnv("false");
  const { fn, calls } = fakeFetch([]);
  const result = await publishArticleBySlugToInstagram(
    SLUG,
    { automatic: true, imageUrl: CARD },
    deps(fn),
  );
  assert.deepEqual(result, { ok: true, skipped: true, reason: "disabled", permalink: null });
  assert.equal(calls.length, 0);
});

test("instagram: acha a URL canônica nos posts recentes (2ª página) e não posta de novo", async () => {
  igEnv("true");
  const { fn, calls } = fakeFetch([
    ["GET", CARD, jpeg],
    ["GET", "/1784?fields=id,username", () => json({ id: "1784", username: "wire__tv" })],
    [
      "GET",
      "after=cursor-2",
      () =>
        json({
          data: [
            {
              id: "m9",
              caption: `Manchete\n\nLeia: ${CANONICAL}`,
              permalink: "https://instagram.com/p/x",
            },
          ],
        }),
    ],
    [
      "GET",
      "/1784/media?",
      () =>
        json({
          data: [{ id: "m1", caption: "outra matéria" }],
          paging: { cursors: { after: "cursor-2" } },
        }),
    ],
  ]);
  const result = await publishArticleBySlugToInstagram(
    SLUG,
    { automatic: true, imageUrl: CARD },
    deps(fn),
  );
  assert.deepEqual(result, {
    ok: true,
    skipped: true,
    reason: "already-published",
    permalink: "https://instagram.com/p/x",
  });
  assert.equal(posts(calls).length, 0, "post repetido não pode criar container");
});

test("instagram: publica com legenda que leva o link, credencial só no cabeçalho", async () => {
  igEnv("true");
  const { fn, calls } = fakeFetch([
    ["GET", CARD, jpeg],
    ["GET", "/1784?fields=id,username", () => json({ id: "1784", username: "wire__tv" })],
    ["GET", "/1784/media?", () => json({ data: [] })],
    ["POST", "/1784/media_publish", () => json({ id: "pub1" })],
    ["POST", "/1784/media", () => json({ id: "cont1" })],
    ["GET", "/cont1?fields=status_code", () => json({ status_code: "FINISHED" })],
    ["GET", "/pub1?fields=permalink", () => json({ permalink: "https://instagram.com/p/novo" })],
  ]);
  const result = await publishArticleBySlugToInstagram(
    SLUG,
    { automatic: true, imageUrl: CARD },
    deps(fn),
  );
  assert.deepEqual(result, {
    ok: true,
    skipped: false,
    mediaId: "pub1",
    permalink: "https://instagram.com/p/novo",
  });
  const container = posts(calls).find((c) => c.url.endsWith("/1784/media"));
  const fields = new URLSearchParams(container.body);
  assert.equal(fields.get("image_url"), CARD);
  assert.ok(fields.get("caption").includes(CANONICAL));
  for (const c of metaCalls(calls)) {
    assert.equal(c.auth, `Bearer ${IG_TOKEN}`);
    assert.ok(!c.url.includes(IG_TOKEN), "token nunca na URL");
  }
});

test("instagram: card fora do ar ou que não é JPEG barra antes de chamar a Meta", async () => {
  igEnv("true");
  for (const resposta of [
    () => new Response("not found", { status: 404 }),
    () => new Response("<html>", { headers: { "content-type": "text/html" } }),
  ]) {
    const { fn, calls } = fakeFetch([["GET", CARD, resposta]]);
    const result = await publishArticleBySlugToInstagram(
      SLUG,
      { automatic: true, imageUrl: CARD },
      deps(fn),
    );
    assert.equal(result.ok, false);
    assert.equal(metaCalls(calls).length, 0);
  }
});

test("instagram: erro da Meta vira resultado (nunca exceção) e não expõe a credencial", async () => {
  igEnv("true");
  const { fn } = fakeFetch([
    ["GET", CARD, jpeg],
    [
      "GET",
      "/1784?fields",
      () => json({ error: { message: `Invalid OAuth access_token ${IG_TOKEN}`, code: 190 } }, 400),
    ],
  ]);
  const result = await publishArticleBySlugToInstagram(
    SLUG,
    { automatic: true, imageUrl: CARD },
    deps(fn),
  );
  assert.equal(result.ok, false);
  assert.match(result.error, /código 190/);
  assert.doesNotMatch(result.error, /access_token/);
});

test("instagram: dryRun monta o payload e valida tudo sem nenhum POST", async () => {
  igEnv("false");
  const { fn, calls } = fakeFetch([
    ["GET", CARD, jpeg],
    ["GET", "/1784?fields=id,username", () => json({ id: "1784", username: "wire__tv" })],
    ["GET", "/1784/media?", () => json({ data: [] })],
  ]);
  const report = await dryRunInstagramPublication(SLUG, { imageUrl: CARD }, deps(fn));
  assert.equal(report.ok, true);
  assert.equal(report.dryRun, true);
  assert.equal(report.autoPublishEnabled, false);
  assert.equal(report.wouldPublish, false, "com AUTOPUBLISH=false a rodada não publicaria");
  assert.equal(report.checks.credentials.account, "@wire__tv");
  assert.equal(report.checks.image.contentType, "image/jpeg");
  assert.match(report.payload.endpoint, /\/1784\/media$/);
  assert.ok(report.payload.fields.caption.includes(CANONICAL));
  assert.equal(posts(calls).length, 0);
  assert.ok(!JSON.stringify(report).includes(IG_TOKEN));
});

test("instagram: dryRun recusa credencial de outra conta", async () => {
  igEnv("true");
  const { fn } = fakeFetch([
    ["GET", CARD, jpeg],
    ["GET", "/1784?fields=id,username", () => json({ id: "1784", username: "outra.conta" })],
  ]);
  const report = await dryRunInstagramPublication(SLUG, { imageUrl: CARD }, deps(fn));
  assert.equal(report.ok, false);
  assert.match(report.checks.credentials.error, /@outra\.conta/);
  assert.equal(report.wouldPublish, false);
});

/* ============================================================= Facebook */

const WIRE_TXT = [
  ARTICLE.headline,
  ARTICLE.excerpt,
  `Leia a matéria completa: ${CANONICAL}`,
  "Foto: Fulana de Tal / Pexels",
  "@wire__tv",
].join("\n\n");

function fbRoutes(extra = []) {
  return [
    ...extra,
    ["GET", CARD, jpeg],
    [
      "GET",
      TXT,
      () => new Response(`${WIRE_TXT}\n`, { headers: { "content-type": "text/plain" } }),
    ],
    ["GET", "/me?fields=id,name", () => json({ id: "9900", name: "Wire TV" })],
    ["GET", "/9900/published_posts?", () => json({ data: [] })],
    ["POST", "/9900/photos", () => json({ id: "ph1", post_id: "9900_77" })],
    [
      "GET",
      "/9900_77?fields=permalink_url",
      () => json({ permalink_url: "https://facebook.com/9900/posts/77" }),
    ],
  ];
}

test("facebook: com AUTOPUBLISH desligado a rodada automática não toca na rede", async () => {
  fbEnv("false");
  const { fn, calls } = fakeFetch([]);
  const result = await publishArticleBySlugToFacebook(
    SLUG,
    { automatic: true, imageUrl: CARD },
    deps(fn),
  );
  assert.deepEqual(result, { ok: true, skipped: true, reason: "disabled", permalink: null });
  assert.equal(calls.length, 0);
});

test("facebook: publica foto + legenda do .txt do card em /{page-id}/photos", async () => {
  fbEnv("true");
  const { fn, calls } = fakeFetch(fbRoutes());
  const result = await publishArticleBySlugToFacebook(
    SLUG,
    { automatic: true, imageUrl: CARD },
    deps(fn),
  );
  assert.deepEqual(result, {
    ok: true,
    skipped: false,
    postId: "9900_77",
    permalink: "https://facebook.com/9900/posts/77",
  });
  const [photo] = posts(calls);
  assert.match(photo.url, /^https:\/\/graph\.facebook\.com\/v\d+\.\d+\/9900\/photos$/);
  const fields = new URLSearchParams(photo.body);
  assert.equal(fields.get("url"), CARD);
  const caption = fields.get("caption");
  assert.ok(caption.startsWith(ARTICLE.headline));
  assert.ok(caption.includes(ARTICLE.excerpt));
  assert.ok(caption.includes(CANONICAL));
  assert.ok(caption.includes("Foto: Fulana de Tal / Pexels"));
  assert.ok(!caption.split("\n").includes("@wire__tv"), "o @ solto do Instagram sai no Facebook");
  for (const c of metaCalls(calls)) {
    assert.equal(c.auth, `Bearer ${FB_TOKEN}`);
    assert.ok(!c.url.includes(FB_TOKEN));
  }
});

test("facebook: link da matéria já na Página → não posta de novo", async () => {
  fbEnv("true");
  const { fn, calls } = fakeFetch(
    fbRoutes([
      [
        "GET",
        "/9900/published_posts?",
        () =>
          json({
            data: [
              {
                id: "9900_5",
                message: `Antiga\n\n${CANONICAL}`,
                permalink_url: "https://facebook.com/p/5",
              },
            ],
          }),
      ],
    ]),
  );
  const result = await publishArticleBySlugToFacebook(
    SLUG,
    { automatic: true, imageUrl: CARD },
    deps(fn),
  );
  assert.deepEqual(result, {
    ok: true,
    skipped: true,
    reason: "already-published",
    permalink: "https://facebook.com/p/5",
  });
  assert.equal(posts(calls).length, 0);
});

test("facebook: sem o .txt, a legenda é montada da matéria com manchete, resumo e link", async () => {
  fbEnv("true");
  const { fn, calls } = fakeFetch(
    fbRoutes([["GET", TXT, () => new Response("", { status: 404 })]]),
  );
  const result = await publishArticleBySlugToFacebook(
    SLUG,
    { automatic: true, imageUrl: CARD },
    deps(fn),
  );
  assert.equal(result.ok, true);
  const caption = new URLSearchParams(posts(calls)[0].body).get("caption");
  assert.equal(caption, buildFacebookCaption(ARTICLE));
  assert.ok(caption.includes(ARTICLE.headline) && caption.includes(ARTICLE.excerpt));
  assert.ok(caption.includes(CANONICAL));
});

test("facebook: token que não é da Página configurada é recusado antes de postar", async () => {
  fbEnv("true");
  const { fn, calls } = fakeFetch(
    fbRoutes([["GET", "/me?fields=id,name", () => json({ id: "123-usuario", name: "Alguém" })]]),
  );
  const result = await publishArticleBySlugToFacebook(
    SLUG,
    { automatic: true, imageUrl: CARD },
    deps(fn),
  );
  assert.equal(result.ok, false);
  assert.match(result.error, /META_FACEBOOK_PAGE_ID/);
  assert.equal(posts(calls).length, 0);
});

test("facebook: falha de rede vira resultado, nunca exceção", async () => {
  fbEnv("true");
  const { fn } = fakeFetch(
    fbRoutes([
      [
        "POST",
        "/9900/photos",
        () => {
          throw new TypeError("fetch failed");
        },
      ],
    ]),
  );
  const result = await publishArticleBySlugToFacebook(
    SLUG,
    { automatic: true, imageUrl: CARD },
    deps(fn),
  );
  assert.deepEqual(result, { ok: false, error: "fetch failed" });
});

test("facebook: dryRun valida token, card e duplicidade e não publica", async () => {
  fbEnv("false");
  const { fn, calls } = fakeFetch(fbRoutes());
  const report = await dryRunFacebookPublication(SLUG, { imageUrl: CARD }, deps(fn));
  assert.equal(report.ok, true);
  assert.equal(report.network, "facebook");
  assert.equal(report.wouldPublish, false);
  assert.equal(report.checks.credentials.account, "Wire TV");
  assert.equal(report.checks.duplicate.alreadyPublished, false);
  assert.equal(report.payload.captionSource, "card-txt");
  assert.equal(report.payload.fields.url, CARD);
  assert.equal(posts(calls).length, 0);
  assert.ok(!JSON.stringify(report).includes(FB_TOKEN));
});

test("facebook: dryRun aponta card que não é image/jpeg e segredos ausentes", async () => {
  delete process.env.META_FACEBOOK_PAGE_ID;
  delete process.env.META_FACEBOOK_PAGE_TOKEN;
  const { fn, calls } = fakeFetch([
    [
      "GET",
      CARD,
      () => new Response("<html>", { headers: { "content-type": "text/html; charset=utf-8" } }),
    ],
    ["GET", TXT, () => new Response("", { status: 404 })],
  ]);
  const report = await dryRunFacebookPublication(SLUG, { imageUrl: CARD }, deps(fn));
  assert.equal(report.ok, false);
  assert.deepEqual(report.checks.config.missing, [
    "META_FACEBOOK_PAGE_ID",
    "META_FACEBOOK_PAGE_TOKEN",
  ]);
  assert.equal(report.checks.image.ok, false);
  assert.match(report.checks.image.error, /image\/jpeg/);
  assert.match(report.payload.endpoint, /\{META_FACEBOOK_PAGE_ID\}\/photos$/);
  assert.equal(metaCalls(calls).length, 0);
});

test("facebook: legenda sem o link canônico não é aproveitada", () => {
  assert.equal(facebookCaptionFromWireCaption("Manchete\n\n@wire__tv", CANONICAL), null);
});

/* ================================================================ rotas */

test("rotas: exigem CRON_SECRET e só aceitam o card oficial da Wire TV", async () => {
  process.env.CRON_SECRET = "segredo-teste";
  for (const handler of [handlePublishFacebookCron, handlePublishInstagramCron]) {
    const url = "https://veronicahub.com/api/cron/x?dryRun=1";
    const semAuth = await handler(new Request(url, { method: "POST", body: "{}" }));
    assert.equal(semAuth.status, 401);
    const foraDoDiretorio = await handler(
      new Request(url, {
        method: "POST",
        headers: { authorization: "Bearer segredo-teste" },
        body: JSON.stringify({ slug: SLUG, imageUrl: "https://exemplo.com/wire-tv-x.jpg" }),
      }),
    );
    assert.equal(foraDoDiretorio.status, 400);
  }
  assert.equal(parseWireCardUrl(CARD).ok, true);
  assert.equal(parseWireCardUrl(`${CARD.replace(".jpg", ".png")}`).ok, false);
});

test("checkCardImage exige 200 com image/jpeg", async () => {
  assert.equal((await checkCardImage(CARD, async () => jpeg())).ok, true);
  const redirect = await checkCardImage(CARD, async () => new Response(null, { status: 302 }));
  assert.equal(redirect.ok, false);
  const quebrado = await checkCardImage(CARD, async () => {
    throw new Error("timeout");
  });
  assert.equal(quebrado.ok, false);
});

/* ============================================ servidor, workflow, registro */

const ler = (p) => readFileSync(new URL(p, import.meta.url), "utf8");

test("a Página do Facebook segue o Instagram: rota, workflow e mesmas condições", () => {
  const server = ler("../src/server.ts");
  const cron = ler("../src/lib/facebook-cron.ts");
  const workflow = ler("../.github/workflows/generate-article.yml");
  assert.match(
    server,
    /url\.pathname === "\/api\/cron\/publish-facebook" && request\.method === "POST"/,
  );
  assert.match(cron, /CRON_SECRET/);
  assert.match(cron, /authorization/);

  const ig = workflow.indexOf("- name: Publica a matéria no Instagram da Wire TV");
  const fb = workflow.indexOf("- name: Publica a matéria no Facebook da Wire TV");
  assert.ok(ig > 0 && fb > ig, "o passo do Facebook vem logo depois do Instagram");
  const entre = workflow.slice(ig, fb);
  assert.equal((entre.match(/- name:/g) ?? []).length, 1, "nenhum passo entre os dois");
  const passoFb = workflow.slice(fb, workflow.indexOf("- name:", fb + 10));
  assert.match(
    passoFb,
    /if: steps\.set_cover\.outcome == 'success' && steps\.instagram_card\.outcome == 'success'/,
  );
  assert.match(passoFb, /continue-on-error: true/);
  assert.match(passoFb, /\/api\/cron\/publish-facebook/);
  assert.match(passoFb, /images\/instagram\/wire-tv-/);
  assert.doesNotMatch(passoFb, /dryRun/);
});

test("nenhum token da Meta no código e o autopost do Facebook nasce desligado", () => {
  for (const arquivo of [
    "../src/lib/facebook-publisher.server.ts",
    "../src/lib/instagram-publisher.server.ts",
    "../src/lib/meta-graph.server.ts",
    "../.github/workflows/generate-article.yml",
  ]) {
    const fonte = ler(arquivo);
    assert.doesNotMatch(fonte, /EAA[A-Za-z0-9]{20,}/, `${arquivo}: token da Meta no código`);
    assert.doesNotMatch(fonte, /access_token=/, `${arquivo}: credencial em query string`);
  }
  const fb = ler("../src/lib/facebook-publisher.server.ts");
  assert.match(fb, /booleanEnv\(process\.env\.META_FACEBOOK_AUTOPUBLISH\)/);
  assert.doesNotMatch(ler("../wrangler.jsonc"), /AUTOPUBLISH/);
});

test("WIRE_REDACAO: facebook.post.publish exige aprovação enquanto o autopost estiver desligado", () => {
  const def = toolDefinition("facebook.post.publish");
  assert.ok(def);
  assert.equal(def.sideEffect, "external-send");
  assert.equal(def.implementedBy, "src/lib/facebook-publisher.server.ts");
  const grants = registeredAgent("wire-redacao").tools;
  const fb = grants.find((t) => t.key === "facebook.post.publish");
  const ig = grants.find((t) => t.key === "instagram.post.publish");
  assert.equal(fb?.requiresApproval, true);
  assert.equal(ig?.requiresApproval, true);
});
