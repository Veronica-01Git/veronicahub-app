import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const { evaluatePrivateClientAccountAccess, normalizeAccessEmail, parseAllowedEmails } =
  await import("../src/features/private-clients/access-policy.ts");

test("cliente sem política adicional preserva o acesso pelo fluxo existente", () => {
  const result = evaluatePrivateClientAccountAccess({
    clientId: "lz-team",
    email: null,
    environment: {},
  });

  assert.equal(result, "allowed");
});

test("Express exige conta verificada mesmo quando o selo já foi validado", () => {
  const result = evaluatePrivateClientAccountAccess({
    clientId: "express-entulho",
    email: null,
    environment: { EXPRESS_OPERATIONS_ALLOWED_EMAILS: "responsavel@empresa.com" },
  });

  assert.equal(result, "account-required");
});

test("allowlist ausente mantém a área fechada", () => {
  const result = evaluatePrivateClientAccountAccess({
    clientId: "express-entulho",
    email: "responsavel@empresa.com",
    environment: {},
  });

  assert.equal(result, "configuration-missing");
});

test("allowlist aceita separadores seguros e normaliza o e-mail", () => {
  assert.deepEqual(
    parseAllowedEmails(" Dono@Empresa.com; gerente@empresa.com\nDONO@EMPRESA.COM "),
    ["dono@empresa.com", "gerente@empresa.com"],
  );
  assert.equal(normalizeAccessEmail("  DONO@Empresa.Com "), "dono@empresa.com");
});

test("somente e-mail confirmado e listado entra no ambiente da Express", () => {
  const environment = {
    EXPRESS_OPERATIONS_ALLOWED_EMAILS: "dono@empresa.com,gestor@empresa.com",
  };

  assert.equal(
    evaluatePrivateClientAccountAccess({
      clientId: "express-entulho",
      email: "GESTOR@empresa.com",
      environment,
    }),
    "allowed",
  );
  assert.equal(
    evaluatePrivateClientAccountAccess({
      clientId: "express-entulho",
      email: "visitante@empresa.com",
      environment,
    }),
    "account-not-authorized",
  );
});

test("a decisão de acesso usa sessão do servidor e variável privada", async () => {
  const [regra, funcao, agente] = await Promise.all([
    readFile(new URL("../src/features/private-clients/access.server.ts", import.meta.url), "utf8"),
    readFile(
      new URL("../src/features/private-clients/access.functions.ts", import.meta.url),
      "utf8",
    ),
    readFile(new URL("../src/features/express-ops-b/data/agente.ts", import.meta.url), "utf8"),
  ]);

  assert.match(regra, /getSessionUserId/);
  assert.match(regra, /process\.env/);
  assert.match(regra, /requiresVerifiedAccount/);
  // A tela e as funções que chamam a agente passam pelo MESMO portão.
  assert.match(funcao, /avaliarAcessoAoWorkspace/);
  assert.match(agente, /avaliarAcessoAoWorkspace/);
});

test("a Express possui uma única central operacional canônica", async () => {
  const [workspace, admin, legado] = await Promise.all([
    readFile(
      new URL("../src/features/private-clients/components/workspace-page.tsx", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL("../src/features/private-clients/admin.functions.ts", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL("../src/routes/clientes/express-entulho/operacoes-demo.tsx", import.meta.url),
      "utf8",
    ),
  ]);

  assert.match(workspace, /to="\/clientes\/express-entulho\/operacoes"/);
  assert.doesNotMatch(workspace, /to="\/clientes\/express-entulho\/operacoes-demo"/);
  assert.match(admin, /"\/clientes\/express-entulho\/operacoes"/);
  assert.match(legado, /redirect\(\{ to: "\/clientes\/express-entulho\/operacoes"/);
  assert.doesNotMatch(legado, /ExpressOperationsDemo/);
});

test("só /clientes/lz-team é pública; o resto de /clientes segue atrás do portão", async () => {
  const [publica, painel, dinamica, portal] = await Promise.all([
    readFile(new URL("../src/routes/clientes/lz-team/index.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/routes/clientes/lz-team/painel.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/routes/clientes/$clientSlug.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/routes/clientes/index.tsx", import.meta.url), "utf8"),
  ]);

  // A página pública não renderiza workspace nem consulta sessão.
  assert.doesNotMatch(publica, /<PrivateClientWorkspace|from "@\/features\/private-clients/);
  // O workspace do LZ continua existindo, com o mesmo componente protegido.
  assert.match(painel, /<PrivateClientWorkspace clientSlug="lz-team" \/>/);
  // Todos os outros clientes seguem pela rota dinâmica protegida.
  assert.match(dinamica, /<PrivateClientWorkspace clientSlug=\{clientSlug\} \/>/);
  // Quem entra com o selo do LZ cai no painel, não na página pública.
  assert.match(portal, /"\/clientes\/lz-team\/painel"/);
});

test("página do LZ: slots de imagem, UTMs e link do WhatsApp", async () => {
  const { slotFromFilename, pickUtm, whatsappLink } =
    await import("../src/features/lz-team/content.ts");

  assert.equal(slotFromFilename("lz-team--gallery-1.png"), "gallery-1");
  assert.equal(slotFromFilename("lz-team--cert-faixa-preta.webp"), "cert-faixa-preta");
  assert.equal(slotFromFilename("lz-team--desconhecido.png"), null);
  assert.equal(slotFromFilename("gallery-1.png"), null);

  assert.deepEqual(pickUtm("?utm_source=ig&utm_campaign=vsl&fbclid=x&outro=1"), {
    utm_source: "ig",
    utm_campaign: "vsl",
  });

  const link = whatsappLink("Olá", { utm_source: "ig", utm_campaign: "vsl" });
  assert.ok(link.startsWith("https://wa.me/5547996078242?text="));
  assert.equal(new URL(link).searchParams.get("text"), "Olá\n\n[origem: ig / vsl]");
  assert.equal(new URL(whatsappLink("Olá", {})).searchParams.get("text"), "Olá");
});
