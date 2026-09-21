/**
 * Despacho interno — para onde o trabalho vai depois que o agente resolve.
 *
 * Esta tela existe por um achado que só apareceu olhando o aparelho da
 * empresa: a Express Entulho não despacha por sistema, despacha por GRUPO DE
 * WHATSAPP. Existem grupos fixos por função e um grupo por rota de
 * motorista, e é neles que cai "Favor recolher essa caçamba" seguido do
 * cartão de locação encaminhado.
 *
 * Por que isso muda o desenho do produto: o agente não "abre uma ordem de
 * serviço" — ele põe um cartão no grupo certo, e uma pessoa pega. A tela
 * mostra os dois lados disso: quais grupos existem e quais cartões foram
 * despachados, com os que ainda não foram em destaque.
 *
 * Nomes de pessoas e de clientes são fictícios. A estrutura é real.
 */

import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight, Bot, MapPin, ShieldAlert, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePainelOps } from "@/features/express-ops-b/data/queries";
import { EsqueletoLista } from "@/features/express-ops-b/components/esqueleto";
import {
  EstadoBadge,
  OpsCard,
  SectionTitle,
  type Tom,
} from "@/features/express-ops-b/components/primitives";
import type {
  CartaoLocacao,
  GrupoFuncao,
  GrupoInterno,
  ItemLocacao,
} from "@/features/express-ops-b/data/types";

export const Route = createFileRoute("/clientes/express-entulho/operacoes/despacho")({
  component: Despacho,
});

const FUNCAO_COPY: Record<GrupoFuncao, { rotulo: string; tom: Tom }> = {
  prioridade: { rotulo: "Prioridade", tom: "critico" },
  rota: { rotulo: "Rota", tom: "acento" },
  motoristas: { rotulo: "Motoristas", tom: "acento" },
  transicao: { rotulo: "Transição", tom: "neutro" },
  administrativo: { rotulo: "Administrativo", tom: "neutro" },
};

const SITUACAO_COPY: Record<ItemLocacao["situacao"], { rotulo: string; tom: Tom }> = {
  "em-operacao": { rotulo: "Em operação", tom: "atencao" },
  "ordem-finalizada": { rotulo: "Ordem finalizada", tom: "ok" },
};

/** Campo vazio no cartão real aparece como travessão. Nunca supomos o valor. */
function Campo({ rotulo, valor }: { rotulo: string; valor: string | null }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] uppercase tracking-[.12em] text-[var(--ops-ink-muted)]">
        {rotulo}
      </dt>
      {/* Quebra em vez de truncar: "Balneário Camboriú" não cabe na coluna, e
          cortar cidade num cartão de despacho manda o motorista para o lugar
          errado. Altura desigual é preço baixo por endereço legível. */}
      <dd
        className={cn(
          "mt-0.5 break-words text-[13px]",
          valor ? "text-[var(--ops-ink)]" : "text-[var(--ops-ink-muted)]",
        )}
      >
        {valor ?? "—"}
      </dd>
    </div>
  );
}

function CartaoGrupo({ grupo }: { grupo: GrupoInterno }) {
  const funcao = FUNCAO_COPY[grupo.funcao];

  return (
    <OpsCard as="article" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-[15px] font-semibold text-[var(--ops-ink)]">{grupo.nome}</h3>
          <p className="mt-0.5 text-[12px] text-[var(--ops-ink-muted)]">
            {grupo.integrantes.join(" · ")}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {grupo.naoLidas > 0 && (
            <span className="rounded-full bg-[var(--ops-accent)] px-2 py-0.5 text-[11px] font-semibold text-white">
              {grupo.naoLidas}
            </span>
          )}
          <EstadoBadge tom={funcao.tom}>{funcao.rotulo}</EstadoBadge>
        </div>
      </div>

      {grupo.ultimoDespacho ? (
        <div className="rounded-md border border-[var(--ops-line)] bg-[var(--ops-bg)] p-3">
          <p className="text-[13px] leading-relaxed text-[var(--ops-ink)]">
            {grupo.ultimoDespacho.texto}
          </p>
          <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-[var(--ops-ink-muted)]">
            {grupo.ultimoDespacho.autor === "agente" ? (
              <>
                <Bot className="h-3 w-3" /> Agente
              </>
            ) : (
              <>
                <UserRound className="h-3 w-3" /> {grupo.ultimoDespacho.assinatura ?? "Equipe"}
              </>
            )}
            <span aria-hidden>·</span>
            {grupo.ultimoDespacho.quandoRel}
          </p>
        </div>
      ) : (
        <p className="text-[13px] text-[var(--ops-ink-muted)]">Nenhum despacho ainda hoje.</p>
      )}

      {!grupo.agentePodePostar && (
        <p className="flex items-start gap-1.5 text-[12px] leading-relaxed text-[var(--ops-ink-muted)]">
          <ShieldAlert className="mt-px h-3.5 w-3.5 shrink-0" />
          Só pessoas postam aqui. Documento financeiro não passa pelo agente.
        </p>
      )}
    </OpsCard>
  );
}

