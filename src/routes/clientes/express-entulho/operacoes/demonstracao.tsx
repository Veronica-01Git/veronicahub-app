/**
 * Demonstração — Modo Sombra.
 *
 * Vitrine interativa e autocontida: 5-6 conversas fictícias com dados
 * mockados neste arquivo, sem consulta ao painel real (`usePainelOps`), sem
 * tabela nova e sem chamada de API do WhatsApp. Serve só para visualizar o
 * conceito — o botão "Aprovar" nunca sai do estado local do componente.
 */

import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Bot, CheckCircle2, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AguardandoCadastro,
  EstadoBadge,
  OpsCard,
  type Tom,
} from "@/features/express-ops-b/components/primitives";

export const Route = createFileRoute("/clientes/express-entulho/operacoes/demonstracao")({
  component: DemonstracaoModoSombra,
});

type Intencao = "orcamento" | "agendamento" | "retirada" | "atendimento-humano";

const ROTULO_INTENCAO: Record<Intencao, string> = {
  orcamento: "Orçamento",
  agendamento: "Agendamento",
  retirada: "Retirada",
  "atendimento-humano": "Atendimento Humano",
};

const TOM_INTENCAO: Record<Intencao, Tom> = {
  orcamento: "acento",
  agendamento: "ok",
  retirada: "neutro",
  "atendimento-humano": "atencao",
};

type MensagemDemo = { id: string; autor: "cliente" | "ia"; texto: string; hora: string };

type DadosDemo = {
  nome: string | null;
  telefone: string;
  endereco: string | null;
  material: string | null;
  dataDesejada: string | null;
  tipoCacamba: string | null;
  formaPagamento: string | null;
};

type ConversaDemo = {
  id: string;
  cliente: string;
  telefone: string;
  intencao: Intencao;
  previa: string;
  quandoRel: string;
  mensagens: readonly MensagemDemo[];
  dados: DadosDemo;
  respostaSugerida: string;
};

