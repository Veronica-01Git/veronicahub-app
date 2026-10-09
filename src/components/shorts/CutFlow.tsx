import type { ReactNode } from "react";
import { coverSvg } from "@/social/policy";
import type { renderSnapshot } from "@/social/render.server";
import type { SourceRow } from "@/social/runtime.server";

type RenderState = Awaited<ReturnType<typeof renderSnapshot>>;
type Job = RenderState["jobs"][number];

const PROCESSOR_URL =
  "https://github.com/Veronica-01Git/veronicahub-app/actions/workflows/shorts-render.yml";
const STAGES = [
  { key: "download", label: "Recebendo o vídeo original" },
  { key: "transcribe", label: "Transcrevendo a fala" },
  { key: "select", label: "Escolhendo os melhores trechos" },
  { key: "render", label: "Montando os cortes 1080×1920 com legenda" },
  { key: "upload", label: "Salvando os cortes" },
] as const;
const ISSUES: Record<string, string> = {
  DOWNLOAD_FAILED:
    "Não foi possível obter o vídeo. Envie o arquivo original no passo 1 e gere os cortes de novo.",
  TRANSCRIPTION_FAILED:
    "A transcrição falhou. Confira se o vídeo tem fala audível e entre 1 e 60 minutos.",
  SELECTION_FAILED:
    "A seleção dos trechos falhou. Tente de novo; se repetir, o vídeo pode não ter trechos completos de 20 a 60 segundos.",
  RENDER_FAILED: "A montagem do vídeo vertical falhou. Tente de novo.",
  STORAGE_FAILED: "Os cortes foram feitos, mas não foram salvos. Tente de novo.",
  LEASE_EXPIRED: "O processamento parou no meio (tempo esgotado). Gere os cortes de novo.",
  PROCESSING_FAILED: "O processamento foi interrompido. Tente de novo.",
};
const primary =
  "rounded-xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40";
const secondary =
  "rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium disabled:opacity-40";

function Step(props: {
  n: number;
  title: string;
  state: "done" | "current" | "todo" | "error";
  children: ReactNode;
}) {
  const badge = {
    done: "bg-emerald-600 text-white",
    current: "bg-zinc-900 text-white",
    todo: "bg-zinc-100 text-zinc-400",
    error: "bg-red-600 text-white",
  }[props.state];
  return (
    <li className="group relative flex gap-4 pb-8 last:pb-0">
      <span
        aria-hidden
        className="absolute left-4 top-9 h-[calc(100%-2.25rem)] w-px bg-zinc-200 group-last:hidden"
      />
      <span
        className={`z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-semibold ${badge}`}
      >
        {props.state === "done" ? "✓" : props.state === "error" ? "!" : props.n}
      </span>
      <div className="min-w-0 flex-1">
        <h3
          className={`text-base font-semibold ${props.state === "todo" ? "text-zinc-400" : "text-zinc-900"}`}
        >
          {props.title}
        </h3>
        <div className="mt-2">{props.children}</div>
      </div>
    </li>
  );
}

