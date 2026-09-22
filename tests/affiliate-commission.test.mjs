import test from "node:test";
import assert from "node:assert/strict";
import { parseAffiliateSalesReport } from "../src/lib/affiliate-commission.ts";

test("conciliação lê TSV e converte comissão em reais para centavos", () => {
  const [row] = parseAffiliateSalesReport(
    "pedido\tsub_id\tproduto\tcomissao\tstatus\tdata\nPED-1\tDIV001\tPROD-9\t12,50\tconfirmado\t2026-09-22",
  );
  assert.equal(row.externalOrderId, "PED-1");
  assert.equal(row.affiliateCode, "div001");
  assert.equal(row.commissionCents, 1250);
  assert.equal(row.status, "confirmed");
});

test("JSON distingue valor em reais de commissionCents explícito", () => {
  const [reais, centavos] = parseAffiliateSalesReport(
    JSON.stringify([
      { pedido: "P-1", sub_id: "div1", commission: 12, status: "aprovado" },
      { pedido: "P-2", sub_id: "div1", commissionCents: 12, status: "pendente" },
    ]),
  );
  assert.equal(reais.commissionCents, 1200);
  assert.equal(centavos.commissionCents, 12);
});
