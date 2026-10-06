import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  MessageCircle,
  Play,
  Wand2,
} from "lucide-react";
import { useState } from "react";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { VeronicaDrawer } from "@/components/VeronicaDrawer";
import "@/styles/escola.css";

const IMAGE_ROOT = "/images/escola";
const DESCRIPTION =
  "Aprenda inteligência artificial construindo projetos reais. Quatro trilhas, Aula Zero e Veronica Tutor, desenvolvidos no YO LAB & CO.";
export const Route = createFileRoute("/escola")({
  component: Escola,
  head: () => ({
    meta: [
      { title: "Escola Veronica · Inteligência que você aprende a construir" },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "Escola Veronica · YO LAB & CO." },
      { property: "og:description", content: DESCRIPTION },
      {
        property: "og:image",
        content: "https://veronicahub.com/images/escola/campus-v2-1600.webp",
      },
      {
        name: "twitter:image",
        content: "https://veronicahub.com/images/escola/campus-v2-1600.webp",
      },
      { name: "theme-color", content: "#1a1d1e" },
    ],
    links: [
      {
        rel: "preload",
        as: "image",
        href: `${IMAGE_ROOT}/campus-v2-1280.webp`,
        imageSrcSet: imageSrcSet("campus-v2"),
        imageSizes: "100vw",
        type: "image/webp",
        fetchPriority: "high",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "EducationalOrganization",
          name: "Veronica School of Artificial Intelligence",
          url: "https://veronicahub.com/escola",
          description: DESCRIPTION,
        }),
      },
    ],
  }),
});

function imageSrcSet(name: string) {
  return `${IMAGE_ROOT}/${name}-640.webp 640w, ${IMAGE_ROOT}/${name}-1280.webp 1280w, ${IMAGE_ROOT}/${name}-1600.webp 1600w`;
}
function SchoolImage({ name, alt, hero = false }: { name: string; alt: string; hero?: boolean }) {
  return (
    <img
      src={`${IMAGE_ROOT}/${name}-1280.webp`}
      srcSet={imageSrcSet(name)}
      sizes={hero ? "100vw" : "(max-width: 960px) 100vw, 56vw"}
      width={1280}
      height={720}
      alt={alt}
      loading={hero ? "eager" : "lazy"}
      fetchPriority={hero ? "high" : undefined}
      decoding="async"
      className={hero ? undefined : "wf-parallax"}
    />
  );
}
const tracks = [
  {
    code: "01",
    label: "CREATE",
    title: "Dê forma às suas ideias.",
    copy: "Avatar, voz, vídeo e direção criativa. Aprenda a transformar uma intenção em uma identidade que pode ser vista e ouvida.",
    hash: "create",
    image: "create-v2",
    alt: "Veronica e um mentor YO criando em um atelier de produção visual.",
  },
  {
    code: "02",
    label: "BUILD",
    title: "Construa o que imagina.",
    copy: "Sites, aplicativos e experiências digitais. Conecte design e tecnologia para construir projetos que você consegue demonstrar.",
    hash: "build",
    image: "build-v2",
    alt: "Veronica e agentes YO examinando um núcleo óptico no laboratório.",
  },
  {
    code: "03",
    label: "GROW",
    title: "Faça sua criação crescer.",
    copy: "Copy, conteúdo, afiliados e leitura de dados. Entenda como apresentar seu trabalho e organizar uma operação comercial.",
    hash: "grow",
    image: "grow-v2",
    alt: "Agentes YO reunidos em um ambiente de análise com iluminação verde discreta.",
  },
  {
    code: "04",
    label: "SECURE",
    title: "Proteja o que construiu.",
    copy: "Segurança defensiva, prevenção e análise autorizada. Aprenda a reconhecer riscos e cuidar dos seus projetos digitais.",
    hash: "secure",
    image: "secure-v2",
    alt: "Veronica com agentes YO em um corredor tecnológico de servidores.",
  },
] as const;
const method = [
  ["01", "Watch", "Assista ao necessário para entender a habilidade."],
  ["02", "Build", "Construa enquanto aprende. A aula já nasce como projeto."],
  ["03", "Test", "Compare versões, revise decisões e valide o resultado."],
  ["04", "Publish", "Transforme o exercício em algo demonstrável e publicável."],
] as const;

