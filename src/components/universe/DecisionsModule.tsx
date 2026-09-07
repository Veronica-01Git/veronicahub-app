import { useMemo, useState } from "react";
import { CircleCheckBig, Gauge, Scale, ShieldCheck, TriangleAlert } from "lucide-react";

const CRITERIA = [
  { id: "utility", label: "PRACTICAL INTELLIGENCE", question: "Isso aumenta a capacidade prática do usuário?" },
  { id: "coherence", label: "BRAND COHERENCE", question: "Isso parece Veronica mesmo sem o logotipo?" },
  { id: "evidence", label: "PROMISE EVIDENCE", question: "A promessa pode ser sustentada por produto, dado ou experiência real?" },
  { id: "function", label: "TECH FUNCTION", question: "A tecnologia resolve uma função real ou apenas decora a narrativa?" },
  { id: "scale", label: "ECOSYSTEM SCALE", question: "Se isso escalar, a marca fica mais forte e coerente?" },
] as const;

type CriterionId = (typeof CRITERIA)[number]["id"];

type Scores = Record<CriterionId, number>;

const DEFAULT_SCORES: Scores = {
  utility: 3,
  coherence: 3,
  evidence: 3,
  function: 3,
  scale: 3,
};

function recommendation(total: number) {
  if (total >= 21) return { label: "ALIGNED", note: "A iniciativa está fortemente alinhada ao cânone. Ainda exige revisão humana antes de qualquer execução.", tone: "green" };
  if (total >= 16) return { label: "REVISE", note: "Há potencial, mas existem conflitos ou lacunas que devem ser resolvidos antes de avançar.", tone: "cyan" };
  return { label: "DO NOT ADVANCE", note: "A proposta está desalinhada ou pouco sustentada. Reestruture o conceito antes de investir execução.", tone: "neutral" };
}

