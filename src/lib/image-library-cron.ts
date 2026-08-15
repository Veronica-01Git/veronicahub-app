import { isBeat } from "./beats";
import { generateLibraryImage } from "./image-library-server";

// Chamado direto do src/server.ts, interceptado antes do handler do
// TanStack — mesmo padrão do webhook do Mercado Pago
// (mercadopago-webhook.ts): precisa de URL fixa e não usa sessão de admin,
// porque quem chama é um cron externo (GitHub Actions, ver
// .github/workflows/generate-library-images.yml), de 6 em 6h, autenticado
// só por CRON_SECRET. Gera 1 imagem por chamada — o workflow faz um loop
// chamando uma vez por editoria, em vez de um request só gerando as 5 (evita
// depender de um request HTTP único aguentando vários minutos de poll).
export async function handleGenerateLibraryImageCron(request: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("CRON_SECRET não configurada — recusando chamada de cron");
    return Response.json({ error: "Cron não configurado" }, { status: 500 });
  }

  const auth = request.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${secret}`) {
    return Response.json({ error: "Não autorizado" }, { status: 401 });
  }

  let body: { beat?: unknown };
  try {
    body = (await request.json()) as { beat?: unknown };
  } catch {
    return Response.json({ error: 'Corpo inválido, esperado {"beat": "..."}' }, { status: 400 });
  }

  if (!isBeat(body.beat)) {
    return Response.json({ error: "beat inválido" }, { status: 400 });
  }

  const result = await generateLibraryImage(body.beat, "cron");
  if (!result.ok) {
    return Response.json({ ok: false, error: result.error }, { status: 502 });
  }
  return Response.json({ ok: true, image: result.image });
}
