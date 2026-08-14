import { env } from "cloudflare:workers";
import { createId } from "@paralleldrive/cuid2";

// "O arquivo gerado é SEU, servido do SEU storage" (ARQUITETURA-STUDIO.md
// § 1) — baixa o arquivo do provedor uma vez e guarda no R2 do próprio Hub,
// em vez de devolver a URL da Higgsfield direto ao cliente (ela expira e
// não fica sob nosso controle). A key já embute o dono
// (generations/{userId}/{id}) — não precisa de tabela pra saber de quem é
// cada arquivo.
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

export async function storeGeneratedImage(params: {
  userId: string;
  sourceUrl: string;
}): Promise<{ ok: true; dataUrl: string; stored: boolean } | { ok: false; error: string }> {
  const res = await fetch(params.sourceUrl);
  if (!res.ok) {
    return { ok: false, error: `Falha ao baixar a imagem gerada (${res.status}).` };
  }

  const contentType = res.headers.get("content-type") ?? "image/png";
  const bytes = await res.arrayBuffer();
  const dataUrl = `data:${contentType};base64,${arrayBufferToBase64(bytes)}`;

  // Se o binding do R2 não existir (ex.: ainda não configurado no Worker),
  // isso lança — não deixa a geração inteira quebrar por causa disso, o
  // cliente já recebe o dataUrl computado acima; só não fica persistido.
  try {
    const key = `generations/${params.userId}/${createId()}`;
    await env.GENERATIONS_BUCKET.put(key, bytes, { httpMetadata: { contentType } });
    return { ok: true, dataUrl, stored: true };
  } catch (error) {
    console.error(
      "Falha ao guardar geração no R2 (binding ausente ou bucket indisponível):",
      error instanceof Error ? error.message : error,
    );
    return { ok: true, dataUrl, stored: false };
  }
}
