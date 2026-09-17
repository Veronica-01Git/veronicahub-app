import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { registerHooks } from "node:module";
import { existsSync } from "node:fs";

// src/lib importa sem extensão ("./whatsapp-rules"), que é a convenção do
// repo e o que o bundler resolve. O executor de testes do Node é estrito,
// então completa o ".ts" aqui — mesmo recurso que o architecture.test.mjs usa.
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith("./") && !/\.[a-z]+$/.test(specifier) && context.parentURL) {
      const alvo = new URL(specifier + ".ts", context.parentURL);
      if (existsSync(alvo)) return { url: alvo.href, shortCircuit: true };
    }
    return next(specifier, context);
  },
});
// Import dinâmico de propósito: `import` estático é resolvido antes do corpo
// do módulo rodar, então o hook acima ainda não valeria.
const { verifyWebhookSignature, janela24hAberta } = await import("../src/lib/whatsapp-cloud.ts");
const {
  precisaDeHumano,
  decidirRespostaOffline,
  respostaSegura,
  valoresCitados,
  prometeuConfirmar,
  resumirErro,
} = await import("../src/lib/whatsapp-agent.ts");
const { podeCotar, buscarPreco, produtosDaCidade, produtoPorId, REGRAS_EXPRESS_ENTULHO } =
  await import("../src/lib/whatsapp-rules.ts");
const { diagnosticar } = await import("../src/lib/whatsapp-diagnostico.ts");
const { MODELO_AGENTE } = await import("../src/lib/whatsapp-agent.ts");

const SEGREDO = "segredo-de-teste-do-app-meta";

function assinar(corpo, segredo = SEGREDO) {
  return "sha256=" + createHmac("sha256", segredo).update(corpo).digest("hex");
}

const CORPO = JSON.stringify({
  object: "whatsapp_business_account",
  entry: [
    {
      changes: [
        {
          field: "messages",
          value: {
            messages: [
              { id: "wamid.T1", from: "5548999999999", type: "text", text: { body: "oi" } },
            ],
          },
        },
      ],
    },
  ],
});

test("assinatura válida é aceita", async () => {
  assert.equal(await verifyWebhookSignature(CORPO, assinar(CORPO), SEGREDO), true);
});

test("assinatura de outro segredo é recusada", async () => {
  assert.equal(await verifyWebhookSignature(CORPO, assinar(CORPO, "outro"), SEGREDO), false);
});

test("corpo adulterado depois de assinado é recusado", async () => {
  const assinatura = assinar(CORPO);
  const adulterado = CORPO.replace("oi", "ok");
  assert.equal(await verifyWebhookSignature(adulterado, assinatura, SEGREDO), false);
});

test("reserializar o JSON invalida a assinatura — por isso o corpo cru importa", async () => {
  const assinatura = assinar(CORPO);
  const reserializado = JSON.stringify(JSON.parse(CORPO), null, 2);
  assert.notEqual(reserializado, CORPO);
  assert.equal(await verifyWebhookSignature(reserializado, assinatura, SEGREDO), false);
});

test("cabeçalho ausente, vazio ou malformado é recusado", async () => {
  for (const header of [
    null,
    "",
    "sha256=",
    "sha1=" + "a".repeat(40),
    "abc",
    "sha256=zz",
    "sha256=" + "a".repeat(63),
  ]) {
    assert.equal(await verifyWebhookSignature(CORPO, header, SEGREDO), false, `aceitou: ${header}`);
  }
});

test("janela de 24 h fecha depois do prazo e nunca abre sem entrada", () => {
  assert.equal(janela24hAberta(null), false);
  assert.equal(janela24hAberta(new Date(Date.now() - 60_000)), true);
  assert.equal(janela24hAberta(new Date(Date.now() - 25 * 60 * 60 * 1000)), false);
});

test("assuntos de alçada comercial são marcados para humano", () => {
  for (const t of [
    "me dá um desconto?",
    "quero CANCELAR",
    "consegue prorrogar?",
    "tem multa?",
    "manda o boleto",
  ]) {
    assert.equal(precisaDeHumano(t), true, `não marcou: ${t}`);
  }
  assert.equal(precisaDeHumano("vocês atendem no Centro?"), false);
});

test("sem núcleo conversacional o agente escala e não cita preço", () => {
  for (const primeiraMensagem of [true, false]) {
    const d = decidirRespostaOffline({ texto: "quanto custa a caçamba?", primeiraMensagem });
    assert.equal(d.escalar, true);
    assert.ok(!/R\$|\d+\s*reais/i.test(d.texto), "a resposta não pode conter valor");
  }
});

