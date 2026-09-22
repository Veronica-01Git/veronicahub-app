// Avatar ao vivo da Veronica (Vidu S2-Avatar Realtime). Este componente só
// é montado quando o usuário pede pra "falar" com ela — o pai
// (VeronicaDrawer) controla isso e volta pro holograma/StepVideo estático
// via onEnded.
//
// O protocolo do canal de controle aqui segue a spec oficial da ShengShu
// (github.com/shengshu-ai/vidu-s-api, skills/vidu-s-api/references/
// websocket-protocol.md): envelope com `type` NUMÉRICO, conn_id gerado no
// cliente, e retry de NOT_READY no MESMO socket. A primeira versão disto
// usava `{type:"conn_init"}` com type em string e reabria a conexão a cada
// NOT_READY — as duas coisas estavam erradas. Não "simplifique" de volta.
//
// LIMITAÇÃO CONHECIDA v1: a persona é fixada na abertura da sessão (skill +
// step de quando o usuário clicou). Se o usuário mudar de passo com a
// sessão já aberta, a conversa segue com o contexto do passo antigo — só
// uma nova sessão pega o passo novo. A spec tem `prompt_operation` (tipos
// 11/12) no canal de controle, que é o candidato pra resolver isso sem
// reabrir a sessão; não implementado porque o payload não foi conferido.
//
// AINDA SEM CONFIRMAÇÃO — um item só, e está isolado no código:
// o nome do evento de stream remoto do SDK AliRTC. O CDN da Alibaba
// (g.alicdn.com) e help.aliyun.com são inalcançáveis do ambiente onde isso
// foi escrito, então não deu pra ler a assinatura real. Em vez de fixar um
// nome chutado, REMOTE_STREAM_EVENTS assina os candidatos conhecidos e liga
// o primeiro que entregar uma MediaStream. Se o vídeo não aparecer mas o
// áudio funcionar, é exatamente esse bloco o lugar de olhar.

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, PhoneOff } from "lucide-react";
import { startVeronicaLiveSession, endVeronicaLiveSession } from "@/lib/vidu-live-server";
import type { VeronicaSkillId, StudioCriativoStepId } from "@/veronica/skills";

type LiveState = "requesting-permission" | "connecting" | "live" | "ending";

// Tipos de mensagem do canal de controle do Vidu S2. São NÚMEROS, não
// strings — fonte: skills/vidu-s-api/references/websocket-protocol.md no
// repo oficial da ShengShu (github.com/shengshu-ai/vidu-s-api), linkado
// pelo README do github.com/shengshu-ai/Vidu-S.
const MSG_CONN_INIT = 1;
const MSG_CONN_INIT_ACK = 2;
const MSG_HANGUP = 5;

// O servidor responde NOT_READY enquanto o renderizador está aquecendo. A
// spec manda reenviar conn_init NO MESMO SOCKET a cada 2–3s, esperando até
// 60s no Avatar — não reabrir a conexão.
const NOT_READY_RETRY_MS = 2500;
const NOT_READY_TIMEOUT_MS = 60_000;

type ControlAck = {
  type?: number;
  payload?: { conn_init_ack?: { success?: boolean; error_code?: string } };
  success?: boolean;
  error_code?: string;
};

