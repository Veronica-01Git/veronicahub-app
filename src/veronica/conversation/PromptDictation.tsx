import { useEffect, useRef, useState } from "react";
import { Check, Loader2, Mic, Square, X } from "lucide-react";
import { transcribePrompt } from "./functions";
import { MAX_AUDIO_BYTES, MAX_AUDIO_SECONDS } from "./dictation-core";

type Props = {
  disabled: boolean;
  onBusyChange: (busy: boolean) => void;
  onTranscript: (text: string) => boolean;
  onError: (error: string) => void;
};
type Phase = "idle" | "permission" | "recording" | "preview" | "transcribing";
export function PromptDictation({ disabled, onBusyChange, onTranscript, onError }: Props) {
  const [phase, setPhase] = useState<Phase>("idle"),
    [seconds, setSeconds] = useState(0),
    [recording, setRecording] = useState<Blob | null>(null),
    [url, setUrl] = useState("");
  const session = useRef(0),
    recorder = useRef<MediaRecorder | null>(null),
    stream = useRef<MediaStream | null>(null),
    timer = useRef<ReturnType<typeof setInterval> | null>(null),
    duration = useRef(0),
    mounted = useRef(true);
  const release = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
  };
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      // Invalidate async permission and transcription callbacks, not a DOM ref.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      session.current++;
      const r = recorder.current;
      if (r && r.state !== "inactive") r.stop();
      release();
    };
  }, []);
  useEffect(() => {
    onBusyChange(phase !== "idle");
  }, [phase, onBusyChange]);
  useEffect(() => {
    if (!recording) return;
    const u = URL.createObjectURL(recording);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [recording]);
  const cancel = () => {
    session.current++;
    if (recorder.current?.state === "recording") recorder.current.stop();
    release();
    setRecording(null);
    setUrl("");
    setPhase("idle");
    setSeconds(0);
  };
  const finish = () => {
    if (recorder.current?.state === "recording") recorder.current.stop();
    release();
  };
  async function start() {
    if (disabled || phase !== "idle") return;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      onError("Este navegador não permite gravar áudio. Use Chrome, Edge ou Safari atualizado.");
      return;
    }
    const attempt = ++session.current;
    onError("");
    setPhase("permission");
    duration.current = 0;
    setSeconds(0);
    window.speechSynthesis?.cancel();
    try {
      const media = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      if (!mounted.current || session.current !== attempt) {
        media.getTracks().forEach((t) => t.stop());
        return;
      }
      stream.current = media;
      const mimeType = ["audio/webm;codecs=opus", "audio/mp4", "audio/ogg;codecs=opus"].find((t) =>
        MediaRecorder.isTypeSupported(t),
      );
      const r = new MediaRecorder(media, {
        ...(mimeType ? { mimeType } : {}),
        audioBitsPerSecond: 64000,
      });
      recorder.current = r;
      const chunks: Blob[] = [];
      let bytes = 0;
      r.ondataavailable = (e) => {
        if (e.data.size) {
          chunks.push(e.data);
          bytes += e.data.size;
          if (bytes > MAX_AUDIO_BYTES && r.state === "recording") r.stop();
        }
      };
      r.onerror = () => {
        if (session.current === attempt) {
          cancel();
          onError("A gravação foi interrompida. Tente novamente.");
        }
      };
      r.onstop = () => {
        if (!mounted.current || session.current !== attempt) return;
        release();
        if (!chunks.length || duration.current < 1 || bytes > MAX_AUDIO_BYTES) {
          setPhase("idle");
          onError("Grave entre 1 segundo e 2 minutos, até 4 MB.");
          return;
        }
        setRecording(new Blob(chunks, { type: r.mimeType || mimeType || "audio/webm" }));
        setPhase("preview");
      };
      r.start(250);
      setPhase("recording");
      const started = Date.now();
      timer.current = setInterval(() => {
        duration.current = Math.min(MAX_AUDIO_SECONDS, Math.floor((Date.now() - started) / 1000));
        setSeconds(duration.current);
        if (duration.current >= MAX_AUDIO_SECONDS) finish();
      }, 250);
    } catch (e) {
      if (mounted.current && session.current === attempt) {
        release();
        setPhase("idle");
        onError(
          e instanceof DOMException && (e.name === "NotAllowedError" || e.name === "SecurityError")
            ? "Microfone não autorizado. Libere o acesso nas permissões do navegador e tente novamente."
            : "Não consegui acessar o microfone. Confira se ele está conectado e disponível.",
        );
      }
    }
  }
  async function transcribe() {
    if (!recording || phase !== "preview") return;
    const attempt = session.current;
    setPhase("transcribing");
    onError("");
    const data = new FormData();
    data.set("audio", recording, "prompt");
    data.set("seconds", String(duration.current));
    try {
      const result = await transcribePrompt({ data });
      if (!mounted.current || session.current !== attempt) return;
      if (result.ok && onTranscript(result.text)) {
        setRecording(null);
        setUrl("");
        setPhase("idle");
      } else {
        if (!result.ok) onError(result.error);
        setPhase("preview");
      }
    } catch {
      if (mounted.current && session.current === attempt) {
        setPhase("preview");
        onError("A conexão falhou. Tente transcrever novamente.");
      }
    }
  }
  if (phase === "idle")
    return (
      <button
        type="button"
        className="vc-dictate"
        aria-label="Gravar áudio para o prompt"
        title="Ditar prompt"
        disabled={disabled}
        onClick={() => void start()}
      >
        <Mic size={19} />
      </button>
    );
  return (
    <div className="vc-dictation" aria-label="Gravação de prompt">
      <button
        type="button"
        className="vc-dict-cancel"
        aria-label="Cancelar gravação"
        onClick={cancel}
      >
        <X size={18} />
      </button>
      <div className="vc-dict-status" role="status">
        {phase === "recording" ? (
          <>
            <span className="vc-wave" aria-hidden="true">
              {Array.from({ length: 16 }, (_, i) => (
                <i key={i} style={{ animationDelay: `${i * 70}ms` }} />
              ))}
            </span>
            <span>
              Gravando · {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}
            </span>
          </>
        ) : phase === "permission" ? (
          <>
            <Loader2 size={17} className="vc-dict-spinner" />
            Aguardando microfone…
          </>
        ) : phase === "transcribing" ? (
          <>
            <Loader2 size={17} className="vc-dict-spinner" />
            Transcrevendo…
          </>
        ) : (
          <>
            <audio src={url || undefined} controls aria-label="Ouvir gravação do prompt" />
            <span>Revise o áudio · {seconds}s</span>
          </>
        )}
      </div>
      {phase === "recording" && (
        <button
          type="button"
          className="vc-dict-confirm"
          aria-label="Concluir gravação"
          onClick={finish}
        >
          <Square size={16} />
        </button>
      )}
      {phase === "preview" && (
        <button
          type="button"
          className="vc-dict-confirm"
          aria-label="Transcrever gravação"
          onClick={() => void transcribe()}
        >
          <Check size={19} />
        </button>
      )}
      <small>
        {phase === "preview"
          ? "Confirmar envia o áudio para transcrição. Depois, revise o texto."
          : "Até 2 minutos · cancelar descarta o áudio"}
      </small>
    </div>
  );
}
