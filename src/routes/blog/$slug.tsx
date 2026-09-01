import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Sparkles } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { LazyImage } from "@/components/media/LazyImage";
import { getArticleBySlug } from "@/lib/articles-server";
import { BEAT_LABELS, BEAT_SHORT, type Beat } from "@/lib/beats";

const SITE_URL = "https://veronicahub.com";

// Mesma paleta de src/routes/blog/index.tsx (mantida local a cada rota,
// mesmo padrão já usado ali — cor por editoria não vive em beats.ts porque
// esse módulo também é importado do server, e cor é puramente de UI).
const BEAT_COLOR: Record<Beat, string> = {
  ia: "oklch(0.58 0.17 155)",
  clima: "oklch(0.55 0.13 220)",
  economia: "oklch(0.62 0.15 85)",
  geopolitica: "oklch(0.58 0.19 25)",
  mercado: "oklch(0.56 0.16 290)",
};

// "oklch(L C H)" -> "oklch(L C H / alpha)".
function withAlpha(oklch: string, alpha: number): string {
  return oklch.replace(/\)$/, ` / ${alpha})`);
}

// Nomes conhecidos dos veículos mais citados pelo Wire até agora — fallback
// pra qualquer domínio novo é capitalizar os pedaços do hostname. Sem campo
// dedicado de "fonte" no banco (só sourceUrls), então isso deriva o nome de
// exibição a partir da própria URL, sem inventar nada que não esteja nela.
const KNOWN_SOURCES: Record<string, string> = {
  "caixinglobal.com": "Caixin Global",
  "scmp.com": "SCMP",
  "coindesk.com": "CoinDesk",
  "crowdfundinsider.com": "Crowdfund Insider",
  "paymentexpert.com": "Payment Expert",
  "atlanticcouncil.org": "Atlantic Council",
  "unite.ai": "Unite.AI",
  "cerebras.ai": "Cerebras",
  "openai.com": "OpenAI",
  "mlq.ai": "MLQ.ai",
  "exame.com": "Exame",
  "revistaforum.com.br": "Revista Fórum",
  "tecnoblog.net": "Tecnoblog",
  "ajupress.com": "Aju Press",
  "tomshardware.com": "Tom's Hardware",
  "brasil247.com": "Brasil 247",
  "cenarioenergia.com.br": "Cenário Energia",
  "cebc.org.br": "CEBC",
  "timesbrasil.com.br": "Times Brasil",
  "monitormercantil.com.br": "Monitor Mercantil",
  "theblock.co": "The Block",
  "forbes.com": "Forbes",
  "epe.gov.br": "EPE",
  "xpi.com.br": "XP Investimentos",
  "epowerbay.com": "ePowerBay",
};

function deriveSourceLabel(url: string): string {
  let hostname: string;
  try {
    hostname = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
  if (KNOWN_SOURCES[hostname]) return KNOWN_SOURCES[hostname];
  // Domínio com subdomínio (ex: investors.cerebras.ai) — tenta o eTLD+1.
  const parts = hostname.split(".");
  const root = parts.length > 2 ? parts.slice(-2).join(".") : hostname;
  if (KNOWN_SOURCES[root]) return KNOWN_SOURCES[root];
  const label = hostname.split(".")[0];
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export const Route = createFileRoute("/blog/$slug")({
  component: ArticlePage,
  loader: ({ params }) => getArticleBySlug({ data: { slug: params.slug } }),
  head: ({ loaderData, params }) => {
    if (!loaderData?.ok) {
      return {
        meta: [{ title: "Matéria não encontrada | Veronica Wire" }],
      };
    }
    const { article } = loaderData;
    const canonical = `${SITE_URL}/blog/${params.slug}`;
    return {
      meta: [
        { title: `${article.headline} | Veronica Wire` },
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
            author: { "@type": "Organization", name: "Veronica Wire" },
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
          <ArrowLeft className="h-4 w-4" /> Voltar pro Veronica Wire
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
                href={state.article.sourceUrls[0]}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-[13px] text-muted-foreground transition hover:text-neon-green"
              >
                Fonte: {deriveSourceLabel(state.article.sourceUrls[0])} ›
              </a>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-3 font-mono-tech text-[10.5px] uppercase tracking-widest text-muted-foreground">
              <span>{state.article.desk}</span>
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
              {state.article.aiGenerated && (
                <>
                  <span className="opacity-40">·</span>
                  <span className="inline-flex items-center gap-1 text-neon-cyan">
                    <Sparkles className="h-3 w-3" />
                    {state.article.autoPublished
                      ? "gerado e publicado por IA, sem revisão humana"
                      : "rascunho com IA, revisado pela redação"}
                  </span>
                </>
              )}
            </div>

            <div
              className="relative mt-6 flex aspect-video w-full items-center justify-center overflow-hidden rounded-sm border border-border/40"
              style={
                state.article.coverImageUrl
                  ? undefined
                  : {
                      background: `linear-gradient(135deg, ${withAlpha(BEAT_COLOR[state.article.beat], 0.28)}, ${withAlpha(BEAT_COLOR[state.article.beat], 0.06)})`,
                    }
              }
            >
              {state.article.coverImageUrl ? (
                <LazyImage
                  src={state.article.coverImageUrl}
                  alt=""
                  priority
                  useCfResize={false}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span
                  aria-hidden
                  className="font-mono-tech text-xs uppercase tracking-widest"
                  style={{ color: withAlpha(BEAT_COLOR[state.article.beat], 0.85) }}
                >
                  {BEAT_SHORT[state.article.beat]}
                </span>
              )}
            </div>

            <div className="mt-8 flex flex-col gap-4 text-[15px] leading-[1.75] text-foreground/90">
              {state.article.body
                .split(/\n{2,}/)
                .map((p) => p.trim())
                .filter(Boolean)
                .map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
            </div>

            {state.article.sourceUrls.length > 0 && (
              <div className="mt-10 rounded-sm border border-border/60 bg-surface/30 p-5">
                <h2 className="font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground">
                  Fontes
                </h2>
                <ul className="mt-2 flex flex-col gap-1">
                  {state.article.sourceUrls.map((url) => (
                    <li key={url}>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-neon-green hover:underline"
                      >
                        {url}
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
