import { validateCreative, networkKit, type SourceInput, type Creative } from "./policy.ts";
export async function prepareSource(
  source: SourceInput & { id: string },
  generate: (transcript: string) => Promise<unknown>,
) {
  if (!source.rightsConfirmed) return { status: "awaiting_rights" as const };
  if (source.transcript.trim().length < 80) return { status: "awaiting_transcript" as const };
  const creative: Creative = validateCreative(await generate(source.transcript));
  return {
    status: "awaiting_edit" as const,
    creative,
    packages: networkKit(source.id, source.goal, creative),
  };
}
