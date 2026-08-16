# Auditoria Veronica Hub — Etapa 1 (read-only)

Data: 2026-08-16 · Branch auditada: `claude/veronicahub-audit-edft4t` (= `main` no momento da auditoria)

---

## Stack

| Item | Valor | Evidência |
|---|---|---|
| Framework | TanStack Start (React 19) sobre Vite, deploy via Nitro | `package.json:1,2` (`"name": "tanstack_start_ts"`), `package.json:68` (`"@tanstack/react-start"`), `vite.config.ts:1` |
| Router | TanStack Router, file-based (`src/routes/*`) | `src/router.tsx`, `src/routes/__root.tsx:1-9` |
| Linguagem | TypeScript | `tsconfig.json`, todo `src/**/*.ts(x)` |
| Estilo | Tailwind CSS v4 (via `@tailwindcss/vite`), tokens em `oklch` num "dark cyber design system", + `tw-animate-css` | `src/styles.css:1-8`, `package.json:47-49` |
| Componentes UI | shadcn/ui (Radix primitives + `cva`) em `src/components/ui/*` | `components.json`, listagem `src/components/ui/` (40+ arquivos) |
| Estado | Sem Redux/Zustand. `@tanstack/react-query` para dados assíncronos; resto é `useState`/props | `package.json:39-40` |
| Motion/3D **declarados** | `gsap` (^3.15), `lenis` (^1.3.25), `three` (^0.185) + `@types/three` estão em `dependencies` | `package.json:52,63,73` |
| Motion/3D **usados de fato** | **Nenhum dos três é importado em `src/`.** Efeitos de scroll/parallax/reveal são hand-rolled com `IntersectionObserver` + `requestAnimationFrame` puro; "orbitas holográficas" são SVG animado por CSS/estado React, não Three.js/R3F | `src/hooks/use-reveal.ts:1-31`, `src/hooks/use-parallax.ts:1-47`, `src/components/HoloOrbits.tsx:1-40` (busca por `gsap`/`lenis`/`three` em `src/**/*.ts(x)` não retornou nenhum import) |
| Package manager | Bun (lockfile `bun.lock`, `bunfig.toml`) | raiz do repo |
| Scripts (`package.json:6-11`) | `dev` (`vite dev`), `build`, `build:dev`, `preview`, `lint`, `format` | — |
| Banco/ORM | Drizzle ORM sobre Neon Postgres serverless | `src/lib/schema.ts:1-3`, `package.json:44,54` |
| Plataforma de origem | Projeto conectado ao Lovable.dev (aviso de não reescrever histórico git) | `AGENTS.md:1-8`, dir `.lovable/` |

**Observação:** `.env.example:2-4` menciona "Prisma CLI (migrate)" e `@prisma/adapter-neon`, mas o código real usa Drizzle (`drizzle.config.ts`, `src/lib/schema.ts`, `drizzle/*.sql`) — não há Prisma em `package.json`. Documentação desatualizada em relação ao código.

---

## Rotas

Nenhuma rota usa guard de servidor no roteador (`beforeLoad`/`redirect`) — todas renderizam publicamente no cliente; o controle de acesso real acontece dentro das server functions chamadas por cada página (ex.: `getAdminOverview()` só retorna dado para quem já é admin na sessão). Fonte: busca por `beforeLoad`/`redirect` em `src/routes/**` não encontrou nenhuma ocorrência de guard de rota; confirmado em comentário de `src/routes/admin/index.tsx:9-11`.

