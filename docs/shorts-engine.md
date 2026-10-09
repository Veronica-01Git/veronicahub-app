# Veronica Shorts — motor próprio, versão inicial

Não utiliza OpusClip, Vizard nem serviços proprietários de clipping. O produto,
fila, seleção editorial, timestamps validados, renderização e kits são da Hub.
Usa yt-dlp para obter vídeos autorizados acessíveis, faster-whisper para
transcrição local e FFmpeg para exportar MP4 H.264/AAC com legendas queimadas.
O roteador de IA existente escolhe candidatos reais e prepara textos por corte.

## O que está implementado

- Painel privado `/admin/shorts`: guardar links, solicitar cortes, consultar
  etapas e prévias e exportar kits para quatro redes.
- API privada `/api/social/render/{claim,heartbeat,plan,complete,fail}`.
- Trabalho separado do Worker web, sem execução de FFmpeg no request do site.
- Fila Postgres com claim atômico, lease renovável e bloqueio de duplicados.
  Falhas/leases expirados requerem revisão e nova solicitação; não há retry
  automático de processamento caro. Vídeos não são publicados pelo motor.
- Shortlist determinística de até 12 trechos distribuídos na transcrição,
  seguida de escolha editorial pelo modelo. Até 3 cortes de 20–60 s.
- Vídeos de 1–60 minutos, até 1 GiB e aquisição até 1080p. Sem lives,
  credenciais YouTube, cookies de terceiros ou contorno de conteúdo restrito.
- Quadro completo preservado com fundo desfocado 9:16; não há rastreamento de
  rosto nesta versão. Legendas sincronizadas por palavra em blocos curtos.
- Verificação da saída com ffprobe antes de enviar ao armazenamento.

## Conectar em produção — caminho atual, gratuito e sem configuração manual

Decisões da proprietária (09/10/2026): sem gasto agora e sem passos manuais no
Cloudflare/GitHub. O processamento roda no GitHub Actions (repositório público:
minutos gratuitos, 4 vCPU / 16 GB) e os vídeos ficam **privados** no R2 da própria
Hub (franquia grátis de 10 GB, sem custo de banda).

Como funciona:

- **Armazenamento privado.** O Worker do site declara em `wrangler.jsonc` os
  bindings `SHORTS_MEDIA` (bucket `veronicahub-shorts`, cortes) e
  `SHORTS_SOURCES` (bucket `veronicahub-shorts-sources`, originais). Nenhum
  bucket tem domínio público nem `r2.dev`.
- **Entrega por link assinado.** O painel (sessão de admin) recebe links
  `/api/social/media/...?exp&sig` com HMAC derivado do `SESSION_SECRET` e
  validade de 6 h (máximo aceito: 24 h). Suporta `Range` para o player.
- **Arquivo original.** O YouTube recusa downloads vindos de datacenter (HTTP
  403 sem "PO Token", medido em 09/10/2026 com o vídeo autorizado de teste; o
  motor não contorna essa proteção). Em `/admin/shorts` → item → "Arquivo
  original do vídeo", a operadora envia o MP4 (até 1 GB, em partes de 50 MB por
  link assinado de 2 h). Sem original, o motor ainda tenta o YouTube.
- **Autenticação do processador.** `SOCIAL_RENDER_SECRET` se existir; senão o
  `CRON_SECRET` que a Hub e o GitHub já compartilham com os outros agentes
  (mesma fronteira de confiança). Não há segredo novo para cadastrar.
- **Processador.** `.github/workflows/shorts-render.yml`, manual ou a cada
  15 min. Consulta `/api/social/render/pending` antes de instalar qualquer
  coisa; com fila, roda `python worker.py --drain`: baixa o original por
  `/api/social/render/source`, transcreve, seleciona, renderiza e envia cada
  corte por `/api/social/render/upload` (limitado ao trabalho e ao lease, com
  confirmação do tamanho gravado). Um por vez, teto de 150 min, execução
  vermelha quando um trabalho falha. **Logs públicos**: sem transcrição, URLs
  de mídia ou credenciais; IDs mascarados nas mensagens de erro.

Uso:

1. Em `/admin/shorts`, abrir o item e enviar o MP4 original em "Arquivo
   original do vídeo" (YouTube Studio → Conteúdo → ⋮ → Baixar, para vídeos do
   próprio canal, ou o arquivo cedido pelo autor).
2. Clicar em **Gerar cortes**.
3. Actions → "Veronica Shorts · processador" → Run workflow (ou aguardar até
   15 min). As etapas aparecem no painel; os cortes ficam com prévia, "Abrir
   MP4", "Baixar MP4" e kit das 4 redes.

Alternativa: armazenamento S3/R2 externo (`SHORTS_S3_*` no GitHub e
`SHORTS_MEDIA_BASE_URL` na Hub) continua suportado quando o binding não existe.

