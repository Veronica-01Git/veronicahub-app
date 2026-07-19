# Landing Veronica Hub — recriação moderna

Baseado no site veronicahub.com (estética cyber/hacker dark, neon verde + ciano) + imagem enviada (rosto ciborgue meio humano/meio máquina) que vira o **background do hero**.

## Direção visual

- **Paleta dark-first:**
  - `--background`: near-black `oklch(0.14 0.02 240)`
  - `--foreground`: off-white
  - `--primary`: neon green `#22e57d` (CTA + acentos "online")
  - `--accent`: cyan `#5cf0e8` (títulos secundários, glow)
  - Borders translúcidas com `color-mix`, gradient glow verde→ciano
- **Tipografia:**
  - Display: **Archivo Black** (títulos gigantes brutalistas)
  - Body: **JetBrains Mono** (labels/tags tech) + **Inter** (parágrafos)
  - Carregadas via `<link>` no `__root.tsx`

## Hero background (imagem ciborgue) — V1

- Upload da imagem via `lovable-assets` (CDN pointer JSON, não fica binário no repo).
- Aplicada como `background-image` do hero, posicionada à direita/centro.
- **Tratamento holográfico moderno:**
  - Opacidade baixa (~35–45%) sobre fundo near-black
  - `mix-blend-mode: screen` ou `luminosity` para fundir com o preto
  - Filtro: `contrast(1.1) saturate(0.6) hue-rotate(160deg)` puxando pro cyan/verde
  - Gradient overlay: `linear-gradient(90deg, background 0%, transparent 40%, background 100%)` (fade lateral)
  - Gradient overlay vertical: `linear-gradient(180deg, transparent 0%, background 90%)` (fade inferior)
  - Scanlines sutis via `repeating-linear-gradient` translúcido (efeito holográfico)
  - Chromatic aberration leve via `text-shadow` nos títulos por cima
  - Opcional: `filter: drop-shadow` verde para glow holográfico nas bordas

## Estrutura (`src/routes/index.tsx`)

1. **Top bar tech** — barra fina: "VERONICA HUB ATIVO · 11 CURSOS / ACESSO VITALÍCIO / A PARTIR DE R$ 19,90 / CURSOS + VÍDEO AI · UM ÚNICO HUB". Mono uppercase.
2. **Nav** — logo "VERONICA · HUB", links (Cursos, Sobre, Vídeo AI), ícones sociais, CTA "VER CURSOS" (outline neon).
3. **Hero (com background ciborgue holográfico)** — badge "● VERONICA HUB · LABORATÓRIO DIGITAL · 2026", headline "O Segredo Tá no Prompt." (com "Prompt" em outline neon + glow), sub-copy, 2 CTAs. Layout centralizado ou 60/40 com respiro para a imagem aparecer.
4. **Stats row** — 4 cards borda neon: `11+ Cursos`, `100% Online`, `∞ Acesso`, `R$19 A partir de`.
5. **Marquee de cursos** — ticker horizontal infinito com os 11 cursos.
6. **Grid de cursos (11 cards)** — 3/2/1 col responsivo, número `[01]`, título, tag, hover glow.
7. **"Por que Veronica Hub"** — 4 mini-cards: Acesso Vitalício, 100% Online, Foco em Execução, Certificado.
8. **CTA final** — bloco full-width, gradient verde→ciano sutil, botão grande.
9. **Footer** — minimal mono, "Veronica Hub · Laboratório Digital · 2026".

## Tokens & CSS (`src/styles.css`)

- Reescrever `:root` para dark-native.
- Novos tokens: `--color-neon-green`, `--color-neon-cyan`, `--gradient-neon`, `--shadow-glow-green`, `--shadow-glow-cyan`.
- `@theme inline` mapeia para utilitários Tailwind.
- Fontes registradas em `@theme` (`--font-display`, `--font-mono`, `--font-sans`).
- Animações: `pulse-dot`, `marquee`, `glow-pulse`, `scanlines`.

## Metadata (`__root.tsx`)

- Title: `Veronica Hub — Cursos + Vídeo AI · Um único hub`
- Description: "11 cursos diretos ao ponto: dark content, IA, tráfego pago, hacking ético. Acesso vitalício a partir de R$ 19,90."
- og / twitter tags correspondentes.
- `<link>` para Google Fonts (Archivo Black, JetBrains Mono, Inter).

## Assets

- Upload da imagem ciborgue via `lovable-assets create --file /mnt/user-uploads/IMG_4804.jpeg_202607181526.jpeg --filename veronica-cyborg.jpeg > src/assets/veronica-cyborg.jpeg.asset.json`.
- Import do pointer JSON no hero component.

## Fora de escopo desta etapa

- Páginas internas de curso, checkout, área de aluno, auth.
- Seção "Vídeo AI" dedicada e página "Sobre" (só âncoras por ora).

## Nota sobre stack

Projeto Lovable roda **TanStack Start + Tailwind v4** (não Next.js). Os componentes JSX + classes Tailwind portam quase 1:1 para seu Next no VSCode; só o roteamento (`createFileRoute` → `app/page.tsx`) muda.

Confirma pra eu implementar.