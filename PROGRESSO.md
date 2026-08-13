# Progresso — redesign visual Veronica Hub

Arquivo de retomada rápida. Se você abrir uma sessão nova do Claude Code
(ou outro agente) neste diretório, leia isto primeiro.

## Onde estamos

- Repositório: `~/veronicahub-app` (WSL), GitHub `Veronica-01Git/veronicahub-app`.
- Duas branches locais de trabalho, nessa ordem:
  1. `redesign-visual` (criada a partir de `home-novo-visual`) — redesign
     visual de Home, Studio Criativo e Veronica Wire. Commits:
     `ab7e22c` (checkpoint inicial) → `9fc7f1c` (checkpoint do redesign).
  2. `veronica-assistente-studio` (criada a partir de `redesign-visual`) —
     drawer da assistente Veronica no Studio Criativo. Commit: `94d6292`.
     **É a branch atual (`git branch --show-current`).**
- **Nada foi publicado.** Produção (`veronicahub.com`) continua servindo
  `main`, commit `70de73d` — nenhuma das mudanças abaixo está no ar.
- Repositório irmão `~/negocio-da-china-app` (China Exchange) não foi
  tocado.

## O que já foi feito

### Home (`src/routes/index.tsx`)
- Paleta clara escopada só na home (`.home-hybrid`, `.home-tint-green`,
  `.home-tint-cyan` em `src/styles.css`) — outras rotas continuam com o
  tema escuro original.
- Hero centralizado estilo Apple, sem imagem/WebGL da Veronica, sem
  glow/contorno neon no título, dois botões pill, espaço reservado
  "Imagem em breve" (falta a imagem final do usuário).
- Cabeçalho formalizado (sem mono/uppercase/sublinhado animado/pulse dot).
- Seção "Ecossistema" em blocos grandes alternados (imagem + texto) por
  produto, imagens em `public/images/ecosystem/*.webp` (já otimizadas,
  ~80-145KB cada — os PNGs originais de ~1.5-1.8MB foram removidos).
  Veronica Náutica ainda sem imagem (card compacto só texto).

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

## Pendências conhecidas

1. Adicionar `ANTHROPIC_API_KEY` em `.env.local` pra o chat da Veronica
   funcionar de verdade.
2. "Formalizar" trechos que ainda ficaram no estilo cyber antigo: labels
   `[ 0X ]` nas seções Ecossistema/Preços/FAQ da home, tags dos cards de
   depoimento, e o menu "Ecossistema" do cabeçalho (`EcosystemMenu` em
   `SiteChrome.tsx`, componente compartilhado — não mexido ainda porque
   afeta todas as rotas).
3. Vídeos por passo do Studio Criativo (`studio-criativo/01-*.mp4` etc.)
   ainda não existem/foram gravados — o drawer já trata isso com um
   placeholder honesto ("Vídeo deste passo em breve").
4. Merge pendente: `veronica-assistente-studio` precisa ser mesclada de
   volta em `redesign-visual` (ou direto em `main`, a decidir) quando o
   usuário aprovar.
5. Rotas ainda no visual antigo, aguardando referência de design do
   usuário: Currículo-Certo, Veronica Analytics (a próxima, apelidada de
   "TikTok"), Security, Náutica.

## Como continuar

```bash
cd ~/veronicahub-app
git status                  # confirma branch atual e se há mudanças não commitadas
git branch                  # lista as branches (veronica-assistente-studio é a mais recente)
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
