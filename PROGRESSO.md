## Fase 3 — Formações (2026-09-11, local)

- Auditoria partiu de `origin/main` em `bf8568c`; árvore estava limpa. A
  restauração visual aprovada da Home está em `ab353b0`, registrada como
  publicada por `53cffd8`, e foi preservada.
- `/comandos` mantém os 11 cards e agora usa o catálogo canônico para título,
  descrição, nível, duração transparente, resultado esperado, status e CTA.
- Removidas contagens e promessas não comprovadas de aulas/horas. As formações
  seguem como "Em produção" e não recebem link falso; a legenda já distingue
  "Disponível", "Em produção" e "Em breve".
- Aula Zero permanece como a entrada gratuita disponível em `/aula-zero`.
- Cada item reserva `futurePath: /formacoes/$slug`, mas nenhuma página individual
  vazia foi criada. Home, Studio e Security continuam consumindo a mesma fonte.
- Backend, autenticação, pagamentos, banco, imagem da Veronica e design amplo da
  Home não foram alterados. Nenhuma dependência nova foi adicionada.
- Validação: 5 testes, typecheck e build Cloudflare aprovados. A instalação do
  navegador para QA visual falhou por certificado `UnknownIssuer`; revisão de
  conteúdo, CTAs e classes responsivas concluída estaticamente. Sem push/deploy.

## Publicação da Fase 1 — 2026-09-11

- Publicado em produção pelo commit remoto `91c4cdd` na branch `main`.
- Cloudflare propagou a nova versão em `https://veronicahub.com`.
- Verificação pública concluída em Home, Formações, Prompt Packs, Analytics,
  Currículo-Certo, Área RH, Studio e Wire; todas carregaram com os títulos e
  conteúdos esperados, sem erros da aplicação no console.
- O Wire carregou normalmente com o banco do ambiente de produção.
- Typecheck, build e cinco testes de arquitetura passaram antes da publicação.

# Progresso — redesign visual Veronica Hub

Arquivo de retomada rápida. Se você abrir uma sessão nova do Claude Code
(ou outro agente) neste diretório, leia isto primeiro.

## Retomada da validação — 2026-09-10

- Verificação HTTP local: Home, Formações, Prompt Packs, Analytics,
  Currículo-Certo, Área RH e Studio retornaram 200 com títulos específicos.
- Wire retornou 500 no ambiente local; DATABASE_URL não está configurada.
  Não foram alteradas credenciais, integrações ou tratamento do backend.
- Após autorização explícita para ferramentas de teste, o download do Chrome
  falhou por certificado não reconhecido no instalador agent-browser; o
  download oficial do Playwright esgotou o tempo de conexão. QA visual
  desktop/mobile permanece pendente por limitação do ambiente.
- Nenhum push/deploy realizado. Autorização para publicar após validação mantida.

## Validação da Fase 1 — atualização em 2026-09-10

- Dependências existentes instaladas com Bun e `--frozen-lockfile`, após nova
  autorização do usuário; package.json e bun.lock não alterados nesta retomada.
- `npm run typecheck`: passou. `npm run build`: passou (saída Cloudflare/Nitro).
- Os cinco testes de arquitetura passaram; sem alterações de backend.
- QA visual desktop/mobile ainda pendente: instalação adicional de agent-browser
  rejeitada pela revisão automática; Playwright disponível sem executável de
  navegador, e navegador remoto bloqueia localhost (`ERR_BLOCKED_BY_CLIENT`).
- Publicação autorizada pelo usuário quando a validação estiver completa.
  Nenhum push ou deploy realizado nesta retomada.

## Fase 1 — fundação da arquitetura (2026-09-10)

Implementação local na branch `feat/architecture-foundation-phase1`, baseada em
`b7e1e1f`. Sem push e sem deploy. Validação completa ainda pendente.

- Registro canônico em `src/lib/ecosystem.ts`: produtos, status editoriais,
  categorias, seis intenções e destinos. Adaptadores preservam os consumidores
  existentes; Universe mantém a constelação e lista todas as áreas no diretório.
- Header/footer compartilhados na Home e páginas públicas. Desktop/mobile usam
  as mesmas fontes. Sem Admin público; redes no rodapé. Currículo/RH mantêm os
  próprios controles de sessão/carteira, com navegação global compartilhada.
- Formações mantém `/comandos`; catálogo com slug, status, CTA, objetivo e
  disponibilidade. As 11 formações sem entrega identificada ficam em produção.
  Nenhum card simula acesso pela Home. Aula Zero permanece acessível.
