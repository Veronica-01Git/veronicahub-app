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

## Conectar em produção (Cloudflare Containers + R2)

Infraestrutura aprovada pelo proprietário em 08/10/2026, teto US$ 15/mês.
O código web pode ser publicado sem ativar o processamento. O botão fica
desabilitado enquanto a configuração falta. Presença de configuração não
equivale a um processador online; as etapas do trabalho mostram atividade real.

Peças:

- **Bucket R2 `veronicahub-shorts`** (criado em 08/10/2026), servido por
  domínio próprio `media.veronicahub.com`. Chaves `shorts/<fonte>/<job>/<n>.mp4`.
  Os arquivos desta versão administrativa ficam acessíveis por URLs com UUID;
  **não abrir para clientes antes de implantar acesso privado/signed URLs**.
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

Custo estimado (preços oficiais de 05/10/2026): Workers Paid US$ 5/mês inclui
25 GiB-h de memória, 375 vCPU-min e 200 GB-h de disco. Um vídeo de ~30 min leva
~20 min no `standard-4`: ~US$ 0,12 por vídeo além da franquia (~5 vídeos/mês
dentro dela). R2: 10 GB grátis, depois US$ 0,015/GB-mês, sem custo de banda.

Passos no painel do Cloudflare (dono da conta; nenhum segredo passa pelo chat):

1. **Plano.** Workers & Pages → Plans: confirmar Workers Paid (requisito de
   Containers).
2. **Entrega.** R2 → `veronicahub-shorts` → Settings → Custom Domains →
   Connect Domain → `media.veronicahub.com`. Não ativar o `r2.dev` público.
3. **Chave do bucket.** R2 → Manage API tokens → Create Account API token →
   permissão **Object Read & Write**, aplicada **somente** ao bucket
   `veronicahub-shorts`. Guardar Access Key ID, Secret Access Key e o endpoint
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