| Rota | Arquivo | Classificação | Observação |
|---|---|---|---|
| `/` (Home) | `src/routes/index.tsx` | Pública | Hub principal, lista o ecossistema |
| `/comandos` | `src/routes/comandos.tsx` | Pública | Ex-"Cursos"; grade informativa, CTA "Cadastrar grátis" (`src/routes/comandos.tsx:254`) |
| `/video-ia` | `src/routes/video-ia.tsx` | Pública (geração exige login) | Veronica Studio — geração de imagem/vídeo/voz/avatar |
| `/blog` | `src/routes/blog/index.tsx` | Pública | Veronica Wire |
| `/blog/$slug` | `src/routes/blog/$slug.tsx` | Pública | Matéria individual |
| `/veronica-analytics` | `src/routes/veronica-analytics.tsx` | Pública | Calculadora de engajamento TikTok, sem login |
| `/veronica-curriculo-certo` | `src/routes/veronica-curriculo-certo.tsx` | Pública (geração exige login) | Otimização de currículo ATS |
| `/veronica-curriculo-certo-rh` | `src/routes/veronica-curriculo-certo-rh.tsx` | Pública (ação exige login) | Área RH (triagem de currículos) |
| `/veronica-security` | `src/routes/veronica-security.tsx` | Pública | Triagem gratuita de segurança |
| `/veronica-nautica` | `src/routes/veronica-nautica.tsx` | Pública | "Em estruturação", nota de regulação pendente |
| `/veronica-rede` | `src/routes/veronica-rede.tsx` | Pública | Programa de afiliados "em formação" (lista de espera) |
| `/prompt-packs` | `src/routes/prompt-packs.tsx` | Pública | Venda via WhatsApp (ver Monetização) |
| `/selo-demo` | `src/routes/selo-demo.tsx` | Pública, não listada no menu | Rota temporária de dev, comentário próprio pede remoção após validar (`src/routes/selo-demo.tsx:5-7`) |
| `/admin` | `src/routes/admin/index.tsx` | **Admin** | Não linkada em `ECOSYSTEM_LINKS`; protegida no servidor via `requireAdmin()` (`src/lib/admin-server.ts:19-27`) |
| `/admin/artigos` | `src/routes/admin/artigos.tsx` | **Admin** | Gestão de matérias do blog; `requireAdmin()` em cada server function (`src/routes/admin/artigos.tsx:16`) |

Link externo fora deste app: "Negócio da China" (`negociodachina.veronicahub.com`), listado em `src/components/SiteChrome.tsx:29` como `external: true` — não faz parte deste repositório.

---

## Backend e integrações

| Camada | Como funciona | Evidência |
|---|---|---|
| Runtime servidor | `src/server.ts` intercepta `fetch`, trata `/api/mercadopago-webhook` manualmente antes de delegar ao handler do TanStack Start | `src/server.ts:47-70` |
| Padrão de API | **Server Functions** do TanStack Start (`createServerFn`), chamadas diretamente do componente React — não há pasta `api/` tradicional além do webhook do Mercado Pago | `src/lib/wallet-server.ts:1,24`, `src/lib/auth-server.ts:1,58` |
| Auth | Login por código OTP enviado por e-mail (Resend), sem senha. Sessão "selada" nativa do TanStack Start | `src/lib/auth-server.ts:26-45,58-` , `src/lib/session.ts`, `.env.example:8-10` |
| Admin | Lista de e-mails em `ADMIN_EMAILS`; primeiro acesso promove a `role: admin` no banco | `src/lib/admin-server.ts:9-27` |
| Banco | Neon Postgres via `@neondatabase/serverless` + Drizzle. 5 tabelas: `User`, `EmailOtp`, `WalletTopUp`, `LedgerEntry`, `Article` (3 migrations aplicadas) | `src/lib/schema.ts:12-124`, `drizzle/meta/_journal.json:1-24` |
| Pagamento | Mercado Pago (Checkout Pro), preferência de depósito de saldo genérico ("wallet top-up"), confirmado só via webhook assinado | `src/lib/mercadopago.ts:1-84`, `src/lib/mercadopago-webhook.ts`, `.env.example:16-18` |
| IA (chat assistente) | Anthropic API, modelo `claude-haiku-4-5-20251001`, no drawer da Veronica (Studio/Currículo) | `src/lib/veronica-server.ts:9,44-` |
| IA (redação do blog) | Anthropic API, modelo `claude-sonnet-5`, rascunhos gerados sempre como `draft`, publicação manual por admin | `src/lib/articles-server.ts:13-14`, `src/lib/schema.ts:95-99` |
| Geração de imagem real | Higgsfield API (`platform.higgsfield.ai`), modelo Nano Banana Pro (`text2image/soul`) — fetch cru, sem o SDK oficial (bug documentado no 422) | `src/lib/higgsfield.ts:1,17-19,29-37` |
| Rate limit | Existe módulo `checkGenerationRateLimit` chamado nas gerações pagas; sem infra Redis dedicada (comentário aponta ausência) | `src/lib/wallet-server.ts:106`, `src/lib/veronica-server.ts:6-7` |
| E-mail | Resend, domínio `veronicahub.com` | `.env.example:11-13`, `src/lib/auth-server.ts:26-45` |
| Storage de gerações | `src/lib/generations-storage.ts` (download da imagem gerada para data URL) — não investigado a fundo nesta rodada | `src/lib/wallet-server.ts:9,140-` |
| Frontend → backend | Componentes chamam as server functions diretamente como funções assíncronas (RPC do TanStack Start), sem `fetch` manual a endpoints REST | `src/routes/video-ia.tsx` (chamadas a `generateNanoBanana`, `getWallet` etc.) |

