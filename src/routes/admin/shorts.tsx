import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { getSocialQueue, socialCommand, type Command } from "@/social/server";
import { coverSvg, GOALS, type SourceInput } from "@/social/policy";
import type { SourceRow } from "@/social/runtime.server";

export const Route = createFileRoute("/admin/shorts")({
  component: ShortsPanel,
  head: () => ({
    meta: [
      { title: "Veronica Shorts · Veronica Hub" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
});
const labels: Record<string, string> = {
  render_queued: "Aguardando processador",
  rendering: "Gerando cortes",
  clips_ready: "Cortes prontos",
  render_failed: "Processamento interrompido · revisar",
  queued: "Na fila",
  preparing: "Preparando",
  awaiting_rights: "Confirmar autorização",
  awaiting_transcript: "Adicionar transcrição",
  awaiting_edit: "Rascunho pronto · falta editar MP4",
  awaiting_connector: "MP4 registrado · falta conector",
  attention: "Revisar",
  archived: "Arquivado",
};
const goalLabels: Record<string, string> = {
  usuarios: "Novos usuários",
  cliques: "Visitas à Hub",
  seguidores: "Seguidores",
  vendas: "Interesse comercial",
};
const empty: SourceInput = {
  url: "",
  title: "",
  transcript: "",
  goal: "usuarios",
  destination: "/",
  priority: 0,
  rightsConfirmed: false,
};
const field =
  "w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 focus:border-zinc-600";
const button =
  "rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium disabled:opacity-40";
function download(name: string, value: string, mime: string) {
  const url = URL.createObjectURL(new Blob([value], { type: mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
function ShortsPanel() {
  const [state, setState] = useState<
    Awaited<ReturnType<typeof getSocialQueue>> | { ok: false; error: string } | null
  >(null);
  const [form, setForm] = useState<SourceInput>(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState("active");
  const [media, setMedia] = useState("");
  const [date, setDate] = useState("");
  const load = async () => {
    try {
      setState(await getSocialQueue());
    } catch {
      setState({
        ok: false,
        error: "Não foi possível abrir a fila. Confira sua sessão e tente recarregar.",
      });
    }
  };
  useEffect(() => {
    void load();
  }, []);
  const run = async (data: Command) => {
    setBusy(true);
    setMessage("");
    try {
      const result = await socialCommand({ data });
      setMessage(
        result.ok
          ? data.action === "prepare"
            ? "Rodada concluída. Confira o estado do item na fila."
            : "Salvo no banco da Hub."
          : "error" in result
            ? String(result.error)
            : "Esse item mudou. Recarregue a fila.",
      );
      if (result.ok && (data.action === "add" || data.action === "revise")) {
        setForm(empty);
        setEditing(null);
      }
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível salvar.");
    } finally {
      setBusy(false);
    }
  };
  const sources = state?.ok ? state.sources : [];
  const active = sources.filter((x) => x.status !== "archived");
  const visible = sources.filter(
    (x) =>
      filter === "all" || (filter === "active" ? x.status !== "archived" : x.status === filter),
  );
  const item = sources.find((x) => x.id === selected);
  function select(source: SourceRow) {
    setSelected(source.id);
    setMedia(source.mediaUrl ?? "");
    setDate("");
  }
  return (
    <div className="min-h-screen bg-[#f6f6f4] text-zinc-900">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <a href="/admin" className="text-sm text-zinc-500">
          ← Painel administrativo
        </a>
        <div className="my-7 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-xs tracking-[.18em] text-zinc-500">YO LAB & CO. · SOCIAL</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">Veronica Shorts</h1>
            <p className="mt-3 max-w-2xl text-zinc-600">
              Você escolhe as fontes. A operação organiza o criativo e acompanha cada etapa até a
              publicação.
            </p>
          </div>
          <button
            className={button}
            disabled={busy || !state?.ok}
            onClick={() => void run({ action: "prepare" })}
          >
            {busy ? "Processando…" : "Preparar próximo da fila"}
          </button>
        </div>
        {!state ? (
          <p>Carregando banco…</p>
        ) : !state.ok ? (
          <p role="alert" className="rounded-2xl bg-white p-6">
            {state.error} Use o botão Entrar no cabeçalho.
          </p>
        ) : (
          <>
            <div className="mb-6 grid gap-3 sm:grid-cols-4">
              {[
                ["No banco", state.total],
                ["Na fila", active.filter((x) => x.status === "queued").length],
                ["Rascunhos", active.filter((x) => !!x.creative).length],
                ["Publicados pelo agente", "Ainda não ativo"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-zinc-200 bg-white p-5">
                  <p className="text-sm text-zinc-500">{label}</p>
                  <p className="mt-2 text-xl font-semibold">{value}</p>
                </div>
              ))}
            </div>
            <div className="mb-7 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-relaxed">
              Preparação editorial:{" "}
              {state.readiness.preparation ? "provedor configurado" : "aguardando provedor"}. Edição
              própria:{" "}
              {state.render.configured && state.render.storageConfigured
                ? "conexão configurada; confira o andamento abaixo"
                : "processador e armazenamento pendentes"}
              . Publicação: aguardando conector. Nenhum horário automático está ativo. A data
              registrada abaixo é uma intenção de publicação, não uma confirmação da Metricool.
            </div>
            {message && (
              <p role="status" className="mb-5 rounded-xl bg-white p-4 text-sm">
                {message}
              </p>
            )}
            <div className="grid items-start gap-6 lg:grid-cols-[380px_1fr]">
              <form
                className="space-y-4 rounded-3xl border border-zinc-200 bg-white p-6"
                onSubmit={(e) => {
                  e.preventDefault();
                  void run({
                    action: editing ? "revise" : "add",
                    id: editing ?? undefined,
                    value: form,
                  });
                }}
              >
                <h2 className="text-xl font-semibold">
                  {editing ? "Revisar fonte" : "Guardar um vídeo"}
                </h2>
                <label className="block text-sm">
                  Link do vídeo
                  <input
                    className={`${field} mt-2`}
                    required
                    type="url"
                    value={form.url}
                    disabled={!!editing}
                    placeholder="https://www.youtube.com/watch?v=…"
                    onChange={(e) => setForm({ ...form, url: e.target.value })}
                  />
                </label>
                <label className="block text-sm">
                  Título para a fila
                  <input
                    className={`${field} mt-2`}
                    required
                    maxLength={160}
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-sm">
                    Objetivo
                    <select
                      className={`${field} mt-2`}
                      value={form.goal}
                      onChange={(e) =>
                        setForm({ ...form, goal: e.target.value as SourceInput["goal"] })
                      }
                    >
                      {GOALS.map((x) => (
                        <option key={x} value={x}>
                          {goalLabels[x]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm">
                    Prioridade (0–10)
                    <input
                      className={`${field} mt-2`}
                      type="number"
                      min="0"
                      max="10"
                      value={form.priority}
                      onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })}
                    />
                  </label>
                </div>
                <label className="block text-sm">
                  Página de destino na Hub
                  <input
                    className={`${field} mt-2`}
                    required
                    value={form.destination}
                    placeholder="/escola"
                    onChange={(e) => setForm({ ...form, destination: e.target.value })}
                  />
                </label>
                <label className="block text-sm">
                  Transcrição opcional para rascunho
                  <textarea
                    className={`${field} mt-2 min-h-36`}
                    maxLength={14000}
                    value={form.transcript}
                    placeholder="O motor próprio transcreve o vídeo. Este campo serve para preparar um rascunho separado."
                    onChange={(e) => setForm({ ...form, transcript: e.target.value })}
                  />
                </label>
                <label className="flex items-start gap-3 text-sm leading-relaxed">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={form.rightsConfirmed}
                    onChange={(e) => setForm({ ...form, rightsConfirmed: e.target.checked })}
                  />
                  Tenho os direitos ou autorização para editar e publicar esse conteúdo.
                </label>
                {editing && (
                  <p className="text-xs text-zinc-500">
                    Salvar uma revisão invalida o rascunho e a mídia anteriores para preparar uma
                    nova versão.
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className={`${button} !bg-zinc-900 !text-white`}
                    disabled={busy}
                  >
                    {editing ? "Salvar revisão" : "Adicionar à fila"}
                  </button>
                  {editing && (
                    <button
                      type="button"
                      className={button}
                      onClick={() => {
                        setEditing(null);
                        setForm(empty);
                      }}
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
              <section className="min-w-0 rounded-3xl border border-zinc-200 bg-white p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-xl font-semibold">Sua seleção</h2>
                  <select
                    aria-label="Filtrar fila"
                    className="rounded-lg border p-2 text-sm"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  >
                    <option value="active">Ativos</option>
                    <option value="all">Todos</option>
                    {Object.entries(labels).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="mt-2 text-xs text-zinc-500">
                  Prioridade maior primeiro; empate segue a ordem de entrada. Até 200 itens por
                  consulta.
                </p>
                {!visible.length ? (
                  <p className="py-12 text-zinc-500">
                    Sua fila está vazia. Comece guardando os links que escolheu.
                  </p>
                ) : (
                  <div className="mt-5 divide-y divide-zinc-100">
                    {visible.map((source) => (
                      <div key={source.id} className="py-4">
                        <button className="w-full text-left" onClick={() => select(source)}>
                          <span className="text-xs text-zinc-500">
                            Prioridade {source.priority} · {goalLabels[source.goal]}
                          </span>
                          <p className="mt-1 break-words font-medium">{source.title}</p>
                          <p className="mt-1 text-sm text-zinc-500">
                            {labels[source.status] ?? source.status}
                          </p>
                        </button>
                        <div className="mt-3 flex flex-wrap gap-3 text-xs">
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noreferrer"
                            className="underline"
                          >
                            Abrir original
                          </a>
                          <button
                            disabled={
                              busy ||
                              ["preparing", "archived", "render_queued", "rendering"].includes(
                                source.status,
                              )
                            }
                            className="underline disabled:opacity-40"
                            onClick={() => {
                              setEditing(source.id);
                              setForm(source);
                            }}
                          >
                            Revisar
                          </button>
                          {source.status === "archived" && (
                            <button
                              disabled={busy}
                              className="underline"
                              onClick={() => void run({ action: "restore", id: source.id })}
                            >
                              Restaurar na fila
                            </button>
                          )}
                          {source.status !== "archived" && (
                            <button
                              disabled={
                                busy ||
                                ["preparing", "render_queued", "rendering"].includes(source.status)
                              }
                              className="underline disabled:opacity-40"
                              onClick={() => void run({ action: "archive", id: source.id })}
                            >
                              Arquivar
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
            {item && (
              <section className="mt-7 rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8">
                <h2 className="text-2xl font-semibold">{item.title}</h2>
                <p className="mt-2 text-sm text-zinc-500">
                  {labels[item.status]} · {item.issue ?? "Sem alertas"}
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <button
                    className={`${button} !bg-zinc-900 !text-white`}
                    disabled={
                      busy ||
                      !item.rightsConfirmed ||
                      ["archived", "preparing", "render_queued", "rendering"].includes(
                        item.status,
                      ) ||
                      !state.render.configured ||
                      !state.render.storageConfigured
                    }
                    onClick={() => void run({ action: "render", id: item.id })}
                  >
                    Gerar cortes do YouTube
                  </button>
                  <button className={button} disabled={busy} onClick={() => void load()}>
                    Atualizar andamento
                  </button>
                  <p className="text-xs text-zinc-500">
                    Até 3 cortes de 20–60 segundos por vídeo. Prévia antes da publicação.
                  </p>
                </div>
                <div className="mt-5 space-y-5">
                  {state.render.jobs
                    .filter((j) => j.sourceId === item.id)
                    .map((job) => (
                      <div key={job.id} className="rounded-2xl border p-4">
                        <p className="text-sm">
                          {job.status === "completed"
                            ? "Cortes renderizados"
                            : job.status === "attention"
                              ? "Revisar processamento"
                              : job.status === "running"
                                ? "Processando vídeo"
                                : "Na fila do motor"}{" "}
                          · {job.stage ?? "aguardando"}
                        </p>
                        {job.issue && <p className="mt-2 text-sm text-amber-700">{job.issue}</p>}
                        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                          {job.clips.map((clip, index) => (
                            <article key={index} className="min-w-0">
                              <video
                                className="aspect-[9/16] w-full rounded-xl bg-zinc-950"
                                controls
                                playsInline
                                preload="none"
                                src={clip.url}
                              />
                              <h3 className="mt-3 font-semibold">{clip.creative.coverTitle}</h3>
                              <p className="mt-1 text-xs text-zinc-500">
                                {clip.start.toFixed(1)}s–{clip.end.toFixed(1)}s do original
                              </p>
                              <a
                                className="mt-2 block text-sm underline"
                                href={clip.url}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Abrir MP4
                              </a>
                              <button
                                className={`${button} mt-3`}
                                onClick={() =>
                                  download(
                                    `short-${job.id}-${index}.json`,
                                    JSON.stringify(clip, null, 2),
                                    "application/json",
                                  )
                                }
                              >
                                Baixar kit das 4 redes
                              </button>
                              <p className="mt-3 whitespace-pre-wrap text-sm">
                                {clip.creative.caption}
                              </p>
                            </article>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
                {item.creative && item.packages ? (
                  <div className="mt-6 grid gap-7 lg:grid-cols-[260px_1fr]">
                    <div>
                      <img
                        className="w-full rounded-2xl border"
                        alt={`Capa vertical: ${item.creative.coverTitle}`}
                        src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(coverSvg(item.creative.coverTitle))}`}
                      />
                      <button
                        className={`${button} mt-3 w-full`}
                        onClick={() =>
                          download(
                            `capa-${item.id}.svg`,
                            coverSvg(item.creative!.coverTitle),
                            "image/svg+xml",
                          )
                        }
                      >
                        Baixar capa 1080 × 1920
                      </button>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">Gancho</p>
                      <p className="mt-2 text-lg">{item.creative.hook}</p>
                      <p className="mt-5 text-sm font-semibold">Direção de edição</p>
                      <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                        {item.creative.editNotes}
                      </p>
                      <div className="mt-6 grid gap-4 sm:grid-cols-2">
                        {item.packages.map((pack) => (
                          <article
                            key={pack.network}
                            className="min-w-0 rounded-2xl bg-zinc-50 p-5"
                          >
                            <h3 className="font-semibold capitalize">{pack.network}</h3>
                            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">
                              {pack.caption}
                            </p>
                            <a
                              className="mt-3 block break-all text-xs text-zinc-500"
                              href={pack.trackedUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {pack.trackedUrl}
                            </a>
                          </article>
                        ))}
                      </div>
                      <p className="mt-3 text-xs text-zinc-500">
                        Visitas ao link nos últimos 30 dias:{" "}
                        {state.clicks
                          .filter((c) => c.sourceId === item.id)
                          .reduce((n, c) => n + Number(c.clicks), 0)}
                        . Inclui testes e prévias; não representa pessoas únicas nem vendas.
                        Instagram e TikTok precisam do link correspondente na bio.
                      </p>
                      <div className="mt-6 space-y-3 rounded-2xl border p-5">
                        <h3 className="font-semibold">Registrar o MP4 editado</h3>
                        <input
                          aria-label="URL do MP4"
                          className={field}
                          type="url"
                          value={media}
                          placeholder="https://…/short.mp4"
                          onChange={(e) => setMedia(e.target.value)}
                        />
                        <label className="block text-sm">
                          Data desejada · Brasília (opcional)
                          <input
                            aria-label="Data desejada em Brasília"
                            className={`${field} mt-2`}
                            type="datetime-local"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                          />
                        </label>
                        <button
                          className={button}
                          disabled={busy || !media}
                          onClick={() =>
                            void run({
                              action: "attach",
                              id: item.id,
                              mediaUrl: media,
                              desiredAt: date ? new Date(`${date}:00-03:00`).toISOString() : null,
                            })
                          }
                        >
                          Salvar mídia e intenção de data
                        </button>
                        <p className="text-xs text-zinc-500">
                          O arquivo deve ser público e permanente. Ainda não será enviado às redes.
                        </p>
                      </div>
                      <button
                        className={`${button} mt-4`}
                        onClick={() =>
                          download(
                            `kit-${item.id}.json`,
                            JSON.stringify(
                              {
                                version: "1.0",
                                source: item.url,
                                mediaUrl: item.mediaUrl,
                                desiredAt: item.desiredAt,
                                timezone: "America/Sao_Paulo",
                                state: item.status,
                                packages: item.packages,
                              },
                              null,
                              2,
                            ),
                            "application/json",
                          )
                        }
                      >
                        Exportar kit das quatro redes
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-5 text-sm text-zinc-600">
                    Adicione a transcrição e confirme a autorização em Revisar. Depois prepare o
                    próximo item da fila.
                  </p>
                )}
              </section>
            )}
            <section className="mt-7 rounded-3xl border border-zinc-200 bg-white p-6">
              <h2 className="text-xl font-semibold">Execuções reais</h2>
              {!state.runs.length ? (
                <p className="mt-3 text-sm text-zinc-500">Nenhuma execução ainda.</p>
              ) : (
                <ul className="mt-4 space-y-2 text-sm">
                  {state.runs.map((run) => (
                    <li
                      key={String(run.id)}
                      className="flex flex-wrap justify-between gap-2 border-b border-zinc-100 py-2"
                    >
                      <span>{labels[String(run.status)] ?? String(run.status)}</span>
                      <span className="text-zinc-500">
                        {new Date(String(run.createdAt)).toLocaleString("pt-BR", {
                          timeZone: "America/Sao_Paulo",
                        })}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
