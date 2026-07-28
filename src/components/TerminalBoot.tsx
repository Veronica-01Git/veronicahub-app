import { useEffect, useState } from "react";

const LINES = [
  "> initializing veronica.hub_",
  "> loading modules [11/11] ✓",
  "> access :: lifetime · status :: online",
  "> ready.",
];

export function TerminalBoot() {
  const [idx, setIdx] = useState(0);
  const [text, setText] = useState("");
  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (reduced) {
      setIdx(LINES.length);
      return;
    }
    if (idx >= LINES.length) return;
    const full = LINES[idx];
    if (text.length < full.length) {
      const t = setTimeout(() => setText(full.slice(0, text.length + 1)), 22);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setIdx((i) => i + 1);
      setText("");
    }, 380);
    return () => clearTimeout(t);
  }, [idx, text, reduced]);

  const shown = reduced ? LINES : LINES.slice(0, idx);

  return (
    <div className="mt-8 max-w-md rounded-sm border border-neon-green/30 bg-background/70 p-4 font-mono-tech text-[11px] leading-relaxed text-neon-green/90 backdrop-blur">
      {/* Grid de uma célula só: as duas camadas ocupam o mesmo espaço, então
          a altura da caixa é sempre a do conteúdo completo (invisível, reserva
          o layout desde o primeiro frame) — o texto visível nunca estica a
          caixa por cima dela, só preenche o que já está reservado. */}
      <div className="grid">
        <div aria-hidden className="invisible [grid-area:1/1]">
          {LINES.map((l) => (
            <div key={l}>{l}</div>
          ))}
        </div>
        <div className="[grid-area:1/1]">
          {shown.map((l) => (
            <div key={l}>{l}</div>
          ))}
          {!reduced && idx < LINES.length && (
            <div>
              {text}
              <span className="ml-0.5 inline-block h-3 w-1.5 -translate-y-[1px] bg-neon-green align-middle animate-pulse" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}