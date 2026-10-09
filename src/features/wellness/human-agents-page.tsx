import { useState } from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { WellnessTheme } from "./theme";
import { WellnessJourney } from "./journey-ui";
import "./human-agents.css";

type Professional = "lz-team" | "lee-ricardo";

const PROFESSIONALS: Record<
  Professional,
  { name: string; area: string; short: string; href: string }
> = {
  "lz-team": {
    name: "Lucas Tomaz",
    area: "Treinamento",
    short: "LZ Training Club",
    href: "/clientes/lz-team",
  },
  "lee-ricardo": {
    name: "Lee Ricardo",
    area: "Nutrição",
    short: "Nutrição e rotina",
    href: "/clientes/lee-ricardo",
  },
};

const ROLES = [
  {
    who: "Verônica",
    title: "Organiza o começo.",
    items: [
      "Conduz a avaliação inicial: objetivo, rotina e cuidados.",
      "Monta um guia educativo a partir das suas respostas.",
      "Guarda tudo na sua conta e entrega ao profissional que você escolheu.",
    ],
  },
  {
    who: "Profissional",
    title: "Decide o caminho.",
    items: [
      "Lê sua avaliação e considera dores, lesões e limitações.",
      "Define o plano individual de treino ou de nutrição.",
      "Publica as orientações no seu espaço, com data de revisão.",
    ],
  },
] as const;

