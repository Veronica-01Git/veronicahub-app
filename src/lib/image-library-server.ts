import { createServerFn } from "@tanstack/react-start";
import { and, asc, desc, eq, isNull } from "drizzle-orm";
import Anthropic from "@anthropic-ai/sdk";
import { getDb } from "./db";
import { libraryImages } from "./schema";
import { requireAdmin } from "./admin-server";
import { BEAT_LABELS, BEAT_BRIEF, isBeat, type Beat } from "./beats";
import { generateNanoBananaImage } from "./higgsfield";
import { COVER_HOUSE_STYLE, NO_REAL_PERSON_RULE } from "./cover-style";

// Módulo neutro (não importa de articles-server.ts) pra evitar ciclo:
// articles-server.ts importa claimLibraryImage/insertLibraryImage daqui
// pra alimentar a capa por matéria a partir da biblioteca.

const LIBRARY_PROMPT_MODEL = "claude-haiku-4-5-20251001";
const LIBRARY_PROMPT_MAX_TOKENS = 400;

function mapLibraryImage(row: typeof libraryImages.$inferSelect) {
  return {
    id: row.id,
    beat: row.beat,
    imageUrl: row.imageUrl,
    prompt: row.prompt,
    source: row.source,
    usedByArticleId: row.usedByArticleId,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function insertLibraryImage(params: {
  beat: Beat;
  imageUrl: string;
  prompt: string;
  source: "cron" | "manual";
  usedByArticleId?: string | null;
}) {
  const db = getDb();
  const [row] = await db
    .insert(libraryImages)
    .values({
      beat: params.beat,
      imageUrl: params.imageUrl,
      prompt: params.prompt,
      source: params.source,
      usedByArticleId: params.usedByArticleId ?? null,
    })
    .returning();
  return mapLibraryImage(row);
}

// "Reserva" a imagem mais antiga ainda não usada do beat pra uma matéria —
// mesmo padrão de update condicional idempotente do webhook do Mercado
// Pago (mercadopago-webhook.ts): busca a candidata, tenta o UPDATE só se
// ela continuar livre, e trata "0 linhas afetadas" como corrida perdida em
// vez de erro (quem chamou cai pro caminho de gerar uma nova).
export async function claimLibraryImage(
  beat: Beat,
  articleId: string,
): Promise<{ id: string; imageUrl: string } | null> {
  const db = getDb();
  const [candidate] = await db
    .select({ id: libraryImages.id })
    .from(libraryImages)
    .where(and(eq(libraryImages.beat, beat), isNull(libraryImages.usedByArticleId)))
    .orderBy(asc(libraryImages.createdAt))
    .limit(1);
  if (!candidate) return null;

  const [claimed] = await db
    .update(libraryImages)
    .set({ usedByArticleId: articleId })
    .where(and(eq(libraryImages.id, candidate.id), isNull(libraryImages.usedByArticleId)))
    .returning({ id: libraryImages.id, imageUrl: libraryImages.imageUrl });

  return claimed ?? null;
}

// Núcleo compartilhado pelo botão manual (generateLibraryImageAdmin, admin
// gate) e pelo cron externo (image-library-cron.ts, gate por CRON_SECRET):
// a Claude escreve uma cena de fotojornalismo real pro tópico (sem
// depender de nenhuma matéria específica, só do brief da editoria),
// gera via Higgsfield e guarda na biblioteca.
export async function generateLibraryImage(
  beat: Beat,
  source: "cron" | "manual",
): Promise<{ ok: true; image: ReturnType<typeof mapLibraryImage> } | { ok: false; error: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "ANTHROPIC_API_KEY não configurada." };
  }

  const systemPrompt = `Você escreve prompts de imagem pra biblioteca de banco de imagens do Veronica Wire, editoria "${BEAT_LABELS[beat]}" (${BEAT_BRIEF[beat]}).
Descreva uma cena de fotojornalismo real, com gente de verdade fazendo algo ligado a este tema (trabalhando, numa fábrica, escritório, laboratório, evento, rua, canteiro de obras etc.) — varie bastante a composição a cada chamada, evite repetir sempre a mesma cena/ângulo.
PROIBIDO: elementos gráficos futuristas, holograma, overlay digital, ou qualquer estética "de tela/HUD" — é foto de fotojornalismo real, não ilustração nem infográfico.
${NO_REAL_PERSON_RULE}
Responda SOMENTE com um objeto JSON válido (sem markdown): {"prompt": "cena em inglês, um parágrafo"}`;

  type CreateMessage = (params: Record<string, unknown>) => Promise<{
    content: Array<{ type: string; text?: string }>;
  }>;

  let response: { content: Array<{ type: string; text?: string }> };
  try {
    const anthropic = new Anthropic({ apiKey });
    response = await (anthropic.messages.create as unknown as CreateMessage).call(
      anthropic.messages,
      {
        model: LIBRARY_PROMPT_MODEL,
        max_tokens: LIBRARY_PROMPT_MAX_TOKENS,
        system: systemPrompt,
        messages: [
          { role: "user", content: `Escreva a cena pra editoria ${BEAT_LABELS[beat]}.` },
        ],
      },
    );
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Falha ao gerar prompt de imagem.",
    };
  }

  const text = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();

  const jsonStart = text.indexOf("{");
  const jsonEnd = text.lastIndexOf("}");
  if (jsonStart === -1 || jsonEnd === -1) {
    return { ok: false, error: "IA não retornou um prompt válido." };
  }

  let scenePrompt: string;
  try {
    const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1)) as { prompt?: unknown };
    if (typeof parsed.prompt !== "string" || !parsed.prompt.trim()) {
      throw new Error("vazio");
    }
    scenePrompt = parsed.prompt.trim();
  } catch {
    return { ok: false, error: "IA não retornou um prompt válido." };
  }

  const image = await generateNanoBananaImage({ prompt: `${scenePrompt} ${COVER_HOUSE_STYLE}` });
  if (!image.ok) {
    return { ok: false, error: image.error };
  }

  const row = await insertLibraryImage({
    beat,
    imageUrl: image.imageUrl,
    prompt: scenePrompt,
    source,
  });

  return { ok: true, image: row };
}

export const listLibraryImagesAdmin = createServerFn({ method: "GET" }).handler(async () => {
  const admin = await requireAdmin();
  if (!admin) {
    return { ok: false as const, error: "Acesso restrito." };
  }
  const db = getDb();
  const rows = await db
    .select()
    .from(libraryImages)
    .orderBy(desc(libraryImages.createdAt))
    .limit(300);
  return { ok: true as const, images: rows.map(mapLibraryImage) };
});

const libraryBeatValidator = (input: unknown) => {
  const data = input as { beat?: unknown };
  if (!isBeat(data?.beat)) throw new Error("Editoria inválida.");
  return { beat: data.beat };
};

export const generateLibraryImageAdmin = createServerFn({ method: "POST" })
  .validator(libraryBeatValidator)
  .handler(async ({ data }) => {
    const admin = await requireAdmin();
    if (!admin) {
      return { ok: false as const, error: "Acesso restrito." };
    }
    return generateLibraryImage(data.beat, "manual");
  });