const CONVERSAS_DEMO: readonly ConversaDemo[] = [
  {
    id: "demo-1",
    cliente: "Cliente Demo 1",
    telefone: "+55 11 90000-0001",
    intencao: "orcamento",
    previa: "Quanto custa uma caçamba de 5m³ pra reforma?",
    quandoRel: "há 4 min",
    mensagens: [
      {
        id: "m1",
        autor: "cliente",
        texto: "Oi, bom dia! Quanto fica uma caçamba de entulho de reforma?",
        hora: "09:12",
      },
      {
        id: "m2",
        autor: "ia",
        texto:
          "Bom dia! Pra reforma, a caçamba de 5m³ costuma atender bem. Pode me confirmar o bairro pra eu calcular certinho?",
        hora: "09:12",
      },
      { id: "m3", autor: "cliente", texto: "É no Jardim das Flores, perto do mercado.", hora: "09:14" },
    ],
    dados: {
      nome: "Cliente Demo 1",
      telefone: "+55 11 90000-0001",
      endereco: "Jardim das Flores (número não informado)",
      material: "Entulho de reforma",
      dataDesejada: null,
      tipoCacamba: "5m³",
      formaPagamento: null,
    },
    respostaSugerida:
      "Perfeito! A caçamba de 5m³ pra essa região fica R$ 320, com retirada em até 5 dias úteis. Pra qual data você gostaria de agendar a entrega?",
  },
  {
    id: "demo-2",
    cliente: "Cliente Demo 2",
    telefone: "+55 11 90000-0002",
    intencao: "agendamento",
    previa: "Preciso da caçamba já confirmada, pode ser quinta?",
    quandoRel: "há 12 min",
    mensagens: [
      { id: "m1", autor: "cliente", texto: "Oi! Já fechei o orçamento com vocês semana passada.", hora: "08:40" },
      {
        id: "m2",
        autor: "ia",
        texto: "Boa tarde! Encontrei seu orçamento aqui. Pra qual data você quer agendar a entrega?",
        hora: "08:41",
      },
      { id: "m3", autor: "cliente", texto: "Pode ser quinta de manhã? Rua das Palmeiras, 245.", hora: "08:43" },
    ],
    dados: {
      nome: "Cliente Demo 2",
      telefone: "+55 11 90000-0002",
      endereco: "Rua das Palmeiras, 245",
      material: "Entulho de construção",
      dataDesejada: "Quinta-feira, período da manhã",
      tipoCacamba: "3m³",
      formaPagamento: "Pix",
    },
    respostaSugerida:
      "Fechado! Entrega confirmada pra quinta de manhã na Rua das Palmeiras, 245. Te aviso por aqui quando o caminhão sair.",
  },
  {
    id: "demo-3",
    cliente: "Cliente Demo 3",
    telefone: "+55 11 90000-0003",
    intencao: "retirada",
    previa: "A caçamba já pode ser retirada, terminamos a obra.",
    quandoRel: "há 26 min",
    mensagens: [
      { id: "m1", autor: "cliente", texto: "Boa tarde, a caçamba de vocês já pode ser retirada.", hora: "07:55" },
      {
        id: "m2",
        autor: "ia",
        texto: "Perfeito! Vou confirmar o endereço de retirada — é o mesmo da entrega, na Av. Central, 900?",
        hora: "07:56",
      },
      { id: "m3", autor: "cliente", texto: "Isso mesmo, pode buscar.", hora: "07:58" },
    ],
    dados: {
      nome: "Cliente Demo 3",
      telefone: "+55 11 90000-0003",
      endereco: "Av. Central, 900",
      material: "Entulho misto",
      dataDesejada: "Hoje, a combinar",
      tipoCacamba: "5m³",
      formaPagamento: null,
    },
    respostaSugerida:
      "Show! Já agendei a retirada pra hoje na Av. Central, 900. O motorista te avisa por aqui uns 30 minutos antes de chegar.",
  },
  {
    id: "demo-4",
    cliente: "Cliente Demo 4",
    telefone: "+55 11 90000-0004",
    intencao: "atendimento-humano",
    previa: "Isso não é o que combinei, quero falar com alguém.",
    quandoRel: "há 31 min",
    mensagens: [
      {
        id: "m1",
        autor: "cliente",
        texto: "A caçamba chegou menor do que eu pedi, isso não é o que combinei.",
        hora: "07:20",
      },
      {
        id: "m2",
        autor: "ia",
        texto: "Sinto muito pelo transtorno. Vou passar sua conversa pra um atendente confirmar o que houve.",
        hora: "07:21",
      },
    ],
    dados: {
      nome: "Cliente Demo 4",
      telefone: "+55 11 90000-0004",
      endereco: "Rua dos Ipês, 58",
      material: "Entulho de reforma",
      dataDesejada: null,
      tipoCacamba: "Divergência relatada",
      formaPagamento: "Boleto",
    },
    respostaSugerida:
      "Entendo a frustração — isso vai direto pra um atendente humano confirmar o tamanho da caçamba entregue. Peço só um instante.",
  },
  {
    id: "demo-5",
    cliente: "Cliente Demo 5",
    telefone: "+55 11 90000-0005",
    intencao: "orcamento",
    previa: "Vocês atendem em condomínio fechado?",
    quandoRel: "há 48 min",
    mensagens: [
      { id: "m1", autor: "cliente", texto: "Oi, vocês entregam caçamba em condomínio fechado?", hora: "06:50" },
      {
        id: "m2",
        autor: "ia",
        texto: "Atendemos sim! Só preciso confirmar o material e o volume aproximado pra te passar o valor.",
        hora: "06:51",
      },
    ],
    dados: {
      nome: "Cliente Demo 5",
      telefone: "+55 11 90000-0005",
      endereco: null,
      material: null,
      dataDesejada: null,
      tipoCacamba: null,
      formaPagamento: null,
    },
    respostaSugerida:
      "Pra eu montar o orçamento certinho, pode me contar o tipo de material e o endereço completo do condomínio?",
  },
  {
    id: "demo-6",
    cliente: "Cliente Demo 6",
    telefone: "+55 11 90000-0006",
    intencao: "agendamento",
    previa: "Consigo mudar a data pra sábado?",
    quandoRel: "há 1 h",
    mensagens: [
      { id: "m1", autor: "cliente", texto: "Oi, a entrega tava marcada pra sexta, dá pra mudar pra sábado?", hora: "06:05" },
      {
        id: "m2",
        autor: "ia",
        texto: "Consigo verificar! Sábado ainda tem janela livre pra sua região, vou confirmar o período.",
        hora: "06:06",
      },
      { id: "m3", autor: "cliente", texto: "De tarde fica melhor pra mim.", hora: "06:07" },
    ],
    dados: {
      nome: "Cliente Demo 6",
      telefone: "+55 11 90000-0006",
      endereco: "Alameda dos Cravos, 12",
      material: "Entulho de reforma",
      dataDesejada: "Sábado, período da tarde",
      tipoCacamba: "5m³",
      formaPagamento: "Cartão",
    },
    respostaSugerida:
      "Remarcado! Entrega pra sábado à tarde na Alameda dos Cravos, 12. Qualquer mudança, é só me avisar por aqui.",
  },
];

