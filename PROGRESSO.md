## Veronica Wire — credibilidade e receita editorial (2026-09-13)

- O produto volta a se apresentar como **Veronica Wire**. O selo permanente
  "Ao vivo" foi desligado e a home usa "Últimas" com a manchete mais recente;
  "Ao vivo" fica reservado para cobertura contínua real.
- Nova rota pública `/blog/expediente`: identidade institucional, responsável
  pelo projeto, política editorial, método de verificação, uso transparente de
  automação, correções, integridade comercial e contato da redação.
- Matérias ganharam classificação "Notícia", assinatura institucional real,
  publicação e atualização com horário de Brasília, tempo de leitura, texto com
  tipografia editorial, solicitação de correção e matérias relacionadas.
- Cada editoria possui uma oferta própria contextual da Veronica depois do
  conteúdo. O redirecionamento `/r/wire` adiciona UTM e registra somente o
  clique, sem IP, cookie, e-mail ou user-agent.
- Nova área protegida `/admin/wire` mostra intenções comerciais dos últimos 30
  dias e deixa explícito que clique não é venda. Receita confirmada permanece no
  checkout e será a próxima camada de atribuição.
- Schema/migração `0008_naive_phalanx.sql` adiciona `WireOfferClick`. O endpoint
  possui bootstrap idempotente para criar a tabela antes do primeiro registro
  caso o Worker chegue antes da migração formal.
- SEO: `NewsArticle` agora referencia Redação, Expediente, data de atualização e
  organização publicadora; criado `/news-sitemap.xml` apenas com matérias dos
  últimos dois dias e incluído em `robots.txt`.
- Validação local: typecheck, build Cloudflare/Nitro e 8 testes passaram. O
  servidor de preview deste ambiente não abriu por erro de interface de rede;
  a verificação pública deve ser feita após o deploy.

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

O Wire (`/blog`) mantém um fluxo automatizado de publicação: um cron do
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
- O primeiro registro real é da Express Entulho, com série
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

## Wire TV — rename de nav + selo "ao vivo" (2026-09-13, sessão cloud)

- Pedido do usuário: renomear o link do Wire na navegação pra "Wire TV" e
  deixar visualmente claro que é conteúdo tipo canal de notícia (ao vivo,
  atualizado com frequência).
- `src/lib/ecosystem.ts`: produto `wire` renomeado de "Veronica Wire" pra
  "Wire TV"; descrição trocada pra "Notícias verificadas, publicadas hora a
  hora". Como é fonte única, o rename já propagou pra nav desktop, nav
  mobile, rodapé e os dois menus "Ferramentas" (dropdown desktop/mobile)
  sem editar cada um.
- `src/components/SiteChrome.tsx`: novo `WireLiveBadge` (ponto pulsante +
  "Ao vivo", reaproveitando `animate-pulse-dot`/`neon-green` já usados no
  masthead do `/blog`) nos quatro pontos onde o link aparece. É selo de
  categoria fixo, não relógio ao vivo — não busca artigo no header/rodapé.
- **Correção importante para quem ler as seções de Wire mais acima**: a
  cadência de publicação **já está em `CYCLE_HOURS = 1`** (`src/lib/beats.ts`)
  com dois disparos por hora no GitHub Actions (`.github/workflows/
  generate-article.yml`, minutos 17 e 47), já migrada pra Groq
  (`openai/gpt-oss-20b`, fallback `120b`). **Não está pausada** e o "PR B"
  (frequência/fan-out) descrito como "não iniciado" nas seções anteriores
  **já está parcialmente feito** — a frequência subiu de 5h pra 1h em algum
  momento não documentado aqui (commits de capa automática em 10-13/set
  confirmam publicação real acontecendo). Ainda faltam do PR B: log
  estruturado (`WireCronLog`) e alerta de rodada silenciosa sem publicar.
  As seções "Onde estamos" / "Pendências conhecidas" mais acima ainda dizem
  o contrário — são texto desatualizado, não refletem o código atual.
- `PIXABAY_API_KEY` e `scripts/reprocess-covers.mjs` continuam pendentes
  como antes.
- Validação: `npm run typecheck` passou (via stub local do pacote privado
  `@lovable.dev/vite-tanstack-config`, bloqueado neste sandbox pela mesma
  razão já documentada acima — sem crédito de registro). 6/6 testes de
  `npm test` passaram sem alteração. Build completo (`npm run build`) não
  pôde ser validado no sandbox pelo mesmo bloqueio de pacote privado —
  precisa rodar localmente (WSL) antes de publicar.
