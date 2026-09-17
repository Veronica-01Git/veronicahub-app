/**
 * Cache de borda para as páginas de demonstração.
 *
 * O PROBLEMA QUE ISTO RESOLVE. Em 17/09, às 00:39 UTC, um celular recebeu
 * `Error 1102 — Worker exceeded resource limits` ao abrir o site, enquanto o
 * mesmo site navegava normalmente no computador. 1102 é o Cloudflare matando
 * o Worker por estourar CPU ou memória naquele data center — não tem relação
 * com o aparelho. Um celular entra na rede por um ponto de presença diferente
 * do da internet de casa, e ali o isolate estava frio: renderizar a página
 * exigiu **parsear o bundle de SSR inteiro dentro da requisição do cliente**,
 * e é esse pico que estoura o teto.
 *
 * As telas de demonstração não têm loader, não consultam banco e não
 * dependem de quem está olhando: o conteúdo vem de `whatsapp-rules.ts`, que
 * é código. Renderizar a mesma coisa a cada visita é trabalho desperdiçado —
 * e é justamente o trabalho que mata o Worker.
 *
 * Então guardamos o HTML no cache do Cloudflare. A primeira visita em cada
 * data center paga a renderização; as seguintes saem do cache sem React,
 * sem SSR, sem pico. O cliente abrindo a demonstração no celular dele na
 * reunião cai no caminho barato.
 *
 * ISTO NÃO É A CORREÇÃO DA CAUSA. Se o teto de CPU for o do plano gratuito
 * do Workers (10 ms por requisição, contra 30 s no pago), nenhum cache
 * conserta o resto do site — conserta o plano. Isto protege as páginas que o
 * cliente vai abrir no dia 19, que é o risco com data marcada.
 *
 * O QUE NUNCA ENTRA AQUI, e por quê: qualquer rota que dependa de sessão.
 * Guardar HTML personalizado no cache compartilhado entregaria a página de
 * uma pessoa para outra. Por isso a lista é fechada e explícita, requisição
 * com cookie ou `Authorization` é ignorada, e resposta com `Set-Cookie`
 * nunca é guardada.
 */

/**
 * Lista fechada. Só demonstração pública, sem sessão, sem banco, `noindex`.
 * Acrescentar rota aqui exige conferir as três coisas antes.
 */
const ROTAS_CACHEAVEIS: readonly RegExp[] = [/^\/preview\/express-operations-b(\/|$)/];

/**
 * Cinco minutos. Curto de propósito: o deploy não limpa este cache, então o
 * TTL é o que garante que uma correção publicada apareça sozinha. Cinco
 * minutos é curto para quem corrige e longo para uma reunião.
 */
const TTL_SEGUNDOS = 300;

type CacheDeBorda = {
  match(request: Request): Promise<Response | undefined>;
  put(request: Request, response: Response): Promise<void>;
};

/**
 * `caches.default` só existe no runtime do Cloudflare. Em `vite dev` e nos
 * testes não existe, e a ausência tem de ser silenciosa: sem cache o site
 * funciona igual, só mais devagar.
 */
function cacheDeBorda(): CacheDeBorda | undefined {
  const c = (globalThis as { caches?: { default?: unknown } }).caches?.default;
  if (!c || typeof (c as CacheDeBorda).match !== "function") return undefined;
  return c as CacheDeBorda;
}

/** Esta requisição pode ser servida do cache compartilhado? */
export function podeCachear(request: Request): boolean {
  if (request.method !== "GET") return false;

  // Cookie ou Authorization significa que a resposta pode ser personalizada.
  // Não vale o risco nem nas rotas da lista: melhor renderizar de novo.
  if (request.headers.has("cookie") || request.headers.has("authorization")) return false;

  const url = new URL(request.url);
  // Query string vira chave de cache diferente e multiplica entradas sem
  // ganho — as telas de demonstração não leem nada da query.
  if (url.search) return false;

  return ROTAS_CACHEAVEIS.some((r) => r.test(url.pathname));
}

/** Resposta guardada, ou `undefined` quando não há (ou não há cache). */
export async function lerDoCacheDeBorda(request: Request): Promise<Response | undefined> {
  const cache = cacheDeBorda();
  if (!cache) return undefined;
  try {
    return (await cache.match(request)) ?? undefined;
  } catch (error) {
    console.error("Falha ao ler o cache de borda:", error);
    return undefined;
  }
}

/**
 * Guarda a resposta. Devolve a que deve seguir para o cliente — `put` consome
 * o corpo, então quem chama fica com um clone.
 *
 * Só guarda 200 de HTML sem `Set-Cookie`. Guardar um erro transformaria uma
 * falha momentânea em cinco minutos de falha para todo mundo naquele data
 * center, que é o oposto do que este arquivo existe para fazer.
 */
export function guardarNoCacheDeBorda(
  request: Request,
  response: Response,
  waitUntil?: (p: Promise<unknown>) => void,
): Response {
  const cache = cacheDeBorda();
  if (!cache) return response;
  if (response.status !== 200) return response;
  if (response.headers.has("set-cookie")) return response;
  if (!(response.headers.get("content-type") ?? "").includes("text/html")) return response;

  const headers = new Headers(response.headers);
  headers.set("cache-control", `public, max-age=0, s-maxage=${TTL_SEGUNDOS}`);
  // Deixa visível, no próprio navegador, que a rota passa por este caminho.
  headers.set("x-veronica-edge-cache", "store");

  const paraGuardar = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
  const paraCliente = paraGuardar.clone();

  const gravacao = cache
    .put(request, paraGuardar)
    .catch((error) => console.error("Falha ao gravar no cache de borda:", error));
  if (waitUntil) waitUntil(gravacao);

  return paraCliente;
}
