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

## Conectar em produção — caminho atual, gratuito (GitHub Actions + R2)

Decisão da proprietária em 09/10/2026: sem gasto agora. O processador roda no
workflow `.github/workflows/shorts-render.yml`. Como o repositório é público,
os minutos do GitHub Actions são gratuitos (máquina de 4 vCPU / 16 GB, limite de
150 min por execução). R2 fica na franquia grátis (10 GB, sem custo de banda).
O código web pode ser publicado sem ativar o processamento. O botão fica
desabilitado enquanto a configuração falta. Presença de configuração não
equivale a um processador online; as etapas do trabalho mostram atividade real.

Como funciona: a cada 15 min (ou ao clicar em **Run workflow**) o primeiro passo
consulta `POST /api/social/render/pending` com o segredo, sem instalar nada.
Sem fila, encerra em segundos. Com fila, instala FFmpeg e dependências fixadas,
usa o modelo Whisper em cache e roda `python worker.py --drain`: processa até 10
trabalhos, um por vez (`concurrency`), e termina. Trabalho com falha deixa a
execução vermelha e aparece como `attention` no painel, sem repetição automática.
**Logs do Actions são públicos**: o motor não imprime transcrição, URL de mídia
nem credenciais (os segredos ainda são mascarados pelo GitHub).

Peças:

- **Bucket R2 `veronicahub-shorts`** (criado em 08/10/2026), servido por
  domínio próprio `media.veronicahub.com`. Chaves `shorts/<fonte>/<job>/<n>.mp4`.
  Os arquivos desta versão administrativa ficam acessíveis por URLs com UUID;
  **não abrir para clientes antes de implantar acesso privado/signed URLs**.
- **Bucket R2 privado `veronicahub-shorts-sources`** (criado em 09/10/2026), sem
  domínio público. Recebe o arquivo original do vídeo autorizado, nomeado pelo ID
  do YouTube (`V1Fq4psulqU.mp4` para `watch?v=V1Fq4psulqU`). Se existir, o motor
  usa esse arquivo; senão tenta o YouTube. Mesmos limites: até 1 GiB, 1–60 min.
- **Workflow** `.github/workflows/shorts-render.yml` com `workers/shorts-engine`.

**Por que o arquivo original.** Medido em 09/10/2026 com o vídeo autorizado de
teste: o YouTube recusa o download (HTTP 403) a partir de IPs de datacenter sem
um "PO Token" anti-robô, mesmo com o runtime JavaScript (deno + yt-dlp-ejs)
instalado. Gerar esse atestado automaticamente seria contornar a proteção do
YouTube; o motor não faz isso. O caminho legítimo é a operadora enviar o arquivo
original (YouTube Studio → Conteúdo → ⋮ → Baixar, para vídeos do próprio canal,
ou o arquivo cedido pelo autor).

Passos (dona da conta; nenhum segredo passa pelo chat):

1. **Segredo da API.** Gerar um valor aleatório longo (gerenciador de senhas,
   `openssl rand -hex 32` ou, no PowerShell,
   `[guid]::NewGuid().ToString("N") + [guid]::NewGuid().ToString("N")`).
   Exclusivo desta API; nunca reutilizar senha.
2. **Entrega.** Cloudflare → R2 → `veronicahub-shorts` → Settings → Custom
   Domains → Add → `media.veronicahub.com`. Manter o `r2.dev` desativado.
3. **Chave dos buckets.** R2 → Manage API tokens → Create Account API token →
   **Object Read & Write** só nos buckets `veronicahub-shorts` e
   `veronicahub-shorts-sources`. Guardar Access Key
   ID, Secret Access Key e endpoint S3 (`https://<account-id>.r2.cloudflarestorage.com`).
4. **Worker do site** (`veronicahub-app` → Settings → Variables and Secrets),
   ambos do tipo **Secret** (variáveis "Text" do painel podem ser apagadas a cada
   publicação da Lovable; segredos permanecem):
   `SOCIAL_RENDER_SECRET` = passo 1; `SHORTS_MEDIA_BASE_URL` =
   `https://media.veronicahub.com/shorts`.
5. **GitHub** → repositório → Settings → Secrets and variables → Actions →
   New repository secret: `SOCIAL_RENDER_SECRET` (mesmo valor do passo 4),
   `SHORTS_S3_ENDPOINT`, `SHORTS_S3_ACCESS_KEY_ID`, `SHORTS_S3_SECRET_ACCESS_KEY`.
6. **Arquivo original.** R2 → `veronicahub-shorts-sources` → Upload → arquivo
   MP4 renomeado para `<ID do YouTube>.mp4`. Pelo painel, arquivos até ~300 MB
   (exportar em 720p se maior).
7. **Teste** com vídeo autorizado já cadastrado: solicitar o corte em
   `/admin/shorts`, depois Actions → "Veronica Shorts · processador" → Run
   workflow (ou aguardar até 15 min). Acompanhar as etapas no painel
   (download → transcribe → select → render → upload → ready) e o log da execução.

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
