import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, MessageCircle, UserPlus, Package, Megaphone, Wallet, Flame } from "lucide-react";
import { SiteHeader, SiteFooter, SOCIAL_LINKS } from "@/components/SiteChrome";
import { HudAccent, GOLD } from "@/components/HoloOrbits";

export const Route = createFileRoute("/veronica-rede")({
  component: VeronicaRede,
  head: () => ({
    meta: [
      { title: "Veronica Rede — Programa em formação | Veronica Hub" },
      {
        name: "description",
        content: "Uma rede de revendedores usando o ecossistema Veronica pra divulgar e vender produtos em alta. Programa em formação — cadastro antecipado aberto.",
      },
      { property: "og:title", content: "Veronica Rede — Programa em formação" },
      { property: "og:description", content: "Escolha o produto, divulgue com as ferramentas Veronica, receba sua comissão." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

type Particle = { left: number; size: number; delay: number; duration: number; color: string };

const PARTICLE_COLORS = [GOLD, "oklch(0.85 0.22 155)", "oklch(0.88 0.15 195)"];

const PARTICLES: Particle[] = Array.from({ length: 9 }).map((_, i) => ({
  left: (i * 47 + 6) % 100,
  size: 5 + (i % 3) * 2,
  delay: i * 1.1,
  duration: 9 + (i % 4),
  color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
}));

// Reaproveitado no hero e na seção "Quero participar" — mesmo componente,
// sem duplicar a lógica das partículas subindo.
function RedeParticles() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 hidden overflow-hidden md:block">
      {PARTICLES.map((p, i) => (
        <span
          key={i}
          className="absolute rounded-full animate-rede-particle"
          style={{
            left: `${p.left}%`,
            bottom: "-6%",
            width: p.size,
            height: p.size,
            background: p.color,
            filter: "blur(1.5px)",
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}

// Fundo "ambiente rico" — gradiente animado de 3 cores + partículas + acento
// holográfico dourado. Reaproveitado no hero e no CTA final.
function RichEnvironment({ accentClassName }: { accentClassName: string }) {
  return (
    <>
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-rede-aurora md:animate-rede-aurora" />
      <RedeParticles />
      <HudAccent size={92} hue={GOLD} className={accentClassName} />
    </>
  );
}

const STEPS = [
  { icon: UserPlus, title: "Cadastro antecipado", desc: "Entre na lista agora e garanta prioridade quando o programa abrir oficialmente." },
  { icon: Package, title: "Escolha os produtos", desc: "Catálogo com itens em alta, já com preço de revenda definido — sem estoque parado." },
  { icon: Megaphone, title: "Divulgue com o ecossistema", desc: "Use Veronica Studio e Analytics pra criar o conteúdo e otimizar suas vendas." },
  { icon: Wallet, title: "Receba sua comissão", desc: "Cada venda feita pela sua rede cai direto — sem burocracia, sem enrolação." },
];

type Product = {
  name: string;
  price: string;
  original: string;
  discount: string;
  trending?: boolean;
};

const PRODUCTS: Product[] = [
  { name: "Fone Bluetooth TWS", price: "39,90", original: "79,90", discount: "-50%", trending: true },
  { name: "Mini Projetor Portátil", price: "129,90", original: "219,90", discount: "-41%" },
  { name: "Luminária LED RGB", price: "24,90", original: "49,90", discount: "-50%", trending: true },
  { name: "Garrafa Térmica Inox 1L", price: "34,90", original: "59,90", discount: "-42%" },
  { name: "Suporte Celular Veicular", price: "19,90", original: "39,90", discount: "-50%" },
  { name: "Kit Skincare Facial", price: "44,90", original: "89,90", discount: "-50%", trending: true },
  { name: "Câmera de Segurança Wi-Fi", price: "89,90", original: "159,90", discount: "-44%" },
  { name: "Mochila Anti-Furto", price: "69,90", original: "119,90", discount: "-42%" },
];

function buildWhatsappUrl(): string {
  const msg = "Quero saber mais sobre a Veronica Rede";
  return `${SOCIAL_LINKS.whatsapp}?text=${encodeURIComponent(msg)}`;
}

function VeronicaRede() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <SiteHeader />

      {/* Hero — ambiente rico: gradiente animado + partículas + holograma dourado */}
      <section className="relative overflow-hidden">
        <RichEnvironment accentClassName="absolute right-6 top-6 lg:right-14" />
        <div className="relative mx-auto max-w-4xl px-6 py-20 text-center md:py-28">
          <div className="mx-auto inline-flex items-center gap-3 rounded-full border border-gold/40 bg-background/60 px-4 py-1.5 font-mono-tech text-[10px] uppercase tracking-widest text-gold backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse-dot" />
            Programa em formação
          </div>
          <h1 className="mx-auto mt-8 font-display text-5xl sm:text-6xl md:text-7xl text-gradient-rede" style={{ letterSpacing: "-0.04em", lineHeight: "0.95" }}>
            Veronica Rede
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-[1.65] text-muted-foreground sm:text-lg">
            Uma rede de revendedores usando o ecossistema Veronica pra divulgar produtos em alta e vender todo dia —
            sem estoque, sem complicação.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <a
              href="#participar"
              className="group relative inline-flex items-center gap-3 overflow-hidden rounded-sm bg-gold px-7 py-4 font-mono-tech text-xs uppercase tracking-[0.18em] text-primary-foreground shadow-glow-gold transition duration-200 hover:-translate-y-0.5 hover:brightness-110"
            >
              Quero entrar na lista <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              <span aria-hidden className="pointer-events-none absolute inset-y-0 -left-full w-1/2 -skew-x-12 bg-white/25 transition-all duration-700 group-hover:left-[150%]" />
            </a>
            <a
              href="#produtos"
              className="group inline-flex items-center gap-2 rounded-sm border border-border/60 bg-background/40 px-7 py-4 font-mono-tech text-xs uppercase tracking-[0.18em] text-muted-foreground backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:border-gold/60 hover:text-gold"
            >
              Ver catálogo
            </a>
          </div>
        </div>
      </section>

      {/* Como funciona — transição gradual: dourado ainda presente, fundo
          diluindo em direção ao neutro conforme desce. */}
      <section
        className="relative py-24"
        style={{ background: "linear-gradient(180deg, oklch(0.75 0.15 85 / 0.1) 0%, var(--background) 85%)" }}
      >
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-14 flex flex-col gap-3 text-center">
            <div className="mx-auto flex items-center gap-3 font-mono-tech text-[11px] uppercase tracking-widest text-gold">
              <span className="h-px w-8 bg-gold" />
              Como funciona
              <span className="h-px w-8 bg-gold" />
            </div>
            <h2 className="mx-auto max-w-2xl font-display text-3xl sm:text-4xl md:text-5xl" style={{ letterSpacing: "-0.04em", lineHeight: "0.95" }}>
              Do cadastro à comissão, em 4 passos.
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <div
                key={s.title}
                className="flex flex-col gap-3 rounded-sm border p-6 backdrop-blur transition duration-300 hover:-translate-y-1"
                style={{ borderColor: "oklch(0.75 0.15 85 / 0.3)", boxShadow: "0 0 24px -12px oklch(0.75 0.15 85 / 0.35)" }}
              >
                <div className="flex items-center justify-between">
                  <s.icon className="h-6 w-6 text-gold" />
                  <span className="font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground/60">0{i + 1}</span>
                </div>
                <h3 className="font-display text-lg text-foreground" style={{ letterSpacing: "-0.02em" }}>{s.title}</h3>
                <p className="text-[13.5px] leading-[1.55] text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Grade de produtos — muda de registro: fundo sólido, denso, sem
          holograma nem animação. Só função: preço, desconto, decisão rápida. */}
      <section id="produtos" className="border-t border-border/40 bg-background py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-8 flex items-center gap-3 font-mono-tech text-[11px] uppercase tracking-widest text-muted-foreground">
            <span className="h-px w-8 bg-border" />
            Catálogo em alta
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {PRODUCTS.map((p) => (
              <div key={p.name} className="group relative overflow-hidden rounded-sm border border-border/60 bg-surface/70 transition hover:border-border">
                <div className="relative flex aspect-square items-center justify-center bg-surface-elevated">
                  <Package className="h-8 w-8 text-muted-foreground/40" />
                  {p.trending && (
                    <span className="absolute left-2 top-2 flex items-center gap-1 rounded-sm bg-destructive px-1.5 py-0.5 font-mono-tech text-[8.5px] uppercase tracking-widest text-destructive-foreground">
                      <Flame className="h-2.5 w-2.5" /> Tendência
                    </span>
                  )}
                  <span className="absolute right-2 top-2 rounded-sm bg-neon-green px-1.5 py-0.5 font-mono-tech text-[8.5px] uppercase tracking-widest text-primary-foreground">
                    {p.discount}
                  </span>
                </div>
                <div className="p-3">
                  <h3 className="line-clamp-2 text-[12.5px] leading-[1.3] text-foreground">{p.name}</h3>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="font-display text-base text-foreground">R$ {p.price}</span>
                    <span className="text-[11px] text-muted-foreground line-through">R$ {p.original}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-[12px] text-muted-foreground/70">
            Catálogo ilustrativo — os produtos definitivos são liberados na abertura oficial do programa.
          </p>
        </div>
      </section>

      {/* Quero participar — retoma a energia do hero, mesmo componente reaproveitado */}
      <section id="participar" className="relative overflow-hidden py-24">
        <RichEnvironment accentClassName="absolute left-6 bottom-6 lg:left-14" />
        <div className="relative mx-auto max-w-2xl px-6 text-center">
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl" style={{ letterSpacing: "-0.04em", lineHeight: "0.95" }}>
            Quero <span className="text-gradient-rede">participar</span>.
          </h2>
          <p className="mx-auto mt-5 max-w-lg leading-[1.65] text-muted-foreground">
            Entre na lista de espera da Veronica Rede pelo WhatsApp — sem compromisso, você é avisado assim que o
            programa abrir oficialmente.
          </p>
          <a
            href={buildWhatsappUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative mt-9 inline-flex items-center gap-3 overflow-hidden rounded-sm bg-gold px-9 py-4 font-mono-tech text-sm uppercase tracking-[0.18em] text-primary-foreground shadow-glow-gold transition duration-200 hover:-translate-y-0.5 hover:brightness-110"
          >
            <MessageCircle className="h-4 w-4" />
            Falar no WhatsApp
            <span aria-hidden className="pointer-events-none absolute inset-y-0 -left-full w-1/2 -skew-x-12 bg-white/25 transition-all duration-700 group-hover:left-[150%]" />
          </a>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