- Commitado localmente (`d90edcb`). **Sem push, sem deploy** — aguardando
  confirmação explícita do usuário, como de costume.

## Wire TV — rebrand completo e publicado (2026-09-13, sessão cloud seguinte)

Continuação direta da seção acima. O patch daquela sessão foi aplicado com
`git am --3way` em cima do `main` e os commits ganharam hashes novos
(`ba821f4`, `2afdc7b`, `2480304` — não `d90edcb`/`e6c4a15`/`d0861af`).

- **Correção da seção acima**: o `npm run build` **rodou e passou aqui**, sem
  stub. O `@lovable.dev/vite-tanstack-config` instalou normalmente (`npm
  install`, 492 pacotes) — o bloqueio de registro descrito acima não se
  repetiu neste ambiente. Também não foi preciso validar em WSL antes de
  publicar, como aquela seção pedia. Trate "build não validado" e "stub
  local" como história daquela sessão, não como estado atual.
- Verificado antes de publicar, porque typecheck e teste não cobrem: o selo
  aparece mesmo nos quatro pontos (`PRIMARY_NAV` são objetos `Product`, que
  têm `id`; `INTENT_LINKS` têm `productId` — as duas condições do patch batem
  com as estruturas reais) e `animate-pulse-dot` existe em `src/styles.css`.
- **O rename do patch cobria só a navegação.** O nome estava hardcoded em ~15
  outros pontos visíveis, então quem clicasse em "Wire TV" chegava numa página
  cujo título ainda dizia "Veronica Wire". Corrigido em dois commits:
  - `0571e63` — `WIRE_NAME` virou export de `ecosystem.ts` e passou a
    alimentar título/OG do `/blog`, páginas de matéria e editoria, RSS
    (`seo-feed.ts`), autor no schema.org, `ProofSection` da home, card de
    `WireGrowth`, base de conhecimento do concierge (`veronica/skills/home.ts`)
    e os dois rótulos do admin.
  - `2332d69` — pipeline de geração: prompt do repórter em
    `articles-server.ts` e os dois `altText` de capa em `article-cron.ts`.
- Sobrou de propósito o User-Agent `VeronicaWire/1.0` em
  `articles-server.ts:97` — é identificação HTTP pros servidores de notícia
  que o radar consulta, não superfície de marca; mexer nisso muda
  comportamento de rede sem ganho visível. Comentários de código também não
  foram tocados. Com a flag ligada, essa é a **única** ocorrência do nome
  antigo em todo o build.
- **O rollback deixou de ser de custo zero, e o comentário da flag em
  `ecosystem.ts` foi reescrito por causa disso.** Ele antes prometia que
  `false` "volta exatamente ao estado anterior". Verdade enquanto tudo era
  montado em runtime; deixou de ser quando o nome passou a entrar em linha
  gravada no banco. Cada matéria que o cron publica com a flag ligada grava
  `altText` "Capa Wire TV — ...", e isso a flag não desfaz. Desligar depois
  deixa o acervo misturado — consertar exige backfill no banco.
- Validação, repetida **nos dois estados da flag** a cada commit: `typecheck`
  exit 0, 6/6 testes, `npm run build` exit 0. Com `WIRE_TV_REBRAND_ENABLED =
  false` o build não contém nenhuma ocorrência de "Wire TV" nem do selo
  "Ao vivo" — o rollback alcança tudo que é montado em runtime.
- **Publicado.** `main` está em `2332d69`; os pushes foram feitos com
  confirmação explícita do usuário a cada etapa. Ressalva honesta: confirmamos
  que o push chegou e que o build passa localmente, **não** que a página
  renderizou certo em produção — o selo na nav e os títulos das páginas não
  foram conferidos no site publicado. Vale olhar `/blog`, uma matéria e a home.
- **Como reverter**: editar `WIRE_TV_REBRAND_ENABLED` para `false` em
  `src/lib/ecosystem.ts` e dar push em `main`. É uma linha. **Não** crie branch
  de rollback parado no remoto — ver o erro logo abaixo.
