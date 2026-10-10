import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import {
  analisar,
  diasEntre,
  hojeEmBrasilia,
  lerData,
  lerNumero,
  lerPlanilha,
  paraPlanilha,
  PARAMETROS_PADRAO,
} from "../src/features/pharma/engine.ts";
import { linhasDemonstrativas } from "../src/features/pharma/demo-data.ts";
import { WORKFORCE } from "../src/lib/ai-workforce.ts";
import { PRODUCTS } from "../src/lib/ecosystem.ts";

/**
 * A Veronica Pharma promete ao dono de rede que a conta é conferível e que a
 * planilha não sai do navegador. Estes testes travam as duas promessas e o
 * enredo da demonstração que a página apresenta.
 */

const HOJE = "2026-10-10";
const P = { ...PARAMETROS_PADRAO, hoje: HOJE };
const ler = (rel) => readFileSync(new URL(rel, import.meta.url), "utf8");

const linha = (o) => ({
  filial: "A",
  sku: "X",
  produto: "Produto X",
  estoque: 0,
  vendas30d: 0,
  emTransito: 0,
  prazoEntregaDias: 3,
  validade: null,
  custoUnitario: 10,
  fornecedor: "F",
  ...o,
});

test("reposição: abaixo do ponto de pedido sugere até o alvo, descontando o trânsito", () => {
  // 3/dia, prazo 3, segurança 5, ciclo 14 → ponto 24, alvo 66.
  const a = analisar([linha({ estoque: 10, vendas30d: 90, emTransito: 6 })], P);
  const [i] = a.itens;
  assert.equal(i.pontoPedido, 24);
  assert.equal(i.alvo, 66);
  assert.equal(i.sugestaoCompra, 50);
  assert.equal(i.status, "repor");
  const pedido = a.decisoes.find((d) => d.tipo === "pedido");
  assert.equal(pedido.valor, 500);
});

test("ruptura: saldo que acaba antes da entrega é marcado e sobe de prioridade", () => {
  const a = analisar([linha({ estoque: 5, vendas30d: 90 })], P);
  assert.equal(a.itens[0].status, "ruptura");
  assert.equal(a.decisoes.find((d) => d.tipo === "pedido").prioridade, 1);
});

test("antes de comprar, usa a sobra de outra filial", () => {
  const a = analisar(
    [
      linha({ filial: "Centro", estoque: 5, vendas30d: 90 }),
      linha({ filial: "Norte", estoque: 200, vendas30d: 30 }),
    ],
    P,
  );
  const [t] = a.transferencias;
  assert.equal(t.de, "Norte");
  assert.equal(t.para, "Centro");
  const centro = a.itens.find((i) => i.filial === "Centro");
  assert.equal(centro.recebeTransferencia + centro.sugestaoCompra, 61);
  assert.equal(centro.sugestaoCompra, 0, "a sobra cobre tudo: nada a comprar");
  assert.deepEqual(a.decisoes.find((d) => d.tipo === "transferencia").filiais, ["Centro", "Norte"]);
});

test("transferência pequena demais vira compra", () => {
  const a = analisar(
    [
      linha({ filial: "Centro", estoque: 5, vendas30d: 90 }),
      linha({ filial: "Norte", estoque: 30, vendas30d: 30 }), // sobra de 6
    ],
    P,
  );
  assert.equal(a.transferencias.length, 0);
  assert.equal(a.itens.find((i) => i.filial === "Centro").sugestaoCompra, 61);
});

test("validade: projeta o que não vende até vencer e escoa para quem gira mais", () => {
  const sozinho = analisar(
    [linha({ estoque: 50, vendas30d: 6, validade: "2026-11-24" })], // 45 dias, vende 9
    P,
  );
  assert.equal(sozinho.itens[0].unidadesEmRisco, 41);
  assert.equal(sozinho.itens[0].status, "validade");

  const rede = analisar(
    [
      linha({ filial: "Sul", estoque: 50, vendas30d: 6, validade: "2026-11-24" }),
      linha({ filial: "Centro", estoque: 4, vendas30d: 60, prazoEntregaDias: 7 }),
    ],
    P,
  );
  const [t] = rede.transferencias;
  assert.equal(t.de, "Sul");
  assert.ok(t.escoaValidade);
  assert.ok(rede.itens.find((i) => i.filial === "Sul").unidadesEmRisco < 41);
});

test("lote vencido não é transferido e vira decisão de hoje", () => {
  const a = analisar(
    [
      linha({ filial: "Norte", estoque: 40, vendas30d: 3, validade: "2026-10-07" }),
      linha({ filial: "Centro", estoque: 2, vendas30d: 90 }),
    ],
    P,
  );
  assert.equal(a.transferencias.length, 0);
  const venc = a.decisoes.find((d) => d.tipo === "vencido");
  assert.equal(venc.prioridade, 1);
  assert.match(venc.motivo, /há 3 dias/);
});

test("alçada: acima do limite, a decisão sobe para o proprietário", () => {
  const a = analisar([linha({ estoque: 0, vendas30d: 300, custoUnitario: 50 })], P);
  assert.ok(a.decisoes.find((d) => d.tipo === "pedido").exigeProprietario);
  const b = analisar([linha({ estoque: 0, vendas30d: 300, custoUnitario: 50 })], {
    ...P,
    alcadaGerente: 1_000_000,
  });
  assert.ok(!b.decisoes.find((d) => d.tipo === "pedido").exigeProprietario);
});

