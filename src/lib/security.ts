/**
 * Primitivas de segurança compartilhadas.
 *
 * Tudo aqui é server-only e sem dependência externa: roda igual no Worker da
 * Cloudflare (WebCrypto global) e no node do `npm test`.
 */

/**
 * Compara dois segredos sem sair no primeiro byte diferente.
 *
 * `===` em string sai na primeira divergência, o que em teoria deixa o tempo
 * de resposta revelar quantos bytes do prefixo o atacante já acertou. Pela
 * rede o ruído quase sempre esconde isso, mas um `!==` num header de
 * autenticação é barato demais de consertar pra ficar em pé.
 *
 * O comprimento ainda vaza (não dá pra esconder sem hash); o conteúdo não.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const left = encoder.encode(a);
  const right = encoder.encode(b);

  let diff = left.length ^ right.length;
  const length = Math.max(left.length, right.length);
  for (let i = 0; i < length; i += 1) {
    diff |= (left[i] ?? 0) ^ (right[i] ?? 0);
  }
  return diff === 0;
}

/** HMAC-SHA256 em hex. Usado pra selar códigos OTP com um segredo do servidor. */
export async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * IP de quem chamou.
 *
 * `cf-connecting-ip` é posto pela própria Cloudflare e não é falsificável por
 * quem manda a requisição — é a fonte confiável aqui. `x-forwarded-for` só
 * entra como plano B (dev/proxy local) e é explicitamente menos confiável:
 * qualquer um pode mandar esse header.
 */
export function clientIp(request: Request): string {
  const cf = request.headers.get("cf-connecting-ip");
  if (cf) return cf.trim();
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return "desconhecido";
}

/**
 * Janela deslizante em memória do isolate.
 *
 * Não tem Redis neste projeto. Um limitador em memória vale por isolate, não
 * globalmente — a Cloudflare pode ter vários no ar ao mesmo tempo, então o
 * teto real é `limite x isolates`. Isso NÃO é um limitador forte e não
 * substitui o controle no banco onde o abuso custa dinheiro (ver
 * `auth-server.ts`, que conta OTPs no Postgres). O que ele resolve bem é o
 * caso comum: uma origem só metralhando o endpoint dentro do mesmo isolate.
 */
const janelas = new Map<string, number[]>();
const MAX_CHAVES = 5_000;

export type RateLimitResult = { ok: true } | { ok: false; retryAfterSec: number };

export function checkMemoryRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const agora = Date.now();
  const inicio = agora - windowMs;

  // Poda preguiçosa: sem isso o Map cresce sem teto num isolate longevo.
  if (janelas.size > MAX_CHAVES) {
    for (const [chave, marcas] of janelas) {
      if (marcas.length === 0 || marcas[marcas.length - 1]! < inicio) janelas.delete(chave);
    }
    if (janelas.size > MAX_CHAVES) janelas.clear();
  }

  const marcas = (janelas.get(key) ?? []).filter((t) => t > inicio);

  if (marcas.length >= limit) {
    janelas.set(key, marcas);
    const maisAntiga = marcas[0]!;
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((maisAntiga + windowMs - agora) / 1000)),
    };
  }

  marcas.push(agora);
  janelas.set(key, marcas);
  return { ok: true };
}

/** Só para os testes — zera o estado entre casos. */
export function resetRateLimitState(): void {
  janelas.clear();
}

/**
 * Autenticação dos endpoints `/api/cron/*`.
 *
 * Devolve `null` quando passa e uma `Response` pronta quando não passa, pra
 * cada handler começar com uma linha só em vez de repetir o bloco.
 */
export function requireCronSecret(request: Request): Response | null {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("CRON_SECRET não configurada — recusando chamada de cron");
    return new Response("CRON_SECRET não configurada", { status: 500 });
  }

  const header = request.headers.get("authorization") ?? "";
  if (!timingSafeEqual(header, `Bearer ${secret}`)) {
    return new Response("unauthorized", { status: 401 });
  }
  return null;
}

// Tab, LF, CR e barra invertida: os três primeiros o parser de URL descarta
// antes de parsear, a última ele traduz para "/" em esquemas especiais.
// Qualquer um deles muda o destino sem mudar o que a checagem de string vê.
// Checado por código de caractere, não por classe de regex: uma classe com
// literais de controle deixa bytes NUL no meio do fonte (ferramenta de texto
// passa a tratar o arquivo como binário) e o eslint recusa via no-control-regex.
function contemCaractereQueEnganaOParser(valor: string): boolean {
  for (let i = 0; i < valor.length; i += 1) {
    const codigo = valor.charCodeAt(i);
    // Controles C0, DEL e barra invertida (0x5c).
    if (codigo <= 0x1f || codigo === 0x7f || codigo === 0x5c) return true;
  }
  return false;
}

/**
 * Resolve um `src` que DEVE ser um caminho do próprio site.
 *
 * Checar `startsWith("/")` e `!startsWith("//")` na string crua não basta:
 * `/\evil.com/x.jpg` e `/<tab>/evil.com` passam pelo teste de string, e o
 * `new URL(src, origin)` resolve os dois para um host externo — o Worker vira
 * proxy aberto.
 *
 * A checagem confiável é só uma: resolver primeiro, comparar a origem depois.
 */
export function resolveSameOriginPath(src: string, origin: string): URL | null {
  if (!src.startsWith("/")) return null;
  if (contemCaractereQueEnganaOParser(src)) return null;

  let resolvida: URL;
  try {
    resolvida = new URL(src, origin);
  } catch {
    return null;
  }

  if (resolvida.origin !== new URL(origin).origin) return null;
  return resolvida;
}

/** Só aceita destino http(s) — barra `javascript:`, `data:` e afins num Location. */
export function isSafeRedirectUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}
