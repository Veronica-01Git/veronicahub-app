import { Link, createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowRight,
  Award,
  Dumbbell,
  Instagram,
  Loader2,
  MessageCircle,
  MessagesSquare,
  Salad,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";

import { VeronicaSeal } from "@/components/VeronicaSeal";
import {
  A_CONFIRMAR,
  LZ_IMAGE_SLOTS,
  LZ_SEAL_SERIAL,
  lzAbout,
  lzAuthority,
  lzConversion,
  lzHero,
  lzIdentity,
  lzMethod,
  lzValues,
  pickUtm,
  whatsappLink,
  type LzImageSlot,
  type LzUtm,
} from "@/features/lz-team/content";
import {
  getLzTeamImages,
  submitLzTeamApplication,
  type LzImageMap,
} from "@/features/lz-team/page.functions";
import { findSeal } from "@/lib/seals";

const TITLE = "LZ Training Club · Coach Lucas Tomaz — Consultoria de Alta Performance";
const DESCRIPTION =
  "Consultoria estratégica do Coach Lucas Tomaz (CREF 006936-PJ/SC): treino com execução correta, planejamento alimentar dinâmico e feedback quinzenal. Experts em hipertrofia e definição.";

/**
 * Página PÚBLICA do LZ Team. Não existe middleware em /clientes/*: cada
 * ambiente privado se protege sozinho chamando `getWorkspaceAccess` no
 * servidor. Esta rota estática só tem precedência sobre `/clientes/$clientSlug`
 * para o endereço exato `/clientes/lz-team` — nenhuma outra rota do namespace
 * muda. O workspace privado do LZ continua atrás do selo em
 * `/clientes/lz-team/painel`.
 */
export const Route = createFileRoute("/clientes/lz-team/")({
  loader: () => getLzTeamImages(),
  component: LzTeamPage,
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://veronicahub.com/clientes/lz-team" },
    ],
    links: [
      { rel: "canonical", href: "https://veronicahub.com/clientes/lz-team" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;600;700&display=swap",
      },
    ],
  }),
});

// Identidade da marca do cliente (mesma do roteiro de VSL): verde #00ffa3
// sobre preto. Fica escopada à página, como a paleta da Veronica Náutica —
// o resto do Hub segue com os próprios tokens. Neutros (texto, bordas) vêm
// dos tokens escuros do Hub.
const lzTheme = {
  "--lz-accent": "#00ffa3",
  "--lz-bg": "#050807",
  "--lz-surface": "#0b110f",
  "--lz-line": "rgba(0, 255, 163, 0.18)",
} as CSSProperties;

const DISPLAY = { fontFamily: '"Chakra Petch", var(--font-display)' } as CSSProperties;

function useCampaignUtm(): LzUtm {
  const [utm, setUtm] = useState<LzUtm>({});
  useEffect(() => {
    setUtm(pickUtm(window.location.search));
  }, []);
  return utm;
}

function LzTeamPage() {
  const images = Route.useLoaderData();
  const utm = useCampaignUtm();
  const primaryHref = whatsappLink(`Olá, Coach Lucas! ${lzHero.primaryCta}.`, utm);
  const applyHref = whatsappLink(`Olá, Coach Lucas! Quero ${lzConversion.cta.toLowerCase()}.`, utm);

  return (
    <div
      style={lzTheme}
      className="min-h-screen overflow-x-hidden bg-[var(--lz-bg)] font-mono text-foreground selection:bg-[var(--lz-accent)] selection:text-black"
    >
      <TopBar />
      <main>
        <Hero images={images} primaryHref={primaryHref} />
        <AuthorityStrip />
        <Method />
        <About images={images} />
        <Stage images={images} />
        <Training images={images} />
        <Manifesto />
        <Conversion utm={utm} applyHref={applyHref} />
      </main>
      <Footer />
      <StickyMobileCta href={primaryHref} />
    </div>
  );
}

