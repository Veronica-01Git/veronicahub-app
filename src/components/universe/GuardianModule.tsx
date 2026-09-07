import { useMemo, useState } from "react";
import { Eye, Shield, ShieldCheck, TriangleAlert } from "lucide-react";

const CHECKS = [
  { id: "essence", label: "ESSENCE", text: "O ativo respeita propósito, promessa e princípios não negociáveis?" },
  { id: "character", label: "CHARACTER", text: "A Verônica se comporta de acordo com o papel e os limites do Character Bible?" },
  { id: "visual", label: "VISUAL", text: "A linguagem visual segue a gramática do sistema sem cair em clichê ou ruído?" },
  { id: "voice", label: "VOICE", text: "Tom, cadência e nível de certeza estão coerentes com o produto e o contexto?" },
  { id: "media", label: "MEDIA", text: "Imagem, vídeo ou referência têm função, origem e uso coerentes?" },
  { id: "prompt", label: "PROMPT", text: "A diretiva preserva intenção e restrições canônicas em vez de apenas copiar estética?" },
  { id: "decision", label: "DECISION", text: "A iniciativa passou pelos filtros de utilidade, coerência, evidência, função e escala?" },
] as const;

type CheckId = (typeof CHECKS)[number]["id"];
type AuditState = Record<CheckId, boolean>;

const INITIAL: AuditState = {
  essence: false,
  character: false,
  visual: false,
  voice: false,
  media: false,
  prompt: false,
  decision: false,
};

export function GuardianModule() {
  const [assetName, setAssetName] = useState("");
  const [audit, setAudit] = useState<AuditState>(INITIAL);
  const passed = useMemo(() => Object.values(audit).filter(Boolean).length, [audit]);
  const score = Math.round((passed / CHECKS.length) * 100);
  const status = score === 100 ? "CANONICAL PASS" : score >= 70 ? "REVIEW REQUIRED" : "CONFLICT DETECTED";

  return (
    <div className="flex flex-col gap-8" data-universe-element="guardian">
      <header className="border-b border-border/40 pb-6">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <div className="font-mono-tech text-[10px] tracking-[0.18em] text-neon-green uppercase">MODULE 09 / GUARDIAN</div>
            <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">Guardian</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">Auditoria passiva do cânone. A versão atual apenas ajuda a revisar; não bloqueia, publica, altera ou executa nada no ecossistema.</p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-neon-cyan/30 bg-neon-cyan/5 px-3 py-1 font-mono-tech text-[10px] tracking-widest text-neon-cyan uppercase"><Eye className="h-3.5 w-3.5" /> PASSIVE AUDIT / ACTIVE</span>
        </div>
      </header>

      <section className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        <div className="rounded-sm border border-border/50 bg-surface/20 p-5 sm:p-7">
          <div className="flex items-center gap-2 border-b border-border/40 pb-4"><Shield className="h-4 w-4 text-neon-green" /><h2 className="font-mono-tech text-xs tracking-widest text-foreground uppercase">CANONICAL AUDIT CHECKLIST</h2></div>
          <label className="mt-5 block font-mono-tech text-[10px] tracking-widest text-muted-foreground uppercase">Asset / initiative under audit</label>
          <input value={assetName} onChange={(event) => setAssetName(event.target.value)} placeholder="Ex: hero institucional da Veronica Hub" className="mt-2 w-full rounded-sm border border-border/50 bg-background/60 px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-neon-green/50" />

          <div className="mt-6 flex flex-col gap-3">
            {CHECKS.map((check) => (
              <label key={check.id} className={`flex cursor-pointer gap-3 rounded-sm border p-4 transition ${audit[check.id] ? "border-neon-green/30 bg-neon-green/[0.035]" : "border-border/35 bg-background/40 hover:border-border/60"}`}>
                <input type="checkbox" checked={audit[check.id]} onChange={(event) => setAudit((current) => ({ ...current, [check.id]: event.target.checked }))} className="mt-0.5 h-4 w-4 accent-current" />
                <div>
                  <div className="font-mono-tech text-[10px] tracking-widest text-neon-cyan">{check.label}</div>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{check.text}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <aside className="flex flex-col gap-4">
          <div className="rounded-sm border border-neon-cyan/25 bg-neon-cyan/[0.035] p-6">
            <div className="flex items-center gap-2 font-mono-tech text-[10px] tracking-widest text-neon-cyan uppercase"><ShieldCheck className="h-4 w-4" /> COMPLIANCE SCORE</div>
            <div className="mt-4 font-display text-6xl font-bold tracking-tight text-foreground">{score}<span className="text-2xl text-muted-foreground">%</span></div>
            <div className="mt-5 h-2 overflow-hidden bg-border/30"><div className="h-full bg-neon-cyan transition-all duration-300" style={{ width: `${score}%` }} /></div>
            <div className={`mt-5 inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono-tech text-[10px] tracking-widest ${score === 100 ? "border-neon-green/30 bg-neon-green/5 text-neon-green" : score >= 70 ? "border-neon-cyan/30 bg-neon-cyan/5 text-neon-cyan" : "border-border/50 bg-muted/20 text-muted-foreground"}`}>
              {score === 100 ? <ShieldCheck className="h-3.5 w-3.5" /> : <TriangleAlert className="h-3.5 w-3.5" />}{status}
            </div>
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">{score === 100 ? "Todos os domínios canônicos foram revisados manualmente. A aprovação final continua humana." : "Existem domínios ainda não validados. Revise antes de considerar o ativo alinhado."}</p>
          </div>

          <div className="rounded-sm border border-border/50 bg-surface/20 p-5">
            <div className="font-mono-tech text-[10px] tracking-widest text-muted-foreground uppercase">AUDIT CONTEXT</div>
            <div className="mt-3 rounded-sm border border-border/30 bg-background/40 p-3 text-xs leading-relaxed text-foreground/85">{assetName.trim() || "Nenhum ativo nomeado ainda."}</div>
            <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">Esta auditoria não é persistida e não dispara nenhuma automação. É deliberadamente passiva nesta fase.</p>
          </div>

          <button type="button" onClick={() => { setAssetName(""); setAudit(INITIAL); }} className="rounded-sm border border-border/50 bg-background/40 px-4 py-2.5 font-mono-tech text-[10px] tracking-widest text-muted-foreground transition hover:border-neon-green/40 hover:text-neon-green">RESET AUDIT</button>
        </aside>
      </section>
    </div>
  );
}
