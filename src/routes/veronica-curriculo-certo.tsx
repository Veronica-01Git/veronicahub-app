import { createFileRoute, Link } from "@tanstack/react-router";
import type { CSSProperties } from "react";
import { HUB_URL } from "@/components/SiteChrome";

export const Route = createFileRoute("/veronica-curriculo-certo")({
  component: CurriculoCerto,
  head: () => ({
    meta: [
      { title: "Currículo Certo — Veronica Hub" },
      {
        name: "description",
        content:
          "O método Currículo Certo da Veronica: monte um currículo que passa em ATS, chama recrutador e converte em entrevista. Modelos + templates + roteiro.",
      },
      { property: "og:title", content: "Currículo Certo — Veronica Hub" },
      {
        property: "og:description",
        content: "Método completo pra montar o currículo que passa em ATS e chama recrutador.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

// Paper/document palette — deliberately breaks from the Hub's dark cyber theme,
// since this product is a career document tool, not a content/dev course.
const doc = {
  "--doc-paper": "#f7f6f2",
  "--doc-paper-raised": "#ffffff",
  "--doc-ink": "#201f1c",
  "--doc-ink-soft": "#5b5750",
  "--doc-ink-faint": "#948e83",
  "--doc-line": "#dedad1",
  "--doc-line-strong": "#c9c3b6",
  "--doc-accent": "#2e5940",
  "--doc-accent-soft": "#e4ece6",
  "--doc-red": "#b23a2e",
} as CSSProperties;

const sansStack = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const serifStack = '"Newsreader", Georgia, "Times New Roman", serif';

const headingSerif: CSSProperties = { fontFamily: serifStack, fontWeight: 400, letterSpacing: "-0.01em", lineHeight: 1.05 };
const headingSans: CSSProperties = { fontFamily: sansStack, fontWeight: 600, letterSpacing: "-0.005em", lineHeight: 1.2 };

const modules = [
  { code: "MOD. 01", tag: "Diagnóstico", title: "Diagnóstico da vaga", desc: "Leia a vaga certa antes de tocar no currículo. Palavras-chave, senioridade, stack." },
  { code: "MOD. 02", tag: "Estrutura", title: "Estrutura ATS-friendly", desc: "Template que passa filtro automatizado de RH sem perder o toque humano." },
  { code: "MOD. 03", tag: "Copy", title: "Copy que converte", desc: "Bullet points com verbo + resultado + métrica. Cada linha vende." },
  { code: "MOD. 04", tag: "IA", title: "IA como copiloto", desc: "Prompts prontos pra refinar, traduzir e adaptar o currículo em minutos." },
  { code: "MOD. 05", tag: "Presença", title: "Portfólio + LinkedIn", desc: "Alinhamento total entre currículo, LinkedIn e portfólio pra fechar a narrativa." },
  { code: "MOD. 06", tag: "Entrega", title: "Templates prontos", desc: "3 modelos editáveis (Docs + Notion + Figma) revisados pra entrega imediata." },
];

const deliverables = [
  { txt: "Template de currículo ATS-friendly", tag: "Google Docs" },
  { txt: "Checklist de revisão", tag: "10 pontos" },
  { txt: "Biblioteca de bullets prontos", tag: "Por área" },
  { txt: "Prompts de IA pra reescrever", tag: "Pronto pra usar" },
  { txt: "Guia de otimização do LinkedIn", tag: "Passo a passo" },
  { txt: "Aula de storytelling pra entrevista", tag: "Vídeo" },
];

function Stamp({ size = 132 }: { size?: number }) {
  const inner = Math.round(size * 0.72);
  return (
    <div
      className="flex flex-shrink-0 items-center justify-center rounded-full border-[2.5px]"
      style={{ width: size, height: size, borderColor: "var(--doc-accent)" }}
    >
      <div
        className="flex flex-col items-center justify-center gap-0.5 rounded-full border text-center uppercase"
        style={{ width: inner, height: inner, borderColor: "var(--doc-accent)", color: "var(--doc-accent)", fontFamily: "var(--font-mono)" }}
      >
        <span style={{ fontSize: size * 0.07, letterSpacing: "0.14em" }}>Aprovado</span>
        <span style={{ fontSize: size * 0.16, fontWeight: 700, letterSpacing: "0.02em" }}>ATS</span>
        <span style={{ fontSize: size * 0.065, letterSpacing: "0.1em" }}>✓ Passa no filtro</span>
      </div>
    </div>
  );
}

function CurriculoCerto() {
  return (
    <div
      className="relative min-h-screen overflow-x-hidden"
      style={{ ...doc, background: "var(--doc-paper)", color: "var(--doc-ink)", fontFamily: sansStack }}
    >
      {/* ruled-paper margin line — the one flourish tying back to the Hub's red hairline */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 hidden md:block"
        style={{
          left: "clamp(20px, 5.4vw, 76px)",
          width: "1px",
          background: "linear-gradient(to bottom, transparent 0%, var(--doc-red) 6%, var(--doc-red) 94%, transparent 100%)",
          opacity: 0.55,
        }}
      />

      <header
        className="flex items-center justify-between gap-6 border-b px-6 py-5 md:pl-[92px] md:pr-10"
        style={{ borderColor: "var(--doc-line)" }}
      >
        <Link
          to="/"
          className="flex items-baseline gap-2 font-mono-tech text-xs uppercase tracking-widest"
        >
          <span style={{ color: "var(--doc-ink-faint)" }}>Veronica ·</span>
          <span className="font-semibold" style={{ color: "var(--doc-accent)" }}>Currículo-Certo</span>
        </Link>
        <nav className="hidden items-center gap-7 font-mono-tech text-[11px] uppercase tracking-widest sm:flex" style={{ color: "var(--doc-ink-soft)" }}>
          <a href="#modulos" className="border-b border-transparent pb-0.5 transition hover:border-current" style={{ color: "inherit" }}>Método</a>
          <a href="#leva" className="border-b border-transparent pb-0.5 transition hover:border-current" style={{ color: "inherit" }}>O que você leva</a>
          <a
            href={HUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="border-b border-transparent pb-0.5 transition hover:border-current"
          >
            Hub
          </a>
        </nav>
      </header>

      <main className="md:pl-[92px] md:pr-10">
        {/* Hero */}
        <section
          className="grid grid-cols-1 items-start gap-10 border-b px-6 py-16 md:grid-cols-[1fr_auto] md:gap-12 md:px-0 md:py-24"
          style={{ borderColor: "var(--doc-line)" }}
        >
          <div className="max-w-xl">
            <div className="flex items-center gap-2.5 font-mono-tech text-[11px] uppercase tracking-widest" style={{ color: "var(--doc-accent)" }}>
              <span className="h-px w-5" style={{ background: "var(--doc-accent)" }} />
              Método · Currículo-Certo
            </div>
            <h1 className="mt-6 text-[42px] sm:text-6xl md:text-7xl" style={headingSerif}>
              Um currículo
              <br />
              não é biografia.
              <br />
              É <em className="not-italic" style={{ color: "var(--doc-accent)" }}>funil</em>.
            </h1>
            <p className="mt-6 max-w-md text-[17px] leading-[1.65]" style={{ color: "var(--doc-ink-soft)" }}>
              Monta o seu pra passar em ATS, chamar recrutador e virar entrevista — sem
              enfeite, sem parágrafo de "sobre mim" que ninguém lê.
            </p>
            <div className="mt-9 flex flex-wrap gap-3.5">
              <a
                href={HUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-[2px] px-6 py-3.5 font-mono-tech text-[11px] uppercase tracking-[0.12em] transition duration-150 hover:-translate-y-0.5"
                style={{ background: "var(--doc-accent)", color: "var(--doc-paper)", border: "1px solid var(--doc-accent)" }}
              >
                Quero o método
              </a>
              <a
                href="#modulos"
                className="rounded-[2px] border px-6 py-3.5 font-mono-tech text-[11px] uppercase tracking-[0.12em] transition duration-150 hover:-translate-y-0.5"
                style={{ borderColor: "var(--doc-line-strong)", color: "var(--doc-ink-soft)" }}
              >
                Ver módulos
              </a>
            </div>
          </div>
          <div className="justify-self-start opacity-0 animate-stamp-in md:justify-self-auto md:pt-24">
            <Stamp />
          </div>
        </section>

        {/* Modules */}
        <section id="modulos" className="border-b px-6 py-16 md:px-0 md:py-20" style={{ borderColor: "var(--doc-line)" }}>
          <div className="mb-11 flex max-w-xl flex-col gap-2.5">
            <div className="flex items-center gap-2 font-mono-tech text-[11px] uppercase tracking-widest" style={{ color: "var(--doc-ink-faint)" }}>
              <span style={{ color: "var(--doc-accent)" }}>§</span> Método em 6 etapas
            </div>
            <h2 className="text-3xl sm:text-[40px]" style={headingSerif}>Da vaga ao sim.</h2>
            <p className="text-[15.5px] leading-[1.6]" style={{ color: "var(--doc-ink-soft)" }}>
              Cada etapa existe porque resolve um ponto real de reprovação — não é conteúdo de recheio.
            </p>
          </div>
          <div
            className="grid grid-cols-1 gap-px border sm:grid-cols-2 lg:grid-cols-3"
            style={{ background: "var(--doc-line)", borderColor: "var(--doc-line)" }}
          >
            {modules.map((m) => (
              <div key={m.title} className="flex flex-col gap-3.5 p-6 transition" style={{ background: "var(--doc-paper-raised)" }}>
                <div className="flex items-center justify-between font-mono-tech text-[10.5px] uppercase tracking-widest" style={{ color: "var(--doc-ink-faint)" }}>
                  <span style={{ color: "var(--doc-accent)" }}>{m.code}</span>
                  <span>{m.tag}</span>
                </div>
                <h3 className="text-[19px]" style={headingSans}>{m.title}</h3>
                <p className="text-[13.5px] leading-[1.55]" style={{ color: "var(--doc-ink-soft)" }}>{m.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Deliverables */}
        <section id="leva" className="grid grid-cols-1 gap-12 border-b px-6 py-16 md:grid-cols-[0.9fr_1.1fr] md:px-0 md:py-20" style={{ borderColor: "var(--doc-line)" }}>
          <div>
            <div className="flex items-center gap-2 font-mono-tech text-[11px] uppercase tracking-widest" style={{ color: "var(--doc-ink-faint)" }}>
              <span style={{ color: "var(--doc-accent)" }}>§</span> O que vem na pasta
            </div>
            <h2 className="mt-2.5 text-[26px] sm:text-4xl" style={headingSerif}>
              Tudo pronto pra
              <br />
              usar no mesmo dia.
            </h2>
            <p className="mt-4 max-w-md text-[15px] leading-[1.65]" style={{ color: "var(--doc-ink-soft)" }}>
              Nada de teoria solta. Você entra na plataforma e sai com um currículo revisado,
              LinkedIn arrumado e um pitch pra entrevista.
            </p>
          </div>
          <div className="flex flex-col">
            {deliverables.map((d) => (
              <div
                key={d.txt}
                className="flex items-baseline gap-2.5 border-t py-4 last:border-b"
                style={{ borderColor: "var(--doc-line)" }}
              >
                <span className="font-mono-tech text-[13px]" style={{ color: "var(--doc-accent)" }}>✓</span>
                <span className="text-[15px]">{d.txt}</span>
                <span className="mb-1 min-w-6 flex-1 border-b border-dotted" style={{ borderColor: "var(--doc-line-strong)" }} />
                <span className="font-mono-tech text-[10px] uppercase tracking-widest" style={{ color: "var(--doc-ink-faint)" }}>{d.tag}</span>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="flex flex-wrap items-center justify-between gap-10 px-6 py-16 md:px-0 md:py-20">
          <div>
            <h2 className="max-w-[14ch] text-[30px] sm:text-5xl" style={headingSerif}>Chega de enviar no vazio.</h2>
            <p className="mt-4 max-w-md text-[15.5px] leading-[1.6]" style={{ color: "var(--doc-ink-soft)" }}>
              Entra pro Currículo-Certo e transforma envio em entrevista.
            </p>
            <a
              href={HUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7 inline-block rounded-[2px] px-7 py-4 font-mono-tech text-xs uppercase tracking-[0.12em] transition duration-150 hover:-translate-y-0.5"
              style={{ background: "var(--doc-accent)", color: "var(--doc-paper)", border: "1px solid var(--doc-accent)" }}
            >
              Garantir meu acesso
            </a>
          </div>
          <div style={{ transform: "rotate(8deg)" }}>
            <Stamp size={84} />
          </div>
        </section>
      </main>

      <footer
        className="flex flex-wrap items-center justify-between gap-4 border-t px-6 py-6 font-mono-tech text-[10.5px] uppercase tracking-widest md:px-10"
        style={{ borderColor: "var(--doc-line)", color: "var(--doc-ink-faint)" }}
      >
        <span>Veronica Hub © 2026</span>
        <Link to="/" className="transition hover:opacity-70">Voltar à Home</Link>
      </footer>
    </div>
  );
}