---

## Assets

Nenhum arquivo `.glb`/`.gltf`/`.obj`/`.mtl` encontrado em `public/`, `assets/` ou `src/assets/` — **não há modelo 3D utilizável no repositório**. `@types/three`/`three` estão instalados mas sem uso nem asset 3D correspondente.

Vídeo de referência de "caveira" (`assets/reference/veronica-skull-reference.mp4`, 18MB) fica **fora** de `public/`, ou seja, não é servido pelo site — é material de referência de produção, não asset web ativo.

| Caminho | Peso | Observação |
|---|---|---|
| `assets/reference/veronica-skull-reference.mp4` | 18 MB | Fora de `public/` — não servido; provável referência de motion design |
| `public/images/hero/veronica-skull.png` | 4,5 MB | Master do hero, sem responsive suffix |
| `public/images/hero/veronica-skull-1200.png` | 2,7 MB | Fallback PNG (sem WebP seria pesado) |
| `public/images/hero/veronica-skull-1760.webp` | 943 KB | Maior variante WebP do hero |
| `public/images/hero/veronica-skull-1200.webp` | 698 KB | — |
| `public/images/hero/veronica-skull-800.png` / `.webp` | 1,3 MB / 365 KB | — |
| `public/images/hero/veronica-skull-500.png` / `.webp` | 558 KB / 167 KB | — |
| `public/videos/veronica-guia.mp4` | 821 KB | Servido, usado como pôster/vídeo (`public/images/vfx/veronica-guia-poster.webp` é o poster) |
| `public/videos/skull-reference-nobg.webm` | 756 KB | Vídeo com fundo removido, provável uso decorativo |
| `public/images/cinematic/cine-0{1..6}-*-{960,1920}.{jpg,webp}` | 24 KB – 517 KB cada | 6 cenas cinematográficas, cada uma em 2 resoluções × 2 formatos (24 arquivos) |
| `public/images/ecosystem/*.webp` (6 arquivos) | 75 – 145 KB | Ícones/capas dos produtos do ecossistema |
| `public/images/security/*.webp` (3 arquivos) | 93 – 145 KB | — |
| `public/veronica-cyborg-v2.webp`, `public/veronica-hero.webp`, `public/veronica-hero-sm.webp`, `public/veronica-depth.webp` | 9 KB – 235 KB | Assets legados na raiz de `public/` (fora de `images/`) — possível duplicidade com `public/images/home/veronica-cyborg-face.webp` |
| Total `public/` | ~18 MB | `du -sh public` |
| Total `assets/` (fora de public) | ~18 MB | Dominado pelo vídeo de referência de 18MB |

Dimensões em pixel não foram verificadas (sem `identify`/PIL disponível no ambiente); os sufixos numéricos nos nomes de arquivo (`-960`, `-1200`, `-1760`, `-1920`, `-500`, `-800`) são a própria convenção de largura usada no projeto.

Não encontrado: CDN externa configurada para assets (tudo servido de `public/` local).

---

## Monetização atual

