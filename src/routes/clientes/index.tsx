import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, type FormEvent } from "react";
import { KeyRound, Loader2, ShieldCheck, ShieldAlert, Clock } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
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
      { property: "og:title", content: "Veronica Private Clients" },
      {
        property: "og:description",
        content: "Ambientes privados construídos para operações reais.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
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
          void navigate({ to: "/clientes/$clientSlug", params: { clientSlug: response.slug } });
        }, 500);
      }
    } catch {
      setResult({ status: "invalid" });
    } finally {
      setState("idle");
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto flex min-h-[72vh] max-w-2xl flex-col justify-center px-6 py-16">
        <div className="font-mono-tech text-[10px] uppercase tracking-[.2em] text-neon-green">
          Acesso restrito
        </div>
        <h1 className="mt-4 font-display text-5xl leading-[.95] tracking-[-.05em] sm:text-6xl">
          Veronica Private Clients
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Ambientes privados construídos para operações reais.
        </p>

        <form onSubmit={onSubmit} className="mt-10 grid gap-4" noValidate>
          <label htmlFor="seal-serial" className="font-mono-tech text-[10px] uppercase tracking-widest text-muted-foreground">
            Número de série do selo
          </label>
          <div className="flex items-center gap-3 rounded-sm border border-border/70 bg-surface/50 px-4 focus-within:border-neon-green/70">
            <KeyRound className="h-4 w-4 shrink-0 text-neon-cyan" aria-hidden />
            <input
              id="seal-serial"
              name="seal-serial"
              value={serial}
              onChange={(event) => setSerial(event.target.value)}
              autoComplete="off"
              spellCheck={false}
              inputMode="text"
              aria-describedby="seal-status"
              placeholder="VH-XXX-XX-AAAA-000000"
              className="min-h-14 w-full bg-transparent font-mono-tech text-sm tracking-widest outline-none placeholder:text-muted-foreground/50"
            />
          </div>
          <button
            type="submit"
            disabled={state === "validating" || !serial.trim()}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-sm bg-neon-green px-6 font-mono-tech text-[11px] uppercase tracking-widest text-primary-foreground transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neon-cyan disabled:opacity-50"
          >
            {state === "validating" ? (
              <>
                <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden /> Validando
              </>
            ) : (
              "Acessar ambiente"
            )}
          </button>
        </form>

        <div id="seal-status" role="status" aria-live="polite" className="mt-6 min-h-16">
          {result?.status === "granted" && (
            <p className="flex items-center gap-2 rounded-sm border border-neon-green/50 bg-neon-green/[.07] p-4 text-sm text-neon-green">
              <ShieldCheck className="h-4 w-4" aria-hidden /> Acesso concedido · {result.displayName}
            </p>
          )}
          {result?.status === "awaiting-seal" && (
            <p className="flex items-center gap-2 rounded-sm border border-amber-400/45 bg-amber-400/[.07] p-4 text-sm text-amber-500">
              <Clock className="h-4 w-4" aria-hidden /> Selo aguardando ativação · {result.displayName}
            </p>
          )}
          {result?.status === "invalid" && (
            <p className="flex items-center gap-2 rounded-sm border border-destructive/50 bg-destructive/[.07] p-4 text-sm text-destructive">
              <ShieldAlert className="h-4 w-4" aria-hidden /> Número de série inválido.
            </p>
          )}
        </div>

        <p className="mt-8 text-xs leading-relaxed text-muted-foreground">
          Área sem cadastro público. O acesso é concedido apenas a clientes com selo de procedência
          emitido pela Veronica Hub.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
