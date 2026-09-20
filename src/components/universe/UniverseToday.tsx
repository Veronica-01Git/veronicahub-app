import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Database,
  Newspaper,
  Radio,
  Sparkles,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { formatBRL } from "@/lib/account";
import { PRODUCTS, WIRE_NAME } from "@/lib/ecosystem";

export type UniverseOverview = {
  ok: boolean;
  error?: string;
  admin?: { email: string };
  users?: Array<{
    id: string;
    email: string;
    role: string;
    balanceCents: number;
    freeVideoCredits: number;
    freeImageCredits: number;
    createdAt: string;
  }>;
  topUps?: Array<{
    id: string;
    userId: string;
    amountCents: number;
    status: "PENDENTE" | "PAGO" | "CANCELADO";
    createdAt: string;
    paidAt: string | null;
  }>;
};

export type UniverseArticles = {
  ok: boolean;
  current24hCount?: number;
  articles?: Array<{
    id: string;
    slug: string;
    beat: string;
    headline: string;
    publishedAt: string | null;
  }>;
};

export type UniverseWire = {
  ok: boolean;
  available?: boolean;
  periodDays?: number;
  totalClicks?: number;
  offers?: Array<{ offerId: string; label: string; clicks: number }>;
};

export type UniverseSnapshot = {
  overview: UniverseOverview;
  articles: UniverseArticles;
  wire: UniverseWire;
};

function isSameLocalDay(value: string | null | undefined) {
  if (!value) return false;
  const date = new Date(value);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon,
  accent = "green",
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ReactNode;
  accent?: "green" | "cyan" | "neutral";
}) {
  const accentClass =
    accent === "green"
      ? "text-neon-green border-neon-green/25 bg-neon-green/5"
      : accent === "cyan"
        ? "text-neon-cyan border-neon-cyan/25 bg-neon-cyan/5"
        : "text-muted-foreground border-border/50 bg-surface/30";

  return (
    <article className="group rounded-sm border border-border/50 bg-background/60 p-4 transition duration-200 hover:-translate-y-0.5 hover:border-border">
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono-tech text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
          {label}
        </span>
        <span className={`flex h-8 w-8 items-center justify-center rounded-sm border ${accentClass}`}>
          {icon}
        </span>
      </div>
      <div className="mt-5 font-display text-3xl tracking-tight text-foreground">{value}</div>
      <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">{detail}</p>
    </article>
  );
}