test("a demonstração conta a história que a página promete", () => {
  const a = analisar(linhasDemonstrativas(HOJE), P);
  const tipos = new Set(a.decisoes.map((d) => d.tipo));
  for (const t of ["vencido", "transferencia", "pedido", "validade"]) assert.ok(tipos.has(t), t);
  assert.ok(
    a.transferencias.some((t) => t.escoaValidade),
    "falta o escoamento de validade",
  );
  assert.ok(a.totais.rupturas > 0);
  assert.ok(a.totais.decisoesProprietario > 0, "falta o pedido acima da alçada");
  // O enredo não pode depender do dia em que a página é aberta.
  const outroDia = analisar(linhasDemonstrativas("2027-03-01"), { ...P, hoje: "2027-03-01" });
  assert.deepEqual(
    outroDia.decisoes.map((d) => d.titulo),
    a.decisoes.map((d) => d.titulo),
  );
});

test("planilha brasileira: ponto e vírgula, decimal com vírgula, cabeçalho com acento", () => {
  const csv = [
    "﻿Loja;Código;Descrição;Saldo;Vendas 30 dias;Trânsito;Prazo;Vencimento;Custo;Distribuidora;Obs",
    'Centro;DIP;"Dipirona; 500 mg";1.200;300;0;2;03/2027;3,20;Alfa;x',
    "Norte;DIP;Dipirona;abc;10;;;;;;",
    "Norte;LOS;Losartana;10;30;;;31/02/2027;;;",
    "Centro;DIP;Repetido;1;1;;;;;;",
    "",
  ].join("\r\n");
  const r = lerPlanilha(csv);
  assert.equal(r.linhas.length, 1);
  const [l] = r.linhas;
  assert.equal(l.produto, "Dipirona; 500 mg");
  assert.equal(l.estoque, 1200);
  assert.equal(l.custoUnitario, 3.2);
  assert.equal(l.validade, "2027-03-31");
  assert.equal(l.fornecedor, "Alfa");
  assert.deepEqual(
    r.erros.map((e) => e.linha),
    [3, 4, 5],
  );
  assert.deepEqual(r.colunasIgnoradas, ["obs"]);
});

test("planilha sem coluna obrigatória é recusada com o nome da coluna", () => {
  const r = lerPlanilha("filial,sku,estoque\nA,X,1\n");
  assert.equal(r.linhas.length, 0);
  assert.match(r.erros[0].motivo, /vendas_30d/);
});

test("o modelo para baixar volta igual quando é lido de novo", () => {
  const demo = linhasDemonstrativas(HOJE);
  assert.deepEqual(lerPlanilha(paraPlanilha(demo)).linhas, demo);
});

test("números e datas", () => {
  assert.equal(lerNumero("1.234,5"), 1234.5);
  assert.equal(lerNumero("1234.5"), 1234.5);
  assert.equal(lerNumero("1.200"), 1200);
  assert.equal(lerNumero("3.20"), 3.2);
  assert.equal(lerNumero(""), null);
  assert.ok(Number.isNaN(lerNumero("12a")));
  assert.equal(lerData("5/1/2027"), "2027-01-05");
  assert.equal(lerData("13/2027"), undefined);
  assert.equal(diasEntre("2026-12-31", "2027-01-01"), 1);
  assert.equal(hojeEmBrasilia(new Date("2026-10-11T02:00:00Z")), "2026-10-10");
});

test("a planilha do visitante não sai do navegador", () => {
  const dir = new URL("../src/features/pharma/", import.meta.url);
  for (const f of readdirSync(dir)) {
    const src = readFileSync(new URL(f, dir), "utf8");
    assert.ok(!/\bfetch\(|XMLHttpRequest|sendBeacon|createServerFn/.test(src), `${f} faz rede`);
  }
});

test("Veronica Pharma e Veronica Supply estão registradas; o endereço antigo encaminha", () => {
  const produto = PRODUCTS.find((p) => p.id === "pharma");
  assert.equal(produto.to, "/veronica-pharma");
  const supply = WORKFORCE.find((a) => a.id === "supply");
  assert.equal(supply.nome, "Veronica Supply");
  assert.equal(supply.produtoId, "pharma");
  const antigo = ler("../src/routes/foguete-amarelo.tsx");
  assert.match(antigo, /redirect\(\{\s*to: "\/veronica-pharma"/);
});

test("a página não anuncia integração nem vínculo com marca do setor", () => {
  const dir = new URL("../src/features/pharma/", import.meta.url);
  const texto = readdirSync(dir)
    .map((f) => readFileSync(new URL(f, dir), "utf8"))
    .join("\n");
  assert.ok(!/cimed/i.test(texto), "a página não cita marca de terceiros");
  assert.ok(
    !/integrad[oa] com|já integra|integração nativa|parceir[oa] oficial/i.test(texto),
    "integração ou parceria anunciada",
  );
});

test("a marca Veronica não leva acento em nenhum lugar do código", () => {
  const raiz = new URL("../", import.meta.url);
  const pastas = ["src", "docs", "tests", "workers", "scripts"];
  const achados = [];
  for (const pasta of pastas) {
    let nomes = [];
    try {
      nomes = readdirSync(new URL(`${pasta}/`, raiz), { recursive: true });
    } catch {
      continue;
    }
    for (const nome of nomes) {
      if (!/\.(tsx?|mjs|js|md|css|json)$/.test(nome)) continue;
      const src = readFileSync(new URL(`${pasta}/${nome}`, raiz), "utf8");
      if (/ver[ôÔ]nica/i.test(src.replace(/ver\[ôÔ\]nica/g, ""))) achados.push(`${pasta}/${nome}`);
    }
  }
  assert.deepEqual(achados, []);
});