## Caminho futuro, pago (Cloudflare Containers)

Pronto no código, não implantado. Exige Workers Paid (US$ 5/mês); custo
estimado (preços de 05/10/2026): franquia de 25 GiB-h de memória, 375 vCPU-min e
200 GB-h de disco; ~US$ 0,12 por vídeo de ~30 min além dela.

- **Worker `shorts-runner`** (`workers/shorts-runner`), separado do Worker do
  site — este é gerado pela Lovable e não ganha binding. Um Cron a cada 5 min
  consulta `POST /api/social/render/pending` (só leitura, exige o segredo). Sem
  fila, não liga nada. Com fila, acorda o Container (`standard-4`: 4 vCPU,
  12 GiB, 20 GB; `max_instances: 1`), que roda `runner.py` e processa até a
  fila esvaziar. Sem novos ticks por 15 min, o Container dorme e a cobrança para.
- **Imagem** `workers/shorts-engine/Dockerfile`, versões fixadas em
  `requirements.txt` e modelo Whisper `small` embutido (sem download a cada
  partida). Em host Docker sempre ligado, o mesmo Dockerfile roda `worker.py`
  (laço contínuo).

Passos no painel do Cloudflare (dono da conta; nenhum segredo passa pelo chat):

1. **Plano.** Workers & Pages → Plans: confirmar Workers Paid (requisito de
   Containers).
2. **Entrega.** R2 → `veronicahub-shorts` → Settings → Custom Domains →
   Connect Domain → `media.veronicahub.com`. Não ativar o `r2.dev` público.
3. **Chave dos buckets.** R2 → Manage API tokens → Create Account API token →
   permissão **Object Read & Write**, aplicada **somente** aos buckets
   `veronicahub-shorts` e `veronicahub-shorts-sources`. Guardar Access Key ID, Secret Access Key e o endpoint
   S3 (`https://<account-id>.r2.cloudflarestorage.com`).
4. **Segredo da API.** Gerar um valor aleatório longo (gerenciador de senhas
   ou `openssl rand -hex 32`), exclusivo desta API. Nunca reutilizar senha.
5. **Worker do site** (`veronicahub-app` → Settings → Variables and Secrets):
   - `SOCIAL_RENDER_SECRET` (Secret) = valor do passo 4;
   - `SHORTS_MEDIA_BASE_URL` (Text) = `https://media.veronicahub.com/shorts`.
6. **Worker `shorts-runner`.** Workers & Pages → Create → Import a repository →
   `Veronica-01Git/veronicahub-app`, branch `main`, nome `shorts-runner`.
   Build: root directory `/workers`, build command
   `cd shorts-runner && bun install --frozen-lockfile`, deploy command
   `cd shorts-runner && npx wrangler deploy`. Watch paths:
   `workers/shorts-runner/*` e `workers/shorts-engine/*`. Após o primeiro
   deploy, em Settings → Variables and Secrets adicionar (Secret):
   `SOCIAL_RENDER_SECRET` (mesmo valor do passo 5), `SHORTS_S3_ENDPOINT`,
   `SHORTS_S3_ACCESS_KEY_ID`, `SHORTS_S3_SECRET_ACCESS_KEY` (passo 3).
   As variáveis não secretas já estão em `wrangler.jsonc`.
7. **Teste** com vídeo autorizado já cadastrado no painel: solicitar o corte em
   `/admin/shorts`; em até 5 min o cron acorda o Container. Acompanhar etapas
   (download → transcribe → select → render → upload → ready) e os logs do
   Worker `shorts-runner` (Observability). Só depois ativar uso recorrente.

Risco conhecido: o YouTube pode recusar downloads vindos de IPs de datacenter
("confirme que não é um robô"). O motor não usa cookies nem contorna isso; a
falha aparece como `DOWNLOAD_FAILED`, sem corte falso. yt-dlp exige atualização
periódica (`requirements.txt` → rebuild → reteste).

## Validação e limites de lançamento

`python -m unittest discover -s workers/shorts-engine -p 'test_*.py'` testa
seleção e legendas; `python workers/shorts-engine/smoke.py` verifica um MP4
sintético real com FFmpeg. Testes Node cobrem plano/timestamps/artefatos.
O teste sintético não prova aquisição YouTube, reconhecimento de fala, execução
Docker, S3, banco remoto nem publicação; estes dependem da infraestrutura.

Antes do lançamento para usuários: projetos por proprietário/tenant,
autorização em cada operação, uploads privados, signed URLs, quota/duração,
saldo/preço, cancelamento efetivo, auditoria, retenção/apagamento de fontes e
artefatos, instalação/licenças dos componentes, moderação e autorização de uso.
Agendamento social é integração separada com OAuth por usuário e idempotência
por rede. A cadência permanece desligada conforme a preferência do operador.