- Termos/privacidade e newsletter sem destino foram retirados temporariamente.
  Contato usa o e-mail existente; comunidade sem grupo real virou acesso à escola.
- Analytics identifica dados demonstrativos; Wire não promete publicação por
  hora/ao vivo; removida alegação estática de mais vendido. Metadados globais
  posicionam a marca como Escola de Inteligência Artificial.
- Backend, autenticação, APIs, banco, pagamentos e imagem otimizada da Hero
  não foram alterados. AuthWidget comparado com a base: idêntico.
- Verificação: 5 testes de contratos/rotas passaram com `npm test` (Node 24),
  parse dos 21 arquivos TS/TSX alterados passou; `git diff --check` limpo.
- `npm run typecheck` bloqueado: `tsc: not found`; `npm run build` bloqueado:
  `vite: not found`. Dependências ausentes e nenhuma instalada. Scripts de
  typecheck/test foram adicionados sem novas dependências.
- Verificação real em navegador desktop/mobile não executada: aplicação não
  pode ser iniciada sem suas dependências. Revisão estática não substitui essa
  etapa. Reexecutar tipos/build e QA das rotas antes de considerar a fase validada.
- Pendências editoriais: destinos de entrega das formações, documentos legais,
  newsletter/comunidade reais e comprovação das integrações de Analytics/Wire.

## Onde estamos

- Repositório: `~/veronicahub-app` (WSL), GitHub `Veronica-01Git/veronicahub-app`.
- **JÁ PUBLICADO:** `main`/`origin/main` está no commit `ee3ab65`
  (PR #25 — paginação por editoria + arquivamento da home do Veronica
  Wire, ver seção "Veronica Wire" abaixo) — deploy automático do
  Cloudflare disparou a partir desse push em `main`.
  (O commit `a24d7c9`/PR #7 mencionado logo abaixo é histórico — muita
  coisa aconteceu desde então, tudo documentado na seção Veronica Wire.)
- **Worker de produção correto: `veronicahub-app`** (não
  `veronica-01git-veronicahub-app`). A conta Cloudflare tem os dois —
  `veronica-01git-veronicahub-app` existe mas NÃO é o que serve o
  domínio (ficou parado no commit `99b006c`, desatualizado). Se for usar
  `wrangler secret put` ou qualquer comando `--name`, usar
  `veronicahub-app`.
- **⚠️ CRÍTICO — o deploy automático do Cloudflare dispara a CADA PUSH
  em QUALQUER branch conectada, não só em `main`.** Confirmado na
  prática: dar `git push` numa branch de feature (`claude/…`) já gerou
  um "Deployment successful!" direto no ambiente `production` do
  Worker (comentário do bot `cloudflare-workers-and-pages` no PR,
  apontando pra `.../veronicahub-app/production/builds/...`). **Não
  existe deploy de preview separado nesse projeto** — todo push vira
  produção na hora, esteja em `main` ou não. Isso já causou um susto
  real: uma mudança de schema (coluna `role` nova) foi publicada antes
  da migration rodar no banco, o que quebraria login em todo o Hub até
  a migration ser aplicada (resolvido rápido, mas foi por pouco).
  **Regra prática daqui pra frente: rodar qualquer migration de banco
  ANTES de dar `git push` em qualquer branch — não só antes de mesclar
  em `main`.**
- Branch antiga de trabalho `claude/veronicahub-redesign-cont-k92gt4`
  (redesign visual — seções abaixo) — status atual não confirmado nesta
  atualização, não tocada na sessão do Veronica Wire.
- Branches de trabalho do Veronica Wire usadas nesta sessão
  (`claude/wire-evolucao`, `claude/wire-pagination`) já tiveram seus PRs
  mesclados — nenhuma tem mudança pendente. Pra continuar o Wire, criar
  branch nova a partir de `origin/main` (padrão já estabelecido: sempre
  `git fetch origin main && git checkout -B <nome> origin/main` antes de
  começar, nunca reaproveitar uma branch cujo PR já foi mesclado por
  squash — o histórico diverge e o próximo PR mostra diff duplicado).
- Repositório irmão `~/negocio-da-china-app` (China Exchange) não foi
  tocado.

## O que já foi feito

### Veronica Wire — pipeline de publicação automática (setembro 2026)

O Wire (`/blog`) publica matérias sozinho, sem revisão humana: um cron do
GitHub Actions (`.github/workflows/generate-article.yml`) roda a cada 5h,
gera uma matéria via Claude com `web_search` pra uma das 5 editorias (IA,
clima, economia, geopolítica, mercado tecnológico) e publica direto no
Neon. Todo esse pipeline (e só ele) foi construído/evoluído nesta sessão,
em PRs sequenciais — todos já mesclados em `main` exceto o que está listado
em "Sessão em andamento":

