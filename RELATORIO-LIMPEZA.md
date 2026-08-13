# Relatório de Limpeza — 05/08/2026

Diagnóstico dos arquivos não utilizados nos projetos **veronicahub-app** e **negocio-da-china-app**.
Nenhum arquivo foi alterado, movido ou apagado. Este relatório é apenas informativo.

Método: varredura da estrutura das duas pastas (ignorando `node_modules` e `.git`) e busca de referências no código-fonte para cada arquivo de mídia. "Sem referência" significa que nenhum arquivo em `src/` menciona o caminho.

---

## veronicahub-app

### Candidatos a remoção (nenhuma referência no código)

**1. `public/images/cinematic/` — 24 arquivos**
Cada imagem existe em .jpg E .webp (formato duplicado), e nenhuma das duas versões é usada:

- cine-01-identidade (1920 e 960, jpg + webp)
- cine-02-energia (1920 e 960, jpg + webp)
- cine-03-interface (1920 e 960, jpg + webp)
- cine-04-percepcao (1920 e 960, jpg + webp)
- cine-05-nucleo (1920 e 960, jpg + webp)
- cine-06-sistema (1920 e 960, jpg + webp)

**2. `public/images/hero/` — 8 arquivos**
Versões da "veronica-skull" em vários tamanhos, nenhuma usada (o hero real usa `/veronica-hero.webp`):

- veronica-skull.png
- veronica-skull-1760.webp
- veronica-skull-1200.png / .webp
- veronica-skull-800.png / .webp
- veronica-skull-500.png / .webp

**3. `public/veronica-depth.webp`** — sem referência.

**4. `assets/` (raiz do projeto) — 14 arquivos de material bruto**
Pasta de trabalho/produção, não é servida pelo site:

- `assets/reference/veronica-skull-reference.mp4` (vídeo bruto de referência)
- `assets/processed/skull-reference-nobg.webm` — **duplicata** do `public/videos/skull-reference-nobg.webm` (este último é o usado)
- `assets/processed/particle-sphere-nobg.png` e `eye-particles-nobg.png` — versões pré-otimização dos .webp usados em `public/images/vfx/`
- Demais arquivos "processed" sem referência: veronicacyborgv2-nobg.png, robot-woman-office-nobg.png, cyborg-face-closeup-nobg.png, neon-head-lightpaint-nobg.png, lightpaint-profile-nobg.png, robotic-hand-nobg.png, guia-nobg.webm, camera-woman-nobg.webm, hologram-hands-nobg.webm

Sugestão: se esse material bruto tem valor (originais de edição), mover para fora do repositório (ex.: uma pasta de backup); se não, apagar.

### Arquivos EM USO (não tocar)

- `public/veronica-hero.webp` e `veronica-hero-sm.webp` (hero principal)
- `public/veronica-cyborg-v2.webp` (usado via asset.json em SiteChrome e blog)
- `public/favicon.ico`
- `public/videos/veronica-guia.mp4` e `skull-reference-nobg.webm`
- `public/images/vfx/` — os 3 arquivos (particle-sphere, eye-particles, veronica-guia-poster)
- `src/assets/og-veronica-hub.jpg` (og-image)
- `src/assets/vfx/*.asset.json` — todos os 6 importados em `lib/courses.ts`
- `src/assets/veronica-cyborg-v2.jpg.asset.json`
- Todo o código em `src/`

---

## negocio-da-china-app

Projeto limpo. Únicos arquivos sem uso:

**`public/` — 5 SVGs de exemplo do Next.js** (boilerplate padrão, nada referencia):

- file.svg
- globe.svg
- next.svg
- vercel.svg
- window.svg

Em uso: `public/uploads/` (imagem de anúncio), todo o `src/`, `prisma/`.

---

## Observações

- Pastas vazias: a verificação não foi possível nesta sessão (limitação de acesso ao shell com WSL); pode-se rodar `find . -type d -empty -not -path "./node_modules/*" -not -path "./.git/*"` no terminal Ubuntu para listá-las.
- Os dois projetos têm git — qualquer remoção de arquivo já commitado é reversível.
- Total estimado de arquivos removíveis: **~52** (47 no veronicahub-app + 5 no negocio-da-china-app).

## Comandos prontos (se decidir limpar depois)

No terminal do Ubuntu (WSL):

```bash
# veronicahub-app — arquivar em vez de deletar (reversível)
cd ~/veronicahub-app
mkdir -p _arquivo
git mv public/images/cinematic _arquivo/cinematic 2>/dev/null || mv public/images/cinematic _arquivo/
git mv public/images/hero _arquivo/hero 2>/dev/null || mv public/images/hero _arquivo/
git mv public/veronica-depth.webp _arquivo/ 2>/dev/null || mv public/veronica-depth.webp _arquivo/
mv assets _arquivo/assets-brutos

# negocio-da-china-app — remover boilerplate
cd ~/negocio-da-china-app
rm public/file.svg public/globe.svg public/next.svg public/vercel.svg public/window.svg
```
