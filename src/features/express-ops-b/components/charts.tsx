/**
 * Gráficos em SVG escrito à mão — sem biblioteca de chart.
 * Todos decorativos-por-padrão (`aria-hidden`) com o número correspondente
 * sempre disponível em texto ao lado; o diagrama de ciclo é a exceção e
 * carrega rótulos próprios.
 */

import { cn } from "@/lib/utils";
import type { CacambaEstado } from "../data/types";

/* --------------------------------------------------------------- sparkline */

export function Sparkline({
  serie,
  tom = "acento",
}: {
  serie: readonly number[];
  tom?: "acento" | "neutro";
}) {
  if (serie.length < 2) return null;
  const w = 88;
  const h = 26;
  const min = Math.min(...serie);
  const max = Math.max(...serie);
  const span = max - min || 1;
  const passo = w / (serie.length - 1);
  const pts = serie.map((v, i) => [i * passo, h - 2 - ((v - min) / span) * (h - 5)] as const);
  const linha = pts
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(" ");
  const area = `${linha} L${w} ${h} L0 ${h} Z`;
  const cor = tom === "acento" ? "var(--ops-accent)" : "var(--ops-neutral)";
  const id = `spark-${serie.join("-")}-${tom}`;
  const [ux, uy] = pts[pts.length - 1];

  return (
    <svg aria-hidden width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={cor} stopOpacity="0.16" />
          <stop offset="100%" stopColor={cor} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path
        d={linha}
        fill="none"
        stroke={cor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={ux} cy={uy} r="2.2" fill={cor} />
    </svg>
  );
}

export function SetaVariacao({
  direcao,
  bom,
}: {
  direcao: "sobe" | "desce" | "igual";
  bom: boolean;
}) {
  if (direcao === "igual") {
    return (
      <svg aria-hidden width="10" height="10" viewBox="0 0 10 10">
        <path d="M1.5 5h7" stroke="var(--ops-neutral)" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }
  const cor = bom ? "var(--ops-ok)" : "var(--ops-danger)";
  const d =
    direcao === "sobe"
      ? "M5 8.5V1.8M5 1.8 2.2 4.6M5 1.8l2.8 2.8"
      : "M5 1.5v6.7M5 8.2 2.2 5.4M5 8.2l2.8-2.8";
  return (
    <svg aria-hidden width="10" height="10" viewBox="0 0 10 10">
      <path
        d={d}
        stroke={cor}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

/* ------------------------------------------------------- barra segmentada */

export type Segmento = {
  readonly id: string;
  readonly rotulo: string;
  readonly valor: number;
  readonly cor: string;
};

export function BarraSegmentada({
  segmentos,
  altura = 10,
}: {
  segmentos: readonly Segmento[];
  altura?: number;
}) {
  const total = segmentos.reduce((s, x) => s + x.valor, 0) || 1;
  let x = 0;
  const vao = 1.5;
  return (
    <svg
      aria-hidden
      viewBox={`0 0 100 ${altura}`}
      preserveAspectRatio="none"
      className="w-full"
      style={{ height: altura }}
    >
      {segmentos.map((s) => {
        const larguraBruta = (s.valor / total) * 100;
        const largura = Math.max(0, larguraBruta - (s.valor > 0 ? vao : 0));
        const atual = x;
        x += larguraBruta;
        if (s.valor <= 0) return null;
        return (
          <rect
            key={s.id}
            x={atual}
            y={0}
            width={largura}
            height={altura}
            rx={altura / 2}
            fill={s.cor}
          />
        );
      })}
    </svg>
  );
}

export function LegendaSegmentos({ segmentos }: { segmentos: readonly Segmento[] }) {
  return (
    <ul className="mt-4 grid gap-2 sm:grid-cols-2">
      {segmentos.map((s) => (
        <li key={s.id} className="flex items-center gap-2 text-[13px]">
          <span
            aria-hidden
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ background: s.cor }}
          />
          <span className="text-[var(--ops-ink-soft)]">{s.rotulo}</span>
          <span className="ops-num ml-auto font-medium text-[var(--ops-ink)]">{s.valor}</span>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------- barra prazo */

export function BarraPrazo({
  decorrido,
  contratado,
  className,
}: {
  decorrido: number;
  contratado: number;
  className?: string;
}) {
  const prorrogado = decorrido > contratado;
  const pct = Math.min(100, (decorrido / Math.max(contratado, 1)) * 100);
  const cor = prorrogado ? "var(--ops-danger)" : pct >= 80 ? "var(--ops-warn)" : "var(--ops-ok)";
  return (
    <div className={cn("w-full", className)}>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--ops-surface)]">
        <div
          className="ops-motion h-full rounded-full transition-[width]"
          style={{ width: `${prorrogado ? 100 : pct}%`, background: cor }}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------- diagrama de ciclo de vida */

const CICLO: readonly { readonly id: CacambaEstado; readonly rotulo: string }[] = [
  { id: "disponivel", rotulo: "Disponível" },
  { id: "reservada", rotulo: "Reservada" },
  { id: "em-transito", rotulo: "Em trânsito" },
  { id: "instalada", rotulo: "Instalada" },
  { id: "aguardando-retirada", rotulo: "Aguardando retirada" },
  { id: "descarregada", rotulo: "Descarregada" },
];

/**
 * Ciclo de vida da caçamba.
 *
 * Fluxo vertical com retorno ao pátio — em 312px de coluna um anel não cabe
 * com rótulo legível, e rótulo é o que faz o desenho comunicar a operação.
 * O próprio SVG é o controle: cada etapa filtra o inventário.
 */
export function DiagramaCiclo({
  selecionado,
  contagens,
  onSelecionar,
}: {
  selecionado: CacambaEstado | "todas";
  contagens: Readonly<Record<CacambaEstado, number>>;
  onSelecionar: (estado: CacambaEstado) => void;
}) {
  const x = 46;
  const topo = 24;
  const passo = 52;
  const altura = topo + passo * (CICLO.length - 1) + 30;

  return (
    <div>
      <svg
        viewBox={`0 0 300 ${altura}`}
        className="w-full"
        role="group"
        aria-label="Ciclo de vida da caçamba — toque num estado para filtrar"
      >
        <defs>
          <marker
            id="ciclo-seta"
            viewBox="0 0 8 8"
            refX="6.4"
            refY="4"
            markerWidth="5"
            markerHeight="5"
            orient="auto"
          >
            <path
              d="M1 1.4 5.6 4 1 6.6"
              fill="none"
              stroke="var(--ops-line-strong)"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </marker>
        </defs>

        {CICLO.slice(0, -1).map((etapa, i) => (
          <line
            key={`liga-${etapa.id}`}
            x1={x}
            y1={topo + passo * i + 15}
            x2={x}
            y2={topo + passo * (i + 1) - 15}
            stroke="var(--ops-line-strong)"
            strokeWidth="1.2"
            markerEnd="url(#ciclo-seta)"
            aria-hidden
          />
        ))}

        {/* Retorno ao pátio: fecha o ciclo. */}
        <path
          d={`M${x - 14} ${topo + passo * (CICLO.length - 1)} C 8 ${topo + passo * (CICLO.length - 1)}, 8 ${topo}, ${x - 14} ${topo}`}
          fill="none"
          stroke="var(--ops-line-strong)"
          strokeWidth="1.2"
          strokeDasharray="3 4"
          markerEnd="url(#ciclo-seta)"
          aria-hidden
        />
        {CICLO.map((etapa, i) => {
          const y = topo + passo * i;
          const ativo = etapa.id === selecionado;
          return (
            <g
              key={etapa.id}
              role="button"
              tabIndex={0}
              aria-pressed={ativo}
              aria-label={`${etapa.rotulo} — ${contagens[etapa.id]} caçambas`}
              onClick={() => onSelecionar(etapa.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelecionar(etapa.id);
                }
              }}
              className="ops-motion cursor-pointer"
            >
              <rect
                x={x - 22}
                y={y - 17}
                width={300 - (x - 22)}
                height="34"
                rx="9"
                fill={ativo ? "var(--ops-accent-soft)" : "transparent"}
              />
              <circle
                cx={x}
                cy={y}
                r="14"
                fill={ativo ? "var(--ops-accent)" : "var(--ops-card)"}
                stroke={ativo ? "var(--ops-accent)" : "var(--ops-line-strong)"}
                strokeWidth="1.2"
              />
              <text
                x={x}
                y={y + 4}
                textAnchor="middle"
                className="ops-num"
                fontSize="12"
                fontWeight="600"
                fill={ativo ? "oklch(0.99 0 0)" : "var(--ops-ink)"}
              >
                {contagens[etapa.id]}
              </text>
              <text
                x={x + 24}
                y={y + 4}
                fontSize="12.5"
                fontWeight={ativo ? 600 : 400}
                fill={ativo ? "var(--ops-accent-ink)" : "var(--ops-ink-soft)"}
              >
                {etapa.rotulo}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="mt-3 border-t border-[var(--ops-line)] pt-3 text-[12px] leading-relaxed text-[var(--ops-ink-muted)]">
        O ciclo se fecha: descarregada no pátio, a caçamba volta a ficar disponível.
      </p>
    </div>
  );
}

export { CICLO as CICLO_CACAMBA };
