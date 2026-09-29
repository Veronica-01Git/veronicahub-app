import { useEffect, useState } from "react";
import {
  BRIEF_LIMITS,
  BRIEF_STORAGE_KEY,
  emptyProject,
  parseStoredBrief,
  serializeBrief,
  type PersonalBrief,
} from "../features/generator/personal-brief";

const inputStyle =
  "mt-2 min-h-12 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-emerald-300 focus:ring-1 focus:ring-emerald-300";

export function PersonalBriefFields({
  brief,
  onChange,
}: {
  brief: PersonalBrief;
  onChange: (brief: PersonalBrief) => void;
}) {
  const field = (key: keyof typeof BRIEF_LIMITS, value: string) =>
    onChange({ ...brief, [key]: value });
  const projectField = (
    index: number,
    key: "title" | "description" | "result",
    value: string,
  ) =>
    onChange({
      ...brief,
      projects: brief.projects.map((p, i) =>
        i === index ? { ...p, [key]: value } : p,
      ),
    });
  return (
    <div className="mt-6 space-y-8">
      <fieldset className="space-y-5">
        <legend className="mb-4 text-sm font-semibold text-emerald-200">
          01 · Sua apresentação
        </legend>
        <label className="block text-sm text-white/70">
          Frase de apresentação{" "}
          <span className="text-white/45">· opcional</span>
          <input
            value={brief.headline}
            maxLength={BRIEF_LIMITS.headline}
            onChange={(e) => field("headline", e.target.value)}
            placeholder="O que você faz e para quem?"
            className={inputStyle}
          />
        </label>
        <label className="block text-sm text-white/70">
          Sobre seu trabalho <span className="text-white/45">· opcional</span>
          <textarea
            value={brief.about}
            rows={4}
            maxLength={BRIEF_LIMITS.about}
            onChange={(e) => field("about", e.target.value)}
            placeholder="Conte sua trajetória, o tipo de problema que resolve e seu jeito de trabalhar."
            className={inputStyle}
          />
        </label>
        <label className="block text-sm text-white/70">
          Competências <span className="text-white/45">· opcional</span>
          <input
            value={brief.skills}
            maxLength={BRIEF_LIMITS.skills}
            onChange={(e) => field("skills", e.target.value)}
            placeholder="Separe por vírgulas. Ex.: fotografia, edição, direção de arte"
            className={inputStyle}
          />
        </label>
      </fieldset>
      <fieldset className="space-y-4">
        <legend className="mb-2 text-sm font-semibold text-emerald-200">
          02 · Trabalhos selecionados
        </legend>
        <p className="text-xs leading-relaxed text-white/55">
          Inclua até três projetos reais, acadêmicos ou autorais. Se ainda não
          tiver projetos, pode continuar sem preencher.
        </p>
        {brief.projects.map((project, index) => (
          <fieldset
            key={index}
            className="space-y-4 rounded-xl border border-white/10 p-4"
          >
            <legend className="px-2 text-xs text-white/60">
              Projeto {index + 1}
            </legend>
            <label className="block text-sm text-white/70">
              Título do projeto {index + 1}
              <input
                value={project.title}
                maxLength={120}
                onChange={(e) => projectField(index, "title", e.target.value)}
                className={inputStyle}
              />
            </label>
            <label className="block text-sm text-white/70">
              Contexto e sua participação
              <textarea
                value={project.description}
                rows={3}
                maxLength={1000}
                onChange={(e) =>
                  projectField(index, "description", e.target.value)
                }
                placeholder="Qual era o desafio? O que você fez?"
                className={inputStyle}
              />
            </label>
            <label className="block text-sm text-white/70">
              Resultado observado
              <textarea
                value={project.result}
                rows={2}
                maxLength={400}
                onChange={(e) => projectField(index, "result", e.target.value)}
                placeholder="Descreva o que mudou. Não precisa ser um número."
                className={inputStyle}
              />
            </label>
            {brief.projects.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  onChange({
                    ...brief,
                    projects: brief.projects.filter((_, i) => i !== index),
                  })
                }
                className="min-h-11 rounded-lg border border-white/15 px-4 text-sm text-white/70"
              >
                Remover projeto {index + 1}
              </button>
            )}
          </fieldset>
        ))}
        {brief.projects.length < 3 && (
          <button
            type="button"
            onClick={() =>
              onChange({
                ...brief,
                projects: [...brief.projects, emptyProject()],
              })
            }
            className="min-h-11 rounded-lg border border-white/20 px-4 text-sm text-white/80 hover:border-emerald-300"
          >
            Adicionar projeto
          </button>
        )}
      </fieldset>
      <details className="rounded-xl border border-white/10 p-4">
        <summary className="min-h-11 cursor-pointer py-2 text-sm font-semibold text-emerald-200">
          03 · Experiência, formação e contato{" "}
          <span className="font-normal text-white/45">· opcionais</span>
        </summary>
        <div className="mt-4 space-y-5">
          <label className="block text-sm text-white/70">
            Experiência
            <textarea
              value={brief.experience}
              rows={3}
              maxLength={BRIEF_LIMITS.experience}
              onChange={(e) => field("experience", e.target.value)}
              placeholder="Função, organização e período — apenas informações que queira apresentar."
              className={inputStyle}
            />
          </label>
          <label className="block text-sm text-white/70">
            Formação
            <textarea
              value={brief.education}
              rows={2}
              maxLength={BRIEF_LIMITS.education}
              onChange={(e) => field("education", e.target.value)}
              className={inputStyle}
            />
          </label>
          <label className="block text-sm text-white/70">
            E-mail profissional
            <input
              type="email"
              value={brief.contact}
              maxLength={BRIEF_LIMITS.contact}
              onChange={(e) => field("contact", e.target.value)}
              autoComplete="email"
              className={inputStyle}
            />
          </label>
        </div>
      </details>
    </div>
  );
}

