// "O arquivo gerado é SEU, servido do SEU storage" (ARQUITETURA-STUDIO.md
// § 1) — em vez de devolver a URL da Higgsfield direto ao cliente (ela
// expira e não fica sob nosso controle), o servidor baixa o arquivo uma
// vez e devolve um data: URI construído a partir dos mesmos bytes.
//
// Isso NÃO sobe pro R2 ainda — duas tentativas de usar
// `import { env } from "cloudflare:workers"` quebraram o build de preview
// do Workers Builds (ver ARQUITETURA-STUDIO.md § 4.5) e foram revertidas
// sem acesso ao log real pra depurar direito. O bucket `veronicahub-generations`
// já existe; falta descobrir a forma certa de acessar o binding nesse setup
// (Vite/nitro, não wrangler puro) antes de tentar de novo.
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

export async function fetchImageAsDataUrl(
  sourceUrl: string,
): Promise<{ ok: true; dataUrl: string } | { ok: false; error: string }> {
  const res = await fetch(sourceUrl);
  if (!res.ok) {
    return { ok: false, error: `Falha ao baixar a imagem gerada (${res.status}).` };
  }

  const contentType = res.headers.get("content-type") ?? "image/png";
  const bytes = await res.arrayBuffer();

  return { ok: true, dataUrl: `data:${contentType};base64,${arrayBufferToBase64(bytes)}` };
}