export function DecisionsModule() {
  const [initiative, setInitiative] = useState("");
  const [scores, setScores] = useState<Scores>(DEFAULT_SCORES);
  const total = useMemo(() => Object.values(scores).reduce((sum, score) => sum + score, 0), [scores]);
  const result = recommendation(total);

  return (
    <div className="flex flex-col gap-8" data-universe-element="decisions">
      <header className="border-b border-border/40 pb-6">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <div className="font-mono-tech text-[10px] tracking-[0.18em] text-neon-green uppercase">MODULE 08 / DECISION INTELLIGENCE</div>
            <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">Decisions</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">Um filtro consultivo para novas ideias, produtos, campanhas e expansões. O Universe recomenda; ele não aprova, publica ou bloqueia automaticamente.</p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-neon-green/30 bg-neon-green/5 px-3 py-1 font-mono-tech text-[10px] tracking-widest text-neon-green uppercase"><ShieldCheck className="h-3.5 w-3.5" /> ADVISORY ONLY</span>
        </div>
      </header>

      <section className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        <div className="rounded-sm border border-border/50 bg-surface/20 p-5 sm:p-7">
          <div className="flex items-center gap-2 border-b border-border/40 pb-4"><Scale className="h-4 w-4 text-neon-green" /><h2 className="font-mono-tech text-xs tracking-widest text-foreground uppercase">BRAND DECISION MATRIX / V1</h2></div>
          <label className="mt-5 block font-mono-tech text-[10px] tracking-widest text-muted-foreground uppercase">Initiative under review</label>
          <input value={initiative} onChange={(event) => setInitiative(event.target.value)} placeholder="Ex: nova área de IA para creators" className="mt-2 w-full rounded-sm border border-border/50 bg-background/60 px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-neon-green/50" />

          <div className="mt-6 flex flex-col gap-4">
            {CRITERIA.map((criterion) => {
              const value = scores[criterion.id];
              return (
                <div key={criterion.id} className="rounded-sm border border-border/35 bg-background/40 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div><div className="font-mono-tech text-[10px] tracking-widest text-neon-cyan">{criterion.label}</div><p className="mt-1 text-xs text-muted-foreground">{criterion.question}</p></div>
                    <span className="font-mono-tech text-sm font-semibold text-foreground">{value}/5</span>
                  </div>
                  <input type="range" min={1} max={5} value={value} onChange={(event) => setScores((current) => ({ ...current, [criterion.id]: Number(event.target.value) }))} className="mt-4 w-full accent-current" aria-label={criterion.label} />
                  <div className="mt-1 flex justify-between font-mono-tech text-[8px] text-muted-foreground"><span>CONFLICT</span><span>WEAK</span><span>NEUTRAL</span><span>GOOD</span><span>STRONG</span></div>
                </div>
              );
            })}
          </div>
        </div>

        <aside className="flex flex-col gap-4">
          <div className="rounded-sm border border-neon-green/25 bg-neon-green/[0.035] p-6">
            <div className="flex items-center gap-2 font-mono-tech text-[10px] tracking-widest text-neon-green uppercase"><Gauge className="h-4 w-4" /> ALIGNMENT SCORE</div>
            <div className="mt-4 font-display text-6xl font-bold tracking-tight text-foreground">{total}<span className="text-2xl text-muted-foreground">/25</span></div>
            <div className="mt-5 h-2 overflow-hidden bg-border/30"><div className="h-full bg-neon-green transition-all duration-300" style={{ width: `${(total / 25) * 100}%` }} /></div>
            <div className={`mt-5 inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono-tech text-[10px] tracking-widest ${result.tone === "green" ? "border-neon-green/30 bg-neon-green/5 text-neon-green" : result.tone === "cyan" ? "border-neon-cyan/30 bg-neon-cyan/5 text-neon-cyan" : "border-border/50 bg-muted/20 text-muted-foreground"}`}>
              {result.tone === "green" ? <CircleCheckBig className="h-3.5 w-3.5" /> : <TriangleAlert className="h-3.5 w-3.5" />}{result.label}
            </div>
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">{result.note}</p>
          </div>

          <div className="rounded-sm border border-border/50 bg-surface/20 p-5">
            <div className="font-mono-tech text-[10px] tracking-widest text-muted-foreground uppercase">REVIEW CONTEXT</div>
            <div className="mt-3 rounded-sm border border-border/30 bg-background/40 p-3 text-xs leading-relaxed text-foreground/85">{initiative.trim() || "Nenhuma iniciativa nomeada ainda."}</div>
            <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">Esta avaliação fica apenas no navegador nesta versão. Nenhuma pontuação é salva no banco e nenhuma ação é executada no ecossistema.</p>
          </div>

          <button type="button" onClick={() => { setInitiative(""); setScores(DEFAULT_SCORES); }} className="rounded-sm border border-border/50 bg-background/40 px-4 py-2.5 font-mono-tech text-[10px] tracking-widest text-muted-foreground transition hover:border-neon-green/40 hover:text-neon-green">RESET REVIEW</button>
        </aside>
      </section>

      <section className="rounded-sm border border-border/50 bg-surface/20 p-5 sm:p-7">
        <div className="font-mono-tech text-[10px] tracking-widest text-muted-foreground uppercase">THRESHOLD POLICY / V1</div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-sm border border-neon-green/25 bg-neon-green/[0.035] p-4"><div className="font-mono-tech text-xs text-neon-green">21–25 · ALIGNED</div><p className="mt-2 text-xs text-muted-foreground">Pode seguir para revisão humana detalhada e planejamento.</p></div>
          <div className="rounded-sm border border-neon-cyan/25 bg-neon-cyan/[0.035] p-4"><div className="font-mono-tech text-xs text-neon-cyan">16–20 · REVISE</div><p className="mt-2 text-xs text-muted-foreground">Ajustar conflitos antes de comprometer recursos.</p></div>
          <div className="rounded-sm border border-border/45 bg-background/45 p-4"><div className="font-mono-tech text-xs text-muted-foreground">05–15 · DO NOT ADVANCE</div><p className="mt-2 text-xs text-muted-foreground">Reformular proposta ou descartar a direção atual.</p></div>
        </div>
      </section>
    </div>
  );
}
