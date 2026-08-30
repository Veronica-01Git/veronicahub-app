// Transforma imagens dentro do próprio Worker via `fetch(url, { cf: { image
// } })`, chamado direto do src/server.ts na rota /api/img (interceptado
// antes do handler do TanStack, mesmo padrão do webhook do Mercado Pago).
//
// Por quê: /cdn-cgi/image/... no nível de zona precisa rebuscar a imagem
// original num "origin" HTTP antes de transformar — mas esta zona não tem
// origin tradicional por trás, é só este Worker com static assets (sem
// servidor HTTP separado). Esse self-fetch de zona retornava erro 9509
// ("Could not fetch the image — the server returned HTTP error 500").
// Fazer o fetch com `cf.image` aqui dentro evita o self-fetch de zona
// inteiramente: quem pede a transformação é o runtime do próprio Worker.

const ALLOWED_FORMATS = new Set(["auto", "avif", "webp", "jpeg", "baseline-jpeg"]);
const ALLOWED_FIT = new Set(["scale-down", "contain", "cover", "crop", "pad"]);
const MAX_WIDTH = 3840;
const MAX_QUALITY = 100;
const MIN_QUALITY = 1;

export async function handleImageTransform(request: Request): Promise<Response> {
  // Guarda contra loop: se esta subrequest já veio do pipeline de resizing
  // da própria Cloudflare, não tenta transformar de novo (recomendação da
  // documentação da Cloudflare para Workers que fazem sua própria
  // transformação — não deveria disparar aqui já que não usamos
  // /cdn-cgi/image/, mas é defesa barata contra loop).
  if (/image-resizing/.test(request.headers.get("via") ?? "")) {
    return fetch(request);
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method not allowed", { status: 405 });
  }

  const url = new URL(request.url);
  const src = url.searchParams.get("src");
  // Exige caminho relativo começando com uma única barra — bloqueia tanto
  // URL absoluta (https://...) quanto protocol-relative (//host/...), que
  // o construtor URL resolveria como um host externo arbitrário.
  if (!src || !src.startsWith("/") || src.startsWith("//")) {
    return new Response("Missing or invalid src", { status: 400 });
  }

  const widthParam = url.searchParams.get("width");
  const width = widthParam ? Math.min(Math.max(1, Number(widthParam) || 0), MAX_WIDTH) : undefined;
  if (widthParam && !width) {
    return new Response("Invalid width", { status: 400 });
  }

  const formatParam = url.searchParams.get("format") ?? "auto";
  const format = ALLOWED_FORMATS.has(formatParam) ? formatParam : "auto";

  const fitParam = url.searchParams.get("fit") ?? "scale-down";
  const fit = ALLOWED_FIT.has(fitParam) ? fitParam : "scale-down";

  const qualityParam = url.searchParams.get("quality");
  const quality = qualityParam
    ? Math.min(Math.max(MIN_QUALITY, Number(qualityParam) || 82), MAX_QUALITY)
    : 82;

  const originalUrl = new URL(src, url.origin).toString();

  const response = await fetch(originalUrl, {
    cf: {
      image: { width, format, quality, fit },
    },
  } as RequestInit);

  if (!response.ok) return response;

  // Resposta derivada de um asset imutável (hash/caminho fixo) com opções
  // fixas na query — mesmo tratamento de cache de um ano que /images/*
  // já leva via public/_headers.
  const headers = new Headers(response.headers);
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  return new Response(response.body, { status: response.status, headers });
}
