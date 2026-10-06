import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { registerHooks } from "node:module";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("Express assisted mode never connects to WhatsApp sending modules", () => {
  const assisted = read("src/features/express-ops-b/components/assistido.tsx");
  assert.match(assisted, /conversarComAgente/);
  assert.match(assisted, /Copiar resposta/);
  assert.doesNotMatch(assisted, /whatsapp-cloud|whatsapp-webhook|whatsapp-mensagem|wa\.me/);
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

registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith("./") && !/\.[a-z]+$/.test(specifier) && context.parentURL) {
      const target = new URL(specifier + ".ts", context.parentURL);
      if (existsSync(target)) return { url: target.href, shortCircuit: true };
    }
    return next(specifier, context);
  },
});
const { decidirResposta, motivoDaGuarda, valoresCitados } =
  await import("../src/lib/whatsapp-agent.ts");

test("cenários confirmados passam pelo núcleo real sem chamar WhatsApp ou modelo", async () => {
  const decidir = (texto) => decidirResposta({ texto, primeiraMensagem: true });
  const falta = await decidir("quanto custa uma caçamba?");
  assert.equal(valoresCitados(falta.texto).length, 0);
  assert.match(falta.texto, /material/i);
  for (const cidade of ["Itajaí", "Itapema"]) {
    const cotacao = await decidir(`caçamba menor, demolição, ${cidade}`);
    assert.deepEqual(valoresCitados(cotacao.texto), [220]);
    assert.equal(cotacao.escalar, true, "a equipe confirma a disponibilidade");
  }
  const distancia = await decidir("Vocês cobram mais para Itapema?");
  assert.match(distancia.texto, /igual/);
  assert.match(distancia.texto, /1 hora ou 1 dia/);
  const longe = await decidir("quero entrega em uma cidade mais distante");
  assert.equal(longe.escalar, true);
  assert.doesNotMatch(longe.texto, /chega.*\d.*h/);
  const segunda = await decidir("posso agendar domingo para segunda?");
  assert.match(segunda.texto, /40 pedidos/);
  assert.equal(segunda.escalar, true);
  const vagas = await decidir("Nesse momento ainda tem vaga das 40?");
  assert.equal(vagas.escalar, true);
  assert.doesNotMatch(vagas.texto, /\d/);
  const desconto = await decidir("me dá 10% de desconto");
  assert.equal(desconto.escalar, true);
  assert.equal(valoresCitados(desconto.texto).length, 0);
  // Única combinação ainda sem preço depois de 06/10 (gesso na grande virou R$ 450).
  const semPreco = await decidir("caçamba menor, entulho, Itapema");
  assert.equal(semPreco.escalar, true);
  assert.equal(valoresCitados(semPreco.texto).length, 0);
});

test("guarda confere o material e produto do cliente mesmo quando a resposta omite ou troca", () => {
  assert.ok(motivoDaGuarda("Sai por R$ 220.", undefined, "caçamba menor, gesso, Itapema"));
  assert.ok(
    motivoDaGuarda(
      "A menor para demolição sai por R$ 220.",
      undefined,
      "caçamba menor, gesso, Itapema",
    ),
  );
  assert.ok(motivoDaGuarda("Sai por R$ 280.", undefined, "caçamba grande, gesso, Itajaí"));
  assert.ok(motivoDaGuarda("Sai por R$ 180.", undefined, "tambor, demolição, Itapema"));
  assert.ok(motivoDaGuarda("Sai por R$ 220.", undefined, "caçamba menor, Itajaí"));
});

test("grafo completo do atendimento assistido nunca alcança leitura ou envio WhatsApp", () => {
  const root = new URL("../", import.meta.url);
  const visited = new Set();
  const queue = ["src/features/express-ops-b/components/assistido.tsx"];
  while (queue.length) {
    const path = queue.shift();
    if (visited.has(path)) continue;
    visited.add(path);
    const source = read(path);
    for (const match of source.matchAll(/(?:from|import)\s*\(?\s*["']([^"']+)["']/g)) {
      const spec = match[1];
      const target = spec.startsWith("@/")
        ? `src/${spec.slice(2)}`
        : spec.startsWith(".")
          ? new URL(spec, new URL(path, root)).pathname.slice(root.pathname.length)
          : null;
      if (!target) continue;
      const resolved = [target, target + ".ts", target + ".tsx", target + "/index.ts"].find(
        (file) => /\.(ts|tsx)$/.test(file) && existsSync(new URL(file, root)),
      );
      if (resolved) queue.push(resolved);
    }
  }
  assert.ok(visited.has("src/lib/whatsapp-agent.ts"));
  assert.ok(visited.has("src/features/private-clients/access.server.ts"));
  for (const forbidden of ["whatsapp-cloud", "whatsapp-webhook", "whatsapp-mensagem"]) {
    assert.ok(!visited.has(`src/lib/${forbidden}.ts`), forbidden);
  }
});
