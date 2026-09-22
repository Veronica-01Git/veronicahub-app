import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  Link2,
  MousePointerClick,
  Package,
  Wallet,
} from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { getMyAffiliate, getMyAffiliateStats } from "@/lib/affiliate-account-server";
import { getPublicAffiliateCatalog } from "@/lib/affiliate-catalog-server";
import { getMyAffiliateCommissions } from "@/lib/affiliate-commission-server";
import { buildTrackedPath } from "@/lib/affiliate-products";

export const Route = createFileRoute("/veronica-rede")({
  component: VeronicaRede,
  loader: () => getPublicAffiliateCatalog(),
  head: () => ({
    meta: [
      { title: "Veronica Rede — Links e comissões Shopee | Veronica Hub" },
      {
        name: "description",
        content: "Links personalizados, cliques e comissões Shopee confirmadas.",
      },
    ],
  }),
});

type AccountState = Awaited<ReturnType<typeof getMyAffiliate>> | null;
type StatsState = Awaited<ReturnType<typeof getMyAffiliateStats>> | null;
type CommissionState = Awaited<ReturnType<typeof getMyAffiliateCommissions>> | null;

function formatBRL(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

function VeronicaRede() {
  const { products } = Route.useLoaderData();
  const [account, setAccount] = useState<AccountState>(null);
  const [stats, setStats] = useState<StatsState>(null);
  const [commissions, setCommissions] = useState<CommissionState>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    getMyAffiliate().then(async (result) => {
      setAccount(result);
      if (!result.ok) return;
      const [nextStats, nextCommissions] = await Promise.all([
        getMyAffiliateStats(),
        getMyAffiliateCommissions(),
      ]);
      setStats(nextStats);
      setCommissions(nextCommissions);
    });
  }, []);

  const clicksByProduct = useMemo(
    () =>
      new Map(
        stats?.ok ? stats.byProduct.map((item) => [item.productId, item.clicks] as const) : [],
      ),
    [stats],
  );

  async function copyLink(productId: string) {
    if (!account?.ok) return;
    const product = products.find((item) => item.id === productId);
    if (!product) return;
    const path = buildTrackedPath(product, { handle: account.code, placement: "link_divulgador" });
    await navigator.clipboard.writeText(`${window.location.origin}${path}`);
    setCopied(productId);
    window.setTimeout(() => setCopied(null), 1800);
  }

  const authenticated = account?.ok === true;

  return (
    <div className="min-h-screen bg-[#f5f6f7] text-[#111214]">
      <SiteHeader />
      <main>
        <section className="border-b border-black/10 bg-white px-6 py-16 md:py-24">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_0.72fr] lg:items-end">
            <div>
              <p className="font-mono-tech text-[10px] uppercase tracking-[0.2em] text-emerald-700">
                Veronica Rede · Shopee
              </p>
              <h1 className="mt-4 max-w-3xl font-display text-5xl leading-[0.95] tracking-[-0.045em] sm:text-7xl">
                Seu link. Seus cliques. Comissão comprovada.
              </h1>
              <p className="mt-6 max-w-2xl text-[15px] leading-7 text-[#686b70]">
                Cada divulgador recebe um Sub_id exclusivo. A plataforma registra cliques, mas saldo
                só nasce depois que o relatório oficial da Shopee confirma a comissão.
              </p>
            </div>
            <div className="rounded-[28px] bg-[#111315] p-6 text-white">
              <p className="font-mono-tech text-[9px] uppercase tracking-[0.18em] text-white/45">
                Identificação do divulgador
              </p>
              {!account ? (
                <p className="mt-5 text-sm text-white/60">Verificando sua conta…</p>
              ) : authenticated ? (
                <>
                  <p className="mt-4 font-display text-3xl">{account.code}</p>
                  <p className="mt-2 text-xs leading-5 text-white/55">
                    Código permanente usado nos seus links e no relatório da Shopee.
                  </p>
                </>
              ) : (
                <p className="mt-5 text-sm leading-6 text-white/60">
                  Entre pelo botão do topo para criar seu identificador e liberar os links
                  personalizados.
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="border-b border-black/10 px-6 py-10">
          <div className="mx-auto grid max-w-6xl gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: MousePointerClick,
                label: "Cliques · 30 dias",
                value: stats?.ok ? String(stats.total) : "—",
              },
              {
                icon: Wallet,
                label: "Aguardando Shopee",
                value: commissions?.ok ? formatBRL(commissions.pendingCents) : "—",
              },
              {
                icon: Wallet,
                label: "Disponível confirmado",
                value: commissions?.ok ? formatBRL(commissions.availableCents) : "—",
              },
              {
                icon: Check,
                label: "Já pago",
                value: commissions?.ok ? formatBRL(commissions.paidCents) : "—",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="rounded-2xl border border-black/10 bg-white p-5">
                  <Icon className="h-4 w-4 text-emerald-700" />
                  <p className="mt-5 font-mono-tech text-[9px] uppercase tracking-[0.15em] text-[#8b8e93]">
                    {item.label}
                  </p>
                  <p className="mt-2 font-display text-3xl">{item.value}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="px-6 py-16 md:py-24">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="font-mono-tech text-[10px] uppercase tracking-[0.18em] text-emerald-700">
                  Catálogo real
                </p>
                <h2 className="mt-3 font-display text-4xl tracking-tight">
                  Escolha e copie seu link.
                </h2>
              </div>
              <Link
                to="/veronica-analytics"
                className="inline-flex items-center gap-2 text-xs font-semibold"
              >
                Abrir inteligência completa <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-8 grid gap-4 lg:grid-cols-2">
              {products.map((product) => (
                <article
                  key={product.id}
                  className="rounded-[24px] border border-black/10 bg-white p-6 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    {product.coverUrl ? (
                      <img
                        src={product.coverUrl}
                        alt=""
                        loading="lazy"
                        className="h-20 w-20 rounded-xl object-cover"
                      />
                    ) : (
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-black text-white">
                        <Package className="h-5 w-5" />
                      </span>
                    )}
                    <span className="rounded-full bg-[#f1f2f3] px-3 py-1 font-mono-tech text-[9px] uppercase tracking-wider">
                      {product.category}
                    </span>
                  </div>
                  <h3 className="mt-6 text-lg font-semibold leading-6">{product.name}</h3>
                  <p className="mt-2 text-sm text-[#696c71]">{product.priceLabel}</p>
                  <p className="mt-4 text-xs leading-6 text-[#797c81]">{product.angle}</p>
                  <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-black/10 pt-5">
                    <button
                      type="button"
                      disabled={!authenticated}
                      onClick={() => copyLink(product.id)}
                      className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-3 text-[11px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-35"
                    >
                      {copied === product.id ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                      {copied === product.id ? "Link copiado" : "Copiar meu link"}
                    </button>
                    {product.videoUrl && (
                      <a
                        href={product.videoUrl}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border border-black/10 px-4 py-3 text-[11px] font-semibold"
                      >
                        <Download className="h-4 w-4" /> Baixar criativo
                      </a>
                    )}
                    <span className="inline-flex items-center gap-1.5 text-xs text-[#777a7f]">
                      <Link2 className="h-3.5 w-3.5" /> {clicksByProduct.get(product.id) ?? 0}{" "}
                      cliques
                    </span>
                  </div>
                </article>
              ))}
            </div>
            <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-xs leading-6 text-amber-950">
              Clique não é venda. Valores pendentes, cancelados ou ainda não validados pela Shopee
              não ficam disponíveis para pagamento. A divisão é calculada sobre a comissão recebida,
              nunca sobre o valor total do pedido.
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
