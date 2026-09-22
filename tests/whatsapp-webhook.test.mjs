import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { registerHooks } from "node:module";
import { readFile } from "node:fs/promises";
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
const {
  verifyWebhookSignature,
  janela24hAberta,
  motivoEnvioBloqueado,
  getWhatsAppConfig,
  sendText,
  EXPLICACAO_BLOQUEIO,
} = await import("../src/lib/whatsapp-cloud.ts");
const { handleTesteAgente } = await import("../src/lib/whatsapp-teste.ts");
const {
  precisaDeHumano,
  decidirResposta,
  decidirRespostaOffline,
  respostaSegura,
  motivoDaGuarda,
  cidadesCitadas,
  valoresCitados,
  prometeuConfirmar,
} = await import("../src/lib/whatsapp-agent.ts");
const { podeCotar, buscarPreco, produtosDaCidade, produtoPorId, REGRAS_EXPRESS_ENTULHO } =
  await import("../src/lib/whatsapp-rules.ts");
const { diagnosticarGroq, diagnosticarWhatsApp } =
  await import("../src/lib/whatsapp-diagnostico.ts");
const { CADEIA_DE_PROVEDORES, PROVEDOR_ANTHROPIC, MODELO_GROQ_PRINCIPAL, MODELO_GROQ_RESERVA } =
  await import("../src/lib/whatsapp-provedores.ts");

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
  // Entulho tem preço no TAMBOR (peça oficial da empresa, 14/09), e continuar
  // sem preço na caçamba é o ponto: material com preço num produto não vira
  // preço no outro.
  assert.equal(buscarPreco(REGRAS_EXPRESS_ENTULHO, "cacamba-grande", "entulho", "itajai"), null);
});