const STEPS = [
  [
    "Conte sobre você",
    "Três etapas curtas sobre objetivo, rotina e cuidados. Leva poucos minutos.",
  ],
  ["Receba seu guia", "Um ponto de partida educativo, gratuito e salvo na sua conta."],
  [
    "Evolua com orientação",
    "O profissional revisa sua avaliação e libera o plano individual no seu espaço.",
  ],
] as const;

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function HumanAgentsPage() {
  const [professional, setProfessional] = useState<Professional>("lz-team");

  function startWith(next: Professional) {
    setProfessional(next);
    const target = document.getElementById("avaliacao");
    if (!target) return;
    target.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth" });
    target
      .querySelector<HTMLInputElement>(`input[name="ha-professional"][value="${next}"]`)
      ?.focus({ preventScroll: true });
  }

  return (
    <WellnessTheme>
      <SiteHeader />
      <main className="ha">
        <section className="ha-hero" aria-labelledby="ha-title">
          <div className="ha-wrap ha-hero-head">
            <div>
              <p className="ha-eyebrow">Verônica · Agentes Humanos</p>
              <h1 id="ha-title">
                Tecnologia aproxima.
                <br />
                <em>Pessoas transformam.</em>
              </h1>
            </div>
            <div className="ha-hero-side">
              <p className="ha-lead">
                Profissionais de treino e nutrição, cada um com sua identidade e seu método. A
                Verônica organiza o começo da conversa. Quem orienta você é o especialista.
              </p>
              <div className="ha-actions">
                <a className="ha-btn" href="#avaliacao">
                  Criar meu guia gratuito <ArrowRight size={17} aria-hidden />
                </a>
                <a className="ha-link" href="#profissionais">
                  Conhecer os profissionais <ArrowRight size={15} aria-hidden />
                </a>
              </div>
              <p className="ha-note">
                Gratuito · Guia educativo · Plano individual só com revisão do profissional
              </p>
            </div>
          </div>
          <figure className="ha-wrap ha-hero-figure">
            <picture>
              <source
                type="image/webp"
                srcSet="/images/yo-worlds/wellness-640.webp 640w, /images/yo-worlds/wellness-1280.webp 1280w, /images/yo-worlds/wellness-1600.webp 1600w"
                sizes="(min-width: 1240px) 1192px, calc(100vw - 32px)"
              />
              <img
                src="/images/yo-worlds/wellness-1280.webp"
                width={1600}
                height={900}
                alt="Profissional acompanha de perto uma aluna em um avanço com cabo, em um estúdio claro com parede verde e equipamentos de treino."
                fetchPriority="high"
                decoding="async"
              />
            </picture>
            <figcaption>Imagem ilustrativa · estúdio YO Lab &amp; Co.</figcaption>
          </figure>
        </section>

        <section className="ha-section" aria-labelledby="ha-roles">
          <div className="ha-wrap">
            <p className="ha-eyebrow">Quem faz o quê</p>
            <h2 id="ha-roles" className="ha-h2">
              A Verônica organiza.
              <br />
              <em>O especialista decide.</em>
            </h2>
            <div className="ha-roles">
              {ROLES.map((role) => (
                <div className="ha-role" key={role.who}>
                  <p className="ha-role-who">{role.who}</p>
                  <h3>{role.title}</h3>
                  <ul>
                    {role.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="profissionais" className="ha-section" aria-labelledby="ha-people">
          <div className="ha-wrap">
            <p className="ha-eyebrow">Profissionais</p>
            <h2 id="ha-people" className="ha-h2">
              Cada pessoa, uma identidade.
            </h2>
            <p className="ha-sub">
              Hoje a rede reúne dois profissionais. Cada um tem seu espaço próprio, com o próprio
              nome, método e forma de atender.
            </p>

            <article className="ha-person" aria-labelledby="ha-lucas">
              <div className="ha-person-media">
                <picture>
                  <source
                    type="image/webp"
                    srcSet="/images/agentes-humanos/lucas-tomaz-480.webp 480w, /images/agentes-humanos/lucas-tomaz-800.webp 800w"
                    sizes="(min-width: 900px) 440px, calc(100vw - 32px)"
                  />
                  <img
                    src="/images/agentes-humanos/lucas-tomaz-800.jpg"
                    width={800}
                    height={1000}
                    loading="lazy"
                    decoding="async"
                    alt="Lucas Tomaz no palco de uma competição de fisiculturismo, com medalha no peito."
                  />
                </picture>
              </div>
              <div className="ha-person-body">
                <p className="ha-eyebrow">LZ Training Club · Treinamento</p>
                <h3 id="ha-lucas">Lucas Tomaz</h3>
                <p>
                  Coordena o projeto de treinamento do LZ. Um acompanhamento dedicado à técnica, à
                  constância e à evolução de cada aluno.
                </p>
                <ul className="ha-chips" aria-label="Especialidades">
                  <li>Hipertrofia e definição</li>
                  <li>Treinamento feminino</li>
                  <li>Força</li>
                </ul>
                <div className="ha-actions">
                  <button type="button" className="ha-btn" onClick={() => startWith("lz-team")}>
                    Começar com Lucas <ArrowRight size={16} aria-hidden />
                  </button>
                  <a className="ha-link" href="/clientes/lz-team">
                    Conhecer o LZ Team <ArrowUpRight size={15} aria-hidden />
                  </a>
                </div>
              </div>
            </article>

            <article className="ha-person ha-person-alt" aria-labelledby="ha-lee">
              <div className="ha-person-media ha-person-type" aria-hidden="true">
                <span className="ha-type-kicker">Nutrição · Lee Ricardo</span>
                <span className="ha-type-quote">
                  Cuidar começa
                  <br />
                  na rotina.
                </span>
              </div>
              <div className="ha-person-body">
                <p className="ha-eyebrow">Identidade própria · Nutrição</p>
                <h3 id="ha-lee">Lee Ricardo</h3>
                <p>
                  Um espaço dedicado à relação entre alimentação, rotina e objetivos. Conheça o
                  profissional e peça informações sobre formato e disponibilidade do atendimento.
                </p>
                <ul className="ha-chips" aria-label="Especialidades">
                  <li>Nutrição</li>
                  <li>Hábitos e rotina</li>
                </ul>
                <div className="ha-actions">
                  <button type="button" className="ha-btn" onClick={() => startWith("lee-ricardo")}>
                    Começar com Lee <ArrowRight size={16} aria-hidden />
                  </button>
                  <a className="ha-link" href="/clientes/lee-ricardo">
                    Conhecer Lee Ricardo <ArrowUpRight size={15} aria-hidden />
                  </a>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section className="ha-section" aria-labelledby="ha-steps">
          <div className="ha-wrap">
            <p className="ha-eyebrow">Como começar</p>
            <h2 id="ha-steps" className="ha-h2">
              Da intenção ao acompanhamento.
            </h2>
            <ol className="ha-steps">
              {STEPS.map(([title, text], index) => (
                <li key={title}>
                  <span className="ha-step-n" aria-hidden>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <div className="ha-journey">
          <div className="ha-wrap">
            <WellnessJourney
              professional={professional}
              lead={
                <fieldset className="ha-choice">
                  <legend>Com quem você quer começar?</legend>
                  <div className="ha-choice-options">
                    {(Object.keys(PROFESSIONALS) as Professional[]).map((key) => {
                      const p = PROFESSIONALS[key];
                      return (
                        <label key={key} className="ha-choice-option">
                          <input
                            type="radio"
                            name="ha-professional"
                            value={key}
                            checked={professional === key}
                            onChange={() => setProfessional(key)}
                          />
                          <span className="ha-choice-area">{p.area}</span>
                          <span className="ha-choice-name">{p.name}</span>
                          <span className="ha-choice-short">{p.short}</span>
                        </label>
                      );
                    })}
                  </div>
                  <p className="ha-choice-hint" aria-live="polite">
                    Sua avaliação será enviada somente a {PROFESSIONALS[professional].name}.
                  </p>
                </fieldset>
              }
            />
          </div>
        </div>

        <section className="ha-section" aria-labelledby="ha-trust">
          <div className="ha-wrap ha-trust">
            <div>
              <p className="ha-eyebrow">Seus dados, sua decisão</p>
              <h2 id="ha-trust" className="ha-h2">
                O cuidado tem autoria.
              </h2>
              <p className="ha-sub">
                Você sempre sabe o que foi organizado pela Verônica e o que foi revisado por uma
                pessoa.
              </p>
              <div className="ha-actions">
                <a className="ha-link" href="/privacidade">
                  Política de privacidade <ArrowUpRight size={15} aria-hidden />
                </a>
                <a className="ha-link" href="/agentes">
                  Conhecer os Agentes de IA <ArrowUpRight size={15} aria-hidden />
                </a>
              </div>
            </div>
            <dl className="ha-facts">
              <div>
                <dt>Guia educativo</dt>
                <dd>
                  Gerado a partir das suas respostas. Ajuda a preparar a conversa e não substitui a
                  avaliação de um profissional.
                </dd>
              </div>
              <div>
                <dt>Plano individual</dt>
                <dd>Só aparece depois que o especialista revisa sua avaliação, com data.</dd>
              </div>
              <div>
                <dt>Suas respostas</dt>
                <dd>
                  Ficam na sua conta e no ambiente do profissional escolhido. Você pode excluir a
                  avaliação quando quiser. O aceite não autoriza campanhas de marketing.
                </dd>
              </div>
            </dl>
          </div>
        </section>
      </main>
      <SiteFooter tagline="Profissionais com identidade própria. Jornadas conectadas pela Verônica." />
    </WellnessTheme>
  );
}
