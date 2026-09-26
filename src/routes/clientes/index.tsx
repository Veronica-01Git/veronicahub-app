import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Clock, KeyRound, Loader2, ShieldAlert, ShieldCheck, Sparkles } from "lucide-react";
import { useState, type FormEvent } from "react";

import {
  AppleClientFrame,
  AppleClientNav,
  GlassCard,
  HoloBadge,
  HolographicField,
  SectionLabel,
} from "@/features/private-clients/components/apple-client-ui";
import { validateSeal, type ValidateSealResult } from "@/features/private-clients/access.functions";

export const Route = createFileRoute("/clientes/")({
  component: PrivateClientsPortal,
  head: () => ({
    meta: [
      { title: "Veronica Private Clients | Acesso por selo" },
      {
        name: "description",
        content: "Portal privado de clientes da Veronica Hub. Acesso pelo número de série do selo.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function PrivateClientsPortal() {
  const navigate = useNavigate();
  const validate = useServerFn(validateSeal);
  const [serial, setSerial] = useState("");
  const [state, setState] = useState<"idle" | "validating">("idle");
  const [result, setResult] = useState<ValidateSealResult | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!serial.trim() || state === "validating") return;

    setState("validating");
    setResult(null);
    try {
      const response = await validate({ data: { serial } });
      setResult(response);
      if (response.status === "granted") {
        setTimeout(() => {
          // /clientes/lz-team é a página pública do LZ; o ambiente privado
          // dele mora em /painel.
          if (response.slug === "lz-team") void navigate({ to: "/clientes/lz-team/painel" });
          else
            void navigate({ to: "/clientes/$clientSlug", params: { clientSlug: response.slug } });
        }, 550);
      }
    } catch {
      setResult({ status: "invalid" });
    } finally {
      setState("idle");
    }
  }

  return (
    <AppleClientFrame tone="aqua">
      <AppleClientNav
        eyebrow="Veronica Hub"
        title="Private Clients"
        right={<HoloBadge>acesso por selo</HoloBadge>}
      />

      <main className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-8 px-5 py-12 sm:px-8 lg:grid-cols-[1fr_.9fr] lg:py-20">
        <div className="relative py-8">
          <div className="pointer-events-none absolute -inset-10 overflow-hidden rounded-[64px]">
            <HolographicField tone="aqua" intensity={0.85} />
          </div>
          <div className="relative">
            <SectionLabel>Ambientes privados</SectionLabel>
            <h1 className="mt-6 max-w-3xl text-balance text-5xl font-semibold leading-[.92] tracking-[-.065em] text-black/90 sm:text-7xl">
              Cada cliente,
              <span
                className="block bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    "linear-gradient(92deg,#1d1d1f 2%,#008dc8 35%,#7957e8 66%,#1d1d1f 100%)",
                }}
              >
                seu próprio sistema.
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-[16px] leading-8 text-black/50">
              Vitrine, execução e acompanhamento separados por cliente. O número de série do selo direciona para o ambiente correspondente.
            </p>

            <div className="mt-10 grid max-w-xl gap-3 sm:grid-cols-3">
              {[
                ["01", "Identidade"],
                ["02", "Execução"],
                ["03", "Evolução"],
              ].map(([step, label]) => (
                <div key={step} className="rounded-[22px] border border-white/80 bg-white/62 p-4 backdrop-blur-xl">
                  <div className="text-[10px] font-semibold uppercase tracking-[.18em] text-black/30">{step}</div>
                  <div className="mt-4 text-sm font-semibold text-black/62">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <GlassCard className="relative overflow-hidden p-7 sm:p-9">
          <div className="pointer-events-none absolute inset-0">
            <HolographicField tone="violet" intensity={0.46} />
          </div>
          <div className="relative">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1d1d1f] text-white shadow-[0_16px_44px_rgba(0,0,0,.15)]">
              <KeyRound className="h-5 w-5" aria-hidden />
            </div>

            <SectionLabel>Acesso restrito</SectionLabel>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-.045em] text-black/86">
              Entre com o número de série do selo.
            </h2>
            <p className="mt-3 text-sm leading-6 text-black/45">
              A validação acontece no servidor. Seriais demonstrativos não liberam ambientes reais.
            </p>

            <form onSubmit={onSubmit} className="mt-8 grid gap-4" noValidate>
              <label htmlFor="seal-serial" className="text-[11px] font-semibold uppercase tracking-[.15em] text-black/38">
                Número de série
              </label>
              <div className="flex min-h-16 items-center gap-3 rounded-[20px] border border-black/[.08] bg-white/88 px-4 shadow-[0_10px_35px_rgba(0,0,0,.05)] focus-within:border-cyan-400">
                <Sparkles className="h-4 w-4 shrink-0 text-cyan-500" aria-hidden />
                <input
                  id="seal-serial"
                  value={serial}
                  onChange={(event) => setSerial(event.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                  aria-describedby="seal-status"
                  placeholder="VH-XXX-XX-AAAA-000000"
                  className="w-full bg-transparent font-mono text-[13px] uppercase tracking-[.1em] text-black/70 outline-none placeholder:text-black/24"
                />
              </div>

              <button
                type="submit"
                disabled={state === "validating" || !serial.trim()}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#1d1d1f] px-6 text-[13px] font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-45"
              >
                {state === "validating" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <ShieldCheck className="h-4 w-4" aria-hidden />}
                {state === "validating" ? "Validando" : "Acessar ambiente"}
              </button>
            </form>

            <div id="seal-status" role="status" aria-live="polite" className="mt-5 min-h-16">
              {result?.status === "granted" ? (
                <div className="flex items-center gap-3 rounded-[18px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  <ShieldCheck className="h-4 w-4" aria-hidden />
                  Acesso concedido · {result.displayName}
                </div>
              ) : null}
              {result?.status === "awaiting-seal" ? (
                <div className="flex items-center gap-3 rounded-[18px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  <Clock className="h-4 w-4" aria-hidden />
                  Selo aguardando ativação · {result.displayName}
                </div>
              ) : null}
              {result?.status === "invalid" ? (
                <div className="flex items-center gap-3 rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                  <ShieldAlert className="h-4 w-4" aria-hidden />
                  Número de série inválido.
                </div>
              ) : null}
            </div>

            <p className="mt-4 text-xs leading-5 text-black/36">
              Áreas reais não devem conter dados sensíveis protegidos apenas pelo serial público do selo. Camadas adicionais de acesso podem ser ativadas por cliente.
            </p>
          </div>
        </GlassCard>
      </main>
    </AppleClientFrame>
  );
}
