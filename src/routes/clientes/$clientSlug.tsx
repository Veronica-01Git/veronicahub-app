import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowRight,
  BarChart3,
  Boxes,
  CircleDollarSign,
  Factory,
  Layers3,
  MessageCircle,
  Mic,
  PlugZap,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { VeronicaDrawer } from "@/components/VeronicaDrawer";
import {
  endPrivateClientSession,
  getWorkspaceAccess,
  type WorkspaceAccess,
} from "@/features/private-clients/access.functions";
import { PrivateClientAccountGate } from "@/features/private-clients/components/account-gate";
import { DemoBadge, Panel, WorkspaceShell } from "@/features/private-clients/components/shell";
import { expressWorkspace } from "@/features/private-clients/data/express";
import {
  actionPlan,
  collections,
  demoConversation,
  fashionWorkspace,
  leads,
  moneyMap,
  production,
  recurrence,
} from "@/features/private-clients/data/fashion";
import { lzTeamWorkspace } from "@/features/private-clients/data/lz-team";
import { getPrivateClientBySlug } from "@/features/private-clients/registry";

export const Route = createFileRoute("/clientes/$clientSlug")({
  component: PrivateClientWorkspace,
  head: () => ({
    meta: [
      { title: "Veronica Private Clients | Ambiente privado" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function PrivateClientWorkspace() {
  const { clientSlug } = Route.useParams();
  const navigate = useNavigate();
  const checkAccess = useServerFn(getWorkspaceAccess);
  const signOut = useServerFn(endPrivateClientSession);
  const [access, setAccess] = useState<WorkspaceAccess | null>(null);
  const [veronicaOpen, setVeronicaOpen] = useState(false);

  const client = useMemo(() => getPrivateClientBySlug(clientSlug), [clientSlug]);

  const refreshAccess = useCallback(async () => {
    setAccess(null);
    try {
      setAccess(await checkAccess({ data: { slug: clientSlug } }));
    } catch {
      setAccess({ ok: false, reason: "unauthenticated" });
    }
  }, [checkAccess, clientSlug]);

  useEffect(() => {
    void refreshAccess();
  }, [refreshAccess]);

  async function handleSignOut() {
    try {
      await signOut();
    } finally {
      void navigate({ to: "/clientes" });
    }
  }

  if (access === null) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <SiteHeader />
        <main className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center px-6 text-center">
          <div>
            <RefreshCw
              className="mx-auto h-6 w-6 motion-safe:animate-spin text-neon-green"
              aria-hidden
            />
            <h1 className="mt-5 font-display text-3xl tracking-[-.04em]">Validando seu ambiente</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Conferindo a sessão privada deste selo.
            </p>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const accountGateReason =
    !access.ok && access.reason !== "unauthenticated" && access.reason !== "forbidden"
      ? access.reason
      : null;

  if (accountGateReason && client) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <SiteHeader />
        <main className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center px-6 py-12">
          <div className="w-full rounded-[28px] border border-border/70 bg-surface/40 p-6 sm:p-8">
            <ShieldCheck className="h-7 w-7 text-neon-cyan" aria-hidden />
            <h1 className="mt-5 font-display text-3xl tracking-[-.04em]">
              Confirme o acesso da equipe
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {client.displayName} possui uma camada adicional antes de qualquer dado operacional.
            </p>
            <div className="mt-6">
              <PrivateClientAccountGate mode={accountGateReason} onAccessChanged={refreshAccess} />
            </div>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  if (!access.ok || !client) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <SiteHeader />
        <main className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center px-6 text-center">
          <div className="w-full rounded-sm border border-border/70 bg-surface/40 p-8">
            <ShieldCheck className="mx-auto h-7 w-7 text-neon-cyan" aria-hidden />
            <h1 className="mt-5 font-display text-3xl tracking-[-.04em]">Acesso não autorizado</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Esta sessão não possui acesso a este ambiente. Entre novamente usando o número de
              série do selo correspondente.
            </p>
            <Link
              to="/clientes"
              className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-sm bg-neon-green px-5 font-mono-tech text-[10px] uppercase tracking-widest text-primary-foreground transition hover:brightness-110"
            >
              Voltar ao acesso <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const content =
    client.slug === "express-entulho"
      ? expressWorkspace
      : client.slug === "veronica-fashion-operator"
        ? fashionWorkspace
        : lzTeamWorkspace;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <VeronicaDrawer
        skillId="home"
        open={veronicaOpen}
        stepId={null}
        onClose={() => setVeronicaOpen(false)}
      />

      <WorkspaceShell
        client={client}
        content={content}
        onSignOut={handleSignOut}
        onTalk={() => setVeronicaOpen(true)}
      >
        {client.slug === "express-entulho" ? <ExpressWorkspaceExtra /> : null}
        {client.slug === "veronica-fashion-operator" ? <FashionWorkspaceDemo /> : null}
        {client.slug === "lz-team" ? <LzWorkspaceExtra /> : null}
      </WorkspaceShell>

      <SiteFooter />
    </div>
  );
}

function ExpressWorkspaceExtra() {
  return (
    <div className="mt-5 grid gap-5 lg:grid-cols-2">
      <Panel title="Observabilidade">
        <div className="rounded-sm border border-neon-cyan/35 bg-neon-cyan/[.05] p-4">
          <div className="flex items-center gap-2 font-mono-tech text-[10px] uppercase tracking-widest text-neon-cyan">
            <ShieldCheck className="h-4 w-4" aria-hidden />
            Somente acompanhamento
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Este ambiente não envia mensagens, não responde clientes e não executa ações no
            WhatsApp. Ele serve apenas para acompanhar implantação, eventos e evolução do trabalho
            da Veronica.
          </p>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            to="/clientes/express-entulho/operacoes"
            className="inline-flex min-h-11 items-center gap-2 rounded-sm border border-border/70 px-4 font-mono-tech text-[10px] uppercase tracking-widest text-foreground transition hover:border-neon-cyan/60 hover:text-neon-cyan"
          >
            Abrir central operacional <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link
            to="/selo/$serial"
            params={{ serial: "VH-AUT-WA-2026-000001" }}
            className="inline-flex min-h-11 items-center gap-2 rounded-sm border border-border/70 px-4 font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground transition hover:text-foreground"
          >
            Ver selo público
          </Link>
        </div>
      </Panel>

      <Panel title="Canais do projeto">
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ["WhatsApp", "Acompanhamento da implantação"],
            ["Leads", "Organização e encaminhamento"],
            ["Agenda", "Regras operacionais em preparação"],
            ["Integrações", "Conectores em validação"],
          ].map(([name, detail]) => (
            <div key={name} className="rounded-sm border border-border/60 p-4">
              <div className="font-medium">{name}</div>
              <div className="mt-2 text-sm leading-relaxed text-muted-foreground">{detail}</div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function LzWorkspaceExtra() {
  return (
    <div className="mt-5">
      <Panel title="Ambiente reservado">
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          O LZ Team possui o selo de membro VH-MEM-2026-000002, emitido em 21/09/2026. O escopo e as
          integrações ainda estão em definição.
        </p>
      </Panel>
    </div>
  );
}

function FashionWorkspaceDemo() {
  const [selectedQuestion, setSelectedQuestion] = useState(0);
  const selected = demoConversation[selectedQuestion] ?? demoConversation[0];

  return (
    <div className="mt-5 grid gap-5">
      <Panel
        title="Veronica Live"
        demo
        action={
          <button
            type="button"
            disabled
            className="inline-flex min-h-10 cursor-not-allowed items-center gap-2 rounded-sm border border-border/70 px-4 font-mono-tech text-[9px] uppercase tracking-widest text-muted-foreground opacity-70"
          >
            <PlugZap className="h-4 w-4" aria-hidden />
            Conectar dados reais · roadmap
          </button>
        }
      >
        <div className="grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
          <div className="relative overflow-hidden rounded-sm border border-neon-green/30 bg-black p-6">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-50"
              style={{
                background:
                  "radial-gradient(circle at 50% 35%, rgba(23,244,143,.18), transparent 35%), radial-gradient(circle at 80% 80%, rgba(26,222,255,.12), transparent 28%)",
              }}
            />
            <div className="relative flex min-h-64 flex-col items-center justify-center text-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-full border border-neon-green/50 bg-neon-green/[.08] font-display text-4xl text-neon-green shadow-glow-green">
                V
              </div>
              <div className="mt-5 font-display text-2xl">Veronica</div>
              <div className="mt-2 flex items-center gap-2 font-mono-tech text-[9px] uppercase tracking-widest text-neon-cyan">
                <span className="h-1.5 w-1.5 rounded-full bg-neon-cyan motion-safe:animate-pulse" />
                experiência demonstrativa
              </div>
              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  disabled
                  className="inline-flex min-h-10 cursor-not-allowed items-center gap-2 rounded-full border border-border/70 px-4 text-xs text-muted-foreground"
                >
                  <Mic className="h-4 w-4" aria-hidden /> Voz · demo
                </button>
                <span className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border/70 px-4 text-xs text-muted-foreground">
                  <Sparkles className="h-4 w-4" aria-hidden /> provider modular
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-sm border border-border/60 bg-background/40 p-5">
            <div className="flex items-center gap-2 font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground">
              <MessageCircle className="h-4 w-4" aria-hidden /> conversa guiada
            </div>
            <div className="mt-5 grid gap-3">
              {demoConversation.map((item, index) => (
                <button
                  key={item.ask}
                  type="button"
                  onClick={() => setSelectedQuestion(index)}
                  className={`rounded-sm border p-3 text-left text-sm transition ${
                    selectedQuestion === index
                      ? "border-neon-green/60 bg-neon-green/[.06]"
                      : "border-border/60 hover:border-neon-cyan/50"
                  }`}
                >
                  {item.ask}
                </button>
              ))}
            </div>

            <div className="mt-5 rounded-sm border border-neon-cyan/30 bg-neon-cyan/[.04] p-4">
              <div className="font-mono-tech text-[9px] uppercase tracking-widest text-neon-cyan">
                Veronica · resposta simulada
              </div>
              <p className="mt-3 text-sm leading-relaxed text-foreground">{selected.answer}</p>
            </div>
          </div>
        </div>
      </Panel>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Mapa de Dinheiro" demo>
          <div className="grid gap-3 sm:grid-cols-2">
            {moneyMap.cards.map((card) => (
              <div key={card.label} className="rounded-sm border border-border/60 p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-mono-tech text-[9px] uppercase tracking-widest text-muted-foreground">
                    {card.label}
                  </div>
                  <DemoBadge />
                </div>
                <div className="mt-3 font-display text-3xl tracking-[-.04em]">{card.value}</div>
                <div className="mt-2 text-xs text-muted-foreground">{card.hint}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 grid gap-3">
            {moneyMap.risky.map((item) => (
              <div
                key={item.sku}
                className="grid gap-2 rounded-sm border border-border/60 p-4 sm:grid-cols-[1fr_auto]"
              >
                <div>
                  <div className="font-medium">{item.sku}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{item.issue}</div>
                </div>
                <div className="text-sm text-neon-cyan">{item.impact}</div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Produção" demo>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="font-mono-tech text-[9px] uppercase tracking-widest text-muted-foreground">
                <tr className="border-b border-border/60">
                  <th className="pb-3 pr-3">Peça</th>
                  <th className="pb-3 px-2">P</th>
                  <th className="pb-3 px-2">M</th>
                  <th className="pb-3 px-2">G</th>
                  <th className="pb-3 px-2">GG</th>
                  <th className="pb-3 pl-3">Leitura</th>
                </tr>
              </thead>
              <tbody>
                {production.rows.map((row) => (
                  <tr key={row.piece} className="border-b border-border/40 last:border-0">
                    <td className="py-4 pr-3 font-medium">{row.piece}</td>
                    <td className="px-2 py-4">{row.p}</td>
                    <td className="px-2 py-4">{row.m}</td>
                    <td className="px-2 py-4">{row.g}</td>
                    <td className="px-2 py-4">{row.gg}</td>
                    <td className="py-4 pl-3 text-muted-foreground">{row.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Leads" demo>
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <div className="font-mono-tech text-[9px] uppercase tracking-widest text-muted-foreground">
                Base potencial informada
              </div>
              <div className="mt-2 font-display text-4xl tracking-[-.04em]">~{leads.base}</div>
            </div>
            <Users className="h-7 w-7 text-neon-cyan" aria-hidden />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Funnel title="B2B · lojistas" items={leads.b2b} />
            <Funnel title="B2C · consumidores" items={leads.b2c} />
          </div>
        </Panel>

        <Panel title="Coleções" demo>
          <div className="grid gap-3">
            {collections.ideas.map((idea) => (
              <div key={idea.name} className="rounded-sm border border-border/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-medium">{idea.name}</div>
                  <span className="font-mono-tech text-[9px] uppercase tracking-widest text-neon-cyan">
                    {idea.status}
                  </span>
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  {idea.pieces} peças · {idea.variations} variações
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-sm border border-border/60 bg-background/40 p-4">
            <div className="font-mono-tech text-[9px] uppercase tracking-widest text-muted-foreground">
              Briefing DEMO
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {collections.briefing}
            </p>
          </div>
        </Panel>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Plano de Ação" demo>
          <div className="grid gap-3">
            {actionPlan.map((item) => (
              <div key={item.action} className="rounded-sm border border-border/60 p-4">
                <div className="font-medium">{item.action}</div>
                <div className="mt-3 flex flex-wrap gap-2 font-mono-tech text-[9px] uppercase tracking-widest">
                  <span className="rounded-full border border-neon-green/30 px-2.5 py-1 text-neon-green">
                    Impacto {item.impact}
                  </span>
                  <span className="rounded-full border border-neon-cyan/30 px-2.5 py-1 text-neon-cyan">
                    Esforço {item.effort}
                  </span>
                  <span className="rounded-full border border-border px-2.5 py-1 text-muted-foreground">
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Recorrência" demo>
          <div className="grid gap-3 sm:grid-cols-2">
            {recurrence.map((item, index) => {
              const icons = [CircleDollarSign, BarChart3, Factory, Layers3];
              const Icon = icons[index] ?? Boxes;
              return (
                <div key={item.title} className="rounded-sm border border-border/60 p-4">
                  <Icon className="h-5 w-5 text-neon-green" aria-hidden />
                  <div className="mt-4 font-medium">{item.title}</div>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                </div>
              );
            })}
          </div>
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            Este bloco demonstra o valor de acompanhamento mensal. Não existe cobrança ou checkout
            conectado nesta fase.
          </p>
        </Panel>
      </div>
    </div>
  );
}

function Funnel({
  title,
  items,
}: {
  title: string;
  items: readonly { stage: string; value: number }[];
}) {
  return (
    <div className="rounded-sm border border-border/60 p-4">
      <div className="font-mono-tech text-[9px] uppercase tracking-widest text-neon-cyan">
        {title}
      </div>
      <div className="mt-4 grid gap-3">
        {items.map((item, index) => (
          <div key={item.stage}>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">{item.stage}</span>
              <span className="font-medium">{item.value}</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border/60">
              <div
                className="h-full rounded-full bg-neon-green"
                style={{ width: `${Math.max(12, 100 - index * 24)}%` }}
                aria-hidden
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
