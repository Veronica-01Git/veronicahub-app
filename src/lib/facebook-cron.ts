import {
  dryRunFacebookPublication,
  publishArticleBySlugToFacebook,
} from "./facebook-publisher.server";
import { isDryRunRequest, parseWireCardUrl } from "./meta-graph.server";

// POST /api/cron/publish-facebook — chamado pelo generate-article.yml logo
// depois do Instagram, com o mesmo corpo { slug, imageUrl }. Com ?dryRun=1
// valida segredos, card e duplicidade e devolve o payload, sem publicar.
export async function handlePublishFacebookCron(request: Request): Promise<Response> {
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
  if (isDryRunRequest(request)) {
    const report = await dryRunFacebookPublication(slug, { imageUrl: card.url });
    return Response.json(report, {
      status: report.ok ? 200 : 502,
      headers: { "cache-control": "no-store" },
    });
  }

  const result = await publishArticleBySlugToFacebook(slug, {
    automatic: true,
    imageUrl: card.url,
  });
  return Response.json(result, { status: result.ok ? 200 : 502 });
}