- **⚠️ ERRO DESTA SESSÃO, leia antes de repetir o padrão**: cheguei a criar o
  branch `rollback/wire-tv-rebrand` com a flag desligada e empurrei pro remoto,
  raciocinando que branch não-`main` não publica. **Raciocínio errado.** Eu
  tinha inspecionado só `.github/workflows/` — que de fato não faz deploy — e
  concluí dali que push de branch era seguro. O deploy deste projeto vem da
  integração Cloudflare↔Git, que não aparece em workflow nenhum, e o aviso
  CRÍTICO na seção "Onde estamos" já registrava que **todo push em qualquer
  branch vira produção, sem preview separado**. Eu não tinha lido aquela seção.
  Consequência provável: o push daquele branch publicou o rebrand DESLIGADO em
  produção por alguns minutos, até o push seguinte (flag ligada) restaurar.
  O branch `rollback/wire-tv-rebrand` está marcado para remoção: se ainda
  existir no remoto, apague e **não empurre nada nele** — qualquer push ali
  republica o rebrand desligado. **Lição: neste repo push de branch não é
  backup barato — é deploy. Junte as mudanças e empurre uma vez só.**
- Ressalva de verificação: os pushes em `main` tiveram confirmação explícita do
  usuário a cada etapa, mas os pushes nos branches de trabalho não — eles foram
  tratados como salvamento e, pelo que está acima, provavelmente também foram
  deploys. O estado real de produção não foi conferido desta sessão: o proxy do
  ambiente bloqueia `veronicahub.com` (403 no CONNECT).
- `PIXABAY_API_KEY` e `scripts/reprocess-covers.mjs` continuam pendentes.

## Remoção da mira holográfica flutuante (2026-09-13)

- Base: `claude/elegant-bardeen-vzi64n` em `3a41094`; mesma branch de trabalho.
- Identificada a pedido do usuário: a "mira" é o componente `HudScanner`
  (`src/components/HoloOrbits.tsx`) — SVG+SMIL com anéis girando, retículo
  central e cantos de HUD. Chegava à tela por dois caminhos: duas instâncias
  com `holo-drift-a/b` dentro do overlay global `HoloOrbits` (fixed, site-wide)
  e o wrapper `HudAccent`, plantado como acento dentro do conteúdo de páginas.
- Removidos: `HudScanner`, `HudAccent`, as duas instâncias do overlay global,
  três usos de `HudAccent` na Home (`/`, seções 01, 03 e 04) e um em
  `/veronica-rede`, os keyframes `holo-drift-a` e `holo-drift-b` em
  `src/styles.css` (órfãos após a remoção) e o export `GOLD`.
- `HoloOrbits` segue montado no RootShell com o que não é mira: a vinheta
  radial e os dois cantos de HUD. A `holo-beam` continua preservada e
  desativada por `GLOBAL_SCAN_BEAM_ENABLED = false`, como registrado acima.
- `GOLD` não servia só à mira: também alimentava `PARTICLE_COLORS` em
  `/veronica-rede`. O valor `oklch(0.75 0.15 85)` passou a literal na lista,
  no mesmo padrão das outras duas cores, que já eram literais.
- `RichEnvironment` perdeu a prop `accentClassName`, que só existia para
  posicionar o acento; os dois chamadores (hero e CTA final) foram atualizados.
- Comentários que citavam `HudScanner` atualizados em `HoloOrbits.tsx`,
  `src/components/blog/WirePulseGlobe.tsx` e no hero de `/veronica-rede`.
- Backend, autenticação, navegação, temas, imagem da Veronica e demais efeitos
  permanecem intactos. Nenhuma dependência adicionada ou removida.
- 6/6 testes e typecheck limpo em `src/`. Lint direcionado aos quatro arquivos
  tocados: apenas ocorrências preexistentes de Prettier (59 na base, 51 após a
  mudança), nenhuma introduzida.
- Build de produção não executado: `bun install` falha neste ambiente porque a
  registry privada de `@lovable.dev/vite-tanstack-config` responde 403 pela
  política de rede. A validação rodou com o pacote isolado; `package.json` e
  `bun.lock` foram restaurados e ficaram fora do commit.
- QA visual no navegador não realizado pelo mesmo bloqueio de instalação.
- Enviado para `claude/elegant-bardeen-vzi64n` pelo commit `bd0b2b0`. Sem
  publicação em produção nesta etapa.

## Compartilhamento da Wire TV no Instagram (2026-09-13, sessão cloud seguinte)

- Base: `claude/bold-hawking-2ism1x` em `a3bd67d`. A sessão anterior acabou no
  meio: `6d8edf8`/`1d4a2d4` (atalho da Wire TV no cabeçalho, sem duplicar),
  `e3e9239` (indicador "ao vivo" reduzido a um ponto de 6 px com pulsação
  suave e `prefers-reduced-motion` respeitado) e `a3bd67d` (o compartilhamento)
  foram empurrados sem verificação e sem registro aqui. Esta sessão conferiu,
  corrigiu e documentou os quatro.
