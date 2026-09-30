import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  Clapperboard,
  Eye,
  Layers3,
  MessageCircle,
  Mic2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";

export const Route = createFileRoute("/formacoes/avatar-digital-ia")({
  component: AvatarDigital,
  head: () => ({
    meta: [
      { title: "Avatar Digital IA | Escola Veronica" },
      {
        name: "description",
        content:
          "Prévia da formação Avatar Digital IA: identidade, roteiro, voz, visual e fluxo de produção responsável.",
      },
    ],
  }),
});

const modules = [
  {
    number: "01",
    title: "Identidade antes da imagem",
    copy: "Defina propósito, público, personalidade e limites do avatar antes de abrir qualquer gerador.",
    icon: Eye,
    state: "preview",
  },
  {
    number: "02",
    title: "Voz e presença",
    copy: "Escolha tom, cadência e comportamento com transparência sobre uso de IA.",
    icon: Mic2,
    state: "production",
  },
  {
    number: "03",
    title: "Direção visual",
    copy: "Construa consistência de roupa, luz, enquadramento, cenário e linguagem.",
    icon: Layers3,
    state: "production",
  },
  {
    number: "04",
    title: "Roteiro e performance",
    copy: "Transforme intenção em uma fala curta, clara e útil para vídeo.",
    icon: Clapperboard,
    state: "production",
  },
  {
    number: "05",
    title: "Publicação responsável",
    copy: "Revise consentimento, transparência, contexto e expectativa antes de publicar.",
    icon: ShieldCheck,
    state: "production",
  },
] as const;