function CartaoDeLocacao({ cartao }: { cartao: CartaoLocacao }) {
  const pendente = cartao.despachadoPara === null;
  const e = cartao.enderecoObra;

  return (
    <OpsCard
      as="article"
      className={cn("flex flex-col gap-4", pendente && "ring-1 ring-[var(--ops-accent)]")}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-[15px] font-semibold text-[var(--ops-ink)]">
            Locação #{cartao.numero}
          </h3>
          <p className="mt-0.5 text-[12px] text-[var(--ops-ink-muted)]">
            {cartao.contato} · {cartao.telefone}
          </p>
        </div>
        <EstadoBadge tom={pendente ? "critico" : "ok"}>
          {pendente ? "Aguardando despacho" : "Despachada"}
        </EstadoBadge>
      </div>

      <div className="rounded-md border border-[var(--ops-line)] bg-[var(--ops-bg)] p-3">
        <p className="mb-2.5 flex items-center gap-1.5 text-[11px] uppercase tracking-[.12em] text-[var(--ops-ink-muted)]">
          <MapPin className="h-3.5 w-3.5" /> Endereço da obra
        </p>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 sm:grid-cols-3">
          <div className="col-span-2 sm:col-span-3">
            <Campo rotulo="Endereço" valor={e.endereco} />
          </div>
          <Campo rotulo="CEP" valor={e.cep} />
          <Campo rotulo="Bairro" valor={e.bairro} />
          <Campo rotulo="Complemento" valor={e.complemento} />
          <Campo rotulo="Cidade" valor={e.cidade} />
          <Campo rotulo="Estado" valor={e.estado} />
          <div className="col-span-2 sm:col-span-3">
            <Campo rotulo="Observação" valor={e.observacao} />
          </div>
        </dl>
        <p className="mt-3 flex items-center gap-1.5 text-[12px] font-medium text-[var(--ops-accent)]">
          Traçar rota até o local <ArrowUpRight className="h-3.5 w-3.5" />
        </p>
      </div>

      <ul className="flex flex-col gap-2">
        {cartao.itens.map((item) => {
          const situacao = SITUACAO_COPY[item.situacao];
          return (
            <li
              key={item.produto}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-[var(--ops-line)] px-3 py-2"
            >
              <span className="text-[13px] text-[var(--ops-ink)]">
                {item.produto} · {item.pecas} {item.pecas === 1 ? "peça" : "peças"}
              </span>
              <EstadoBadge tom={situacao.tom}>{situacao.rotulo}</EstadoBadge>
            </li>
          );
        })}
      </ul>

      <p className="text-[12px] text-[var(--ops-ink-muted)]">
        {pendente ? (
          <>Ainda não foi para nenhum grupo · {cartao.quandoRel}</>
        ) : (
          <>
            Despachada para <strong className="font-medium">{cartao.despachadoPara}</strong> ·{" "}
            {cartao.quandoRel}
          </>
        )}
      </p>
    </OpsCard>
  );
}

function Despacho() {
  const { data } = usePainelOps();
  if (!data) return <EsqueletoLista linhas={5} />;

  const pendentes = data.locacoes.filter((l) => l.despachadoPara === null).length;

  return (
    <div className="flex flex-col gap-8">
      <section>
        <SectionTitle
          titulo="Grupos de despacho"
          apoio="A operação é despachada por grupo de WhatsApp, não por sistema. O agente posta o cartão no grupo certo e uma pessoa assume."
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.gruposInternos.map((g) => (
            <CartaoGrupo key={g.id} grupo={g} />
          ))}
        </div>
      </section>

      <section>
        <SectionTitle
          titulo="Cartões de locação"
          apoio={
            pendentes > 0
              ? `${pendentes} ainda sem grupo definido — é o que uma pessoa precisa resolver agora.`
              : "Todos os cartões do dia já foram para o grupo responsável."
          }
        />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {data.locacoes.map((c) => (
            <CartaoDeLocacao key={c.numero} cartao={c} />
          ))}
        </div>
      </section>
    </div>
  );
}