// Abre o canal de controle contra o relay same-origin — nunca direto no
// Vidu, a chave fica só no servidor (ver src/lib/vidu-live-relay.ts).
// Resolve quando o conn_init_ack confirma success.
function connectControlChannel(
  liveId: string,
  connId: string,
  signal: AbortSignal,
): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(new Error("Cancelado"));

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(
      `${protocol}//${window.location.host}/api/vidu/live-relay` +
        `?live_id=${encodeURIComponent(liveId)}&conn_id=${encodeURIComponent(connId)}`,
    );

    let seqId = 0;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let giveUpTimer: ReturnType<typeof setTimeout> | undefined;
    let settled = false;

    const finish = (err?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(retryTimer);
      clearTimeout(giveUpTimer);
      signal.removeEventListener("abort", onAbort);
      if (err) {
        try {
          ws.close();
        } catch {
          /* melhor esforço */
        }
        reject(err);
      } else {
        resolve(ws);
      }
    };

    function onAbort() {
      finish(new Error("Cancelado"));
    }
    signal.addEventListener("abort", onAbort);

    const sendConnInit = () => {
      seqId += 1;
      ws.send(
        JSON.stringify({
          type: MSG_CONN_INIT,
          live_id: liveId,
          conn_id: connId,
          seq_id: seqId,
          payload: { conn_init: { version: 1 } },
        }),
      );
    };

    ws.addEventListener("open", () => {
      sendConnInit();
      giveUpTimer = setTimeout(
        () => finish(new Error("A Veronica não ficou pronta em 60s. Tente de novo.")),
        NOT_READY_TIMEOUT_MS,
      );
    });

    ws.addEventListener("message", (ev) => {
      let msg: ControlAck = {};
      try {
        msg = JSON.parse(typeof ev.data === "string" ? ev.data : "{}");
      } catch {
        return;
      }
      if (msg.type !== MSG_CONN_INIT_ACK) return;

      // A spec mostra o ack dentro de payload.conn_init_ack; aceitamos
      // também no nível raiz pra não depender do aninhamento exato.
      const ack = msg.payload?.conn_init_ack ?? msg;

      if (ack.success) {
        finish();
        return;
      }
      if (ack.error_code === "NOT_READY") {
        // Mesmo socket, sem reabrir: é o que a spec pede.
        retryTimer = setTimeout(sendConnInit, NOT_READY_RETRY_MS);
        return;
      }
      finish(new Error(`Vidu recusou a sessão (${ack.error_code ?? "erro desconhecido"}).`));
    });

    ws.addEventListener("error", () => finish(new Error("Falha no canal de controle.")));
    ws.addEventListener("close", () => finish(new Error("Canal de controle fechou.")));
  });
}

// Encerra a chamada pelo canal de controle antes de derrubar o socket.
function sendHangup(ws: WebSocket, liveId: string, connId: string) {
  if (ws.readyState !== WebSocket.OPEN) return;
  try {
    ws.send(
      JSON.stringify({
        type: MSG_HANGUP,
        live_id: liveId,
        conn_id: connId,
        seq_id: Date.now(),
        payload: {},
      }),
    );
  } catch {
    /* melhor esforço — o servidor também encerra por conta do socket fechar */
  }
}

const ALI_RTC_SDK_URL = "https://g.alicdn.com/apsara-media-box/imp-web-rtc/7.1.9/aliyun-rtc-sdk.js";

// A classe do SDK web da Alibaba é `AliRtcEngine`, obtida por getInstance()
// — NÃO `new AliRTC.Client()`, que não existe. Confirmado na doc do ARTC
// Web ("import AliRtcEngine from 'aliyun-rtc-sdk'") e na skill oficial da
// ShengShu, que descreve a sequência joinChannel(rtc.token, rtc.user_id).
declare global {
  interface Window {
    AliRtcEngine?: AliRtcEngineStatic;
  }
}

type AliRtcEngineStatic = {
  getInstance: () => AliRtcEngine;
};

// ATENÇÃO — cobertura de fonte desta interface:
// - `joinChannel(token, userId)` (dois argumentos, nesta ordem) e
//   `setAudioOnlyMode(true)` vêm da skill oficial da ShengShu.
// - `getInstance`, `publishLocalAudioStream` e `leaveChannel` vêm da doc do
//   ARTC Web da Alibaba.
// - O nome do evento de stream remoto NÃO está confirmado: o CDN da
//   Alibaba e help.aliyun.com são inalcançáveis do ambiente onde isso foi
//   escrito, então não deu pra ler a assinatura real. Tratamos os
//   candidatos conhecidos em runtime (ver subscribeRemoteVideo) em vez de
//   fixar um nome chutado.
type AliRtcEngine = {
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  joinChannel: (token: string, userId: string) => Promise<void>;
  publishLocalAudioStream: (enable: boolean) => Promise<void>;
  setAudioOnlyMode?: (enable: boolean) => void;
  subscribeRemoteMediaStream?: (userId: string, audio: boolean, video: boolean) => Promise<void>;
  leaveChannel: () => Promise<void> | void;
};

