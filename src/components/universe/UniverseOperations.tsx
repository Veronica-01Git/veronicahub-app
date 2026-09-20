import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  CircleDollarSign,
  Database,
  Gauge,
  Layers3,
  Newspaper,
  Radio,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";
import { formatBRL } from "@/lib/account";
import { PRODUCTS, WIRE_NAME } from "@/lib/ecosystem";
import type { UniverseSnapshot } from "./UniverseToday";

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <header className="border-b border-border/40 pb-5">
      <div className="font-mono-tech text-[9px] uppercase tracking-[0.2em] text-neon-cyan">
        {eyebrow}
      </div>
      <h1 className="mt-2 font-display text-3xl tracking-tight text-foreground sm:text-4xl">
        {title}
      </h1>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">{description}</p>
    </header>
  );
}

function ValueCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="rounded-sm border border-border/50 bg-surface/20 p-5">
      <div className="font-mono-tech text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-4 font-display text-3xl tracking-tight text-foreground">{value}</div>
      <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{detail}</p>
    </article>
  );
}

function Status({
  state,
}: {
  state: "connected" | "partial" | "waiting";
}) {
  const style =
    state === "connected"
      ? "border-neon-green/30 bg-neon-green/5 text-neon-green"
      : state === "partial"
        ? "border-neon-cyan/30 bg-neon-cyan/5 text-neon-cyan"
        : "border-border/50 bg-muted/20 text-muted-foreground";
  const label = state === "connected" ? "CONNECTED" : state === "partial" ? "PARTIAL" : "WAITING";
  return (
    <span className={"inline-flex items-center gap-1.5 rounded-full border px-2 py-1 font-mono-tech text-[8px] tracking-widest " + style}>
      <span className={"h-1.5 w-1.5 rounded-full " + (state === "connected" ? "bg-neon-green animate-pulse" : state === "partial" ? "bg-neon-cyan" : "bg-muted-foreground/50")} />
      {label}
    </span>
  );
}