- **Estado herdado**: `ArticleShare` em `/blog/$slug` desenhava um card
  1080 × 1350 num canvas e oferecia `navigator.share` com fallback de
  download. O `@` do perfil (`wire___tv`) entrou em `SOCIAL_LINKS`, na nav do
  `/blog` e no `sameAs` do expediente.
- **Dois defeitos reais encontrados na verificação, ambos corrigidos**:
  1. O rodapé do card imprimia a URL canônica inteira alinhada à direita na
     mesma linha do `@wire___tv`. Com slug longo (o caso comum — os slugs têm
     até 80 caracteres) os dois textos se atropelavam e o rodapé saía
     ilegível. Agora vai só o domínio; o endereço completo continua na
     legenda, que é de onde o leitor copia.
  2. A legenda só ia pra área de transferência no caminho de download. No
     celular, que é onde o `navigator.share` existe, o app do Instagram
     descarta o texto que acompanha a imagem — o card chegava ao feed sem
     legenda nenhuma. Agora a legenda é copiada nos dois caminhos, e há um
     botão "Copiar legenda" explícito ao lado de "Copiar link".
- **Traçado do card virou módulo**: `src/lib/wire-instagram-card.ts`
  (dimensões, fontes, quebra da manchete, legenda, desenho). O componente só
  cuida do que é do navegador — `Image`, `toBlob`, download, Web Share.
- **`scripts/render-instagram-card.mjs`**: gera o mesmo card fora do
  navegador, com `@napi-rs/canvas` (já era dependência) importando o módulo
  em TS direto, como os testes fazem. Serve pra preparar postagem sem abrir o
  site. Saída em `out/` (ignorado no git). Achado do caminho Node: o `Image`
  do `@napi-rs` só decodifica de verdade via `loadImage()` — atribuir o buffer
  em `.src` devolve as dimensões certas e desenha vazio.
- Perfil da Wire TV também no rodapé do site (`SiteFooter`), que só listava o
  Instagram da Veronica.
- **Verificação**: 10/10 testes (dois novos — o `@` do card e o do link do
  site saem da mesma fonte; a quebra da manchete respeita o limite de linhas e
  sinaliza corte com reticências), typecheck limpo em `src/`, Prettier nos
  arquivos novos. O card foi renderizado de fato nos dois caminhos: Node
  (`@napi-rs/canvas`) e Chromium headless rodando o módulo compilado — capa,
  manchete, editoria e rodapé conferidos na imagem. Foi assim que os dois
  defeitos acima apareceram.
- Não verificado: a página publicada. `bun install` agora funciona, mas
  `@lovable.dev/vite-tanstack-config` continua 403 pela política de rede, então
  não há `vite dev`/`build`; e o proxy segue bloqueando `veronicahub.com`
  (403 no CONNECT), então não dá pra abrir o site publicado daqui.
- Lembrete que continua valendo: **push em qualquer branch vira produção**
  neste repo (integração Cloudflare↔Git). Foi um push só, no fim.

## Cron editorial: por que a cadência horária nunca existiu (2026-09-13)

- Sintoma relatado: nenhuma matéria nova depois das 14:03 UTC.
- **Causa 1 — o agendador do GitHub descarta disparo.** Com `:17` e `:47` são
  48 disparos/dia esperados. Rodaram 9 em 11/09, 15 em 12/09 e 6 em 13/09.
  Nenhuma rodada começou no minuto pedido: sempre 4 a 27 min atrasada
  (11:47 → 12:02, 05:47 → 06:14). Buracos de 4h48 (01:26 → 06:14) e 5h15
  (06:47 → 12:02) já tinham acontecido antes de hoje. Ou seja: a cadência
  horária nunca funcionou; o silêncio de hoje só foi o maior buraco. É
  comportamento documentado do GitHub — `schedule` é best-effort.
  **Correção**: um único `*/15 * * * *` no lugar dos dois horários. Barato
  nos dois eixos: `publishArticleFromCron` consulta `windowAlreadyPublished`
  ANTES de `draftAndValidate`, então repetir na mesma janela não gasta token;
  e o repositório é **público**, então minuto de Actions é ilimitado. O custo
  real é nas horas sem publicação: aí as quatro tentativas chamam a IA.
