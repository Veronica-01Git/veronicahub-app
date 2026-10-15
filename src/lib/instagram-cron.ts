import {
  dryRunInstagramPublication,
  publishArticleBySlugToInstagram,
} from "./instagram-publisher.server";
import { isDryRunRequest, parseWireCardUrl } from "./meta-graph.server";

export async function handlePublishInstagramCron(request: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  if (!secret) return new Response("CRON_SECRET não configurada", { status: 500 });
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("unauthorized", { status: 401 });
  }

  let body: { slug?: unknown; imageUrl?: unknown };
  try {
    body = await request.json();
  } catch {
    return new Response("corpo inválido", { status: 400 });
  }
  if (typeof body.slug !== "string" || !body.slug.trim()) {
    return new Response("slug obrigatório", { status: 400 });
  }
  const card = parseWireCardUrl(body.imageUrl);
  if (!card.ok) return new Response(card.error, { status: 400 });

  const slug = body.slug.trim();
  // ?dryRun=1: valida segredos, card e duplicidade e devolve o payload, sem publicar.
  if (isDryRunRequest(request)) {
    const report = await dryRunInstagramPublication(slug, { imageUrl: card.url });
    return Response.json(report, {
      status: report.ok ? 200 : 502,
      headers: { "cache-control": "no-store" },
    });
  }

  const result = await publishArticleBySlugToInstagram(slug, {
    automatic: true,
    imageUrl: card.url,
  });
  return Response.json(result, { status: result.ok ? 200 : 502 });
}
