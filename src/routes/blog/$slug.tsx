import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Clock3,
  ExternalLink,
  FileCheck2,
  Network,
  RefreshCw,
  UserRound,
} from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { CoverThumb } from "@/components/blog/CoverThumb";
import { ArticleShare } from "@/components/blog/ArticleShare";
import { getArticleBySlug } from "@/lib/articles-server";
import { BEAT_LABELS } from "@/lib/beats";
import { WIRE_NAME } from "@/lib/ecosystem";
import { sourceDomain, sourceLabel, trackedSourceHref } from "@/lib/editorial-network";
import { WIRE_OFFERS, trackedWireOfferHref } from "@/lib/wire-commerce";

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

function readingMinutes(body: string): number {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 210));
}

function formatEditorialDate(value: string): string {
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
}

function correctionHref(headline: string, slug: string): string {
  const subject = encodeURIComponent(`Correção — ${headline}`);
  const body = encodeURIComponent(
    `Endereço: ${SITE_URL}/blog/${slug}\n\nTrecho questionado:\n\nFonte de verificação:`,
  );
  return `mailto:yo-tech01@outlook.com?subject=${subject}&body=${body}`;
}
export const Route = createFileRoute("/blog/$slug")({
  component: ArticlePage,
  pendingComponent: ArticlePending,
  pendingMs: 300,
  pendingMinMs: 350,
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
            dateModified: article.updatedAt ?? article.publishedAt ?? undefined,
            author: {
              "@type": "Organization",
              name: "Redação Wire TV",
              url: `${SITE_URL}/blog/expediente#expediente`,
            },
            publisher: {
              "@type": "Organization",
              name: "Veronica Hub",
              url: SITE_URL,
              logo: { "@type": "ImageObject", url: `${SITE_URL}/icon.svg` },
            },
            mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
          }),
        },
      ],
    };
  },
});

function ArticlePending() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-14" aria-busy="true" aria-live="polite">
        <div className="h-4 w-36 animate-pulse rounded bg-border/70" />
        <div className="mt-10 h-3 w-44 animate-pulse rounded bg-neon-green/25" />
        <div className="mt-5 h-12 w-full animate-pulse rounded bg-border/65" />
        <div className="mt-3 h-12 w-4/5 animate-pulse rounded bg-border/65" />
        <div className="mt-7 h-4 w-full animate-pulse rounded bg-border/45" />
        <div className="mt-3 h-4 w-3/4 animate-pulse rounded bg-border/45" />
        <div className="mt-8 aspect-[16/10] w-full animate-pulse rounded-sm bg-surface" />
        <p className="sr-only">Carregando matéria da Wire TV…</p>
      </main>
      <SiteFooter />
    </div>
  );
}