- **PR #14** — infraestrutura pra servir imagem de capa por matéria
  (`coverImageUrl`/`coverImageData`/`coverImageMimeType` no schema).
- **PR #17** — capa automática via card HTML/CSS tipográfico (Playwright +
  Chromium, renderizado no próprio Action — Cloudflare Workers não
  escrevem em `/public`), sem custo por imagem.
- **PR #18** — corrigiu falha silenciosa do cron: `DRAFT_MAX_TOKENS`
  (2200) cortava a resposta da IA no meio quando `web_search` consumia
  parte do budget. Subiu pra 4096 + uma retentativa automática só quando o
  formato vem quebrado.
- **PR #19** — silhueta humana SVG no card tipográfico (item visual,
  substituindo a ideia inicial de gerar foto real via Higgsfield, que tem
  custo recorrente por imagem).
- **PR #20** — banco de imagens admin (`/admin/imagens`): upload manual,
  galeria, base64 no Postgres (mesmo caminho de `coverImageData` — nunca
  R2, já quebrou o build desse stack antes).
- **PR #21** — 5 correções pontuais: dedup de matéria duplicada (checagem
  por janela de `CYCLE_HOURS`, não por URL), masthead com data/hora real
  desde o primeiro render (fuso `America/Sao_Paulo` fixo), atribuição
  "Fonte: X ›" derivada de `sourceUrls[0]`, copy da seção final reescrita
  de "Redação global" pra "Monitoramento global" (honesta sobre ser
  automação, não correspondente local), placeholder de capa mostrando o
  nome da editoria em vez de vazio.
- **PR #22** — capa fotorrealista de verdade via **Pexels** (principal) e
  **Pixabay** (fallback): a IA já devolve `fotoTermos` (2-3 termos em
  inglês) na mesma chamada que escreve a matéria; `scripts/fetch-cover-photo.mjs`
  busca no GitHub Action (não no Worker) e cai pro card tipográfico só se
  nada for encontrado. Testado ao vivo com sucesso (foto real do Pexels
  publicada). `PEXELS_API_KEY` já cadastrada como secret do Actions;
  `PIXABAY_API_KEY` ainda não.
- **PR #23** (brief "Veronica Wire — evolução", item A de 3) — piso de
  qualidade antes de publicar (mínimo 2 `sourceUrls`, corpo mínimo 700
  caracteres), dedup por similaridade de manchete (últimas 40 publicações,
  todas editorias, _overlap coefficient_ com limiar 0.35 calibrado à mão —
  ver comentário em `findSimilarHeadline` em `articles-server.ts`), prompt
  ajustado pra matérias mais curtas (900-1400 caracteres), endpoint
  `?dryRun=1` em `/api/cron/generate-article` pra simular sem publicar, e
  `scripts/fetch-fallback-covers.mjs` + workflow manual
  `fetch-fallback-covers.yml` pra popular uma foto genérica fixa por
  editoria (nível 3 do fallback).
- **PR #24** — pedido direto no chat, fora do brief formal: segundos no
  relógio do masthead (`formatMasthead` ganhou `second: "2-digit"`),
  removido o overlay "holográfico" global (`HudScanner`/`holo-beam` de
  `HoloOrbits.tsx`) da rota `/blog` (adicionado `/blog` em
  `LIGHT_THEME_ROUTES`, mecanismo de opt-out por rota que já existia),
  link do menu "Blog" → "Veronica Wire" (`SiteChrome.tsx`, desktop e
  mobile), e novo componente `src/components/blog/WirePulseGlobe.tsx`
  (SVG+SMIL, sem three.js — a lib está no `package.json` mas não é usada
  em nenhuma rota do app, adicionar custaria ~1.8MB de bundle) simulando
  um globo girando com 4 pontos pulsando — um por desk (São Paulo/SF/
  Pequim/Londres) — no masthead ao lado do relógio.
- **`fetch-fallback-covers.yml` já rodado** (workflow_dispatch manual,
  commit direto em `main`: `816c53b`) — as 5 fotos genéricas por editoria
  já existem em `public/images/blog-covers/_fallback/<beat>.jpg`.
