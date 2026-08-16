// "O arquivo gerado é SEU, servido do SEU storage" (ARQUITETURA-STUDIO.md
// § 1) — o servidor baixa o arquivo uma vez e devolve um data: URI
// construído a partir dos mesmos bytes. `persistGeneration` abaixo também
// tenta subir esses bytes pro R2 (ver src/lib/r2-storage.ts); se não der,
// cai pro data: URI só, igual sempre fez.
import { uploadGenerationToR2 } from "./r2-storage";

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

async function downloadAsset(
  sourceUrl: string,
): Promise<{ ok: true; bytes: ArrayBuffer; contentType: string } | { ok: false; error: string }> {
  const res = await fetch(sourceUrl);
  if (!res.ok) {
    return { ok: false, error: `Falha ao baixar o arquivo gerado (${res.status}).` };
  }
  const contentType = res.headers.get("content-type") ?? "image/png";
  const bytes = await res.arrayBuffer();
  return { ok: true, bytes, contentType };
}

export async function fetchImageAsDataUrl(
  sourceUrl: string,
): Promise<{ ok: true; dataUrl: string } | { ok: false; error: string }> {
  const asset = await downloadAsset(sourceUrl);
  if (!asset.ok) return asset;
  return {
    ok: true,
    dataUrl: `data:${asset.contentType};base64,${arrayBufferToBase64(asset.bytes)}`,
  };
}

// Baixa o arquivo gerado uma vez só e tenta persistir no storage próprio
// (R2) além de devolver o data: URI de sempre. Best-effort: se o R2 não
// estiver acessível (binding ainda não configurado, ver src/lib/r2-storage.ts),
// cai pro data: URI só — a geração nunca falha por causa do upload.
export async function persistGeneration(
  sourceUrl: string,
  storageKey: string,
): Promise<{ dataUrl: string | null; publicUrl: string | null; storageKey: string | null }> {
  const asset = await downloadAsset(sourceUrl);
  if (!asset.ok) {
    return { dataUrl: null, publicUrl: null, storageKey: null };
  }

  const dataUrl = `data:${asset.contentType};base64,${arrayBufferToBase64(asset.bytes)}`;

  const upload = await uploadGenerationToR2({
    key: storageKey,
    bytes: asset.bytes,
    contentType: asset.contentType,
  });

  if (!upload.ok) {
    return { dataUrl, publicUrl: null, storageKey: null };
  }

  return { dataUrl, publicUrl: upload.publicUrl, storageKey: upload.key };
}
