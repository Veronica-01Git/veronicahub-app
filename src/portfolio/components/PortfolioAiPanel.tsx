import { useEffect, useState } from "react";
import { getCurrentUser, requestEmailCode, verifyEmailCode } from "@/lib/auth-server";
import { generateFreePortfolio, getMyPortfolioGeneration } from "../features/generator/portfolio-ai-server";
import type { PersonalBrief } from "../features/generator/personal-brief";
import type { PortfolioDraft } from "../types";

type Account = { id: string; email: string };

export function PortfolioAiPanel({ brief, onGenerated, isAi }: {
  brief: PersonalBrief;
  onGenerated: (draft: PortfolioDraft) => void;
  isAi: boolean;
}) {
  const [account, setAccount] = useState<Account | null>(null);
  const [checking, setChecking] = useState(true);
  const [status, setStatus] = useState("available");
  const [attempts, setAttempts] = useState(0);
  const [savedDraft, setSavedDraft] = useState<PortfolioDraft | null>(null);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [codeRequested, setCodeRequested] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const refresh = async () => {
    try {
      const result = await getMyPortfolioGeneration();
      if (result.authenticated) {
        setStatus(result.status);
        setAttempts("attempts" in result ? (result.attempts ?? 0) : 0);
        if (result.status === "complete" && result.draft) {
          setSavedDraft(result.draft);
          onGenerated(result.draft);
        }
      }
    } catch { setMessage("Não foi possível consultar sua geração agora. Tente novamente em instantes."); }
  };

  useEffect(() => {
    let active = true;
    void getCurrentUser().then(async (user) => {
      if (!active) return;
      if (user) {
        setAccount({ id: user.id, email: user.email });
        await refresh();
      }
    }).catch(() => { if (active) setMessage("Não foi possível consultar sua conta agora."); })
      .finally(() => { if (active) setChecking(false); });
    return () => { active = false; };
  }, []);

  const requestCode = async () => {
    setBusy(true); setMessage("");
    try {
      const response = await requestEmailCode({ data: { email } });
      if (response.ok) { setCodeRequested(true); setMessage("Enviamos um código para seu e-mail."); }
      else setMessage(response.error);
    } catch { setMessage("Não foi possível enviar o código. Revise o e-mail e tente novamente."); }
    finally { setBusy(false); }
  };

  const verifyCode = async () => {
    setBusy(true); setMessage("");
    try {
      const response = await verifyEmailCode({ data: { email, code } });
      if (response.ok) {
        setAccount({ id: response.user.id, email: response.user.email });
        setMessage("Acesso confirmado. Confira seu briefing antes de gerar.");
        await refresh();
      } else setMessage(response.error);
    } catch { setMessage("Não foi possível confirmar seu código. Tente novamente."); }
    finally { setBusy(false); }
  };

  const generate = async () => {
    setBusy(true); setMessage("");
    try {
      const result = await generateFreePortfolio({ data: brief });
      if (result.ok) {
        setStatus("complete");
        setSavedDraft(result.draft);
        onGenerated(result.draft);
        setMessage("Sua geração por IA foi salva nesta conta. Revise o texto antes de compartilhar.");
      } else {
        setMessage(result.error);
        await refresh();
      }
    } catch (error) { setMessage(error instanceof Error ? error.message : "Não foi possível gerar. Revise o briefing."); }
    finally { setBusy(false); }
  };

  return <div className="mx-auto mt-8 max-w-7xl rounded-[1.5rem] border border-emerald-300/25 bg-[#0b1715] p-6 md:p-8">
    <p className="text-xs uppercase tracking-[.18em] text-emerald-200">Veronica Portfolio · IA</p>
    <h3 className="mt-3 font-display text-2xl md:text-3xl">Uma apresentação escrita com a Veronica.</h3>
    <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/65">Use uma geração gratuita por conta para refinar sua frase de apresentação e o texto “Sobre”. Projetos, resultados, formação e contato continuam exatamente como você informou. A geração fica salva na sua conta.</p>
    <p className="mt-3 max-w-3xl text-xs leading-relaxed text-white/55">Ao selecionar Gerar com IA, seu nome, profissão, apresentação, competências, projetos, experiência e formação são enviados ao provedor Groq. O e-mail de contato não é enviado ao modelo. Confira as afirmações geradas antes de usar.</p>
    {checking ? <p className="mt-6 text-sm text-white/60">Consultando sua conta…</p> : !account ? <div className="mt-6 max-w-md space-y-4">
      <p className="text-sm font-medium">Entre com seu e-mail para vincular a geração gratuita à conta.</p>
      <label className="block text-sm text-white/70">Seu e-mail de acesso
        <input type="email" autoComplete="email" value={email} maxLength={254} onChange={e => setEmail(e.target.value)} className="mt-2 min-h-11 w-full rounded-lg border border-white/20 bg-white/5 px-4 text-white" />
      </label>
      <button type="button" disabled={busy || !email.includes("@")} onClick={requestCode} className="min-h-11 rounded-lg border border-emerald-300/40 px-5 text-sm text-emerald-200 disabled:opacity-40">{busy ? "Aguarde…" : "Receber código de acesso"}</button>
      {codeRequested && <div className="space-y-3"><label className="block text-sm text-white/70">Código recebido
        <input inputMode="numeric" autoComplete="one-time-code" value={code} maxLength={6} onChange={e => setCode(e.target.value)} className="mt-2 min-h-11 w-full rounded-lg border border-white/20 bg-white/5 px-4 text-white" />
      </label><button type="button" disabled={busy || code.length !== 6} onClick={verifyCode} className="min-h-11 rounded-lg bg-emerald-300 px-5 text-sm font-semibold text-[#07100c] disabled:opacity-40">Confirmar acesso</button></div>}
    </div> : <div className="mt-6">
      <p className="text-xs text-white/50">Conta: {account.email}</p>
      {status === "complete" ? <div className="mt-3 space-y-3"><p className="text-sm text-emerald-200">Sua geração gratuita está salva na conta{isAi ? " e foi carregada na prévia abaixo" : ""}.</p>
          {!isAi && savedDraft && <button type="button" onClick={() => onGenerated(savedDraft)} className="min-h-11 rounded-lg border border-emerald-300/40 px-4 text-sm text-emerald-200">Abrir versão salva pela IA</button>}</div>
        : <div className="mt-4 flex flex-wrap items-center gap-3">
          <button type="button" disabled={busy || status === "pending" || status === "unavailable" || attempts >= 3} onClick={generate} className="min-h-12 rounded-xl bg-emerald-300 px-6 font-semibold text-[#07100c] disabled:opacity-40">{busy ? "Gerando…" : "Gerar com IA gratuitamente"}</button>
          {attempts >= 3 && <p className="text-sm text-white/60">Tentativas encerradas após falhas repetidas. A prévia manual continua disponível.</p>}
          {(status === "pending" || status === "failed") && <button type="button" disabled={busy} onClick={() => { void refresh(); }} className="min-h-11 rounded-lg border border-white/20 px-4 text-sm">Atualizar estado</button>}
        </div>}
    </div>}
    {message && <p role="status" className="mt-4 text-sm text-emerald-100">{message}</p>}
  </div>;
}
