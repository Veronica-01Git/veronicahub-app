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
  decidirResposta,
  decidirRespostaOffline,
  respostaSegura,
  motivoDaGuarda,
  cidadesCitadas,
  valoresCitados,
  prometeuConfirmar,
  resumirErro,
} = await import("../src/lib/whatsapp-agent.ts");
const { podeCotar, buscarPreco, produtosDaCidade, produtoPorId, REGRAS_EXPRESS_ENTULHO } =
  await import("../src/lib/whatsapp-rules.ts");
const { diagnosticarGroq, diagnosticarWhatsApp } =
  await import("../src/lib/whatsapp-diagnostico.ts");
const { MODELO_AGENTE, MODELO_RESERVA } = await import("../src/lib/whatsapp-agent.ts");

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
  // A única pessoa que falou do assunto — o vendedor que está saindo — disse
  // "o tambor eu não sei te passar o valor e a caçamba grande eu também não
  // sei". Entre 18 e 19/09 essas duas caixas chegaram a ser preenchidas com
  // 230 e 550, sem fonte. Voltaram a ser null, e é este teste que segura.
  assert.equal(buscarPreco(REGRAS_EXPRESS_ENTULHO, "tambor", "gesso", "itajai"), null);
  assert.equal(buscarPreco(REGRAS_EXPRESS_ENTULHO, "cacamba-grande", "gesso", "itajai"), null);

  // Fora de Itajaí, só Itapema com gesso tem fonte. Demolição em Itapema
  // nunca foi informada — e não vale supor que seja a de Itajaí.
  assert.equal(buscarPreco(REGRAS_EXPRESS_ENTULHO, "cacamba-menor", "demolicao", "itapema"), null);
  assert.equal(buscarPreco(REGRAS_EXPRESS_ENTULHO, "cacamba-menor", "gesso", "navegantes"), null);

  // Materiais que a agente reconhece mas cujo preço ninguém passou.
  assert.equal(buscarPreco(REGRAS_EXPRESS_ENTULHO, "cacamba-menor", "terra", "itajai"), null);
  assert.equal(buscarPreco(REGRAS_EXPRESS_ENTULHO, "cacamba-menor", "entulho", "itajai"), null);
});

test("cada preço cadastrado tem fonte primária, e só esses seis existem", () => {
  // Áudio do vendedor que está saindo — fonte fraca, a reconfirmar com o dono.
  assert.equal(buscarPreco(REGRAS_EXPRESS_ENTULHO, "cacamba-menor", "demolicao", "itajai"), 220);
  assert.equal(buscarPreco(REGRAS_EXPRESS_ENTULHO, "tambor", "demolicao", "itajai"), 180);
  assert.equal(buscarPreco(REGRAS_EXPRESS_ENTULHO, "cacamba-grande", "demolicao", "itajai"), 450);
  // Mesmo áudio, gesso na menor.  (idem: a reconfirmar)
  assert.equal(buscarPreco(REGRAS_EXPRESS_ENTULHO, "cacamba-menor", "gesso", "itajai"), 280);
  // O DONO, em conversa real com cliente em Itapema, material gesso. Fonte forte.
  assert.equal(buscarPreco(REGRAS_EXPRESS_ENTULHO, "cacamba-menor", "gesso", "itapema"), 250);
  assert.equal(buscarPreco(REGRAS_EXPRESS_ENTULHO, "cacamba-grande", "gesso", "itapema"), 470);

  assert.equal(REGRAS_EXPRESS_ENTULHO.precos.length, 6, "nenhum preço sem fonte entrou");
});

test("Itapema é mais barata que Itajaí no mesmo material — cidade tem preço próprio", () => {
  // O dado que derrubou a suposição de tabela única: gesso na menor custa
  // R$ 280 em Itajaí e R$ 250 em Itapema. Não é tabela igual nem Itajaí mais
  // deslocamento. Se um dia alguém propuser propagar preço entre cidades,
  // este teste é a resposta.
  const itajai = buscarPreco(REGRAS_EXPRESS_ENTULHO, "cacamba-menor", "gesso", "itajai");
  const itapema = buscarPreco(REGRAS_EXPRESS_ENTULHO, "cacamba-menor", "gesso", "itapema");
  assert.notEqual(itajai, itapema);
  assert.ok(itapema < itajai, "fora da sede não é automaticamente mais caro");
});

