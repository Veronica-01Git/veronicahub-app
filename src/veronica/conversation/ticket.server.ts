const encode = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
const decode = (s: string) =>
  Uint8Array.from(atob(s.replaceAll("-", "+").replaceAll("_", "/")), (c) => c.charCodeAt(0));
async function key(secret: string) {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}
export async function signLiveTicket(liveId: string, secret: string, now = Date.now()) {
  const body = encode(new TextEncoder().encode(JSON.stringify({ liveId, expires: now + 120_000 })));
  const sig = await crypto.subtle.sign("HMAC", await key(secret), new TextEncoder().encode(body));
  return `${body}.${encode(new Uint8Array(sig))}`;
}
export async function verifyLiveTicket(
  ticket: string,
  secret: string,
  now = Date.now(),
): Promise<string | null> {
  try {
    if (ticket.length > 1024) return null;
    const [body, sig, extra] = ticket.split(".");
    if (
      !body ||
      !sig ||
      extra ||
      !(await crypto.subtle.verify(
        "HMAC",
        await key(secret),
        decode(sig),
        new TextEncoder().encode(body),
      ))
    )
      return null;
    const data = JSON.parse(new TextDecoder().decode(decode(body)));
    return typeof data.liveId === "string" &&
      /^\d{1,30}$/.test(data.liveId) &&
      Number.isFinite(data.expires) &&
      data.expires > now &&
      data.expires <= now + 120_000
      ? data.liveId
      : null;
  } catch {
    return null;
  }
}