export function UniverseRevenue({ snapshot }: { snapshot: UniverseSnapshot }) {
  const topUps = snapshot.overview.topUps ?? [];
  const paid = topUps.filter((item) => item.status === "PAGO");
  const pending = topUps.filter((item) => item.status === "PENDENTE");
  const paidCents = paid.reduce((sum, item) => sum + item.amountCents, 0);
  const averageCents = paid.length ? Math.round(paidCents / paid.length) : 0;
  const wireClicks = snapshot.wire.available ? snapshot.wire.totalClicks ?? 0 : null;

  return (
    <div className="flex flex-col gap-7" data-universe-element="revenue">
      <SectionHeader
        eyebrow="MONEY / VERIFIED SIGNALS"
        title="Dinheiro sem maquiagem."
        description="A camada financeira atual distingue recarga de carteira, intenção comercial e receita por produto. O que ainda não é atribuído aparece explicitamente como não conectado."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <ValueCard
          label="Top-ups pagos · amostra"
          value={formatBRL(paidCents)}
          detail="Soma dos top-ups pagos entre os 50 depósitos mais recentes."
        />
        <ValueCard
          label="Ticket médio · top-up"
          value={formatBRL(averageCents)}
          detail="Média da amostra de recargas pagas; não é ARPU."
        />
        <ValueCard
          label="Top-ups pendentes"
          value={String(pending.length)}
          detail="Depósitos criados ainda sem confirmação de pagamento."
        />
        <ValueCard
          label={"Cliques " + WIRE_NAME + " · 30d"}
          value={wireClicks === null ? "—" : String(wireClicks)}
          detail="Intenção comercial medida no redirect de ofertas; clique não é venda."
        />
      </div>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-sm border border-border/50 bg-surface/20 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-neon-green" />
              <h2 className="font-mono-tech text-[10px] uppercase tracking-widest text-foreground">
                Wallet activity
              </h2>
            </div>
            <span className="font-mono-tech text-[9px] uppercase tracking-widest text-muted-foreground">
              últimos {topUps.length}
            </span>
          </div>

          <div className="mt-5 overflow-x-auto rounded-sm border border-border/40">
            <table className="w-full min-w-[640px] border-collapse text-left text-xs">
              <thead className="bg-surface/40 font-mono-tech text-[9px] uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Valor</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Criado</th>
                  <th className="px-4 py-3">Pago</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {topUps.slice(0, 12).map((item) => (
                  <tr key={item.id} className="bg-background/45">
                    <td className="px-4 py-3 font-medium text-foreground">{formatBRL(item.amountCents)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          "rounded-full border px-2 py-1 font-mono-tech text-[8px] uppercase tracking-wider " +
                          (item.status === "PAGO"
                            ? "border-neon-green/30 bg-neon-green/5 text-neon-green"
                            : item.status === "PENDENTE"
                              ? "border-neon-cyan/30 bg-neon-cyan/5 text-neon-cyan"
                              : "border-border/50 bg-muted/20 text-muted-foreground")
                        }
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(item.createdAt).toLocaleString("pt-BR")}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {item.paidAt ? new Date(item.paidAt).toLocaleString("pt-BR") : "—"}
                    </td>
                  </tr>
                ))}
                {topUps.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                      Nenhum top-up retornado nesta leitura.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>

        <article className="rounded-sm border border-neon-cyan/25 bg-neon-cyan/5 p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <CircleDollarSign className="h-4 w-4 text-neon-cyan" />
            <h2 className="font-mono-tech text-[10px] uppercase tracking-widest text-foreground">
              Revenue Core gap
            </h2>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-foreground/90">
            Hoje a Veronica sabe quando saldo entra na wallet, mas ainda não possui uma entidade
            única de compra capaz de responder quanto cada produto faturou.
          </p>
          <div className="mt-5 space-y-2">
            {[
              ["Order / OrderItem", "WAITING"],
              ["Payment attribution", "WAITING"],
              ["Entitlement", "WAITING"],
              ["Refund linkage", "WAITING"],
              ["Revenue by product", "WAITING"],
            ].map(([label, state]) => (
              <div
                key={label}
                className="flex items-center justify-between gap-3 rounded-sm border border-border/40 bg-background/45 px-3 py-2.5"
              >
                <span className="text-xs text-foreground">{label}</span>
                <span className="font-mono-tech text-[8px] uppercase tracking-widest text-muted-foreground">
                  {state}
                </span>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}

export function UniverseCustomers({ snapshot }: { snapshot: UniverseSnapshot }) {
  const users = snapshot.overview.users ?? [];
  const balanceCents = users.reduce((sum, user) => sum + user.balanceCents, 0);
  const imageCredits = users.reduce((sum, user) => sum + user.freeImageCredits, 0);

  return (
    <div className="flex flex-col gap-7" data-universe-element="customers">
      <SectionHeader
        eyebrow="CUSTOMERS / VERONICA ID"
        title="Uma pessoa. Uma relação com a Veronica."
        description="A visão atual já usa a identidade compartilhada do ecossistema. A próxima evolução é conectar compras, uso de produtos e jornada sem duplicar contas por ferramenta."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <ValueCard
          label="Usuários carregados"
          value={String(users.length)}
          detail={users.length >= 200 ? "O admin limita esta consulta aos 200 mais recentes." : "Registros retornados nesta sessão."}
        />
        <ValueCard
          label="Saldo agregado carregado"
          value={formatBRL(balanceCents)}
          detail="Saldo atual dos usuários retornados, não patrimônio nem receita."
        />
        <ValueCard
          label="Créditos de imagem livres"
          value={String(imageCredits)}
          detail="Créditos gratuitos ainda disponíveis entre os usuários carregados."
        />
      </div>

      <section className="rounded-sm border border-border/50 bg-surface/20 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-neon-green" />
            <h2 className="font-mono-tech text-[10px] uppercase tracking-widest text-foreground">
              Veronica IDs recentes
            </h2>
          </div>
          <Status state="connected" />
        </div>

        <div className="mt-5 overflow-x-auto rounded-sm border border-border/40">
          <table className="w-full min-w-[760px] border-collapse text-left text-xs">
            <thead className="bg-surface/40 font-mono-tech text-[9px] uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Identidade</th>
                <th className="px-4 py-3">Papel</th>
                <th className="px-4 py-3">Saldo</th>
                <th className="px-4 py-3">Imagem grátis</th>
                <th className="px-4 py-3">Vídeo grátis</th>
                <th className="px-4 py-3">Cadastro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {users.slice(0, 30).map((user) => (
                <tr key={user.id} className="bg-background/45">
                  <td className="px-4 py-3 text-foreground">{user.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">{user.role}</td>
                  <td className="px-4 py-3 text-foreground">{formatBRL(user.balanceCents)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{user.freeImageCredits}</td>
                  <td className="px-4 py-3 text-muted-foreground">{user.freeVideoCredits}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export function UniverseFunnels({ snapshot }: { snapshot: UniverseSnapshot }) {
  const users = snapshot.overview.users ?? [];
  const topUps = snapshot.overview.topUps ?? [];
  const paid = topUps.filter((item) => item.status === "PAGO").length;
  const articles24h = snapshot.articles.current24hCount ?? 0;
  const wireClicks = snapshot.wire.available ? snapshot.wire.totalClicks ?? 0 : null;

  const stages = [
    {
      name: "Aquisição",
      signal: articles24h + " matérias / 24h",
      state: "connected" as const,
      source: WIRE_NAME,
    },
    {
      name: "Identidade",
      signal: users.length + " IDs carregados",
      state: "connected" as const,
      source: "User",
    },
    {
      name: "Entrada de dinheiro",
      signal: paid + " top-ups pagos na amostra",
      state: "connected" as const,
      source: "WalletTopUp",
    },
    {
      name: "Compra por produto",
      signal: "purchase_completed ausente",
      state: "waiting" as const,
      source: "Revenue Core",
    },
    {
      name: "Retenção",
      signal: "product_used versionado ausente",
      state: "waiting" as const,
      source: "Event Taxonomy",
    },
    {
      name: "Cross-sell",
      signal: "cross_sell_clicked ausente",
      state: "waiting" as const,
      source: "Event Taxonomy",
    },
  ];

  return (
    <div className="flex flex-col gap-7" data-universe-element="funnels">
      <SectionHeader
        eyebrow="FUNNELS / TELEMETRY MAP"
        title="Veja exatamente onde a visão termina."
        description="O Universe não calcula conversões que o backend ainda não mede. Este mapa mostra quais etapas possuem sinal real e quais dependem da próxima camada de eventos."
      />

      <section className="rounded-sm border border-border/50 bg-surface/20 p-5 sm:p-6">
        <div className="grid gap-3 lg:grid-cols-6">
          {stages.map((stage, index) => (
            <article key={stage.name} className="relative rounded-sm border border-border/40 bg-background/55 p-4">
              {index < stages.length - 1 && (
                <ArrowUpRight className="absolute -right-2 -top-2 hidden h-4 w-4 text-neon-green/40 lg:block" />
              )}
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono-tech text-[8px] uppercase tracking-widest text-muted-foreground">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <Status state={stage.state} />
              </div>
              <h2 className="mt-4 text-sm font-medium text-foreground">{stage.name}</h2>
              <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{stage.signal}</p>
              <div className="mt-4 border-t border-border/30 pt-2 font-mono-tech text-[8px] uppercase tracking-widest text-muted-foreground">
                {stage.source}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-sm border border-border/50 bg-surface/20 p-5">
          <div className="flex items-center gap-2">
            <Newspaper className="h-4 w-4 text-neon-cyan" />
            <h2 className="font-mono-tech text-[10px] uppercase tracking-widest text-foreground">
              Wire → commerce
            </h2>
          </div>
          <div className="mt-5 flex items-end justify-between gap-4 rounded-sm border border-border/40 bg-background/50 p-4">
            <div>
              <div className="font-display text-3xl text-foreground">{wireClicks === null ? "—" : wireClicks}</div>
              <div className="mt-1 text-xs text-muted-foreground">cliques de oferta em 30 dias</div>
            </div>
            <Status state={wireClicks === null ? "partial" : "connected"} />
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            O redirect já mede intenção comercial. O elo ainda ausente é ligar o clique à compra
            confirmada do produto de destino.
          </p>
        </article>

        <article className="rounded-sm border border-border/50 bg-surface/20 p-5">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-neon-green" />
            <h2 className="font-mono-tech text-[10px] uppercase tracking-widest text-foreground">
              Métricas que ficam bloqueadas
            </h2>
          </div>
          <div className="mt-4 space-y-2 text-xs text-muted-foreground">
            {["Free → Paid", "Retenção por produto", "LTV", "CAC por origem", "Ecosystem Expansion Rate"].map(
              (metric) => (
                <div
                  key={metric}
                  className="flex items-center justify-between gap-3 rounded-sm border border-border/40 bg-background/50 px-3 py-2.5"
                >
                  <span>{metric}</span>
                  <span className="font-mono-tech text-[8px] uppercase tracking-widest">needs events</span>
                </div>
              ),
            )}
          </div>
        </article>
      </section>
    </div>
  );
}

export function UniverseHealth({ snapshot }: { snapshot: UniverseSnapshot }) {
  const rows = [
    {
      icon: <Database className="h-4 w-4" />,
      name: "Admin / Neon data",
      detail: snapshot.overview.ok ? "Usuários e top-ups retornados." : snapshot.overview.error ?? "Falha.",
      state: snapshot.overview.ok ? ("connected" as const) : ("partial" as const),
    },
    {
      icon: <Newspaper className="h-4 w-4" />,
      name: WIRE_NAME + " editorial",
      detail: snapshot.articles.ok
        ? (snapshot.articles.current24hCount ?? 0) + " publicações nas últimas 24h."
        : "Feed editorial não respondeu.",
      state: snapshot.articles.ok ? ("connected" as const) : ("partial" as const),
    },
    {
      icon: <BarChart3 className="h-4 w-4" />,
      name: "Wire commercial tracking",
      detail: snapshot.wire.available ? "Redirect tracking disponível." : "Leitura comercial indisponível.",
      state: snapshot.wire.available ? ("connected" as const) : ("partial" as const),
    },
    {
      icon: <Layers3 className="h-4 w-4" />,
      name: "Product registry",
      detail: PRODUCTS.length + " produtos registrados na fonte canônica.",
      state: "connected" as const,
    },
    {
      icon: <CircleDollarSign className="h-4 w-4" />,
      name: "Revenue attribution",
      detail: "Top-up existe; compra e entitlement globais ainda não.",
      state: "partial" as const,
    },
    {
      icon: <Gauge className="h-4 w-4" />,
      name: "AI cost ledger",
      detail: "Custo por operação/modelo ainda não consolidado no Universe.",
      state: "waiting" as const,
    },
    {
      icon: <Radio className="h-4 w-4" />,
      name: "Cross-sell telemetry",
      detail: "Ainda sem evento global de exposição e conversão.",
      state: "waiting" as const,
    },
    {
      icon: <ShieldCheck className="h-4 w-4" />,
      name: "Admin access",
      detail: "Universe protegido por sessão administrativa.",
      state: "connected" as const,
    },
  ];

  const connected = rows.filter((row) => row.state === "connected").length;

  return (
    <div className="flex flex-col gap-7" data-universe-element="health">
      <SectionHeader
        eyebrow="SYSTEM HEALTH / TRUTH LAYER"
        title="Saúde do que realmente está conectado."
        description="Sem latência inventada e sem status decorativo. Cada linha representa uma capacidade que esta versão consegue verificar ou uma lacuna explicitamente identificada."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <ValueCard
          label="Conectado"
          value={connected + "/" + rows.length}
          detail="Capacidades com fonte real disponível nesta leitura."
        />
        <ValueCard
          label="Produtos registrados"
          value={String(PRODUCTS.length)}
          detail="Fonte canônica de navegação e disponibilidade."
        />
        <ValueCard
          label="Wire · 24h"
          value={String(snapshot.articles.current24hCount ?? 0)}
          detail="Publicações confirmadas na janela editorial."
        />
      </div>

      <section className="rounded-sm border border-border/50 bg-surface/20 p-5 sm:p-6">
        <div className="grid gap-2 md:grid-cols-2">
          {rows.map((row) => (
            <article
              key={row.name}
              className="flex items-start justify-between gap-4 rounded-sm border border-border/40 bg-background/50 p-4"
            >
              <div className="flex min-w-0 items-start gap-3">
                <span
                  className={
                    "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border " +
                    (row.state === "connected"
                      ? "border-neon-green/25 bg-neon-green/5 text-neon-green"
                      : row.state === "partial"
                        ? "border-neon-cyan/25 bg-neon-cyan/5 text-neon-cyan"
                        : "border-border/50 bg-muted/20 text-muted-foreground")
                  }
                >
                  {row.icon}
                </span>
                <div>
                  <h2 className="text-sm font-medium text-foreground">{row.name}</h2>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{row.detail}</p>
                </div>
              </div>
              <Status state={row.state} />
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-sm border border-neon-cyan/25 bg-neon-cyan/5 p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-neon-cyan" />
          <div>
            <h2 className="font-mono-tech text-[10px] uppercase tracking-widest text-foreground">
              Observabilidade futura
            </h2>
            <p className="mt-2 max-w-3xl text-xs leading-relaxed text-muted-foreground">
              Esta tela valida fontes de dados de produto, não substitui monitoramento de runtime.
              Uptime, latência, erro por endpoint e custo de IA exigem telemetria própria antes de
              serem apresentados como indicadores operacionais.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
