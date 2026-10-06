import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowUp,
  ArrowUpRight,
  AudioLines,
  Check,
  Copy,
  Menu,
  Mic,
  MicOff,
  Plus,
  Square,
  Video,
  Volume2,
  X,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteChrome";
import {
  conversationCapabilities,
  conversationReply,
  startVeronicaLive,
} from "@/veronica/conversation/functions";
import { connectLive, loadLiveSdk } from "@/veronica/conversation/live-client";
import type { LiveModel, Turn } from "@/veronica/conversation/core";
import "@/veronica/conversation/conversation.css";
export const Route = createFileRoute("/veronica")({
  component: VeronicaConversation,
  head: () => ({
    meta: [
      { title: "Converse com a Veronica | Veronica Hub" },
      {
        name: "description",
        content:
          "Uma conversa própria com a inteligência central do Veronica Hub. Pense, aprenda e crie por texto, com experiência de áudio e vídeo em ativação.",
      },
    ],
  }),
});
type Message = Turn & { id: string };
type Thread = { id: string; title: string; messages: Message[] };
const newThread = (): Thread => ({ id: crypto.randomUUID(), title: "Nova conversa", messages: [] });
const ideas = [
  {
    title: "Uma ideia que merece existir",
    text: "Me ajude a transformar uma ideia em um projeto claro.",
    tag: "CRIAR",
  },
  {
    title: "Meu próximo passo com IA",
    text: "Quero aprender IA. Me ajude a escolher um primeiro passo prático.",
    tag: "APRENDER",
  },
  {
    title: "Um negócio mais inteligente",
    text: "Como posso identificar processos da minha empresa que podem ser automatizados?",
    tag: "EVOLUIR",
  },
];
function VeronicaConversation() {
  const [threads, setThreads] = useState<Thread[]>([
    { id: "first", title: "Nova conversa", messages: [] },
  ]);
  const [active, setActive] = useState("first"),
    [input, setInput] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [drawer, setDrawer] = useState(false);
  const [mode, setMode] = useState<"text" | "audio" | "video">("text"),
    [model, setModel] = useState<LiveModel>("vidu-s2"),
    [liveState, setLiveState] = useState("idle"),
    [videoVisible, setVideoVisible] = useState(false),
    [mic, setMic] = useState(false),
    [capabilities, setCapabilities] = useState({ liveConfigured: false, liveEnabled: false }),
    [copied, setCopied] = useState("");
  const live = useRef<Awaited<ReturnType<typeof connectLive>> | null>(null),
    video = useRef<HTMLVideoElement>(null),
    bottom = useRef<HTMLDivElement>(null),
    generation = useRef(0),
    speaking = useRef(false);
  const thread = threads.find((t) => t.id === active)!;
  const append = (threadId: string, message: Message) =>
    setThreads((current) =>
      current.map((t) =>
        t.id !== threadId
          ? t
          : {
              ...t,
              title: t.messages.length ? t.title : message.content.slice(0, 48),
              messages: [...t.messages.filter((m) => m.id !== message.id), message].slice(-80),
            },
      ),
    );
  useEffect(() => {
    let mounted = true;
    conversationCapabilities()
      .then((c) => {
        if (mounted) setCapabilities(c);
      })
      .catch(() => {});
    return () => {
      mounted = false;
      // Invalidate in-flight asynchronous work on unmount (a counter, not a DOM ref).
      // eslint-disable-next-line react-hooks/exhaustive-deps
      generation.current++;
      live.current?.stop();
      window.speechSynthesis?.cancel();
    };
  }, []);
  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [thread.messages.length, busy]);
  const stop = () => {
    generation.current++;
    live.current?.stop();
    live.current = null;
    window.speechSynthesis?.cancel();
    speaking.current = false;
    setMic(false);
    setLiveState("idle");
    setVideoVisible(false);
  };
  const changeThread = (id: string) => {
    stop();
    setActive(id);
    setInput("");
    setError("");
    setDrawer(false);
  };
  const create = () => {
    const t = newThread();
    stop();
    setThreads((v) => [t, ...v].slice(0, 20));
    setActive(t.id);
    setInput("");
    setError("");
    setDrawer(false);
  };
  async function send(event?: FormEvent, text = input) {
    event?.preventDefault();
    if (busy || liveState === "connecting" || !text.trim()) return;
    const id = active,
      content = text.trim();
    setError("");
    setInput("");
    if (live.current) {
      try {
        live.current.sendText(content);
        append(id, { id: crypto.randomUUID(), role: "user", content });
      } catch {
        setInput(content);
        setError("A sessão terminou. Encerre e continue por texto.");
      }
      return;
    }
    append(id, { id: crypto.randomUUID(), role: "user", content });
    setBusy(true);
    try {
      const r = await conversationReply({
        data: {
          message: content,
          history: thread.messages
            .slice(-10)
            .map(({ role, content }) => ({ role, content: content.slice(0, 1600) })),
        },
      });
      if (r.ok) append(id, { id: crypto.randomUUID(), role: "assistant", content: r.reply });
      else {
        setError(r.error);
        setInput(content);
      }
    } catch {
      setError("A conexão falhou. Tente novamente quando estiver disponível.");
      setInput(content);
    } finally {
      setBusy(false);
    }
  }
  async function start() {
    if (liveState === "connecting" || live.current || busy) return;
    const attempt = ++generation.current,
      target = active;
    setError("");
    setLiveState("connecting");
    try {
      const sdk = await loadLiveSdk();
      if (!(await sdk.isSupported()).support)
        throw new Error("Este navegador não suporta a conversa ao vivo.");
      if (attempt !== generation.current) return;
      const r = await startVeronicaLive({
        data: { model, mode: mode === "audio" ? "audio" : "video" },
      });
      if (!r.ok) throw new Error(r.error);
      if (!video.current) throw new Error("A tela de vídeo não está disponível.");
      const session = await connectLive({
        sdk,
        ticket: r.ticket,
        rtc: r.rtc,
        video: video.current,
        onState: (s) => {
          if (attempt === generation.current) {
            setLiveState(s);
            if (s === "ended") {
              live.current = null;
              setMic(false);
            }
          }
        },
        onVideo: setVideoVisible,
        onText: (role, content, id) => {
          if (attempt === generation.current) append(target, { role, content, id });
        },
      });
      if (attempt !== generation.current) {
        session.stop();
        return;
      }
      live.current = session;
    } catch (e) {
      if (attempt === generation.current) {
        setError(e instanceof Error ? e.message : "Não foi possível iniciar.");
        setLiveState("idle");
      }
    }
  }
  async function toggleMic() {
    try {
      if (!live.current) return;
      await live.current.microphone(!mic);
      setMic((v) => !v);
    } catch {
      setError(
        "Não foi possível ativar o microfone. Verifique a permissão do navegador; o texto continua disponível.",
      );
    }
  }
  function listen(text: string) {
    if (!("speechSynthesis" in window)) {
      setError("Este navegador não oferece leitura em voz alta.");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "pt-BR";
    utterance.rate = 1;
    speaking.current = true;
    utterance.onend = () => {
      speaking.current = false;
    };
    window.speechSynthesis.speak(utterance);
  }
  async function copy(message: Message) {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(message.id);
    } catch {
      setError("Não foi possível copiar. Selecione o texto da resposta.");
    }
  }
  const liveActive = liveState === "connected" || liveState === "playback";
  return (
    <div className="vc-app">
      <SiteHeader brand="yo" />
      <div className="vc-shell">
        <aside className={`vc-sidebar ${drawer ? "is-open" : ""}`} aria-label="Suas conversas">
          <div className="vc-side-brand">
            <img src="/images/brand/yo-lab-logo.webp" alt="YO LAB & CO." />
            <span>
              VERONICA<span>Inteligência central</span>
            </span>
            <button
              className="vc-icon vc-mobile"
              aria-label="Fechar conversas"
              onClick={() => setDrawer(false)}
            >
              <X size={18} />
            </button>
          </div>
          <button className="vc-new" onClick={create} disabled={busy || liveState === "connecting"}>
            <Plus size={17} /> Nova conversa
          </button>
          <p className="vc-label">Nesta sessão</p>
          <nav className="vc-threads">
            {threads.map((t) => (
              <button
                key={t.id}
                aria-current={t.id === active ? "page" : undefined}
                disabled={busy || liveState === "connecting"}
                onClick={() => changeThread(t.id)}
              >
                {t.title}
              </button>
            ))}
          </nav>
          <div className="vc-side-bottom">
            <p>
              Um espaço para pensar.
              <br />
              Uma inteligência para criar.
            </p>
            <Link to="/" className="vc-back">
              Explorar a Hub <ArrowUpRight size={16} />
            </Link>
            <small>Conversas ficam apenas nesta página. Recarregar encerra a sessão.</small>
          </div>
        </aside>
        <main className="vc-main">
          <header className="vc-top">
            <div>
              <button
                className="vc-icon vc-mobile"
                aria-label="Abrir conversas"
                onClick={() => setDrawer(true)}
              >
                <Menu size={20} />
              </button>
              <span className="vc-dot" />
              <strong>Veronica</strong>
              <span className="vc-top-sub">Seu espaço de conversa</span>
            </div>
            <div className="vc-modes" aria-label="Formato da conversa">
              {(["text", "audio", "video"] as const).map((m) => (
                <button
                  key={m}
                  aria-pressed={mode === m}
                  disabled={liveState === "connecting"}
                  onClick={() => {
                    stop();
                    setMode(m);
                  }}
                >
                  {m === "text" ? (
                    "Texto"
                  ) : m === "audio" ? (
                    <>
                      <AudioLines size={15} /> Áudio
                    </>
                  ) : (
                    <>
                      <Video size={15} /> Vídeo
                    </>
                  )}
                </button>
              ))}
            </div>
          </header>
          <div className={`vc-body ${mode !== "text" ? "has-stage" : ""}`}>
            <div className="vc-chat-area">
              {thread.messages.length === 0 ? (
                <section className="vc-welcome">
                  <div className="vc-orb" aria-hidden="true">
                    <i />
                    <i />
                    <span>V</span>
                  </div>
                  <p className="vc-label">YO LAB & CO. / VERONICA</p>
                  <h1>
                    O que vamos
                    <br />
                    <em>criar hoje?</em>
                  </h1>
                  <p className="vc-intro">
                    Ideias ganham direção. Perguntas abrem caminhos.
                    <br />
                    Comece uma conversa com a Veronica.
                  </p>
                  <div className="vc-ideas">
                    {ideas.map((idea) => (
                      <button
                        key={idea.tag}
                        disabled={busy}
                        onClick={() => void send(undefined, idea.text)}
                      >
                        <small>{idea.tag}</small>
                        <span>{idea.title}</span>
                        <ArrowUpRight size={16} />
                      </button>
                    ))}
                  </div>
                </section>
              ) : (
                <div
                  className="vc-messages"
                  role="log"
                  aria-label="Conversa com Veronica"
                  aria-live="polite"
                >
                  {thread.messages.map((message) => (
                    <article key={message.id} className={`vc-message ${message.role}`}>
                      <div className="vc-message-name">
                        {message.role === "user" ? "Você" : "Veronica"}
                      </div>
                      <div className="vc-message-content">{message.content}</div>
                      {message.role === "assistant" && (
                        <div className="vc-message-actions">
                          <button
                            onClick={() => listen(message.content)}
                            title="Leitura com a voz disponível no dispositivo"
                          >
                            <Volume2 size={14} /> Ouvir no dispositivo
                          </button>
                          <button onClick={() => void copy(message)}>
                            {copied === message.id ? <Check size={14} /> : <Copy size={14} />}{" "}
                            {copied === message.id ? "Copiado" : "Copiar"}
                          </button>
                        </div>
                      )}
                    </article>
                  ))}
                  {busy && (
                    <p className="vc-thinking" role="status">
                      <span />
                      <span />
                      <span /> Veronica está preparando a resposta
                    </p>
                  )}
                  <div ref={bottom} />
                </div>
              )}
            </div>
            {mode !== "text" && (
              <aside className="vc-presence" aria-label="Conversa ao vivo">
                <div className={`vc-avatar-stage ${videoVisible ? "has-video" : ""}`}>
                  <img
                    src="/images/yo-campus/core-1280.webp"
                    alt="Veronica de cabelo curto no laboratório YO"
                  />
                  <video
                    ref={video}
                    autoPlay
                    playsInline
                    controls
                    aria-label="Vídeo ao vivo da Veronica"
                  />
                  <div className="vc-stage-caption">
                    <span>VERONICA</span>
                    <small>
                      {liveActive ? "Sessão conectada" : "Presença digital · referência visual"}
                    </small>
                  </div>
                </div>
                <div className="vc-stage-controls">
                  <div className="vc-models" aria-label="Modelo Vidu">
                    {(["vidu-s2", "vidu-s1"] as const).map((m) => (
                      <button
                        key={m}
                        aria-pressed={model === m}
                        disabled={liveActive || liveState === "connecting"}
                        onClick={() => setModel(m)}
                      >
                        {m === "vidu-s2" ? "S2 · Expressivo" : "S1 · Alternativo"}
                      </button>
                    ))}
                  </div>
                  <h2>
                    {mode === "audio" ? "Uma conversa com voz." : "Inteligência com presença."}
                  </h2>
                  <p>
                    {capabilities.liveEnabled
                      ? "Integração em validação pela equipe. Sessões de até cinco minutos; o microfone só é ligado por você."
                      : "Estamos ativando o áudio e o avatar ao vivo. Enquanto isso, converse por texto e ouça as respostas no seu dispositivo."}
                  </p>
                  {liveActive ? (
                    <>
                      <button className="vc-live-button" onClick={stop}>
                        <Square size={14} /> Encerrar sessão
                      </button>
                      <div className="vc-call-actions">
                        <button onClick={() => void toggleMic()}>
                          {mic ? <MicOff size={16} /> : <Mic size={16} />}{" "}
                          {mic ? "Desligar microfone" : "Ligar microfone"}
                        </button>
                        <button onClick={() => live.current?.interrupt()}>
                          Interromper resposta
                        </button>
                      </div>
                    </>
                  ) : (
                    <button
                      className="vc-live-button"
                      disabled={!capabilities.liveEnabled || liveState === "connecting" || busy}
                      onClick={() => void start()}
                    >
                      {liveState === "connecting"
                        ? "Conectando…"
                        : capabilities.liveEnabled
                          ? "Iniciar teste ao vivo"
                          : "Ao vivo em ativação"}
                    </button>
                  )}
                  <small>Vidu S1 / S2 · câmera desligada · sem gravação na Hub</small>
                </div>
              </aside>
            )}
          </div>
          <div className="vc-composer-wrap">
            {error && (
              <div className="vc-error" role="alert">
                {error}
                <button aria-label="Fechar aviso" onClick={() => setError("")}>
                  <X size={15} />
                </button>
              </div>
            )}
            <form className="vc-composer" onSubmit={(event) => void send(event)}>
              <label className="sr-only" htmlFor="vc-input">
                Mensagem para Veronica
              </label>
              <textarea
                id="vc-input"
                value={input}
                maxLength={1600}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Converse com a Veronica…"
                rows={2}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    void send();
                  }
                }}
              />
              <div className="vc-compose-bottom">
                <span>
                  {liveActive ? "Ao vivo · Vidu" : "Texto · Veronica"}
                  <small>{input.length}/1600</small>
                </span>
                <button
                  aria-label="Enviar mensagem"
                  disabled={busy || !input.trim() || liveState === "connecting"}
                >
                  <ArrowUp size={19} />
                </button>
              </div>
            </form>
            <p className="vc-note">
              A Veronica pode errar. Confira informações importantes. Enter envia · Shift + Enter
              cria uma linha.
            </p>
            <button
              className="vc-stop-reading"
              onClick={() => {
                window.speechSynthesis?.cancel();
                speaking.current = false;
              }}
            >
              Parar leitura em voz alta
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
