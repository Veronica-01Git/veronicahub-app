import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, BadgeCheck, Building2, Check, CircleDot, Copy, Database, ExternalLink, FileText, MessageSquare, Network, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { VeronicaSeal } from "@/components/VeronicaSeal";
import { SealAtmosphere } from "@/components/seals/SealAtmosphere";
import { findSeal, SEAL_STATUS_COPY } from "@/lib/seals";

export const Route = createFileRoute("/selo/$serial")({
  component: SealVerification,
});

function SealVerification() {
  const { serial } = Route.useParams();
  const record = findSeal(serial);
  const [copied, setCopied] = useState(false);

  if (!record) return <UnknownSeal serial={serial} />;

  const verificationUrl = `https://veronicahub.com/selo/${record.serial}`;
  const isConcept = Boolean(record.isDemonstration);
  const activeStepIndex = Math.max(0, record.timeline.findIndex((event) => event.state === "current"));
  const progress = Math.round(((activeStepIndex + 1) / record.timeline.length) * 100);
  async function copyVerification() {
    await navigator.clipboard.writeText(verificationUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="home-hybrid min-h-screen overflow-x-hidden bg-background text-foreground">
      <SiteHeader />
      <main>
        <section className="relative isolate overflow-hidden border-b border-border/70 py-12 md:py-20">
          <SealAtmosphere />
          <div aria-hidden className="absolute inset-0 opacity-70 [background:radial-gradient(circle_at_70%_20%,oklch(0.85_0.22_155/.16),transparent_34%)]" />
          <div className="relative mx-auto max-w-7xl px-6">
            <Link to="/selos" className="inline-flex min-h-11 items-center gap-2 font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground transition hover:text-neon-green"><ArrowLeft className="h-3.5 w-3.5" /> Registro de selos</Link>
            <div className="mt-8 grid gap-10 lg:grid-cols-[23rem_1fr] lg:items-center">
              <div className="group relative flex min-h-[23rem] items-center justify-center overflow-hidden rounded-sm border border-neon-cyan/25 bg-white/55 [perspective:900px] shadow-[0_35px_120px_oklch(0.56_0.13_195/.13)] backdrop-blur-xl">
                <div aria-hidden className="absolute inset-0 opacity-60 [background-image:linear-gradient(oklch(0.85_0.22_155/.08)_1px,transparent_1px),linear-gradient(90deg,oklch(0.85_0.22_155/.08)_1px,transparent_1px)] [background-size:22px_22px]" />
                <div aria-hidden className="absolute h-64 w-64 rounded-full bg-neon-green/10 blur-3xl" />
                <div aria-hidden className="absolute h-[19rem] w-[19rem] rounded-full border border-neon-green/25 motion-safe:animate-[spin_24s_linear_infinite] before:absolute before:inset-4 before:rounded-full before:border before:border-dashed before:border-neon-cyan/30" />
                <div className="relative transition-transform duration-700 [transform:rotateX(4deg)_rotateY(-5deg)] group-hover:[transform:rotateX(0deg)_rotateY(0deg)_scale(1.025)]">
                  <div aria-hidden className="absolute inset-[12%] rounded-full bg-gradient-to-br from-neon-cyan/25 via-transparent to-neon-green/20 blur-2xl" />
                  <VeronicaSeal serialNumber={record.serial} issuedTo={record.client} issuedDate={record.issuedAt} productName={isConcept ? "CONCEITO" : "SOLUÇÃO IA"} size="lg" className="relative drop-shadow-[0_30px_45px_oklch(0.58_0.17_155/.24)]" />
                  <div aria-hidden className="absolute inset-[7%] rounded-full bg-gradient-to-tr from-transparent via-white/30 to-transparent opacity-70 mix-blend-screen motion-safe:animate-pulse" />
                </div>
              </div>
              <div>
                <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono-tech text-[10px] uppercase tracking-[.18em] ${isConcept ? "border-border text-muted-foreground" : "border-neon-green/50 bg-neon-green/[.07] text-neon-green"}`}><CircleDot className="h-3 w-3" />{record.statusLabel}</div>
                {isConcept && <div className="mt-5 rounded-sm border border-amber-400/40 bg-amber-400/[.06] p-4 text-sm leading-relaxed text-amber-200"><strong>Registro demonstrativo.</strong> Esta marca é fictícia e não representa cliente, contrato ou implantação real.</div>}
                <h1 className="mt-6 font-display text-5xl leading-[.94] tracking-[-.05em] sm:text-6xl">{record.client}</h1>
                <p className="mt-4 text-xl text-neon-cyan">{record.solution}</p>
                <p className="mt-5 max-w-2xl leading-relaxed text-muted-foreground">{record.summary}</p>
                <div className="mt-7 flex flex-wrap gap-3"><button type="button" onClick={copyVerification} className="inline-flex min-h-11 items-center gap-2 rounded-sm bg-neon-green px-5 font-mono-tech text-[10px] uppercase tracking-widest text-primary-foreground shadow-glow-green transition hover:brightness-110">{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{copied ? "Link copiado" : "Copiar verificação"}</button>{record.serial === "VH-AUT-WA-2026-000001" && <Link to="/clientes/express-entulho/proposta" className="inline-flex min-h-11 items-center gap-2 rounded-sm border border-neon-green/45 bg-white/55 px-5 font-mono-tech text-[10px] uppercase tracking-widest text-neon-green transition hover:bg-neon-green/[.08]"><FileText className="h-3.5 w-3.5" />Abrir proposta</Link>}<a href={verificationUrl} className="inline-flex min-h-11 items-center gap-2 rounded-sm border border-border/70 px-5 font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground transition hover:border-neon-cyan/60 hover:text-neon-cyan">Abrir endereço oficial <ExternalLink className="h-3.5 w-3.5" /></a></div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-16 md:py-24">
          <div className="grid gap-8 lg:grid-cols-[1fr_.78fr]">
            <div><div className="font-mono-tech text-[10px] uppercase tracking-[.2em] text-neon-green">Escopo registrado</div><h2 className="mt-3 font-display text-4xl tracking-[-.04em]">O que este serial identifica</h2><ul className="mt-8 grid gap-3 sm:grid-cols-2">{record.scope.map((item) => <li key={item} className="flex min-h-20 items-start gap-3 rounded-sm border border-border/60 bg-surface/40 p-5 text-sm leading-relaxed"><Check className="mt-0.5 h-4 w-4 shrink-0 text-neon-green" />{item}</li>)}</ul></div>
            <dl className="grid content-start overflow-hidden rounded-sm border border-border/60 bg-border/50">{[["Número de série", record.serial], ["Categoria", record.category], ["Versão", record.version], ["Registro", record.issuedAt], ["Desenvolvedor", record.provider], ...(record.support ? [["Suporte", record.support]] : [])].map(([term, value]) => <div key={term} className="grid gap-1 bg-background p-5 sm:grid-cols-[8rem_1fr]"><dt className="font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground">{term}</dt><dd className="text-sm">{value}</dd></div>)}</dl>
          </div>

          <div className="mt-16 border-t border-border/50 pt-12">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div><div className="font-mono-tech text-[10px] uppercase tracking-[.2em] text-neon-cyan">Cronograma de implantação</div><h2 className="mt-3 font-display text-4xl tracking-[-.04em]">Progresso até a entrega</h2></div>
              <div className="font-mono-tech text-xs uppercase tracking-widest text-muted-foreground"><span className="text-neon-green">{progress}%</span> do ciclo sinalizado</div>
            </div>
            <div className="mt-7 h-2 overflow-hidden rounded-full bg-border/50" role="progressbar" aria-label="Progresso do projeto" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><div className="h-full rounded-full bg-gradient-to-r from-neon-green to-neon-cyan shadow-glow-green transition-[width] duration-700" style={{ width: `${progress}%` }} /></div>
            <div className="mt-7 grid gap-4 md:grid-cols-5">{record.timeline.map((event, index) => <article key={`${event.date}-${event.label}`} className={`relative min-h-44 overflow-hidden rounded-sm border p-5 ${event.state === "current" ? "border-neon-green/60 bg-neon-green/[.08] shadow-[0_22px_70px_oklch(0.58_0.17_155/.12)]" : event.state === "done" ? "border-neon-cyan/35 bg-neon-cyan/[.05]" : "border-border/60 bg-surface/40"}`}><span aria-hidden className="absolute right-3 top-2 font-display text-5xl text-neon-green/[.08]">0{index + 1}</span><div className="font-mono-tech text-[10px] uppercase tracking-widest text-neon-cyan">{event.date}</div><div className="mt-8 text-sm font-medium leading-relaxed">{event.label}</div><div className={`mt-5 inline-flex items-center gap-2 font-mono-tech text-[9px] uppercase tracking-widest ${event.state === "current" ? "text-neon-green" : "text-muted-foreground"}`}><span className={`h-1.5 w-1.5 rounded-full ${event.state === "current" ? "bg-neon-green animate-pulse" : event.state === "done" ? "bg-neon-cyan" : "bg-border"}`} />{event.state === "current" ? "Em andamento" : event.state === "done" ? "Concluído" : "Próxima etapa"}</div></article>)}</div>
          </div>

          {record.operations && (
            <section className="mt-16 overflow-hidden rounded-sm border border-neon-cyan/25 bg-[radial-gradient(circle_at_85%_10%,oklch(0.56_0.13_195/.14),transparent_34%),linear-gradient(135deg,white,oklch(0.97_0.01_180))] p-6 shadow-[0_30px_100px_oklch(0.56_0.13_195/.1)] md:p-9">
              <div className="grid gap-9 lg:grid-cols-[1fr_.9fr]">
                <div><div className="inline-flex items-center gap-2 font-mono-tech text-[10px] uppercase tracking-[.2em] text-neon-cyan"><Network className="h-4 w-4" /> Arquitetura da solução</div><h2 className="mt-4 font-display text-4xl tracking-[-.04em]">{record.operations.product}</h2><p className="mt-3 font-mono-tech text-xs uppercase tracking-widest text-neon-green">{record.operations.model}</p><p className="mt-6 max-w-2xl leading-relaxed text-muted-foreground">{record.operations.summary}</p><div className="mt-7 grid gap-3 sm:grid-cols-2">{record.operations.environments.map((item) => <div key={item} className="flex items-center gap-3 rounded-sm border border-border/60 bg-white/60 p-4 text-sm"><Building2 className="h-4 w-4 shrink-0 text-neon-green" />{item}</div>)}</div></div>
                <div className="grid content-start gap-4"><div className="rounded-sm border border-border/60 bg-white/65 p-6"><div className="flex items-center gap-2 font-mono-tech text-[10px] uppercase tracking-widest text-neon-cyan"><Database className="h-4 w-4" /> Núcleo operacional</div><div className="mt-5 flex flex-wrap gap-2">{record.operations.endpoints.map((item) => <span key={item} className="rounded-full border border-neon-cyan/25 bg-neon-cyan/[.05] px-3 py-2 text-xs text-muted-foreground">{item}</span>)}</div></div><div className="rounded-sm border border-border/60 bg-white/65 p-6"><div className="flex items-center gap-2 font-mono-tech text-[10px] uppercase tracking-widest text-neon-green"><MessageSquare className="h-4 w-4" /> Canais preparados</div><div className="mt-5 flex flex-wrap gap-2">{record.operations.channels.map((item) => <span key={item} className="rounded-full border border-neon-green/25 bg-neon-green/[.05] px-3 py-2 text-xs text-muted-foreground">{item}</span>)}</div></div><p className="text-xs leading-relaxed text-muted-foreground">A Express Entulho é a implantação inaugural. Cada empresa terá ambiente e dados separados; os conectores serão ativados somente após validação e autorização.</p></div>
              </div>
            </section>
          )}

          <div className="mt-12 flex items-start gap-3 rounded-sm border border-border/60 bg-surface/30 p-5 text-sm leading-relaxed text-muted-foreground"><BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-neon-green" /><p><strong className="text-foreground">O que a verificação significa:</strong> {SEAL_STATUS_COPY[record.status]} O registro confirma procedência, identidade do projeto e escopo declarado. Não é certificação governamental, auditoria independente ou garantia de resultado financeiro.</p></div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function UnknownSeal({ serial }: { serial: string }) {
  return <div className="min-h-screen bg-background text-foreground"><SiteHeader /><main className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center px-6 text-center"><ShieldAlert className="h-14 w-14 text-destructive" /><div className="mt-6 font-mono-tech text-[10px] uppercase tracking-[.2em] text-muted-foreground">Consulta · {serial}</div><h1 className="mt-4 font-display text-5xl tracking-[-.04em]">Registro não encontrado.</h1><p className="mt-5 max-w-xl leading-relaxed text-muted-foreground">Confira o número impresso no selo ou leia novamente o QR Code. A ausência do registro não comprova procedência.</p><Link to="/selos" className="mt-8 inline-flex min-h-11 items-center gap-2 rounded-sm border border-neon-green/50 px-5 font-mono-tech text-[10px] uppercase tracking-widest text-neon-green"><ArrowLeft className="h-3.5 w-3.5" /> Voltar ao registro</Link></main><SiteFooter /></div>;
}
