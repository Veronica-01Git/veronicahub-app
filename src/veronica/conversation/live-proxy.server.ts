import { getRuntimeSecret } from "../../lib/runtime-secret.server.ts";
import { verifyLiveTicket } from "./ticket.server.ts";
type WorkerSocket = {
  accept(): void;
  send(data: string): void;
  close(code?: number, reason?: string): void;
  addEventListener(type: string, handler: (event: { data?: unknown }) => void): void;
};
export async function handleVeronicaLiveSocket(request: Request): Promise<Response> {
  const url = new URL(request.url);
  if (request.method !== "GET" || request.headers.get("upgrade")?.toLowerCase() !== "websocket")
    return new Response("WebSocket required", { status: 426 });
  if (request.headers.get("origin") !== url.origin)
    return new Response("Forbidden", { status: 403 });
  const secret = await getRuntimeSecret("VIDU_SESSION_SECRET"),
    apiKey = await getRuntimeSecret("VIDU_API_KEY");
  if (!secret || !apiKey || (await getRuntimeSecret("VIDU_LIVE_ENABLED")) !== "true")
    return new Response("Unavailable", { status: 503 });
  const liveId = await verifyLiveTicket(url.searchParams.get("ticket") ?? "", secret);
  if (!liveId) return new Response("Forbidden", { status: 403 });
  const Pair = (
    globalThis as unknown as { WebSocketPair?: new () => { 0: WorkerSocket; 1: WorkerSocket } }
  ).WebSocketPair;
  if (!Pair) return new Response("Live requires Worker runtime", { status: 503 });
  try {
    const connId = crypto.randomUUID();
    const upstreamResponse = await fetch(
      // Official quick start authenticates the App WebSocket with an `authorization` query
      // parameter; the header is kept as well. This URL never leaves the Worker.
      `https://api.vidu.com/live/ws/live/connect?live_id=${liveId}&conn_id=${connId}&authorization=${encodeURIComponent(apiKey)}`,
      { headers: { Upgrade: "websocket", Authorization: `Token ${apiKey}` }, redirect: "manual" },
    );
    const upstream = (upstreamResponse as Response & { webSocket?: WorkerSocket }).webSocket;
    if (!upstream) return new Response("Live connection failed", { status: 502 });
    const pair = new Pair(),
      browser = pair[1];
    browser.accept();
    upstream.accept();
    let seq = 1,
      ended = false;
    const end = () => {
      if (ended) return;
      ended = true;
      clearTimeout(deadline);
      try {
        upstream.send(
          JSON.stringify({
            type: 5,
            live_id: liveId,
            conn_id: connId,
            seq_id: ++seq,
            payload: { hangup: { hangup_reason: "user_end" } },
          }),
        );
      } catch {
        /* already closed */
      }
      try {
        upstream.close(1000);
      } catch {
        /* already closed */
      }
      try {
        browser.close(1000);
      } catch {
        /* already closed */
      }
    };
    const deadline = setTimeout(end, 300_000);
    let count = 0,
      windowStart = Date.now();
    browser.addEventListener("message", (event) => {
      if (ended) return;
      if (Date.now() - windowStart > 60_000) {
        windowStart = Date.now();
        count = 0;
      }
      if (++count > 40 || typeof event.data !== "string" || event.data.length > 5000) {
        end();
        return;
      }
      try {
        const signal = JSON.parse(event.data);
        if (![1, 5, 7, 99].includes(signal.type)) {
          end();
          return;
        }
        const payload =
          signal.type === 1
            ? { conn_init: { version: 1 } }
            : signal.type === 5
              ? { hangup: { hangup_reason: "user_end" } }
              : signal.type === 7
                ? {}
                : {
                    text_msg: {
                      msg_id: crypto.randomUUID(),
                      content: String(signal.payload?.text_msg?.content ?? "").slice(0, 1600),
                      timestamp: Date.now(),
                    },
                  };
        upstream.send(
          JSON.stringify({
            type: signal.type,
            live_id: liveId,
            conn_id: connId,
            seq_id: ++seq,
            payload,
          }),
        );
        if (signal.type === 5) end();
      } catch {
        end();
      }
    });
    upstream.addEventListener("message", (event) => {
      if (!ended && typeof event.data === "string" && event.data.length <= 16000) {
        try {
          browser.send(event.data);
        } catch {
          end();
        }
      }
    });
    for (const socket of [browser, upstream]) {
      socket.addEventListener("close", end);
      socket.addEventListener("error", end);
    }
    return new Response(null, { status: 101, webSocket: pair[0] } as ResponseInit);
  } catch {
    return new Response("Live connection failed", { status: 502 });
  }
}
