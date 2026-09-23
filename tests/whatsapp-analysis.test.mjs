import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { registerHooks } from "node:module";
import test from "node:test";

registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith("./") && !/\.[a-z]+$/.test(specifier) && context.parentURL) {
      const alvo = new URL(specifier + ".ts", context.parentURL);
      if (existsSync(alvo)) return { url: alvo.href, shortCircuit: true };
    }
    return next(specifier, context);
  },
});

const { analisarConversa } = await import("../src/lib/whatsapp-analysis.ts");

function dado(leitura, campo) {
  return leitura.dados.find((item) => item.campo === campo)?.valor ?? null;
}

test("extrai o pedido natural sem inventar a cidade que não foi dita", () => {
  const leitura = analisarConversa([
    "Preciso de uma caçamba para madeira e gesso amanhã no bairro São João.",
  ]);

  assert.equal(leitura.intencao, "agendamento");
  assert.equal(dado(leitura, "material"), "gesso, madeira");
  assert.equal(dado(leitura, "quando"), "amanha");
  assert.equal(dado(leitura, "bairro"), "São João");
  assert.equal(dado(leitura, "cidade"), null);
  assert.ok(leitura.faltantes.includes("cidade"));
  assert.ok(leitura.faltantes.includes("produto"));
});

test("Balneário Camboriú não vira Camboriú na leitura operacional", () => {
  const leitura = analisarConversa([
    "Quanto custa a caçamba menor para gesso em Balneário Camboriú?",
  ]);

  assert.equal(leitura.intencao, "orcamento");
  assert.equal(dado(leitura, "cidade"), "Balneário Camboriú");
  assert.equal(dado(leitura, "produto"), "Caçamba menor");
  assert.equal(leitura.exigeHumano, true);
  assert.match(leitura.motivoHumano, /preço confirmado/i);
});

test("preço conhecido fica organizado sem virar autorização de envio", () => {
  const leitura = analisarConversa(["Qual o preço da caçamba menor para gesso em Itajaí?"]);

  assert.equal(leitura.intencao, "orcamento");
  assert.deepEqual(leitura.faltantes, []);
  assert.equal(leitura.exigeHumano, false);
});

test("prorrogação acima da alçada é marcada para revisão humana", () => {
  const leitura = analisarConversa(["A CB-021 pode ficar mais 5 dias?"]);

  assert.equal(leitura.intencao, "prorrogacao");
  assert.equal(dado(leitura, "referencia-pedido"), "CB-021");
  assert.equal(dado(leitura, "dias-prorrogacao"), "5 dias");
  assert.equal(leitura.exigeHumano, true);
  assert.match(leitura.motivoHumano, /acima de 3 dias/i);
});

test("atraso nunca recebe conclusão automática sobre motorista ou trânsito", () => {
  const leitura = analisarConversa(["O caminhão não chegou. Onde está o motorista da OS 381?"]);

  assert.equal(leitura.intencao, "atraso-problema");
  assert.equal(dado(leitura, "referencia-pedido"), "OS 381");
  assert.equal(leitura.exigeHumano, true);
  assert.match(leitura.motivoHumano, /conferir motorista, rota ou operação/i);
});

test("documento e pagamento exigem conferência humana", () => {
  const leitura = analisarConversa(["Mandei o comprovante do pedido 1942, já está pago?"]);

  assert.equal(leitura.intencao, "pagamento-documento");
  assert.equal(dado(leitura, "referencia-pedido"), "pedido 1942");
  assert.equal(leitura.exigeHumano, true);
});

test("texto ambíguo permanece indefinido em vez de ganhar uma intenção inventada", () => {
  const leitura = analisarConversa(["Oi, consegue me ajudar?"]);

  assert.equal(leitura.intencao, "indefinida");
  assert.equal(leitura.confianca, "baixa");
  assert.deepEqual(leitura.dados, []);
});

test("a análise interna não importa nenhum caminho de envio ou Graph API", async () => {
  const fonte = await readFile(new URL("../src/lib/whatsapp-analysis.ts", import.meta.url), "utf8");
  const corpo = fonte.slice(fonte.indexOf("import "));

  for (const proibido of ["sendText", "sendAudio", "graph.facebook", "whatsapp-cloud"]) {
    assert.ok(!corpo.includes(proibido), `a análise interna passou a referenciar ${proibido}`);
  }
});