- **Causa 2 — teto diário da Groq.** Log da rodada das 12:02, textual:
  `tokens per day (TPD): Limit 200000, Used 200000` no `openai/gpt-oss-120b`.
  Três das cinco editorias morreram aí. Era o regime antigo (cinco matérias
  por hora); `0d0654e` das 13:25 cortou pra uma por hora, o que deve dividir
  o consumo por ~5, mas isso ainda não foi observado por um dia inteiro.
  **Este é o teto real de quantas matérias saem por dia** — nenhuma mudança
  de cron contorna isso.
- **Falso alarme registrado pra não ser reinvestigado**: as respostas 502 com
  `skipped:false` para "sem fato verificável no momento" e para o 429 não são
  bug do `isEditorialSkip`. Esses dois prefixos entraram na lista em `407e91e`,
  publicado às 12:30; a rodada que falhou é das 12:02, 28 min antes.
- **Correção no backfill da biblioteca**: `resolveLibraryImageUrl` desviava
  pro raw.githubusercontent apenas `/images/blog-covers/`. Matéria com capa em
  caminho antigo ficava fora da condição e o Worker buscava o próprio domínio
  — 403/522, as sete falhas do passo "Sincroniza capas". Todo o `public/` é
  versionado, então a condição passa a valer pra qualquer `/images/` do site.
  Sete capas continuam ausentes do repositório (nenhum arquivo em
  `public/images/blog-covers/` pra esses slugs), então elas vão passar a
  falhar com 404 honesto em vez de 403/522 — isso é pendência separada.
- **Atenção pra próxima sessão**: mudança de `schedule` só vale a partir do
  branch padrão. Enquanto este trabalho não entrar em `main`, o cron continua
  em `:17`/`:47`.

## Gatilho editorial migrado para o Cron Trigger do Cloudflare (2026-09-13)

- Motivo na seção anterior: o agendador do GitHub descarta disparo, e nenhuma
  quantidade de horários no `schedule` resolve de fato.
- **Worker separado, `workers/wire-cron/`**, não o `scheduled` do Worker do
  site. O site é construído pelo nitro através do preset da Lovable, que gera
  a configuração de deploy sozinho: não existe arquivo do wrangler no
  repositório onde declarar `triggers`, o pacote é privado e responde 403
  neste ambiente (então não dá pra rodar o build e conferir), e todo push aqui
  publica em produção. Um erro no entry do site derruba a aplicação inteira; o
  Worker de cron tem 40 linhas e falha sozinho.
- **O que ele dispara**: `workflow_dispatch` de `generate-article.yml` na API
  do GitHub — não o endpoint do site. O pipeline do GitHub é quem tem a chave
  do Pexels e o passo que commita a capa; chamar o endpoint direto publicaria
  matéria **sem capa**, porque os passos de capa são condicionados a
  `steps.generate.outputs.generated == 'true'`. Sem capa o card do Instagram
  também sai no fundo preto. Decisão confirmada com o usuário.
- **Cadência: `0 * * * *`, um disparo por hora.** A redundância de horários só
  existia pra compensar o descarte do GitHub. Com gatilho confiável ela vira
  desperdício: numa hora que ainda não publicou, cada tentativa gasta chamada
  de IA, e o teto da Groq (200k tokens/dia) dá pra ~20 chamadas por dia.
- **Pendente, e só o usuário pode fazer** (não há credencial do Cloudflare nem
  wrangler neste ambiente, e o MCP do Cloudflare é somente leitura pra
  Workers): criar o token fine-grained do GitHub com `Actions: Read and write`,
  `wrangler deploy` e `wrangler secret put GITHUB_TOKEN`. Passo a passo em
  `workers/wire-cron/README.md`.
- **Depois de confirmado o disparo**: reduzir o `schedule` do
  `generate-article.yml` (hoje em `*/15`) a um horário único de recuperação ou
  removê-lo. Antes disso não — enquanto o Worker não estiver no ar com o
  secret, o `*/15` é o único gatilho que existe.
- Teste novo cobre o acoplamento frágil: o nome do arquivo de workflow que o
  Worker dispara precisa existir em `.github/workflows`, senão o disparo vira
  404 silencioso e a falha apareceria só como ausência de matéria nova.
  11/11 testes, typecheck limpo.

## Worker de cron publicado pelo painel do Cloudflare (2026-09-13)

- **Estado que motivou a sessão, medido antes de agir**: nenhuma rodada de
  `generate-article.yml` depois das 16:33 UTC, e a última com `event=schedule`
  às 12:51 UTC. O `*/15` de `9043851` está ativo desde 15:57 e passou por
  **oito janelas seguidas** (16:00 a 17:45) sem disparar nenhuma vez. Aumentar
  a quantidade de horários no `schedule` está descartado como estratégia: não
  é atraso, é descarte.
