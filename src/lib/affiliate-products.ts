import raw from "@/data/affiliate-products.json";
import type { FeedCategory } from "./trending-videos";

// Catálogo de produtos que a Veronica já é afiliada na Shopee e oferece pros
// divulgadores da Rede revenderem no TikTok e afins. A venda acontece na
// Shopee, com o link de afiliado dela; o papel do Hub é escolher o produto,
// carimbar quem divulgou e medir o encaminhamento.
//
// COMO A SHOPEE CARREGA OS SUB_IDS (confirmado numa URL real, não suposto):
// os 5 Sub_ids não viajam como parâmetros separados — vão todos dentro de
// `utm_content`, juntos, separados por hífen. Um link gerado no painel com
// Sub_id "veronica" sai como `utm_content=veronica----`: primeiro
// compartimento preenchido, quatro vazios.
//
// Duas consequências que o código tem que respeitar:
//  1. hífen é separador, então nenhum valor de Sub_id pode conter hífen —
//     `normalizeHandle` converte tudo pra [a-z0-9_] justamente por isso;
//  2. é parâmetro comum de URL, então dá pra reescrever por divulgador sem
//     precisar gerar um link novo no painel pra cada pessoa.
//
// O formato fica em `subId` (dado, não código) porque a Shopee já mudou o
// formato de link antes, e corrigir isso não pode exigir deploy.

export type AffiliateProduct = {
  id: string;
  name: string;
  category: FeedCategory;
  /** Link de afiliado gerado no painel da Shopee. O utm_content é reescrito aqui. */
  affiliateUrl: string;
  priceLabel: string;
  /** Comissão anunciada pela Shopee, como texto ("~8%"). Some do card quando ausente. */
  commissionLabel?: string;
  /** Por que esse produto casa com vídeo curto — aparece no card. */
  angle: string;
};

export type AffiliateCatalog = {
  subId: {
    param: string;
    separator: string;
    slots: number;
    order: ("affiliate" | "placement" | "category")[];
  };
  revenueShare: {
    /** Fatia do divulgador, em % da comissão recebida da Shopee. */
    affiliatePct: number;
    basis: "comissao_shopee";
    note: string;
  };
  products: AffiliateProduct[];
};

export const affiliateCatalog = raw as AffiliateCatalog;

// Link encurtado (s.shopee.com.br/XXXX) redireciona pra um destino fixo e
// descarta o que a gente colar por fora — o divulgador copiaria um link que
// parece dele e a venda cairia no Sub_id de quem gerou o link. A falha é
// silenciosa: o clique é registrado certo aqui e errado lá. Por isso o
// catálogo recusa link curto em vez de confiar que ninguém vai cadastrar um.
export function isShortLink(url: string): boolean {
  try {
    return new URL(url).hostname === "s.shopee.com.br";
  } catch {
    return true;
  }
}

// Produto com link curto fica fora do ar em vez de atribuir venda pra
// pessoa errada — ver isShortLink logo acima.
export const affiliateProducts = affiliateCatalog.products.filter(
  (p) => !isShortLink(p.affiliateUrl),
);

export const hasAffiliateProducts = affiliateProducts.length > 0;

export const AFFILIATE_CATEGORIES = [
  "beleza",
  "casa",
  "saude",
  "moda",
  "pet",
  "eletronicos",
] as const satisfies readonly FeedCategory[];

export function isAffiliateCategory(value: string): value is FeedCategory {
  return (AFFILIATE_CATEGORIES as readonly string[]).includes(value);
}

// Só aceita o link completo gerado pelo programa de afiliados. O link curto
// esconde o destino e não permite preservar o Sub_id da Veronica.
export function validateShopeeAffiliateUrl(value: string):
  | { ok: true; url: string }
  | { ok: false; error: string } {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    return { ok: false, error: "URL inválida." };
  }

  const hostname = url.hostname.toLowerCase().replace(/^www\\./, "");
  if (url.protocol !== "https:" || hostname !== "shopee.com.br") {
    return { ok: false, error: "Use um link HTTPS oficial de shopee.com.br." };
  }
  if (isShortLink(url.toString())) {
    return { ok: false, error: "Link curto não é aceito; gere o link completo no painel Shopee." };
  }

  const affiliateSource = url.searchParams.get("mmp_pid") || url.searchParams.get("utm_source");
  const subId = url.searchParams
    .get(affiliateCatalog.subId.param)
    ?.split(affiliateCatalog.subId.separator)[0];
  if (!affiliateSource || !subId) {
    return {
      ok: false,
      error: "O link não contém identificação de afiliado e Sub_id da Veronica.",
    };
  }

  return { ok: true, url: url.toString() };
}

export function affiliateProductsByCategory(category: "todos" | FeedCategory): AffiliateProduct[] {
  if (category === "todos") return affiliateProducts;
  return affiliateProducts.filter((p) => p.category === category);
}

// Vira o identificador do divulgador dentro do Sub_id. Sem acento, sem
// espaço e — o que mais importa — sem hífen, que é o separador dos
// compartimentos dentro do utm_content.
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
 * Monta o link final da Shopee reescrevendo o utm_content com os Sub_ids
 * desta divulgação. Preserva todo o resto do link original (assinatura,
 * campanha, termo) — mexer neles invalidaria o rastreamento da Shopee.
 */
export function buildAffiliateUrl(
  product: AffiliateProduct,
  { handle, placement }: { handle: string; placement: string },
): string {
  const { param, separator, slots, order } = affiliateCatalog.subId;
  const url = new URL(product.affiliateUrl);
  const existingSlots = (url.searchParams.get(param) ?? "").split(separator);

  const values: Record<string, string> = {
    // Na vitrine Analytics, `handle` fica vazio de propósito: todo clique
    // deve continuar usando o identificador oficial já gravado no link da
    // Veronica. Um identificador explícito ainda pode ser usado nas áreas da
    // Rede, mas ausência nunca mais apaga o Sub_id que gera a comissão.
    affiliate: normalizeHandle(handle) || normalizeHandle(existingSlots[0] ?? ""),
    placement: normalizeHandle(placement),
    category: normalizeHandle(product.category),
  };

  const filled = order.map((key) => values[key] ?? "");
  while (filled.length < slots) filled.push("");

  url.searchParams.set(param, filled.slice(0, slots).join(separator));
  return url.toString();
}

// DIVISÃO DA COMISSÃO — regra registrada, ainda não paga por ninguém.
//
// A divisão é sobre a comissão que a Shopee paga, não sobre o valor da
// venda. Isso é deliberado: a taxa da Shopee muda de produto pra produto, e
// dividir a venda faria um produto de taxa baixa custar dinheiro em vez de
// render. Sobre a comissão, a conta nunca fica negativa.
//
// Nada aqui credita saldo: a venda acontece na Shopee e não existe callback
// dela pra cá, então a conciliação depende do relatório por Sub_id. Esta
// função existe pra que a regra seja executável e testável quando essa
// entrada existir — e pra que ela não viva só num acordo verbal.
export function splitCommissionCents(commissionCents: number): {
  affiliateCents: number;
  houseCents: number;
} {
  const total = Math.max(0, Math.trunc(commissionCents));
  // O arredondamento sobra pra casa, nunca pro divulgador: assim as duas
  // partes sempre somam exatamente o total, sem centavo criado do nada.
  const affiliateCents = Math.floor((total * affiliateCatalog.revenueShare.affiliatePct) / 100);
  return { affiliateCents, houseCents: total - affiliateCents };
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
