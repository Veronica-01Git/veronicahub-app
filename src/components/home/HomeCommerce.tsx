import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Boxes,
  GraduationCap,
  Handshake,
  PackageOpen,
  Sparkles,
} from "lucide-react";
import { SOCIAL_LINKS } from "@/components/SiteChrome";

const cardClass =
  "group relative overflow-hidden rounded-sm border border-border/60 bg-background/60 p-6 backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-neon-green/60 hover:shadow-glow-green";

export function HomeCommerce() {
  return (
    <>
      <section id="produtos" className="relative border-t border-border/40 py-24 cv-auto">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(circle at 20% 20%, oklch(0.85 0.22 155 / 0.12), transparent 38%), radial-gradient(circle at 85% 70%, oklch(0.88 0.15 195 / 0.1), transparent 42%)",
          }}
        />

        <div className="relative mx-auto max-w-7xl px-6">
          <div className="mb-14 grid gap-6 lg:grid-cols-[1fr_0.8fr] lg:items-end">
            <div>
              <div className="flex items-center gap-3 font-mono-tech text-[11px] uppercase tracking-widest text-neon-green">
                <span className="h-px w-8 bg-neon-green" />
                [ 02 ] Produtos Veronica
              </div>
              <h2
                className="mt-3 max-w-4xl font-display text-4xl sm:text-5xl md:text-6xl"
                style={{ letterSpacing: "-0.04em", lineHeight: "0.95" }}
              >
                Aprenda. Aplique.
                <br />
                <span className="text-outline-neon">Construa algo seu.</span>
              </h2>
            </div>
            <p className="max-w-xl leading-[1.7] text-muted-foreground lg:justify-self-end">
              A Veronica conecta educação e execução: você aprende uma habilidade, recebe os
              recursos certos e transforma a aula em uma entrega real.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Link to="/comandos" className={cardClass}>
              <div className="flex h-11 w-11 items-center justify-center rounded-sm border border-neon-green/40 bg-neon-green/10 text-neon-green">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div className="mt-8 font-mono-tech text-[9px] uppercase tracking-[0.2em] text-neon-green">
                Escola de IA
              </div>
              <h3 className="mt-2 font-display text-2xl text-foreground">
                Formações Veronica
              </h3>
              <p className="mt-3 text-sm leading-[1.65] text-muted-foreground">
                Trilhas práticas de criação, vídeo, automação, desenvolvimento, carreira e
                negócios com IA.
              </p>
              <div className="mt-7 flex items-center gap-2 font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground transition group-hover:text-neon-green">
                Explorar formações
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>

            <Link to="/prompt-packs" className={cardClass}>
              <div className="flex h-11 w-11 items-center justify-center rounded-sm border border-neon-cyan/40 bg-neon-cyan/10 text-neon-cyan">
                <PackageOpen className="h-5 w-5" />
              </div>
              <div className="mt-8 font-mono-tech text-[9px] uppercase tracking-[0.2em] text-neon-cyan">
                Produtos autorais
              </div>
              <h3 className="mt-2 font-display text-2xl text-foreground">Prompt Packs</h3>
              <p className="mt-3 text-sm leading-[1.65] text-muted-foreground">
                Sistemas de prompts, frameworks e fluxos prontos para elevar a qualidade e reduzir
                o tempo entre ideia e resultado.
              </p>
              <div className="mt-7 flex items-center gap-2 font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground transition group-hover:text-neon-cyan">
                Conhecer os packs
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>

            <Link to="/video-ia" className={cardClass}>
              <div className="flex h-11 w-11 items-center justify-center rounded-sm border border-neon-green/40 bg-neon-green/10 text-neon-green">
                <Boxes className="h-5 w-5" />
              </div>
              <div className="mt-8 font-mono-tech text-[9px] uppercase tracking-[0.2em] text-neon-green">
                Ferramentas próprias
              </div>
              <h3 className="mt-2 font-display text-2xl text-foreground">Veronica Studio</h3>
              <p className="mt-3 text-sm leading-[1.65] text-muted-foreground">
                Um ambiente para aplicar o aprendizado e produzir imagens, vídeos e ativos digitais
                dentro do ecossistema.
              </p>
              <div className="mt-7 flex items-center gap-2 font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground transition group-hover:text-neon-green">
                Entrar na Studio
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          </div>
        </div>
      </section>

      <section id="collabs" className="border-y border-border/40 bg-surface/40 py-24 cv-auto">
        <div className="mx-auto max-w-7xl px-6">
          <div className="relative overflow-hidden rounded-sm border border-neon-cyan/30 bg-background/70 p-7 sm:p-10 lg:p-14">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-neon-cyan/10 blur-3xl"
            />
            <div className="relative grid gap-10 lg:grid-cols-[1fr_0.72fr] lg:items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-neon-cyan/30 bg-neon-cyan/5 px-3 py-1 font-mono-tech text-[9px] uppercase tracking-[0.2em] text-neon-cyan">
                  <Sparkles className="h-3 w-3" />
                  Curadoria em preparação
                </div>
                <h2
                  className="mt-6 max-w-3xl font-display text-4xl sm:text-5xl"
                  style={{ letterSpacing: "-0.04em", lineHeight: "0.96" }}
                >
                  Collabs que não parecem
                  <br />
                  <span className="text-neon-cyan text-glow-cyan">mais do mesmo.</span>
                </h2>
                <p className="mt-6 max-w-2xl leading-[1.7] text-muted-foreground">
                  Edições especiais com especialistas, criadores e marcas selecionadas para unir
                  conhecimento, tecnologia e produtos que só existem dentro da Veronica.
                </p>
              </div>

              <div className="rounded-sm border border-border/60 bg-surface/60 p-6">
                <Handshake className="h-6 w-6 text-neon-cyan" />
                <h3 className="mt-5 font-display text-2xl text-foreground">
                  Construa uma collab com a Veronica
                </h3>
                <p className="mt-3 text-sm leading-[1.65] text-muted-foreground">
                  Buscamos projetos com utilidade real, identidade forte e potencial de ensinar,
                  criar ou transformar.
                </p>
                <a
                  href={SOCIAL_LINKS.email}
                  className="group mt-7 inline-flex items-center gap-2 rounded-sm border border-neon-cyan/50 px-5 py-3 font-mono-tech text-[10px] uppercase tracking-widest text-neon-cyan transition hover:bg-neon-cyan/10"
                >
                  Propor uma collab
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
