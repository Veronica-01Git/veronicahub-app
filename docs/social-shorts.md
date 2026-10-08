# Banco de Shorts · implantação

Painel privado: `/admin/shorts`. Usa o admin existente e o Neon do projeto. As tabelas SocialSource, SocialRun e SocialClick são criadas de maneira aditiva no primeiro acesso autenticado ou execução autorizada. Nenhuma tabela de cliente é alterada.

Implementado: banco de links canônicos com deduplicação por vídeo, prioridade e ordem de entrada; transcrição e autorização de uso; preparação editorial com Model Router e limites; gancho, capa SVG vertical e quatro kits com legenda, hashtags, CTA e links de destino rastreados; arquivamento; revisão que invalida a versão anterior; registro de MP4 já editado e data desejada; exportação JSON; histórico e visitas por rede nos últimos 30 dias.

Estados: queued → preparing → awaiting_rights / awaiting_transcript / awaiting_edit / attention. Um MP4 registrado muda awaiting_edit para awaiting_connector. Nenhum estado simula publicação. Tentativa interrompida exige revisão; não há repetição cega após timeout. O claim é atômico e usa lease. Uma rodada prepara um item, sem download de mídia do YouTube. Transcrição externa é dado não confiável e a saída do modelo passa por validação.

Execução privada: `POST /api/cron/social-shorts`, com CRON_SECRET existente no cabeçalho Authorization. Não há workflow nem horário habilitado; o dono ainda vai definir cadência. Execução manual pelo painel exige sessão admin. A preparação pode usar Gemini ou Groq já configurado, com uma tentativa por item, deadline de 16 segundos e teto de 6.000 micros USD. A saída não representa vídeo renderizado. A transcrição informada pelo admin é enviada ao provedor de texto configurado; use conteúdo autorizado e sem dados pessoais desnecessários.

O editor automático e o publicador ainda não estão conectados. O painel expõe isso. Para habilitar a esteira completa, integrar aquisição de arquivo autorizado/transcrição, renderizador de MP4 9:16 com cortes e legendas, armazenamento de mídia permanente, conector oficial da Metricool e confirmação por rede. Link do YouTube sozinho não é um arquivo de vídeo autorizado para renderização. Não instalar um downloader que contorne políticas do YouTube.

Metricool API: documentação oficial https://help.metricool.com/basic-guide-for-api-integration-r97af e https://app.metricool.com/resources/apidocs/index.html. A API requer plano Advanced/Custom e token em X-Mc-Auth, userId e blogId; redes conectadas no painel não fornecem uma credencial de backend. MCP é uma alternativa distinta, dependente de conexão e limites. Tokens ficam nos secrets do runtime, nunca na fila ou cliente. Nenhum plano foi contratado.

Próxima integração deve manter outbox por rede, identificador remoto, chave idempotente por criativo/versão/rede, estado `scheduled` separado de `published`, reconciliação após timeout antes de reenviar e consulta do resultado remoto. Nunca reenviar um sucesso nas outras redes ao repetir uma falha. Cadência e cotas precisam ser configuradas pelo dono antes de ligar cron. Não usar a automação de conversa como substituta do worker de produção.

Medidas atuais: visitas ao redirecionamento (inclui bots, testes e previews), não pessoas únicas ou vendas. UTMs são gravados no destino. Seguidores, retenção, cliques de bio, cadastro e receita precisam de telemetria real das redes e eventos da Hub; não são atribuídos por suposição. Venda via TikTok Shop exige integração separada do catálogo/afiliado e elegibilidade da conta.

Verificação: testes de URL/destino, autorização/transcrição antes do modelo, validação de saída e pacote das quatro redes. Typecheck e build obrigatórios antes do merge. Nenhum vídeo ou post fictício é inserido.


## Motor próprio (Veronica Shorts)

A edição agora tem implementação própria em `workers/shorts-engine`, com fila de
renderização, transcrição automática e exportação FFmpeg. Confira
[shorts-engine.md](./shorts-engine.md) para implantação e limites. Não está
operacional na produção até conectar host de processamento, armazenamento e
segredo dedicado. A publicação social continua pendente e a cadência desligada.
