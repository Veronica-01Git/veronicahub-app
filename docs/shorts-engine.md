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

## Conectar em produção

O código web pode ser publicado sem ativar o processamento. O botão fica
desabilitado enquanto a configuração falta. Presença de configuração não
equivale a um processador online; as etapas do trabalho mostram atividade real.

1. Preparar um bucket S3/R2 dedicado para estes MP4s e domínio HTTPS próprio.
   Os arquivos desta versão administrativa ficam acessíveis por URLs com UUID;
   **não abrir para clientes antes de implantar acesso privado/signed URLs**.
2. Criar um segredo aleatório `SOCIAL_RENDER_SECRET`, igual no Worker web e no
   processador, exclusivo desta API. Nunca reutilizar senha de usuário.
3. Definir `SHORTS_MEDIA_BASE_URL` no Worker web, por exemplo
   `https://media.veronicahub.com/shorts`. Se usar prefixo `/shorts`, configurar
   `SHORTS_S3_PREFIX=shorts` no processador.
4. Subir `workers/shorts-engine/Dockerfile` em um host Linux com pelo menos 4
   vCPUs, 8 GB RAM e disco temporário de 5 GB por processo. Começar com apenas
   um processo e medir uso; nenhum provedor pago é contratado pelo código.
5. No processador, definir `HUB_BASE_URL`, `SOCIAL_RENDER_SECRET`,
   `SHORTS_S3_ENDPOINT`, `SHORTS_S3_ACCESS_KEY_ID`,
   `SHORTS_S3_SECRET_ACCESS_KEY`, `SHORTS_S3_BUCKET` e opcionalmente
   `SHORTS_S3_PREFIX`, `WHISPER_MODEL=small`. Credenciais S3 limitadas ao bucket.
6. O primeiro uso de Whisper baixa o modelo. Fixar versões/imagem testadas no
   host de produção e reservar cache persistente; yt-dlp exige manutenção pois
   o YouTube muda seus mecanismos. Falha de aquisição aparece como erro, sem
   afirmar que o corte foi criado. Não há garantia de acesso a todo link.
7. Testar com vídeo autorizado escolhido pelo operador: entrada, aquisição,
   transcrição real, seleção, MP4 armazenado e prévia. Só depois ativar uso.

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
