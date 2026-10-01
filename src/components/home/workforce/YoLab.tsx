import { PIPELINE_DO_LAB } from "@/lib/ai-workforce";

/**
 * 08 — YO LAB & CO.
 *
 * A única seção clara da Home, de propósito: é a quebra de ritmo que marca
 * a troca de assunto — do que opera para quem constrói. A grade técnica do
 * fundo é CSS (duas linear-gradient e uma máscara), sem imagem.
 *
 * A estrutura de marca fica escrita aqui, uma vez, como definição: quem é o
 * laboratório, quem é a inteligência central, quem são os agentes e o que é
 * o Hub. Linguagem de engenharia — "control plane", "orquestração" — e não
 * de mitologia; a direção de arte pode ser expressiva, a frase não.
 */

const ESTRUTURA = [
  {
    nome: "YO LAB & CO.",
    papel: "O laboratório",
    texto: "Pesquisa, constrói, testa e responde pelo que vai para a operação de alguém.",
  },
  {
    nome: "Veronica",
    papel: "A inteligência central",
    texto:
      "Control plane dos agentes: orquestra, guarda a regra dura e decide quando passar para uma pessoa.",
  },
  {
    nome: "AI Agents",
    papel: "A força de trabalho",
    texto: "Cada um com uma função, uma rota, um estado declarado e o limite escrito.",
  },
  {
    nome: "Veronica Hub",
    papel: "Plataforma e prova",
    texto:
      "Onde os agentes trabalham primeiro: ambiente operacional, laboratório vivo e vitrine — ao mesmo tempo.",
  },
] as const;

export function YoLab() {
  return (
    <section id="lab" className="wf-lab py-[clamp(5rem,11vw,10rem)]" aria-labelledby="wf-lab-title">
      <div className="wf-lab-grid" aria-hidden="true" />
      <div className="wf-wrap">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <div className="wf-reveal">
            <p className="wf-index" style={{ color: "oklch(0.13 0.006 200 / 0.5)" }}>
              08 — Lab
            </p>
            <div className="mt-6 flex items-center gap-4">
              <img
                src="/images/brand/yo-lab-logo.webp"
                alt=""
                width={56}
                height={56}
                loading="lazy"
                decoding="async"
                className="size-14 rounded-full"
              />
              <span className="wf-label">The AI laboratory behind Veronica</span>
            </div>
            <h2 id="wf-lab-title" className="wf-h2 mt-8">
              Construímos.
              <span className="block">Usamos primeiro.</span>
              <span className="block opacity-40">Comprovamos aqui dentro.</span>
              <span className="block opacity-40">Só então, na sua empresa.</span>
            </h2>
          </div>

          <dl className="grid content-end gap-0 wf-reveal">
            {ESTRUTURA.map((e) => (
              <div
                key={e.nome}
                className="grid grid-cols-[minmax(0,9.5rem)_minmax(0,1fr)] gap-4 border-t py-5"
                style={{ borderColor: "oklch(0.13 0.006 200 / 0.14)" }}
              >
                <dt>
                  <span className="block font-display text-xl tracking-[-0.02em]">{e.nome}</span>
                  <span className="wf-label mt-1 block">{e.papel}</span>
                </dt>
                <dd className="wf-lede text-[0.95rem]">{e.texto}</dd>
              </div>
            ))}
          </dl>
        </div>

        <ol className="wf-pipe mt-[clamp(4rem,8vw,7rem)]" aria-label="Pipeline do laboratório">
          {PIPELINE_DO_LAB.map((p, i) => (
            <li key={p.etapa} className="wf-pipe-step wf-reveal">
              <span className="wf-label">
                {String(i + 1).padStart(2, "0")} · {p.etapa}
              </span>
              <h3 className="mt-4 font-display text-xl leading-tight tracking-[-0.02em]">
                {p.titulo}
              </h3>
              <p className="wf-lede mt-3 text-sm">{p.texto}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
