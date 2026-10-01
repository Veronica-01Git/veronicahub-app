import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import {
  WORKFORCE,
  WORKFORCE_OPERANDO,
  ESTADOS,
  OPERACOES,
  DEPARTAMENTOS,
  VERTICAIS,
  IMPLEMENTACOES,
  CADEIA_DE_PAINEL,
  ESTAGIO_DA_CADEIA,
  rotaDoAgente,
} from "../src/lib/ai-workforce.ts";
import { AGENTES } from "../src/lib/agentes.ts";
import { PRODUCTS, HOME_PRODUCTS } from "../src/lib/ecosystem.ts";
import { sealRecords } from "../src/lib/seals.ts";

/**
 * A Home da AI Workforce afirma coisas sobre agentes reais. Estes testes são
 * a trava para que ela continue afirmando só o que é verdade: todo agente em
 * operação aponta a prova, todo painel citado existe como rota, todo selo
 * existe no registro, e nenhuma das frases proibidas pela missão (percentual
 * de automação, pioneirismo, valuation, retorno garantido) entra na tela.
 */

const ler = (rel) => readFileSync(new URL(rel, import.meta.url), "utf8");
const semComentarios = (src) =>
  src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/.*$/gm, "$1");

const routeDir = new URL("../src/routes/", import.meta.url);
const routeSources = readdirSync(routeDir, { recursive: true })
  .filter((name) => /\.tsx?$/.test(name))
  .map((name) => readFileSync(new URL(name, routeDir), "utf8"))
  .join("\n");
const rotas = new Set(
  [...routeSources.matchAll(/createFileRoute\("([^"]+)"\)/g)].map(
    (m) => m[1].replace(/\/$/, "") || "/",
  ),
);

const workforceDir = new URL("../src/components/home/workforce/", import.meta.url);
const telaDaHome = [
  ler("../src/routes/index.tsx"),
  ler("../src/lib/ai-workforce.ts"),
  ...readdirSync(workforceDir).map((f) => readFileSync(new URL(f, workforceDir), "utf8")),
]
  .map(semComentarios)
  .join("\n");

test("todo agente em operação declara a prova e o que ainda não faz", () => {
  assert.ok(WORKFORCE_OPERANDO.length > 0);
  for (const a of WORKFORCE) {
    assert.ok(a.prova.trim().length > 30, `${a.id}: prova vazia ou genérica`);
    // Mesma regra editorial de agentes.ts: produto não se anuncia como pronto.
    assert.ok(a.pendencias.length > 0, `${a.id}: nenhuma pendência declarada`);
    assert.ok(a.capacidades.length > 0, `${a.id}: sem capacidades`);
    assert.ok(ESTADOS[a.estado], `${a.id}: estado desconhecido`);
  }
  assert.equal(new Set(WORKFORCE.map((a) => a.id)).size, WORKFORCE.length);
});

test("rota de cada agente é derivada do ecossistema e existe de verdade", () => {
  for (const a of WORKFORCE) {
    const rota = rotaDoAgente(a);
    assert.ok(PRODUCTS.includes(rota), `${a.id}: produtoId fora de ecosystem.ts`);
    assert.ok(rotas.has(rota.to), `${a.id}: ${rota.to} não é rota`);
    if (a.comercialId) {
      assert.ok(
        AGENTES.some((c) => c.id === a.comercialId),
        `${a.id}: comercialId ${a.comercialId} não existe em agentes.ts`,
      );
    }
  }
});

test("todo painel citado existe como rota — painel que não abre não aparece", () => {
  for (const a of WORKFORCE) {
    if (a.painel) assert.ok(rotas.has(a.painel.to), `${a.id}: painel ${a.painel.to} inexistente`);
  }
  for (const op of OPERACOES) {
    assert.ok(
      PRODUCTS.some((p) => p.id === op.produtoId),
      `${op.id}: produto inexistente`,
    );
    for (const p of op.paineis) assert.ok(rotas.has(p.to), `${op.id}: painel ${p.to} inexistente`);
  }
  // Painel administrativo é restrito: a Home não pode virar link aberto para /admin.
  assert.ok(!/to=["{][^"}]*\/admin/.test(telaDaHome), "a Home não pode linkar /admin");
});