test("os preços confirmados pelo responsável estão cadastrados", () => {
  assert.equal(podeCotar(REGRAS_EXPRESS_ENTULHO), true);
  // Demolição em Itajaí — os três que ele soube informar.
  assert.equal(buscarPreco(REGRAS_EXPRESS_ENTULHO, "cacamba-menor", "demolicao", "itajai"), 220);
  assert.equal(buscarPreco(REGRAS_EXPRESS_ENTULHO, "tambor", "demolicao", "itajai"), 180);
  assert.equal(buscarPreco(REGRAS_EXPRESS_ENTULHO, "cacamba-grande", "demolicao", "itajai"), 450);
  // Gesso: só a menor foi informada.
  assert.equal(buscarPreco(REGRAS_EXPRESS_ENTULHO, "cacamba-menor", "gesso", "itajai"), 280);
});

test("combinação que o responsável não soube informar devolve null, não uma estimativa", () => {
  // "o tambor eu não sei te passar o valor e a caçamba grande eu também não sei"
  assert.equal(buscarPreco(REGRAS_EXPRESS_ENTULHO, "tambor", "gesso", "itajai"), null);
  assert.equal(buscarPreco(REGRAS_EXPRESS_ENTULHO, "cacamba-grande", "gesso", "itajai"), null);
  // Nenhum preço fora de Itajaí foi informado.
  assert.equal(buscarPreco(REGRAS_EXPRESS_ENTULHO, "cacamba-menor", "demolicao", "itapema"), null);
  // Material que ninguém mencionou.
  assert.equal(buscarPreco(REGRAS_EXPRESS_ENTULHO, "cacamba-menor", "madeira", "itajai"), null);
});

test("tambor só existe em Itajaí; prazos valem em todas as cidades", () => {
  const itajai = produtosDaCidade(REGRAS_EXPRESS_ENTULHO, "itajai").map((p) => p.id);
  assert.deepEqual([...itajai].sort(), ["cacamba-grande", "cacamba-menor", "tambor"]);

  const itapema = produtosDaCidade(REGRAS_EXPRESS_ENTULHO, "itapema").map((p) => p.id);
  assert.deepEqual([...itapema].sort(), ["cacamba-grande", "cacamba-menor"]);
  assert.ok(!itapema.includes("tambor"), "tambor não é oferecido fora de Itajaí");

  assert.equal(produtoPorId(REGRAS_EXPRESS_ENTULHO, "cacamba-menor").diasIncluidos, 3);
  assert.equal(produtoPorId(REGRAS_EXPRESS_ENTULHO, "tambor").diasIncluidos, 3);
  assert.equal(produtoPorId(REGRAS_EXPRESS_ENTULHO, "cacamba-grande").diasIncluidos, 7);
});

test("valores em reais são extraídos nos formatos que o modelo usa", () => {
  assert.deepEqual(valoresCitados("sai por R$ 450"), [450]);
  assert.deepEqual(valoresCitados("R$ 1.250,00 no pacote"), [1250]);
  assert.deepEqual(valoresCitados("custa 380 reais"), [380]);
  assert.deepEqual(valoresCitados("fica em R$450,50"), [450.5]);
  assert.deepEqual(valoresCitados("são 7 dias de prazo"), [], "prazo não é dinheiro");
  assert.deepEqual(valoresCitados("a caçamba de 5 m³"), [], "volume não é dinheiro");
});

test("a guarda aceita só os valores da matriz — inclusive contra o R$ 240 real", () => {
  assert.equal(respostaSegura("Vou confirmar com a equipe e te retorno."), true);
  assert.equal(respostaSegura("Para demolição em Itajaí, a menor sai por R$ 220."), true);
  assert.equal(respostaSegura("O tambor fica R$ 180."), true);
  assert.equal(respostaSegura("A grande é R$ 450."), true);
  assert.equal(respostaSegura("Com gesso, a menor vai para R$ 280."), true);

  // Uma conversa real de 14/09 cotou a menor por R$ 240 — valor que não bate
  // com demolição nem com gesso. A guarda barra: o agente não repete preço
  // que não está na matriz, mesmo que alguém já tenha praticado.
  assert.equal(respostaSegura("A caçamba menor sai por R$ 240."), false);
  assert.equal(respostaSegura("Consigo fazer por R$ 200 para você."), false);
});

test("com tabela cadastrada, só passam os valores que estão nela", () => {
  const regras = {
    ...REGRAS_EXPRESS_ENTULHO,
    precosDefinidos: true,
    precos: [
      { id: "tambor", rotulo: "Tambor", capacidadeM3: 5, diasIncluidos: 7, valorReais: 450 },
    ],
    diariaExtraReais: 45,
  };
  assert.equal(respostaSegura("O tambor de 5 m³ sai por R$ 450 com 7 dias.", regras), true);
  assert.equal(respostaSegura("A diária extra é R$ 45.", regras), true);
  // O erro que a guarda existe para impedir: desconto inventado sob pressão.
  assert.equal(respostaSegura("Consigo fazer por R$ 380 para você.", regras), false);
  assert.equal(respostaSegura("Sai por R$ 449,99.", regras), false);
});

