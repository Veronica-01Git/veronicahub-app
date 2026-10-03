import { MembersAgentPresence } from "./AgentPresence";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  ArrowUpRight,
  Bell,
  Beaker,
  Bookmark,
  ChevronRight,
  Clock,
  Copy,
  Home,
  Send,
  Image,
  Lightbulb,
  LockKeyhole,
  MessageCircle,
  Newspaper,
  Play,
  RefreshCw,
  Search,
  Sparkles,
  Star,
  Terminal,
  Users,
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

type Cover = "community" | "agents" | "studio";
const topicCovers: Record<string, Cover> = {
  novidade: "agents",
  prompt: "agents",
  ideia: "community",
  imagem: "studio",
  video: "studio",
};

function MemberCover({
  cover,
  className = "",
  priority = false,
  sizes = "(max-width: 760px) 100vw, (max-width: 1200px) 70vw, 760px",
}: {
  cover: Cover;
  className?: string;
  priority?: boolean;
  sizes?: string;
}) {
  return (
    <img
      className={`vm-cover ${className}`}
      src={`/images/members/${cover}-1280.webp`}
      srcSet={[640, 1280, 1672]
        .map((width) => `/images/members/${cover}-${width}.webp ${width}w`)
        .join(", ")}
      sizes={sizes}
      width={1672}
      height={941}
      alt=""
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
    />
  );
}

type FeedPost = Awaited<ReturnType<typeof memberFeed>>["posts"][number];
type CommunityPost = Omit<FeedPost, "publishedAt" | "createdAt"> & {
  publishedAt: Date | string | null;
  createdAt?: Date | string;
  demo?: boolean;
  demoComments?: Array<{ id: string; name: string; role: string; body: string }>;
};

const demoPosts: CommunityPost[] = [
  {
    id: "demo-lab-agentes",
    title: "Estamos testando uma nova forma de ensinar agentes a trabalhar",
    body: "No Veronica Labs estamos experimentando um fluxo em que o dono descreve o negócio, a Veronica organiza as regras e o agente passa por uma bateria de cenários antes de atender alguém. A pergunta para a comunidade é simples: qual seria o primeiro processo do seu negócio que você entregaria para uma agente?",
    kind: "novidade",
    prompt: "",
    mediaUrl: "",
    status: "published",
    publishedAt: "2026-10-01T18:20:00-03:00",
    agentGenerated: false,
    demo: true,
    demoComments: [
      {
        id: "dc-1",
        name: "Marina A.",
        role: "Membro demo · Marketing",
        body: "Eu começaria pelo primeiro atendimento de leads. É a parte mais repetitiva e onde mais perco tempo durante o dia.",
      },
      {
        id: "dc-2",
        name: "Rafael M.",
        role: "Membro demo · Negócios locais",
        body: "No meu caso seria confirmação e reagendamento. Se a agente souber quando precisa chamar uma pessoa, já resolve boa parte da operação.",
      },
    ],
  },
  {
    id: "demo-prompt-produto",
    title: "Prompt da semana: transforme uma ideia solta em oferta testável",
    body: "Um prompt curto para sair da abstração. Use antes de investir tempo em landing page, identidade ou automação: primeiro obrigue a ideia a explicar para quem existe, qual problema resolve e como pode ser testada em sete dias.",
    kind: "prompt",
    prompt:
      "Atue como estrategista de produto. Pegue minha ideia abaixo e transforme em uma oferta testável em 7 dias. Entregue: público específico, problema urgente, promessa verificável, versão mínima da oferta, canal de aquisição, experimento de validação e 3 sinais objetivos de que devo continuar ou abandonar. Ideia: [COLE AQUI].",
    mediaUrl: "",
    status: "published",
    publishedAt: "2026-09-30T10:15:00-03:00",
    agentGenerated: false,
    demo: true,
    demoComments: [
      {
        id: "dc-3",
        name: "Camila R.",
        role: "Membro demo · Criadora",
        body: "Gostei porque força a definir o teste antes do produto inteiro. Usei uma variação para organizar uma ideia de serviço.",
      },
    ],
  },
  {
    id: "demo-ideia-members",
    title: "Ideia aberta: uma biblioteca pessoal que aprende com o que você salva",
    body: "Estamos desenhando a Biblioteca do Members para ir além de favoritos. A visão é que prompts, aulas, agentes e experimentos salvos formem um mapa do que você está tentando construir — e a Veronica use isso para sugerir o próximo passo.",
    kind: "ideia",
    prompt: "",
    mediaUrl: "",
    status: "published",
    publishedAt: "2026-09-29T16:40:00-03:00",
    agentGenerated: false,
    demo: true,
    demoComments: [
      {
        id: "dc-4",
        name: "João V.",
        role: "Membro demo · Desenvolvimento",
        body: "Seria útil se desse para separar por projeto. Eu teria uma coleção para cliente e outra para projetos próprios.",
      },
      {
        id: "dc-5",
        name: "Bianca S.",
        role: "Membro demo · Design",
        body: "Para mim o mais valioso seria lembrar por que eu salvei algo. Uma nota pessoal pequena junto do item já ajudaria muito.",
      },
    ],
  },
];

