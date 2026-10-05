import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowRight, BookOpen, Camera, Compass, Dumbbell, Heart, Loader2, LockKeyhole,
  Play, Plus, ShieldCheck, Users, WandSparkles,
} from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";

import { PrivateClientAccountGate } from "@/features/private-clients/components/account-gate";
import {
  addLzLesson, addLzPost, enrollLzStudent, getLzPlatform, hideLzPost, recordLzAgentCase,
  setLzStudentStatus,
} from "./platform.functions";

import { WellnessJourney } from "@/features/wellness/journey-ui";
import { WellnessTheme } from "@/features/wellness/theme";

type Snapshot = Awaited<ReturnType<typeof getLzPlatform>>;
type Section = "painel" | "membros";

const card = "rounded-[28px] border border-[#e5e9e7] bg-white p-5 shadow-[0_12px_38px_rgba(20,40,31,.045)] sm:p-7";
const field = "min-h-12 w-full rounded-2xl border border-[#dce3df] bg-[#fafcfb] px-4 text-sm text-[#17241d] outline-none focus:border-[#19aa73]";
const button = "inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#14231b] px-5 text-sm font-semibold text-white transition hover:bg-[#266c4e] disabled:opacity-50";

export function LzPlatform({ section }: { section: Section }) {
  const read = useServerFn(getLzPlatform);
  const [state, setState] = useState<Snapshot | null>(null);
  const [error, setError] = useState("");
  const refresh = useCallback(async () => {
    try { setState(await read()); setError(""); }
    catch { setError("Não foi possível carregar o ambiente agora."); }
  }, [read]);
  useEffect(() => { void refresh(); }, [refresh]);

  return (
    <WellnessTheme identity="lz-team"><div className="lz-workspace min-h-screen bg-[#f5f8f6] font-sans text-[#16241d]">
      <header className="border-b border-[#e2e9e4] bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-4">
          <Link to="/clientes/lz-team" className="text-base font-black tracking-[-.04em]">
            LZ <span className="text-[#16a66d]">TRAINING CLUB</span>
          </Link>
          <span className="rounded-full bg-[#ecf6f0] px-3 py-1 text-[11px] font-semibold text-[#207a50]">
            por Veronica Hub · YO LAB & CO
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 pb-24 pt-8 sm:pt-12">
        <WellnessJourney professional="lz-team" management={section === "painel"} />
        {!state ? (
          <div className={card}><Loader2 className="h-5 w-5 animate-spin" aria-hidden /> Verificando sua conta…</div>
        ) : state.role === "visitor" ? (
          <div className="mx-auto max-w-xl space-y-5">
            <div className={card}>
              <LockKeyhole className="h-7 w-7 text-[#169f6d]" aria-hidden />
              <h1 className="mt-5 text-3xl font-semibold tracking-[-.05em]">
                {section === "painel" ? "Painel do LZ" : "Comunidade LZ"}
              </h1>
              <p className="mt-3 text-sm leading-6 text-[#58675e]">
                {state.signedIn
                  ? "Sua conta está ativa, mas ainda não foi vinculada à equipe ou à turma do LZ. Peça o acesso ao Coach Lucas."
                  : "Entre com o e-mail cadastrado pelo LZ. O código de acesso chega nessa caixa de entrada."}
              </p>
            </div>
            {!state.signedIn ? (
              <PrivateClientAccountGate mode="account-required" onAccessChanged={refresh} />
            ) : null}
          </div>
        ) : section === "painel" && state.role !== "coach" ? (
          <div className={card}>
            <ShieldCheck className="h-7 w-7 text-[#159a66]" aria-hidden />
            <h1 className="mt-4 text-2xl font-semibold">Área da equipe LZ</h1>
            <p className="mt-2 text-sm text-[#59685f]">Este painel é reservado ao coach.</p>
            <Link to="/clientes/lz-team/membros" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#168557]">
              Ir para a comunidade <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-end justify-between gap-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.18em] text-[#188357]">LZ / operação</p>
                <h1 className="mt-3 text-4xl font-semibold tracking-[-.06em] sm:text-6xl">
                  {section === "painel" ? "Seu clube, em movimento." : "A jornada é coletiva."}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[#627168]">
                  {section === "painel"
                    ? "Alunos, aulas e laboratório editorial em um espaço do LZ."
                    : `Bem-vindo, ${state.name}. Treinos, aulas e histórias de quem está caminhando junto.`}
                </p>
              </div>
              <div className="flex gap-2">
                {state.role === "coach" ? (
                  <Link to="/clientes/lz-team/painel" className={button}>Painel</Link>
                ) : null}
                <Link to="/clientes/lz-team/membros" className={button}>Membros</Link>
              </div>
            </div>
            {error ? <p role="alert" className="mt-5 text-sm text-red-700">{error}</p> : null}
            {section === "painel" && state.role === "coach" ? (
              <CoachPanel state={state} onChange={refresh} />
            ) : (
              <MembersPanel state={state} onChange={refresh} />
            )}
          </>
        )}
        {error && !state ? <p role="alert" className="mt-4 text-sm text-red-700">{error}</p> : null}
      </main>
    </div></WellnessTheme>
  );
}

function CoachPanel({ state, onChange }: { state: Snapshot; onChange: () => Promise<void> }) {
  const enroll = useServerFn(enrollLzStudent);
  const lesson = useServerFn(addLzLesson);
  const record = useServerFn(recordLzAgentCase);
  const changeStudent = useServerFn(setLzStudentStatus);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [caseKind, setCaseKind] = useState("conteudo");
  const [category, setCategory] = useState("treino");
  const count = state.students.filter((s) => s.status === "active").length;

  async function action(event: FormEvent<HTMLFormElement>, fn: (body: Record<string, string>) => Promise<{ok: boolean; error?: string}>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
    setBusy(true);
    try {
      const result = await fn(data);
      setNotice(result.ok ? "Salvo no ambiente LZ." : (result.error ?? "Falha ao salvar."));
      if (result.ok) { form.reset(); await onChange(); }
    } catch (e) { setNotice(e instanceof Error ? e.message : "Falha ao salvar."); }
    finally { setBusy(false); }
  }

  return (
    <div className="mt-8 space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <Metric icon={<Users />} value={String(count)} title="alunos ativos" detail={`Meta inicial: 50 · faltam ${Math.max(0, 50 - count)}`} />
        <Metric icon={<Play />} value={String(state.lessons.length)} title="aulas em vídeo" detail="Publicadas pelo LZ" />
        <Metric icon={<WandSparkles />} value={String(state.cases.length)} title="casos no laboratório" detail="Regras ensinadas pela equipe" />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <section className={card}>
          <Label icon={<Plus />} title="Cadastrar aluno" />
          <p className="mt-2 text-sm text-[#66746b]">A pessoa entra com esse e-mail; cada aluno vê somente a área de membros.</p>
          <form className="mt-5 space-y-3" onSubmit={(e) => void action(e, (d) => enroll({ data: d }))}>
            <input required name="fullName" className={field} placeholder="Nome completo" maxLength={120} />
            <input required name="email" type="email" className={field} placeholder="E-mail do aluno" />
            <input required name="phone" type="tel" className={field} placeholder="Telefone com DDD" />
            <button disabled={busy} className={button}>Adicionar à turma <ArrowRight className="h-4 w-4" /></button>
          </form>
        </section>
        <section className={card}>
          <Label icon={<BookOpen />} title="Nova aula" />
          <p className="mt-2 text-sm text-[#66746b]">Vídeo do YouTube ou Vimeo. O conteúdo é exibido apenas para contas vinculadas.</p>
          <form className="mt-5 space-y-3" onSubmit={(e) => void action(e, (d) => lesson({ data: d }))}>
            <input required name="title" className={field} placeholder="Título da aula" maxLength={120} />
            <input name="summary" className={field} placeholder="O que o aluno vai aprender" maxLength={700} />
            <select name="category" value={category} onChange={(e) => setCategory(e.target.value)} className={field}>
              <option value="treino">Treino</option><option value="cardio">Cardiovascular</option><option value="habitos">Hábitos e alimentação</option>
            </select>
            <input required name="videoUrl" type="url" className={field} placeholder="Link HTTPS do vídeo" />
            <button disabled={busy} className={button}>Publicar aula <ArrowRight className="h-4 w-4" /></button>
          </form>
        </section>
      </div>
      <section className={card}>
        <Label icon={<WandSparkles />} title="Laboratório do agente LZ" />
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#66746b]">
          Lucas registra uma situação real e a conduta esperada. Esses casos formam uma base revisada
          para avaliar o futuro agente de conteúdo e operação; nenhum texto é publicado por IA automaticamente.
        </p>
        <form className="mt-5 grid gap-3 md:grid-cols-[180px_1fr_1fr_auto]" onSubmit={(e) => void action(e, (d) => record({ data: d }))}>
          <select name="kind" value={caseKind} onChange={(e) => setCaseKind(e.target.value)} className={field}>
            <option value="conteudo">Conteúdo</option><option value="alunos">Alunos</option><option value="seguranca">Segurança</option>
          </select>
          <textarea required name="situation" className={field + " py-3"} placeholder="Situação / dor real" minLength={10} maxLength={700} />
          <textarea required name="expectedAction" className={field + " py-3"} placeholder="Resposta ou ação aprovada pelo Lucas" minLength={10} maxLength={700} />
          <button disabled={busy} className={button}>Registrar</button>
        </form>
        <div className="mt-5 space-y-2">
          {state.cases.map((item) => (
            <div key={item.id} className="rounded-2xl bg-[#f4f8f5] p-4 text-sm">
              <span className="text-xs font-bold uppercase text-[#16865a]">{item.kind}</span>
              <p className="mt-2 font-medium">{item.situation}</p>
              <p className="mt-1 text-[#627168]">Conduta esperada: {item.expectedAction}</p>
            </div>
          ))}
        </div>
      </section>
      <section className={card}>
        <Label icon={<Users />} title="Turma LZ" />
        {state.students.length ? (
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {state.students.map((s) => (
              <div key={s.id} className="rounded-2xl bg-[#f5f8f6] p-4">
                <p className="font-semibold">{s.fullName}</p>
                <p className="mt-1 break-all text-xs text-[#627168]">{s.email} · {s.phone}</p>
                <button type="button" className="mt-3 text-xs font-semibold text-[#168557]"
                  onClick={() => void changeStudent({ data: { id: s.id, status: s.status === "active" ? "inactive" : "active" } })
                    .then(onChange).catch(() => setNotice("Não foi possível alterar o cadastro."))}>
                  {s.status === "active" ? "Suspender acesso" : "Reativar acesso"}
                </button>
              </div>
            ))}
          </div>
        ) : <p className="mt-4 text-sm text-[#66746b]">Nenhum aluno cadastrado ainda.</p>}
      </section>
      <p className="text-xs text-[#65746b]">
        Plano proposto: R$ 50/mês por aluno, com divisão R$ 20 Lucas · R$ 20 plataforma · R$ 10 YO LAB & CO.
        A cobrança e os repasses ainda não estão ativados.
      </p>
      {notice ? <p role="status" className="text-sm font-medium text-[#176f4d]">{notice}</p> : null}
    </div>
  );
}

function MembersPanel({ state, onChange }: { state: Snapshot; onChange: () => Promise<void> }) {
  const post = useServerFn(addLzPost);
  const hide = useServerFn(hideLzPost);
  const [body, setBody] = useState("");
  const [imageData, setImageData] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function chooseImage(file?: File) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setNotice("Use uma foto JPEG, PNG ou WebP."); return;
    }
    const url = URL.createObjectURL(file);
    try {
      const source = new Image();
      source.src = url;
      await source.decode();
      const canvas = document.createElement("canvas");
      const scale = Math.min(1, 1000 / Math.max(source.width, source.height));
      canvas.width = Math.max(1, Math.round(source.width * scale));
      canvas.height = Math.max(1, Math.round(source.height * scale));
      canvas.getContext("2d")?.drawImage(source, 0, 0, canvas.width, canvas.height);
      const data = canvas.toDataURL("image/webp", 0.62);
      if (data.length > 470_000) { setNotice("Foto muito grande. Escolha outra imagem."); return; }
      setImageData(data); setNotice("");
    } catch { setNotice("Não foi possível preparar a foto."); }
    finally { URL.revokeObjectURL(url); }
  }

  async function publish(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const result = await post({ data: { body, imageData } });
      if (!result.ok) { setNotice(result.error); return; }
      setBody(""); setImageData(""); setNotice("Publicado na turma.");
      await onChange();
    } catch (e) { setNotice(e instanceof Error ? e.message : "Falha ao publicar."); }
    finally { setBusy(false); }
  }

  return (
    <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_340px]">
      <div className="space-y-5">
        <section className={card}>
          <Label icon={<Camera />} title="Compartilhe seu dia" />
          <p className="mt-2 text-sm text-[#66746b]">Uma foto do treino, da corrida, da marmita ou uma conquista. Visível apenas para a turma LZ.</p>
          <form className="mt-5 space-y-3" onSubmit={(e) => void publish(e)}>
            <textarea className={field + " min-h-28 py-3"} maxLength={500} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Como foi seu dia?" />
            {imageData ? <img src={imageData} alt="Prévia da foto" className="max-h-64 w-full rounded-2xl object-cover" /> : null}
            <div className="flex flex-wrap items-center gap-3">
              <label className="cursor-pointer rounded-full border border-[#dae4dd] px-5 py-3 text-xs font-semibold">
                <Camera className="mr-2 inline h-4 w-4" aria-hidden /> Escolher foto
                <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => void chooseImage(e.target.files?.[0])} />
              </label>
              <button disabled={busy || (!body.trim() && !imageData)} className={button}>Publicar</button>
            </div>
          </form>
          {notice ? <p role="status" className="mt-3 text-sm text-[#176f4d]">{notice}</p> : null}
        </section>
        {state.posts.length ? state.posts.map((item) => (
          <article key={item.id} className={card}>
            <div className="flex items-center justify-between gap-3">
              <div><p className="font-semibold">{item.authorName}</p><p className="text-xs text-[#809087]">{new Date(item.createdAt).toLocaleDateString("pt-BR")}</p></div>
              {(state.role === "coach" || item.mine) ? (
                <button type="button" className="text-xs text-[#8b5757]" onClick={() => void hide({ data: { id: item.id } }).then(onChange).catch(() => setNotice("Não foi possível ocultar a publicação."))}>
                  Ocultar
                </button>
              ) : null}
            </div>
            {item.body ? <p className="mt-4 whitespace-pre-wrap text-sm leading-6">{item.body}</p> : null}
            {item.imageData ? <img src={item.imageData} alt={`Foto de ${item.authorName}`} loading="lazy" className="mt-4 max-h-[520px] w-full rounded-2xl object-cover" /> : null}
          </article>
        )) : <div className={card}><p className="text-sm text-[#66746b]">A turma ainda não publicou. Comece a conversa.</p></div>}
      </div>
      <aside className="space-y-5">
        <section className={card}>
          <Label icon={<Dumbbell />} title="Aulas do Lucas" />
          <div className="mt-5 space-y-5">
            {state.lessons.length ? state.lessons.map((item) => (
              <div key={item.id}>
                <div className="aspect-video overflow-hidden rounded-2xl bg-[#14231b]">
                  <iframe title={item.title} src={item.videoUrl} loading="lazy" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="h-full w-full" />
                </div>
                <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-[#19a36c]">{item.category}</p>
                <h3 className="mt-1 font-semibold">{item.title}</h3>
                <p className="mt-1 text-xs leading-5 text-[#65746b]">{item.summary}</p>
              </div>
            )) : <p className="text-sm text-[#66746b]">As aulas aparecerão aqui quando Lucas publicar.</p>}
          </div>
        </section>
        <section className={card}>
          <Label icon={<Heart />} title="Hábitos e movimento" />
          <p className="mt-3 text-sm leading-6 text-[#65746b]">
            Registre sua rotina e siga as orientações individuais do profissional responsável.
            O conteúdo da turma não substitui avaliação de saúde ou prescrição alimentar.
          </p>
          <Link to="/clientes/lz-team" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#168557]">
            Conheça o método LZ <Compass className="h-4 w-4" />
          </Link>
        </section>
      </aside>
    </div>
  );
}

function Label({ icon, title }: { icon: ReactNode; title: string }) {
  return <h2 className="flex items-center gap-2 text-xl font-semibold tracking-[-.04em]"><span className="text-[#17a671]">{icon}</span>{title}</h2>;
}
function Metric({ icon, value, title, detail }: { icon: ReactNode; value: string; title: string; detail: string }) {
  return <div className={card}><span className="text-[#18a671]">{icon}</span><p className="mt-4 text-4xl font-semibold tracking-[-.06em]">{value}</p><p className="mt-1 text-sm font-semibold">{title}</p><p className="mt-2 text-xs text-[#708075]">{detail}</p></div>;
}
