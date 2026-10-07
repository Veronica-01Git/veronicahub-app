#!/usr/bin/env node
/**
 * Confere e registra o webhook do número na 360dialog — passo 3 de
 * docs/coexistence-express.md.
 *
 *   node scripts/webhook-360dialog.mjs            # só confere (padrão)
 *   node scripts/webhook-360dialog.mjs --aplicar  # registra a URL + cabeçalho
 *
 * Lê D360_API_KEY e WHATSAPP_WEBHOOK_TOKEN do ambiente. NUNCA imprime nenhum
 * dos dois: a saída mostra só a URL e se o cabeçalho secreto está presente.
 *
 * Não envia mensagem, não lê conversa e não mexe no número: só diz à
 * 360dialog para onde mandar os avisos e com qual segredo.
 */

const HOST = "https://waba-v2.360dialog.io";
const URL_WEBHOOK = process.env.WEBHOOK_URL ?? "https://veronicahub.com/api/whatsapp/webhook";
const CABECALHO = "x-veronica-webhook-token";
const MINIMO = 32;

const aplicar = process.argv.includes("--aplicar");
const chave = process.env.D360_API_KEY ?? "";
const segredo = process.env.WHATSAPP_WEBHOOK_TOKEN ?? "";

function sair(msg) {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

if (!chave) sair("D360_API_KEY não está no ambiente.");
if (segredo.length < MINIMO) {
  sair(
    `WHATSAPP_WEBHOOK_TOKEN ausente ou com menos de ${MINIMO} caracteres (gere: openssl rand -hex 32).`,
  );
}
if (!URL_WEBHOOK.startsWith("https://")) sair("A URL do webhook precisa ser HTTPS.");

const cabecalhos = { "D360-API-KEY": chave, "content-type": "application/json" };

async function conferir() {
  const r = await fetch(`${HOST}/v1/configs/webhook`, { headers: cabecalhos });
  if (r.status === 401 || r.status === 403) sair(`a 360dialog recusou a chave (${r.status}).`);
  if (!r.ok) sair(`a 360dialog respondeu ${r.status} ao consultar o webhook.`);
  const atual = await r.json().catch(() => ({}));
  const nomes = Object.keys(atual.headers ?? {}).map((h) => h.toLowerCase());
  console.log(`Webhook atual: ${atual.url ?? "(nenhum)"}`);
  console.log(`Cabeçalho secreto presente: ${nomes.includes(CABECALHO) ? "sim" : "não"}`);
  return atual;
}

const atual = await conferir();
const certo =
  atual.url === URL_WEBHOOK &&
  Object.keys(atual.headers ?? {}).some((h) => h.toLowerCase() === CABECALHO);

if (!aplicar) {
  console.log(
    certo
      ? "✓ Já está configurado. Nada a fazer."
      : `→ Para registrar ${URL_WEBHOOK} com o cabeçalho secreto, rode de novo com --aplicar.`,
  );
  process.exit(0);
}

const r = await fetch(`${HOST}/v1/configs/webhook`, {
  method: "POST",
  headers: cabecalhos,
  body: JSON.stringify({ url: URL_WEBHOOK, headers: { [CABECALHO]: segredo } }),
});
if (!r.ok) sair(`a 360dialog respondeu ${r.status} ao registrar o webhook.`);
console.log("✓ Registrado. Conferindo de novo:");
await conferir();
