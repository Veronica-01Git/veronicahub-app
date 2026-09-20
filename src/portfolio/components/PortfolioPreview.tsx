import { ArrowUpRight } from "lucide-react";
import { PORTFOLIO_SECTIONS } from "../config/sections";
import type { PortfolioDraft, PreviewDevice } from "../types";

export function PortfolioPreview({
  draft,
  device,
}: {
  draft: PortfolioDraft;
  device: PreviewDevice;
}) {
  const mobile = device === "mobile";
  return (
    <div
      className={`mx-auto overflow-hidden rounded-[1.4rem] border border-white/10 bg-[#f4f1ea] text-[#151515] shadow-2xl transition-[max-width] duration-500 ${mobile ? "max-w-[390px]" : "max-w-5xl"}`}
    >
      <nav className="flex items-center justify-between border-b border-black/10 px-5 py-4">
        <span className="font-display text-sm">{draft.ownerName}</span>
        <div
          className={`${mobile ? "hidden" : "flex"} gap-4 text-[11px] uppercase tracking-[0.14em] text-black/55`}
        >
          {PORTFOLIO_SECTIONS.slice(1, 6).map((section) => (
            <a key={section.id} href={`#preview-${section.id}`} className="hover:text-black">
              {section.label}
            </a>
          ))}
        </div>
        <span className="rounded-full border border-black/15 px-3 py-1 text-[10px] uppercase tracking-wider">
          Disponível
        </span>
      </nav>

      <section
        id="preview-hero"
        className={`grid min-h-[410px] items-end gap-8 px-6 py-10 ${mobile ? "grid-cols-1" : "grid-cols-[1.35fr_0.65fr] px-12 py-14"}`}
      >
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-black/45">
            {draft.profession} · Brasil
          </p>
          <h3
            className={`${mobile ? "text-4xl" : "text-6xl"} mt-4 max-w-3xl font-display leading-[0.95] tracking-[-0.055em]`}
          >
            {draft.headline}
          </h3>
          <a
            href="#preview-projects"
            className="mt-7 inline-flex items-center gap-2 border-b border-black pb-1 text-sm font-semibold"
          >
            Ver projetos <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
        <div className="aspect-[4/5] rounded-[1.25rem] bg-[radial-gradient(circle_at_35%_30%,#67e8c4,transparent_34%),linear-gradient(145deg,#101820,#273c48_55%,#d8ff57)] p-5 text-white">
          <div className="flex h-full items-end rounded-[0.9rem] border border-white/20 p-4">
            <span className="text-xs uppercase tracking-[0.16em] text-white/70">
              Imagem autoral
              <br />
              ou showreel
            </span>
          </div>
        </div>
      </section>

      <section id="preview-about" className="border-t border-black/10 px-6 py-10 md:px-12">
        <p className="text-xs uppercase tracking-[0.2em] text-black/45">Sobre</p>
        <p className="mt-4 max-w-3xl text-xl leading-relaxed md:text-3xl">{draft.about}</p>
      </section>
      <section
        id="preview-specialties"
        className="grid gap-4 border-t border-black/10 px-6 py-10 md:grid-cols-3 md:px-12"
      >
        {draft.specialties.map((item, index) => (
          <article key={item} className="rounded-2xl border border-black/10 bg-white/50 p-5">
            <span className="text-xs text-black/40">0{index + 1}</span>
            <h4 className="mt-10 font-display text-xl">{item}</h4>
          </article>
        ))}
      </section>
      <section id="preview-skills" className="border-t border-black/10 px-6 py-10 md:px-12">
        <p className="text-xs uppercase tracking-[0.2em] text-black/45">Competências</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {draft.skills.map((skill) => (
            <span key={skill} className="rounded-full border border-black/15 px-4 py-2 text-sm">
              {skill}
            </span>
          ))}
        </div>
      </section>
      <section id="preview-projects" className="border-t border-black/10 px-6 py-10 md:px-12">
        <p className="text-xs uppercase tracking-[0.2em] text-black/45">Projetos e cases</p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {draft.projects.map((project) => (
            <article key={project.title} className="rounded-2xl bg-[#151515] p-5 text-white">
              <div className="aspect-video rounded-xl bg-[linear-gradient(135deg,#26363d,#7dd3b0)]" />
              <h4 className="mt-5 font-display text-xl">{project.title}</h4>
              <p className="mt-2 text-sm leading-relaxed text-white/60">{project.description}</p>
              <p className="mt-5 text-sm text-[#9fffcf]">{project.result}</p>
            </article>
          ))}
        </div>
      </section>
      <div className={`grid border-t border-black/10 ${mobile ? "grid-cols-1" : "grid-cols-2"}`}>
        <section id="preview-experience" className="px-6 py-10 md:px-12">
          <p className="text-xs uppercase tracking-[0.2em] text-black/45">Experiência</p>
          <p className="mt-4 text-lg">{draft.experience}</p>
        </section>
        <section
          id="preview-education"
          className="border-t border-black/10 px-6 py-10 md:border-l md:border-t-0 md:px-12"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-black/45">Formação</p>
          <p className="mt-4 text-lg">{draft.education}</p>
        </section>
      </div>
      <section
        id="preview-proof"
        className="border-t border-black/10 bg-[#d8ff57] px-6 py-10 md:px-12"
      >
        <p className="max-w-3xl font-display text-2xl leading-tight md:text-4xl">{draft.proof}</p>
      </section>
      <section
        id="preview-contact"
        className="flex flex-col gap-5 bg-[#151515] px-6 py-10 text-white md:flex-row md:items-end md:justify-between md:px-12"
      >
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-white/45">Contato</p>
          <h4 className="mt-3 font-display text-3xl">Vamos construir algo relevante.</h4>
        </div>
        <a href={`mailto:${draft.contact}`} className="text-sm text-[#9fffcf]">
          {draft.contact}
        </a>
      </section>
    </div>
  );
}
