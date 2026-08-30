import { BEAT_VALUES, type Beat } from "./beats";
import { publishArticleFromCron } from "./articles-server";

const CYCLE_HOURS = 5;

// Escolhe a editoria pela hora UTC atual — sem precisar guardar estado em
// lugar nenhum (qual foi a última editoria gerada). Mesmo bucket de 5h
// sempre cai na mesma editoria, então ao longo do dia todas passam.
function currentBeat(): Beat {
  const hour = new Date().getUTCHours();
  const index = Math.floor(hour / CYCLE_HOURS) % BEAT_VALUES.length;
  return BEAT_VALUES[index];
}

// Chamado direto do src/server.ts (interceptado antes do handler do
// TanStack), mesmo padrão do webhook do Mercado Pago — precisa de URL fixa
// pro GitHub Actions chamar num cron, o que a URL de RPC do createServerFn
// não permite. Autenticado por CRON_SECRET (header Authorization) porque
// quem chama não é um admin logado.
export async function handleGenerateArticleCron(request: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return new Response("CRON_SECRET não configurada", { status: 500 });
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("unauthorized", { status: 401 });
  }

  const beat = currentBeat();
  const result = await publishArticleFromCron(beat);
  if (!result.ok) {
    return new Response(JSON.stringify({ ok: false, beat, error: result.error }), {
      status: 502,
      headers: { "content-type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true, beat, slug: result.article.slug }), {
    headers: { "content-type": "application/json" },
  });
}
