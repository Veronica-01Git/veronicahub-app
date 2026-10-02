/**
 * Atendimento Assistido — operador cola a mensagem recebida no WhatsApp,
 * a agente gera um rascunho com as mesmas regras comerciais, e a pessoa copia
 * a resposta de volta. Não lê, envia, apaga ou altera nada no WhatsApp.
 */

import { useState } from "react";
import { Bot, Clipboard, RotateCcw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { conversarComAgente } from "@/features/express-ops-b/data/agente";
import { OpsCard, SectionTitle } from "@/features/express-ops-b/components/primitives";

type TurnoLocal = {
  readonly role: "user" | "assistant";
  readonly content: string;
};

export function AtendimentoAssistido() {
  const [mensagem, setMensagem] = useState("");
  const [historico, setHistorico] = useState<readonly TurnoLocal[]>([]);
  const [rascunho, setRascunho] = useState("");
  const [pensando, setPensando] = useState(false);
  const [copiado, setCopiado] = useState(false);

  async function gerar() {
    const texto = mensagem.trim();
    if (!texto || pensando) return;

    setPensando(true);
    setCopiado(false);
    try {
      const resposta = await conversarComAgente({
        data: { mensagem: texto, historico: [...historico] },
      });
      setRascunho(resposta.texto);
      setHistorico((atual) => [
        ...atual,
        { role: "user", content: texto },
        { role: "assistant", content: resposta.texto },
      ]);
      setMensagem("");
    } finally {
      setPensando(false);
    }
  }

  async function copiar() {
    if (!rascunho) return;
    await navigator.clipboard.writeText(rascunho);
    setCopiado(true);
  }

  function novaConversa() {
    setMensagem("");
    setRascunho("");
    setHistorico([]);
    setCopiado(false);
  }

  return (
    <OpsCard as="section" className="border-[oklch(0.82_0.06_255)] bg-[var(--ops-accent-soft)]">
      <SectionTitle
        titulo="Atendimento assistido"
        apoio="Cole a mensagem do cliente, revise o rascunho e copie de volta para o WhatsApp Business"
        acao={
          <Button type="button" size="sm" variant="outline" onClick={novaConversa}>
            <RotateCcw aria-hidden className="h-3.5 w-3.5" />
            Nova conversa
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <label htmlFor="mensagem-assistida" className="ops-label mb-2 block">
            Mensagem recebida
          </label>
          <textarea
            id="mensagem-assistida"
            rows={6}
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value)}
            maxLength={1200}
            placeholder="Cole aqui exatamente o que o cliente mandou no WhatsApp…"
            className="w-full resize-y rounded-[10px] border border-[var(--ops-line-strong)] bg-white px-3 py-2.5 text-[13.5px] leading-relaxed text-[var(--ops-ink)] outline-none focus:border-[var(--ops-accent)]"
          />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Button type="button" size="sm" onClick={() => void gerar()} disabled={!mensagem.trim() || pensando}>
              <Bot aria-hidden className="h-4 w-4" />
              {pensando ? "Gerando…" : "Gerar resposta"}
            </Button>
            <p className="text-[11.5px] text-[var(--ops-ink-muted)]">
              A resposta não é enviada automaticamente.
            </p>
          </div>
        </div>

        <div>
          <p className="ops-label mb-2">Rascunho da agente</p>
          <div className="min-h-[148px] rounded-[10px] border border-[var(--ops-line)] bg-[var(--ops-card)] p-3.5">
            {rascunho ? (
              <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-[var(--ops-ink)]">
                {rascunho}
              </p>
            ) : (
              <p className="text-[13px] leading-relaxed text-[var(--ops-ink-muted)]">
                O rascunho aparece aqui para revisão humana antes de qualquer resposta ao cliente.
              </p>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => void copiar()} disabled={!rascunho}>
              <Clipboard aria-hidden className="h-4 w-4" />
              {copiado ? "Copiado" : "Copiar resposta"}
            </Button>
            <span className="inline-flex items-center gap-1.5 text-[11.5px] text-[var(--ops-ink-muted)]">
              <ShieldCheck aria-hidden className="h-3.5 w-3.5" />
              Sem conexão com Meta ou WhatsApp Web
            </span>
          </div>
        </div>
      </div>

      <p className="mt-4 border-t border-[var(--ops-line)] pt-3 text-[11.5px] leading-relaxed text-[var(--ops-ink-muted)]">
        Ao trocar de cliente, use “Nova conversa”. O contexto fica somente nesta sessão da tela e não
        substitui o histórico original do WhatsApp Business.
      </p>
    </OpsCard>
  );
}
