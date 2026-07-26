import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { VeronicaSeal } from "@/components/VeronicaSeal";

// Rota temporária, só pra conferir o visual do selo antes de aplicar em
// produção. Não está no menu (ECOSYSTEM_LINKS) de propósito — remover esta
// rota quando o selo já estiver validado e aplicado nos lugares certos.
export const Route = createFileRoute("/selo-demo")({
  component: SeloDemo,
});

const EXAMPLE = {
  serialNumber: "VH-2026-000001",
  issuedTo: "Maria Ferreira",
  issuedDate: "24/07/2026",
  productName: "Currículo ATS",
};

function SeloDemo() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <SiteHeader />

      <section className="mx-auto max-w-5xl px-6 py-16 md:py-24">
        <div className="mb-3 flex items-center gap-3 font-mono-tech text-[11px] uppercase tracking-widest text-neon-cyan">
          <span className="h-px w-8 bg-neon-cyan" />
          Rota temporária · não está no menu
        </div>
        <h1 className="font-display text-3xl sm:text-4xl" style={{ letterSpacing: "-0.03em" }}>
          Selo Veronica — demo
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-[1.6] text-muted-foreground">
          Visualização do componente <code className="rounded-sm bg-surface px-1.5 py-0.5 text-[12px]">VeronicaSeal</code> com
          dados de exemplo, nos três tamanhos e nos dois contextos de uso (UI escura e papel).
        </p>

        {/* Tamanho grande — como ficaria num documento */}
        <div className="mt-14">
          <div className="mb-4 font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground">
            Tamanho grande (lg) · uso em documento
          </div>
          <div className="flex flex-col items-start gap-8 rounded-sm border border-border/60 bg-surface/60 p-8 sm:flex-row sm:items-center">
            <VeronicaSeal {...EXAMPLE} size="lg" />
            <div className="max-w-sm">
              <p className="text-sm leading-[1.6] text-muted-foreground">
                Placa própria (fundo claro) e tinta em verde escuro — sem depender de glow ou opacidade baixa,
                pra continuar legível impresso em papel branco.
              </p>
            </div>
          </div>
        </div>

        {/* Comparação de tamanhos */}
        <div className="mt-14">
          <div className="mb-4 font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground">
            Comparação de tamanhos
          </div>
          <div className="flex flex-wrap items-end gap-8 rounded-sm border border-border/60 bg-surface/60 p-8">
            <div className="flex flex-col items-center gap-2">
              <VeronicaSeal {...EXAMPLE} size="sm" />
              <span className="font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground">sm</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <VeronicaSeal {...EXAMPLE} size="md" />
              <span className="font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground">md</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <VeronicaSeal {...EXAMPLE} size="lg" />
              <span className="font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground">lg</span>
            </div>
          </div>
        </div>

        {/* Uso 1 — card de produto na UI */}
        <div className="mt-14">
          <div className="mb-4 font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground">
            Uso 1 · card de produto certificado (UI escura)
          </div>
          <div className="flex max-w-md items-center gap-5 rounded-sm border border-neon-green/40 bg-gradient-to-br from-neon-green/8 via-surface/70 to-surface p-6 backdrop-blur">
            <VeronicaSeal {...EXAMPLE} size="sm" />
            <div>
              <div className="font-display text-lg text-foreground" style={{ letterSpacing: "-0.02em" }}>
                {EXAMPLE.productName}
              </div>
              <p className="mt-1 text-[13px] leading-[1.5] text-muted-foreground">
                Certificado original, verificável pelo número de série.
              </p>
            </div>
          </div>
        </div>

        {/* Uso 2 — simulação de papel/documento impresso */}
        <div className="mt-14">
          <div className="mb-4 font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground">
            Uso 2 · simulação de página impressa (fundo branco)
          </div>
          <div className="flex items-center justify-center rounded-sm border border-border/60 bg-white p-10">
            <VeronicaSeal {...EXAMPLE} size="md" />
          </div>
        </div>

        {/* Sem issuedTo */}
        <div className="mt-14">
          <div className="mb-4 font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground">
            Sem <code className="rounded-sm bg-surface px-1.5 py-0.5 text-[11px]">issuedTo</code> (prop opcional)
          </div>
          <div className="flex items-center rounded-sm border border-border/60 bg-surface/60 p-8">
            <VeronicaSeal
              serialNumber="VH-2026-000002"
              issuedDate="24/07/2026"
              productName="Comando Hacking Ético"
              size="md"
            />
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