function ArticlePage() {
  const state = Route.useLoaderData();
  const offer = state.ok ? WIRE_OFFERS[state.article.beat] : null;
  const hasEditorialUpdate =
    state.ok &&
    state.article.publishedAt &&
    new Date(state.article.updatedAt).getTime() - new Date(state.article.publishedAt).getTime() >
      60_000;

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
            <div className="flex flex-wrap items-center gap-2 font-mono-tech text-[11px] uppercase tracking-widest">
              <span className="rounded-sm bg-neon-green px-2 py-1 text-primary-foreground">
                Notícia
              </span>
              <span className="text-neon-green">{BEAT_LABELS[state.article.beat]}</span>
              <span className="text-muted-foreground">
                · {state.article.editorialChannel.label}
              </span>
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
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 border-y border-border/60 py-4 text-sm text-muted-foreground">
              <Link
                to="/blog/expediente"
                hash="expediente"
                className="inline-flex items-center gap-2 font-medium text-foreground transition hover:text-neon-green"
              >
                <UserRound className="h-4 w-4 text-neon-green" /> Redação Wire TV
              </Link>
              {state.article.publishedAt && (
                <span>Publicado em {formatEditorialDate(state.article.publishedAt)}</span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="h-3.5 w-3.5" /> {readingMinutes(state.article.body)} min de
                leitura
              </span>
              {hasEditorialUpdate && (
                <span className="inline-flex items-center gap-1.5 text-neon-cyan">
                  <RefreshCw className="h-3.5 w-3.5" /> Atualizado em{" "}
                  {formatEditorialDate(state.article.updatedAt)}
                </span>
              )}
            </div>

            <CoverThumb
              beat={state.article.beat}
              coverImageUrl={state.article.coverImageUrl}
              className="mt-6 aspect-[16/10] w-full"
            />
            {/* Foto do banco curado não tem URL de origem gravada: o crédito
                vira texto em vez de um link para "#", que não leva a lugar
                nenhum e ainda abre uma aba. */}
            {state.article.coverPhotoCredit &&
              (state.article.coverPhotoUrl ? (
                <a
                  href={state.article.coverPhotoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1.5 block text-right text-[11px] text-muted-foreground/70 transition hover:text-muted-foreground"
                >
                  Foto: {state.article.coverPhotoCredit} /{" "}
                  {derivePhotoSourceLabel(state.article.coverPhotoUrl)}
                </a>
              ) : (
                <p className="mt-1.5 text-right text-[11px] text-muted-foreground/70">
                  Foto: {state.article.coverPhotoCredit} /{" "}
                  {derivePhotoSourceLabel(state.article.coverPhotoUrl)}
                </p>
              ))}

            <ArticleShare
              headline={state.article.headline}
              excerpt={state.article.excerpt}
              slug={state.article.slug}
              beatLabel={BEAT_LABELS[state.article.beat]}
              coverImageUrl={state.article.coverImageUrl}
              photoCredit={state.article.coverPhotoCredit}
            />

            <div
              className="mt-9 flex flex-col gap-5 text-[18px] leading-[1.78] text-foreground/90"
              style={{ fontFamily: '"Newsreader", Georgia, serif' }}
            >
              {state.article.body
                .split(/\n{2,}/)
                .map((p) => p.trim())
                .filter(Boolean)
                .map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
            </div>

            <div className="mt-9 flex flex-col gap-4 border-t border-border/60 pt-5 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <div className="inline-flex items-center gap-2">
                <FileCheck2 className="h-4 w-4 text-neon-green" />
                Conteúdo sujeito à política pública de correções.
              </div>
              <a
                href={correctionHref(state.article.headline, state.article.slug)}
                className="font-mono-tech text-xs uppercase tracking-widest text-neon-green transition hover:text-neon-cyan"
              >
                Solicitar correção
              </a>
            </div>

            {offer && (
              <aside className="relative mt-10 overflow-hidden rounded-sm border border-neon-green/35 bg-foreground p-7 text-background sm:p-9">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_20%,color-mix(in_oklch,var(--neon-green)_20%,transparent),transparent_36%)]" />
                <div className="relative max-w-2xl">
                  <div className="font-mono-tech text-xs uppercase tracking-[0.2em] text-neon-green">
                    {offer.eyebrow}
                  </div>
                  <h2 className="mt-3 font-display text-2xl leading-tight sm:text-3xl">
                    {offer.title}
                  </h2>
                  <p className="mt-3 max-w-xl text-sm leading-relaxed text-background/65 sm:text-base">
                    {offer.description}
                  </p>
                  <a
                    href={trackedWireOfferHref(state.article.slug, "article_end")}
                    className="mt-6 inline-flex items-center gap-2 rounded-sm bg-neon-green px-5 py-3 font-mono-tech text-xs uppercase tracking-widest text-primary-foreground transition hover:brightness-110"
                  >
                    {offer.cta} <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              </aside>
            )}
            <div className="mt-10 border-y border-border/60 py-6">
              <div className="flex items-start gap-3">
                <Network className="mt-0.5 h-4 w-4 shrink-0 text-neon-green" />
                <div>
                  <p className="text-[15px] leading-relaxed text-foreground/90">
                    Esta cobertura integra o ecossistema Wire TV, que conecta informação verificada,
                    educação e aplicação prática.
                  </p>
                  <Link
                    to="/blog/rede-de-fontes"
                    className="mt-3 inline-flex items-center gap-1.5 font-mono-tech text-xs uppercase tracking-widest text-neon-green transition hover:text-neon-cyan"
                  >
                    Conhecer a Rede de Fontes <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                  <Link
                    to="/blog/expediente"
                    className="ml-0 mt-3 inline-flex items-center gap-1.5 font-mono-tech text-xs uppercase tracking-widest text-muted-foreground transition hover:text-foreground sm:ml-5"
                  >
                    Método editorial <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>

            {state.article.sourceUrls.length > 0 && (
              <div className="mt-10 rounded-sm border border-border/60 bg-surface/30 p-5">
                <h2 className="font-display text-xl text-foreground">Fontes consultadas</h2>
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

            {state.relatedArticles.length > 0 && (
              <section className="mt-12 border-t border-border/60 pt-9">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <div className="font-mono-tech text-xs uppercase tracking-[0.2em] text-neon-green">
                      Continue acompanhando
                    </div>
                    <h2 className="mt-2 font-display text-2xl">Mais desta editoria</h2>
                  </div>
                  <Link
                    to="/blog/editoria/$beat"
                    params={{ beat: state.article.beat }}
                    className="text-sm text-muted-foreground transition hover:text-neon-green"
                  >
                    Ver editoria
                  </Link>
                </div>
                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {state.relatedArticles.map((article) => (
                    <Link
                      key={article.id}
                      to="/blog/$slug"
                      params={{ slug: article.slug }}
                      className="group rounded-sm border border-border/60 bg-surface/25 p-5 transition hover:border-neon-green/50"
                    >
                      <div className="font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground">
                        {article.editorialChannel.label}
                      </div>
                      <h3 className="mt-3 text-sm font-medium leading-snug transition group-hover:text-neon-green">
                        {article.headline}
                      </h3>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </article>
        )}
      </div>

      <SiteFooter />
    </div>
  );
}
