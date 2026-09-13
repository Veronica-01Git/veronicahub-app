import { publishArticleBySlugToInstagram } from "./instagram-publisher.server";

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

  const imageUrl = typeof body.imageUrl === "string" ? body.imageUrl.trim() : "";
  if (!imageUrl) return new Response("imageUrl obrigatório", { status: 400 });
  let parsedImageUrl: URL;
  try {
    parsedImageUrl = new URL(imageUrl);
  } catch {
    return new Response("imageUrl inválida", { status: 400 });
  }
  if (
    parsedImageUrl.origin !== "https://veronicahub.com" ||
    !parsedImageUrl.pathname.startsWith("/images/instagram/wire-tv-") ||
    !parsedImageUrl.pathname.endsWith(".jpg")
  ) {
    return new Response("imageUrl fora do diretório oficial da Wire TV", { status: 400 });
  }

  const result = await publishArticleBySlugToInstagram(body.slug.trim(), {
    automatic: true,
    imageUrl: parsedImageUrl.toString(),
  });
  return Response.json(result, { status: result.ok ? 200 : 502 });
}
