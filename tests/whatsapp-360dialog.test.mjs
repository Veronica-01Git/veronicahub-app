import test from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { existsSync } from "node:fs";

registerHooks({
  resolve(specifier, context, next) {
    if ((specifier.startsWith("./") || specifier.startsWith("../")) && context.parentURL) {
      const exato = new URL(specifier, context.parentURL);
      const comTs = new URL(specifier + ".ts", context.parentURL);
      if (!existsSync(exato) && existsSync(comTs)) return { url: comTs.href, shortCircuit: true };
    }
    return next(specifier, context);
  },
});
const cloud = await import("../src/lib/whatsapp-cloud.ts");
const { handleWhatsAppWebhook } = await import("../src/lib/whatsapp-webhook.ts");

const CHAVES = [
  "WHATSAPP_PROVEDOR",
  "D360_API_KEY",
  "WHATSAPP_ENVIO_LIBERADO",
  "WHATSAPP_WEBHOOK_TOKEN",
  "WHATSAPP_PHONE_NUMBER_ID",
  "WHATSAPP_ACCESS_TOKEN",
  "WHATSAPP_APP_SECRET",
];
async function comAmbiente(valores, fn) {
  const antes = Object.fromEntries(CHAVES.map((k) => [k, process.env[k]]));
  for (const k of CHAVES) delete process.env[k];
  Object.assign(process.env, valores);
  try {
    return await fn();
  } finally {
    for (const k of CHAVES) {
      if (antes[k] === undefined) delete process.env[k];
      else process.env[k] = antes[k];
    }
  }
}

const SEGREDO = "s".repeat(40);
const CFG = {
  provedor: "360dialog",
  phoneNumberId: "",
  accessToken: "chave-360",
  graphVersion: "",
};
const CFG_META = { phoneNumberId: "123", accessToken: "tok", graphVersion: "v21.0" };

test("provedor: só '360dialog' troca; o resto continua Meta direta", async () => {
  await comAmbiente({}, () => assert.equal(cloud.provedorWhatsApp(), "meta"));
  await comAmbiente({ WHATSAPP_PROVEDOR: " 360Dialog " }, () =>
    assert.equal(cloud.provedorWhatsApp(), "360dialog"),
  );
  await comAmbiente({ WHATSAPP_PROVEDOR: "outro" }, () =>
    assert.equal(cloud.provedorWhatsApp(), "meta"),
  );
});

test("360dialog: endereços e chave no lugar certo; Meta segue igual", () => {
  assert.equal(cloud.urlMensagens(CFG), "https://waba-v2.360dialog.io/messages");
  assert.equal(cloud.urlUploadMidia(CFG), "https://waba-v2.360dialog.io/media");
  assert.equal(cloud.urlInfoMidia(CFG, "987"), "https://waba-v2.360dialog.io/987");
  assert.deepEqual(cloud.cabecalhosAuth(CFG), { "D360-API-KEY": "chave-360" });

  assert.equal(cloud.urlMensagens(CFG_META), "https://graph.facebook.com/v21.0/123/messages");
  assert.deepEqual(cloud.cabecalhosAuth(CFG_META), { authorization: "Bearer tok" });
});

test("360dialog: download troca o host da Meta e recusa host desconhecido", () => {
  const meta =
    "https:\\/\\/lookaside.fbsbx.com\\/whatsapp_business\\/attachments\\/?mid=1&ext=2&hash=3";
  assert.equal(
    cloud.urlDownloadMidia(CFG, meta),
    "https://waba-v2.360dialog.io/whatsapp_business/attachments/?mid=1&ext=2&hash=3",
  );
  assert.equal(cloud.urlDownloadMidia(CFG, "https://evil.example.com/x"), null);
  assert.equal(cloud.urlDownloadMidia(CFG, "http://lookaside.fbsbx.com/x"), null);
  assert.equal(cloud.urlDownloadMidia(CFG, "não é url"), null);
  // Meta direta: url usada como veio (comportamento de antes).
  assert.equal(cloud.urlDownloadMidia(CFG_META, "https://x.fbcdn.net/a"), "https://x.fbcdn.net/a");
});

test("360dialog: credencial é a D360_API_KEY e a trava continua valendo", async () => {
  await comAmbiente({ WHATSAPP_PROVEDOR: "360dialog" }, () => {
    assert.equal(cloud.motivoEnvioBloqueado(), "sem-credenciais");
  });
  await comAmbiente({ WHATSAPP_PROVEDOR: "360dialog", D360_API_KEY: "k" }, () => {
    assert.equal(cloud.motivoEnvioBloqueado(), "envio-nao-liberado");
    assert.equal(cloud.getWhatsAppConfig(), null, "chave sem liberação não envia");
  });
  await comAmbiente(
    {
      WHATSAPP_PROVEDOR: "360dialog",
      D360_API_KEY: "k",
      WHATSAPP_ENVIO_LIBERADO: "sim-o-dono-aprovou",
    },
    () => assert.equal(cloud.getWhatsAppConfig()?.provedor, "360dialog"),
  );
});