test("a agente reconhece os materiais que o dono lista, mesmo sem preço deles", () => {
  // Estar em `materiais` é reconhecer a palavra, não saber o preço. Sem
  // preço, a guarda impede a cotação e a conversa vai para uma pessoa — que
  // é o que o próprio dono faz quando não sabe o valor.
  for (const m of ["entulho", "terra", "madeira", "telhas", "vidro", "poda"]) {
    assert.ok(
      REGRAS_EXPRESS_ENTULHO.materiais.some((x) => x.id === m),
      `${m} deveria ser reconhecido`,
    );
  }
  // E reconhecer não virou permissão para cotar.
  assert.equal(respostaSegura("Para terra em Itajaí a menor sai R$ 220.", undefined, ""), false);
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
  assert.equal(respostaSegura("O tambor fica R$ 180.", undefined, "é em Itajaí"), true);
  assert.equal(respostaSegura("A grande é R$ 450.", undefined, "obra em Itajaí, demolição"), true);
  assert.equal(respostaSegura("Com gesso, a menor vai para R$ 280.", undefined, "Itajaí"), true);

  // Uma conversa real de 14/09 cotou a menor por R$ 240 — valor que não bate
  // com demolição nem com gesso. A guarda barra: o agente não repete preço
  // que não está na matriz, mesmo que alguém já tenha praticado.
  assert.equal(respostaSegura("A caçamba menor sai por R$ 240.", undefined, "Itajaí"), false);
  assert.equal(respostaSegura("Consigo fazer por R$ 200 para você.", undefined, "Itajaí"), false);
});

test("com tabela cadastrada, só passam os valores que estão nela", () => {
  // Tabela mínima, no formato real da matriz: produto + material + cidade.
  const regras = {
    ...REGRAS_EXPRESS_ENTULHO,
    precos: [{ produto: "tambor", material: "demolicao", cidade: "itajai", valorReais: 450 }],
    diariaExtraReais: 45,
  };
  assert.equal(respostaSegura("Sai por R$ 450 com 7 dias.", regras, "Itajaí"), true);
  assert.equal(respostaSegura("A diária extra é R$ 45.", regras, "Itajaí"), true);
  // O erro que a guarda existe para impedir: desconto inventado sob pressão.
  assert.equal(respostaSegura("Consigo fazer por R$ 380 para você.", regras, "Itajaí"), false);
  assert.equal(respostaSegura("Sai por R$ 449,99.", regras, "Itajaí"), false);
  // E o erro novo: preço cadastrado só para Itajaí, cotado para outra cidade.
  assert.equal(respostaSegura("Sai por R$ 450.", regras, "é em Penha"), false);
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
  const d = await diagnosticarGroq(async () => {
    throw new Error("a sonda não devia ter sido chamada sem chave");
  }, undefined);

  assert.equal(d.chaveVisivel, false);
  assert.equal(d.respondeu, false);
  assert.equal(d.status, null);
  assert.equal(d.motivo, "GROQ_API_KEY não configurada");
  assert.equal(d.modelo, MODELO_AGENTE);
});

test("diagnóstico com a Groq respondendo devolve o caminho limpo", async () => {
  const d = await diagnosticarGroq(async () => {}, "chave-de-teste");

  assert.equal(d.chaveVisivel, true);
  assert.equal(d.respondeu, true);
  assert.equal(d.status, 200);
  assert.equal(d.motivo, null);
});

test("diagnóstico distingue cota, chave recusada e modelo inexistente", async () => {
  for (const [status, trecho] of [
    [429, "cota"],
    [401, "recusou a chave"],
    [404, "modelo não encontrado"],
  ]) {
    const d = await diagnosticarGroq(async () => {
      throw Object.assign(new Error("groq"), { status });
    }, "chave-de-teste");

    assert.equal(d.chaveVisivel, true, `status ${status} não deve acusar a chave como ausente`);
    assert.equal(d.respondeu, false);
    assert.equal(d.status, status);
    assert.equal(d.motivo.includes(trecho), true, `motivo de ${status}: ${d.motivo}`);
  }
});