| Produto | Modelo | Preço (servidor, fonte da verdade) | Evidência |
|---|---|---|---|
| Carteira/créditos | Saldo em `balanceCents` por usuário, compartilhado entre Studio e Currículo-Certo; depósito livre (não por pacote fixo) via Mercado Pago Checkout Pro | Depósito máx. R$2.000/vez | `src/lib/wallet-server.ts:13-19,38-46`, `src/lib/schema.ts:8-23` |
| Créditos grátis | Todo usuário novo ganha `freeVideoCredits: 1` e `freeImageCredits: 2`, permanentes por e-mail (não resetam limpando navegador) | — | `src/lib/schema.ts:14-20` |
| Veronica Studio — imagem (Nano Banana Pro) | **Único formato com geração real integrada hoje.** Débito atômico (crédito grátis primeiro, depois saldo), com estorno automático se a API falhar ou bloquear por NSFW | R$ 4,90 (`NANO_BANANA_PRICE_CENTS = 490`) | `src/lib/wallet-server.ts:20,94-159` |
| Veronica Studio — vídeo/voz/avatar | **Simulados** no cliente (não geram de verdade); UI mostra preço mas não há chamada de API real por trás | Preços exibidos na UI (não cobrados de fato) | `src/routes/video-ia.tsx:237,289,308` (marcados "· simulado" no código) |
| Currículo-Certo — geração de currículo | Geração é local/determinística (sem chamada externa), débito real e autoritativo no servidor | R$ 9,90 (`CURRICULO_GENERATION_PRICE_CENTS = 990`) | `src/lib/wallet-server.ts:22` |
| Currículo-Certo RH — triagem por currículo | Cobrança por currículo triado, limite de 50 por lote | R$ 1,90 (`CURRICULO_RH_SCREEN_PRICE_CENTS = 190`), máx. 50/lote | `src/lib/wallet-server.ts:23-24` |
| Prompt Packs | **Não integrado ao carrinho/Mercado Pago** — venda manual: botão monta uma mensagem de WhatsApp pré-formatada com nome e preço do pack, PDF é enviado na conversa após confirmação | R$ 19,90 – R$ 29,90 por pack (4 packs) | `src/routes/prompt-packs.tsx:34,46,56,66,76,120`, FAQ confirma entrega manual (`src/routes/prompt-packs.tsx:111`) |
| Comandos ("Cursos") | Gratuito, CTA de cadastro — nenhuma cobrança encontrada na página | Grátis | `src/routes/comandos.tsx:230,254` |
| Veronica Analytics | Calculadora gratuita, sem paywall nem login | Grátis | `src/routes/veronica-analytics.tsx` (sem chamada a wallet/auth) |
| Veronica Security | Descrita como "triagem gratuita" + "diagnóstico completo sob demanda" | Grátis (triagem); diagnóstico completo sem preço/integração encontrada nesta rodada | `src/routes/index.tsx:75-76` |
| Veronica Náutica / Veronica Rede | Sem preço no código — "em estruturação" / lista de espera | — | `src/routes/veronica-nautica.tsx`, `src/routes/veronica-rede.tsx:73-75` |

`PRECOS-STUDIO.md` (raiz do repo, datado 05/08/2026) é um **documento de planejamento/recálculo de preços** com tabela de custos de API e margens propostas para vídeo (Seedance, Kling, Veo, Sora) — descreve preços-alvo e correções a implementar, não o estado atual do código. Ele também referencia infraestrutura Cloudflare (Workers/R2/D1) que não corresponde à stack real (Neon + Drizzle) — tratar como plano, não como fato do sistema.

---

## Home atual

Rota `/` em `src/routes/index.tsx` (1075 linhas). Seções identificadas por `<section>` (ordem no arquivo):

1. Hero (`src/routes/index.tsx:310`) — com `TerminalBoot`, `VeronicaHero`, JSON-LD (`application/ld+json`) já embutido no `head()` da rota (`src/routes/index.tsx:118-`)
2. Faixa de prova social (`:388`)
3. Bloco secundário (`:404`)
4. Bloco de destaque (`:459`)
5. `#comandos` — grade de cursos (`:514`), lê de `src/lib/courses.ts` (11 cursos fixos, todos com `lessons`/`hours`/`level` mockados no código, não vindos de banco)
6. `#recomendados` (`:582`)
7-11. Mais 5 `<section>` sem id nomeado (`:620, 648, 765, 845, 870`) — inclui grade "O Ecossistema" (array `ecosystem`, `src/routes/index.tsx:44-98`) e FAQ (`FaqItem`, `:1051`)

Componentes de apoio próprios do arquivo: `ProofBackdrop` (`:966`), `EcosystemBackdrop` (`:1001`), `HeroEyeAccent` (`:1030`).

O array `ecosystem` (`src/routes/index.tsx:44-98`) lista 6 produtos, todos `ready: true`; Veronica Náutica traz `note: "Em estruturação"`. Este array é **duplicado** conceitualmente do `ECOSYSTEM_LINKS` em `src/components/SiteChrome.tsx:24-31` (fonte compartilhada entre header e home, mas com campos ligeiramente diferentes — `ecosystem` tem `desc`/`ready` mais descritivos, `ECOSYSTEM_LINKS` é mais enxuto para o dropdown).

Não foi possível testar renderização/funcionamento real no navegador nesta rodada (auditoria estritamente read-only, sem `dev`/`build`).

---

## Pontos fortes

