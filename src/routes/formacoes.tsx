import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, BookOpen, Code2, Megaphone, ShieldCheck, Sparkles } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { courses } from "@/lib/courses";

export const Route = createFileRoute("/formacoes")({
  component: Formacoes,
  head: () => ({
    meta: [
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
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden border-b border-border/40">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-90"
            style={{
              background:
                "radial-gradient(circle at 82% 20%, oklch(0.84 0.21 155 / .16), transparent 34%), radial-gradient(circle at 18% 72%, oklch(0.77 0.12 210 / .11), transparent 36%)",
            }}
          />
          <div className="relative mx-auto max-w-7xl px-6 py-20 md:py-28">
            <div className="font-mono-tech text-[10px] uppercase tracking-[.28em] text-neon-green">
              Veronica School / Formações
            </div>
            <h1
              className="mt-5 max-w-5xl font-display text-5xl sm:text-6xl md:text-8xl"
              style={{ letterSpacing: "-.055em", lineHeight: ".9" }}
            >
              Escolha o que você quer
              <span className="block text-neon-green text-glow-green">construir.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              Quatro trilhas. Um método: assistir o essencial, construir, testar e publicar.
              A maioria das formações ainda está em produção; a prévia de Avatar Digital IA já tem
              uma experiência própria de curso e classroom.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/aula-zero"
                className="inline-flex min-h-12 items-center gap-2 rounded-full bg-neon-green px-6 font-mono-tech text-[10px] uppercase tracking-[.16em] text-primary-foreground shadow-glow-green"
              >
                Começar pela Aula Zero <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                to="/formacoes/avatar-digital-ia"
                className="inline-flex min-h-12 items-center gap-2 rounded-full border border-neon-cyan/40 px-6 font-mono-tech text-[10px] uppercase tracking-[.16em] text-neon-cyan"
              >
                Ver prévia Avatar Digital IA <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-20 md:py-28">
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
                  className="overflow-hidden rounded-[28px] border border-border/60 bg-surface/35"
                >
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
                            <div className="mt-1 text-xs text-muted-foreground">Prévia de formação disponível</div>
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
                            <div className="mt-1 text-xs text-muted-foreground">{course.availability}</div>
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
      </main>
      <SiteFooter />
    </div>
  );
}
