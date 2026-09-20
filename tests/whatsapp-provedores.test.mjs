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

// A chave precisa existir ANTES do import: `configurado()` lê o ambiente na
// chamada, mas o identificador do modelo é lido uma vez, no topo do módulo.
process.env.GEMINI_API_KEY = "chave-de-teste";

const { PROVEDOR_GEMINI, CADEIA_DE_PROVEDORES } = await import("../src/lib/whatsapp-provedores.ts");

/** Troca o fetch global, devolve o que foi enviado e restaura no fim. */
async function comFetchFalso(resposta, acao) {
  const original = globalThis.fetch;
  const chamadas = [];
  globalThis.fetch = async (url, init) => {
    chamadas.push({ url: String(url), init });
    return resposta;
  };
  try {
    return { resultado: await acao(), chamadas };
  } finally {
    globalThis.fetch = original;
  }
}

function respostaOk(texto) {
  return {
    ok: true,
    status: 200,
    json: async () => ({ candidates: [{ content: { parts: [{ text: texto }] } }] }),
  };
}

test("o assistente vira 'model' — 'assistant' faz a API do Google recusar com 400", async () => {
  const { resultado, chamadas } = await comFetchFalso(respostaOk("R$ 220 em Itajaí."), () =>
    PROVEDOR_GEMINI.responder("Você atende clientes.", [
      { role: "user", content: "quanto custa?" },
      { role: "assistant", content: "é para qual material?" },
      { role: "user", content: "demolição" },
    ]),
  );

  assert.equal(resultado, "R$ 220 em Itajaí.");
  const corpo = JSON.parse(chamadas[0].init.body);
  assert.deepEqual(
    corpo.contents.map((c) => c.role),
    ["user", "model", "user"],
  );
  assert.equal(corpo.contents[1].parts[0].text, "é para qual material?");
});

test("o system vai como parâmetro de topo, nunca como fala do cliente", async () => {
  const { chamadas } = await comFetchFalso(respostaOk("ok"), () =>
    PROVEDOR_GEMINI.responder("NUNCA invente preço.", [{ role: "user", content: "oi" }]),
  );

  const corpo = JSON.parse(chamadas[0].init.body);
  assert.equal(corpo.system_instruction.parts[0].text, "NUNCA invente preço.");
  // A regra não pode aparecer no histórico: lá ela seria fala de cliente, e
  // cliente não dita as regras de preço deste agente.
  assert.equal(JSON.stringify(corpo.contents).includes("NUNCA invente"), false);
});

test("a chave viaja no cabeçalho, não na URL — URL vaza em log de proxy", async () => {
  const { chamadas } = await comFetchFalso(respostaOk("ok"), () =>
    PROVEDOR_GEMINI.responder("s", [{ role: "user", content: "oi" }]),
  );

  assert.equal(chamadas[0].url.includes("chave-de-teste"), false);
  assert.equal(chamadas[0].init.headers["x-goog-api-key"], "chave-de-teste");
  assert.match(chamadas[0].url, /generativelanguage\.googleapis\.com/);
  assert.match(chamadas[0].url, /:generateContent$/);
});

test("resposta sem candidato devolve vazio, e vazio é falha para quem chama", async () => {
  const semCandidato = { ok: true, status: 200, json: async () => ({}) };
  const { resultado } = await comFetchFalso(semCandidato, () =>
    PROVEDOR_GEMINI.responder("s", [{ role: "user", content: "oi" }]),
  );
  // Não lança: devolve "". O chamador trata vazio como falha e passa adiante,
  // em vez de encerrar a conversa do cliente.
  assert.equal(resultado, "");
});

test("erro HTTP preserva o status e o motivo é frase curta em português", async () => {
  for (const [status, esperado] of [
    [429, /cota do Gemini esgotada \(429\)/],
    [401, /recusou a chave \(401\)/],
    [404, /não encontrado no Gemini \(404\)/],
  ]) {
    const { erro } = await comFetchFalso({ ok: false, status }, async () => {
      try {
        await PROVEDOR_GEMINI.responder("s", [{ role: "user", content: "oi" }]);
        return null;
      } catch (e) {
        return e;
      }
    }).then((r) => ({ erro: r.resultado }));

    assert.ok(erro, `status ${status} deveria lançar`);
    assert.match(PROVEDOR_GEMINI.resumirErro(erro), esperado);
    // Nunca vaza corpo de erro inteiro para o painel.
    assert.ok(PROVEDOR_GEMINI.resumirErro(erro).length < 140);
  }
});

test("a cadeia tem quatro elos, com a conta paga na frente das gratuitas", () => {
  assert.equal(CADEIA_DE_PROVEDORES.length, 4);
  assert.equal(CADEIA_DE_PROVEDORES[0].nome, "Anthropic");
  assert.equal(CADEIA_DE_PROVEDORES.at(-1).nome, "Gemini");
  // Modelos distintos entre si: na Groq o teto é POR MODELO, então repetir um
  // nome aqui jogaria fora metade da cota gratuita diária.
  const modelos = CADEIA_DE_PROVEDORES.map((p) => p.modelo);
  assert.equal(new Set(modelos).size, modelos.length);
});

test("sem chave, o Gemini é pulado sem gastar uma chamada", () => {
  const anterior = process.env.GEMINI_API_KEY;
  try {
    delete process.env.GEMINI_API_KEY;
    assert.equal(PROVEDOR_GEMINI.configurado(), false);
    process.env.GEMINI_API_KEY = "x";
    assert.equal(PROVEDOR_GEMINI.configurado(), true);
  } finally {
    process.env.GEMINI_API_KEY = anterior;
  }
});
