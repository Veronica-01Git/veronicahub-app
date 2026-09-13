import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ExternalLink, Network } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { CoverThumb } from "@/components/blog/CoverThumb";
import { getArticleBySlug } from "@/lib/articles-server";
import { BEAT_LABELS } from "@/lib/beats";
import { WIRE_NAME } from "@/lib/ecosystem";
import { sourceDomain, sourceLabel, trackedSourceHref } from "@/lib/editorial-network";

const SITE_URL = "https://veronicahub.com";

// Deriva "Pexels"/"Pixabay" do hostname da URL do crédito — evita rotular
// errado quando a foto veio da segunda fonte (ver scripts/fetch-cover-photo.mjs).
function derivePhotoSourceLabel(url: string | null): string {
  if (!url) return "";
  try {
    const hostname = new URL(url).hostname;
    if (hostname.includes("pixabay")) return "Pixabay";
    if (hostname.includes("pexels")) return "Pexels";
  } catch {
    // ignora URL inválida — cai no fallback abaixo
  }
  return "Pexels";
}

export const Route = createFileRoute("/blog/$slug")({
  component: ArticlePage,
  loader: ({ params }) => getArticleBySlug({ data: { slug: params.slug } }),
  head: ({ loaderData, params }) => {
    if (!loaderData?.ok) {
      return {
        meta: [{ title: `Matéria não encontrada | ${WIRE_NAME}` }],
      };
    }
    const { article } = loaderData;
    const canonical = `${SITE_URL}/blog/${params.slug}`;
    return {
      meta: [
        { title: `${article.headline} | ${WIRE_NAME}` },
        { name: "description", content: article.excerpt },
        { property: "og:title", content: article.headline },
        { property: "og:description", content: article.excerpt },
        { property: "og:type", content: "article" },
        { property: "og:url", content: canonical },
        ...(article.coverImageUrl
          ? [{ property: "og:image", content: article.coverImageUrl }]
          : []),
        ...(article.publishedAt
          ? [{ property: "article:published_time", content: article.publishedAt }]
          : []),
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: article.headline },
        { name: "twitter:description", content: article.excerpt },
        ...(article.coverImageUrl
          ? [{ name: "twitter:image", content: article.coverImageUrl }]
          : []),
      ],
      links: [{ rel: "canonical", href: canonical }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "NewsArticle",
            headline: article.headline,
            description: article.excerpt,
            image: article.coverImageUrl ? [article.coverImageUrl] : undefined,
            datePublished: article.publishedAt ?? undefined,
            dateModified: article.publishedAt ?? undefined,
            author: { "@type": "Organization", name: WIRE_NAME },
            publisher: {
              "@type": "Organization",
              name: "Veronica Hub",
              logo: { "@type": "ImageObject", url: `${SITE_URL}/favicon.ico` },
            },
            mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
          }),
        },
      ],
    };
  },
});

function ArticlePage() {
  const state = Route.useLoaderData();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <div className="mx-auto max-w-3xl px-6 py-14">
        <Link
          to="/blog"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-neon-green"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar pro {WIRE_NAME}
        </Link>

        {!state.ok ? (
          <div className="mt-8 rounded-sm border border-border/60 bg-surface/40 p-8 text-center">
            <h1 className="font-display text-xl text-foreground">Matéria não encontrada</h1>
            <p className="mt-2 text-sm text-muted-foreground">{state.error}</p>
          </div>
        ) : (
          <article className="mt-8">
            <div className="font-mono-tech text-[11px] uppercase tracking-widest text-neon-green">
              {BEAT_LABELS[state.article.beat]}
            </div>
            <h1
              className="mt-3 font-display text-3xl text-foreground sm:text-4xl"
              style={{ letterSpacing: "-0.02em", lineHeight: 1.1 }}
            >
              {state.article.headline}
            </h1>
            <p className="mt-4 text-[15px] leading-[1.6] text-muted-foreground">
              {state.article.excerpt}
            </p>
            {state.article.sourceUrls.length > 0 && (
              <a
                href={trackedSourceHref(state.article.slug, 0)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-[13px] text-muted-foreground transition hover:text-neon-green"
              >
                Fonte: {sourceLabel(state.article.sourceUrls[0])} ›
              </a>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-3 font-mono-tech text-[10.5px] uppercase tracking-widest text-muted-foreground">
              <span>{state.article.editorialChannel.label}</span>
              {state.article.publishedAt && (
                <>
                  <span className="opacity-40">·</span>
                  <span>
                    {new Date(state.article.publishedAt).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                      timeZone: "America/Sao_Paulo",
                    })}
                  </span>
                </>
              )}
            </div>

            <CoverThumb
              beat={state.article.beat}
              coverImageUrl={state.article.coverImageUrl}
              className="mt-6 aspect-[16/10] w-full"
            />
            {state.article.coverPhotoCredit && (
              <a
                href={state.article.coverPhotoUrl ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1.5 block text-right text-[11px] text-muted-foreground/70 transition hover:text-muted-foreground"
              >
                Foto: {state.article.coverPhotoCredit} /{" "}
                {derivePhotoSourceLabel(state.article.coverPhotoUrl)}
              </a>
            )}

            <div className="mt-8 flex flex-col gap-4 text-[15px] leading-[1.75] text-foreground/90">
              {state.article.body
                .split(/\n{2,}/)
                .map((p) => p.trim())
                .filter(Boolean)
                .map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
            </div>

            <div className="mt-10 border-y border-border/60 py-6">
              <div className="flex items-start gap-3">
                <Network className="mt-0.5 h-4 w-4 shrink-0 text-neon-green" />
                <div>
                  <p className="text-[15px] leading-relaxed text-foreground/90">
                    Esta cobertura integra o ecossistema Veronica Wire, que conecta informação
                    verificada, educação e aplicação prática.
                  </p>
                  <Link
                    to="/blog/rede-de-fontes"
                    className="mt-3 inline-flex items-center gap-1.5 font-mono-tech text-xs uppercase tracking-widest text-neon-green transition hover:text-neon-cyan"
                  >
                    Conhecer a Rede de Fontes <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>

            {state.article.sourceUrls.length > 0 && (
              <div className="mt-10 rounded-sm border border-border/60 bg-surface/30 p-5">
                <h2 className="font-display text-xl text-foreground">
                  Fontes consultadas
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  A Veronica identifica e encaminha o leitor para a publicação original. Citação
                  editorial não representa parceria comercial.
                </p>
                <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                  {state.article.sourceUrls.map((url, index) => (
                    <li key={url}>
                      <a
                        href={trackedSourceHref(state.article.slug, index)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex h-full items-center justify-between gap-3 rounded-sm border border-border/60 bg-background px-4 py-3 transition hover:border-neon-green/60"
                      >
                        <span>
                          <span className="block text-sm font-medium text-foreground group-hover:text-neon-green">
                            {sourceLabel(url)}
                          </span>
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            {sourceDomain(url)}
                          </span>
                        </span>
                        <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-neon-green" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </article>
        )}
      </div>

      <SiteFooter />
    </div>
  );
}
