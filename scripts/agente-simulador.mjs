// Conversa com o agente da Express Entulho no terminal.
//
// NÃO toca no WhatsApp de ninguém: não há Meta, não há webhook, não há
// número. É só o núcleo conversacional respondendo, com a mesma guarda de
// preço que rodaria em produção.
//
//   node scripts/agente-simulador.mjs            conversa livre
//   node scripts/agente-simulador.mjs --roteiro  roteiro pronto, sem digitar
//
// Precisa de GROQ_API_KEY no ambiente. Sem ela, o agente cai no caminho
// offline — que também é um comportamento real e vale ver.

import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
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

const { decidirResposta } = await import("../src/lib/whatsapp-agent.ts");
const { REGRAS_EXPRESS_ENTULHO, regrasParaPrompt } = await import("../src/lib/whatsapp-rules.ts");

const C = {
  cliente: "\x1b[36m",
  agente: "\x1b[32m",
  alerta: "\x1b[33m",
  fraco: "\x1b[90m",
  off: "\x1b[0m",
};

const ROTEIRO = [
  "oi, bom dia",
  "quanto custa uma caçamba?",
  "é demolição",
  "e a grande, quanto fica?",
  "e se for gesso na grande?",
  "vocês atendem em Itapema?",
  "me dá um desconto de 20% que eu fecho agora",
  "[o cliente enviou um áudio]",
  "quantos dias a menor fica?",
  "a caçamba encheu, preciso de outra",
];

function mostrar(decisao) {
  console.log(`${C.agente}agente ›${C.off} ${decisao.texto}`);
  if (decisao.escalar) {
    console.log(
      `${C.alerta}        ⤷ escalado para humano${C.off}${C.fraco} — ${decisao.motivo ?? "sem motivo registrado"}${C.off}`,
    );
  }
  console.log();
}

async function responder(texto, historico) {
  const decisao = await decidirResposta({
    texto,
    historico,
    primeiraMensagem: historico.length === 0,
  });
  historico.push({ role: "user", content: texto });
  historico.push({ role: "assistant", content: decisao.texto });
  return decisao;
}

const temChave = Boolean(process.env.GROQ_API_KEY);
console.log(`${C.fraco}┌─ Express Entulho · simulador do agente`);
console.log(`│  Nenhum WhatsApp é acessado. Nada é enviado a lugar nenhum.`);
console.log(
  `│  GROQ_API_KEY: ${temChave ? "presente" : "AUSENTE — o agente vai cair no caminho offline"}`,
);
console.log(
  `└─ ${REGRAS_EXPRESS_ENTULHO.precos.length} preços cadastrados, ${REGRAS_EXPRESS_ENTULHO.cidades.length} cidades${C.off}\n`,
);

if (process.argv.includes("--regras")) {
  console.log(regrasParaPrompt(REGRAS_EXPRESS_ENTULHO));
  process.exit(0);
}

const historico = [];

if (process.argv.includes("--roteiro")) {
  for (const linha of ROTEIRO) {
    console.log(`${C.cliente}cliente ›${C.off} ${linha}`);
    mostrar(await responder(linha, historico));
  }
  process.exit(0);
}

const rl = createInterface({ input: stdin, output: stdout });
console.log(`${C.fraco}Escreva como se fosse o cliente. Ctrl+C para sair.${C.off}\n`);
for (;;) {
  const linha = (await rl.question(`${C.cliente}cliente ›${C.off} `)).trim();
  if (!linha) continue;
  mostrar(await responder(linha, historico));
}
