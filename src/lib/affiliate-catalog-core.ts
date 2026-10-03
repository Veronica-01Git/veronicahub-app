// Regras do catálogo de afiliados que não tocam banco nem sessão: normalizar,
// validar e finalizar um produto. Moram aqui (e não em
// affiliate-catalog-server.ts) para serem a MESMA validação do painel admin e
// do conector MCP — e para rodarem no `node --test`, que não carrega
// createServerFn. Imports relativos com ".ts" pelo mesmo motivo.

import {
  MAX_GALLERY_IMAGES,
  isAffiliateAudience,
  isAffiliateCategory,
  sanitizeMediaUrl,
  sanitizeMediaUrlList,
  validateShopeeAffiliateUrl,
  type AffiliateAudience,
} from "./affiliate-products.ts";
import type { FeedCategory } from "./trending-videos.ts";

export function normalizeProductId(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

export type ProductInput = {
  id?: string;
  name: string;
  category: FeedCategory;
  affiliateUrl: string;
  priceLabel: string;
  commissionLabel: string | null;
  angle: string;
  priority: number;
  coverUrl: string | null;
  videoUrl: string | null;
  galleryUrls: string[];
  audience: AffiliateAudience;
};

const SHORT_LINK_HOSTS = new Set(["s.shopee.com.br", "shope.ee"]);

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

// Link curto do painel (s.shopee.com.br/XXXX) → link completo. O painel de
// afiliados entrega link curto por padrão; expandir aqui poupa a Veronica de
// abrir um por um no navegador. Segue no máximo 5 saltos e para assim que
// chega em shopee.com.br — o destino final já traz mmp_pid/utm_content.
// `fetchImpl` existe para o teste não sair para a rede.
export async function expandShopeeShortLink(
  value: string,
  fetchImpl: FetchLike = (input, init) => fetch(input, init),
): Promise<string> {
  let current = value.trim();
  for (let hop = 0; hop < 5; hop += 1) {
    let url: URL;
    try {
      url = new URL(current);
    } catch {
      return value;
    }
    if (!SHORT_LINK_HOSTS.has(url.hostname.toLowerCase())) return url.toString();
    const response = await fetchImpl(url.toString(), {
      method: "GET",
      redirect: "manual",
      headers: { "user-agent": "Mozilla/5.0 (VeronicaHub link-expander)" },
    });
    const location = response.headers.get("location");
    if (!location)
      throw new Error("Link curto não redirecionou — confira se ele abre no navegador.");
    current = new URL(location, url).toString();
  }
  return current;
}

export type RawProductInput = Omit<ProductInput, "affiliateUrl" | "id"> & {
  id: string;
  rawUrl: string;
};

export function validateProduct(raw: unknown): RawProductInput {
  const data = raw as Record<string, unknown>;
  const name = typeof data?.name === "string" ? data.name.trim() : "";
  const category = typeof data?.category === "string" ? data.category.trim().toLowerCase() : "";
  const priceLabel = typeof data?.priceLabel === "string" ? data.priceLabel.trim() : "";
  const angle = typeof data?.angle === "string" ? data.angle.trim() : "";
  const commissionLabel =
    typeof data?.commissionLabel === "string" && data.commissionLabel.trim()
      ? data.commissionLabel.trim().slice(0, 80)
      : null;
  const rawUrl = typeof data?.affiliateUrl === "string" ? data.affiliateUrl.trim() : "";
  const audienceRaw =
    typeof data?.audience === "string" ? data.audience.trim().toLowerCase() : "unissex";
  const audience: AffiliateAudience = isAffiliateAudience(audienceRaw) ? audienceRaw : "unissex";

  if (name.length < 3) throw new Error("Nome do produto obrigatório.");
  if (!isAffiliateCategory(category)) throw new Error(`Categoria inválida para "${name}".`);
  if (!priceLabel) throw new Error(`Preço obrigatório para "${name}".`);
  if (angle.length < 10) throw new Error(`Informe um ângulo de venda para "${name}".`);
  if (!rawUrl) throw new Error(`Link de afiliado obrigatório para "${name}".`);

  const priorityValue =
    typeof data?.priority === "number" ? data.priority : Number(data?.priority ?? 0);
  const priority = Number.isFinite(priorityValue)
    ? Math.max(-100, Math.min(999, Math.round(priorityValue)))
    : 0;

  return {
    id: typeof data?.id === "string" ? normalizeProductId(data.id) : "",
    name: name.slice(0, 180),
    category,
    rawUrl,
    priceLabel: priceLabel.slice(0, 80),
    commissionLabel,
    angle: angle.slice(0, 500),
    priority,
    coverUrl: sanitizeMediaUrl(data?.coverUrl),
    videoUrl: sanitizeMediaUrl(data?.videoUrl),
    galleryUrls: sanitizeMediaUrlList(data?.galleryUrls),
    audience,
  };
}

// Parte assíncrona da validação: expande link curto e só então confere
// afiliado/Sub_id. Fica fora do validator porque envolve rede.
export async function finalizeProduct(
  input: RawProductInput,
  fetchImpl?: FetchLike,
): Promise<ProductInput> {
  const expanded = await expandShopeeShortLink(input.rawUrl, fetchImpl);
  const checkedUrl = validateShopeeAffiliateUrl(expanded);
  if (!checkedUrl.ok) throw new Error(`${input.name}: ${checkedUrl.error}`);

  const pathId = new URL(checkedUrl.url).pathname.split("/").filter(Boolean).at(-1) ?? "";
  const id = input.id || normalizeProductId(`${input.name}-${pathId}`);
  if (!id) throw new Error(`Não foi possível gerar o identificador de "${input.name}".`);

  const { rawUrl: _rawUrl, ...rest } = input;
  return { ...rest, id, affiliateUrl: checkedUrl.url };
}

/**
 * Capa e galeria vindas de fora (conector MCP). Diferente de
 * `sanitizeMediaUrlList`, que descarta em silêncio o que não presta — bom para
 * colar no painel, ruim para um agente que precisa saber que errou —, aqui
 * qualquer URL que não seja HTTPS, ou passar de MAX_GALLERY_IMAGES, é recusado
 * com a razão. A conferência de HTTPS em si continua sendo `sanitizeMediaUrl`.
 */
export function validateMediaPatch(raw: unknown): {
  id: string;
  coverUrl: string | null;
  galleryUrls: string[];
} {
  const data = raw as Record<string, unknown>;
  const id = typeof data?.id === "string" ? data.id.trim() : "";
  if (!id) throw new Error("Produto obrigatório.");

  let coverUrl: string | null = null;
  if (data.coverUrl !== undefined && data.coverUrl !== null && data.coverUrl !== "") {
    coverUrl = sanitizeMediaUrl(data.coverUrl);
    if (!coverUrl) throw new Error("coverUrl precisa ser uma URL HTTPS válida.");
  }

  const gallery = data.galleryUrls ?? [];
  if (!Array.isArray(gallery)) throw new Error("galleryUrls precisa ser uma lista de URLs.");
  if (gallery.length > MAX_GALLERY_IMAGES) {
    throw new Error(`A galeria aceita no máximo ${MAX_GALLERY_IMAGES} imagens.`);
  }
  const galleryUrls: string[] = [];
  for (const item of gallery) {
    const url = sanitizeMediaUrl(item);
    if (!url) throw new Error("Toda imagem da galeria precisa ser uma URL HTTPS válida.");
    if (!galleryUrls.includes(url)) galleryUrls.push(url);
  }
  return { id, coverUrl, galleryUrls };
}

export function validateStatus(input: unknown): { id: string; active: boolean } {
  const data = input as { id?: unknown; active?: unknown };
  if (typeof data?.id !== "string" || !data.id) throw new Error("Produto obrigatório.");
  if (typeof data?.active !== "boolean") throw new Error("Status inválido.");
  return { id: data.id, active: data.active };
}
