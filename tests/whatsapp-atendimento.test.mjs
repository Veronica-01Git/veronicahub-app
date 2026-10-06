import test from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { existsSync, readFileSync } from "node:fs";

registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith("./") && !/\.[a-z]+$/.test(specifier) && context.parentURL) {
      const alvo = new URL(specifier + ".ts", context.parentURL);
      if (existsSync(alvo)) return { url: alvo.href, shortCircuit: true };
    }
    return next(specifier, context);
  },
});
const {
  agentePodeResponder,
  montarLote,
  chaveDoLote,
  finalDoNumero,
  mensagemDeAlerta,
  JANELA_AGRUPAMENTO_MS,
} = await import("../src/lib/whatsapp-atendimento.ts");

let seq = 0;
const texto = (body) => ({
  id: `m${++seq}`,
  providerId: `wamid.${seq}`,
  direction: "entrada",
  author: "cliente",
  kind: "text",
  body,
  raw: JSON.stringify({ type: "text", text: { body } }),
});
const resposta = (body, author = "ia") => ({
  id: `m${++seq}`,
  providerId: `wamid.${seq}`,
  direction: "saida",
  author,
  kind: "text",
  body,
  raw: null,
});
const marcador = (de) => ({
  id: `m${++seq}`,
  providerId: chaveDoLote(de.providerId),
  direction: "saida",
  author: "sistema",
  kind: "lote",
  body: null,
  raw: null,
});

test("regra 1: com humano a agente se cala; resolvida volta para a agente", () => {
  assert.equal(agentePodeResponder("aguardando_humano"), false);
  assert.equal(agentePodeResponder("ia"), true);
  assert.equal(agentePodeResponder("resolvida"), true);
});

test("regra 2: rajada vira um lote, e só a mensagem mais recente responde", () => {
  const a = texto("oi");
  const b = texto("quanto custa");
  const c = texto("pra itajaí");
  const linhas = [resposta("resposta antiga"), a, b, c];

  for (const antiga of [a, b]) {
    const l = montarLote(linhas, antiga.id);
    assert.equal(l.responder, false);
    assert.match(l.motivo, /mais nova/);
  }
  const lote = montarLote(linhas, c.id);
  assert.equal(lote.responder, true);
  assert.equal(lote.texto, "oi\nquanto custa\npra itajaí");
  assert.deepEqual(lote.ids, [a.id, b.id, c.id]);
  assert.equal(lote.forcarHumano, false);
  assert.ok(JANELA_AGRUPAMENTO_MS > 0 && JANELA_AGRUPAMENTO_MS < 30_000);
});

test("regra 3: marcador de lote fecha o grupo; o que vem depois é pedido novo", () => {
  const a = texto("caçamba menor");
  const novo = texto("e para gesso?");
  const linhas = [a, marcador(a), novo];
  assert.equal(montarLote(linhas, a.id).responder, false, "a já foi reivindicada");
  const lote = montarLote(linhas, novo.id);
  assert.equal(lote.responder, true);
  assert.equal(lote.texto, "e para gesso?");
});

test("falha de entrega não conta como resposta e não deixa o cliente sem ninguém", () => {
  const a = texto("oi");
  const falha = { ...resposta("Meta não entregou"), author: "sistema", kind: "falha_entrega" };
  const b = texto("alô?");
  const lote = montarLote([a, falha, b], b.id);
  assert.equal(lote.responder, true);
  assert.equal(lote.texto, "oi\nalô?");
});

test("resposta de pessoa também fecha o lote", () => {
  const a = texto("quero cancelar");
  const b = texto("obrigado");
  const lote = montarLote([a, resposta("Cancelado.", "humano"), b], b.id);
  assert.equal(lote.texto, "obrigado");
});

test("áudio sem transcrição no lote obriga humano; transcrito vai marcado", () => {
  const audio = (body) => ({
    ...texto(""),
    kind: "audio",
    body,
    raw: JSON.stringify({ type: "audio", audio: { id: "media1", voice: true } }),
  });
  const surdo = audio(null);
  const fim = texto("e aí?");
  assert.equal(montarLote([surdo, fim], fim.id).forcarHumano, true);

  const ouvido = audio("preciso de uma caçamba amanhã");
  const fim2 = texto("e aí?");
  const lote = montarLote([ouvido, fim2], fim2.id);
  assert.equal(lote.forcarHumano, false);
  assert.match(lote.texto, /transcrito automaticamente.*preciso de uma caçamba amanhã/);
});

test("lote só com figurinha não gera resposta", () => {
  const fig = {
    ...texto(""),
    kind: "sticker",
    raw: JSON.stringify({ type: "sticker", sticker: {} }),
  };
  const l = montarLote([fig], fig.id);
  assert.equal(l.responder, false);
});

test("aviso por e-mail identifica sem expor número nem conversa", () => {
  assert.equal(finalDoNumero("5547999990123"), "final 0123");
  assert.equal(finalDoNumero("12"), "número oculto");
  const { assunto, texto: corpo } = mensagemDeAlerta({
    nome: "Carlos Obra",
    waId: "5547999990123",
    motivo: "assunto fora da alçada do agente",
    urlPainel: "https://veronicahub.com/painel",
  });
  assert.match(assunto, /Carlos Obra \(final 0123\)/);
  assert.doesNotMatch(assunto + corpo, /5547999990123/);
  assert.match(corpo, /https:\/\/veronicahub\.com\/painel/);
  assert.match(corpo, /não responde mais nesta conversa/);
});

test("webhook obedece as regras: pausa, espera, reivindica e avisa", () => {
  const src = readFileSync(new URL("../src/lib/whatsapp-webhook.ts", import.meta.url), "utf8");
  const ordem = [
    "agentePodeResponder(conversa.status)",
    "esperar(JANELA_AGRUPAMENTO_MS)",
    "agentePodeResponder(agora.status)",
    "montarLote(",
    "chaveDoLote(providerId)",
    "decidirResposta(",
    "agentePodeResponder(antesDeEnviar.status)",
    "sendText(waId",
    'ne(waConversations.status, "aguardando_humano")',
    "avisarEquipe(",
  ];
  let pos = -1;
  for (const trecho of ordem) {
    const achou = src.indexOf(trecho, pos + 1);
    assert.ok(achou > pos, `fora de ordem ou ausente: ${trecho}`);
    pos = achou;
  }
  assert.match(src, /orderBy\(desc\(waMessages\.createdAt\)/);
});

test("fila humana: mesma trava do webhook, janela de 24 h e nada é apagado", () => {
  const src = readFileSync(
    new URL("../src/features/express-ops-b/data/fila-humana.ts", import.meta.url),
    "utf8",
  );
  const responder = src.slice(src.indexOf("export const responderNaFila"));
  const ordem = [
    "temAcesso()",
    "motivoEnvioBloqueado()",
    "janela24hAberta(conversa.lastInboundAt)",
    'status: "aguardando_humano"',
    "sendText(conversa.waId",
    'author: "humano"',
  ];
  let pos = -1;
  for (const trecho of ordem) {
    const achou = responder.indexOf(trecho, pos + 1);
    assert.ok(achou > pos, `responderNaFila fora de ordem ou sem: ${trecho}`);
    pos = achou;
  }
  // Toda leitura e escrita é filtrada pela Express; nenhuma remove dados.
  assert.ok((src.match(/temAcesso\(\)/g) ?? []).length >= 5);
  assert.doesNotMatch(src, /\.delete\(|DELETE|TRUNCATE/);
  // Marcador de lote não aparece para a equipe.
  assert.match(src, /ne\(waMessages\.kind, "lote"\)/);
});
