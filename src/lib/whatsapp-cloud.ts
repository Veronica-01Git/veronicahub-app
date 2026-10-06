/**
 * Cliente da WhatsApp Cloud API (Meta) e verificação de assinatura.
 *
 * O agente da Express Entulho opera em NÚMERO DEDICADO. O número atual da
 * empresa não é migrado, alterado nem lido por este código — ver AGENTS.md.
 *
 * Segredos vêm só de variáveis de ambiente. Nenhum token entra em código,
 * commit, log ou resposta HTTP.
 */

const GRAPH_HOST = "graph.facebook.com";
const DEFAULT_GRAPH_VERSION = "v21.0";

/**
 * QUEM LEVA A MENSAGEM ATÉ A META.
 *
 * - `meta` (padrão): Cloud API direta, `graph.facebook.com`, Bearer token e
 *   `WHATSAPP_PHONE_NUMBER_ID` no caminho.
 * - `360dialog`: provedor oficial (BSP) que faz a ligação do Coexistence —
 *   o número atual da empresa continua no app do celular (ver
 *   docs/coexistence-express.md). Mesmo formato de mensagem da Cloud API, mas
 *   outro host, a chave vai em `D360-API-KEY` e não há id de número no
 *   caminho: a chave já é do número.
 *
 * Escolhido por `WHATSAPP_PROVEDOR`. Qualquer valor diferente de "360dialog"
 * é Meta direta — o comportamento de antes desta opção existir.
 */
export type ProvedorWhatsApp = "meta" | "360dialog";
const HOST_360DIALOG = "waba-v2.360dialog.io";

export function provedorWhatsApp(): ProvedorWhatsApp {
  return process.env.WHATSAPP_PROVEDOR?.trim().toLowerCase() === "360dialog" ? "360dialog" : "meta";
}

/**
 * A TRAVA DE ENVIO, e por que ela existe.
 *
 * Até 21/09 bastava ter `WHATSAPP_PHONE_NUMBER_ID` e `WHATSAPP_ACCESS_TOKEN`
 * no ambiente para o agente sair mandando mensagem para cliente real. Ter
 * credencial e ter AUTORIZAÇÃO são coisas diferentes, e o código não sabia
 * distinguir: um deploy com as variáveis certas já era um agente falando com
 * gente de verdade.
 *
 * Decisão do proprietário do projeto, registrada em 21/09: nada é enviado
 * antes dos testes e da aprovação do dono da Express Entulho. Enquanto essa
 * aprovação não vier, o agente é montado, testado no simulador e revisado —
 * mas não fala com ninguém.
 *
 * Então agora são DUAS chaves. As credenciais dizem "consigo enviar"; esta
 * variável diz "posso enviar". O padrão é NÃO: ausência, string vazia,
 * "true", "1" ou qualquer outro valor mantém o envio bloqueado. Só o texto
 * exato abaixo libera, e ele é feio de propósito — ninguém digita isso por
 * acidente nem copia de um tutorial.
 *
 * Isto não substitui a regra de AGENTS.md sobre o número da empresa não ser
 * migrado. São camadas diferentes: lá é qual número; aqui é se sai mensagem.
 */
const ENVIO_LIBERADO = "sim-o-dono-aprovou";

export type MotivoBloqueio = "sem-credenciais" | "envio-nao-liberado";

/** Por que o envio está bloqueado — ou `null` quando pode sair. */
function temCredenciais(): boolean {
  return provedorWhatsApp() === "360dialog"
    ? Boolean(process.env.D360_API_KEY)
    : Boolean(process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_ACCESS_TOKEN);
}

export function motivoEnvioBloqueado(): MotivoBloqueio | null {
  if (!temCredenciais()) return "sem-credenciais";
  if (process.env.WHATSAPP_ENVIO_LIBERADO !== ENVIO_LIBERADO) return "envio-nao-liberado";
  return null;
}

export const EXPLICACAO_BLOQUEIO: Record<MotivoBloqueio, string> = {
  "sem-credenciais": "WhatsApp não configurado",
  "envio-nao-liberado": "envio desarmado — aguardando aprovação do dono (WHATSAPP_ENVIO_LIBERADO)",
};

export type WhatsAppConfig = {
  /** Ausente = Meta direta (configs antigas e testes continuam válidos). */
  readonly provedor?: ProvedorWhatsApp;
  /** Vazio na 360dialog: a chave já identifica o número. */
  readonly phoneNumberId: string;
  /** Bearer token da Meta, ou a D360-API-KEY na 360dialog. */
  readonly accessToken: string;
  readonly graphVersion: string;
};