/* ───────────────────────── blocos de apoio ───────────────────────── */

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-[10px] uppercase tracking-[.28em] text-[var(--lz-accent)]">
      <span aria-hidden className="h-px w-6 bg-[var(--lz-accent)]" />
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2
      style={DISPLAY}
      className="mt-4 text-balance text-3xl font-bold uppercase leading-[1.02] tracking-[-.01em] sm:text-5xl"
    >
      {children}
    </h2>
  );
}

function PrimaryButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={DISPLAY}
      className="inline-flex min-h-12 items-center justify-center gap-2 bg-[var(--lz-accent)] px-6 text-sm font-bold uppercase tracking-[.08em] text-black shadow-[0_0_32px_rgba(0,255,163,.35)] transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lz-accent)] [clip-path:polygon(0_0,calc(100%-12px)_0,100%_12px,100%_100%,12px_100%,0_calc(100%-12px))]"
    >
      {children}
    </a>
  );
}

function GhostButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-h-12 items-center justify-center gap-2 border border-[var(--lz-line)] px-6 text-xs uppercase tracking-[.16em] text-foreground/85 transition hover:border-[var(--lz-accent)] hover:text-[var(--lz-accent)]"
    >
      {children}
    </a>
  );
}

/** Foto do MediaImage ou, enquanto não subir, o aviso [A CONFIRMAR]. */
function SlotImage({
  images,
  slot,
  className = "",
  eager = false,
}: {
  images: LzImageMap;
  slot: LzImageSlot;
  className?: string;
  eager?: boolean;
}) {
  const image = images[slot];
  const meta = LZ_IMAGE_SLOTS[slot];
  if (!image) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-2 border border-dashed border-[var(--lz-line)] bg-[var(--lz-surface)] p-6 text-center ${className}`}
      >
        <span className="text-[11px] uppercase tracking-[.2em] text-[var(--lz-accent)]">
          {A_CONFIRMAR}
        </span>
        <span className="max-w-[16rem] text-xs leading-relaxed text-muted-foreground">
          {meta.alt}
        </span>
      </div>
    );
  }
  return (
    <img
      src={image.url}
      alt={image.alt ?? meta.alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      className={`object-cover ${className}`}
    />
  );
}

/* ───────────────────────── seções ───────────────────────── */

function TopBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--lz-line)] bg-[var(--lz-bg)]/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <a href="#topo" style={DISPLAY} className="text-sm font-bold uppercase tracking-[.14em]">
          LZ <span className="text-[var(--lz-accent)]">Training</span> Club
        </a>
        <a
          href={lzIdentity.instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center gap-2 text-[10px] uppercase tracking-[.18em] text-muted-foreground transition hover:text-[var(--lz-accent)]"
        >
          <Instagram className="h-4 w-4" aria-hidden />
          <span className="hidden sm:inline">{lzIdentity.instagramHandle}</span>
        </a>
      </div>
    </header>
  );
}

function Hero({ images, primaryHref }: { images: LzImageMap; primaryHref: string }) {
  return (
    <section
      id="topo"
      className="relative isolate overflow-hidden border-b border-[var(--lz-line)]"
    >
      {/* Grade e scanline: o "HUD" do roteiro de VSL. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-60 [background-image:linear-gradient(rgba(0,255,163,.07)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,163,.07)_1px,transparent_1px)] [background-size:28px_28px] [mask-image:radial-gradient(ellipse_at_60%_40%,black_30%,transparent_75%)]"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 -z-10 h-24 bg-gradient-to-b from-[rgba(0,255,163,.12)] to-transparent motion-safe:animate-[lz-scan_6s_linear_infinite]"
      />
      <style>{`@keyframes lz-scan{0%{transform:translateY(-100%)}100%{transform:translateY(900%)}}`}</style>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 pb-14 pt-10 sm:px-6 md:grid-cols-[1.1fr_.9fr] md:items-center md:pb-20 md:pt-16">
        <div>
          <Eyebrow>{lzIdentity.bio[0]}</Eyebrow>
          <h1
            style={DISPLAY}
            className="mt-5 text-balance text-[2.1rem] font-bold uppercase leading-[1] tracking-[-.015em] sm:text-5xl lg:text-6xl"
          >
            Eleve seu físico e sua mente ao{" "}
            <span className="text-[var(--lz-accent)] [text-shadow:0_0_24px_rgba(0,255,163,.45)]">
              próximo nível
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            …com a consultoria estratégica do Coach {lzIdentity.coach}.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <PrimaryButton href={primaryHref}>
              {lzHero.primaryCta} <ArrowRight className="h-4 w-4" aria-hidden />
            </PrimaryButton>
            <GhostButton href={lzIdentity.instagramUrl}>
              <Instagram className="h-4 w-4" aria-hidden /> {lzHero.secondaryCta}
            </GhostButton>
          </div>
          <p className="mt-8 max-w-md border-l-2 border-[var(--lz-accent)] pl-4 text-[11px] uppercase leading-relaxed tracking-[.14em] text-foreground/70">
            {lzHero.manifestoLine}
          </p>
        </div>

        {/* Foto de capa dentro de uma moldura HUD com anel orbital. */}
        <div className="relative mx-auto w-full max-w-sm md:max-w-none">
          <div
            aria-hidden
            className="absolute -inset-6 rounded-full border border-[var(--lz-line)] motion-safe:animate-[spin_40s_linear_infinite] before:absolute before:inset-6 before:rounded-full before:border before:border-dashed before:border-[rgba(0,255,163,.25)]"
          />
          <div className="relative border border-[var(--lz-line)] bg-[var(--lz-surface)] p-2 [clip-path:polygon(0_0,calc(100%-22px)_0,100%_22px,100%_100%,22px_100%,0_calc(100%-22px))]">
            <SlotImage images={images} slot="hero-coach" eager className="aspect-[4/5] w-full" />
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between border border-[var(--lz-line)] bg-black/70 px-3 py-2 text-[10px] uppercase tracking-[.16em] backdrop-blur">
              <span>
                Coach <span className="text-[var(--lz-accent)]">{lzIdentity.coach}</span>
              </span>
              <span className="text-muted-foreground">{lzIdentity.cref}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function AuthorityStrip() {
  return (
    <section
      aria-label="Autoridade"
      className="border-b border-[var(--lz-line)] bg-[var(--lz-surface)]"
    >
      <dl className="mx-auto grid max-w-6xl grid-cols-2 divide-[var(--lz-line)] px-4 sm:px-6 lg:grid-cols-4 lg:divide-x">
        {lzAuthority.map((item) => (
          <div key={item.label} className="px-2 py-6 lg:px-6">
            <dt className="sr-only">{item.label}</dt>
            <dd>
              <div
                style={DISPLAY}
                className="text-xl font-bold uppercase text-[var(--lz-accent)] sm:text-2xl"
              >
                {item.value}
              </div>
              <div className="mt-1 text-[11px] leading-snug text-muted-foreground">
                {item.label}
              </div>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

const PILLAR_ICONS = [Dumbbell, Salad, MessagesSquare];

function Method() {
  return (
    <section id="metodo" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
      <Eyebrow>O método</Eyebrow>
      <SectionTitle>3 pilares da alta performance</SectionTitle>
      <ol className="mt-10 grid gap-4 md:grid-cols-3">
        {lzMethod.pillars.map((pillar, index) => {
          const Icon = PILLAR_ICONS[index] ?? Dumbbell;
          return (
            <li
              key={pillar.title}
              className="group relative border border-[var(--lz-line)] bg-[var(--lz-surface)] p-6 transition hover:border-[var(--lz-accent)]"
            >
              <div className="flex items-center justify-between">
                <Icon className="h-6 w-6 text-[var(--lz-accent)]" aria-hidden />
                <span className="text-[10px] tracking-[.2em] text-muted-foreground">
                  0{index + 1}
                </span>
              </div>
              <h3 style={DISPLAY} className="mt-6 text-lg font-bold uppercase leading-tight">
                {pillar.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{pillar.body}</p>
            </li>
          );
        })}
      </ol>
      <p
        style={DISPLAY}
        className="mt-10 text-center text-lg font-semibold uppercase tracking-[.04em] text-[var(--lz-accent)] sm:text-2xl"
      >
        {lzMethod.closing}
      </p>
    </section>
  );
}

function About({ images }: { images: LzImageMap }) {
  return (
    <section id="coach" className="border-y border-[var(--lz-line)] bg-[var(--lz-surface)]">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-[.85fr_1.15fr] md:items-start md:py-24">
        <SlotImage images={images} slot="about-coach" className="aspect-[4/5] w-full" />
        <div>
          <Eyebrow>{lzAbout.eyebrow}</Eyebrow>
          <SectionTitle>{lzAbout.title}</SectionTitle>
          <p className="mt-5 max-w-xl text-sm leading-relaxed text-foreground/80 sm:text-base">
            {lzAbout.body}
          </p>
          <p className="mt-3 text-xs uppercase tracking-[.16em] text-muted-foreground">
            {lzIdentity.coachTitle} · {lzIdentity.cref}
          </p>
          <h3 style={DISPLAY} className="mt-10 text-xl font-bold uppercase">
            {lzAbout.educationTitle}
          </h3>
          <ul className="mt-5 grid gap-3">
            {lzAbout.education.map((item) => (
              <li
                key={item}
                className="flex gap-3 border border-[var(--lz-line)] bg-[var(--lz-bg)] p-4 text-sm leading-relaxed"
              >
                <Award className="mt-0.5 h-4 w-4 shrink-0 text-[var(--lz-accent)]" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function Stage({ images }: { images: LzImageMap }) {
  const photos: LzImageSlot[] = ["gallery-2", "gallery-3", "about-coach"];
  const certs: LzImageSlot[] = [
    "cert-tecnica-brutalidade",
    "cert-faixa-preta",
    "cert-international-seminar",
  ];
  return (
    <section id="palco" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
      <Eyebrow>Palco</Eyebrow>
      <SectionTitle>Vivendo o que prega</SectionTitle>
      <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-3">
        {photos.map((slot, index) => (
          <SlotImage
            key={slot}
            images={images}
            slot={slot}
            className={`aspect-[3/4] w-full ${index === 0 ? "col-span-2 md:col-span-1" : ""}`}
          />
        ))}
      </div>
      <h3 style={DISPLAY} className="mt-14 text-xl font-bold uppercase">
        Certificações
      </h3>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {certs.map((slot) => (
          <figure key={slot} className="border border-[var(--lz-line)] bg-[var(--lz-surface)] p-2">
            <SlotImage images={images} slot={slot} className="aspect-[4/3] w-full" />
            <figcaption className="px-2 pb-1 pt-3 text-xs text-muted-foreground">
              {LZ_IMAGE_SLOTS[slot].alt}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

function Training({ images }: { images: LzImageMap }) {
  return (
    <section id="treino" className="border-y border-[var(--lz-line)] bg-[var(--lz-surface)]">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
        <Eyebrow>Treino</Eyebrow>
        <SectionTitle>Na academia, lado a lado</SectionTitle>
        <div className="mt-10 grid gap-3 md:grid-cols-[1.3fr_.7fr]">
          <SlotImage images={images} slot="gallery-1" className="aspect-[4/3] w-full" />
          <SlotImage
            images={images}
            slot="hero-coach"
            className="aspect-[4/3] w-full md:aspect-auto md:h-full"
          />
        </div>
      </div>
    </section>
  );
}

function Manifesto() {
  return (
    <section id="manifesto" className="relative isolate overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(0,255,163,.16),transparent_60%)]"
      />
      <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6 md:py-28">
        <Eyebrow>Manifesto</Eyebrow>
        <p
          style={DISPLAY}
          className="mx-auto mt-6 max-w-4xl text-balance text-4xl font-bold uppercase leading-[.95] sm:text-6xl lg:text-7xl"
        >
          Não foi sorte.{" "}
          <span className="text-[var(--lz-accent)] [text-shadow:0_0_36px_rgba(0,255,163,.5)]">
            Foi processo.
          </span>
        </p>

        <ul className="mt-14 grid gap-4 text-left md:grid-cols-3">
          {lzValues.map((value) => (
            <li
              key={value.title}
              className="border-t-2 border-[var(--lz-accent)] bg-[var(--lz-surface)] p-6"
            >
              <h3 style={DISPLAY} className="text-2xl font-bold uppercase">
                {value.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{value.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Conversion({ utm, applyHref }: { utm: LzUtm; applyHref: string }) {
  const submit = useServerFn(submitLzTeamApplication);
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<{ message: string; whatsapp: boolean } | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === "sending") return;
    const form = new FormData(event.currentTarget);
    setState("sending");
    setError(null);
    try {
      const result = await submit({
        data: {
          name: form.get("name"),
          whatsapp: form.get("whatsapp"),
          goal: form.get("goal"),
          message: form.get("message"),
          website: form.get("website"),
          utm,
        },
      });
      if (result.ok) {
        setState("sent");
      } else {
        setState("idle");
        setError({ message: result.error, whatsapp: result.fallbackToWhatsapp });
      }
    } catch {
      setState("idle");
      setError({
        message: "Não foi possível enviar agora. Fale direto pelo WhatsApp.",
        whatsapp: true,
      });
    }
  }

  const field =
    "mt-2 w-full min-h-12 border border-[var(--lz-line)] bg-[var(--lz-bg)] px-4 text-base text-foreground placeholder:text-muted-foreground/60 focus:border-[var(--lz-accent)] focus:outline-none";

  return (
    <section id="aplicar" className="border-t border-[var(--lz-line)] bg-[var(--lz-surface)]">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 md:py-24">
        <div>
          <Eyebrow>Conversão</Eyebrow>
          <SectionTitle>{lzConversion.title}</SectionTitle>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground">
            {lzConversion.body}
          </p>
          <div className="mt-8">
            <PrimaryButton href={applyHref}>
              <MessageCircle className="h-4 w-4" aria-hidden /> Aplicar pelo WhatsApp
            </PrimaryButton>
          </div>
          <p className="mt-6 text-xs uppercase tracking-[.16em] text-muted-foreground">
            {lzIdentity.bio.join(" · ")}
          </p>
        </div>

        {state === "sent" ? (
          <div
            role="status"
            className="flex flex-col justify-center border border-[var(--lz-accent)] bg-[var(--lz-bg)] p-8"
          >
            <ShieldCheck className="h-7 w-7 text-[var(--lz-accent)]" aria-hidden />
            <h3 style={DISPLAY} className="mt-4 text-2xl font-bold uppercase">
              Aplicação recebida
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              O Coach Lucas vai retornar pelo WhatsApp que você informou.
            </p>
          </div>
        ) : (
          <form
            onSubmit={onSubmit}
            className="grid gap-5 border border-[var(--lz-line)] bg-[var(--lz-bg)] p-5 sm:p-8"
          >
            <label className="text-[11px] uppercase tracking-[.16em] text-muted-foreground">
              Nome
              <input
                name="name"
                required
                minLength={2}
                maxLength={120}
                autoComplete="name"
                className={field}
              />
            </label>
            <label className="text-[11px] uppercase tracking-[.16em] text-muted-foreground">
              WhatsApp com DDD
              <input
                name="whatsapp"
                required
                inputMode="tel"
                autoComplete="tel"
                placeholder="47 99999-9999"
                maxLength={32}
                className={field}
              />
            </label>
            <label className="text-[11px] uppercase tracking-[.16em] text-muted-foreground">
              Objetivo
              <select name="goal" className={field} defaultValue={lzConversion.goals[0]}>
                {lzConversion.goals.map((goal) => (
                  <option key={goal}>{goal}</option>
                ))}
              </select>
            </label>
            <label className="text-[11px] uppercase tracking-[.16em] text-muted-foreground">
              Conte um pouco da sua rotina (opcional)
              <textarea
                name="message"
                rows={4}
                maxLength={1500}
                className={`${field} min-h-28 py-3`}
              />
            </label>
            {/* Honeypot: invisível para pessoas. */}
            <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
              <label>
                Site
                <input name="website" tabIndex={-1} autoComplete="off" />
              </label>
            </div>
            {error ? (
              <div
                role="alert"
                className="border border-amber-400/40 bg-amber-400/[.06] p-4 text-sm text-amber-200"
              >
                {error.message}
                {error.whatsapp ? (
                  <a
                    href={applyHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 flex items-center gap-2 font-semibold text-[var(--lz-accent)] underline-offset-4 hover:underline"
                  >
                    <MessageCircle className="h-4 w-4" aria-hidden /> Abrir WhatsApp
                  </a>
                ) : null}
              </div>
            ) : null}
            <button
              type="submit"
              disabled={state === "sending"}
              style={DISPLAY}
              className="inline-flex min-h-12 items-center justify-center gap-2 bg-[var(--lz-accent)] px-6 text-sm font-bold uppercase tracking-[.08em] text-black transition hover:brightness-110 disabled:opacity-60"
            >
              {state === "sending" ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : null}
              {lzConversion.cta}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

function Footer() {
  const seal = findSeal(LZ_SEAL_SERIAL);
  return (
    <footer className="border-t border-[var(--lz-line)] pb-28 md:pb-10">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <div style={DISPLAY} className="text-lg font-bold uppercase tracking-[.12em]">
            LZ <span className="text-[var(--lz-accent)]">Training</span> Club
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Coach {lzIdentity.coach} · {lzIdentity.cref}
          </p>
          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-xs uppercase tracking-[.14em]">
            <a
              href={lzIdentity.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-2 text-muted-foreground hover:text-[var(--lz-accent)]"
            >
              <Instagram className="h-4 w-4" aria-hidden /> {lzIdentity.instagramHandle}
            </a>
            <a
              href={lzIdentity.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-2 text-muted-foreground hover:text-[var(--lz-accent)]"
            >
              <MessageCircle className="h-4 w-4" aria-hidden /> WhatsApp
            </a>
          </div>
          <p className="mt-8 text-xs text-muted-foreground">
            Desenvolvido por <span className="text-foreground">Yo Lab &amp; Co.</span>
          </p>
        </div>

        {seal ? (
          <Link
            to="/selo/$serial"
            params={{ serial: seal.serial }}
            className="group flex items-center gap-4 border border-[var(--lz-line)] bg-[var(--lz-surface)] p-4 transition hover:border-[var(--lz-accent)]"
          >
            <VeronicaSeal
              serialNumber={seal.serial}
              issuedTo={seal.client}
              issuedDate={seal.issuedAt}
              membership
              productName="MEMBRO"
              size="sm"
            />
            <div className="max-w-[15rem] text-[11px] leading-relaxed text-muted-foreground">
              <div className="uppercase tracking-[.16em] text-[var(--lz-accent)]">
                {seal.serial}
              </div>
              <p className="mt-2">
                Certificado de originalidade — Yo Lab &amp; Co., com curadoria de IA
                (Claude/Anthropic)
              </p>
              <span className="mt-2 inline-block uppercase tracking-[.14em] group-hover:text-[var(--lz-accent)]">
                Verificar selo →
              </span>
            </div>
          </Link>
        ) : null}
      </div>
    </footer>
  );
}

/** No celular, o CTA principal fica sempre ao alcance do polegar. */
function StickyMobileCta({ href }: { href: string }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--lz-line)] bg-[var(--lz-bg)]/95 p-3 backdrop-blur md:hidden">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        style={DISPLAY}
        className="flex min-h-12 w-full items-center justify-center gap-2 bg-[var(--lz-accent)] text-sm font-bold uppercase tracking-[.08em] text-black"
      >
        <MessageCircle className="h-4 w-4" aria-hidden /> {lzHero.primaryCta}
      </a>
    </div>
  );
}
