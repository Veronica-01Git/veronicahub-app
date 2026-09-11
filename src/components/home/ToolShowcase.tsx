import { Link } from "@tanstack/react-router";
import { ArrowRight, BarChart3, FileText, ShieldCheck, Wand2 } from "lucide-react";
import { product } from "@/lib/ecosystem";

const tools = [
  {
    product: product("studio"),
    icon: Wand2,
    audience: "Para criar imagens e ativos visuais com IA.",
    action: "Gerar uma imagem",
  },
  {
    product: product("analytics"),
    icon: BarChart3,
    audience: "Para testar cálculos de engajamento e explorar o protótipo.",
    action: "Abrir demonstração",
  },
  {
    product: product("career"),
    icon: FileText,
    audience: "Para revisar um currículo e prepará-lo para processos seletivos.",
    action: "Avaliar currículo",
  },
  {
    product: product("security"),
    icon: ShieldCheck,
    audience: "Para identificar riscos básicos na sua presença digital.",
    action: "Fazer autoavaliação",
  },
];

export function ToolShowcase() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-16 md:py-20">
      <div className="max-w-3xl">
        <p className="font-mono-tech text-xs uppercase tracking-[0.18em] text-neon-green">
          Ferramentas para executar
        </p>
        <h2 className="mt-3 font-display text-3xl leading-tight tracking-[-0.035em] sm:text-4xl md:text-5xl">
          Ambientes para transformar aprendizado em ação.
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
          Cada ferramenta informa seu escopo atual e leva apenas para uma ação que já existe.
        </p>
      </div>
      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {tools.map((tool) => (
          <Link
            key={tool.product.id}
            to={tool.product.to}
            className="group rounded-md border border-border/45 bg-surface/30 p-6 transition hover:border-neon-green/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-green"
          >
            <div className="flex items-center justify-between gap-4">
              <tool.icon className="h-6 w-6 text-neon-green" />
              <span className="rounded-full border border-border/60 px-3 py-1 font-mono-tech text-[11px] uppercase tracking-wider text-muted-foreground">
                {tool.product.status}
              </span>
            </div>
            <h3 className="mt-6 font-display text-2xl">{tool.product.name}</h3>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {tool.product.description}. {tool.audience}
            </p>
            <span className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-neon-green">
              {tool.action} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
