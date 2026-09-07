import { useMemo, useState } from "react";
import { BrainCircuit, CheckCircle2, Loader2, Send, ShieldCheck, Sparkles } from "lucide-react";
import { askVeronicaUniverse } from "@/lib/universe-intelligence";
import { ACTIVE_CANON_VERSION, CANON_REGISTRY } from "./canon-registry";

const QUICK_PROMPTS = [
  "Esse novo produto é coerente com a marca Veronica? Quais critérios devo validar?",
  "Qual deve ser o tom da Veronica no Hub versus no Wire?",
  "Quais regras devo preservar ao criar a Veronica avatar consistente?",
  "Audite uma campanha futurista: quais excessos visuais devo evitar?",
] as const;

type AnswerState = {
  answer: string;
  provider: string;
  model: string;
  canonVersion: string;
  warning?: string;
};

export function IntelligenceModule() {
  const [question, setQuestion] = useState(QUICK_PROMPTS[2]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnswerState | null>(null);

  const activeCount = useMemo(
    () => CANON_REGISTRY.filter((module) => module.status === "ACTIVE").length,
    [],
  );

  async function ask(questionOverride?: string) {
    const nextQuestion = (questionOverride ?? question).trim();
    if (!nextQuestion || loading) return;

    setQuestion(nextQuestion);
    setLoading(true);
    setError(null);

    try {
      const response = await askVeronicaUniverse({ data: { question: nextQuestion } });
      if (!response.ok) {
        setResult(null);
        setError(response.error);
        return;
      }
      setResult({
        answer: response.answer,
        provider: response.provider,
        model: response.model,
        canonVersion: response.canonVersion,
        warning: "warning" in response ? response.warning : undefined,
      });
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : "Falha ao consultar o Veronica Universe.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-8" data-universe-element="intelligence">
      <header className="border-b border-border/40 pb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="font-mono-tech text-[10px] tracking-[0.18em] text-neon-green uppercase">
              MODULE 10 / READ-ONLY INTELLIGENCE
            </div>
            <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Ask Veronica Universe
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Consulta estratégica baseada no cânone ativo. A inteligência pode analisar e recomendar,
              mas não publica, edita, bloqueia ou altera qualquer produto do ecossistema.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-neon-cyan/30 bg-neon-cyan/5 px-3 py-1 font-mono-tech text-[10px] tracking-widest text-neon-cyan uppercase">
            <ShieldCheck className="h-3.5 w-3.5" /> READ ONLY / AUTONOMY OFF
          </div>
        </div>
      </header>

      <section className="grid gap-5 xl:grid-cols-[1.45fr_0.75fr]">
        <div className="rounded-sm border border-border/50 bg-surface/20 p-5 sm:p-7">
          <div className="flex items-center justify-between gap-3 border-b border-border/40 pb-4">
            <div className="flex items-center gap-2">
              <BrainCircuit className="h-4 w-4 text-neon-green" />
              <h2 className="font-mono-tech text-xs tracking-widest text-foreground uppercase">
                CANON CONSULTATION
              </h2>
            </div>
            <span className="font-mono-tech text-[9px] text-muted-foreground">
              CANON v{ACTIVE_CANON_VERSION}
            </span>
          </div>

          <div className="mt-5 flex flex-col gap-3">
            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              maxLength={1600}
              rows={5}
              className="w-full resize-y rounded-sm border border-border/50 bg-background/70 p-4 text-sm leading-relaxed text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-neon-green/50"
              placeholder="Pergunte sobre marca, produto, avatar, campanha, tom, mídia ou coerência do ecossistema…"
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="font-mono-tech text-[10px] text-muted-foreground">
                {question.length}/1600 · nenhuma ação automática será executada
              </span>
              <button
                type="button"
                onClick={() => void ask()}
                disabled={loading || question.trim().length < 3}
                className="inline-flex items-center gap-2 rounded-sm border border-neon-green/40 bg-neon-green/10 px-4 py-2 font-mono-tech text-xs text-neon-green transition hover:bg-neon-green/15 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                {loading ? "CONSULTANDO…" : "ASK UNIVERSE"}
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-2 md:grid-cols-2">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => void ask(prompt)}
                disabled={loading}
                className="rounded-sm border border-border/35 bg-background/45 p-3 text-left text-xs leading-relaxed text-muted-foreground transition hover:border-neon-cyan/35 hover:text-foreground disabled:opacity-50"
              >
                <Sparkles className="mb-2 h-3.5 w-3.5 text-neon-cyan" />
                {prompt}
              </button>
            ))}
          </div>

          {error && (
            <div className="mt-5 rounded-sm border border-destructive/35 bg-destructive/5 p-4 text-xs text-destructive">
              {error}
            </div>
          )}

          {result && (
            <div className="mt-6 rounded-sm border border-neon-green/25 bg-background/55 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/35 pb-3">
                <div className="flex items-center gap-2 font-mono-tech text-[10px] tracking-widest text-neon-green uppercase">
                  <CheckCircle2 className="h-3.5 w-3.5" /> CANON RESPONSE
                </div>
                <div className="font-mono-tech text-[9px] text-muted-foreground">
                  {result.provider} · {result.model} · v{result.canonVersion}
                </div>
              </div>
              {result.warning && (
                <p className="mt-3 rounded-sm border border-neon-cyan/20 bg-neon-cyan/5 p-3 text-[11px] text-neon-cyan">
                  {result.warning}
                </p>
              )}
              <div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-foreground/90">
                {result.answer}
              </div>
            </div>
          )}
        </div>

        <aside className="rounded-sm border border-border/50 bg-surface/20 p-5 sm:p-6">
          <div className="border-b border-border/40 pb-4">
            <div className="font-mono-tech text-[10px] tracking-widest text-muted-foreground uppercase">
              CANON REGISTRY
            </div>
            <h2 className="mt-1 font-display text-2xl font-bold text-foreground">Versioned source of truth</h2>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {CANON_REGISTRY.length} módulos registrados · {activeCount} ativos · versão global {ACTIVE_CANON_VERSION}.
            </p>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            {CANON_REGISTRY.map((module) => (
              <div key={module.id} className="rounded-sm border border-border/30 bg-background/45 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono-tech text-[10px] font-medium tracking-wider text-foreground">
                    {module.label.toUpperCase()}
                  </span>
                  <span className={
                    module.status === "ACTIVE"
                      ? "font-mono-tech text-[9px] text-neon-green"
                      : "font-mono-tech text-[9px] text-neon-cyan"
                  }>
                    {module.status} · v{module.version}
                  </span>
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{module.summary}</p>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </div>
  );
}
