/**
 * Fila humana — conversas reais do número DEDICADO da agente.
 *
 * Aguardando humano aparece primeiro. A pessoa lê, responde, devolve para a
 * agente ou encerra. Não mostra nem toca no WhatsApp atual da empresa: só o
 * que o webhook do número dedicado gravou (ver data/fila-humana.ts).
 */

import { useCallback, useEffect, useState } from "react";
import { Bot, Hand, RefreshCw, Send, UserRound, Undo2, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  lerConversaFila,
  listarFila,
  mudarStatusFila,
  responderNaFila,
  type ConversaFila,
  type MensagemFila,
  type StatusFila,
} from "@/features/express-ops-b/data/fila-humana";
import {
  EstadoBadge,
  OpsCard,
  SectionTitle,
  type Tom,
} from "@/features/express-ops-b/components/primitives";

const STATUS: Record<StatusFila, { rotulo: string; tom: Tom }> = {
  aguardando_humano: { rotulo: "Aguardando pessoa", tom: "atencao" },
  ia: { rotulo: "Agente atendendo", tom: "acento" },
  resolvida: { rotulo: "Encerrada", tom: "ok" },
};

/** A fila se atualiza sozinha enquanto a tela está aberta. */
const ATUALIZAR_A_CADA_MS = 20_000;

function hora(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function FilaHumana() {
  const [conversas, setConversas] = useState<readonly ConversaFila[] | null>(null);
  const [erroFila, setErroFila] = useState("");
  const [selecionadaId, setSelecionadaId] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      const r = await listarFila();
      if (r.ok) {
        setConversas(r.conversas);
        setErroFila("");
      } else {
        setErroFila(r.erro);
      }
    } catch {
      setErroFila("Fila indisponível agora. Nada foi alterado; tente de novo em instantes.");
    }
  }, []);

  useEffect(() => {
    void carregar();
    const t = setInterval(() => void carregar(), ATUALIZAR_A_CADA_MS);
    return () => clearInterval(t);
  }, [carregar]);

  const aguardando = conversas?.filter((c) => c.status === "aguardando_humano").length ?? 0;
  const atual = conversas?.find((c) => c.id === selecionadaId) ?? null;

  return (
    <OpsCard as="section">
      <SectionTitle
        titulo={`Fila humana · número da agente${aguardando ? ` · ${aguardando} aguardando` : ""}`}
        apoio="Conversas reais do número dedicado. O WhatsApp atual da empresa não aparece aqui e não é alterado."
        acao={
          <Button type="button" size="sm" variant="outline" onClick={() => void carregar()}>
            <RefreshCw aria-hidden className="h-3.5 w-3.5" />
            Atualizar
          </Button>
        }
      />

      {erroFila ? (
        <p role="alert" className="text-[13px] text-[var(--ops-danger)]">
          {erroFila}
        </p>
      ) : null}

      {conversas === null && !erroFila ? (
        <p className="text-[13px] text-[var(--ops-ink-muted)]">Carregando…</p>
      ) : null}

      {conversas && conversas.length === 0 ? (
        <p className="text-[13px] leading-relaxed text-[var(--ops-ink-muted)]">
          Nenhuma conversa ainda. As conversas aparecem aqui quando o número dedicado da agente
          estiver ligado e receber mensagens. Até lá, use o atendimento assistido acima.
        </p>
      ) : null}

      {conversas && conversas.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-[260px_minmax(0,1fr)]">
          <ul className="max-h-[520px] overflow-y-auto rounded-[10px] border border-[var(--ops-line)]">
            {conversas.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => setSelecionadaId(c.id)}
                  aria-current={c.id === selecionadaId ? "true" : undefined}
                  className={cn(
                    "flex w-full flex-col gap-1.5 border-b border-[var(--ops-line)] px-3.5 py-3 text-left",
                    c.id === selecionadaId
                      ? "bg-[var(--ops-accent-soft)]"
                      : "hover:bg-[var(--ops-surface)]",
                  )}
                >
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-[13.5px] font-medium text-[var(--ops-ink)]">
                      {c.nome}
                    </span>
                    <span className="ops-num shrink-0 text-[11.5px] text-[var(--ops-ink-muted)]">
                      {c.final}
                    </span>
                  </span>
                  <span className="flex flex-wrap items-center gap-1.5">
                    <EstadoBadge tom={STATUS[c.status].tom} className="text-[11px]">
                      {STATUS[c.status].rotulo}
                    </EstadoBadge>
                    {c.ultimaEntrada ? (
                      <span className="ops-num text-[11px] text-[var(--ops-ink-muted)]">
                        {hora(c.ultimaEntrada)}
                      </span>
                    ) : null}
                  </span>
                </button>
              </li>
            ))}
          </ul>

          {atual ? (
            <ConversaAberta key={atual.id} conversa={atual} aoMudar={carregar} />
          ) : (
            <p className="self-center text-[13px] text-[var(--ops-ink-muted)]">
              Escolha uma conversa para ler e responder.
            </p>
          )}
        </div>
      ) : null}
    </OpsCard>
  );
}