test("a cadeia de painel não diz que opera o que hoje é tela com dado de demonstração", () => {
  assert.deepEqual(Object.keys(ESTAGIO_DA_CADEIA), [...CADEIA_DE_PAINEL]);
  // A central da Express lê o mock até a implantação. Enquanto ler, as etapas
  // que só existem nela não podem subir para "opera".
  const queries = ler("../src/features/express-ops-b/data/queries.ts");
  if (/return expressOpsMock/.test(queries)) {
    for (const etapa of ["TAREFAS", "APROVAÇÕES", "LOGS"]) {
      assert.notEqual(ESTAGIO_DA_CADEIA[etapa], "opera", `${etapa} está em mock na Express`);
    }
    const atendimento = WORKFORCE.find((a) => a.id === "atendimento");
    assert.ok(
      atendimento.painel.administra.some((t) => /demonstra/i.test(t)),
      "o painel da Express precisa dizer que roda com dado de demonstração",
    );
  }
});

test("todo selo citado existe no registro, e nenhum é emprestado de outra entrega", () => {
  const seriais = new Set(sealRecords.map((s) => s.serial));
  for (const a of WORKFORCE) if (a.selo) assert.ok(seriais.has(a.selo), `${a.id}: selo ${a.selo}`);
  for (const i of IMPLEMENTACOES) {
    if (i.selo === null) continue;
    assert.ok(seriais.has(i.selo), `${i.id}: selo ${i.selo} não existe`);
    const registro = sealRecords.find((s) => s.serial === i.selo);
    // O nome do cliente na Home bate com o do selo (o selo pode ser mais longo).
    assert.ok(
      registro.client.toLowerCase().includes(i.cliente.toLowerCase().split(" ")[0]),
      `${i.id}: selo ${i.selo} pertence a ${registro.client}`,
    );
    assert.ok(!registro.isDemonstration, `${i.id}: selo de demonstração não é implementação real`);
  }
  // Cada selo aparece em no máximo uma implementação.
  const usados = IMPLEMENTACOES.map((i) => i.selo).filter(Boolean);
  assert.equal(new Set(usados).size, usados.length, "selo repetido entre implementações");
});

test("implementação em desenvolvimento não se apresenta como produção nem piloto", () => {
  for (const i of IMPLEMENTACOES) {
    if (!i.selo) continue;
    const registro = sealRecords.find((s) => s.serial === i.selo);
    if (registro.status === "development") {
      assert.ok(
        !["producao", "piloto"].includes(i.tipo),
        `${i.id}: selo diz "em desenvolvimento", Home diz ${i.tipo}`,
      );
    }
  }
});

test("solução possível não usa nome de agente que já existe", () => {
  // Se um agente conceitual tivesse o nome de um real, a tela de Enterprise
  // emprestaria a prova do real para o que ainda é desenho.
  const reais = new Set(WORKFORCE.map((a) => a.nome.toLowerCase()));
  for (const d of DEPARTAMENTOS) {
    assert.ok(d.agentes.length > 0, `${d.id}: departamento sem agente`);
    for (const a of d.agentes) assert.ok(!reais.has(a.nome.toLowerCase()), a.nome);
    if (d.jaExiste)
      assert.ok(
        WORKFORCE.some((w) => w.id === d.jaExiste),
        d.jaExiste,
      );
  }
  for (const v of VERTICAIS) {
    if (v.produtoId)
      assert.ok(
        PRODUCTS.some((p) => p.id === v.produtoId),
        v.id,
      );
  }
});

