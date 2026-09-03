import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, Wallet, Sparkles, Clock } from "lucide-react";

// Vitrine comercial real da Veronica Studio — só claims verificáveis no
// código de src/routes/video-ia.tsx: geração de imagem via Nano Banana Pro
// é real (Higgsfield), crédito grátis de cadastro é real, carteira +
// Mercado Pago são reais. Vídeo/voz/avatar ainda são simulados no cliente,
// por isso aparecem marcados "em desenvolvimento" — nunca como prontos.
const REAL_FACTS = [
  { icon: Check, text: "Geração de imagem real (Nano Banana Pro)" },
  { icon: Sparkles, text: "2 imagens grátis ao criar conta" },
  { icon: Wallet, text: "Carteira com depósito via Mercado Pago" },
  { icon: Clock, text: "Vídeo, voz e avatar: em desenvolvimento" },
];

export function StudioShowcase() {
  return (
    <section
      id="studio"
      className="relative overflow-hidden border-b border-border/40 bg-surface/40 py-24"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-cover bg-no-repeat opacity-[0.14]"
        style={{
          backgroundImage: "url(/images/home/portal-vortex.webp)",
          backgroundPosition: "center 30%",
          maskImage: "linear-gradient(180deg, transparent, black 30%, black 70%, transparent)",
          WebkitMaskImage:
            "linear-gradient(180deg, transparent, black 30%, black 70%, transparent)",
        }}
      />
      <div className="relative mx-auto max-w-3xl px-6 text-center">
        <div className="mx-auto flex items-center justify-center gap-3 font-mono-tech text-[11px] uppercase tracking-widest text-neon-green">
          <span className="h-px w-8 bg-neon-green" />
          Veronica Studio
          <span className="h-px w-8 bg-neon-green" />
        </div>
        <h2
          className="mx-auto mt-3 font-display text-4xl sm:text-5xl md:text-6xl"
          style={{ letterSpacing: "-0.04em", lineHeight: "0.95" }}
        >
          Peça. <span className="text-neon-green text-glow-green">Ela gera.</span>
          <br />
          Você recebe.
        </h2>
        <p className="mx-auto mt-5 max-w-md text-base leading-[1.65] text-muted-foreground">
          Descreva o que precisa e a Studio gera com IA de verdade — sem mockup, sem "em breve"
          disfarçado de pronto.
        </p>

        <ul className="mx-auto mt-8 flex w-fit flex-col gap-3 text-left">
          {REAL_FACTS.map((f) => (
            <li key={f.text} className="flex items-center gap-3 text-sm text-foreground/90">
              <f.icon className="h-4 w-4 flex-shrink-0 text-neon-green" />
              {f.text}
            </li>
          ))}
        </ul>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/video-ia"
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-sm bg-neon-green px-6 py-3.5 font-mono-tech text-xs uppercase tracking-[0.18em] text-primary-foreground shadow-glow-green transition duration-200 hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0"
          >
            Gerar minha primeira imagem grátis{" "}
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-0 -left-full w-1/2 -skew-x-12 bg-white/25 transition-all duration-700 group-hover:left-[150%]"
            />
          </Link>
        </div>
      </div>
    </section>
  );
}