/* ---------------------------------------- endereços e autenticação, num lugar */

function eh360(config: WhatsAppConfig): boolean {
  return config.provedor === "360dialog";
}

export function urlMensagens(config: WhatsAppConfig): string {
  return eh360(config)
    ? `https://${HOST_360DIALOG}/messages`
    : `https://${GRAPH_HOST}/${config.graphVersion}/${config.phoneNumberId}/messages`;
}

export function urlUploadMidia(config: WhatsAppConfig): string {
  return eh360(config)
    ? `https://${HOST_360DIALOG}/media`
    : `https://${GRAPH_HOST}/${config.graphVersion}/${config.phoneNumberId}/media`;
}

export function urlInfoMidia(config: WhatsAppConfig, mediaId: string): string {
  const id = encodeURIComponent(mediaId);
  return eh360(config)
    ? `https://${HOST_360DIALOG}/${id}`
    : `https://${GRAPH_HOST}/${config.graphVersion}/${id}`;
}

/**
 * Onde baixar o arquivo. Na 360dialog, a url que a Meta devolve aponta para
 * `lookaside.fbsbx.com`, que não aceita a chave da 360dialog: troca-se o host
 * pelo da 360dialog (e somem as barras invertidas de escape), como manda a
 * documentação deles. Qualquer outro host é recusado — a chave não sai daqui
 * para um endereço que não conhecemos.
 */
export function urlDownloadMidia(config: WhatsAppConfig, url: string): string | null {
  if (!eh360(config)) return url;
  const limpa = url.replace(/\\/g, "");
  let alvo: URL;
  try {
    alvo = new URL(limpa);
  } catch {
    return null;
  }
  if (alvo.protocol !== "https:") return null;
  if (alvo.hostname === "lookaside.fbsbx.com") alvo.hostname = HOST_360DIALOG;
  return alvo.hostname === HOST_360DIALOG ? alvo.toString() : null;
}

export function cabecalhosAuth(config: WhatsAppConfig): Record<string, string> {
  return eh360(config)
    ? { "D360-API-KEY": config.accessToken }
    : { authorization: `Bearer ${config.accessToken}` };
}

/**
 * Config de envio. `null` quando não está configurado OU quando o envio
 * ainda não foi liberado — nunca lança.
 *
 * Os quatro caminhos que falam com a Graph (sendText, sendAudio, markAsRead,
 * uploadAudio) chamam esta função antes de qualquer fetch. Ela é o
 * estrangulamento de propósito: uma trava só, num lugar só, em vez de quatro
 * verificações que alguém esquece de repetir na quinta função.
 *
 * `downloadMedia` recebe a config de fora e por isso cai na mesma trava pelo
 * chamador.
 */
export function getWhatsAppConfig(): WhatsAppConfig | null {
  if (motivoEnvioBloqueado() !== null) return null;
  if (provedorWhatsApp() === "360dialog") {
    const chave = process.env.D360_API_KEY;
    if (!chave) return null;
    return { provedor: "360dialog", phoneNumberId: "", accessToken: chave, graphVersion: "" };
  }
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!phoneNumberId || !accessToken) return null;
  return {
    phoneNumberId,
    accessToken,
    graphVersion: process.env.WHATSAPP_GRAPH_VERSION ?? DEFAULT_GRAPH_VERSION,
  };
}

