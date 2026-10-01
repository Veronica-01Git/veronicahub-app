import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowUpRight,
  Building2,
  Check,
  ChevronDown,
  Construction,
  Hammer,
  Instagram,
  MapPin,
  MessageCircle,
  PackageOpen,
  Phone,
  Recycle,
  ShieldCheck,
  Sparkles,
  Trees,
  Truck,
} from "lucide-react";
import type { CSSProperties, ReactNode } from "react";

export const Route = createFileRoute("/express-entulho")({
  component: ExpressEntulhoLanding,
  head: () => ({
    meta: [
      { title: "Express Entulho — Locação de caçambas em Itajaí e região" },
      {
        name: "description",
        content:
          "Caçamba pequena, caçamba grande e tambor para obras, reformas, demolições e limpezas em Itajaí e região. Solicite seu orçamento pelo WhatsApp.",
      },
      { property: "og:title", content: "Express Entulho — Entulho sem complicação" },
      {
        property: "og:description",
        content:
          "Soluções práticas para manter sua obra, reforma ou limpeza mais organizada. Atendimento em Itajaí e região.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "theme-color", content: "#0d5f3b" },
    ],
    links: [{ rel: "canonical", href: "https://veronicahub.com/express-entulho" }],
  }),
});

const WHATSAPP_NUMBER = "5547991576500";
const WHATSAPP_MESSAGE =
  "Olá! Vim pelo site da Express Entulho e gostaria de solicitar um orçamento.";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
const INSTAGRAM_URL = "https://www.instagram.com/expressentulho/";
const MAPS_URL =
  "https://www.google.com/maps/search/?api=1&query=R.%20Benjamin%20Franklin%20Pereira%2C%20365%20-%20S%C3%A3o%20Jo%C3%A3o%2C%20Itaja%C3%AD%20-%20SC%2C%2088304-070";

const pageStyle = {
  "--ee-green": "#0d5f3b",
  "--ee-green-dark": "#073824",
  "--ee-green-soft": "#e9f3ed",
  "--ee-yellow": "#f2c400",
  "--ee-ink": "#111310",
  "--ee-paper": "#f5f5f0",
  "--ee-line": "rgba(17, 19, 16, 0.12)",
} as CSSProperties;

const produtos = [
  {
    icon: PackageOpen,
    name: "Caçamba pequena",
    description: "Uma opção compacta para reformas, limpezas e locais com espaço reduzido.",
    accent: "Pequena",
  },
  {
    icon: Construction,
    name: "Caçamba grande",
    description: "Mais espaço para volumes maiores em obras, reformas e demolições.",
    accent: "Grande",
  },
  {
    icon: Recycle,
    name: "Tambor",
    description: "Uma solução prática para descartes menores e organização durante a obra.",
    accent: "Tambor",
  },
];

const usos = [
  {
    icon: Building2,
    title: "Construções",
    copy: "Organização para o descarte de resíduos ao longo da obra.",
  },
  {
    icon: Hammer,
    title: "Reformas",
    copy: "Solução proporcional ao espaço e ao volume do serviço.",
  },
  {
    icon: Trees,
    title: "Limpezas",
    copy: "Apoio para limpeza de terrenos, quintais e áreas em geral.",
  },
];

const perguntas = [
  {
    question: "Quanto custa a locação?",
    answer:
      "O valor depende do tipo de resíduo, da solução escolhida e do endereço de atendimento. Envie essas informações pelo WhatsApp para receber o orçamento correto.",
  },
  {
    question: "Quais opções estão disponíveis?",
    answer:
      "A Express Entulho trabalha com caçamba pequena, caçamba grande e tambor. A equipe orienta a opção mais adequada para cada necessidade.",
  },
  {
    question: "A Express atende fora de Itajaí?",
    answer:
      "A empresa atende Itajaí e região. A disponibilidade para cada cidade e bairro é confirmada no orçamento.",
  },
  {
    question: "O que preciso informar para pedir um orçamento?",
    answer:
      "Informe o tipo de material, a cidade, o bairro, a data desejada e, se souber, o tamanho da caçamba. Se faltar algum dado, a equipe ajuda a completar.",
  },
];

function WhatsappButton({
  children,
  inverse = false,
  className = "",
}: {
  children: ReactNode;
  inverse?: boolean;
  className?: string;
}) {
  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`ee-button ${inverse ? "ee-button-inverse" : "ee-button-primary"} ${className}`}
      aria-label={`${typeof children === "string" ? children : "Falar no WhatsApp"} — abre em nova aba`}
    >
      <MessageCircle aria-hidden="true" />
      <span>{children}</span>
    </a>
  );
}

