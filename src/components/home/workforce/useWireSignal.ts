import { useEffect, useState } from "react";

/**
 * O ÚNICO SINAL VIVO DA HOME.
 *
 * Lê o feed público do Wire TV (/api/wire/feed.json) — endpoint que já existe,
 * é somente leitura, tem cache de cinco minutos na borda e é o mesmo que a
 * rota /agentes usa para provar o Agente TV. Daqui só sai o que o feed
 * publica: quando foi atualizado, a última matéria e quantas vieram.
 *
 * O QUE NÃO EXISTE (e por isso não é chamado). Não há ainda um endpoint de
 * estado dos agentes. Quando existir, o contrato esperado é o tipo abaixo —
 * mesmo formato, para a Home trocar de fonte sem trocar de tela:
 *
 *   GET /api/agents/status   → { atualizadoEm, agentes: SinalDeAgente[] }
 *   GET /api/agents/activity → { atualizadoEm, eventos: { agenteId, categoria, em }[] }
 *
 * `categoria` é a categoria da operação ("matéria publicada", "conversa
 * atendida"), nunca o conteúdo — nada de cliente, telefone ou texto de
 * conversa chega à vitrine. Até lá, os agentes mostram o estado estático
 * declarado em src/lib/ai-workforce.ts, que é verdadeiro.
 *
 * Falha em silêncio: sem feed, a Home mostra só o estado estático. Nunca
 * preenche com número de exemplo.
 */

export type SinalDeAgente = {
  readonly agenteId: string;
  readonly ultimaOperacaoEm: string | null;
  readonly categoria: string | null;
};

export type SinalDoWire = {
  readonly atualizadoEm: string;
  readonly ultimaMateria: {
    readonly titulo: string;
    readonly slug: string;
    readonly em: string;
  } | null;
  readonly materiasNoFeed: number;
};

type FeedPublico = {
  atualizadoEm?: string;
  materias?: { titulo?: string; slug?: string; publicadoEm?: string | null }[];
};

export function useWireSignal(): SinalDoWire | null {
  const [sinal, setSinal] = useState<SinalDoWire | null>(null);

  useEffect(() => {
    const controle = new AbortController();
    fetch("/api/wire/feed.json", { signal: controle.signal })
      .then((r) => (r.ok ? (r.json() as Promise<FeedPublico>) : null))
      .then((feed) => {
        if (!feed?.atualizadoEm || !Array.isArray(feed.materias)) return;
        const primeira = feed.materias.find((m) => m.titulo && m.slug && m.publicadoEm);
        setSinal({
          atualizadoEm: feed.atualizadoEm,
          materiasNoFeed: feed.materias.length,
          ultimaMateria: primeira
            ? { titulo: primeira.titulo!, slug: primeira.slug!, em: primeira.publicadoEm! }
            : null,
        });
      })
      .catch(() => {
        /* sem feed, sem sinal: a Home fica no estado estático verdadeiro */
      });
    return () => controle.abort();
  }, []);

  return sinal;
}

/** "há 12 min", "há 3 h", "há 2 dias" — relativo ao relógio de quem lê. */
export function haQuantoTempo(iso: string, agora: Date = new Date()): string {
  const ms = agora.getTime() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return "agora";
  const min = Math.floor(ms / 60_000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.floor(h / 24);
  return d === 1 ? "há 1 dia" : `há ${d} dias`;
}
