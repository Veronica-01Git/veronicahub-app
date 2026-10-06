import { ArrowDown, ArrowRight, ArrowUpRight, Sparkles } from "lucide-react";
import { worldImage, worldSrcSet } from "@/lib/yo-visuals";

export function PortfolioLanding({ onExample }: { onExample: () => void }) {
  return (
    <>
      <section className="pf-hero" aria-labelledby="pf-title">
        <div className="pf-hero-art" aria-hidden="true">
          <img
            src={worldImage("portfolio")}
            srcSet={worldSrcSet("portfolio")}
            sizes="100vw"
            width={1600}
            height={900}
            alt=""
            fetchPriority="high"
          />
          <div className="pf-orbit pf-orbit-one" />
          <div className="pf-orbit pf-orbit-two" />
          <div className="pf-light-scan" />
        </div>
        <div className="pf-wrap pf-hero-content">
          <p className="pf-eyebrow">
            <Sparkles size={14} /> Veronica Portfolio
          </p>
          <h1 id="pf-title">
            Seu trabalho.
            <br />
            <span>Novas possibilidades.</span>
          </h1>
          <p className="pf-hero-copy">
            Transforme sua trajetória em uma apresentação que dá vontade de conhecer. Crie seu
            portfólio gratuito e veja seu próximo passo ganhar forma.
          </p>
          <div className="pf-actions">
            <a className="pf-button pf-primary" href="#create">
              Criar meu portfólio gratuito <ArrowRight size={17} />
            </a>
            <button className="pf-button pf-secondary" type="button" onClick={onExample}>
              Ver um exemplo <ArrowUpRight size={16} />
            </button>
          </div>
          <p className="pf-small">Sem cartão · comece com seu nome e profissão</p>
          <div className="pf-hero-rail">
            <span>01 / Sua presença digital começa aqui</span>
            <a href="#create">
              Entre no laboratório <ArrowDown size={15} />
            </a>
          </div>
        </div>
      </section>
      <section className="pf-journey" aria-label="Como funciona">
        <div className="pf-wrap pf-journey-grid">
          {[
            ["01", "Conte o essencial", "Seu nome, sua área e o que você quer mostrar."],
            ["02", "Veja seu portfólio", "Uma prévia navegável, em computador e celular."],
            [
              "03",
              "Dê o próximo passo",
              "Se quiser um site próprio, desenhamos o projeto com você.",
            ],
          ].map(([number, title, copy]) => (
            <div key={number} className="pf-journey-step">
              <span>{number}</span>
              <div>
                <h2>{title}</h2>
                <p>{copy}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
