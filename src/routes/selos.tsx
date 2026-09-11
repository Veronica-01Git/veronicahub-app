import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, Building2, GraduationCap, ScanLine, ShieldCheck } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { VeronicaSeal } from "@/components/VeronicaSeal";
import { sealRecords } from "@/lib/seals";

export const Route = createFileRoute("/selos")({
  component: SealRegistry,
  head: () => ({ meta: [
    { title: "Registro de Procedência Digital | Veronica Hub" },
    { name: "description", content: "Consulte soluções e materiais registrados pela Veronica Hub e YO LAB & CO. por número de série." },
  ] }),
});

const realRecords = sealRecords.filter((record) => !record.isDemonstration);
const concepts = sealRecords.filter((record) => record.isDemonstration);

function RecordCard({ record, index }: { record: (typeof sealRecords)[number]; index: number }) {
  const Icon = record.category.includes("Educação") ? GraduationCap : Building2;
  return (
    <Link
      to="/selo/$serial"
      params={{ serial: record.serial }}
      className="group relative grid overflow-hidden rounded-sm border border-border/60 bg-surface/60 transition duration-300 hover:-translate-y-1 hover:border-neon-green/60 hover:shadow-glow-green sm:grid-cols-[9rem_1fr]"
    >
      <div className="relative flex min-h-36 items-center justify-center overflow-hidden border-b border-border/50 bg-background/60 sm:border-b-0 sm:border-r">
        <div aria-hidden className="absolute inset-0 opacity-50 [background-image:linear-gradient(oklch(0.85_0.22_155/.08)_1px,transparent_1px),linear-gradient(90deg,oklch(0.85_0.22_155/.08)_1px,transparent_1px)] [background-size:18px_18px]" />
        <VeronicaSeal serialNumber={record.serial} issuedDate={record.issuedAt} productName={record.isDemonstration ? "CONCEITO" : "SOLUÇÃO IA"} size="sm" className="relative transition duration-500 group-hover:scale-105" />
      </div>
      <div className="flex flex-col p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-mono-tech text-[10px] uppercase tracking-[.18em] text-neon-cyan">Registro {String(index + 1).padStart(2, "0")}</span>
          <span className={`rounded-full border px-2.5 py-1 font-mono-tech text-[9px] uppercase tracking-widest ${record.isDemonstration ? "border-border text-muted-foreground" : "border-neon-green/50 bg-neon-green/[.07] text-neon-green"}`}>{record.statusLabel}</span>
        </div>
        <div className="mt-5 flex items-center gap-2 text-muted-foreground"><Icon className="h-4 w-4" /><span className="text-xs">{record.category}</span></div>
        <h3 className="mt-2 font-display text-2xl leading-none">{record.client}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{record.solution}</p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-5 font-mono-tech text-[10px] uppercase tracking-widest">
          <span className="text-muted-foreground">{record.serial}</span>
          <span className="flex items-center gap-1.5 text-neon-green">Verificar <ArrowRight className="h-3 w-3 transition group-hover:translate-x-1" /></span>
        </div>
      </div>
    </Link>
  );
}

function SealRegistry() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden border-b border-border/40 py-16 md:py-24">
          <div aria-hidden className="pointer-events-none absolute inset-0 opacity-80 [background:radial-gradient(circle_at_75%_20%,oklch(0.85_0.22_155/.14),transparent_30%),radial-gradient(circle_at_10%_0%,oklch(0.88_0.15_195/.10),transparent_30%)]" />
          <div className="relative mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[1fr_.72fr] lg:items-end">
            <div>
              <div className="flex items-center gap-3 font-mono-tech text-[11px] uppercase tracking-[.2em] text-neon-green"><span className="h-px w-8 bg-neon-green" />Veronica Trust Layer</div>
              <h1 className="mt-5 max-w-4xl font-display text-5xl leading-[.92] tracking-[-.055em] sm:text-6xl md:text-7xl">Procedência que pode ser <span className="text-neon-green text-glow-green">verificada.</span></h1>
              <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground">Cada número de série registra autoria, escopo, versão e estágio de uma entrega. O selo comprova procedência — não promete resultados comerciais.</p>
            </div>
            <div className="grid grid-cols-3 gap-px overflow-hidden rounded-sm border border-border/60 bg-border/60">
              {[{ n: realRecords.length, label: "Projeto real" }, { n: "3", label: "Estados" }, { n: "100%", label: "Rastreável" }].map((item) => <div key={item.label} className="bg-background/90 p-4 text-center"><div className="font-display text-2xl text-neon-cyan">{item.n}</div><div className="mt-1 font-mono-tech text-[9px] uppercase tracking-widest text-muted-foreground">{item.label}</div></div>)}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-16 md:py-24">
          <div className="mb-8 flex items-end justify-between gap-6"><div><div className="font-mono-tech text-[10px] uppercase tracking-[.2em] text-neon-green">Registro oficial</div><h2 className="mt-3 font-display text-4xl tracking-[-.04em]">Soluções registradas</h2></div><BadgeCheck className="hidden h-9 w-9 text-neon-green sm:block" /></div>
          <div className="grid gap-5 lg:grid-cols-2">{realRecords.map((record, index) => <RecordCard key={record.serial} record={record} index={index} />)}</div>
        </section>

        <section className="border-y border-border/40 bg-surface/30 py-16 md:py-20">
          <div className="mx-auto max-w-7xl px-6">
            <div className="max-w-3xl"><div className="font-mono-tech text-[10px] uppercase tracking-[.2em] text-neon-cyan">Laboratório de possibilidades</div><h2 className="mt-3 font-display text-4xl tracking-[-.04em]">Aplicações demonstrativas</h2><p className="mt-4 leading-relaxed text-muted-foreground">Os registros abaixo são cenários fictícios criados para demonstrar aplicações em outros setores. As organizações não existem e não são clientes.</p></div>
            <div className="mt-9 grid gap-5 lg:grid-cols-2">{concepts.map((record, index) => <RecordCard key={record.serial} record={record} index={index + realRecords.length} />)}</div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-px px-6 py-16 md:grid-cols-3 md:py-24">
          {[{ icon: ScanLine, title: "Leia o serial", text: "O QR Code ou endereço conduz ao registro único da entrega." }, { icon: ShieldCheck, title: "Confira o escopo", text: "Cliente, solução, versão e etapa aparecem de forma transparente." }, { icon: BadgeCheck, title: "Valide a procedência", text: "A página confirma autoria e implantação sem alegações de desempenho." }].map((item) => <article key={item.title} className="border border-border/60 bg-surface/40 p-7"><item.icon className="h-6 w-6 text-neon-green" /><h3 className="mt-5 font-display text-2xl">{item.title}</h3><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.text}</p></article>)}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
