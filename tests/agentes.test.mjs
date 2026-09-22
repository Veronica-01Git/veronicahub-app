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
import {
  PRODUCTS,
  HOME_PRODUCTS,
  PRIMARY_NAV,
  INTENT_LINKS,
  SPECIAL_PROJECTS,
} from "../src/lib/ecosystem.ts";
import { LINKS_DE_CLIENTES } from "../src/lib/clientes.ts";

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

test("a rota é alcançável clicando, não só digitando a URL", () => {
  // Este teste nasceu de um defeito real: /agentes estava em PRODUCTS, os
  // testes passavam, e mesmo assim NÃO HAVIA UM ÚNICO LINK para ela no site
  // inteiro — a vitrine da home e o menu Ferramentas leem de HOME_PRODUCTS,
  // que é outra lista. Produto sem link é produto que não existe.
  assert.ok(
    HOME_PRODUCTS.some((p) => p.id === "agentes"),
    "/agentes fora de HOME_PRODUCTS: não aparece na home nem no menu",
  );
});

/**
 * A varredura que pega o defeito de verdade.
 *
 * O teste abaixo, e o de arquitetura, partem da LISTA DE PRODUTOS e conferem
 * se cada um tem rota. O defeito real acontece no sentido contrário: uma rota
 * nasce, funciona, passa em tudo — e não tem link em lugar nenhum. Foi o que
 * aconteceu com /agentes e com /portfolio, os dois no mesmo mês.
 *
 * Então aqui a varredura começa no DISCO: toda rota declarada precisa ou
 * aparecer na navegação, ou estar na lista abaixo, que é onde alguém declara,
 * por escrito, que aquela rota não tem link de propósito.
 *
 * Mexer nesta lista é um ato consciente. É exatamente esse o ponto.
 */
const SEM_LINK_DE_PROPOSITO = new Set([
  "/", // a própria raiz
  // Painel interno: fora da navegação pública por decisão, e o teste de
  // arquitetura já proíbe /admin de aparecer nela.
  "/admin/",
  "/admin/artigos",
  "/admin/imagens",
  "/admin/veronica-universe",
  "/admin/wire",
  "/admin/membros", // editorial restrito, acessado pelo painel admin
  "/admin/produtos-shopee", // catálogo comercial restrito, acessado pelo painel admin
  // Páginas de detalhe, alcançadas a partir de uma listagem.
  "/blog/$slug",
  "/blog/editoria/$beat",
  "/selo/$serial",
  // Material de cliente: link vai por mensagem, não pelo site.
  "/clientes/",
  "/clientes/$clientSlug",
  "/clientes/admin",
  "/clientes/veronica-fashion-operator/",
  "/clientes/veronica-fashion-operator/execucao",
  "/clientes/express-entulho/operacoes-demo",
  // Redirect do endereço antigo da proposta.
  "/proposta/express-entulho",
  // Redirects do endereço antigo do Express Operations, que saiu de
  // /preview em 21/09. Não têm link porque não são página — são o link
  // velho que o dono já tem salvo continuando a abrir.
  "/preview/express-operations-b",
  "/preview/express-operations-b/$",
  // Seções internas do Express Operations: alcançadas pela barra lateral do
  // próprio painel, depois de entrar por /clientes. A raiz dele tem link de
  // verdade e por isso NÃO está nesta lista.
  "/clientes/express-entulho/operacoes/$secao",
  "/clientes/express-entulho/operacoes/aprovacoes",
  "/clientes/express-entulho/operacoes/atendimento",
  "/clientes/express-entulho/operacoes/cacambas",
  "/clientes/express-entulho/operacoes/despacho",
  "/clientes/express-entulho/operacoes/operacoes-hoje",
  "/clientes/express-entulho/operacoes/regras-do-agente",
  "/clientes/express-entulho/operacoes/testar",
  // Rodapé e páginas de apoio do Wire, alcançadas de dentro dele.
  "/blog/expediente",
  "/blog/rede-de-fontes",
  "/blog/rede-de-fontes/relatorios",
  "/selos",
  "/selo-demo",
  "/aula-zero",
  "/veronica-curriculo-certo-rh",
]);

/** "/blog/" no disco e "/blog" na navegação são a mesma página. */
const semBarraFinal = (rota) => rota.replace(/\/$/, "") || "/";

test("nenhuma rota pública nasce órfã — ou tem link, ou está declarada sem link", () => {
  const declaradas = new Set(
    [...routeSources.matchAll(/createFileRoute\("([^"]+)"\)/g)].map((m) => semBarraFinal(m[1])),
  );
  const comLink = new Set([
    ...[...HOME_PRODUCTS, ...PRIMARY_NAV, ...INTENT_LINKS, ...SPECIAL_PROJECTS].map((p) =>
      semBarraFinal(p.to),
    ),
    // A listagem /clientes também é navegação: o que ela lista tem link.
    ...LINKS_DE_CLIENTES.map(semBarraFinal),
  ]);

  const excecoes = new Set([...SEM_LINK_DE_PROPOSITO].map(semBarraFinal));
  const orfas = [...declaradas].filter((rota) => !comLink.has(rota) && !excecoes.has(rota));

  assert.deepEqual(
    orfas.sort(),
    [],
    "rota sem link e sem declaração: ou registre na navegação, ou declare em SEM_LINK_DE_PROPOSITO",
  );
});

test("a lista de exceções não guarda rota que deixou de existir", () => {
  // Exceção órfã é pior que rota órfã: ela some do radar e dá a impressão
  // de que alguém pensou no assunto recentemente.
  const declaradas = new Set(
    [...routeSources.matchAll(/createFileRoute\("([^"]+)"\)/g)].map((m) => semBarraFinal(m[1])),
  );
  const fantasmas = [...SEM_LINK_DE_PROPOSITO].filter((r) => !declaradas.has(semBarraFinal(r)));
  assert.deepEqual(fantasmas.sort(), [], "exceções apontando para rota inexistente");
});

test("todo produto público e interno tem porta de entrada na navegação", () => {
  // A mesma armadilha vale para qualquer produto futuro. Vale a exceção de
  // quem tem lugar próprio: a escola é a raiz, e os três do PRIMARY_NAV e os
  // projetos especiais entram por outras listas.
  // Deriva do PRIMARY_NAV em vez de repetir os ids à mão: acrescentar item ao
  // menu passa a não exigir mexer neste teste.
  const comCasaPropria = new Set(["school", "zero", "rede", "rh", ...PRIMARY_NAV.map((p) => p.id)]);
  const orfaos = PRODUCTS.filter(
    (p) =>
      p.public &&
      !p.external &&
      !comCasaPropria.has(p.id) &&
      !HOME_PRODUCTS.some((h) => h.id === p.id),
  );
  assert.deepEqual(
    orfaos.map((p) => p.id),
    [],
    "produtos sem link em lugar nenhum da navegação",
  );
});
