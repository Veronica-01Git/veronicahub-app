// Pure rules for private Shorts media: no Worker bindings, so tests run in Node.
// Rendered clips and uploaded originals live in private R2 buckets. Browsers only
// reach them through short-lived HMAC-signed links minted for an admin session.

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const CLIP_KEY = new RegExp(`^shorts/${UUID}/${UUID}/[0-2]\\.mp4$`);
const MEDIA_ROUTE = "https://veronicahub.com/api/social/media";
// validateArtifacts expects `${base}/${sourceId}/${jobId}/${n}.mp4`; the object key is
// `shorts/${sourceId}/${jobId}/${n}.mp4`, so the base carries the `shorts` prefix.
export const HUB_MEDIA_BASE = `${MEDIA_ROUTE}/shorts`;
export const MAX_SOURCE_BYTES = 1024 * 1024 * 1024;
// Workers reject request bodies above 100 MB; parts and clips stay below it.
export const MAX_PART_BYTES = 90 * 1024 * 1024;
export const MIN_PART_BYTES = 5 * 1024 * 1024;
export const MAX_LINK_SECONDS = 24 * 60 * 60;

export function isClipKey(key: string) {
  return CLIP_KEY.test(key);
}
export function isVideoId(value: string) {
  return /^[\w-]{11}$/.test(value);
}
export function sourceKey(videoId: string) {
  if (!isVideoId(videoId)) throw new Error("INVALID_VIDEO_ID");
  return `${videoId}.mp4`;
}
/** Hub-stored clip URL → object key, or null for any other URL. */
export function clipKeyFromUrl(url: string) {
  if (!url.startsWith(`${HUB_MEDIA_BASE}/`)) return null;
  const key = url.slice(MEDIA_ROUTE.length + 1);
  return isClipKey(key) ? key : null;
}

async function hmac(secret: string, message: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(`veronica-shorts-media|${secret}`),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message)),
  );
  return btoa(String.fromCharCode(...mac))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
export async function signScope(secret: string, scope: string, expires: number) {
  return hmac(secret, `${scope}:${expires}`);
}
export async function verifyScope(
  secret: string,
  scope: string,
  expires: number,
  signature: string,
  now = Date.now() / 1000,
) {
  if (!Number.isInteger(expires) || expires < now || expires > now + MAX_LINK_SECONDS) return false;
  if (typeof signature !== "string" || signature.length !== 43) return false;
  const expected = await hmac(secret, `${scope}:${expires}`);
  let diff = 0;
  for (let i = 0; i < expected.length; i++)
    diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  return diff === 0;
}
export async function signedClipPath(secret: string, key: string, seconds = 6 * 60 * 60) {
  if (!isClipKey(key)) throw new Error("INVALID_CLIP_KEY");
  const expires = Math.floor(Date.now() / 1000) + seconds;
  const sig = await signScope(secret, `clip:${key}`, expires);
  return `/api/social/media/${key}?exp=${expires}&sig=${sig}`;
}

/** Single "bytes=a-b" range for video seeking; anything else is served whole. */
export function parseRange(header: string | null, size: number) {
  const m = header ? /^bytes=(\d*)-(\d*)$/.exec(header.trim()) : null;
  if (!m || (!m[1] && !m[2]) || size <= 0) return null;
  let start: number;
  let end: number;
  if (!m[1]) {
    const suffix = Number(m[2]);
    if (!suffix) return null;
    start = Math.max(0, size - suffix);
    end = size - 1;
  } else {
    start = Number(m[1]);
    end = m[2] ? Math.min(Number(m[2]), size - 1) : size - 1;
  }
  if (start > end || start >= size) return "unsatisfiable" as const;
  return { offset: start, length: end - start + 1, end };
}
