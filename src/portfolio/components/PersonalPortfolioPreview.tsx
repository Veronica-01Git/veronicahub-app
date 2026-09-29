import type { PortfolioDraft, PreviewDevice } from "../types";
import { contactHref } from "../features/generator/personal-brief";
import "./personal-preview.css";

export function PersonalPortfolioPreview({
  draft,
  device,
}: {
  draft: PortfolioDraft;
  device: PreviewDevice;
}) {
  const href = contactHref(draft.contact);
  const sections = [
    { id: "about", label: "Sobre", visible: Boolean(draft.about) },
    { id: "projects", label: "Projetos", visible: draft.projects.length > 0 },
    {
      id: "experience",
      label: "Trajetória",
      visible: Boolean(draft.experience || draft.education),
    },
    { id: "contact", label: "Contato", visible: Boolean(href) },
  ].filter((section) => section.visible);
  const initials = draft.ownerName
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => Array.from(word)[0])
    .join("");
  return (
    <article
      aria-label="Prévia do seu portfólio"
      className="personal-preview"
      style={{ maxWidth: device === "mobile" ? 390 : 1040 }}
    >
      <header className="personal-preview-nav">
        <span className="font-display text-sm font-semibold">
          {draft.ownerName}
        </span>
        {sections.length > 0 && (
          <nav
            aria-label="Seções do seu portfólio"
            className="flex flex-wrap gap-x-4 gap-y-2 text-xs"
          >
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#personal-${section.id}`}
                className="py-2 underline-offset-4 hover:underline"
              >
                {section.label}
              </a>
            ))}
          </nav>
        )}
      </header>
      <section className="personal-preview-hero">
        <div>
          <p className="text-xs uppercase tracking-[.18em] text-black/60">
            {draft.profession}
          </p>
          <h3 className="personal-preview-title font-display">
            {draft.headline}
          </h3>
          {draft.projects.length > 0 && (
            <a
              href="#personal-projects"
              className="mt-7 inline-flex min-h-11 items-center border-b border-black text-sm font-semibold"
            >
              Conheça meu trabalho ↗
            </a>
          )}
        </div>
        <div aria-hidden="true" className="personal-preview-monogram">
          <span>{initials}</span>
          <span className="text-xs uppercase tracking-[.2em]">
            {draft.profession}
          </span>
        </div>
      </section>
      {draft.about && (
        <section id="personal-about" className="personal-preview-section">
          <h4 className="text-xs uppercase tracking-[.18em] text-black/60">
            Sobre meu trabalho
          </h4>
          <p className="mt-5 whitespace-pre-line text-xl leading-relaxed">
            {draft.about}
          </p>
        </section>
      )}
      {draft.skills.length > 0 && (
        <section className="personal-preview-section">
          <h4 className="text-xs uppercase tracking-[.18em] text-black/60">
            Competências
          </h4>
          <ul className="mt-5 flex flex-wrap gap-2">
            {draft.skills.map((skill) => (
              <li
                key={skill}
                className="rounded-full border border-black/15 px-4 py-2 text-sm"
              >
                {skill}
              </li>
            ))}
          </ul>
        </section>
      )}
      {draft.projects.length > 0 && (
        <section id="personal-projects" className="personal-preview-section">
          <h4 className="text-xs uppercase tracking-[.18em] text-black/60">
            Trabalhos selecionados
          </h4>
          <div className="personal-preview-projects mt-6">
            {draft.projects.map((project, index) => (
              <article
                key={index}
                className="min-w-0 rounded-2xl bg-[#122321] p-6 text-white"
              >
                <span className="text-xs text-emerald-200">0{index + 1}</span>
                <h5 className="mt-8 font-display text-2xl">{project.title}</h5>
                {project.description && (
                  <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-white/75">
                    {project.description}
                  </p>
                )}
                {project.result && (
                  <div className="mt-6 border-t border-white/15 pt-4">
                    <p className="text-xs uppercase tracking-wider text-emerald-200">
                      Resultado
                    </p>
                    <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">
                      {project.result}
                    </p>
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      )}
      {(draft.experience || draft.education) && (
        <section
          id="personal-experience"
          className="personal-preview-section personal-preview-projects"
        >
          {draft.experience && (
            <div>
              <h4 className="text-xs uppercase tracking-[.18em] text-black/60">
                Experiência
              </h4>
              <p className="mt-5 whitespace-pre-line text-base leading-relaxed">
                {draft.experience}
              </p>
            </div>
          )}
          {draft.education && (
            <div>
              <h4 className="text-xs uppercase tracking-[.18em] text-black/60">
                Formação
              </h4>
              <p className="mt-5 whitespace-pre-line text-base leading-relaxed">
                {draft.education}
              </p>
            </div>
          )}
        </section>
      )}
      {href && (
        <section
          id="personal-contact"
          className="personal-preview-section bg-[#d9f6e9]"
        >
          <h4 className="font-display text-3xl">Vamos conversar?</h4>
          <a
            href={href}
            className="mt-5 inline-flex min-h-11 items-center text-sm underline underline-offset-4"
          >
            {draft.contact}
          </a>
        </section>
      )}
    </article>
  );
}
