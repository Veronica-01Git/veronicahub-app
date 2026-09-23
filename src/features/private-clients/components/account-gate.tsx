import { useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { KeyRound, Loader2, LockKeyhole, LogOut, Mail } from "lucide-react";
import { logout, requestEmailCode, verifyEmailCode } from "@/lib/auth-server";

type AccountGateMode = "account-required" | "account-not-authorized" | "configuration-missing";

export function PrivateClientAccountGate({
  mode,
  onAccessChanged,
}: {
  readonly mode: AccountGateMode;
  readonly onAccessChanged: () => void | Promise<void>;
}) {
  const requestCode = useServerFn(requestEmailCode);
  const verifyCode = useServerFn(verifyEmailCode);
  const signOut = useServerFn(logout);
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitEmail(event: FormEvent) {
    event.preventDefault();
    if (!email.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      const result = await requestCode({ data: { email: email.trim() } });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setStep("code");
    } catch {
      setError("Não foi possível enviar o código agora.");
    } finally {
      setLoading(false);
    }
  }

  async function submitCode(event: FormEvent) {
    event.preventDefault();
    if (!code.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      const result = await verifyCode({
        data: { email: email.trim(), code: code.trim() },
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      await onAccessChanged();
    } catch {
      setError("Não foi possível confirmar o código agora.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAnotherEmail() {
    setLoading(true);
    setError(null);
    try {
      await signOut();
      setEmail("");
      setCode("");
      setStep("email");
      await onAccessChanged();
    } finally {
      setLoading(false);
    }
  }

  if (mode === "configuration-missing") {
    return (
      <div className="rounded-[18px] border border-amber-200 bg-amber-50 p-5 text-amber-950">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <LockKeyhole className="h-4 w-4" aria-hidden />
          Acesso seguro ainda não ativado
        </div>
        <p className="mt-2 text-sm leading-6 text-amber-900/70">
          O painel continuará fechado até que a lista privada de responsáveis seja configurada no
          servidor. Nenhuma conversa real foi exposta.
        </p>
      </div>
    );
  }

  if (mode === "account-not-authorized") {
    return (
      <div className="rounded-[18px] border border-rose-200 bg-rose-50 p-5 text-rose-950">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <LockKeyhole className="h-4 w-4" aria-hidden />
          Conta sem acesso a este ambiente
        </div>
        <p className="mt-2 text-sm leading-6 text-rose-900/70">
          O e-mail foi confirmado, mas não faz parte da equipe autorizada para ver os dados da
          Express Entulho.
        </p>
        <button
          type="button"
          onClick={() => void handleAnotherEmail()}
          disabled={loading}
          className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-full border border-rose-300 px-4 text-xs font-semibold transition hover:bg-white disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <LogOut className="h-4 w-4" aria-hidden />
          )}
          Usar outro e-mail
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-[18px] border border-black/[.08] bg-white/90 p-5 text-black shadow-[0_18px_50px_rgba(0,0,0,.06)]">
      <div className="flex items-center gap-2 text-sm font-semibold text-black/80">
        <KeyRound className="h-4 w-4 text-cyan-600" aria-hidden />
        Segunda confirmação
      </div>
      <p className="mt-2 text-sm leading-6 text-black/50">
        Confirme um e-mail autorizado. O selo identifica o projeto, mas não libera dados privados
        sozinho.
      </p>

      {step === "email" ? (
        <form onSubmit={submitEmail} className="mt-5 grid gap-3">
          <label htmlFor="private-client-email" className="text-xs font-semibold text-black/55">
            E-mail do responsável
          </label>
          <div className="flex min-h-12 items-center gap-2 rounded-xl border border-black/10 bg-white px-3 focus-within:border-cyan-400">
            <Mail className="h-4 w-4 text-black/35" aria-hidden />
            <input
              id="private-client-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="responsavel@empresa.com"
              className="w-full bg-transparent text-sm outline-none placeholder:text-black/25"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-black px-5 text-sm font-semibold text-white transition hover:bg-black/85 disabled:opacity-45"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Mail className="h-4 w-4" aria-hidden />
            )}
            Enviar código
          </button>
        </form>
      ) : (
        <form onSubmit={submitCode} className="mt-5 grid gap-3">
          <label htmlFor="private-client-code" className="text-xs font-semibold text-black/55">
            Código enviado para {email}
          </label>
          <input
            id="private-client-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
            placeholder="000000"
            className="min-h-12 rounded-xl border border-black/10 bg-white px-4 text-center font-mono text-lg tracking-[.28em] outline-none focus:border-cyan-400"
          />
          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-black px-5 text-sm font-semibold text-white transition hover:bg-black/85 disabled:opacity-45"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <LockKeyhole className="h-4 w-4" aria-hidden />
            )}
            Confirmar acesso
          </button>
          <button
            type="button"
            onClick={() => {
              setStep("email");
              setCode("");
              setError(null);
            }}
            className="text-xs font-medium text-black/45 hover:text-black/70"
          >
            Corrigir e-mail
          </button>
        </form>
      )}

      {error ? (
        <p role="alert" className="mt-3 text-sm text-rose-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
