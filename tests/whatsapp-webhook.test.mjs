import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { registerHooks } from "node:module";
import { existsSync } from "node:fs";

// src/lib importa sem extensão ("./whatsapp-rules"), que é a convenção do
// repo e o que o bundler resolve. O executor de testes do Node é estrito,
// então completa o ".ts" aqui — mesmo recurso que o architecture.test.mjs usa.
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith("./") && !/\.[a-z]+$/.test(specifier) && context.parentURL) {
      const alvo = new URL(specifier + ".ts", context.parentURL);
      if (existsSync(alvo)) return { url: alvo.href, shortCircuit: true };
    }
    return next(specifier, context);
  },
});
// Import dinâmico de propósito: `import` estático é resolvido antes do corpo
// do módulo rodar, então o hook acima ainda não valeria.
const { verifyWebhookSignature, janela24hAberta } = await import("../src/lib/whatsapp-cloud.ts");
const { precisaDeHumano, decidirRespostaOffline, respostaSegura, valoresCitados } =
  await import("../src/lib/whatsapp-agent.ts");
const { podeCotar, REGRAS_EXPRESS_ENTULHO } = await import("../src/lib/whatsapp-rules.ts");

const SEGREDO = "segredo-de-teste-do-app-meta";

function assinar(corpo, segredo = SEGREDO) {
  return "sha256=" + createHmac("sha256", segredo).update(corpo).digest("hex");
}

const CORPO = JSON.stringify({
  object: "whatsapp_business_account",
  entry: [
    {
      changes: [
        {
          field: "messages",
          value: {
            messages: [
              { id: "wamid.T1", from: "5548999999999", type: "text", text: { body: "oi" } },
            ],
          },
        },
      ],
    },
  ],
});

test("assinatura válida é aceita", async () => {
  assert.equal(await verifyWebhookSignature(CORPO, assinar(CORPO), SEGREDO), true);
});

test("assinatura de outro segredo é recusada", async () => {
  assert.equal(await verifyWebhookSignature(CORPO, assinar(CORPO, "outro"), SEGREDO), false);
});

test("corpo adulterado depois de assinado é recusado", async () => {
  const assinatura = assinar(CORPO);
  const adulterado = CORPO.replace("oi", "ok");
  assert.equal(await verifyWebhookSignature(adulterado, assinatura, SEGREDO), false);
});

test("reserializar o JSON invalida a assinatura — por isso o corpo cru importa", async () => {
  const assinatura = assinar(CORPO);
  const reserializado = JSON.stringify(JSON.parse(CORPO), null, 2);
  assert.notEqual(reserializado, CORPO);
  assert.equal(await verifyWebhookSignature(reserializado, assinatura, SEGREDO), false);
});

test("cabeçalho ausente, vazio ou malformado é recusado", async () => {
  for (const header of [
    null,
    "",
    "sha256=",
    "sha1=" + "a".repeat(40),
    "abc",
    "sha256=zz",
    "sha256=" + "a".repeat(63),
  ]) {
    assert.equal(await verifyWebhookSignature(CORPO, header, SEGREDO), false, `aceitou: ${header}`);
  }
});

test("janela de 24 h fecha depois do prazo e nunca abre sem entrada", () => {
  assert.equal(janela24hAberta(null), false);
  assert.equal(janela24hAberta(new Date(Date.now() - 60_000)), true);
  assert.equal(janela24hAberta(new Date(Date.now() - 25 * 60 * 60 * 1000)), false);
});

test("assuntos de alçada comercial são marcados para humano", () => {
  for (const t of [
    "me dá um desconto?",
    "quero CANCELAR",
    "consegue prorrogar?",
    "tem multa?",
    "manda o boleto",
  ]) {
    assert.equal(precisaDeHumano(t), true, `não marcou: ${t}`);
  }
  assert.equal(precisaDeHumano("vocês atendem no Centro?"), false);
});

test("sem núcleo conversacional o agente escala e não cita preço", () => {
  for (const primeiraMensagem of [true, false]) {
    const d = decidirRespostaOffline({ texto: "quanto custa a caçamba?", primeiraMensagem });
    assert.equal(d.escalar, true);
    assert.ok(!/R\$|\d+\s*reais/i.test(d.texto), "a resposta não pode conter valor");
  }
});

test("a tabela de preços ainda não foi cadastrada", () => {
  // Quando este teste falhar, as regras entraram — é o sinal de que o agente
  // passou a poder cotar. Atualize os testes de guarda junto.
  assert.equal(podeCotar(REGRAS_EXPRESS_ENTULHO), false);
});

test("valores em reais são extraídos nos formatos que o modelo usa", () => {
  assert.deepEqual(valoresCitados("sai por R$ 450"), [450]);
  assert.deepEqual(valoresCitados("R$ 1.250,00 no pacote"), [1250]);
  assert.deepEqual(valoresCitados("custa 380 reais"), [380]);
  assert.deepEqual(valoresCitados("fica em R$450,50"), [450.5]);
  assert.deepEqual(valoresCitados("são 7 dias de prazo"), [], "prazo não é dinheiro");
  assert.deepEqual(valoresCitados("a caçamba de 5 m³"), [], "volume não é dinheiro");
});

test("sem tabela cadastrada, QUALQUER valor reprova a resposta do modelo", () => {
  assert.equal(respostaSegura("Vou confirmar com a equipe e te retorno."), true);
  assert.equal(respostaSegura("A caçamba sai por R$ 450."), false);
  assert.equal(respostaSegura("Fica em 380 reais."), false);
});

test("com tabela cadastrada, só passam os valores que estão nela", () => {
  const regras = {
    ...REGRAS_EXPRESS_ENTULHO,
    precosDefinidos: true,
    precos: [
      { id: "tambor", rotulo: "Tambor", capacidadeM3: 5, diasIncluidos: 7, valorReais: 450 },
    ],
    diariaExtraReais: 45,
  };
  assert.equal(respostaSegura("O tambor de 5 m³ sai por R$ 450 com 7 dias.", regras), true);
  assert.equal(respostaSegura("A diária extra é R$ 45.", regras), true);
  // O erro que a guarda existe para impedir: desconto inventado sob pressão.
  assert.equal(respostaSegura("Consigo fazer por R$ 380 para você.", regras), false);
  assert.equal(respostaSegura("Sai por R$ 449,99.", regras), false);
});
