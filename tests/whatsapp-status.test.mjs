import test from "node:test";
import assert from "node:assert/strict";

const { extrairFalhasDeEntrega } = await import("../src/lib/whatsapp-status.ts");

test("falha de entrega vira registro com código e motivo da Meta", () => {
  const [falha, ...resto] = extrairFalhasDeEntrega([
    {
      id: "wamid.ABC",
      status: "failed",
      timestamp: "1790404228",
      recipient_id: "554796057436",
      errors: [
        {
          code: 131047,
          title: "Re-engagement message",
          message: "Re-engagement message",
          error_data: { details: "Message failed to send because more than 24 hours have passed" },
        },
      ],
    },
  ]);

  assert.equal(resto.length, 0);
  assert.equal(falha.mensagemId, "wamid.ABC");
  assert.equal(falha.waId, "554796057436");
  assert.equal(falha.codigo, 131047);
  assert.equal(falha.ocorridoEm.toISOString(), new Date(1790404228 * 1000).toISOString());
  assert.equal(
    falha.descricao,
    "Mensagem não entregue pela Meta (código 131047): Re-engagement message — Message failed to send because more than 24 hours have passed",
  );
});

test("enviada, entregue e lida não geram registro nenhum", () => {
  const status = (s) => ({ id: `wamid.${s}`, status: s, recipient_id: "554796057436" });
  assert.deepEqual(
    extrairFalhasDeEntrega([status("sent"), status("delivered"), status("read")]),
    [],
  );
  assert.deepEqual(extrairFalhasDeEntrega(undefined), []);
});

test("título repetido na mensagem não aparece duas vezes", () => {
  const [falha] = extrairFalhasDeEntrega([
    {
      id: "wamid.X",
      status: "failed",
      recipient_id: "554796057436",
      errors: [{ code: 131026, title: "Message undeliverable", message: "Message undeliverable" }],
    },
  ]);
  assert.equal(
    falha.descricao,
    "Mensagem não entregue pela Meta (código 131026): Message undeliverable",
  );
});

test("falha sem detalhe de erro ainda é registrada, sem inventar motivo", () => {
  const [falha] = extrairFalhasDeEntrega([
    { id: "wamid.Y", status: "failed", recipient_id: "554796057436" },
  ]);
  assert.equal(falha.codigo, null);
  assert.equal(falha.descricao, "Mensagem não entregue pela Meta");
});

test("aviso sem id ou sem destinatário é ignorado — não há onde registrar", () => {
  assert.deepEqual(
    extrairFalhasDeEntrega([
      { status: "failed", recipient_id: "554796057436" },
      { id: "wamid.Z", status: "failed" },
    ]),
    [],
  );
});
