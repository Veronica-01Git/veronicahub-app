/**
 * Casca da rota: tarja de demonstração, sidebar, topbar e rodapé de
 * procedência. O Sheet do kit do repo é reaproveitado como drawer no celular.
 */

import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, TriangleAlert } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { BASE, hrefDe, ITENS_NAV } from "../nav";

/** Fica no topo e não sai de vista ao rolar. Proteção do cliente e nossa. */
export function TarjaDemo() {
  return (
    <div
      role="note"
      className="sticky top-0 z-40 flex items-center justify-center gap-2 border-b border-[oklch(0.86_0.09_85)] bg-[var(--ops-warn-soft)] px-4 py-2 text-center"
    >
      <TriangleAlert aria-hidden className="h-3.5 w-3.5 shrink-0 text-[oklch(0.45_0.11_75)]" />
      <p className="text-[12.5px] font-medium leading-snug text-[oklch(0.35_0.08_75)]">
        Demonstração visual com dados fictícios. Nenhum dado real de cliente é exibido.
      </p>
    </div>
  );
}

function Marca({ compacta = false, onNavegar }: { compacta?: boolean; onNavegar?: () => void }) {
  return (
    <Link
      to={BASE}
      onClick={onNavegar}
      className="flex items-center gap-2.5 rounded-lg"
      aria-label="Express Operations — visão geral"
    >
      <span
        aria-hidden
        className="grid h-8 w-8 shrink-0 place-items-center rounded-[9px] bg-[var(--ops-accent)] text-[13px] font-bold text-[oklch(0.99_0_0)]"
      >
        EO
      </span>
      {compacta ? null : (
        <span className="min-w-0">
          <span className="block truncate text-[14px] font-semibold leading-tight text-[var(--ops-ink)]">
            Express Operations
          </span>
          <span className="block truncate text-[11.5px] leading-tight text-[var(--ops-ink-muted)]">
            Express Entulho
          </span>
        </span>
      )}
    </Link>
  );
}

function ListaNav({ compacta = false, onNavegar }: { compacta?: boolean; onNavegar?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const atual = pathname.replace(/\/$/, "");

  return (
    <ul className="grid gap-0.5">
      {ITENS_NAV.map((item) => {
        const href = hrefDe(item.slug);
        const ativo = atual === href.replace(/\/$/, "");
        const Icone = item.icone;
        return (
          <li key={item.slug || "indice"}>
            <Link
              to={href}
              onClick={onNavegar}
              aria-current={ativo ? "page" : undefined}
              title={compacta ? item.rotulo : undefined}
              className={cn(
                "ops-motion flex items-center gap-2.5 rounded-[9px] text-[13.5px] transition-colors",
                compacta ? "justify-center px-2 py-2.5" : "px-2.5 py-2",
                ativo
                  ? "bg-[var(--ops-accent-soft)] font-medium text-[var(--ops-accent-ink)]"
                  : "text-[var(--ops-ink-soft)] hover:bg-[var(--ops-surface)] hover:text-[var(--ops-ink)]",
              )}
            >
              <Icone
                aria-hidden
                className={cn("h-[17px] w-[17px] shrink-0", ativo ? "opacity-100" : "opacity-70")}
              />
              {compacta ? (
                <span className="sr-only">{item.rotulo}</span>
              ) : (
                <span className="truncate">{item.rotulo}</span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function Sidebar() {
  return (
    <nav
      aria-label="Seções do Express Operations"
      className="sticky top-[37px] hidden h-[calc(100vh-37px)] flex-col overflow-y-auto border-r border-[var(--ops-line)] bg-[var(--ops-card)] md:flex"
    >
      <div className="px-3 py-4 lg:px-4">
        <div className="hidden lg:block">
          <Marca />
        </div>
        <div className="lg:hidden">
          <Marca compacta />
        </div>
      </div>
      <div className="px-2 pb-6 lg:px-3">
        <div className="hidden lg:block">
          <ListaNav />
        </div>
        <div className="lg:hidden">
          <ListaNav compacta />
        </div>
      </div>
    </nav>
  );
}

export function Topbar({ titulo, apoio }: { titulo: string; apoio?: string }) {
  const [aberto, setAberto] = useState(false);

  return (
    <header className="sticky top-[37px] z-30 border-b border-[var(--ops-line)] bg-[oklch(1_0_0_/_0.86)] backdrop-blur-md">
      <div className="flex items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Sheet open={aberto} onOpenChange={setAberto}>
          <SheetTrigger
            className="ops-motion grid h-9 w-9 shrink-0 place-items-center rounded-[9px] border border-[var(--ops-line)] text-[var(--ops-ink-soft)] transition-colors hover:bg-[var(--ops-surface)] md:hidden"
            aria-label="Abrir menu de seções"
          >
            <Menu aria-hidden className="h-[18px] w-[18px]" />
          </SheetTrigger>
          <SheetContent
            side="left"
            className="express-ops-b ops-mobile-sheet flex h-dvh w-[min(320px,calc(100vw-24px))] max-w-none flex-col overflow-hidden border-r border-[var(--ops-line)] bg-[var(--ops-card)] p-0"
          >
            <SheetHeader className="shrink-0 border-b border-[var(--ops-line)] p-4 text-left">
              <SheetTitle asChild>
                <span>
                  <Marca onNavegar={() => setAberto(false)} />
                </span>
              </SheetTitle>
              <SheetDescription className="sr-only">
                Navegação entre as seções do painel
              </SheetDescription>
            </SheetHeader>
            <nav
              aria-label="Seções do Express Operations"
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2 pb-6"
            >
              <ListaNav onNavegar={() => setAberto(false)} />
            </nav>
          </SheetContent>
        </Sheet>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[15px] font-semibold leading-tight tracking-[-0.01em] text-[var(--ops-ink)]">
            {titulo}
          </h1>
          {apoio ? (
            <p className="truncate text-[12.5px] leading-tight text-[var(--ops-ink-muted)]">
              {apoio}
            </p>
          ) : null}
        </div>

        <span className="ops-label hidden shrink-0 sm:block">Sexta · 14 set 2026</span>
      </div>
    </header>
  );
}

export function RodapeProcedencia() {
  return (
    <footer className="mt-auto border-t border-[var(--ops-line)] px-4 py-6 sm:px-6 lg:px-8">
      <p className="ops-label text-[10.5px] leading-relaxed tracking-[0.06em]">
        Express Operations · Protótipo visual — não é sistema em operação
      </p>
      <p className="mt-1.5 text-[11.5px] leading-relaxed text-[var(--ops-ink-muted)]">
        Projeto interno YO LAB &amp; CO. nº 000001
        <span aria-hidden className="mx-1.5 opacity-40">
          ·
        </span>
        Design e engenharia: YO LAB &amp; CO. · Inteligências Veronica
      </p>
    </footer>
  );
}