function iniciais(nome: string): string {
  return nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function DemonstracaoModoSombra() {
  const [selecionadaId, setSelecionadaId] = useState<string>(CONVERSAS_DEMO[0].id);
  const [aprovadas, setAprovadas] = useState<ReadonlySet<string>>(new Set());

  const atual = CONVERSAS_DEMO.find((c) => c.id === selecionadaId) ?? CONVERSAS_DEMO[0];
  const aprovada = aprovadas.has(atual.id);

  function aprovar() {
    setAprovadas((prev) => {
      const proximo = new Set(prev);
      proximo.add(atual.id);
      return proximo;
    });
  }

  return (
    <div className="grid gap-4">
      <BarraStatus />

      <div className="grid gap-4 md:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)_320px]">
        <ListaConversasDemo
          conversas={CONVERSAS_DEMO}
          atualId={atual.id}
          onSelecionar={setSelecionadaId}
          className="md:row-span-2 xl:row-span-1"
        />
        <ThreadDemo conversa={atual} />
        <PainelDemo conversa={atual} aprovada={aprovada} onAprovar={aprovar} />
      </div>

      <RodapeSecaoDemo />
    </div>
  );
}

function BarraStatus() {
  return (
    <div
      role="status"
      className="sticky top-[97px] z-20 flex flex-wrap items-center gap-x-5 gap-y-1.5 rounded-[10px] border border-[var(--ops-line)] bg-[var(--ops-card)] px-4 py-2.5 shadow-[var(--ops-shadow)]"
    >
      <span className="text-[12px] font-medium text-[var(--ops-ink-soft)]">
        Ambiente: <span className="text-[var(--ops-ink)]">Demonstração</span>
      </span>
      <span className="hidden text-[var(--ops-line-strong)] sm:inline">·</span>
      <span className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--ops-accent-ink)]">
        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[var(--ops-accent)]" />
        Modo Sombra: Ativo
      </span>
      <span className="hidden text-[var(--ops-line-strong)] sm:inline">·</span>
      <span className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--ops-danger)]">
        <ShieldAlert aria-hidden className="h-3.5 w-3.5" />
        Envio: Bloqueado
      </span>
      <span className="hidden text-[var(--ops-line-strong)] sm:inline">·</span>
      <span className="ops-num text-[11.5px] text-[var(--ops-ink-muted)]">
        Selo VH-AUT-WA-2026-000001
      </span>
    </div>
  );
}

