import test from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { existsSync } from "node:fs";

registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith("./") && !/\.[a-z]+$/.test(specifier) && context.parentURL) {
      const alvo = new URL(specifier + ".ts", context.parentURL);
      if (existsSync(alvo)) return { url: alvo.href, shortCircuit: true };
    }
    return next(specifier, context);
  },
});

const { decidirVoz, vozConfigurada, sintetizar, MIME_NOTA_DE_VOZ } =
  await import("../src/lib/whatsapp-voz.ts");

/** Liga a voz só durante a ação, e devolve o ambiente como estava. */
function comVozLigada(acao) {
  const chave = process.env.ELEVENLABS_API_KEY;
  const voz = process.env.ELEVENLABS_VOICE_ID;
  process.env.ELEVENLABS_API_KEY = "chave-de-teste";
  process.env.ELEVENLABS_VOICE_ID = "voz-de-teste";
  try {
    return acao();
  } finally {
    if (chave === undefined) delete process.env.ELEVENLABS_API_KEY;
    else process.env.ELEVENLABS_API_KEY = chave;
    if (voz === undefined) delete process.env.ELEVENLABS_VOICE_ID;
    else process.env.ELEVENLABS_VOICE_ID = voz;
  }
}

test("preço NUNCA sai só em áudio — número tem que poder ser relido", () => {
  comVozLigada(() => {
    for (const comValor of [
      "A menor para demolição em Itajaí sai R$ 220.",
      "Fica 220 reais, com 3 dias inclusos.",
      "O tambor é R$ 180 e a grande R$ 450.",
      "Sai R$ 1.250,50 nesse caso.",
    ]) {
      const d = decidirVoz(comValor, { escalar: false });
      assert.equal(d.falar, false, `deixou virar áudio: ${comValor}`);
      assert.equal(d.motivo, "cita_valor");
    }
  });
});

test("conversa sem valor pode falar — é aí que o áudio ganha", () => {
  comVozLigada(() => {
    for (const semValor of [
      "É para qual material? Demolição ou gesso?",
      "Perfeito, já anotei. Te confirmo o horário ainda hoje.",
      "Você está em qual cidade?",
    ]) {
      assert.equal(decidirVoz(semValor, { escalar: false }).falar, true, semValor);
    }
  });
});

test("conversa escalada vai em texto — quem assume precisa LER, não ouvir", () => {
  comVozLigada(() => {
    const d = decidirVoz("Vou passar para uma pessoa do comercial te atender.", {
      escalar: true,
    });
    assert.equal(d.falar, false);
    assert.equal(d.motivo, "escalou");
  });
});

test("resposta longa não vira nota de voz — ninguém ouve, e custa por caractere", () => {
  comVozLigada(() => {
    const longa = "a".repeat(601);
    const d = decidirVoz(longa, { escalar: false });
    assert.equal(d.falar, false);
    assert.equal(d.motivo, "longa_demais");
    // Logo abaixo do limite ainda fala.
    assert.equal(decidirVoz("a".repeat(600), { escalar: false }).falar, true);
  });
});

test("sem chave, nada fala e nada é chamado", async () => {
  const chave = process.env.ELEVENLABS_API_KEY;
  delete process.env.ELEVENLABS_API_KEY;
  try {
    assert.equal(vozConfigurada(), false);
    const d = decidirVoz("É para qual material?", { escalar: false });
    assert.equal(d.falar, false);
    assert.equal(d.motivo, "desligada");

    // E sintetizar não chega a tocar a rede: devolve erro como valor.
    const original = globalThis.fetch;
    let chamou = false;
    globalThis.fetch = async () => {
      chamou = true;
      throw new Error("não deveria ter sido chamado");
    };
    try {
      const r = await sintetizar("oi");
      assert.equal(r.ok, false);
      assert.equal(chamou, false);
    } finally {
      globalThis.fetch = original;
    }
  } finally {
    if (chave !== undefined) process.env.ELEVENLABS_API_KEY = chave;
  }
});

test("pede OGG/Opus à ElevenLabs — mp3 chegaria como anexo, não como nota de voz", async () => {
  const original = globalThis.fetch;
  const chamadas = [];
  globalThis.fetch = async (url, init) => {
    chamadas.push({ url: String(url), init });
    return { ok: true, status: 200, arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer };
  };
  try {
    const r = await comVozLigada(() => sintetizar("É para qual material?"));
    assert.equal(r.ok, true);
    assert.equal(r.mimeType, MIME_NOTA_DE_VOZ);
    assert.equal(MIME_NOTA_DE_VOZ, "audio/ogg");
    assert.match(chamadas[0].url, /output_format=opus_48000_64/);
    assert.match(chamadas[0].url, /api\.elevenlabs\.io\/v1\/text-to-speech\//);
    // A chave vai no cabeçalho próprio da ElevenLabs, nunca na URL.
    assert.equal(chamadas[0].init.headers["xi-api-key"], "chave-de-teste");
    assert.equal(chamadas[0].url.includes("chave-de-teste"), false);
  } finally {
    globalThis.fetch = original;
  }
});

test("erro da ElevenLabs volta como valor, nunca como exceção", async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => ({ ok: false, status: 429 });
    const r = await comVozLigada(() => sintetizar("oi"));
    assert.equal(r.ok, false);
    assert.match(r.erro, /429/);

    // Rede caindo no meio também não lança para quem chamou: se lançasse,
    // derrubaria o webhook e o cliente ficaria sem resposta nenhuma.
    globalThis.fetch = async () => {
      throw new Error("ECONNRESET");
    };
    const r2 = await comVozLigada(() => sintetizar("oi"));
    assert.equal(r2.ok, false);
    assert.match(r2.erro, /ElevenLabs/);
  } finally {
    globalThis.fetch = original;
  }
});

test("áudio vazio conta como falha — melhor texto que nota de voz muda", async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => ({
      ok: true,
      status: 200,
      arrayBuffer: async () => new ArrayBuffer(0),
    });
    const r = await comVozLigada(() => sintetizar("oi"));
    assert.equal(r.ok, false);
    assert.match(r.erro, /vazio/);
  } finally {
    globalThis.fetch = original;
  }
});
