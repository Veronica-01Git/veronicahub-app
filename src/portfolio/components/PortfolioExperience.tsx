import { useState } from "react";
import {
  ArrowRight,
  Bot,
  Check,
  Code2,
  Monitor,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { ARCHITECTURE_PACKAGES, ARCHITECTURE_PRODUCTS, PORTFOLIO_PLANS } from "../data/catalog";
import { SUPPORTED_PROFESSIONS } from "../config/sections";
import { createPortfolioDraft } from "../features/generator/create-draft";
import type { PortfolioDraft, PreviewDevice } from "../types";
import { PortfolioPreview } from "./PortfolioPreview";

const PROCESS = [
  "Conte sua trajetória",
  "A Veronica estrutura",
  "Você navega e analisa",
  "Edite e publique quando quiser",
];

export function PortfolioExperience() {
  const [name, setName] = useState("");
  const [profession, setProfession] = useState("Designer");
  const [draft, setDraft] = useState<PortfolioDraft | null>(null);
  const [device, setDevice] = useState<PreviewDevice>("desktop");
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);

  const generate = () => {
    setDraft(createPortfolioDraft(name, profession));
    setAnalysisOpen(false);
    window.setTimeout(
      () =>
        document
          .getElementById("portfolio-result")
          ?.scrollIntoView({ behavior: "smooth", block: "start" }),
      50,
    );
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#070b0d] text-white">
      <SiteHeader showAuth={false} />
      <main>
        <section className="relative overflow-hidden border-b border-white/10 px-6 pb-20 pt-16 md:pb-28 md:pt-24">
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(circle_at_70%_22%,rgba(23,244,143,0.16),transparent_30%),radial-gradient(circle_at_18%_80%,rgba(69,211,255,0.12),transparent_26%)]"
          />
          <div className="relative mx-auto grid max-w-7xl gap-14 lg:grid-cols-[1fr_0.85fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-300/5 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-emerald-200">
                <Sparkles className="h-3.5 w-3.5" /> Nova vertical · Veronica Portfolio
              </div>
              <h1 className="mt-7 max-w-4xl font-display text-5xl leading-[0.9] tracking-[-0.055em] sm:text-6xl md:text-7xl">
                Sua trajetória,
                <br />
                <span className="text-emerald-300">projetada para abrir portas.</span>
              </h1>
              <p className="mt-7 max-w-2xl text-base leading-relaxed text-white/60 md:text-lg">
                Transforme experiências, projetos e competências em um portfólio profissional
                completo — com estrutura, análise e presença da Veronica.
              </p>
              <a
                href="#create"
                className="mt-9 inline-flex min-h-12 items-center gap-3 rounded-full bg-emerald-300 px-6 font-semibold text-[#07100c] transition hover:-translate-y-0.5 hover:shadow-[0_0_36px_rgba(110,231,183,0.28)]"
              >
                Criar meu portfólio gratuitamente <ArrowRight className="h-4 w-4" />
              </a>
              <p className="mt-4 text-xs text-white/40">
                1 geração gratuita · sem cartão · pagamento ainda não conectado
              </p>
            </div>
            <div className="relative mx-auto w-full max-w-xl rounded-[2rem] border border-white/10 bg-white/[0.045] p-4 shadow-2xl backdrop-blur">
              <div className="rounded-[1.4rem] border border-white/10 bg-[#0d1417] p-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3 text-[10px] uppercase tracking-[0.15em] text-white/40">
                  <span>Portfolio intelligence</span>
                  <span className="text-emerald-300">Preview vivo</span>
                </div>
                <div className="mt-4 grid grid-cols-[0.75fr_1.25fr] gap-3">
                  <div className="aspect-[4/5] rounded-xl bg-[radial-gradient(circle_at_35%_30%,#67e8c4,transparent_34%),linear-gradient(145deg,#101820,#273c48_55%,#d8ff57)]" />
                  <div className="space-y-3 py-2">
                    <div className="h-2 w-24 rounded bg-emerald-300/60" />
                    <div className="h-5 w-full rounded bg-white/90" />
                    <div className="h-5 w-4/5 rounded bg-white/90" />
                    <div className="h-2 w-full rounded bg-white/15" />
                    <div className="h-2 w-3/4 rounded bg-white/15" />
                    <div className="grid grid-cols-2 gap-2 pt-4">
                      <div className="h-20 rounded-lg bg-white/5" />
                      <div className="h-20 rounded-lg bg-white/5" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-5 -left-5 rounded-2xl border border-emerald-300/25 bg-[#0b1214]/95 px-4 py-3 text-sm shadow-xl">
                <span className="block text-[10px] uppercase tracking-wider text-white/40">
                  Análise Veronica
                </span>
                <span className="mt-1 block text-emerald-200">Narrativa forte · 92/100</span>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-white/10 px-6 py-16">
          <div className="mx-auto max-w-7xl">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-emerald-300">
              Do zero ao portfólio navegável
            </p>
            <div className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 md:grid-cols-4">
              {PROCESS.map((step, index) => (
                <div key={step} className="bg-[#0a1012] p-6">
                  <span className="font-mono text-xs text-emerald-300">0{index + 1}</span>
                  <p className="mt-10 text-lg font-medium">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-16">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-emerald-300">
                  Feito para trajetórias reais
                </p>
                <h2 className="mt-4 max-w-3xl font-display text-4xl tracking-[-0.04em] md:text-5xl">
                  Uma estrutura flexível para diferentes talentos.
                </h2>
              </div>
              <p className="max-w-md text-sm leading-relaxed text-white/50">
                A narrativa muda com a profissão. A arquitetura permanece clara, responsiva e pronta
                para evoluir.
              </p>
            </div>
            <div className="mt-9 flex flex-wrap gap-2">
              {SUPPORTED_PROFESSIONS.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/10 bg-white/[0.035] px-4 py-2 text-sm text-white/70"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section
          id="create"
          className="scroll-mt-24 border-y border-white/10 bg-white/[0.025] px-6 py-20"
        >
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.75fr_1.25fr]">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-emerald-300">
                Geração gratuita
              </p>
              <h2 className="mt-4 font-display text-4xl tracking-[-0.04em] md:text-5xl">
                Crie uma primeira versão agora.
              </h2>
              <p className="mt-5 text-sm leading-relaxed text-white/50">
                Este MVP gera uma demonstração local e temporária. Nenhuma alteração é persistida e
                nenhum dado é enviado a um provider externo.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-[#0a1012] p-6 md:p-8">
              <div className="grid gap-5 md:grid-cols-2">
                <label className="text-sm text-white/60">
                  Seu nome
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Ex.: Marina Costa"
                    className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-white outline-none transition placeholder:text-white/25 focus:border-emerald-300/60"
                  />
                </label>
                <label className="text-sm text-white/60">
                  Área profissional
                  <select
                    value={profession}
                    onChange={(event) => setProfession(event.target.value)}
                    className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-[#11191c] px-4 text-white outline-none focus:border-emerald-300/60"
                  >
                    {SUPPORTED_PROFESSIONS.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
              </div>
              <button
                type="button"
                onClick={generate}
                className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-300 px-5 font-semibold text-[#07100c] transition hover:brightness-110"
              >
                <Sparkles className="h-4 w-4" />{" "}
                {draft ? "Gerar nova simulação" : "Gerar meu portfólio gratuito"}
              </button>
              <div className="mt-4 flex items-center gap-2 text-xs text-white/40">
                <ShieldCheck className="h-4 w-4 text-emerald-300" /> Simulação sem persistência · 1
                geração real será vinculada à conta em uma etapa futura
              </div>
            </div>
          </div>
        </section>

        {draft && (
          <section id="portfolio-result" className="scroll-mt-24 px-3 py-20 md:px-6">
            <div className="mx-auto max-w-7xl">
              <div className="mb-8 flex flex-col gap-5 rounded-2xl border border-white/10 bg-white/[0.035] p-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-sm text-emerald-200">
                    <Check className="h-4 w-4" /> Geração gratuita utilizada nesta simulação
                  </div>
                  <p className="mt-1 text-xs text-white/40">
                    Navegue no resultado; mudanças sugeridas não são persistidas.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="flex rounded-xl border border-white/10 p-1">
                    <button
                      type="button"
                      onClick={() => setDevice("desktop")}
                      aria-pressed={device === "desktop"}
                      className={`rounded-lg px-3 py-2 ${device === "desktop" ? "bg-white/10 text-emerald-200" : "text-white/40"}`}
                    >
                      <Monitor className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDevice("mobile")}
                      aria-pressed={device === "mobile"}
                      className={`rounded-lg px-3 py-2 ${device === "mobile" ? "bg-white/10 text-emerald-200" : "text-white/40"}`}
                    >
                      <Smartphone className="h-4 w-4" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAnalysisOpen((value) => !value)}
                    className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/70 hover:border-emerald-300/40"
                  >
                    Analisar portfólio
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssistantOpen((value) => !value)}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-300 px-4 py-2 text-sm font-semibold text-[#07100c]"
                  >
                    <Bot className="h-4 w-4" /> Conversar com Veronica
                  </button>
                </div>
              </div>
              {analysisOpen && (
                <div className="mb-6 grid gap-3 rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.06] p-5 md:grid-cols-3">
                  <div>
                    <span className="text-xs uppercase tracking-wider text-white/40">Clareza</span>
                    <strong className="mt-2 block text-2xl text-emerald-200">92/100</strong>
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wider text-white/40">
                      Diferenciação
                    </span>
                    <strong className="mt-2 block text-2xl text-emerald-200">86/100</strong>
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wider text-white/40">
                      Próxima melhoria
                    </span>
                    <p className="mt-2 text-sm text-white/65">
                      Troque os projetos demonstrativos por resultados verificáveis.
                    </p>
                  </div>
                </div>
              )}
              {assistantOpen && (
                <div className="mb-6 ml-auto max-w-xl rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.06] p-5">
                  <div className="flex gap-3">
                    <Bot className="mt-0.5 h-5 w-5 text-cyan-200" />
                    <div>
                      <p className="text-sm font-medium">Veronica · modo de simulação</p>
                      <p className="mt-2 text-sm leading-relaxed text-white/60">
                        Eu começaria fortalecendo o primeiro case com contexto, decisão e resultado.
                        Posso simular essa mudança, mas ela só será salva após o editor persistente
                        ser lançado.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <PortfolioPreview draft={draft} device={device} />
            </div>
          </section>
        )}

        <section className="border-y border-white/10 px-6 py-20">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-10 lg:grid-cols-2">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-cyan-200">
                  Construa com Veronica
                </p>
                <h2 className="mt-4 font-display text-4xl tracking-[-0.04em] md:text-5xl">
                  A experiência e a arquitetura podem crescer separadas.
                </h2>
                <p className="mt-5 max-w-xl text-sm leading-relaxed text-white/50">
                  Providers entram por contratos. Vidu, Veo, Seedance e futuros modelos serão
                  adaptadores — nunca dependências centrais.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {["AIProvider", "ImageProvider", "VideoProvider", "VoiceProvider"].map(
                  (provider) => (
                    <div
                      key={provider}
                      className="rounded-2xl border border-white/10 bg-white/[0.035] p-5"
                    >
                      <Code2 className="h-5 w-5 text-cyan-200" />
                      <p className="mt-8 font-mono text-sm">{provider}</p>
                      <p className="mt-2 text-xs text-white/40">
                        Interface estável · adaptadores substituíveis
                      </p>
                    </div>
                  ),
                )}
              </div>
            </div>
            <div className="mt-10 grid gap-3 md:grid-cols-3">
              {[
                { name: "Presence Engine", desc: "Vida visual leve e contínua." },
                { name: "Veronica Moments", desc: "Vídeos curtos previamente preparados." },
                { name: "Veronica Cinematic", desc: "Geração personalizada sob demanda." },
              ].map((level, index) => (
                <div key={level.name} className="rounded-2xl border border-white/10 p-5">
                  <span className="font-mono text-xs text-emerald-300">Nível {index + 1}</span>
                  <h3 className="mt-6 font-display text-xl">{level.name}</h3>
                  <p className="mt-2 text-sm text-white/45">{level.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-20">
          <div className="mx-auto max-w-7xl">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-emerald-300">
              Architecture Store · preview
            </p>
            <div className="mt-4 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <h2 className="max-w-3xl font-display text-4xl tracking-[-0.04em] md:text-5xl">
                Compre módulos licenciáveis, não o núcleo privado.
              </h2>
              <p className="max-w-md text-sm leading-relaxed text-white/50">
                Catálogo sanitizado para produtos próprios, startups e operações white-label.
              </p>
            </div>
            <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {ARCHITECTURE_PRODUCTS.map((product) => (
                <article
                  key={product.name}
                  className="group rounded-2xl border border-white/10 bg-white/[0.025] p-5 transition hover:-translate-y-1 hover:border-emerald-300/30"
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] uppercase tracking-wider text-white/35">
                      {product.category}
                    </span>
                    <strong className="text-sm text-emerald-200">{product.price}</strong>
                  </div>
                  <h3 className="mt-8 font-display text-xl">{product.name}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/45">
                    {product.description}
                  </p>
                  <button type="button" disabled className="mt-5 text-xs text-white/30">
                    Disponível após integração da fintech
                  </button>
                </article>
              ))}
            </div>
            <div className="mt-10 grid gap-3 md:grid-cols-5">
              {ARCHITECTURE_PACKAGES.map((item) => (
                <article key={item.name} className="rounded-2xl border border-white/10 p-5">
                  <p className="font-display text-lg">{item.name}</p>
                  <p className="mt-3 text-lg text-emerald-200">{item.price}</p>
                  <p className="mt-2 text-xs leading-relaxed text-white/40">{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-white/10 bg-white/[0.025] px-6 py-20">
          <div className="mx-auto max-w-7xl">
            <div className="text-center">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-emerald-300">
                Planos
              </p>
              <h2 className="mt-4 font-display text-4xl tracking-[-0.04em] md:text-5xl">
                Comece gratuito. Evolua quando fizer sentido.
              </h2>
            </div>
            <div className="mx-auto mt-10 grid max-w-5xl gap-4 md:grid-cols-3">
              {PORTFOLIO_PLANS.map((plan) => (
                <article
                  key={plan.name}
                  className={`rounded-[1.5rem] border p-6 ${plan.featured ? "border-emerald-300/45 bg-emerald-300/[0.07]" : "border-white/10 bg-[#0a1012]"}`}
                >
                  <h3 className="font-display text-xl">{plan.name}</h3>
                  <p className="mt-5 text-3xl font-semibold">{plan.price}</p>
                  <p className="mt-4 min-h-16 text-sm leading-relaxed text-white/50">
                    {plan.description}
                  </p>
                  <button
                    type="button"
                    onClick={
                      plan.price === "R$ 0"
                        ? () =>
                            document
                              .getElementById("create")
                              ?.scrollIntoView({ behavior: "smooth" })
                        : undefined
                    }
                    disabled={plan.price !== "R$ 0"}
                    className={`mt-6 min-h-11 w-full rounded-xl text-sm font-semibold ${plan.price === "R$ 0" ? "bg-emerald-300 text-[#07100c]" : "border border-white/10 text-white/35"}`}
                  >
                    {plan.price === "R$ 0" ? "Começar agora" : "Aguardar fintech"}
                  </button>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-24">
          <div className="mx-auto max-w-5xl rounded-[2rem] border border-emerald-300/20 bg-[radial-gradient(circle_at_80%_20%,rgba(103,232,196,0.14),transparent_28%),#0a1012] px-6 py-16 text-center md:px-14">
            <h2 className="font-display text-4xl tracking-[-0.045em] md:text-6xl">
              Seu melhor trabalho merece uma apresentação à altura.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-white/50">
              Gere a primeira estrutura, navegue pelo resultado e descubra o que precisa ficar mais
              forte.
            </p>
            <a
              href="#create"
              className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-full bg-emerald-300 px-6 font-semibold text-[#07100c]"
            >
              Criar meu portfólio gratuitamente <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
