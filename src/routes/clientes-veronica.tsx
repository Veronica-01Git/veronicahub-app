/**
 * Clientes Veronica — a vitrine PÚBLICA de quem a Veronica já atendeu.
 *
 * MORA EM /clientes-veronica, E NÃO EM /clientes, DE PROPÓSITO. Esta página
 * nasceu em /clientes em 21/09, antes de eu ver que a main já tinha ali o
 * portal PRIVADO — aquele onde o cliente digita o número do selo e entra no
 * espaço dele. As duas coisas são opostas e não cabem na mesma URL: uma diz
 * "olhe quem a Veronica atende" para o mundo, a outra pede credencial. O
 * portal privado ficou com /clientes, que é o endereço que os clientes já
 * recebem, e a vitrine veio para cá.
 *
 * ELA SÓ MOSTRA O QUE É PÚBLICO. As entregas marcadas como privadas ficam
 * fora: convidar o visitante para uma porta que vai recusá-lo é pior que não
 * mostrar a porta. Quem é cliente entra por /clientes, com o selo.
 *
 * A lista de clientes NÃO é escrita aqui. Ela sai de `sealRecords`, que é o
 * registro de procedência — a mesma fonte de /selos. Assim não existem duas
 * listas de clientes podendo divergir, e um cliente só aparece nesta página
 * se tiver selo emitido.
 *
 * `isDemonstration` separa cliente real de conceito visual. Conceito não
 * entra aqui: esta página diz "estes são clientes", e um protótipo que se
 * apresenta como cliente é mentira comercial. O teste em
 * tests/architecture.test.mjs já segura essa distinção.
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Building2, FileText, LayoutDashboard, ShieldCheck } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { SealAtmosphere } from "@/components/seals/SealAtmosphere";
import { VeronicaSeal } from "@/components/VeronicaSeal";
import { entregasPublicas } from "@/lib/clientes";
import { sealRecords } from "@/lib/seals";

export const Route = createFileRoute("/clientes-veronica")({
  component: ClientesVeronica,
  head: () => ({
    meta: [
      { title: "Clientes Veronica | Veronica Hub" },
      {
        name: "description",
        content:
          "Clientes atendidos pela Veronica Hub e YO LAB & CO., com registro de procedência, escopo e as entregas de cada projeto.",
      },
      { property: "og:title", content: "Clientes Veronica" },
      {
        property: "og:description",
        content:
          "Quem a Veronica Hub atende, o que foi entregue e o selo que registra cada projeto.",
      },
    ],
  }),
});

const ICONE_ENTREGA: Record<string, typeof LayoutDashboard> = {
  "Central de operações": LayoutDashboard,
  Proposta: FileText,
};

const clientes = sealRecords.filter((r) => !r.isDemonstration);

function CartaoCliente({ registro }: { registro: (typeof sealRecords)[number] }) {
  const entregas = entregasPublicas(registro.serial);

  return (
    <article className="relative overflow-hidden rounded-sm border border-border/60 bg-surface/60">
      <div className="grid sm:grid-cols-[10rem_1fr]">
        <div className="relative flex min-h-40 items-center justify-center overflow-hidden border-b border-border/50 bg-background/60 sm:border-b-0 sm:border-r">
          <div
            aria-hidden
            className="absolute inset-0 opacity-50 [background-image:linear-gradient(oklch(0.85_0.22_155/.08)_1px,transparent_1px),linear-gradient(90deg,oklch(0.85_0.22_155/.08)_1px,transparent_1px)] [background-size:18px_18px]"
          />
          <VeronicaSeal
            serialNumber={registro.serial}
            issuedDate={registro.issuedAt}
            productName="SOLUÇÃO IA"
            size="sm"
            className="relative"
          />
        </div>

        <div className="flex flex-col p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building2 className="h-4 w-4" />
              <span className="text-xs">{registro.category}</span>
            </div>
            <span className="rounded-full border border-neon-green/50 bg-neon-green/[.07] px-2.5 py-1 font-mono-tech text-[9px] uppercase tracking-widest text-neon-green">
              {registro.statusLabel}
            </span>
          </div>

          <h2 className="mt-4 font-display text-3xl leading-none">{registro.client}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{registro.solution}</p>

          {entregas.length > 0 && (
            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              {entregas.map((e) => {
                const Icone = ICONE_ENTREGA[e.rotulo] ?? ArrowRight;
                return (
                  <Link
                    key={e.to}
                    to={e.to}
                    className="group flex flex-col gap-1 rounded-sm border border-border/60 bg-background/40 p-4 transition duration-300 hover:-translate-y-0.5 hover:border-neon-green/60"
                  >
                    <span className="flex items-center gap-2 text-sm">
                      <Icone className="h-4 w-4 text-neon-green" />
                      {e.rotulo}
                      <ArrowRight className="h-3 w-3 text-neon-green transition group-hover:translate-x-1" />
                    </span>
                    <span className="text-xs leading-relaxed text-muted-foreground">
                      {e.descricao}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}

          <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-6 font-mono-tech text-[10px] uppercase tracking-widest">
            <span className="text-muted-foreground">{registro.serial}</span>
            <Link
              to="/selo/$serial"
              params={{ serial: registro.serial }}
              className="flex items-center gap-1.5 text-neon-cyan transition hover:text-neon-green"
            >
              <ShieldCheck className="h-3 w-3" />
              Verificar procedência
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

function ClientesVeronica() {
  return (
    <div className="home-hybrid min-h-screen overflow-x-hidden bg-background text-foreground">
      <SiteHeader />
      <main>
        <section className="relative isolate overflow-hidden border-b border-border/70 py-16 md:py-24">
          <SealAtmosphere />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-80 [background:radial-gradient(circle_at_75%_20%,oklch(0.85_0.22_155/.14),transparent_30%),radial-gradient(circle_at_10%_0%,oklch(0.88_0.15_195/.10),transparent_30%)]"
          />
          <div className="relative mx-auto max-w-7xl px-6">
            <div className="flex items-center gap-3 font-mono-tech text-[11px] uppercase tracking-[.2em] text-neon-green">
              <span className="h-px w-8 bg-neon-green" />
              Clientes Veronica
            </div>
            <h1 className="mt-5 max-w-4xl font-display text-5xl leading-[.92] tracking-[-.055em] sm:text-6xl md:text-7xl">
              Quem a Veronica já atendeu{" "}
              <span className="text-neon-green text-glow-green">e atende.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground">
              Cada cliente tem selo de procedência e escopo registrado. A lista sai do próprio
              registro de selos — nada aparece aqui sem número de série emitido. O espaço de
              trabalho de cada cliente é privado: entra pelo portal de clientes, com o número do
              selo.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-14 md:py-20">
          <div className="grid gap-6">
            {clientes.map((registro) => (
              <CartaoCliente key={registro.serial} registro={registro} />
            ))}
          </div>

          <p className="mt-10 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Conceitos e demonstrações visuais não entram nesta página — eles ficam em{" "}
            <Link to="/selos" className="text-neon-cyan underline-offset-4 hover:underline">
              /selos
            </Link>
            , marcados como conceito. Cliente é quem tem relação comercial registrada.
          </p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
