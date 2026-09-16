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

const { extrairConteudo } = await import("../src/lib/whatsapp-mensagem.ts");

test("texto passa direto", () => {
  const c = extrairConteudo({ type: "text", text: { body: "quanto custa?" } });
  assert.equal(c.kind, "text");
  assert.equal(c.paraOAgente, "quanto custa?");
  assert.equal(c.humanoObrigatorio, false);
  assert.equal(c.ignorar, false);
});

test("áudio vai para humano — o agente não transcreve", () => {
  const c = extrairConteudo({ type: "audio", audio: { voice: true } });
  assert.equal(c.humanoObrigatorio, true);
  assert.equal(c.texto, "");
});

test("comprovante em documento vai para humano — conferir pagamento não é do agente", () => {
  const c = extrairConteudo({ type: "document", document: { filename: "comprovante.pdf" } });
  assert.equal(c.humanoObrigatorio, true);
  assert.match(c.paraOAgente, /comprovante\.pdf/);
});

test("localização vira endereço legível para o agente", () => {
  const comNome = extrairConteudo({
    type: "location",
    location: { name: "Ao lado da Tropical Lanches" },
  });
  assert.match(comNome.paraOAgente, /Tropical Lanches/);
  assert.equal(comNome.humanoObrigatorio, false);

  const soCoord = extrairConteudo({
    type: "location",
    location: { latitude: -26.9, longitude: -48.66 },
  });
  assert.match(soCoord.paraOAgente, /-26\.900000, -48\.660000/);
});

test("foto com legenda entrega a legenda; sem legenda, avisa que é foto", () => {
  const com = extrairConteudo({ type: "image", image: { caption: "é isso aqui de entulho" } });
  assert.match(com.paraOAgente, /foto/);
  assert.match(com.paraOAgente, /é isso aqui de entulho/);

  const sem = extrairConteudo({ type: "image", image: {} });
  assert.match(sem.paraOAgente, /sem legenda/);
  assert.equal(sem.humanoObrigatorio, false);
});

test("figurinha e reação não merecem resposta", () => {
  assert.equal(extrairConteudo({ type: "sticker" }).ignorar, true);
  assert.equal(extrairConteudo({ type: "reaction" }).ignorar, true);
});

test("texto vazio é ignorado em vez de virar resposta ao nada", () => {
  assert.equal(extrairConteudo({ type: "text", text: { body: "   " } }).ignorar, true);
});

test("tipo desconhecido escala em vez de fingir que entendeu", () => {
  const c = extrairConteudo({ type: "order" });
  assert.equal(c.humanoObrigatorio, true);
  assert.equal(c.kind, "order");
});

test("resposta de botão e de lista viram texto", () => {
  assert.equal(
    extrairConteudo({ type: "button", button: { text: "Quero orçamento" } }).paraOAgente,
    "Quero orçamento",
  );
  assert.equal(
    extrairConteudo({
      type: "interactive",
      interactive: { list_reply: { title: "Caçamba menor" } },
    }).paraOAgente,
    "Caçamba menor",
  );
});
