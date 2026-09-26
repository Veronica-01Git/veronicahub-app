import test from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { existsSync } from "node:fs";

// Mesmo resolvedor do whatsapp-webhook.test.mjs: src/lib importa sem extensão.
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith("./") && !/\.[a-z]+$/.test(specifier) && context.parentURL) {
      const alvo = new URL(specifier + ".ts", context.parentURL);
      if (existsSync(alvo)) return { url: alvo.href, shortCircuit: true };
    }
    return next(specifier, context);
  },
});
const { historicoDaConversa, juntarTurnos, saudacaoPara } =
  await import("../src/lib/whatsapp-agent.ts");

const cliente = (body, kind = "text") => ({ direction: "entrada", author: "cliente", kind, body });
const ia = (body) => ({ direction: "saida", author: "ia", kind: "text", body });

test("o histórico do banco vira conversa na ordem, com cada lado no seu papel", () => {
  assert.deepEqual(
    historicoDaConversa([
      cliente("Oi"),
      ia("Em qual cidade e bairro é a obra?"),
      cliente("Itajaí, Centro"),
    ]),
    [
      { role: "user", content: "Oi" },
      { role: "assistant", content: "Em qual cidade e bairro é a obra?" },
      { role: "user", content: "Itajaí, Centro" },
    ],
  );
});

test("aviso de falha de entrega não entra na memória da agente", () => {
  const historico = historicoDaConversa([
    cliente("Oi"),
    ia("Qual a cidade?"),
    {
      direction: "saida",
      author: "sistema",
      kind: "falha_entrega",
      body: "Mensagem não entregue",
    },
  ]);
  assert.equal(
    historico.some((t) => t.content.includes("não entregue")),
    false,
  );
});

test("mensagens seguidas do cliente viram um turno só", () => {
  assert.deepEqual(historicoDaConversa([cliente("Oi"), cliente("é em Itajaí"), ia("Certo!")]), [
    { role: "user", content: "Oi\né em Itajaí" },
    { role: "assistant", content: "Certo!" },
  ]);
});

test("anexo sem texto aparece como anexo, e resposta vazia nossa é pulada", () => {
  assert.deepEqual(historicoDaConversa([cliente(null, "image"), ia(null), ia("Recebi a foto!")]), [
    { role: "user", content: "[o cliente enviou: image]" },
    { role: "assistant", content: "Recebi a foto!" },
  ]);
});

test("a conversa nunca começa por uma fala nossa", () => {
  assert.deepEqual(historicoDaConversa([ia("Oi!"), cliente("Oi")]), [
    { role: "user", content: "Oi" },
  ]);
  assert.deepEqual(historicoDaConversa([ia("Oi!")]), []);
});

test("juntar turnos preserva a alternância que já existe", () => {
  const alternado = [
    { role: "user", content: "a" },
    { role: "assistant", content: "b" },
    { role: "user", content: "c" },
  ];
  assert.deepEqual(juntarTurnos(alternado), alternado);
});

test("o cumprimento segue a hora de Itajaí, não a do servidor", () => {
  // 06:50 UTC = 03:50 em Brasília: madrugada, não "bom dia" nem "boa tarde".
  assert.equal(saudacaoPara(new Date("2026-09-26T06:50:00Z")), "boa noite");
  assert.equal(saudacaoPara(new Date("2026-09-26T11:00:00Z")), "bom dia"); // 08:00
  assert.equal(saudacaoPara(new Date("2026-09-26T17:30:00Z")), "boa tarde"); // 14:30
  assert.equal(saudacaoPara(new Date("2026-09-26T22:00:00Z")), "boa noite"); // 19:00
});
