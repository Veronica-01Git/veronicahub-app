import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Sparkles } from "lucide-react";
import { SiteHeader, SiteFooter, VeronicaMark } from "@/components/SiteChrome";
import { getArticleBySlug } from "@/lib/articles-server";
import { BEAT_LABELS, type Beat } from "@/lib/beats";
import { extractYoutubeId, findYoutubeUrl } from "@/lib/youtube";

export const Route = createFileRoute("/blog/$slug")({
  component: ArticlePage,
});

type Article = {
  id: string;
  slug: string;
  beat: Beat;
  headline: string;
  excerpt: string;
  body: string;
  desk: string;
  coverImageUrl: string | null;
  sourceUrls: string[];
  aiGenerated: boolean;
  publishedAt: string | null;
};

function ArticlePage() {
  const { slug } = Route.useParams();
  const [state, setState] = useState<
    { ok: true; article: Article } | { ok: false; error: string } | null
  >(null);

  useEffect(() => {
    setState(null);
    getArticleBySlug({ data: { slug } })
      .then((res) => setState(res as typeof state))
      .catch((err) =>
        setState({
          ok: false,
          error: err instanceof Error ? err.message : "Falha ao carregar matéria.",
        }),
      );
  }, [slug]);

  return (
    <div className="home-hybrid min-h-screen bg-background text-foreground">
      {/* Barra vermelha fixa no topo — mesma assinatura visual de telejornal
          sério (CNN/G1) em toda matéria, não só no destaque do /blog. */}
      <div className="h-[3px] w-full" style={{ background: "oklch(0.5 0.2 25)" }} />
      <SiteHeader />

      <div className="mx-auto max-w-3xl px-6 py-14">
        <Link
          to="/blog"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-neon-green"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar pro Veronica Wire
        </Link>

        {state === null ? (
          <p className="mt-8 text-muted-foreground">Carregando…</p>
        ) : !state.ok ? (
          <div className="mt-8 rounded-sm border border-border/60 bg-surface/40 p-8 text-center">
            <h1 className="font-display text-xl text-foreground">Matéria não encontrada</h1>
            <p className="mt-2 text-sm text-muted-foreground">{state.error}</p>
          </div>
        ) : (
          <article className="mt-8">
            <span
              className="inline-flex items-center gap-1.5 bg-[oklch(0.5_0.2_25)] px-2.5 py-1 font-mono-tech text-[10px] font-bold uppercase tracking-widest text-white"
              style={{ clipPath: "polygon(0 0, 100% 0, 92% 100%, 0% 100%)" }}
            >
              {BEAT_LABELS[state.article.beat]}
            </span>
            <h1
              className="mt-4 font-display text-3xl font-bold text-foreground sm:text-[2.6rem]"
              style={{ letterSpacing: "-0.02em", lineHeight: 1.1 }}
            >
              {state.article.headline}
            </h1>
            <p className="mt-4 text-[17px] leading-[1.6] text-muted-foreground">
              {state.article.excerpt}
            </p>
            <div
              className="mt-5 flex flex-wrap items-center gap-3 border-t pt-4 font-mono-tech text-[10.5px] uppercase tracking-widest text-muted-foreground"
              style={{ borderTopColor: "oklch(0.5 0.2 25 / 0.35)" }}
            >
              <span className="font-bold text-foreground">{state.article.desk}</span>
              {state.article.publishedAt && (
                <>
                  <span className="opacity-40">·</span>
                  <span>
                    {new Date(state.article.publishedAt).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </>
              )}
              {state.article.aiGenerated && (
                <>
                  <span className="opacity-40">·</span>
                  <span className="inline-flex items-center gap-1 text-neon-cyan">
                    <Sparkles className="h-3 w-3" /> rascunho com IA, revisado pela redação
                  </span>
                </>
              )}
            </div>

            {(() => {
              const videoUrl = findYoutubeUrl(state.article.sourceUrls);
              const videoId = videoUrl ? extractYoutubeId(videoUrl) : null;
              if (videoId) {
                return (
                  <div className="relative mt-6 aspect-video w-full overflow-hidden rounded-sm border border-border/40">
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${videoId}`}
                      title={state.article.headline}
                      className="h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                    <VeronicaMark />
                  </div>
                );
              }
              if (state.article.coverImageUrl) {
                return (
                  <div className="relative mt-6 aspect-video w-full overflow-hidden rounded-sm border border-border/40">
                    <img
                      src={state.article.coverImageUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                    <VeronicaMark />
                  </div>
                );
              }
              return null;
            })()}

            <div className="mt-8 flex flex-col gap-4 text-[16px] leading-[1.8] text-foreground/90">
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
