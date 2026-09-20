import test from "node:test";
import assert from "node:assert/strict";

import {
  checkMemoryRateLimit,
  clientIp,
  hmacSha256Hex,
  isSafeRedirectUrl,
  requireCronSecret,
  resetRateLimitState,
  resolveSameOriginPath,
  timingSafeEqual,
} from "../src/lib/security.ts";

const ORIGEM = "https://veronicahub.com";

test("timingSafeEqual aceita iguais e recusa diferentes", () => {
  assert.equal(timingSafeEqual("Bearer abc", "Bearer abc"), true);
  assert.equal(timingSafeEqual("Bearer abc", "Bearer abd"), false);
  // Comprimento diferente não pode dar match por prefixo.
  assert.equal(timingSafeEqual("Bearer ab", "Bearer abc"), false);
  assert.equal(timingSafeEqual("", ""), true);
  assert.equal(timingSafeEqual("", "x"), false);
  // Acentos: compara bytes, não unidades UTF-16.
  assert.equal(timingSafeEqual("ç", "ç"), true);
  assert.equal(timingSafeEqual("ç", "c"), false);
});

test("resolveSameOriginPath aceita caminho do próprio site", () => {
  const url = resolveSameOriginPath("/images/capa.jpg", ORIGEM);
  assert.equal(url?.toString(), "https://veronicahub.com/images/capa.jpg");
});

test("resolveSameOriginPath barra as variações que enganam o parser de URL", () => {
  // Esta é a regressão que motivou a função: cada uma destas passava no teste
  // de string antigo (startsWith("/") e !startsWith("//")) e o construtor URL
  // resolvia para um host externo — /api/img virava proxy aberto.
  const bypasses = [
    "/\\evil.com/x.jpg", // backslash: o parser traduz para "/" e vira "//"
    "/\\\\evil.com/x.jpg",
    "/\t/evil.com", // tab é descartado antes do parse
    "/\n/evil.com",
    "/\r/evil.com",
    "//evil.com/x.jpg", // protocol-relative, já barrado antes
  ];
  for (const src of bypasses) {
    assert.equal(
      resolveSameOriginPath(src, ORIGEM),
      null,
      `deveria barrar: ${JSON.stringify(src)}`,
    );
  }
});

test("resolveSameOriginPath recusa URL absoluta e caminho que não começa com /", () => {
  assert.equal(resolveSameOriginPath("https://evil.com/x.jpg", ORIGEM), null);
  assert.equal(resolveSameOriginPath("images/capa.jpg", ORIGEM), null);
  assert.equal(resolveSameOriginPath("", ORIGEM), null);
});

test("isSafeRedirectUrl só deixa passar http e https", () => {
  assert.equal(isSafeRedirectUrl("https://exemplo.com/materia"), true);
  assert.equal(isSafeRedirectUrl("http://exemplo.com"), true);
  assert.equal(isSafeRedirectUrl("javascript:alert(1)"), false);
  assert.equal(isSafeRedirectUrl("data:text/html,<script>"), false);
  assert.equal(isSafeRedirectUrl("/caminho/relativo"), false);
  assert.equal(isSafeRedirectUrl("nada"), false);
});

test("checkMemoryRateLimit libera até o limite e bloqueia depois", () => {
  resetRateLimitState();
  for (let i = 0; i < 3; i += 1) {
    assert.equal(checkMemoryRateLimit("chave", 3, 60_000).ok, true, `chamada ${i + 1}`);
  }
  const bloqueado = checkMemoryRateLimit("chave", 3, 60_000);
  assert.equal(bloqueado.ok, false);
  assert.ok(bloqueado.retryAfterSec >= 1);
});

test("checkMemoryRateLimit conta cada chave separadamente", () => {
  resetRateLimitState();
  assert.equal(checkMemoryRateLimit("ip-a", 1, 60_000).ok, true);
  assert.equal(checkMemoryRateLimit("ip-a", 1, 60_000).ok, false);
  assert.equal(checkMemoryRateLimit("ip-b", 1, 60_000).ok, true);
});

test("checkMemoryRateLimit esquece marcas fora da janela", async () => {
  resetRateLimitState();
  assert.equal(checkMemoryRateLimit("curto", 1, 30).ok, true);
  assert.equal(checkMemoryRateLimit("curto", 1, 30).ok, false);
  await new Promise((r) => setTimeout(r, 45));
  assert.equal(checkMemoryRateLimit("curto", 1, 30).ok, true);
});

test("clientIp prefere cf-connecting-ip e cai em x-forwarded-for", () => {
  const comCf = new Request(ORIGEM, {
    headers: { "cf-connecting-ip": "203.0.113.7", "x-forwarded-for": "198.51.100.1" },
  });
  assert.equal(clientIp(comCf), "203.0.113.7");

  const soForwarded = new Request(ORIGEM, {
    headers: { "x-forwarded-for": "198.51.100.1, 203.0.113.9" },
  });
  assert.equal(clientIp(soForwarded), "198.51.100.1");

  assert.equal(clientIp(new Request(ORIGEM)), "desconhecido");
});

test("requireCronSecret exige o Bearer exato", () => {
  const anterior = process.env.CRON_SECRET;
  process.env.CRON_SECRET = "segredo-de-teste";
  try {
    const autorizado = new Request(ORIGEM, {
      headers: { authorization: "Bearer segredo-de-teste" },
    });
    assert.equal(requireCronSecret(autorizado), null);

    const errado = new Request(ORIGEM, { headers: { authorization: "Bearer outro" } });
    assert.equal(requireCronSecret(errado)?.status, 401);

    assert.equal(requireCronSecret(new Request(ORIGEM))?.status, 401);

    // Prefixo correto mas incompleto não passa.
    const prefixo = new Request(ORIGEM, { headers: { authorization: "Bearer segredo" } });
    assert.equal(requireCronSecret(prefixo)?.status, 401);
  } finally {
    if (anterior === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = anterior;
  }
});

test("requireCronSecret recusa quando CRON_SECRET não está configurada", () => {
  const anterior = process.env.CRON_SECRET;
  delete process.env.CRON_SECRET;
  try {
    const resposta = requireCronSecret(
      new Request(ORIGEM, { headers: { authorization: "Bearer qualquer" } }),
    );
    assert.equal(resposta?.status, 500);
  } finally {
    if (anterior !== undefined) process.env.CRON_SECRET = anterior;
  }
});

test("hmacSha256Hex depende do segredo e da mensagem", async () => {
  const a = await hmacSha256Hex("pepper", "ana@exemplo.com:123456");
  const mesmaEntrada = await hmacSha256Hex("pepper", "ana@exemplo.com:123456");
  const outroSegredo = await hmacSha256Hex("outro", "ana@exemplo.com:123456");
  const outroEmail = await hmacSha256Hex("pepper", "bob@exemplo.com:123456");

  assert.equal(a, mesmaEntrada);
  assert.equal(a.length, 64);
  assert.notEqual(a, outroSegredo);
  // Amarrar o e-mail é o que impede reaproveitar o hash de um destino noutro.
  assert.notEqual(a, outroEmail);
});