- **PR #25** (brief "evolução", item C de 3) — paginação real por cursor
  (não offset) numa rota nova `/blog/editoria/$beat` (não `/blog/$beat`:
  dois segmentos dinâmicos irmãos no mesmo nível seriam ambíguos pro
  roteador do TanStack Router), "Carregar mais" em blocos de 15
  (`getArticlesByBeat` em `articles-server.ts`); home (`getPublishedArticles`)
  trocou o `.limit(60)` sem filtro de tempo por últimas 24h + bloco "Esta
  semana" (24h-7d, teto de 20). Nota deixada no PR: no volume atual (cron
  ainda a cada 5h, uma editoria por vez — item B abaixo), é normal a home
  mostrar só 4 das 5 seções de editoria às vezes, já que o round-robin
  completo leva ~25h — se resolve sozinho quando o item B aumentar a
  frequência.

**⚠️ Cron pausado (03/set/2026) — sem saldo na API da Anthropic.** A partir
da execução #20 (02/set ~14h) todas as rodadas do cron passaram a falhar
com `"Your credit balance is too low to access the Anthropic API"` — não é
bug de código (confirmado: a run #19, mesmo commit de duas que já
falhavam depois, tinha rodado com sucesso poucas horas antes). Usuário sem
orçamento pra recarregar créditos agora. Ação tomada: `schedule` comentado
em `generate-article.yml` (`workflow_dispatch` continua disponível pra
disparo manual) — nenhuma matéria nova é publicada automaticamente até
isso ser resolvido.

**Gemini abandonado — cota bloqueada mesmo com faturamento.** Anthropic
sem crédito, Gemini foi a primeira tentativa de tier grátis. Histórico
completo de tentativas, cada uma corrigindo o erro anterior mas sempre
esbarrando em cota:

