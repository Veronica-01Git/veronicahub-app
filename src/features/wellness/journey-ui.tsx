import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Download, HeartPulse, Plus, Trash2 } from "lucide-react";
import { PrivateClientAccountGate } from "@/features/private-clients/components/account-gate";
import { GOALS, type Assessment } from "./guide";
import {
  deleteWellnessJourney,
  getWellnessJourney,
  reviewWellnessJourney,
  saveWellnessAssessment,
} from "./functions";

type Professional = "lz-team" | "lee-ricardo";
type Snapshot = Awaited<ReturnType<typeof getWellnessJourney>>;
export function WellnessJourney({
  professional = "lz-team",
  management = false,
  lead,
}: {
  professional?: Professional;
  management?: boolean;
  /** Conteúdo exibido entre o título e a avaliação, como a escolha do profissional. */
  lead?: ReactNode;
}) {
  const read = useServerFn(getWellnessJourney);
  const save = useServerFn(saveWellnessAssessment);
  const remove = useServerFn(deleteWellnessJourney);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [creating, setCreating] = useState(false);
  const [answers, setAnswers] = useState({
    name: "",
    goal: "Bem-estar",
    days: 3,
    minutes: 45,
    experience: "Começando",
    location: "Academia",
    challenge: "",
    limitations: "",
    needsReview: false,
    adult: false,
    consent: false,
  });
  const refresh = useCallback(async () => {
    try {
      setSnapshot(await read({ data: professional }));
      setNotice("");
    } catch {
      setNotice("Não foi possível carregar sua jornada. Tente novamente.");
    }
  }, [professional, read]);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  const patch = (key: keyof typeof answers, value: string | number | boolean) =>
    setAnswers((a) => ({ ...a, [key]: value }));
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (step < 2) {
      setStep(step + 1);
      return;
    }
    if (busy) return;
    setBusy(true);
    setNotice("");
    try {
      await save({ data: { ...answers, professional } as Assessment });
      await refresh();
      setCreating(false);
      setStep(0);
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Não foi possível salvar seu guia.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section id="avaliacao" className="w-section">
      <p className="w-eyebrow">
        Veronica Wellness · {management ? "Revisão profissional" : "Sua jornada"}
      </p>
      <h2>
        {management
          ? "Conheça a pessoa. Oriente o próximo passo."
          : "Um primeiro passo feito para você."}
      </h2>
      {lead}
      {!snapshot ? (
        <div className="w-card">
          <p role="status">{notice || "Verificando sua conta…"}</p>
          <button className="w-button secondary" onClick={() => void refresh()}>
            Tentar novamente
          </button>
        </div>
      ) : !snapshot.signedIn ? (
        <div className="w-grid">
          <div className="w-card">
            <HeartPulse />
            <h3>Seu guia gratuito, salvo na sua conta.</h3>
            <p>
              Confirme seu e-mail para responder à avaliação inicial e acessar seu guia. A mesma
              conta acompanha você nos ambientes da Veronica.
            </p>
          </div>
          <PrivateClientAccountGate
            mode="account-required"
            context="wellness"
            onAccessChanged={refresh}
          />
        </div>
      ) : management && !snapshot.staff ? (
        <div className="w-card">
          <p>
            Este ambiente é reservado ao profissional responsável. Sua conta não tem acesso à
            gestão.
          </p>
        </div>
      ) : management ? (
        <div className="space-y-5">
          {snapshot.journeys.length ? (
            snapshot.journeys.map((journey) => (
              <ReviewCard
                key={journey.id}
                journey={journey}
                professional={professional}
                refresh={refresh}
              />
            ))
          ) : (
            <div className="w-card">
              <p>As avaliações autorizadas aparecerão aqui quando forem enviadas.</p>
            </div>
          )}
        </div>
      ) : (
        <>
          {snapshot.journeys.length > 0 && !creating ? (
            <>
              <div className="space-y-5">
                {snapshot.journeys.map((j) => (
                  <article className="w-card" key={j.id}>
                    <p className="w-eyebrow">
                      {j.assessment.goal} · {new Date(j.createdAt).toLocaleDateString("pt-BR")}
                    </p>
                    <h3>{j.guide.title}</h3>
                    <p>{j.guide.routine}</p>
                    <p className="mt-4">{j.guide.focus}</p>
                    <ul className="mt-4 space-y-2">
                      {j.guide.steps.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ul>
                    <p className="mt-5">{j.guide.next}</p>
                    {j.plan ? (
                      <>
                        <h3 className="mt-8">{j.plan.title}</h3>
                        <p>
                          Revisado pelo profissional ·{" "}
                          {j.reviewedAt ? new Date(j.reviewedAt).toLocaleDateString("pt-BR") : ""}
                        </p>
                        <p>{j.plan.notes}</p>
                        <div className="mt-4 overflow-x-auto">
                          <table className="w-table">
                            <thead>
                              <tr>
                                <th>Exercício / atividade</th>
                                <th>Séries</th>
                                <th>Repetições</th>
                                <th>Orientação</th>
                              </tr>
                            </thead>
                            <tbody>
                              {j.plan.exercises.map((e, i) => (
                                <tr key={i}>
                                  <td>{e.name}</td>
                                  <td>{e.sets}</td>
                                  <td>{e.reps}</td>
                                  <td>{e.guidance}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    ) : (
                      <div className="w-tags">
                        <span className="w-tag">Aguardando revisão individual</span>
                      </div>
                    )}
                    <p className="mt-5 text-xs">{j.guide.scope}</p>
                    <div className="w-actions">
                      <button className="w-button secondary" onClick={() => window.print()}>
                        <Download size={16} /> Salvar em PDF
                      </button>
                      <button
                        className="w-button secondary"
                        disabled={busy}
                        onClick={() => {
                          if (!window.confirm("Excluir esta avaliação e o guia da sua conta?"))
                            return;
                          setBusy(true);
                          void remove({ data: j.id })
                            .then(refresh)
                            .catch(() => setNotice("Não foi possível excluir agora."))
                            .finally(() => setBusy(false));
                        }}
                      >
                        <Trash2 size={16} /> Excluir meus dados desta avaliação
                      </button>
                    </div>
                  </article>
                ))}
              </div>
              <button className="w-button secondary mt-5" onClick={() => setCreating(true)}>
                <Plus size={16} /> Atualizar minha avaliação
              </button>
            </>
          ) : (
            <form className="w-card w-form max-w-3xl" onSubmit={(e) => void submit(e)}>
              <p className="w-eyebrow">
                Etapa {step + 1} de 3 ·{" "}
                {step === 0 ? "Seu objetivo" : step === 1 ? "Sua rotina" : "Cuidados e autorização"}
              </p>
              <div className="w-progress" aria-label={`Etapa ${step + 1} de 3`}>
                {[0, 1, 2].map((n) => (
                  <span key={n} className={n <= step ? "active" : ""} />
                ))}
              </div>
              {step === 0 ? (
                <>
                  <label>
                    Como você quer ser chamado(a)?
                    <input
                      autoComplete="given-name"
                      required
                      minLength={2}
                      maxLength={100}
                      value={answers.name}
                      onChange={(e) => patch("name", e.target.value)}
                    />
                  </label>
                  <label>
                    O que você quer desenvolver?
                    <select value={answers.goal} onChange={(e) => patch("goal", e.target.value)}>
                      {GOALS.map((g) => (
                        <option key={g}>{g}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Qual sua experiência?
                    <select
                      value={answers.experience}
                      onChange={(e) => patch("experience", e.target.value)}
                    >
                      {["Começando", "Retomando", "Já tenho uma rotina"].map((g) => (
                        <option key={g}>{g}</option>
                      ))}
                    </select>
                  </label>
                </>
              ) : step === 1 ? (
                <>
                  <div className="w-grid">
                    <label>
                      Dias disponíveis por semana
                      <input
                        type="number"
                        min={1}
                        max={7}
                        required
                        value={answers.days}
                        onChange={(e) => patch("days", Number(e.target.value))}
                      />
                    </label>
                    <label>
                      Minutos por sessão
                      <input
                        type="number"
                        min={15}
                        max={120}
                        required
                        value={answers.minutes}
                        onChange={(e) => patch("minutes", Number(e.target.value))}
                      />
                    </label>
                  </div>
                  <label>
                    Onde você pretende treinar?
                    <select
                      value={answers.location}
                      onChange={(e) => patch("location", e.target.value)}
                    >
                      {["Academia", "Em casa", "Ao ar livre"].map((g) => (
                        <option key={g}>{g}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    O que mais dificulta sua rotina?
                    <textarea
                      maxLength={600}
                      value={answers.challenge}
                      onChange={(e) => patch("challenge", e.target.value)}
                      placeholder="Tempo, motivação, organização…"
                    />
                  </label>
                </>
              ) : (
                <>
                  <label>
                    Há alguma limitação que o profissional precisa conhecer?
                    <textarea
                      maxLength={600}
                      value={answers.limitations}
                      onChange={(e) => patch("limitations", e.target.value)}
                      placeholder="Informe somente o necessário ao atendimento."
                    />
                  </label>
                  <label className="w-check">
                    <input
                      type="checkbox"
                      checked={answers.needsReview}
                      onChange={(e) => patch("needsReview", e.target.checked)}
                    />
                    Tenho dor, lesão ou uma condição que precisa de avaliação antes de iniciar uma
                    nova rotina.
                  </label>
                  <label className="w-check">
                    <input
                      type="checkbox"
                      required
                      checked={answers.adult}
                      onChange={(e) => patch("adult", e.target.checked)}
                    />
                    Tenho 18 anos ou mais.
                  </label>
                  <label className="w-check">
                    <input
                      type="checkbox"
                      required
                      checked={answers.consent}
                      onChange={(e) => patch("consent", e.target.checked)}
                    />
                    <span>
                      Autorizo a Veronica a usar estas respostas para gerar meu guia e
                      disponibilizá-las à equipe autorizada de{" "}
                      {professional === "lz-team" ? "Lucas Tomaz / LZ Team" : "Lee Ricardo"} para
                      este atendimento. Posso excluir esta avaliação na minha jornada. Este aceite
                      não autoriza campanhas de marketing.{" "}
                      <a href="/privacidade" className="underline">
                        Política de privacidade
                      </a>
                      .
                    </span>
                  </label>
                </>
              )}
              <div className="w-actions">
                {step > 0 ? (
                  <button
                    type="button"
                    className="w-button secondary"
                    onClick={() => setStep(step - 1)}
                  >
                    Voltar
                  </button>
                ) : null}
                <button className="w-button" disabled={busy}>
                  {busy
                    ? "Preparando seu guia…"
                    : step === 2
                      ? "Receber meu guia gratuito"
                      : "Continuar"}
                  <ArrowRight size={16} />
                </button>
                {creating ? (
                  <button
                    type="button"
                    className="w-button secondary"
                    onClick={() => setCreating(false)}
                  >
                    Cancelar
                  </button>
                ) : null}
              </div>
            </form>
          )}
        </>
      )}
      {notice && snapshot ? (
        <p className="w-status" role="alert">
          {notice}
        </p>
      ) : null}
    </section>
  );
}
function ReviewCard({
  journey,
  professional,
  refresh,
}: {
  journey: Snapshot["journeys"][number];
  professional: Professional;
  refresh: () => Promise<void>;
}) {
  const review = useServerFn(reviewWellnessJourney);
  const [title, setTitle] = useState(journey.plan?.title ?? "Plano individual");
  const [notes, setNotes] = useState(journey.plan?.notes ?? "");
  const [exercises, setExercises] = useState(
    journey.plan?.exercises ?? [{ name: "", sets: "", reps: "", guidance: "" }],
  );
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      await review({ data: { professional, id: journey.id, plan: { title, notes, exercises } } });
      await refresh();
      setNotice("Plano revisado e liberado na conta do aluno.");
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Não foi possível publicar.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <article className="w-card">
      <p className="w-eyebrow">{journey.plan ? "Revisado" : "Aguardando revisão"}</p>
      <h3>
        {journey.assessment.name} · {journey.assessment.goal}
      </h3>
      <p>
        {journey.guide.routine} · {journey.assessment.experience}
      </p>
      <p className="mt-3">Dificuldades: {journey.assessment.challenge || "Não informadas"}</p>
      <p>Limitações: {journey.assessment.limitations || "Não informadas"}</p>
      {journey.guide.review ? (
        <p className="w-status">Atenção: a pessoa informou necessidade de avaliação individual.</p>
      ) : null}
      <form className="w-form mt-6" onSubmit={(e) => void submit(e)}>
        <label>
          Título do plano
          <input
            required
            minLength={3}
            maxLength={120}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <label>
          Orientações do profissional
          <textarea maxLength={1200} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>
        {exercises.map((item, i) => (
          <fieldset className="w-card mb-4" key={i}>
            <legend>Atividade {i + 1}</legend>
            {(["name", "sets", "reps", "guidance"] as const).map((key) => (
              <label key={key}>
                {
                  {
                    name: "Exercício / atividade",
                    sets: "Séries / frequência",
                    reps: "Repetições / duração",
                    guidance: "Orientação",
                  }[key]
                }
                <input
                  required={key !== "guidance"}
                  maxLength={key === "guidance" ? 500 : key === "name" ? 120 : 50}
                  value={item[key]}
                  onChange={(e) =>
                    setExercises((list) =>
                      list.map((v, n) => (n === i ? { ...v, [key]: e.target.value } : v)),
                    )
                  }
                />
              </label>
            ))}
            {exercises.length > 1 ? (
              <button
                type="button"
                className="w-button secondary"
                onClick={() => setExercises((v) => v.filter((_, n) => n !== i))}
              >
                Remover atividade
              </button>
            ) : null}
          </fieldset>
        ))}
        <div className="w-actions">
          <button
            type="button"
            disabled={exercises.length >= 30}
            className="w-button secondary"
            onClick={() =>
              setExercises((v) => [...v, { name: "", sets: "", reps: "", guidance: "" }])
            }
          >
            Adicionar atividade
          </button>
          <button className="w-button" disabled={busy}>
            {busy ? "Salvando…" : "Revisar e liberar plano"}
          </button>
        </div>
        <p className="mt-3">
          A publicação registra sua revisão profissional e fica disponível somente na conta do
          aluno.
        </p>
      </form>
      {notice ? (
        <p className="w-status" role="status">
          {notice}
        </p>
      ) : null}
    </article>
  );
}
