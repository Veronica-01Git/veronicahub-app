import { AudioLines, MessageSquareText, Mic2, ShieldCheck, Volume2 } from "lucide-react";

const MODES = [
  { product: "HUB", cadence: "Calma, didática, progressiva", tone: "Próxima + estratégica", avoid: "Jargão sem explicação" },
  { product: "WIRE", cadence: "Seca, clara, editorial", tone: "Séria + verificável", avoid: "Sensacionalismo" },
  { product: "STUDIO", cadence: "Visual, objetiva, criativa", tone: "Direção + execução", avoid: "Adjetivo vazio" },
  { product: "ANALYTICS", cadence: "Comparativa, modular", tone: "Analítica + acionável", avoid: "Métrica sem implicação" },
  { product: "SECURITY", cadence: "Precisa, cautelosa", tone: "Defensiva + serena", avoid: "Alarmismo" },
] as const;

const SPEECH_RULES = [
  "Frases relativamente curtas quando a tarefa é operacional; ritmo mais amplo em explicações conceituais.",
  "Uma ideia principal por parágrafo. A progressão precisa ser fácil de acompanhar em voz e texto.",
  "Termos técnicos entram quando ajudam precisão; quando entram, recebem contexto suficiente para não excluir o usuário.",
  "Confiança vem de estrutura, evidência e clareza — não de superlativos, teatralidade ou excesso de certeza.",
  "A resposta termina com direção útil quando há uma próxima ação real; não força CTA artificial.",
] as const;

const TTS = [
  ["PACE", "0.96–1.02×", "Natural, sem pressa comercial"],
  ["PITCH", "Neutral / warm", "Evitar infantilização ou dramatização"],
  ["PAUSES", "Meaningful", "Pausa curta entre blocos de raciocínio"],
  ["EMPHASIS", "Selective", "Destacar decisão, risco ou conceito central"],
  ["ENERGY", "Controlled", "Presença inteligente, não locução publicitária"],
] as const;

export function VoiceModule() {
  return (
    <div className="flex flex-col gap-8" data-universe-element="voice">
      <header className="border-b border-border/40 pb-6">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <div className="font-mono-tech text-[10px] tracking-[0.18em] text-neon-green uppercase">MODULE 05 / VOICE INTELLIGENCE</div>
            <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">Voice</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">Regras para texto, fala e síntese vocal: a Verônica muda de contexto sem perder sua assinatura verbal.</p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-neon-green/30 bg-neon-green/5 px-3 py-1 font-mono-tech text-[10px] tracking-widest text-neon-green uppercase"><ShieldCheck className="h-3.5 w-3.5" /> VOICE CANON / ACTIVE</span>
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
        <div className="rounded-sm border border-neon-green/25 bg-neon-green/[0.035] p-6 sm:p-8">
          <div className="flex items-center gap-2 font-mono-tech text-[10px] tracking-widest text-neon-green uppercase"><MessageSquareText className="h-4 w-4" /> CORE VOICE</div>
          <p className="mt-5 font-display text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl">Inteligência clara, presença calma e direção útil.</p>
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground">A voz da Verônica deve soar como alguém que entendeu o problema antes de responder. Ela não compete por atenção; organiza a atenção.</p>
        </div>
        <div className="rounded-sm border border-border/50 bg-surface/20 p-5 sm:p-6">
          <div className="flex items-center gap-2 border-b border-border/40 pb-4"><Volume2 className="h-4 w-4 text-neon-cyan" /><h2 className="font-mono-tech text-xs tracking-widest text-foreground uppercase">VOICE SIGNAL</h2></div>
          <div className="mt-4 grid gap-2.5">
            {[['CLARITY','95'],['WARMTH','72'],['AUTHORITY','82'],['ENERGY','58'],['FORMALITY','64']].map(([label,value]) => <div key={label}><div className="mb-1 flex justify-between font-mono-tech text-[9px] text-muted-foreground"><span>{label}</span><span>{value}%</span></div><div className="h-1.5 bg-border/30"><div className="h-full bg-neon-green/70" style={{width:`${value}%`}} /></div></div>)}
          </div>
        </div>
      </section>

      <section className="rounded-sm border border-border/50 bg-surface/20 p-5 sm:p-7">
        <div className="flex items-center gap-2 border-b border-border/40 pb-4"><AudioLines className="h-4 w-4 text-neon-green" /><h2 className="font-mono-tech text-xs tracking-widest text-foreground uppercase">EXPRESSION MATRIX</h2></div>
        <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[760px] border-collapse text-left text-xs"><thead className="font-mono-tech text-[10px] tracking-widest text-muted-foreground"><tr className="border-b border-border/40"><th className="px-3 py-3">MODE</th><th className="px-3 py-3">CADENCE</th><th className="px-3 py-3">TONE</th><th className="px-3 py-3">AVOID</th></tr></thead><tbody className="divide-y divide-border/25">{MODES.map(m=><tr key={m.product}><td className="px-3 py-3 font-mono-tech text-neon-green">{m.product}</td><td className="px-3 py-3 text-foreground/85">{m.cadence}</td><td className="px-3 py-3 text-foreground/85">{m.tone}</td><td className="px-3 py-3 text-muted-foreground">{m.avoid}</td></tr>)}</tbody></table></div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-sm border border-border/50 bg-surface/20 p-5 sm:p-6">
          <div className="flex items-center gap-2 border-b border-border/40 pb-4"><Mic2 className="h-4 w-4 text-neon-cyan" /><h2 className="font-mono-tech text-xs tracking-widest text-foreground uppercase">SPEECH RULES</h2></div>
          <div className="mt-4 flex flex-col gap-3">{SPEECH_RULES.map((r,i)=><div key={r} className="flex gap-3 text-xs leading-relaxed text-muted-foreground"><span className="font-mono-tech text-[10px] text-neon-green">S{i+1}</span><span>{r}</span></div>)}</div>
        </div>
        <div className="rounded-sm border border-border/50 bg-surface/20 p-5 sm:p-6">
          <div className="flex items-center gap-2 border-b border-border/40 pb-4"><Volume2 className="h-4 w-4 text-neon-green" /><h2 className="font-mono-tech text-xs tracking-widest text-foreground uppercase">TTS DIRECTION / DEFAULT</h2></div>
          <div className="mt-4 divide-y divide-border/25">{TTS.map(([k,v,note])=><div key={k} className="grid grid-cols-[95px_105px_1fr] gap-3 py-3 text-xs"><span className="font-mono-tech text-neon-cyan">{k}</span><span className="text-foreground">{v}</span><span className="text-muted-foreground">{note}</span></div>)}</div>
        </div>
      </section>

      <section className="rounded-sm border border-border/40 bg-background/40 p-5"><div className="font-mono-tech text-[10px] tracking-widest text-muted-foreground">CANONICAL SAMPLE</div><p className="mt-3 max-w-3xl text-sm leading-relaxed text-foreground/90">“O ponto principal é este: a tecnologia só melhora a experiência quando reduz fricção ou aumenta capacidade. Primeiro definimos a função. Depois escolhemos a IA que realmente ajuda a executá-la.”</p></section>
    </div>
  );
}
