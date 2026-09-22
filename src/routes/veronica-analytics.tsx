import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  ArrowRight,
  BarChart3,
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  Flame,
  LineChart,
  MousePointerClick,
  Play,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Target,
  TrendingUp,
  Wand2,
} from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import {
  affiliateProducts,
  buildTrackedPath,
  hasAffiliateProducts,
  type AffiliateProduct,
} from "@/lib/affiliate-products";
import {
  formatNextRefreshLabel,
  formatRefreshedLabel,
  trendingFeed,
  type FeedCategory,
  type TrendingVideo,
} from "@/lib/trending-videos";

export const Route = createFileRoute("/veronica-analytics")({
  component: VeronicaAnalytics,
  head: () => ({
    meta: [
      { title: "Veronica Analytics — Inteligência de Produtos Shopee" },
      {
        name: "description",
        content:
          "Descubra produtos Shopee, entenda o melhor ângulo de venda e transforme cada oportunidade em conteúdo pronto para publicar.",
      },
      {
        property: "og:title",
        content: "Veronica Analytics — Produtos Shopee que merecem um teste",
      },
      {
        property: "og:description",
        content:
          "Radar de produtos, inteligência criativa e links oficiais de afiliado em uma única jornada.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const theme = {
  "--va-bg": "#f5f6f7",
  "--va-card": "#ffffff",
  "--va-soft": "#eef0f2",
  "--va-ink": "#111214",
  "--va-muted": "#62666d",
  "--va-faint": "#8d9299",
  "--va-line": "#e1e4e7",
  "--va-green": "#0b8f78",
  "--va-pink": "#e11d5e",
  "--va-gold": "#a87000",
} as CSSProperties;

const categoryMeta: Record<FeedCategory, { label: string; color: string }> = {
  beleza: { label: "Beleza", color: "var(--va-pink)" },
  casa: { label: "Casa", color: "var(--va-green)" },
  saude: { label: "Saúde", color: "var(--va-gold)" },
  moda: { label: "Moda", color: "var(--va-pink)" },
  pet: { label: "Pet", color: "var(--va-green)" },
  eletronicos: { label: "Eletrônicos", color: "var(--va-gold)" },
};

const filters: { key: "todos" | FeedCategory; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "beleza", label: "Beleza" },
  { key: "casa", label: "Casa" },
  { key: "saude", label: "Saúde" },
  { key: "moda", label: "Moda" },
  { key: "pet", label: "Pet" },
  { key: "eletronicos", label: "Eletrônicos" },
];

function scriptFor(product: AffiliateProduct) {
  return [
    `Gancho: mostre o problema que ${product.name.toLowerCase()} resolve antes de revelar o produto.`,
    `Demonstração: ${product.angle}`,
    "Prova: mostre o produto funcionando em plano fechado, sem esconder o processo.",
    "Oferta: destaque o benefício principal e informe que preço e disponibilidade são conferidos na Shopee.",
    "CTA: toque no link para conferir a oferta completa na Shopee.",
  ];
}

function ProductCard({
  product,
  isCategoryTrending,
}: {
  product: AffiliateProduct;
  isCategoryTrending: boolean;
}) {
  const [scriptOpen, setScriptOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const meta = categoryMeta[product.category];
  const trackedPath = buildTrackedPath(product, { handle: "", placement: "analytics_catalogo" });
  const script = scriptFor(product);

  async function copyScript() {
    try {
      await navigator.clipboard.writeText(
        script.map((line, index) => `${index + 1}. ${line}`).join("\n"),
      );
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <article
      className="overflow-hidden rounded-[28px] border bg-white transition duration-300 hover:-translate-y-1 hover:shadow-[0_25px_80px_rgba(17,18,20,0.09)]"
      style={{ borderColor: "var(--va-line)" }}
    >
      <div className="grid lg:grid-cols-[0.38fr_1fr]">
        <div
          className="relative min-h-64 overflow-hidden p-6 text-white"
          style={{ background: "linear-gradient(150deg, #111315 0%, #23272b 100%)" }}
        >
          <div
            aria-hidden
            className="absolute -right-14 -top-16 h-48 w-48 rounded-full border border-white/10"
          />
          <div
            aria-hidden
            className="absolute -bottom-24 -left-14 h-64 w-64 rounded-full opacity-70 blur-3xl"
            style={{ background: meta.color }}
          />
          <div className="relative flex h-full flex-col">
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono-tech text-[9px] uppercase tracking-[0.18em] text-white/50">
                Shopee Radar
              </span>
              <span className="rounded-full bg-white/10 px-2.5 py-1 font-mono-tech text-[9px] uppercase tracking-[0.12em]">
                {meta.label}
              </span>
            </div>
            <ShoppingBag className="mt-10 h-12 w-12" strokeWidth={1.2} />
            <div className="mt-auto pt-12">
              <span className="font-mono-tech text-[9px] uppercase tracking-[0.16em] text-white/45">
                Oferta atual
              </span>
              <p className="mt-2 font-display text-3xl leading-none">{product.priceLabel}</p>
              {isCategoryTrending && (
                <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[var(--va-pink)] px-3 py-1.5 font-mono-tech text-[9px] font-semibold uppercase tracking-[0.1em]">
                  <Flame className="h-3 w-3" /> categoria em observação
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col p-6 sm:p-8">
          <div
            className="flex flex-wrap items-center gap-2 font-mono-tech text-[9.5px] uppercase tracking-[0.14em]"
            style={{ color: "var(--va-faint)" }}
          >
            <span className="flex items-center gap-1.5 text-[var(--va-green)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--va-green)]" /> link oficial ativo
            </span>
            <span>·</span>
            <span>produto de terceiro</span>
            <span>·</span>
            <span>catálogo Shopee</span>
          </div>
          <h3 className="mt-4 max-w-2xl text-xl font-semibold leading-[1.3] sm:text-2xl">
            {product.name}
          </h3>
          <p
            className="mt-4 max-w-2xl text-[13.5px] leading-[1.7]"
            style={{ color: "var(--va-muted)" }}
          >
            <strong style={{ color: "var(--va-ink)" }}>Ângulo sugerido:</strong> {product.angle}
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div
              className="rounded-2xl border p-4"
              style={{ borderColor: "var(--va-line)", background: "var(--va-bg)" }}
            >
              <span
                className="font-mono-tech text-[8.5px] uppercase tracking-[0.15em]"
                style={{ color: "var(--va-faint)" }}
              >
                Fonte
              </span>
              <p className="mt-2 text-[12.5px] font-medium">Shopee Brasil</p>
            </div>
            <div
              className="rounded-2xl border p-4"
              style={{ borderColor: "var(--va-line)", background: "var(--va-bg)" }}
            >
              <span
                className="font-mono-tech text-[8.5px] uppercase tracking-[0.15em]"
                style={{ color: "var(--va-faint)" }}
              >
                {product.commissionLabel ? "Comissão" : "Vínculo afiliado"}
              </span>
              <p className="mt-2 text-[12.5px] font-medium">
                {product.commissionLabel ?? "Link oficial Shopee"}
              </p>
            </div>
            <div
              className="rounded-2xl border p-4"
              style={{ borderColor: "var(--va-line)", background: "var(--va-bg)" }}
            >
              <span
                className="font-mono-tech text-[8.5px] uppercase tracking-[0.15em]"
                style={{ color: "var(--va-faint)" }}
              >
                Status
              </span>
              <p className="mt-2 text-[12.5px] font-medium text-[var(--va-green)]">
                Pronto para divulgar
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-2 sm:grid-cols-3">
            <a
              href={trackedPath}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-black px-4 py-3 font-mono-tech text-[10px] font-semibold uppercase tracking-[0.1em] text-white transition hover:-translate-y-0.5 hover:bg-[var(--va-pink)]"
            >
              Ver na Shopee{" "}
              <ExternalLink className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </a>
            <button
              type="button"
              onClick={() => setScriptOpen((value) => !value)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 font-mono-tech text-[10px] font-semibold uppercase tracking-[0.1em] transition hover:-translate-y-0.5"
              style={{ borderColor: "var(--va-line)" }}
            >
              <Wand2 className="h-3.5 w-3.5" /> Roteiro de venda{" "}
              <ChevronDown className={`h-3.5 w-3.5 transition ${scriptOpen ? "rotate-180" : ""}`} />
            </button>
            <Link
              to="/video-ia"
              className="inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 font-mono-tech text-[10px] font-semibold uppercase tracking-[0.1em] transition hover:-translate-y-0.5"
              style={{ borderColor: "var(--va-line)" }}
            >
              Produzir no Studio <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {scriptOpen && (
            <div
              className="mt-4 rounded-2xl border p-5"
              style={{ borderColor: "var(--va-line)", background: "var(--va-bg)" }}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="font-mono-tech text-[9px] uppercase tracking-[0.16em] text-[var(--va-pink)]">
                    Roteiro curto · 20–30s
                  </span>
                  <p className="mt-1 text-[12px]" style={{ color: "var(--va-muted)" }}>
                    Estrutura pronta para adaptar ao seu vídeo.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={copyScript}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-2 font-mono-tech text-[9px] font-semibold uppercase tracking-[0.1em]"
                >
                  {copied ? (
                    <Check className="h-3 w-3 text-[var(--va-green)]" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                  {copied ? "Copiado" : "Copiar roteiro"}
                </button>
              </div>
              <ol className="mt-5 space-y-3">
                {script.map((line, index) => (
                  <li
                    key={line}
                    className="flex gap-3 text-[12.5px] leading-[1.6]"
                    style={{ color: "var(--va-muted)" }}
                  >
                    <span className="font-mono-tech text-[9px] text-[var(--va-faint)]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span>{line}</span>
                  </li>
                ))}
              </ol>
              <span className="sr-only" aria-live="polite">
                {copied ? "Roteiro copiado." : ""}
              </span>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function CreativeCard({ video }: { video: TrendingVideo }) {
  const meta = categoryMeta[video.category];
  return (
    <article
      className="group overflow-hidden rounded-[24px] border bg-white transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(17,18,20,0.08)]"
      style={{ borderColor: "var(--va-line)" }}
    >
      <div
        className="relative flex aspect-[16/10] items-center justify-center overflow-hidden"
        style={{ backgroundImage: video.gradient }}
      >
        {video.thumbnailUrl && (
          <img
            src={video.thumbnailUrl}
            alt=""
            aria-hidden
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        )}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20"
        />
        <span className="absolute left-3 top-3 rounded-full bg-black/70 px-2.5 py-1 font-mono-tech text-[9px] text-white backdrop-blur">
          {video.gmvLabel}
        </span>
        <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-[var(--va-pink)] px-2.5 py-1 font-mono-tech text-[9px] font-semibold text-white">
          <TrendingUp className="h-3 w-3" /> {video.growthLabel}
        </span>
        <span className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white/90 shadow-lg">
          <Play className="ml-0.5 h-4 w-4 fill-black text-black" />
        </span>
      </div>
      <div className="p-5">
        <div
          className="flex items-center justify-between gap-3 font-mono-tech text-[9.5px] uppercase tracking-[0.12em]"
          style={{ color: "var(--va-faint)" }}
        >
          <span style={{ color: meta.color }}>{meta.label}</span>
          <span>{video.views}</span>
        </div>
        <h3 className="mt-3 text-[15px] font-semibold leading-[1.4]">{video.title}</h3>
        <p className="mt-2 text-[12.5px] leading-[1.6]" style={{ color: "var(--va-muted)" }}>
          {video.hook}
        </p>
        <Link
          to="/video-ia"
          className="mt-5 flex items-center justify-between border-t pt-4 font-mono-tech text-[9.5px] font-semibold uppercase tracking-[0.11em] transition group-hover:text-[var(--va-pink)]"
          style={{ borderColor: "var(--va-line)" }}
        >
          Adaptar no Studio{" "}
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </article>
  );
}

function VeronicaAnalytics() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<"todos" | FeedCategory>("todos");
  const [, forceClock] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => forceClock((value) => value + 1), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const productResults = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
    return affiliateProducts.filter((product) => {
      const matchesCategory = activeCategory === "todos" || product.category === activeCategory;
      const matchesQuery =
        !normalizedQuery ||
        product.name.toLocaleLowerCase("pt-BR").includes(normalizedQuery) ||
        product.angle.toLocaleLowerCase("pt-BR").includes(normalizedQuery) ||
        categoryMeta[product.category].label.toLocaleLowerCase("pt-BR").includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, query]);

  const feedCategories = useMemo(
    () => new Set(trendingFeed.videos.map((video) => video.category)),
    [],
  );
  const refreshedLabel = formatRefreshedLabel(trendingFeed.refreshedAt);
  const nextRefreshLabel = formatNextRefreshLabel(
    trendingFeed.refreshedAt,
    trendingFeed.cycleHours,
  );

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{ ...theme, background: "var(--va-bg)", color: "var(--va-ink)" }}
    >
      <SiteHeader />

      <main>
        <section
          className="relative overflow-hidden border-b bg-white px-6 py-14 md:py-20 lg:py-24"
          style={{ borderColor: "var(--va-line)" }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 12% 12%, color-mix(in oklab, var(--va-green) 10%, transparent), transparent 36%), radial-gradient(circle at 85% 72%, color-mix(in oklab, var(--va-pink) 9%, transparent), transparent 38%)",
            }}
          />
          <div className="relative mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1.12fr_0.88fr] lg:items-center">
            <div>
              <div
                className="inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 font-mono-tech text-[9.5px] uppercase tracking-[0.18em] text-[var(--va-pink)]"
                style={{ borderColor: "var(--va-line)" }}
              >
                <Sparkles className="h-3 w-3" /> Veronica Analytics · Shopee Intelligence
              </div>
              <div
                className="mt-5 flex flex-wrap items-center gap-2 font-mono-tech text-[9px] uppercase tracking-[0.16em]"
                style={{ color: "var(--va-faint)" }}
              >
                <span className="flex items-center gap-1.5 text-[var(--va-green)]">
                  <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-[var(--va-green)]" />{" "}
                  radar ativo
                </span>
                <span>·</span>
                <span>{refreshedLabel}</span>
                <span>·</span>
                <span>{nextRefreshLabel}</span>
              </div>
              <h1
                className="mt-5 max-w-3xl font-display text-[42px] leading-[0.96] sm:text-6xl lg:text-7xl"
                style={{ letterSpacing: "-0.045em" }}
              >
                Produtos para vender. Conteúdo para converter.
              </h1>
              <p
                className="mt-6 max-w-2xl text-[15px] leading-[1.75] sm:text-[16px]"
                style={{ color: "var(--va-muted)" }}
              >
                Uma inteligência comercial inspirada no Kalodata, redesenhada para a Shopee:
                encontre ofertas, entenda o ângulo vencedor e execute a campanha sem sair do
                ecossistema Veronica.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#produtos"
                  className="group inline-flex items-center justify-center gap-2 rounded-full bg-black px-6 py-3.5 font-mono-tech text-[10px] font-semibold uppercase tracking-[0.13em] text-white transition hover:-translate-y-0.5 hover:bg-[var(--va-pink)]"
                >
                  Explorar produtos Shopee{" "}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </a>
                <a
                  href="#criativos"
                  className="inline-flex items-center justify-center gap-2 rounded-full border bg-white px-6 py-3.5 font-mono-tech text-[10px] font-semibold uppercase tracking-[0.13em] transition hover:-translate-y-0.5"
                  style={{ borderColor: "var(--va-line)" }}
                >
                  Ver criativos em alta
                </a>
              </div>
              <div
                className="mt-6 flex flex-wrap gap-x-5 gap-y-2 font-mono-tech text-[9px] uppercase tracking-[0.12em]"
                style={{ color: "var(--va-faint)" }}
              >
                <span className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-[var(--va-green)]" /> somente Shopee nesta fase
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-[var(--va-green)]" /> links oficiais do
                  catálogo
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-[var(--va-green)]" /> roteiro com IA
                </span>
              </div>
            </div>

            <aside
              className="mx-auto w-full max-w-md rounded-[30px] border bg-[#111315] p-3 text-white shadow-[0_34px_100px_rgba(17,18,20,0.22)] lg:justify-self-end"
              style={{ borderColor: "rgba(255,255,255,.08)" }}
            >
              <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-5">
                <div className="flex items-center justify-between font-mono-tech text-[9px] uppercase tracking-[0.16em] text-white/45">
                  <span>Painel comercial</span>
                  <span className="text-emerald-300">beta · ao vivo</span>
                </div>
                <h2 className="mt-8 font-display text-3xl leading-none">Decisão em uma tela.</h2>
                <p className="mt-3 text-[12.5px] leading-[1.65] text-white/55">
                  Produto, ângulo, roteiro, link e execução conectados na mesma jornada.
                </p>
                <div className="mt-7 grid grid-cols-2 gap-2">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <span className="font-mono-tech text-[8px] uppercase tracking-[0.14em] text-white/35">
                      Ofertas ativas
                    </span>
                    <p className="mt-2 font-display text-3xl">{affiliateProducts.length}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <span className="font-mono-tech text-[8px] uppercase tracking-[0.14em] text-white/35">
                      Sinais criativos
                    </span>
                    <p className="mt-2 font-display text-3xl">{trendingFeed.videos.length}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <span className="font-mono-tech text-[8px] uppercase tracking-[0.14em] text-white/35">
                      Marketplace
                    </span>
                    <p className="mt-2 text-[13px] font-semibold">Shopee Brasil</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <span className="font-mono-tech text-[8px] uppercase tracking-[0.14em] text-white/35">
                      Atualização
                    </span>
                    <p className="mt-2 text-[13px] font-semibold">
                      {trendingFeed.cycleHours} horas
                    </p>
                  </div>
                </div>
                <a
                  href="#produtos"
                  className="mt-2 flex items-center justify-between rounded-2xl border border-white/10 bg-white px-4 py-3 text-black transition hover:bg-emerald-300"
                >
                  <span className="font-mono-tech text-[9.5px] font-semibold uppercase tracking-[0.12em]">
                    Abrir radar de produtos
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </aside>
          </div>
        </section>

        <section className="border-b bg-white px-6 py-10" style={{ borderColor: "var(--va-line)" }}>
          <div
            className="mx-auto grid max-w-6xl gap-px overflow-hidden rounded-[24px] border md:grid-cols-4"
            style={{ borderColor: "var(--va-line)", background: "var(--va-line)" }}
          >
            {[
              { icon: Search, label: "Descobrir", text: "produto com link ativo" },
              { icon: BarChart3, label: "Analisar", text: "ângulo e sinal de demanda" },
              { icon: Wand2, label: "Criar", text: "roteiro e conteúdo" },
              { icon: MousePointerClick, label: "Monetizar", text: "clique no link Shopee" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-center gap-3 bg-white p-5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-black text-white">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-[13px] font-semibold">{item.label}</p>
                    <p className="mt-0.5 text-[10.5px]" style={{ color: "var(--va-faint)" }}>
                      {item.text}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section
          id="produtos"
          className="scroll-mt-20 border-b px-6 py-16 md:py-24"
          style={{ borderColor: "var(--va-line)" }}
        >
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <span className="font-mono-tech text-[9.5px] uppercase tracking-[0.18em] text-[var(--va-pink)]">
                  Product intelligence
                </span>
                <h2
                  className="mt-3 font-display text-4xl sm:text-5xl"
                  style={{ letterSpacing: "-0.035em" }}
                >
                  Radar de produtos Shopee.
                </h2>
                <p
                  className="mt-3 max-w-2xl text-[13.5px] leading-[1.65]"
                  style={{ color: "var(--va-muted)" }}
                >
                  O catálogo começa enxuto e verificável. Cada oferta precisa ter link oficial
                  ativo, ângulo de conteúdo e destino rastreado antes de aparecer aqui.
                </p>
              </div>
              <div className="relative w-full max-w-sm">
                <Search
                  className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2"
                  style={{ color: "var(--va-faint)" }}
                />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar produto ou categoria"
                  className="w-full rounded-full border bg-white py-3 pl-11 pr-4 text-[13px] outline-none focus:ring-2"
                  style={
                    {
                      borderColor: "var(--va-line)",
                      "--tw-ring-color": "var(--va-green)",
                    } as CSSProperties
                  }
                />
              </div>
            </div>
            <div className="mt-7 flex flex-wrap gap-2">
              {filters.map((filter) => {
                const active = activeCategory === filter.key;
                return (
                  <button
                    key={filter.key}
                    type="button"
                    onClick={() => setActiveCategory(filter.key)}
                    className="rounded-full border px-3.5 py-2 font-mono-tech text-[9.5px] font-medium transition"
                    style={
                      active
                        ? {
                            borderColor: "var(--va-ink)",
                            background: "var(--va-ink)",
                            color: "white",
                          }
                        : {
                            borderColor: "var(--va-line)",
                            background: "white",
                            color: "var(--va-muted)",
                          }
                    }
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>

            {!hasAffiliateProducts ? (
              <div
                className="mt-8 rounded-[24px] border bg-white p-8 text-center"
                style={{ borderColor: "var(--va-line)" }}
              >
                <p className="text-[13px]" style={{ color: "var(--va-muted)" }}>
                  Nenhum produto com link oficial validado está ativo no momento.
                </p>
              </div>
            ) : productResults.length > 0 ? (
              <div className="mt-8 space-y-5">
                {productResults.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isCategoryTrending={feedCategories.has(product.category)}
                  />
                ))}
              </div>
            ) : (
              <div
                className="mt-8 rounded-[24px] border bg-white p-8 text-center"
                style={{ borderColor: "var(--va-line)" }}
              >
                <p className="text-[13px]" style={{ color: "var(--va-muted)" }}>
                  Nenhum produto ativo corresponde a esse filtro.
                </p>
              </div>
            )}

            <div
              className="mt-5 flex gap-3 rounded-[20px] border bg-white p-4"
              style={{ borderColor: "var(--va-line)" }}
            >
              <ShieldCheck className="mt-0.5 h-4 w-4 flex-none text-[var(--va-green)]" />
              <p className="text-[11.5px] leading-[1.65]" style={{ color: "var(--va-muted)" }}>
                Os botões desta vitrine usam os links afiliados oficiais cadastrados pela Veronica.
                Preço, disponibilidade, pedido e comissão são definidos e confirmados pela Shopee.
                Clique não equivale a venda.
              </p>
            </div>
          </div>
        </section>

        <section
          id="criativos"
          className="scroll-mt-20 border-b bg-white px-6 py-16 md:py-24"
          style={{ borderColor: "var(--va-line)" }}
        >
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-6 md:grid-cols-[1fr_0.7fr] md:items-end">
              <div>
                <span className="font-mono-tech text-[9.5px] uppercase tracking-[0.18em] text-[var(--va-green)]">
                  Creative intelligence
                </span>
                <h2
                  className="mt-3 font-display text-4xl sm:text-5xl"
                  style={{ letterSpacing: "-0.035em" }}
                >
                  Formatos que prendem atenção.
                </h2>
              </div>
              <p
                className="text-[13px] leading-[1.65] md:justify-self-end"
                style={{ color: "var(--va-muted)" }}
              >
                Use estes sinais editoriais como inspiração para divulgar produtos Shopee. GMV,
                views e crescimento são estimativas de curadoria, não dados oficiais da Shopee.
              </p>
            </div>
            <div
              className="mt-5 flex items-center gap-2 font-mono-tech text-[9px] uppercase tracking-[0.14em]"
              style={{ color: "var(--va-faint)" }}
            >
              <LineChart className="h-3.5 w-3.5" /> {trendingFeed.sourceLabel} · {refreshedLabel} ·{" "}
              {nextRefreshLabel}
            </div>
            <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {trendingFeed.videos.map((video) => (
                <CreativeCard key={video.id} video={video} />
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-16 md:py-20">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-4 md:grid-cols-3">
              {[
                {
                  icon: Target,
                  eyebrow: "Estimativa",
                  title: "Radar editorial",
                  text: "Serve para escolher o que testar primeiro; não promete faturamento.",
                },
                {
                  icon: MousePointerClick,
                  eyebrow: "Telemetria",
                  title: "Clique rastreado",
                  text: "Mede o encaminhamento do Hub até a oferta cadastrada.",
                },
                {
                  icon: ShieldCheck,
                  eyebrow: "Confirmação",
                  title: "Venda na Shopee",
                  text: "A plataforma valida pedido, atribuição e comissão conforme suas regras.",
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <article
                    key={item.title}
                    className="rounded-[22px] border bg-white p-6"
                    style={{ borderColor: "var(--va-line)" }}
                  >
                    <div className="flex items-center justify-between">
                      <Icon className="h-5 w-5 text-[var(--va-green)]" />
                      <span
                        className="font-mono-tech text-[8.5px] uppercase tracking-[0.15em]"
                        style={{ color: "var(--va-faint)" }}
                      >
                        {item.eyebrow}
                      </span>
                    </div>
                    <h3 className="mt-6 text-[16px] font-semibold">{item.title}</h3>
                    <p
                      className="mt-2 text-[12.5px] leading-[1.6]"
                      style={{ color: "var(--va-muted)" }}
                    >
                      {item.text}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-[#111315] px-6 py-16 text-white md:py-20">
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <span className="font-mono-tech text-[9px] uppercase tracking-[0.18em] text-emerald-300">
                Execução conectada
              </span>
              <h2
                className="mt-4 max-w-3xl font-display text-4xl leading-none sm:text-5xl"
                style={{ letterSpacing: "-0.035em" }}
              >
                Descobriu o produto. Agora crie o anúncio.
              </h2>
              <p className="mt-4 max-w-2xl text-[14px] leading-[1.7] text-white/55">
                Leve o ângulo e o roteiro para o Studio Criativo. A Veronica organiza imagem, voz,
                avatar e vídeo numa única produção.
              </p>
            </div>
            <Link
              to="/video-ia"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 font-mono-tech text-[10px] font-semibold uppercase tracking-[0.13em] text-black transition hover:-translate-y-0.5 hover:bg-emerald-300"
            >
              Abrir Studio Criativo{" "}
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
