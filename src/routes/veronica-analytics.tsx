import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  BarChart3,
  Bookmark,
  Check,
  ChevronRight,
  Copy,
  ExternalLink,
  LayoutDashboard,
  Link2,
  MousePointerClick,
  Plus,
  RefreshCw,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { buildTrackedPath, type AffiliateProduct } from "@/lib/affiliate-products";
import { getPublicAffiliateCatalog } from "@/lib/affiliate-catalog-server";
import { getMyAffiliate } from "@/lib/affiliate-account-server";
import { getMyAffiliateAnalytics } from "@/lib/affiliate-analytics-server";
import {
  ANALYTICS_PERIODS,
  ANALYTICS_SOURCES,
  analyticsSourceLabel,
  type AnalyticsPeriod,
} from "@/lib/affiliate-analytics";

export const Route = createFileRoute("/veronica-analytics")({
  component: VeronicaAnalytics,
  loader: () => getPublicAffiliateCatalog(),
  head: () => ({
    meta: [
      { title: "Veronica Analytics — Ofertas, links e resultados" },
      {
        name: "description",
        content:
          "Explore ofertas Shopee, prepare sua divulgação e acompanhe os cliques dos seus links com a Veronica.",
      },
      { property: "og:title", content: "Veronica Analytics — Sua próxima divulgação começa aqui" },
      {
        property: "og:description",
        content: "Ofertas, comparação, conteúdo e resultados em um só lugar.",
      },
      {
        property: "og:image",
        content: "https://veronicahub.com/images/home/platforms/analytics-1280.webp",
      },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

type Tab = "resumo" | "ofertas" | "links" | "resultados";
type Account = Awaited<ReturnType<typeof getMyAffiliate>>;
type Stats = Awaited<ReturnType<typeof getMyAffiliateAnalytics>>;
const tabs = [
  { key: "resumo", label: "Resumo", icon: LayoutDashboard },
  { key: "ofertas", label: "Ofertas", icon: ShoppingBag },
  { key: "links", label: "Meus links", icon: Link2 },
  { key: "resultados", label: "Resultados", icon: BarChart3 },
] as const;
const categories = [
  { key: "todos", label: "Todas" },
  { key: "beleza", label: "Beleza" },
  { key: "casa", label: "Casa" },
  { key: "saude", label: "Saúde" },
  { key: "moda", label: "Moda" },
  { key: "pet", label: "Pet" },
  { key: "eletronicos", label: "Eletrônicos" },
];
const labelFor = (key: string) => categories.find((category) => category.key === key)?.label ?? key;
const number = (value: number) => new Intl.NumberFormat("pt-BR").format(value);
const dateLabel = (date: string) => `${date.slice(8, 10)}/${date.slice(5, 7)}`;
const button =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40";
const card = "rounded-[26px] border border-black/[0.07] bg-white";

function ProductImage({
  product,
  className = "",
}: {
  product: AffiliateProduct;
  className?: string;
}) {
  const [broken, setBroken] = useState(false);
  return (
    <div className={`relative overflow-hidden bg-[#f0f2f1] ${className}`}>
      {product.coverUrl && !broken ? (
        <img
          src={product.coverUrl}
          alt={product.name}
          loading="lazy"
          onError={() => setBroken(true)}
          className="h-full w-full object-contain p-5 transition duration-500 motion-safe:group-hover:scale-105"
        />
      ) : (
        <div className="flex h-full min-h-40 flex-col items-center justify-center gap-3 text-[#8b9690]">
          <ShoppingBag size={42} strokeWidth={1} />
          <span className="text-xs">Imagem não disponível</span>
        </div>
      )}
    </div>
  );
}

function OfferCard({
  product,
  saved,
  compared,
  onSave,
  onCompare,
  onOpen,
}: {
  product: AffiliateProduct;
  saved: boolean;
  compared: boolean;
  onSave: () => void;
  onCompare: () => void;
  onOpen: () => void;
}) {
  return (
    <article
      className={`${card} group overflow-hidden transition motion-safe:hover:-translate-y-1 hover:shadow-[0_16px_48px_-24px_rgba(0,0,0,.2)]`}
    >
      <div className="relative">
        <button
          type="button"
          onClick={onOpen}
          className="block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-600"
          aria-label={`Ver detalhes de ${product.name}`}
        >
          <ProductImage product={product} className="aspect-[4/3]" />
        </button>
        <button
          type="button"
          onClick={onSave}
          aria-label={`${saved ? "Remover dos salvos" : "Salvar"}: ${product.name}`}
          aria-pressed={saved}
          className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full border border-black/5 bg-white/95 shadow-sm focus-visible:ring-2 focus-visible:ring-emerald-600"
        >
          <Bookmark
            size={17}
            className={saved ? "fill-emerald-700 text-emerald-700" : "text-[#5e6662]"}
          />
        </button>
      </div>
      <div className="p-5">
        <div className="flex items-center justify-between gap-2 text-[11px] font-medium text-[#747c77]">
          <span>{labelFor(product.category)}</span>
          <span>Shopee</span>
        </div>
        <button
          type="button"
          onClick={onOpen}
          className="mt-3 block min-h-12 text-left text-base font-semibold leading-6 tracking-[-.02em] hover:text-emerald-800 focus-visible:ring-2 focus-visible:ring-emerald-600"
        >
          {product.name}
        </button>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] text-[#7d847f]">Preço cadastrado</p>
            <p className="mt-1 text-xl font-semibold tracking-tight">{product.priceLabel}</p>
          </div>
          {product.commissionLabel && (
            <span className="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-[11px] font-medium text-emerald-800">
              Comissão {product.commissionLabel}
            </span>
          )}
        </div>
        <div className="mt-5 flex items-center gap-2 border-t border-black/5 pt-4">
          <button
            type="button"
            onClick={onOpen}
            className={`${button} flex-1 bg-[#14271e] px-3 text-white hover:bg-emerald-900`}
          >
            Explorar oferta <ArrowRight size={15} />
          </button>
          <button
            type="button"
            onClick={onCompare}
            aria-pressed={compared}
            aria-label={`${compared ? "Remover da comparação" : "Comparar"}: ${product.name}`}
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border focus-visible:ring-2 focus-visible:ring-emerald-600 ${compared ? "border-emerald-600 bg-emerald-50 text-emerald-800" : "border-black/10 text-[#6c746e]"}`}
          >
            {compared ? <Check size={16} /> : <SlidersHorizontal size={16} />}
          </button>
        </div>
      </div>
    </article>
  );
}

function ClickChart({ daily }: { daily: { date: string; clicks: number }[] }) {
  const max = Math.max(1, ...daily.map((day) => day.clicks));
  const width = 620 / daily.length;
  return (
    <div>
      <svg
        viewBox="0 0 640 185"
        className="mt-7 w-full"
        role="img"
        aria-label={`Cliques diários: ${daily.map((day) => `${dateLabel(day.date)}: ${day.clicks}`).join("; ")}`}
      >
        {[0, 1, 2].map((line) => (
          <line
            key={line}
            x1="10"
            x2="630"
            y1={15 + line * 65}
            y2={15 + line * 65}
            stroke="#eef1ee"
          />
        ))}
        {daily.map((day, index) => (
          <rect
            key={day.date}
            x={10 + index * width}
            y={145 - (day.clicks / max) * 125}
            width={Math.max(1, width - 3)}
            height={(day.clicks / max) * 125}
            rx={Math.min(4, width / 4)}
            fill="#167858"
          >
            <title>
              {dateLabel(day.date)}: {day.clicks} cliques
            </title>
          </rect>
        ))}
        <text x="10" y="175" fontSize="11" fill="#788179">
          {dateLabel(daily[0].date)}
        </text>
        <text x="630" y="175" textAnchor="end" fontSize="11" fill="#788179">
          {dateLabel(daily[daily.length - 1].date)}
        </text>
      </svg>
      <p className="mt-2 text-xs text-[#8b938d]">
        Dias em UTC · escala máxima: {number(max)} cliques
      </p>
    </div>
  );
}

function creativeKit(product: AffiliateProduct) {
  return `GANCHO\nVocê já precisou de uma solução como ${product.name}?\n\nDEMONSTRAÇÃO\n${product.angle}\nMostre o produto em uso e descreva apenas o que você verificou.\n\nLEGENDA\n${product.name}: conheça os detalhes e confira preço e disponibilidade na Shopee. Link de afiliado — uma compra elegível pode gerar comissão.\n\nCHAMADA\nConfira a oferta pelo meu link.\n\nHASHTAGS\n#Achadinhos #Shopee #${labelFor(product.category).replace(/\s/g, "")}`;
}

function VeronicaAnalytics() {
  const { products } = Route.useLoaderData();
  const [tab, setTab] = useState<Tab>("resumo");
  const [account, setAccount] = useState<Account | null>(null);
  const [accountError, setAccountError] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [days, setDays] = useState<AnalyticsPeriod>(30);
  const [reload, setReload] = useState(0);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("todos");
  const [audience, setAudience] = useState("todos");
  const [savedOnly, setSavedOnly] = useState(false);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [storageReady, setStorageReady] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [selected, setSelected] = useState<AffiliateProduct | null>(null);
  const [kit, setKit] = useState("");
  const [source, setSource] = useState<string>("link_divulgador");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    try {
      const saved: unknown = JSON.parse(
        localStorage.getItem("veronica.analytics.saved.v1") ?? "[]",
      );
      if (Array.isArray(saved))
        setSavedIds(saved.filter((id): id is string => typeof id === "string").slice(0, 100));
    } catch {
      setStorageError(true);
    }
    setStorageReady(true);
  }, []);
  useEffect(() => {
    if (!storageReady) return;
    try {
      localStorage.setItem("veronica.analytics.saved.v1", JSON.stringify(savedIds));
    } catch {
      setStorageError(true);
    }
  }, [savedIds, storageReady]);
  useEffect(() => {
    let active = true;
    setAccount(null);
    setAccountError(false);
    getMyAffiliate()
      .then((next) => {
        if (active) setAccount(next);
      })
      .catch(() => {
        if (active) setAccountError(true);
      });
    return () => {
      active = false;
    };
  }, [reload]);
  useEffect(() => {
    let active = true;
    setStats(null);
    if (account?.ok) {
      getMyAffiliateAnalytics({ data: { days } })
        .then((next) => {
          if (active) setStats(next);
        })
        .catch(() => {
          if (active) setStats({ ok: false, reason: "indisponivel" });
        });
    }
    return () => {
      active = false;
    };
  }, [account, days]);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 4000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const code = account?.ok ? account.code : null;
  const measured = stats?.ok ? stats : null;
  const savedProducts = products.filter((product) => savedIds.includes(product.id));
  const compared = products.filter((product) => compareIds.includes(product.id));
  const clicks = useMemo(
    () => new Map(measured?.byProduct.map((row) => [row.productId, row.clicks]) ?? []),
    [measured],
  );
  const results = useMemo(
    () =>
      products.filter((product) => {
        const search = `${product.name} ${product.angle} ${labelFor(product.category)}`
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase();
        const term = query
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .trim();
        return (
          search.includes(term) &&
          (category === "todos" || product.category === category) &&
          (audience === "todos" ||
            !product.audience ||
            product.audience === "unissex" ||
            product.audience === audience) &&
          (!savedOnly || savedIds.includes(product.id))
        );
      }),
    [products, query, category, audience, savedOnly, savedIds],
  );

  function save(id: string) {
    setSavedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }
  function compare(id: string) {
    if (!compareIds.includes(id) && compareIds.length >= 3) {
      setNotice("Compare até 3 produtos. Remova um para adicionar outro.");
      return;
    }
    setCompareIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }
  function open(product: AffiliateProduct) {
    setSelected(product);
    setKit(creativeKit(product));
  }
  function linkFor(product: AffiliateProduct) {
    return buildTrackedPath(product, {
      handle: code ?? "",
      placement: code ? source : "analytics_catalogo",
    });
  }
  async function copy(text: string, message: string) {
    try {
      await navigator.clipboard.writeText(text);
      setNotice(message);
    } catch {
      setNotice("Não foi possível copiar. Selecione o texto e copie manualmente.");
    }
  }
  function share(product: AffiliateProduct) {
    if (code)
      void copy(
        `${window.location.origin}${linkFor(product)}`,
        "Link copiado com a origem selecionada.",
      );
  }
  function downloadResults() {
    if (!measured) return;
    const names = new Map(products.map((product) => [product.id, product.name]));
    const escape = (value: string) => `"${value.replace(/^[=+@-]/, "'$&").replace(/"/g, '""')}"`;
    const rows = [
      "produto;cliques;periodo_dias",
      ...measured.byProduct.map(
        (row) => `${escape(names.get(row.productId) ?? row.productId)};${row.clicks};${days}`,
      ),
    ];
    const url = URL.createObjectURL(
      new Blob(["\uFEFF", rows.join("\r\n")], { type: "text/csv;charset=utf-8" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `veronica-cliques-${days}dias.csv`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const offerCard = (product: AffiliateProduct) => (
    <OfferCard
      key={product.id}
      product={product}
      saved={savedIds.includes(product.id)}
      compared={compareIds.includes(product.id)}
      onSave={() => save(product.id)}
      onCompare={() => compare(product.id)}
      onOpen={() => open(product)}
    />
  );

  const accountPrompt = (
    <div className={`${card} p-7 sm:p-10`}>
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800">
        <Link2 size={22} />
      </div>
      <h3 className="text-xl font-semibold tracking-tight">
        {accountError
          ? "Sua conta não carregou"
          : account === null
            ? "Verificando sua conta…"
            : account.ok
              ? "Seus resultados não estão disponíveis agora"
              : account.reason === "anonimo"
                ? "Seus links merecem um lugar só deles."
                : "Não foi possível preparar sua conta"}
      </h3>
      <p className="mt-3 max-w-lg text-sm leading-6 text-[#737b76]">
        {account === null && !accountError
          ? "Estamos preparando seus links e resultados."
          : account?.ok || accountError || (account && !account.ok && account.reason !== "anonimo")
            ? "Tente atualizar. Nenhuma falha de carregamento é apresentada como zero cliques."
            : "Entre na Veronica Rede para obter seu link pessoal e acompanhar os cliques das suas divulgações. Você pode explorar as ofertas agora."}
      </p>
      {account === null && !accountError ? (
        <div className="mt-5 h-2 w-36 animate-pulse rounded-full bg-emerald-100" />
      ) : account?.ok ||
        accountError ||
        (account && !account.ok && account.reason !== "anonimo") ? (
        <button
          type="button"
          onClick={() => setReload((value) => value + 1)}
          className={`${button} mt-5 bg-[#14271e] text-white`}
        >
          <RefreshCw size={15} /> Tentar novamente
        </button>
      ) : (
        <Link to="/veronica-rede" className={`${button} mt-5 bg-[#14271e] text-white`}>
          Entrar na Rede <ArrowRight size={15} />
        </Link>
      )}
    </div>
  );

  const resultPanels = measured ? (
    <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
      <section className={`${card} min-w-0 p-6 sm:p-7`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold">Evolução dos cliques</h3>
            <p className="mt-1 text-xs text-[#848c86]">
              Seus encaminhamentos nos últimos {days} dias
            </p>
          </div>
          <BarChart3 size={18} className="text-emerald-700" />
        </div>
        {measured.total > 0 ? (
          <ClickChart daily={measured.daily} />
        ) : (
          <div className="flex min-h-52 flex-col items-center justify-center gap-3 text-center">
            <MousePointerClick size={26} className="text-[#a8b4ab]" />
            <p className="text-sm text-[#737b76]">Nenhum clique registrado neste período.</p>
            <button
              type="button"
              onClick={() => setTab("links")}
              className="text-sm font-semibold text-emerald-800"
            >
              Preparar uma divulgação <ArrowRight size={14} className="inline" />
            </button>
          </div>
        )}
      </section>
      <section className={`${card} p-6 sm:p-7`}>
        <h3 className="text-base font-semibold">De onde vem o interesse</h3>
        <p className="mt-1 text-xs text-[#848c86]">Origem definida no link que você compartilhou</p>
        <div className="mt-7 space-y-5">
          {measured.bySource.length ? (
            measured.bySource.map((row) => (
              <div key={row.source}>
                <div className="flex justify-between text-sm">
                  <span>{analyticsSourceLabel(row.source)}</span>
                  <span className="font-semibold">{number(row.clicks)}</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#edf1ee]">
                  <div
                    className="h-full rounded-full bg-emerald-700"
                    style={{ width: `${(row.clicks / Math.max(1, measured.total)) * 100}%` }}
                  />
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm leading-6 text-[#737b76]">
              Escolha Instagram, TikTok ou WhatsApp ao copiar um link para distinguir as próximas
              divulgações.
            </p>
          )}
        </div>
      </section>
    </div>
  ) : (
    accountPrompt
  );

  return (
    <div className="min-h-screen bg-[#f6f7f5] text-[#18231d] [&_button]:cursor-pointer">
      <SiteHeader />
      <main className="mx-auto max-w-[1440px] px-4 pb-28 pt-8 sm:px-8 lg:px-10 lg:pb-14">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-black/[0.07] pb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#14271e] text-white">
              <BarChart3 size={20} />
            </div>
            <div>
              <p className="text-lg font-semibold tracking-[-.04em]">
                Veronica <span className="font-normal text-[#78827a]">Analytics</span>
              </p>
              <p className="mt-0.5 text-xs text-[#828a84]">Escolha. Divulgue. Aprenda.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {measured?.isAdmin && (
              <Link
                to="/admin/produtos-shopee"
                className={`${button} border border-black/10 bg-white`}
              >
                <Plus size={15} /> Adicionar oferta
              </Link>
            )}
            <Link to="/veronica-rede" className={`${button} border border-black/10 bg-white px-4`}>
              Minha Rede <ArrowRight size={15} />
            </Link>
          </div>
        </header>
        <div className="mt-7 grid gap-8 lg:grid-cols-[180px_minmax(0,1fr)]">
          <aside className="hidden lg:block">
            <nav aria-label="Analytics" className="sticky top-24 space-y-2">
              {tabs.map(({ key, label, icon: Icon }) => (
                <button
                  type="button"
                  key={key}
                  aria-pressed={tab === key}
                  onClick={() => setTab(key)}
                  className={`flex min-h-12 w-full items-center gap-3 rounded-2xl px-4 text-sm transition ${tab === key ? "bg-white font-semibold shadow-sm text-emerald-900" : "text-[#7c857e] hover:bg-white/70"}`}
                >
                  <Icon size={18} strokeWidth={1.6} />
                  {label}
                </button>
              ))}
              <div className="mt-8 border-t border-black/[0.07] pt-6">
                <p className="px-4 text-[10px] font-semibold uppercase tracking-widest text-[#99a29b]">
                  Sua biblioteca
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setTab("ofertas");
                    setSavedOnly(true);
                  }}
                  className="mt-3 flex min-h-11 w-full items-center justify-between rounded-2xl px-4 text-sm text-[#747f76]"
                >
                  <span className="flex items-center gap-3">
                    <Bookmark size={17} />
                    Salvos
                  </span>
                  <span>{savedProducts.length}</span>
                </button>
                <p className="mt-3 px-4 text-[11px] leading-5 text-[#9aa29c]">
                  Salvos neste dispositivo.
                </p>
              </div>
            </nav>
          </aside>
          <div className="min-w-0">
            {tab === "resumo" && (
              <>
                <section className="relative overflow-hidden rounded-[30px] bg-[#e8eee9] p-7 sm:p-10">
                  <img
                    src="/images/home/platforms/analytics-1280.webp"
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 h-full w-full object-cover opacity-20"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#e8eee9] via-[#e8eee9]/95 to-[#e8eee9]/40" />
                  <div className="relative max-w-xl">
                    <p className="text-[11px] font-semibold uppercase tracking-[.15em] text-emerald-800">
                      Sua próxima divulgação
                    </p>
                    <h1 className="mt-4 text-3xl font-semibold leading-[1.08] tracking-[-.045em] sm:text-5xl">
                      Boas escolhas.
                      <br />
                      Próximos passos claros.
                    </h1>
                    <p className="mt-5 max-w-md text-sm leading-7 text-[#67786c]">
                      Encontre uma oferta, prepare seu conteúdo e acompanhe o interesse pelos seus
                      links. Tudo começa com um produto que faz sentido para seu público.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setTab("ofertas");
                        setSavedOnly(false);
                      }}
                      className={`${button} mt-6 bg-[#14271e] text-white hover:bg-emerald-900`}
                    >
                      Explorar ofertas <ArrowRight size={16} />
                    </button>
                  </div>
                </section>
                <div className="my-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
                  {[
                    {
                      label: "Ofertas no catálogo",
                      value: number(products.length),
                      note: "Disponíveis para explorar",
                      icon: ShoppingBag,
                    },
                    {
                      label: "Seus cliques",
                      value: measured ? number(measured.total) : "—",
                      note: `Últimos ${days} dias`,
                      icon: MousePointerClick,
                    },
                    {
                      label: "Produtos com cliques",
                      value: measured ? number(measured.byProduct.length) : "—",
                      note: "Divulgações com interesse",
                      icon: Link2,
                    },
                    {
                      label: "Produtos salvos",
                      value: number(savedProducts.length),
                      note: "Neste dispositivo",
                      icon: Bookmark,
                    },
                  ].map(({ label, value, note, icon: Icon }) => (
                    <div key={label} className={`${card} p-4 sm:p-5`}>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-[#7a837c]">{label}</p>
                        <Icon size={16} className="shrink-0 text-[#9eaaa1]" />
                      </div>
                      <p className="mt-4 text-3xl font-semibold tracking-tight">{value}</p>
                      <p className="mt-2 text-[11px] text-[#9aa29c]">{note}</p>
                    </div>
                  ))}
                </div>
                {resultPanels}
                <section className="mt-9">
                  <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-semibold tracking-tight">
                        {savedProducts.length
                          ? "Sua seleção, pronta para o próximo passo."
                          : "Explore o catálogo."}
                      </h2>
                      <p className="mt-2 text-sm text-[#828b84]">
                        {savedProducts.length
                          ? "Retome as ofertas que você salvou neste dispositivo."
                          : "Abra uma oferta para conferir os detalhes e preparar a divulgação."}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setTab("ofertas");
                        setSavedOnly(false);
                      }}
                      className="flex min-h-11 items-center gap-2 text-sm font-semibold text-emerald-800"
                    >
                      Ver todas <ArrowRight size={15} />
                    </button>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {(savedProducts.length ? savedProducts : products).slice(0, 3).map(offerCard)}
                  </div>
                  {!products.length && (
                    <div className={`${card} p-8 text-sm text-[#737b76]`}>
                      As próximas ofertas aparecerão aqui quando forem cadastradas.
                    </div>
                  )}
                </section>
              </>
            )}
            {tab === "ofertas" && (
              <>
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-800">
                      Catálogo Shopee
                    </p>
                    <h1 className="mt-3 text-3xl font-semibold tracking-[-.04em] sm:text-4xl">
                      Encontre sua próxima oferta.
                    </h1>
                    <p className="mt-3 text-sm leading-6 text-[#7f8881]">
                      Compare as informações e escolha o que combina com seu público.
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-pressed={savedOnly}
                    onClick={() => setSavedOnly((value) => !value)}
                    className={`${button} border ${savedOnly ? "border-emerald-700 bg-emerald-50 text-emerald-800" : "border-black/10 bg-white"}`}
                  >
                    <Bookmark size={16} />
                    {savedOnly ? "Mostrar todas" : "Meus salvos"}
                  </button>
                </div>
                <div className={`${card} my-6 p-4 sm:p-5`}>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <label className="relative flex-1">
                      <span className="sr-only">Buscar produto ou categoria</span>
                      <Search size={17} className="absolute left-4 top-3.5 text-[#8d988f]" />
                      <input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Buscar produto ou categoria"
                        className="min-h-11 w-full rounded-xl border border-black/10 bg-[#f9faf8] pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700"
                      />
                    </label>
                    <label>
                      <span className="sr-only">Público</span>
                      <select
                        value={audience}
                        onChange={(event) => setAudience(event.target.value)}
                        className="min-h-11 w-full rounded-xl border border-black/10 bg-white px-4 text-sm sm:w-auto"
                      >
                        <option value="todos">Todos os públicos</option>
                        <option value="feminino">Para elas</option>
                        <option value="masculino">Para eles</option>
                      </select>
                    </label>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {categories.map((item) => (
                      <button
                        type="button"
                        key={item.key}
                        aria-pressed={category === item.key}
                        onClick={() => setCategory(item.key)}
                        className={`min-h-10 rounded-full px-4 text-xs font-medium ${category === item.key ? "bg-[#14271e] text-white" : "bg-[#f1f4f0] text-[#7b857d] hover:bg-[#e6ede6]"}`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mb-4 flex justify-between text-xs text-[#8b938d]">
                  <span>
                    {results.length} {results.length === 1 ? "oferta" : "ofertas"}
                    {savedOnly ? " salvas" : " encontradas"}
                  </span>
                  <span>Informações do catálogo</span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {results.map(offerCard)}
                </div>
                {!results.length && (
                  <div className={`${card} p-10 text-center`}>
                    <Search size={28} className="mx-auto text-[#9eaaa1]" />
                    <h2 className="mt-4 font-semibold">
                      {savedOnly ? "Sua seleção começa aqui." : "Nenhuma oferta encontrada."}
                    </h2>
                    <p className="mt-2 text-sm text-[#828b84]">
                      {savedOnly
                        ? "Use o marcador nos produtos para salvá-los."
                        : "Tente outro termo ou limpe os filtros."}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setQuery("");
                        setCategory("todos");
                        setAudience("todos");
                        setSavedOnly(false);
                      }}
                      className={`${button} mt-5 bg-[#14271e] text-white`}
                    >
                      Explorar todas
                    </button>
                  </div>
                )}
                <p className="mt-5 text-xs leading-6 text-[#8b938d]">
                  Preço e comissão são informações cadastradas. Confirme as condições atuais na
                  Shopee antes de divulgar.
                </p>
              </>
            )}
            {tab === "links" && (
              <>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-800">
                  Divulgação organizada
                </p>
                <h1 className="mt-3 text-3xl font-semibold tracking-[-.04em] sm:text-4xl">
                  Um link. Um próximo passo.
                </h1>
                <p className="mb-6 mt-3 max-w-xl text-sm leading-7 text-[#7f8881]">
                  Escolha a origem da divulgação antes de copiar. Assim você consegue distinguir os
                  cliques nos resultados.
                </p>
                {!code ? (
                  accountPrompt
                ) : (
                  <>
                    <div
                      className={`${card} mb-5 flex flex-wrap items-center justify-between gap-4 p-5`}
                    >
                      <div>
                        <p className="text-sm font-semibold">Origem da divulgação</p>
                        <p className="mt-1 text-xs text-[#8b938d]">
                          Aplicada aos links copiados a partir de agora
                        </p>
                      </div>
                      <label>
                        <span className="sr-only">Origem da divulgação</span>
                        <select
                          value={source}
                          onChange={(event) => setSource(event.target.value)}
                          className="min-h-11 rounded-xl border border-black/10 bg-[#f7f9f6] px-4 text-sm"
                        >
                          {ANALYTICS_SOURCES.map((item) => (
                            <option key={item.key} value={item.key}>
                              {item.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <div className={`${card} divide-y divide-black/5 overflow-hidden`}>
                      {products.map((product) => (
                        <div
                          key={product.id}
                          className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center"
                        >
                          <ProductImage
                            product={product}
                            className="hidden h-20 w-20 shrink-0 rounded-2xl sm:block"
                          />
                          <div className="min-w-0 flex-1">
                            <button
                              type="button"
                              onClick={() => open(product)}
                              className="text-left text-sm font-semibold hover:text-emerald-800"
                            >
                              {product.name}
                            </button>
                            <p className="mt-1 text-xs text-[#8b938d]">
                              {labelFor(product.category)} · {analyticsSourceLabel(source)}
                            </p>
                            <input
                              readOnly
                              aria-label={`Link de ${product.name}`}
                              value={`https://veronicahub.com${linkFor(product)}`}
                              onFocus={(event) => event.currentTarget.select()}
                              className="mt-3 w-full min-w-0 rounded-lg border border-black/5 bg-[#f7f9f6] p-2 font-mono text-[10px] text-[#6c7a6f]"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => share(product)}
                            className={`${button} shrink-0 border border-black/10 bg-white`}
                          >
                            <Copy size={15} /> Copiar link
                          </button>
                        </div>
                      ))}
                    </div>
                    {!products.length && (
                      <p className={`${card} p-7 text-sm text-[#737b76]`}>
                        Os links aparecerão assim que houver ofertas no catálogo.
                      </p>
                    )}
                    <p className="mt-5 text-xs leading-6 text-[#8b938d]">
                      O link passa pela Hub para registrar o encaminhamento. A compra acontece na
                      Shopee.
                    </p>
                  </>
                )}
              </>
            )}
            {tab === "resultados" && (
              <>
                <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-800">
                      Dados para decidir
                    </p>
                    <h1 className="mt-3 text-3xl font-semibold tracking-[-.04em] sm:text-4xl">
                      Entenda o interesse.
                    </h1>
                    <p className="mt-3 text-sm text-[#7f8881]">
                      Cliques dos seus links. Vendas e comissões são confirmadas separadamente.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <label>
                      <span className="sr-only">Período dos resultados</span>
                      <select
                        value={days}
                        onChange={(event) => setDays(Number(event.target.value) as AnalyticsPeriod)}
                        className="min-h-11 rounded-full border border-black/10 bg-white px-4 text-sm"
                      >
                        {ANALYTICS_PERIODS.map((period) => (
                          <option key={period} value={period}>
                            {period} dias
                          </option>
                        ))}
                      </select>
                    </label>
                    <button
                      type="button"
                      onClick={downloadResults}
                      disabled={!measured}
                      aria-label="Exportar cliques por produto em CSV"
                      className="flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white disabled:opacity-40"
                    >
                      <ArrowDownToLine size={17} />
                    </button>
                  </div>
                </div>
                {measured && (
                  <div
                    className={`${card} mb-5 flex flex-wrap items-center justify-between gap-4 p-6`}
                  >
                    <div>
                      <p className="text-xs text-[#8b938d]">Cliques registrados · {days} dias</p>
                      <p className="mt-2 text-4xl font-semibold tracking-tight">
                        {number(measured.total)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReload((value) => value + 1)}
                      className={`${button} border border-black/10`}
                    >
                      <RefreshCw size={15} /> Atualizar
                    </button>
                  </div>
                )}
                {resultPanels}
                {measured && (
                  <section className={`${card} mt-5 overflow-hidden`}>
                    <div className="p-6">
                      <h2 className="font-semibold">Interesse por produto</h2>
                      <p className="mt-1 text-xs text-[#8b938d]">
                        Ordenado por cliques registrados no período
                      </p>
                    </div>
                    {measured.byProduct.length ? (
                      <div className="divide-y divide-black/5">
                        {measured.byProduct.map((row) => {
                          const product = products.find((item) => item.id === row.productId);
                          return (
                            <div
                              key={row.productId}
                              className="flex items-center justify-between gap-4 px-6 py-4"
                            >
                              <div className="min-w-0">
                                <p className="text-sm font-medium">
                                  {product?.name ?? "Produto fora do catálogo atual"}
                                </p>
                                <p className="mt-1 text-xs text-[#8b938d]">
                                  {product ? labelFor(product.category) : row.productId}
                                </p>
                              </div>
                              <div className="flex items-center gap-4">
                                <span className="whitespace-nowrap text-sm font-semibold">
                                  {number(row.clicks)} cliques
                                </span>
                                {product && (
                                  <button
                                    type="button"
                                    onClick={() => open(product)}
                                    aria-label={`Abrir ${product.name}`}
                                    className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f1f4f0]"
                                  >
                                    <ChevronRight size={16} />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="px-6 pb-6 text-sm text-[#828b84]">
                        Compartilhe seu primeiro link para começar a acompanhar.
                      </p>
                    )}
                    <div className="border-t border-black/5 bg-[#fafbf9] px-6 py-4">
                      <p className="text-xs leading-6 text-[#8b938d]">
                        Atualizado às{" "}
                        {new Date(measured.updatedAt).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        . Cliques medem encaminhamentos, não pessoas únicas nem vendas.
                      </p>
                    </div>
                  </section>
                )}
                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[#e8eee9] p-5">
                  <div>
                    <p className="text-sm font-semibold">Comissões confirmadas</p>
                    <p className="mt-1 text-xs leading-6 text-[#748279]">
                      Confira na Rede os valores conciliados com os relatórios da Shopee.
                    </p>
                  </div>
                  <Link to="/veronica-rede" className={`${button} bg-white`}>
                    Abrir minha Rede <ArrowRight size={15} />
                  </Link>
                </div>
              </>
            )}
            {storageError && (
              <p role="status" className="mt-5 text-xs text-amber-800">
                Os salvos estão disponíveis nesta sessão; este navegador não permitiu guardá-los.
              </p>
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
      <nav
        aria-label="Analytics no celular"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-black/10 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
      >
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            type="button"
            key={key}
            aria-pressed={tab === key}
            onClick={() => {
              setTab(key);
              window.scrollTo({ top: 0, behavior: "instant" });
            }}
            className={`flex min-h-[68px] flex-col items-center justify-center gap-1 text-[10px] ${tab === key ? "font-semibold text-emerald-800" : "text-[#8c958f]"}`}
          >
            <Icon size={20} strokeWidth={tab === key ? 2 : 1.5} />
            {label}
          </button>
        ))}
      </nav>
      {!!compared.length && (
        <div className="fixed inset-x-4 bottom-[calc(82px+env(safe-area-inset-bottom))] z-40 mx-auto flex max-w-lg items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#14271e] px-5 py-3 text-white shadow-xl lg:bottom-6">
          <div>
            <p className="text-sm font-semibold">{compared.length} de 3 produtos</p>
            <button
              type="button"
              onClick={() => setCompareIds([])}
              className="mt-1 text-xs text-white/60"
            >
              Limpar seleção
            </button>
          </div>
          <button
            type="button"
            disabled={compared.length < 2}
            onClick={() => setCompareOpen(true)}
            className={`${button} bg-white px-4 text-[#14271e]`}
          >
            Comparar <ArrowRight size={15} />
          </button>
        </div>
      )}
      {notice && (
        <div
          role="status"
          className="fixed left-1/2 top-24 z-[60] w-[calc(100%-32px)] max-w-md -translate-x-1/2 rounded-2xl bg-[#14271e] px-5 py-4 text-center text-sm text-white shadow-xl"
        >
          {notice}
        </div>
      )}
      <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
        <DialogContent className="max-h-[85dvh] w-[calc(100%-24px)] max-w-4xl overflow-y-auto rounded-3xl bg-white p-5 sm:p-8">
          <DialogTitle className="pr-8 text-2xl tracking-tight">
            Compare antes de divulgar.
          </DialogTitle>
          <DialogDescription>
            Informações cadastradas, sem estimativas de vendas. Confirme as condições atuais na
            Shopee.
          </DialogDescription>
          <div className="overflow-x-auto" tabIndex={0} aria-label="Tabela de comparação">
            <table className="w-full min-w-[550px] border-collapse text-left text-sm">
              <thead>
                <tr>
                  <th className="p-3 text-[#8b938d]">Produto</th>
                  {compared.map((product) => (
                    <th key={product.id} className="min-w-40 p-3 align-top">
                      <ProductImage product={product} className="mb-3 h-32 rounded-2xl" />
                      {product.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    label: "Preço cadastrado",
                    get: (product: AffiliateProduct) => product.priceLabel,
                  },
                  {
                    label: "Comissão informada",
                    get: (product: AffiliateProduct) => product.commissionLabel ?? "Não informada",
                  },
                  {
                    label: "Categoria",
                    get: (product: AffiliateProduct) => labelFor(product.category),
                  },
                  {
                    label: "Ângulo de conteúdo",
                    get: (product: AffiliateProduct) => product.angle,
                  },
                ].map((row) => (
                  <tr key={row.label} className="border-t border-black/5">
                    <th scope="row" className="p-3 align-top font-medium text-[#7f8881]">
                      {row.label}
                    </th>
                    {compared.map((product) => (
                      <td key={product.id} className="p-3 align-top leading-6">
                        {row.get(product)}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="border-t border-black/5">
                  <th scope="row" className="p-3 font-medium text-[#7f8881]">
                    Detalhes
                  </th>
                  {compared.map((product) => (
                    <td key={product.id} className="p-3">
                      <button
                        type="button"
                        onClick={() => {
                          setCompareOpen(false);
                          open(product);
                        }}
                        className="font-semibold text-emerald-800"
                      >
                        Abrir oferta <ArrowRight size={13} className="inline" />
                      </button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(selected)}
        onOpenChange={(value) => {
          if (!value) setSelected(null);
        }}
      >
        <DialogContent className="max-h-[90dvh] w-[calc(100%-24px)] max-w-3xl overflow-y-auto rounded-3xl bg-white p-5 sm:p-8">
          {selected && (
            <>
              <DialogTitle className="pr-8 text-xl leading-7 tracking-tight">
                {selected.name}
              </DialogTitle>
              <DialogDescription>
                {labelFor(selected.category)} · Oferta do catálogo Shopee
              </DialogDescription>
              <div className="grid gap-5 sm:grid-cols-2">
                <ProductImage product={selected} className="aspect-square rounded-2xl" />
                <div className="flex flex-col justify-center">
                  <p className="text-xs text-[#8b938d]">Preço cadastrado</p>
                  <p className="mt-2 text-3xl font-semibold">{selected.priceLabel}</p>
                  <p className="mt-3 text-sm text-emerald-800">
                    {selected.commissionLabel
                      ? `Comissão informada: ${selected.commissionLabel}`
                      : "Comissão não informada no catálogo"}
                  </p>
                  <p className="mt-4 text-xs leading-6 text-[#8b938d]">
                    Confirme preço, disponibilidade e regras de comissão na Shopee.
                  </p>
                  <a
                    href={linkFor(selected)}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    className={`${button} mt-5 bg-[#14271e] text-white`}
                  >
                    Conferir na Shopee <ExternalLink size={15} />
                  </a>
                  <button
                    type="button"
                    onClick={() => save(selected.id)}
                    className={`${button} mt-2 border border-black/10`}
                  >
                    <Bookmark size={15} />
                    {savedIds.includes(selected.id) ? "Remover dos salvos" : "Salvar oferta"}
                  </button>
                </div>
              </div>
              <section className="rounded-2xl bg-[#f3f6f2] p-5">
                <h2 className="text-sm font-semibold">Uma ideia para sua divulgação</h2>
                <p className="mt-2 text-sm leading-7 text-[#748279]">{selected.angle}</p>
              </section>
              {code ? (
                <div className="rounded-2xl border border-black/10 p-5">
                  <label className="flex flex-wrap items-center justify-between gap-3 text-sm font-semibold">
                    Origem do seu link
                    <select
                      value={source}
                      onChange={(event) => setSource(event.target.value)}
                      className="min-h-11 rounded-xl border border-black/10 bg-white px-3 text-xs font-normal"
                    >
                      {ANALYTICS_SOURCES.map((item) => (
                        <option key={item.key} value={item.key}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <input
                    readOnly
                    aria-label="Link pessoal de divulgação"
                    value={`https://veronicahub.com${linkFor(selected)}`}
                    onFocus={(event) => event.currentTarget.select()}
                    className="mt-3 w-full rounded-xl bg-[#f7f9f6] p-3 font-mono text-[11px]"
                  />
                  <button
                    type="button"
                    onClick={() => share(selected)}
                    className={`${button} mt-3 bg-[#14271e] text-white`}
                  >
                    <Copy size={15} /> Copiar meu link
                  </button>
                </div>
              ) : (
                <Link to="/veronica-rede" className={`${button} border border-black/10`}>
                  Entrar na Rede para gerar meu link <ArrowRight size={15} />
                </Link>
              )}
              <section className="border-t border-black/5 pt-5">
                <div className="flex items-center gap-2">
                  <Sparkles size={17} className="text-emerald-800" />
                  <h2 className="font-semibold">Seu kit de divulgação</h2>
                </div>
                <p className="mt-2 text-xs leading-6 text-[#8b938d]">
                  Modelo editorial baseado na oferta. Edite com sua experiência e confira as
                  informações antes de publicar.
                </p>
                <label className="mt-4 block">
                  <span className="sr-only">Editar gancho, roteiro, legenda e hashtags</span>
                  <textarea
                    value={kit}
                    onChange={(event) => setKit(event.target.value)}
                    rows={12}
                    className="w-full resize-y rounded-2xl border border-black/10 bg-[#fafbf9] p-4 text-sm leading-7 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </label>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void copy(kit, "Kit de divulgação copiado.")}
                    className={`${button} border border-black/10`}
                  >
                    <Copy size={15} /> Copiar conteúdo
                  </button>
                  <Link to="/studio-veronica" className={`${button} bg-[#14271e] text-white`}>
                    Produzir no Studio <ArrowRight size={15} />
                  </Link>
                </div>
              </section>
              {selected.videoUrl && (
                <section className="border-t border-black/5 pt-5">
                  <h2 className="font-semibold">Criativo disponível</h2>
                  <video
                    src={selected.videoUrl}
                    poster={selected.coverUrl}
                    controls
                    playsInline
                    preload="none"
                    className="mx-auto mt-4 max-h-96 max-w-full rounded-2xl bg-black"
                  />
                  <a
                    href={selected.videoUrl}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${button} mt-3 border border-black/10`}
                  >
                    <ArrowDownToLine size={15} /> Abrir ou baixar vídeo
                  </a>
                </section>
              )}
              {!!selected.galleryUrls?.length && (
                <section>
                  <h2 className="text-sm font-semibold">Imagens da oferta</h2>
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {selected.galleryUrls.map((url) => (
                      <a key={url} href={url} target="_blank" rel="noopener noreferrer">
                        <img
                          src={url}
                          alt={`Imagem complementar de ${selected.name}`}
                          loading="lazy"
                          className="aspect-square w-full rounded-xl bg-[#f0f2f1] object-contain"
                        />
                      </a>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
