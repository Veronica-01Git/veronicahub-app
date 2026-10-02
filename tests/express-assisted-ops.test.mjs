import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("Express assisted mode never connects to WhatsApp sending modules", () => {
  const assisted = read("src/features/express-ops-b/components/assistido.tsx");
  assert.match(assisted, /conversarComAgente/);
  assert.match(assisted, /Copiar resposta/);
  assert.doesNotMatch(assisted, /whatsapp-cloud|whatsapp-webhook|whatsapp-mensagem|wa\.me|WhatsApp Web/);
});

test("current Express WhatsApp no-touch rule remains in force", () => {
  const agents = read("AGENTS.md");
  assert.match(agents, /não é migrado/);
  assert.match(agents, /não tem conversas apagadas/);
  assert.match(agents, /Modo assistido autorizado/);
});

test("commercial rules use one price standard across served cities", () => {
  const rules = read("src/lib/whatsapp-rules.ts");
  assert.match(rules, /precoPadraoTodasCidades: true/);
  assert.match(rules, /Distância da central em Itajaí NÃO altera o valor/);
  assert.doesNotMatch(rules, /cidade: "itapema", valorReais/);
});

test("weekend Monday agenda rule is explicit", () => {
  const rules = read("src/lib/whatsapp-rules.ts");
  assert.match(rules, /sabadoAte: "12:00"/);
  assert.match(rules, /limitePedidosSegundaFimDeSemana: 40/);
  assert.match(rules, /fimDeSemanaAceitaSegunda: true/);
});

test("fleet total is seven without inventing models", () => {
  const mock = read("src/features/express-ops-b/data/mock.ts");
  const admin = read("src/routes/clientes/express-entulho/operacoes/$secao.tsx");
  assert.match(mock, /veiculosTotal: 7/);
  assert.match(admin, /7 veículos no total/);
  assert.match(admin, /Modelo de cada veículo/);
});

test("all administrative navigation sections are marked ready", () => {
  const nav = read("src/features/express-ops-b/nav.ts");
  assert.doesNotMatch(nav, /pronta: false/);
  const catchall = read("src/routes/clientes/express-entulho/operacoes/$secao.tsx");
  assert.doesNotMatch(catchall, /Em construção/);
});
