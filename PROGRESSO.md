# Progresso — redesign visual Veronica Hub

Arquivo de retomada rápida. Se você abrir uma sessão nova do Claude Code
neste diretório, leia isto primeiro pra se situar sem precisar reconstruir
o contexto do zero.

## Onde estamos

- Repositório: `~/veronicahub-app` (WSL), GitHub `Veronica-01Git/veronicahub-app`.
- Branch de trabalho: **`redesign-visual`**, criada a partir de `home-novo-visual`.
- **Nada foi commitado desde o checkpoint** `ab7e22c`. As mudanças abaixo
  estão só no working tree (`git status` mostra `src/components/VeronicaHero.tsx`,
  `src/routes/index.tsx`, `src/routes/video-ia.tsx`, `src/styles.css`
  modificados, e `public/images/ecosystem/` novo/não rastreado).
- **Nada foi publicado.** O site em produção (`veronicahub.com`) continua
  servindo a branch `main`, commit `70de73d` — sem nenhuma das mudanças
  visuais abaixo.
- Repositório irmão `~/negocio-da-china-app` (China Exchange) não foi tocado
  nessa sessão.

## O que já foi feito

### Home (`src/routes/index.tsx`)
- Paleta clara escopada só na home via CSS custom properties
  (`.home-hybrid` em `src/styles.css`) — as outras rotas continuam com o
  tema escuro original, intocado.
- Hero: removida a imagem/WebGL da Veronica (`VeronicaHero`, `HeroFrame`,
  `HeroEyeAccent`); layout centralizado estilo Apple; título sem
  glow/contorno neon; dois botões pill ("Saiba mais" / "Conheça o
  ecossistema"); espaço reservado (`Imagem em breve`) esperando uma imagem
  final pro lugar das antigas estatísticas.
- Seção "Guia em vídeo" (vídeo da Veronica se apresentando) removida.
- Ritmo de cor entre seções (`.home-tint-green`, `.home-tint-cyan` em
  `styles.css`): hero em cinza neutro → "Prova Real" com leve verde →
  "Comandos" com leve ciano → do "Ecossistema" pra baixo, mesmo tom da hero.
- Cabeçalho formalizado: sem fonte mono/uppercase/tracking, sem sublinhado
  animado, sem ponto pulsante — mantém fundo escuro translúcido.
- Seção "Ecossistema" reconstruída: blocos grandes alternados (imagem de um
  lado, texto do outro) por produto — Studio, Currículo-Certo, Analytics,
  Security, Prompt Packs e Negócio da China com imagem; Veronica Náutica
  ficou num card compacto só texto (não tem imagem ainda).
- Imagens novas em `public/images/ecosystem/` (`studio.png`,
  `security.png`, `analytics.png`, `curriculo.png`, `prompt-packs.png`,
  `china-exchange.png`) — **atenção: PNGs grandes (~1.5–1.8MB cada),
  ainda não otimizados/convertidos pra webp.** Fazer isso antes de
  publicar de verdade.

### Studio Criativo, antigo "Veronica Studio" (`src/routes/video-ia.tsx`)
- Renomeado pra "Studio Criativo" (título, meta tags, badge).
- Banner novo com foto de fundo (`/images/ecosystem/studio.png`) + 4 cards
  grandes de modalidade (Imagem, Vídeo, Voz, Avatar).
- Compositor (o workspace de geração de verdade) só aparece depois de
  escolher uma modalidade — estado novo `modalityChosen`, sem tocar em
  nenhuma lógica de carteira/geração existente.
- Sidebar nova (`StudioSidebar`, visual): Início, as 4 modalidades,
  Prompt Packs (link real), e itens ainda sem função marcados "em breve"
  (Descobrir, Quadros, Linha do tempo, Assistente Veronica, Produção).
- **Toda a lógica de carteira/autenticação/Mercado Pago/geração real
  (Nano Banana Pro via Higgsfield) ficou intocada** — só o visual mudou.

## Pendências conhecidas

1. Otimizar as imagens de `public/images/ecosystem/` (webp, tamanho menor).
2. "Formalizar" trechos que ainda ficaram no estilo cyber antigo: labels
   `[ 0X ]` nas seções Ecossistema/Preços/FAQ, tags dos cards de
   depoimento, e o menu "Ecossistema" do cabeçalho (`EcosystemMenu` em
   `SiteChrome.tsx`, componente compartilhado — não mexido ainda porque
   afeta todas as rotas).
3. Hero da home ainda com placeholder "Imagem em breve" — falta a imagem
   final do usuário.
4. Nenhum commit feito desde `ab7e22c` — considerar comitar como novo
   checkpoint antes de seguir editando mais páginas.
5. Usuário ainda vai trazer mais referências de design pra outras rotas
   do ecossistema (currículo, analytics, security, náutica, etc.) —
   mesmo processo: receber referência, adaptar mantendo cores/lógica
   atuais do site, revisar em `localhost:8080`, só commitar/publicar com
   aprovação explícita.

## Como continuar

```bash
cd ~/veronicahub-app
git status                 # confirma que ainda está tudo local, branch redesign-visual
bun run dev                 # sobe o servidor local em http://localhost:8080
```

Regra combinada com o usuário: **implementar sem pedir permissão a cada
linha, mas nunca dar commit/push/deploy sem confirmação explícita dele** —
é o mesmo repositório que roda carteira e Mercado Pago reais em produção.
