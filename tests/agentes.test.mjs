import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import {
  AGENTES,
  PACOTES_DE_SALDO,
  agente,
  plano,
  precoConfirmado,
  restanteDoTeste,
  formatarHoras,
} from "../src/lib/agentes.ts";
import { PRODUCTS } from "../src/lib/ecosystem.ts";

const routeDir = new URL("../src/routes/", import.meta.url);
const routeSources = readdirSync(routeDir, { recursive: true })
  .filter((name) => /\.tsx?$/.test(name))
  .map((name) => readFileSync(new URL(name, routeDir), "utf8"))
  .join("\n");

test("todo preço carrega fonte, e preço sem confirmação é reconhecível", () => {
  for (const a of AGENTES) {
    for (const p of a.planos) {
      // A regra que whatsapp-rules.ts impõe ao agente, imposta aqui ao catálogo:
      // nenhum valor existe sem dizer de onde veio.
      assert.ok(p.procedencia.fonte.trim().length > 10, `${a.id}/${p.id}: fonte vazia`);
      assert.ok(Number.isInteger(p.precoCents) && p.precoCents > 0, `${a.id}/${p.id}: preço`);

      // Confirmado é tudo-ou-nada: quem confirmou E quando. Meia confirmação
      // deixaria o asterisco sumir da tela sem ninguém ter confirmado nada.
      const meiaConfirmacao =
        Boolean(p.procedencia.confirmadoPor) !== Boolean(p.procedencia.confirmadoEm);
      assert.equal(meiaConfirmacao, false, `${a.id}/${p.id}: confirmação pela metade`);
      assert.equal(
        precoConfirmado(p.procedencia),
        Boolean(p.procedencia.confirmadoPor && p.procedencia.confirmadoEm),
      );
    }
  }
});

test("o anual nunca sai mais caro que doze mensais", () => {
  for (const a of AGENTES) {
    const mensal = a.planos.find((p) => p.id === "mensal");
    const anual = a.planos.find((p) => p.id === "anual");
    if (!mensal || !anual) continue;
    assert.ok(
      anual.precoCents < mensal.precoCents * 12,
      `${a.id}: anual não economiza nada frente ao mensal`,
    );
    // Se anuncia economia, ela tem que existir de verdade no número.
    if (anual.economia) assert.ok(anual.precoCents <= mensal.precoCents * 12);
  }
});

test("identidades são únicas e cada agente tem os três planos", () => {
  assert.equal(new Set(AGENTES.map((a) => a.id)).size, AGENTES.length);
  for (const a of AGENTES) {
    assert.deepEqual(
      a.planos.map((p) => p.id),
      ["avulso", "mensal", "anual"],
      `${a.id}: planos fora de ordem ou faltando`,
    );
    assert.ok(a.entregas.length > 0, `${a.id}: sem entregas`);
    // Pendência à vista é regra editorial da casa — produto não se anuncia
    // como pronto quando não está.
    assert.ok(a.pendencias.length > 0, `${a.id}: nenhuma pendência declarada`);
    assert.equal(agente(a.id), a);
    assert.equal(plano(a.id, "mensal").id, "mensal");
  }
});

test("a rota existe de verdade e está no ecossistema", () => {
  assert.ok(routeSources.includes('createFileRoute("/agentes")'));
  const produto = PRODUCTS.find((p) => p.id === "agentes");
  assert.ok(produto, "produto 'agentes' não registrado no ecossistema");
  assert.equal(produto.to, "/agentes");
  assert.equal(produto.external, false);
  assert.equal(produto.public, true);
  // Cada âncora citada no catálogo tem um id correspondente na rota.
  for (const a of AGENTES) {
    assert.ok(routeSources.includes(`id="${a.ancora}"`), `âncora #${a.ancora} não existe na rota`);
  }
});

test("o teste grátis é de seis horas e o relógio conta para trás", () => {
  const wa = agente("whatsapp-empresarial");
  assert.equal(wa.testeHoras, 6);
  assert.equal(formatarHoras(6), "6 horas");
  assert.equal(formatarHoras(1), "1 hora");

  const agora = new Date("2026-09-20T12:00:00Z");
  assert.match(restanteDoTeste(new Date("2026-09-20T17:30:00Z"), agora), /^5h30 de teste$/);
  assert.match(restanteDoTeste(new Date("2026-09-20T12:12:00Z"), agora), /^12min de teste$/);
  // Vencido nunca devolve tempo negativo — devolve o fim.
  assert.equal(restanteDoTeste(new Date("2026-09-20T11:00:00Z"), agora), "teste encerrado");
});

test("pacotes de saldo sobem e não têm bônus escondido", () => {
  const valores = PACOTES_DE_SALDO.map((p) => p.valorCents);
  assert.deepEqual(
    valores,
    [...valores].sort((a, b) => a - b),
  );
  for (const p of PACOTES_DE_SALDO) {
    assert.ok(Number.isInteger(p.valorCents) && p.valorCents > 0);
    // Bônus mexeria no webhook do Mercado Pago (creditar mais do que entrou);
    // o catálogo não o declara, então o pacote é só um depósito comum.
    assert.equal("bonusCents" in p, false, `${p.rotulo}: bônus não implementado no webhook`);
  }
});
