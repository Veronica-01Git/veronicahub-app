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
  const [erro, setErro] = useState("");
  const [motivo, setMotivo] = useState<string | null>(null);

  async function gerar() {
    const texto = mensagem.trim();
    if (!texto || pensando) return;

    setPensando(true);
    setCopiado(false);
    setErro("");
    setRascunho("");
    setMotivo(null);
    try {
      const resposta = await conversarComAgente({
        data: { mensagem: texto, historico: [...historico] },
      });
      if ("erro" in resposta) {
        setErro(resposta.erro);
        return;
      }
      setMotivo(
        resposta.escalar
          ? (resposta.motivo ?? "Confirme com um responsável antes de responder.")
          : null,
      );
      setRascunho(resposta.texto);
      setHistorico((atual) => [
        ...atual,
        { role: "user", content: texto },
        { role: "assistant", content: resposta.texto },
      ]);
      setMensagem("");
    } catch {
      setErro("Não foi possível gerar o rascunho. A mensagem foi mantida; tente novamente.");
    } finally {
      setPensando(false);
    }
  }

  async function copiar() {
    if (!rascunho) return;
    try {
      await navigator.clipboard.writeText(rascunho);
      setCopiado(true);
      setHistorico((atual) =>
        atual.map((turno, indice) =>
          indice === atual.length - 1 ? { role: "assistant", content: rascunho } : turno,
        ),
      );
      setErro("");
    } catch {
      setErro("Não foi possível copiar. Selecione o rascunho e copie manualmente.");
    }
  }

  function novaConversa() {
    setMensagem("");
    setRascunho("");
    setHistorico([]);
    setErro("");
    setMotivo(null);
    setCopiado(false);
  }

  return (
    <OpsCard as="section" className="border-[oklch(0.82_0.06_255)] bg-[var(--ops-accent-soft)]">
      <SectionTitle
        titulo="Atendimento assistido"
        apoio="Cole a mensagem do cliente, revise o rascunho e copie de volta para o WhatsApp Business"
        acao={
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={novaConversa}
            disabled={pensando}
          >
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
            disabled={pensando}
            placeholder="Cole aqui exatamente o que o cliente mandou no WhatsApp…"
            className="w-full resize-y rounded-[10px] border border-[var(--ops-line-strong)] bg-white px-3 py-2.5 text-[13.5px] leading-relaxed text-[var(--ops-ink)] outline-none focus:border-[var(--ops-accent)]"
          />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={() => void gerar()}
              disabled={!mensagem.trim() || pensando}
            >
              <Bot aria-hidden className="h-4 w-4" />
              {pensando ? "Gerando…" : "Gerar resposta"}
            </Button>
            <p className="text-[11.5px] text-[var(--ops-ink-muted)]">
              A resposta não é enviada automaticamente.
            </p>
          </div>
        </div>

        <div>
          <label htmlFor="rascunho-assistido" className="ops-label mb-2 block">
            Rascunho da agente · editável
          </label>
          <textarea
            id="rascunho-assistido"
            rows={6}
            value={rascunho}
            disabled={pensando || !historico.length}
            onChange={(event) => {
              setRascunho(event.target.value);
              setCopiado(false);
            }}
            placeholder="O rascunho aparece aqui para revisão humana antes de qualquer resposta ao cliente."
            className="min-h-[148px] w-full resize-y rounded-[10px] border border-[var(--ops-line)] bg-[var(--ops-card)] p-3.5 text-[13.5px] leading-relaxed text-[var(--ops-ink)]"
          />
          {motivo ? (
            <p role="status" className="mt-2 text-[12px] text-[var(--ops-warn)]">
              Revisão necessária: {motivo}
            </p>
          ) : null}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => void copiar()}
              disabled={!rascunho.trim() || pensando}
            >
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

      {erro ? (
        <p role="alert" className="mt-3 text-[13px] text-[var(--ops-danger)]">
          {erro}
        </p>
      ) : null}

      <p className="mt-4 border-t border-[var(--ops-line)] pt-3 text-[11.5px] leading-relaxed text-[var(--ops-ink-muted)]">
        Ao trocar de cliente, use “Nova conversa”. O contexto fica somente nesta sessão da tela; o
        texto colado é processado pelo provedor de IA e não substitui o histórico original do
        WhatsApp Business.
      </p>
    </OpsCard>
  );
}
