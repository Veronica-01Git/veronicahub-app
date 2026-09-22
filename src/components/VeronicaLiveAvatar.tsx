// Avatar ao vivo da Veronica (Vidu S2 Realtime). Este componente só é
// montado quando o usuário pede pra "falar" com ela — o pai (VeronicaDrawer)
// controla isso e volta pro holograma/StepVideo estático via onEnded.
//
// LIMITAÇÃO CONHECIDA v1: a persona é fixada na abertura da sessão (skill +
// step de quando o usuário clicou em "Falar com a Veronica"). Se o usuário
// mudar de passo dentro do Studio Criativo com a sessão já aberta, a
// conversa ao vivo continua com o contexto do passo antigo — só uma nova
// sessão pega o passo novo. Dá pra resolver via memory_retrieval/
// knowledge_retrieval em sessão aberta, mas isso depende de confirmar o
// suporte exato na API antes de implementar.
//
// PENDENTE ANTES DE SHIPPAR (dois itens, nenhum inventado sem aviso):
//
// 1. As chamadas ao SDK AliRTC abaixo (joinChannel/publishLocalAudioStream/
//    evento de stream remoto) seguem a descrição de alto nível da doc do
//    Vidu, não a referência exata do SDK da Alibaba. Conferir nomes de
//    classe/método reais contra
//    https://g.alicdn.com/apsara-media-box/imp-web-rtc/7.1.9/aliyun-rtc-sdk.js
//    (ou o quickstart.py de referência) antes de considerar isso pronto.
//
// 2. O handshake do canal de controle (conn_init -> conn_init_ack, retry em
//    NOT_READY) usa os nomes de mensagem citados na doc oficial do Vidu,
//    mas o formato exato do payload JSON de conn_init não veio detalhado
//    nela — o que está abaixo é a melhor leitura possível da doc, não algo
//    testado contra o servidor de verdade. Se o Vidu rejeitar a mensagem,
//    é o primeiro lugar a olhar.

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, PhoneOff } from "lucide-react";
import { startVeronicaLiveSession, endVeronicaLiveSession } from "@/lib/vidu-live-server";
import type { VeronicaSkillId, StudioCriativoStepId } from "@/veronica/skills";

type LiveState = "requesting-permission" | "connecting" | "live" | "ending";

// Abre (ou reabre, em caso de NOT_READY) o canal de controle contra o
// relay same-origin — nunca direto no Vidu, a chave fica só no servidor
// (ver src/lib/vidu-live-relay.ts). Resolve quando conn_init_ack confirma
// success=true.
function connectControlChannel(liveId: string, signal: AbortSignal): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(new Error("Cancelado"));

    const attempt = (retriesLeft: number) => {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const ws = new WebSocket(
        `${protocol}//${window.location.host}/api/vidu/live-relay?live_id=${encodeURIComponent(liveId)}`,
      );

      const onAbort = () => ws.close();
      signal.addEventListener("abort", onAbort);

      ws.addEventListener("open", () => {
        ws.send(JSON.stringify({ type: "conn_init" }));
      });

      ws.addEventListener("message", (ev) => {
        let payload: { type?: string; success?: boolean } = {};
        try {
          payload = JSON.parse(typeof ev.data === "string" ? ev.data : "{}");
        } catch {
          return;
        }

        if (payload.type === "conn_init_ack" && payload.success) {
          signal.removeEventListener("abort", onAbort);
          resolve(ws);
          return;
        }

        if (payload.type === "NOT_READY") {
          ws.close();
          if (retriesLeft <= 0 || signal.aborted) {
            signal.removeEventListener("abort", onAbort);
            reject(new Error("Canal de controle indisponível (NOT_READY)."));
            return;
          }
          setTimeout(() => attempt(retriesLeft - 1), 2500);
        }
      });

      ws.addEventListener("error", () => {
        signal.removeEventListener("abort", onAbort);
        reject(new Error("Falha no canal de controle do avatar ao vivo."));
      });
    };

    attempt(3);
  });
}

const ALI_RTC_SDK_URL = "https://g.alicdn.com/apsara-media-box/imp-web-rtc/7.1.9/aliyun-rtc-sdk.js";

declare global {
  interface Window {
    AliRTC?: { Client: new () => AliRtcClient };
  }
}

type AliRtcClient = {
  on: (event: string, handler: (stream: MediaStream) => void) => void;
  joinChannel: (token: string, channelId: string, userId: string) => Promise<void>;
  publishLocalAudioStream: (stream: MediaStream) => Promise<void>;
  leaveChannel: () => void;
};

function loadAliRtcSdk(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return reject(new Error("SSR"));
    if (window.AliRTC) return resolve();
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${ALI_RTC_SDK_URL}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Falha ao carregar SDK AliRTC")));
      return;
    }
    const script = document.createElement("script");
    script.src = ALI_RTC_SDK_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Falha ao carregar SDK AliRTC"));
    document.head.appendChild(script);
  });
}