function Escola() {
  const [tutorOpen, setTutorOpen] = useState(false);
  return (
    <div className="vh-wf school-page min-h-screen">
      <VeronicaDrawer
        skillId="school"
        open={tutorOpen}
        stepId={null}
        onClose={() => setTutorOpen(false)}
      />
      <SiteHeader brand="yo" />
      <main>
        <section className="school-hero" aria-labelledby="school-title">
          <div className="school-hero-image" aria-hidden="true">
            <SchoolImage name="campus-v2" alt="" hero />
          </div>
          <div className="wf-wrap school-hero-content">
            <p className="wf-label flex items-center gap-2.5">
              <span className="wf-led" aria-hidden="true" />
              YO LAB &amp; CO. · Inteligência artificial
            </p>
            <h1 id="school-title" className="wf-display school-title">
              Escola <span>Veronica.</span>
            </h1>
            <p className="school-hero-copy">O futuro se aprende criando.</p>
            <div className="school-hero-actions">
              <Link to="/aula-zero" className="wf-btn wf-btn-primary">
                Comece a criar <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
            <div className="school-hero-rail">
              <span>Um campus para a sua próxima ideia.</span>
              <a href="#trilhas" className="school-discover wf-focus">
                Explore a Escola <ArrowDown size={16} aria-hidden="true" />
              </a>
            </div>
          </div>
        </section>

        <section className="school-section" aria-labelledby="school-start-title">
          <div className="wf-wrap school-intro">
            <div className="wf-reveal">
              <p className="wf-index">01 — Comece aqui</p>
              <h2 id="school-start-title" className="wf-h2 mt-5">
                Uma primeira entrega.
                <span className="school-dim block">Um novo jeito de aprender.</span>
              </h2>
              <p className="wf-lede mt-7 max-w-xl">
                Faça a Aula Zero, produza uma narração com IA e conheça o método antes de escolher
                uma formação.
              </p>
            </div>
            <div className="school-start wf-reveal">
              <span className="wf-label wf-label-signal">Aula Zero</span>
              <Play size={26} aria-hidden="true" className="mt-6" />
              <p className="wf-quote mt-6">A ideia ganha voz.</p>
              <p className="school-dim mt-4 leading-relaxed">
                Uma aula curta para transformar o primeiro contato com IA em algo que você pode
                ouvir e compartilhar.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link to="/aula-zero" className="wf-btn wf-btn-primary">
                  Abrir Aula Zero <ArrowRight size={15} aria-hidden="true" />
                </Link>
                <button
                  type="button"
                  className="school-text-button"
                  onClick={() => setTutorOpen(true)}
                >
                  Perguntar à Veronica <MessageCircle size={15} aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </section>

        <section
          id="trilhas"
          className="school-section school-tracks scroll-mt-24"
          aria-labelledby="school-tracks-title"
        >
          <div className="wf-wrap">
            <div className="school-section-heading wf-reveal">
              <div>
                <p className="wf-index">02 — Escolha sua direção</p>
                <h2 id="school-tracks-title" className="wf-h2 mt-5">
                  Quatro trilhas.<span className="school-dim block">Seu próximo projeto.</span>
                </h2>
              </div>
              <p className="wf-lede max-w-lg">
                Escolha pelo que você quer fazer. Criação, tecnologia, crescimento e segurança fazem
                parte do mesmo ecossistema.
              </p>
            </div>
            <nav className="school-track-nav mt-9" aria-label="Trilhas da Escola">
              {tracks.map((t) => (
                <a key={t.label} href={`#trilha-${t.hash}`} className="wf-chip wf-focus">
                  {t.code} · {t.label}
                </a>
              ))}
            </nav>
            <div className="mt-8">
              {tracks.map((track) => (
                <article
                  id={`trilha-${track.hash}`}
                  key={track.label}
                  className="wf-plate scroll-mt-24"
                  aria-labelledby={`title-${track.hash}`}
                >
                  <div className="wf-plate-media wf-reveal">
                    <SchoolImage name={track.image} alt={track.alt} />
                    <span className="wf-plate-tag wf-chip school-image-tag">
                      {track.label} · YO LAB
                    </span>
                  </div>
                  <div className="wf-reveal">
                    <p className="wf-label">
                      {track.code} — {track.label}
                    </p>
                    <h3 id={`title-${track.hash}`} className="school-track-title mt-5">
                      {track.title}
                    </h3>
                    <p className="wf-lede mt-6 max-w-xl">{track.copy}</p>
                    <Link to="/formacoes" hash={track.hash} className="wf-btn wf-btn-ghost mt-8">
                      Explorar {track.label.toLowerCase()}{" "}
                      <ArrowUpRight size={15} aria-hidden="true" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="wf-lab school-section" aria-labelledby="school-method-title">
          <div className="wf-lab-grid" aria-hidden="true" />
          <div className="wf-wrap">
            <p className="wf-index">03 — Método Veronica</p>
            <h2 id="school-method-title" className="wf-h2 mt-5">
              Assista menos.
              <br />
              Execute mais.
            </h2>
            <div className="school-method mt-12">
              {method.map(([number, title, copy]) => (
                <article key={number}>
                  <p className="wf-label">{number}</p>
                  <h3 className="mt-5 font-display text-3xl">{title}</h3>
                  <p className="mt-4 text-sm leading-7">{copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="school-section" aria-labelledby="school-avatar-title">
          <div className="wf-wrap school-intro">
            <div className="wf-reveal">
              <p className="wf-index">04 — Primeira formação em construção</p>
              <h2 id="school-avatar-title" className="wf-h2 mt-5">
                Avatar Digital IA.
                <span className="school-dim block">Identidade antes da imagem.</span>
              </h2>
              <p className="wf-lede mt-7 max-w-xl">
                A primeira prévia já está disponível, com laboratório, progresso local e Veronica
                Tutor. Os próximos módulos continuam em produção.
              </p>
              <Link to="/formacoes/avatar-digital-ia" className="wf-btn wf-btn-ghost mt-8">
                Conhecer a formação <ArrowUpRight size={15} aria-hidden="true" />
              </Link>
            </div>
            <div className="school-syllabus wf-reveal">
              <p className="wf-label">Sua jornada na formação</p>
              {[
                "Identidade antes da imagem",
                "Voz e presença",
                "Direção visual",
                "Roteiro e performance",
                "Publicação responsável",
              ].map((name, i) => (
                <div className="school-module" key={name}>
                  <span className="wf-label">0{i + 1}</span>
                  <div>
                    <p>{name}</p>
                    <span className={i === 0 ? "school-module-ready" : "school-dim"}>
                      {i === 0 ? "Prévia disponível" : "Em produção"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="school-section school-tutor" aria-labelledby="school-tutor-title">
          <div className="wf-wrap">
            <div className="wf-plate school-tutor-plate">
              <div className="wf-plate-media wf-reveal">
                <SchoolImage
                  name="tutor-v2"
                  alt="Veronica orientando um estudante em uma sala de mentoria do campus YO."
                />
                <span className="wf-plate-tag wf-chip school-image-tag">Veronica Tutor</span>
              </div>
              <div className="wf-reveal">
                <p className="wf-index">05 — Aprenda com a Veronica</p>
                <h2 id="school-tutor-title" className="wf-h2 mt-5">
                  A próxima pergunta
                  <span className="school-dim block">também faz parte da aula.</span>
                </h2>
                <p className="wf-lede mt-7">
                  Peça ajuda com o método, a trilha CREATE e a prévia de Avatar Digital IA. O tutor
                  trabalha com o contexto da Escola para orientar o seu próximo passo.
                </p>
                <button
                  type="button"
                  onClick={() => setTutorOpen(true)}
                  className="wf-btn wf-btn-primary mt-8"
                >
                  Conversar com a Veronica <MessageCircle size={16} aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="school-section" aria-labelledby="school-next-title">
          <div className="wf-wrap">
            <p className="wf-index">06 — Continue construindo</p>
            <h2 id="school-next-title" className="wf-h2 mt-5">
              Da aula para o mundo.
            </h2>
            <div className="school-next mt-10">
              {[
                {
                  icon: Wand2,
                  title: "Studio",
                  copy: "Explore imagem, voz e mídia no ambiente criativo.",
                  to: "/studio-veronica" as const,
                },
                {
                  icon: BookOpen,
                  title: "Portfolio",
                  copy: "Apresente seus projetos em um espaço próprio.",
                  to: "/portfolio" as const,
                },
                {
                  icon: MessageCircle,
                  title: "Members",
                  copy: "Continue com novidades, prompts e comunidade.",
                  to: "/membros" as const,
                },
              ].map((item) => (
                <Link key={item.title} to={item.to} className="school-next-link wf-focus">
                  <item.icon size={21} aria-hidden="true" />
                  <h3 className="mt-7 font-display text-3xl">{item.title}</h3>
                  <p className="school-dim mt-4 leading-relaxed">{item.copy}</p>
                  <span className="school-text-button mt-6">
                    Explorar <ArrowUpRight size={15} aria-hidden="true" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter brand="yo" tagline="A escola de inteligência artificial do YO LAB & CO." />
    </div>
  );
}