function ListaConversasDemo({
  conversas,
  atualId,
  onSelecionar,
  className,
}: {
  conversas: readonly ConversaDemo[];
  atualId: string;
  onSelecionar: (id: string) => void;
  className?: string;
}) {
  return (
    <nav aria-label="Conversas de demonstração" className={cn("ops-card overflow-hidden p-0", className)}>
      <h2 className="ops-label border-b border-[var(--ops-line)] px-4 py-3">
        Conversas fictícias · {conversas.length}
      </h2>
      <ul className="max-h-[560px] overflow-y-auto">
        {conversas.map((c) => {
          const ativo = c.id === atualId;
          return (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => onSelecionar(c.id)}
                aria-current={ativo ? "true" : undefined}
                className={cn(
                  "ops-motion flex w-full gap-3 border-b border-[var(--ops-line)] px-4 py-3.5 text-left transition-colors",
                  ativo ? "bg-[var(--ops-accent-soft)]" : "hover:bg-[var(--ops-surface)]",
                )}
              >
                <span
                  aria-hidden
                  className="ops-num grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--ops-surface)] text-[12px] font-semibold text-[var(--ops-ink-soft)]"
                >
                  {iniciais(c.cliente)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-[13.5px] font-medium text-[var(--ops-ink)]">
                      {c.cliente}
                    </span>
                    <span className="shrink-0 text-[11.5px] text-[var(--ops-ink-muted)]">
                      {c.quandoRel}
                    </span>
                  </span>
                  <span className="mt-0.5 block truncate text-[12.5px] text-[var(--ops-ink-muted)]">
                    {c.previa}
                  </span>
                  <span className="mt-2 flex flex-wrap items-center gap-1.5">
                    <EstadoBadge tom={TOM_INTENCAO[c.intencao]} className="text-[11px]">
                      {ROTULO_INTENCAO[c.intencao]}
                    </EstadoBadge>
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function ThreadDemo({ conversa }: { conversa: ConversaDemo }) {
  return (
    <section
      className="ops-card flex min-w-0 flex-col p-0"
      aria-label={`Conversa fictícia com ${conversa.cliente}`}
    >
      <header className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-[var(--ops-line)] px-4 py-3">
        <h2 className="text-[14.5px] font-semibold text-[var(--ops-ink)]">{conversa.cliente}</h2>
        <span className="ops-num text-[12.5px] text-[var(--ops-ink-muted)]">{conversa.telefone}</span>
        <EstadoBadge tom={TOM_INTENCAO[conversa.intencao]} className="ml-auto">
          {ROTULO_INTENCAO[conversa.intencao]}
        </EstadoBadge>
      </header>

      <ul className="grid flex-1 content-start gap-2.5 overflow-y-auto p-4 md:max-h-[430px]">
        {conversa.mensagens.map((m) => (
          <li key={m.id} className={cn("flex", m.autor === "cliente" ? "justify-start" : "justify-end")}>
            <div
              className={cn(
                "max-w-[86%] rounded-[14px] px-3.5 py-2.5",
                m.autor === "cliente"
                  ? "rounded-bl-[4px] bg-[var(--ops-surface)]"
                  : "rounded-br-[4px] bg-[var(--ops-accent-soft)] ring-1 ring-inset ring-[oklch(0.48_0.13_255_/_0.14)]",
              )}
            >
              {m.autor === "ia" ? (
                <p className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--ops-accent-ink)]">
                  <Bot aria-hidden className="h-3 w-3" />
                  Respondido pelo agente
                </p>
              ) : null}
              <p
                className={cn(
                  "text-[13.5px] leading-relaxed text-[var(--ops-ink)]",
                  m.autor === "ia" && "mt-1",
                )}
              >
                {m.texto}
              </p>
              <p className="ops-num mt-1 text-[11px] text-[var(--ops-ink-muted)]">{m.hora}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function CampoDado({ rotulo, valor }: { rotulo: string; valor: string | null }) {
  return (
    <div className="grid gap-1">
      <dt className="ops-label">{rotulo}</dt>
      {valor ? (
        <dd className="text-[13.5px] font-medium text-[var(--ops-ink)]">{valor}</dd>
      ) : (
        <dd>
          <AguardandoCadastro motivo="Dado ainda não confirmado pelo cliente." compacto />
        </dd>
      )}
    </div>
  );
}

function PainelDemo({
  conversa,
  aprovada,
  onAprovar,
}: {
  conversa: ConversaDemo;
  aprovada: boolean;
  onAprovar: () => void;
}) {
  const { dados } = conversa;
  return (
    <aside className="grid content-start gap-4" aria-label="Dados extraídos e resposta sugerida">
      <OpsCard as="div">
        <h2 className="ops-label mb-3">Dados extraídos</h2>
        <dl className="grid gap-3.5">
          <CampoDado rotulo="Nome" valor={dados.nome} />
          <CampoDado rotulo="Telefone" valor={dados.telefone} />
          <CampoDado rotulo="Endereço" valor={dados.endereco} />
          <CampoDado rotulo="Material" valor={dados.material} />
          <CampoDado rotulo="Data desejada" valor={dados.dataDesejada} />
          <CampoDado rotulo="Tipo de caçamba" valor={dados.tipoCacamba} />
          <CampoDado rotulo="Forma de pagamento" valor={dados.formaPagamento} />
        </dl>
      </OpsCard>

      <OpsCard as="div" className="border-[oklch(0.82_0.06_255)] bg-[var(--ops-accent-soft)]">
        <h2 className="ops-label mb-2 flex items-center gap-1.5 text-[var(--ops-accent-ink)]">
          <Bot aria-hidden className="h-3.5 w-3.5" />
          Resposta sugerida pela IA
        </h2>
        <p className="text-[13.5px] leading-relaxed text-[var(--ops-ink)]">{conversa.respostaSugerida}</p>

        <button
          type="button"
          onClick={onAprovar}
          disabled={aprovada}
          className={cn(
            "ops-motion mt-4 inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-[13px] font-medium transition-colors",
            aprovada
              ? "cursor-default bg-[var(--ops-ok-soft)] text-[var(--ops-ok)]"
              : "bg-[var(--ops-accent)] text-white hover:opacity-90",
          )}
        >
          <CheckCircle2 aria-hidden className="h-4 w-4" />
          {aprovada ? "Aprovada" : "Aprovar"}
        </button>

        {aprovada ? (
          <p className="mt-3 flex items-start gap-2 rounded-[10px] bg-[var(--ops-danger-soft)] px-3 py-2 text-[12px] leading-relaxed text-[var(--ops-danger)]">
            <ShieldAlert aria-hidden className="mt-[1px] h-3.5 w-3.5 shrink-0" />
            Envio bloqueado — modo sombra ativo. A aprovação fica só neste painel; nenhuma mensagem
            sai pelo WhatsApp.
          </p>
        ) : null}
      </OpsCard>
    </aside>
  );
}

function RodapeSecaoDemo() {
  return (
    <p className="ops-label text-center text-[11px] leading-relaxed tracking-[0.04em]">
      Demonstração com dados fictícios — não conectado ao WhatsApp real.
    </p>
  );
}