test("a Home não faz as afirmações que a missão proíbe", () => {
  const proibidas = [
    [/100\s*%/, "percentual de automação"],
    [/primeir[ao] (ia|inteligência|plataforma)/i, "pioneirismo"],
    [/valuation/i, "valuation"],
    [/milh(ões|ão)|bilh(ões|ão)/i, "cifra de faturamento ou valor"],
    [/R\$\s?\d/, "preço inventado na vitrine Enterprise"],
    [/garant(e|ido|ida|imos)\b/i, "retorno garantido"],
    [/\bROI\b/, "ROI"],
    [/\bWEG\b/, "empresa citada como cliente sem autorização"],
  ];
  for (const [re, motivo] of proibidas) {
    assert.ok(!re.test(telaDaHome), `frase proibida na Home (${motivo}): ${re}`);
  }
});

test("o fechamento Enterprise não tem fluxo de pagamento", () => {
  // A missão pede proposta, não checkout: nenhum módulo de cobrança, carteira
  // ou preço pode entrar na Home.
  const imports = [...telaDaHome.matchAll(/from\s+["']([^"']+)["']/g)].map((m) => m[1]);
  for (const proibido of ["mercadopago", "wallet", "prompt-pack-commerce", "wire-commerce"]) {
    assert.ok(!imports.some((i) => i.includes(proibido)), `a Home importa ${proibido}`);
  }
  assert.ok(!/formatarBRL|precoCents|PACOTES_DE_SALDO/.test(telaDaHome), "preço na Home");
});

test("o único sinal vivo é o feed público do Wire — nenhuma API fictícia é chamada", () => {
  const fetches = [...telaDaHome.matchAll(/fetch\(\s*["'`]([^"'`]+)["'`]/g)].map((m) => m[1]);
  assert.deepEqual(fetches, ["/api/wire/feed.json"]);
  // O contrato futuro está documentado, mas não pode ser chamado antes de existir.
  const server = ler("../src/server.ts");
  if (!/\/api\/agents\/status/.test(server)) {
    assert.ok(!/fetch\([^)]*\/api\/agents/.test(telaDaHome));
  }
});

test("as imagens da vitrine existem nas duas resoluções do srcSet", () => {
  for (const a of WORKFORCE) {
    for (const r of ["1280", "4k"]) {
      const arquivo = new URL(
        `../public/images/home/platforms/${a.midia.base}-${r}.webp`,
        import.meta.url,
      );
      assert.ok(existsSync(arquivo), `${a.id}: falta ${a.midia.base}-${r}.webp`);
    }
    assert.ok(a.midia.alt.length > 15, `${a.id}: alt vazio`);
  }
  for (const img of [
    "../public/images/veronica/veronica-hero-static.webp",
    "../public/images/veronica/veronica-hero-hologram-v2.webp",
  ]) {
    assert.ok(existsSync(new URL(img, import.meta.url)), img);
  }
});

test("a Home ainda renderiza a vitrine inteira de HOME_PRODUCTS", () => {
  // O teste de rota órfã conta HOME_PRODUCTS como linkado porque a Home o
  // renderiza. Se a Home deixar de importar a lista, aquela conta mente.
  const indice = ler("../src/components/home/workforce/PlatformIndex.tsx");
  assert.ok(/HOME_PRODUCTS/.test(indice));
  assert.ok(/<PlatformIndex\s*\/>/.test(ler("../src/routes/index.tsx")));
  assert.ok(HOME_PRODUCTS.some((p) => p.id === "agentes"));
});

test("a Home anterior foi preservada, não apagada", () => {
  const anterior = ler("../src/components/home/EcosystemHome.tsx");
  assert.ok(/export function EcosystemHome\(/.test(anterior));
  assert.ok(/export const ecosystemHomeHead/.test(anterior));
  // E não virou rota duplicada de "/".
  assert.ok(!/createFileRoute\(/.test(anterior));
});
