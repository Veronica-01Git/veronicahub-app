import { useServerFn } from "@tanstack/react-start";
import { Loader2, MessageSquareText } from "lucide-react";
import { useState, type FormEvent } from "react";
import { summarizeNews } from "@/lib/news-summary.functions";

export function NewsAssistant({ headline, body }: { headline: string; body: string }) {
  const run = useServerFn(summarizeNews);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    setAnswer(null);
    try {
      const r = await run({ data: { headline, body, question } });
      if (r.ok) setAnswer(r.text);
      else setError(r.error);
    } catch {
      setError("Falha ao gerar o resumo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-8 rounded-sm border border-border/60 bg-surface/40 p-5" aria-label="Resumo com IA">
      <div className="flex items-center gap-2 font-mono-tech text-[11px] uppercase tracking-widest text-neon-cyan">
        <MessageSquareText className="h-4 w-4" /> Resumo contextualizado
      </div>
      <form onSubmit={onSubmit} className="mt-3 grid gap-3">
        <label htmlFor="news-q" className="sr-only">Sua pergunta ou texto</label>
        <textarea
          id="news-q"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={3}
          maxLength={2000}
          placeholder="Pergunte algo sobre esta notícia ou cole um trecho (opcional)"
          className="w-full rounded-sm border border-border/60 bg-background p-3 text-sm text-foreground outline-none focus:border-neon-cyan"
        />
        <button
          type="submit"
          disabled={loading}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-sm bg-neon-green px-4 text-sm font-medium text-primary-foreground disabled:opacity-50 sm:w-fit"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "Gerando…" : question.trim() ? "Perguntar" : "Resumir notícia"}
        </button>
      </form>
      <div role="status" aria-live="polite">
        {answer && <p className="mt-4 whitespace-pre-line text-[15px] leading-7 text-foreground/90">{answer}</p>}
        {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
      </div>
      <p className="mt-3 text-[11px] text-muted-foreground/70">Gerado por IA a partir da matéria. Confira a íntegra.</p>
    </section>
  );
}
