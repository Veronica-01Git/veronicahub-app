import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, BookOpen, Code2, Megaphone, ShieldCheck, Sparkles } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { CampusHero, CampusImage, CampusNavigation } from "@/components/learning/CampusVisuals";
import { campusImage, campusSrcSet } from "@/lib/yo-visuals";
import { courses } from "@/lib/courses";

export const Route = createFileRoute("/formacoes")({
  component: Formacoes,
  head: () => ({
    links: [
      {
        rel: "preload",
        as: "image",
        href: campusImage("formacoes"),
        imageSrcSet: campusSrcSet("formacoes"),
        imageSizes: "100vw",
        type: "image/webp",
        fetchPriority: "high",
      },
    ],
    meta: [
      {
        property: "og:image",
        content: "https://veronicahub.com/images/yo-campus/formacoes-1600.webp",
      },
      { title: "Formações | Escola Veronica" },
      {
        name: "description",
        content: "Trilhas práticas de IA da Escola Veronica: CREATE, BUILD, GROW e SECURE.",
      },
    ],
  }),
});

const tracks = [
  {
    id: "create",
    label: "CREATE",
    title: "Criação com IA",
    description: "Imagem, vídeo, avatar, VFX e conteúdo orientados a um projeto real.",
    icon: Sparkles,
    titles: ["Avatar Digital IA", "VFX com IA", "VSL Cinematográfico", "Canais Dark"],
  },
  {
    id: "build",
    label: "BUILD",
    title: "Construção digital",
    description: "Sites e aplicações com raciocínio de produto, fluxo e publicação.",
    icon: Code2,
    titles: ["Criar Site", "App no-code"],
  },
  {
    id: "grow",
    label: "GROW",
    title: "Crescimento",
    description: "Oferta, escrita, mídia e operação comercial apoiadas por IA.",
    icon: Megaphone,
    titles: ["Copywriting", "Meta Ads", "Afiliado", "iFood"],
  },
  {
    id: "secure",
    label: "SECURE",
    title: "Segurança defensiva",
    description: "Fundamentos de proteção, análise autorizada e prevenção.",
    icon: ShieldCheck,
    titles: ["Hacking Ético"],
  },
] as const;

function Formacoes() {
  return (
    <div className="vh-wf yo-learning min-h-screen">
      <SiteHeader brand="yo" />
      <main>
        <CampusHero
          image="formacoes"
          eyebrow="YO LAB & CO. · Escola Veronica"
          title={
            <>
              Formações<span>para criar.</span>
            </>
          }
          copy="Quatro trilhas. Uma próxima versão de você."
          action={
            <a href="#trilhas" className="wf-btn wf-btn-primary">
              Escolher minha trilha
              <ArrowRight size={16} />
            </a>
          }
          discover="#trilhas"
          discoverLabel="Explore as formações"
        />
        <section className="yo-course-intro">
          <div className="wf-wrap">
            <div>
              <p className="wf-index">Seu próximo projeto</p>
              <h2 className="wf-h2 mt-5">Aprenda construindo.</h2>
            </div>
            <div>
              <p className="wf-lede">
                Assista ao essencial, construa, teste e publique. A prévia de Avatar Digital IA já
                está disponível; as demais formações seguem em produção.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/aula-zero" className="wf-btn wf-btn-ghost">
                  Começar pela Aula Zero
                  <ArrowRight size={15} />
                </Link>
                <Link to="/formacoes/avatar-digital-ia" className="wf-btn wf-btn-primary">
                  Ver prévia Avatar Digital IA
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section id="trilhas" className="mx-auto max-w-7xl scroll-mt-24 px-6 py-20 md:py-28">
          <div className="grid gap-5 lg:grid-cols-2">
            {tracks.map((track, trackIndex) => {
              const Icon = track.icon;
              const trackCourses = courses.filter((course) =>
                (track.titles as readonly string[]).includes(course.title),
              );
              return (
                <section
                  key={track.id}
                  id={track.id}
                  className="overflow-hidden rounded-[28px] border border-border/60 bg-surface/35 scroll-mt-24"
                >
                  <div className="yo-track-cover">
                    <CampusImage
                      name={
                        track.id === "create"
                          ? "portfolio"
                          : track.id === "build"
                            ? "formacoes"
                            : track.id === "grow"
                              ? "analytics"
                              : "security"
                      }
                      alt={`Veronica e agentes YO no ambiente da trilha ${track.label}.`}
                    />
                    <span>{track.label} / YO LAB</span>
                  </div>
                  <div className="border-b border-border/50 p-6 sm:p-8">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-neon-green/30 bg-neon-green/[.06] text-neon-green">
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="font-mono-tech text-[9px] uppercase tracking-[.24em] text-muted-foreground">
                        0{trackIndex + 1}
                      </span>
                    </div>
                    <div className="mt-10 font-mono-tech text-[10px] uppercase tracking-[.28em] text-neon-green">
                      {track.label}
                    </div>
                    <h2 className="mt-3 font-display text-4xl sm:text-5xl">{track.title}</h2>
                    <p className="mt-4 max-w-lg text-sm leading-6 text-muted-foreground">
                      {track.description}
                    </p>
                  </div>
                  <div className="divide-y divide-border/45">
                    {trackCourses.map((course) => {
                      const isAvatar = course.slug === "avatar-digital-ia";
                      return isAvatar ? (
                        <Link
                          key={course.slug}
                          to="/formacoes/avatar-digital-ia"
                          className="group flex items-center gap-4 p-5 transition hover:bg-neon-green/[.035] sm:p-6"
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-neon-green/30 text-neon-green">
                            <BookOpen className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-display text-xl">{course.title}</div>
                            <div className="mt-1 text-xs text-muted-foreground">
                              Prévia de formação disponível
                            </div>
                          </div>
                          <ArrowRight className="h-4 w-4 text-neon-green transition group-hover:translate-x-1" />
                        </Link>
                      ) : (
                        <div key={course.slug} className="flex items-center gap-4 p-5 sm:p-6">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border/60 text-muted-foreground">
                            <BookOpen className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-display text-xl">{course.title}</div>
                            <div className="mt-1 text-xs text-muted-foreground">
                              {course.availability}
                            </div>
                          </div>
                          <span className="font-mono-tech text-[8px] uppercase tracking-widest text-muted-foreground">
                            Em produção
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        </section>
        <CampusNavigation current="/formacoes" />
      </main>
      <SiteFooter brand="yo" />
    </div>
  );
}
