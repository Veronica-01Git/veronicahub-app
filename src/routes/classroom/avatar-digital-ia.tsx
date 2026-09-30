import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Circle,
  MessageCircle,
  Play,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/SiteChrome";
import { VeronicaDrawer } from "@/components/VeronicaDrawer";

export const Route = createFileRoute("/classroom/avatar-digital-ia")({
  component: AvatarClassroom,
  head: () => ({
    meta: [
      { title: "Classroom — Avatar Digital IA | Escola Veronica" },
      {
        name: "description",
        content: "Prévia prática do Classroom Veronica para a formação Avatar Digital IA.",
      },
    ],
  }),
});

const CHECKS = [
  "Defini o público do avatar",
  "Escrevi a personalidade em 3 palavras",
  "Escolhi uma função clara para o avatar",
  "Defini o que o avatar nunca deve fingir ser",
  "Escrevi um roteiro de apresentação de até 45 segundos",
];

const STORAGE_KEY = "veronica-classroom-avatar-digital-v1";

function AvatarClassroom() {
  const [tutorOpen, setTutorOpen] = useState(false);
  const [completed, setCompleted] = useState<number[]>([]);
  const [brief, setBrief] = useState({
    purpose: "",
    audience: "",
    personality: "",
    visual: "",
  });

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved) as {
        completed?: number[];
        brief?: typeof brief;
      };
      if (Array.isArray(parsed.completed)) setCompleted(parsed.completed);
      if (parsed.brief) setBrief(parsed.brief);
    } catch {
      // O classroom continua utilizável mesmo sem armazenamento local.
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ completed, brief }));
    } catch {
      // Progresso local é melhoria, não requisito.
    }
  }, [completed, brief]);

  const progress = useMemo(
    () => Math.round((completed.length / CHECKS.length) * 100),
    [completed],
  );

  function toggle(index: number) {
    setCompleted((current) =>
      current.includes(index) ? current.filter((item) => item !== index) : [...current, index],
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <VeronicaDrawer
        skillId="school"
        open={tutorOpen}
        stepId={null}
        onClose={() => setTutorOpen(false)}
      />
      <SiteHeader />

      <main>
        <section className="border-b border-border/40 bg-[#020706]">
          <div className="mx-auto max-w-7xl px-6 py-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <Link
                  to="/formacoes/avatar-digital-ia"
                  className="inline-flex items-center gap-2 font-mono-tech text-[9px] uppercase tracking-[.18em] text-muted-foreground transition hover:text-neon-green"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Formação
                </Link>
                <div className="mt-2 font-display text-2xl">Avatar Digital IA</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden text-right sm:block">
                  <div className="font-mono-tech text-[8px] uppercase tracking-[.18em] text-muted-foreground">
                    Progresso da prévia
                  </div>
                  <div className="mt-1 font-display text-xl text-neon-green">{progress}%</div>
                </div>
                <button
                  type="button"
                  onClick={() => setTutorOpen(true)}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-neon-green/35 bg-neon-green/[.05] px-5 font-mono-tech text-[9px] uppercase tracking-[.16em] text-neon-green transition hover:bg-neon-green/10"
                >
                  <MessageCircle className="h-4 w-4" /> Perguntar à Veronica
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-8 px-6 py-10 lg:grid-cols-[1.2fr_.8fr]">
          <div>
            <div className="overflow-hidden rounded-[26px] border border-neon-green/25 bg-black shadow-[0_35px_100px_-55px_oklch(0.84_0.2_155/.55)]">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <div className="font-mono-tech text-[9px] uppercase tracking-[.2em] text-neon-green">
                  Module 01 / Identity first
                </div>
                <span className="font-mono-tech text-[8px] uppercase tracking-[.18em] text-white/35">
                  Preview
                </span>
              </div>
              <div className="relative aspect-video overflow-hidden bg-[radial-gradient(circle_at_60%_40%,rgba(70,255,185,.16),transparent_24%),linear-gradient(135deg,#07110f,#020303)]">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-neon-green/40 bg-neon-green/10 text-neon-green shadow-glow-green">
                      <Play className="ml-1 h-6 w-6" />
                    </div>
                    <div className="mt-5 font-display text-3xl text-white">Identidade antes da imagem</div>
                    <p className="mx-auto mt-3 max-w-md px-6 text-sm leading-6 text-white/48">
                      Espaço preparado para a aula final. Enquanto o vídeo oficial não é publicado,
                      o laboratório abaixo já entrega a atividade completa da prévia.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <section className="mt-8 rounded-[26px] border border-border/60 bg-surface/30 p-6 sm:p-8">
              <div className="font-mono-tech text-[9px] uppercase tracking-[.22em] text-neon-cyan">
                Laboratório 01
              </div>
              <h1 className="mt-3 font-display text-4xl sm:text-5xl">
                Escreva o DNA do avatar antes de gerar o rosto.
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-muted-foreground">
                Um avatar consistente não nasce de um prompt visual enorme. Ele nasce de decisões
                que continuam verdadeiras quando roupa, cenário e câmera mudam.
              </p>

              <div className="mt-8 grid gap-5 sm:grid-cols-2">
                {[
                  ["purpose", "Função do avatar", "Ex.: apresentar aulas, explicar produtos, responder dúvidas"],
                  ["audience", "Público", "Ex.: pequenos empreendedores começando com IA"],
                  ["personality", "Personalidade em 3 palavras", "Ex.: clara, curiosa, objetiva"],
                  ["visual", "Assinatura visual", "Ex.: preto + verde mineral, luz lateral, fundo arquitetônico"],
                ].map(([key, label, placeholder]) => (
                  <label key={key} className="block">
                    <span className="font-mono-tech text-[9px] uppercase tracking-[.16em] text-muted-foreground">
                      {label}
                    </span>
                    <textarea
                      value={brief[key as keyof typeof brief]}
                      onChange={(e) =>
                        setBrief((current) => ({ ...current, [key]: e.target.value }))
                      }
                      placeholder={placeholder}
                      rows={4}
                      className="mt-2 w-full resize-none rounded-2xl border border-border/60 bg-background/60 p-4 text-sm leading-6 text-foreground outline-none transition placeholder:text-muted-foreground/45 focus:border-neon-green/45"
                    />
                  </label>
                ))}
              </div>
            </section>

            <section className="mt-8 rounded-[26px] border border-border/60 bg-background/70 p-6 sm:p-8">
              <div className="font-mono-tech text-[9px] uppercase tracking-[.22em] text-neon-green">
                Roteiro de apresentação
              </div>
              <div className="mt-5 rounded-2xl border border-neon-green/20 bg-neon-green/[.035] p-5 text-sm leading-7 text-foreground/85">
                “Eu sou [NOME/FUNÇÃO]. Estou aqui para ajudar [PÚBLICO] a [RESULTADO].
                Minha forma de explicar é [PERSONALIDADE]. Quando eu não souber algo, vou dizer com
                clareza — e nunca vou fingir experiência, identidade ou autoridade que não tenho.”
              </div>
              <p className="mt-4 text-xs leading-6 text-muted-foreground">
                Adapte o texto à sua marca. A transparência faz parte da identidade do avatar, não é
                um aviso escondido no final.
              </p>
            </section>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <section className="rounded-[26px] border border-border/60 bg-surface/35 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-mono-tech text-[9px] uppercase tracking-[.2em] text-muted-foreground">
                    Entrega da prévia
                  </div>
                  <div className="mt-2 font-display text-3xl">{progress}%</div>
                </div>
                <Sparkles className="h-5 w-5 text-neon-green" />
              </div>
              <div className="mt-5 h-1 overflow-hidden rounded-full bg-border/70">
                <div
                  className="h-full bg-neon-green transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="mt-6 space-y-2">
                {CHECKS.map((item, index) => {
                  const done = completed.includes(index);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggle(index)}
                      className={`flex w-full items-start gap-3 rounded-2xl border px-4 py-3 text-left text-sm transition ${
                        done
                          ? "border-neon-green/35 bg-neon-green/[.045] text-foreground"
                          : "border-border/55 text-muted-foreground hover:border-neon-green/25"
                      }`}
                    >
                      {done ? (
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-neon-green" />
                      ) : (
                        <Circle className="mt-0.5 h-4 w-4 shrink-0" />
                      )}
                      {item}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="rounded-[26px] border border-neon-green/25 bg-[#04100e] p-6 text-white">
              <MessageCircle className="h-5 w-5 text-neon-green" />
              <h2 className="mt-4 font-display text-3xl">Travou? Pergunte.</h2>
              <p className="mt-3 text-sm leading-6 text-white/48">
                A Veronica Tutor já conhece o método da Escola, a trilha CREATE e os princípios de
                criação responsável de avatar.
              </p>
              <button
                type="button"
                onClick={() => setTutorOpen(true)}
                className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-neon-green px-5 font-mono-tech text-[9px] uppercase tracking-[.16em] text-primary-foreground"
              >
                Abrir Veronica Tutor <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </section>

            <section className="rounded-[26px] border border-border/60 p-6">
              <div className="font-mono-tech text-[9px] uppercase tracking-[.18em] text-muted-foreground">
                Próximo
              </div>
              <h2 className="mt-3 font-display text-2xl">02 · Voz e presença</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Em produção. Esta página não libera módulos que ainda não possuem conteúdo validado.
              </p>
              <div className="mt-5 inline-flex items-center gap-2 text-xs text-muted-foreground">
                <Check className="h-3.5 w-3.5 text-neon-green" /> Roadmap visível, acesso honesto
              </div>
            </section>
          </aside>
        </section>
      </main>
    </div>
  );
}
