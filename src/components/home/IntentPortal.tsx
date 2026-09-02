import { Link } from "@tanstack/react-router";
import { Wand2, BookOpen, Briefcase, LineChart, ShieldCheck, ArrowUpRight } from "lucide-react";
import { useState } from "react";

// As cinco intenções centrais do Hub — cada uma leva a uma ferramenta real
// do ecossistema, não a um card genérico. O hover troca a cor de destaque
// pra criar uma resposta discreta, sem depender do shader da hero.
type Intent = {
  key: string;
  icon: typeof Wand2;
  label: string;
  desc: string;
  to: string;
  accent: "green" | "cyan";
};

const INTENTS: Intent[] = [
  {
    key: "criar",
    icon: Wand2,
    label: "Criar",
    desc: "Gere imagens e experiências com IA.",
    to: "/video-ia",
    accent: "green",
  },
  {
    key: "aprender",
    icon: BookOpen,
    label: "Aprender",
    desc: "Formações, projetos e conhecimento prático.",
    to: "/comandos",
    accent: "cyan",
  },
  {
    key: "trabalhar",
    icon: Briefcase,
    label: "Trabalhar",
    desc: "Currículo e ferramentas para carreira.",
    to: "/veronica-curriculo-certo",
    accent: "green",
  },
  {
    key: "analisar",
    icon: LineChart,
    label: "Analisar",
    desc: "Transforme métricas em decisões.",
    to: "/veronica-analytics",
    accent: "cyan",
  },
  {
    key: "proteger",
    icon: ShieldCheck,
    label: "Proteger",
    desc: "Diagnóstico e segurança digital.",
    to: "/veronica-security",
    accent: "green",
  },
];

export function IntentPortal() {
  const [active, setActive] = useState<string | null>(null);

  return (
    <nav
      aria-label="Escolha sua intenção"
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
    >
      {INTENTS.map((intent) => {
        const isGreen = intent.accent === "green";
        const isActive = active === intent.key;
        return (
          <Link
            key={intent.key}
            to={intent.to}
            onMouseEnter={() => setActive(intent.key)}
            onMouseLeave={() => setActive(null)}
            onFocus={() => setActive(intent.key)}
            onBlur={() => setActive(null)}
            className={`group relative flex flex-col justify-between overflow-hidden rounded-sm border p-4 backdrop-blur transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:p-5 ${
              isGreen
                ? "border-neon-green/25 bg-background/50 hover:-translate-y-1 hover:border-neon-green/70 hover:bg-neon-green/[0.06] hover:shadow-glow-green focus-visible:ring-neon-green"
                : "border-neon-cyan/25 bg-background/50 hover:-translate-y-1 hover:border-neon-cyan/70 hover:bg-neon-cyan/[0.06] hover:shadow-glow-cyan focus-visible:ring-neon-cyan"
            }`}
          >
            {/* Corner brackets — discretos, só se expandem no hover/foco */}
            <span
              aria-hidden
              className={`pointer-events-none absolute left-2 top-2 h-3 w-3 border-l border-t opacity-40 transition-all duration-300 group-hover:h-4 group-hover:w-4 group-hover:opacity-90 ${
                isGreen ? "border-neon-green" : "border-neon-cyan"
              }`}
            />
            <span
              aria-hidden
              className={`pointer-events-none absolute bottom-2 right-2 h-3 w-3 border-b border-r opacity-40 transition-all duration-300 group-hover:h-4 group-hover:w-4 group-hover:opacity-90 ${
                isGreen ? "border-neon-green" : "border-neon-cyan"
              }`}
            />

            <div className="flex items-start justify-between">
              <intent.icon
                className={`h-5 w-5 transition-transform duration-300 group-hover:scale-110 ${
                  isGreen ? "text-neon-green" : "text-neon-cyan"
                }`}
              />
              <ArrowUpRight
                className={`h-3.5 w-3.5 text-muted-foreground/50 transition-all duration-300 ${
                  isActive ? "translate-x-0.5 -translate-y-0.5 opacity-100" : "opacity-0"
                } ${isGreen ? "group-hover:text-neon-green" : "group-hover:text-neon-cyan"}`}
              />
            </div>

            <div className="mt-6">
              <div className="font-mono-tech text-[10px] uppercase tracking-widest text-foreground sm:text-[11px]">
                {intent.label}
              </div>
              <p className="mt-1.5 text-[11.5px] leading-[1.5] text-muted-foreground sm:text-xs">
                {intent.desc}
              </p>
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
