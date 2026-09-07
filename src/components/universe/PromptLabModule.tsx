import { useState } from "react";
import { Check, Clipboard, FlaskConical, Layers3, Sparkles, WandSparkles } from "lucide-react";

const PROMPTS = [
  {
    id: "humanized",
    title: "VERONICA / HUMANIZED CANON",
    category: "IMAGE",
    purpose: "Gerar a presença humana oficial da Verônica com continuidade visual.",
    text: "Create the canonical humanized representation of Veronica, an advanced AI mentor and strategic intelligence persona. Elegant contemporary woman, credible natural presence, intelligent calm expression, refined minimal wardrobe with subtle futuristic AI detailing, premium editorial lighting, realistic skin texture, sophisticated but approachable posture, dark neutral environment with restrained green/cyan intelligence accents. Avoid cyberpunk clichés, glossy synthetic skin, excessive neon, stock-photo posing or seductive styling. The result must feel like one consistent AI brand persona, not a real-world celebrity or public figure.",
  },
  {
    id: "hero",
    title: "HUB / HERO MOTION",
    category: "VIDEO",
    purpose: "Direção de movimento institucional para a hero da Home.",
    text: "Create a premium 16:9 institutional hero shot for Veronica Hub. Veronica is alive and present, not posing for a still photograph. Begin with a composed medium shot, subtle breathing and eye focus, then a restrained camera drift reveals an intelligent learning environment. Motion is slow, cinematic and seamless for web looping. Minimal dark architecture, soft practical light, discreet green/cyan AI signals, realistic fabric and skin, no hologram overload, no sci-fi spectacle, no abrupt cuts. End on a frame that can continue naturally into the next generation.",
  },
  {
    id: "wire",
    title: "WIRE / EDITORIAL DRAFT",
    category: "EDITORIAL",
    purpose: "Transformar um fato pesquisado em rascunho verificável do Veronica Wire.",
    text: "Act as Veronica Wire's editorial intelligence. Separate confirmed facts, context, uncertainty and implications. Write with sober investigative clarity, no sensationalism and no invented authority. Lead with what is actually new, identify what is known versus alleged, and explain why it matters. Preserve source traceability. If evidence is insufficient, say so explicitly rather than filling gaps.",
  },
  {
    id: "course",
    title: "HUB / LESSON ARCHITECT",
    category: "EDUCATION",
    purpose: "Estruturar uma aula da Veronica Hub orientada à aplicação.",
    text: "Design a Veronica Hub lesson that turns a complex AI topic into practical capability. Structure: outcome, context, concept in plain language, guided demonstration, realistic exercise, common mistakes, verification checklist, and one concrete next action. Keep the tone sophisticated but accessible. Avoid hype, unnecessary jargon and passive lecture structure. The student should leave able to do something they could not do before.",
  },
  {
    id: "decision",
    title: "UNIVERSE / BRAND REVIEW",
    category: "GOVERNANCE",
    purpose: "Revisar uma ideia contra o cânone sem alterar nada automaticamente.",
    text: "Review the proposed initiative against Veronica Universe canon. Evaluate practical intelligence, brand coherence, evidence behind the promise, functional use of technology, and ecosystem-wide scalability. Return: strengths, conflicts, risks, required adjustments, and recommendation (aligned / revise / do not advance). This is advisory only; do not assume authority to publish, approve or modify any asset.",
  },
] as const;