test("360dialog: sendText vai para a 360dialog com a chave, nunca para a Graph", async () => {
  const chamadas = [];
  const fetchOriginal = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    chamadas.push({ url: String(url), init });
    return new Response(JSON.stringify({ messages: [{ id: "wamid.360" }] }), { status: 200 });
  };
  try {
    await comAmbiente(
      {
        WHATSAPP_PROVEDOR: "360dialog",
        D360_API_KEY: "k",
        WHATSAPP_ENVIO_LIBERADO: "sim-o-dono-aprovou",
      },
      async () => {
        const r = await cloud.sendText("5547988887777", "oi");
        assert.deepEqual(r, { ok: true, providerId: "wamid.360" });
      },
    );
  } finally {
    globalThis.fetch = fetchOriginal;
  }
  assert.equal(chamadas.length, 1);
  assert.equal(chamadas[0].url, "https://waba-v2.360dialog.io/messages");
  assert.equal(chamadas[0].init.headers["D360-API-KEY"], "k");
  assert.equal(chamadas[0].init.headers.authorization, undefined);
  assert.equal(JSON.parse(chamadas[0].init.body).messaging_product, "whatsapp");
});

test("token do webhook: tempo constante, tamanho mínimo, nulo recusado", async () => {
  assert.equal(await cloud.verificarTokenWebhook(SEGREDO, SEGREDO), true);
  assert.equal(await cloud.verificarTokenWebhook(SEGREDO + "x", SEGREDO), false);
  assert.equal(await cloud.verificarTokenWebhook(null, SEGREDO), false);
  assert.equal(await cloud.verificarTokenWebhook("curto", "curto"), false, "segredo curto");
});

test("webhook 360dialog: sem o segredo é 403; sem segredo configurado é 500; com ele, 200", async () => {
  const corpo = JSON.stringify({ object: "whatsapp_business_account", entry: [] });
  const req = (headers = {}) =>
    new Request("https://veronicahub.com/api/whatsapp/webhook", {
      method: "POST",
      body: corpo,
      headers,
    });

  await comAmbiente({ WHATSAPP_PROVEDOR: "360dialog" }, async () => {
    const r = await handleWhatsAppWebhook(req({ [cloud.CABECALHO_TOKEN_WEBHOOK]: SEGREDO }));
    assert.equal(r.status, 500, "sem WHATSAPP_WEBHOOK_TOKEN ninguém entra");
  });
  await comAmbiente(
    { WHATSAPP_PROVEDOR: "360dialog", WHATSAPP_WEBHOOK_TOKEN: SEGREDO },
    async () => {
      assert.equal((await handleWhatsAppWebhook(req())).status, 403);
      assert.equal(
        (await handleWhatsAppWebhook(req({ [cloud.CABECALHO_TOKEN_WEBHOOK]: "x".repeat(40) })))
          .status,
        403,
      );
      // Assinatura da Meta não serve de passe na 360dialog.
      assert.equal(
        (await handleWhatsAppWebhook(req({ "x-hub-signature-256": "sha256=" + "0".repeat(64) })))
          .status,
        403,
      );
      assert.equal(
        (await handleWhatsAppWebhook(req({ [cloud.CABECALHO_TOKEN_WEBHOOK]: SEGREDO }))).status,
        200,
      );
    },
  );
  // E na Meta direta, o segredo da 360dialog não abre a porta.
  await comAmbiente({ WHATSAPP_APP_SECRET: "app", WHATSAPP_WEBHOOK_TOKEN: SEGREDO }, async () => {
    const r = await handleWhatsAppWebhook(req({ [cloud.CABECALHO_TOKEN_WEBHOOK]: SEGREDO }));
    assert.equal(r.status, 403);
  });
});

test("painel de conexão: só administradora, e nenhum segredo volta na resposta", async () => {
  const { readFileSync } = await import("node:fs");
  const src = readFileSync(
    new URL("../src/features/express-ops-b/data/conexao-whatsapp.ts", import.meta.url),
    "utf8",
  );
  // As duas funções começam exigindo workspace da Express E admin do Hub.
  assert.match(src, /avaliarAcessoAoWorkspace\(SLUG_EXPRESS\)/);
  assert.match(src, /requireAdminCore\(\)/);
  for (const fn of ["estadoConexaoWhatsApp", "registrarWebhook360"]) {
    const corpo = src.slice(src.indexOf(`export const ${fn}`));
    assert.match(corpo.slice(0, 400), /eAdministradora\(\)/, `${fn} sem checar administradora`);
  }
  // O que volta ao navegador são booleanos e mensagens — nunca a chave ou o segredo.
  assert.doesNotMatch(src, /return \{[^}]*\b(chave|segredo)\b\s*[,}]/);
  assert.doesNotMatch(src, /erro:[^\n]*\$\{(chave|segredo)/);
  // Registra a URL de produção com o cabeçalho que o webhook confere.
  assert.match(src, /"x-veronica-webhook-token": segredo/);
  assert.match(src, /URL_WEBHOOK_PRODUCAO = "https:\/\/veronicahub\.com\/api\/whatsapp\/webhook"/);
  assert.equal(cloud.CABECALHO_TOKEN_WEBHOOK, "x-veronica-webhook-token");
});