function TelemetryBadge({ ready, children }: { ready: boolean; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 font-mono-tech text-[9px] uppercase tracking-wider ${
        ready
          ? "border-neon-green/30 bg-neon-green/5 text-neon-green"
          : "border-border/50 bg-muted/20 text-muted-foreground"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${ready ? "bg-neon-green animate-pulse" : "bg-muted-foreground/50"}`} />
      {children}
    </span>
  );
}

export function UniverseToday({ snapshot }: { snapshot: UniverseSnapshot }) {
  const users = snapshot.overview.users ?? [];
  const topUps = snapshot.overview.topUps ?? [];
  const paidTopUps = topUps.filter((item) => item.status === "PAGO");
  const paidToday = paidTopUps.filter((item) => isSameLocalDay(item.paidAt));
  const paidTodayCents = paidToday.reduce((sum, item) => sum + item.amountCents, 0);
  const recentPaidCents = paidTopUps.reduce((sum, item) => sum + item.amountCents, 0);
  const pendingCount = topUps.filter((item) => item.status === "PENDENTE").length;
  const availableProducts = PRODUCTS.filter((item) => item.status === "Disponível").length;
  const partialProducts = PRODUCTS.filter((item) =>
    ["Parcial", "Demonstração", "Em produção", "Em estruturação"].includes(item.status),
  );
  const articles = snapshot.articles.articles ?? [];
  const latestArticle = articles[0];
  const wireClicks = snapshot.wire.available ? snapshot.wire.totalClicks ?? 0 : null;

  const attentionItems = [
    {
      title: "Receita por produto ainda não é atribuída ponta a ponta",
      body: "O Universe consegue ler recargas da wallet, mas recarga não é receita reconhecida. Purchase events e entitlements continuam sendo a principal lacuna de telemetria.",
      level: "high" as const,
    },
    ...(partialProducts.length
      ? [
          {
            title: `${partialProducts.length} produtos ainda não estão em estado totalmente disponível`,
            body: partialProducts
              .slice(0, 4)
              .map((item) => `${item.name}: ${item.status}`)
              .join(" · "),
            level: "medium" as const,
          },
        ]
      : []),
    ...(snapshot.wire.available === false
      ? [
          {
            title: "Telemetria comercial do Wire indisponível",
            body: "O conteúdo pode continuar publicado; apenas a leitura de cliques de oferta não respondeu nesta sessão.",
            level: "medium" as const,
          },
        ]
      : []),
    ...(users.length >= 200
      ? [
          {
            title: "Visão de clientes atingiu o limite atual de 200 registros",
            body: "O painel admin carrega no máximo 200 usuários. O total absoluto precisa de uma consulta agregada dedicada antes de virar KPI executivo.",
            level: "low" as const,
          },
        ]
      : []),
  ];

  const flow = [
    {
      step: "01",
      title: "Aquisição",
      products: [WIRE_NAME, "Aula Zero"],
      note: "Conteúdo, SEO e entrada gratuita",
    },
    {
      step: "02",
      title: "Ativação",
      products: ["Studio Criativo", "Currículo-Certo", "Security"],
      note: "Primeiro resultado concreto",
    },
    {
      step: "03",
      title: "Monetização",
      products: ["Wallet", "Prompt Packs", "Currículo-Certo"],
      note: "Recarga, compra e uso pago",
    },
    {
      step: "04",
      title: "Expansão",
      products: ["Formações", "RH", "Rede", "B2B"],
      note: "Cross-sell, recorrência e contratos",
    },
  ];

  return (
    <div className="flex flex-col gap-7" data-universe-element="today">
      <section className="relative overflow-hidden rounded-sm border border-border/50 bg-surface/20 p-5 sm:p-7">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{
            background:
              "radial-gradient(circle at 82% 18%, color-mix(in oklab, var(--neon-green) 12%, transparent), transparent 32%), radial-gradient(circle at 20% 80%, color-mix(in oklab, var(--neon-cyan) 8%, transparent), transparent 35%)",
          }}
        />
        <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 font-mono-tech text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
              <span>VERONICA UNIVERSE</span>
              <span className="text-border">/</span>
              <span className="text-neon-cyan">TODAY</span>
              <TelemetryBadge ready={snapshot.overview.ok}>CORE ONLINE</TelemetryBadge>
            </div>
            <h1 className="mt-5 max-w-3xl font-display text-4xl tracking-tight text-foreground sm:text-5xl">
              O ecossistema inteiro,
              <br />
              <span className="text-neon-green">em uma tela.</span>
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Dados reais quando existem. Lacunas de telemetria aparecem como lacunas — nunca como
              números inventados.
            </p>
          </div>

          <div className="grid min-w-0 gap-2 sm:grid-cols-2 lg:w-[360px]">
            <div className="rounded-sm border border-border/40 bg-background/55 p-3">
              <div className="font-mono-tech text-[9px] uppercase tracking-widest text-muted-foreground">
                Operação
              </div>
              <div className="mt-1 flex items-center gap-2 text-sm text-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-neon-green animate-pulse" />
                Dados administrativos conectados
              </div>
            </div>
            <div className="rounded-sm border border-border/40 bg-background/55 p-3">
              <div className="font-mono-tech text-[9px] uppercase tracking-widest text-muted-foreground">
                Atualização
              </div>
              <div className="mt-1 text-sm text-foreground">
                {new Date().toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section aria-label="Sinais executivos">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-mono-tech text-[10px] uppercase tracking-widest text-foreground">
            <Activity className="h-3.5 w-3.5 text-neon-green" />
            Executive signal strip
          </div>
          <span className="font-mono-tech text-[9px] uppercase tracking-widest text-muted-foreground">
            leitura factual
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard
            label="Recargas pagas hoje"
            value={formatBRL(paidTodayCents)}
            detail="Wallet top-ups confirmados hoje; não equivale a receita reconhecida."
            icon={<Wallet className="h-4 w-4" />}
          />
          <MetricCard
            label="Cadastros carregados"
            value={String(users.length)}
            detail={users.length >= 200 ? "Limite atual do admin: 200 registros." : "Registros retornados pelo admin."}
            icon={<Users className="h-4 w-4" />}
            accent="cyan"
          />
          <MetricCard
            label={`${WIRE_NAME} · 24h`}
            value={String(snapshot.articles.current24hCount ?? 0)}
            detail="Matérias publicadas nas últimas 24 horas."
            icon={<Newspaper className="h-4 w-4" />}
          />
          <MetricCard
            label="Cliques comerciais · 30d"
            value={wireClicks === null ? "—" : String(wireClicks)}
            detail={wireClicks === null ? "Telemetria indisponível." : "Cliques em ofertas próprias do Wire."}
            icon={<BarChart3 className="h-4 w-4" />}
            accent="cyan"
          />
          <MetricCard
            label="Produtos disponíveis"
            value={`${availableProducts}/${PRODUCTS.length}`}
            detail="Fonte canônica do ecossistema, não estimativa."
            icon={<CheckCircle2 className="h-4 w-4" />}
          />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-sm border border-border/50 bg-surface/20 p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-neon-cyan" />
            <h2 className="font-mono-tech text-[10px] uppercase tracking-widest text-foreground">
              O que merece atenção
            </h2>
          </div>
          <div className="mt-5 space-y-3">
            {attentionItems.map((item) => (
              <div key={item.title} className="rounded-sm border border-border/40 bg-background/55 p-4">
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                      item.level === "high"
                        ? "bg-neon-cyan animate-pulse"
                        : item.level === "medium"
                          ? "bg-neon-green"
                          : "bg-muted-foreground"
                    }`}
                  />
                  <div>
                    <h3 className="text-sm font-medium text-foreground">{item.title}</h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{item.body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-sm border border-border/50 bg-surface/20 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CircleDollarSign className="h-4 w-4 text-neon-green" />
              <h2 className="font-mono-tech text-[10px] uppercase tracking-widest text-foreground">
                Money signals
              </h2>
            </div>
            <span className="font-mono-tech text-[9px] uppercase tracking-widest text-muted-foreground">
              base: 50 top-ups mais recentes
            </span>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-sm border border-border/40 bg-background/55 p-4">
              <div className="font-mono-tech text-[9px] uppercase tracking-widest text-muted-foreground">
                Pagos na amostra
              </div>
              <div className="mt-2 font-display text-2xl text-foreground">{formatBRL(recentPaidCents)}</div>
            </div>
            <div className="rounded-sm border border-border/40 bg-background/55 p-4">
              <div className="font-mono-tech text-[9px] uppercase tracking-widest text-muted-foreground">
                Top-ups pagos
              </div>
              <div className="mt-2 font-display text-2xl text-foreground">{paidTopUps.length}</div>
            </div>
            <div className="rounded-sm border border-border/40 bg-background/55 p-4">
              <div className="font-mono-tech text-[9px] uppercase tracking-widest text-muted-foreground">
                Pendentes
              </div>
              <div className="mt-2 font-display text-2xl text-foreground">{pendingCount}</div>
            </div>
          </div>
          <div className="mt-4 rounded-sm border border-neon-cyan/20 bg-neon-cyan/5 p-4 text-xs leading-relaxed text-muted-foreground">
            <strong className="text-foreground">Integridade financeira:</strong> o Universe trata
            recarga como entrada na wallet, não como venda de produto. Receita por produto só deverá
            aparecer quando Orders/Payments/Entitlements estiverem instrumentados.
          </div>
        </article>
      </section>

      <section className="rounded-sm border border-border/50 bg-surface/20 p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 font-mono-tech text-[10px] uppercase tracking-widest text-neon-green">
              <Sparkles className="h-3.5 w-3.5" />
              Economic flow
            </div>
            <h2 className="mt-2 font-display text-2xl text-foreground sm:text-3xl">
              Da atenção ao relacionamento.
            </h2>
          </div>
          <span className="font-mono-tech text-[9px] uppercase tracking-widest text-muted-foreground">
            arquitetura de fluxo · não conversão medida
          </span>
        </div>
        <div className="mt-6 grid gap-3 lg:grid-cols-4">
          {flow.map((item, index) => (
            <div key={item.step} className="relative rounded-sm border border-border/40 bg-background/55 p-4">
              {index < flow.length - 1 && (
                <ArrowRight className="absolute -right-3 top-1/2 z-10 hidden h-5 w-5 -translate-y-1/2 text-neon-green/60 lg:block" />
              )}
              <div className="font-mono-tech text-[9px] uppercase tracking-widest text-neon-cyan">
                {item.step} / {item.title}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {item.products.map((product) => (
                  <span
                    key={product}
                    className="rounded-full border border-border/50 bg-surface/40 px-2 py-1 text-[10px] text-foreground"
                  >
                    {product}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">{item.note}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <article className="rounded-sm border border-border/50 bg-surface/20 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-neon-green" />
              <h2 className="font-mono-tech text-[10px] uppercase tracking-widest text-foreground">
                Product state
              </h2>
            </div>
            <Link
              to="/admin/veronica-universe"
              className="font-mono-tech text-[9px] uppercase tracking-widest text-neon-cyan"
            >
              registry live
            </Link>
          </div>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {PRODUCTS.filter((item) => item.public).slice(0, 10).map((item) => (
              <a
                key={item.id}
                href={item.to}
                target={item.external ? "_blank" : undefined}
                rel={item.external ? "noopener noreferrer" : undefined}
                className="group flex items-center justify-between gap-3 rounded-sm border border-border/40 bg-background/50 p-3 transition hover:border-neon-green/35"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm text-foreground">{item.name}</div>
                  <div className="mt-0.5 truncate font-mono-tech text-[9px] uppercase tracking-wider text-muted-foreground">
                    {item.category}
                  </div>
                </div>
                <span
                  className={`shrink-0 rounded-full border px-2 py-1 font-mono-tech text-[8px] uppercase tracking-wider ${
                    item.status === "Disponível"
                      ? "border-neon-green/30 bg-neon-green/5 text-neon-green"
                      : item.status === "Parcial"
                        ? "border-neon-cyan/30 bg-neon-cyan/5 text-neon-cyan"
                        : "border-border/50 bg-muted/20 text-muted-foreground"
                  }`}
                >
                  {item.status}
                </span>
              </a>
            ))}
          </div>
        </article>

        <article className="rounded-sm border border-border/50 bg-surface/20 p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <Newspaper className="h-4 w-4 text-neon-cyan" />
            <h2 className="font-mono-tech text-[10px] uppercase tracking-widest text-foreground">
              {WIRE_NAME} pulse
            </h2>
          </div>
          <div className="mt-5 rounded-sm border border-border/40 bg-background/55 p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono-tech text-[9px] uppercase tracking-widest text-muted-foreground">
                últimas 24 horas
              </span>
              <strong className="font-display text-2xl text-neon-green">
                {snapshot.articles.current24hCount ?? 0}
              </strong>
            </div>
            {latestArticle ? (
              <div className="mt-5 border-t border-border/30 pt-4">
                <div className="font-mono-tech text-[9px] uppercase tracking-widest text-neon-cyan">
                  publicação mais recente
                </div>
                <h3 className="mt-2 text-sm leading-relaxed text-foreground">{latestArticle.headline}</h3>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                  <span>{latestArticle.beat}</span>
                  <span>·</span>
                  <span>
                    {latestArticle.publishedAt
                      ? new Date(latestArticle.publishedAt).toLocaleString("pt-BR")
                      : "sem horário"}
                  </span>
                </div>
                <a
                  href={`/blog/${latestArticle.slug}`}
                  className="mt-4 inline-flex min-h-10 items-center gap-2 font-mono-tech text-[10px] uppercase tracking-widest text-neon-green"
                >
                  Abrir matéria <ArrowRight className="h-3 w-3" />
                </a>
              </div>
            ) : (
              <div className="mt-5 text-xs text-muted-foreground">Nenhuma matéria retornada.</div>
            )}
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <div className="rounded-sm border border-border/40 bg-background/50 p-3">
              <div className="flex items-center gap-2 font-mono-tech text-[9px] uppercase tracking-widest text-muted-foreground">
                <Database className="h-3 w-3" /> Feed
              </div>
              <div className="mt-2 text-sm text-foreground">Dados editoriais conectados</div>
            </div>
            <div className="rounded-sm border border-border/40 bg-background/50 p-3">
              <div className="flex items-center gap-2 font-mono-tech text-[9px] uppercase tracking-widest text-muted-foreground">
                <Zap className="h-3 w-3" /> Offer tracking
              </div>
              <div className="mt-2 text-sm text-foreground">
                {wireClicks === null ? "Telemetria indisponível" : `${wireClicks} cliques / 30d`}
              </div>
            </div>
          </div>
        </article>
      </section>

      <section className="rounded-sm border border-dashed border-border/60 bg-background/35 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-neon-cyan" />
          <div>
            <h2 className="font-mono-tech text-[10px] uppercase tracking-widest text-foreground">
              Próxima camada de verdade
            </h2>
            <p className="mt-2 max-w-3xl text-xs leading-relaxed text-muted-foreground">
              Para o Universe calcular receita por produto, margem de IA, retenção e Ecosystem
              Expansion Rate sem aproximações, a próxima fundação deve ser uma taxonomia unificada
              de eventos e um Revenue Core com compra/entitlement. Esta tela já diferencia o que é
              medido do que ainda precisa ser conectado.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
