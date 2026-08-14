import { useEffect, useRef, useState, type FormEvent } from "react";
import { X, Send, Play } from "lucide-react";
import { veronicaChat } from "@/lib/veronica-server";
import { getVeronicaSkill, getVeronicaStep, type VeronicaSkillId, type StudioCriativoStepId } from "@/veronica/skills";

type ChatTurn = { role: "user" | "assistant"; content: string };

// Vídeos pré-gravados por passo ainda não foram produzidos/publicados no
// CDN — em vez de deixar um <video> quebrado, cai num placeholder honesto
// quando o arquivo não existe.
function StepVideo({ videoAsset, title }: { videoAsset: string; title: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-center">
        <Play className="h-6 w-6 text-muted-foreground/50" />
        <span className="font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground/60">
          Vídeo deste passo em breve
        </span>
      </div>
    );
  }
  return (
    <video
      key={videoAsset}
      controls
      playsInline
      preload="none"
      className="h-full w-full object-cover"
      onError={() => setFailed(true)}
    >
      <source src={`/videos/${videoAsset}`} type="video/mp4" />
    </video>
  );
}

export function VeronicaDrawer({
  skillId,
  open,
  stepId,
  onClose,
}: {
  skillId: VeronicaSkillId;
  open: boolean;
  stepId: StudioCriativoStepId | null;
  onClose: () => void;
}) {
  const skill = getVeronicaSkill(skillId);
  const step = getVeronicaStep(skillId, stepId);

  const [messages, setMessages] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const lastGreetedStep = useRef<StudioCriativoStepId | null>(null);

  // Ao trocar de passo (novo chip "perguntar à veronica"), insere uma
  // mensagem de contexto em vez de apagar o histórico — mantém a conversa.
  useEffect(() => {
    if (!open || !step) return;
    if (lastGreetedStep.current === step.id) return;
    lastGreetedStep.current = step.id;
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content:
          prev.length === 0
            ? `Chegou no passo "${step.title}". ${step.summary.split(".")[0]}. Pergunta o que quiser sobre esse passo.`
            : `Mudando pro passo "${step.title}" (${step.order}/7). O que você quer saber?`,
      },
    ]);
  }, [open, step]);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setError(null);
    setInput("");
    const nextHistory = [...messages, { role: "user" as const, content: trimmed }];
    setMessages(nextHistory);
    setSending(true);
    try {
      const res = await veronicaChat({
        data: {
          skillId,
          stepId: step?.id ?? null,
          message: trimmed,
          history: messages.slice(-8),
        },
      });
      if (res.ok) {
        setMessages((prev) => [...prev, { role: "assistant", content: res.reply }]);
      } else {
        setError(res.error);
      }
    } catch {
      setError("Falha ao falar com a Veronica. Tenta de novo.");
    } finally {
      setSending(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  const showSuggestions = step && messages.filter((m) => m.role === "user").length === 0;

  return (
    <>
      <div
        className={`fixed right-0 top-0 z-[60] flex h-full w-full flex-col border-l border-border/60 bg-surface shadow-[-30px_0_70px_-30px_rgba(0,0,0,0.6)] transition-transform duration-300 ease-out sm:w-[420px] ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-hidden={!open}
        aria-label="Assistente Veronica"
      >
        <div className="flex items-center justify-between border-b border-border/50 px-4 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-neon-green/40 bg-neon-green/10 font-display text-sm text-neon-green">
              V
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">Veronica</div>
              <div className="font-mono-tech text-[9.5px] uppercase tracking-widest text-muted-foreground">
                {skill.label}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar assistente"
            className="flex h-7 w-7 items-center justify-center rounded-sm border border-border/60 text-muted-foreground transition hover:border-neon-green/50 hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {step ? (
          <>
            <div className="relative aspect-video w-full flex-shrink-0 border-b border-border/50 bg-black">
              <StepVideo videoAsset={step.videoAsset} title={step.title} />
              <span className="absolute bottom-2 left-3 font-mono-tech text-[9.5px] uppercase tracking-widest text-white/70">
                Passo {String(step.order).padStart(2, "0")} · {step.title}
              </span>
            </div>
            <div className="flex items-center gap-2.5 border-b border-border/50 px-4 py-2.5">
              <span className="font-mono-tech text-[10px] text-neon-green">
                {String(step.order).padStart(2, "0")} / 07
              </span>
              <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-neon-green/10">
                <div
                  className="h-full rounded-full bg-neon-green shadow-glow-green"
                  style={{ width: `${(step.order / 7) * 100}%` }}
                />
              </div>
            </div>
          </>
        ) : (
          <div className="relative aspect-video w-full flex-shrink-0 overflow-hidden border-b border-border/50 bg-black">
            <img
              src="/images/assistente/avatar-hologram.webp"
              alt="Avatar da assistente Veronica materializando em holograma"
              className="h-full w-full object-cover"
              loading="lazy"
            />
            <div aria-hidden className="pointer-events-none absolute inset-0 scanlines opacity-20" />
          </div>
        )}

        <div ref={bodyRef} className="flex flex-1 flex-col gap-3.5 overflow-y-auto px-4 py-4">
          {messages.map((m, i) => (
            <div key={i} className={`max-w-[88%] ${m.role === "user" ? "self-end" : "self-start"}`}>
              <div className="mb-1 font-mono-tech text-[9px] uppercase tracking-widest text-muted-foreground/70">
                {m.role === "user" ? "Você" : "Veronica"}
              </div>
              <div
                className={`rounded-sm border px-3 py-2.5 text-[13.5px] leading-[1.55] ${
                  m.role === "user"
                    ? "border-border/60 bg-background/40 text-muted-foreground"
                    : "border-neon-green/25 bg-neon-green/5 text-foreground"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {sending && (
            <div className="max-w-[88%] self-start">
              <div className="mb-1 font-mono-tech text-[9px] uppercase tracking-widest text-muted-foreground/70">
                Veronica
              </div>
              <div className="rounded-sm border border-neon-green/25 bg-neon-green/5 px-3 py-2.5 text-[13.5px] text-muted-foreground">
                digitando…
              </div>
            </div>
          )}
          {error && (
            <div className="rounded-sm border border-destructive/40 bg-destructive/5 px-3 py-2 text-[12px] text-destructive">
              {error}
            </div>
          )}
        </div>

        {showSuggestions && (
          <div className="flex flex-wrap gap-1.5 border-t border-border/40 px-4 py-3">
            {step!.suggestedPrompts.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => sendMessage(p)}
                className="rounded-full border border-neon-green/30 bg-neon-green/5 px-3 py-1.5 font-mono-tech text-[10.5px] text-neon-green transition hover:border-neon-green/60"
              >
                {p}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-border/50 p-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={step ? "Pergunte sobre este passo…" : "Digite sua pergunta…"}
            disabled={sending}
            className="min-w-0 flex-1 rounded-sm border border-border/60 bg-background/60 px-3 py-2 text-[13px] text-foreground outline-none placeholder:text-muted-foreground/50 focus:border-neon-green/50 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            aria-label="Enviar"
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-sm border border-neon-green/40 bg-neon-green/10 text-neon-green transition hover:border-neon-green disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>

      {/* Backdrop mobile — fecha ao tocar fora */}
      {open && (
        <div
          className="fixed inset-0 z-[55] bg-black/40 sm:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}
    </>
  );
}
