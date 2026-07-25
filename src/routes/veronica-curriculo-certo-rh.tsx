import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ChangeEvent, type CSSProperties, type FormEvent } from "react";
import { Menu, X } from "lucide-react";
import { HUB_URL } from "@/components/SiteChrome";
import { matchAgainstJob, type CandidateMatch, type JobRequirements } from "@/lib/resume-tools";
import { extractTextFromFile, ACCEPT_ATTR } from "@/lib/resume-parsers";
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

export const Route = createFileRoute("/veronica-curriculo-certo-rh")({
  component: CurriculoCertoRH,
  head: () => ({
    meta: [
      { title: "Área RH — Currículo-Certo | Veronica Hub" },
      {
        name: "description",
        content: "Defina os requisitos da vaga e triagem currículos automaticamente contra o ATS do Currículo-Certo. Pague só pelas triagens que fizer.",
      },
      { property: "og:title", content: "Área RH — Currículo-Certo" },
      { property: "og:description", content: "Triagem automatizada de currículos contra os requisitos da sua vaga." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

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

const SCREEN_PRICE_CENTS = 190; // R$1,90 por triagem — placeholder

function CurriculoCertoRH() {
  const [jobTitle, setJobTitle] = useState("");
  const [keywordsInput, setKeywordsInput] = useState("");
  const [requireExperience, setRequireExperience] = useState(true);
  const [requireEducation, setRequireEducation] = useState(true);
  const [requireSkills, setRequireSkills] = useState(false);
  const [jobSaved, setJobSaved] = useState(false);

  const [candidateInput, setCandidateInput] = useState("");
  const [fileError, setFileError] = useState<string | null>(null);
  const [fileParsing, setFileParsing] = useState(false);
  const [candidates, setCandidates] = useState<CandidateMatch[]>([]);

  const [session, setSession] = useState<Session | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authStep, setAuthStep] = useState<"identify" | "confirm">("identify");
  const [authChannel, setAuthChannel] = useState<AuthChannel>("email");
  const [authIdentifier, setAuthIdentifier] = useState("");
  const [authCode, setAuthCode] = useState("");
  const [pendingCode, setPendingCode] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<"screen" | null>(null);
  const [depositOpen, setDepositOpen] = useState(false);
  const [depositValue, setDepositValue] = useState(String(MIN_DEPOSIT_CENTS / 100));
  const [depositError, setDepositError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => { setSession(loadSession()); }, []);
  useEffect(() => { persistSession(session); }, [session]);
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 7000);
    return () => window.clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    if (!mobileOpen) return;
    function onKeyDown(e: KeyboardEvent) { if (e.key === "Escape") setMobileOpen(false); }
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKeyDown); document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const job: JobRequirements = useMemo(() => ({
    keywords: keywordsInput.split(",").map((k) => k.trim()).filter(Boolean),
    requireExperience,
    requireEducation,
    requireSkills,
  }), [keywordsInput, requireExperience, requireEducation, requireSkills]);

  const candidateWordCount = useMemo(() => candidateInput.trim().split(/\s+/).filter(Boolean).length, [candidateInput]);
  const canScreen = jobSaved && candidateWordCount >= 30;

  function openAuth(action: "screen" | null) {
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
    if (authChannel === "email" && !validEmail) { setAuthError("Digite um e-mail válido."); return; }
    if (authChannel === "phone" && !validPhone) { setAuthError("Digite um celular válido, com DDD."); return; }
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

  function runScreening(currentSession: Session) {
    setSession({ ...currentSession, balanceCents: currentSession.balanceCents - SCREEN_PRICE_CENTS });
    const result = matchAgainstJob(candidateInput, job);
    setCandidates((prev) => [result, ...prev]);
    setCandidateInput("");
    setToast(`Triagem concluída. ${formatBRL(SCREEN_PRICE_CENTS)} debitado do saldo (simulado).`);
  }

  function confirmCode(e: FormEvent) {
    e.preventDefault();
    if (!pendingCode) return;
    if (authCode.trim() !== pendingCode) { setAuthError("Código incorreto. Confira e tente de novo."); return; }
    const newSession = session ?? createSession(authChannel, authIdentifier.trim());
    setSession(newSession);
    setToast("Sessão confirmada (simulada).");
    if (pendingAction === "screen" && canScreen) {
      if (newSession.balanceCents >= SCREEN_PRICE_CENTS) runScreening(newSession);
      else { setDepositError(null); setDepositOpen(true); }
    }
    closeAuth();
  }
  function handleLogout() { setSession(null); }
  function handleDeposit(e: FormEvent) {
    e.preventDefault();
    if (!session) return;
    const cents = Math.round(parseFloat(depositValue.replace(",", ".")) * 100);
    if (Number.isNaN(cents) || cents < MIN_DEPOSIT_CENTS) { setDepositError(`Depósito mínimo é ${formatBRL(MIN_DEPOSIT_CENTS)}.`); return; }
    setDepositError(null);
    setSession({ ...session, balanceCents: session.balanceCents + cents });
    setDepositOpen(false);
    setToast(`Depósito simulado de ${formatBRL(cents)} creditado. Nenhum valor real foi cobrado.`);
  }

  function handleSaveJob(e: FormEvent) {
    e.preventDefault();
    if (!jobTitle.trim() || job.keywords.length === 0) return;
    setJobSaved(true);
    setToast("Vaga salva. Já pode triar currículos contra esses requisitos.");
  }

  function handleScreen() {
    if (!canScreen) return;
    if (!session) { openAuth("screen"); return; }
    if (session.balanceCents < SCREEN_PRICE_CENTS) { setDepositError(null); setDepositOpen(true); return; }
    runScreening(session);
  }

  async function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setFileError(null);
    setFileParsing(true);
    try {
      const { text, warning } = await extractTextFromFile(file);
      setCandidateInput(text);
      setFileError(warning ?? null);
    } catch (err) {
      setFileError(err instanceof Error ? err.message : "Não consegui ler esse arquivo. Cole o texto direto.");
    } finally {
      setFileParsing(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden" style={{ ...doc, background: "var(--doc-paper)", color: "var(--doc-ink)", fontFamily: sansStack }}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 hidden md:block"
        style={{ left: "clamp(20px, 5.4vw, 76px)", width: "1px", background: "linear-gradient(to bottom, transparent 0%, var(--doc-red) 6%, var(--doc-red) 94%, transparent 100%)", opacity: 0.55 }}
      />

      <header className="flex items-center justify-between gap-6 border-b px-6 py-5 md:pl-[92px] md:pr-10" style={{ borderColor: "var(--doc-line)" }}>
        <Link to="/veronica-curriculo-certo" className="flex items-baseline gap-2 font-mono-tech text-xs uppercase tracking-widest">
          <span style={{ color: "var(--doc-ink-faint)" }}>Veronica ·</span>
          <span className="font-semibold" style={{ color: "var(--doc-accent)" }}>Currículo-Certo RH</span>
        </Link>
        <nav className="hidden items-center gap-7 font-mono-tech text-[11px] uppercase tracking-widest sm:flex" style={{ color: "var(--doc-ink-soft)" }}>
          <Link to="/veronica-curriculo-certo" className="border-b border-transparent pb-0.5 transition hover:border-current">Sou candidato</Link>
          <a href="#vaga" className="border-b border-transparent pb-0.5 transition hover:border-current">Definir vaga</a>
          <a href="#triagem" className="border-b border-transparent pb-0.5 transition hover:border-current">Triagem</a>
        </nav>
        <div className="flex items-center gap-3 font-mono-tech text-[11px] uppercase tracking-widest">
          {session ? (
            <>
              <span className="hidden sm:inline" style={{ color: "var(--doc-ink-soft)" }}>{session.identifier}</span>
              <span style={{ color: "var(--doc-accent)" }}>{formatBRL(session.balanceCents)}</span>
              <button onClick={() => { setDepositError(null); setDepositOpen((v) => !v); }} className="hidden rounded-[2px] border px-3 py-1.5 transition hover:-translate-y-0.5 sm:inline-block" style={{ borderColor: "var(--doc-line-strong)", color: "var(--doc-ink-soft)" }}>
                Depositar
              </button>
              <button onClick={handleLogout} className="hidden transition hover:opacity-70 sm:inline-block" style={{ color: "var(--doc-ink-faint)" }}>Sair</button>
            </>
          ) : (
            <button onClick={() => (authOpen ? closeAuth() : openAuth(null))} className="hidden rounded-[2px] border px-3.5 py-1.5 transition hover:-translate-y-0.5 sm:inline-block" style={{ borderColor: "var(--doc-line-strong)", color: "var(--doc-ink-soft)" }}>
              Entrar
            </button>
          )}
          <button type="button" onClick={() => setMobileOpen((v) => !v)} aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"} aria-expanded={mobileOpen} className="flex h-9 w-9 items-center justify-center rounded-[2px] border sm:hidden" style={{ borderColor: "var(--doc-line-strong)", color: "var(--doc-ink)" }}>
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-x-0 top-[61px] bottom-0 z-40 overflow-y-auto sm:hidden" style={{ background: "var(--doc-paper)" }}>
          <nav className="flex flex-col gap-1 px-6 py-6 font-mono-tech text-sm uppercase tracking-wider">
            <Link to="/veronica-curriculo-certo" onClick={() => setMobileOpen(false)} className="border-b py-3.5" style={{ borderColor: "var(--doc-line)", color: "var(--doc-ink)" }}>Sou candidato</Link>
            <a href="#vaga" onClick={() => setMobileOpen(false)} className="border-b py-3.5" style={{ borderColor: "var(--doc-line)", color: "var(--doc-ink)" }}>Definir vaga</a>
            <a href="#triagem" onClick={() => setMobileOpen(false)} className="border-b py-3.5" style={{ borderColor: "var(--doc-line)", color: "var(--doc-ink)" }}>Triagem</a>
            <div className="mt-6 flex flex-col gap-3">
              {session ? (
                <>
                  <div className="text-[11px]" style={{ color: "var(--doc-ink-soft)" }}>{session.identifier} · {formatBRL(session.balanceCents)}</div>
                  <button onClick={() => { setDepositError(null); setDepositOpen(true); setMobileOpen(false); }} className="rounded-[2px] border px-4 py-3 text-[11px]" style={{ borderColor: "var(--doc-line-strong)", color: "var(--doc-ink-soft)" }}>Depositar</button>
                  <button onClick={() => { handleLogout(); setMobileOpen(false); }} className="text-[11px]" style={{ color: "var(--doc-ink-faint)" }}>Sair</button>
                </>
              ) : (
                <button onClick={() => { openAuth(null); setMobileOpen(false); }} className="rounded-[2px] px-4 py-3 text-[11px]" style={{ background: "var(--doc-accent)", color: "var(--doc-paper)" }}>Entrar</button>
              )}
            </div>
          </nav>
        </div>
      )}

      {authOpen && !session && (
        <div className="border-b px-6 py-4 md:pl-[92px] md:pr-10" style={{ borderColor: "var(--doc-line)", background: "var(--doc-accent-soft)" }}>
          {authStep === "identify" ? (
            <form onSubmit={requestCode} className="flex flex-wrap items-center gap-2.5">
              <span className="font-mono-tech text-[10.5px] uppercase tracking-widest" style={{ color: "var(--doc-ink-soft)" }}>Entrar ou criar conta —</span>
              <div className="flex overflow-hidden rounded-[2px] border" style={{ borderColor: "var(--doc-line-strong)" }}>
                <button type="button" onClick={() => { setAuthChannel("email"); setAuthIdentifier(""); setAuthError(null); }} className="px-3 py-1.5 font-mono-tech text-[10.5px] uppercase tracking-widest" style={{ background: authChannel === "email" ? "var(--doc-accent)" : "var(--doc-paper-raised)", color: authChannel === "email" ? "var(--doc-paper)" : "var(--doc-ink-soft)" }}>E-mail</button>
                <button type="button" onClick={() => { setAuthChannel("phone"); setAuthIdentifier(""); setAuthError(null); }} className="px-3 py-1.5 font-mono-tech text-[10.5px] uppercase tracking-widest" style={{ background: authChannel === "phone" ? "var(--doc-accent)" : "var(--doc-paper-raised)", color: authChannel === "phone" ? "var(--doc-paper)" : "var(--doc-ink-soft)" }}>Celular</button>
              </div>
              <input type={authChannel === "email" ? "email" : "tel"} required autoFocus value={authIdentifier} onChange={(e) => setAuthIdentifier(e.target.value)} placeholder={authChannel === "email" ? "rh@empresa.com" : "(11) 98888-7777"} className="border px-3 py-1.5 text-[13px] outline-none" style={{ borderColor: "var(--doc-line-strong)", background: "var(--doc-paper-raised)", color: "var(--doc-ink)" }} />
              <button type="submit" className="rounded-[2px] px-4 py-1.5 font-mono-tech text-[10.5px] uppercase tracking-widest" style={{ background: "var(--doc-accent)", color: "var(--doc-paper)" }}>Enviar código</button>
              <button type="button" onClick={closeAuth} className="font-mono-tech text-[10.5px] uppercase tracking-widest" style={{ color: "var(--doc-ink-faint)" }}>Cancelar</button>
              {authError && <span className="w-full font-mono-tech text-[10.5px] uppercase tracking-widest" style={{ color: "var(--doc-red)" }}>{authError}</span>}
            </form>
          ) : (
            <form onSubmit={confirmCode} className="flex flex-wrap items-center gap-2.5">
              <span className="font-mono-tech text-[10.5px] uppercase tracking-widest" style={{ color: "var(--doc-ink-soft)" }}>Código enviado (simulado) para {authIdentifier} —</span>
              {pendingCode && (
                <button type="button" onClick={() => setAuthCode(pendingCode)} className="rounded-[2px] border border-dashed px-3 py-1.5 font-mono-tech text-[13px] tracking-[0.3em]" style={{ borderColor: "var(--doc-accent)", color: "var(--doc-accent)" }} title="Clique para preencher automaticamente">
                  {pendingCode}
                </button>
              )}
              <input type="text" inputMode="numeric" maxLength={6} required autoFocus value={authCode} onChange={(e) => setAuthCode(e.target.value.replace(/\D/g, ""))} placeholder="000000" className="w-28 border px-3 py-1.5 text-center text-[15px] outline-none" style={{ borderColor: "var(--doc-line-strong)", background: "var(--doc-paper-raised)", color: "var(--doc-ink)", fontFamily: "var(--font-mono)", letterSpacing: "0.3em" }} />
              <button type="submit" className="rounded-[2px] px-4 py-1.5 font-mono-tech text-[10.5px] uppercase tracking-widest" style={{ background: "var(--doc-accent)", color: "var(--doc-paper)" }}>Confirmar</button>
              <button type="button" onClick={resendCode} className="font-mono-tech text-[10.5px] uppercase tracking-widest" style={{ color: "var(--doc-ink-soft)" }}>Reenviar</button>
              <button type="button" onClick={() => { setAuthStep("identify"); setAuthError(null); }} className="font-mono-tech text-[10.5px] uppercase tracking-widest" style={{ color: "var(--doc-ink-faint)" }}>Trocar</button>
              <button type="button" onClick={closeAuth} className="font-mono-tech text-[10.5px] uppercase tracking-widest" style={{ color: "var(--doc-ink-faint)" }}>Cancelar</button>
              {authError && <span className="w-full font-mono-tech text-[10.5px] uppercase tracking-widest" style={{ color: "var(--doc-red)" }}>{authError}</span>}
            </form>
          )}
        </div>
      )}

      {depositOpen && session && (
        <form onSubmit={handleDeposit} className="flex flex-wrap items-center gap-2.5 border-b px-6 py-4 md:pl-[92px] md:pr-10" style={{ borderColor: "var(--doc-line)", background: "var(--doc-accent-soft)" }}>
          <span className="font-mono-tech text-[10.5px] uppercase tracking-widest" style={{ color: "var(--doc-ink-soft)" }}>Depósito simulado — mínimo {formatBRL(MIN_DEPOSIT_CENTS)}</span>
          <span className="font-mono-tech text-[12px]" style={{ color: "var(--doc-ink)" }}>R$</span>
          <input type="text" inputMode="decimal" required autoFocus value={depositValue} onChange={(e) => setDepositValue(e.target.value)} className="w-24 border px-3 py-1.5 text-[13px] outline-none" style={{ borderColor: "var(--doc-line-strong)", background: "var(--doc-paper-raised)", color: "var(--doc-ink)" }} />
          <button type="submit" className="rounded-[2px] px-4 py-1.5 font-mono-tech text-[10.5px] uppercase tracking-widest" style={{ background: "var(--doc-accent)", color: "var(--doc-paper)" }}>Confirmar (simulado)</button>
          <button type="button" onClick={() => setDepositOpen(false)} className="font-mono-tech text-[10.5px] uppercase tracking-widest" style={{ color: "var(--doc-ink-faint)" }}>Cancelar</button>
          {depositError && <span className="w-full font-mono-tech text-[10.5px] uppercase tracking-widest" style={{ color: "var(--doc-red)" }}>{depositError}</span>}
        </form>
      )}

      {toast && (
        <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-[2px] border px-4 py-2.5 font-mono-tech text-[11px] uppercase tracking-widest shadow-sm" style={{ borderColor: "var(--doc-accent)", background: "var(--doc-paper-raised)", color: "var(--doc-accent)" }}>
          {toast}
        </div>
      )}

      <main className="md:pl-[92px] md:pr-10">
        <section className="border-b px-6 py-14 md:px-0 md:py-20" style={{ borderColor: "var(--doc-line)" }}>
          <div className="max-w-2xl">
            <div className="flex items-center gap-2.5 font-mono-tech text-[11px] uppercase tracking-widest" style={{ color: "var(--doc-accent)" }}>
              <span className="h-px w-5" style={{ background: "var(--doc-accent)" }} />
              Portal RH · Currículo-Certo
            </div>
            <h1 className="mt-5 text-[34px] sm:text-5xl md:text-6xl" style={headingSerif}>
              Recrute com<br />o <em className="not-italic" style={{ color: "var(--doc-accent)" }}>ATS certo</em>.
            </h1>
            <p className="mt-5 max-w-md text-[15.5px] leading-[1.6]" style={{ color: "var(--doc-ink-soft)" }}>
              Defina os requisitos da vaga, cole os currículos recebidos e deixe o mesmo motor de ATS do Currículo-Certo rankear quem realmente atende ao que você precisa. {formatBRL(SCREEN_PRICE_CENTS)} por triagem.
            </p>
          </div>
        </section>

        {/* Job requirements */}
        <section id="vaga" className="border-b px-6 py-14 md:px-0 md:py-20" style={{ borderColor: "var(--doc-line)" }}>
          <div className="mb-8 max-w-xl">
            <div className="flex items-center gap-2 font-mono-tech text-[11px] uppercase tracking-widest" style={{ color: "var(--doc-accent)" }}>
              <span>§</span> Passo 1
            </div>
            <h2 className="mt-2.5 text-2xl sm:text-[32px]" style={headingSerif}>Os requisitos da vaga.</h2>
          </div>
          <form onSubmit={handleSaveJob} className="max-w-2xl border p-5 sm:p-7" style={{ borderColor: "var(--doc-line-strong)", background: "var(--doc-paper-raised)" }}>
            <label className="block font-mono-tech text-[10.5px] uppercase tracking-widest" style={{ color: "var(--doc-ink-faint)" }}>Título da vaga</label>
            <input
              value={jobTitle}
              onChange={(e) => { setJobTitle(e.target.value); setJobSaved(false); }}
              placeholder="Ex.: Analista de Marketing Pleno"
              className="mt-2 w-full border px-3 py-2.5 text-[14px] outline-none"
              style={{ borderColor: "var(--doc-line)", background: "var(--doc-paper)", color: "var(--doc-ink)" }}
            />
            <label className="mt-5 block font-mono-tech text-[10.5px] uppercase tracking-widest" style={{ color: "var(--doc-ink-faint)" }}>Palavras-chave obrigatórias (separadas por vírgula)</label>
            <textarea
              value={keywordsInput}
              onChange={(e) => { setKeywordsInput(e.target.value); setJobSaved(false); }}
              placeholder="Ex.: Excel, gestão de projetos, inglês avançado, SQL"
              rows={3}
              className="mt-2 w-full resize-y border px-3 py-2.5 text-[14px] leading-[1.6] outline-none"
              style={{ borderColor: "var(--doc-line)", background: "var(--doc-paper)", color: "var(--doc-ink)" }}
            />
            <div className="mt-5 flex flex-wrap gap-4">
              {[
                { label: "Exigir seção Experiência", checked: requireExperience, set: setRequireExperience },
                { label: "Exigir seção Formação", checked: requireEducation, set: setRequireEducation },
                { label: "Exigir seção Habilidades", checked: requireSkills, set: setRequireSkills },
              ].map((f) => (
                <label key={f.label} className="flex items-center gap-2 text-[13px]" style={{ color: "var(--doc-ink-soft)" }}>
                  <input type="checkbox" checked={f.checked} onChange={(e) => { f.set(e.target.checked); setJobSaved(false); }} />
                  {f.label}
                </label>
              ))}
            </div>
            <button
              type="submit"
              disabled={!jobTitle.trim() || job.keywords.length === 0}
              className="mt-6 rounded-[2px] px-6 py-3 font-mono-tech text-[11px] uppercase tracking-[0.12em] transition duration-150 disabled:cursor-not-allowed disabled:opacity-40"
              style={{ background: "var(--doc-accent)", color: "var(--doc-paper)", border: "1px solid var(--doc-accent)" }}
            >
              {jobSaved ? "Vaga salva ✓" : "Salvar vaga"}
            </button>
          </form>
        </section>

        {/* Screening */}
        <section id="triagem" className="border-b px-6 py-14 md:px-0 md:py-20" style={{ borderColor: "var(--doc-line)" }}>
          <div className="mb-8 max-w-xl">
            <div className="flex items-center gap-2 font-mono-tech text-[11px] uppercase tracking-widest" style={{ color: "var(--doc-accent)" }}>
              <span>§</span> Passo 2
            </div>
            <h2 className="mt-2.5 text-2xl sm:text-[32px]" style={headingSerif}>Triagem de currículos.</h2>
            {!jobSaved && (
              <p className="mt-3 text-[13.5px]" style={{ color: "var(--doc-red)" }}>Salve a vaga acima antes de triar currículos.</p>
            )}
          </div>

          <div className="max-w-2xl border p-5 sm:p-7" style={{ borderColor: "var(--doc-line-strong)", background: "var(--doc-paper-raised)" }}>
            <textarea
              value={candidateInput}
              onChange={(e) => setCandidateInput(e.target.value)}
              placeholder="Cole aqui o currículo do candidato..."
              rows={8}
              className="w-full resize-y border p-4 text-[14px] leading-[1.6] outline-none"
              style={{ borderColor: "var(--doc-line)", background: "var(--doc-paper)", color: "var(--doc-ink)" }}
            />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <label className="cursor-pointer rounded-[2px] border px-3.5 py-2 font-mono-tech text-[10.5px] uppercase tracking-widest transition hover:-translate-y-0.5" style={{ borderColor: "var(--doc-line-strong)", color: "var(--doc-ink-soft)", opacity: fileParsing ? 0.5 : 1 }}>
                  {fileParsing ? "Lendo arquivo…" : "Enviar arquivo"}
                  <input type="file" accept={ACCEPT_ATTR} onChange={onFileChange} disabled={fileParsing} className="hidden" />
                </label>
                <span className="font-mono-tech text-[10.5px] uppercase tracking-widest" style={{ color: candidateWordCount >= 30 ? "var(--doc-ink-faint)" : "var(--doc-red)" }}>
                  {candidateWordCount} palavras · mínimo 30
                </span>
              </div>
              <button
                onClick={handleScreen}
                disabled={!canScreen}
                className="rounded-[2px] px-6 py-3 font-mono-tech text-[11px] uppercase tracking-[0.12em] transition duration-150 disabled:cursor-not-allowed disabled:opacity-40"
                style={{ background: "var(--doc-accent)", color: "var(--doc-paper)", border: "1px solid var(--doc-accent)" }}
              >
                {!session ? "Entrar para triar" : session.balanceCents < SCREEN_PRICE_CENTS ? `Depositar · faltam ${formatBRL(SCREEN_PRICE_CENTS - session.balanceCents)}` : `Analisar candidato · ${formatBRL(SCREEN_PRICE_CENTS)}`}
              </button>
            </div>
            {fileError && <p className="mt-3 text-[13px]" style={{ color: "var(--doc-red)" }}>{fileError}</p>}
          </div>

          {candidates.length > 0 && (
            <div className="mt-10 max-w-4xl">
              <div className="mb-4 font-mono-tech text-[11px] uppercase tracking-widest" style={{ color: "var(--doc-ink-faint)" }}>
                {candidates.length} candidato{candidates.length > 1 ? "s" : ""} triado{candidates.length > 1 ? "s" : ""} — ordenado por aderência
              </div>
              <div className="flex flex-col gap-3">
                {[...candidates].sort((a, b) => b.matchPercent - a.matchPercent).map((c, i) => (
                  <div key={i} className="border p-5" style={{ borderColor: c.pass ? "var(--doc-accent)" : "var(--doc-line-strong)", background: "var(--doc-paper-raised)" }}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="text-[15px] font-medium" style={{ color: "var(--doc-ink)" }}>{c.name}</span>
                      <span
                        className="rounded-full px-3 py-1 font-mono-tech text-[10.5px] uppercase tracking-widest"
                        style={{ background: c.pass ? "var(--doc-accent)" : "transparent", color: c.pass ? "var(--doc-paper)" : "var(--doc-red)", border: c.pass ? "none" : "1px solid var(--doc-red)" }}
                      >
                        {c.pass ? "Aprovado" : "Não atende"} · {c.matchPercent}%
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-4 font-mono-tech text-[10.5px] uppercase tracking-widest" style={{ color: "var(--doc-ink-faint)" }}>
                      <span>ATS estrutural: {c.atsScore}/{c.atsMax}</span>
                      <span>Palavras-chave: {c.matchedKeywords.length}/{c.matchedKeywords.length + c.missingKeywords.length}</span>
                    </div>
                    {(c.missingKeywords.length > 0 || c.missingRequirements.length > 0) && (
                      <p className="mt-3 text-[13px] leading-[1.5]" style={{ color: "var(--doc-ink-soft)" }}>
                        Faltando: {[...c.missingKeywords, ...c.missingRequirements].join(", ")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="flex flex-wrap items-center justify-between gap-6 px-6 py-12 md:px-0">
          <p className="max-w-sm text-[14px] leading-[1.55]" style={{ color: "var(--doc-ink-soft)" }}>
            Candidato buscando otimizar o próprio currículo? Ele fica do outro lado.
          </p>
          <Link
            to="/veronica-curriculo-certo"
            className="rounded-[2px] border px-6 py-3 font-mono-tech text-[11px] uppercase tracking-[0.12em] transition duration-150 hover:-translate-y-0.5"
            style={{ borderColor: "var(--doc-line-strong)", color: "var(--doc-ink-soft)" }}
          >
            Ir para área do candidato
          </Link>
        </section>
      </main>

      <footer className="flex flex-wrap items-center justify-between gap-4 border-t px-6 py-6 font-mono-tech text-[10.5px] uppercase tracking-widest md:px-10" style={{ borderColor: "var(--doc-line)", color: "var(--doc-ink-faint)" }}>
        <span>Veronica Hub © 2026</span>
        <a href={HUB_URL} target="_blank" rel="noopener noreferrer" className="transition hover:opacity-70">Hub</a>
      </footer>
    </div>
  );
}