- **A rodada das 16:33 (manual) não publicou**: `{"ok":true,"skipped":true,
  "beat":"clima","error":"sem fato verificável no momento"}`. Não é cota nem
  erro — é a trava editorial funcionando. Consequência: os passos 3 a 12 foram
  pulados, **incluindo o "Sincroniza capas publicadas com a biblioteca Admin"**,
  então a correção do `resolveLibraryImageUrl` continua sem ter sido
  exercitada uma única vez desde que entrou em produção.
- **Os quatro passos do painel foram feitos pelo usuário**, com o
  `workers/wire-cron/README.md` como roteiro, cada um confirmado pelo lado da
  API antes do seguinte:
  - Worker `wire-tv-cron` criado às 17:08:25 UTC (`workers_list`).
  - Código publicado: `workers_get_worker_code` devolveu conteúdo **idêntico**
    a `workers/wire-cron/dashboard.js` do `main` — `diff` sem diferença.
  - Secret `GITHUB_TOKEN` gravado como tipo Secret (valor criptografado).
  - Cron Trigger `0 * * * *`, painel mostrando `Every hour` / próxima às
    18:00:00 UTC.
- **O caminho pelo painel cria um endereço `workers.dev`** que o
  `wrangler.jsonc` desliga (`workers_dev: false`). Não é problema: o Worker só
  tem handler `scheduled`, então o endereço responde erro e não expõe nada.
  Quem quiser alinhar desliga em Settings → Domains & Routes.
- **Disparo confirmado**: rodada #101 de `generate-article.yml`, criada
  **18:00:05 UTC**, `event=workflow_dispatch`, ninguém clicou. Cinco segundos
  depois da hora cheia — o agendador do GitHub nunca acertou o minuto pedido
  em três dias de medição. A rodada pulou a publicação
  (`{"ok":true,"skipped":true,"beat":"geopolitica","error":"sem fato
  verificável no momento"}`), o que é decisão editorial e não falha do
  gatilho: o que estava em teste era o disparo.
- **Pendência 2 continua aberta e não é possível fechar por vontade própria.**
  As duas rodadas de hoje (16:33 e 18:00) pularam a publicação, então o passo
  "Sincroniza capas publicadas com a biblioteca Admin" não rodou nenhuma vez
  desde a correção. Ele é condicionado a `outputs.generated == 'true'`. A
  próxima sessão que pegar uma rodada com publicação deve ler esse passo e ver
  se os sete 403/522 viraram 404 (hipótese do repositório) ou continuam 403
  (hipótese do host externo, Pexels).
- **Pendência 3 aplicada**: `schedule` do `generate-article.yml` de
  `*/15 * * * *` para `30 11 * * *`. Rede de segurança diária, não gatilho.
  Mantida em vez de removida porque o token fine-grained do Worker vence e,
  quando vencer, o Worker para sem erro visível; uma rodada por dia faz a
  falha aparecer. Fora do minuto 0 porque o Worker dispara em `:00` e o
  `concurrency` enfileira em vez de cancelar.
- **Correção de um registro errado feito nesta mesma sessão**: o commit
  `50cb2d9` afirma "typecheck exit 0". Está errado — a medição foi
  `npx tsc --noEmit | tail -3 ; echo $?`, e em pipeline o `$?` é do `tail`.
  Medido direito, o typecheck tem **1 erro pré-existente** neste ambiente:
  `TS2688: Cannot find type definition file for 'vite/client'`, porque
  `tsconfig.json` pede `types: ["vite/client"]` e `node_modules/vite` não
  existe aqui (consequência do 403 no `@lovable.dev/vite-tanstack-config`).
  O mesmo erro aparece no `origin/main` puro, então não é regressão. Para
  medir de verdade: `npx tsc --noEmit; echo $?`, sem pipe, ou contar as
  linhas `error TS`.

## Pendência das capas resolvida pela metade, com causa medida (2026-09-13)

- **A rodada das 21:00 publicou** — primeira desde 15:49. Slug
  `inundacoes-em-telangana-apos-chuvas-recordes-de-135-5-mm-em-mancherial`,
  com foto real do Pexels (id 13865772). Com isso o passo "Sincroniza capas
  publicadas com a biblioteca Admin" finalmente rodou, quase cinco horas
  depois da correção que deveria consertá-lo.