function ConversaAberta({
  conversa,
  aoMudar,
}: {
  conversa: ConversaFila;
  aoMudar: () => Promise<void>;
}) {
  const [mensagens, setMensagens] = useState<readonly MensagemFila[] | null>(null);
  const [resposta, setResposta] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<{ tipo: "erro" | "ok"; texto: string } | null>(null);

  const carregarMensagens = useCallback(async () => {
    try {
      const r = await lerConversaFila({ data: { id: conversa.id } });
      if (r.ok) setMensagens(r.mensagens);
      else setAviso({ tipo: "erro", texto: r.erro });
    } catch {
      setAviso({ tipo: "erro", texto: "Não foi possível carregar a conversa." });
    }
  }, [conversa.id]);

  useEffect(() => {
    void carregarMensagens();
  }, [carregarMensagens, conversa.ultimaEntrada]);

  async function agir(acao: "assumir" | "devolver" | "encerrar") {
    setOcupado(true);
    setAviso(null);
    try {
      const r = await mudarStatusFila({ data: { id: conversa.id, acao } });
      if (!r.ok) setAviso({ tipo: "erro", texto: r.erro });
      await aoMudar();
    } catch {
      setAviso({ tipo: "erro", texto: "Não foi possível mudar o status. Nada foi alterado." });
    } finally {
      setOcupado(false);
    }
  }

  async function enviar() {
    const texto = resposta.trim();
    if (!texto || ocupado) return;
    setOcupado(true);
    setAviso(null);
    try {
      const r = await responderNaFila({ data: { id: conversa.id, texto } });
      if (r.ok) {
        setResposta("");
        setAviso({ tipo: "ok", texto: "Resposta enviada. A conversa fica com você." });
        await Promise.all([carregarMensagens(), aoMudar()]);
      } else {
        // A resposta digitada fica no campo: nada se perde numa recusa.
        setAviso({ tipo: "erro", texto: r.erro });
      }
    } catch {
      setAviso({ tipo: "erro", texto: "Falha de conexão. A resposta continua no campo." });
    } finally {
      setOcupado(false);
    }
  }

  return (
    <section aria-label={`Conversa com ${conversa.nome}`} className="flex min-w-0 flex-col gap-3">
      <header className="flex flex-wrap items-center gap-2">
        <h3 className="text-[14.5px] font-semibold text-[var(--ops-ink)]">{conversa.nome}</h3>
        <span className="ops-num text-[12px] text-[var(--ops-ink-muted)]">{conversa.final}</span>
        <EstadoBadge tom={STATUS[conversa.status].tom}>
          {STATUS[conversa.status].rotulo}
        </EstadoBadge>
        <span className="ml-auto flex flex-wrap gap-1.5">
          {conversa.status !== "aguardando_humano" ? (
            <Button
              size="sm"
              variant="outline"
              disabled={ocupado}
              onClick={() => void agir("assumir")}
            >
              <Hand aria-hidden className="h-3.5 w-3.5" />
              Assumir
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              disabled={ocupado}
              onClick={() => void agir("devolver")}
            >
              <Undo2 aria-hidden className="h-3.5 w-3.5" />
              Devolver à agente
            </Button>
          )}
          {conversa.status !== "resolvida" ? (
            <Button
              size="sm"
              variant="outline"
              disabled={ocupado}
              onClick={() => void agir("encerrar")}
            >
              <CheckCheck aria-hidden className="h-3.5 w-3.5" />
              Encerrar
            </Button>
          ) : null}
        </span>
      </header>

      <ul className="grid max-h-[340px] content-start gap-2 overflow-y-auto rounded-[10px] bg-[var(--ops-surface)] p-3">
        {mensagens === null ? (
          <li className="text-[12.5px] text-[var(--ops-ink-muted)]">Carregando…</li>
        ) : (
          mensagens.map((m) => <Linha key={m.id} m={m} />)
        )}
      </ul>

      {!conversa.janelaAberta ? (
        <p className="rounded-[10px] bg-[var(--ops-warn-soft)] px-3 py-2 text-[12px] leading-relaxed text-[oklch(0.4_0.09_75)]">
          Passaram 24 h da última mensagem do cliente. A Meta só aceita modelo de mensagem aprovado
          fora dessa janela; a resposta livre será recusada.
        </p>
      ) : null}

      <div>
        <label htmlFor={`resposta-${conversa.id}`} className="ops-label mb-1.5 block">
          Sua resposta
        </label>
        <textarea
          id={`resposta-${conversa.id}`}
          rows={3}
          maxLength={1500}
          value={resposta}
          onChange={(e) => setResposta(e.target.value)}
          disabled={ocupado}
          className="w-full resize-y rounded-[10px] border border-[var(--ops-line-strong)] bg-white px-3 py-2.5 text-[13.5px] leading-relaxed text-[var(--ops-ink)] outline-none focus:border-[var(--ops-accent)]"
          placeholder="Responder ao cliente pelo número da agente…"
        />
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Button size="sm" disabled={!resposta.trim() || ocupado} onClick={() => void enviar()}>
            <Send aria-hidden className="h-4 w-4" />
            {ocupado ? "Enviando…" : "Enviar e assumir"}
          </Button>
          <span className="text-[11.5px] text-[var(--ops-ink-muted)]">
            Enviar cala a agente nesta conversa até alguém devolvê-la.
          </span>
        </div>
      </div>

      {aviso ? (
        <p
          role={aviso.tipo === "erro" ? "alert" : "status"}
          className={cn(
            "text-[13px]",
            aviso.tipo === "erro" ? "text-[var(--ops-danger)]" : "text-[var(--ops-ok)]",
          )}
        >
          {aviso.texto}
        </p>
      ) : null}
    </section>
  );
}

