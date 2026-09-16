// Abastecimento do banco curado de capas da Wire TV.
//
// Divisão de trabalho, igual à do resto do pipeline de capa: quem tem a
// chave do Pexels e a rede é o runner do GitHub Actions
// (scripts/fill-cover-bank.mjs) — ele busca, filtra e baixa os bytes; aqui só
// se valida e grava. O Worker nunca chama o Pexels, e a PEXELS_API_KEY não
// precisa virar secret do Cloudflare.
//
// Por que não deixar o runner escrever direto no Postgres: a DATABASE_URL não
// é secret do Actions hoje, e transformá-la nisso daria ao workflow acesso de
// escrita ao banco inteiro para cadastrar imagem. Este endpoint faz uma coisa
// só, com teto por editoria e validação de tipo.
import { eq, like, sql } from "drizzle-orm";
import { getDb } from "./db";
import { mediaImages, users } from "./schema";
import { BEAT_VALUES, isBeat } from "./beats";
import {
  bankFilename,
  buildBankAltText,
  LIBRARY_COVER_PREFIX,
  MAX_BANK_PER_BEAT,
} from "./cover-bank";

const ALLOWED_MIME_TYPES = new Set(["image/jpeg"]);
const MAX_BANK_IMAGE_BYTES = 5 * 1024 * 1024;

function unauthorized(request: Request): Response | null {
  const secret = process.env.CRON_SECRET;
  if (!secret) return new Response("CRON_SECRET não configurada", { status: 500 });
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("unauthorized", { status: 401 });
  }
  return null;
}

async function inventory(db: ReturnType<typeof getDb>) {
  const rows = await db
    .select({ filename: mediaImages.filename })
    .from(mediaImages)
    .where(like(mediaImages.filename, `${LIBRARY_COVER_PREFIX}%`));

  const bank: Record<string, string[]> = {};
  for (const beat of BEAT_VALUES) bank[beat] = [];
  for (const row of rows) {
    // O prefixo já filtrou na consulta; aqui só se separa por editoria, e um
    // nome fora das cinco conhecidas é ignorado em vez de derrubar a resposta.
    const beat = BEAT_VALUES.find((value) =>
      row.filename.startsWith(`${LIBRARY_COVER_PREFIX}${value}-`),
    );
    if (beat) bank[beat].push(row.filename);
  }
  return bank;
}

// O runner consulta antes de buscar no Pexels: assim ele sabe quantas faltam
// por editoria e quais ids já estão cadastrados, e não gasta chamada de API
// nem largura de banda para baixar foto que seria recusada aqui.
export async function handleCoverBankInventoryCron(request: Request): Promise<Response> {
  const denied = unauthorized(request);
  if (denied) return denied;

  const bank = await inventory(getDb());
  return Response.json({
    ok: true,
    maxPerBeat: MAX_BANK_PER_BEAT,
    bank,
    totals: Object.fromEntries(Object.entries(bank).map(([beat, list]) => [beat, list.length])),
  });
}

export async function handleCoverBankAddCron(request: Request): Promise<Response> {
  const denied = unauthorized(request);
  if (denied) return denied;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return new Response("corpo inválido", { status: 400 });
  }

  const input = payload as {
    beat?: unknown;
    photoId?: unknown;
    photographer?: unknown;
    term?: unknown;
    mimeType?: unknown;
    dataBase64?: unknown;
  };

  if (!isBeat(input.beat)) return new Response("editoria inválida", { status: 400 });
  if (typeof input.photoId !== "string" || !/^\d+$/.test(input.photoId)) {
    return new Response("photoId inválido", { status: 400 });
  }
  if (typeof input.photographer !== "string" || !input.photographer.trim()) {
    return new Response("photographer é obrigatório — sem ele a foto entra sem crédito", {
      status: 400,
    });
  }
  if (typeof input.term !== "string" || !input.term.trim()) {
    return new Response("term é obrigatório", { status: 400 });
  }
  if (typeof input.mimeType !== "string" || !ALLOWED_MIME_TYPES.has(input.mimeType)) {
    return new Response("o banco só aceita image/jpeg", { status: 400 });
  }
  if (typeof input.dataBase64 !== "string" || !input.dataBase64) {
    return new Response("dataBase64 é obrigatório", { status: 400 });
  }

  let bytes: Uint8Array;
  try {
    const binary = atob(input.dataBase64);
    bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  } catch {
    return new Response("dataBase64 não decodifica", { status: 400 });
  }

  if (bytes.length === 0 || bytes.length > MAX_BANK_IMAGE_BYTES) {
    return new Response(`imagem fora do limite: ${bytes.length} bytes`, { status: 400 });
  }
  // Mesma lição do downloadTo em scripts/lib/photo-sources.mjs: o CDN do
  // Pexels devolve o formato do original quando o parâmetro de formato se
  // perde, e já houve arquivo PNG gravado com extensão .jpg. Aqui isso viraria
  // linha de banco servida com content-type errado.
  if (!(bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)) {
    return new Response("os bytes não são JPEG", { status: 400 });
  }

  const db = getDb();
  const beat = input.beat;
  const filename = bankFilename({ beat, photoId: input.photoId });

  const [existing] = await db
    .select({ id: mediaImages.id })
    .from(mediaImages)
    .where(eq(mediaImages.filename, filename))
    .limit(1);
  if (existing) return Response.json({ ok: true, skipped: "já cadastrada", filename });

  // O teto é checado aqui, não só no runner: o endpoint é o que protege o
  // banco, e quem chama pode estar desatualizado ou rodando duas vezes.
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(mediaImages)
    .where(like(mediaImages.filename, `${LIBRARY_COVER_PREFIX}${beat}-%`));
  if (count >= MAX_BANK_PER_BEAT) {
    return Response.json({ ok: true, skipped: `editoria cheia (${count})`, filename });
  }

  const [admin] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.role, "admin"))
    .limit(1);
  if (!admin) return new Response("Nenhum administrador disponível", { status: 500 });

  await db.insert(mediaImages).values({
    filename,
    mimeType: input.mimeType,
    sizeBytes: bytes.length,
    width: null,
    height: null,
    altText: buildBankAltText({
      photographer: input.photographer.trim(),
      beat,
      term: input.term.trim(),
    }),
    data: input.dataBase64,
    uploadedBy: admin.id,
  });

  return Response.json({ ok: true, saved: filename });
}
