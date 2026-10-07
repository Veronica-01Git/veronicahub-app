export const MAX_AUDIO_BYTES = 4 * 1024 * 1024;
export const MAX_AUDIO_SECONDS = 120;
export function validateDictation(data: unknown) {
  if (!(data instanceof FormData)) throw new Error("Envie uma gravação de áudio.");
  const audio = data.get("audio");
  if (!(audio instanceof File) || !audio.size || audio.size > MAX_AUDIO_BYTES)
    throw new Error("Grave um áudio de até 4 MB.");
  const type = audio.type.split(";")[0].toLowerCase();
  if (!["audio/webm", "audio/ogg", "audio/mp4", "audio/wav", "audio/mpeg"].includes(type))
    throw new Error("Formato de áudio não suportado.");
  const seconds = Number(data.get("seconds"));
  if (!Number.isFinite(seconds) || seconds < 1 || seconds > MAX_AUDIO_SECONDS)
    throw new Error("Grave entre 1 segundo e 2 minutos.");
  return { audio, type };
}
export function mergeDictation(draft: string, transcript: string): string | null {
  const text = [draft.trimEnd(), transcript.trim()].filter(Boolean).join(" ");
  return text.length <= 1600 ? text : null;
}