function AvatarDigital() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden border-b border-border/40">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 77% 30%, oklch(0.84 0.2 155 / .18), transparent 30%), radial-gradient(circle at 22% 80%, oklch(0.72 0.13 210 / .12), transparent 32%)",
            }}
          />
          <div className="relative mx-auto grid min-h-[76svh] max-w-7xl gap-12 px-6 py-20 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
            <div>
              <div className="font-mono-tech text-[10px] uppercase tracking-[.28em] text-neon-green">
                CREATE / Formação 01 / Prévia
              </div>
              <h1
                className="mt-5 max-w-4xl font-display text-5xl sm:text-6xl md:text-8xl"
                style={{ letterSpacing: "-.055em", lineHeight: ".88" }}
              >
                Avatar
                <span className="block text-neon-green text-glow-green">Digital IA.</span>
              </h1>
              <p className="mt-7 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
                Crie uma presença digital coerente, reconhecível e responsável. A tecnologia entra
                depois da identidade — não o contrário.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/classroom/avatar-digital-ia"
                  className="inline-flex min-h-12 items-center gap-2 rounded-full bg-neon-green px-6 font-mono-tech text-[10px] uppercase tracking-[.16em] text-primary-foreground shadow-glow-green"
                >
                  Entrar no Classroom <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  to="/formacoes"
                  className="inline-flex min-h-12 items-center gap-2 rounded-full border border-border/70 px-6 font-mono-tech text-[10px] uppercase tracking-[.16em] text-muted-foreground transition hover:border-neon-cyan/50 hover:text-neon-cyan"
                >
                  Ver todas as formações
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 font-mono-tech text-[9px] uppercase tracking-[.18em] text-muted-foreground">
                <span>Trilha CREATE</span>
                <span>Projeto prático</span>
                <span>Veronica Tutor</span>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[30px] border border-neon-green/25 bg-[#04100e] p-6 shadow-[0_40px_120px_-50px_oklch(0.84_0.2_155/.55)] sm:p-8">
              <div className="absolute right-[-15%] top-[-20%] h-72 w-72 rounded-full bg-neon-green/10 blur-3xl" />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div className="font-mono-tech text-[9px] uppercase tracking-[.24em] text-neon-green">
                    Projeto final
                  </div>
                  <Sparkles className="h-4 w-4 text-neon-green" />
                </div>
                <h2 className="mt-10 max-w-md font-display text-4xl sm:text-5xl">
                  Construa um avatar que parece pertencer à sua marca.
                </h2>
                <p className="mt-5 max-w-md text-sm leading-7 text-white/55">
                  Você termina a prévia com um briefing de identidade, roteiro curto, direção visual
                  e checklist de publicação responsável.
                </p>
                <div className="mt-8 space-y-3">
                  {[
                    "Briefing de identidade",
                    "Roteiro de apresentação",
                    "Direção de voz",
                    "Direção visual",
                    "Checklist de transparência",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-3 border-t border-white/10 pt-3 text-sm text-white/72">
                      <CheckCircle2 className="h-4 w-4 text-neon-green" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-20 md:py-28">
          <div className="mb-12 grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
            <div>
              <div className="font-mono-tech text-[10px] uppercase tracking-[.25em] text-neon-cyan">
                Estrutura
              </div>
              <h2 className="mt-4 font-display text-4xl sm:text-5xl">Uma formação feita para executar.</h2>
            </div>
            <p className="max-w-2xl text-sm leading-7 text-muted-foreground lg:justify-self-end">
              O módulo 01 já funciona como prévia de classroom. Os módulos seguintes permanecem
              visíveis como roadmap de conteúdo e não são apresentados como aulas concluídas.
            </p>
          </div>

          <div className="grid gap-4">
            {modules.map((module) => {
              const Icon = module.icon;
              const available = module.state === "preview";
              return (
                <article
                  key={module.number}
                  className="grid gap-5 rounded-[24px] border border-border/60 bg-surface/30 p-6 sm:grid-cols-[80px_1fr_auto] sm:items-center"
                >
                  <div className="font-mono-tech text-[11px] tracking-[.2em] text-muted-foreground">
                    {module.number}
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <Icon className={available ? "h-4 w-4 text-neon-green" : "h-4 w-4 text-muted-foreground"} />
                      <h3 className="font-display text-2xl">{module.title}</h3>
                    </div>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{module.copy}</p>
                  </div>
                  {available ? (
                    <Link
                      to="/classroom/avatar-digital-ia"
                      className="inline-flex min-h-10 items-center gap-2 rounded-full border border-neon-green/35 px-4 font-mono-tech text-[9px] uppercase tracking-[.16em] text-neon-green"
                    >
                      Abrir prévia <ArrowRight className="h-3 w-3" />
                    </Link>
                  ) : (
                    <span className="font-mono-tech text-[8px] uppercase tracking-[.18em] text-muted-foreground">
                      Em produção
                    </span>
                  )}
                </article>
              );
            })}
          </div>
        </section>

        <section className="border-y border-border/40 bg-surface/30 py-20">
          <div className="mx-auto grid max-w-7xl gap-8 px-6 lg:grid-cols-[.85fr_1.15fr] lg:items-center">
            <div>
              <MessageCircle className="h-6 w-6 text-neon-green" />
              <h2 className="mt-5 font-display text-4xl sm:text-5xl">Veronica Tutor acompanha a prévia.</h2>
              <p className="mt-5 max-w-lg text-sm leading-7 text-muted-foreground">
                O tutor já responde perguntas da Escola e da formação. Nesta versão ele conhece o
                contexto da trilha e do projeto, sem fingir recursos de vídeo ou rastreamento por minuto
                que ainda não existem.
              </p>
            </div>
            <div className="rounded-[26px] border border-neon-green/25 bg-background/70 p-6 sm:p-8">
              <div className="font-mono-tech text-[9px] uppercase tracking-[.24em] text-neon-green">
                Exemplo
              </div>
              <div className="mt-5 rounded-2xl border border-border/60 bg-surface/50 p-4 text-sm text-muted-foreground">
                “Como faço meu avatar parecer consistente entre vídeos sem copiar o rosto de outra pessoa?”
              </div>
              <div className="mt-3 rounded-2xl border border-neon-green/25 bg-neon-green/[.04] p-4 text-sm leading-6 text-foreground">
                Comece por características que pertencem à marca: silhueta, roupa, paleta, enquadramento,
                tom de voz e comportamento. Use uma identidade original e documente esses elementos antes
                de gerar variações.
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
