import { useState } from "react";
import { ArrowUpRight, Check, Layers3, MessageCircle } from "lucide-react";
import { SOCIAL_LINKS } from "@/components/SiteChrome";
import {
  SITE_DELIVERIES,
  SITE_FEATURES,
  SITE_PRODUCTS,
  siteProjectMessage,
  type SiteProject,
} from "../features/site-project";

export function SiteProjectBrief() {
  const [project, setProject] = useState<SiteProject>({
    product: "portfolio",
    features: ["Galeria de projetos"],
    delivery: "Site publicado",
    goal: "",
  });
  const message = siteProjectMessage(project);
  const product = SITE_PRODUCTS.find((item) => item.id === project.product)!;
  return (
    <section className="pf-project" id="site-project" aria-labelledby="site-project-title">
      <div className="pf-wrap">
        <div className="pf-section-heading">
          <div>
            <p className="pf-eyebrow">
              <Layers3 size={14} /> Do portfólio ao seu site
            </p>
            <h2 id="site-project-title">
              Agora imagine
              <br />
              <span>isso no seu endereço.</span>
            </h2>
          </div>
          <p>
            O portfólio gratuito é o começo. Um site próprio é um projeto feito para sua marca, seu
            objetivo e a experiência que você quer entregar.
          </p>
        </div>
        <div className="pf-project-layout">
          <div className="pf-project-options">
            <fieldset>
              <legend>01 · O que vamos construir?</legend>
              <div className="pf-product-grid">
                {SITE_PRODUCTS.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    aria-pressed={project.product === item.id}
                    className="pf-product-option"
                    onClick={() => setProject((current) => ({ ...current, product: item.id }))}
                  >
                    <span>
                      {item.name}
                      {project.product === item.id && <Check size={16} />}
                    </span>
                    <p>{item.description}</p>
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend>02 · Quais recursos fazem sentido?</legend>
              <p className="pf-option-note">
                Escolha os que interessam. O escopo será confirmado com você.
              </p>
              <div className="pf-feature-grid">
                {SITE_FEATURES.map((feature) => (
                  <label key={feature}>
                    <input
                      type="checkbox"
                      checked={project.features.includes(feature)}
                      onChange={() =>
                        setProject((current) => ({
                          ...current,
                          features: current.features.includes(feature)
                            ? current.features.filter((value) => value !== feature)
                            : [...current.features, feature],
                        }))
                      }
                    />
                    <span>{feature}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="pf-project-fields">
              <label>
                03 · Qual entrega você procura?
                <select
                  value={project.delivery}
                  onChange={(event) =>
                    setProject((current) => ({
                      ...current,
                      delivery: event.target.value as SiteProject["delivery"],
                    }))
                  }
                >
                  {SITE_DELIVERIES.map((delivery) => (
                    <option key={delivery}>{delivery}</option>
                  ))}
                </select>
              </label>
              <label>
                Seu objetivo · opcional
                <textarea
                  rows={3}
                  maxLength={600}
                  value={project.goal}
                  onChange={(event) =>
                    setProject((current) => ({ ...current, goal: event.target.value }))
                  }
                  placeholder="Ex.: apresentar meus projetos e receber pedidos de orçamento."
                />
              </label>
            </div>
          </div>
          <aside className="pf-project-summary" aria-label="Resumo do seu projeto">
            <p className="pf-eyebrow">Seu próximo projeto</p>
            <h3>{product.name}</h3>
            <p>{product.description}</p>
            <dl>
              <div>
                <dt>Entrega</dt>
                <dd>{project.delivery}</dd>
              </div>
              <div>
                <dt>Recursos escolhidos</dt>
                <dd>
                  {project.features.length ? project.features.join(" · ") : "Vamos definir juntos"}
                </dd>
              </div>
              <div>
                <dt>Investimento</dt>
                <dd>Sob proposta personalizada</dd>
              </div>
            </dl>
            <p className="pf-scope-note">
              Cada serviço tem seu próprio valor. Quantidade de páginas, design, tecnologias,
              integrações e entrega definem a complexidade e o investimento. Prazo e manutenção são
              alinhados na proposta.
            </p>
            <details>
              <summary>Revisar mensagem da proposta</summary>
              <pre>{message}</pre>
            </details>
            <a
              className="pf-button pf-primary"
              href={`${SOCIAL_LINKS.whatsapp}?text=${encodeURIComponent(message)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle size={17} /> Solicitar proposta do meu site <ArrowUpRight size={16} />
            </a>
            <a
              className="pf-email"
              href={`${SOCIAL_LINKS.email}?subject=${encodeURIComponent("Projeto de site · Veronica Portfolio")}&body=${encodeURIComponent(message)}`}
            >
              Prefiro conversar por e-mail
            </a>
            <p className="pf-small">
              Você abre a conversa e decide enviar. Sem pagamento nesta etapa.
            </p>
          </aside>
        </div>
      </div>
    </section>
  );
}