1. `gemini-flash-latest` (alias) → `429 RESOURCE_EXHAUSTED`.
2. `gemini-2.5-flash` (nome fixo) → `404` ("no longer available to new
   users", API recomendou `gemini-3.6-flash`).
3. `gemini-3.6-flash` → `429` de novo, mesmo com cota `0/5` (nada usado)
   no painel "Limite de taxa" do AI Studio.
4. Testado sem a tool `googleSearch` (hipótese: grounding com cota
   separada) → mesmo `429`. Hipótese descartada.
5. Faturamento configurado no AI Studio com um cartão virtual (C6/
   InfinityPay) com R$6,95 de saldo → `429` **de novo**, sexta falha
   seguida. Causa real: processadora do Google rejeita muitos cartões
   virtuais/pré-pagos de bancos digitais brasileiros pra verificação,
   independente de ter saldo — não é sobre cobrar, é a pré-autorização
   de verificação que falha nesse tipo de cartão.

**Migrado pro Groq — funcionando, sem cartão.** `attemptDraft()` em
`articles-server.ts` e `veronicaChat` em `veronica-server.ts` chamam
`groq-sdk` (API compatível com formato OpenAI — `messages` com `role`/
`content`, sem remapeamento de role como o Gemini exigia). Tier grátis
do Groq **não pede cartão** — confirmado antes de migrar (pesquisa via
WebSearch, já que não dá pra testar rede daqui do sandbox).

- **Wire**: modelo `groq/compound` (não um modelo comum) — tem busca na
  web nativa embutida (via Tavily), único equivalente real ao
  `web_search` da Anthropic/`googleSearch` do Gemini que sobrevive sem
  cartão. Cota grátis: 30 RPM / 250 RPD — bem acima do nosso volume
  (~5 chamadas/dia).
- **Chat da Veronica**: modelo `qwen/qwen3.6-27b` (o mais forte do Groq,
  segundo a doc) — não precisa buscar na web, só responder.
- `@google/genai` removido do `package.json` (não usado em lugar nenhum
  mais) — bônus: `groq-sdk` bundla ~64kB no Worker vs ~844kB do
  `@google/genai`.
- `ANTHROPIC_API_KEY` continua só em `scripts/reprocess-covers.mjs`
  (rodado local).

Falta: usuário gerar `GROQ_API_KEY` grátis em console.groq.com/keys e
configurar no Worker (`wrangler secret put GROQ_API_KEY`). Depois disso,
testar via `workflow_dispatch` e, confirmado que funciona, reativar o
`schedule` em `generate-article.yml` (descomentar as 2 linhas, hoje
comentadas).

**Brief completo da evolução dividido em 3 PRs** (A e C concluídas, B não
iniciada):

- **PR A** — qualidade/dedup/capas fixas. ✅ Mesclado (#23).
- **PR C** — paginação + arquivamento. ✅ Mesclado (#25).
- **PR B** — reduzir `CYCLE_HOURS` de 5 pra 3 ou 4 + fan-out (cada disparo
  do cron aciona as 5 editorias em paralelo via matrix do Actions, hoje só
  aciona uma por vez) + escalonamento de horário entre editorias + log
  estruturado (`WireCronLog`, tabela nova — precisa aprovação explícita
  antes de qualquer migration) + alerta quando uma rodada não publica
  nada. **NÃO iniciada** — bloqueada em duas respostas do usuário:
  1. Repo público/privado + plano do GitHub, pra calcular com segurança
     se a cota de minutos do Actions aguenta o fan-out (5 jobs por
     disparo). Sem essa resposta, não dá pra dimensionar o item com
     segurança.
  2. Confirmação da janela (3h ou 4h) e aprovação explícita da tabela
     `WireCronLog` (regra do Neon: schema novo sempre com confirmação
     item a item).

**Pendências pontuais que só o usuário resolve** (não são coisa que dá
pra "fechar" programaticamente — tentado e documentado por quê):

- `PIXABAY_API_KEY` — falta cadastrar como secret do GitHub Actions.
  Nenhum agente consegue criar essa conta sozinho (cadastro externo,
  sem navegador/rede pra isso no sandbox).
- `scripts/reprocess-covers.mjs` (upgrada matérias antigas sem foto real)
  nunca rodou — decisão já tomada: rodar LOCAL (não como secret novo do
  Actions, evita expor a connection string do banco). Precisa
  `DATABASE_URL`+`ANTHROPIC_API_KEY`+`PEXELS_API_KEY` no ambiente.

### Veronica Rede no menu hambúrguer (PR #7, mesclado em `main`)

- `/veronica-rede` (página do programa de afiliados/revendedores) já
  existia no código desde antes, mas era uma rota **órfã**: nenhum lugar
  do site linkava pra ela (nem menu, nem rodapé, nem outra página) —
  só acessível digitando a URL direto.
- Adicionado um `<Link to="/veronica-rede">Veronica Rede</Link>` no menu
  hambúrguer mobile (`src/components/SiteChrome.tsx`, dentro de
  `SiteHeader`), logo depois de "Blog" e antes da seção "Ecossistema".
  Não mexeu no dropdown desktop (`EcosystemMenu`) nem nos cards
  "O Ecossistema" da home — só no menu mobile, por pedido explícito.
- PR: https://github.com/Veronica-01Git/veronicahub-app/pull/7 —
  mesclado (squash) em `main` no commit `a24d7c9`.

### Home (`src/routes/index.tsx`) — REVERTIDA

Por pedido do usuário, a home voltou a ser exatamente a versão publicada
(`main`, commit `70de73d`) — `index.tsx` e `VeronicaHero.tsx` foram
restaurados com `git checkout main -- <arquivo>`. O redesign clara/Apple
que tinha sido feita **não está mais em uso em nenhuma rota**, mas:

- As classes CSS `.home-hybrid`, `.home-tint-green`, `.home-tint-cyan`,
  `.home-hero-dark` continuam em `src/styles.css` **porque o Veronica
  Wire (`blog.tsx`) depende delas** — não remover essas classes.
- As imagens em `public/images/ecosystem/*.webp` (já otimizadas) ficaram
  órfãs (não usadas por nenhuma rota agora) — disponíveis se o redesign
  da home for retomado no futuro.

### Studio Criativo (`src/routes/video-ia.tsx`)

- Renomeado de "Veronica Studio". Banner com foto de fundo + 4 cards de
  modalidade (Imagem/Vídeo/Voz/Avatar); compositor só aparece depois de
  escolher modalidade (`modalityChosen`). Sidebar nova (`StudioSidebar`).
- **Toda lógica de carteira/autenticação/Mercado Pago/geração real
  (Nano Banana Pro via Higgsfield) ficou intocada.**

### Veronica Wire (`src/routes/blog.tsx`)

- Redesenhado como portal de notícias de verdade (ticker "ao vivo", tira
  de índices, matéria principal + "mais lidas", newsletter, tags,
  seções por editoria, redação global, faixa final pro Hub). Geopolítica
  agora "China, EUA e Brasil"; Clima agora inclui "Energia Limpa"
  explicitamente. Página 100% estática, sem lógica de pagamento.

### Assistente Veronica no Studio Criativo (branch `veronica-assistente-studio`)

- `src/veronica/skills/studio-criativo.ts` — contrato dos 7 passos
  (steps, system prompt) fornecido pelo usuário.
- `src/veronica/skills/index.ts` — registry (fácil adicionar novas skills).
- `src/lib/veronica-server.ts` — chat via `createServerFn` (não
  `/api/...` — esse projeto não usa esse padrão), chama a Anthropic
  (modelo `claude-haiku-4-5-20251001`), limites de tamanho de
  mensagem/histórico como proteção básica de custo.
- `src/components/VeronicaDrawer.tsx` — drawer deslizante: vídeo por
  passo (com fallback se o arquivo ainda não existir), progresso,
  chat, chips de perguntas sugeridas.
- Sidebar do Studio ("Assistente Veronica") e chips "perguntar à
  veronica" em cada passo do playbook abrem o drawer.
- **PENDENTE CRÍTICO: `ANTHROPIC_API_KEY` não está configurada.** Sem
  ela em `.env.local`, o drawer abre normalmente mas o chat retorna erro
  tratado ("Assistente indisponível no momento"). Adicionar a chave
  direto no `.env.local` (nunca colar a chave no chat/terminal
  compartilhado).
- Não criada ainda: tabela `veronica_progress` (persistência do
  progresso do usuário) — mencionada no arquivo de contrato como algo
  que outras partes do sistema vão ler, mas não fazia parte do pedido
  original (só drawer + registry + chat).

### Veronica Analytics (`src/routes/veronica-analytics.tsx`)

- Reskin pra paleta clara e viva (rosa/ciano/dourado, inspirada no
  duotone do TikTok) via variáveis `--tt-*` escopadas (já existiam,
  só trocamos os valores) — mesma técnica da home antiga. Calculadora
  de engajamento 100% intacta (client-side, sem lógica tocada).
- Ticker de tendências no topo + bloco escuro final puxando pro Studio
  Criativo, no mesmo padrão do Wire.

### Login visível em todo o Hub + painel admin (branch `claude/veronicahub-redesign-cont-k92gt4`)

- **`AuthWidget`** (novo componente em `src/components/SiteChrome.tsx`) —
  botão "Entrar" (código por e-mail, mesmo fluxo passwordless que já
  existia só dentro do Currículo-Certo/RH/Studio) agora aparece no
  cabeçalho de **todas** as páginas que usam `<SiteHeader />` (Blog,
  Comandos, Prompt Packs, Security, Náutica, Rede, Studio, Analytics) e
  também no header próprio da Home (`index.tsx`). Não duplica lógica —
  só chama as server functions que já existiam em `auth-server.ts`
  (arquivo não foi alterado). Currículo-Certo/RH continuam com seu
  próprio header/modal de login (visual antigo, fora de escopo agora).
- **Painel admin simples** (`/admin`, rota não listada no menu — só por
  URL direta): lista usuários cadastrados (e-mail, saldo, créditos,
  papel) e depósitos recentes. Protegido de verdade no servidor —
  `src/lib/admin-server.ts` (novo arquivo, só leitura do banco, não
  toca em `auth-server.ts`/`wallet-server.ts`). Quem vira admin é
  definido pela env var `ADMIN_EMAILS` (lista de e-mails separados por
  vírgula) — no primeiro acesso ao painel com uma sessão logada nesse
  e-mail, o sistema promove a `role` do usuário pra `admin`
  automaticamente. Sem `ADMIN_EMAILS` configurada, ninguém acessa.
- **Mudança no schema do banco** (`src/lib/schema.ts`): campo novo
  `role` (`UserRole` enum: `user`/`admin`, default `user`) na tabela
  `User`. Migration já gerada em `drizzle/0001_square_lady_ursula.sql`
  (`CREATE TYPE` + `ALTER TABLE ... ADD COLUMN` — aditiva, não
  destrutiva), **mas ainda não aplicada no Neon de produção** — este
  ambiente remoto não tem `DATABASE_URL` real pra rodar isso com
  segurança. **Passo manual pendente, rodar no WSL com `.env.local`
  configurado:**
  ```bash
  bunx drizzle-kit migrate
  ```
  Depois, adicionar `ADMIN_EMAILS=seu@email.com` no `.env.local` (dev)
  e como secret do Worker de produção:
  ```bash
  wrangler secret put ADMIN_EMAILS --name veronicahub-app
  ```
  (nome do Worker de produção real — ver nota acima, não é
  `veronica-01git-veronicahub-app`).
- `src/routeTree.gen.ts` foi editado manualmente pra registrar a rota
  `/admin` (normalmente esse arquivo é 100% autogerado pelo plugin do
  TanStack Router ao rodar `vite dev`/`vite build` — este ambiente
  remoto não conseguiu rodar `bun install` completo, um pacote privado
  do registro bloqueou a instalação, então não deu pra rodar o gerador
  de verdade). Rodar `bun run dev` ou `bun run build` uma vez no WSL
  regenera esse arquivo do zero automaticamente e substitui essa edição
  manual pela versão canônica — não deve dar conflito, só confirma que
  ficou certo.

## Pendências conhecidas

**Veronica Wire (mais recente/ativo):** PRs A e C do brief de evolução já
mesclados, capas genéricas já populadas. Só restam `PIXABAY_API_KEY`,
`reprocess-covers.mjs` (local) e o PR B (frequência/fan-out/log —
bloqueado em 2 respostas do usuário) — ver seção "Veronica Wire" acima
pros detalhes. Itens abaixo são do redesign visual mais antigo, não
confirmados nesta atualização.

1. Adicionar `ANTHROPIC_API_KEY` em `.env.local` pra o chat da Veronica
   funcionar de verdade.
2. "Formalizar" trechos que ainda ficaram no estilo cyber antigo em
   Studio Criativo/Wire, e o menu "Ecossistema" do cabeçalho
   (`EcosystemMenu` em `SiteChrome.tsx`, compartilhado — afeta todas as
   rotas, não mexido ainda).
3. Vídeos por passo do Studio Criativo (`studio-criativo/01-*.mp4` etc.)
   ainda não existem/foram gravados — o drawer já trata isso com um
   placeholder honesto ("Vídeo deste passo em breve").
4. ~~Merge pendente~~ — RESOLVIDO: tudo já foi mesclado em `main`
   (commit `99b006c`), publicado no GitHub e com deploy feito no
   Cloudflare Worker. `veronicahub.com` já serve essa versão.
5. Rotas ainda no visual antigo, aguardando referência de design do
   usuário: Currículo-Certo, Security, Náutica.
6. ~~Página "/descobrir"~~ — RESOLVIDO: a referência HTML
   (`descobrir-exemplar-v2-claro.html`) foi aplicada dentro do Veronica
   Analytics (`src/routes/veronica-analytics.tsx`), não como rota
   separada. A página agora abre com a seção "O que está bombando
   agora" (ticker, chips de filtro por categoria, ordenação, grid de
   cards virais com GMV/crescimento mockados, cada card linkando pro
   Studio Criativo) e a calculadora de engajamento original continua
   logo abaixo, intacta. Ainda não commitado/publicado — feito na
   branch `claude/veronicahub-redesign-cont-k92gt4`.

## Como continuar

```bash
cd ~/veronicahub-app
git status                  # confirma branch atual e se há mudanças não commitadas
git branch                  # branch de trabalho atual: claude/veronicahub-redesign-cont-k92gt4
bun run dev                  # sobe o servidor local em http://localhost:8080
```

Pra abrir uma sessão nova de agente de IA aqui (Claude Code ou outro)
sem depender desta conversa: abra PowerShell → `wsl` → os comandos
acima → `claude` (ou o comando do agente escolhido) dentro da pasta do
projeto. O agente consegue se situar lendo este arquivo e o `git log`.

**Regras de segurança combinadas — valem pra qualquer agente que
continuar isso:**

- Implementar/commitar localmente sem precisar perguntar a cada passo.
- **Nunca** dar `git push`, publicar ou fazer deploy sem confirmação
  explícita do usuário a cada vez — é o mesmo repositório que roda
  carteira e Mercado Pago reais em produção (`veronicahub.com`).
- Nunca mexer em `src/lib/wallet-server.ts`, `src/lib/auth-server.ts`,
  `src/lib/mercadopago.ts`, `src/lib/higgsfield.ts`, nem no schema do
  banco — essas partes já estão validadas em produção com dinheiro
  real. Mudanças nessa área pedem confirmação extra, sempre.
- Não mexer no repositório irmão `~/negocio-da-china-app` nem no app
  principal `~/veronicahub-app` fora do que está documentado aqui sem
  perguntar antes.
- Nunca colar chaves/segredos (API keys, tokens) direto no chat — sempre
  pedir pro usuário colocar direto no `.env.local`.

## Fase 2 — reorganização e hierarquia da Home (2026-09-11)

- Trabalho local na branch `feat/home-hierarchy-phase2`, criada a partir de
  `origin/main` no commit `ff7042a`; `e1c1209` confirmado no histórico.
- Home consolidada em sete blocos: Hero, prova objetiva, escolha por objetivo,
  formações, ferramentas, método e Wire/encerramento.
- Hero preserva `VeronicaPresence` e a imagem WebP aprovada, sem vídeo, WebGL
  ou mídia nova. CTA principal aponta para Aula Zero e o secundário para
  Formações.
- Intenções, ferramentas, projetos e destinos continuam derivados de
  `src/lib/ecosystem.ts`. Destaques de formação usam `src/lib/courses.ts`.
- Home passou a carregar as três matérias mais recentes pelo fluxo real já
  usado no Wire, com fallback honesto quando o banco não está disponível.
- Projetos especiais ficaram próximos ao rodapé e exibem o status canônico.
- Removidos da Home os blocos repetidos de futuro, marquee, vitrine isolada da
  Studio, produtos, collabs, prova promocional, FAQ e efeitos decorativos.
- `npm run typecheck`, 5/5 testes e `npm run build` passaram. SSR local retornou
  200, título/H1/CTAs corretos e exatamente sete seções.
- A rota da Home caiu de 41.520 para 14.477 bytes de fonte. Nenhuma dependência,
  rota interna, autenticação, backend, banco ou pagamento foi alterado.
- QA responsivo estrutural concluído para breakpoints mobile/desktop, ordem
  semântica, foco visível e alvos mínimos. A captura visual automatizada ficou
  bloqueada porque o provedor do Chromium retornou 502/arquivo truncado.
- Publicação aprovada pelo usuário em 2026-09-11; envio para `main` e
  verificação no domínio de produção executados na sequência.

## Restauração visual da Home (2026-09-11)

- Restaurada a composição tecnológica anterior à simplificação da Fase 2,
  mantendo a arquitetura, as rotas e as fontes canônicas da Fase 1.
- Recuperados efeitos de hover, glow, HUD, microinterações, vitrines e a
  tipografia tecnológica da Hero.
- A Hero mantém a imagem WebP otimizada da Veronica e não reintroduz vídeo,
  WebGL ou mídia pesada.
- Adicionado controle acessível de tema claro/escuro exclusivo da Home, com
  preferência persistida localmente.
- Publicação da restauração solicitada após aprovação explícita do usuário.

## Registro público de selos (2026-09-11)

- Criado o catálogo público `/selos` e a verificação individual em
  `/selo/$serial`, preparados para acesso direto por QR Code.
- O primeiro registro real é da Express Entulhos, com série
  `VH-AUT-WA-2026-000001` e status transparente “Em desenvolvimento”.
- Quatro marcas autorais foram incluídas apenas como demonstrações fictícias
  para os segmentos têxtil e educacional; nenhuma marca global foi apresentada
  indevidamente como cliente.
- Cada página informa cliente, solução, escopo, versão, responsável, status e
  linha do tempo, além de esclarecer os limites do registro de procedência.
- O selo existente foi preservado em SVG vetorial, com nitidez independente de
  resolução e sem adicionar mídia pesada ou dependências.
- `/selos` foi incluída no sitemap. Backend, autenticação, pagamentos e banco
  permaneceram intactos.
- `npm run typecheck`, 6/6 testes e `npm run build` aprovados.
## Desativação da varredura vertical global (2026-09-13)

- Base: `main` em `fe7218e`; branch de trabalho `fix/disable-global-scan-beam`.
- `GLOBAL_SCAN_BEAM_ENABLED = false` em `src/components/HoloOrbits.tsx`
  impede a montagem da linha verde que atravessava a tela de cima para baixo.
- O elemento, sua animação `holo-beam` e os keyframes em `src/styles.css`
  foram preservados; reativação disponível alterando a constante para `true`.
- Escopo global pelo componente já montado no RootShell. HUDs, demais efeitos,
  temas, navegação, imagem da Veronica e backend permanecem intactos.
- 6/6 testes, typecheck e build de produção passaram. Lint direcionado:
  somente ocorrências preexistentes de Prettier (32 na base, 28 após a mudança),
  nenhuma no bloco alterado. `git diff --check` sem erros.
- QA visual local bloqueado: Vite com erro `uv_interface_addresses` neste
  ambiente e navegador remoto com `ERR_BLOCKED_BY_CLIENT` para localhost.
- Usuário autorizou publicação em 2026-09-13. Antes do envio, verificação no
  navegador de produção confirmou uma linha `holo-beam` ativa na Home.
- Publicado na `main` pelo commit `ae3edf1`. Cloudflare Workers confirmou
  build/deploy com sucesso (build `54c25ed4-fa2a-467e-b596-0f3a0d0ac6bd`).
- Verificação em produção após hidratação: Home nos temas claro e escuro e
  `/comandos` com zero elementos `holo-beam` e os dois HUDs globais preservados.
- Pexels e Pixabay: acesso pelo navegador desta sessão bloqueado por CAPTCHA;
  nenhuma conexão autenticada nova concluída.