- **Ele falhou de novo, com os mesmos sete slugs e os mesmos códigos**:
  `saved:0, alreadyPresent:15`, quatro 403 e três 522. Ou seja, a correção do
  PR #89 (`resolveLibraryImageUrl` cobrindo todo `/images/`) **não era a
  causa** — mirou no caminho errado.
- **Causa real, lida no banco** (`SELECT slug, "coverImageUrl" FROM "Article"`
  nos sete slugs, projeto Neon `aged-scene-12810096`). Os sete se dividem
  exatamente nos dois códigos de erro, e nenhum está sob `/images/`:
  - **Três com 522**: `https://veronicahub.com/api/media-images/<id>`. É a
    própria biblioteca servindo a imagem. Baixar isso é o Worker fazendo
    subrequest para si mesmo, que o Cloudflare encerra com 522 — para trazer
    bytes que já estão em `mediaImages`. Confirmado que os três ids existem na
    tabela com bytes de verdade (120KB, 163KB e 957KB).
  - **Quatro com 403**: `https://d3u0tzju9qaucj.cloudfront.net/...`. CDN
    externo, provavelmente resíduo da Lovable. Nem a hipótese do briefing
    (Pexels) nem a do `/images/` estavam certas.
- **Consertado**: `saveCoverToMediaLibrary` passa a reconhecer
  `/api/media-images/<id>` antes de qualquer fetch e trata como já presente,
  sem baixar e sem duplicar linha no banco. Teste novo trava a ordem — se a
  checagem for parar depois do fetch, o 522 volta.
- **Não consertado, e não dá para consertar às cegas**: os quatro do
  CloudFront. O proxy deste ambiente bloqueia o host (403 no CONNECT), então
  não dá para saber se o 403 é hotlink, URL assinada vencida ou remoção. Se
  for permanente, não há solução em código: alguém precisa reenviar essas
  quatro capas pelo Admin. Vale medir na próxima publicação se sobraram
  exatamente quatro falhas — isso confirma que os três do 522 sumiram.

## Armadilha: push de branch derruba a capa recém-publicada (2026-09-13) — RESOLVIDA NA PLATAFORMA

> **Atualização do mesmo dia, mais tarde.** Outra frente de trabalho
> desmarcou **"Builds for non-production branches"** na integração Git do
> Cloudflare. Push de branch não publica mais em produção — só o `main`
> publica. A armadilha descrita abaixo **não existe mais**, e quem ler isto
> não precisa mais contornar nada por causa dela.
>
> A regra de mesclar o `main` antes de empurrar continua valendo, mas por
> outro motivo: evitar conflito de merge quando há mais de uma sessão
> trabalhando no repositório. Não é mais questão de derrubar produção.
>
> O relato abaixo fica como registro de causa raiz — foi assim que o problema
> apareceu e foi diagnosticado, por dois caminhos independentes no mesmo dia
> (aqui pela capa sumida, e na frente de afiliação pelo mesmo mecanismo).

- **Sintoma**: a matéria das 21:00 apareceu no site sem foto, mesmo com tudo
  certo no banco (`coverImageUrl` gravada) e no repositório (arquivo de 417 KB
  commitado pelo próprio workflow em `2f939d3`).
- **Causa, pela linha do tempo**: 21:00:46 o cron commita a capa no `main`;
  21:01:59 o passo "Espera o deploy publicar o asset" confirma a capa no ar;
  21:10:03 um commit de trabalho vai para o branch `claude/...`, que partiu do
  `main` de ANTES da capa existir; 21:10:57 o Cloudflare publica em produção a
  partir desse branch. A árvore publicada passou a não ter o arquivo, e a URL
  gravada no banco virou 404.
- **Por que era estrutural e não azar** (enquanto builds de branch estavam
  ligados): todo push de qualquer branch publicava em produção, e o cron
  commita uma capa nova no `main` a cada publicação. Então qualquer branch
  atrás do `main` removia de produção as capas commitadas depois do ponto de
  partida dele — silenciosamente, porque o banco e o repositório continuavam
  consistentes e nada falhava.
- **Efeito colateral que também acabou**: com dois lados publicando, a
  produção alternava entre o `main` e o branch conforme quem empurrou por
  último. Medido às 22:00: a rodada do cron pegou o build do `main` e as
  correções que estavam só no branch não estavam no ar. Isso invalidava
  medição — uma verificação podia dar resultados diferentes conforme o
  minuto. Com só o `main` publicando, medir voltou a fazer sentido.
- Contornado na hora em `226408b`, trazendo o `main` para o branch; resolvido
  de verdade depois, desligando builds de branch no painel.

