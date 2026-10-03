import { test } from "node:test";
import assert from "node:assert/strict";
import { allocateAffiliateRevenue } from "../src/lib/affiliate-revenue.ts";
import { parseAffiliateSalesReport } from "../src/lib/affiliate-commission.ts";

test("venda direta da Hub mantém toda comissão, sem criar repasse", () => {
  assert.deepEqual(allocateAffiliateRevenue(1251, "veronica", 50), {
    affiliateCents: 0,
    houseCents: 1251,
  });
});
test("divisão da Rede preserva cada centavo e a regra cadastrada", () => {
  assert.deepEqual(allocateAffiliateRevenue(1251, "div001", 50), {
    affiliateCents: 625,
    houseCents: 626,
  });
  assert.deepEqual(allocateAffiliateRevenue(1251, "div001", 20), {
    affiliateCents: 250,
    houseCents: 1001,
  });
});
test("conciliação reconhece Sub_id composto e preserva código da primeira posição", () => {
  const [row] = parseAffiliateSalesReport(
    JSON.stringify([
      {
        pedido: "P-1",
        sub_id: "veronica-analytics_instagram-beleza--",
        commission: "12,51",
        status: "confirmado",
        data: "2026-10-02",
      },
    ]),
  );
  assert.equal(row.affiliateCode, "veronica");
  assert.equal(row.commissionCents, 1251);
  assert.equal(row.orderAt.toISOString(), "2026-10-02T00:00:00.000Z");
});
test("valores inválidos não entram no relatório nem na divisão", () => {
  for (const value of [-1, Infinity, NaN, 1.5, 2147483648]) {
    assert.throws(() => allocateAffiliateRevenue(value, "veronica", 50));
    assert.throws(() =>
      parseAffiliateSalesReport(
        JSON.stringify([{ pedido: "P", sub_id: "veronica", commissionCents: value }]),
      ),
    );
  }
  assert.throws(() => allocateAffiliateRevenue(100, "div1", 101));
});
