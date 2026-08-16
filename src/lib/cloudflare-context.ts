import { AsyncLocalStorage } from "node:async_hooks";

// As duas tentativas anteriores de acessar bindings do Cloudflare (R2, etc.)
// usaram `import { env } from "cloudflare:workers"`, que quebrou o build do
// Workers Builds duas vezes (ver ARQUITETURA-STUDIO.md § 4.5) — o bundler
// desse stack (Vite/nitro) não trata esse specifier como externo.
//
// Aqui usamos outro caminho: `src/server.ts` já recebe `env` direto na
// assinatura do Worker (`fetch(request, env, ctx)`), sem precisar importar
// nada de `cloudflare:*`. O problema é propagar esse `env` até dentro dos
// server functions do TanStack Start, que rodam vários `await`s abaixo na
// pilha. Uma variável de módulo simples não serve — requests concorrentes no
// mesmo isolate podem se misturar. `AsyncLocalStorage` resolve isso: cada
// request roda dentro do seu próprio `.run()`, e `getCloudflareEnv()`
// sempre lê o `env` certo daquela request, mesmo depois de vários `await`s.
//
// Não testado num deploy real ainda — `node:async_hooks` precisa da flag de
// compatibilidade `nodejs_compat` habilitada no Worker `veronicahub-app`
// (Cloudflare → Settings → Runtime). Se a flag não estiver ligada, isso
// falha no build/runtime igual ao `cloudflare:workers` falhou antes — validar
// num deploy de preview antes de generalizar. Ver src/lib/r2-storage.ts.
type CloudflareEnv = Record<string, unknown>;

const storage = new AsyncLocalStorage<CloudflareEnv>();

export function runWithCloudflareEnv<T>(env: CloudflareEnv, fn: () => Promise<T>): Promise<T> {
  return storage.run(env, fn);
}

export function getCloudflareEnv(): CloudflareEnv | undefined {
  return storage.getStore();
}
