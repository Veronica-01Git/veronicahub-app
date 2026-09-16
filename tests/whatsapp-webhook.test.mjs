import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { verifyWebhookSignature, janela24hAberta } from "../src/lib/whatsapp-cloud.ts";
import { precisaDeHumano, decidirResposta } from "../src/lib/whatsapp-agent.ts";

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

test("sem regras cadastradas o agente não decide sozinho e não cita preço", () => {
  for (const primeiraMensagem of [true, false]) {
    const d = decidirResposta({ texto: "quanto custa a caçamba?", primeiraMensagem });
    assert.equal(d.escalar, true);
    assert.ok(!/R\$|\d+\s*reais/i.test(d.texto), "a resposta não pode conter valor");
  }
});
