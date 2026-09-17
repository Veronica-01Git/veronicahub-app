// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    // Carimbo do build, usado como parte da chave do cache de borda
    // (src/lib/edge-cache.ts). Sem ele, o HTML guardado antes de um deploy
    // continuaria sendo servido depois, apontando para arquivos de JS que o
    // deploy novo já apagou — página branca por até cinco minutos, a cada
    // publicação. Com ele, todo deploy começa com o cache vazio.
    define: {
      __VERONICA_BUILD_ID__: JSON.stringify(
        process.env.CF_VERSION_ID ?? process.env.GITHUB_SHA ?? String(Date.now()),
      ),
    },
    server: {
      // Túnel público (cloudflared) usado só em dev pra testar o webhook do
      // Mercado Pago, que precisa de uma URL alcançável de fora. Sem isso o
      // Vite recusa qualquer request com Host diferente de localhost.
      allowedHosts: [".trycloudflare.com"],
    },
  },
});
