import { Archive, ExternalLink, Film, Image, Radar, ShieldCheck } from "lucide-react";

const PIPELINE = [
  ["01", "CAPTURE", "Imagem, vídeo, áudio ou referência entra no sistema."],
  ["02", "REVIEW", "Qualidade, coerência, direitos e contexto são avaliados."],
  ["03", "APPROVED", "Ativo passa a ser referência oficial ou material reutilizável."],
  ["04", "DISTRIBUTED", "Uso documentado em produto, campanha, aula ou editorial."],
  ["05", "ARCHIVED", "Versões obsoletas ficam preservadas sem competir com o cânone atual."],
] as const;

const RULES = [
  "Priorizar ativos próprios, licenciados ou gerados com origem conhecida.",
  "Nunca usar uma imagem apenas porque é visualmente impactante; ela precisa servir à narrativa e ao contexto.",
  "Verônica humanizada deve manter continuidade facial, faixa visual, postura de marca e identificação clara como persona de IA.",
  "Wire exige evidência visual contextual; Hub pode ser mais aspiracional; Studio pode explorar abstração e geração.",
  "Vídeo institucional deve possuir primeiro e último quadro pensados para continuidade, cortes limpos e reaproveitamento modular.",
  "Todo ativo oficial precisa ter uma função, um estado e uma origem rastreável.",
] as const;

const CHANNELS = [
  { name: "HOME / HERO", role: "Primeiro impacto", format: "16:9 / responsive", priority: "Presence + clarity" },
  { name: "YOUTUBE", role: "Long-form education", format: "16:9", priority: "Retention + trust" },
  { name: "SHORT VIDEO", role: "Discovery", format: "9:16", priority: "Hook + continuity" },
  { name: "WIRE", role: "Editorial evidence", format: "Adaptive", priority: "Context + credibility" },
  { name: "STUDIO", role: "Creation showcase", format: "Multi-format", priority: "Quality + possibility" },
] as const;

export function MediaModule() {
  return (
    <div className="flex flex-col gap-8" data-universe-element="media">
      <header className="border-b border-border/40 pb-6">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <div className="font-mono-tech text-[10px] tracking-[0.18em] text-neon-green uppercase">MODULE 06 / MEDIA INTELLIGENCE</div>
            <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">Media</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">Governança de imagem, vídeo, referência e distribuição. O módulo organiza; não publica nada automaticamente.</p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-neon-green/30 bg-neon-green/5 px-3 py-1 font-mono-tech text-[10px] tracking-widest text-neon-green uppercase"><ShieldCheck className="h-3.5 w-3.5" /> MEDIA CANON / ACTIVE</span>
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-sm border border-neon-green/25 bg-neon-green/[0.035] p-6 sm:p-8">
          <div className="flex items-center gap-2 font-mono-tech text-[10px] tracking-widest text-neon-green uppercase"><Radar className="h-4 w-4" /> MEDIA PRINCIPLE</div>
          <p className="mt-5 font-display text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl">Cada ativo precisa saber por que existe.</p>
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground">O Universe não vira um depósito. Ele registra intenção, padrão, estado e destino para que imagem e vídeo fortaleçam a mesma identidade ao longo do tempo.</p>
        </div>
        <div className="rounded-sm border border-border/50 bg-surface/20 p-5 sm:p-6">
          <div className="flex items-center gap-2 border-b border-border/40 pb-4"><Image className="h-4 w-4 text-neon-cyan" /><h2 className="font-mono-tech text-xs tracking-widest text-foreground uppercase">ASSET OPERATIONS</h2></div>
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">O painel de imagens já existente continua sendo a operação. O Universe define o critério por cima dele.</p>
          <a href="/admin/imagens" className="mt-5 inline-flex items-center gap-2 rounded-sm border border-neon-cyan/30 bg-neon-cyan/5 px-3 py-2 font-mono-tech text-[10px] tracking-wider text-neon-cyan transition hover:border-neon-cyan/60"><ExternalLink className="h-3.5 w-3.5" /> ABRIR BANCO DE IMAGENS</a>
        </div>
      </section>

      <section className="rounded-sm border border-border/50 bg-surface/20 p-5 sm:p-7">
        <div className="flex items-center gap-2 border-b border-border/40 pb-4"><Archive className="h-4 w-4 text-neon-green" /><h2 className="font-mono-tech text-xs tracking-widest text-foreground uppercase">ASSET LIFECYCLE</h2></div>
        <div className="mt-5 grid gap-3 md:grid-cols-5">{PIPELINE.map(([id,name,text])=><article key={id} className="rounded-sm border border-border/35 bg-background/45 p-4"><div className="font-mono-tech text-[9px] text-neon-green">{id}</div><h3 className="mt-2 font-mono-tech text-[11px] text-foreground">{name}</h3><p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{text}</p></article>)}</div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-sm border border-border/50 bg-surface/20 p-5 sm:p-6">
          <div className="flex items-center gap-2 border-b border-border/40 pb-4"><Film className="h-4 w-4 text-neon-cyan" /><h2 className="font-mono-tech text-xs tracking-widest text-foreground uppercase">MEDIA RULES</h2></div>
          <div className="mt-4 flex flex-col gap-3">{RULES.map((rule,i)=><div key={rule} className="flex gap-3 text-xs leading-relaxed text-muted-foreground"><span className="font-mono-tech text-[10px] text-neon-green">M{i+1}</span><span>{rule}</span></div>)}</div>
        </div>
        <div className="rounded-sm border border-border/50 bg-surface/20 p-5 sm:p-6">
          <div className="flex items-center gap-2 border-b border-border/40 pb-4"><Radar className="h-4 w-4 text-neon-green" /><h2 className="font-mono-tech text-xs tracking-widest text-foreground uppercase">CHANNEL MATRIX</h2></div>
          <div className="mt-4 divide-y divide-border/25">{CHANNELS.map(c=><div key={c.name} className="py-3"><div className="flex items-center justify-between gap-3"><span className="font-mono-tech text-[10px] text-neon-cyan">{c.name}</span><span className="font-mono-tech text-[9px] text-muted-foreground">{c.format}</span></div><div className="mt-1 text-xs text-foreground/85">{c.role}</div><div className="mt-1 text-[11px] text-muted-foreground">PRIORITY → {c.priority}</div></div>)}</div>
        </div>
      </section>
    </div>
  );
}