function hexToBytes(hex: string): Uint8Array | null {
  if (hex.length % 2 !== 0 || !/^[0-9a-f]+$/i.test(hex)) return null;
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i += 1) {
    out[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

/**
 * Confere o cabeçalho `X-Hub-Signature-256` contra o corpo CRU.
 *
 * Duas coisas que precisam continuar verdadeiras aqui:
 *
 * 1. O corpo tem que ser exatamente os bytes recebidos. Reserializar o JSON
 *    (JSON.stringify de um objeto já parseado) muda espaços e ordem e a
 *    assinatura passa a nunca bater.
 * 2. A comparação é feita por `crypto.subtle.verify`, que é de tempo
 *    constante. Comparar strings com `===` vazaria, por tempo de resposta,
 *    quantos bytes da assinatura forjada estavam certos.
 */
export async function verifyWebhookSignature(
  rawBody: string,
  header: string | null,
  appSecret: string,
): Promise<boolean> {
  if (!header) return false;
  const [algo, assinatura] = header.split("=");
  if (algo !== "sha256" || !assinatura) return false;

  const bytes = hexToBytes(assinatura);
  if (!bytes || bytes.length !== 32) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(appSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );

  return crypto.subtle.verify(
    "HMAC",
    key,
    bytes as unknown as ArrayBuffer,
    new TextEncoder().encode(rawBody),
  );
}

/**
 * Webhook da 360dialog: ela NÃO assina o corpo como a Meta faz. O que ela
 * permite é mandar cabeçalhos nossos em todo aviso (`POST /v1/configs/webhook`
 * com `headers`). Então a prova de origem é um segredo só nosso, configurado
 * lá e aqui (`WHATSAPP_WEBHOOK_TOKEN`), conferido neste cabeçalho.
 */
export const CABECALHO_TOKEN_WEBHOOK = "x-veronica-webhook-token";

/** Abaixo disto o segredo é adivinhável; o webhook recusa a configuração. */
export const TAMANHO_MINIMO_TOKEN_WEBHOOK = 32;

/**
 * Compara em tempo constante. Os dois lados passam por SHA-256 antes: assim o
 * tempo não depende de quantos caracteres batem NEM do tamanho do segredo.
 */
export async function verificarTokenWebhook(
  recebido: string | null,
  esperado: string,
): Promise<boolean> {
  if (!recebido || esperado.length < TAMANHO_MINIMO_TOKEN_WEBHOOK) return false;
  const enc = new TextEncoder();
  const [a, b] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(recebido)),
    crypto.subtle.digest("SHA-256", enc.encode(esperado)),
  ]);
  const x = new Uint8Array(a);
  const y = new Uint8Array(b);
  let diferenca = 0;
  for (let i = 0; i < x.length; i++) diferenca |= x[i] ^ y[i];
  return diferenca === 0;
}

export type EnvioResultado =
  | { readonly ok: true; readonly providerId: string }
  | { readonly ok: false; readonly erro: string };

/** Envia texto simples. Só funciona dentro da janela de 24 h da Meta. */
export async function sendText(to: string, body: string): Promise<EnvioResultado> {
  const config = getWhatsAppConfig();
  if (!config) {
    // Diz QUAL das duas causas é: sem credencial e desarmado se consertam de
    // formas opostas, e um painel que mostra a frase errada manda a pessoa
    // procurar token quando o que falta é a aprovação do dono.
    const motivo = motivoEnvioBloqueado();
    return { ok: false, erro: EXPLICACAO_BLOQUEIO[motivo ?? "sem-credenciais"] };
  }

  const resposta = await fetch(urlMensagens(config), {
    method: "POST",
    headers: {
      ...cabecalhosAuth(config),
      "content-type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: { preview_url: false, body },
    }),
  });

  const texto = await resposta.text();
  if (!resposta.ok) {
    // Nunca ecoar o corpo inteiro: pode trazer eco de token em erro de auth.
    return { ok: false, erro: `Graph respondeu ${resposta.status}` };
  }

  try {
    const json = JSON.parse(texto) as { messages?: { id?: string }[] };
    const providerId = json.messages?.[0]?.id;
    return providerId ? { ok: true, providerId } : { ok: false, erro: "Graph não devolveu id" };
  } catch {
    return { ok: false, erro: "Graph devolveu corpo inválido" };
  }
}

/** Marca como lida — os dois tiques azuis. Falha aqui nunca derruba o fluxo. */
export async function markAsRead(providerId: string): Promise<void> {
  const config = getWhatsAppConfig();
  if (!config) return;
  try {
    await fetch(urlMensagens(config), {
      method: "POST",
      headers: {
        ...cabecalhosAuth(config),
        "content-type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        status: "read",
        message_id: providerId,
      }),
    });
  } catch (error) {
    console.error("Falha ao marcar mensagem como lida:", error);
  }
}

/** Janela de 24 h da Meta: fora dela, só modelo aprovado. */
export function janela24hAberta(lastInboundAt: Date | null): boolean {
  if (!lastInboundAt) return false;
  return Date.now() - lastInboundAt.getTime() < 24 * 60 * 60 * 1000;
}

/* ------------------------------------------------------------------ áudio */

/**
 * Sobe um áudio para a Meta e devolve o id da mídia.
 *
 * DOIS PASSOS, NÃO UM. A Cloud API não aceita o arquivo junto com a
 * mensagem: primeiro o binário vai para /media e volta um id, depois esse id
 * é que viaja na mensagem. O id vale ~30 dias e é reutilizável — mas aqui
 * cada resposta gera um áudio novo, então não há o que cachear.
 *
 * O CORPO É MULTIPART, e o campo `type` precisa repetir o mime do arquivo.
 * Mandar `audio/ogg` sem o `codecs=opus` no BLOB faz a Meta aceitar o upload
 * e entregar como anexo de arquivo em vez de nota de voz — falha silenciosa,
 * que é a pior espécie: ninguém vê erro, só o cliente recebe um documento
 * esquisito no lugar de um áudio.
 */