const CONFIG_META = {
  phoneNumberId: "123",
  accessToken: "token-de-teste",
  graphVersion: "v21.0",
};

test("token da Meta expirado é dito com todas as letras", async () => {
  // O token da tela "Configuração da API" vale 24 horas. Gerado na véspera de
  // uma reunião, ele já está morto na hora — e o sintoma é a agente receber a
  // mensagem e não conseguir responder. Este teste existe para que o painel
  // diga "expirou" em vez de "falhou".
  const d = await diagnosticarWhatsApp(async () => 401, CONFIG_META);

  assert.equal(d.configurado, true);
  assert.equal(d.respondeu, false);
  assert.equal(d.status, 401);
  assert.match(d.motivo, /expirou/);
  assert.match(d.motivo, /24h/);
});

test("token da Meta válido passa, e nenhum segredo sai na resposta", async () => {
  const ok = await diagnosticarWhatsApp(async () => 200, CONFIG_META);
  assert.equal(ok.respondeu, true);
  assert.equal(ok.status, 200);
  assert.equal(ok.motivo, null);

  const serializado = JSON.stringify(ok);
  assert.equal(serializado.includes("token-de-teste"), false, "token não pode vazar");
  assert.equal(serializado.includes("123"), false, "phone number id não precisa sair");
});

test("sem configuração de WhatsApp, o diagnóstico diz o que falta", async () => {
  const d = await diagnosticarWhatsApp(async () => {
    throw new Error("não devia sondar sem configuração");
  }, null);

  assert.equal(d.configurado, false);
  assert.match(d.motivo, /WHATSAPP_PHONE_NUMBER_ID/);
});

test("a agente não roda no mesmo modelo que o pipeline queima de hora em hora", async () => {
  // Esta asserção existe por causa de uma hipótese que atrasou um
  // diagnóstico: "a cota diária da Groq está estourada por causa do pipeline
  // horário". Na Groq o teto é POR MODELO, e articles-server.ts registra que
  // os GPT-OSS têm cotas gratuitas separadas entre si.
  //
  // O que precisa ser verdade não é que os dois lados usem famílias
  // diferentes — é que a agente não dispute o modelo que o pipeline esgota
  // sozinho. O pipeline roda no DRAFT_MODEL toda hora; o FALLBACK só é
  // tocado quando aquele estoura. Por isso a agente usa o fallback como
  // principal: identificador comprovadamente válido, com cota quase intacta.
  const { readFileSync } = await import("node:fs");
  const fonte = readFileSync(new URL("../src/lib/articles-server.ts", import.meta.url), "utf8");
  const principalDoPipeline = fonte.match(/^const DRAFT_MODEL = "([^"]+)";/m)?.[1];

  assert.ok(principalDoPipeline, "não achei o modelo principal do pipeline editorial");
  assert.notEqual(
    MODELO_AGENTE,
    principalDoPipeline,
    `a agente usa ${MODELO_AGENTE}, o mesmo que o pipeline queima de hora em hora`,
  );
});

test("os modelos da agente são identificadores que o repositório comprova", async () => {
  // Em 19/09 a agente ficou muda: primário e reserva davam 404, e toda
  // conversa caía no offline. O sintoma engana — parece regra de negócio
  // barrando, é configuração. A defesa é não inventar nome de modelo: usar
  // os que o pipeline editorial roda em produção com a mesma credencial.
  const { readFileSync } = await import("node:fs");
  const fonte = readFileSync(new URL("../src/lib/articles-server.ts", import.meta.url), "utf8");
  const comprovados = [
    ...fonte.matchAll(/^const DRAFT_(?:FALLBACK_)?MODEL = "([^"]+)";/gm),
  ].map((m) => m[1]);

  for (const [papel, modelo] of [
    ["principal", MODELO_AGENTE],
    ["reserva", MODELO_RESERVA],
  ]) {
    assert.ok(
      comprovados.includes(modelo),
      `o modelo ${papel} (${modelo}) não é um dos comprovados em articles-server.ts: ` +
        `${comprovados.join(", ")}. Se for trocar, confirme antes que o nome existe na Groq.`,
    );
  }

  assert.notEqual(MODELO_AGENTE, MODELO_RESERVA, "reserva igual ao principal não é reserva");
});

