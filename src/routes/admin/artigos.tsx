import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { ShieldAlert, Sparkles, Loader2, Instagram, Copy, Check, X } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import {
  listArticlesAdmin,
  generateArticleDraftAI,
  generateSocialShareAI,
  saveArticleAdmin,
  setArticleStatusAdmin,
  deleteArticleAdmin,
} from "@/lib/articles-server";
import { BEAT_VALUES, BEAT_LABELS, type Beat } from "@/lib/beats";

// Rota não listada em ECOSYSTEM_LINKS de propósito, mesmo padrão de
// /admin — acesso só por URL direta, protegido no servidor via
// requireAdmin() em cada server function (ver articles-server.ts).
export const Route = createFileRoute("/admin/artigos")({
  component: ArticlesAdmin,
  head: () => ({
    meta: [{ title: "Artigos · Painel Admin | Veronica Hub" }],
  }),
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
  status: "draft" | "published";
  aiGenerated: boolean;
  createdAt: string;
  publishedAt: string | null;
};

type ListState = { ok: true; articles: Article[] } | { ok: false; error: string } | null;

const emptyForm = {
  id: null as string | null,
  beat: "ia" as Beat,
  headline: "",
  excerpt: "",
  body: "",
  desk: "",
  coverImageUrl: "",
  sourceUrls: "",
};

type ShareState =
  | { status: "loading"; article: Article }
  | { status: "ready"; article: Article; caption: string; videoUrl: string | null }
  | { status: "error"; article: Article; error: string };

function ArticlesAdmin() {
  const [state, setState] = useState<ListState>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [generatingBeat, setGeneratingBeat] = useState<Beat | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [share, setShare] = useState<ShareState | null>(null);
  const [copied, setCopied] = useState<"caption" | "video" | null>(null);

  function refresh() {
    listArticlesAdmin()
      .then((res) => setState(res as ListState))
      .catch((err) =>
        setState({ ok: false, error: err instanceof Error ? err.message : "Falha ao carregar." }),
      );
  }

  useEffect(refresh, []);

  async function handleGenerate(beat: Beat) {
    setGeneratingBeat(beat);
    setNotice(null);
    try {
      const res = await generateArticleDraftAI({ data: { beat } });
      if (!res.ok) {
        setNotice(`Erro ao gerar: ${res.error}`);
      } else {
        setNotice(`Rascunho gerado: "${res.article.headline}" — revise antes de publicar.`);
        refresh();
      }
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Falha ao gerar rascunho.");
    } finally {
      setGeneratingBeat(null);
    }
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setNotice(null);
    try {
      const res = await saveArticleAdmin({
        data: {
          id: form.id,
          beat: form.beat,
          headline: form.headline,
          excerpt: form.excerpt,
          body: form.body,
          desk: form.desk,
          coverImageUrl: form.coverImageUrl,
          sourceUrls: form.sourceUrls
            .split("\n")
            .map((u) => u.trim())
            .filter(Boolean),
        },
      });
      if (!res.ok) {
        setNotice(`Erro ao salvar: ${res.error}`);
      } else {
        setNotice(form.id ? "Matéria atualizada." : "Rascunho criado.");
        setForm(emptyForm);
        refresh();
      }
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Falha ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  function editArticle(a: Article) {
    setForm({
      id: a.id,
      beat: a.beat,
      headline: a.headline,
      excerpt: a.excerpt,
      body: a.body,
      desk: a.desk,
      coverImageUrl: a.coverImageUrl ?? "",
      sourceUrls: a.sourceUrls.join("\n"),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function toggleStatus(a: Article) {
    const next = a.status === "published" ? "draft" : "published";
    const res = await setArticleStatusAdmin({ data: { id: a.id, status: next } });
    if (!res.ok) setNotice(`Erro: ${res.error}`);
    else refresh();
  }

  async function remove(a: Article) {
    if (!window.confirm(`Excluir "${a.headline}"? Não dá pra desfazer.`)) return;
    const res = await deleteArticleAdmin({ data: { id: a.id } });
    if (!res.ok) setNotice(`Erro: ${res.error}`);
    else refresh();
  }

  async function openShare(a: Article) {
    setCopied(null);
    setShare({ status: "loading", article: a });
    const res = await generateSocialShareAI({ data: { id: a.id } });
    if (!res.ok) {
      setShare({ status: "error", article: a, error: res.error });
    } else {
      setShare({ status: "ready", article: a, caption: res.caption, videoUrl: res.videoUrl });
    }
  }

  function copyText(text: string, which: "caption" | "video") {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(which);
      window.setTimeout(() => setCopied(null), 2000);
    });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <div className="mx-auto max-w-5xl px-6 py-14">
        <div className="mb-8 flex items-center gap-3 font-mono-tech text-[11px] uppercase tracking-widest text-neon-green">
          <span className="h-1.5 w-1.5 rounded-full bg-neon-green animate-pulse-dot" />
          Artigos — Veronica Wire
        </div>

        {state && !state.ok ? (
          <div className="flex items-start gap-3 rounded-sm border border-destructive/40 bg-destructive/5 p-5">
            <ShieldAlert className="mt-0.5 h-5 w-5 flex-shrink-0 text-destructive" />
            <div>
              <p className="font-medium text-foreground">{state.error}</p>
              <p className="mt-1 text-[13px] text-muted-foreground">
                Faça login pelo botão "Entrar" no topo com o e-mail autorizado e recarregue.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-10">
            {notice && (
              <div className="rounded-sm border border-border/60 bg-surface/40 px-4 py-3 text-sm text-foreground">
                {notice}
              </div>
            )}

            <section>
              <h2 className="mb-4 font-display text-xl">Gerar rascunho com IA</h2>
              <p className="mb-4 text-sm text-muted-foreground">
                A IA pesquisa na web um fato real e recente na editoria escolhida e escreve um
                rascunho — sempre entra como "draft". Nada publica sozinho: revise o texto e as
                fontes abaixo antes de publicar.
              </p>
              <div className="flex flex-wrap gap-2">
                {BEAT_VALUES.map((beat) => (
                  <button
                    key={beat}
                    disabled={generatingBeat !== null}
                    onClick={() => handleGenerate(beat)}
                    className="inline-flex items-center gap-2 rounded-sm border border-border/60 bg-surface/40 px-4 py-2 text-sm transition hover:border-neon-green/50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {generatingBeat === beat ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5 text-neon-green" />
                    )}
                    {BEAT_LABELS[beat]}
                  </button>
                ))}
              </div>
            </section>

            <section>
              <h2 className="mb-4 font-display text-xl">
                {form.id ? "Editar matéria" : "Nova matéria manual"}
              </h2>
              <form
                onSubmit={handleSave}
                className="flex flex-col gap-3 rounded-sm border border-border/60 bg-surface/30 p-5"
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <select
                    value={form.beat}
                    onChange={(e) => setForm((f) => ({ ...f, beat: e.target.value as Beat }))}
                    className="rounded-sm border border-border/60 bg-background px-3 py-2 text-sm outline-none focus:border-neon-green"
                  >
                    {BEAT_VALUES.map((b) => (
                      <option key={b} value={b}>
                        {BEAT_LABELS[b]}
                      </option>
                    ))}
                  </select>
                  <input
                    value={form.desk}
                    onChange={(e) => setForm((f) => ({ ...f, desk: e.target.value }))}
                    placeholder="Desk (ex: Desk de Infraestrutura)"
                    required
                    className="rounded-sm border border-border/60 bg-background px-3 py-2 text-sm outline-none focus:border-neon-green"
                  />
                </div>
                <input
                  value={form.headline}
                  onChange={(e) => setForm((f) => ({ ...f, headline: e.target.value }))}
                  placeholder="Manchete"
                  required
                  className="rounded-sm border border-border/60 bg-background px-3 py-2 text-sm outline-none focus:border-neon-green"
                />
                <textarea
                  value={form.excerpt}
                  onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
                  placeholder="Resumo (1-2 frases)"
                  required
                  rows={2}
                  className="rounded-sm border border-border/60 bg-background px-3 py-2 text-sm outline-none focus:border-neon-green"
                />
                <textarea
                  value={form.body}
                  onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                  placeholder="Texto completo da matéria (parágrafos separados por linha em branco)"
                  required
                  rows={10}
                  className="rounded-sm border border-border/60 bg-background px-3 py-2 text-sm outline-none focus:border-neon-green"
                />
                <input
                  value={form.coverImageUrl}
                  onChange={(e) => setForm((f) => ({ ...f, coverImageUrl: e.target.value }))}
                  placeholder="URL da imagem de capa (opcional)"
                  className="rounded-sm border border-border/60 bg-background px-3 py-2 text-sm outline-none focus:border-neon-green"
                />
                <textarea
                  value={form.sourceUrls}
                  onChange={(e) => setForm((f) => ({ ...f, sourceUrls: e.target.value }))}
                  placeholder="Fontes — uma URL por linha (opcional)"
                  rows={3}
                  className="rounded-sm border border-border/60 bg-background px-3 py-2 text-sm outline-none focus:border-neon-green"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-sm bg-neon-green px-4 py-2 text-sm font-medium text-primary-foreground transition hover:brightness-110 disabled:opacity-50"
                  >
                    {saving ? "Salvando…" : form.id ? "Salvar alterações" : "Criar rascunho"}
                  </button>
                  {form.id && (
                    <button
                      type="button"
                      onClick={() => setForm(emptyForm)}
                      className="rounded-sm border border-border/60 px-4 py-2 text-sm transition hover:border-foreground/40"
                    >
                      Cancelar edição
                    </button>
                  )}
                </div>
              </form>
            </section>

            <section>
              <h2 className="mb-4 font-display text-xl">
                Todas as matérias {state?.ok ? `(${state.articles.length})` : ""}
              </h2>
              {!state ? (
                <p className="text-muted-foreground">Carregando…</p>
              ) : state.articles.length === 0 ? (
                <p className="text-muted-foreground">Nenhuma matéria ainda.</p>
              ) : (
                <div className="overflow-x-auto rounded-sm border border-border/60">
                  <table className="w-full min-w-[820px] border-collapse text-left text-[13px]">
                    <thead>
                      <tr className="border-b border-border/60 font-mono-tech text-[10.5px] uppercase tracking-widest text-muted-foreground">
                        <th className="px-4 py-3">Manchete</th>
                        <th className="px-4 py-3">Editoria</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Criada em</th>
                        <th className="px-4 py-3">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {state.articles.map((a) => (
                        <tr key={a.id} className="border-b border-border/30 last:border-0">
                          <td className="px-4 py-3">
                            <span className="line-clamp-2">{a.headline}</span>
                            {a.aiGenerated && (
                              <span className="ml-1.5 inline-flex items-center gap-1 text-[10px] text-neon-cyan">
                                <Sparkles className="h-3 w-3" /> IA
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{BEAT_LABELS[a.beat]}</td>
                          <td className="px-4 py-3">
                            <span
                              className="rounded-full px-2 py-0.5 font-mono-tech text-[10px] uppercase tracking-widest"
                              style={{
                                background:
                                  a.status === "published"
                                    ? "color-mix(in oklab, var(--neon-green) 15%, transparent)"
                                    : "color-mix(in oklab, var(--muted-foreground) 15%, transparent)",
                                color:
                                  a.status === "published"
                                    ? "var(--neon-green)"
                                    : "var(--muted-foreground)",
                              }}
                            >
                              {a.status === "published" ? "publicado" : "rascunho"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {new Date(a.createdAt).toLocaleDateString("pt-BR")}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => editArticle(a)}
                                className="text-xs text-neon-cyan hover:underline"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => toggleStatus(a)}
                                className="text-xs text-neon-green hover:underline"
                              >
                                {a.status === "published" ? "Despublicar" : "Publicar"}
                              </button>
                              <button
                                onClick={() => openShare(a)}
                                className="inline-flex items-center gap-1 text-xs text-neon-cyan hover:underline"
                              >
                                <Instagram className="h-3 w-3" /> Repostar
                              </button>
                              <button
                                onClick={() => remove(a)}
                                className="text-xs text-destructive hover:underline"
                              >
                                Excluir
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}
      </div>

      <SiteFooter />

      {share && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setShare(null)}
        >
          <div
            className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-sm border border-border/60 bg-background"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
              <div className="flex items-center gap-2 font-mono-tech text-[11px] uppercase tracking-widest text-neon-cyan">
                <Instagram className="h-4 w-4" /> Repostar — {share.article.headline}
              </div>
              <button
                onClick={() => setShare(null)}
                className="text-muted-foreground transition hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {share.status === "loading" ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> A Veronica está escrevendo a
                  legenda…
                </div>
              ) : share.status === "error" ? (
                <p className="text-sm text-destructive">{share.error}</p>
              ) : (
                <div className="flex flex-col gap-4">
                  {share.article.coverImageUrl && (
                    <img
                      src={share.article.coverImageUrl}
                      alt=""
                      className="aspect-video w-full rounded-sm border border-border/40 object-cover"
                    />
                  )}

                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground">
                        Legenda pra Instagram
                      </span>
                      <button
                        onClick={() => copyText(share.caption, "caption")}
                        className="inline-flex items-center gap-1 text-xs text-neon-green hover:underline"
                      >
                        {copied === "caption" ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                        {copied === "caption" ? "Copiado" : "Copiar"}
                      </button>
                    </div>
                    <p className="whitespace-pre-wrap rounded-sm border border-border/60 bg-surface/40 p-3 text-[13px] leading-[1.6] text-foreground">
                      {share.caption}
                    </p>
                  </div>

                  {share.videoUrl && (
                    <div>
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground">
                          Link do YouTube encontrado pela Veronica
                        </span>
                        <button
                          onClick={() => copyText(share.videoUrl!, "video")}
                          className="inline-flex items-center gap-1 text-xs text-neon-green hover:underline"
                        >
                          {copied === "video" ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                          {copied === "video" ? "Copiado" : "Copiar"}
                        </button>
                      </div>
                      <a
                        href={share.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block truncate rounded-sm border border-border/60 bg-surface/40 p-3 text-[13px] text-neon-cyan hover:underline"
                      >
                        {share.videoUrl}
                      </a>
                    </div>
                  )}

                  <p className="text-[11.5px] leading-[1.5] text-muted-foreground">
                    Sem publicação automática no Instagram — cole a legenda e a imagem/vídeo
                    direto no app do Instagram. {!share.videoUrl && "Nenhum link do YouTube foi encontrado nesta matéria; cole um manualmente no campo \"Fontes\" acima e gere de novo se quiser incluir um."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
