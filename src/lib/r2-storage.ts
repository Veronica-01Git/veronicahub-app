import { getCloudflareEnv } from "./cloudflare-context";

// Sobe o arquivo pro bucket R2 próprio (`veronicahub-generations`) — fecha o
// princípio "o arquivo é SEU, servido do SEU storage" da
// ARQUITETURA-STUDIO.md § 1. Lê o binding via AsyncLocalStorage (ver
// src/lib/cloudflare-context.ts), nunca via `import "cloudflare:workers"`
// (isso já quebrou o build duas vezes).
//
// Nome do binding esperado: GENERATIONS_BUCKET, apontando pro bucket
// `veronicahub-generations`. Sem wrangler.toml neste repo, esse binding
// precisa existir nas configurações do Worker `veronicahub-app` no painel
// do Cloudflare (Settings → Bindings → adicionar R2 bucket). Se o binding
// não existir (ou a leitura via AsyncLocalStorage não funcionar nesse
// runtime), upload() retorna ok:false e quem chama cai pro data: URI — a
// geração nunca falha por causa disso.
type R2PutOptions = { httpMetadata?: { contentType?: string } };
type R2Bucket = {
  put: (key: string, value: ArrayBuffer, options?: R2PutOptions) => Promise<unknown>;
};

function getBucket(): R2Bucket | undefined {
  const env = getCloudflareEnv();
  const bucket = env?.GENERATIONS_BUCKET;
  return bucket as R2Bucket | undefined;
}

export async function uploadGenerationToR2(params: {
  key: string;
  bytes: ArrayBuffer;
  contentType: string;
}): Promise<{ ok: true; key: string; publicUrl: string | null } | { ok: false; error: string }> {
  const bucket = getBucket();
  if (!bucket) {
    return { ok: false, error: "binding_missing" };
  }

  try {
    await bucket.put(params.key, params.bytes, {
      httpMetadata: { contentType: params.contentType },
    });
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Falha ao subir pro R2.",
    };
  }

  // Bucket público (r2.dev) ou domínio customizado — configurar depois de
  // confirmar que o bucket NÃO deve ficar aberto por padrão (ver o artefato
  // "Rota da Infraestrutura", seção "Proteção contra invasores": confirmar
  // que o R2 fica privado antes de expor um R2_PUBLIC_BASE_URL de verdade).
  const publicBase = process.env.R2_PUBLIC_BASE_URL;
  const publicUrl = publicBase ? `${publicBase.replace(/\/$/, "")}/${params.key}` : null;

  return { ok: true, key: params.key, publicUrl };
}