test("cada preço cadastrado tem fonte primária, e só esses sete existem", () => {
  // Áudio do vendedor que está saindo — fonte fraca, a reconfirmar com o dono.
  assert.equal(buscarPreco(REGRAS_EXPRESS_ENTULHO, "cacamba-menor", "demolicao", "itajai"), 220);
  assert.equal(buscarPreco(REGRAS_EXPRESS_ENTULHO, "tambor", "demolicao", "itajai"), 180);
  assert.equal(buscarPreco(REGRAS_EXPRESS_ENTULHO, "cacamba-grande", "demolicao", "itajai"), 450);
  // Mesmo áudio, gesso na menor.  (idem: a reconfirmar)
  assert.equal(buscarPreco(REGRAS_EXPRESS_ENTULHO, "cacamba-menor", "gesso", "itajai"), 280);
  // O DONO, em conversa real com cliente em Itapema, material gesso. Fonte forte.
  assert.equal(buscarPreco(REGRAS_EXPRESS_ENTULHO, "cacamba-menor", "gesso", "itapema"), 250);
  assert.equal(buscarPreco(REGRAS_EXPRESS_ENTULHO, "cacamba-grande", "gesso", "itapema"), 470);
  // A PRÓPRIA EMPRESA, no WhatsApp dela (14/09, 13:26): peça oficial do tambor
  // com a legenda "Tambor de entulho / 180 reias e fica 3 dias". Fonte forte.
  // A cidade é Itajaí porque o tambor só existe lá — regra já registrada, não
  // suposição nova. Ver o teste do tambor mais abaixo, que é o que segura isso.
  assert.equal(buscarPreco(REGRAS_EXPRESS_ENTULHO, "tambor", "entulho", "itajai"), 180);

  assert.equal(REGRAS_EXPRESS_ENTULHO.precos.length, 7, "nenhum preço sem fonte entrou");
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

test("cada falha tem motivo próprio — causas diferentes, mensagens diferentes", () => {
  // Em produção o segredo estava configurado e a tela dizia apenas
  // "indisponível", o que mandou procurar o problema no lugar errado.
  const groq = CADEIA_DE_PROVEDORES.find((p) => p.modelo === MODELO_GROQ_PRINCIPAL);
  assert.equal(groq.resumirErro({ status: 429 }).includes("cota"), true);
  assert.equal(groq.resumirErro({ status: 401 }).includes("recusou a chave"), true);
  assert.equal(groq.resumirErro({ status: 404 }).includes("não encontrado"), true);
  assert.equal(groq.resumirErro({ status: 503 }).includes("503"), true);
  assert.equal(groq.resumirErro(new Error("socket hang up")).includes("socket hang up"), true);

  // A Anthropic distingue as mesmas causas com as palavras dela — chave sem
  // crédito (403) é diferente de chave inválida (401), e confundir as duas
  // custa uma ida ao painel errado.
  const anthropic = PROVEDOR_ANTHROPIC.resumirErro(new Error("timeout de rede"));
  assert.match(anthropic, /Anthropic/);
  assert.match(anthropic, /timeout de rede/);

  const semMotivo = decidirRespostaOffline({ texto: "oi", primeiraMensagem: true });
  assert.equal(semMotivo.escalar, true);
  const comMotivo = decidirRespostaOffline({
    texto: "oi",
    primeiraMensagem: false,
    motivo: "ANTHROPIC_API_KEY não configurada",
  });
  assert.equal(comMotivo.motivo, "ANTHROPIC_API_KEY não configurada");
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
  assert.equal(d.modelo, MODELO_GROQ_PRINCIPAL);
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
    [404, "não encontrado na Groq"],
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

test("a reserva não roda no mesmo modelo que o pipeline queima de hora em hora", async () => {
  // Hipótese que já atrasou um diagnóstico: "a cota da Groq estourou por causa
  // do pipeline horário". Na Groq o teto é POR MODELO, e os GPT-OSS têm cotas
  // separadas entre si. O que precisa ser verdade é a reserva não disputar o
  // modelo que o pipeline esgota sozinho de hora em hora.
  const { readFileSync } = await import("node:fs");
  const fonte = readFileSync(new URL("../src/lib/articles-server.ts", import.meta.url), "utf8");
  const principalDoPipeline = fonte.match(/^const DRAFT_MODEL = "([^"]+)";/m)?.[1];

  assert.ok(principalDoPipeline, "não achei o modelo principal do pipeline editorial");
  assert.notEqual(
    MODELO_GROQ_PRINCIPAL,
    principalDoPipeline,
    `a reserva usa ${MODELO_GROQ_PRINCIPAL}, o mesmo que o pipeline queima de hora em hora`,
  );
});

test("a reserva da Groq usa identificadores que o repositório comprova", async () => {
  // Em 19/09 a agente ficou muda porque os nomes de modelo configurados não
  // existiam mais (404). A defesa é não inventar nome: os da Groq têm que ser
  // os que o pipeline editorial roda em produção com a mesma credencial.
  // (O modelo da Anthropic não entra aqui — ele vem do catálogo deles, e quem
  // o valida é a sonda do /api/whatsapp/diagnostico.)
  const { readFileSync } = await import("node:fs");
  const fonte = readFileSync(new URL("../src/lib/articles-server.ts", import.meta.url), "utf8");
  const comprovados = [...fonte.matchAll(/^const DRAFT_(?:FALLBACK_)?MODEL = "([^"]+)";/gm)].map(
    (m) => m[1],
  );

  for (const modelo of [MODELO_GROQ_PRINCIPAL, MODELO_GROQ_RESERVA]) {
    assert.ok(
      comprovados.includes(modelo),
      `${modelo} não é um dos comprovados em articles-server.ts: ${comprovados.join(", ")}`,
    );
  }
  assert.notEqual(MODELO_GROQ_PRINCIPAL, MODELO_GROQ_RESERVA, "reserva igual não é reserva");
});

test("a cadeia tem provedores independentes, na ordem certa", () => {
  // O ponto da cadeia não é ter três tentativas — é que uma falha de conta ou
  // de cota num provedor não derrube o atendimento. Duas empresas, duas
  // cobranças, dois limites. Se algum dia a cadeia inteira virar Groq, este
  // teste avisa: aí uma cota esgotada deixa a agente muda de novo.
  assert.equal(CADEIA_DE_PROVEDORES[0], PROVEDOR_ANTHROPIC, "a Anthropic é a principal");
  assert.ok(CADEIA_DE_PROVEDORES.length >= 2, "sem reserva não há cadeia");

  const empresas = new Set(CADEIA_DE_PROVEDORES.map((p) => p.nome.split(" ")[0]));
  assert.ok(empresas.size >= 2, `cadeia com um fornecedor só: ${[...empresas].join(", ")}`);

  // Toda a interface que o núcleo usa precisa existir em cada provedor.
  for (const p of CADEIA_DE_PROVEDORES) {
    assert.equal(typeof p.responder, "function", `${p.nome} não sabe responder`);
    assert.equal(typeof p.configurado, "function", `${p.nome} não sabe dizer se está configurado`);
    assert.equal(typeof p.resumirErro, "function", `${p.nome} não sabe explicar o próprio erro`);
    assert.ok(p.modelo, `${p.nome} sem modelo`);
  }
});

test("sem credencial nenhuma a agente escala, e diz o que falta", async () => {
  // Provedor sem chave é PULADO, não tentado — não adianta gastar uma chamada
  // para descobrir o que já se sabe. Sem nenhuma chave, sobra encaminhar.
  const salvo = { ...process.env };
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.GROQ_API_KEY;
  try {
    const d = await decidirResposta({ texto: "quanto custa?", primeiraMensagem: false });
    assert.equal(d.escalar, true);
    assert.match(d.motivo, /ANTHROPIC_API_KEY|GROQ_API_KEY/);
    assert.equal(valoresCitados(d.texto).length, 0, "não cita valor");
  } finally {
    Object.assign(process.env, salvo);
  }
});

/* ------------------------------------- a guarda confere a combinação inteira */

test("o erro que a guarda antiga deixava passar: preço de Itajaí cotado fora dela", () => {
  // Este é o caso que motivou reescrever a guarda: um valor que EXISTE na
  // matriz, cotado para uma cidade onde ele não vale. Desde 18/09 a demolição
  // fora de Itajaí tem preço, então o teste passou a usar gesso, que continua
  // só em Itajaí — a forma do erro é a mesma, o dado é que mudou.
  const conversa = "quanto custa? caçamba menor, gesso, a obra é em Itapema";

  assert.equal(respostaSegura("A menor com gesso sai por R$ 280.", undefined, conversa), false);
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

  assert.equal(
    respostaSegura("A menor com gesso sai por R$ 280.", undefined, gessoEmItapema),
    false,
  );
  assert.match(motivoDaGuarda("Sai por R$ 280.", undefined, gessoEmItapema), /Itapema/);
});

test("a cidade que vale é a última dita, não a primeira", () => {
  // Conversa real muda de assunto. Quem começou perguntando de Itapema e
  // depois diz "na minha outra obra, em Itajaí" está pedindo Itajaí.
  const conversa = ["quanto custa em Itapema?", "e na minha outra obra, em Itajaí?"].join("\n");

  assert.equal(
    respostaSegura("Em Itajaí, a menor para demolição sai R$ 220.", undefined, conversa),
    true,
  );
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
  assert.equal(respostaSegura("Em Itajaí sai R$ 220 e em Itapema R$ 220.", undefined, ""), false);
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

test("cada provedor explica o próprio erro, nomeando o próprio modelo", () => {
  // O painel chegou a dizer "reserva também falhou (cota esgotada no modelo
  // openai/gpt-oss-120b)" — o nome do PRIMÁRIO, porque havia uma única função
  // de erro com o modelo fixo. Quem lê conclui que a reserva nem foi tentada.
  // Diagnóstico que mente custa mais caro que diagnóstico que falta, porque
  // manda consertar a coisa errada. Agora o erro é de quem falhou.
  const cota = { status: 429 };
  const groq = CADEIA_DE_PROVEDORES.find((p) => p.modelo === MODELO_GROQ_RESERVA);

  assert.ok(groq, "a reserva da Groq sumiu da cadeia");
  assert.match(groq.resumirErro(cota), new RegExp(MODELO_GROQ_RESERVA));
  assert.doesNotMatch(groq.resumirErro(cota), new RegExp(MODELO_GROQ_PRINCIPAL));

  // E a Anthropic fala da Anthropic, não da Groq.
  const daAnthropic = PROVEDOR_ANTHROPIC.resumirErro(cota);
  assert.match(daAnthropic, /Anthropic/);
  assert.doesNotMatch(daAnthropic, /Groq/);
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

/* ------------------------------------------- trava de envio (decisão 21/09) */

/**
 * Nada sai para WhatsApp antes da aprovação do dono da Express Entulho.
 *
 * Estes testes existem porque a trava é fácil de remover sem querer: ela é um
 * `if` de três linhas dentro de `getWhatsAppConfig`, e quem estiver caçando um
 * "WhatsApp não configurado" em produção tem todo incentivo para apagá-la.
 * Se alguém apagar, isto aqui fica vermelho e diz por quê.
 */
test("com credencial e sem liberação, o envio continua bloqueado", async () => {
  const antes = {
    id: process.env.WHATSAPP_PHONE_NUMBER_ID,
    token: process.env.WHATSAPP_ACCESS_TOKEN,
    liberado: process.env.WHATSAPP_ENVIO_LIBERADO,
  };
  try {
    // Credenciais completas: o único motivo de não enviar é a falta de
    // aprovação. É exatamente o estado em que o projeto está hoje.
    process.env.WHATSAPP_PHONE_NUMBER_ID = "000000000000000";
    process.env.WHATSAPP_ACCESS_TOKEN = "token-de-teste";
    delete process.env.WHATSAPP_ENVIO_LIBERADO;

    assert.equal(motivoEnvioBloqueado(), "envio-nao-liberado");
    assert.equal(getWhatsAppConfig(), null, "config saiu mesmo sem liberação");

    // Valores que alguém tentaria por hábito não podem destravar.
    for (const tentativa of ["true", "1", "sim", "yes", "on", ""]) {
      process.env.WHATSAPP_ENVIO_LIBERADO = tentativa;
      assert.equal(
        motivoEnvioBloqueado(),
        "envio-nao-liberado",
        `"${tentativa}" não deveria liberar envio`,
      );
    }

    // O envio real devolve o motivo certo SEM TOCAR NA REDE.
    //
    // O `fetch` é substituído por um que estoura. Não é paranoia: se alguém
    // remover a trava, sem isto este teste passaria a abrir conexão de
    // verdade com a Graph da Meta toda vez que alguém rodasse `npm test`.
    // Um teste que conecta na Meta por acidente é exatamente o que este
    // arquivo existe para impedir. Com o estouro, a trava quebrada vira
    // teste vermelho em vez de tráfego.
    delete process.env.WHATSAPP_ENVIO_LIBERADO;
    const fetchOriginal = globalThis.fetch;
    globalThis.fetch = () => {
      throw new Error("a trava deixou passar: houve tentativa de conexão com a Meta");
    };
    try {
      const r = await sendText("5547999999999", "não deve sair");
      assert.equal(r.ok, false);
      assert.match(r.erro, /aguardando aprova/i);
    } finally {
      globalThis.fetch = fetchOriginal;
    }
  } finally {
    process.env.WHATSAPP_PHONE_NUMBER_ID = antes.id;
    process.env.WHATSAPP_ACCESS_TOKEN = antes.token;
    if (antes.liberado === undefined) delete process.env.WHATSAPP_ENVIO_LIBERADO;
    else process.env.WHATSAPP_ENVIO_LIBERADO = antes.liberado;
    for (const k of ["WHATSAPP_PHONE_NUMBER_ID", "WHATSAPP_ACCESS_TOKEN"]) {
      if (antes[k === "WHATSAPP_PHONE_NUMBER_ID" ? "id" : "token"] === undefined)
        delete process.env[k];
    }
  }
});

test("sem credencial nenhuma, o motivo é outro — e a frase também", () => {
  const antes = {
    id: process.env.WHATSAPP_PHONE_NUMBER_ID,
    token: process.env.WHATSAPP_ACCESS_TOKEN,
  };
  try {
    delete process.env.WHATSAPP_PHONE_NUMBER_ID;
    delete process.env.WHATSAPP_ACCESS_TOKEN;
    assert.equal(motivoEnvioBloqueado(), "sem-credenciais");
    // As duas causas se consertam de formas opostas. Confundi-las manda a
    // pessoa procurar token quando o que falta é a aprovação do dono.
    assert.notEqual(
      EXPLICACAO_BLOQUEIO["sem-credenciais"],
      EXPLICACAO_BLOQUEIO["envio-nao-liberado"],
    );
  } finally {
    if (antes.id !== undefined) process.env.WHATSAPP_PHONE_NUMBER_ID = antes.id;
    if (antes.token !== undefined) process.env.WHATSAPP_ACCESS_TOKEN = antes.token;
  }
});

/* ------------------------------------------------- sala de teste da agente */

/**
 * A sala de teste existe para o dono conversar com a agente sem risco. Estes
 * testes travam as duas propriedades que fazem dela "sem risco":
 *
 * 1. Ela não tem caminho para a Meta. Não é configuração — é ausência de
 *    código. Se alguém um dia importar `sendText` ali, o teste fica vermelho.
 * 2. Sem segredo configurado ela fica DESLIGADA, não aberta. A página vive
 *    numa rota pública e o endpoint chama modelo de linguagem: aberto é cota
 *    de terceiro à disposição de quem achar a URL.
 */
test("a sala de teste não tem como enviar nada para o WhatsApp", async () => {
  const fonte = await readFile(new URL("../src/lib/whatsapp-teste.ts", import.meta.url), "utf8");
  // Separa o corpo do arquivo do comentário de cabeçalho: o cabeçalho explica
  // justamente que não envia, e citar os nomes lá não pode reprovar o teste.
  const corpo = fonte.slice(fonte.indexOf("import "));
  for (const proibido of ["sendText", "sendAudio", "graph.facebook", "uploadAudio"]) {
    assert.ok(
      !corpo.includes(proibido),
      `whatsapp-teste.ts passou a referenciar ${proibido} — a sala deixou de ser sem risco`,
    );
  }
});

test("sem TESTE_AGENTE_TOKEN a sala recusa, em vez de ficar aberta", async () => {
  const antes = process.env.TESTE_AGENTE_TOKEN;
  try {
    delete process.env.TESTE_AGENTE_TOKEN;
    const r = await handleTesteAgente(
      new Request("https://exemplo.test/api/whatsapp/testar", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ texto: "quanto custa?" }),
      }),
    );
    assert.equal(r.status, 401);
    const corpo = await r.json();
    assert.match(corpo.erro, /desligada/i);

    // Com o segredo configurado, um token errado também não passa.
    process.env.TESTE_AGENTE_TOKEN = "segredo-certo";
    const r2 = await handleTesteAgente(
      new Request("https://exemplo.test/api/whatsapp/testar?t=segredo-errado", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ texto: "quanto custa?" }),
      }),
    );
    assert.equal(r2.status, 401);
  } finally {
    if (antes === undefined) delete process.env.TESTE_AGENTE_TOKEN;
    else process.env.TESTE_AGENTE_TOKEN = antes;
  }
});
