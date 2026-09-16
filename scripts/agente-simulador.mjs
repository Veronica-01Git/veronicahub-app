// Conversa com o agente da Express Entulho no terminal.
//
// NÃO toca no WhatsApp de ninguém: não há Meta, não há webhook, não há
// número. É só o núcleo conversacional respondendo, com a mesma guarda de
// preço que rodaria em produção.
//
//   node scripts/agente-simulador.mjs            conversa livre
//   node scripts/agente-simulador.mjs --roteiro  roteiro pronto, sem digitar
//
// Precisa de GROQ_API_KEY. O jeito mais simples é pôr a linha
//
//   GROQ_API_KEY=sua-chave
//
// num arquivo `.env.local` na raiz do projeto — o script lê sozinho, em
// qualquer sistema. Sem a chave, o agente cai no caminho offline, que também
// é um comportamento real e vale ver.

import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { registerHooks } from "node:module";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { config as carregarEnv } from "dotenv";

// Lê .env.local antes de tudo. Evita a pegadinha de sintaxe de shell —
// `export` no Linux, `$env:` no PowerShell, `set` no cmd — que faz a chave
// parecer ausente quando na verdade só foi definida do jeito errado.
carregarEnv({ path: ".env.local", quiet: true });
carregarEnv({ path: ".env", quiet: true });

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

/**
 * Sem chave, pergunta e guarda. É o único atrito real do simulador, e não
 * faz sentido empurrar para o usuário criar arquivo na mão.
 */
async function garantirChave() {
  if (process.env.GROQ_API_KEY) return true;

  // Sem terminal de verdade (pipe, CI) não dá para perguntar — segue offline.
  if (!stdin.isTTY) {
    console.log(
      `${C.fraco}Sem GROQ_API_KEY e sem terminal para perguntar — seguindo offline.${C.off}\n`,
    );
    return false;
  }

  console.log(`${C.alerta}Falta a chave da Groq para o agente pensar.${C.off}`);
  console.log(`${C.fraco}Pegue a sua, de graça, em https://console.groq.com/keys${C.off}\n`);

  const pergunta = createInterface({ input: stdin, output: stdout });
  const chave = (
    await pergunta.question("Cole a chave aqui (ou Enter para seguir sem ela): ")
  ).trim();
  pergunta.close();

  if (!chave) {
    console.log(
      `${C.fraco}Seguindo sem chave — o agente vai encaminhar tudo em vez de cotar.${C.off}\n`,
    );
    return false;
  }

  process.env.GROQ_API_KEY = chave;
  const env = new URL("../.env.local", import.meta.url);
  const atual = existsSync(env) ? readFileSync(env, "utf8").replace(/\n?$/, "\n") : "";
  if (!/^GROQ_API_KEY=/m.test(atual)) {
    writeFileSync(env, atual + `GROQ_API_KEY=${chave}\n`);
    console.log(
      `${C.fraco}Guardei em .env.local — na próxima vez não pergunto. (O arquivo é ignorado pelo git.)${C.off}\n`,
    );
  }
  return true;
}

const temChave = await garantirChave();
console.log(`${C.fraco}┌─ Express Entulho · simulador do agente`);
console.log(`│  Nenhum WhatsApp é acessado. Nada é enviado a lugar nenhum.`);
console.log(
  `│  GROQ_API_KEY: ${temChave ? "presente" : "AUSENTE — ponha GROQ_API_KEY=... no .env.local; por ora, caminho offline"}`,
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
