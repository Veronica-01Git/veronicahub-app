import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Circle,
  Clock3,
  Copy,
  Download,
  Headphones,
  Play,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { SiteFooter, SiteHeader, SOCIAL_LINKS } from "@/components/SiteChrome";

export const Route = createFileRoute("/aula-zero")({
  component: AulaZero,
  head: () => ({
    meta: [
      { title: "Aula Zero — Sua primeira narração com IA | Veronica Hub" },
      {
        name: "description",
        content:
          "Uma aula gratuita e prática da Veronica Hub para transformar um texto comum em uma narração clara e profissional com IA.",
      },
      { property: "og:title", content: "Aula Zero — Crie sua primeira narração com IA" },
      {
        property: "og:description",
        content: "Assista, execute e termine a aula com uma narração de 30 segundos pronta.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
});

const STEPS = [
  {
    title: "Defina a intenção",
    text: "Escolha quem fala, para quem e qual sensação a mensagem precisa transmitir.",
  },
  {
    title: "Escreva para ser ouvido",
    text: "Use frases curtas, uma ideia por vez e palavras que soem naturais em voz alta.",
  },
  {
    title: "Dirija a interpretação",
    text: "Marque ritmo, pausas e as palavras que merecem destaque — sem exagerar.",
  },
  {
    title: "Gere e compare",
    text: "Crie duas versões, escute com fones e altere somente um elemento por teste.",
  },
];

const CHECKLIST = [
  "A mensagem tem até 50 palavras",
  "O público está definido",
  "A emoção principal está clara",
  "As frases funcionam em voz alta",
  "A narração termina com uma ação",
];

const EXAMPLE_PROMPT = `Você é uma educadora brasileira de tecnologia. Fale com calma, clareza e confiança, em ritmo conversacional. A audiência está começando a aprender inteligência artificial. Use pequenas pausas naturais e destaque apenas as palavras essenciais. Evite tom publicitário e exageros. Narre o texto a seguir: [COLE SEU TEXTO].`;

const PROJECT_SCRIPT = `Hoje você não precisa dominar todas as ferramentas de inteligência artificial. Escolha um problema pequeno, crie uma primeira versão e observe o resultado. Clareza vem da prática. Comece com um projeto que você consegue terminar hoje.`;

const PROGRESS_KEY = "veronica-aula-zero-progress-v1";

function AulaZero() {
  const [completed, setCompleted] = useState<number[]>([]);
  const [copied, setCopied] = useState<"prompt" | "script" | null>(null);
  const progress = useMemo(
    () => Math.round((completed.length / CHECKLIST.length) * 100),
    [completed],
  );

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(PROGRESS_KEY);
      if (saved) setCompleted(JSON.parse(saved));
    } catch {
      // A aula continua funcional quando o armazenamento do navegador está indisponível.
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(completed));
    } catch {
      // Progresso local é um aprimoramento, não um requisito para concluir a aula.
    }
  }, [completed]);

  async function copyText(kind: "prompt" | "script", value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(kind);
    window.setTimeout(() => setCopied(null), 1800);
  }

  function toggleItem(index: number) {
    setCompleted((items) =>
      items.includes(index) ? items.filter((item) => item !== index) : [...items, index],
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <SiteHeader />

      <main>
        <section className="relative overflow-hidden border-b border-border/40 py-14 md:py-20">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-80"
            style={{
              background:
                "radial-gradient(circle at 78% 22%, oklch(0.85 0.22 155 / 0.16), transparent 34%), radial-gradient(circle at 14% 4%, oklch(0.88 0.15 195 / 0.1), transparent 28%)",
            }}
          />
          <div className="relative mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[1.04fr_.96fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-neon-green/40 bg-neon-green/[0.06] px-3 py-1.5 font-mono-tech text-[10px] uppercase tracking-[0.18em] text-neon-green">
                <Sparkles className="h-3 w-3" />
                Aula gratuita · execução imediata
              </div>
              <h1
                className="mt-6 max-w-3xl font-display text-5xl sm:text-6xl md:text-7xl"
                style={{ letterSpacing: "-0.055em", lineHeight: "0.93" }}
              >
                Crie sua primeira
                <span className="block text-neon-green text-glow-green">narração com IA.</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                Uma aula curta para transformar um texto comum em uma voz clara, natural e pronta
                para vídeo. Você termina com um projeto de 30 segundos — não apenas teoria.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#assistir"
                  className="inline-flex min-h-12 items-center gap-2 rounded-sm bg-neon-green px-6 font-mono-tech text-[11px] uppercase tracking-[0.16em] text-primary-foreground shadow-glow-green transition hover:-translate-y-0.5 hover:brightness-110"
                >
                  <Play className="h-4 w-4 fill-current" /> Começar agora
                </a>
                <Link
                  to="/prompt-packs"
                  className="inline-flex min-h-12 items-center gap-2 rounded-sm border border-border/70 bg-surface/50 px-6 font-mono-tech text-[11px] uppercase tracking-[0.16em] text-muted-foreground transition hover:border-neon-cyan/60 hover:text-neon-cyan"
                >
                  Materiais de apoio <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground">
                <span className="inline-flex items-center gap-2">
                  <Clock3 className="h-3.5 w-3.5 text-neon-cyan" /> 8 minutos
                </span>
                <span className="inline-flex items-center gap-2">
                  <Headphones className="h-3.5 w-3.5 text-neon-cyan" /> Iniciante
                </span>
                <span className="inline-flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-neon-green" /> Projeto prático
                </span>
              </div>
            </div>

            <div id="assistir" className="relative scroll-mt-28">
              <div className="overflow-hidden rounded-sm border border-neon-green/30 bg-[#030d0c] shadow-[0_30px_90px_-45px_oklch(0.85_0.22_155/0.8)]">
                <div className="flex items-center justify-between border-b border-border/50 px-4 py-3 font-mono-tech text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                  <span>Veronica Classroom / 001</span>
                  <span className="flex items-center gap-2 text-neon-green">
                    <span className="h-1.5 w-1.5 rounded-full bg-neon-green shadow-glow-green" /> Em
                    aula
                  </span>
                </div>
                <div className="relative aspect-video overflow-hidden bg-black">
                  <video
                    className="h-full w-full object-cover object-center"
                    controls
                    playsInline
                    preload="metadata"
                    poster="/videos/veronica-aula-zero-poster.jpg"
                    aria-label="Apresentação da Aula Zero pela Veronica Teacher"
                  >
                    <source src="/videos/veronica-aula-zero-intro.mp4" type="video/mp4" />
                    <track
                      kind="captions"
                      src="/videos/veronica-aula-zero-intro.vtt"
                      srcLang="pt-BR"
                      label="Português"
                      default
                    />
                    Seu navegador não suporta vídeo HTML5.
                  </video>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/50 px-4 py-3">
                  <p className="text-xs text-muted-foreground">
                    Comece pela apresentação e execute o laboratório abaixo.
                  </p>
                  <a
                    href={SOCIAL_LINKS.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono-tech text-[9px] uppercase tracking-widest text-neon-cyan hover:underline"
                  >
                    Canal oficial →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-16 md:py-24">
          <div className="grid gap-12 lg:grid-cols-[.82fr_1.18fr]">
            <div>
              <div className="font-mono-tech text-[10px] uppercase tracking-[0.2em] text-neon-cyan">
                Método Veronica · 4 etapas
              </div>
              <h2
                className="mt-4 font-display text-4xl sm:text-5xl"
                style={{ letterSpacing: "-0.04em", lineHeight: ".98" }}
              >
                Assista menos.
                <br />
                <span className="text-neon-green">Execute mais.</span>
              </h2>
              <p className="mt-5 max-w-md leading-relaxed text-muted-foreground">
                Cada aula aberta entrega uma competência demonstrável. Este é o primeiro passo da
                trilha de voz, avatar e vídeo da Veronica Hub.
              </p>
            </div>
            <div className="grid gap-px overflow-hidden rounded-sm border border-border/60 bg-border/50 sm:grid-cols-2">
              {STEPS.map((step, index) => (
                <article key={step.title} className="bg-background p-6">
                  <span className="font-mono-tech text-[10px] text-neon-green">0{index + 1}</span>
                  <h3 className="mt-4 font-display text-2xl">{step.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-border/40 bg-surface/30 py-16 md:py-20">
          <div className="mx-auto grid max-w-7xl gap-8 px-6 lg:grid-cols-2">
            <div className="rounded-sm border border-border/60 bg-background/70 p-6 sm:p-8">
              <div className="font-mono-tech text-[10px] uppercase tracking-[0.2em] text-neon-green">
                Comando inicial
              </div>
              <h2 className="mt-3 font-display text-3xl">Dê direção à voz.</h2>
              <pre className="mt-6 whitespace-pre-wrap rounded-sm border border-border/50 bg-[#020908] p-5 font-mono-tech text-[12px] leading-relaxed text-muted-foreground">
                {EXAMPLE_PROMPT}
              </pre>
              <button
                type="button"
                onClick={() => copyText("prompt", EXAMPLE_PROMPT)}
                className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-sm border border-neon-green/30 px-4 font-mono-tech text-[10px] uppercase tracking-widest text-neon-green transition hover:bg-neon-green/10"
              >
                <Copy className="h-3.5 w-3.5" />
                {copied === "prompt" ? "Comando copiado" : "Copiar comando"}
              </button>
              <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                Troque o público, a emoção e o texto. O comando é o ponto de partida; seu julgamento
                continua sendo parte do processo.
              </p>
            </div>

            <div className="rounded-sm border border-neon-green/25 bg-background/70 p-6 sm:p-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="font-mono-tech text-[10px] uppercase tracking-[0.2em] text-neon-cyan">
                    Seu projeto
                  </div>
                  <h2 className="mt-3 font-display text-3xl">Checklist de entrega</h2>
                </div>
                <div className="font-display text-3xl text-neon-green">{progress}%</div>
              </div>
              <div className="mt-5 h-1 overflow-hidden rounded-full bg-border/70">
                <div
                  className="h-full bg-neon-green transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="mt-6 space-y-2">
                {CHECKLIST.map((item, index) => {
                  const done = completed.includes(index);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleItem(index)}
                      aria-pressed={done}
                      className={`flex min-h-12 w-full items-center gap-3 rounded-sm border px-4 text-left text-sm transition ${done ? "border-neon-green/50 bg-neon-green/[0.07] text-foreground" : "border-border/50 text-muted-foreground hover:border-neon-green/30"}`}
                    >
                      {done ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-neon-green" />
                      ) : (
                        <Circle className="h-4 w-4 shrink-0" />
                      )}
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-16 md:py-24">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_.85fr]">
            <article className="rounded-sm border border-neon-cyan/25 bg-[linear-gradient(135deg,oklch(0.7_0.16_195/0.08),transparent_55%)] p-6 sm:p-8">
              <div className="font-mono-tech text-[10px] uppercase tracking-[0.2em] text-neon-cyan">
                Laboratório · roteiro de 30 segundos
              </div>
              <h2 className="mt-3 font-display text-3xl sm:text-4xl">Use, adapte e grave.</h2>
              <blockquote className="mt-6 border-l-2 border-neon-green pl-5 text-lg leading-relaxed text-foreground/90">
                {PROJECT_SCRIPT}
              </blockquote>
              <button
                type="button"
                onClick={() => copyText("script", PROJECT_SCRIPT)}
                className="mt-6 inline-flex min-h-10 items-center gap-2 rounded-sm border border-neon-cyan/30 px-4 font-mono-tech text-[10px] uppercase tracking-widest text-neon-cyan transition hover:bg-neon-cyan/10"
              >
                <Copy className="h-3.5 w-3.5" />
                {copied === "script" ? "Roteiro copiado" : "Copiar roteiro"}
              </button>
            </article>

            <aside className="rounded-sm border border-border/60 bg-surface/30 p-6 sm:p-8">
              <div className="font-mono-tech text-[10px] uppercase tracking-[0.2em] text-neon-green">
                Critério de qualidade
              </div>
              <h2 className="mt-3 font-display text-3xl">Teste A/B consciente</h2>
              <ol className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
                <li>
                  <span className="mr-3 font-mono-tech text-neon-green">01</span>Gere uma versão
                  neutra e outra mais acolhedora.
                </li>
                <li>
                  <span className="mr-3 font-mono-tech text-neon-green">02</span>Altere somente
                  ritmo ou emoção, nunca tudo de uma vez.
                </li>
                <li>
                  <span className="mr-3 font-mono-tech text-neon-green">03</span>Escolha pela
                  compreensão da mensagem, não pelo efeito mais dramático.
                </li>
              </ol>
              {completed.length > 0 && (
                <button
                  type="button"
                  onClick={() => setCompleted([])}
                  className="mt-7 inline-flex items-center gap-2 font-mono-tech text-[9px] uppercase tracking-widest text-muted-foreground transition hover:text-foreground"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Reiniciar progresso
                </button>
              )}
            </aside>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-6 py-20 text-center md:py-28">
          <div className="font-mono-tech text-[10px] uppercase tracking-[0.22em] text-neon-green">
            Continue com a Veronica
          </div>
          <h2
            className="mt-4 font-display text-4xl sm:text-5xl"
            style={{ letterSpacing: "-0.045em", lineHeight: ".96" }}
          >
            A aula abre o caminho.
            <br />O pack acelera a execução.
          </h2>
          <p className="mx-auto mt-5 max-w-xl leading-relaxed text-muted-foreground">
            Acesse o Sprint Voz IA e leve os comandos, exercícios e modelos da aula para o seu
            próprio projeto.
          </p>
          <Link
            to="/prompt-packs"
            className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-sm bg-neon-green px-7 font-mono-tech text-[11px] uppercase tracking-[0.16em] text-primary-foreground shadow-glow-green transition hover:-translate-y-0.5 hover:brightness-110"
          >
            <Download className="h-4 w-4" /> Baixar material gratuito
          </Link>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