function Timeline({ job }: { job: Job }) {
  const current = STAGES.findIndex((s) => s.key === job.stage);
  return (
    <ol className="space-y-2" aria-label="Etapas do processamento">
      {STAGES.map((stage, i) => {
        const state =
          job.status === "queued" ? "todo" : i < current ? "done" : i === current ? "now" : "todo";
        return (
          <li key={stage.key} className="flex items-center gap-3 text-sm">
            <span
              aria-hidden
              className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                state === "done"
                  ? "bg-emerald-600"
                  : state === "now"
                    ? "animate-pulse bg-zinc-900"
                    : "bg-zinc-200"
              }`}
            />
            <span
              className={
                state === "todo"
                  ? "text-zinc-400"
                  : state === "now"
                    ? "font-medium"
                    : "text-zinc-600"
              }
            >
              {stage.label}
              {state === "now" && " …"}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function ClipCard(props: {
  job: Job;
  clip: Job["clips"][number];
  index: number;
  onDownload: (name: string, value: string, mime: string) => void;
}) {
  const { job, clip, index, onDownload } = props;
  const hub = clip.url.startsWith("/api/social/media/");
  return (
    <article className="w-[78%] min-w-0 shrink-0 snap-start rounded-2xl border border-zinc-200 p-3 sm:w-auto">
      <video
        className="aspect-[9/16] w-full rounded-xl bg-zinc-950"
        controls
        playsInline
        preload="metadata"
        src={clip.url}
      />
      <h4 className="mt-3 font-semibold leading-snug">{clip.creative.coverTitle}</h4>
      <p className="mt-1 text-xs text-zinc-500">
        {clip.start.toFixed(0)}s–{clip.end.toFixed(0)}s do original · {clip.duration.toFixed(0)}s
      </p>
      <div className="mt-3 grid gap-2">
        <a
          className={`${primary} text-center`}
          href={hub ? `${clip.url}&download=1` : clip.url}
          download={`corte-${index + 1}.mp4`}
        >
          Baixar MP4
        </a>
        <div className="grid grid-cols-2 gap-2">
          <button
            className={`${secondary} whitespace-nowrap px-2`}
            onClick={() =>
              onDownload(
                `short-${job.id}-${index}.json`,
                JSON.stringify(clip, null, 2),
                "application/json",
              )
            }
          >
            Kit 4 redes
          </button>
          <button
            className={`${secondary} whitespace-nowrap px-2`}
            onClick={() =>
              onDownload(
                `capa-${job.id}-${index}.svg`,
                coverSvg(clip.creative.coverTitle),
                "image/svg+xml",
              )
            }
          >
            Capa
          </button>
        </div>
      </div>
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-zinc-600">Legenda sugerida</summary>
        <p className="mt-2 whitespace-pre-wrap">{clip.creative.caption}</p>
        <button
          className={`${secondary} mt-2 w-full`}
          onClick={() => void navigator.clipboard?.writeText(clip.creative.caption)}
        >
          Copiar legenda
        </button>
      </details>
    </article>
  );
}

/** Guided flow: original file → request → live processing → finished clips. */
export function CutFlow(props: {
  item: SourceRow;
  render: RenderState;
  busy: boolean;
  uploadPct: number | null;
  onUpload: (file: File) => void;
  onRender: () => void;
  onRefresh: () => void;
  onDownload: (name: string, value: string, mime: string) => void;
}) {
  const { item, render, busy, uploadPct } = props;
  const needsOriginal = render.sourceUploads;
  const uploaded = !needsOriginal || render.uploads.includes(item.videoId);
  const jobs = render.jobs.filter((j) => j.sourceId === item.id);
  const latest = jobs[0];
  const active = latest?.status === "queued" || latest?.status === "running";
  const failed = latest?.status === "attention";
  const finished = jobs.find((j) => j.status === "completed");
  const engineReady = render.configured && render.storageConfigured;
  const blocked = !engineReady
    ? "O motor de cortes ainda não está conectado."
    : !item.rightsConfirmed
      ? "Confirme a autorização de uso em Revisar antes de gerar cortes."
      : !uploaded
        ? "Envie o arquivo original no passo 1."
        : active
          ? "Os cortes deste vídeo já estão sendo gerados."
          : ["archived", "preparing"].includes(item.status)
            ? "Este item não está disponível para cortes agora."
            : null;

  return (
    <ol className="mt-6">
      {needsOriginal && (
        <Step n={1} title="Arquivo original do vídeo" state={uploaded ? "done" : "current"}>
          {uploaded ? (
            <p className="text-sm text-zinc-600">
              Arquivo enviado. O motor usa este MP4, sem depender do YouTube.
            </p>
          ) : (
            <p className="text-sm leading-relaxed text-zinc-600">
              Envie o MP4 do vídeo (até 1 GB). O YouTube bloqueia downloads feitos por servidores,
              então o motor trabalha a partir do arquivo original.
            </p>
          )}
          <label
            className={`${uploaded ? secondary : primary} mt-3 inline-block cursor-pointer ${
              busy || !item.rightsConfirmed ? "pointer-events-none opacity-40" : ""
            }`}
          >
            {uploaded ? "Trocar arquivo" : "Escolher arquivo MP4"}
            <input
              type="file"
              accept="video/mp4"
              className="sr-only"
              aria-label="Enviar arquivo original em MP4"
              disabled={busy || !item.rightsConfirmed}
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) props.onUpload(file);
              }}
            />
          </label>
          {uploadPct !== null && (
            <div className="mt-3" role="status" aria-live="polite">
              <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                <div
                  className="h-full rounded-full bg-zinc-900 transition-all"
                  style={{ width: `${uploadPct}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-zinc-600">
                Enviando… {uploadPct}%. Não feche a página.
              </p>
            </div>
          )}
          {!uploaded && (
            <details className="mt-3 text-sm text-zinc-600">
              <summary className="cursor-pointer">Como conseguir o arquivo?</summary>
              <p className="mt-2 leading-relaxed">
                Vídeo do seu canal: YouTube Studio → Conteúdo → ⋮ ao lado do vídeo → Baixar. Vídeo
                de outro canal: peça o arquivo ao autor junto com a autorização de uso. Se passar de
                1 GB, exporte em 720p.
              </p>
            </details>
          )}
        </Step>
      )}

      <Step
        n={needsOriginal ? 2 : 1}
        title="Gerar cortes"
        state={active || finished ? "done" : blocked && !uploaded ? "todo" : "current"}
      >
        <p className="text-sm text-zinc-600">
          Até 3 cortes de 20 a 60 segundos, com legenda, em 1080×1920. Nada é publicado
          automaticamente.
        </p>
        <button
          className={`${finished && !failed ? secondary : primary} mt-3 w-full sm:w-auto`}
          disabled={busy || !!blocked}
          onClick={props.onRender}
        >
          {failed || finished ? "Gerar cortes novamente" : "Gerar cortes"}
        </button>
        {blocked && <p className="mt-2 text-xs text-zinc-500">{blocked}</p>}
      </Step>

      <Step
        n={needsOriginal ? 3 : 2}
        title="Processamento"
        state={failed ? "error" : active ? "current" : latest ? "done" : "todo"}
      >
        {!latest && (
          <p className="text-sm text-zinc-400">As etapas aparecem aqui depois do pedido.</p>
        )}
        {active && latest && (
          <div className="space-y-4">
            {latest.status === "queued" ? (
              <p className="text-sm leading-relaxed text-zinc-600">
                Na fila. O processador confere a fila a cada 15 minutos. Para começar agora, abra o{" "}
                <a className="underline" href={PROCESSOR_URL} target="_blank" rel="noreferrer">
                  processador no GitHub
                </a>{" "}
                e toque em <strong>Run workflow</strong>.
              </p>
            ) : (
              <p className="text-sm text-zinc-600">
                Gerando os cortes. Um vídeo de 15 minutos leva cerca de 10 a 20 minutos.
              </p>
            )}
            <Timeline job={latest} />
            <div className="flex items-center gap-3">
              <button
                className={`${secondary} whitespace-nowrap`}
                disabled={busy}
                onClick={props.onRefresh}
              >
                Atualizar agora
              </button>
              <span className="text-xs text-zinc-500">Atualiza sozinho a cada 20 segundos.</span>
            </div>
          </div>
        )}
        {failed && latest && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {ISSUES[latest.issue ?? ""] ?? ISSUES.PROCESSING_FAILED}
          </div>
        )}
        {!active && !failed && latest?.status === "completed" && (
          <p className="text-sm text-zinc-600">Concluído.</p>
        )}
      </Step>

      <Step n={needsOriginal ? 4 : 3} title="Cortes prontos" state={finished ? "done" : "todo"}>
        {!finished ? (
          <p className="text-sm text-zinc-400">Prévia, download e kit das 4 redes aparecem aqui.</p>
        ) : (
          <div className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3">
            {finished.clips.map((clip, index) => (
              <ClipCard
                key={index}
                job={finished}
                clip={clip}
                index={index}
                onDownload={props.onDownload}
              />
            ))}
          </div>
        )}
      </Step>
    </ol>
  );
}
