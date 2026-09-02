import { Check, Wallet, Wand2, Mail, Newspaper, Layers } from "lucide-react";

// Prova real — cada item aqui é verificável no próprio código do repo, sem
// depoimento fabricado, sem estrela, sem número de avaliação inventado.
// Ver auditoria: courses.ts (11), higgsfield.ts (geração real), wallet-server.ts
// + mercadopago.ts (carteira/pagamento), auth-server.ts (login por e-mail),
// articles-server.ts (blog real no Neon).
const FACTS = [
  { icon: Layers, title: "11 formações", desc: "Catálogo completo, sem contagem inflada." },
  {
    icon: Wand2,
    title: "Geração real de imagem",
    desc: "Nano Banana Pro via Higgsfield, não mockup.",
  },
  {
    icon: Wallet,
    title: "Mercado Pago integrado",
    desc: "Depósito e saldo reais na carteira da Studio.",
  },
  {
    icon: Mail,
    title: "Login por e-mail",
    desc: "Conta única, sem senha, com código de confirmação.",
  },
  {
    icon: Newspaper,
    title: "Veronica Wire",
    desc: "Blog com artigos reais, publicados de verdade.",
  },
  {
    icon: Check,
    title: "7 ferramentas",
    desc: "Cada uma com rota, função e uso próprios no ecossistema.",
  },
];

export function ProofSection() {
  return (
    <div className="relative">
      <div className="relative mb-10">
        <div className="flex items-center gap-3 font-mono-tech text-[11px] uppercase tracking-widest text-neon-green">
          <span className="h-px w-8 bg-neon-green" />
          Prova real
        </div>
        <h2
          className="mt-3 font-display text-3xl sm:text-4xl md:text-5xl"
          style={{ letterSpacing: "-0.04em", lineHeight: "0.95" }}
        >
          Sem depoimento fabricado.
          <br />
          <span className="text-neon-green text-glow-green">Só o que existe de verdade</span>.
        </h2>
      </div>

      <div className="relative grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FACTS.map((f) => (
          <div
            key={f.title}
            className="group relative overflow-hidden rounded-sm border border-border/60 bg-surface/70 p-6 backdrop-blur transition hover:-translate-y-1 hover:border-neon-green/50 hover:shadow-glow-green"
          >
            <f.icon className="h-5 w-5 text-neon-green" />
            <div
              className="mt-4 font-display text-lg text-foreground"
              style={{ letterSpacing: "-0.02em" }}
            >
              {f.title}
            </div>
            <p className="mt-1.5 text-[13px] leading-[1.55] text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
