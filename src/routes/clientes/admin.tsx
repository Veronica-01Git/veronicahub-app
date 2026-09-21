import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, KeyRound, Loader2, LockKeyhole, LogOut, Mail, ShieldCheck } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import {
  AppleClientFrame,
  AppleClientNav,
  GlassCard,
  HoloBadge,
  HolographicField,
  SectionLabel,
} from "@/features/private-clients/components/apple-client-ui";
import {
  getPrivateClientsAdminDashboard,
  logoutPrivateClientsAdmin,
  requestClientsAdminSecurityCode,
  verifyClientsAdminSecurityCode,
} from "@/features/private-clients/admin.functions";

export const Route = createFileRoute("/clientes/admin")({
  component: PrivateClientsAdmin,
  head: () => ({
    meta: [
      { title: "Admin · Veronica Private Clients" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

type Dashboard = Awaited<ReturnType<typeof getPrivateClientsAdminDashboard>>;\ntype DashboardState = Dashboard | { ok: false; error: string };\n
function PrivateClientsAdmin() {
  const [dashboard, setDashboard] = useState<DashboardState | null>(null);
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<"email" | "code">("email");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function refresh() {
    setChecking(true);
    try {
      setDashboard(await getPrivateClientsAdminDashboard());
    } catch {
      setDashboard({ ok: false, error: "Não foi possível validar a sessão administrativa." });
    } finally {
      setChecking(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function requestCode(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setNotice(null);
    try {
      const result = await requestClientsAdminSecurityCode({ data: { email } });
      if (!result.ok) {
        setNotice(result.error);
        return;
      }
      setNotice(result.message);
      setStage("code");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Falha ao enviar a senha de segurança.");
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setNotice(null);
    try {
      const result = await verifyClientsAdminSecurityCode({ data: { email, code } });
      if (!result.ok) {
        setNotice(result.error);
        return;
      }
      setCode("");
      await refresh();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Falha ao confirmar o acesso.");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    setBusy(true);
    try {
      await logoutPrivateClientsAdmin();
      setDashboard({ ok: false, error: "Sessão encerrada." });
      setStage("email");
      setCode("");
      setNotice(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppleClientFrame tone="aqua">
      <AppleClientNav
        eyebrow="Veronica Private Clients"
        title="Admin"
        right={<HoloBadge>{dashboard?.ok ? "sessão verificada" : "acesso protegido"}</HoloBadge>}
      />

      <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:py-16">
        {checking ? (
          <GlassCard className="mx-auto max-w-xl p-10 text-center">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-cyan-500" aria-hidden />
            <div className="mt-5 text-xl font-semibold tracking-[-.03em] text-black/80">
              Validando sessão administrativa
            </div>
          </GlassCard>
        ) : dashboard?.ok ? (
          <AdminWorkspace dashboard={dashboard} busy={busy} onSignOut={signOut} />
        ) : (
          <AdminGate
            email={email}
            code={code}
            stage={stage}
            busy={busy}
            notice={notice}
            setEmail={setEmail}
            setCode={setCode}
            setStage={setStage}
            requestCode={requestCode}
            verifyCode={verifyCode}
          />
        )}
      </main>
    </AppleClientFrame>
  );
}

function AdminGate(props: {
  email: string;
  code: string;
  stage: "email" | "code";
  busy: boolean;
  notice: string | null;
  setEmail: (value: string) => void;
  setCode: (value: string) => void;
  setStage: (value: "email" | "code") => void;
  requestCode: (event: FormEvent) => Promise<void>;
  verifyCode: (event: FormEvent) => Promise<void>;
}) {
  return (
    <div className="mx-auto grid max-w-5xl gap-5 lg:grid-cols-[.9fr_1.1fr]">
      <GlassCard className="relative min-h-[520px] overflow-hidden p-8 sm:p-10">
        <div className="pointer-events-none absolute inset-0">
          <HolographicField tone="aqua" intensity={0.82} />
        </div>
        <div className="relative flex h-full flex-col">
          <HoloBadge>security layer</HoloBadge>
          <h1 className="mt-8 text-5xl font-semibold leading-[.92] tracking-[-.06em] text-black/88 sm:text-6xl">
            Admin em uma página.
          </h1>
          <p className="mt-6 max-w-md text-[15px] leading-7 text-black/50">
            O login usa e-mail autorizado e uma senha temporária de seis dígitos enviada por e-mail. A sessão privada dura até duas horas.
          </p>
          <div className="mt-auto space-y-3 pt-10 text-sm text-black/55">
            <div className="rounded-[20px] border border-white/80 bg-white/65 p-4 backdrop-blur-xl">01 · e-mail autorizado</div>
            <div className="rounded-[20px] border border-white/80 bg-white/65 p-4 backdrop-blur-xl">02 · senha de segurança de uso único</div>
            <div className="rounded-[20px] border border-white/80 bg-white/65 p-4 backdrop-blur-xl">03 · sessão isolada em cookie httpOnly</div>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-8 sm:p-10">
        <div className="flex min-h-[440px] flex-col justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1d1d1f] text-white">
            <LockKeyhole className="h-5 w-5" aria-hidden />
          </div>
          <SectionLabel>{props.stage === "email" ? "Login administrativo" : "Confirmação"}</SectionLabel>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-.045em] text-black/86">
            {props.stage === "email" ? "Entre com o e-mail autorizado." : "Digite a senha enviada ao e-mail."}
          </h2>

          {props.stage === "email" ? (
            <form onSubmit={props.requestCode} className="mt-8 grid gap-4">
              <label htmlFor="clients-admin-email" className="text-[11px] font-semibold uppercase tracking-[.15em] text-black/38">
                E-mail administrativo
              </label>
              <div className="flex min-h-14 items-center gap-3 rounded-[18px] border border-black/[.08] bg-white px-4">
                <Mail className="h-4 w-4 text-black/35" aria-hidden />
                <input
                  id="clients-admin-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={props.email}
                  onChange={(event) => props.setEmail(event.target.value)}
                  className="w-full bg-transparent text-[15px] outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={props.busy || !props.email.trim()}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#1d1d1f] px-6 text-[13px] font-semibold text-white disabled:opacity-45"
              >
                {props.busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                Enviar senha de segurança
              </button>
            </form>
          ) : (
            <form onSubmit={props.verifyCode} className="mt-8 grid gap-4">
              <div className="rounded-[18px] border border-black/[.06] bg-black/[.025] px-4 py-3 text-sm text-black/48">
                {props.email}
              </div>
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={props.code}
                onChange={(event) => props.setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                className="min-h-16 rounded-[18px] border border-black/[.08] bg-white px-5 text-center font-mono text-2xl tracking-[.42em] outline-none"
              />
              <button
                type="submit"
                disabled={props.busy || props.code.length !== 6}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#1d1d1f] px-6 text-[13px] font-semibold text-white disabled:opacity-45"
              >
                {props.busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                Confirmar e entrar
              </button>
              <button
                type="button"
                onClick={() => {
                  props.setStage("email");
                  props.setCode("");
                }}
                className="text-xs font-medium text-black/42"
              >
                usar outro e-mail
              </button>
            </form>
          )}

          {props.notice ? (
            <div className="mt-5 rounded-[18px] border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-900">
              {props.notice}
            </div>
          ) : null}
        </div>
      </GlassCard>
    </div>
  );
}

function AdminWorkspace({
  dashboard,
  busy,
  onSignOut,
}: {
  dashboard: Extract<DashboardState, { ok: true }>;
  busy: boolean;
  onSignOut: () => Promise<void>;
}) {
  return (
    <div className="grid gap-5">
      <GlassCard className="relative overflow-hidden p-7 sm:p-9">
        <div className="pointer-events-none absolute inset-0">
          <HolographicField tone="violet" intensity={0.56} />
        </div>
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div>
            <SectionLabel>Sessão confirmada</SectionLabel>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-.052em] text-black/88 sm:text-5xl">Clientes pessoais.</h1>
            <p className="mt-3 text-sm text-black/45">{dashboard.admin.email}</p>
          </div>
          <button
            type="button"
            onClick={() => void onSignOut()}
            disabled={busy}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-black/[.08] bg-white/75 px-4 text-[12px] font-semibold text-black/60"
          >
            <LogOut className="h-4 w-4" aria-hidden /> Sair
          </button>
        </div>
      </GlassCard>

      <div className="grid gap-5 lg:grid-cols-3">
        {dashboard.clients.map((client, index) => (
          <GlassCard key={client.id} interactive className="relative overflow-hidden p-6">
            <div className={`pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full blur-3xl ${index === 0 ? "bg-cyan-200/70" : index === 1 ? "bg-emerald-200/65" : "bg-violet-200/70"}`} />
            <div className="relative">
              <HoloBadge>{client.accessState === "active" ? "ativo" : "aguardando selo"}</HoloBadge>
              <h2 className="mt-8 text-2xl font-semibold tracking-[-.04em] text-black/84">{client.displayName}</h2>
              <p className="mt-3 min-h-12 text-sm leading-6 text-black/45">{client.tagline}</p>
              <div className="mt-6 rounded-[20px] border border-black/[.055] bg-white/70 p-4">
                <div className="text-[10px] font-semibold uppercase tracking-[.15em] text-black/34">Selo</div>
                <div className="mt-2 break-all font-mono text-xs text-black/55">{client.sealSerial ?? "não emitido"}</div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <a href={client.homePath} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#1d1d1f] px-4 text-[11px] font-semibold text-white">
                  Home <ArrowRight className="h-3.5 w-3.5" />
                </a>
                {client.executionPath ? (
                  <a href={client.executionPath} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-black/[.08] bg-white/75 px-4 text-[11px] font-semibold text-black/60">
                    Execução <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                ) : null}
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