export function PromptLabModule() {
  const [copied, setCopied] = useState<string | null>(null);

  async function copyPrompt(id: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      window.setTimeout(() => setCopied((current) => (current === id ? null : current)), 1800);
    } catch {
      setCopied(null);
    }
  }

  return (
    <div className="flex flex-col gap-8" data-universe-element="prompt-lab">
      <header className="border-b border-border/40 pb-6">
        <div className="font-mono-tech text-[10px] tracking-[0.18em] text-neon-green uppercase">MODULE 07 / PROMPT LAB</div>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">Prompt Lab</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">Biblioteca de diretivas canônicas para imagem, vídeo, ensino, editorial e governança. V1 é curada e manual: sem execução autônoma.</p>
      </header>

      <section className="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
        <div className="rounded-sm border border-neon-green/25 bg-neon-green/[0.035] p-6 sm:p-8">
          <div className="flex items-center gap-2 font-mono-tech text-[10px] tracking-widest text-neon-green uppercase"><FlaskConical className="h-4 w-4" /> LAB PRINCIPLE</div>
          <p className="mt-5 font-display text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl">Prompt bom preserva intenção, não só aparência.</p>
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground">Os templates abaixo carregam o cânone do Universe para diferentes modelos sem depender de um único provedor.</p>
        </div>
        <div className="rounded-sm border border-border/50 bg-surface/20 p-5 sm:p-6">
          <div className="flex items-center gap-2 border-b border-border/40 pb-4"><Layers3 className="h-4 w-4 text-neon-cyan" /><h2 className="font-mono-tech text-xs tracking-widest text-foreground uppercase">PROMPT STACK</h2></div>
          <div className="mt-4 flex flex-col gap-2.5 font-mono-tech text-[10px] text-muted-foreground">
            <div className="rounded-sm border border-border/30 bg-background/40 p-3"><span className="text-neon-green">01</span> · IDENTITY / who Veronica is</div>
            <div className="rounded-sm border border-border/30 bg-background/40 p-3"><span className="text-neon-green">02</span> · CONTEXT / which product or channel</div>
            <div className="rounded-sm border border-border/30 bg-background/40 p-3"><span className="text-neon-green">03</span> · INTENT / what outcome matters</div>
            <div className="rounded-sm border border-border/30 bg-background/40 p-3"><span className="text-neon-green">04</span> · CONSTRAINTS / what must not drift</div>
            <div className="rounded-sm border border-border/30 bg-background/40 p-3"><span className="text-neon-green">05</span> · OUTPUT / exact deliverable</div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {PROMPTS.map((prompt) => (
          <article key={prompt.id} className="flex flex-col rounded-sm border border-border/45 bg-surface/20 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/35 pb-4">
              <div><span className="font-mono-tech text-[9px] tracking-widest text-neon-cyan">{prompt.category}</span><h2 className="mt-1 font-mono-tech text-xs font-semibold tracking-wider text-foreground">{prompt.title}</h2></div>
              <button type="button" onClick={() => copyPrompt(prompt.id, prompt.text)} className="inline-flex items-center gap-1.5 rounded-sm border border-border/50 bg-background/50 px-2.5 py-1.5 font-mono-tech text-[9px] text-muted-foreground transition hover:border-neon-green/40 hover:text-neon-green">{copied === prompt.id ? <Check className="h-3 w-3" /> : <Clipboard className="h-3 w-3" />}{copied === prompt.id ? "COPIED" : "COPY"}</button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">{prompt.purpose}</p>
            <div className="mt-4 flex-1 rounded-sm border border-border/30 bg-background/50 p-4 font-mono-tech text-[10px] leading-relaxed text-foreground/80">{prompt.text}</div>
          </article>
        ))}
      </section>

      <section className="rounded-sm border border-border/40 bg-background/40 p-5">
        <div className="flex items-center gap-2 font-mono-tech text-[10px] tracking-widest text-muted-foreground"><WandSparkles className="h-4 w-4 text-neon-green" /> MODEL-AGNOSTIC RULE</div>
        <p className="mt-3 text-xs leading-relaxed text-foreground/85">Os prompts canônicos descrevem intenção e restrições da marca. Adaptações específicas para Seedance, Veo, Firefly, Nano Banana, OpenAI ou outros modelos devem ficar numa camada de adapter, sem reescrever o cânone central.</p>
      </section>
    </div>
  );
}