- **Disciplina de segurança financeira**: todo débito de saldo é atômico e condicional no SQL (`WHERE ... AND balance >= preço`, só "ganha" se afetar 1 linha), com estorno automático em falha — protege contra duplo-clique/corrida e cobrança indevida (`src/lib/wallet-server.ts:94-159`).
- **Preço nunca confiado ao cliente**: preços vivem só em constantes do servidor (`NANO_BANANA_PRICE_CENTS`, `CURRICULO_GENERATION_PRICE_CENTS` etc.), comentado explicitamente como decisão de design (`src/lib/wallet-server.ts:16-19`).
- **`SiteChrome.tsx`** centraliza header/footer/menu do ecossistema/`AuthWidget` como fonte única reutilizada em quase todas as rotas — bom padrão a preservar.
- **Sistema de tokens de design** consistente via Tailwind v4 `@theme inline` + variáveis `oklch` (`src/styles.css`), nomeação clara (`--color-neon-green`, `--color-surface` etc.).
- **Hooks de motion leves e acessíveis** (`useReveal`, `useParallax`, `useCountUp`): usam `IntersectionObserver`/`rAF` puro, sem libs pesadas, e respeitam `prefers-reduced-motion` (`src/hooks/use-parallax.ts:14`, `src/hooks/use-reveal.ts:33-40`).
- **Blog com IA controlada**: rascunho por IA nunca publica sozinho, sempre entra como `draft` e exige revisão de admin (`src/lib/schema.ts:95-99`).
- **Componentes de assets responsivos com convenção clara de sufixo de largura** (`-500/-800/-1200/-1760`, WebP + fallback JPG/PNG).

## Problemas

- **GSAP, Lenis e Three.js instalados e não usados** em nenhum lugar de `src/` — peso morto no bundle/lockfile ou indício de trabalho de motion/3D planejado e nunca integrado.
- **Nenhum modelo 3D (`.glb`/`.gltf`/`.obj`) no repositório** apesar de `three`/`@types/three` estarem instalados — qualquer expectativa de "hero 3D" hoje é só imagem estática + SVG.
- **`.env.example` cita Prisma/`@prisma/adapter-neon`**, mas o projeto usa Drizzle — documentação de setup desatualizada, risco de confundir onboarding.
- **`PRECOS-STUDIO.md` referencia infraestrutura Cloudflare (Workers/R2/D1)** que não existe no código (é Neon Postgres) — é um documento de planejamento e não deve ser lido como estado atual.
- **Vídeo/voz/avatar do Veronica Studio são só prévia simulada e gratuita** — confirmado que `handleGenerate()` desvia para `performSimulatedGeneration()` sem nenhum débito quando `!isRealPath`, e o botão já é rotulado "Testar prévia grátis" (`src/routes/video-ia.tsx:694-696,710-711`). Não há cobrança indevida, mas a UI exibe preços (`priceFor(format)`) para formatos que não geram nada real — risco de expectativa quebrada com o usuário.
- **Prompt Packs não tem checkout real** — depende de o usuário mandar WhatsApp manualmente e o time enviar o PDF à mão; não escala e não tem registro de venda no banco.
- **Vídeo de referência de 18MB (`assets/reference/veronica-skull-reference.mp4`)** solto na raiz do repo fora de `public/` — infla o clone/repo sem servir a nenhuma página.
- **`public/veronica-*.webp` na raiz** duplicam conceitualmente imagens já organizadas em `public/images/home/` e `public/images/hero/` — possível resíduo de reorganização incompleta.
- **`/selo-demo`** é uma rota de dev deixada em produção (comentário próprio pede remoção após validação) — superfície pública desnecessária.
- **Sem rate limit robusto**: comentário no próprio código admite "sem rate-limit de verdade" para o chat da Veronica, por falta de infra Redis (`src/lib/veronica-server.ts:6-7`).

## Oportunidades

- Sistema de créditos e carteira já é sólido e compartilhado — dá para plugar novos produtos pagos (Analytics, Security "diagnóstico completo") na mesma trilha de `ledgerEntries`/`walletTopUps` sem reinventar cobrança.
- `ECOSYSTEM_LINKS`/`ecosystem` já funcionam como registro único do catálogo de produtos — um único lugar para adicionar/remover itens do menu e da home.
- JSON-LD já presente na Home é uma base para expandir SEO estruturado (ex.: `Product`/`Offer` schema nas páginas de produto) sem precisar montar do zero.
- A convenção de imagem responsiva (`-500/-800/-1200/-1760` + WebP) já existe e pode ser replicada para outras seções que hoje usam só um tamanho fixo.

---

*Auditoria read-only. Nenhum arquivo além deste foi criado, editado ou removido. Nenhum build/deploy/migration/seed/install foi executado.*
