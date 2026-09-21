import { useEffect, useState, type FormEvent } from "react";
import { MembersShell, MemberLogin, kinds } from "./Members";
import { memberAdminFeed, saveMemberPost, moderateMemberComment } from "./server";
import { postInput } from "./validation";
import type { z } from "zod";
type Draft = z.infer<typeof postInput>;
const empty: Draft = {
  title: "",
  body: "",
  kind: "novidade",
  prompt: "",
  mediaUrl: "",
  status: "draft",
};
export default function MemberAdmin() {
  const [data, setData] = useState<Awaited<ReturnType<typeof memberAdminFeed>> | null>(null),
    [draft, setDraft] = useState<Draft>({ ...empty }),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true);
  async function refresh() {
    setLoading(true);
    try {
      setData(await memberAdminFeed());
      setMessage("");
    } catch {
      setMessage(
        "Entre com a conta administradora. Se já estiver conectado, verifique a disponibilidade da comunidade.",
      );
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void refresh();
  }, []);
  async function save(e: FormEvent) {
    e.preventDefault();
    const parsed = postInput.safeParse(draft);
    if (!parsed.success) {
      setMessage(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    try {
      await saveMemberPost({ data: parsed.data });
      setDraft({ ...empty });
      await refresh();
      setMessage(
        parsed.data.status === "published"
          ? "Publicação disponível para os membros."
          : "Rascunho salvo.",
      );
    } catch {
      setMessage("Não foi possível salvar. Seu texto continua no editor. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }
  async function moderate(id: string, status: "approved" | "rejected") {
    setBusy(true);
    try {
      await moderateMemberComment({ data: { id, status } });
      await refresh();
    } catch {
      setMessage("Não foi possível moderar o comentário. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }
  if (!data)
    return (
      <MembersShell admin>
        <main className="vm-editor-layout">
          <div>
            <h1>Editorial Members</h1>
            <p role="status">{loading ? "Verificando acesso…" : message}</p>
          </div>
          {!loading && <MemberLogin onSuccess={refresh} />}
        </main>
      </MembersShell>
    );
  return (
    <MembersShell admin>
      <main className="vm-editor-layout">
        <aside>
          <span className="vm-eyebrow">COMUNIDADE</span>
          <h1>Seu próximo post.</h1>
          <button
            className="vm-primary"
            onClick={() => {
              setDraft({ ...empty });
              setMessage("");
            }}
          >
            Nova publicação
          </button>
          <div className="vm-editor-list">
            {data.posts.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setDraft({
                    id: p.id,
                    title: p.title,
                    body: p.body,
                    kind: p.kind as Draft["kind"],
                    prompt: p.prompt,
                    mediaUrl: p.mediaUrl,
                    status: p.status as Draft["status"],
                  });
                  setMessage("");
                }}
              >
                <strong>{p.title}</strong>
                <small>{p.status === "published" ? "Publicado" : "Rascunho"}</small>
              </button>
            ))}
          </div>
          <section className="vm-mod">
            <h2>Moderação</h2>
            {!data.comments.length && <p>Nenhum comentário pendente.</p>}
            {data.comments.map((c) => (
              <article key={c.id}>
                <strong>{c.name}</strong>
                <p>{c.body}</p>
                <small>{data.posts.find((p) => p.id === c.postId)?.title ?? "Publicação"}</small>
                <div>
                  <button disabled={busy} onClick={() => moderate(c.id, "approved")}>
                    Aprovar
                  </button>
                  <button disabled={busy} onClick={() => moderate(c.id, "rejected")}>
                    Recusar
                  </button>
                </div>
              </article>
            ))}
          </section>
        </aside>
        <section>
          <form className="vm-editor-form" onSubmit={save}>
            <h2>{draft.id ? "Editar publicação" : "Criar publicação"}</h2>
            <label>
              Categoria
              <select
                value={draft.kind}
                onChange={(e) => setDraft({ ...draft, kind: e.target.value as Draft["kind"] })}
              >
                {kinds
                  .filter((k) => k.id !== "todos")
                  .map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.label}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              Título
              <input
                value={draft.title}
                required
                minLength={3}
                maxLength={160}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
            </label>
            <label>
              Conteúdo
              <textarea
                value={draft.body}
                required
                minLength={10}
                maxLength={30000}
                rows={9}
                onChange={(e) => setDraft({ ...draft, body: e.target.value })}
              />
            </label>
            <label>
              Prompt para copiar{draft.kind !== "prompt" ? " (opcional)" : ""}
              <textarea
                value={draft.prompt}
                required={draft.kind === "prompt"}
                maxLength={16000}
                onChange={(e) => setDraft({ ...draft, prompt: e.target.value })}
              />
            </label>
            <label>
              Endereço da imagem ou vídeo
              <input
                value={draft.mediaUrl}
                required={draft.kind === "imagem" || draft.kind === "video"}
                placeholder="https://…"
                onChange={(e) => setDraft({ ...draft, mediaUrl: e.target.value })}
              />
            </label>
            <p className="vm-status">
              Cole o endereço direto da mídia já gerada no Studio ou publicada pela Hub. Para
              vídeos, use o arquivo de vídeo, não a página do player.
            </p>
            <label>
              Visibilidade
              <select
                value={draft.status}
                onChange={(e) => setDraft({ ...draft, status: e.target.value as Draft["status"] })}
              >
                <option value="draft">Rascunho — somente administradores</option>
                <option value="published">Publicado — todos os membros conectados</option>
              </select>
            </label>
            <div className="vm-editor-actions">
              <button className="vm-primary" disabled={busy}>
                {busy
                  ? "Salvando…"
                  : draft.status === "published"
                    ? "Salvar e publicar"
                    : "Salvar rascunho"}
              </button>
              <a className="vm-text" href="/video-ia" target="_blank" rel="noreferrer">
                Abrir Studio
              </a>
              <a className="vm-text" href="/admin/imagens" target="_blank" rel="noreferrer">
                Biblioteca da Hub
              </a>
            </div>
            <p role="status" className="vm-status">
              {message}
            </p>
          </form>
        </section>
      </main>
    </MembersShell>
  );
}