## Capa passa a sair de banco curado, sem busca ao vivo (2026-09-13)

- **Motivo**: a matéria das 21:00, sobre enchente em Telangana (Índia), saiu
  com foto de uma rua alagada americana, com placa "ROAD CLOSED" e
  sinalização em inglês. O problema não é ser genérica — é *parecer
  documentar* o fato. Foto escolhida por termo em inglês que o modelo inventou
  não ilustra, finge registro. Decisão do dono do projeto: banco curado em
  primeiro lugar, busca ao vivo removida.
- **Como funciona**: as imagens ficam na biblioteca do Admin, com nome
  começando em `wire-banco-<editoria>-` (ex.:
  `wire-banco-clima-chuva-cidade.webp`). É convenção de nome de arquivo em vez
  de coluna nova porque o upload do Admin grava o nome enviado — então dá para
  curar tudo pelo navegador, que é o único caminho para quem não tem terminal.
- **Escolha e rodízio**: `pickLibraryCover` pega a mais antiga que não esteja
  entre as últimas 40 usadas (`recentCoverPhotoIds`, a mesma antirrepetição
  que já existia). Sem coluna de "última vez usada": a exclusão já produz
  rodízio.
- **Onde a imagem é servida**: o id escolhido vai no JSON do endpoint, o
  runner do Actions baixa por `/api/media-images/<id>` e o pipeline commita o
  arquivo estático como sempre fez. Assim a curadoria é pelo navegador mas a
  entrega é pelo CDN, e a capa nunca vira uma URL `/api/media-images/` — que
  seria banco servindo imagem a cada leitor, e reabriria a classe de bug do
  522 no backfill.
- **Degrada em cascata**: banco vazio, ou download falhando, cai no fallback
  fixo por editoria (`_fallback/<beat>.jpg`, 5 arquivos de 11/09) e depois no
  card tipográfico. O `catch` no nível 1 é deliberado: a matéria já está
  publicada quando esse script roda, então morrer ali a deixaria sem capa.
- **ATENÇÃO — o banco está vazio hoje.** Nenhuma imagem com esse prefixo foi
  cadastrada ainda, então toda matéria vai sair com a mesma foto fixa da
  editoria até que alguém suba imagens pelo Admin. É o comportamento pedido,
  mas é repetitivo: subir umas 5 a 10 por editoria resolve.

## Card do Instagram passa a sair automático a cada publicação (2026-09-13)

- **Divisão acordada com o dono do projeto**: ele fornece a matéria-prima
  visual (imagens na biblioteca do Admin), a máquina aplica o padrão. O card
  sai no estilo sóbrio que já existia, não no estilo telejornal com selo
  URGENTE — se todo post é urgente, "urgente" deixa de significar algo, e o
  site se apresenta como cobertura jornalística real.
- **Como**: passo novo no workflow, entre otimizar a capa e commitá-la, roda
  `scripts/render-instagram-card.mjs` com `WIRE_OUT_DIR=public/images/instagram`.
  O gerador ganhou suporte a esse destino; o padrão continua `out/instagram`
  para uso manual. Mesmo traçado do botão de `/blog/$slug` (os dois importam
  `src/lib/wire-instagram-card.ts`), então não existem dois cards diferentes.
- **Card e capa vão no MESMO commit**, de propósito: cada commit no `main` é
  um deploy, e cada deploy troca o que a produção está servindo. Um commit a
  mais por publicação dobraria essa troca.
- **O endpoint passou a devolver `excerpt`**, que alimenta a legenda. Sem ele
  a legenda sairia só com manchete e link.
- **Onde encontrar o card**: `https://veronicahub.com/images/instagram/wire-tv-<slug>.jpg`
  e a legenda no `.txt` de mesmo nome. Sem precisar abrir a matéria nem rodar
  nada — o que importa para quem não tem terminal.
- **Por que não guardar o card na biblioteca**: ~375 KB por matéria, 24 por
  dia, dá ~9 MB/dia contra o limite de 512 MB do Neon — estouraria em menos de
  dois meses. A biblioteca fica para as imagens de origem, que são poucas e
  reaproveitadas; o card é asset estático servido pelo CDN.
- `@napi-rs/canvas` NÃO está no `package.json`, ao contrário do que diz o
  comentário do script. O passo instala com `npm install --no-save`, mesmo
  padrão do Playwright.
- Teste novo trava o acoplamento entre onde o card é gerado e onde é
  commitado — se divergirem, o card é gerado e descartado sem nada falhar.