function SectionLabel({ children, light = false }: { children: ReactNode; light?: boolean }) {
  return <p className={`ee-label ${light ? "ee-label-light" : ""}`}>{children}</p>;
}

function ExpressEntulhoLanding() {
  return (
    <div className="ee-page" style={pageStyle}>
      <style>{expressStyles}</style>

      <header className="ee-header">
        <a href="#inicio" className="ee-brand" aria-label="Express Entulho — início">
          <img
            src="/images/express-entulho/logo-express-entulho.webp"
            alt="Express Entulho — locação de caçambas"
            width="210"
            height="70"
          />
        </a>

        <nav className="ee-nav" aria-label="Navegação principal">
          <a href="#solucoes">Soluções</a>
          <a href="#como-funciona">Como funciona</a>
          <a href="#contato">Contato</a>
        </nav>

        <WhatsappButton className="ee-header-cta">Pedir orçamento</WhatsappButton>
      </header>

      <main>
        <section id="inicio" className="ee-hero">
          <div className="ee-shell ee-hero-grid">
            <div className="ee-hero-copy">
              <SectionLabel>Locação de caçambas · Itajaí e região</SectionLabel>
              <h1>
                Entulho sem
                <span> complicação.</span>
              </h1>
              <p className="ee-hero-lead">
                Caçambas para construções, reformas, demolições e limpezas. Você explica o que
                precisa; a Express ajuda a encontrar a solução certa.
              </p>

              <div className="ee-actions">
                <WhatsappButton>Solicitar orçamento</WhatsappButton>
                <a className="ee-button ee-button-secondary" href="#solucoes">
                  <span>Conhecer as opções</span>
                  <ArrowUpRight aria-hidden="true" />
                </a>
              </div>

              <div className="ee-hero-notes" aria-label="Diferenciais">
                <span>
                  <Check aria-hidden="true" /> Atendimento direto
                </span>
                <span>
                  <Check aria-hidden="true" /> Itajaí e região
                </span>
                <span>
                  <Check aria-hidden="true" /> Três opções de locação
                </span>
              </div>
            </div>

            <div className="ee-hero-visual">
              <div className="ee-photo-card ee-photo-main">
                <img
                  src="/images/express-entulho/obra-limpa.webp"
                  alt="Caçamba verde da Express Entulho em uma obra"
                  width="450"
                  height="599"
                  fetchPriority="high"
                />
              </div>

              <div className="ee-floating-card ee-floating-top">
                <span className="ee-floating-icon">
                  <Truck aria-hidden="true" />
                </span>
                <span>
                  <strong>Express resolve</strong>
                  <small>Da escolha à retirada</small>
                </span>
              </div>

              <div className="ee-floating-card ee-floating-bottom">
                <span className="ee-pulse" aria-hidden="true" />
                <span>
                  <strong>Orçamento pelo WhatsApp</strong>
                  <small>(47) 99157-6500</small>
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="ee-quick-strip" aria-label="Resumo dos serviços">
          <div className="ee-shell ee-strip-grid">
            <p>Caçamba pequena</p>
            <p>Caçamba grande</p>
            <p>Tambor</p>
            <p className="ee-strip-city">
              <MapPin aria-hidden="true" /> Itajaí e região
            </p>
          </div>
        </section>

        <section id="solucoes" className="ee-section">
          <div className="ee-shell">
            <div className="ee-section-heading">
              <div>
                <SectionLabel>Soluções para cada necessidade</SectionLabel>
                <h2>Escolha o tamanho da sua obra. A Express cuida do resto.</h2>
              </div>
              <p>
                Não precisa adivinhar a melhor opção. Informe o material e o local; a equipe ajuda a
                definir a solução antes de confirmar o pedido.
              </p>
            </div>

            <div className="ee-products">
              {produtos.map(({ icon: Icon, name, description, accent }) => (
                <article className="ee-product-card" key={name}>
                  <div className="ee-product-icon">
                    <Icon aria-hidden="true" />
                  </div>
                  <p className="ee-product-accent">{accent}</p>
                  <h3>{name}</h3>
                  <p>{description}</p>
                  <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                    Consultar disponibilidade <ArrowUpRight aria-hidden="true" />
                  </a>
                </article>
              ))}
            </div>

            <p className="ee-pricing-note">
              <Sparkles aria-hidden="true" /> O orçamento considera o material, o tamanho da solução
              e a região do atendimento.
            </p>
          </div>
        </section>

        <section id="como-funciona" className="ee-process">
          <div className="ee-shell">
            <div className="ee-process-heading">
              <div>
                <SectionLabel light>Do pedido à retirada</SectionLabel>
                <h2>Simples de pedir. Fácil de acompanhar.</h2>
              </div>
              <ShieldCheck aria-hidden="true" />
            </div>

            <ol className="ee-steps">
              <li>
                <span>01</span>
                <h3>Conte o que precisa</h3>
                <p>Envie o tipo de material, a cidade, o bairro e a data desejada.</p>
              </li>
              <li>
                <span>02</span>
                <h3>Receba a orientação</h3>
                <p>A equipe confirma a opção indicada, o valor e a disponibilidade.</p>
              </li>
              <li>
                <span>03</span>
                <h3>Combine entrega e retirada</h3>
                <p>Com o pedido alinhado, a operação é programada com você.</p>
              </li>
            </ol>
          </div>
        </section>

        <section className="ee-section ee-use-section">
          <div className="ee-shell">
            <div className="ee-use-grid">
              <div className="ee-use-copy">
                <SectionLabel>Obra limpa, rotina organizada</SectionLabel>
                <h2>Uma solução prática para cada fase do serviço.</h2>
                <p>
                  A Express Entulho atende necessidades diferentes sem transformar o descarte em
                  mais um problema para você resolver.
                </p>

                <div className="ee-use-list">
                  {usos.map(({ icon: Icon, title, copy }) => (
                    <div key={title}>
                      <span>
                        <Icon aria-hidden="true" />
                      </span>
                      <div>
                        <h3>{title}</h3>
                        <p>{copy}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="ee-social-card">
                <img
                  src="/images/express-entulho/entulho-sem-complicacao.webp"
                  alt="Caminhão e opções de caçambas da Express Entulho"
                  width="450"
                  height="599"
                  loading="lazy"
                />
                <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
                  <Instagram aria-hidden="true" />
                  <span>
                    <small>Acompanhe a operação</small>
                    @expressentulho
                  </span>
                  <ArrowUpRight aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
        </section>

        <section id="contato" className="ee-contact">
          <div className="ee-shell ee-contact-grid">
            <div className="ee-contact-copy">
              <SectionLabel>Fale com a Express</SectionLabel>
              <h2>Sua obra pode ficar mais limpa a partir de uma mensagem.</h2>
              <p>
                Conte o que será descartado e onde será o atendimento. A equipe retorna com a opção
                e o orçamento adequados.
              </p>
              <WhatsappButton>Conversar no WhatsApp</WhatsappButton>
            </div>

            <address className="ee-contact-card">
              <div>
                <span>
                  <Phone aria-hidden="true" />
                </span>
                <div>
                  <small>Telefone e WhatsApp</small>
                  <a href="tel:+5547991576500">(47) 99157-6500</a>
                </div>
              </div>
              <div>
                <span>
                  <MapPin aria-hidden="true" />
                </span>
                <div>
                  <small>Endereço</small>
                  <p>R. Benjamin Franklin Pereira, 365</p>
                  <p>São João · Itajaí — SC</p>
                </div>
              </div>
              <a className="ee-map-link" href={MAPS_URL} target="_blank" rel="noopener noreferrer">
                <MapPin aria-hidden="true" /> Ver no mapa <ArrowUpRight aria-hidden="true" />
              </a>
            </address>
          </div>
        </section>

        <section className="ee-section ee-faq">
          <div className="ee-shell ee-faq-grid">
            <div className="ee-faq-title">
              <SectionLabel>Antes de pedir</SectionLabel>
              <h2>Dúvidas frequentes.</h2>
              <p>Respostas diretas para você avançar sem perder tempo.</p>
            </div>

            <div className="ee-questions">
              {perguntas.map(({ question, answer }) => (
                <details key={question}>
                  <summary>
                    <span>{question}</span>
                    <ChevronDown aria-hidden="true" />
                  </summary>
                  <p>{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="ee-final-cta">
          <div className="ee-shell ee-final-card">
            <div>
              <SectionLabel light>Express Entulho</SectionLabel>
              <h2>Precisou de caçamba? A Express resolve.</h2>
            </div>
            <WhatsappButton inverse>Solicitar orçamento</WhatsappButton>
          </div>
        </section>
      </main>

      <footer className="ee-footer">
        <div className="ee-shell ee-footer-grid">
          <div>
            <img
              src="/images/express-entulho/logo-express-entulho.webp"
              alt="Express Entulho"
              width="180"
              height="60"
              loading="lazy"
            />
            <p>Solução em caçambas de entulho para Itajaí e região.</p>
          </div>

          <div className="ee-footer-links">
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
              WhatsApp
            </a>
            <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
              Instagram
            </a>
            <a href={MAPS_URL} target="_blank" rel="noopener noreferrer">
              Localização
            </a>
          </div>

          <p className="ee-signature">
            Experiência digital por <strong>YO LAB &amp; CO.</strong>
            <span>Inteligências Veronica</span>
          </p>
        </div>
      </footer>

      <a
        className="ee-mobile-whatsapp"
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Solicitar orçamento pelo WhatsApp"
      >
        <MessageCircle aria-hidden="true" />
        <span>Pedir orçamento</span>
      </a>
    </div>
  );
}

const expressStyles = `
  .ee-page {
    min-height: 100vh;
    overflow-x: hidden;
    background: var(--ee-paper);
    color: var(--ee-ink);
    font-family: "Inter", "Space Grotesk", system-ui, sans-serif;
    color-scheme: light;
  }

  .ee-page *, .ee-page *::before, .ee-page *::after { box-sizing: border-box; }
  .ee-page a { color: inherit; text-decoration: none; }
  .ee-page img { display: block; max-width: 100%; }
  .ee-page button, .ee-page a, .ee-page summary { -webkit-tap-highlight-color: transparent; }
  .ee-page :focus-visible { outline: 3px solid var(--ee-yellow); outline-offset: 3px; }
  .ee-shell { width: min(1180px, calc(100% - 40px)); margin-inline: auto; }

  .ee-header {
    position: sticky;
    top: 0;
    z-index: 50;
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    min-height: 82px;
    padding: 10px max(20px, calc((100vw - 1180px) / 2));
    border-bottom: 1px solid rgba(13, 95, 59, 0.1);
    background: rgba(250, 250, 247, 0.88);
    backdrop-filter: blur(18px) saturate(1.3);
  }

  .ee-brand { width: 180px; }
  .ee-brand img { width: 100%; height: auto; }
  .ee-nav { display: flex; align-items: center; gap: 30px; font-size: 0.9rem; font-weight: 600; }
  .ee-nav a { transition: color 160ms ease; }
  .ee-nav a:hover { color: var(--ee-green); }
  .ee-header-cta { justify-self: end; min-height: 44px !important; padding: 0 19px !important; font-size: 0.86rem !important; }

  .ee-button {
    display: inline-flex;
    min-height: 52px;
    align-items: center;
    justify-content: center;
    gap: 10px;
    border: 1px solid transparent;
    border-radius: 999px;
    padding: 0 24px;
    font-size: 0.94rem;
    font-weight: 750;
    letter-spacing: -0.02em;
    transition: transform 180ms ease, box-shadow 180ms ease, background 180ms ease;
  }
  .ee-button svg { width: 19px; height: 19px; stroke-width: 2.2; }
  .ee-button:hover { transform: translateY(-2px); }
  .ee-button-primary { background: var(--ee-green); color: white !important; box-shadow: 0 12px 26px rgba(13, 95, 59, 0.18); }
  .ee-button-primary:hover { background: var(--ee-green-dark); box-shadow: 0 15px 34px rgba(13, 95, 59, 0.25); }
  .ee-button-secondary { border-color: var(--ee-line); background: rgba(255,255,255,.7); }
  .ee-button-secondary:hover { background: white; box-shadow: 0 12px 25px rgba(17,19,16,.08); }
  .ee-button-inverse { background: var(--ee-yellow); color: #17160f !important; }
  .ee-button-inverse:hover { background: #ffda24; box-shadow: 0 15px 34px rgba(242,196,0,.2); }

  .ee-hero {
    position: relative;
    padding: 82px 0 74px;
    background:
      radial-gradient(circle at 78% 25%, rgba(242,196,0,.12), transparent 24%),
      radial-gradient(circle at 67% 63%, rgba(13,95,59,.13), transparent 31%),
      linear-gradient(180deg, #fbfbf8 0%, var(--ee-paper) 100%);
  }
  .ee-hero::before {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    opacity: .32;
    background-image: radial-gradient(rgba(13,95,59,.22) 1px, transparent 1px);
    background-size: 24px 24px;
    mask-image: linear-gradient(90deg, transparent, black 70%, transparent);
  }
  .ee-hero-grid { position: relative; display: grid; grid-template-columns: 1.02fr .98fr; align-items: center; gap: 86px; }
  .ee-hero-copy { padding: 28px 0; }
  .ee-label { margin: 0; color: var(--ee-green); font-size: .76rem; font-weight: 800; letter-spacing: .13em; text-transform: uppercase; }
  .ee-label-light { color: #aee4c3; }
  .ee-hero h1 {
    max-width: 720px;
    margin: 18px 0 0;
    font-family: "Bricolage Grotesque", "Inter", sans-serif;
    font-size: clamp(3.45rem, 6.3vw, 6.35rem);
    font-weight: 800;
    letter-spacing: -.067em;
    line-height: .91;
  }
  .ee-hero h1 span { display: block; color: var(--ee-green); }
  .ee-hero-lead { max-width: 620px; margin: 28px 0 0; color: #5c625c; font-size: 1.15rem; line-height: 1.65; }
  .ee-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 32px; }
  .ee-hero-notes { display: flex; flex-wrap: wrap; gap: 16px 24px; margin-top: 32px; padding-top: 24px; border-top: 1px solid var(--ee-line); color: #59605a; font-size: .82rem; font-weight: 650; }
  .ee-hero-notes span { display: inline-flex; align-items: center; gap: 7px; }
  .ee-hero-notes svg { width: 15px; height: 15px; color: var(--ee-green); }

  .ee-hero-visual { position: relative; min-height: 640px; display: flex; align-items: center; justify-content: center; }
  .ee-photo-card { overflow: hidden; border: 8px solid white; border-radius: 36px; background: white; box-shadow: 0 28px 80px rgba(22,49,34,.2); }
  .ee-photo-main { width: min(450px, 86%); transform: rotate(2deg); }
  .ee-photo-main img { width: 100%; height: auto; }
  .ee-floating-card {
    position: absolute;
    z-index: 2;
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 210px;
    padding: 14px 17px;
    border: 1px solid rgba(13,95,59,.11);
    border-radius: 18px;
    background: rgba(255,255,255,.92);
    box-shadow: 0 18px 42px rgba(17,19,16,.14);
    backdrop-filter: blur(12px);
  }
  .ee-floating-card strong, .ee-floating-card small { display: block; }
  .ee-floating-card strong { font-size: .84rem; line-height: 1.3; }
  .ee-floating-card small { margin-top: 3px; color: #747b74; font-size: .72rem; }
  .ee-floating-top { top: 18%; right: -3%; }
  .ee-floating-bottom { bottom: 15%; left: -5%; }
  .ee-floating-icon { display: grid; width: 39px; height: 39px; place-items: center; border-radius: 12px; background: var(--ee-green-soft); color: var(--ee-green); }
  .ee-floating-icon svg { width: 20px; }
  .ee-pulse { width: 11px; height: 11px; border-radius: 999px; background: #20b56b; box-shadow: 0 0 0 7px rgba(32,181,107,.13); }

  .ee-quick-strip { background: var(--ee-green); color: white; }
  .ee-strip-grid { display: grid; grid-template-columns: repeat(4, 1fr); align-items: center; min-height: 78px; }
  .ee-strip-grid p { margin: 0; padding: 0 26px; border-right: 1px solid rgba(255,255,255,.18); font-size: .88rem; font-weight: 700; text-align: center; }
  .ee-strip-grid p:first-child { padding-left: 0; }
  .ee-strip-grid p:last-child { padding-right: 0; border: 0; }
  .ee-strip-city { display: inline-flex; align-items: center; justify-content: center; gap: 7px; }
  .ee-strip-city svg { width: 17px; }

  .ee-section { padding: 112px 0; }
  .ee-section-heading { display: grid; grid-template-columns: 1.3fr .7fr; gap: 90px; align-items: end; }
  .ee-section-heading h2, .ee-process h2, .ee-use-copy h2, .ee-contact h2, .ee-faq h2, .ee-final-card h2 {
    margin: 14px 0 0;
    font-family: "Bricolage Grotesque", "Inter", sans-serif;
    font-size: clamp(2.45rem, 4.7vw, 4.6rem);
    font-weight: 780;
    letter-spacing: -.055em;
    line-height: .98;
  }
  .ee-section-heading > p { margin: 0 0 4px; color: #656b65; font-size: 1rem; line-height: 1.7; }
  .ee-products { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; margin-top: 54px; }
  .ee-product-card { position: relative; min-height: 370px; padding: 28px; border: 1px solid var(--ee-line); border-radius: 26px; background: rgba(255,255,255,.74); transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease; }
  .ee-product-card:hover { transform: translateY(-5px); border-color: rgba(13,95,59,.3); box-shadow: 0 24px 54px rgba(17,19,16,.09); }
  .ee-product-icon { display: grid; width: 54px; height: 54px; place-items: center; border-radius: 17px; background: var(--ee-green-soft); color: var(--ee-green); }
  .ee-product-icon svg { width: 25px; height: 25px; }
  .ee-product-accent { margin: 52px 0 0 !important; color: var(--ee-green) !important; font-size: .72rem !important; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
  .ee-product-card h3 { margin: 8px 0 0; font-family: "Bricolage Grotesque", sans-serif; font-size: 1.65rem; letter-spacing: -.04em; }
  .ee-product-card > p { margin: 13px 0 0; color: #666c66; font-size: .95rem; line-height: 1.65; }
  .ee-product-card > a { position: absolute; right: 28px; bottom: 27px; left: 28px; display: flex; align-items: center; justify-content: space-between; border-top: 1px solid var(--ee-line); padding-top: 17px; color: var(--ee-green); font-size: .84rem; font-weight: 750; }
  .ee-product-card > a svg { width: 17px; }
  .ee-pricing-note { display: flex; width: fit-content; align-items: center; gap: 9px; margin: 22px auto 0; color: #6a706a; font-size: .82rem; }
  .ee-pricing-note svg { width: 17px; color: var(--ee-yellow); }

  .ee-process { padding: 110px 0; background: var(--ee-green-dark); color: white; }
  .ee-process-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 40px; }
  .ee-process-heading > svg { width: 68px; height: 68px; color: var(--ee-yellow); stroke-width: 1.35; }
  .ee-process h2 { max-width: 760px; }
  .ee-steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0; margin: 65px 0 0; padding: 0; list-style: none; border-top: 1px solid rgba(255,255,255,.18); }
  .ee-steps li { position: relative; min-height: 260px; padding: 28px 34px 0 0; }
  .ee-steps li + li { border-left: 1px solid rgba(255,255,255,.18); padding-left: 34px; }
  .ee-steps li > span { color: var(--ee-yellow); font-family: "JetBrains Mono", monospace; font-size: .76rem; letter-spacing: .12em; }
  .ee-steps h3 { margin: 62px 0 0; font-family: "Bricolage Grotesque", sans-serif; font-size: 1.48rem; letter-spacing: -.035em; }
  .ee-steps p { max-width: 310px; margin: 12px 0 0; color: rgba(255,255,255,.66); font-size: .94rem; line-height: 1.65; }

  .ee-use-section { background: #fdfdfa; }
  .ee-use-grid { display: grid; grid-template-columns: 1.08fr .92fr; align-items: center; gap: 110px; }
  .ee-use-copy > p:not(.ee-label) { max-width: 620px; margin: 23px 0 0; color: #666c66; font-size: 1.02rem; line-height: 1.72; }
  .ee-use-list { display: grid; gap: 22px; margin-top: 42px; }
  .ee-use-list > div { display: grid; grid-template-columns: 48px 1fr; gap: 17px; align-items: start; }
  .ee-use-list > div > span { display: grid; width: 48px; height: 48px; place-items: center; border: 1px solid rgba(13,95,59,.16); border-radius: 15px; color: var(--ee-green); }
  .ee-use-list svg { width: 21px; }
  .ee-use-list h3 { margin: 1px 0 0; font-size: 1rem; }
  .ee-use-list p { margin: 5px 0 0; color: #737973; font-size: .9rem; line-height: 1.55; }
  .ee-social-card { position: relative; justify-self: end; width: min(450px, 100%); overflow: hidden; border-radius: 32px; background: white; box-shadow: 0 28px 70px rgba(17,19,16,.14); }
  .ee-social-card > img { width: 100%; height: auto; }
  .ee-social-card > a { position: absolute; right: 16px; bottom: 16px; left: 16px; display: grid; grid-template-columns: 38px 1fr 20px; align-items: center; gap: 12px; padding: 13px 15px; border: 1px solid rgba(255,255,255,.46); border-radius: 18px; background: rgba(7,56,36,.91); color: white; backdrop-filter: blur(12px); }
  .ee-social-card > a > svg:first-child { width: 24px; }
  .ee-social-card > a > svg:last-child { width: 18px; }
  .ee-social-card small { display: block; margin-bottom: 2px; color: rgba(255,255,255,.67); font-size: .68rem; }
  .ee-social-card span { font-size: .86rem; font-weight: 750; }

  .ee-contact { padding: 108px 0; background: var(--ee-green-soft); }
  .ee-contact-grid { display: grid; grid-template-columns: 1fr .8fr; gap: 110px; align-items: center; }
  .ee-contact-copy > p:not(.ee-label) { max-width: 610px; margin: 24px 0 0; color: #5f685f; font-size: 1rem; line-height: 1.7; }
  .ee-contact-copy .ee-button { margin-top: 31px; }
  .ee-contact-card { display: grid; gap: 0; padding: 30px; border: 1px solid rgba(13,95,59,.13); border-radius: 28px; background: rgba(255,255,255,.83); box-shadow: 0 20px 50px rgba(13,95,59,.09); font-style: normal; }
  .ee-contact-card > div { display: grid; grid-template-columns: 45px 1fr; gap: 15px; align-items: start; padding: 20px 0; border-bottom: 1px solid var(--ee-line); }
  .ee-contact-card > div:first-child { padding-top: 0; }
  .ee-contact-card > div > span { display: grid; width: 45px; height: 45px; place-items: center; border-radius: 14px; background: var(--ee-green-soft); color: var(--ee-green); }
  .ee-contact-card svg { width: 20px; }
  .ee-contact-card small { display: block; margin-bottom: 5px; color: #7a817b; font-size: .7rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
  .ee-contact-card a, .ee-contact-card p { margin: 0; font-size: .96rem; font-weight: 650; line-height: 1.5; }
  .ee-map-link { display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 22px !important; min-height: 48px; border-radius: 999px; background: var(--ee-green); color: white !important; font-size: .85rem !important; }
  .ee-map-link svg { width: 17px; }

  .ee-faq { background: white; }
  .ee-faq-grid { display: grid; grid-template-columns: .65fr 1.35fr; gap: 100px; }
  .ee-faq-title { position: sticky; top: 122px; align-self: start; }
  .ee-faq-title p:last-child { margin: 20px 0 0; color: #747a74; line-height: 1.6; }
  .ee-questions { border-top: 1px solid var(--ee-line); }
  .ee-questions details { border-bottom: 1px solid var(--ee-line); }
  .ee-questions summary { display: flex; min-height: 86px; cursor: pointer; align-items: center; justify-content: space-between; gap: 20px; list-style: none; font-size: 1rem; font-weight: 720; }
  .ee-questions summary::-webkit-details-marker { display: none; }
  .ee-questions summary svg { width: 20px; color: var(--ee-green); transition: transform 180ms ease; }
  .ee-questions details[open] summary svg { transform: rotate(180deg); }
  .ee-questions details > p { max-width: 720px; margin: -2px 44px 25px 0; color: #666d67; line-height: 1.7; }

  .ee-final-cta { padding: 0 0 38px; background: white; }
  .ee-final-card { display: flex; min-height: 330px; align-items: center; justify-content: space-between; gap: 50px; padding: 64px; border-radius: 36px; background: var(--ee-green); color: white; overflow: hidden; position: relative; }
  .ee-final-card::after { content: ""; position: absolute; width: 360px; height: 360px; right: -90px; top: -170px; border: 72px solid rgba(242,196,0,.16); border-radius: 50%; }
  .ee-final-card > * { position: relative; z-index: 1; }
  .ee-final-card h2 { max-width: 780px; }
  .ee-final-card .ee-button { flex: 0 0 auto; }

  .ee-footer { padding: 56px 0 110px; background: #111310; color: white; }
  .ee-footer-grid { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 42px; }
  .ee-footer img { width: 170px; filter: brightness(0) invert(1); opacity: .94; }
  .ee-footer > .ee-shell > div:first-child p { max-width: 290px; margin: 12px 0 0; color: rgba(255,255,255,.54); font-size: .82rem; line-height: 1.5; }
  .ee-footer-links { display: flex; flex-wrap: wrap; justify-content: center; gap: 24px; color: rgba(255,255,255,.76); font-size: .83rem; }
  .ee-footer-links a:hover { color: var(--ee-yellow); }
  .ee-signature { justify-self: end; margin: 0; color: rgba(255,255,255,.46); font-size: .68rem; line-height: 1.6; text-align: right; text-transform: uppercase; letter-spacing: .08em; }
  .ee-signature strong, .ee-signature span { display: block; color: rgba(255,255,255,.72); }

  .ee-mobile-whatsapp { display: none; }

  @media (max-width: 980px) {
    .ee-header { grid-template-columns: 1fr auto; }
    .ee-nav { display: none; }
    .ee-hero { padding-top: 54px; }
    .ee-hero-grid, .ee-use-grid, .ee-contact-grid { grid-template-columns: 1fr; gap: 62px; }
    .ee-hero-copy { text-align: center; }
    .ee-hero-lead { margin-inline: auto; }
    .ee-actions, .ee-hero-notes { justify-content: center; }
    .ee-hero-visual { min-height: 590px; }
    .ee-photo-main { width: min(430px, 75%); }
    .ee-floating-top { right: 7%; }
    .ee-floating-bottom { left: 7%; }
    .ee-section-heading { grid-template-columns: 1fr; gap: 24px; }
    .ee-products { grid-template-columns: 1fr; }
    .ee-product-card { min-height: 315px; }
    .ee-product-accent { margin-top: 36px !important; }
    .ee-use-copy { max-width: 720px; }
    .ee-social-card { justify-self: center; }
    .ee-contact-copy { max-width: 760px; }
    .ee-faq-grid { grid-template-columns: 1fr; gap: 44px; }
    .ee-faq-title { position: static; }
    .ee-footer-grid { grid-template-columns: 1fr; text-align: center; }
    .ee-footer img { margin-inline: auto; }
    .ee-footer > .ee-shell > div:first-child p { margin-inline: auto; }
    .ee-signature { justify-self: center; text-align: center; }
  }

  @media (max-width: 720px) {
    .ee-shell { width: min(100% - 28px, 1180px); }
    .ee-header { min-height: 70px; padding-inline: 14px; }
    .ee-brand { width: 146px; }
    .ee-header-cta { display: none !important; }
    .ee-hero { padding: 54px 0 48px; }
    .ee-hero-grid { gap: 42px; }
    .ee-hero-copy { padding: 0; }
    .ee-hero h1 { font-size: clamp(3.1rem, 16vw, 4.8rem); }
    .ee-hero-lead { font-size: 1rem; line-height: 1.6; }
    .ee-actions { display: grid; }
    .ee-actions .ee-button { width: 100%; }
    .ee-hero-notes { display: grid; justify-content: start; max-width: 300px; margin-inline: auto; text-align: left; }
    .ee-hero-visual { min-height: 505px; }
    .ee-photo-card { border-width: 6px; border-radius: 28px; }
    .ee-photo-main { width: min(360px, 88%); transform: rotate(1deg); }
    .ee-floating-card { min-width: 190px; padding: 12px 14px; }
    .ee-floating-top { top: 8%; right: 0; }
    .ee-floating-bottom { bottom: 3%; left: 0; }
    .ee-strip-grid { grid-template-columns: repeat(2, 1fr); padding: 15px 0; }
    .ee-strip-grid p { min-height: 42px; display: flex; align-items: center; justify-content: center; padding: 0 8px; border: 0; }
    .ee-section, .ee-process, .ee-contact { padding: 78px 0; }
    .ee-section-heading h2, .ee-process h2, .ee-use-copy h2, .ee-contact h2, .ee-faq h2, .ee-final-card h2 { font-size: clamp(2.25rem, 11vw, 3.2rem); }
    .ee-products { margin-top: 38px; }
    .ee-product-card { border-radius: 23px; }
    .ee-pricing-note { align-items: flex-start; line-height: 1.5; }
    .ee-process-heading > svg { display: none; }
    .ee-steps { grid-template-columns: 1fr; margin-top: 42px; }
    .ee-steps li, .ee-steps li + li { min-height: auto; padding: 26px 0 32px; border-left: 0; border-bottom: 1px solid rgba(255,255,255,.18); }
    .ee-steps h3 { margin-top: 28px; }
    .ee-use-grid, .ee-contact-grid { gap: 48px; }
    .ee-contact-card { padding: 22px; }
    .ee-questions summary { min-height: 80px; font-size: .95rem; }
    .ee-final-cta { padding: 0 14px 28px; }
    .ee-final-card { width: 100%; min-height: 360px; flex-direction: column; align-items: flex-start; justify-content: center; padding: 36px 26px; border-radius: 28px; }
    .ee-final-card .ee-button { width: 100%; }
    .ee-footer { padding-bottom: 130px; }
    .ee-footer-links { gap: 18px; }
    .ee-mobile-whatsapp {
      position: fixed;
      right: 14px;
      bottom: 14px;
      left: 14px;
      z-index: 60;
      display: flex;
      min-height: 54px;
      align-items: center;
      justify-content: center;
      gap: 10px;
      border: 1px solid rgba(255,255,255,.28);
      border-radius: 999px;
      background: var(--ee-green);
      color: white !important;
      box-shadow: 0 16px 34px rgba(7,56,36,.34);
      font-size: .92rem;
      font-weight: 780;
    }
    .ee-mobile-whatsapp svg { width: 20px; }
  }

  @media (prefers-reduced-motion: no-preference) {
    .ee-hero-copy { animation: ee-rise .6s ease-out both; }
    .ee-hero-visual { animation: ee-rise .7s .08s ease-out both; }
    @keyframes ee-rise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
  }
`;