export async function uploadAudio(
  bytes: Uint8Array,
  mimeType: string,
): Promise<{ ok: true; mediaId: string } | { ok: false; erro: string }> {
  const config = getWhatsAppConfig();
  if (!config) {
    const motivo = motivoEnvioBloqueado();
    return { ok: false, erro: EXPLICACAO_BLOQUEIO[motivo ?? "sem-credenciais"] };
  }

  const form = new FormData();
  form.append("messaging_product", "whatsapp");
  form.append("type", mimeType);
  form.append(
    "file",
    new Blob([bytes as unknown as ArrayBuffer], { type: `${mimeType}; codecs=opus` }),
    "resposta.ogg",
  );

  try {
    const resposta = await fetch(urlUploadMidia(config), {
      method: "POST",
      // Sem content-type à mão: o fetch precisa inserir o boundary do
      // multipart sozinho, e defini-lo aqui quebraria o corpo.
      headers: cabecalhosAuth(config),
      body: form,
    });

    if (!resposta.ok) return { ok: false, erro: `Graph respondeu ${resposta.status} no upload` };

    const json = (await resposta.json()) as { id?: string };
    return json.id
      ? { ok: true, mediaId: json.id }
      : { ok: false, erro: "Graph não devolveu id de mídia" };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { ok: false, erro: `falha no upload de áudio: ${msg.slice(0, 120)}` };
  }
}

/** Envia o áudio já subido. Mesma janela de 24 h que vale para texto. */
export async function sendAudio(to: string, mediaId: string): Promise<EnvioResultado> {
  const config = getWhatsAppConfig();
  if (!config) {
    const motivo = motivoEnvioBloqueado();
    return { ok: false, erro: EXPLICACAO_BLOQUEIO[motivo ?? "sem-credenciais"] };
  }

  const resposta = await fetch(urlMensagens(config), {
    method: "POST",
    headers: {
      ...cabecalhosAuth(config),
      "content-type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "audio",
      audio: { id: mediaId },
    }),
  });

  const texto = await resposta.text();
  if (!resposta.ok) return { ok: false, erro: `Graph respondeu ${resposta.status}` };

  try {
    const json = JSON.parse(texto) as { messages?: { id?: string }[] };
    const providerId = json.messages?.[0]?.id;
    return providerId ? { ok: true, providerId } : { ok: false, erro: "Graph não devolveu id" };
  } catch {
    return { ok: false, erro: "Graph devolveu corpo inválido" };
  }
}

/**
 * Baixa uma mídia recebida. DOIS PASSOS, e o segundo é onde se erra.
 *
 * O webhook da Meta nunca traz o binário — traz um id. Com o id, `GET /{id}`
 * devolve um JSON com uma `url` temporária. Essa url **exige o mesmo
 * Bearer token** para ser baixada; buscá-la sem o cabeçalho devolve 401, e é
 * o engano clássico de quem vê "url" e assume link público.
 */
export async function downloadMedia(
  mediaId: string,
): Promise<{ ok: true; bytes: Uint8Array; mimeType: string } | { ok: false; erro: string }> {
  const config = getWhatsAppConfig();
  if (!config) {
    const motivo = motivoEnvioBloqueado();
    return { ok: false, erro: EXPLICACAO_BLOQUEIO[motivo ?? "sem-credenciais"] };
  }

  try {
    const meta = await fetch(urlInfoMidia(config, mediaId), {
      headers: cabecalhosAuth(config),
    });
    if (!meta.ok) return { ok: false, erro: `Graph respondeu ${meta.status} ao localizar a mídia` };

    const info = (await meta.json()) as { url?: string; mime_type?: string };
    if (!info.url) return { ok: false, erro: "Graph não devolveu url da mídia" };

    const destino = urlDownloadMidia(config, info.url);
    if (!destino) return { ok: false, erro: "url de mídia com host inesperado — recusada" };

    const arquivo = await fetch(destino, {
      headers: cabecalhosAuth(config),
    });
    if (!arquivo.ok) return { ok: false, erro: `Download da mídia respondeu ${arquivo.status}` };

    return {
      ok: true,
      bytes: new Uint8Array(await arquivo.arrayBuffer()),
      mimeType: info.mime_type ?? "audio/ogg",
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { ok: false, erro: `falha ao baixar mídia: ${msg.slice(0, 120)}` };
  }
}