export function BriefStorage({
  brief,
  onRestore,
}: {
  brief: PersonalBrief;
  onRestore: (brief: PersonalBrief) => void;
}) {
  const [saved, setSaved] = useState<PersonalBrief | null>(null);
  const [message, setMessage] = useState("");
  useEffect(() => {
    try {
      const raw = localStorage.getItem(BRIEF_STORAGE_KEY);
      if (raw) setSaved(parseStoredBrief(raw));
    } catch {
      setMessage(
        "Não foi possível recuperar o briefing deste navegador. Você pode continuar normalmente.",
      );
    }
  }, []);
  const save = () => {
    try {
      localStorage.setItem(BRIEF_STORAGE_KEY, serializeBrief(brief));
      setSaved(brief);
      setMessage(
        "Briefing guardado neste navegador. Você pode retomá-lo ao voltar a esta página.",
      );
    } catch {
      setMessage(
        "O navegador não permitiu guardar o briefing. Mantenha esta aba aberta para continuar.",
      );
    }
  };
  return (
    <div className="mt-6 border-t border-white/10 pt-5">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={save}
          className="min-h-11 rounded-lg border border-white/20 px-4 text-sm text-white/80"
        >
          {saved
            ? "Atualizar briefing guardado"
            : "Guardar briefing neste navegador"}
        </button>
        {saved && (
          <button
            type="button"
            onClick={() => {
              onRestore(saved);
              setMessage(
                "Briefing recuperado. Revise os campos antes de montar a prévia.",
              );
            }}
            className="min-h-11 rounded-lg border border-emerald-300/30 px-4 text-sm text-emerald-200"
          >
            Retomar briefing guardado
          </button>
        )}
        {saved && (
          <button
            type="button"
            onClick={() => {
              try {
                localStorage.removeItem(BRIEF_STORAGE_KEY);
                setSaved(null);
                setMessage(
                  "Cópia guardada removida. Os campos desta aba foram mantidos.",
                );
              } catch {
                setMessage(
                  "O navegador não permitiu remover a cópia guardada.",
                );
              }
            }}
            className="min-h-11 rounded-lg px-4 text-sm text-white/60 underline underline-offset-4"
          >
            Remover cópia guardada
          </button>
        )}
      </div>
      <p className="mt-3 text-xs leading-relaxed text-white/50">
        O salvamento é opcional e fica somente neste navegador, disponível a
        quem usar este perfil. Evite guardar dados em aparelhos compartilhados.
        A prévia não é publicada.
      </p>
      <p role="status" className="mt-2 text-sm text-emerald-200">
        {message}
      </p>
    </div>
  );
}