function Linha({ m }: { m: MensagemFila }) {
  if (m.autor === "sistema") {
    return (
      <li className="text-center text-[11.5px] text-[var(--ops-danger)]">
        {m.texto} · {hora(m.quando)}
      </li>
    );
  }
  const doCliente = m.autor === "cliente";
  return (
    <li className={cn("flex", doCliente ? "justify-start" : "justify-end")}>
      <div
        className={cn(
          "max-w-[86%] rounded-[12px] px-3 py-2",
          doCliente
            ? "bg-[var(--ops-card)]"
            : m.autor === "ia"
              ? "bg-[var(--ops-accent-soft)]"
              : "bg-[var(--ops-ok-soft)]",
        )}
      >
        <p className="flex items-center gap-1 text-[11px] font-medium text-[var(--ops-ink-muted)]">
          {doCliente ? (
            "Cliente"
          ) : m.autor === "ia" ? (
            <>
              <Bot aria-hidden className="h-3 w-3" /> Agente
            </>
          ) : (
            <>
              <UserRound aria-hidden className="h-3 w-3" /> Equipe
            </>
          )}
        </p>
        <p className="mt-0.5 whitespace-pre-wrap text-[13.5px] leading-relaxed text-[var(--ops-ink)]">
          {m.texto}
        </p>
        <p className="ops-num mt-0.5 text-[11px] text-[var(--ops-ink-muted)]">{hora(m.quando)}</p>
      </div>
    </li>
  );
}