test("promessa de retorno humano marca a conversa para um humano", () => {
  // Sem isso, o "já te confirmo" morre e o cliente fica esperando ninguém.
  for (const t of [
    "Deixa eu confirmar com a equipe e já te falo.",
    "Vou verificar o valor do gesso para a grande.",
    "Te retorno em seguida com o preço.",
    "Uma pessoa da equipe assume daqui.",
  ]) {
    assert.equal(prometeuConfirmar(t), true, `não marcou: ${t}`);
  }
  assert.equal(
    prometeuConfirmar("Para demolição em Itajaí a menor sai por R$ 220, com 3 dias."),
    false,
  );
});

test("cada falha do núcleo tem motivo próprio — três causas, três mensagens", () => {
  // Em produção o segredo estava configurado e a tela dizia apenas
  // "indisponível", o que mandou procurar o problema no lugar errado.
  assert.equal(resumirErro({ status: 429 }).includes("cota"), true);
  assert.equal(resumirErro({ status: 401 }).includes("recusou a chave"), true);
  assert.equal(resumirErro({ status: 404 }).includes("modelo não encontrado"), true);
  assert.equal(resumirErro({ status: 503 }).includes("503"), true);
  assert.equal(resumirErro(new Error("socket hang up")).includes("socket hang up"), true);

  const semMotivo = decidirRespostaOffline({ texto: "oi", primeiraMensagem: true });
  assert.equal(semMotivo.escalar, true);
  const comMotivo = decidirRespostaOffline({
    texto: "oi",
    primeiraMensagem: false,
    motivo: "GROQ_API_KEY não configurada",
  });
  assert.equal(comMotivo.motivo, "GROQ_API_KEY não configurada");
});

/* ------------------------------------------------------------ diagnóstico */

test("diagnóstico sem chave acusa a chave, não a Groq", async () => {
  const d = await diagnosticar(async () => {
    throw new Error("a sonda não devia ter sido chamada sem chave");
  }, undefined);

  assert.equal(d.chaveVisivel, false);
  assert.equal(d.nucleoRespondeu, false);
  assert.equal(d.status, null);
  assert.equal(d.motivo, "GROQ_API_KEY não configurada");
  assert.equal(d.modelo, MODELO_AGENTE);
});

test("diagnóstico com a Groq respondendo devolve o caminho limpo", async () => {
  const d = await diagnosticar(async () => {}, "chave-de-teste");

  assert.equal(d.chaveVisivel, true);
  assert.equal(d.nucleoRespondeu, true);
  assert.equal(d.status, 200);
  assert.equal(d.motivo, null);
});

test("diagnóstico distingue cota, chave recusada e modelo inexistente", async () => {
  for (const [status, trecho] of [
    [429, "cota"],
    [401, "recusou a chave"],
    [404, "modelo não encontrado"],
  ]) {
    const d = await diagnosticar(async () => {
      throw Object.assign(new Error("groq"), { status });
    }, "chave-de-teste");

    assert.equal(d.chaveVisivel, true, `status ${status} não deve acusar a chave como ausente`);
    assert.equal(d.nucleoRespondeu, false);
    assert.equal(d.status, status);
    assert.equal(d.motivo.includes(trecho), true, `motivo de ${status}: ${d.motivo}`);
  }
});

test("a agente e o pipeline de matérias não dividem o mesmo modelo", async () => {
  // Esta asserção existe por causa de uma hipótese que atrasou o diagnóstico:
  // "a cota diária da Groq está estourada por causa do pipeline horário".
  // Na Groq o teto é POR MODELO. Enquanto os dois pedirem modelos distintos,
  // gastar a cota de um não derruba o outro — e essa explicação fica de pé.
  // Se alguém apontar os dois para o mesmo modelo, o raciocínio muda e este
  // teste avisa antes que ele seja repetido como verdade.
  const { readFileSync } = await import("node:fs");
  const fonte = readFileSync(new URL("../src/lib/articles-server.ts", import.meta.url), "utf8");
  const modelosDoPipeline = [
    ...fonte.matchAll(/^const DRAFT_(?:FALLBACK_)?MODEL = "([^"]+)";/gm),
  ].map((m) => m[1]);

  assert.ok(modelosDoPipeline.length >= 1, "não achei o modelo do pipeline editorial");
  assert.equal(
    modelosDoPipeline.includes(MODELO_AGENTE),
    false,
    `a agente usa ${MODELO_AGENTE}, que também é do pipeline: ${modelosDoPipeline.join(", ")}`,
  );
});
