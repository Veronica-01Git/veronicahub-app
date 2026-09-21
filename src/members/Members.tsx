import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  ArrowUpRight,
  Copy,
  Sparkles,
  MessageCircle,
  LockKeyhole,
  ChevronRight,
  Play,
  Image,
  Lightbulb,
  Newspaper,
  Terminal,
  RefreshCw,
} from "lucide-react";
import { requestEmailCode, verifyEmailCode, logout } from "@/lib/auth-server";
import { memberFeed, readMemberComments, addMemberComment } from "./server";
import "./members.css";
export const kinds = [
  { id: "todos", label: "Para você", icon: Sparkles },
  { id: "novidade", label: "Em primeira mão", icon: Newspaper },
  { id: "prompt", label: "Prompts grátis", icon: Terminal },
  { id: "ideia", label: "Ideias", icon: Lightbulb },
  { id: "imagem", label: "Imagens", icon: Image },
  { id: "video", label: "Vídeos", icon: Play },
];
export function MembersShell({
  children,
  admin = false,
}: {
  children: ReactNode;
  admin?: boolean;
}) {
  return (
    <div className="vh-members">
      <div className="vm-ambient" aria-hidden="true" />
      <header className="vm-header">
        <a className="vm-brand" href="/">
          veronica<span>hub</span>
          <span className="vm-divider" /> <small>{admin ? "Editorial" : "Members"}</small>
        </a>
        <nav>
          <a href={admin ? "/membros" : "/"}>
            {admin ? "Ver comunidade" : "Voltar à Hub"} <ArrowUpRight size={15} />
          </a>
        </nav>
      </header>
      {children}
      <footer className="vm-footer">
        Veronica Hub <span>Um espaço para aprender, criar e compartilhar.</span>
      </footer>
    </div>
  );
}
export function MemberLogin({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState(""),
    [code, setCode] = useState(""),
    [sent, setSent] = useState(false),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const r = sent
        ? await verifyEmailCode({ data: { email, code } })
        : await requestEmailCode({ data: { email } });
      if (!r.ok) {
        setMessage("Não foi possível confirmar o acesso. Confira os dados e tente novamente.");
        return;
      }
      if (sent) onSuccess();
      else setSent(true);
    } catch {
      setMessage("Não foi possível conectar. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="vm-login" onSubmit={submit}>
      <LockKeyhole size={25} />
      <h2>Seu próximo insight começa aqui.</h2>
      <p>
        Entre gratuitamente com sua conta Veronica para acessar os conteúdos e participar das
        conversas.
      </p>
      <label>
        E-mail
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          disabled={sent}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      {sent && (
        <label>
          Código recebido no e-mail
          <input
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        </label>
      )}
      <button className="vm-primary" disabled={busy}>
        {busy ? "Aguarde…" : sent ? "Entrar na comunidade" : "Receber código de acesso"}
        <ChevronRight size={17} />
      </button>
      {sent && (
        <button
          type="button"
          className="vm-text"
          onClick={() => {
            setSent(false);
            setCode("");
          }}
        >
          Alterar e-mail ou pedir novo código
        </button>
      )}
      <p role="status">{message}</p>
    </form>
  );
}
type Post = Awaited<ReturnType<typeof memberFeed>>["posts"][number];
function Discussion({ postId }: { postId: string }) {
  const [comments, setComments] = useState<Awaited<ReturnType<typeof readMemberComments>>>([]),
    [name, setName] = useState(""),
    [body, setBody] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    readMemberComments({ data: postId })
      .then((r) => {
        if (active) setComments(r);
      })
      .catch(() => {
        if (active) setMessage("Não foi possível carregar os comentários.");
      });
    return () => {
      active = false;
    };
  }, [postId]);
  async function send(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await addMemberComment({ data: { postId, name, body } });
      setBody("");
      setMessage("Comentário enviado para moderação. Obrigado por contribuir.");
    } catch {
      setMessage("Não foi possível enviar. Aguarde 30 segundos e tente novamente.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="vm-discussion">
      <h3>Conversa aberta</h3>
      {comments.length === 0 && <p>Compartilhe uma dúvida, experiência ou ideia.</p>}
      {comments.map((c) => (
        <div className="vm-comment" key={c.id}>
          <strong>{c.name}</strong>
          <p>{c.body}</p>
        </div>
      ))}
      <form onSubmit={send}>
        <label>
          Nome público
          <input
            required
            maxLength={60}
            minLength={2}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label>
          Sua contribuição
          <textarea
            required
            minLength={2}
            maxLength={2000}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </label>
        <small>As contribuições passam por moderação antes de aparecer.</small>
        <button className="vm-primary" disabled={busy}>
          {busy ? "Enviando…" : "Enviar comentário"}
        </button>
        <p role="status">{message}</p>
      </form>
    </section>
  );
}
function PostCard({ post }: { post: Post }) {
  const [open, setOpen] = useState(false),
    [copied, setCopied] = useState("");
  const category = kinds.find((k) => k.id === post.kind);
  return (
    <article className="vm-post">
      <div className="vm-post-top">
        <span className="vm-avatar">v.</span>
        <div>
          <strong>Veronica Hub</strong>
          <small>
            Equipe editorial ·{" "}
            {post.publishedAt
              ? new Date(post.publishedAt).toLocaleDateString("pt-BR", {
                  timeZone: "America/Sao_Paulo",
                })
              : ""}
          </small>
        </div>
        <span className="vm-tag">{category?.label}</span>
      </div>
      <h2>{post.title}</h2>
      <p className="vm-body">{post.body}</p>
      {post.mediaUrl && post.kind === "video" ? (
        <video className="vm-media" controls preload="metadata" src={post.mediaUrl}>
          Seu navegador não suporta este vídeo.
        </video>
      ) : post.mediaUrl ? (
        <img className="vm-media" src={post.mediaUrl} alt={post.title} loading="lazy" />
      ) : null}
      {post.prompt && (
        <div className="vm-prompt">
          <div>
            <span>
              <Terminal size={16} /> Prompt pronto para usar
            </span>
            <button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(post.prompt);
                  setCopied("Copiado!");
                } catch {
                  setCopied("Selecione o texto para copiar.");
                }
              }}
            >
              <Copy size={15} />
              {copied || "Copiar"}
            </button>
          </div>
          <pre>{post.prompt}</pre>
        </div>
      )}
      <div className="vm-post-actions">
        <button aria-expanded={open} onClick={() => setOpen(!open)}>
          <MessageCircle size={18} />
          {open ? "Fechar conversa" : "Participar da conversa"}
        </button>
        <span>Exclusivo para membros</span>
      </div>
      {open && <Discussion postId={post.id} />}
    </article>
  );
}
export default function Members() {
  const [feed, setFeed] = useState<Awaited<ReturnType<typeof memberFeed>> | null>(null),
    [filter, setFilter] = useState("todos"),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  async function refresh() {
    setLoading(true);
    setError("");
    try {
      setFeed(await memberFeed());
    } catch {
      setError("Não foi possível carregar a comunidade. Tente novamente em instantes.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void refresh();
  }, []);
  const posts = feed?.posts.filter((p) => filter === "todos" || p.kind === filter) ?? [];
  return (
    <MembersShell>
      <div className="vm-layout">
        <aside className="vm-sidebar">
          <span className="vm-eyebrow">SEU ESPAÇO NA VERONICA</span>
          <h1>
            Boas ideias.
            <br />
            Antes de todo mundo.
          </h1>
          <p>Novidades, criações e conversas que merecem ir além.</p>
          <nav aria-label="Conteúdos da comunidade">
            {kinds.map((k) => (
              <button
                key={k.id}
                aria-pressed={filter === k.id}
                className={filter === k.id ? "is-active" : ""}
                onClick={() => setFilter(k.id)}
              >
                <k.icon size={19} />
                {k.label}
              </button>
            ))}
          </nav>
          <div className="vm-sidebar-note">
            <Sparkles size={21} />
            <strong>Conhecimento para colocar em prática.</strong>
            <p>Explore os prompts, teste as ideias e conte o que você descobriu.</p>
          </div>
          {feed?.admin && (
            <a className="vm-admin-link" href="/admin/membros">
              Gerenciar publicações <ArrowUpRight size={16} />
            </a>
          )}
          {feed?.signedIn && (
            <button
              className="vm-text"
              onClick={async () => {
                await logout();
                setFeed(null);
                await refresh();
              }}
            >
              Sair da conta
            </button>
          )}
        </aside>
        <main className="vm-main">
          <section className="vm-intro">
            <div>
              <span className="vm-eyebrow">VERONICA MEMBERS</span>
              <h2>
                O que vem a seguir
                <br />
                começa por aqui.
              </h2>
              <p>Seu acesso aos bastidores da criação.</p>
            </div>
            <div className="vm-orbit" aria-hidden="true">
              <span />
              <span />
              <span />
              <b>v.</b>
            </div>
          </section>
          <div className="vm-feed-heading">
            <h2>{kinds.find((k) => k.id === filter)?.label}</h2>
            <button aria-label="Atualizar conteúdos" onClick={refresh} disabled={loading}>
              <RefreshCw size={18} />
            </button>
          </div>
          {loading ? (
            <div className="vm-empty" role="status">
              Carregando seu espaço…
            </div>
          ) : error ? (
            <div className="vm-empty" role="alert">
              <h3>Vamos tentar novamente?</h3>
              <p>{error}</p>
              <button className="vm-primary" onClick={refresh}>
                Recarregar
              </button>
            </div>
          ) : !feed?.signedIn ? (
            <MemberLogin onSuccess={refresh} />
          ) : posts.length ? (
            posts.map((post) => <PostCard key={post.id} post={post} />)
          ) : (
            <div className="vm-empty">
              <Sparkles size={30} />
              <h3>Espaço aberto para o próximo insight.</h3>
              <p>As publicações da equipe aparecerão aqui assim que forem liberadas.</p>
              {feed.admin && (
                <a className="vm-primary" href="/admin/membros">
                  Criar primeira publicação
                </a>
              )}
            </div>
          )}
        </main>
        <aside className="vm-right">
          <span className="vm-eyebrow">DENTRO DA COMUNIDADE</span>
          <h3>
            Uma ideia pode
            <br />
            mudar seu próximo projeto.
          </h3>
          <div>
            <Terminal />
            <h4>Copie. Adapte. Crie.</h4>
            <p>Prompts gratuitos para explorar novas possibilidades com IA.</p>
          </div>
          <div>
            <Play />
            <h4>Veja como ganha vida.</h4>
            <p>Imagens e vídeos compartilhados pela equipe da Hub.</p>
          </div>
          <div>
            <MessageCircle />
            <h4>Continue a conversa.</h4>
            <p>Troque experiências com respeito. Evite divulgar dados pessoais.</p>
          </div>
        </aside>
      </div>
    </MembersShell>
  );
}
