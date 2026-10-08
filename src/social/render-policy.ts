import { validateCreative, networkKit, type Goal } from "./policy.ts";

export type Candidate = { id: number; start: number; end: number; text: string };
export function validateCandidates(input: unknown): Candidate[] {
  if (!Array.isArray(input) || !input.length || input.length > 12)
    throw new Error("INVALID_CANDIDATES");
  const ids = new Set<number>();
  let chars = 0;
  return input.map((v) => {
    if (
      !v ||
      !Number.isInteger(v.id) ||
      ids.has(v.id) ||
      !Number.isFinite(v.start) ||
      !Number.isFinite(v.end) ||
      v.start < 0 ||
      v.end > 3600 ||
      v.end - v.start < 20 ||
      v.end - v.start > 60 ||
      typeof v.text !== "string" ||
      !v.text.trim() ||
      v.text.length > 1800 ||
      /[<>]/.test(v.text) ||
      [...v.text].some((c) => c.charCodeAt(0) <= 8)
    )
      throw new Error("INVALID_CANDIDATES");
    ids.add(v.id);
    chars += v.text.length;
    if (chars > 14000) throw new Error("TRANSCRIPT_TOO_LARGE");
    return { id: v.id, start: v.start, end: v.end, text: v.text.trim() };
  });
}
export function validatePlan(
  input: unknown,
  candidates: Candidate[],
  sourceId: string,
  goal: Goal,
) {
  const clips = (input as { clips?: unknown[] })?.clips;
  if (!Array.isArray(clips) || !clips.length || clips.length > 3) throw new Error("INVALID_PLAN");
  const picked: Candidate[] = [];
  return clips.map((value) => {
    const v = value as { candidateId: number; creative: unknown };
    const candidate = candidates.find((c) => c.id === v.candidateId);
    if (
      !candidate ||
      picked.some((c) => Math.max(c.start, candidate.start) < Math.min(c.end, candidate.end))
    )
      throw new Error("INVALID_OR_OVERLAPPING_CLIP");
    picked.push(candidate);
    const creative = validateCreative(v.creative);
    return { ...candidate, creative, packages: networkKit(sourceId, goal, creative) };
  });
}
export type RenderPlan = ReturnType<typeof validatePlan>;
export function mediaBase(value: string | undefined) {
  if (!value) throw new Error("MEDIA_STORAGE_NOT_CONFIGURED");
  const u = new URL(value);
  if (
    u.protocol !== "https:" ||
    u.username ||
    u.password ||
    u.port ||
    u.search ||
    u.hash ||
    !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(u.hostname) ||
    /(^|\.)(localhost|local|internal)$/.test(u.hostname)
  )
    throw new Error("INVALID_MEDIA_BASE");
  return u.toString().replace(/\/$/, "");
}
export function validateArtifacts(
  input: unknown,
  base: string,
  sourceId: string,
  jobId: string,
  plan: RenderPlan,
) {
  if (!Array.isArray(input) || input.length !== plan.length) throw new Error("INCOMPLETE_RENDER");
  return plan.map((clip, index) => {
    const v = input[index];
    const expected = `${base}/${sourceId}/${jobId}/${index}.mp4`;
    if (
      !v ||
      v.url !== expected ||
      v.width !== 1080 ||
      v.height !== 1920 ||
      !Number.isFinite(v.duration) ||
      Math.abs(v.duration - (clip.end - clip.start)) > 1
    )
      throw new Error("INVALID_RENDER_ARTIFACT");
    return { ...clip, url: expected, width: 1080, height: 1920, duration: v.duration };
  });
}
