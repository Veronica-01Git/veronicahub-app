# Progresso — redesign visual Veronica Hub

Arquivo de retomada rápida. Se você abrir uma sessão nova do Claude Code
(ou outro agente) neste diretório, leia isto primeiro.

## Onde estamos

- Repositório: `~/veronicahub-app` (WSL), GitHub `Veronica-01Git/veronicahub-app`.
- **JÁ PUBLICADO:** `main`/`origin/main` está no commit `4e3fe89` (merge
  do redesign visual + feed viral do TikTok Shop no Veronica Analytics)
  — confirmado ao vivo em `veronicahub.com`.
- **Worker de produção correto: `veronicahub-app`** (não
  `veronica-01git-veronicahub-app`). A conta Cloudflare tem os dois —
  `veronica-01git-veronicahub-app` existe mas NÃO é o que serve o
  domínio (ficou parado no commit `99b006c`, desatualizado). O deploy
  automático (Cloudflare Git integration, dispara a cada push em
  `main`) publica em `veronicahub-app`, confirmado com o usuário abrindo
  o navegador direto. Se for usar `wrangler secret put` ou qualquer
  comando `--name`, usar `veronicahub-app`.
- Branch de trabalho atual: `claude/veronicahub-redesign-cont-k92gt4`
  (criada a partir de `main`, já com histórico mesclado em `main` também)
  — pra continuar itens pendentes sem mexer direto em `main`.
- Repositório irmão `~/negocio-da-china-app` (China Exchange) não foi
  tocado.

## O que já foi feito

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
