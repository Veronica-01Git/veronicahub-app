import type { ReactNode } from "react";
import { maskSerial, type PrivateClient } from "../registry";
import type { WorkspaceContent } from "../data/types";

export function DemoBadge({ label = "DEMO" }: { label?: string }) {
  return (
    <span className="rounded-full border border-amber-400/50 bg-amber-400/[.08] px-2 py-0.5 font-mono-tech text-[9px] uppercase tracking-widest text-amber-500">
      {label}
    </span>
  );
}

export function Panel({
  title,
  demo,
  action,
  children,
}: {
  title: string;
  demo?: boolean;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-sm border border-border/60 bg-surface/40 p-5 md:p-6">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-display text-2xl tracking-[-.03em]">
          {title}
          {demo ? <DemoBadge /> : null}
        </h2>
        {action}
      </header>
      {children}
    </section>
  );
}

const toneClass: Record<WorkspaceContent["operationStatus"]["tone"], string> = {
  green: "border-neon-green/50 bg-neon-green/[.07] text-neon-green",
  cyan: "border-neon-cyan/50 bg-neon-cyan/[.07] text-neon-cyan",
  muted: "border-border text-muted-foreground",
};

export function WorkspaceShell({
  client,
  content,
  children,
  onSignOut,
  onTalk,
}: {
  client: PrivateClient;
  content: WorkspaceContent;
  children?: ReactNode;
  onSignOut: () => void;
  onTalk: () => void;
}) {
  return (
    <div className="mx-auto max-w-7xl px-6 py-10 md:py-14">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <div className="font-mono-tech text-[10px] uppercase tracking-[.2em] text-neon-green">
            Veronica Private Clients
          </div>
          <h1 className="mt-3 font-display text-4xl leading-none tracking-[-.04em] sm:text-5xl">
            {client.displayName}
          </h1>
          <p className="mt-3 text-muted-foreground">{client.tagline}</p>
          <p className="mt-2 font-mono-tech text-[11px] uppercase tracking-widest text-muted-foreground">
            Selo {client.sealSerial ? maskSerial(client.sealSerial) : "não emitido"}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onTalk}
            className="inline-flex min-h-11 items-center gap-2 rounded-sm bg-neon-green px-5 font-mono-tech text-[10px] uppercase tracking-widest text-primary-foreground transition hover:brightness-110"
          >
            Falar com Veronica
          </button>
          <button
            type="button"
            onClick={onSignOut}
            className="inline-flex min-h-11 items-center gap-2 rounded-sm border border-border/70 px-5 font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground transition hover:text-foreground"
          >
            Sair
          </button>
        </div>
      </div>

      <div className="mt-9 grid gap-5 lg:grid-cols-3">
        <div className="rounded-sm border border-border/60 bg-surface/40 p-5">
          <div className="font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground">
            Status da operação
          </div>
          <div
            className={`mt-3 inline-flex rounded-full border px-3 py-1.5 font-mono-tech text-[10px] uppercase tracking-widest ${toneClass[content.operationStatus.tone]}`}
          >
            {content.operationStatus.label}
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            {content.operationStatus.detail}
          </p>
        </div>
        <div className="rounded-sm border border-border/60 bg-surface/40 p-5 lg:col-span-2">
          <div className="font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground">
            Missão atual
          </div>
          <h2 className="mt-3 font-display text-2xl tracking-[-.03em]">{content.mission.title}</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{content.mission.body}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Panel title="Próximas ações">
          <ol className="grid gap-3">
            {content.nextActions.map((item) => (
              <li
                key={`${item.label}-${item.detail}`}
                className={`rounded-sm border p-4 text-sm leading-relaxed ${
                  item.state === "current"
                    ? "border-neon-green/55 bg-neon-green/[.06]"
                    : item.state === "done"
                      ? "border-neon-cyan/35 bg-neon-cyan/[.05]"
                      : "border-border/60"
                }`}
              >
                <span className="font-mono-tech text-[10px] uppercase tracking-widest text-neon-cyan">
                  {item.label}
                </span>
                <div className="mt-2">{item.detail}</div>
                {item.state === "blocked" ? (
                  <div className="mt-2 font-mono-tech text-[9px] uppercase tracking-widest text-muted-foreground">
                    Não configurado
                  </div>
                ) : null}
              </li>
            ))}
          </ol>
        </Panel>

        <Panel title="Módulos">
          <ul className="grid gap-3">
            {client.modules.map((mod) => (
              <li key={mod.id} className="rounded-sm border border-border/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-medium">{mod.label}</span>
                  <span className="font-mono-tech text-[9px] uppercase tracking-widest text-muted-foreground">
                    {mod.state === "live" ? "Ativo" : mod.state === "demo" ? "Demonstração" : "Não configurado"}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{mod.description}</p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      {children}

      <div className="mt-5">
        <Panel title="Atividade recente">
          <ul className="grid gap-3">
            {content.activity.map((item) => (
              <li key={item.text} className="flex flex-wrap items-center gap-3 border-b border-border/40 pb-3 text-sm text-muted-foreground last:border-0">
                <span className="font-mono-tech text-[10px] uppercase tracking-widest text-neon-cyan">
                  {item.when}
                </span>
                <span className="flex-1">{item.text}</span>
                {item.demo ? <DemoBadge /> : null}
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
