import { ArrowRight, ArrowUpRight, Leaf, ShieldCheck } from "lucide-react";
import { WellnessTheme } from "./theme";
import { WellnessJourney } from "./journey-ui";
import { lzIdentity } from "@/features/lz-team/content";

type Identity = "lz-team" | "lee-ricardo";
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
