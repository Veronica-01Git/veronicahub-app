// Proxy do canal de controle (WebSocket) da sessão ao vivo da Veronica.
//
// Por que existe: a doc do Vidu exige `Authorization: Token vda_xxx` no
// handshake do WS (`wss://{host}/live/ws/live/connect?live_id=...`), e
// browser não manda header customizado ao abrir um WebSocket — e mesmo que
// mandasse, a chave nunca pode chegar no cliente. Confirmado contra a
// implementação de referência do próprio Vidu (github.com/lideang821/
// vidu-s1-api): o serviço deles também é um proxy — "creates sessions and
// proxies HTTP requests and the control WebSocket, keeping your API key on
// the server." Este arquivo é o equivalente aqui: o navegador conecta
// nesta rota (mesma origem, sem chave nenhuma), e este handler conecta no
// Vidu de verdade, carregando a chave.
//
// AINDA NÃO TESTADO contra o deploy real: usa WebSocketPair, que é uma API
// de runtime do Cloudflare Workers (não existe no lib DOM padrão do TS —
// por isso os `declare global` abaixo, escopados só a este arquivo, em vez
// de trazer @cloudflare/workers-types pro projeto inteiro e arriscar
// colisão com os tipos DOM usados no resto do app client-side). O app já
// roda como fetch(request, env, ctx) de Worker (ver src/server.ts), então
// isso deveria funcionar — mas só o deploy de verdade confirma.

declare global {
  interface WebSocket {
    accept(): void;
  }
  interface ResponseInit {
    webSocket?: WebSocket | null;
  }
  interface Response {
    readonly webSocket: WebSocket | null;
  }

  var WebSocketPair: {
    new (): { 0: WebSocket; 1: WebSocket };
  };
}

const VIDU_ENVIRONMENT = process.env.VIDU_ENVIRONMENT === "china" ? "china" : "global";
const VIDU_HOST = VIDU_ENVIRONMENT === "china" ? "api.vidu.cn" : "api.vidu.com";

export async function handleViduLiveRelay(request: Request): Promise<Response> {
  if (request.headers.get("upgrade")?.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket upgrade", { status: 426 });
  }

  const apiKey = process.env.VIDU_API_KEY;
  if (!apiKey) {
    return new Response("Avatar ao vivo indisponível.", { status: 503 });
  }

  const liveId = new URL(request.url).searchParams.get("live_id");
  if (!liveId) {
    return new Response("live_id obrigatório", { status: 400 });
  }

  let upstreamSocket: WebSocket;
  try {
    // https://, nunca wss://. O fetch() do Workers faz o handshake de
    // WebSocket por uma requisição HTTP com `Upgrade: websocket`, e desde a
    // compat date 2021-11-10 (fetch_refuses_unknown_protocols) ele REJEITA
    // esquema ws:/wss: — com `wss://` aqui o relay nunca chegaria a conectar.
    // Doc: developers.cloudflare.com/workers/configuration/compatibility-flags
    // ("you should still use http: or https: as the protocol, not ws: nor wss:").
    const upstream = await fetch(
      `https://${VIDU_HOST}/live/ws/live/connect?live_id=${encodeURIComponent(liveId)}`,
      { headers: { Authorization: `Token ${apiKey}`, Upgrade: "websocket" } },
    );
    if (!upstream.webSocket) {
      throw new Error(`Vidu não retornou upgrade (status ${upstream.status})`);
    }
    upstreamSocket = upstream.webSocket;
    upstreamSocket.accept();
  } catch (error) {
    console.error("Erro ao conectar no canal de controle do Vidu:", error);
    return new Response("Falha ao conectar no Vidu.", { status: 502 });
  }

  const pair = new WebSocketPair();
  const client = pair[0];
  const server = pair[1];
  server.accept();

  const closeBoth = () => {
    try {
      server.close();
    } catch {
      /* melhor esforço — cleanup de socket nunca deve lançar pro chamador */
    }
    try {
      upstreamSocket.close();
    } catch {
      /* idem */
    }
  };

  server.addEventListener("message", (ev: MessageEvent) => {
    if (upstreamSocket.readyState === WebSocket.OPEN) upstreamSocket.send(ev.data);
  });
  upstreamSocket.addEventListener("message", (ev: MessageEvent) => {
    if (server.readyState === WebSocket.OPEN) server.send(ev.data);
  });
  server.addEventListener("close", closeBoth);
  upstreamSocket.addEventListener("close", closeBoth);
  server.addEventListener("error", closeBoth);
  upstreamSocket.addEventListener("error", closeBoth);

  return new Response(null, { status: 101, webSocket: client });
}