function loadAliRtcSdk(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return reject(new Error("SSR"));
    if (window.AliRtcEngine) return resolve();
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

// O nome do evento de stream remoto não pôde ser confirmado contra o SDK
// real (CDN bloqueado no ambiente de escrita). Em vez de escolher um nome
// e rezar, assinamos os candidatos que aparecem na doc do ARTC e ligamos o
// primeiro que entregar uma MediaStream. Se nenhum disparar, o vídeo não
// aparece — e é ESTE bloco o primeiro lugar a olhar.
const REMOTE_STREAM_EVENTS = [
  "onRemoteTrackAvailable",
  "onRemoteTrackAvailableNotify",
  "remoteUserOnLineNotify",
  "remote-stream-added",
  "stream-added",
];

function attachRemoteVideo(engine: AliRtcEngine, video: HTMLVideoElement) {
  const bind = (...args: unknown[]) => {
    const stream = args.find(
      (a): a is MediaStream => typeof MediaStream !== "undefined" && a instanceof MediaStream,
    );
    if (!stream) return;
    video.srcObject = stream;
    void video.play().catch(() => null);
  };
  for (const event of REMOTE_STREAM_EVENTS) {
    try {
      engine.on(event, bind);
    } catch {
      /* evento inexistente neste SDK — os outros candidatos seguem valendo */
    }
  }
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
  const sessionRef = useRef<{ liveId: string; connId: string } | null>(null);
  const clientRef = useRef<AliRtcEngine | null>(null);
  const controlWsRef = useRef<WebSocket | null>(null);
  // Teto de tempo no cliente. A seção Avatar da spec não documenta
  // idle_timeout_seconds, então não mandamos o campo — e sem ele o teto
  // tem que existir aqui, porque a sessão é cobrada por segundo.
  const capTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const micStreamRef = useRef<MediaStream | null>(null);
  const endedRef = useRef(false);

  const cleanup = useCallback(async (reconcile: boolean) => {
    clearTimeout(capTimerRef.current);
    capTimerRef.current = undefined;
    try {
      await clientRef.current?.leaveChannel();
    } catch {
      /* melhor esforço — cleanup nunca deve travar a UI */
    }
    clientRef.current = null;
    try {
      const ws = controlWsRef.current;
      const session = sessionRef.current;
      // Encerra pelo canal de controle (type 5) antes de derrubar o socket:
      // o servidor para de cobrar no hangup, não no TCP caindo.
      if (ws && session) sendHangup(ws, session.liveId, session.connId);
      ws?.close();
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

        // O conn_id é gerado pelo cliente e viaja na URL do WS e dentro do
        // conn_init — é assim na spec, os dois têm que bater.
        const connId = crypto.randomUUID();
        sessionRef.current = { liveId: res.liveId, connId };

        // Canal de controle primeiro — é ele que confirma que a sessão
        // está pronta (conn_init_ack) antes de entrar na chamada de mídia.
        const controlWs = await connectControlChannel(res.liveId, connId, controller.signal);
        if (cancelled) {
          controlWs.close();
          return;
        }
        controlWsRef.current = controlWs;

        await loadAliRtcSdk();
        if (cancelled) return;
        if (!window.AliRtcEngine) throw new Error("SDK AliRTC indisponível.");

        const engine = window.AliRtcEngine.getInstance();
        clientRef.current = engine;

        if (videoRef.current) attachRemoteVideo(engine, videoRef.current);

        // Só áudio da nossa parte: nunca pedimos câmera de quem visita.
        engine.setAudioOnlyMode?.(true);

        await engine.joinChannel(res.rtc.token, res.rtc.user_id);
        await engine.publishLocalAudioStream(true);
        await engine.subscribeRemoteMediaStream?.(res.rtc.user_id, true, true);

        if (cancelled) return;

        // Teto de tempo: encerra sozinha no limite pago, já que a spec do
        // Avatar não tem idle_timeout_seconds pra delegar isso ao Vidu.
        capTimerRef.current = setTimeout(
          () => {
            void (async () => {
              await cleanup(true);
              finish("A sessão ao vivo atingiu o limite de tempo e foi encerrada.");
            })();
          },
          res.maxSessionMinutes * 60 * 1000,
        );

        setState("live");
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
