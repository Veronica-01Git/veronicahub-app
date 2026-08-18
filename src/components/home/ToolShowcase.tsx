import { Link } from "@tanstack/react-router";
import { ArrowRight, FileText, BarChart3, ShieldCheck } from "lucide-react";

// Problema → solução → ação para as três ferramentas de resultado do
// ecossistema. Copy restrita ao que cada rota realmente entrega hoje —
// ver src/routes/veronica-curriculo-certo.tsx, veronica-analytics.tsx e
// veronica-security.tsx.
type Tool = {
  icon: typeof FileText;
  eyebrow: string;
  problem: string;
  solution: string;
  cta: string;
  to: string;
  accent: "green" | "cyan";
};

const TOOLS: Tool[] = [
  {
    icon: FileText,
    eyebrow: "Currículo-Certo",
    problem: "Seu currículo não deveria depender de tentativa e erro.",
    solution: "Avaliação gratuita orientada para passar em ATS e virar entrevista.",
    cta: "Avaliar meu currículo",
    to: "/veronica-curriculo-certo",
    accent: "green",
  },
  {
    icon: BarChart3,
    eyebrow: "Veronica Analytics",
    problem: "Pare de interpretar números no escuro.",
    solution: "Calculadora de engajamento e plano de ação para TikTok Shop.",
    cta: "Usar Analytics",
    to: "/veronica-analytics",
    accent: "cyan",
  },
  {
    icon: ShieldCheck,
    eyebrow: "Veronica Security",
    problem: "Descubra onde sua presença digital está exposta.",
    solution: "Triagem gratuita de segurança, em linguagem simples.",
    cta: "Fazer triagem",
    to: "/veronica-security",
    accent: "green",
  },
];

export function ToolShowcase() {
  return (
    <section className="relative mx-auto max-w-7xl px-6 py-24">
      <div className="mb-14 flex flex-col gap-3">
        <div className="flex items-center gap-3 font-mono-tech text-[11px] uppercase tracking-widest text-neon-cyan">
          <span className="h-px w-8 bg-neon-cyan" />
          Ferramentas de resultado
        </div>
        <h2
          className="font-display text-4xl sm:text-5xl md:text-6xl"
          style={{ letterSpacing: "-0.04em", lineHeight: "0.95" }}
        >
          Do diagnóstico <span className="text-neon-cyan text-glow-cyan">à ação</span>.
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {TOOLS.map((t) => {
          const isGreen = t.accent === "green";
          return (
            <Link
              key={t.eyebrow}
              to={t.to}
              className={`group relative flex flex-col overflow-hidden rounded-sm border border-border/60 bg-surface/70 p-6 backdrop-blur transition duration-300 hover:-translate-y-1 ${
                isGreen
                  ? "hover:border-neon-green/60 hover:shadow-glow-green"
                  : "hover:border-neon-cyan/60 hover:shadow-glow-cyan"
              }`}
            >
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-sm border ${isGreen ? "border-neon-green/50 text-neon-green" : "border-neon-cyan/50 text-neon-cyan"}`}
              >
                <t.icon className="h-5 w-5" />
              </div>
              <div className="mt-5 font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground">
                {t.eyebrow}
              </div>
              <h3
                className="mt-2 font-display text-xl text-foreground"
                style={{ letterSpacing: "-0.03em", lineHeight: "1.15" }}
              >
                {t.problem}
              </h3>
              <p className="mt-3 flex-1 text-sm leading-[1.6] text-muted-foreground">
                {t.solution}
              </p>
              <div
                className={`mt-6 flex items-center gap-2 font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground transition ${isGreen ? "group-hover:text-neon-green" : "group-hover:text-neon-cyan"}`}
              >
                {t.cta}{" "}
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
