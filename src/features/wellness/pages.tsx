import { ArrowRight, ArrowUpRight, Bot, Dumbbell, Leaf, ShieldCheck, Sparkles } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { WellnessTheme } from "./theme";
import { WellnessJourney } from "./journey-ui";
import { lzIdentity } from "@/features/lz-team/content";

type Identity = "lz-team" | "lee-ricardo";
export function HumanAgentsPage() {
  return (
    <WellnessTheme>
      <SiteHeader />
      <main className="w-shell">
        <section className="w-hero">
          <div>
            <p className="w-eyebrow">Verônica · Agentes Humanos</p>
            <h1>
              Tecnologia aproxima.
              <br />
              <em>Pessoas transformam.</em>
            </h1>
            <p className="w-copy">
              Encontre profissionais com identidade, método e um olhar atento para você. A Verônica
              organiza sua jornada. Cada especialista cuida do que faz melhor.
            </p>
            <div className="w-actions">
              <a className="w-button" href="#avaliacao">
                Criar meu guia gratuito <ArrowRight size={17} />
              </a>
              <a className="w-button secondary" href="#especialistas">
                Conhecer especialistas
              </a>
            </div>
            <div className="w-tags">
              <span className="w-tag">Treinamento</span>
              <span className="w-tag">Nutrição</span>
              <span className="w-tag">Wellness</span>
            </div>
          </div>
          <div className="w-visual">
            <img
              src="/images/wire-veronica/lz-team-lucas-tomaz-palco.jpg"
              alt="Lucas Tomaz, profissional da rede Verônica"
              fetchPriority="high"
            />
            <div className="w-visual-caption">
              <p className="w-eyebrow">Profissionais + Verônica Wellness</p>
              <h3 className="mt-2 text-xl">Seu objetivo ganha uma equipe.</h3>
              <p>Identidades próprias. Uma jornada conectada.</p>
            </div>
          </div>
        </section>
        <section className="w-section">
          <p className="w-eyebrow">Comece com você</p>
          <h2>O que você quer desenvolver?</h2>
          <div className="w-grid">
            <div className="w-card">
              <Sparkles className="text-[var(--w-accent)]" />
              <h3>Força, definição e confiança.</h3>
              <p>
                Uma jornada para quem busca emagrecimento, definição ou desenvolvimento de glúteos,
                com atenção à rotina e aos próprios objetivos.
              </p>
              <a href="#avaliacao" className="w-button secondary mt-6">
                Explorar meu objetivo <ArrowRight size={16} />
              </a>
            </div>
            <div className="w-card">
              <Dumbbell className="text-[var(--w-accent)]" />
              <h3>Evolução que você acompanha.</h3>
              <p>
                Hipertrofia, força e avaliação de movimento. Seu ponto de partida orienta a conversa
                com o profissional e os próximos passos.
              </p>
              <a href="#avaliacao" className="w-button secondary mt-6">
                Começar minha jornada <ArrowRight size={16} />
              </a>
            </div>
          </div>
          <p className="w-copy mt-5 text-sm">
            Todos os objetivos estão disponíveis para qualquer pessoa.
          </p>
        </section>
        <section id="especialistas" className="w-section">
          <p className="w-eyebrow">Agentes Humanos · Cada pessoa, uma identidade</p>
          <h2>Conheça quem acompanha você.</h2>
          <div className="w-grid">
            <article className="w-card">
              <img
                src="/images/wire-veronica/lz-team-lucas-tomaz-palco.jpg"
                alt="Lucas Tomaz"
                loading="lazy"
                className="w-profile-photo"
              />
              <p className="w-eyebrow mt-6">LZ Training Club · Treinamento</p>
              <h3>Lucas Tomaz</h3>
              <p>
                Coordena o projeto de treinamento. Um acompanhamento dedicado à técnica, à
                consistência e à evolução individual.
              </p>
              <div className="w-tags">
                <span className="w-tag">Hipertrofia e definição</span>
                <span className="w-tag">Treinamento feminino</span>
              </div>
              <a className="w-button" href="/clientes/lz-team">
                Conhecer o LZ Team <ArrowUpRight size={16} />
              </a>
            </article>
            <article className="w-card">
              <div className="flex h-[320px] flex-col justify-between rounded-[20px] border border-[var(--w-line)] bg-gradient-to-br from-[#64513c] to-[#151c18] p-8 text-[#f4ece2]">
                <Leaf size={44} strokeWidth={1} />
                <div>
                  <p className="text-xs uppercase tracking-[.25em]">Nutrição · Lee Ricardo</p>
                  <p className="mt-4 font-serif text-5xl italic">
                    Cuidar começa
                    <br />
                    na rotina.
                  </p>
                </div>
              </div>
              <p className="w-eyebrow mt-6">Identidade própria · Nutrição</p>
              <h3>Lee Ricardo</h3>
              <p>
                Um espaço dedicado à nutrição e à relação entre alimentação, rotina e seus
                objetivos. Conheça o profissional e solicite informações sobre o atendimento.
              </p>
              <div className="w-tags">
                <span className="w-tag">Nutrição</span>
                <span className="w-tag">Hábitos e rotina</span>
              </div>
              <a className="w-button" href="/clientes/lee-ricardo">
                Conhecer Lee Ricardo <ArrowUpRight size={16} />
              </a>
            </article>
          </div>
        </section>
        <section className="w-section">
          <p className="w-eyebrow">Simples para começar</p>
          <h2>Da intenção ao acompanhamento.</h2>
          <div className="w-steps">
            {[
              [
                "01",
                "Conte sobre você",
                "Uma avaliação inicial com objetivo, rotina e necessidades.",
              ],
              [
                "02",
                "Receba seu guia",
                "Um ponto de partida personalizado, gratuito e salvo na sua conta.",
              ],
              [
                "03",
                "Evolua com orientação",
                "O profissional revisa sua avaliação e libera o plano individual no seu ambiente.",
              ],
            ].map(([n, t, p]) => (
              <div className="w-card" key={n}>
                <strong>{n}</strong>
                <h3>{t}</h3>
                <p>{p}</p>
              </div>
            ))}
          </div>
        </section>
        <WellnessJourney />
        <section className="w-section">
          <div className="w-grid">
            <div>
              <p className="w-eyebrow">Verônica Wellness</p>
              <h2>
                Uma assistente presente.
                <br />
                Um especialista responsável.
              </h2>
              <p className="w-copy">
                A assistente organiza suas respostas, prepara seu guia educativo e leva sua
                avaliação à equipe autorizada. O profissional revisa e publica as orientações
                individuais.
              </p>
            </div>
            <div className="w-card">
              <Bot />
              <h3>O cuidado tem autoria.</h3>
              <p>
                Você vê o que foi organizado pela Verônica e o que foi revisado pelo especialista.
                Seus dados de avaliação ficam na sua conta e no ambiente do profissional autorizado.
              </p>
              <a className="w-button secondary mt-6" href="/agentes">
                Conhecer os Agentes de IA <ArrowUpRight size={16} />
              </a>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter tagline="Profissionais com identidade própria. Jornadas conectadas pela Verônica." />
    </WellnessTheme>
  );
}
export function ProfessionalHome({ identity }: { identity: Identity }) {
  const lucas = identity === "lz-team";
  return (
    <WellnessTheme identity={identity}>
      <main className="w-shell">
        <ProfessionalNavigation identity={identity} />
        <section className="w-hero">
          <div>
            <p className="w-eyebrow">
              {lucas ? "LZ Training Club · Lucas Tomaz" : "Lee Ricardo · Nutrição"}
            </p>
            <h1>
              {lucas ? (
                <>
                  Seu treino.
                  <br />
                  Seu processo.
                  <br />
                  <em>Sua evolução.</em>
                </>
              ) : (
                <>
                  Alimentação.
                  <br />
                  Rotina.
                  <br />
                  <em>Mais equilíbrio.</em>
                </>
              )}
            </h1>
            <p className="w-copy">
              {lucas
                ? "Treinamento com identidade, técnica e acompanhamento. Conte seu objetivo e comece uma jornada organizada para sua rotina, com a tecnologia da Verônica e a orientação de Lucas Tomaz."
                : "Conheça o espaço de Lee Ricardo. Conte sobre sua rotina e seus objetivos para preparar a primeira conversa sobre acompanhamento nutricional."}
            </p>
            <div className="w-actions">
              <a className="w-button" href="#avaliacao">
                Criar meu guia gratuito <ArrowRight size={16} />
              </a>
              <a
                className="w-button secondary"
                href={
                  lucas ? lzIdentity.whatsappUrl : "https://www.instagram.com/leericardo.nutri/"
                }
                target="_blank"
                rel="noopener noreferrer"
              >
                {lucas ? "Conversar com Lucas" : "Conversar com Lee"}
                <ArrowUpRight size={16} />
              </a>
            </div>
          </div>
          <div className="w-visual">
            {lucas ? (
              <img
                src="/images/wire-veronica/lz-team-lucas-tomaz-palco.jpg"
                alt="Lucas Tomaz, LZ Training Club"
                fetchPriority="high"
              />
            ) : (
              <div className="flex h-[490px] flex-col items-start justify-center bg-gradient-to-br from-[#64513c] to-[#151c18] px-10 text-[#f4ece2]">
                <Leaf size={60} strokeWidth={1} />
                <p className="mt-8 font-serif text-6xl italic">
                  Cuidar começa
                  <br />
                  na rotina.
                </p>
              </div>
            )}
            <div className="w-visual-caption">
              <h3>{lucas ? "Lucas Tomaz · LZ Team" : "Lee Ricardo"}</h3>
              <p>
                {lucas
                  ? "Coordenador do projeto · Especialista em treinamento"
                  : "Nutrição · Um acompanhamento com identidade própria"}
              </p>
            </div>
          </div>
        </section>
        <section className="w-section">
          <p className="w-eyebrow">{lucas ? "Método LZ" : "Sua rotina em primeiro lugar"}</p>
          <h2>
            {lucas
              ? "Treinar com intenção muda a jornada."
              : "Um primeiro passo para conhecer você."}
          </h2>
          <div className="w-steps">
            {(lucas
              ? [
                  [
                    "01",
                    "Objetivo individual",
                    "Emagrecimento, definição, glúteos, hipertrofia e força: converse sobre o que você quer desenvolver.",
                  ],
                  [
                    "02",
                    "Plano revisado",
                    "Seu treino é definido e revisado pelo profissional, considerando as informações da avaliação.",
                  ],
                  [
                    "03",
                    "Acompanhamento",
                    "Aulas, comunidade e orientações individuais em um ambiente próprio do LZ.",
                  ],
                ]
              : [
                  [
                    "01",
                    "Conte sua rotina",
                    "Organize seus objetivos e as dificuldades que deseja discutir com o profissional.",
                  ],
                  [
                    "02",
                    "Conheça o atendimento",
                    "Fale diretamente com Lee para conhecer disponibilidade, formato e acompanhamento.",
                  ],
                  [
                    "03",
                    "Tenha seu espaço",
                    "Guia e orientações revisadas ficam disponíveis na sua conta.",
                  ],
                ]
            ).map(([n, t, p]) => (
              <div className="w-card" key={n}>
                <strong>{n}</strong>
                <h3>{t}</h3>
                <p>{p}</p>
              </div>
            ))}
          </div>
        </section>
        <WellnessJourney professional={identity} />
        <section className="w-section">
          <ShieldCheck className="text-[var(--w-accent)]" />
          <h2>Profissional à frente. Tecnologia ao lado.</h2>
          <p className="w-copy">
            Seu guia inicial é educativo. As orientações individuais dependem da avaliação do
            profissional responsável. Você acompanha as revisões no seu espaço, com acesso à mesma
            conta da Verônica.
          </p>
          <div className="w-actions">
            <a
              className="w-button secondary"
              href={lucas ? "/clientes/lz-team/membros" : "/clientes/lee-ricardo/membros"}
            >
              Entrar na minha jornada <ArrowRight size={16} />
            </a>
            <a
              className="w-button secondary"
              target="_blank"
              rel="noopener noreferrer"
              href={lucas ? lzIdentity.instagramUrl : "https://www.instagram.com/leericardo.nutri/"}
            >
              Instagram oficial <ArrowUpRight size={16} />
            </a>
          </div>
        </section>
        <footer className="w-foot">
          <span>{lucas ? "LZ Training Club · Lucas Tomaz" : "Lee Ricardo · Nutrição"}</span>
          <a href="/agentes-humanos">Tecnologia Verônica · YO LAB & CO.</a>
        </footer>
      </main>
    </WellnessTheme>
  );
}
export function ProfessionalNavigation({ identity }: { identity: Identity }) {
  return (
    <nav className="w-nav" aria-label="Navegação do profissional">
      <a className="w-brand" href={`/clientes/${identity}`}>
        {identity === "lz-team" ? "LZ TRAINING CLUB" : "Lee Ricardo"}
      </a>
      <div className="flex flex-wrap items-center gap-5">
        <a href={`/clientes/${identity}/membros`}>Minha jornada</a>
        <a href={`/clientes/${identity}/painel`}>Gestão</a>
        <a href="/agentes-humanos">Verônica ↗</a>
      </div>
    </nav>
  );
}
export function ProfessionalWorkspace({
  identity,
  management = false,
}: {
  identity: Identity;
  management?: boolean;
}) {
  return (
    <WellnessTheme identity={identity}>
      <main className="w-shell">
        <ProfessionalNavigation identity={identity} />
        <WellnessJourney professional={identity} management={management} />
        <footer className="w-foot">Lee Ricardo · Tecnologia Verônica</footer>
      </main>
    </WellnessTheme>
  );
}