/* ------------------------------------- a guarda confere a combinação inteira */

test("o erro que a guarda antiga deixava passar: preço de Itajaí cotado fora dela", () => {
  // Este é o caso que motivou reescrever a guarda: um valor que EXISTE na
  // matriz, cotado para uma cidade onde ele não vale. Desde 18/09 a demolição
  // fora de Itajaí tem preço, então o teste passou a usar gesso, que continua
  // só em Itajaí — a forma do erro é a mesma, o dado é que mudou.
  const conversa = "quanto custa? caçamba menor, gesso, a obra é em Itapema";

  assert.equal(
    respostaSegura("A menor com gesso sai por R$ 280.", undefined, conversa),
    false,
  );
  assert.match(motivoDaGuarda("A menor com gesso sai por R$ 280.", undefined, conversa), /Itapema/);
});

test("preço sem cidade definida não sai — Itajaí não é suposição segura", () => {
  // Sete das oito cidades atendidas não são Itajaí. Supor a sede porque é a
  // sede erraria na maioria das conversas.
  assert.equal(respostaSegura("A menor para demolição sai por R$ 220."), false);
  assert.match(motivoDaGuarda("Sai por R$ 220."), /sem a cidade/);
});

test("com a cidade certa, a combinação exata passa e a errada não", () => {
  const emItajai = "caçamba menor, gesso, Itajaí";

  // menor + gesso + Itajaí = 280. É o preço daquela combinação.
  assert.equal(respostaSegura("A menor com gesso sai por R$ 280.", undefined, emItajai), true);

  // 220 também é preço de Itajaí, mas é de DEMOLIÇÃO na menor. Cotar 220
  // para gesso é o mesmo tipo de erro, um nível abaixo.
  assert.equal(respostaSegura("A menor com gesso sai por R$ 220.", undefined, emItajai), false);

  // tambor + gesso é justamente o que o responsável não soube informar.
  assert.equal(
    respostaSegura("O tambor com gesso sai por R$ 280.", undefined, "tambor, gesso, Itajaí"),
    false,
  );
});

test("resposta que compara dois produtos não é barrada à toa", () => {
  // Citar menor e grande na mesma frase é resposta legítima. Aí a conferência
  // fica no nível da cidade em vez de recusar por ambiguidade.
  const r = respostaSegura(
    "Para demolição em Itajaí, a menor sai R$ 220 e a grande R$ 450.",
    undefined,
    "",
  );
  assert.equal(r, true);
});

test("conversa com duas cidades não deixa cotar", () => {
  // "mudei de ideia, é em Navegantes" depois de ter dito Itajaí: ambíguo, e
  // ambiguidade em preço vai para uma pessoa.
  const r = respostaSegura("Sai por R$ 220.", undefined, "é em Itajaí... na verdade Navegantes");
  assert.equal(r, false);
});

