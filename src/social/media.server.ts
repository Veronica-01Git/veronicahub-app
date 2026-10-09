import { sql } from "drizzle-orm";
import { getDb } from "../lib/db";
import { getRuntimeBinding, getRuntimeSecret } from "../lib/runtime-secret.server";
import {
  MAX_PART_BYTES,
  MAX_SOURCE_BYTES,
  clipKeyFromUrl,
  isClipKey,
  isVideoId,
  parseRange,
  signScope,
  signedClipPath,
  sourceKey,
  verifyScope,
} from "./media-policy";

// Minimal R2 surface used here (the root tsconfig does not load workers-types).
type R2Object = { key: string; size: number };
type R2Body = R2Object & { body: ReadableStream };
type R2Part = { partNumber: number; etag: string };
export type R2Bucket = {
  head(key: string): Promise<R2Object | null>;
  get(
    key: string,
    options?: { range?: { offset: number; length: number } },
  ): Promise<R2Body | null>;
  put(
    key: string,
    value: ReadableStream | null,
    options?: { httpMetadata?: { contentType?: string } },
  ): Promise<R2Object | null>;
  delete(key: string): Promise<void>;
  list(options?: { limit?: number; cursor?: string }): Promise<{
    objects: R2Object[];
    truncated: boolean;
    cursor?: string;
  }>;
  createMultipartUpload(
    key: string,
    options?: { httpMetadata?: { contentType?: string } },
  ): Promise<{ uploadId: string }>;
  resumeMultipartUpload(
    key: string,
    uploadId: string,
  ): {
    uploadPart(partNumber: number, value: ReadableStream): Promise<R2Part>;
    complete(parts: R2Part[]): Promise<R2Object>;
    abort(): Promise<void>;
  };
};

export const mediaBucket = () => getRuntimeBinding<R2Bucket>("SHORTS_MEDIA");
export const sourcesBucket = () => getRuntimeBinding<R2Bucket>("SHORTS_SOURCES");
// Signed links reuse the Hub's existing session secret; no new credential.
const linkSecret = () => getRuntimeSecret("SESSION_SECRET");
const noStore = { "cache-control": "no-store" };

/** Replace private Hub clip URLs with short-lived signed paths for the admin panel. */
export async function signClipUrls<T extends { url: string }>(clips: T[]): Promise<T[]> {
  const secret = await linkSecret();
  return Promise.all(
    clips.map(async (clip) => {
      const key = clipKeyFromUrl(clip.url);
      return key && secret ? { ...clip, url: await signedClipPath(secret, key) } : clip;
    }),
  );
}

/** Video IDs whose original file was uploaded (bucket holds only operator uploads). */
export async function uploadedVideoIds() {
  const bucket = await sourcesBucket();
  if (!bucket) return [];
  const ids: string[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < 5; page++) {
    const listing = await bucket.list({ limit: 1000, cursor });
    for (const o of listing.objects) {
      const id = o.key.replace(/\.mp4$/, "");
      if (isVideoId(id) && o.key.endsWith(".mp4")) ids.push(id);
    }
    if (!listing.truncated) break;
    cursor = listing.cursor;
  }
  return ids;
}

/** Admin-only (caller checks the session): a 2-hour signed link to upload one original. */
export async function sourceUploadLink(sourceId: string) {
  const secret = await linkSecret();
  if (!secret || !(await sourcesBucket()))
    return { ok: false as const, error: "Armazenamento de vídeos indisponível." };
  const row = (
    await getDb().execute(
      sql`SELECT "videoId","rightsConfirmed" FROM "SocialSource" WHERE id=${sourceId} AND status<>'archived'`,
    )
  ).rows[0];
  if (!row || !row.rightsConfirmed || !isVideoId(String(row.videoId)))
    return { ok: false as const, error: "Item indisponível ou sem direito de uso confirmado." };
  const video = String(row.videoId);
  const expires = Math.floor(Date.now() / 1000) + 2 * 60 * 60;
  const sig = await signScope(secret, `upload:${video}`, expires);
  return {
    ok: true as const,
    url: `/api/social/source-upload?video=${video}&exp=${expires}&sig=${sig}`,
    partBytes: 50 * 1024 * 1024,
  };
}

