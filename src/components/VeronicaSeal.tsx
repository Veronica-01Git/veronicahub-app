import { useId } from "react";
import { ShieldCheck } from "lucide-react";

export interface VeronicaSealProps {
  /** Número de série único, ex.: "VH-2026-000001" (sem o prefixo "Nº"). */
  serialNumber: string;
  /** Nome de quem recebeu o selo — opcional. */
  issuedTo?: string;
  /** Data de emissão, já formatada (ex.: "24/07/2026"). */
  issuedDate: string;
  /** O que foi certificado (ex.: "Currículo ATS", "Comando Hacking Ético"). */
  productName: string;
  /** "sm" pra uso em card/lista, "md" (padrão) ou "lg" pra documento/exportação. */
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_PX: Record<NonNullable<VeronicaSealProps["size"]>, number> = {
  sm: 120,
  md: 200,
  lg: 360,
};

// Paleta própria do selo — deliberadamente independente dos tokens de glow
// neon do resto do site (--neon-green etc.). Tom de "tinta gravada" sobre
// uma placa clara, pra funcionar tanto numa UI escura quanto impresso em
// papel branco, sem depender de opacidade baixa ou mix-blend-mode.
const INK = "oklch(0.32 0.09 155)";
const INK_FAINT = "oklch(0.32 0.09 155 / 0.5)";
const PLATE = "oklch(0.96 0.012 155)";
const ACCENT = "oklch(0.5 0.13 195)";

const FONT_MONO = "var(--font-mono, ui-monospace, monospace)";
const FONT_DISPLAY = "var(--font-display, system-ui, sans-serif)";

const CX = 120;
const CY = 120;
const TEXT_RADIUS = 98;
const HALF_CIRCUMFERENCE = Math.PI * TEXT_RADIUS;

const RING_LABEL = "VERONICA · SELO DE ORIGINALIDADE · ";
const VERIFY_LABEL = "VERIFICADO EM VERONICAHUB.COM/VERIFICAR";

export function VeronicaSeal({ serialNumber, issuedTo, issuedDate, productName, size = "md", className }: VeronicaSealProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const topArcId = `seal-top-${uid}`;
  const bottomArcId = `seal-bottom-${uid}`;
  const px = SIZE_PX[size];

  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 240 240"
      role="img"
      aria-label={`Selo Veronica de Originalidade — ${productName}, nº ${serialNumber}, emitido em ${issuedDate}`}
      className={className}
      style={{ display: "block", flexShrink: 0 }}
    >
      <defs>
        <path id={topArcId} d={`M ${CX - TEXT_RADIUS} ${CY} A ${TEXT_RADIUS} ${TEXT_RADIUS} 0 0 1 ${CX + TEXT_RADIUS} ${CY}`} />
        <path id={bottomArcId} d={`M ${CX - TEXT_RADIUS} ${CY} A ${TEXT_RADIUS} ${TEXT_RADIUS} 0 0 0 ${CX + TEXT_RADIUS} ${CY}`} />
      </defs>

      {/* Placa + borda dupla, estilo selo de cartório */}
      <circle cx={CX} cy={CY} r={116} fill={PLATE} stroke={INK} strokeWidth={3} />
      <circle cx={CX} cy={CY} r={107} fill="none" stroke={INK} strokeWidth={1.25} />
      <circle cx={CX} cy={CY} r={80} fill="none" stroke={INK_FAINT} strokeWidth={0.75} strokeDasharray="1.5 3.5" />

      {/* Texto no perímetro */}
      <text fill={INK} fontSize="9.5" letterSpacing="1.5" fontFamily={FONT_MONO} style={{ textTransform: "uppercase" }}>
        <textPath href={`#${topArcId}`} startOffset="0" textLength={HALF_CIRCUMFERENCE} lengthAdjust="spacing">
          {RING_LABEL.repeat(2)}
        </textPath>
      </text>
      <text fill={ACCENT} fontSize="6.5" letterSpacing="1" fontFamily={FONT_MONO} textAnchor="middle" style={{ textTransform: "uppercase" }}>
        <textPath href={`#${bottomArcId}`} startOffset="50%">
          {VERIFY_LABEL}
        </textPath>
      </text>

      {/* Emblema central */}
      <g transform={`translate(${CX - 19}, ${CY - 63})`}>
        <ShieldCheck width={38} height={38} stroke={INK} strokeWidth={1.4} fill="none" />
      </g>

      {/* O que foi certificado */}
      <text x={CX} y={CY - 6} textAnchor="middle" fill={INK} fontSize="12" fontWeight={700} letterSpacing="0.3" fontFamily={FONT_DISPLAY}>
        {productName}
      </text>

      <line x1={CX - 36} y1={CY + 6} x2={CX + 36} y2={CY + 6} stroke={INK_FAINT} strokeWidth={0.75} />

      {/* Número de série + data */}
      <text x={CX} y={CY + 22} textAnchor="middle" fill={INK} fontSize="10" letterSpacing="0.5" fontFamily={FONT_MONO}>
        Nº {serialNumber}
      </text>
      <text x={CX} y={CY + 36} textAnchor="middle" fill={INK} fontSize="8.5" fontFamily={FONT_MONO}>
        Emitido em {issuedDate}
      </text>
      {issuedTo && (
        <text x={CX} y={CY + 49} textAnchor="middle" fill={INK} fontSize="7.5" fontFamily={FONT_MONO}>
          Para {issuedTo}
        </text>
      )}
    </svg>
  );
}