const labs = [
  {
    eyebrow: "LAB 01 · AGENTES",
    title: "Sala de teste de agentes",
    description:
      "Experimentos de comportamento, regras e handoff antes de uma agente chegar ao cliente real.",
    status: "Em teste",
    href: "/agentes",
    cover: "agents" as const,
  },
  {
    eyebrow: "LAB 02 · CRIAÇÃO",
    title: "Studio Veronica",
    description:
      "Novos fluxos de imagem, vídeo e direção criativa entram aqui antes de virarem produto definitivo.",
    status: "Explorar",
    href: "/studio-veronica",
    cover: "studio" as const,
  },
  {
    eyebrow: "LAB 03 · PORTFOLIO",
    title: "Portfolio inteligente",
    description:
      "Uma experiência que transforma briefing em presença profissional e prepara a próxima etapa do projeto.",
    status: "Beta",
    href: "/portfolio",
    cover: "community" as const,
  },
];

type View = "inicio" | "biblioteca" | "labs" | "comunidade";

export function MembersShell({
  children,
  admin = false,
}: {
  children: ReactNode;
  admin?: boolean;
}) {
  return (
    <div className={`vh-members ${admin ? "vm-editor-shell" : "vm-community-shell"}`}>
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
        Veronica Hub <span>Aprender, criar, testar e construir em comunidade.</span>
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
    <form className="vm-login vm-login-premium" onSubmit={submit}>
      <div className="vm-login-icon">
        <LockKeyhole size={25} />
      </div>
      <span className="vm-eyebrow">VERONICA MEMBERS</span>
      <h2>Seu espaço dentro da Hub.</h2>
      <p>Entre gratuitamente para salvar conteúdos, acompanhar Labs e participar das conversas.</p>
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
        {busy ? "Aguarde…" : sent ? "Entrar no Members" : "Receber código de acesso"}
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

function Discussion({
  postId,
  demoComments,
}: {
  postId: string;
  demoComments?: CommunityPost["demoComments"];
}) {
  const [comments, setComments] = useState<Awaited<ReturnType<typeof readMemberComments>>>([]),
    [name, setName] = useState(""),
    [body, setBody] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);

  const demo = !!demoComments;

  useEffect(() => {
    if (demo) return;
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
  }, [demo, postId]);

  async function send(e: FormEvent) {
    e.preventDefault();
    if (demo) return;
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

  const visible = demoComments ?? comments;

  return (
    <section className="vm-discussion">
      <div className="vm-discussion-title">
        <div>
          <span className="vm-eyebrow">CONVERSA</span>
          <h3>{demo ? "Como a comunidade pode conversar" : "Conversa aberta"}</h3>
        </div>
        {demo && <span className="vm-demo-pill">Demonstração</span>}
      </div>
      {visible.length === 0 && <p>Compartilhe uma dúvida, experiência ou ideia.</p>}
      {visible.map((c) => (
        <div className="vm-comment" key={c.id}>
          <div className="vm-comment-avatar">{c.name.slice(0, 1)}</div>
          <div>
            <strong>{c.name}</strong>
            <small>{c.role}</small>
            <p>{c.body}</p>
          </div>
        </div>
      ))}
      {demo ? (
        <div className="vm-demo-note">
          Estes perfis e comentários são exemplos fictícios para demonstrar a experiência enquanto a
          comunidade real ainda está sendo formada.
        </div>
      ) : (
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
      )}
    </section>
  );
}

function CommunityHero({
  onExplore,
  onJoin,
  signedIn = false,
}: {
  onExplore: () => void;
  onJoin: () => void;
  signedIn?: boolean;
}) {
  const Heading = signedIn ? "h2" : "h1";
  return (
    <section className="vm-social-hero">
      <div className="vm-social-hero-copy">
        <span className="vm-eyebrow">
          <Sparkles size={14} /> IDEIAS BOAS CIRCULAM
        </span>
        <Heading>
          Sua próxima ideia
          <br />
          <em>começa numa conversa.</em>
        </Heading>
        <p>
          Um prompt que destrava. Um teste que surpreende. Uma troca que muda o seu próximo projeto.
        </p>
        <div className="vm-hero-actions">
          <button className="vm-primary" onClick={onExplore}>
            Explorar conversas <ArrowUpRight size={17} />
          </button>
          <button className="vm-secondary" onClick={onJoin}>
            {signedIn ? "Experimentar nos Labs" : "Fazer parte"}
          </button>
        </div>
      </div>
      <div className="vm-social-hero-art">
        <MemberCover cover="community" priority sizes="(max-width: 760px) 90vw, 520px" />
        <div className="vm-social-art-label">
          <span className="vm-avatar">v.</span>
          <div>
            <strong>O seu ponto de encontro.</strong>
            <small>Aprender · criar · compartilhar</small>
          </div>
        </div>
        <span className="vm-social-art-sticker">
          <MessageCircle size={18} /> Vamos criar juntos?
        </span>
      </div>
    </section>
  );
}

function TopicRail({ filter, onSelect }: { filter: string; onSelect: (id: string) => void }) {
  return (
    <nav className="vm-social-topics" aria-label="Explorar temas">
      {kinds.map((kind) => (
        <button key={kind.id} aria-pressed={filter === kind.id} onClick={() => onSelect(kind.id)}>
          <span className={`vm-topic-symbol vm-topic-${kind.id}`}>
            <kind.icon size={23} />
          </span>
          <span>{kind.label}</span>
        </button>
      ))}
    </nav>
  );
}

function PostCard({
  post,
  saved,
  onToggleSave,
  publicPreview = false,
  onJoin,
}: {
  post: CommunityPost;
  saved: boolean;
  onToggleSave: () => void;
  publicPreview?: boolean;
  onJoin?: () => void;
}) {
  const [open, setOpen] = useState(false),
    [copied, setCopied] = useState("");
  const category = kinds.find((k) => k.id === post.kind);

  return (
    <article className="vm-post" id={`post-${post.id}`}>
      <div className="vm-post-cover">
        {post.mediaUrl && post.kind === "video" ? (
          <video
            className="vm-media"
            controls
            preload="metadata"
            poster="/images/members/studio-1280.webp"
            src={post.mediaUrl}
          >
            Seu navegador não suporta este vídeo.
          </video>
        ) : post.mediaUrl ? (
          <img
            className="vm-media"
            src={post.mediaUrl}
            alt={post.title}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <MemberCover cover={topicCovers[post.kind] ?? "community"} />
        )}
      </div>
      <div className="vm-post-content">
        <div className="vm-post-top">
          <span className="vm-avatar">v.</span>
          <div>
            <strong>{post.agentGenerated ? "Agente Members" : "Veronica Hub"}</strong>
            <small>
              {post.agentGenerated ? "IA oficial · Veronica Hub" : "Equipe editorial"} ·{" "}
              {post.publishedAt
                ? new Date(post.publishedAt).toLocaleDateString("pt-BR", {
                    timeZone: "America/Sao_Paulo",
                  })
                : ""}
            </small>
          </div>
          {post.demo && <span className="vm-demo-pill">Exemplo fictício</span>}
          <span className="vm-tag">{category?.label}</span>
        </div>
        <h2>{post.title}</h2>
        <p className="vm-body">{post.body}</p>
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
          <div>
            <button aria-expanded={open} onClick={() => setOpen(!open)}>
              <MessageCircle size={18} />
              {open ? "Fechar conversa" : publicPreview ? "Ver conversa" : "Participar da conversa"}
            </button>
            <button onClick={onToggleSave} aria-pressed={saved}>
              <Bookmark size={18} fill={saved ? "currentColor" : "none"} />
              {saved ? "Salvo" : "Salvar"}
            </button>
          </div>
          <span>Exclusivo para membros</span>
        </div>
        {!open && !!post.demoComments?.length && (
          <section className="vm-conversation-peek" aria-label="Comentários ilustrativos">
            <div className="vm-peek-heading">
              <MessageCircle size={15} />
              <span>Uma conversa possível</span>
              <small>Comentários fictícios</small>
            </div>
            {post.demoComments.slice(0, 2).map((comment) => (
              <div className="vm-peek-comment" key={comment.id}>
                <span className="vm-comment-avatar" aria-hidden="true">
                  {comment.name.slice(0, 1)}
                </span>
                <div>
                  <strong>{comment.name}</strong>
                  <p>{comment.body}</p>
                </div>
              </div>
            ))}
          </section>
        )}
        {open && <Discussion postId={post.id} demoComments={post.demoComments} />}
        {publicPreview && (
          <button className="vm-join-conversation" onClick={onJoin}>
            <Send size={16} /> Sua ideia também cabe aqui. Entre para participar{" "}
            <ChevronRight size={16} />
          </button>
        )}
      </div>
    </article>
  );
}

function LabsView() {
  return (
    <section className="vm-view-section">
      <div className="vm-section-hero">
        <span className="vm-eyebrow">VERONICA LABS</span>
        <h2>Teste o que ainda não chegou ao público.</h2>
        <p>O Members vira a primeira camada de acesso aos experimentos do ecossistema Veronica.</p>
      </div>
      <div className="vm-labs-grid">
        {labs.map((lab) => (
          <a key={lab.title} className="vm-lab-card" href={lab.href}>
            <MemberCover cover={lab.cover} className="vm-lab-cover" />
            <div className="vm-lab-content">
              <span className="vm-eyebrow">{lab.eyebrow}</span>
              <div className="vm-lab-icon">
                <Beaker />
              </div>
              <h3>{lab.title}</h3>
              <p>{lab.description}</p>
              <footer>
                <span>{lab.status}</span>
                <ArrowUpRight size={17} />
              </footer>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

export default function Members() {
  const [feed, setFeed] = useState<Awaited<ReturnType<typeof memberFeed>> | null>(null),
    [filter, setFilter] = useState("todos"),
    [view, setView] = useState<View>("inicio"),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [savedIds, setSavedIds] = useState<string[]>([]),
    [query, setQuery] = useState("");

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
    try {
      setSavedIds(JSON.parse(localStorage.getItem("veronica-members-saved") || "[]"));
    } catch {
      setSavedIds([]);
    }
  }, []);

  const allPosts = useMemo<CommunityPost[]>(
    () => [...(feed?.posts ?? []), ...demoPosts],
    [feed?.posts],
  );

  const visiblePosts = allPosts.filter((p) => {
    const kindOk = filter === "todos" || p.kind === filter;
    const q = query.trim().toLowerCase();
    const searchOk = !q || p.title.toLowerCase().includes(q) || p.body.toLowerCase().includes(q);
    return kindOk && searchOk;
  });

  const savedPosts = allPosts.filter((p) => savedIds.includes(p.id));
  useEffect(() => {
    if (!loading && window.location.hash.startsWith("#post-")) {
      document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ block: "center" });
    }
  }, [loading, feed?.posts]);

  function toggleSave(id: string) {
    setSavedIds((current) => {
      const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
      localStorage.setItem("veronica-members-saved", JSON.stringify(next));
      return next;
    });
  }

  function scrollToCommunitySection(id: string, block: ScrollLogicalPosition = "start") {
    document.getElementById(id)?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block,
    });
  }

  function joinCommunity() {
    scrollToCommunitySection("vm-join", "center");
    document
      .querySelector<HTMLInputElement>("#vm-join input[type=email]")
      ?.focus({ preventScroll: true });
  }

  const nav = [
    { id: "inicio" as const, label: "Início", icon: Home },
    { id: "biblioteca" as const, label: "Minha Biblioteca", icon: Bookmark },
    { id: "labs" as const, label: "Veronica Labs", icon: Beaker },
    { id: "comunidade" as const, label: "Comunidade", icon: Users },
  ];

  return (
    <MembersShell>
      <div className="vm-members-topbar">
        <div className="vm-topbar-inner">
          <nav aria-label="Áreas do Members">
            {nav.map((item) => (
              <button
                key={item.id}
                aria-pressed={view === item.id}
                className={view === item.id ? "is-active" : ""}
                onClick={() => setView(item.id)}
              >
                <item.icon size={17} />
                {item.label}
              </button>
            ))}
          </nav>
          <div className="vm-top-actions">
            <div className="vm-search">
              <Search size={16} />
              <input
                aria-label="Buscar no Members"
                placeholder="Buscar no Members"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <button className="vm-icon-button" aria-label="Notificações">
              <Bell size={18} />
            </button>
          </div>
        </div>
      </div>

      {!loading && !error && !feed?.signedIn ? (
        <main className="vm-welcome vm-social-welcome">
          <CommunityHero
            onExplore={() => {
              setView("comunidade");
              scrollToCommunitySection("vm-public-feed");
            }}
            onJoin={joinCommunity}
          />
          <MembersAgentPresence />
          <TopicRail
            filter={filter}
            onSelect={(id) => {
              setFilter(id);
              setView("comunidade");
            }}
          />
          <div className="vm-social-columns">
            <section
              id="vm-public-feed"
              className="vm-public-feed"
              aria-label="Prévia da comunidade"
            >
              {view === "labs" ? (
                <LabsView />
              ) : (
                <>
                  <div className="vm-social-composer">
                    <span className="vm-avatar">v.</span>
                    <button onClick={joinCommunity}>
                      O que você está criando hoje?
                      <Send size={18} />
                    </button>
                  </div>
                  <div className="vm-feed-heading">
                    <div>
                      <span className="vm-eyebrow">
                        {view === "biblioteca" ? "SALVOS NESTE DISPOSITIVO" : "PONTO DE ENCONTRO"}
                      </span>
                      <h2>
                        {view === "biblioteca"
                          ? "Sua coleção de ideias"
                          : kinds.find((k) => k.id === filter)?.label}
                      </h2>
                    </div>
                    <span className="vm-preview-label">
                      {feed?.posts.length ? "Conteúdo da comunidade" : "Prévia ilustrativa"}
                    </span>
                  </div>
                  <p className="vm-preview-explanation">
                    Exercícios do agente são publicações reais. Os exemplos ilustrativos e seus
                    comentários estão identificados nos respectivos cartões.
                  </p>
                  {(view === "biblioteca" ? savedPosts : visiblePosts).length ? (
                    (view === "biblioteca" ? savedPosts : visiblePosts).map((post) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        saved={savedIds.includes(post.id)}
                        publicPreview
                        onToggleSave={() => toggleSave(post.id)}
                        onJoin={joinCommunity}
                      />
                    ))
                  ) : (
                    <div className="vm-empty">
                      <Bookmark size={26} />
                      <h3>
                        {view === "biblioteca"
                          ? "Sua coleção começa aqui."
                          : "Nenhuma ideia por aqui ainda."}
                      </h3>
                      <p>
                        {view === "biblioteca"
                          ? "Salve uma publicação para encontrá-la neste dispositivo."
                          : "Experimente outro tema ou termo de busca."}
                      </p>
                    </div>
                  )}
                </>
              )}
            </section>
            <aside className="vm-social-join" id="vm-join">
              <MemberLogin onSuccess={refresh} />
              <section className="vm-social-lab-note">
                <span className="vm-eyebrow">SAIA DA IDEIA</span>
                <h3>Seu próximo experimento.</h3>
                <p>Entre no Studio, teste uma agente ou dê forma ao seu portfolio.</p>
                <div>
                  {labs.map((lab) => (
                    <a href={lab.href} key={lab.title}>
                      <span className="vm-lab-thumb">
                        <MemberCover cover={lab.cover} sizes="64px" />
                      </span>
                      <strong>{lab.title}</strong>
                      <ArrowUpRight size={16} />
                    </a>
                  ))}
                </div>
              </section>
            </aside>
          </div>
        </main>
      ) : (
        <div className="vm-layout vm-layout-v2">
          <aside className="vm-sidebar">
            <span className="vm-eyebrow">VERONICA MEMBERS</span>
            <h1>Seu espaço dentro da Hub.</h1>
            <p>Aprenda, salve, teste e participe do que estamos construindo.</p>
            <nav aria-label="Conteúdos da comunidade">
              {kinds.map((k) => (
                <button
                  key={k.id}
                  aria-pressed={filter === k.id}
                  className={filter === k.id ? "is-active" : ""}
                  onClick={() => {
                    setFilter(k.id);
                    setView("comunidade");
                  }}
                >
                  <k.icon size={19} />
                  {k.label}
                </button>
              ))}
            </nav>
            <div className="vm-sidebar-note vm-member-status">
              <Star size={21} />
              <strong>Membro fundador</strong>
              <p>Você está acompanhando a construção inicial do Members.</p>
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
            ) : view === "labs" ? (
              <LabsView />
            ) : view === "biblioteca" ? (
              <section className="vm-view-section">
                <div className="vm-section-hero vm-library-hero">
                  <MemberCover cover="community" className="vm-section-cover" />
                  <div className="vm-section-copy">
                    <span className="vm-eyebrow">MINHA BIBLIOTECA</span>
                    <h2>O que vale guardar, fica perto.</h2>
                    <p>Seus conteúdos salvos neste dispositivo aparecem aqui.</p>
                  </div>
                </div>
                <div className="vm-library-stats">
                  <div>
                    <strong>{savedPosts.length}</strong>
                    <span>Itens salvos</span>
                  </div>
                  <div>
                    <strong>{savedPosts.filter((p) => p.kind === "prompt").length}</strong>
                    <span>Prompts</span>
                  </div>
                  <div>
                    <strong>{savedPosts.filter((p) => p.kind === "video").length}</strong>
                    <span>Vídeos</span>
                  </div>
                </div>
                {savedPosts.length ? (
                  savedPosts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      saved
                      onToggleSave={() => toggleSave(post.id)}
                    />
                  ))
                ) : (
                  <div className="vm-empty">
                    <Bookmark size={30} />
                    <h3>Sua biblioteca começa com uma escolha.</h3>
                    <p>Salve um prompt, ideia ou publicação para encontrar aqui depois.</p>
                    <button className="vm-primary" onClick={() => setView("comunidade")}>
                      Explorar conteúdos
                    </button>
                  </div>
                )}
              </section>
            ) : (
              <>
                {view === "inicio" && (
                  <>
                    <CommunityHero
                      signedIn
                      onExplore={() => setView("comunidade")}
                      onJoin={() => setView("labs")}
                    />
                    <MembersAgentPresence />
                    <TopicRail
                      filter={filter}
                      onSelect={(id) => {
                        setFilter(id);
                        setView("comunidade");
                      }}
                    />

                    <section className="vm-demo-banner">
                      <Sparkles />
                      <div>
                        <strong>Conversas para inspirar</strong>
                        <p>
                          Os exemplos fictícios estão identificados. Nas publicações da equipe, você
                          pode contribuir e acompanhar os comentários aprovados pela moderação.
                        </p>
                      </div>
                    </section>
                  </>
                )}

                <div className="vm-feed-heading">
                  <div>
                    <span className="vm-eyebrow">
                      {view === "inicio" ? "DESTAQUES DA COMUNIDADE" : "COMUNIDADE"}
                    </span>
                    <h2>{kinds.find((k) => k.id === filter)?.label}</h2>
                  </div>
                  <button aria-label="Atualizar conteúdos" onClick={refresh} disabled={loading}>
                    <RefreshCw size={18} />
                  </button>
                </div>

                {visiblePosts.length ? (
                  visiblePosts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      saved={savedIds.includes(post.id)}
                      onToggleSave={() => toggleSave(post.id)}
                    />
                  ))
                ) : (
                  <div className="vm-empty">
                    <Sparkles size={30} />
                    <h3>Nada encontrado por aqui.</h3>
                    <p>Tente outro filtro ou termo de busca.</p>
                  </div>
                )}
              </>
            )}
          </main>

          <aside className="vm-right">
            <span className="vm-eyebrow">SEU MOMENTO</span>
            <h3>Do insight à execução.</h3>
            <div>
              <Clock />
              <h4>Volte sem se perder.</h4>
              <p>Salve ideias e prompts para continuar quando fizer sentido.</p>
            </div>
            <div>
              <Beaker />
              <h4>Teste o que vem depois.</h4>
              <p>Labs aproxima membros das tecnologias em construção.</p>
            </div>
            <div>
              <Users />
              <h4>Construa em público.</h4>
              <p>Compartilhe aprendizados sem expor dados pessoais.</p>
            </div>
            <div className="vm-right-cta">
              <span className="vm-eyebrow">ECOSSISTEMA</span>
              <h4>Pronto para executar?</h4>
              <a href="/agentes">
                Conhecer agentes <ArrowUpRight size={15} />
              </a>
              <a href="/studio-veronica">
                Abrir Studio <ArrowUpRight size={15} />
              </a>
            </div>
          </aside>
        </div>
      )}
    </MembersShell>
  );
}
