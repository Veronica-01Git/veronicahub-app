import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Cpu, Cloud, Landmark, Globe2, TrendingUp } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { CoverThumb, BEAT_COLOR } from "@/components/blog/CoverThumb";
import { getArticlesByBeat } from "@/lib/articles-server";
import { formatAgo } from "@/lib/blog-format";
import { BEAT_LABELS, isBeat, type Beat } from "@/lib/beats";

// Rota separada de /blog/$slug (não /blog/$beat) de propósito: dois
// segmentos dinâmicos irmãos no mesmo nível (/blog/$slug e /blog/$beat)
// seriam ambíguos pro roteador — "/blog/ia" poderia casar com um slug de
// matéria ou com a editoria "ia". /blog/editoria/$beat elimina a ambiguidade.
const SITE_URL = "https://veronicahub.com";

const BEAT_ICON: Record<Beat, typeof Cpu> = {
  ia: Cpu,
  clima: Cloud,
  economia: Landmark,
  geopolitica: Globe2,
  mercado: TrendingUp,
};

export const Route = createFileRoute("/blog/editoria/$beat")({
  component: BeatPage,
  loader: async ({ params }) => {
    if (!isBeat(params.beat)) throw notFound();
    const beat = params.beat;
    const page = await getArticlesByBeat({ data: { beat } });
    return { beat, ...page };
  },
  head: ({ params }) => {
    if (!isBeat(params.beat)) {
      return { meta: [{ title: "Editoria não encontrada | Veronica Wire" }] };
    }
    const label = BEAT_LABELS[params.beat];
    return {
      meta: [
        { title: `${label} | Veronica Wire` },
        { name: "description", content: `Todas as matérias do Veronica Wire em ${label}.` },
        { property: "og:title", content: `${label} | Veronica Wire` },
        { property: "og:type", content: "website" },
      ],
      links: [{ rel: "canonical", href: `${SITE_URL}/blog/editoria/${params.beat}` }],
    };
  },
});

function BeatPage() {
  const initial = Route.useLoaderData();
  const beat = initial.beat;
  const meta = { label: BEAT_LABELS[beat], color: BEAT_COLOR[beat], icon: BEAT_ICON[beat] };

  const [articles, setArticles] = useState(initial.articles);
  const [cursor, setCursor] = useState(initial.nextCursor);
  const [loadingMore, setLoadingMore] = useState(false);
  const now = useState(() => new Date())[0];

  async function loadMore() {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await getArticlesByBeat({ data: { beat, cursor } });
      setArticles((prev) => [...prev, ...page.articles]);
      setCursor(page.nextCursor);
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div className="home-hybrid min-h-screen overflow-x-hidden bg-background text-foreground">
      <SiteHeader />

      <header className="border-b border-border/50 bg-background/95">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <Link
            to="/blog"
            className="inline-flex items-center gap-1.5 font-mono-tech text-[11px] uppercase tracking-widest text-muted-foreground transition hover:text-neon-green"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Veronica Wire
          </Link>
          <div
            className="mt-4 flex items-center gap-3 font-mono-tech text-[11px] uppercase tracking-widest"
            style={{ color: meta.color }}
          >
            <meta.icon className="h-4 w-4" />
            {meta.label}
          </div>
          <h1
            className="mt-2 font-display text-3xl text-foreground sm:text-4xl"
            style={{ letterSpacing: "-0.02em" }}
          >
            {meta.label}
          </h1>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-14 cv-auto">
        {articles.length === 0 ? (
          <div className="rounded-sm border border-border/60 bg-surface/40 p-8 text-center">
            <h2 className="font-display text-xl text-foreground">
              Nenhuma matéria publicada ainda nesta editoria
            </h2>
            <p className="mx-auto mt-2 max-w-md text-[15px] text-muted-foreground">
              Volte em breve — o Wire publica sozinho ao longo do dia.
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((a) => (
                <Link
                  key={a.id}
                  to="/blog/$slug"
                  params={{ slug: a.slug }}
                  className="group flex flex-col overflow-hidden rounded-sm border border-border/60 bg-surface/30 backdrop-blur transition duration-300 hover:-translate-y-1"
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = meta.color)}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "")}
                >
                  <CoverThumb
                    beat={a.beat}
                    coverImageUrl={a.coverImageUrl}
                    className="aspect-[16/10]"
                  />
                  <div className="flex flex-1 flex-col gap-3 p-6">
                    <div className="flex items-center justify-between font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground">
                      <span>{a.desk}</span>
                      <span>{formatAgo(a.publishedAt, now)}</span>
                    </div>
                    <h3
                      className="font-display text-xl text-foreground"
                      style={{ letterSpacing: "-0.02em", lineHeight: 1.15 }}
                    >
                      {a.headline}
                    </h3>
                    <p className="text-[13px] leading-[1.55] text-muted-foreground">{a.excerpt}</p>
                  </div>
                </Link>
              ))}
            </div>

            {cursor && (
              <div className="mt-10 flex justify-center">
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="rounded-sm border border-border/60 px-6 py-2.5 font-mono-tech text-xs uppercase tracking-widest text-foreground transition hover:border-neon-green hover:text-neon-green disabled:opacity-50"
                >
                  {loadingMore ? "Carregando…" : "Carregar mais"}
                </button>
              </div>
            )}
          </>
        )}
      </section>

      <SiteFooter />
    </div>
  );
}
