import { useEffect, useRef, useState } from "react";
import { ArrowRight, Bot, Check, Monitor, ShieldCheck, Smartphone, Sparkles } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { PortfolioLanding } from "./PortfolioLanding";
import { SiteProjectBrief } from "./SiteProjectBrief";
import "../portfolio-lab.css";
import { SUPPORTED_PROFESSIONS } from "../config/sections";
import { createPortfolioDraft } from "../features/generator/create-draft";
import type { PortfolioDraft, PreviewDevice } from "../types";
import { PortfolioPreview } from "./PortfolioPreview";
import { BriefStorage, PersonalBriefFields } from "./PersonalBriefFields";
import { PortfolioAiPanel } from "./PortfolioAiPanel";
import { createPersonalDraft, emptyBrief, reviewDraft } from "../features/generator/personal-brief";
import { usePortfolioTools } from "../features/webmcp/use-portfolio-tools";
import type { PortfolioBrief } from "../features/webmcp/tools";

export function PortfolioExperience() {
  const [brief, setBrief] = useState(emptyBrief);
  const { name, profession } = brief;
  const [isDemo, setIsDemo] = useState(false);
  const [isAi, setIsAi] = useState(false);
  const [error, setError] = useState("");
  const resultHeading = useRef<HTMLHeadingElement>(null);
  const [draft, setDraft] = useState<PortfolioDraft | null>(null);
  const [device, setDevice] = useState<PreviewDevice>("desktop");
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [proposedBrief, setProposedBrief] = useState<PortfolioBrief | null>(null);
  usePortfolioTools(setProposedBrief);

  useEffect(() => {
    if (!draft) return;
    resultHeading.current?.focus({ preventScroll: true });
    resultHeading.current?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
      block: "start",
    });
  }, [draft]);

  const generate = () => {
    try {
      setDraft(createPersonalDraft(brief));
      setIsDemo(false);
      setIsAi(false);
      setError("");
      setAnalysisOpen(true);
      setAssistantOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Revise os campos do briefing.");
    }
  };
  const showExample = () => {
    setDraft(createPortfolioDraft("Alex Silva", "Designer"));
    setIsDemo(true);
    setIsAi(false);
    setAnalysisOpen(false);
    setAssistantOpen(false);
  };
  const review = draft ? reviewDraft(draft) : [];

  return (
    <div className="portfolio-lab min-h-screen overflow-x-hidden text-white">
      <SiteHeader brand="yo" showAuth={false} />
      <main>
        <PortfolioLanding onExample={showExample} />

        <section
          id="create"
          className="scroll-mt-24 border-y border-white/10 bg-white/[0.025] px-6 py-20"
        >
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.75fr_1.25fr]">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-emerald-300">
                Seu briefing
              </p>
              <h2 className="mt-4 font-display text-4xl tracking-[-0.04em] md:text-5xl">
                Seu portfólio começa aqui.
              </h2>
              <p className="mt-5 text-sm leading-relaxed text-white/50">
                Comece com seu nome e profissão. Depois, adicione os trabalhos que fazem você se
                destacar. Você pode ajustar tudo antes de decidir o próximo passo.
              </p>
              <button
                type="button"
                onClick={showExample}
                className="mt-6 min-h-11 rounded-xl border border-white/20 px-4 text-sm text-white/80 hover:border-emerald-300"
              >
                Ver exemplo fictício
              </button>
              <p className="mt-3 text-xs leading-relaxed text-white/50">
                Nome e profissão bastam para começar. Os demais campos são opcionais e melhoram sua
                apresentação.
              </p>
            </div>
            <form
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                generate();
              }}
              className="min-w-0 rounded-[1.5rem] border border-white/10 bg-[#0a1012] p-6 md:p-8"
            >
              {proposedBrief && (
                <div className="mb-5 rounded-xl border border-emerald-300/30 bg-emerald-300/5 p-4">
                  <p role="status" className="text-sm text-emerald-200">
                    Seu assistente preparou uma sugestão.
                  </p>
                  <p className="mt-2 break-words text-sm text-white/70">
                    {proposedBrief.name} · {proposedBrief.profession}
                  </p>
                  <p className="mt-2 text-xs text-white/50">
                    Revise antes de preencher. A prévia só é montada quando você selecionar Montar
                    prévia.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setBrief((current) => ({
                          ...current,
                          name: proposedBrief.name,
                          profession: proposedBrief.profession,
                        }));
                        setProposedBrief(null);
                        document
                          .getElementById("portfolio-owner-name")
                          ?.focus({ preventScroll: true });
                      }}
                      className="min-h-11 rounded-lg bg-emerald-300 px-4 text-sm font-medium text-[#07100c]"
                    >
                      Usar sugestão
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setProposedBrief(null);
                        document
                          .getElementById("portfolio-owner-name")
                          ?.focus({ preventScroll: true });
                      }}
                      className="min-h-11 rounded-lg border border-white/20 px-4 text-sm text-white/70"
                    >
                      Descartar
                    </button>
                  </div>
                </div>
              )}
              <div className="grid gap-5 md:grid-cols-2">
                <label className="text-sm text-white/60">
                  Seu nome
                  <input
                    id="portfolio-owner-name"
                    value={name}
                    required
                    maxLength={80}
                    autoComplete="name"
                    onChange={(event) =>
                      setBrief((current) => ({ ...current, name: event.target.value }))
                    }
                    placeholder="Ex.: Marina Costa"
                    className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-white outline-none transition placeholder:text-white/25 focus:border-emerald-300/60"
                  />
                </label>
                <label className="text-sm text-white/60">
                  Área profissional
                  <select
                    value={profession}
                    onChange={(event) =>
                      setBrief((current) => ({ ...current, profession: event.target.value }))
                    }
                    className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-[#11191c] px-4 text-white outline-none focus:border-emerald-300/60"
                  >
                    {SUPPORTED_PROFESSIONS.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
              </div>
              <details className="mt-6 rounded-xl border border-white/10 p-4">
                <summary className="cursor-pointer py-2 text-sm font-medium text-emerald-200">
                  Adicionar apresentação e projetos · opcional
                </summary>
                <PersonalBriefFields brief={brief} onChange={setBrief} />
              </details>
              {error && (
                <p role="alert" className="mt-5 text-sm text-rose-200">
                  {error}
                </p>
              )}
              <button
                type="submit"
                className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-300 px-5 font-semibold text-[#07100c] transition hover:brightness-110"
              >
                <Sparkles className="h-4 w-4" />{" "}
                {draft && !isDemo ? "Atualizar minha prévia" : "Montar minha prévia"}
              </button>
              <div className="mt-4 flex items-center gap-2 text-xs text-white/40">
                <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-300" /> Seus dados ficam nesta
                página. Guardar o briefing é uma escolha sua.
              </div>
              <BriefStorage
                brief={brief}
                onRestore={(restored) => {
                  setBrief(restored);
                  setError("");
                }}
              />
            </form>
          </div>
          <PortfolioAiPanel
            brief={brief}
            isAi={isAi}
            onGenerated={(generated) => {
              setDraft(generated);
              setIsDemo(false);
              setIsAi(true);
              setAnalysisOpen(true);
            }}
          />
        </section>

        {draft && (
          <section id="portfolio-result" className="scroll-mt-24 px-3 py-20 md:px-6">
            <div className="mx-auto max-w-7xl">
              <h2
                ref={resultHeading}
                tabIndex={-1}
                className="mb-5 scroll-mt-24 font-display text-3xl focus:outline-none"
              >
                {isDemo ? "Exemplo fictício de portfólio" : "Sua prévia está pronta para revisão"}
              </h2>
              <div className="mb-8 flex flex-col gap-5 rounded-2xl border border-white/10 bg-white/[0.035] p-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-sm text-emerald-200">
                    <Check className="h-4 w-4" />{" "}
                    {isDemo
                      ? "Projetos, números e depoimento apenas ilustrativos"
                      : isAi
                        ? "Texto sugerido pela IA, salvo na sua conta · revise os fatos"
                        : "Montada com as informações do seu briefing"}
                  </div>
                  <p className="mt-1 text-xs text-white/40">
                    A prévia não é um site publicado. Volte ao briefing para ajustar o conteúdo.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="flex rounded-xl border border-white/10 p-1">
                    <button
                      type="button"
                      aria-label="Prévia desktop"
                      onClick={() => setDevice("desktop")}
                      aria-pressed={device === "desktop"}
                      className={`rounded-lg px-3 py-2 ${device === "desktop" ? "bg-white/10 text-emerald-200" : "text-white/40"}`}
                    >
                      <Monitor className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="Prévia celular"
                      onClick={() => setDevice("mobile")}
                      aria-pressed={device === "mobile"}
                      className={`rounded-lg px-3 py-2 ${device === "mobile" ? "bg-white/10 text-emerald-200" : "text-white/40"}`}
                    >
                      <Smartphone className="h-4 w-4" />
                    </button>
                  </div>
                  <button
                    type="button"
                    aria-expanded={analysisOpen}
                    onClick={() => setAnalysisOpen((value) => !value)}
                    className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/70 hover:border-emerald-300/40"
                  >
                    {analysisOpen ? "Ocultar revisão" : "Revisar conteúdo"}
                  </button>
                  <button
                    type="button"
                    aria-expanded={assistantOpen}
                    onClick={() => setAssistantOpen((value) => !value)}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-300 px-4 py-2 text-sm font-semibold text-[#07100c]"
                  >
                    <Bot className="h-4 w-4" /> Orientação de conteúdo
                  </button>
                </div>
              </div>
              {analysisOpen && (
                <div className="mb-6 rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.06] p-5">
                  <p className="text-sm font-medium">
                    Checklist do conteúdo · {review.filter((item) => item.complete).length} de{" "}
                    {review.length} itens preenchidos
                  </p>
                  <p className="mt-2 text-xs text-white/55">
                    Esta revisão verifica preenchimento, não qualidade nem veracidade. Confira as
                    informações antes de compartilhar.
                  </p>
                  <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                    {review.map((item) => (
                      <li key={item.label} className="rounded-xl border border-white/10 p-4">
                        <p className="text-sm text-emerald-200">
                          {item.complete ? "Preenchido" : "A completar"} · {item.label}
                        </p>
                        {!item.complete && (
                          <p className="mt-2 text-xs leading-relaxed text-white/65">{item.hint}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                  <a
                    href="#create"
                    className="mt-5 inline-flex min-h-11 items-center rounded-lg border border-white/20 px-4 text-sm"
                  >
                    Voltar ao briefing
                  </a>
                </div>
              )}
              {assistantOpen && (
                <div className="mb-6 ml-auto max-w-xl rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.06] p-5">
                  <div className="flex gap-3">
                    <Bot className="mt-0.5 h-5 w-5 text-cyan-200" />
                    <div>
                      <p className="text-sm font-medium">Guia Veronica · orientação editorial</p>
                      <p className="mt-2 text-sm leading-relaxed text-white/60">
                        Para cada projeto, explique o contexto, sua participação e o resultado
                        observado. Trabalhos autorais e acadêmicos também contam, desde que sejam
                        identificados. Esta é uma orientação fixa; o assistente de IA desta vertical
                        ainda está em preparação.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <PortfolioPreview draft={draft} device={device} personal={!isDemo} />
              <div className="pf-result-next">
                <div>
                  <h3>Gostou de se ver assim?</h3>
                  <p>
                    Podemos transformar essa direção em um site próprio, com design e recursos
                    feitos para você.
                  </p>
                </div>
                <a className="pf-button pf-primary" href="#site-project">
                  Quero um site com essa direção <ArrowRight size={17} />
                </a>
              </div>
            </div>
          </section>
        )}

        <SiteProjectBrief />

        <section className="px-6 py-24">
          <div className="mx-auto max-w-5xl rounded-[2rem] border border-emerald-300/20 bg-[radial-gradient(circle_at_80%_20%,rgba(103,232,196,0.14),transparent_28%),#0a1012] px-6 py-16 text-center md:px-14">
            <h2 className="font-display text-4xl tracking-[-0.045em] md:text-6xl">
              Seu melhor trabalho merece uma apresentação à altura.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-white/50">
              Crie gratuitamente, explore sua apresentação e escolha o projeto que faz sentido para
              sua próxima fase.
            </p>
            <a
              href="#create"
              className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-full bg-emerald-300 px-6 font-semibold text-[#07100c]"
            >
              Montar minha prévia gratuita <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </section>
      </main>
      <SiteFooter brand="yo" tagline="Sua presença digital, criada com direção." />
    </div>
  );
}