test("listar as cidades atendidas não emudece a agente sobre preço", () => {
  // O bug que motivou este teste: a guarda olhava a conversa inteira, e a
  // própria agente lista as oito cidades quando perguntam quais ela atende.
  // Essa resposta entra no histórico, e daí em diante toda cotação era
  // barrada por "cita mais de uma cidade" — a agente ficava muda sobre preço
  // logo depois de mostrar a cobertura. Uma lista de cobertura não escolhe
  // cidade; a fala seguinte escolhe.
  const conversa = [
    "quais cidades vocês atendem?",
    "Atendemos Itajaí, Balneário Camboriú, Camboriú, Itapema, Porto Belo, Ilhota, Navegantes e Penha.",
    "quero uma caçamba menor pra demolição em Itajaí",
  ].join("\n");

  assert.equal(
    respostaSegura("A menor para demolição em Itajaí sai por R$ 220.", undefined, conversa),
    true,
  );

  // E a proteção continua de pé: um preço que só vale em Itajaí não escapa
  // para outra cidade só porque a lista de cobertura passou por ali. Gesso
  // fora de Itajaí segue sem preço nenhum.
  const gessoEmItapema = [
    "quais cidades vocês atendem?",
    "Atendemos Itajaí, Balneário Camboriú, Camboriú, Itapema, Porto Belo, Ilhota, Navegantes e Penha.",
    "é gesso, em Itapema",
  ].join("\n");

  assert.equal(respostaSegura("A menor com gesso sai por R$ 280.", undefined, gessoEmItapema), false);
  assert.match(motivoDaGuarda("Sai por R$ 280.", undefined, gessoEmItapema), /Itapema/);
});

test("a cidade que vale é a última dita, não a primeira", () => {
  // Conversa real muda de assunto. Quem começou perguntando de Itapema e
  // depois diz "na minha outra obra, em Itajaí" está pedindo Itajaí.
  const conversa = ["quanto custa em Itapema?", "e na minha outra obra, em Itajaí?"].join("\n");

  assert.equal(respostaSegura("Em Itajaí, a menor para demolição sai R$ 220.", undefined, conversa), true);
});

test("resposta que cota cidade diferente da que o cliente pediu é barrada", () => {
  // R$ 220 é verdade em Itajaí. Dito para quem perguntou de Itapema, vira
  // uma cotação falsa na cabeça de quem lê.
  const conversa = "a obra é em Itapema";
  const motivo = motivoDaGuarda("Em Itajaí a menor sai por R$ 220.", undefined, conversa);

  assert.ok(motivo, "deveria barrar");
  assert.match(motivo, /Itapema/);
  assert.match(motivo, /Itaja/);
});

test("resposta que cota duas cidades de uma vez é barrada", () => {
  assert.equal(
    respostaSegura("Em Itajaí sai R$ 220 e em Itapema R$ 220.", undefined, ""),
    false,
  );
});

test("nenhum atalho responde sobre disponibilidade sem consultar agenda nenhuma", async () => {
  // O "modo demonstração blindado" de 18/09 respondia antes do modelo e antes
  // da guarda, com textos fixos. Dois deles inventavam estoque: "Tenho 2
  // caçambas menores disponíveis para entrega ainda hoje" e "a grande está
  // com a agenda cheia hoje". A agente não consulta o MAIS Locações — não
  // existe fonte para esses números. Sem GROQ_API_KEY ela tem que escalar,
  // não responder de cabeça.
  const semChave = { ...process.env };
  delete process.env.GROQ_API_KEY;
  try {
    const d = await decidirResposta({
      texto: "tem caçamba menor disponível pra hoje em Itajaí?",
      primeiraMensagem: false,
    });
    assert.equal(d.escalar, true, "disponibilidade é sempre de um humano");
    assert.doesNotMatch(d.texto, /\btenho\b|\bdisponíve/i, "não afirma estoque");
    assert.equal(valoresCitados(d.texto).length, 0, "não cita valor");
  } finally {
    Object.assign(process.env, semChave);
  }
});

test("Balneário Camboriú não é confundido com Camboriú", () => {
  // Os rótulos se contêm. Reconhecer a cidade errada aqui seria pior que não
  // reconhecer nenhuma, porque as duas podem ter preços diferentes.
  assert.deepEqual(cidadesCitadas("a obra é em Balneário Camboriú"), ["balneario-camboriu"]);
  assert.deepEqual(cidadesCitadas("a obra é em Camboriú"), ["camboriu"]);
  assert.deepEqual(cidadesCitadas("entrego em balneario camboriu mesmo"), ["balneario-camboriu"]);
});

test("texto sem preço nenhum passa sempre — a guarda só olha dinheiro", () => {
  assert.equal(respostaSegura("Em qual cidade é a obra?"), true);
  assert.equal(respostaSegura("A menor fica 3 dias na obra."), true);
});
