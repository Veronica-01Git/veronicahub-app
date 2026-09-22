/**
 * Sala de teste — a tela onde o DONO conversa com a agente antes de aprovar.
 *
 * Antes desta tela, testar a agente exigia terminal e máquina de
 * desenvolvimento. O dono não conseguia testar sozinho, e o passo 2 do
 * ROTEIRO-DE-SUBIDA.md promete exatamente isso. Aqui ele abre um link, digita
 * como cliente, e vê a resposta.
 *
 * O QUE ELA MOSTRA E O SIMULADOR DE TERMINAL NÃO MOSTRAVA: quando a agente
 * escala para uma pessoa, e POR QUE. Para o dono, saber que ela se calou na
 * hora certa vale mais do que ler a resposta bonita — é o que responde a
 * pergunta dele, que é "ela vai falar bobagem com meu cliente?".
 *
 * Não existe envio nesta tela. Ela fala com /api/whatsapp/testar, que chama a
 * mesma agente e a mesma guarda de preço, e não tem caminho para a Meta.
 */

import { useEffect, useRef, useState } from "react";
import { createFileRoute, useSearch } from "@tanstack/react-router";
import { AlertTriangle, Bot, Send, ShieldCheck, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { OpsCard } from "@/features/express-ops-b/components/primitives";

export const Route = createFileRoute("/clientes/express-entulho/operacoes/testar")({
  component: SalaDeTeste,
  validateSearch: (busca: Record<string, unknown>) => ({
    t: typeof busca.t === "string" ? busca.t : undefined,
  }),
});

type Fala = {
  readonly de: "cliente" | "agente";
  readonly texto: string;
  readonly escalou?: boolean;
  readonly motivo?: string;
  readonly guarda?: string | null;
};

/**
 * O motivo do escalonamento, dito para o DONO.
 *
 * `decidirResposta` devolve motivo escrito para log e painel técnico — chega
 * a citar nome de variável de ambiente. Isso apareceu na tela dele no
 * primeiro teste: "falta ANTHROPIC_API_KEY". Ele não tem como entender, e o
 * problema não é dele.
 *
 * Então o motivo técnico não vai para a tela. O que vai é a tradução, e o
 * caso de falha de configuração diz explicitamente que é do nosso lado, para
 * ele não achar que a agente está ruim quando o que falta é nosso ajuste.
 */
function motivoEmPortugues(motivo: string | undefined): string {
  if (!motivo) return "ela preferiu não responder sozinha";
  if (/provedor|indisponível|429|cota|chave|API_KEY/i.test(motivo)) {
    return "a inteligência da agente não está ligada neste ambiente — isso é ajuste nosso, não problema do atendimento";
  }
  if (/guarda de preço/i.test(motivo)) {
    return "ela ia citar um valor que não está na tabela, e a conferência barrou";
  }
  if (/fora da alçada/i.test(motivo)) {
    return "é assunto de decisão comercial: desconto, multa, cancelamento ou nota";
  }
  if (/anexo/i.test(motivo)) return "veio um anexo que ela não interpreta";
  if (/não soube/i.test(motivo)) return "ela não soube e preferiu encaminhar";
  return "ela preferiu não responder sozinha";
}

const SUGESTOES = [
  "Bom dia, quanto custa uma caçamba?",
  "É em Itapema, vou descartar gesso",
  "Me dá um desconto de 20% que eu fecho agora",
  "A caçamba encheu, preciso de outra",
  "Vocês atendem em Navegantes? Quanto fica?",
];

function SalaDeTeste() {
  const { t } = useSearch({ from: Route.id });
  const [falas, setFalas] = useState<readonly Fala[]>([]);
  const [rascunho, setRascunho] = useState("");
  const [pensando, setPensando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const fim = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fim.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [falas, pensando]);

  async function enviar(texto: string) {
    const limpo = texto.trim();
    if (!limpo || pensando) return;

    setErro(null);
    setRascunho("");
    const comCliente = [...falas, { de: "cliente" as const, texto: limpo }];
    setFalas(comCliente);
    setPensando(true);

    try {
      const historico = falas.map((f) => ({
        role: f.de === "cliente" ? ("user" as const) : ("assistant" as const),
        content: f.texto,
      }));
      const r = await fetch(`/api/whatsapp/testar${t ? `?t=${encodeURIComponent(t)}` : ""}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ texto: limpo, historico }),
      });
      const dados = (await r.json()) as {
        texto?: string;
        escalar?: boolean;
        motivo?: string;
        guarda?: string | null;
        erro?: string;
      };
      if (!r.ok || dados.erro) {
        setErro(dados.erro ?? `o servidor respondeu ${r.status}`);
        return;
      }
      setFalas([
        ...comCliente,
        {
          de: "agente",
          texto: dados.texto ?? "",
          escalou: dados.escalar,
          motivo: dados.motivo,
          guarda: dados.guarda ?? null,
        },
      ]);
    } catch {
      setErro("não consegui falar com o servidor");
    } finally {
      setPensando(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Sem título aqui: a barra de cima do painel já escreve "Sala de
          teste", e repetir empurra a conversa para baixo da dobra. */}
      <p className="text-[13px] leading-relaxed text-[var(--ops-ink-muted)]">
        Converse como se fosse um cliente. É a mesma agente do WhatsApp, com as mesmas regras e a
        mesma conferência de preço — mas aqui não existe envio: nada sai para ninguém.
      </p>

      <OpsCard className="flex flex-col gap-4">
        <div className="flex flex-col gap-3">
          {falas.length === 0 && (
            <p className="text-[13px] leading-relaxed text-[var(--ops-ink-muted)]">
              Comece por uma das perguntas abaixo, ou escreva a sua.
            </p>
          )}

          {falas.map((f, i) => (
            <div
              key={i}
              className={cn(
                "flex flex-col gap-1",
                f.de === "cliente" ? "items-end" : "items-start",
              )}
            >
              <span className="flex items-center gap-1.5 text-[11px] text-[var(--ops-ink-muted)]">
                {f.de === "cliente" ? (
                  <>
                    <UserRound className="h-3 w-3" /> Cliente
                  </>
                ) : (
                  <>
                    <Bot className="h-3 w-3" /> Agente
                  </>
                )}
              </span>
              <div
                className={cn(
                  "max-w-[85%] rounded-lg px-3.5 py-2.5 text-[13.5px] leading-relaxed",
                  f.de === "cliente"
                    ? "bg-[var(--ops-accent)] text-white"
                    : "border border-[var(--ops-line)] bg-[var(--ops-bg)] text-[var(--ops-ink)]",
                )}
              >
                {f.texto}
              </div>

              {/* O valor desta tela para o dono está aqui: ver a agente se
                  calando na hora certa, e o motivo. */}
              {f.de === "agente" && f.escalou && (
                <p className="flex max-w-[85%] items-start gap-1.5 text-[11.5px] leading-relaxed text-[var(--ops-ink-muted)]">
                  <ShieldCheck className="mt-px h-3.5 w-3.5 shrink-0" />
                  <span>Passou para uma pessoa — {motivoEmPortugues(f.motivo)}</span>
                </p>
              )}
              {f.de === "agente" && f.guarda && (
                <p className="flex max-w-[85%] items-start gap-1.5 text-[11.5px] leading-relaxed text-[var(--ops-ink-muted)]">
                  <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" />
                  <span>Conferência de preço barrou: {f.guarda}</span>
                </p>
              )}
            </div>
          ))}

          {pensando && (
            <p className="text-[12px] text-[var(--ops-ink-muted)]">A agente está escrevendo…</p>
          )}
          <div ref={fim} />
        </div>

        {erro && (
          <p className="rounded-md border border-[var(--ops-line)] bg-[var(--ops-bg)] px-3 py-2 text-[12.5px] text-[var(--ops-ink)]">
            {erro}
          </p>
        )}

        <form
          className="flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void enviar(rascunho);
          }}
        >
          <input
            value={rascunho}
            onChange={(e) => setRascunho(e.target.value)}
            placeholder="Escreva como um cliente escreveria…"
            className="min-w-0 flex-1 rounded-md border border-[var(--ops-line)] bg-white px-3 py-2 text-[13.5px] text-[var(--ops-ink)] outline-none focus:border-[var(--ops-accent)]"
          />
          <button
            type="submit"
            disabled={pensando || !rascunho.trim()}
            className="flex items-center gap-1.5 rounded-md bg-[var(--ops-accent)] px-4 py-2 text-[13px] font-medium text-white disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" /> Enviar
          </button>
        </form>

        <div className="flex flex-wrap gap-2">
          {SUGESTOES.map((s) => (
            <button
              key={s}
              type="button"
              disabled={pensando}
              onClick={() => void enviar(s)}
              className="rounded-full border border-[var(--ops-line)] px-3 py-1.5 text-[12px] text-[var(--ops-ink-muted)] transition hover:border-[var(--ops-accent)] hover:text-[var(--ops-ink)] disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>
      </OpsCard>

      <OpsCard as="aside" className="flex flex-col gap-2">
        <h3 className="text-[14px] font-semibold text-[var(--ops-ink)]">
          O que observar enquanto testa
        </h3>
        <ul className="flex list-disc flex-col gap-1.5 pl-5 text-[13px] leading-relaxed text-[var(--ops-ink-muted)]">
          <li>Pedir preço sem dizer a cidade — ela deve perguntar, não chutar.</li>
          <li>Pedir desconto — ela deve recusar e explicar o motivo do aterro.</li>
          <li>Perguntar de uma cidade sem preço — ela deve encaminhar, não estimar.</li>
          <li>Dizer que encheu — ela deve entender que é troca, não retirada.</li>
          <li>
            Quando aparecer{" "}
            <strong className="font-medium">&quot;passou para uma pessoa&quot;</strong>, é a agente
            reconhecendo que não sabe. Isso é o comportamento certo.
          </li>
        </ul>
      </OpsCard>
    </div>
  );
}
