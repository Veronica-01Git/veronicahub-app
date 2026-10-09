import { test } from "node:test";
import assert from "node:assert/strict";
import { buildAffiliateCaption, hasCuratedCaption } from "../src/lib/affiliate-captions.ts";

const link = "https://veronicahub.com/r/afiliado?produto=x&origem=legenda_divulgador&div=ana";

test("legenda curada leva preço do cadastro e o link de quem copiou", () => {
  const caption = buildAffiliateCaption(
    {
      id: "chinelo-slide-nuvem-22297575383",
      name: "Chinelo Slide Nuvem",
      priceLabel: "R$ 19,99",
      angle: "ângulo do card",
      category: "moda",
    },
    link,
  );
  assert.match(caption, /^Pisar em nuvem existe/);
  assert.match(caption, /💰 R\$ 19,99 na Shopee/);
  assert.ok(caption.includes(`👉 ${link}`));
  assert.match(caption, /#achadinhosshopee #shopee #chinelonuvem/);
  assert.ok(!caption.includes("ângulo do card"));
});

test("produto sem legenda curada usa nome e ângulo, sem texto vazio", () => {
  assert.equal(hasCuratedCaption("produto-novo-123"), false);
  const caption = buildAffiliateCaption(
    {
      id: "produto-novo-123",
      name: "Produto Novo",
      priceLabel: "R$ 10,00",
      angle: "10mil+ vendidos",
      category: "casa",
    },
    link,
  );
  assert.equal(
    caption,
    [
      "Produto Novo",
      "",
      "10mil+ vendidos",
      "",
      "💰 R$ 10,00 na Shopee",
      `👉 ${link}`,
      "",
      "#achadinhosshopee #shopee #casa",
    ].join("\n"),
  );
  assert.ok(!/undefined|null/.test(caption));
});
