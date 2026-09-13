import raw from "@/data/affiliate-products.json";
import type { FeedCategory } from "./trending-videos";

// Catálogo de produtos que a Veronica já é afiliada na Shopee e oferece pros
// divulgadores da Rede revenderem no TikTok e afins. A venda acontece na
// Shopee, com o link de afiliado dela; o papel do Hub é escolher o produto,
// carimbar quem divulgou e medir o encaminhamento.
//
// A atribuição por pessoa é real, não estimada: a Shopee aceita Sub_ids no
// link (até 5 parâmetros) e devolve cliques E conversões separados por
// Sub_id no relatório do afiliado. Então cada divulgador vira um valor de
// Sub_id, e o relatório da Shopee diz quanto cada um vendeu.
//
// O nome do parâmetro de Sub_id fica em `subIdParams` (dado, não código) de
// propósito: o gerador de links da Shopee já mudou de formato antes, e
// corrigir isso não pode exigir deploy de código.

export type AffiliateProduct = {
  id: string;
  name: string;
  category: FeedCategory;
  /** Link de afiliado gerado no painel da Shopee, sem Sub_id — ele é anexado aqui. */
  affiliateUrl: string;
  priceLabel: string;
  /** Comissão anunciada pela Shopee pro produto, como texto ("~8%"). */
  commissionLabel: string;
  /** Por que esse produto casa com vídeo curto — aparece no card. */
  angle: string;
};

export type AffiliateCatalog = {
  subIdParams: { affiliate: string; placement: string; category: string };
  products: AffiliateProduct[];
};

export const affiliateCatalog = raw as AffiliateCatalog;

export const hasAffiliateProducts = affiliateCatalog.products.length > 0;

export function affiliateProductsByCategory(category: "todos" | FeedCategory): AffiliateProduct[] {
  if (category === "todos") return affiliateCatalog.products;
  return affiliateCatalog.products.filter((p) => p.category === category);
}

// Vira o identificador do divulgador dentro do Sub_id. A Shopee trata o
// Sub_id como texto livre, mas acento e espaço já se perderam em relatório
// antes — então normaliza aqui e é esse valor normalizado que a pessoa vê,
// pra ela conseguir conferir no próprio painel depois.
export function normalizeHandle(handle: string): string {
  return handle
    .trim()
    .replace(/^@+/, "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
}

/**
 * Monta o link final da Shopee com os Sub_ids carimbados. Preserva o que já
 * vier no link original e sobrescreve só os parâmetros que controlamos.
 */
export function buildAffiliateUrl(
  product: AffiliateProduct,
  { handle, placement }: { handle: string; placement: string },
): string {
  const { subIdParams } = affiliateCatalog;
  const url = new URL(product.affiliateUrl);
  const normalized = normalizeHandle(handle);

  if (normalized) url.searchParams.set(subIdParams.affiliate, normalized);
  url.searchParams.set(subIdParams.placement, placement);
  url.searchParams.set(subIdParams.category, product.category);

  return url.toString();
}

/** Link interno rastreado — passa pelo /r/afiliado antes de ir pra Shopee. */
export function buildTrackedPath(
  product: AffiliateProduct,
  { handle, placement }: { handle: string; placement: string },
): string {
  const params = new URLSearchParams({ produto: product.id, origem: placement });
  const normalized = normalizeHandle(handle);
  if (normalized) params.set("div", normalized);
  return `/r/afiliado?${params.toString()}`;
}
