/**
 * Primitivos visuais da demo.
 *
 * Reuso: Badge/Button/Table vêm de `@/components/ui/*`. Aqui só mora o que
 * não existe no repo — cartão com o acabamento da rota, título de seção,
 * bloco de "Aguardando cadastro", badge de estado com bolinha e o segmented
 * control. Nada disso duplica componente existente.
 */

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { isAwaiting, type Maybe } from "../data/types";

export function OpsCard({
  children,
  className,
  as: Tag = "section",
}: {
  children: ReactNode;
  className?: string;
  as?: "section" | "div" | "article" | "aside";
}) {
  return <Tag className={cn("ops-card p-5 sm:p-6", className)}>{children}</Tag>;
}

export function SectionTitle({
  titulo,
  apoio,
  acao,
  id,
}: {
  titulo: string;
  apoio?: string;
  acao?: ReactNode;
  id?: string;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h2
          id={id}
          className="text-[19px] font-semibold leading-tight tracking-[-0.015em] text-[var(--ops-ink)]"
        >
          {titulo}
        </h2>
        {apoio ? (
          <p className="mt-1 text-[13px] leading-relaxed text-[var(--ops-ink-muted)]">{apoio}</p>
        ) : null}
      </div>
      {acao}
    </div>
  );
}

/**
 * Estado de ausência de dado. Nunca inventamos número: onde a Express
 * Entulho ainda não cadastrou, aparece isto.
 */
export function AguardandoCadastro({
  motivo,
  compacto = false,
  className,
}: {
  motivo?: string;
  compacto?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start gap-2.5", className)}>
      <span
        aria-hidden
        className="mt-[3px] inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-dashed border-[var(--ops-line-strong)]"
      >
        <span className="h-1 w-1 rounded-full bg-[var(--ops-neutral)]" />
      </span>
      <div className="min-w-0">
        <p
          className={cn(
            "font-medium text-[var(--ops-ink-soft)]",
            compacto ? "text-[13px]" : "text-sm",
          )}
        >
          Aguardando cadastro
        </p>
        {motivo ? (
          <p className="mt-0.5 text-[12.5px] leading-relaxed text-[var(--ops-ink-muted)]">
            {motivo}
          </p>
        ) : null}
      </div>
    </div>
  );
}

/** Renderiza `pronto` quando há dado; senão, o bloco de ausência. */
export function ComDado<T>({
  valor,
  children,
  compacto,
  className,
}: {
  valor: Maybe<T>;
  children: (v: T) => ReactNode;
  compacto?: boolean;
  className?: string;
}) {
  if (isAwaiting(valor)) {
    return <AguardandoCadastro motivo={valor.motivo} compacto={compacto} className={className} />;
  }
  return <>{children(valor as T)}</>;
}

export type Tom = "ok" | "atencao" | "critico" | "neutro" | "acento";

const TOM_CLASSES: Record<Tom, { fundo: string; texto: string; ponto: string }> = {
  ok: {
    fundo: "bg-[var(--ops-ok-soft)]",
    texto: "text-[var(--ops-ok)]",
    ponto: "bg-[var(--ops-ok)]",
  },
  atencao: {
    fundo: "bg-[var(--ops-warn-soft)]",
    texto: "text-[var(--ops-warn)]",
    ponto: "bg-[var(--ops-warn)]",
  },
  critico: {
    fundo: "bg-[var(--ops-danger-soft)]",
    texto: "text-[var(--ops-danger)]",
    ponto: "bg-[var(--ops-danger)]",
  },
  neutro: {
    fundo: "bg-[var(--ops-surface)]",
    texto: "text-[var(--ops-ink-soft)]",
    ponto: "bg-[var(--ops-neutral)]",
  },
  acento: {
    fundo: "bg-[var(--ops-accent-soft)]",
    texto: "text-[var(--ops-accent-ink)]",
    ponto: "bg-[var(--ops-accent)]",
  },
};

export function EstadoBadge({
  tom,
  children,
  className,
}: {
  tom: Tom;
  children: ReactNode;
  className?: string;
}) {
  const c = TOM_CLASSES[tom];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium",
        c.fundo,
        c.texto,
        className,
      )}
    >
      <span aria-hidden className={cn("h-1.5 w-1.5 shrink-0 rounded-full", c.ponto)} />
      {children}
    </span>
  );
}

export function SegmentedControl<T extends string>({
  opcoes,
  valor,
  onChange,
  rotulo,
}: {
  opcoes: readonly { readonly id: T; readonly rotulo: string; readonly contagem?: number }[];
  valor: T;
  onChange: (id: T) => void;
  rotulo: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={rotulo}
      className="inline-flex flex-wrap gap-1 rounded-[10px] border border-[var(--ops-line)] bg-[var(--ops-surface)] p-1"
    >
      {opcoes.map((o) => {
        const ativo = o.id === valor;
        return (
          <button
            key={o.id}
            type="button"
            role="tab"
            aria-selected={ativo}
            onClick={() => onChange(o.id)}
            className={cn(
              "ops-motion rounded-[7px] px-3 py-1.5 text-[13px] font-medium transition-colors",
              ativo
                ? "bg-[var(--ops-card)] text-[var(--ops-ink)] shadow-[var(--ops-shadow)]"
                : "text-[var(--ops-ink-muted)] hover:text-[var(--ops-ink)]",
            )}
          >
            {o.rotulo}
            {typeof o.contagem === "number" ? (
              <span className="ops-num ml-1.5 text-[12px] text-[var(--ops-ink-muted)]">
                {o.contagem}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
