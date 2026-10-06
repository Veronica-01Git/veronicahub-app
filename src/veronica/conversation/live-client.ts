type Engine = {
  on(name: string, cb: (...args: unknown[]) => void): void;
  setChannelProfile(profile: string): Promise<void>;
  setDefaultPublishLocalAudioStream(enabled: boolean): Promise<void>;
  setDefaultPublishLocalVideoStream(enabled: boolean): Promise<void>;
  setDefaultSubscribeAllRemoteAudioStreams(enabled: boolean): Promise<void>;
  setDefaultSubscribeAllRemoteVideoStreams(enabled: boolean): Promise<void>;
  joinChannel(token: string, name: string): Promise<void>;
  publishLocalAudioStream(enabled: boolean): Promise<void>;
  setRemoteViewConfig(video: HTMLVideoElement | null, user: string, type: number): void;
  leaveChannel(): Promise<void>;
  destroy(): void;
};
type SDK = {
  getInstance(): Engine;
  isSupported(): Promise<{ support: boolean }>;
  setLogLevel(level: number): void;
};
let sdkPromise: Promise<SDK> | undefined;
export function loadLiveSdk(): Promise<SDK> {
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise<SDK>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://g.alicdn.com/apsara-media-box/imp-web-rtc/7.1.9/aliyun-rtc-sdk.js";
    script.async = true;
    const timer = setTimeout(() => {
      script.remove();
      reject(new Error("O componente de vídeo não carregou."));
    }, 15000);
    script.onload = () => {
      clearTimeout(timer);
      const sdk = (window as Window & { AliRtcEngine?: SDK }).AliRtcEngine;
      if (sdk) resolve(sdk);
      else reject(new Error("Componente de vídeo indisponível."));
    };
    script.onerror = () => {
      clearTimeout(timer);
      reject(new Error("Não foi possível carregar o vídeo."));
    };
    document.head.append(script);
  }).catch((error) => {
    sdkPromise = undefined;
    throw error;
  });
  return sdkPromise;
}
export async function connectLive(input: {
  sdk: SDK;
  ticket: string;
  rtc: { token: string; userId: string };
  video: HTMLVideoElement;
  onState: (state: string) => void;
  onText: (role: "user" | "assistant", content: string, id: string) => void;
  onVideo: (visible: boolean) => void;
}) {
  const engine = input.sdk.getInstance();
  input.sdk.setLogLevel(0);
  const socket = new WebSocket(
    `${location.protocol === "https:" ? "wss:" : "ws:"}//${location.host}/api/veronica/live?ticket=${encodeURIComponent(input.ticket)}`,
  );
  let ended = false,
    ready = false,
    retries = 0;
  let timer: ReturnType<typeof setTimeout> | undefined,
    retryTimer: ReturnType<typeof setTimeout> | undefined;
  const send = (type: number, payload = {}) => {
    if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type, payload }));
  };
  const stop = () => {
    if (ended) return;
    ended = true;
    ready = false;
    clearTimeout(timer);
    clearTimeout(retryTimer);
    send(5);
    socket.close();
    void engine
      .leaveChannel()
      .catch(() => {})
      .finally(() => engine.destroy());
    input.onVideo(false);
    input.onState("ended");
    window.removeEventListener("pagehide", stop);
  };
  window.addEventListener("pagehide", stop);
  engine.on("videoSubscribeStateChanged", (user, _old, state) => {
    if (ended) return;
    if (state === 3) {
      engine.setRemoteViewConfig(input.video, String(user), 1);
      input.onVideo(true);
      void input.video.play().catch(() => input.onState("playback"));
    }
  });
  engine.on("authInfoExpired", stop);
  engine.on("bye", stop);
  try {
    await engine.setChannelProfile("communication");
    await engine.setDefaultPublishLocalAudioStream(false);
    await engine.setDefaultPublishLocalVideoStream(false);
    await engine.setDefaultSubscribeAllRemoteAudioStreams(true);
    await engine.setDefaultSubscribeAllRemoteVideoStreams(true);
    await new Promise<void>((resolve, reject) => {
      timer = setTimeout(() => reject(new Error("O Vidu demorou para iniciar.")), 25000);
      socket.onopen = () => send(1, { conn_init: { version: 1 } });
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(String(event.data));
          if (data.type === 2) {
            if (data.payload?.conn_init_ack?.success) {
              clearTimeout(timer);
              ready = true;
              resolve();
            } else if (data.payload?.conn_init_ack?.error_code === "NOT_READY" && ++retries <= 6)
              retryTimer = setTimeout(() => send(1, { conn_init: { version: 1 } }), 1000);
            else reject(new Error("O avatar não ficou disponível. Tente mais tarde."));
          }
          if (data.type === 6) stop();
          const text = data.payload?.text_msg;
          if (
            (data.type === 9 || data.type === 10) &&
            typeof text?.content === "string" &&
            text.content.trim()
          )
            input.onText(
              data.type === 9 ? "user" : "assistant",
              text.content.slice(0, 8000),
              String(text.msg_id ?? crypto.randomUUID()),
            );
        } catch {
          /* Ignore malformed non-signaling frames. */
        }
      };
      socket.onerror = () => {
        reject(new Error("A conexão ao vivo foi interrompida."));
        stop();
      };
      socket.onclose = () => {
        reject(new Error("A sessão ao vivo terminou."));
        stop();
      };
    });
    await engine.joinChannel(input.rtc.token, input.rtc.userId);
    if (ended) throw new Error("A sessão foi encerrada.");
    timer = setTimeout(stop, 300000);
    input.onState("connected");
    return {
      stop,
      sendText: (content: string) => {
        if (!ready || ended) throw new Error("Aguarde a conexão.");
        send(99, { text_msg: { content } });
      },
      interrupt: () => send(7),
      microphone: (enabled: boolean) => engine.publishLocalAudioStream(enabled),
    };
  } catch (error) {
    stop();
    throw error;
  }
}
