import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  Clapperboard,
  Captions,
  Layers,
  Link2,
  Play,
  Scissors,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { youtubeUrl } from "@/social/policy";
import "@/components/shorts/shorts.css";

export const Route = createFileRoute("/shorts")({
  component: ShortsPage,
  head: () => ({
    meta: [
      { title: "Veronica Shorts — grandes ideias, novos formatos | Veronica Hub" },
      {
        name: "description",
        content:
          "Conheça o Veronica Shorts: o motor próprio da Hub para transformar vídeos autorizados do YouTube em cortes verticais com legendas, capas e kits para suas redes.",
      },
      { property: "og:title", content: "Veronica Shorts · Um vídeo. Novas possibilidades." },
      {
        property: "og:image",
        content: "https://veronicahub.com/images/home/platforms/studio-1280.webp",
      },
    ],
  }),
});
const modes = [
  { label: "Essencial", duration: 30, copy: "Uma ideia clara. Direto ao ponto.", goal: "cliques" },
  {
    label: "História",
    duration: 45,
    copy: "Mais espaço para desenvolver o contexto.",
    goal: "seguidores",
  },
  {
    label: "Explicação",
    duration: 60,
    copy: "Tempo para entregar uma ideia completa.",
    goal: "usuarios",
  },
] as const;
const features = [
  {
    icon: Scissors,
    title: "O trecho faz a diferença.",
    text: "Seleção editorial de momentos com uma ideia compreensível, contexto e conclusão. Os tempos vêm do vídeo original.",
  },
  {
    icon: Captions,
    title: "Cada palavra no seu tempo.",
    text: "Legendas sincronizadas com a fala e organizadas em blocos curtos para a leitura no celular.",
  },
  {
    icon: Layers,
    title: "Uma identidade. Quatro redes.",
    text: "Capa vertical, título, hashtags e convite adaptado para YouTube, Instagram, TikTok e Facebook.",
  },
];
function ShortsPage() {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [mode, setMode] = useState(0);
  function submit(event: FormEvent) {
    event.preventDefault();
    try {
      const source = youtubeUrl(url).url;
      window.location.assign(`/admin/shorts?source=${encodeURIComponent(source)}`);
    } catch {
      setError("Cole o link de um vídeo do YouTube. Links de canais e playlists não são aceitos.");
    }
  }
  return (
    <div className="shorts-page">
      <SiteHeader />
      <div className="shorts-subnav">
        <div className="shorts-container">
          <a href="/shorts" className="shorts-wordmark">
            Veronica <span>Shorts</span>
            <span className="shorts-mark">↗</span>
          </a>
          <a href="/admin/shorts" className="shorts-nav-cta">
            Abrir meu banco <ArrowUpRight size={14} />
          </a>
        </div>
      </div>
      <main>
        <section className="shorts-hero shorts-container">
          <div className="shorts-hero-copy">
            <p className="shorts-eyebrow">
              <span className="shorts-dot" /> YO LAB & CO. · CRIAÇÃO EM MOVIMENTO
            </p>
            <h1>
              Um vídeo.
              <br />
              Novas <span>possibilidades.</span>
            </h1>
            <p className="shorts-lead">
              Suas melhores ideias merecem continuar. Transforme vídeos longos em cortes feitos para
              a próxima conversa.
            </p>
            <div className="shorts-hero-actions">
              <a href="#seu-video" className="shorts-primary">
                Conhecer o fluxo <ArrowRight size={17} />
              </a>
              <a href="#como-funciona" className="shorts-text-link">
                Veja como funciona <ChevronRight size={16} />
              </a>
            </div>
            <p className="shorts-access">
              <span />
              Pré-lançamento · operação no painel privado
            </p>
          </div>
          <div className="shorts-hero-art" aria-label="Composição ilustrativa do formato vertical">
            <div className="shorts-art-grid" />
            <div className="shorts-source-card">
              <div className="shorts-source-bar">
                <span>
                  <Clapperboard size={13} /> Seu vídeo original
                </span>
                <span>16:9</span>
              </div>
              <img
                src="/images/home/platforms/studio-1280.webp"
                width="1280"
                height="720"
                alt="Edição audiovisual em um estúdio cinematográfico"
                fetchPriority="high"
              />
              <div className="shorts-source-timeline">
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
              </div>
            </div>
            <div className="shorts-phone">
              <div className="shorts-phone-top">
                <span>VERONICA SHORTS</span>
                <Sparkles size={13} />
              </div>
              <img
                src="/images/home/platforms/studio-1280.webp"
                width="1280"
                height="720"
                alt="Exemplo visual de enquadramento vertical"
              />
              <div className="shorts-phone-gradient" />
              <div className="shorts-phone-caption">
                <span>Uma ideia.</span>
                <span className="shorts-caption-accent">Novas possibilidades.</span>
              </div>
              <div className="shorts-phone-bottom">
                <span className="shorts-play-mark">
                  <Play size={13} fill="currentColor" />
                </span>
                <span>9:16 · 1080p</span>
                <span className="shorts-phone-progress" />
              </div>
            </div>
            <div className="shorts-floating-label">
              <Captions size={16} />
              <span>Legendas que acompanham a fala</span>
            </div>
            <p className="shorts-preview-label">Visualização ilustrativa do formato</p>
          </div>
        </section>
        <section className="shorts-network-strip" aria-label="Formatos para suas redes">
          <div className="shorts-container">
            <p>Seu conteúdo, em novos lugares.</p>
            <div>
              <span>
                YouTube <b>Shorts</b>
              </span>
              <span>
                Instagram <b>Reels</b>
              </span>
              <span>TikTok</span>
              <span>
                Facebook <b>Reels</b>
              </span>
            </div>
          </div>
        </section>
        <section id="seu-video" className="shorts-workspace-section shorts-container">
          <div className="shorts-section-heading">
            <p className="shorts-eyebrow">COMECE COM O QUE VOCÊ JÁ CRIOU</p>
            <h2>
              A próxima ideia
              <br />
              já está no seu vídeo.
            </h2>
            <p>Escolha a fonte. Organize a intenção. Acompanhe cada corte.</p>
          </div>
          <div className="shorts-workspace">
            <div className="shorts-workspace-controls">
              <div className="shorts-workspace-heading">
                <span className="shorts-icon-box">
                  <Link2 size={20} />
                </span>
                <div>
                  <h3>Qual vídeo vamos explorar?</h3>
                  <p>Vídeos seus ou com autorização de uso.</p>
                </div>
              </div>
              <form onSubmit={submit} className="shorts-link-form">
                <label htmlFor="shorts-youtube">Link do YouTube</label>
                <div className="shorts-input-wrap">
                  <Link2 size={17} aria-hidden="true" />
                  <input
                    id="shorts-youtube"
                    type="url"
                    required
                    maxLength={1000}
                    placeholder="Cole o link do seu vídeo"
                    value={url}
                    aria-describedby="shorts-link-help"
                    aria-invalid={!!error}
                    onChange={(e) => {
                      setUrl(e.target.value);
                      setError("");
                    }}
                  />
                </div>
                {error && (
                  <p role="alert" className="shorts-form-error">
                    {error}
                  </p>
                )}
                <button className="shorts-primary" type="submit">
                  Levar ao banco de vídeos <ArrowRight size={16} />
                </button>
                <p id="shorts-link-help" className="shorts-form-note">
                  Este botão abre o painel privado e preenche o link. O vídeo só entra na fila
                  quando você salvar.
                </p>
              </form>
              <div className="shorts-mode-heading">
                <SlidersHorizontal size={16} />
                <span>Explore o ritmo do formato</span>
              </div>
              <div className="shorts-mode-tabs" role="group" aria-label="Exemplos de duração">
                {modes.map((m, i) => (
                  <button
                    key={m.label}
                    aria-pressed={mode === i}
                    className={mode === i ? "selected" : ""}
                    onClick={() => setMode(i)}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              <p className="shorts-mode-copy">{modes[mode].copy}</p>
            </div>
            <div className="shorts-workspace-preview">
              <div className="shorts-preview-header">
                <span>O FORMATO EM PERSPECTIVA</span>
                <span className="shorts-preview-tag">{modes[mode].duration}s</span>
              </div>
              <div className="shorts-mini-phone">
                <img
                  src="/images/home/platforms/studio-1280.webp"
                  width="1280"
                  height="720"
                  loading="lazy"
                  alt="Estúdio em uma composição vertical de exemplo"
                />
                <div className="shorts-mini-shade" />
                <span className="shorts-mini-caption">
                  Uma ideia que
                  <br />
                  <b>merece continuar.</b>
                </span>
                <div className="shorts-mini-bars">
                  {Array.from({ length: 24 }, (_, i) => (
                    <i key={i} style={{ height: `${8 + ((i * 7) % 24)}px` }} />
                  ))}
                </div>
              </div>
              <div className="shorts-preview-specs">
                <span>
                  <Check size={13} /> 9:16
                </span>
                <span>
                  <Check size={13} /> Legendas
                </span>
                <span>
                  <Check size={13} /> Capa
                </span>
              </div>
              <p className="shorts-form-note">
                Exploração visual. A duração final depende dos trechos selecionados.
              </p>
            </div>
          </div>
          <div className="shorts-operation-note">
            <span className="shorts-status-icon">
              <Clapperboard size={17} />
            </span>
            <p>
              <strong>Estamos preparando a abertura.</strong> O painel administrativo e o código do
              motor próprio já estão publicados. Processamento contínuo e publicação social aguardam
              conexão e validação da infraestrutura.
            </p>
            <a href="/admin/shorts">
              Ver operação <ArrowUpRight size={14} />
            </a>
          </div>
        </section>
        <section className="shorts-features-section">
          <div className="shorts-container">
            <div className="shorts-section-heading">
              <p className="shorts-eyebrow">DO CONTEÚDO AO CRIATIVO</p>
              <h2>
                Mais intenção.
                <br />
                Em cada detalhe.
              </h2>
            </div>
            <div className="shorts-feature-grid">
              {features.map((f) => (
                <article key={f.title}>
                  <f.icon size={25} strokeWidth={1.5} />
                  <h3>{f.title}</h3>
                  <p>{f.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section id="como-funciona" className="shorts-flow shorts-container">
          <div className="shorts-section-heading">
            <p className="shorts-eyebrow">UM FLUXO QUE VOCÊ ACOMPANHA</p>
            <h2>
              Da sua escolha
              <br />à próxima publicação.
            </h2>
          </div>
          <div className="shorts-flow-grid">
            {[
              { title: "Escolha", text: "Guarde o link e confirme a autorização de uso." },
              {
                title: "Prepare",
                text: "O motor transcreve e seleciona os trechos a partir do conteúdo.",
              },
              {
                title: "Revise",
                text: "Confira a prévia, as legendas, a capa e o kit de cada corte.",
              },
              {
                title: "Distribua",
                text: "Use os arquivos nas suas redes. A integração de postagem será ativada após validação.",
              },
            ].map((s, i) => (
              <article key={s.title}>
                <span className="shorts-step-number">0{i + 1}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="shorts-business-section shorts-container">
          <div className="shorts-business-card">
            <div>
              <p className="shorts-eyebrow">PARA QUEM TEM ALGO A DIZER</p>
              <h2>
                Conteúdo que trabalha
                <br />
                pelo seu projeto.
              </h2>
              <p>
                Para criadores, marcas e profissionais que querem transformar conhecimento em
                presença. Converse com a Hub sobre um fluxo para o seu negócio.
              </p>
              <a href="/implementar" className="shorts-primary">
                Conversar sobre meu projeto <ArrowUpRight size={16} />
              </a>
            </div>
            <div className="shorts-business-list">
              {[
                ["Criadores", "Dê continuidade a aulas, entrevistas e conversas."],
                ["Marcas", "Leve demonstrações e histórias para novos formatos."],
                ["Equipes", "Organize fontes, revisões e entregas em um só fluxo."],
              ].map(([title, text]) => (
                <div key={title}>
                  <span>
                    <Check size={16} />
                  </span>
                  <div>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="shorts-faq shorts-container">
          <h2>Antes de começar.</h2>
          {[
            [
              "Posso usar qualquer vídeo do YouTube?",
              "Use vídeos próprios ou com autorização para editar e publicar. A aquisição também depende de o vídeo estar acessível; lives e conteúdo restrito não fazem parte desta versão.",
            ],
            [
              "A ferramenta já está aberta para todos?",
              "Ainda não. A operação inicial é administrativa. A abertura ao público depende da implantação do processador, armazenamento privado, contas e limites de uso.",
            ],
            [
              "Os vídeos são publicados automaticamente?",
              "A publicação automática e os horários ainda não estão ativos. O motor prepara arquivos e kits; a conexão com as redes será validada separadamente.",
            ],
            [
              "Os cortes garantem visualizações ou vendas?",
              "Não. A ferramenta ajuda a preparar conteúdo. Os resultados dependem da qualidade do material, do público, da distribuição e da oferta.",
            ],
          ].map(([title, text]) => (
            <details key={title}>
              <summary>
                {title}
                <span>+</span>
              </summary>
              <p>{text}</p>
            </details>
          ))}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