export async function handleMedia(request: Request) {
  if (request.method !== "GET" && request.method !== "HEAD")
    return new Response(null, { status: 405, headers: noStore });
  const url = new URL(request.url);
  const key = url.pathname.slice("/api/social/media/".length);
  const secret = await linkSecret();
  if (!isClipKey(key) || !secret) return new Response(null, { status: 404, headers: noStore });
  const valid = await verifyScope(
    secret,
    `clip:${key}`,
    Number(url.searchParams.get("exp")),
    url.searchParams.get("sig") ?? "",
  );
  if (!valid) return new Response(null, { status: 403, headers: noStore });
  const bucket = await mediaBucket();
  const head = bucket ? await bucket.head(key) : null;
  if (!bucket || !head) return new Response(null, { status: 404, headers: noStore });
  const headers: Record<string, string> = {
    "content-type": "video/mp4",
    "accept-ranges": "bytes",
    "cache-control": "private, max-age=3600",
    "x-content-type-options": "nosniff",
    "content-disposition": `${url.searchParams.get("download") ? "attachment" : "inline"}; filename="short-${key.slice(-5)}"`,
  };
  const range = parseRange(request.headers.get("range"), head.size);
  if (range === "unsatisfiable")
    return new Response(null, {
      status: 416,
      headers: { ...headers, "content-range": `bytes */${head.size}` },
    });
  if (range) {
    headers["content-range"] = `bytes ${range.offset}-${range.end}/${head.size}`;
    headers["content-length"] = String(range.length);
  } else headers["content-length"] = String(head.size);
  if (request.method === "HEAD") return new Response(null, { status: range ? 206 : 200, headers });
  const object = await bucket.get(
    key,
    range ? { range: { offset: range.offset, length: range.length } } : undefined,
  );
  if (!object) return new Response(null, { status: 404, headers: noStore });
  return new Response(object.body, { status: range ? 206 : 200, headers });
}

/** Chunked upload of the operator's original file into the private sources bucket. */
export async function handleSourceUpload(request: Request) {
  const url = new URL(request.url);
  const video = url.searchParams.get("video") ?? "";
  const secret = await linkSecret();
  const bucket = await sourcesBucket();
  if (!secret || !bucket || !isVideoId(video))
    return new Response(null, { status: 404, headers: noStore });
  const valid = await verifyScope(
    secret,
    `upload:${video}`,
    Number(url.searchParams.get("exp")),
    url.searchParams.get("sig") ?? "",
  );
  if (!valid) return new Response(null, { status: 403, headers: noStore });
  const key = sourceKey(video);
  const action = url.searchParams.get("action");
  const uploadId = url.searchParams.get("uploadId") ?? "";
  const fail = (status: number, error: string) =>
    Response.json({ ok: false, error }, { status, headers: noStore });
  try {
    if (action === "create" && request.method === "POST") {
      const upload = await bucket.createMultipartUpload(key, {
        httpMetadata: { contentType: "video/mp4" },
      });
      return Response.json({ ok: true, uploadId: upload.uploadId }, { headers: noStore });
    }
    if (!uploadId || uploadId.length > 1024) return fail(400, "UPLOAD_ID_REQUIRED");
    const upload = bucket.resumeMultipartUpload(key, uploadId);
    if (action === "part" && request.method === "PUT") {
      const part = Number(url.searchParams.get("part"));
      const size = Number(request.headers.get("content-length"));
      if (!Number.isInteger(part) || part < 1 || part > 40) return fail(400, "INVALID_PART");
      if (!request.body || !Number.isFinite(size) || size < 1 || size > MAX_PART_BYTES)
        return fail(413, "INVALID_PART_SIZE");
      const stored = await upload.uploadPart(part, request.body);
      return Response.json({ ok: true, part: stored }, { headers: noStore });
    }
    if (action === "complete" && request.method === "POST") {
      const body = (await request.json()) as { parts?: R2Part[] };
      const parts = body?.parts;
      if (
        !Array.isArray(parts) ||
        !parts.length ||
        parts.length > 40 ||
        parts.some(
          (p, i) => p?.partNumber !== i + 1 || typeof p.etag !== "string" || p.etag.length > 200,
        )
      )
        return fail(400, "INVALID_PARTS");
      const object = await upload.complete(parts);
      if (object.size > MAX_SOURCE_BYTES) {
        await bucket.delete(key);
        return fail(413, "SOURCE_TOO_LARGE");
      }
      return Response.json({ ok: true, size: object.size }, { headers: noStore });
    }
    if (action === "abort" && request.method === "POST") {
      await upload.abort();
      return Response.json({ ok: true }, { headers: noStore });
    }
    return fail(400, "INVALID_ACTION");
  } catch {
    return fail(422, "UPLOAD_FAILED");
  }
}