export function VeronicaLiveAvatar({
  skillId,
  stepId,
  onEnded,
}: {
  skillId: VeronicaSkillId;
  stepId: StudioCriativoStepId | null;
  onEnded: (notice: string | null) => void;
}) {
  const [state, setState] = useState<LiveState>("requesting-permission");
  const videoRef = useRef<HTMLVideoElement>(null);
  // Só a liveId: quanto foi segurado é decidido e lido no servidor (ver
  // vidu-live-server.ts) — o valor do estorno nunca sai do navegador.
  const sessionRef = useRef<{ liveId: string } | null>(null);
  const clientRef = useRef<AliRtcClient | null>(null);
  const controlWsRef = useRef<WebSocket | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const endedRef = useRef(false);

  const cleanup = useCallback(async (reconcile: boolean) => {
    try {
      clientRef.current?.leaveChannel();
    } catch {
      /* melhor esforço — cleanup nunca deve travar a UI */
    }
    clientRef.current = null;
    try {
      controlWsRef.current?.close();
    } catch {
      /* idem */
    }
    controlWsRef.current = null;
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    micStreamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;

    // Zera a ref ANTES do await: desligar a chamada dispara onEnded, o pai
    // desmonta o componente e o cleanup do efeito roda um segundo cleanup
    // enquanto este ainda está no await. Sem zerar aqui, os dois veriam a
    // mesma sessão e mandariam duas reconciliações (o servidor também é
    // idempotente, mas não vale gastar a chamada).
    const session = reconcile ? sessionRef.current : null;
    sessionRef.current = null;

    if (session) {
      await endVeronicaLiveSession({ data: { liveId: session.liveId } }).catch(() => null);
    }
  }, []);

  const finish = useCallback(
    (notice: string | null) => {
      if (endedRef.current) return;
      endedRef.current = true;
      onEnded(notice);
    },
    [onEnded],
  );

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function goLive() {
      try {
        const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) {
          mic.getTracks().forEach((t) => t.stop());
          return;
        }
        micStreamRef.current = mic;

        setState("connecting");
        const res = await startVeronicaLiveSession({ data: { skillId, stepId } });
        if (cancelled) return;

        if (!res.ok) {
          const notice =
            res.error === "login_required"
              ? "Faça login pra falar com a Veronica ao vivo."
              : res.error === "insufficient_funds"
                ? "Saldo insuficiente pra uma sessão ao vivo — recarregue pra continuar."
                : null;
          await cleanup(false);
          finish(notice);
          return;
        }

        sessionRef.current = { liveId: res.liveId };

        // Canal de controle primeiro — é ele que confirma que a sessão
        // está pronta antes de entrar na chamada de mídia.
        const controlWs = await connectControlChannel(res.liveId, controller.signal);
        if (cancelled) {
          controlWs.close();
          return;
        }
        controlWsRef.current = controlWs;

        await loadAliRtcSdk();
        if (cancelled || !window.AliRTC) throw new Error("SDK AliRTC indisponível.");

        const client = new window.AliRTC.Client();
        clientRef.current = client;

        client.on("remote-stream-added", (stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            void videoRef.current.play().catch(() => null);
          }
        });

        await client.joinChannel(res.rtc.token, res.rtc.channel_id, res.rtc.user_id);
        await client.publishLocalAudioStream(mic);

        if (!cancelled) setState("live");
      } catch (error) {
        if (cancelled) return;
        const notice =
          error instanceof Error && error.name === "NotAllowedError"
            ? "Sem acesso ao microfone — dá pra continuar por texto."
            : null;
        await cleanup(true);
        finish(notice);
      }
    }

    void goLive();

    return () => {
      cancelled = true;
      controller.abort();
      // Sessão é cobrada por segundo — nunca deixar aberta ao desmontar
      // (fechar o drawer, trocar de passo, navegar pra outra página).
      void cleanup(true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function hangUp() {
    setState("ending");
    await cleanup(true);
    finish(null);
  }

  if (state === "requesting-permission" || state === "connecting") {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-black text-center">
        <Loader2 className="h-5 w-5 animate-spin text-neon-green" />
        <span className="font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground">
          {state === "requesting-permission"
            ? "Pedindo acesso ao microfone…"
            : "Conectando com a Veronica…"}
        </span>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full bg-black">
      <video ref={videoRef} autoPlay playsInline className="h-full w-full object-cover" />
      <button
        type="button"
        onClick={hangUp}
        disabled={state === "ending"}
        aria-label="Encerrar chamada"
        className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full border border-destructive/50 bg-black/60 text-destructive transition hover:border-destructive disabled:opacity-50"
      >
        <PhoneOff className="h-3.5 w-3.5" />
      </button>
      <span className="absolute bottom-2 left-3 flex items-center gap-1.5 font-mono-tech text-[9.5px] uppercase tracking-widest text-white/70">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
        Ao vivo
      </span>
    </div>
  );
}
