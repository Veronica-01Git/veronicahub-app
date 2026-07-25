import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type CSSProperties, type ChangeEvent, type FormEvent } from "react";
import { Menu, X } from "lucide-react";
import { HUB_URL } from "@/components/SiteChrome";
import { evaluateResume, generateAtsResume, type AtsResume, type EvalResult } from "@/lib/resume-tools";
import { extractTextFromFile, ACCEPT_ATTR } from "@/lib/resume-parsers";
import { downloadTxt, downloadPdf, downloadDocx } from "@/lib/resume-export";
import { HoloResumeOrbit } from "@/components/HoloResumeOrbit";
import {
  loadSession,
  persistSession,
  createSession,
  generateCode,
  formatBRL,
  MIN_DEPOSIT_CENTS,
  type AuthChannel,
  type Session,
} from "@/lib/account";

export const Route = createFileRoute("/veronica-curriculo-certo")({
  component: CurriculoCerto,
  head: () => ({
    meta: [
      { title: "Currículo Certo — Avalie seu currículo grátis | Veronica Hub" },
      {
        name: "description",
        content:
          "Cole seu currículo e receba, na hora, uma nota estrutural de compatibilidade com ATS e o checklist exato do que corrigir. Login rápido por e-mail ou celular.",
      },
      { property: "og:title", content: "Currículo Certo — Avalie seu currículo grátis" },
      { property: "og:description", content: "Nota instantânea de compatibilidade com ATS, com checklist do que corrigir." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

// Paper/document palette — office, ofício, registro. Deliberately breaks from
// the Hub's dark cyber theme: this is a career document tool, not a course.
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
  "--doc-amber": "#93650f",
} as CSSProperties;

const sansStack = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const serifStack = '"Newsreader", Georgia, "Times New Roman", serif';

const headingSerif: CSSProperties = { fontFamily: serifStack, fontWeight: 400, letterSpacing: "-0.01em", lineHeight: 1.05 };
const headingSans: CSSProperties = { fontFamily: sansStack, fontWeight: 600, letterSpacing: "-0.005em", lineHeight: 1.2 };

function toneFor(score: number, max: number): "low" | "mid" | "high" {
  const pct = score / max;
  if (pct >= 0.78) return "high";
  if (pct >= 0.5) return "mid";
  return "low";
}

const TONE_COLOR: Record<"low" | "mid" | "high", string> = {
  low: "var(--doc-red)",
  mid: "var(--doc-amber)",
  high: "var(--doc-accent)",
};

const TONE_LABEL: Record<"low" | "mid" | "high", string> = {
  low: "Reprovaria em triagem",
  mid: "Passa, com ressalvas",
  high: "Pronto para ATS",
};

// ---------------------------------------------------------------------------
// Carteira simulada — conta compartilhada com o resto do ecossistema, ver
// src/lib/account.ts (mesma sessão local vale pra Currículo-Certo e Studio).
// ---------------------------------------------------------------------------

const GENERATION_PRICE_CENTS = 990; // R$9,90 por geração — placeholder

// ---------------------------------------------------------------------------
// Vagas de emprego — links reais pra buscadores de vaga já existentes e
// confiáveis, filtrados pela cidade/estado e nicho escolhidos. Sem varredura
// própria, sem dado inventado: são só URLs de busca montadas dinamicamente.
// ---------------------------------------------------------------------------

const BR_STATES = [
  { uf: "AC", name: "Acre" }, { uf: "AL", name: "Alagoas" }, { uf: "AP", name: "Amapá" },
  { uf: "AM", name: "Amazonas" }, { uf: "BA", name: "Bahia" }, { uf: "CE", name: "Ceará" },
  { uf: "DF", name: "Distrito Federal" }, { uf: "ES", name: "Espírito Santo" }, { uf: "GO", name: "Goiás" },
  { uf: "MA", name: "Maranhão" }, { uf: "MT", name: "Mato Grosso" }, { uf: "MS", name: "Mato Grosso do Sul" },
  { uf: "MG", name: "Minas Gerais" }, { uf: "PA", name: "Pará" }, { uf: "PB", name: "Paraíba" },
  { uf: "PR", name: "Paraná" }, { uf: "PE", name: "Pernambuco" }, { uf: "PI", name: "Piauí" },
  { uf: "RJ", name: "Rio de Janeiro" }, { uf: "RN", name: "Rio Grande do Norte" }, { uf: "RS", name: "Rio Grande do Sul" },
  { uf: "RO", name: "Rondônia" }, { uf: "RR", name: "Roraima" }, { uf: "SC", name: "Santa Catarina" },
  { uf: "SP", name: "São Paulo" }, { uf: "SE", name: "Sergipe" }, { uf: "TO", name: "Tocantins" },
];

const JOB_NICHES = [
  "Varejo", "Tecnologia", "Saúde", "Logística", "Educação", "Alimentação",
  "Construção Civil", "Administração", "Vendas", "Atendimento ao Cliente",
  "Marketing", "Financeiro", "Recursos Humanos", "Beleza e Estética",
  "Transporte", "Indústria", "Turismo e Hotelaria", "Agronegócio",
  "Telemarketing", "Segurança do Trabalho",
];

function buildJobSearchLinks(city: string, uf: string, niche: string) {
  const loc = `${city}, ${uf}`;
  const query = [niche, city].filter(Boolean).join(" ");
  return [
    { name: "Google Empregos", url: `https://www.google.com/search?q=${encodeURIComponent(`vagas de emprego ${query}`)}&ibp=htl;jobs` },
    { name: "LinkedIn Vagas", url: `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(niche)}&location=${encodeURIComponent(`${loc}, Brasil`)}` },
    { name: "Indeed", url: `https://br.indeed.com/jobs?q=${encodeURIComponent(niche)}&l=${encodeURIComponent(loc)}` },
  ];
}

// ---------------------------------------------------------------------------
// Construtor de currículo — monta o texto no mesmo formato canônico que o
// motor de avaliação já entende (cabeçalhos + bullets "- "), então reaproveita
// evaluateResume()/generateAtsResume() sem duplicar nenhuma lógica de nota.
// ---------------------------------------------------------------------------

type BuilderExperience = { cargo: string; empresa: string; periodo: string; conquistas: string };
type BuilderEducation = { curso: string; instituicao: string; ano: string };

function assembleBuilderText(fields: {
  name: string;
  email: string;
  phone: string;
  linkedin: string;
  experiences: BuilderExperience[];
  educations: BuilderEducation[];
  skills: string;
}): string {
  const lines: string[] = [];
  if (fields.name.trim()) lines.push(fields.name.trim());
  const contact = [fields.email.trim(), fields.phone.trim(), fields.linkedin.trim()].filter(Boolean).join(" | ");
  if (contact) lines.push(contact);
  lines.push("");

  const expLines = fields.experiences.flatMap((exp) => {
    if (!exp.cargo.trim() && !exp.empresa.trim()) return [];
    const header = [exp.cargo, exp.empresa, exp.periodo].filter((v) => v.trim()).join(" - ");
    const bullets = exp.conquistas.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => `- ${l}`);
    return [header, ...bullets];
  });
  if (expLines.length) {
    lines.push("Experiência Profissional", ...expLines, "");
  }

  const eduLines = fields.educations
    .filter((e) => e.curso.trim() || e.instituicao.trim())
    .map((e) => [e.curso, e.instituicao, e.ano].filter((v) => v.trim()).join(" - "));
  if (eduLines.length) {
    lines.push("Formação", ...eduLines, "");
  }

  if (fields.skills.trim()) {
    lines.push("Habilidades", fields.skills.trim());
  }

  return lines.join("\n").trim();
}

function ScoreDial({ value, max, label }: { value: number; max: number; label: string }) {
  const tone = toneFor(value, max);
  const color = TONE_COLOR[tone];
  return (
    <div className="flex flex-col items-center gap-2.5">
      <div
        className="flex h-[104px] w-[104px] flex-col items-center justify-center rounded-full border-[2.5px]"
        style={{ borderColor: color, color }}
      >
        <span className="text-[34px] font-semibold" style={{ fontFamily: sansStack, lineHeight: 1 }}>{value}</span>
        <span className="font-mono-tech text-[9px] uppercase tracking-widest" style={{ color: "var(--doc-ink-faint)" }}>/ {max}</span>
      </div>
      <div className="text-center">
        <div className="font-mono-tech text-[10px] uppercase tracking-widest" style={{ color: "var(--doc-ink-faint)" }}>{label}</div>
        <div className="mt-0.5 text-[11.5px] font-medium" style={{ color }}>{TONE_LABEL[tone]}</div>
      </div>
    </div>
  );
}

function CurriculoCerto() {
  const [input, setInput] = useState("");
  const [fileError, setFileError] = useState<string | null>(null);
  const [fileParsing, setFileParsing] = useState(false);
  const [result, setResult] = useState<EvalResult | null>(null);
  const [generated, setGenerated] = useState<AtsResume | null>(null);
  const [exporting, setExporting] = useState<"txt" | "pdf" | "docx" | null>(null);

  const [session, setSession] = useState<Session | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authStep, setAuthStep] = useState<"identify" | "confirm">("identify");
  const [authChannel, setAuthChannel] = useState<AuthChannel>("email");
  const [authIdentifier, setAuthIdentifier] = useState("");
  const [authCode, setAuthCode] = useState("");
  const [pendingCode, setPendingCode] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<"evaluate" | "generate" | null>(null);
  const [depositOpen, setDepositOpen] = useState(false);
  const [depositValue, setDepositValue] = useState(String(MIN_DEPOSIT_CENTS / 100));
  const [depositError, setDepositError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const [jobCity, setJobCity] = useState("");
  const [jobUf, setJobUf] = useState("SP");
  const [jobNiche, setJobNiche] = useState("Todos");
  const [jobLinks, setJobLinks] = useState<{ name: string; url: string }[] | null>(null);

  const [mode, setMode] = useState<"build" | "paste">("build");
  const [builderName, setBuilderName] = useState("");
  const [builderEmail, setBuilderEmail] = useState("");
  const [builderPhone, setBuilderPhone] = useState("");
  const [builderLinkedin, setBuilderLinkedin] = useState("");
  const [builderExperiences, setBuilderExperiences] = useState<BuilderExperience[]>([{ cargo: "", empresa: "", periodo: "", conquistas: "" }]);
  const [builderEducations, setBuilderEducations] = useState<BuilderEducation[]>([{ curso: "", instituicao: "", ano: "" }]);
  const [builderSkills, setBuilderSkills] = useState("");

  useEffect(() => {
    setSession(loadSession());
  }, []);

  useEffect(() => {
    persistSession(session);
  }, [session]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 7000);
    return () => window.clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!mobileOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const builderText = useMemo(
    () => assembleBuilderText({
      name: builderName, email: builderEmail, phone: builderPhone, linkedin: builderLinkedin,
      experiences: builderExperiences, educations: builderEducations, skills: builderSkills,
    }),
    [builderName, builderEmail, builderPhone, builderLinkedin, builderExperiences, builderEducations, builderSkills],
  );
  const activeText = mode === "build" ? builderText : input;
  const wordCount = useMemo(() => activeText.trim().split(/\s+/).filter(Boolean).length, [activeText]);
  const canEvaluate = wordCount >= 50;
  // Free, ungated live preview while building — this is the "quanto mais dados,
  // maior a pontuação" feedback loop, visible before any login/payment.
  const livePreview = useMemo(
    () => (mode === "build" && wordCount >= 15 ? evaluateResume(builderText) : null),
    [mode, builderText, wordCount],
  );

  function addExperience() {
    setBuilderExperiences((exps) => (exps.length >= 5 ? exps : [...exps, { cargo: "", empresa: "", periodo: "", conquistas: "" }]));
  }
  function removeExperience(idx: number) {
    setBuilderExperiences((exps) => (exps.length <= 1 ? exps : exps.filter((_, i) => i !== idx)));
  }
  function updateExperience(idx: number, patch: Partial<BuilderExperience>) {
    setBuilderExperiences((exps) => exps.map((e, i) => (i === idx ? { ...e, ...patch } : e)));
  }
  function addEducation() {
    setBuilderEducations((edus) => (edus.length >= 3 ? edus : [...edus, { curso: "", instituicao: "", ano: "" }]));
  }
  function removeEducation(idx: number) {
    setBuilderEducations((edus) => (edus.length <= 1 ? edus : edus.filter((_, i) => i !== idx)));
  }
  function updateEducation(idx: number, patch: Partial<BuilderEducation>) {
    setBuilderEducations((edus) => edus.map((e, i) => (i === idx ? { ...e, ...patch } : e)));
  }

  async function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setFileError(null);
    setFileParsing(true);
    try {
      const { text, warning } = await extractTextFromFile(file);
      setInput(text);
      setFileError(warning ?? null);
    } catch (err) {
      setFileError(err instanceof Error ? err.message : "Não consegui ler esse arquivo. Tente colar o texto direto.");
    } finally {
      setFileParsing(false);
    }
  }

  function handleEvaluate() {
    if (!canEvaluate) return;
    if (!session) {
      openAuth("evaluate");
      return;
    }
    setResult(evaluateResume(activeText));
    setGenerated(null);
  }

  function openAuth(action: "evaluate" | "generate" | null) {
    setPendingAction(action);
    setAuthOpen(true);
    setAuthStep("identify");
    setAuthError(null);
  }

  function closeAuth() {
    setAuthOpen(false);
    setAuthStep("identify");
    setAuthError(null);
    setAuthCode("");
    setPendingCode(null);
    setPendingAction(null);
  }

  function requestCode(e: FormEvent) {
    e.preventDefault();
    const id = authIdentifier.trim();
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(id);
    const digits = id.replace(/\D/g, "");
    const validPhone = digits.length >= 10 && digits.length <= 13;
    if (authChannel === "email" && !validEmail) {
      setAuthError("Digite um e-mail válido.");
      return;
    }
    if (authChannel === "phone" && !validPhone) {
      setAuthError("Digite um celular válido, com DDD.");
      return;
    }
    const code = generateCode();
    setPendingCode(code);
    setAuthStep("confirm");
    setAuthError(null);
    setAuthCode("");
    setToast(`Ambiente de teste — código (simulado) que seria enviado por ${authChannel === "email" ? "e-mail" : "SMS"}: ${code}`);
  }

  function resendCode() {
    const code = generateCode();
    setPendingCode(code);
    setAuthCode("");
    setAuthError(null);
    setToast(`Ambiente de teste — novo código (simulado): ${code}`);
  }

  function confirmCode(e: FormEvent) {
    e.preventDefault();
    if (!pendingCode) return;
    if (authCode.trim() !== pendingCode) {
      setAuthError("Código incorreto. Confira e tente de novo.");
      return;
    }
    setSession((prev) => prev ?? createSession(authChannel, authIdentifier.trim()));
    setToast("Sessão confirmada (simulada).");
    if (pendingAction === "evaluate" && canEvaluate) {
      setResult(evaluateResume(activeText));
      setGenerated(null);
    } else if (pendingAction === "generate") {
      setDepositError(null);
      setDepositOpen(true);
    }
    closeAuth();
  }

  function handleLogout() {
    setSession(null);
    setGenerated(null);
  }

  function handleDeposit(e: FormEvent) {
    e.preventDefault();
    if (!session) return;
    const cents = Math.round(parseFloat(depositValue.replace(",", ".")) * 100);
    if (Number.isNaN(cents) || cents < MIN_DEPOSIT_CENTS) {
      setDepositError(`Depósito mínimo é ${formatBRL(MIN_DEPOSIT_CENTS)}.`);
      return;
    }
    setDepositError(null);
    setSession({ ...session, balanceCents: session.balanceCents + cents });
    setDepositOpen(false);
    setToast(`Depósito simulado de ${formatBRL(cents)} creditado. Nenhum valor real foi cobrado.`);
  }

  function handleGenerate() {
    if (!canEvaluate) return;
    if (!session) {
      openAuth("generate");
      return;
    }
    if (session.balanceCents < GENERATION_PRICE_CENTS) {
      setDepositError(null);
      setDepositOpen(true);
      return;
    }
    setSession({ ...session, balanceCents: session.balanceCents - GENERATION_PRICE_CENTS });
    setGenerated(generateAtsResume(activeText));
    setToast(`Currículo gerado. ${formatBRL(GENERATION_PRICE_CENTS)} debitado do saldo (simulado).`);
  }

  function copyGenerated() {
    if (!generated) return;
    navigator.clipboard.writeText(generated.text);
    setToast("Texto copiado.");
  }

  async function downloadGenerated(fmt: "txt" | "pdf" | "docx") {
    if (!generated || exporting) return;
    setExporting(fmt);
    try {
      if (fmt === "txt") downloadTxt(generated);
      else if (fmt === "pdf") await downloadPdf(generated);
      else await downloadDocx(generated);
    } catch {
      setToast("Não consegui gerar o arquivo. Tenta de novo.");
    } finally {
      setExporting(null);
    }
  }

  function handleSearchJobs() {
    if (!jobCity.trim()) return;
    setJobLinks(buildJobSearchLinks(jobCity.trim(), jobUf, jobNiche === "Todos" ? "" : jobNiche));
  }

  return (
    <div
      className="relative min-h-screen overflow-x-hidden"
      style={{ ...doc, background: "var(--doc-paper)", color: "var(--doc-ink)", fontFamily: sansStack }}
    >
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
        <Link to="/" className="flex items-baseline gap-2 font-mono-tech text-xs uppercase tracking-widest">
          <span style={{ color: "var(--doc-ink-faint)" }}>Veronica ·</span>
          <span className="font-semibold" style={{ color: "var(--doc-accent)" }}>Currículo-Certo</span>
        </Link>
        <nav className="hidden items-center gap-7 font-mono-tech text-[11px] uppercase tracking-widest sm:flex" style={{ color: "var(--doc-ink-soft)" }}>
          <a href="#ferramenta" className="border-b border-transparent pb-0.5 transition hover:border-current">Avaliar</a>
          <a href="#criterios" className="border-b border-transparent pb-0.5 transition hover:border-current">Critérios</a>
          <a href="#vagas" className="border-b border-transparent pb-0.5 transition hover:border-current">Vagas</a>
          <Link to="/veronica-curriculo-certo-rh" className="border-b border-transparent pb-0.5 transition hover:border-current">Área RH</Link>
          <a href={HUB_URL} target="_blank" rel="noopener noreferrer" className="border-b border-transparent pb-0.5 transition hover:border-current">Hub</a>
        </nav>
        <div className="flex items-center gap-3 font-mono-tech text-[11px] uppercase tracking-widest">
          {session ? (
            <>
              <span className="hidden sm:inline" style={{ color: "var(--doc-ink-soft)" }}>{session.identifier}</span>
              <span style={{ color: "var(--doc-accent)" }}>{formatBRL(session.balanceCents)}</span>
              <button onClick={() => { setDepositError(null); setDepositOpen((v) => !v); }} className="hidden rounded-[2px] border px-3 py-1.5 transition hover:-translate-y-0.5 sm:inline-block" style={{ borderColor: "var(--doc-line-strong)", color: "var(--doc-ink-soft)" }}>
                Depositar
              </button>
              <button onClick={handleLogout} className="hidden transition hover:opacity-70 sm:inline-block" style={{ color: "var(--doc-ink-faint)" }}>
                Sair
              </button>
            </>
          ) : (
            <button onClick={() => (authOpen ? closeAuth() : openAuth(null))} className="hidden rounded-[2px] border px-3.5 py-1.5 transition hover:-translate-y-0.5 sm:inline-block" style={{ borderColor: "var(--doc-line-strong)", color: "var(--doc-ink-soft)" }}>
              Entrar
            </button>
          )}
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={mobileOpen}
            className="flex h-9 w-9 items-center justify-center rounded-[2px] border sm:hidden"
            style={{ borderColor: "var(--doc-line-strong)", color: "var(--doc-ink)" }}
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {mobileOpen && (
        <div
          className="fixed inset-x-0 top-[61px] bottom-0 z-40 overflow-y-auto sm:hidden"
          style={{ background: "var(--doc-paper)" }}
        >
          <nav className="flex flex-col gap-1 px-6 py-6 font-mono-tech text-sm uppercase tracking-wider">
            <a href="#ferramenta" onClick={() => setMobileOpen(false)} className="border-b py-3.5" style={{ borderColor: "var(--doc-line)", color: "var(--doc-ink)" }}>Avaliar</a>
            <a href="#criterios" onClick={() => setMobileOpen(false)} className="border-b py-3.5" style={{ borderColor: "var(--doc-line)", color: "var(--doc-ink)" }}>Critérios</a>
            <a href="#vagas" onClick={() => setMobileOpen(false)} className="border-b py-3.5" style={{ borderColor: "var(--doc-line)", color: "var(--doc-ink)" }}>Vagas</a>
            <Link to="/veronica-curriculo-certo-rh" onClick={() => setMobileOpen(false)} className="border-b py-3.5" style={{ borderColor: "var(--doc-line)", color: "var(--doc-ink)" }}>Área RH</Link>
            <a href={HUB_URL} target="_blank" rel="noopener noreferrer" onClick={() => setMobileOpen(false)} className="border-b py-3.5" style={{ borderColor: "var(--doc-line)", color: "var(--doc-ink)" }}>Hub</a>

            <div className="mt-6 flex flex-col gap-3">
              {session ? (
                <>
                  <div className="text-[11px]" style={{ color: "var(--doc-ink-soft)" }}>{session.identifier} · {formatBRL(session.balanceCents)}</div>
                  <button onClick={() => { setDepositError(null); setDepositOpen(true); setMobileOpen(false); }} className="rounded-[2px] border px-4 py-3 text-[11px]" style={{ borderColor: "var(--doc-line-strong)", color: "var(--doc-ink-soft)" }}>
                    Depositar
                  </button>
                  <button onClick={() => { handleLogout(); setMobileOpen(false); }} className="text-[11px]" style={{ color: "var(--doc-ink-faint)" }}>
                    Sair
                  </button>
                </>
              ) : (
                <button onClick={() => { openAuth(null); setMobileOpen(false); }} className="rounded-[2px] px-4 py-3 text-[11px]" style={{ background: "var(--doc-accent)", color: "var(--doc-paper)" }}>
                  Entrar
                </button>
              )}
            </div>
          </nav>
        </div>
      )}

      {authOpen && !session && (
        <div
          className="border-b px-6 py-4 md:pl-[92px] md:pr-10"
          style={{ borderColor: "var(--doc-line)", background: "var(--doc-accent-soft)" }}
        >
          {authStep === "identify" ? (
            <form onSubmit={requestCode} className="flex flex-wrap items-center gap-2.5">
              <span className="font-mono-tech text-[10.5px] uppercase tracking-widest" style={{ color: "var(--doc-ink-soft)" }}>
                Entrar ou criar conta —
              </span>
              <div className="flex overflow-hidden rounded-[2px] border" style={{ borderColor: "var(--doc-line-strong)" }}>
                <button
                  type="button"
                  onClick={() => { setAuthChannel("email"); setAuthIdentifier(""); setAuthError(null); }}
                  className="px-3 py-1.5 font-mono-tech text-[10.5px] uppercase tracking-widest transition"
                  style={{ background: authChannel === "email" ? "var(--doc-accent)" : "var(--doc-paper-raised)", color: authChannel === "email" ? "var(--doc-paper)" : "var(--doc-ink-soft)" }}
                >
                  E-mail
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthChannel("phone"); setAuthIdentifier(""); setAuthError(null); }}
                  className="px-3 py-1.5 font-mono-tech text-[10.5px] uppercase tracking-widest transition"
                  style={{ background: authChannel === "phone" ? "var(--doc-accent)" : "var(--doc-paper-raised)", color: authChannel === "phone" ? "var(--doc-paper)" : "var(--doc-ink-soft)" }}
                >
                  Celular
                </button>
              </div>
              <input
                type={authChannel === "email" ? "email" : "tel"}
                required
                autoFocus
                value={authIdentifier}
                onChange={(e) => setAuthIdentifier(e.target.value)}
                placeholder={authChannel === "email" ? "seu@email.com" : "(11) 98888-7777"}
                className="border px-3 py-1.5 text-[13px] outline-none"
                style={{ borderColor: "var(--doc-line-strong)", background: "var(--doc-paper-raised)", color: "var(--doc-ink)" }}
              />
              <button type="submit" className="rounded-[2px] px-4 py-1.5 font-mono-tech text-[10.5px] uppercase tracking-widest" style={{ background: "var(--doc-accent)", color: "var(--doc-paper)" }}>
                Enviar código
              </button>
              <button type="button" onClick={closeAuth} className="font-mono-tech text-[10.5px] uppercase tracking-widest" style={{ color: "var(--doc-ink-faint)" }}>
                Cancelar
              </button>
              {authError && (
                <span className="w-full font-mono-tech text-[10.5px] uppercase tracking-widest" style={{ color: "var(--doc-red)" }}>
                  {authError}
                </span>
              )}
            </form>
          ) : (
            <form onSubmit={confirmCode} className="flex flex-wrap items-center gap-2.5">
              <span className="font-mono-tech text-[10.5px] uppercase tracking-widest" style={{ color: "var(--doc-ink-soft)" }}>
                Código enviado (simulado) para {authIdentifier} —
              </span>
              {pendingCode && (
                <button
                  type="button"
                  onClick={() => setAuthCode(pendingCode)}
                  className="rounded-[2px] border border-dashed px-3 py-1.5 font-mono-tech text-[13px] tracking-[0.3em]"
                  style={{ borderColor: "var(--doc-accent)", color: "var(--doc-accent)" }}
                  title="Clique para preencher automaticamente"
                >
                  {pendingCode}
                </button>
              )}
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                required
                autoFocus
                value={authCode}
                onChange={(e) => setAuthCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="w-28 border px-3 py-1.5 text-center text-[15px] outline-none"
                style={{ borderColor: "var(--doc-line-strong)", background: "var(--doc-paper-raised)", color: "var(--doc-ink)", fontFamily: "var(--font-mono)", letterSpacing: "0.3em" }}
              />
              <button type="submit" className="rounded-[2px] px-4 py-1.5 font-mono-tech text-[10.5px] uppercase tracking-widest" style={{ background: "var(--doc-accent)", color: "var(--doc-paper)" }}>
                Confirmar
              </button>
              <button type="button" onClick={resendCode} className="font-mono-tech text-[10.5px] uppercase tracking-widest" style={{ color: "var(--doc-ink-soft)" }}>
                Reenviar
              </button>
              <button type="button" onClick={() => { setAuthStep("identify"); setAuthError(null); }} className="font-mono-tech text-[10.5px] uppercase tracking-widest" style={{ color: "var(--doc-ink-faint)" }}>
                Trocar
              </button>
              <button type="button" onClick={closeAuth} className="font-mono-tech text-[10.5px] uppercase tracking-widest" style={{ color: "var(--doc-ink-faint)" }}>
                Cancelar
              </button>
              {authError && (
                <span className="w-full font-mono-tech text-[10.5px] uppercase tracking-widest" style={{ color: "var(--doc-red)" }}>
                  {authError}
                </span>
              )}
            </form>
          )}
        </div>
      )}

      {depositOpen && session && (
        <form
          onSubmit={handleDeposit}
          className="flex flex-wrap items-center gap-2.5 border-b px-6 py-4 md:pl-[92px] md:pr-10"
          style={{ borderColor: "var(--doc-line)", background: "var(--doc-accent-soft)" }}
        >
          <span className="font-mono-tech text-[10.5px] uppercase tracking-widest" style={{ color: "var(--doc-ink-soft)" }}>
            Depósito simulado — mínimo {formatBRL(MIN_DEPOSIT_CENTS)}
          </span>
          <span className="font-mono-tech text-[12px]" style={{ color: "var(--doc-ink)" }}>R$</span>
          <input
            type="text"
            inputMode="decimal"
            required
            autoFocus
            value={depositValue}
            onChange={(e) => setDepositValue(e.target.value)}
            className="w-24 border px-3 py-1.5 text-[13px] outline-none"
            style={{ borderColor: "var(--doc-line-strong)", background: "var(--doc-paper-raised)", color: "var(--doc-ink)" }}
          />
          <button type="submit" className="rounded-[2px] px-4 py-1.5 font-mono-tech text-[10.5px] uppercase tracking-widest" style={{ background: "var(--doc-accent)", color: "var(--doc-paper)" }}>
            Confirmar (simulado)
          </button>
          <button type="button" onClick={() => setDepositOpen(false)} className="font-mono-tech text-[10.5px] uppercase tracking-widest" style={{ color: "var(--doc-ink-faint)" }}>
            Cancelar
          </button>
          {depositError && (
            <span className="w-full font-mono-tech text-[10.5px] uppercase tracking-widest" style={{ color: "var(--doc-red)" }}>
              {depositError}
            </span>
          )}
        </form>
      )}

      {toast && (
        <div
          className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-[2px] border px-4 py-2.5 font-mono-tech text-[11px] uppercase tracking-widest shadow-sm"
          style={{ borderColor: "var(--doc-accent)", background: "var(--doc-paper-raised)", color: "var(--doc-accent)" }}
        >
          {toast}
        </div>
      )}

      <main className="md:pl-[92px] md:pr-10">
        {/* Tool — the page's single job, front and center */}
        <section id="ferramenta" className="border-b px-6 py-14 md:px-0 md:py-20" style={{ borderColor: "var(--doc-line)" }}>
          <div className="flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2.5 font-mono-tech text-[11px] uppercase tracking-widest" style={{ color: "var(--doc-accent)" }}>
                <span className="h-px w-5" style={{ background: "var(--doc-accent)" }} />
                Gerador de currículo · ATS real
              </div>
              <h1 className="mt-5 text-[34px] sm:text-5xl md:text-6xl" style={headingSerif}>
                Construa o currículo.
                <br />
                Saia com <em className="not-italic" style={{ color: "var(--doc-accent)" }}>aprovação</em>.
              </h1>
              <p className="mt-5 max-w-md text-[15.5px] leading-[1.6]" style={{ color: "var(--doc-ink-soft)" }}>
                Alimente a Veronica ATS com seus dados — quanto mais completo, maior sua pontuação. Avaliação é grátis; gerar o documento final custa {formatBRL(GENERATION_PRICE_CENTS)}.
              </p>
            </div>
            <div className="hidden shrink-0 lg:block">
              <HoloResumeOrbit />
            </div>
          </div>

          <div className="mt-8 flex gap-2">
            <button
              onClick={() => setMode("build")}
              className="rounded-full border px-4 py-2 font-mono-tech text-[10.5px] uppercase tracking-widest transition"
              style={mode === "build" ? { background: "var(--doc-accent)", borderColor: "var(--doc-accent)", color: "var(--doc-paper)" } : { borderColor: "var(--doc-line-strong)", color: "var(--doc-ink-soft)" }}
            >
              Criar do zero
            </button>
            <button
              onClick={() => setMode("paste")}
              className="rounded-full border px-4 py-2 font-mono-tech text-[10.5px] uppercase tracking-widest transition"
              style={mode === "paste" ? { background: "var(--doc-accent)", borderColor: "var(--doc-accent)", color: "var(--doc-paper)" } : { borderColor: "var(--doc-line-strong)", color: "var(--doc-ink-soft)" }}
            >
              Já tenho um currículo
            </button>
          </div>

          {mode === "paste" ? (
            <div
              className="relative mt-6 max-w-3xl border p-5 sm:p-7"
              style={{ borderColor: "var(--doc-line-strong)", background: "var(--doc-paper-raised)" }}
            >
              <span aria-hidden className="absolute left-3 top-3 h-3.5 w-3.5 border-l-2 border-t-2" style={{ borderColor: "var(--doc-accent)" }} />
              <span aria-hidden className="absolute right-3 bottom-3 h-3.5 w-3.5 border-r-2 border-b-2" style={{ borderColor: "var(--doc-accent)" }} />

              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Cole aqui o texto completo do seu currículo (experiência, formação, habilidades, contato)..."
                rows={10}
                className="w-full resize-y border p-4 text-[14.5px] leading-[1.6] outline-none"
                style={{ borderColor: "var(--doc-line)", background: "var(--doc-paper)", color: "var(--doc-ink)", fontFamily: sansStack }}
              />

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <label
                    className="cursor-pointer rounded-[2px] border px-3.5 py-2 font-mono-tech text-[10.5px] uppercase tracking-widest transition hover:-translate-y-0.5"
                    style={{ borderColor: "var(--doc-line-strong)", color: "var(--doc-ink-soft)", opacity: fileParsing ? 0.5 : 1 }}
                  >
                    {fileParsing ? "Lendo arquivo…" : "Enviar arquivo"}
                    <input type="file" accept={ACCEPT_ATTR} onChange={onFileChange} disabled={fileParsing} className="hidden" />
                  </label>
                  <span className="font-mono-tech text-[10.5px] uppercase tracking-widest" style={{ color: canEvaluate ? "var(--doc-ink-faint)" : "var(--doc-red)" }}>
                    {wordCount} palavras {!canEvaluate && "· mínimo 50"}
                  </span>
                </div>
                <button
                  onClick={handleEvaluate}
                  disabled={!canEvaluate}
                  className="rounded-[2px] px-7 py-3 font-mono-tech text-[11px] uppercase tracking-[0.12em] transition duration-150 disabled:cursor-not-allowed disabled:opacity-40"
                  style={{ background: "var(--doc-accent)", color: "var(--doc-paper)", border: "1px solid var(--doc-accent)" }}
                >
                  {session ? "Avaliar currículo" : "Entrar para avaliar"}
                </button>
              </div>

              {fileError && (
                <p className="mt-3 text-[13px] leading-[1.5]" style={{ color: "var(--doc-red)" }}>{fileError}</p>
              )}
              {!fileError && (
                <p className="mt-3 text-[12.5px] leading-[1.5]" style={{ color: "var(--doc-ink-faint)" }}>
                  Aceita PDF, Word (.docx), HTML ou .txt — ou cole o texto direto na caixa acima.
                </p>
              )}
            </div>
          ) : (
            <div className="mt-6 grid max-w-4xl grid-cols-1 gap-6 lg:grid-cols-[1fr_220px]">
              <div className="flex flex-col gap-5 border p-5 sm:p-7" style={{ borderColor: "var(--doc-line-strong)", background: "var(--doc-paper-raised)" }}>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="flex flex-col gap-1.5">
                    <span className="font-mono-tech text-[10px] uppercase tracking-widest" style={{ color: "var(--doc-ink-faint)" }}>Nome completo</span>
                    <input value={builderName} onChange={(e) => setBuilderName(e.target.value)} placeholder="Ex.: Maria Souza" className="border px-3 py-2.5 text-[14px] outline-none" style={{ borderColor: "var(--doc-line)", background: "var(--doc-paper)", color: "var(--doc-ink)" }} />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="font-mono-tech text-[10px] uppercase tracking-widest" style={{ color: "var(--doc-ink-faint)" }}>E-mail</span>
                    <input value={builderEmail} onChange={(e) => setBuilderEmail(e.target.value)} placeholder="voce@email.com" className="border px-3 py-2.5 text-[14px] outline-none" style={{ borderColor: "var(--doc-line)", background: "var(--doc-paper)", color: "var(--doc-ink)" }} />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="font-mono-tech text-[10px] uppercase tracking-widest" style={{ color: "var(--doc-ink-faint)" }}>Telefone</span>
                    <input value={builderPhone} onChange={(e) => setBuilderPhone(e.target.value)} placeholder="(11) 98888-7777" className="border px-3 py-2.5 text-[14px] outline-none" style={{ borderColor: "var(--doc-line)", background: "var(--doc-paper)", color: "var(--doc-ink)" }} />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="font-mono-tech text-[10px] uppercase tracking-widest" style={{ color: "var(--doc-ink-faint)" }}>LinkedIn</span>
                    <input value={builderLinkedin} onChange={(e) => setBuilderLinkedin(e.target.value)} placeholder="linkedin.com/in/voce" className="border px-3 py-2.5 text-[14px] outline-none" style={{ borderColor: "var(--doc-line)", background: "var(--doc-paper)", color: "var(--doc-ink)" }} />
                  </label>
                </div>

                <div className="flex flex-col gap-3">
                  <span className="font-mono-tech text-[10px] uppercase tracking-widest" style={{ color: "var(--doc-accent)" }}>Experiência profissional</span>
                  {builderExperiences.map((exp, idx) => (
                    <div key={idx} className="flex flex-col gap-2 border p-3.5" style={{ borderColor: "var(--doc-line)" }}>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        <input value={exp.cargo} onChange={(e) => updateExperience(idx, { cargo: e.target.value })} placeholder="Cargo" className="border px-2.5 py-2 text-[13px] outline-none" style={{ borderColor: "var(--doc-line)", background: "var(--doc-paper)", color: "var(--doc-ink)" }} />
                        <input value={exp.empresa} onChange={(e) => updateExperience(idx, { empresa: e.target.value })} placeholder="Empresa" className="border px-2.5 py-2 text-[13px] outline-none" style={{ borderColor: "var(--doc-line)", background: "var(--doc-paper)", color: "var(--doc-ink)" }} />
                        <input value={exp.periodo} onChange={(e) => updateExperience(idx, { periodo: e.target.value })} placeholder="Período (2021-2023)" className="border px-2.5 py-2 text-[13px] outline-none" style={{ borderColor: "var(--doc-line)", background: "var(--doc-paper)", color: "var(--doc-ink)" }} />
                      </div>
                      <textarea
                        value={exp.conquistas}
                        onChange={(e) => updateExperience(idx, { conquistas: e.target.value })}
                        placeholder={"Uma conquista por linha, começando com verbo de ação:\nLiderei equipe de 5 pessoas...\nAumentei vendas em 20%..."}
                        rows={3}
                        className="resize-y border px-2.5 py-2 text-[13px] leading-[1.5] outline-none"
                        style={{ borderColor: "var(--doc-line)", background: "var(--doc-paper)", color: "var(--doc-ink)" }}
                      />
                      {builderExperiences.length > 1 && (
                        <button onClick={() => removeExperience(idx)} className="self-start font-mono-tech text-[10px] uppercase tracking-widest" style={{ color: "var(--doc-red)" }}>Remover</button>
                      )}
                    </div>
                  ))}
                  <button onClick={addExperience} disabled={builderExperiences.length >= 5} className="self-start rounded-[2px] border px-3.5 py-2 font-mono-tech text-[10.5px] uppercase tracking-widest transition hover:-translate-y-0.5 disabled:opacity-40" style={{ borderColor: "var(--doc-line-strong)", color: "var(--doc-ink-soft)" }}>
                    + Adicionar experiência
                  </button>
                </div>

                <div className="flex flex-col gap-3">
                  <span className="font-mono-tech text-[10px] uppercase tracking-widest" style={{ color: "var(--doc-accent)" }}>Formação</span>
                  {builderEducations.map((edu, idx) => (
                    <div key={idx} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_100px_auto] sm:items-center">
                      <input value={edu.curso} onChange={(e) => updateEducation(idx, { curso: e.target.value })} placeholder="Curso" className="border px-2.5 py-2 text-[13px] outline-none" style={{ borderColor: "var(--doc-line)", background: "var(--doc-paper)", color: "var(--doc-ink)" }} />
                      <input value={edu.instituicao} onChange={(e) => updateEducation(idx, { instituicao: e.target.value })} placeholder="Instituição" className="border px-2.5 py-2 text-[13px] outline-none" style={{ borderColor: "var(--doc-line)", background: "var(--doc-paper)", color: "var(--doc-ink)" }} />
                      <input value={edu.ano} onChange={(e) => updateEducation(idx, { ano: e.target.value })} placeholder="Ano" className="border px-2.5 py-2 text-[13px] outline-none" style={{ borderColor: "var(--doc-line)", background: "var(--doc-paper)", color: "var(--doc-ink)" }} />
                      {builderEducations.length > 1 && (
                        <button onClick={() => removeEducation(idx)} className="font-mono-tech text-[10px] uppercase tracking-widest" style={{ color: "var(--doc-red)" }}>Remover</button>
                      )}
                    </div>
                  ))}
                  <button onClick={addEducation} disabled={builderEducations.length >= 3} className="self-start rounded-[2px] border px-3.5 py-2 font-mono-tech text-[10.5px] uppercase tracking-widest transition hover:-translate-y-0.5 disabled:opacity-40" style={{ borderColor: "var(--doc-line-strong)", color: "var(--doc-ink-soft)" }}>
                    + Adicionar formação
                  </button>
                </div>

                <label className="flex flex-col gap-1.5">
                  <span className="font-mono-tech text-[10px] uppercase tracking-widest" style={{ color: "var(--doc-accent)" }}>Habilidades (separadas por vírgula)</span>
                  <input value={builderSkills} onChange={(e) => setBuilderSkills(e.target.value)} placeholder="Excel, gestão de projetos, inglês avançado" className="border px-3 py-2.5 text-[14px] outline-none" style={{ borderColor: "var(--doc-line)", background: "var(--doc-paper)", color: "var(--doc-ink)" }} />
                </label>

                <button
                  onClick={handleGenerate}
                  disabled={!canEvaluate}
                  className="mt-2 self-start rounded-[2px] px-7 py-3 font-mono-tech text-[11px] uppercase tracking-[0.12em] transition duration-150 disabled:cursor-not-allowed disabled:opacity-40"
                  style={{ background: "var(--doc-accent)", color: "var(--doc-paper)", border: "1px solid var(--doc-accent)" }}
                >
                  {!session ? "Entrar para gerar" : session.balanceCents < GENERATION_PRICE_CENTS ? `Depositar para gerar · faltam ${formatBRL(GENERATION_PRICE_CENTS - session.balanceCents)}` : `Gerar meu currículo ATS · ${formatBRL(GENERATION_PRICE_CENTS)}`}
                </button>
                {!canEvaluate && (
                  <p className="text-[12px]" style={{ color: "var(--doc-ink-faint)" }}>Preencha mais dados — faltam palavras suficientes pra gerar um currículo consistente ({wordCount}/50).</p>
                )}
              </div>

              {/* Live, free, ungated score preview */}
              <div className="flex flex-col items-center gap-3 self-start border p-5" style={{ borderColor: "var(--doc-line-strong)", background: "var(--doc-paper-raised)" }}>
                <span className="font-mono-tech text-[10px] uppercase tracking-widest" style={{ color: "var(--doc-ink-faint)" }}>Pontuação ao vivo</span>
                {livePreview ? (
                  <ScoreDial value={livePreview.score} max={livePreview.maxScore} label="Prontidão" />
                ) : (
                  <div className="flex h-[104px] w-[104px] items-center justify-center rounded-full border-[2.5px] border-dashed" style={{ borderColor: "var(--doc-line-strong)" }}>
                    <span className="text-center text-[10px] leading-tight" style={{ color: "var(--doc-ink-faint)" }}>Preencha os campos</span>
                  </div>
                )}
                <p className="text-center text-[11.5px] leading-[1.5]" style={{ color: "var(--doc-ink-faint)" }}>
                  Quanto mais dados você informar, maior a pontuação.
                </p>
              </div>
            </div>
          )}

          {/* Results */}
          {result && (
            <div
              className="mt-8 max-w-3xl border p-6 sm:p-8"
              style={{ borderColor: "var(--doc-line-strong)", background: "var(--doc-paper-raised)" }}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-b pb-4" style={{ borderColor: "var(--doc-line)" }}>
                <span className="font-mono-tech text-[11px] uppercase tracking-widest" style={{ color: "var(--doc-ink-faint)" }}>
                  Protocolo Nº <span style={{ color: "var(--doc-ink)" }}>{result.protocol}</span>
                </span>
                <span className="font-mono-tech text-[11px] uppercase tracking-widest" style={{ color: "var(--doc-ink-faint)" }}>
                  Emitido em {result.issuedAt}
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-10 py-8 sm:justify-around">
                <ScoreDial value={result.score} max={result.maxScore} label="Antes" />
                {result.score < result.maxScore && (
                  <>
                    <span className="font-mono-tech text-[11px] uppercase tracking-widest" style={{ color: "var(--doc-ink-faint)" }}>
                      corrigindo os itens abaixo
                      <br />→
                    </span>
                    <ScoreDial value={result.potential} max={result.maxScore} label="Depois" />
                  </>
                )}
              </div>

              <p className="mb-5 text-[12.5px] leading-[1.5]" style={{ color: "var(--doc-ink-faint)" }}>
                Nota máxima estrutural: {result.maxScore}/100. Os 4 pontos restantes dependem de revisão humana do conteúdo frente à vaga — não de estrutura.
              </p>

              <div className="flex flex-col">
                {result.checks.map((c) => (
                  <div key={c.key} className="flex items-start gap-3 border-t py-3.5" style={{ borderColor: "var(--doc-line)" }}>
                    <span
                      className="mt-0.5 font-mono-tech text-[13px]"
                      style={{ color: c.points >= c.weight ? "var(--doc-accent)" : "var(--doc-red)" }}
                    >
                      {c.points >= c.weight ? "✓" : "✕"}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="text-[14px] font-medium" style={{ color: "var(--doc-ink)" }}>{c.label}</span>
                        <span className="font-mono-tech text-[10px] uppercase tracking-widest" style={{ color: "var(--doc-ink-faint)" }}>{c.points}/{c.weight}</span>
                      </div>
                      <p className="mt-1 text-[13px] leading-[1.5]" style={{ color: "var(--doc-ink-soft)" }}>{c.detail}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div
                className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t pt-5"
                style={{ borderColor: "var(--doc-line)" }}
              >
                <div>
                  <div className="font-mono-tech text-[10.5px] uppercase tracking-widest" style={{ color: "var(--doc-accent)" }}>Próximo passo</div>
                  <p className="mt-1 max-w-sm text-[13.5px] leading-[1.5]" style={{ color: "var(--doc-ink-soft)" }}>
                    Gerar a versão pronta, já reformatada no padrão ATS (cabeçalhos, bullets e ícones corrigidos).
                  </p>
                  <p className="mt-1.5 text-[11px] leading-[1.4]" style={{ color: "var(--doc-ink-faint)" }}>
                    Ambiente de teste — saldo e cobrança simulados, nenhum valor real é debitado.
                  </p>
                </div>
                {!session && (
                  <button
                    onClick={handleGenerate}
                    className="rounded-[2px] px-5 py-2.5 font-mono-tech text-[10.5px] uppercase tracking-widest transition duration-150 hover:-translate-y-0.5"
                    style={{ background: "var(--doc-accent)", color: "var(--doc-paper)", border: "1px solid var(--doc-accent)" }}
                  >
                    Entrar para gerar
                  </button>
                )}
                {session && session.balanceCents < GENERATION_PRICE_CENTS && (
                  <button
                    onClick={handleGenerate}
                    className="rounded-[2px] px-5 py-2.5 font-mono-tech text-[10.5px] uppercase tracking-widest transition duration-150 hover:-translate-y-0.5"
                    style={{ background: "var(--doc-amber)", color: "var(--doc-paper)", border: "1px solid var(--doc-amber)" }}
                  >
                    Depositar para gerar · faltam {formatBRL(GENERATION_PRICE_CENTS - session.balanceCents)}
                  </button>
                )}
                {session && session.balanceCents >= GENERATION_PRICE_CENTS && (
                  <button
                    onClick={handleGenerate}
                    className="rounded-[2px] px-5 py-2.5 font-mono-tech text-[10.5px] uppercase tracking-widest transition duration-150 hover:-translate-y-0.5"
                    style={{ background: "var(--doc-accent)", color: "var(--doc-paper)", border: "1px solid var(--doc-accent)" }}
                  >
                    Gerar currículo ATS · {formatBRL(GENERATION_PRICE_CENTS)}
                  </button>
                )}
              </div>
            </div>
          )}

          {generated && (
            <div
              className="mt-8 max-w-3xl border p-6 sm:p-8"
              style={{ borderColor: "var(--doc-accent)", background: "var(--doc-paper-raised)" }}
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4" style={{ borderColor: "var(--doc-line)" }}>
                <span className="font-mono-tech text-[11px] uppercase tracking-widest" style={{ color: "var(--doc-accent)" }}>
                  Currículo gerado · padrão ATS
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <button onClick={copyGenerated} className="rounded-[2px] border px-3.5 py-1.5 font-mono-tech text-[10.5px] uppercase tracking-widest transition hover:-translate-y-0.5" style={{ borderColor: "var(--doc-line-strong)", color: "var(--doc-ink-soft)" }}>
                    Copiar texto
                  </button>
                  <button
                    onClick={() => downloadGenerated("txt")}
                    disabled={exporting !== null}
                    className="rounded-[2px] border px-3.5 py-1.5 font-mono-tech text-[10.5px] uppercase tracking-widest transition hover:-translate-y-0.5 disabled:opacity-50"
                    style={{ borderColor: "var(--doc-line-strong)", color: "var(--doc-ink-soft)" }}
                  >
                    {exporting === "txt" ? "Gerando…" : ".TXT"}
                  </button>
                  <button
                    onClick={() => downloadGenerated("docx")}
                    disabled={exporting !== null}
                    className="rounded-[2px] border px-3.5 py-1.5 font-mono-tech text-[10.5px] uppercase tracking-widest transition hover:-translate-y-0.5 disabled:opacity-50"
                    style={{ borderColor: "var(--doc-line-strong)", color: "var(--doc-ink-soft)" }}
                  >
                    {exporting === "docx" ? "Gerando…" : ".DOCX"}
                  </button>
                  <button
                    onClick={() => downloadGenerated("pdf")}
                    disabled={exporting !== null}
                    className="rounded-[2px] px-3.5 py-1.5 font-mono-tech text-[10.5px] uppercase tracking-widest transition hover:-translate-y-0.5 disabled:opacity-50"
                    style={{ background: "var(--doc-accent)", color: "var(--doc-paper)" }}
                  >
                    {exporting === "pdf" ? "Gerando…" : "Baixar PDF"}
                  </button>
                </div>
              </div>
              <pre
                className="mt-5 max-h-[420px] overflow-auto whitespace-pre-wrap p-4 text-[13px] leading-[1.6]"
                style={{ borderColor: "var(--doc-line)", background: "var(--doc-paper)", color: "var(--doc-ink)", fontFamily: sansStack, border: "1px solid var(--doc-line)" }}
              >
                {generated.text}
              </pre>
            </div>
          )}
        </section>

        {/* Transparency — what the score actually checks */}
        <section id="criterios" className="border-b px-6 py-14 md:px-0 md:py-20" style={{ borderColor: "var(--doc-line)" }}>
          <div className="mb-8 max-w-xl">
            <div className="flex items-center gap-2 font-mono-tech text-[11px] uppercase tracking-widest" style={{ color: "var(--doc-ink-faint)" }}>
              <span style={{ color: "var(--doc-accent)" }}>§</span> Como a nota é calculada
            </div>
            <h2 className="mt-2.5 text-2xl sm:text-[32px]" style={headingSerif}>11 critérios objetivos. Nenhuma caixa-preta.</h2>
          </div>
          <div className="grid grid-cols-1 gap-px border sm:grid-cols-2" style={{ background: "var(--doc-line)", borderColor: "var(--doc-line)" }}>
            {[
              ["Contato completo", "8 pts"], ["LinkedIn/portfólio", "4 pts"],
              ["Seção Experiência", "6 pts"], ["Seção Formação", "6 pts"],
              ["Seção Habilidades", "6 pts"], ["Verbos de ação", "16 pts"],
              ["Resultados quantificados", "16 pts"], ["Tamanho do documento", "10 pts"],
              ["Apresentação enxuta", "8 pts"], ["Sem ícones ilegíveis", "8 pts"],
              ["Sem clichês em excesso", "8 pts"],
            ].map(([label, pts]) => (
              <div key={label} className="flex items-center justify-between gap-4 px-5 py-3.5" style={{ background: "var(--doc-paper-raised)" }}>
                <span className="text-[13.5px]" style={{ color: "var(--doc-ink)" }}>{label}</span>
                <span className="font-mono-tech text-[10px] uppercase tracking-widest" style={{ color: "var(--doc-accent)" }}>{pts}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Vagas de emprego — links reais pra buscadores já existentes, filtrados */}
        <section id="vagas" className="border-b px-6 py-14 md:px-0 md:py-20" style={{ borderColor: "var(--doc-line)" }}>
          <div className="mb-8 max-w-xl">
            <div className="flex items-center gap-2 font-mono-tech text-[11px] uppercase tracking-widest" style={{ color: "var(--doc-accent)" }}>
              <span>§</span> Depois de gerar
            </div>
            <h2 className="mt-2.5 text-2xl sm:text-[32px]" style={headingSerif}>Vagas de emprego.</h2>
            <p className="mt-3 text-[13.5px] leading-[1.55]" style={{ color: "var(--doc-ink-soft)" }}>
              Escolha cidade, estado e nicho — a gente monta a busca certa nos maiores buscadores de vaga do mercado. Leve o currículo que você gerou aqui pra aplicar.
            </p>
          </div>

          <div className="max-w-2xl border p-5 sm:p-7" style={{ borderColor: "var(--doc-line-strong)", background: "var(--doc-paper-raised)" }}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="font-mono-tech text-[10px] uppercase tracking-widest" style={{ color: "var(--doc-ink-faint)" }}>Cidade</span>
                <input
                  value={jobCity}
                  onChange={(e) => setJobCity(e.target.value)}
                  placeholder="Ex.: Ibirité"
                  className="border px-3 py-2.5 text-[14px] outline-none"
                  style={{ borderColor: "var(--doc-line)", background: "var(--doc-paper)", color: "var(--doc-ink)" }}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="font-mono-tech text-[10px] uppercase tracking-widest" style={{ color: "var(--doc-ink-faint)" }}>Estado</span>
                <select
                  value={jobUf}
                  onChange={(e) => setJobUf(e.target.value)}
                  className="border px-3 py-2.5 text-[14px] outline-none"
                  style={{ borderColor: "var(--doc-line)", background: "var(--doc-paper)", color: "var(--doc-ink)" }}
                >
                  {BR_STATES.map((s) => (
                    <option key={s.uf} value={s.uf}>{s.name}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-4">
              <span className="font-mono-tech text-[10px] uppercase tracking-widest" style={{ color: "var(--doc-ink-faint)" }}>Nicho</span>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {["Todos", ...JOB_NICHES].map((n) => (
                  <button
                    key={n}
                    onClick={() => setJobNiche(n)}
                    className="rounded-full border px-3 py-1 font-mono-tech text-[10px] uppercase tracking-widest transition"
                    style={
                      jobNiche === n
                        ? { background: "var(--doc-accent)", borderColor: "var(--doc-accent)", color: "var(--doc-paper)" }
                        : { borderColor: "var(--doc-line-strong)", color: "var(--doc-ink-soft)" }
                    }
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleSearchJobs}
              disabled={!jobCity.trim()}
              className="mt-6 rounded-[2px] px-6 py-3 font-mono-tech text-[11px] uppercase tracking-[0.12em] transition duration-150 disabled:cursor-not-allowed disabled:opacity-40"
              style={{ background: "var(--doc-accent)", color: "var(--doc-paper)", border: "1px solid var(--doc-accent)" }}
            >
              Buscar vagas
            </button>

            {jobLinks && (
              <div className="mt-6 flex flex-col gap-2.5 border-t pt-6" style={{ borderColor: "var(--doc-line)" }}>
                {jobLinks.map((l) => (
                  <a
                    key={l.name}
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between border px-4 py-3 text-[14px] transition hover:-translate-y-0.5"
                    style={{ borderColor: "var(--doc-line-strong)", color: "var(--doc-ink)" }}
                  >
                    {l.name}
                    <span style={{ color: "var(--doc-accent)" }}>Abrir →</span>
                  </a>
                ))}
              </div>
            )}
          </div>
          <p className="mt-4 max-w-2xl text-[12px] leading-[1.5]" style={{ color: "var(--doc-ink-faint)" }}>
            Links reais pra buscadores de vaga externos e independentes — a Veronica não hospeda, seleciona nem garante as vagas listadas neles.
          </p>
        </section>

        {/* Thin, secondary CTA to the paid method */}
        <section className="flex flex-wrap items-center justify-between gap-6 px-6 py-12 md:px-0">
          <p className="max-w-sm text-[14px] leading-[1.55]" style={{ color: "var(--doc-ink-soft)" }}>
            Quer ajuda pra reescrever o conteúdo, não só a estrutura? Conheça o método completo Currículo-Certo.
          </p>
          <a
            href={HUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-[2px] border px-6 py-3 font-mono-tech text-[11px] uppercase tracking-[0.12em] transition duration-150 hover:-translate-y-0.5"
            style={{ borderColor: "var(--doc-line-strong)", color: "var(--doc-ink-soft)" }}
          >
            Ver o método completo
          </a>
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
